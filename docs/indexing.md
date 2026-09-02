---
title: "Product Indexing Guide"
description: "Configure product indexes, merchant feeds, and sitemap outputs."
daPath: "/indexing"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "1c6fd97"
    lastContentCommit: "1c6fd97"
  helix-mixer:
    version: "v1.6.1"
    lastReviewedCommit: "b8acff4"
    lastContentCommit: "b8acff4"
  helix-product-pipeline:
    version: "v2.9.1"
    lastReviewedCommit: "893adf9"
    lastContentCommit: "893adf9"
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
    lastReviewedCommit: "afa6c86"
    lastContentCommit: "afa6c86"
  helix-product-image-collector:
    version: "v2.0.1"
    lastReviewedCommit: "853fc30"
    lastContentCommit: "853fc30"
migration:
  from: "helix-commerce-documentation/documentation/indexing.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Product Indexing Guide

## Introduction

The Product Indexer is a core component of the Helix Commerce ecosystem that automatically creates and maintains searchable product indices from your Product Bus data. It asynchronously processes product updates and generates two specialized indices: a configurable product index for frontend search, filtering, and catalog display, and a merchant feed compatible with Google Shopping for product advertising.

The indexer runs automatically, ensuring your indices stay synchronized with product data changes asynchronously.

## Getting started with indexing

### Step 1: Configure the product indexer

To enable product indexing, add the `productIndexerConfig` to your site's `public.json`. This tells the indexer which product properties to extract into the searchable index. Make sure to include any existing configurations so you don't overwrite them:

```bash
curl --request POST \
  --url https://admin.hlx.page/config/{org}/sites/{site}/public.json \
  --header 'Content-Type: application/json' \
  --data '{
    ...EXISTING PUBLIC CONFIG
    "productIndexerConfig": {
        "properties": {
            "name": "title",
            "sku": "sku",
            "path": "url",
            "price.final": "price",
            "brand": "brand",
            "images[0].url": "image"
        }
    }
}'
```

This configuration maps fields from your Product Bus data to fields in the searchable index. On the left side of each mapping, you specify which field from the Product Bus you want to include (like `name`, `sku`, or `price.final`). On the right side, you define what that field should be called in the index. For example, `"price.final": "price"` tells the indexer to take the final price from your product data and store it in the index under the simpler name "price". Without this configuration in place, the product indexer won't know which fields to extract, and product indexing will not occur.

### Step 2: Create an index

Before products can be indexed at a specific path, an index must exist at that path. Create an index using the Index API:

```bash
curl -X POST \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/index/us/en/index.json"
```

### Step 3: Verify indexing

Product indices update asynchronously. The indexer runs every 10 minutes, so your products should appear in the index within 10 minutes of creation. When you create an index, any existing products under that path are automatically queued for indexing, so you don't need to re-save them.

You can check if your products appear in the index by visiting:

```text
https://main--{site}--{org}.aem.network/us/en/index.json
https://main--{site}--{org}.aem.network/us/en/sitemap.xml
https://main--{site}--{org}.aem.network/us/en/merchant-center-feed.xml
```

## Deleting an index

Deleting an index first removes it from the index registry, then removes its stored index data and associated merchant feed. Unregistering the index first prevents pending indexing jobs from recreating it.

If the registry cannot be updated, the deletion returns a `502` response and the index is not deleted. After successful unregistration, cleanup of the stored index data and merchant feed is best-effort. If cleanup fails, you can safely retry the delete operation.

## How products are matched to an index

Indexes are created at specific paths (see [Step 2](#step-2-create-an-index)), and a single site can have indexes at more than one path. When a product is added or updated, the indexer decides which index it belongs to by matching the product's path against the indexes that exist.

The indexer always selects the *closest* index at or above the product's path. Starting from the product's own location, it moves up the path toward the site root and uses the first index it finds. Each product is added to that one index only — never to more than one index at the same time.

For example, given a product at `/us/en/products/shoes/running-shoe`:

- If indexes exist at both `/us/en/` and `/us/en/products/`, the product is added to the `/us/en/products/` index, because it is the closer of the two.
- If the only index is at `/us/en/`, the product is added there.
- If no index exists at `/us/en/`, `/us/en/products/`, or any other path above the product, the product is **not indexed**. Its updates are ignored until a covering index is created.

This is why an index must exist before products can be indexed. Creating an index at a path automatically queues every existing product beneath that path for indexing, so you don't need to re-save products after creating the index.

### Choosing where to place indexes

Place an index at the highest path that should share a single catalog view. Most sites use one index per locale (for example `/us/en/`), which keeps all products for that locale in one index. Add indexes at deeper paths when a subtree of products should be queried as a separate, self-contained index — for example, a distinct catalog or department — or when a single index would exceed the [50,000 parent products per index limit](/limits#product-index-size) and needs to be split across paths. Because a product is only ever added to its closest index, a deeper index takes over responsibility for the products beneath it, while products elsewhere continue to use the higher-level index.

### Indexes and sitemaps

Each index also drives the `sitemap.xml` at the same path: the sitemap is generated from the index data, so the products in an index determine what appears in that path's sitemap. This has two practical consequences:

- Keeping an index within the [50,000 parent products per index limit](/limits#product-index-size) also keeps its sitemap within the 50,000-URL limit that search engines enforce per sitemap file. When a catalog is larger, split it across deeper indexes — each path serves its own sitemap — rather than growing a single index past that limit.
- Products marked `noindex` (via a `metadata.robots` value containing `noindex`) are excluded from the sitemap, the same way they are excluded from the default index view.

## Product indexing configuration

The Product Indexer automatically creates searchable indices from your Product Bus data. Understanding how to configure and optimize indexing is essential for frontend search and Google Shopping integration.

### Index configuration

The Index is configured via your AEM Live site's `public` configuration. This allows you to customize exactly which product properties are extracted and indexed.

```json
{
  "public": {
    "productIndexerConfig": {
      "properties": {
        "name": "title",
        "price.final": "price",
        "brand": "brand",
        "availability": "inStock"
      }
    }
  }
}
```

#### Property path syntax

The indexer supports several path expressions for extracting data.

Simple properties:
```json
{
  "name": "productName",
  "brand": "brandName",
  "sku": "productSku"
}
```

Nested properties (dot notation):
```json
{
  "price.final": "salePrice",
  "price.regular": "regularPrice",
  "price.currency": "currency"
}
```

Array indexing:
```json
{
  "images[0].url": "primaryImage",
  "images[1].url": "secondaryImage"
}
```

Array wildcards (comma-delimited output):
```json
{
  "categories[*].name": "categories",
  "images[*].url": "allImages"
}
```
Output example: `"categories": "Electronics,Computers,Laptops"`

Metadata properties:
```json
{
  "metadata.color": "color",
  "metadata.size": "size",
  "metadata.material": "material"
}
```

### Prices in index responses

The stored index contains the prices written by the Product Indexer at indexing time. When the pipeline serves an index response, it fetches and applies any active catalog price rules before returning the data, so the `price` values a browser or application sees may be lower than what was originally indexed. See the [Rendering Guide](/rendering-guide#catalog-price-rules) for details on how catalog price rules work.

### Configuration best practices

Index only what you need by including only properties used by your frontend application. Smaller indices load faster and reduce bandwidth. Common properties include name, price, SKU, availability, and primary image.

Use consistent naming by choosing clear, descriptive index field names. Use camelCase or snake_case consistently (e.g., `"name": "productTitle"`, `"sku": "productCode"`).

Plan for search and filtering by including properties used in search (name, brand, categories), properties used in filters (price, color, size, availability), and properties displayed in results (image, price, name).

#### Full configuration example

```json
{
  "public": {
    "productIndexerConfig": {
      "properties": {
        "sku": "sku",
        "name": "title",
        "path": "url",
        "price.final": "price",
        "price.currency": "currency",
        "availability": "inStock",
        "brand": "brand",
        "images[0].url": "image",
        "categories[*].name": "categories",
        "metadata.color": "color",
        "metadata.size": "size",
        "metaDescription": "description"
      }
    }
  }
}
```

### Merchant feed configuration

The Merchant Feed is generated automatically without configuration. It extracts the following Google Merchant Center fields from each product:

| Feed field | Source |
|---|---|
| `id` | `sku` |
| `title` | `name` |
| `description` | `metaDescription` if present, otherwise `description` (HTML stripped) |
| `link` | `url` |
| `image_link` | `images[0].url` |
| `price` | `price.final` + `price.currency` (e.g., `"29.99 USD"`) |
| `availability` | `availability` (mapped: `InStock`→`in_stock`, `OutOfStock`→`out_of_stock`, `PreOrder`→`preorder`, `BackOrder`→`backorder`) |
| `condition` | `itemCondition` (mapped: `NewCondition`→`new`, `RefurbishedCondition`→`refurbished`, `UsedCondition`→`used`; defaults to `new`) |
| `brand` | `brand` |
| `gtin` | `gtin` |
| `mpn` | `mpn` |
| `product_type` | `productType` |
| `google_product_category` | `googleProductCategory` |
| `adult` | Derived from `adultOnly` boolean field (`yes` / `no`) |
| `shipping` | `shipping` field, falling back to `custom.shipping`. Expected shape: `{ country, service, price }` |
| `item_group_id` | Set to the parent product's `sku` for variant entries, linking variants in Google Merchant Center |

When a product has variants, each variant produces its own feed entry with its own `item_group_id` pointing to the parent.

Products are automatically excluded from the merchant feed if they have `filters.noindex` set to `true`. The indexer sets this flag when a product's `metadata.robots` field contains `"noindex"`.

### Index access patterns

Index endpoints:
```bash
# Returns only indexable products (excludes products with filters.noindex)
curl "https://www.example.com/us/en/index.json"

# Include all products (including noindex products) — both forms are equivalent
curl "https://www.example.com/us/en/index.json?include=all"
curl "https://www.example.com/us/en/index.json?sheet=all"

# Include only noindex products
curl "https://www.example.com/us/en/index.json?include=noindex"
```

#### Pagination

Product indexes support `limit` and `offset` query parameters for paginated access:

```bash
# First 50 products
curl "https://www.example.com/us/en/index.json?limit=50&offset=0"

# Next 50 products
curl "https://www.example.com/us/en/index.json?limit=50&offset=50"
```

Results are sorted deterministically by SKU for consistent pagination across requests. When any pagination parameter is provided, the default limit is 1000. When no pagination parameters are provided, all results are returned.

The response includes pagination metadata:

```json
{
  ":type": "sheet",
  "total": 250,
  "offset": 0,
  "limit": 50,
  "columns": ["sku", "name", "price", ...],
  "data": [...]
}
```

| Field | Description |
|-------|-------------|
| `total` | Total number of products in the index (after filtering) |
| `offset` | Number of products skipped |
| `limit` | Number of products returned in this response |

Merchant feed endpoint:
```bash
curl "https://www.example.com/us/en/merchant-center-feed.xml"
```

### Indexing performance

Indexing jobs run automatically and asynchronously. To optimize performance, batch product updates when possible, schedule large catalog updates during off-peak hours, monitor index update latency via last-modified timestamps, and keep index configurations lean with only needed properties.

## Next steps

- [AEM Network Configuration](/network): Configure URL routing to serve your product index
- [Caching strategy](/caching): Cache behavior, push invalidation, and update propagation
- [Schema Reference](/schema-reference#productbusentry): Detailed reference for all indexable product fields