---
title: "Product Bus Documentation"
description: "Navigation and reading paths for Edge Delivery Commerce documentation."
daPath: "/"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.2.0"
    lastReviewedCommit: "033d0db"
    lastContentCommit: "033d0db"
  helix-mixer:
    version: "v1.6.1"
    lastReviewedCommit: "b8acff4"
    lastContentCommit: "b8acff4"
  helix-product-pipeline:
    version: "v2.0.2"
    lastReviewedCommit: "886ff7e"
    lastContentCommit: "886ff7e"
  helix-product-indexer:
    version: "v2.0.0"
    lastReviewedCommit: "0f431bb"
    lastContentCommit: "0f431bb"
  helix-product-indexer-pump:
    version: "v2.0.0"
    lastReviewedCommit: "fa67dda"
    lastContentCommit: "fa67dda"
  helix-product-shared:
    version: "v1.5.1"
    lastReviewedCommit: "53f1058"
    lastContentCommit: "53f1058"
  helix-product-image-collector:
    version: "v2.0.0"
    lastReviewedCommit: "cdec04b"
    lastContentCommit: "cdec04b"
migration:
  from: "helix-commerce-documentation/documentation/README.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Product Bus Documentation

Welcome to the Product Bus documentation. This collection of guides provides information about the Helix Commerce ecosystem, from getting started to advanced configuration and best practices.

## Documentation overview

### Core documentation

**[Overview](/overview)** - Edge Delivery Commerce Overview
- System architecture and key components
- Data flow explanation
- Introduction to Product Bus, Commerce API, Product Pipeline, Product Indexer, and Helix Mixer

**[Getting Started](/getting-started)** - Getting Started with Product Bus
- Prerequisites and obtaining an API key
- Your first product ingestion (4-step walkthrough)
- URL pattern and mixer configuration
- Product indexing setup

**[API Reference](/api-reference)** - Product Bus API Reference
- Path-based product storage
- Complete API endpoint documentation
- Product CRUD operations
- Authentication and cache management APIs
- Error response formats

**[Schema Reference](/schema-reference)** - Product Bus Schema Reference
- ProductBusEntry (main product schema)
- ProductBusVariant (variant schema)
- ProductBusPrice, ProductBusMedia, ProductBusOption
- AggregateRating (reviews and ratings)
- Field descriptions, types, and validation rules

### Specialized guides

**[Data Ingestion Guide](/data-ingestion)** - Product Data Ingestion Guide
- ETL process overview and best practices
- Common ETL approaches (batch, event-driven, hybrid)
- Path-based storage and URL considerations
- ETL implementation considerations

**[Rendering Guide](/rendering-guide)** - Product Rendering Guide
- Five output formats: HTML, JSON, indexes, merchant feeds, sitemaps
- Data rendering locations (head metadata, JSON-LD, body content)
- Dual content sources (Product Bus + AEM Edge Delivery)
- URL pattern configuration
- Multi-CDN caching strategy

**[Product Indexing Guide](/indexing)** - Product Indexing Guide
- Product Index configuration and property mapping
- Merchant Feed automatic generation
- Index access patterns and endpoints
- Performance optimization and troubleshooting

**[AEM Network Configuration](/network)** - AEM Network Configuration Guide
- Pattern-based routing with glob patterns
- Backend configuration options
- Performance optimizations (resource inlining)
- Common use cases and URL structure

**[Promotions guide](/promotions)** - Promotions Guide
- Catalog promotions: product-level price overrides with date ranges and variant-specific pricing
- Conditional promotions: free-product grants evaluated at cart time
- Cart rules: automatic checkout discounts (percentage, fixed, free shipping)
- Stacking, priority, and country scoping

**[Coupons guide](/coupons)** - Coupons Guide
- Coupon types: discount templates with eligibility and restriction rules
- Coupon codes: individual redemption codes with usage limits and expiry
- Batch code generation
- Validation flow and error codes
- Stacking behavior and usage tracking

**Operations** - Operational guidance and best practices
- [Limits and guidance](/limits): Bulk operation limits and product data limits
- [Multi-store configuration](/multi-store): Store and locale structure
- [Caching strategy](/caching): Cache TTLs, push invalidation, and update propagation
- [Image processing](/image-processing): How external images are fetched and stored
- [Security best practices](/security): API key management and data validation
- [Custom data and extensions](/custom-data): Extending product data with custom fields

## Suggested reading order

### For first-time users

1. **[Overview](/overview)** - Understand the ecosystem and architecture
2. **[Getting Started](/getting-started)** - Set up your first product
3. **[Schema Reference](/schema-reference)** - Learn the data structure
4. **[API Reference](/api-reference)** - Explore available operations

### For developers building ETL

1. **[Data Ingestion Guide](/data-ingestion)** - ETL process and considerations
2. **[Schema Reference](/schema-reference)** - Required data structures
3. **[API Reference](/api-reference)** - API endpoints for data loading
4. **[Limits and guidance](/limits)** - Bulk operation limits and best practices

### For frontend developers

1. **[Rendering Guide](/rendering-guide)** - How products are rendered
2. **[Product Indexing Guide](/indexing)** - Search and catalog data
3. **[Schema Reference](/schema-reference)** - Available product fields
4. **[Mixer Configuration](/network)** - URL routing configuration

### For system administrators

1. **[Overview](/overview)** - System architecture
2. **[Mixer Configuration](/network)** - Traffic routing
3. **[Rendering Guide](/rendering-guide)** - Caching strategy
4. **[Security best practices](/security)** - API key management and data validation

## Additional resources

**Documentation:**
- [Helix Commerce API README](https://github.com/adobe-rnd/helix-commerce-api)
- [Product Pipeline README](https://github.com/adobe-rnd/helix-product-pipeline)
- [Helix Mixer README](https://github.com/adobe-rnd/helix-mixer)

**Code Repositories:**
- [helix-commerce-api](https://github.com/adobe-rnd/helix-commerce-api) - API implementation
- [helix-product-pipeline](https://github.com/adobe-rnd/helix-product-pipeline) - Rendering engine
- [helix-mixer](https://github.com/adobe-rnd/helix-mixer) - Routing layer
- [helix-product-pipeline-worker](https://github.com/adobe-rnd/helix-product-pipeline-worker) - Pipeline runtime service

**Support:**
- Issues: Submit to respective GitHub repositories
- Adobe Team: Contact via Slack or your Adobe representative
- Community: Edge Delivery Services community channels

**License:**
Apache License 2.0 - See [LICENSE](http://www.apache.org/licenses/LICENSE-2.0)

---

*Last Updated: 2026-03-02*
