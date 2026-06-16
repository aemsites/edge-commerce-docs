---
title: "Caching strategy"
description: "How rendered content is cached and invalidated in Edge Delivery Commerce."
status: migrated
managed: true
sourceFormat: markdown
---

# Caching strategy

The Product Pipeline relies on your CDN for caching rendered content. It returns appropriate cache headers for all supported CDN providers, enabling efficient caching of product pages, JSON data, indexes, merchant feeds, and sitemaps.

## Cache TTL values

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

## Multi-CDN support

The Pipeline automatically detects your CDN provider and returns the appropriate cache control headers for major CDN providers via standard cache-control headers.

## Push invalidation

When products are updated via the Product Bus API (`PUT`/`DELETE` operations), cached content is automatically purged from your CDN.

To enable push invalidation, configure your CDN to respect cache headers from AEM Network and set up [Push Invalidation](https://www.aem.live/docs/setup-byo-cdn-push-invalidation) for your Edge Delivery Site. The Pipeline uses cache tags (also called surrogate keys) to enable selective purging. When a product is updated, only that product's cached pages (HTML, JSON) are invalidated. Product indexes (`index.json`) and sitemaps (`sitemap.xml`) also carry their own cache keys, so when the Product Indexer refreshes an index, only that index's cached response is invalidated — not your entire catalog or other indexes.

## Update propagation timing

When you update a product through the API, the timeline for changes to become visible depends on your setup. With push invalidation enabled, changes typically propagate within seconds as the CDN cache is actively purged. Without push invalidation, changes become visible after the 5-minute CDN TTL expires.

Product indexes and merchant feeds update asynchronously through the Product Indexer, which runs on a scheduled interval. After updating products, allow up to 10 minutes for changes to appear in indexes and feeds.

## Next steps

- [Rendering Guide](/rendering-guide#data-rendering-locations): Output formats and where data is rendered
- [Indexing](/indexing): How indexes and feeds update
