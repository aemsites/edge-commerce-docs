# Documentation generation and DA publishing

The public documentation source lives as Markdown in `/docs`. The DA publishing pipeline converts those Markdown files into DA-compatible HTML body fragments and can upload them to Adobe Document Authoring (DA).

## Generate schema reference sections

`docs/schema-reference.md` contains generated schema regions that are updated from the local `helix-commerce-api` checkout.

```bash
npm run docs:schema:generate
```

The generator reads:

```text
../helix-commerce-api/src/schemas/ProductBus.js
../helix-commerce-api/src/schemas/Shipping.js
```

Set `HELIX_COMMERCE_API_PATH` to override the source repo location:

```bash
HELIX_COMMERCE_API_PATH=/path/to/helix-commerce-api npm run docs:schema:generate
```

Check for drift without writing:

```bash
npm run docs:schema:check
```

Only content between `<!-- GENERATED: ... -->` markers is rewritten. Surrounding narrative remains human-authored.

## Build DA HTML

```bash
npm run docs:da:build
```

This writes reviewable generated HTML into:

```text
.da/docs/*.html
.da/fragments/nav/header.html
.da/manifest.json
```

The generated HTML follows the DA/Edge Delivery Services content contract:

- body fragment only: `<body>`, `<header>`, `<main>`, `<footer>`
- one section wrapper: `<main><div>...</div></main>`
- no `<!DOCTYPE>`, `<html>`, `<head>`, `<script>`, or inline styles
- metadata emitted as a canonical `<div class="metadata">` block
- supported Markdown block tables, such as `Pagination (Contained)`, converted to canonical div-form EDS blocks
- fenced Markdown code blocks converted to the canonical `code` block used by the docs template

## Publish to the source bus (Helix 6)

Content, preview, and publish all go through the unified Helix 6 admin API at `api.aem.live`, authenticated with a **Helix admin API key** (sent as `x-auth-token`).

### Get a Helix admin API key

Create a key with the `publish` role for this site:

```bash
curl -X POST "https://admin.hlx.page/config/aemsites/sites/edge-commerce-docs/apiKeys.json" \
  -H "x-auth-token: {an admin token}" \
  -H "content-type: application/json" \
  -d '{ "description": "docs publish", "roles": ["publish"] }'
```

Copy the returned `value` (a JWT). Helix 6 only honors keys listed in `access.admin.apiKeyId`, so also add the key's `jti` there (the managed `apiKeys.json` auto-enable is not read by Helix 6 yet — fetch the current config, merge, then write it back):

```bash
curl -X POST "https://admin.hlx.page/config/aemsites/sites/edge-commerce-docs.json" \
  -H "x-auth-token: {an admin token}" \
  -H "content-type: application/json" \
  -d '{ "access": { "admin": { "apiKeyId": ["{jti}"] } } }'
```

### Store the key

Put it in a gitignored `.env` at the repo root; the push script loads it automatically:

```bash
echo 'HLX_ADMIN_API_KEY=your-key' > .env
```

In CI, provide it as the `HLX_ADMIN_API_KEY` secret.

### Run the push

```bash
npm run docs:da:push              # build + upload source + preview
npm run docs:da:push -- --publish # also publish (go live)
```

### Continuous publishing (CI)

Merges to `main` that touch `docs/**` or `scripts/docs/**` trigger
`.github/workflows/publish-docs.yaml`, which runs `docs:da:push --publish`
(build + source PUT + preview + live). It authenticates with the
`HLX_ADMIN_API_KEY` repo secret (a publish-role Helix admin API key whose
`jti` is allow-listed in `access.admin.apiKeyId`). API reference HTML and
`nav.html` are code-bus assets and ship via the normal EDS code sync, so they
are not part of this workflow.

Other flags:

```bash
npm run docs:da:push -- --dry-run
npm run docs:da:push -- --no-preview
```

`docs:da:push` runs `docs:da:build`, then PUTs each generated file (raw body) to `api.aem.live/{org}/sites/{site}/source/...` and triggers preview (and publish with `--publish`).

Overrides: `DA_ORG`, `DA_SITE` (defaults `aemsites` / `edge-commerce-docs`), `HELIX_API_HOST` (default `https://api.aem.live`).

## Path mapping

Each Markdown file uses its frontmatter `daPath` when present. For example:

```yaml
daPath: "/docs/overview"
```

becomes:

```text
DA source path: docs/overview.html
preview path: docs/overview
```

The docs index page maps to:

```text
DA source path: docs/index.html
preview path: docs/
```
