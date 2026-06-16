# Documentation generation policy

This directory defines how managed Markdown docs in `/docs` are reviewed and updated from Helix Commerce source repositories.

## Source of truth

- Markdown files in `/docs` are the canonical source for generated technical documentation.
- HTML generated for Document Authoring (DA) upload is an intermediate publishing artifact and should not be hand-edited.
- DA documents generated from these files should be treated as managed output. Edit the Markdown source and regenerate instead.

## Commit metadata

Managed docs should include frontmatter with source repository commits:

```yaml
sources:
  helix-commerce-api:
    lastReviewedCommit: "abc123"
    lastContentCommit: "abc123"
```

- `lastReviewedCommit`: latest commit evaluated for documentation impact.
- `lastContentCommit`: latest commit that required a content change in the document.
- A source repository change may update `lastReviewedCommit` without changing page content when the change has no public documentation impact.

## Documentation-impacting changes

Usually update docs for changes that affect public users, integrators, or site implementers, including:

- Public API endpoints, request formats, response formats, status codes, or authentication behavior.
- Product Bus schema fields, validation rules, required fields, enum values, or example payloads.
- Public configuration, routing patterns, index configuration, feed configuration, or cache behavior visible to implementers.
- Rendering behavior, output formats, JSON-LD, sitemap output, merchant feed output, or fallback behavior.
- Data ingestion requirements, ETL guidance, limits, quotas, operational constraints, or troubleshooting guidance.
- User-visible behavior in reference implementations that documents recommended integration patterns.

## Non-impacting changes

Usually do not change public docs for:

- Internal refactors with no user-visible behavior change.
- Tests-only changes unless tests document new public behavior or invalid examples.
- Logging, metrics, tracing, or internal diagnostics only.
- Dependency updates with no public behavior change.
- Formatting, lint, build, CI, or code organization changes.
- Internal storage, queue, worker, or deployment implementation details that are intentionally not exposed in public docs.

## Required updater behavior

A docs updater must first produce an impact assessment before editing content:

1. Identify the source repository, `from` commit, and `to` commit.
2. Summarize changed files and public behavior changes.
3. Decide whether docs are impacted.
4. List affected Markdown files.
5. Explain ignored changes and why they do not affect public docs.
6. Only then update Markdown and frontmatter.

If no content change is needed, update only `lastReviewedCommit` for affected docs and include the no-op rationale in the generated PR summary.
