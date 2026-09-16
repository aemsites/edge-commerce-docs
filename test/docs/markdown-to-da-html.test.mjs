import assert from 'node:assert';
import { test } from 'node:test';
import {
  transformBlockTables, blockClassName, isBlockTableHeader, decorateIconTokens, metadataBlock, parseFrontmatter,
} from '../../scripts/docs/markdown-to-da-html.mjs';

test('isBlockTableHeader: named single-cell header is a block', () => {
  assert.equal(isBlockTableHeader(['Hero']), true);
  assert.equal(isBlockTableHeader(['Cards (core)', '']), true);
});

test('isBlockTableHeader: multi-column data headers are not blocks', () => {
  assert.equal(isBlockTableHeader(['Field', 'Type', 'Required', 'Description']), false);
  assert.equal(isBlockTableHeader(['Value', 'Description']), false);
  assert.equal(isBlockTableHeader(['']), false);
});

test('blockClassName: name + variant becomes space-separated classes', () => {
  assert.equal(blockClassName('Hero'), 'hero');
  assert.equal(blockClassName('Cards (core)'), 'cards core');
  assert.equal(blockClassName('Link List'), 'link-list');
});

test('transformBlockTables: converts a named block table to block divs', () => {
  const md = [
    '| Cards (core) | |',
    '| --- | --- |',
    '| :explore: | ### Overview |',
    '',
  ].join('\n');
  const out = transformBlockTables(md);
  assert.match(out, /<div class="cards core">/);
  assert.match(out, /<span class="icon icon-explore"><\/span>/);
  assert.match(out, /<h[1-6][^>]*>Overview<\/h[1-6]>|Overview/);
});

test('transformBlockTables: leaves genuine data tables for the table block', () => {
  const md = [
    '| Field | Type |',
    '| --- | --- |',
    '| sku | string |',
    '',
  ].join('\n');
  const out = transformBlockTables(md);
  // Untouched — still a pipe table, not converted to a block div.
  assert.match(out, /\| Field \| Type \|/);
  assert.doesNotMatch(out, /<div class="field/);
});

test('decorateIconTokens: only matches letter-led tokens', () => {
  assert.equal(decorateIconTokens(':rocket_launch:'), '<span class="icon icon-rocket_launch"></span>');
  assert.equal(decorateIconTokens('at 12:30:45 today'), 'at 12:30:45 today');
  assert.equal(decorateIconTokens('see https://x.test'), 'see https://x.test');
});

test('parseFrontmatter: reads a top-level tags line as a plain string', () => {
  const source = [
    '---',
    'title: "Example"',
    'description: "An example page."',
    'tags: "catalog, orders"',
    '---',
    '',
    '# Example',
    '',
  ].join('\n');
  const [frontmatter] = parseFrontmatter(source);
  assert.equal(frontmatter.tags, 'catalog, orders');
});

test('metadataBlock: emits a Tags row when frontmatter.tags is present', () => {
  const html = metadataBlock({ title: 'Example', description: 'An example page.', tags: 'catalog, orders' });
  assert.match(html, /<div class="metadata">/);
  assert.match(html, /<div>Tags<\/div>\s*<div>catalog, orders<\/div>/);
});

test('metadataBlock: omits the Tags row when frontmatter.tags is absent', () => {
  const html = metadataBlock({ title: 'Example', description: 'An example page.' });
  assert.doesNotMatch(html, /<div>Tags<\/div>/);
});

test('metadataBlock: escapes HTML in tag values', () => {
  const html = metadataBlock({ title: 'Example', description: 'An example page.', tags: 'a & b, <script>' });
  assert.match(html, /a &amp; b, &lt;script&gt;/);
});
