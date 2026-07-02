---
title: "Edge Commerce overview"
description: "Overview of Edge Commerce components and data flow."
daPath: "/overview"
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
  from: "helix-commerce-documentation/documentation/overview.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Edge Commerce overview

Edge Commerce manages and delivers product data from commerce systems, Product Information Management (PIM) platforms, and other sources to Edge Delivery Services storefronts. Its services work together to transform product data into product pages, search indexes, feeds, checkout flows, and customer-facing API responses. Through Extract, Transform, Load (ETL) processes, indexing, and caching, product changes flow from your source systems to customer-facing experiences with minimal latency.

### System architecture

The architecture consists of five main components: product data storage, the Edge Commerce API, Product Pipeline, Product Indexer, and AEM Network. Your commerce infrastructure connects through customer-built ETL processes, while the Network directs incoming requests to either Edge Delivery content or Product Pipeline based on URL patterns. The Product Indexer generates searchable indexes and merchant feeds from stored product data.

### Key components

#### Product data storage

Product data storage contains product data from one or more sources such as PIM systems, Enterprise Resource Planning (ERP) platforms, and commerce backends, aggregated into a single [unified data model](/schema-reference#productbusentry). It provides low-latency retrieval for API and rendering flows, while rendered content is cached by the customer's CDN.

Learn more: [Getting Started](/getting-started#your-first-product-ingestion) | [Schema Reference](/schema-reference#productbusentry)

#### Edge Commerce API

The Edge Commerce API is a REST API for product data, checkout, customer data, configuration, and operations. It handles [product Create, Read, Update, Delete (CRUD) operations](/api-reference#product-operations), [bulk updates](/api-reference#bulk-create-or-update-products), [cache management](/api-reference#cache-management-api), [authentication](/authentication/overview), validation, and checkout operations.

Learn more: [Data Ingestion Guide](/data-ingestion#etl-process-overview) | [API Reference](/api-reference#product-operations)

#### Product Pipeline (rendering layer)

The Product Pipeline transforms product data into [multiple output formats](/rendering-guide#multiple-output-formats) including HTML pages, JSON data, product indexes, merchant feeds, and XML sitemaps. It uses a [dual-source model](/rendering-guide#dual-content-sources) that blends product data with optional authored Edge Delivery content, rendering server-side for SEO and Large Language Model (LLM) crawler performance.

Learn more: [Rendering Guide](/rendering-guide#multiple-output-formats) | [URL Pattern Configuration](/rendering-guide#url-pattern-configuration)

#### Product Indexer (search & feed layer)

The Product Indexer builds and updates product indices after product data changes. It produces three outputs: a [configurable index](/indexing#product-indexing-configuration) for frontend search and filtering, a product sitemap, and a Google Shopping compatible [Merchant Feed](/indexing#merchant-feed-configuration) for advertising.

Learn more: [Product Indexing Guide](/indexing#product-indexing-configuration) | [Index Access Patterns](/indexing#index-access-patterns)

#### Network (routing layer)

The AEM Network is a reverse proxy that provides [pattern-based URL routing](/network#pattern-based-routing) to direct requests to different backends. The Network is entirely [configuration-driven](/network#backend-configuration), allowing routing updates without requiring any code deployments.

Learn more: [Common Use Cases](/network#common-use-cases) | [AEM Network Configuration](/network#pattern-based-routing)

### Data flow

Product data originates in your commerce infrastructure, such as PIM systems, ERP platforms, or commerce backends. A customer-built ETL process pulls this data, transforms it into the required format, and sends it through the Edge Commerce API for storage. The API queues each product update for indexing, which builds the searchable Product Index and generates Google Shopping-compatible Merchant Feeds.

When a user requests a product page, their request first reaches your CDN. The AEM Network examines the URL pattern and routes the request to the appropriate backend: Edge Delivery Services for content pages, or the Product Pipeline for product pages. The Pipeline fetches the product data and optionally overlays authored AEM content before rendering the final output. This rendered response is cached at your CDN with specific cache keys, enabling selective invalidation when product data changes. Product updates sent through the Edge Commerce API automatically trigger cache invalidation for affected pages.

## Next steps

- [Getting started](/getting-started): Learn how to set up and create your first product
- [API reference](/api-reference): Complete API documentation for product and checkout operations
- [Schema reference](/schema-reference): Detailed schema documentation for product, order, and address structures

| Pagination (Contained) |                |
|------------------------|----------------|
|                        | Up Next :icon-arrow:<br>[Getting started](/getting-started) |
