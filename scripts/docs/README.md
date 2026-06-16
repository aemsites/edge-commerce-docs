# Markdown to DA publishing

The public documentation source lives as Markdown in `/docs`. The DA publishing pipeline converts those Markdown files into DA-compatible HTML body fragments and can upload them to Adobe Document Authoring (DA).

## Build DA HTML

```bash
npm run docs:da:build
```

This writes reviewable generated HTML into:

```text
.da/docs/*.html
.da/manifest.json
```

The generated HTML follows the DA/Edge Delivery Services content contract:

- body fragment only: `<body>`, `<header>`, `<main>`, `<footer>`
- one section wrapper: `<main><div>...</div></main>`
- no `<!DOCTYPE>`, `<html>`, `<head>`, `<script>`, or inline styles
- metadata emitted as a canonical `<div class="metadata">` block
- supported Markdown block tables, such as `Pagination (Contained)`, converted to canonical div-form EDS blocks

## Push to DA

```bash
DA_TOKEN={your-token} npm run docs:da:push
```

Defaults:

```text
DA_ORG=aemsites
DA_REPO=edge-commerce-docs
DA_BRANCH=main
```

`docs:da:push` runs `docs:da:build`, uploads each generated HTML file to `admin.da.live/source`, and triggers preview via `admin.hlx.page/preview`.

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
