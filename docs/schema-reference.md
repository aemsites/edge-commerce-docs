---
title: "Product Bus schema reference"
description: "Reference for the Product Bus product schema."
daPath: "/docs/schema-reference"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.7.2"
    lastReviewedCommit: "8af300d"
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
    version: "v1.7.0"
    lastReviewedCommit: "afa6c86"
    lastContentCommit: "afa6c86"
  helix-product-image-collector:
    version: "v2.0.1"
    lastReviewedCommit: "853fc30"
    lastContentCommit: "853fc30"
migration:
  from: "helix-commerce-documentation/documentation/schema-reference.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Product Bus schema reference

## ProductBusEntry

The main product schema supports rich product data with HTML content, variants, and custom fields.

### Core fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sku` | string | ✅ Yes | Unique product identifier (SKU) |
| `name` | string | ✅ Yes | Display name for the product |
| `path` | string | ✅ Yes | Product URL path (e.g., "/products/blender-pro-500") |
| `description` | string | No | Full product description (HTML supported) |
| `metaTitle` | string | No | SEO title tag content |
| `metaDescription` | string | No | SEO meta description |
| `gtin` | string | No | Barcode/Global Trade Item Number (GTIN) |
| `url` | string | No | Canonical product page URL |
| `brand` | string | No | Brand or manufacturer name |
| `type` | string | No | Product type classification |
| `availability` | enum | No | Stock status (see [SchemaOrgAvailability](#schemaorgavailability)) |
| `itemCondition` | enum | No | Condition (see [SchemaOrgItemCondition](#schemaorgitemcondition)) |
| `price` | object | No | Pricing info (see [ProductBusPrice](#productbusprice)) |
| `metadata` | object | No | Generic metadata map (string values only) - rendered as `<meta>` tags in HTML |
| `options` | array | No | Configurable options (see [ProductBusOption](#productbusoption)) |
| `aggregateRating` | object | No | Reviews/ratings (see [AggregateRating](#aggregaterating)) |
| `images` | array | No | Media gallery (see [ProductBusMedia](#productbusmedia)) |
| `variants` | array | No | Product variants (see [ProductBusVariant](#productbusvariant)) |
| `jsonld` | string | No | Custom schema.org JSON-LD override (max 128,000 chars). Replaces auto-generated JSON-LD entirely |
| `jsonldExtensions` | object | No | Additional schema.org properties shallow-merged into the auto-generated Product JSON-LD (max 32,000 chars when serialized). Ignored when `jsonld` is used |
| `urlKey` | string | No | Human-readable product identifier for URL generation |
| `availabilityDate` | string | No | Date when product becomes available |
| `feeds` | object | No | Feed configuration for product distribution |
| `feeds.common` | object | No | Common feed settings |
| `feeds.common.geoTargetCountries` | string[] | No | Target countries for product feeds |
| `feeds.common.geoStoreCountry` | string | No | Store country for feed generation |
| `feeds.oai` | object | No | Platform-specific feed eligibility |
| `feeds.oai.isEligibleForSearch` | boolean | No | Whether product appears in search feeds |
| `feeds.oai.isEligibleForCheckout` | boolean | No | Whether product supports checkout via feeds |
| `weight` | object | No | Product weight for JSON-LD structured data (see [ProductBusWeight](#productbusweight)) |
| `shipping` | string \| object \| array | No | Shipping information for Google Merchant Center feed |
| `shippingDimensions` | object | No | Product shipping dimensions emitted as `Offer.shippingDetails` in JSON-LD (see [ShippingDimensions](#shippingdimensions)) |
| `custom` | object | No | Custom data bag (not indexed, preserved in responses) |

### URL field and sitemap generation

The `url` field controls how product URLs appear in XML sitemaps. When `url` is present, it is used directly in the sitemap (highest priority). When `url` is absent, URLs are constructed from the product's `path` field.

This gives you control over exact URLs when needed, such as for products with custom routing or special URL requirements. See the [Rendering Guide](/docs/rendering-guide#xml-sitemaps-for-seo) for more details on sitemap URL resolution.

### HTML support

The `description` field supports full HTML for rich product descriptions. Variant `description` fields also support full HTML for variant-specific descriptions.

### Metadata rendering

The `metadata` object allows you to add custom meta tags to the product page HTML. Each key-value pair in the metadata object is rendered as a `<meta>` tag in the page `<head>`.
```json
{
  "sku": "product-123",
  "name": "Example Product",
  "metadata": {
    "color": "blue",
    "material": "cotton",
    "care-instructions": "machine-wash-cold"
  }
}
```

**Renders as:**
```html
<head>
  ...
  <meta name="color" content="blue">
  <meta name="material" content="cotton">
  <meta name="care-instructions" content="machine-wash-cold">
  ...
</head>
```

See the [Rendering Guide](/docs/rendering-guide#custom-metadata) for more details on how metadata is rendered in HTML output.

### Custom JSON-LD override

The `jsonld` field allows you to provide custom schema.org structured data that will be injected verbatim into the HTML output. By default, [the pipeline generates base JSON-LD](/docs/rendering-guide#json-ld-structured-data) with standard product fields (name, SKU, price, availability, etc.). Use this field for complex product schemas beyond the standard fields, industry-specific structured data requirements, or advanced SEO optimizations.

## ProductBusVariant

Represents a variant of a configurable product (e.g., different color or size).

Each variant requires `sku`, `name`, `url`, `images`, and `availability` fields. You can optionally include `price` for variant-specific pricing, `gtin` for the variant's barcode, `description` with HTML support for variant-specific content, `itemCondition` enum for condition, `jsonldExtensions` (max 16,000 chars when serialized) for additional schema.org properties shallow-merged into the variant's Offer in auto-generated JSON-LD (ignored when product-level `jsonld` override is used), `shippingDimensions` (see [ShippingDimensions](#shippingdimensions)) to override the parent product's shipping dimensions for this variant's Offer in JSON-LD, and a `custom` object for variant-specific custom data. Variants that omit `shippingDimensions` inherit the parent product's `shippingDimensions` in the generated JSON-LD.

## ProductBusPrice

Price information for products or variants.

```typescript
{
  final: string;         // Required — final/sale price as string
  currency: string;      // Required — ISO currency code (e.g., "USD")
  regular?: string;      // Optional — regular/MSRP price as string
}
```

**Note:** `final` and `currency` are required fields. All prices are strings to ensure consistency for renderers and clients.

## ProductBusWeight

Product weight for use in JSON-LD structured data. Rendered as a schema.org `QuantitativeValue` on the `Product` object.

```typescript
{
  value: number;   // Numeric weight value
  unit: 'kg' | 'g' | 'lb' | 'oz';  // Weight unit
}
```

Unit codes map to UN/CEFACT values in the JSON-LD output: `kg`→`KGM`, `g`→`GRM`, `lb`→`LBR`, `oz`→`ONZ`. The original unit string is preserved in `unitText`.

## ShippingDimensions

Shipping dimensions for a product or variant, emitted as `Offer.shippingDetails` in JSON-LD structured data.

```typescript
{
  weight?: ProductBusWeight;  // Package weight
  height?: number;            // Package height
  width?: number;             // Package width
  depth?: number;             // Package depth
  dimensionsUnit?: 'cm' | 'mm' | 'in';  // Unit for height/width/depth
}
```

Dimension unit codes map to UN/CEFACT values in the JSON-LD output: `cm`→`CMT`, `mm`→`MMT`, `in`→`INH`. At least one measurement must be present for `shippingDetails` to be emitted. Variants that omit `shippingDimensions` inherit the parent product's value.

## ProductBusMedia

Media asset (image or video) associated with a product.

```typescript
{
  url: string;           // Media URL (external or relative path after processing)
  label?: string;        // Label/alt text
  filename?: string;     // Optional human-readable filename segment (letters, digits, hyphens, underscores only — no dots or slashes)
  roles?: string[];      // Roles like "thumbnail", "small", "large"
  video?: string;        // Associated video URL
}
```

**Image processing:**

When you provide external image URLs, they are fetched and stored in the media bus. Images are deduplicated using SHA-1 hashing and transformed to relative paths after processing. Processing is asynchronous for [bulk operations exceeding thresholds](/docs/advanced-topics#limits-and-guidance).

The `filename` field controls the human-readable segment of the rendered media URL. When provided, the rendered URL becomes `./media_{hash}/{filename}.{ext}` (e.g., `./media_abc123.../blender-pro-front.jpg`). When omitted, the URL is `./media_{hash}.{ext}`. The filename must contain only letters, digits, hyphens, and underscores — no dots, slashes, or spaces. Invalid filenames are silently ignored and the URL is left without a filename segment.

## ProductBusOption

Configurable product option (e.g., color, size, finish).

```typescript
{
  id?: string;           // Option ID (optional)
  label: string;         // Display label
  position?: number;     // Sort order
  values: Array<{        // Available values
    value: string;       // Value name
    uid?: string;        // Unique identifier
  }>;
}
```

## AggregateRating

Product review/rating information.

```typescript
{
  ratingValue: string;   // Average rating (e.g., "4.5")
  reviewCount: string;   // Number of reviews (e.g., "127")
  bestRating?: string;   // Maximum possible rating (e.g., "5")
  worstRating?: string;  // Minimum possible rating (e.g., "1")
}
```

## SchemaOrgAvailability

Product availability status using schema.org vocabulary. These values are rendered in the JSON-LD structured data as schema.org URLs (e.g., `https://schema.org/InStock`).

**Valid values:**

| Value | Description |
|-------|-------------|
| `BackOrder` | Product is available for order but currently out of stock |
| `Discontinued` | Product is no longer being manufactured or sold |
| `InStock` | Product is available for immediate purchase |
| `InStoreOnly` | Product is only available for purchase in physical stores |
| `LimitedAvailability` | Product has limited stock available |
| `MadeToOrder` | Product is manufactured upon order placement |
| `OnlineOnly` | Product is only available for online purchase |
| `OutOfStock` | Product is temporarily out of stock |
| `PreOrder` | Product can be ordered before official release |
| `PreSale` | Product is available for pre-sale purchase |
| `Reserved` | Product is reserved and not available for general purchase |
| `SoldOut` | Product has sold out completely |

**Example:**
```json
{
  "sku": "product-123",
  "name": "Example Product",
  "availability": "InStock"
}
```

## SchemaOrgItemCondition

Product condition using schema.org vocabulary. These values are rendered in the JSON-LD structured data as schema.org URLs (e.g., `https://schema.org/NewCondition`).

**Valid values:**

| Value | Description |
|-------|-------------|
| `DamagedCondition` | Product has damage or defects |
| `NewCondition` | Product is brand new and unused |
| `RefurbishedCondition` | Product has been professionally restored to working condition |
| `UsedCondition` | Product has been previously used |

**Example:**
```json
{
  "sku": "product-123",
  "name": "Example Product",
  "itemCondition": "NewCondition"
}
```

## Next steps

- [API Reference](/docs/api-reference#create-or-update-a-product): Use the API to create and manage products with this schema
- [Data Ingestion Guide](/docs/data-ingestion#etl-process-overview): Transform your source data into this schema format
- [Rendering Guide](/docs/rendering-guide#data-rendering-locations): Learn how schema fields are rendered in HTML and JSON output
