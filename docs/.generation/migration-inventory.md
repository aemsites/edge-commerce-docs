# Migration inventory

Initial migration target: all public Markdown files from `helix-commerce-documentation/documentation` live under `/docs` in `edge-commerce-docs`.

Internal root-level files from the legacy documentation repo, including `*-intro.md`, `*-architecture.md`, demo docs, and implementation-heavy component docs, are intentionally not migrated in this pass.

| Legacy file | Destination | DA path | Status |
|---|---|---|---|
| `documentation/README.md` | `docs/index.md` | `/docs/` | migrated as-is |
| `documentation/network.md` | `docs/network.md` | `/docs/network` | migrated as-is |
| `documentation/advanced-topics.md` | `docs/advanced-topics.md` | `/docs/advanced-topics` | migrated as-is |
| `documentation/api-reference.md` | `docs/api-reference.md` | `/docs/api-reference` | migrated as-is |
| `documentation/coupons.md` | `docs/coupons.md` | `/docs/coupons` | migrated as-is |
| `documentation/data-ingestion.md` | `docs/data-ingestion.md` | `/docs/data-ingestion` | migrated as-is |
| `documentation/getting-started.md` | `docs/getting-started.md` | `/docs/getting-started` | migrated as-is |
| `documentation/indexing.md` | `docs/indexing.md` | `/docs/indexing` | migrated as-is |
| `documentation/overview.md` | `docs/overview.md` | `/docs/overview` | migrated as-is |
| `documentation/promotions.md` | `docs/promotions.md` | `/docs/promotions` | migrated as-is |
| `documentation/rendering-guide.md` | `docs/rendering-guide.md` | `/docs/rendering-guide` | migrated as-is |
| `documentation/schema-reference.md` | `docs/schema-reference.md` | `/docs/schema-reference` | migrated as-is |

## Follow-up work

1. Add Markdown-to-HTML generation for DA upload.
2. Add a DA path/document ID mapping if DA requires stable IDs in addition to paths.
3. Add a docs-update workflow that compares each doc's `lastReviewedCommit` against current source repository commits.
4. Run a source-code verification pass to update stale content and fill gaps in this repo.
