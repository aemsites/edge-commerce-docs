---
title: "Getting Started with Product Bus"
description: "Set up Product Bus and ingest the first product."
daPath: "/docs/getting-started"
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
  from: "helix-commerce-documentation/documentation/getting-started.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Getting Started with Product Bus

The Product Bus is a centralized storage layer that holds product data from commerce systems, Product Information Management (PIM) platforms, and other sources in a unified format. This guide walks through setting up your first product and configuring the routing needed to render product pages.

## Prerequisites

To use the Product Bus, you'll need:
1. **API Key (sitekey)**: Provides access to the Helix Commerce API for ingestion and data retrieval
2. **Org/Site identifiers**: Your organization and site names in the Edge Delivery Services structure
3. **Product path structure**: A plan for how you'll organize products in your catalog (e.g., `/us/en/products/...`, `/products/...`, etc.)

## Obtain an API key

Each site requires a unique API key (sitekey) that provides access to an org/site pair. The sitekey can be used to ingest and fetch data from any store and view within that org/site.

To obtain a sitekey for initial setup, reach out to the Adobe team on Slack or contact your Adobe representative.

Once you have a sitekey, you can manage it (rotate, set) using the Authentication API endpoints described in the [Product Bus API Reference](/docs/api-reference#authentication-api).

## Your first product ingestion

### Step 1: Configure routing

Before creating products, you need to configure the AEM Network to route product URLs to the Product Pipeline backend.

Configure the `mixerConfig` in your site's `public.json`:

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

This configuration tells the AEM Network how to handle your product URLs. The `patterns` section routes any URL matching `/us/en/products/*` to the `adobe_productbus` backend. The `backends` section then defines where that backend lives (the Product Pipeline origin) and sets up the path prefix (remember to replace `{org}` and `{site}` with your actual values).

For more details about URL pattern configuration, see the [AEM Network Configuration Reference](/docs/network#pattern-based-routing).

When a request arrives at `https://www.example.com/us/en/products/blender-pro-500`, the AEM Network matches the pattern `/us/en/products/*` and routes to the Product Pipeline backend. The Pipeline loads the product from Product Bus at `/us/en/products/blender-pro-500` and renders it as HTML with metadata and JSON-LD.

With routing configured, `aem.network` now directs product URLs to the Product Pipeline for rendering.

### Step 2: Create a simple product

With routing configured, you can now store your first product in the Product Bus. This example creates a basic product with required fields like SKU (Stock Keeping Unit), name, price, and images.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/catalog/us/en/products/test-product.json" \
  -X PUT \
  -H "Authorization: Bearer {your-api-key}" \
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

Retrieve the product you just created to confirm it was stored correctly in the Product Bus.

```bash
curl -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/catalog/us/en/products/test-product.json"
```
If the product was created successfully, you'll receive a `200 OK` status code along with the full product object that matches what you created in Step 2. If you see a `404 Not Found` error instead, double-check that the product path in your request matches exactly what you used when creating the product in Step 2.

### Step 4: View the rendered HTML

With the product stored and routing configured, you can now view the rendered product page in your browser. The Product Pipeline fetches the product data and renders it as HTML with structured data for search engines.

```text
https://main--{site}--{org}.aem.network/us/en/products/test-product
```

You will see an HTML page with the product information, including metadata in the document head and JSON-LD structured data for SEO. The Product Pipeline loads the product from the Product Bus and renders it server-side.

## Next steps

- [Rendering Guide](/docs/rendering-guide#multiple-output-formats): Learn how products are rendered in different formats
- [Product Indexing Guide](/docs/indexing#product-indexing-configuration): Configure and optimize product indexing
- [API Reference](/docs/api-reference#product-operations): Explore all available API endpoints and operations
- [Schema Reference](/docs/schema-reference#productbusentry): Detailed documentation of all product data fields

| Pagination (Contained) |                |
|------------------------|----------------|
| :icon-arrow: Previous <br> [Product Bus Overview](/docs/overview)                       | Up Next :icon-arrow:<br>[Data ingestion guide](/docs/data-ingestion) |
