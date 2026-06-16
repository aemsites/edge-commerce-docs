# helix-commerce-api documentation impact rules

Update public docs when changes affect:

- REST endpoint paths, methods, parameters, authentication, permissions, or response codes.
- Product CRUD behavior, bulk ingestion, cache invalidation, or async processing visible to API users.
- Request and response schemas, validation rules, error response formats, or examples.
- Store, store view, path, SKU, URL key, index, coupon, promotion, order, payment, customer, or place behavior exposed through the API.
- Operational limits, rate limits, payload limits, or troubleshooting steps.

Do not update public docs for internal-only storage, queue, deployment, logging, or code organization changes unless they change user-visible behavior.
