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

const OPENAI_MODEL = 'gpt-5.6-terra';
const OPENAI_PREFLIGHT_MODEL = 'gpt-5.6-luna';
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
    'You are a relevance classifier. Given a documentation page title and',
    'description, and a list of changed source code file paths, decide whether',
    'the code changes are likely to affect the content of that documentation page.',
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
      if (source.lastReviewedCommit !== sourceRef
        || (sourceVersion && source.version !== sourceVersion)) {
        source.lastReviewedCommit = sourceRef;
        if (sourceVersion) source.version = sourceVersion;
        const bumped = serializeFrontmatter(attrs, body);
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
      if (source.lastReviewedCommit !== sourceRef
        || (sourceVersion && source.version !== sourceVersion)) {
        source.lastReviewedCommit = sourceRef;
        if (sourceVersion) source.version = sourceVersion;
        const bumped = serializeFrontmatter(attrs, body);
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
      `Update the document above to reflect the code changes shown in the diff from the ${sourceRepo} repository.`,
      'Only modify sections that are affected by the diff.',
      'Preserve the existing writing style, structure, and tone.',
      `In the frontmatter, set sources.${sourceRepo}.lastReviewedCommit to "${sourceRef}"`,
      sourceVersion ? ` and sources.${sourceRepo}.version to "${sourceVersion}".` : '.',
      `Also set sources.${sourceRepo}.lastContentCommit to "${sourceRef}".`,
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

  if (updated.length === 0) {
    console.log('\n✅ No docs required content updates.');
  } else {
    console.log(`\n✅ Updated ${updated.length} doc(s): ${updated.join(', ')}`);
  }
}

main();
