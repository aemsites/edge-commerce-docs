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

## Push to DA

### Get a DA token

Pushing calls the DA admin API, which needs a valid Adobe IMS token. Tokens last ~1 hour, so you'll need to refresh when it expires (`DA token expired …`).

The simplest way to authenticate is to run the AEM CLI's `content clone` against this repo's DA org/site. It opens a browser login and caches the token to `~/.aem/da-token.json`, which the push script reads automatically (lookup order below):

```bash
npx -y @adobe/aem-cli content clone --path /
```

Complete the Adobe IMS login in the browser, then run the push normally:

```bash
npm run docs:da:push
```

If you already have a raw token (for CI or a one-off), set it directly instead — `DA_TOKEN` takes precedence over the cache:

```bash
DA_TOKEN={your-token} npm run docs:da:push
```

### Run the push

With a cached token (from the step above) this is all you need:

```bash
npm run docs:da:push
```

Defaults:

```text
DA_ORG=aemsites
DA_REPO=edge-commerce-docs
DA_BRANCH=main
```

`docs:da:push` runs `docs:da:build`, uploads each generated HTML file and the shared header fragment to `admin.da.live/source`, and triggers preview via `admin.hlx.page/preview`.

Optional flags can be passed after `--`:

```bash
npm run docs:da:push -- --dry-run
npm run docs:da:push -- --no-preview
npm run docs:da:push -- --publish
```

Token lookup order:

1. `DA_TOKEN` environment variable
2. `DA_TOKEN_PATH` environment variable
3. `.hlx/.da-token.json`
4. `~/.aem/da-token.json`

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
