/*
 * Private-route handling for the LLM doc sync.
 *
 * Source repos mark routes that must never appear in public documentation with
 * `visibility: 'private'` in their route descriptors (for example
 * `src/routes/indices/openapi.js` in helix-commerce-api). The sync only sees a
 * raw git diff, so these helpers (1) discover the private routes at the synced
 * commit, (2) turn them into an explicit prompt rule, and (3) detect when an
 * LLM rewrite nevertheless introduced one, so the rewrite can be discarded.
 *
 * `visibility: 'internal'` is intentionally NOT treated as private: it only
 * means "not in the OpenAPI reference", and some internal routes (cache purge,
 * payments, the order journal) are documented in narrative pages.
 */

import { execFileSync } from 'node:child_process';

/** Descriptor files scanned for the marker, as a git pathspec. */
const DESCRIPTOR_PATHSPEC = ':(glob)src/**/openapi.js';

// A marker is a `visibility: 'private'` line of its own, so mentions of it inside
// comments (` * ... visibility: 'private' ...`) are ignored.
const MARKER_RE = /^[ \t]*visibility:[ \t]*['"]private['"]/gm;
// POSIX form of MARKER_RE for `git grep -E`, which does not portably support `\s`.
const GIT_MARKER_PATTERN = '^[[:space:]]*visibility:[[:space:]]*[\'"]private[\'"]';
// The descriptor head: `path:`, then only `tag:` or comment lines, then the marker.
// Anchoring on the head keeps `path:` values inside example payloads from being
// mistaken for the route.
const DESCRIPTOR_RE = /^[ \t]*path:[ \t]*['"`](\/[^'"`\n]*)['"`],?[ \t]*\n(?:[ \t]*(?:tag:[^\n]*|\/\/[^\n]*)\n)*[ \t]*visibility:[ \t]*['"]private['"]/gm;

/**
 * Extract the routes marked `visibility: 'private'` from one descriptor file.
 * Descriptors must keep `path`, then `tag`, then `visibility` together, as in
 * the source repo's AGENTS.md. A marker that cannot be paired with a path throws,
 * because silently skipping it would let a private route be documented.
 *
 * @param {string} source - descriptor file contents
 * @param {string} [file] - file name, used in the error message
 * @returns {string[]} route paths, de-duplicated, in file order
 */
export function parsePrivateRoutes(source, file = 'descriptor file') {
  const found = [];
  for (const m of source.matchAll(DESCRIPTOR_RE)) {
    if (!found.includes(m[1])) found.push(m[1]);
  }
  const markers = [...source.matchAll(MARKER_RE)].length;
  const paired = [...source.matchAll(DESCRIPTOR_RE)].length;
  if (markers !== paired) {
    throw new Error(`${file}: ${markers - paired} \`visibility: 'private'\` marker(s) are not directly preceded by a \`path:\` line (path, then tag, then visibility); cannot tell which route is private`);
  }
  return found;
}

/**
 * List the private routes declared in a source repo at a given commit.
 *
 * @param {string} repoPath - full clone of the source repo
 * @param {string} ref - commit SHA to inspect
 * @returns {{ path: string, file: string }[]}
 */
export function findPrivateRoutes(repoPath, ref) {
  const run = (args) => execFileSync('git', args, {
    cwd: repoPath,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  let matches;
  try {
    matches = run(['grep', '-l', '-E', GIT_MARKER_PATTERN, ref, '--', DESCRIPTOR_PATHSPEC]);
  } catch (e) {
    // git grep exits 1 when nothing matches, which is the normal "no private routes" case.
    if (e.status === 1) return [];
    throw e;
  }

  const routes = [];
  for (const line of matches.split('\n').filter(Boolean)) {
    const file = line.slice(ref.length + 1); // output is `<ref>:<path>`
    for (const path of parsePrivateRoutes(run(['show', `${ref}:${file}`]), file)) {
      if (!routes.some((r) => r.path === path)) routes.push({ path, file });
    }
  }
  return routes;
}

/**
 * Build a regex matching a route path as it would appear in documentation:
 * `{param}` segments match any placeholder or literal value, and the match must
 * end at a path boundary so `/a/b` does not match `/a/b-c` or `/a/b/c`.
 *
 * @param {string} routePath - e.g. `/{org}/sites/{site}/index/reindex`
 * @returns {RegExp}
 */
export function routePattern(routePath) {
  const source = routePath
    .split(/(\{[^}]+\})/)
    .map((part) => (/^\{[^}]+\}$/.test(part)
      ? '[^/\\s"\'`?#)]+'
      : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('');
  return new RegExp(`${source}(?![\\w/-])`);
}

/**
 * Private routes that appear in `after` but not in `before`.
 *
 * @param {string} before - text before the LLM edit (use '' for new text)
 * @param {string} after - text produced by the LLM
 * @param {{ path: string }[]} routes - private routes
 * @returns {string[]} leaked route paths
 */
export function findLeakedRoutes(before, after, routes) {
  return routes
    .map((r) => r.path)
    .filter((p) => {
      const re = routePattern(p);
      return re.test(after) && !re.test(before);
    });
}

/**
 * Prompt rule telling the LLM never to document private/internal-only APIs.
 *
 * @param {{ path: string, file: string }[]} routes - private routes at this commit
 * @returns {string}
 */
export function privateRoutesRule(routes) {
  const lines = [
    '## Private APIs: never document',
    '',
    'This documentation is public. Do NOT document, mention, or link to any endpoint, field, or behavior that is private to the source repo, even when the diff adds or changes it. That includes:',
    "- routes whose descriptor is marked `visibility: 'private'`;",
    '- anything the source code or its comments describe as private, internal-only, superuser-only, operator-only, or excluded from the public docs, including the handler, helper, and test code behind such a route.',
    'If a change only affects private code, make no content change.',
  ];
  if (routes.length) {
    lines.push(
      '',
      'Private routes at this commit (never document these):',
      ...routes.map((r) => `- ${r.path} (${r.file})`),
    );
  }
  return lines.join('\n');
}
