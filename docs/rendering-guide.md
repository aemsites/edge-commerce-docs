---
title: "Product rendering guide"
description: "Render product data as HTML, JSON, indexes, feeds, and sitemaps."
daPath: "/rendering-guide"
status: "migrated"
managed: "true"
sourceFormat: "markdown"
sources:
  helix-commerce-api:
    version: "2.52.2"
    lastReviewedCommit: "b5639ec5767e8cb3ea0f9683dd3b895f84363f60"
    lastContentCommit: "8af300d"
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
    version: "v1.5.3"
    lastReviewedCommit: "6ea43b0"
    lastContentCommit: "6ea43b0"
  helix-product-image-collector:
    version: "v2.0.1"
    lastReviewedCommit: "853fc30"
    lastContentCommit: "853fc30"
migration:
  from: "helix-commerce-documentation/documentation/rendering-guide.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Product rendering guide

## Multiple output formats

The Product Pipeline renders product data into five distinct formats. Each format is accessed via a different URL pattern:

### 1. HTML pages
Server-rendered product pages with metadata and JSON-LD for SEO. Client-side JavaScript can enhance the Document Object Model (DOM) for interactivity.

```text
https://www.example.com/us/en/products/t1000-blender
```

### 2. JSON data
Complete product data in JSON format for JavaScript applications and mobile apps.

```text
https://www.example.com/us/en/products/t1000-blender.json
```

### 3. Product indexes
Searchable product catalog data optimized for frontend search, filtering, and catalog management with pagination support. The Product Indexer automatically maintains two specialized indices that update asynchronously when products change: a configurable product index for frontend applications, and a merchant feed compatible with Google Shopping for product advertising.

```text
https://www.example.com/us/en/index.json
https://www.example.com/us/en/index.json?limit=50&offset=0
```

The Product Index is highly customizable - you control exactly which product properties are extracted and indexed using your site's `public` config. Results are sorted deterministically by SKU for consistent pagination. The response includes `total`, `offset`, and `limit` fields.

For complete documentation on index configuration, property path syntax, access patterns, and troubleshooting, see the [Product Indexing Guide](/indexing).

### 4. Merchant feeds
Google Shopping-compatible feeds for product advertising. The Merchant Feed is automatically generated from Product Bus data without requiring configuration.

```text
https://www.example.com/us/en/merchant-center-feed.xml
```

The merchant feed is available at the same path as your product index, using `merchant-center-feed.xml` instead of `index.json`. For example, if your index is at `/us/en/index.json`, the corresponding merchant feed is at `/us/en/merchant-center-feed.xml`.

The feed extracts standard Google Merchant Center fields including title, description, price, images, and availability. You can submit the feed URL directly to Google Merchant Center for product advertising.

For complete documentation on merchant feed configuration, automatic field extraction, and Google Merchant Center integration, see the [Product Indexing Guide](/indexing#merchant-feed-configuration).

### 5. XML sitemaps

XML sitemaps help search engines discover and index your product catalog. The Product Pipeline reads product data from the Product Index and transforms it into the standard sitemap XML format.

```text
https://www.example.com/us/en/sitemap.xml
```

Like the merchant feed, the sitemap is available at the same path as your product index, using `sitemap.xml` instead of `index.json`. The sitemap includes all products from that index location.

#### Configuration

Sitemap generation is configured using the `productSitemapConfig` object in your site's `public.json` configuration:

```json
{
  "productSitemapConfig": {
    "lastmod": "YYYY-MM-DD",
    "extension": ".html"
  }
}
```

The `lastmod` option is a date format string for the `<lastmod>` element in sitemap entries. It uses [Day.js format tokens](https://day.js.org/docs/en/display/format). Common formats include `"YYYY-MM-DD"` for ISO date format (2025-12-01) and `"YYYY-MM-DDTHH:mm:ssZ"` for ISO datetime with timezone. If omitted, `<lastmod>` is not included in sitemap entries.

The `extension` option specifies a file extension to append to product URLs (e.g., `".html"`, `".htm"`). It is only applied to URLs that don't already have a file extension.

#### URL resolution logic

The sitemap includes all products from the Product Index, with URLs resolved using the `url` field from each product's Product Bus data. If a product doesn't have a `url` field, the sitemap falls back to constructing the URL from the product's `path` field. Products are only excluded from the sitemap if neither `url` nor `path` is present.

When the `extension` configuration is set, it is appended to product URLs that don't already have a file extension. For example, `/products/my-product` becomes `/products/my-product.html`, while `/products/my-product.html` and full URLs like `https://example.com/my-product` remain unchanged.

#### Filtering

Products are automatically excluded from the sitemap if they have `filters.noindex: true` in their Product Bus data. This allows you to mark certain products as non-indexable without removing them from your catalog.

#### Example sitemap output

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.example.com/us/en/products/t1000-blender</loc>
    <lastmod>2025-12-01</lastmod>
  </url>
  <url>
    <loc>https://www.example.com/us/en/products/premium-mixer</loc>
    <lastmod>2025-12-01</lastmod>
  </url>
</urlset>
```

#### Using the sitemap

Submit your sitemap URL directly to search engines. In Google Search Console, add the sitemap at Search Console → Sitemaps. In Bing Webmaster Tools, submit via the Sitemaps section. You can also reference the sitemap location in your robots.txt:
```text
Sitemap: https://www.example.com/us/en/sitemap.xml
```

## Data rendering locations

Product Bus properties are rendered in different parts of the HTML output:

### HTML `<head>` metadata

The following Product Bus fields are rendered in the HTML `<head>`:

| Element | Source |
|---------|--------|
| `<title>` | Uses `metaTitle` if provided, otherwise falls back to `name` |
| `<link rel="canonical">` | Uses `url` field |
| `<meta name="description">` | Uses `metaDescription` if provided, otherwise generates from first 160 characters of `description` with HTML stripped |
| `<meta name="sku">` | Product SKU |
| `<meta name="type">` | Product type (if provided) |

#### Open Graph tags

The `og:title` uses `metaTitle` or falls back to `name`. The `og:description` uses the same source as meta description. The `og:url` uses the `url` field, and `og:image` uses the first image from the `images` array.

#### Twitter Card tags

The `twitter:card` is set to "summary_large_image". The `twitter:title` uses `metaTitle` or falls back to `name`. The `twitter:description` uses the same source as meta description, and `twitter:image` uses the first image from the `images` array.

#### Custom metadata

Any properties in the `metadata` object are added as `<meta>` tags with the property name as the `name` attribute.

#### Hreflang alternate links

Metadata keys with the prefix `hreflang-` are rendered as `<link rel="alternate">` tags instead of `<meta>` tags. This is used to declare alternate-language or alternate-region versions of a product page for SEO.

```json
{
  "sku": "product-123",
  "metadata": {
    "hreflang-en-us": "https://www.example.com/us/en/products/product-abc",
    "hreflang-de": "https://www.example.com/de/products/product-abc",
    "hreflang-fr-fr": "https://www.example.com/fr/fr/products/product-abc",
    "hreflang-x-default": "https://www.example.com/us/en/products/product-abc"
  }
}
```

**Renders as:**
```html
<head>
  ...
  <link rel="alternate" hreflang="en-us" href="https://www.example.com/us/en/products/product-abc">
  <link rel="alternate" hreflang="de" href="https://www.example.com/de/products/product-abc">
  <link rel="alternate" hreflang="fr-fr" href="https://www.example.com/fr/fr/products/product-abc">
  <link rel="alternate" hreflang="x-default" href="https://www.example.com/us/en/products/product-abc">
  ...
</head>
```

The locale value is derived from the key suffix (the part after `hreflang-`), converted to lowercase with underscores replaced by hyphens. For example, `hreflang-en_US` and `hreflang-en-us` both produce `hreflang="en-us"`.

Use `hreflang-x-default` to designate the fallback URL for users whose language or region doesn't match any other hreflang entry. Search engines use `x-default` as a catch-all when no other locale is a match. Google recommends including it whenever you have multiple locale-specific URLs for the same product.

### JSON-LD structured data

A schema.org Product object is automatically generated and injected into `<head>` as `<script type="application/ld+json">`.

#### Product object

The generated Product object includes `@context` set to "https://schema.org", `@type` set to "Product", the product `sku`, `name` (using `name` if provided, otherwise `metaTitle`), `description` (using `metaDescription` if provided, otherwise `description` with HTML stripped), `gtin` code if provided, `url`, `brand` as a Brand object, `image` as an array of URLs from the `images` array, `offers` as an array of Offer objects, `custom` preserved as-is if provided, and `weight` as a schema.org `QuantitativeValue` when the product has a `weight` field.

The `weight` value uses UN/CEFACT unit codes: `kg`→`KGM`, `g`→`GRM`, `lb`→`LBR`, `oz`→`ONZ`. The original unit string is preserved in `unitText` for round-trip compatibility with the Product Bus schema.

#### Offer objects

If the product has `variants`, each variant becomes an Offer. If no variants, the product itself becomes a single Offer.

Each Offer includes `@type` set to "Offer", `sku`, `name`, `image` array, `priceCurrency` from `price.currency`, `price` from `price.final`, `availability` as a schema.org URL (e.g., "https://schema.org/InStock"), `itemCondition` as a schema.org URL if provided, `gtin` if provided, `url`, `options` if provided, and `shippingDetails` as a schema.org `OfferShippingDetails` when the product or variant carries a `shippingDimensions` object.

The `shippingDetails` object is structured per schema.org `OfferShippingDetails`, with `weight` from `shippingDimensions.weight` (same UN/CEFACT unit codes as the product weight), and `height`, `width`, and `depth` from the corresponding fields using dimension unit codes: `cm`→`CMT`, `mm`→`MMT`, `in`→`INH`. Variant offers inherit the parent product's `shippingDimensions` when they declare none of their own, satisfying Google's per-Offer shipping requirements.

A `priceSpecification` is added automatically when `price.final < price.regular` to indicate sale pricing:
```json
{
  "@type": "UnitPriceSpecification",
  "priceType": "https://schema.org/ListPrice",
  "price": "99.99",
  "priceCurrency": "USD"
}
```

The `custom` data is included for variant offers but excluded for simple product offers.

#### Custom override

For specialized requirements, provide your own JSON-LD in the `jsonld` field of the Product Bus entry, which will be used verbatim instead of auto-generation.

#### JSON-LD extensions

If you need to add properties to the auto-generated JSON-LD without replacing it entirely, use the `jsonldExtensions` field. Unlike `jsonld` (which overrides all auto-generation), `jsonldExtensions` merges additional properties into the generated output.

This field is available at both the product level and the variant level. At the product level, extensions are merged into the top-level Product object. At the variant level, extensions are merged into the corresponding Offer object.

```json
{
  "sku": "T1000",
  "name": "T1000 Blender",
  "jsonldExtensions": {
    "award": "Best Kitchen Appliance 2026",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "312"
    }
  },
  "variants": [
    {
      "sku": "T1000-RED",
      "name": "T1000 Blender - Red",
      "jsonldExtensions": {
        "color": "Red"
      }
    }
  ]
}
```

In this example, the auto-generated Product JSON-LD will include `award` and `aggregateRating` at the top level, and the Offer for the "T1000-RED" variant will include `color`. All standard auto-generated fields (name, description, offers, images, etc.) are preserved.

**Simple products (no variants):** For products without variants, `jsonldExtensions` at the product level merges into the top-level Product object only — it does not apply to the single auto-generated Offer. If you need to extend the Offer for a simple product, use the `jsonld` full-override field instead.

### HTML `<body>` content

The body is structured with the following rendering logic.

#### Main product section

The main section includes an `<h1>` with the product `name`. For price display, if `price.final < price.regular`, it shows `{final} ({regular})` with the regular price as strikethrough; otherwise it shows `{final}` only. The media gallery renders each image as an optimized picture element. If media has a `video` property, the image is shown with a video link below. Images use `url`, `label`, and `title` from each media object in the `images` array.

Before rendering, the pipeline transforms each image URL to incorporate the `filename` field. When a media entry has a `filename`, the URL `./media_{hash}.{ext}` becomes `./media_{hash}/{filename}.{ext}`. This applies to both product images and variant images. See [ProductBusMedia](/schema-reference#productbusmedia) for filename format requirements.

#### Product content section

The content section renders both the Product Bus `description` field and authored content from AEM Edge Delivery when available. The product description appears first, followed by any authored content. If the description contains HTML tags, it renders as an HTML fragment; if plain text, it wraps in a `<p>` tag. This allows merchandising teams to supplement product descriptions with rich editorial content. The content is wrapped in a `<div>` container.

#### Variants section

If variants exist, each variant is rendered as a separate `<div class="section">` with an `<h2>` containing the variant `name`, price display using the same logic as the main product, variant images rendered as optimized pictures if present, and data attributes for JavaScript hydration.

### Data attributes

Variant sections include programmatically generated data attributes for JavaScript hydration. The `data-sku` attribute is set to the variant's `sku` value. One `data-{option-id}` attribute is added per option in the variant's `options` array, where the option ID is slugified (lowercase, special chars removed) and the value is the option's `value` field (e.g., `data-color="red"`, `data-size="large"`). The `data-uid` attribute is set to the option's `uid` if present.

These attributes enable client-side JavaScript to identify and manipulate variants without parsing JSON.

### Custom fields

Properties in the `custom` object are preserved in the Product Bus data. They are not rendered in the HTML body by default but are included in the JSON-LD and accessible for client-side rendering.

Here is an [example](https://github.com/adobe-rnd/helix-product-pipeline/blob/main/test/fixtures/product/product-configurable.html) of the HTML generated for a product with multiple variants.

## Dual content sources

The Product Pipeline combines data from two sources:

### Product Bus (primary source)

The Product Bus provides authoritative commerce data including SKU, pricing, and inventory, as well as product variants and options, and media assets.

### AEM Edge Delivery (enrichment source)

AEM Edge Delivery provides rich product content authored in Google Docs, Microsoft Word, SharePoint, or DA (Document Authoring). This can include detailed product descriptions, editorial content, marketing messaging, custom blocks, and metadata overrides.

### How it works

The pipeline automatically attempts to load authored content from the content bus using the same path as the product. For example, a product URL like `https://www.example.com/us/en/products/t1000-blender` triggers a content bus lookup at `/us/en/products/t1000-blender`, loading the `.plain.html` rendition.

The pipeline combines both sources when rendering product pages. The Product Bus `description` field is rendered first, followed by any authored content from AEM Edge Delivery. This allows merchandising teams to supplement system-generated descriptions with rich editorial content without replacing them.

Additionally, the pipeline extracts metadata from authored content and merges it with Product Bus metadata. Authored metadata takes precedence, allowing content authors to override SEO titles, descriptions, and other metadata without changing the source product data.

### Authoring product content

To create authored content for a product:

1. **Create a document** in your content source (Google Docs, Microsoft Word, or SharePoint) at the same path as your product. For a product at `/us/en/products/t1000-blender`, create a document in your content folder at `us/en/products/t1000-blender`.

2. **Write your content** using standard AEM Edge Delivery authoring patterns. You can use headings, paragraphs, images, tables, and any blocks defined in your project.

3. **Preview and publish** the document through the AEM Sidekick. Once published, the content will be served from the content bus and automatically combined with your product data.

The authored content appears in the product content section of the rendered page, below the product name, price, and image gallery. Any AEM blocks you use in your document will be rendered according to your project's block definitions.

### When to use authored content

Use authored content when you need rich formatting beyond what the Product Bus `description` field supports, when you want to include AEM blocks (accordions, tabs, carousels, etc.) in your product pages, for seasonal or campaign-specific messaging that changes independently of product data, or for editorial content like buying guides, size charts, or detailed specifications that benefit from visual authoring.

### Edge content redirects

If the authored content in AEM Edge Delivery returns a 301 redirect (for example, because the document has been moved to a new location), the pipeline honors the redirect and returns the 301 response with the new `Location` header directly to the client. This allows content authors to manage URL changes through standard AEM Edge Delivery redirect rules without affecting Product Bus data.

### Edge content fallback

When a product URL is not found in the Product Bus (404), the pipeline checks whether authored content exists at the same path in AEM Edge Delivery. If it does, the pipeline serves the authored content directly as the response instead of returning a 404. This allows you to use standard AEM Edge Delivery pages at paths within your product URL space without requiring a Product Bus entry — useful for category landing pages, promotional pages, or other non-product content that lives alongside your product catalog.

## Catalog price rules

The pipeline supports catalog price rules — time-limited, path-scoped promotions that lower `price.final` on matching products before rendering. Rules are fetched from the pricing service and applied to HTML pages, JSON responses, and product indexes.

### How rules are applied

When the pipeline receives a request, it fetches the active catalog price rules for your site and evaluates them against the product being rendered. For each product, the best matching rule — the one with the lowest price — is selected and applied. For HTML and JSON responses, the rule lowers `price.final` on the product and on any matching variants; variant-specific prices can be set per SKU in the rule, and variants not listed inherit the parent product price if it is lower. For product indexes, the rule lowers the flat `price` field on each matching entry.

Rules are only applied if their `start`/`end` date range is active at request time. Conditional promotions — those that depend on cart contents such as a minimum subtotal or required products — are intentionally excluded during rendering and are evaluated at estimate and checkout time instead.

### Stage pricing

To preview how pricing rules look before activating them, send the `x-env: stage` request header. The pipeline will load rules from the staging pricing bucket instead of production. Responses served with stage pricing are not cached by the CDN.

## URL path structure

The Product Pipeline loads products directly from their URL paths in the Product Bus. No pattern configuration is needed - the URL path maps directly to the storage location.

### How it works

When a request comes in for `/us/en/products/t1000-blender`, the pipeline:
1. Receives the full URL path from the request
2. Loads the product from the Product Bus at `/us/en/products/t1000-blender`
3. Renders the product as HTML with metadata and JSON-LD

### Path organization

You can organize products using any URL path structure that makes sense for your site. Common patterns include regional/locale paths like `/us/en/products/blender` or `/ca/fr/produits/melangeur`, category paths like `/products/kitchen/blenders/blender-pro-500`, or flat paths like `/products/blender-pro-500`.

The path structure is determined when you create products through the Edge Commerce API. Whatever path you use in the API endpoint becomes the product's URL.

## Next steps

- [Product Indexing Guide](/indexing#product-indexing-configuration): Configure and optimize product indexes for search and feeds
- [AEM Network Configuration](/network#pattern-based-routing): Set up URL routing and backend configuration
- [Caching strategy](/caching): Cache TTLs, push invalidation, and update propagation
