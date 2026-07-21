---
title: "Getting started with Edge Commerce"
description: "Set up Edge Commerce and ingest the first product."
daPath: "/getting-started"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "2731b0a"
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
  from: "helix-commerce-documentation/documentation/getting-started.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Getting started with Edge Commerce

Edge Commerce stores product data from commerce systems, Product Information Management (PIM) platforms, and other sources in a unified format. This guide walks through setting up your first product and configuring the routing needed to render product pages.

## Prerequisites

To use Edge Commerce, you'll need:

1. **API access**: An admin session or [service token](/authentication/service-tokens) with the permissions needed for ingestion and configuration.
2. **Org/site identifiers**: Your organization and site names in the Edge Delivery Services structure.
3. **Product path structure**: A plan for how you'll organize products in your catalog, such as `/us/en/products/...` or `/products/...`.

## Set up API access

For initial setup, work with your Adobe representative to enable access for your org and site. After access is configured, use an authenticated admin session for one-time setup and create [service tokens](/authentication/service-tokens) for recurring automation such as catalog ingestion.

For token types, permissions, and role behavior, see [Authentication overview](/authentication/overview), [Roles and permissions](/authentication/roles-permissions), and [Service tokens](/authentication/service-tokens).

## Your first product ingestion

### Step 1: Configure routing

Before creating products, you need to configure the AEM Network to route product URLs to the Product Pipeline backend.

Configure URL routing in your site's `public.json`:

```bash
curl --request POST \
  --url https://admin.hlx.page/config/{org}/sites/{site}/public.json \
  --header 'Content-Type: application/json' \
  --data '{
    "mixerConfig": {
        "patterns": {
            "/us/en/products/*": "adobe_productbus"
        },
        "backends": {
            "adobe_productbus": {
                "origin": "pipeline-cloudflare.adobecommerce.live",
                "pathPrefix": "/{org}/{site}/main/"
            }
        }
    }
}'
```

When you submit this request, the API will return the updated configuration object with a 200 status code. If you encounter a 401 Unauthorized error, check that your authorization token is valid. A 403 Forbidden response means you need to verify you have access to the specified org and site. If you see a 404 Not Found error, double-check that the org and site names in the URL are correct.

#### What this configuration does

This configuration tells the AEM Network how to handle your product URLs. The `patterns` section routes any URL matching `/us/en/products/*` to the product backend. The `backends` section then defines where that backend lives and sets up the path prefix. Replace `{org}` and `{site}` with your actual values.

For more details about URL pattern configuration, see the [AEM Network Configuration Reference](/network#pattern-based-routing).

When a request arrives at `https://www.example.com/us/en/products/blender-pro-500`, the AEM Network matches the pattern `/us/en/products/*` and routes to the Product Pipeline backend. The Pipeline loads the product data at `/us/en/products/blender-pro-500` and renders it as HTML with metadata and JSON-LD.

With routing configured, product URLs are directed to the Product Pipeline for rendering.

### Step 2: Create a simple product

With routing configured, you can now store your first product. This example creates a basic product with required fields like SKU (Stock Keeping Unit), name, price, and images.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/catalog/us/en/products/test-product.json" \
  -X PUT \
  -H "Authorization: Bearer {your-admin-or-service-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "test-sku",
    "name": "Test Product",
    "path": "/us/en/products/test-product",
    "url": "https://www.example.com/us/en/products/test-product",
    "description": "A test product with <strong>HTML support</strong>",
    "brand": "test-brand",
    "price": {
      "currency": "USD",
      "regular": "99.99",
      "final": "79.99"
    },
    "images": [
      {
        "url": "https://cdn.example.com/images/test-product.jpg"
      }
    ]
  }'
```
When the request succeeds, you'll receive a `201 Created` status along with the complete product object. The response will include any fields that were automatically populated by the system during creation.

If something goes wrong, you might encounter a `400 Bad Request` error, which typically means that some required fields are missing or improperly formatted. Double-check your JSON structure and ensure all mandatory fields are present. A `401 Unauthorized` error indicates that your API key isn't valid, so you'll want to verify that you're using the correct key.

### Step 3: Verify the product was created

Retrieve the product you just created to confirm it was stored correctly.

```bash
curl -H "Authorization: Bearer {your-admin-or-service-token}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/catalog/us/en/products/test-product.json"
```
If the product was created successfully, you'll receive a `200 OK` status code along with the full product object that matches what you created in Step 2. If you see a `404 Not Found` error instead, double-check that the product path in your request matches exactly what you used when creating the product in Step 2.

### Step 4: View the rendered HTML

With the product stored and routing configured, you can now view the rendered product page in your browser. The Product Pipeline fetches the product data and renders it as HTML with structured data for search engines.

```text
https://main--{site}--{org}.aem.network/us/en/products/test-product
```

You will see an HTML page with the product information, including metadata in the document head and JSON-LD structured data for SEO. The Product Pipeline loads the product data and renders it server-side.

## Next steps

- [Rendering Guide](/rendering-guide#multiple-output-formats): Learn how products are rendered in different formats
- [Product Indexing Guide](/indexing#product-indexing-configuration): Configure and optimize product indexing
- [API Reference](/api-reference#product-operations): Explore all available API endpoints and operations
- [Schema Reference](/schema-reference#productbusentry): Detailed documentation of all product data fields

| Pagination (Contained) |                |
|------------------------|----------------|
| :icon-arrow: Previous <br> [Overview](/overview)                       | Up Next :icon-arrow:<br>[Data ingestion guide](/data-ingestion) |
