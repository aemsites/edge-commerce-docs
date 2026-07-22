# Documentation generation and DA publishing

The public documentation source lives as Markdown in `/docs`. The DA publishing pipeline converts those Markdown files into DA-compatible HTML body fragments and can upload them to Adobe Document Authoring (DA).

## Schema reference (generated in helix-commerce-api)

The Product Bus schema tables in `docs/schema-reference.md` (between the
`<!-- GENERATED: ... -->` markers) are generated from the API's runtime schemas
in the **`helix-commerce-api`** repo (`npm run docs:schema` there) and synced
here via PR. Don't hand-edit those regions or regenerate them from this repo;
the surrounding narrative is human-authored.

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

## LLM doc sync

`llm-sync.mjs` automatically updates narrative docs when a source repo changes. It reads each `docs/*.md` file, checks its frontmatter `sources` block for the target repo, diffs the source repo since the last reviewed commit, sends the diff and current doc to an LLM, and writes the updated doc back.

The workflow (`.github/workflows/llm-doc-sync.yaml`) runs on `repository_dispatch` events or manual `workflow_dispatch` triggers. It checks out both this repo and the source repo, runs the sync script, and opens a PR with the label `ai-authored`.

### Run locally

```bash
export SOURCE_REPO="helix-commerce-api"
export SOURCE_REF="abc1234"                  # commit SHA to sync to
export SOURCE_VERSION="v2.43.0"               # optional version string
export SOURCE_REPO_PATH="/path/to/source/repo" # full clone with history
export OPENAI_API_KEY="sk-..."

node scripts/docs/llm-sync.mjs
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `SOURCE_REPO` | yes | Source repo name (e.g. `helix-commerce-api`) |
| `SOURCE_REF` | yes | Commit SHA to sync to |
| `SOURCE_VERSION` | no | Version string (e.g. `v2.43.0`) |
| `SOURCE_REPO_PATH` | yes | Absolute path to a full clone of the source repo |
| `OPENAI_API_KEY` | yes | OpenAI API key |
| `OPENAI_MODEL` | no | Writer model for rewrites/additions (default `gpt-5.6-luna`) |
| `OPENAI_PREFLIGHT_MODEL` | no | Relevance classifier model (default `gpt-5-nano`) |

The script filters out test files, CI config, and lock files from the diff so only meaningful code changes drive doc updates. If no docs need content changes, it exits cleanly.

### Model selection and cost

The writer model (`OPENAI_MODEL`) handles the full-file rewrites and gap-analysis additions — its output tokens dominate cost. It defaults to `gpt-5.6-luna` (same GPT-5.6 family as the previous `gpt-5.6-terra` default, roughly 2.5x cheaper on both input and output). The preflight classifier (`OPENAI_PREFLIGHT_MODEL`) runs once per tracked doc and only answers YES/NO, so it defaults to the inexpensive `gpt-5-nano`. Both are overridable per run.

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
