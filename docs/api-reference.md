---
title: "Helix Commerce API reference"
description: "Human-readable API reference for Product Bus operations."
daPath: "/api-reference"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.10.2"
    lastReviewedCommit: "90dccc8"
    lastContentCommit: "90dccc8"
  helix-mixer:
    version: "v1.6.1"
    lastReviewedCommit: "b8acff4"
    lastContentCommit: "b8acff4"
  helix-product-pipeline:
    version: "v2.8.2"
    lastReviewedCommit: "759944b"
    lastContentCommit: "759944b"
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
  from: "helix-commerce-documentation/documentation/api-reference.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Helix Commerce API reference

## Base URL structure

All API endpoints share this base pattern:
```text
https://api.adobecommerce.live/{org}/sites/{site}/{route}
```

The common parameters are `{org}` for your organization identifier, `{site}` for your site identifier, and `{route}` for the API route which varies by operation.

The available API routes are `/catalog{path}` for product operations where `{path}` is the product URL path (e.g., `/catalog/us/en/products/blender-pro-500.json`), `/index{path}` for index management, and `/auth/token` for API key management.

## Authentication

All modifying operations (`PUT`, `POST`, `DELETE`) require authentication using a bearer token:

```bash
Authorization: Bearer {your-sitekey}
```

`GET` operations for published data do not require authentication.

## Path-based storage

Products are stored and accessed by their URL path. The path determines both the storage location and the product's URL on your site.

### Path requirements

Paths must follow these rules:
- Use lowercase letters (a-z)
- Use numbers (0-9)
- Use hyphens (-) or underscores (_) for word separation
- Use forward slashes (/) for path segments
- Maximum 900 characters
- No uppercase letters or special characters

### Path structure examples

Region and locale segments:
```text
/us/en/products/blender-pro-500.json          # US English
/eu/de/produkte/mixer-pro-500.json            # EU German
/ca/fr/produits/melangeur-pro-500.json        # Canada French
```

Product categories:
```text
/products/electronics/smartphones/iphone-15.json
/products/home/kitchen/blender-pro-500.json
```

Simple structure:
```text
/products/blender-pro-500.json
/items/sku-12345.json
```

### Multi-store and multi-locale

Region and locale information is embedded directly in the path. The same product can exist at different paths for different markets, and each path contains [locale-specific data](/multi-store) like translated names, descriptions, and pricing for SEO.

```text
# US English version
/us/en/products/blender-pro-500.json

# US Spanish version
/us/es/productos/licuadora-pro-500.json

# EU German version
/eu/de/produkte/mixer-pro-500.json
```

## Product operations

### Create or update a product

`PUT /{org}/sites/{site}/catalog{path}`

#### Full replacement semantics

The `PUT` operation performs a complete replacement of the product data. The API does not merge with existing data. When updating a product, you must include all fields you want to retain. Any fields omitted from the request will be removed from the stored product.

To update a single field, first fetch the existing product via `GET`, modify the field you need to change, then send the complete object back via `PUT`. The API does not support `PATCH` operations for partial updates.

#### Path handling

The `path` in the URL determines where the product is stored. If the request body includes a `path` field, it must exactly match the path in the URL (without the `.json` extension). If the request body does not include a `path` field, the path from the URL will be automatically inserted into the product data. Mismatched paths will return `400 Bad Request` with an error message.

```bash
# Valid - path matches
PUT /org/sites/site/catalog/us/en/products/blender.json
Body: { "sku": "123", "path": "/us/en/products/blender", ... }

# Valid - no path in body (will be added automatically)
PUT /org/sites/site/catalog/us/en/products/blender.json
Body: { "sku": "123", "name": "Blender", ... }
# Result: path "/us/en/products/blender" added to product data

# Invalid - path mismatch
PUT /org/sites/site/catalog/us/en/products/blender.json
Body: { "sku": "123", "path": "/us/en/products/mixer", ... }
# Error: 400 Bad Request
```

The request body should be a product object (see [Schema Reference](/schema-reference#productbusentry)).

When the request succeeds and the product was created or updated, you'll receive a `201 Created` status along with the complete product object. A `200 OK` status is returned when all products were already up-to-date and no changes were detected. If the product data is invalid, the API returns a `400 Bad Request` with details about the validation errors. A `401 Unauthorized` response indicates that your API key is missing or invalid.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/catalog/us/en/products/blender-pro-500.json" \
  -X PUT \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "sku-123",
    "path": "/us/en/products/blender-pro-500",
    "description": "Long product description with <em>HTML support</em>...",
    "name": "Product Name",
    "metaTitle": "Product Name | Brand",
    "metaDescription": "Short SEO description...",
    "gtin": "0123456789012",
    "url": "https://www.example.com/us/en/products/product-url-key",
    "brand": "ExampleBrand",
    "availability": "InStock",
    "price": {
      "currency": "USD",
      "regular": "129.99",
      "final": "99.99"
    },
    "itemCondition": "NewCondition",
    "metadata": {
      "color": "black",
      "size": "M"
    },
    "options": [
      {
        "id": "finish",
        "label": "Finish",
        "position": 1,
        "values": [
          { "value": "Matte" },
          { "value": "Glossy" }
        ]
      }
    ],
    "aggregateRating": {
      "ratingValue": "4.3",
      "reviewCount": "12",
      "bestRating": "5",
      "worstRating": "1"
    },
    "images": [
      {
        "url": "https://cdn.example.com/images/sku-123/main.jpg",
        "label": "main",
        "roles": ["small", "thumbnail"],
        "video": "https://cdn.example.com/videos/sku-123/overview.mp4"
      }
    ],
    "variants": [
      {
        "sku": "sku-123-RED",
        "name": "Product Name - Red",
        "price": {
          "currency": "USD",
          "regular": "129.99",
          "final": "99.99"
        },
        "url": "https://www.example.com/us/en/products/product-url-key?color=red",
        "images": [
          { "url": "https://cdn.example.com/images/sku-123/red.jpg", "label": "red" }
        ],
        "gtin": "0123456789013",
        "description": "Red variant description with <strong>HTML</strong>",
        "availability": "InStock",
        "options": [ { "value": "Red", "id": "color", "uid": "opt-1" } ],
        "itemCondition": "NewCondition",
        "custom": { "material": "aluminum" }
      }
    ],
    "custom": {
      "warranty": "2 years",
      "countryOfOrigin": "USA"
    }
  }'
```

**Note:** The `description` field supports [HTML markup](/schema-reference#html-support) for rich formatting.

**Note:** When providing a `price` object, the `final` and `currency` fields are required. The `regular` field is optional. See [ProductBusPrice](/schema-reference#productbusprice) for details.

### Bulk create or update products

`POST /{org}/sites/{site}/catalog/*`

Each product in the array must include a `path` field that specifies where it should be stored. Unlike single product operations, bulk operations do not automatically infer the path from the URL. Missing `path` fields will return `400 Bad Request`.

The request body is an array of product objects ([max 50 products per request](/limits)). When all products are processed successfully, you'll receive a `200 OK` status. If there are validation errors, the API returns a `400 Bad Request` with an `errors` array containing details for each failed product.

#### Image processing behavior

Image processing is synchronous when you submit 10 or fewer products with 10 or fewer total images. For larger requests, images are queued for asynchronous background processing. When processed asynchronously, products initially point to the external URLs you provided in the request. After processing completes, image URLs are transformed to relative paths (e.g., `./media_{image-hash}.png`). External images are fetched, deduplicated via SHA-1 hashing, and stored in the media bus.

Learn more about [image handling](/schema-reference#productbusmedia) in the schema reference.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/catalog/*" \
  -X POST \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "sku": "bulk-001",
      "name": "Bulk Product 1",
      "path": "/us/en/products/bulk-product-1",
      "url": "https://www.example.com/us/en/products/bulk-product-1",
      "images": [
        { "url": "https://cdn.example.com/bulk-001.jpg", "label": "main" }
      ]
    },
    {
      "sku": "bulk-002",
      "name": "Bulk Product 2",
      "path": "/us/en/products/bulk-product-2",
      "url": "https://www.example.com/us/en/products/bulk-product-2",
      "images": [
        { "url": "https://cdn.example.com/bulk-002.jpg", "label": "main" }
      ]
    }
  ]'
```

### Get a product by path

`GET /{org}/sites/{site}/catalog{path}`

Authentication is not required for published data. The API returns the product object if found, or a `404 Not Found` if no product exists at the specified path.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/catalog/us/en/products/blender-pro-500.json"
```

### Delete a product

`DELETE /{org}/sites/{site}/catalog{path}`

This endpoint requires authentication. A successful deletion returns `204 No Content`. If the product doesn't exist at the specified path, you'll receive a `404 Not Found` response.

```bash
curl -X DELETE \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/catalog/us/en/products/blender-pro-500.json"
```

#### What happens when a product is deleted

When you delete a product, several systems are updated:

| System | Timing | Effect |
|--------|--------|--------|
| Product Bus storage | Immediate | Product data removed; `GET` requests return `404` |
| Product JSON endpoint | Immediate | Returns `404 Not Found` |
| HTML product page | Immediate | Returns `404 Not Found` |
| Product index | Asynchronous | Removed within 10 minutes |
| Merchant feed | Asynchronous | Removed within 10 minutes |
| Sitemap | Asynchronous | Removed when index updates |

The product is removed from storage immediately, so direct requests to the product's JSON or HTML endpoints will return `404` right away. However, the product index, merchant feed, and sitemap are updated asynchronously by the Product Indexer, which processes deletion events within its normal indexing cycle.

If you have [push invalidation](/caching#push-invalidation) enabled, the CDN cache for the deleted product is also purged, ensuring the `404` response propagates immediately. Without push invalidation, cached responses may persist until the CDN TTL expires.

## Authentication API

### Rotate API key

`POST /{org}/sites/{site}/auth/token`

This endpoint requires authentication with your current sitekey. On success, it returns a newly generated sitekey that replaces your current one.

```bash
curl -X POST \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/auth/token"
```

See also [Security best practices](/security) for API key management recommendations.

### Set explicit API key

`PUT /{org}/sites/{site}/auth/token`

This endpoint requires authentication with your current sitekey. Provide your desired key value in the request body as `{ "token": "new-key-value" }`. The API confirms the update on success.

```bash
curl -X PUT \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '{"token": "new-custom-key"}' \
  "https://api.adobecommerce.live/{org}/sites/{site}/auth/token"
```

## Index API

The Index API allows you to manage product indices, which are used by the Product Indexer to organize products into queryable collections. Before products can be indexed at a specific path, an index must be created at that path.

### Automatic index assignment

When you create or update a product, it is automatically added to an index based on its path. The system traverses up the directory tree from the product's location and adds the product to the first index it finds.

For example, a product at `/us/en/products/electronics/phone.json` would be checked against indexes in this order:
1. `/us/en/products/electronics/index.json`
2. `/us/en/products/index.json`
3. `/us/en/index.json`
4. `/us/index.json`
5. `/index.json`

The product is added to the first existing index in this sequence. This allows you to organize products into logical groupings by creating indexes at different levels of your path hierarchy. Products in `/us/en/products/electronics/` and `/us/en/products/clothing/` can share a single index at `/us/en/products/index.json`, or you can create separate indexes at each category level for more granular control.

If no index exists anywhere in the product's path hierarchy, the product is stored but not indexed until an appropriate index is created.

### Create an index

`POST /{org}/sites/{site}/index{path}`

Creates an empty index at the specified path. The path must end with `/index.json`. This endpoint requires authentication. On success, returns `201 Created`. If an index already exists at this path, returns `409 Conflict`.

When an index is created, any existing products under that path are automatically queued for indexing. This means you can create products first and set up indexing later - creating the index will backfill it with existing products.

```bash
curl -X POST \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/index/us/en/products/index.json"
```

### Delete an index

`DELETE /{org}/sites/{site}/index{path}`

Deletes the index at the specified path. This endpoint requires authentication. On success, returns `204 No Content`. If no index exists at the specified path, returns `404 Not Found`.

```bash
curl -X DELETE \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/index/us/en/products/index.json"
```

### List all indices

`GET /{org}/sites/{site}/index`

Returns a list of all indices for a site. On success, returns `200 OK` with the following response body:

```json
{
  "indices": [
    { "path": "/us/en/products/index.json", "lastModified": "2026-01-15T10:30:00Z" }
  ]
}
```

## Catalog API

### List all products

`GET /{org}/sites/{site}/catalog`

Returns all products for a site. Requires `catalog:read` permission. Results are paginated.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/catalog"
```

## Cache management API

`POST /{org}/sites/{site}/cache`

Triggers bulk CDN cache purges for a list of products. This is useful for manually invalidating cached product pages when needed.

**Request headers:**

| Header | Description |
|--------|-------------|
| `x-cache-api-key` | Authentication key for cache API access |

**Request body:**

```json
{
  "products": [
    { "sku": "sku-123", "path": "/us/en/products/blender-pro-500" }
  ]
}
```

On success, returns `200 OK`.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/cache" \
  -X POST \
  -H "x-cache-api-key: {your-cache-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      { "sku": "sku-123", "path": "/us/en/products/blender-pro-500" }
    ]
  }'
```

## Next steps

- [Schema Reference](/schema-reference#productbusentry): Detailed reference for all product data fields and structures
- [Data Ingestion Guide](/data-ingestion#etl-process-overview): Build ETL processes to load product data at scale
- [Limits and guidance](/limits): API limits and operational guidance
