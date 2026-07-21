---
title: "Product data ingestion guide"
description: "ETL patterns and data ingestion guidance for Product Bus."
daPath: "/data-ingestion"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "b5639ec"
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
  from: "helix-commerce-documentation/documentation/data-ingestion.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Product data ingestion guide

## Data ingestion and Extract, Transform, Load (ETL)

Before you can use the Product Bus, you need to transform your product data from your source systems into the Product Bus format. This requires building an ETL process.

### ETL process overview

1. Extract: Retrieve product data from your source systems (Product Information Management (PIM), Enterprise Resource Planning (ERP), Commerce platform, or other databases)
2. Transform: Convert your data format into the Product Bus schema (see [Schema Reference](/schema-reference#productbusentry) for complete reference)
3. Load: Send transformed data to the [Edge Commerce API via HTTP PUT requests](/api-reference#create-or-update-a-product)

### Your responsibility

You are responsible for building and maintaining the ETL process. Each organization has different source systems, data formats, and business requirements, so the ETL implementation is custom to your needs.

### Common ETL approaches

Common approaches include scheduled batch jobs for nightly or periodic sync of full catalog or changed products, event-driven updates for real-time sync triggered by product changes in source systems, and hybrid approaches that combine batch sync for full catalog with event-driven updates for real-time changes.

Event-driven updates are the most efficient approach for ongoing product synchronization. Syncing your entire catalog on a schedule when nothing has changed wastes computing resources, increases processing time, and contributes to unnecessary CO2 emissions. By only syncing products when they actually change in your source systems, you reduce environmental impact while improving sync performance and keeping your catalog up-to-date in real-time.

### ETL implementation considerations

#### Map your source data fields

[Map your source data fields to Product Bus schema fields](/schema-reference#productbusentry). Watch out for missing required fields like `sku`, `name`, and `path`, which cause API rejections. Avoid mapping the wrong source field to Product Bus fields. Don't use internal product codes instead of customer-facing SKUs. Don't ignore optional but important fields like `metaDescription` and `metaTitle` that affect SEO performance.

#### Handle data type conversions

Be careful with price formatting. Sending prices as strings (`"99.99"`) instead of properly formatted values is a common mistake. Also watch for inconsistent decimal precision for prices across products, which can cause display issues.

#### Manage product images

[Manage product images](/schema-reference#productbusmedia) using external URLs or pre-uploaded assets. Ensure all image URLs are publicly accessible from the internet, as internal CDN URLs that require authentication will fail. Handle missing images gracefully rather than sending null or broken URLs.

#### Transform pricing and variant data

Transform [pricing](/schema-reference#productbusprice), inventory, and [variant data](/schema-reference#productbusvariant). Currency codes must match ISO 4217 standards (use "USD" not "dollars"). Make sure to correctly distinguish between regular price and final/sale price, and verify that availability status accurately reflects inventory (avoid showing out-of-stock items as available).

#### Handle multi-store configurations

Handle [multi-language and multi-store configurations](/multi-store). Pay close attention to path structures, as incorrect store or locale codes in paths are a frequent source of issues. Create separate entries with correct paths for each store rather than duplicating products. Ensure language translations are consistent within each product (don't mix languages), and update product paths when your store structure changes.

#### Implement error handling

Implement [error handling and retry logic](/api-reference#error-handling). Never assume all requests succeeded. Always check HTTP status codes. Implement retry logic for temporary failures like network timeouts and rate limits. Log failed products with enough detail for debugging and recovery, and consider implementing a dead letter queue for products that consistently fail validation.

Once your ETL process is in place, you can begin ingesting products into the Product Bus.

## Verifying your ETL pipeline

Since the ETL process is entirely under your control, it's critical to validate that your implementation correctly transforms and loads product data. This section outlines verification steps to ensure data quality and catch common integration issues.

### Pre-production validation

Before deploying your ETL to production, verify each aspect of the transformation:

#### Schema compliance

Validate all required fields are present (`sku`, `name`, `path`). Verify data types match the schema (numbers for prices, strings for names, arrays for images). Check that image URLs are absolute and publicly accessible, and confirm currency codes follow [ISO 4217](https://www.iso.org/iso-4217-currency-codes.html) standards.

#### Field mapping accuracy

Compare source data with Product Bus output for a sample of products. Verify prices, descriptions, and attributes map to correct fields. Check that HTML content renders correctly (no escaped entities, proper markup), and ensure variant relationships are preserved (parent-child SKU linkage).

#### Image handling

Verify all image URLs are publicly accessible via HTTP `GET`. Test with products that have missing images to ensure graceful handling, and confirm HTTPS is used for all image URLs.

#### Multi-store and localization

Verify path structure matches your store and locale hierarchy. Check that localized content uses the correct language for each store view, ensure products don't accidentally duplicate across stores, and test with store/locale combinations that have special characters in paths.

### Production monitoring

After deploying your ETL, continuously monitor for data quality issues.

**API response monitoring:** Track HTTP status codes for all API requests and set up alerts for elevated error rates (400, 401, 403, 404, 500 responses). Log failed requests with full request/response bodies for debugging, and monitor API latency to detect performance degradation.

**Data quality checks:** Randomly sample products via the API and verify field accuracy. Check that product updates flow through within expected timeframes, verify that deleted products are removed from the Product Bus, and monitor for duplicate SKUs across different paths.

**Index verification:** Confirm products appear in the product index within 10 minutes of creation. Verify indexed fields match your `productIndexerConfig` mapping, check that products with `"robots": "noindex"` are excluded from the index, and monitor sitemap generation for completeness.

**End-to-end testing:** Periodically test the full flow from source system through ETL to Product Bus to rendered page. Verify rendered HTML includes correct metadata and JSON-LD structured data, check that product pages render correctly on staging and production domains, and test that cache invalidation works when products are updated.

### Common validation tools

**API testing:**
```bash
# Verify product was created correctly
curl -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/catalog/{store}/{locale}/products/{product-path}.json"

# Check product appears in index
curl "https://main--{site}--{org}.aem.network/{store}/{locale}/index.json" | grep "{sku}"
```

Build a script that fetches a sample of products from your source system, runs them through your ETL transformation, sends them to the Edge Commerce API via POST/PUT, then verifies via GET request that stored data matches expected output. Run this validation daily or after every ETL deployment.

Test bulk operations with realistic product counts and verify your ETL respects the 50 products per request limit. Monitor memory usage and processing time for large batches, and test retry logic by intentionally triggering rate limits. Load test at realistic intervals and rates, so you don't waste resources or exceed quotas. Overzealous testing can lead to unnecessary costs and quota violations.

By implementing these verification steps, you can catch integration issues early and maintain high data quality throughout the product lifecycle.

## Next steps

- [Getting Started](/getting-started#your-first-product-ingestion): Quick example of creating your first product
- [Limits and guidance](/limits): Bulk operation limits and operational guidance
- [Schema Reference](/schema-reference#productbusentry): Detailed reference for the target Product Bus schema
- [API Reference](/api-reference#bulk-create-or-update-products): API endpoints and methods for loading product data
