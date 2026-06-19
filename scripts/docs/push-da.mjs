#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const MANIFEST_PATH = path.join(ROOT, '.da', 'manifest.json');

// Load a local .env (and .env.local) if present so local pushes can pick up
// HLX_ADMIN_API_KEY without exporting it in the shell. Both files are
// gitignored; existing shell env vars take precedence.
for (const envFile of ['.env', '.env.local']) {
  try {
    process.loadEnvFile(path.join(ROOT, envFile));
  } catch {
    /* no env file — fine */
  }
}

const ORG = process.env.DA_ORG || 'aemsites';
const SITE = process.env.DA_SITE || process.env.DA_REPO || 'edge-commerce-docs';
// Helix 6 unified admin API. Content (source bus), preview, and publish all go
// through this host, authenticated with a Helix admin API key.
const API_HOST = process.env.HELIX_API_HOST || 'https://api.aem.live';

const args = new Set(process.argv.slice(2));
const SHOULD_PUBLISH = args.has('--publish');
const SKIP_PREVIEW = args.has('--no-preview');
const DRY_RUN = args.has('--dry-run');

function resolveToken() {
  const key = process.env.HLX_ADMIN_API_KEY;
  if (!key) {
    throw new Error('Set HLX_ADMIN_API_KEY (a Helix admin API key with the publish role). '
      + 'Add it to a local .env or your CI secrets.');
  }
  return key;
}

function mimeForPath(p) {
  if (p.endsWith('.json')) return 'application/json';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  return 'text/html';
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
  const headers = { 'x-auth-token': token };
  const html = await readFile(path.join(ROOT, page.html));

  // Source bus: raw-body PUT to /{org}/sites/{site}/source/{path}.
  await request(`${API_HOST}/${ORG}/sites/${SITE}/source/${page.sourcePath}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': mimeForPath(page.sourcePath) },
    body: html,
  });

  if (!SKIP_PREVIEW) {
    await request(`${API_HOST}/${ORG}/sites/${SITE}/preview/${page.previewPath}`, {
      method: 'POST',
      headers,
    });
  }

  if (SHOULD_PUBLISH) {
    await request(`${API_HOST}/${ORG}/sites/${SITE}/live/${page.previewPath}`, {
      method: 'POST',
      headers,
    });
  }

  process.stdout.write(`Pushed ${page.html} -> /${page.sourcePath}\n`);
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const token = DRY_RUN ? 'dry-run-token' : resolveToken();
  for (const page of manifest.pages) await uploadPage(page, token);
  process.stdout.write(`Processed ${manifest.pages.length} document(s) via ${API_HOST}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
