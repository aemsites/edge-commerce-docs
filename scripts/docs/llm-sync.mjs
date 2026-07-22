/* eslint-disable no-console */
/*
 * LLM-driven narrative doc sync
 *
 * Reads docs/*.md files, finds those tracking a given source repo in their
 * frontmatter `sources` block, diffs the source repo since the last reviewed
 * commit, sends the diff + current doc + style guide to an LLM, and writes
 * the updated doc back to disk.
 *
 * Environment variables:
 *   SOURCE_REPO      — repo name (e.g. "helix-commerce-api")
 *   SOURCE_REF       — commit SHA to sync to
 *   SOURCE_VERSION   — version string (e.g. "v2.43.0")
 *   SOURCE_REPO_PATH — absolute path to a full clone of the source repo
 *   OPENAI_API_KEY   — OpenAI API key
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Writer model for narrative rewrites/additions; its output tokens dominate
// cost. Defaults to gpt-5.6-luna (same GPT-5.6 family as the former
// gpt-5.6-terra default, ~2.5x cheaper on input and output). Override with
// OPENAI_MODEL when quality evals justify a higher tier (e.g. gpt-5.6-terra).
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
// Preflight relevance classifier. Runs once per tracked doc and only answers
// YES/NO, so it defaults to the inexpensive gpt-5-nano. Override with
// OPENAI_PREFLIGHT_MODEL.
const OPENAI_PREFLIGHT_MODEL = process.env.OPENAI_PREFLIGHT_MODEL || 'gpt-5-nano';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MAX_TOKENS = 16000;

const DOCS_DIR = resolve('docs');
const STYLE_GUIDE_PATH = resolve('CLAUDE.md');

// Paths / patterns excluded from the source-repo diff.
const DIFF_EXCLUDE = [
  'test/',
  'tests/',
  '__tests__/',
  '*.test.js',
  '*.test.mjs',
  '*.spec.js',
  '*.spec.mjs',
  'package-lock.json',
  '.github/workflows/',
];

// Files whose changes alone don't warrant a doc update.
const TRIVIAL_ONLY_PATTERNS = [
  /^package-lock\.json$/,
  /^\.github\//,
  /^\.eslint/,
  /^\.stylelint/,
  /^\.editorconfig$/,
  /^\.gitignore$/,
  /^\.npmrc$/,
  /^renovate\.json/,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compare two commit SHAs, handling short (7-char) vs full (40-char) forms.
 * Returns true if one is a prefix of the other.
 */
function sameCommit(a, b) {
  if (!a || !b) return false;
  return a.startsWith(b) || b.startsWith(a);
}

/**
 * Shorten a full commit SHA to a 7-char abbreviated form.
 */
function shortSha(sha) {
  return sha.slice(0, 7);
}

/**
 * Surgically update frontmatter marker values in the raw file content
 * without reformatting anything else. Only touches lastReviewedCommit
 * and version values under the given repo key.
 */
function bumpMarkers(content, repoKey, newCommit, newVersion) {
  let result = content;
  const repoBlock = `(${repoKey}:[\\s\\S]*?)`;
  // Replace lastReviewedCommit value
  result = result.replace(
    new RegExp(`(${repoBlock}lastReviewedCommit:\\s*")([^"]+)(")`),
    `$1${shortSha(newCommit)}$4`,
  );
  // Replace version if provided, preserving existing v-prefix convention
  if (newVersion) {
    const vm = result.match(
      new RegExp(`${repoKey}:[\\s\\S]*?version:\\s*"([^"]+)"`),
    );
    if (vm) {
      const hadV = vm[1].startsWith('v');
      const newHasV = newVersion.startsWith('v');
      let ver = newVersion;
      if (hadV && !newHasV) ver = `v${newVersion}`;
      if (!hadV && newHasV) ver = newVersion.slice(1);
      result = result.replace(
        new RegExp(`(${repoBlock}version:\\s*")([^"]+)(")`),
        `$1${ver}$4`,
      );
    }
  }
  return result;
}

/**
 * Parse YAML-ish frontmatter from a markdown string.
 * Returns { attrs: {…}, body: string, raw: string }.
 *
 * Handles arbitrary nesting depth by tracking indent level. Each 2-space
 * indent opens a new object level. Enough for the frontmatter we use
 * (up to 3 levels deep: sources → repo-name → version/commit).
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { attrs: {}, body: content, raw: '' };

  const raw = match[1];
  const body = content.slice(match[0].length).replace(/^\r?\n/, '');
  const root = {};

  // Stack of { obj, key } frames tracking the nesting context at each
  // indent level.  stack[0] is always { obj: root }.
  const stack = [{ obj: root }];

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue; // skip blank lines

    const m = line.match(/^( *)(\w[\w-]*):\s*(.*?)\s*$/);
    if (!m) continue;

    const indent = m[1].length / 2; // 0, 1, 2, …
    const key = m[2];
    const valRaw = m[3].replace(/^"(.*)"$/, '$1');

    // Pop stack back to the correct depth.
    while (stack.length > indent + 1) stack.pop();

    const parent = stack[stack.length - 1].obj;

    if (valRaw === '') {
      // Key with no value → opens a nested object.
      const child = {};
      parent[key] = child;
      stack.push({ obj: child, key });
    } else {
      parent[key] = valRaw;
    }
  }

  return { attrs: root, body, raw };
}

/**
 * Serialize frontmatter attrs back into a YAML block + body.
 */
function serializeFrontmatter(attrs, body) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'object' && value !== null) {
      lines.push(`${key}:`);
      for (const [k, v] of Object.entries(value)) {
        if (typeof v === 'object' && v !== null) {
          lines.push(`  ${k}:`);
          for (const [kk, vv] of Object.entries(v)) {
            lines.push(`    ${kk}: "${vv}"`);
          }
        } else {
          lines.push(`  ${k}: "${v}"`);
        }
      }
    } else {
      const needsQuotes = typeof value === 'string' && value.length > 0;
      lines.push(`${key}: ${needsQuotes ? `"${value}"` : value}`);
    }
  }

  lines.push('---');
  return `${lines.join('\n')}\n${body}`;
}

/**
 * Compute a filtered diff between two refs in the source repo.
 */
function getFilteredDiff(repoPath, fromRef, toRef) {
  const excludeArgs = DIFF_EXCLUDE
    .map((p) => `':(exclude)${p}'`)
    .join(' ');

  try {
    const cmd = `git diff ${fromRef}..${toRef} -- . ${excludeArgs}`;
    return execSync(cmd, {
      cwd: repoPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10 MB
    });
  } catch {
    return '';
  }
}

/**
 * Check if a diff contains only trivial file changes (deps, CI, config).
 */
function isTrivialDiff(diff) {
  if (!diff || !diff.trim()) return true;

  // Extract changed file paths from the diff header lines.
  const files = [...diff.matchAll(/^diff --git a\/(.+?) b\//gm)]
    .map((m) => m[1]);

  return files.every((f) => TRIVIAL_ONLY_PATTERNS.some((p) => p.test(f)));
}

/** Sleep for `ms` milliseconds. */
function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

/**
 * Call the OpenAI chat completions API with retry on rate-limit (429).
 * Retries up to 5 times with exponential backoff, respecting the
 * Retry-After header when present.
 *
 * @param {string} model - OpenAI model name
 * @param {string} systemPrompt - system message
 * @param {string} userPrompt - user message
 * @param {string} apiKey - OpenAI API key
 * @param {number} [maxTokens] - max_completion_tokens (omit for default)
 */
async function callLLM(model, systemPrompt, userPrompt, apiKey, maxTokens) {
  const maxRetries = 5;
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };
  if (maxTokens) body.max_completion_tokens = maxTokens;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      // eslint-disable-next-line no-await-in-loop
      const data = await res.json();
      return data.choices[0].message.content;
    }

    if (res.status === 429 && attempt < maxRetries) {
      const retryAfter = res.headers.get('retry-after');
      const waitSec = retryAfter ? Math.ceil(parseFloat(retryAfter)) : 2 ** attempt * 5;
      console.log(`  ⏳ rate-limited, retrying in ${waitSec}s (attempt ${attempt + 1}/${maxRetries})`);
      // eslint-disable-next-line no-await-in-loop
      await sleep(waitSec * 1000);
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  throw new Error('Exhausted retries for OpenAI API');
}

/**
 * Extract just the changed file paths from a diff string.
 */
function extractChangedFiles(diff) {
  return [...diff.matchAll(/^diff --git a\/(.+?) b\//gm)].map((m) => m[1]);
}

/**
 * Cheap preflight check using Luna: given a doc's title/description and the
 * list of changed files, decide whether the diff is likely relevant to the doc.
 * Returns true (relevant) or false (skip).
 */
async function isRelevantToDoc(title, description, changedFiles, apiKey) {
  const systemPrompt = [
    'You are a relevance router for a documentation set. Given a documentation',
    'page title and description, and a list of changed source code file paths,',
    'decide whether THIS page is an appropriate home for the change at its own',
    'level of detail.',
    '',
    'Answer YES only if the change would alter content a reader needs on THIS',
    'specific page. Answer NO when the change belongs on a more detailed page',
    '(e.g. a schema or API reference) and this page only describes the topic at',
    'a higher, conceptual level. A new field, parameter, endpoint detail, or',
    'date format almost never belongs on an overview or high-level guide — it',
    'belongs on the reference page. When in doubt, prefer NO so the change lands',
    'in one authoritative place instead of being sprinkled across many pages.',
    '',
    'Reply with exactly YES or NO. Nothing else.',
  ].join(' ');

  const userPrompt = [
    `Document title: ${title}\n`,
    `Document description: ${description}\n\n`,
    'Changed files:\n',
    changedFiles.map((f) => `- ${f}`).join('\n'),
  ].join('');

  const answer = await callLLM(
    OPENAI_PREFLIGHT_MODEL,
    systemPrompt,
    userPrompt,
    apiKey,
  );
  return answer.trim().toUpperCase().startsWith('YES');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const sourceRepo = process.env.SOURCE_REPO;
  const sourceRef = process.env.SOURCE_REF;
  const sourceVersion = process.env.SOURCE_VERSION || '';
  const sourceRepoPath = process.env.SOURCE_REPO_PATH;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!sourceRepo || !sourceRef || !sourceRepoPath || !apiKey) {
    console.error(
      'Required env vars: SOURCE_REPO, SOURCE_REF, SOURCE_REPO_PATH, OPENAI_API_KEY',
    );
    process.exit(1);
  }

  // Read the style guide once.
  const styleGuide = await readFile(STYLE_GUIDE_PATH, 'utf-8');

  // Scan docs/*.md
  const entries = await readdir(DOCS_DIR);
  const mdFiles = entries.filter((f) => f.endsWith('.md'));

  const updated = [];
  // Track which docs skipped preflight for gap analysis.
  const skippedByPreflight = []; // { file, title, description }
  // Track the earliest original lastReviewedCommit (before bumping)
  // so gap analysis can compute the full diff scope.
  let earliestOriginalCommit = null;
  // Collect doc catalog for gap analysis.
  const docCatalog = [];

  for (const file of mdFiles) {
    const filePath = join(DOCS_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const { attrs, body } = parseFrontmatter(content);

    // Check if this doc tracks the source repo.
    if (
      !attrs.sources
      || typeof attrs.sources !== 'object'
      || !attrs.sources[sourceRepo]
    ) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const source = attrs.sources[sourceRepo];
    const lastReviewed = source.lastReviewedCommit;

    // Track for gap analysis.
    docCatalog.push({ file, title: attrs.title || file, description: attrs.description || '' });
    if (lastReviewed && (!earliestOriginalCommit || lastReviewed < earliestOriginalCommit)) {
      earliestOriginalCommit = lastReviewed;
    }
    if (!lastReviewed) {
      console.log(`⚠ ${file}: no lastReviewedCommit, skipping`);
      // eslint-disable-next-line no-continue
      continue;
    }

    // Compute filtered diff.
    const diff = getFilteredDiff(sourceRepoPath, lastReviewed, sourceRef);

    if (isTrivialDiff(diff)) {
      console.log(`⏭ ${file}: no meaningful changes since ${lastReviewed}`);
      // Bump the reviewed commit so we don't re-check next time,
      // but only write the file if the markers actually changed.
      if (!sameCommit(source.lastReviewedCommit, sourceRef)) {
        const bumped = bumpMarkers(content, sourceRepo, sourceRef, sourceVersion);
        // eslint-disable-next-line no-await-in-loop
        await writeFile(filePath, bumped, 'utf-8');
      }
      // eslint-disable-next-line no-continue
      continue;
    }

    // Preflight: ask Luna whether this diff is relevant to this doc.
    const changedFiles = extractChangedFiles(diff);
    const title = attrs.title || file;
    const description = attrs.description || '';

    // eslint-disable-next-line no-await-in-loop
    const relevant = await isRelevantToDoc(title, description, changedFiles, apiKey);
    if (!relevant) {
      console.log(`⏭ ${file}: diff not relevant (preflight), bumping commit marker`);
      skippedByPreflight.push({ file, title, description });
      if (!sameCommit(source.lastReviewedCommit, sourceRef)) {
        const bumped = bumpMarkers(content, sourceRepo, sourceRef, sourceVersion);
        // eslint-disable-next-line no-await-in-loop
        await writeFile(filePath, bumped, 'utf-8');
      }
      // eslint-disable-next-line no-continue
      continue;
    }



    console.log(`📝 ${file}: updating from ${lastReviewed} → ${sourceRef}`);

    const systemPrompt = [
      'You are a technical documentation writer for a developer platform.',
      'You update existing narrative documentation based on code changes.',
      'You make the smallest change that keeps the page correct. Making no',
      'substantive change is a valid and common outcome; do not invent edits',
      'just because a diff exists. Never sprinkle the same fact across multiple',
      'pages — a given detail belongs in the single most appropriate page.',
      'Return ONLY the complete updated Markdown file, including the YAML',
      'frontmatter block (between --- delimiters). Do not wrap your response',
      'in code fences or add any commentary outside the document itself.',
    ].join(' ');

    const userPrompt = [
      '## Style guide\n',
      styleGuide,
      '\n\n## Current document\n',
      content,
      '\n\n## Code diff (source repo changes since last review)\n',
      '```diff\n',
      diff,
      '\n```\n',
      '\n## Instructions\n',
      `Update the document above ONLY if the code changes in the diff from the ${sourceRepo} repository genuinely affect content at THIS document's level of detail.`,
      'Making no substantive change is a valid and often correct outcome: if the change is already covered, or only matters at a more detailed level than this page operates at, leave the body unchanged and only update the frontmatter markers described below.',
      "Respect this document's role and abstraction level:",
      '- Overview / intro pages: conceptual only. Do NOT add field names, parameter names, endpoint paths, date formats, or other reference-level specifics. A new field or parameter almost never justifies an overview edit.',
      '- Guides (getting started, data ingestion, rendering, etc.): task-oriented. Mention a new field or behavior only when it changes a step the reader must perform. Do not enumerate new fields for completeness.',
      '- Reference pages (schema reference, API reference): the authoritative home for field-, parameter-, and endpoint-level detail. Full detail belongs here.',
      'Each fact should live in the single most appropriate page. Do not restate the same field or behavior across multiple pages just because it is loosely related.',
      'Change as few sentences as possible. Prefer editing an existing sentence over adding a new standalone sentence or paragraph. Do not add standalone sentences or paragraphs to pages whose purpose is broader than the change.',
      'Only modify sections that are directly affected by the diff.',
      'Preserve the existing writing style, structure, and tone.',
      `In the frontmatter, set sources.${sourceRepo}.lastReviewedCommit to "${shortSha(sourceRef)}"`,
      sourceVersion ? ` and sources.${sourceRepo}.version to "${sourceVersion}".` : '.',
      `Also set sources.${sourceRepo}.lastContentCommit to "${shortSha(sourceRef)}".`,
      'Preserve the exact YAML frontmatter formatting — do not add or remove quotes around values that already have or lack them.',
      'Return the complete updated Markdown file including frontmatter.',
    ].join('');

    const result = await callLLM(OPENAI_MODEL, systemPrompt, userPrompt, apiKey, MAX_TOKENS);

    // Strip wrapping code fences the LLM might add despite instructions.
    const cleaned = result
      .replace(/^```(?:markdown|md)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '');

    await writeFile(filePath, cleaned, 'utf-8');
    updated.push(file);
  }

  // -------------------------------------------------------------------
  // Gap analysis: detect new features not covered by any existing doc
  // -------------------------------------------------------------------

  // Compute the full diff from the earliest original commit across all
  // tracked docs. This captures everything that changed since the oldest
  // baseline, so gap analysis can find features no doc covers.
  const fullDiffBase = earliestOriginalCommit || sourceRef;
  const fullDiff = getFilteredDiff(sourceRepoPath, fullDiffBase, sourceRef);
  const hasNonTrivialDiff = fullDiff && fullDiff.trim() && !isTrivialDiff(fullDiff);

  if (hasNonTrivialDiff) {
    console.log('\n🔍 Running gap analysis for uncovered changes...');

    {
      const fullChangedFiles = extractChangedFiles(fullDiff);
      const docList = docCatalog
        .map((d) => `- ${d.title}: ${d.description}`)
        .join('\n');

      const gapSystemPrompt = [
        'You are a documentation gap analyst for a developer platform.',
        'Given a code diff and a list of existing documentation pages,',
        'identify new user-facing features, APIs, endpoints, parameters,',
        'or capabilities introduced in the diff that are NOT adequately',
        'covered by any existing documentation page.',
        '',
        'Reply with a JSON object (no code fences) with this structure:',
        '{',
        '  "gaps": [',
        '    {',
        '      "type": "existing" or "new",',
        '      "target": "filename.md" (for existing) or "suggested-slug" (for new),',
        '      "title": "Page title" (for new docs only),',
        '      "description": "One-line description" (for new docs only),',
        '      "summary": "What needs to be documented"',
        '    }',
        '  ]',
        '}',
        '',
        'If there are no gaps (all changes are internal, refactors, or already',
        'covered), return {"gaps": []}.',
        'Only flag genuinely user-facing changes that a developer would need',
        'to know about. Do not flag internal refactors, test changes, or',
        'implementation details.',
      ].join('\n');

      const gapUserPrompt = [
        '## Existing documentation pages\n\n',
        docList,
        '\n\n## Changed files in this release\n\n',
        fullChangedFiles.map((f) => `- ${f}`).join('\n'),
        '\n\n## Code diff\n\n```diff\n',
        fullDiff.length > 50000 ? fullDiff.slice(0, 50000) + '\n... (truncated)' : fullDiff,
        '\n```\n',
      ].join('');

      // eslint-disable-next-line no-await-in-loop
      const gapResult = await callLLM(
        OPENAI_MODEL, gapSystemPrompt, gapUserPrompt, apiKey, 4000,
      );

      let gaps = [];
      try {
        const cleaned = gapResult
          .replace(/^```(?:json)?\s*\n?/, '')
          .replace(/\n?```\s*$/, '');
        const parsed = JSON.parse(cleaned);
        gaps = parsed.gaps || [];
      } catch {
        console.log('  ⚠ Could not parse gap analysis response, skipping.');
      }

      if (gaps.length === 0) {
        console.log('  ✅ No documentation gaps found.');
      }

      for (const gap of gaps) {
        if (gap.type === 'existing') {
          // Add content to an existing doc.
          const targetFile = gap.target;
          const targetPath = join(DOCS_DIR, targetFile);
          let targetContent;
          try {
            // eslint-disable-next-line no-await-in-loop
            targetContent = await readFile(targetPath, 'utf-8');
          } catch {
            console.log(`  ⚠ Gap target ${targetFile} not found, skipping.`);
            // eslint-disable-next-line no-continue
            continue;
          }

          console.log(`📝 ${targetFile}: adding gap content — ${gap.summary}`);

          const addSystemPrompt = [
            'You are a technical documentation writer for a developer platform.',
            'You add new sections to existing documentation based on code changes.',
            'You add content only to the single most appropriate page and only at',
            'that page\'s level of detail; you never sprinkle the same fact across',
            'multiple pages or push reference-level detail into conceptual pages.',
            'Return ONLY the complete updated Markdown file, including the YAML',
            'frontmatter block (between --- delimiters). Do not wrap your response',
            'in code fences or add any commentary outside the document itself.',
          ].join(' ');

          const addUserPrompt = [
            '## Style guide\n',
            styleGuide,
            '\n\n## Current document\n',
            targetContent,
            '\n\n## Code diff\n```diff\n',
            fullDiff.length > 50000 ? fullDiff.slice(0, 50000) : fullDiff,
            '\n```\n',
            '\n## Instructions\n',
            `Add documentation for the following new feature to this document: ${gap.summary}`,
            '\nOnly add content if this page is the appropriate home for it at this page\'s level of detail. If the feature belongs on a more detailed reference page, or is already covered, leave the body unchanged and only update the frontmatter marker below.',
            '\nRespect this document\'s role: keep conceptual/overview and guide pages free of field-, parameter-, and endpoint-level specifics; that detail belongs on reference pages.',
            '\nPlace the new content in the most logical location within the existing document structure, and add as little as needed to cover the feature at this page\'s level.',
            '\nPreserve the existing writing style, structure, and tone.',
            '\nPreserve the exact YAML frontmatter formatting — do not add or remove quotes around values that already have or lack them.',
            `\nUpdate sources.${sourceRepo}.lastContentCommit to "${shortSha(sourceRef)}" in the frontmatter.`,
            '\nReturn the complete updated Markdown file including frontmatter.',
          ].join('');

          // eslint-disable-next-line no-await-in-loop
          const addResult = await callLLM(
            OPENAI_MODEL, addSystemPrompt, addUserPrompt, apiKey, MAX_TOKENS,
          );
          const addCleaned = addResult
            .replace(/^```(?:markdown|md)?\s*\n?/, '')
            .replace(/\n?```\s*$/, '');

          // eslint-disable-next-line no-await-in-loop
          await writeFile(targetPath, addCleaned, 'utf-8');
          if (!updated.includes(targetFile)) updated.push(targetFile);
        } else if (gap.type === 'new') {
          // Create a brand new doc.
          const slug = gap.target.replace(/\.md$/, '');
          const newFile = `${slug}.md`;
          const newPath = join(DOCS_DIR, newFile);

          console.log(`🆕 ${newFile}: drafting new doc — ${gap.summary}`);

          const newSystemPrompt = [
            'You are a technical documentation writer for a developer platform.',
            'You create new documentation pages based on code changes.',
            'Return ONLY the complete Markdown file, including YAML frontmatter.',
            'Do not wrap your response in code fences or add any commentary.',
          ].join(' ');

          const newUserPrompt = [
            '## Style guide\n',
            styleGuide,
            '\n\n## Code diff\n```diff\n',
            fullDiff.length > 50000 ? fullDiff.slice(0, 50000) : fullDiff,
            '\n```\n',
            '\n## Instructions\n',
            `Create a new documentation page about: ${gap.summary}`,
            `\n\nUse this frontmatter template (adjust title and description):`,
            `\n---`,
            `\ntitle: "${gap.title || slug}"`,
            `\ndescription: "${gap.description || gap.summary}"`,
            `\ndaPath: "/${slug}"`,
            `\nstatus: draft`,
            `\nmanaged: true`,
            `\nsourceFormat: markdown`,
            `\nsources:`,
            `\n  ${sourceRepo}:`,
            `\n    version: "${sourceVersion || 'unknown'}"`,
            `\n    lastReviewedCommit: "${shortSha(sourceRef)}"`,
            `\n    lastContentCommit: "${shortSha(sourceRef)}"`,
            `\n---`,
            '\n\nWrite a complete, well-structured documentation page.',
            '\nFollow the style guide strictly.',
            '\nFocus only on user-facing behavior and configuration — no internal implementation details.',
          ].join('');

          // eslint-disable-next-line no-await-in-loop
          const newResult = await callLLM(
            OPENAI_MODEL, newSystemPrompt, newUserPrompt, apiKey, MAX_TOKENS,
          );
          const newCleaned = newResult
            .replace(/^```(?:markdown|md)?\s*\n?/, '')
            .replace(/\n?```\s*$/, '');

          // eslint-disable-next-line no-await-in-loop
          await writeFile(newPath, newCleaned, 'utf-8');
          updated.push(newFile);
        }
      }
    }
  }

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------

  if (updated.length === 0) {
    console.log('\n✅ No docs required content updates.');
  } else {
    console.log(`\n✅ Updated ${updated.length} doc(s): ${updated.join(', ')}`);
  }
}

main();
