---
title: "Limits and guidance"
description: "API limits and operational guidance for Edge Delivery Commerce."
status: migrated
managed: true
sourceFormat: markdown
---

# Limits and guidance

In addition to the [standard limits for AEM](https://main--helix-website--adobe.aem.live/docs/limits), there are specific considerations for the Edge Commerce API:

## Bulk operations
- Maximum 50 products per `POST` request
- Limit subject to change based on performance optimization
- Use multiple requests for larger batches

## Product data
- Custom JSON-LD field: 128,000 character maximum
- No hard limit on product catalog size

## Next steps

- [Data Ingestion Guide](/data-ingestion#etl-process-overview): Bulk operation strategies and ETL best practices
- [API Reference](/api-reference#bulk-create-or-update-products): Endpoint documentation including limits and error handling
