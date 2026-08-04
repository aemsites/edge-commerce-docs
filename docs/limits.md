---
title: "Limits and guidance"
description: "API limits and operational guidance for Edge Delivery Commerce."
status: migrated
managed: true
sourceFormat: markdown
---

---
title: "Limits and guidance"
description: "API limits and operational guidance for Edge Delivery Commerce."
status: migrated
managed: true
sourceFormat: markdown
---

# Limits and guidance

In addition to the [standard limits for AEM](https://www.aem.live/docs/limits), there are specific considerations for the Edge Commerce API:

## API rate limits

- Edge Commerce API supports up to **10 requests per second**
- This limit applies to API requests, including bulk ingestion workflows
- For large imports or synchronization jobs, distribute requests over time and avoid sustained bursts above the supported rate
- Load testing should be run against API stage environments, not the production queue

## Bulk operations

- Maximum 50 products per `POST` request
- Limit subject to change based on performance optimization
- At the supported API rate of 10 requests per second, clients can submit up to 500 products per second when using full 50-product batches

## Product data

- Custom JSON-LD field: 128,000 character maximum
- Recommended catalog size limit: **100,000 SKUs per market**

## Catalog size guidance

Edge Delivery Commerce is optimized for commercially meaningful product catalogs, not for maximizing raw SKU count.

The default guidance is:

- Up to **100,000 SKUs per market** is supported as the standard operating range
- Requests above this range will be evaluated case by case
- Exception reviews should consider:
  - Total GMV
  - Average GMV per SKU
  - Number of markets
  - Indexing and ingestion requirements

## Next steps

- [Data Ingestion Guide](/data-ingestion#etl-process-overview): Bulk operation strategies and ETL best practices
- [API Reference](/api-reference#bulk-create-or-update-products): Endpoint documentation including limits and error handling
