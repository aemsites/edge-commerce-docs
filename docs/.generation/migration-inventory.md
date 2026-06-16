# Migration inventory

Initial migration target: all public Markdown files from `helix-commerce-documentation/documentation` live under `/docs` in `edge-commerce-docs`.

Internal root-level files from the legacy documentation repo, including `*-intro.md`, `*-architecture.md`, demo docs, and implementation-heavy component docs, are intentionally not migrated in this pass.

| Legacy file | Destination | DA path | Status |
|---|---|---|---|
| `documentation/README.md` | `docs/index.md` | `/` | migrated as-is |
| `documentation/network.md` | `docs/network.md` | `/network` | migrated as-is |
| `documentation/advanced-topics.md` | split into `docs/limits.md`, `docs/multi-store.md`, `docs/custom-data.md`, `docs/caching.md`, `docs/image-processing.md`, `docs/security.md` | `/limits`, `/multi-store`, `/custom-data`, `/caching`, `/image-processing`, `/security` | split for navigation |
| `documentation/api-reference.md` | `docs/api-reference.md` | `/api-reference` | migrated as-is |
| `documentation/coupons.md` | `docs/coupons.md` | `/coupons` | migrated as-is |
| `documentation/data-ingestion.md` | `docs/data-ingestion.md` | `/data-ingestion` | migrated as-is |
| `documentation/getting-started.md` | `docs/getting-started.md` | `/getting-started` | migrated as-is |
| `documentation/indexing.md` | `docs/indexing.md` | `/indexing` | migrated as-is |
| `documentation/overview.md` | `docs/overview.md` | `/overview` | migrated as-is |
| `documentation/promotions.md` | `docs/promotions.md` | `/promotions` | migrated as-is |
| `documentation/rendering-guide.md` | `docs/rendering-guide.md` | `/rendering-guide` | migrated as-is |
| `documentation/schema-reference.md` | `docs/schema-reference.md` | `/schema-reference` | migrated as-is |

## Follow-up work

1. Add Markdown-to-HTML generation for DA upload.
2. Add a DA path/document ID mapping if DA requires stable IDs in addition to paths.
3. Add a docs-update workflow that compares each doc's `lastReviewedCommit` against current source repository commits.
4. Run a source-code verification pass to update stale content and fill gaps in this repo.
