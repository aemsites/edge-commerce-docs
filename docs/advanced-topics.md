---
title: "Advanced Topics and Best Practices"
description: "Operational guidance and best practices for Edge Delivery Commerce."
daPath: "/docs/advanced-topics"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.10.2"
    lastReviewedCommit: "8af300d"
    lastContentCommit: "8af300d"
  helix-mixer:
    version: "v1.6.1"
    lastReviewedCommit: "b8acff4"
    lastContentCommit: "b8acff4"
  helix-product-pipeline:
    version: "v2.8.2"
    lastReviewedCommit: "5f3de79"
    lastContentCommit: "5f3de79"
  helix-product-indexer:
    version: "v2.0.1"
    lastReviewedCommit: "7f3fc84"
    lastContentCommit: "7f3fc84"
  helix-product-indexer-pump:
    version: "v2.0.1"
    lastReviewedCommit: "b745180"
    lastContentCommit: "b745180"
  helix-product-shared:
    version: "v1.7.0"
    lastReviewedCommit: "6ea43b0"
    lastContentCommit: "6ea43b0"
  helix-product-image-collector:
    version: "v2.0.4"
    lastReviewedCommit: "853fc30"
    lastContentCommit: "853fc30"
migration:
  from: "helix-commerce-documentation/documentation/advanced-topics.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Advanced Topics and Best Practices

## Limits and guidance

In addition to the [standard limits for AEM](https://main--helix-website--adobe.aem.live/docs/limits), there are specific considerations for the Helix Commerce API:

### Bulk operations
- Maximum 50 products per `POST` request
- Limit subject to change based on performance optimization
- Use multiple requests for larger batches

### Product data
- Custom JSON-LD field: 128,000 character maximum
- No hard limit on product catalog size

## Multi-store configuration

If you have multiple stores, or serve multiple languages, use the following structure:

```
Org
  └── Site
      └── Store (e.g., "us", "eu", "default")
          └── View (e.g., "en_us", "en_gb", "fr_fr")
```

This can be useful for organizing stores based on geography, so that you can manage inventory and pricing for each region. It allows language views, with multiple languages within the same store. Finally, you can enforce brand separation and serve multiple brands under one organization.

As a result, you will have an API structure like this, with each store/view combination having independent product data:
```
/{org}/{site}/catalog/us/en_us/products/...     (US English)
/{org}/{site}/catalog/us/es_us/products/...     (US Spanish)
/{org}/{site}/catalog/eu/en_gb/products/...     (UK English)
```

## Custom data and extensions

The `custom` object provides a flexible way to extend product data with arbitrary structures that suit your specific needs. The API does not validate the contents of this object, allowing you to store any application-specific data without schema restrictions. When you include custom data in your product records, it will be preserved and returned in all API responses. You can add the `custom` object at both the top-level product and on individual variants, giving you fine-grained control over where you store additional information.

```json
{
  "sku": "product-123",
  "name": "Product Name",
  "custom": {
    "internalId": "INT-9876",
    "supplierData": {
      "code": "SUP-ABC",
      "leadTime": "3-5 days"
    },
    "promotions": ["spring-sale", "clearance"],
    "customAttributes": {
      "eco-friendly": true,
      "handmade": false
    }
  }
}
```

When working with the `custom` object, focus on using it for integration-specific data that doesn't fit into the standard product schema. Since the API doesn't validate this data, you should implement validation on the client side to ensure data quality and consistency. Be mindful not to overload the custom object with unnecessary data, as this can impact performance and make your product records harder to maintain.

## Caching strategy

The Product Pipeline relies on your CDN for caching rendered content. It returns appropriate cache headers for all supported CDN providers, enabling efficient caching of product pages, JSON data, indexes, merchant feeds, and sitemaps.

### Cache TTL values

The Pipeline returns different cache durations depending on the content type and whether push invalidation is enabled:

| Content Type | Browser TTL | CDN TTL (with push invalidation) | CDN TTL (without push invalidation) |
|--------------|-------------|----------------------------------|-------------------------------------|
| Product pages (HTML) | 2 hours | 48 hours | 5 minutes |
| Product data (JSON) | 2 hours | 48 hours | 5 minutes |
| Product indexes | 2 hours | 48 hours | 5 minutes |
| Merchant feeds | 2 hours | 48 hours | 5 minutes |
| Sitemaps | 2 hours | 48 hours | 5 minutes |
| Media (images) | 30 days | 30 days | 30 days |
| 404 responses | 2 hours | 48 hours | 5 minutes |

Error responses (400, 401) are not cached.

### Multi-CDN support

The Pipeline automatically detects your CDN provider and returns the appropriate cache control headers for major CDN providers via standard cache-control headers.

### Push invalidation

When products are updated via the Product Bus API (`PUT`/`DELETE` operations), cached content is automatically purged from your CDN.

To enable push invalidation, configure your CDN to respect cache headers from AEM Network and set up [Push Invalidation](https://www.aem.live/docs/setup-byo-cdn-push-invalidation) for your Edge Delivery Site. The Pipeline uses cache tags (also called surrogate keys) to enable selective purging. When a product is updated, only that product's cached pages (HTML, JSON) are invalidated. Product indexes (`index.json`) and sitemaps (`sitemap.xml`) also carry their own cache keys, so when the Product Indexer refreshes an index, only that index's cached response is invalidated — not your entire catalog or other indexes.

### Update propagation timing

When you update a product through the API, the timeline for changes to become visible depends on your setup. With push invalidation enabled, changes typically propagate within seconds as the CDN cache is actively purged. Without push invalidation, changes become visible after the 5-minute CDN TTL expires.

Product indexes and merchant feeds update asynchronously through the Product Indexer, which runs on a scheduled interval. After updating products, allow up to 10 minutes for changes to appear in indexes and feeds.

## Image processing

When you provide external image URLs in your product data, the Image Collector service fetches, processes, and stores them in the media bus. This section explains the processing behavior, error handling, and how to verify image status.

### Processing modes

Image processing runs in one of two modes depending on the size of your request. For small requests (10 or fewer products with 10 or fewer total images), processing is synchronous, images are fetched and stored before the API returns. For larger requests, processing is asynchronous, the API returns immediately while images are queued for background processing.

### How images are stored

External images are downloaded, hashed using SHA-1, and stored with content-based filenames like `./media_a3f5b8c1d2e4f6g7h8i9j0k1l2m3n4o5p6q7r8s9.jpg`. The hash is computed from the image content, enabling automatic deduplication, if the same image is used across multiple products, it's stored only once. After processing, image URLs in your product data are transformed from external URLs to these relative paths.

### Checking image processing status

To verify whether images have been processed, fetch the product data via the JSON endpoint and inspect the image URLs. Processed images have relative paths starting with `./media_` followed by a 40-character hash. Unprocessed images retain their original external URLs (starting with `https://`). For example:

```json
{
  "images": [
    { "url": "./media_a3f5b8c1d2e4f6g7h8i9j0k1l2m3n4o5p6q7r8s9.jpg" },
    { "url": "https://cdn.example.com/pending-image.jpg" }
  ]
}
```

In this example, the first image has been processed and stored, while the second is still pending or failed.

### Error handling

When an image fails to download, the system retries up to 3 times with exponential backoff for rate-limiting (429) and forbidden (403) responses. If all retries fail, the error is logged and the original external URL is preserved in the product data. The product is still saved successfully, only the failed image remains unprocessed. Other images in the same product are processed independently, so a single failed image doesn't block the others.

Common reasons for image fetch failures include the source URL returning 404, the source server rate-limiting requests, authentication required (images must be publicly accessible), and network timeouts.

### Processing timeline

After submitting products with external images, the processing timeline depends on your request size. For synchronous processing, images are available immediately when the API returns. For asynchronous processing, images are typically processed within a few minutes. After processing completes, the system automatically purges the CDN cache for affected products and triggers re-indexing so that indexes and feeds reflect the new image URLs.

### Best practices

To ensure reliable image processing, use publicly accessible image URLs without authentication requirements. Prefer stable URLs that don't change, the system caches the mapping between source URLs and stored images, so changing the source URL for the same image creates duplicates. If you need to replace an image, use a new URL. For large catalogs, batch your uploads to avoid overwhelming external image servers, and monitor your product data to verify images are being processed successfully.

## Security best practices

### API key management

Rotate your API keys regularly, quarterly rotation is recommended as a baseline. Never commit keys to version control, and instead use environment variables or a secret management service to store and access them securely.

### Data validation

Validate all product data before ingestion to catch issues early. Sanitize HTML content to prevent Cross-Site Scripting (XSS) vulnerabilities, and validate external URLs for images to ensure they point to trusted sources.

## Next steps

- [Data Ingestion Guide](/docs/data-ingestion#etl-process-overview): ETL best practices and bulk operation strategies
- [API Reference](/docs/api-reference#bulk-create-or-update-products): Detailed API documentation including limits and error handling
- [Schema Reference](/docs/schema-reference#productbusentry): Custom data structures and extension fields
