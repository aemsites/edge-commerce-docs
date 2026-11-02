---
title: "Limits and guidance"
description: "API limits and operational guidance for Edge Delivery Commerce."
tags: "rate limits, bulk operations, catalog size, index size, merchant feed size"
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

## Product index size

Each product index has two limits:

- **Product count**: up to **50,000 products** per index. A product counts once, regardless of how many variants it has, so an index's sitemap never exceeds 50,000 URLs.
- **Data size**: each index and its merchant feed have a maximum data size. Variants, the number of indexed properties, and long text values such as descriptions all add to it. In the merchant feed, each variant is a separate item that repeats the parent product's description and images when it doesn't have its own, so catalogs with many variants per product reach the size limit before 50,000 products.

As a planning guideline, keep each index under **40,000 products and variants combined**. Catalogs with few variants per product can approach the 50,000-product limit. The `total` field of an index response counts each product and each variant, so you can compare an index against this guideline with `index.json?include=all&limit=1`.

When an index reaches either limit, new products are not added to it. The product write still succeeds and the product page still renders, but the product doesn't appear in that index, its sitemap, or its merchant feed. Updates and deletions for products already in the index continue to apply. The merchant feed has its own size limit and can fill up before the index does, so a new product can appear in the index and sitemap but not in the feed.

These limits apply per index, not to the catalog as a whole. To index more products, split the catalog across multiple path-based or tagged indexes. See the [Product Indexing Guide](/indexing#choosing-an-index-strategy).

## Next steps

- [Data Ingestion Guide](/data-ingestion#etl-process-overview): Bulk operation strategies and ETL best practices
- [API Reference](/api-reference#bulk-create-or-update-products): Endpoint documentation including limits and error handling
