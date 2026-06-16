#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const DOCS_DIR = path.join(ROOT, 'docs');
const OUT_DIR = path.join(ROOT, '.da', 'docs');
const MANIFEST_PATH = path.join(ROOT, '.da', 'manifest.json');

const renderer = new marked.Renderer();

renderer.table = function renderTable(table) {
  const renderCell = (cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`;
  const renderRow = (cells) => `<tr>${cells.map(renderCell).join('')}</tr>`;
  const innerTable = `<table>\n${renderRow(table.header)}\n${table.rows.map(renderRow).join('\n')}\n</table>`;

  return '<table>\n'
    + '<tr><td>Table</td></tr>\n'
    + `<tr><td>\n${innerTable}\n</td></tr>\n`
    + '</table>\n';
};

marked.setOptions({
  gfm: true,
  mangle: false,
  headerIds: false,
  renderer,
});

function parseValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith('\'') && trimmed.endsWith('\''))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed;
}

function parseFrontmatter(input) {
  if (!input.startsWith('---\n')) return [{}, input];
  const end = input.indexOf('\n---\n', 4);
  if (end === -1) return [{}, input];
  const raw = input.slice(4, end);
  const body = input.slice(end + 5);
  const data = {};
  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (match) data[match[1]] = parseValue(match[2]);
  }
  return [data, body];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function daPathToSourcePath(daPath) {
  const normalized = daPath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!normalized || normalized === 'docs') return 'docs/index.html';
  return `${normalized}.html`;
}

function daPathToPreviewPath(daPath) {
  const normalized = daPath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!normalized || normalized === 'docs') return 'docs/';
  return normalized;
}

function blockClassName(label) {
  const match = label.match(/^([^()]+?)(?:\(([^)]+)\))?$/);
  const parts = [match?.[1], ...(match?.[2]?.split(',') || [])]
    .filter(Boolean)
    .map((part) => part.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''))
    .filter(Boolean);
  return parts.join(' ');
}

function splitTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|')
    .map((cell) => cell.trim());
}

function isSeparatorRow(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function isBlockTableHeader(cells) {
  return cells.length > 1 && /^Pagination\s*(\([^)]+\))?$/i.test(cells[0]) && cells.slice(1).every((cell) => !cell);
}

function tableToBlockHtml(rows) {
  const className = blockClassName(rows[0][0]);
  const bodyRows = rows.slice(1).map((row) => `  <div>\n${row.map((cell) => `    <div>${marked.parseInline(cell)}</div>`).join('\n')}\n  </div>`);
  return `<div class="${escapeHtml(className)}">\n${bodyRows.join('\n')}\n</div>`;
}

function transformBlockTables(markdown) {
  const lines = markdown.split('\n');
  const out = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().startsWith('|') && lines[i + 1] && isSeparatorRow(lines[i + 1])) {
      const rows = [splitTableRow(lines[i])];
      let j = i + 2;
      while (lines[j]?.trim().startsWith('|')) {
        rows.push(splitTableRow(lines[j]));
        j += 1;
      }
      if (isBlockTableHeader(rows[0])) {
        out.push(tableToBlockHtml(rows), '');
        i = j - 1;
      } else {
        out.push(...lines.slice(i, j));
        i = j - 1;
      }
    } else {
      out.push(lines[i]);
    }
  }

  return out.join('\n');
}

function metadataBlock(frontmatter) {
  const rows = [
    ['Title', frontmatter.title],
    ['Description', frontmatter.description],
    ['Template', frontmatter.template || 'docs'],
    ['Labs', frontmatter.labs || 'Commerce'],
  ].filter(([, value]) => value);

  const renderedRows = rows.map(([key, value]) => '    <div>\n'
    + `      <div>${escapeHtml(key)}</div>\n`
    + `      <div>${escapeHtml(value)}</div>\n`
    + '    </div>').join('\n');

  return `<div class="metadata">\n${renderedRows}\n  </div>`;
}

function renderDocument(markdown, frontmatter) {
  const content = marked.parse(transformBlockTables(markdown));
  return '<body>\n'
    + '  <header></header>\n'
    + '  <main>\n'
    + `    <div>\n${
      content.trim().split('\n').map((line) => `      ${line}`).join('\n')
    }\n      ${metadataBlock(frontmatter).split('\n').join('\n      ')}\n`
    + '    </div>\n'
    + '  </main>\n'
    + '  <footer></footer>\n'
    + '</body>\n';
}

async function markdownFiles() {
  const entries = await readdir(DOCS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(DOCS_DIR, entry.name))
    .sort();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = [];

  for (const file of await markdownFiles()) {
    const source = await readFile(file, 'utf8');
    const [frontmatter, markdown] = parseFrontmatter(source);
    const stem = path.basename(file, '.md');
    const daPath = frontmatter.daPath || `/docs/${stem === 'index' ? '' : stem}`;
    const sourcePath = daPathToSourcePath(daPath);
    const previewPath = daPathToPreviewPath(daPath);
    const outPath = path.join(ROOT, '.da', sourcePath);

    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, renderDocument(markdown, frontmatter));
    manifest.push({
      markdown: path.relative(ROOT, file),
      html: path.relative(ROOT, outPath),
      daPath,
      sourcePath,
      previewPath,
    });
  }

  await writeFile(MANIFEST_PATH, `${JSON.stringify({ pages: manifest }, null, 2)}\n`);
  process.stdout.write(`Generated ${manifest.length} DA HTML document(s) in .da/docs\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
