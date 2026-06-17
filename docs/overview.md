---
title: "Edge Delivery Commerce"
description: "Overview of Edge Delivery Commerce components and data flow."
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

# Edge Delivery Commerce

## Overview

Edge Delivery Commerce provides a solution for managing and delivering product data from any commerce system or Product Information Management (PIM) to Edge Delivery Services. It consists of four services that work together to transform product data into SEO-optimized web experiences. Through automated Extract, Transform, Load (ETL) processes, asynchronous indexing, and caching, product changes flow from your PIM or commerce platform to customer-facing pages with minimal latency.

### System architecture

The architecture consists of five main components: the Product Bus (central storage), Helix Commerce API (data management), Product Pipeline (rendering engine), Product Indexer (search and feeds), and AEM Network (request routing). Your commerce infrastructure connects through customer-built ETL processes, while the Network directs incoming requests to either Edge Delivery content or Product Pipeline based on URL patterns. The Product Indexer runs asynchronously to generate searchable indexes and merchant feeds from stored product data. 

### Key components

#### Product Bus (storage layer)

The Product Bus serves as the central storage layer, containing product data from one or more sources such as PIM systems, Enterprise Resource Planning (ERP) platforms, and commerce backends, aggregated into a single [unified data model](/schema-reference#productbusentry). It provides low-latency retrieval with global availability, while rendered content is cached globally via the customers CDN for optimal performance.

Learn more: [Getting Started](/getting-started#your-first-product-ingestion) | [Schema Reference](/schema-reference#productbusentry)

#### Helix Commerce API (management layer)

The Helix Commerce API is a REST API that provides globally available, low-latency access to product data. It handles all [product Create, Read, Update, Delete (CRUD) operations](/api-reference#product-operations), [bulk updates](/api-reference#bulk-create-or-update-products), and [cache management](/api-reference#cache-management-api), while also managing [authentication](/api-reference#authentication-api), validation, and asynchronous image processing to ensure data integrity and performance.

Learn more: [Data Ingestion Guide](/data-ingestion#etl-process-overview) | [API Reference](/api-reference#product-operations)

#### Product Pipeline (rendering layer)

The Product Pipeline transforms product data into [multiple output formats](/rendering-guide#multiple-output-formats) including HTML pages, JSON data, product indexes, merchant feeds, and XML sitemaps. It uses a [dual-source model](/rendering-guide#dual-content-sources) that blends Product Bus data with optional authored Edge Delivery content, rendering server-side for SEO and Large Language Model (LLM) crawler performance.

Learn more: [Rendering Guide](/rendering-guide#multiple-output-formats) | [URL Pattern Configuration](/rendering-guide#url-pattern-configuration)

#### Product Indexer (search & feed layer)

The Product Indexer automatically builds and updates product indices asynchronously after Product Bus changes. It produces three outputs: a [configurable index](/indexing#product-indexing-configuration) for frontend search and filtering, a product sitemap and a Google Shopping compatible [Merchant Feed](/indexing#merchant-feed-configuration) for advertising.

Learn more: [Product Indexing Guide](/indexing#product-indexing-configuration) | [Index Access Patterns](/indexing#index-access-patterns)

#### Network (routing layer)

The AEM Network is a reverse proxy that provides [pattern-based URL routing](/network#pattern-based-routing) to direct requests to different backends. The Network is entirely [configuration-driven](/network#backend-configuration), allowing routing updates without requiring any code deployments.

Learn more: [Common Use Cases](/network#common-use-cases) | [AEM Network Configuration](/network#pattern-based-routing)

### Data flow

Product data originates in your commerce infrastructure (PIM systems, ERP platforms, or commerce backends). A customer-built ETL process pulls this data, transforms it into the required format, and sends it through the Helix Commerce API to the Product Bus for storage. The API queues each product update for indexing, triggering an asynchronous process that builds the searchable Product Index and generates Google Shopping-compatible Merchant Feeds.

When a user requests a product page, their request first hits your CDN. The AEM Network examines the URL pattern and routes the request to the appropriate backend: Edge Delivery Services for content pages, or the Product Pipeline for product pages. The Pipeline fetches the product data from the Product Bus and optionally overlays authored AEM content before rendering the final output. This rendered response is cached at your CDN with specific cache keys, enabling selective invalidation when product data changes. Any product update sent through the Commerce API automatically triggers cache invalidation for affected pages, ensuring customers always see current product information.

## Next steps

- [Getting Started with Product Bus](/getting-started): Learn how to set up and create your first product
- [API Reference](/api-reference): Complete API documentation for product operations
- [Schema Reference](/schema-reference): Detailed schema documentation for all product data structures

| Pagination (Contained) |                |
|------------------------|----------------|
|                        | Up Next :icon-arrow:<br>[Getting Started with Product Bus](/getting-started) |
