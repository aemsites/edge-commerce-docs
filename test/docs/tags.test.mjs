import assert from 'node:assert';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../scripts/docs/markdown-to-da-html.mjs';

// Lightweight guard: every doc must carry at least one tag. Tag *choice*
// (concrete over categorical, not restating the title, reuse over coining
// near-duplicates) is guidance in CLAUDE.md's "Tagging for search indexing"
// section, not automated here.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS_DIR = path.join(ROOT, 'docs');

function splitTags(value) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

test('every doc has at least one tag', async () => {
  const entries = await readdir(DOCS_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();

  const empty = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const content = await readFile(path.join(DOCS_DIR, file), 'utf-8');
    const [frontmatter] = parseFrontmatter(content);
    const tags = frontmatter.tags ? splitTags(frontmatter.tags) : [];
    if (tags.length === 0) empty.push(file);
  }

  assert.deepEqual(empty, [], `Docs missing a tags: frontmatter line:\n${empty.join('\n')}`);
});
