#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const MANIFEST_PATH = path.join(ROOT, '.da', 'manifest.json');

const ORG = process.env.DA_ORG || 'aemsites';
const REPO = process.env.DA_REPO || 'edge-commerce-docs';
const BRANCH = process.env.DA_BRANCH || 'main';
const TOKEN_PATHS = [
  process.env.DA_TOKEN_PATH,
  path.join(ROOT, '.hlx', '.da-token.json'),
  path.join(process.env.HOME || '', '.aem', 'da-token.json'),
].filter(Boolean);

const args = new Set(process.argv.slice(2));
const SHOULD_PUBLISH = args.has('--publish');
const SKIP_PREVIEW = args.has('--no-preview');
const DRY_RUN = args.has('--dry-run');

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function resolveToken() {
  if (process.env.DA_TOKEN) return process.env.DA_TOKEN;

  for (const tokenPath of TOKEN_PATHS) {
    try {
      const token = await readJson(tokenPath);
      const expiresAt = typeof token.expires_at === 'number' ? token.expires_at : 0;
      if (expiresAt && expiresAt <= Date.now()) {
        throw new Error(`DA token expired at ${new Date(expiresAt).toISOString()}`);
      }
      if (token.access_token) return token.access_token;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  throw new Error('No DA token found. Set DA_TOKEN or run DA auth first.');
}

async function request(url, options) {
  if (DRY_RUN) {
    process.stdout.write(`[dry-run] ${options.method} ${url}\n`);
    return;
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method} ${url} -> ${response.status} ${body}`);
  }
}

async function uploadPage(page, token) {
  const absPath = path.join(ROOT, page.html);
  const html = await readFile(absPath);
  const form = new FormData();
  form.append('data', new Blob([html], { type: 'text/html' }), path.basename(page.sourcePath));

  const sourceUrl = `https://admin.da.live/source/${ORG}/${REPO}/${page.sourcePath}`;
  await request(sourceUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!SKIP_PREVIEW) {
    const previewUrl = `https://admin.hlx.page/preview/${ORG}/${REPO}/${BRANCH}/${page.previewPath}`;
    await request(previewUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  if (SHOULD_PUBLISH) {
    const liveUrl = `https://admin.hlx.page/live/${ORG}/${REPO}/${BRANCH}/${page.previewPath}`;
    await request(liveUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  process.stdout.write(`Pushed ${page.html} -> /${page.sourcePath}\n`);
}

async function main() {
  const manifest = await readJson(MANIFEST_PATH);
  const token = DRY_RUN ? 'dry-run-token' : await resolveToken();
  for (const page of manifest.pages) await uploadPage(page, token);
  process.stdout.write(`Processed ${manifest.pages.length} DA document(s)\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
