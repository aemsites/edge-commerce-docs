---
title: "Schema reference"
description: "Reference for the Product Bus product schema and the order request schemas."
daPath: "/schema-reference"
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

# Schema reference

This reference documents the schemas used by the Edge Commerce API: the Product Bus product schema and the order and checkout request schemas.

## Product Bus

Schemas for product catalog data stored in the Product Bus.

### ProductBusEntry

The main product schema supports rich product data with HTML content, variants, and custom fields.

<!-- GENERATED: ProductBusEntry:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `sku` | string | Yes | Unique stock-keeping unit identifier. |
| `path` | string | Yes | URL path for this product (e.g. "/products/my-product"). max length 900; pattern constrained |
| `urlKey` | string | No | URL key used to construct the canonical path. excludes matching pattern |
| `description` | string | No | Full product description. |
| `name` | string | Yes | Display name for the product. |
| `metaTitle` | string | No | HTML meta title override. |
| `metaDescription` | string | No | HTML meta description override. |
| `gtin` | string | No | Global Trade Item Number (barcode). |
| `url` | string | No | Canonical absolute URL for the product. |
| `brand` | string | No | Brand or manufacturer name. |
| `type` | string | No | Product type identifier (e.g. "simple", "configurable", "bundle"). |
| `availability` | [SchemaOrgAvailability](#schemaorgavailability) | No | schema.org availability status for a product or offer. |
| `availabilityDate` | string | No | ISO 8601 date when the product becomes available. |
| `price` | [ProductBusPrice](#productbusprice) | No | Price information for a product or variant. |
| `itemCondition` | [SchemaOrgItemCondition](#schemaorgitemcondition) | No | schema.org item condition. |
| `metadata` | Record<string, string> | No | Arbitrary key/value metadata attached to the product. |
| `options` | [ProductBusOption](#productbusoption)[] | No | Configurable options available for this product (e.g. Color, Size). |
| `aggregateRating` | [AggregateRating](#aggregaterating) | No | Aggregate customer rating for schema.org structured data. |
| `images` | [ProductBusMedia](#productbusmedia)[] | No | Product images. |
| `variants` | [ProductBusVariant](#productbusvariant)[] | No | Available variants for a configurable product. |
| `jsonld` | string | No | Full JSON-LD override. When present, replaces the auto-generated structured data. max length 128000 |
| `custom` | Record<string, any> | No |  |
| `jsonldExtensions` | Record<string, any> | No | Additional schema.org properties shallow-merged into the auto-generated Product JSON-LD object. Ignored when jsonld override is used. Max 32,000 characters when serialized. max length 32000 |
| `shipping` | string \| object \| object[] | No | Shipping options, as a packed string, a single option object, or an array of option objects. |
| `bundleItems` | object[] | No | Bundle composition. Presence of this array (regardless of contents) marks this product as a bundle. |
| `feeds` | object | No | Feed configuration for product distribution. |
| `weight` | [ProductBusWeight](#productbusweight) | No | Product weight for display and JSON-LD structured data. |
| `shippingDimensions` | [ShippingDimensions](#shippingdimensions) | No | Physical dimensions used for shipping rate calculation. |
| `taxCode` | string | No | Tax classification code for this product. max length 255 |
| `taxData` | Record<string, any> | No | Supplementary tax data passed to the tax provider. |
| `country` | string | No | ISO 3166-1 alpha-2 store country code. pattern constrained |
| `locale` | string | No | BCP-47 locale tag for this product entry. pattern constrained |

<!-- GENERATED: ProductBusEntry:end -->

#### URL field and sitemap generation

The `url` field controls how product URLs appear in XML sitemaps. When `url` is present, it is used directly in the sitemap (highest priority). When `url` is absent, URLs are constructed from the product's `path` field.

This gives you control over exact URLs when needed, such as for products with custom routing or special URL requirements. See the [Rendering Guide](/rendering-guide#xml-sitemaps-for-seo) for more details on sitemap URL resolution.

#### HTML support

The `description` field supports full HTML for rich product descriptions. Variant `description` fields also support full HTML for variant-specific descriptions.

#### Metadata rendering

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

See the [Rendering Guide](/rendering-guide#custom-metadata) for more details on how metadata is rendered in HTML output.

#### Custom JSON-LD override

The `jsonld` field allows you to provide custom schema.org structured data that will be injected verbatim into the HTML output. By default, [the pipeline generates base JSON-LD](/rendering-guide#json-ld-structured-data) with standard product fields (name, SKU, price, availability, etc.). Use this field for complex product schemas beyond the standard fields, industry-specific structured data requirements, or advanced SEO optimizations.

### ProductBusVariant

Represents a variant of a configurable product (e.g., different color or size). Variants that omit `shippingDimensions` inherit the parent product's `shippingDimensions` in the generated JSON-LD. The `jsonldExtensions` object is limited to 16,000 characters when serialized and is ignored when the product-level `jsonld` override is used.

<!-- GENERATED: ProductBusVariant:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `sku` | string | Yes | Unique stock-keeping unit identifier. |
| `name` | string | Yes | Display name for this variant. |
| `price` | [ProductBusPrice](#productbusprice) | No | Price information for a product or variant. |
| `url` | string | Yes | Canonical URL for this variant. |
| `images` | [ProductBusMedia](#productbusmedia)[] | Yes | Images for this variant. |
| `gtin` | string | No | Global Trade Item Number (barcode). |
| `description` | string | No | Variant-specific description. |
| `availability` | [SchemaOrgAvailability](#schemaorgavailability) | No | schema.org availability status for a product or offer. |
| `options` | object[] | No | Option values that identify this variant (e.g. color=Red, size=Large). |
| `itemCondition` | [SchemaOrgItemCondition](#schemaorgitemcondition) | No | schema.org item condition. |
| `custom` | Record<string, any> | No |  |
| `jsonldExtensions` | Record<string, any> | No | Additional schema.org properties shallow-merged into this variant's Offer in the auto-generated JSON-LD. Max 16,000 characters when serialized. max length 16000 |
| `weight` | [ProductBusWeight](#productbusweight) | No | Product weight for display and JSON-LD structured data. |
| `shippingDimensions` | [ShippingDimensions](#shippingdimensions) | No | Physical dimensions used for shipping rate calculation. |

<!-- GENERATED: ProductBusVariant:end -->

### ProductBusPrice

Price information for products or variants.

<!-- GENERATED: ProductBusPrice:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `final` | string | No | Final price the customer pays, as a decimal string (e.g. "19.99"). |
| `currency` | string | No | ISO 4217 currency code, e.g. "USD". |
| `regular` | string | No | Original price before any discount, as a decimal string. |

<!-- GENERATED: ProductBusPrice:end -->

**Note:** `final` and `currency` are required fields. All prices are strings to ensure consistency for renderers and clients.

### ProductBusWeight

Product weight for use in JSON-LD structured data. Rendered as a schema.org `QuantitativeValue` on the `Product` object.

<!-- GENERATED: ProductBusWeight:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `value` | number | Yes | Numeric weight value. |
| `unit` | `kg` \| `g` \| `lb` \| `oz` | Yes | Unit of weight measurement. |

<!-- GENERATED: ProductBusWeight:end -->

Unit codes map to UN/CEFACT values in the JSON-LD output: `kg`→`KGM`, `g`→`GRM`, `lb`→`LBR`, `oz`→`ONZ`. The original unit string is preserved in `unitText`.

### ShippingDimensions

Shipping dimensions for a product or variant, emitted as `Offer.shippingDetails` in JSON-LD structured data.

<!-- GENERATED: ShippingDimensions:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `weight` | [ProductBusWeight](#productbusweight) | No | Product weight for display and JSON-LD structured data. |
| `height` | number | No | Height in the declared dimensionsUnit. |
| `width` | number | No | Width in the declared dimensionsUnit. |
| `depth` | number | No | Depth in the declared dimensionsUnit. |
| `dimensionsUnit` | `cm` \| `mm` \| `in` | No | Unit of dimension measurement. |

<!-- GENERATED: ShippingDimensions:end -->

Dimension unit codes map to UN/CEFACT values in the JSON-LD output: `cm`→`CMT`, `mm`→`MMT`, `in`→`INH`. At least one measurement must be present for `shippingDetails` to be emitted. Variants that omit `shippingDimensions` inherit the parent product's value.

### ProductBusMedia

Media asset (image or video) associated with a product.

<!-- GENERATED: ProductBusMedia:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | Yes | Absolute URL of the image. |
| `label` | string | No | Accessible alt text for the image. |
| `filename` | string | No | Original filename of the image. pattern constrained |
| `roles` | string[] | No | Semantic roles assigned to this image, e.g. "thumbnail". |
| `video` | string | No | Absolute URL of an associated video asset, when this media entry represents a video. |

<!-- GENERATED: ProductBusMedia:end -->

**Image processing:**

When you provide external image URLs, they are fetched and stored in the media bus. Images are deduplicated using SHA-1 hashing and transformed to relative paths after processing. Processing is asynchronous for [bulk operations exceeding thresholds](/limits).

The `filename` field controls the human-readable segment of the rendered media URL. When provided, the rendered URL becomes `./media_{hash}/{filename}.{ext}` (e.g., `./media_abc123.../blender-pro-front.jpg`). When omitted, the URL is `./media_{hash}.{ext}`. The filename must contain only letters, digits, hyphens, and underscores — no dots, slashes, or spaces. Invalid filenames are silently ignored and the URL is left without a filename segment.

### ProductBusOption

Configurable product option (e.g., color, size, finish).

<!-- GENERATED: ProductBusOption:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | No | Option identifier, typically matching the attribute code. |
| `label` | string | Yes | Display label for the option group (e.g. "Color"). |
| `position` | number | No | Sort order for display. |
| `values` | object[] | Yes | Available values for this option. |

<!-- GENERATED: ProductBusOption:end -->

### AggregateRating

Product review/rating information.

<!-- GENERATED: AggregateRating:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `ratingValue` | string | No | Average rating value. Numeric string; converted to a number in JSON-LD. |
| `reviewCount` | string | No | Total number of ratings. Numeric string; converted to an integer in JSON-LD. |
| `bestRating` | string | No | Best possible rating. Numeric string. |
| `worstRating` | string | No | Worst possible rating. Numeric string. |

<!-- GENERATED: AggregateRating:end -->

### SchemaOrgAvailability

Product availability status using schema.org vocabulary. These values are rendered in the JSON-LD structured data as schema.org URLs (e.g., `https://schema.org/InStock`).

<!-- GENERATED: SchemaOrgAvailability:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Value | Description |
|---|---|
| `BackOrder` | Product is available for order but currently out of stock. |
| `Discontinued` | Product is no longer being manufactured or sold. |
| `InStock` | Product is available for immediate purchase. |
| `InStoreOnly` | Product is only available for purchase in physical stores. |
| `LimitedAvailability` | Product has limited stock available. |
| `MadeToOrder` | Product is manufactured upon order placement. |
| `OnlineOnly` | Product is only available for online purchase. |
| `OutOfStock` | Product is temporarily out of stock. |
| `PreOrder` | Product can be ordered before official release. |
| `PreSale` | Product is available for pre-sale purchase. |
| `Reserved` | Product is reserved and not available for general purchase. |
| `SoldOut` | Product has sold out completely. |

<!-- GENERATED: SchemaOrgAvailability:end -->

**Example:**
```json
{
  "sku": "product-123",
  "name": "Example Product",
  "availability": "InStock"
}
```

### SchemaOrgItemCondition

Product condition using schema.org vocabulary. These values are rendered in the JSON-LD structured data as schema.org URLs (e.g., `https://schema.org/NewCondition`).

<!-- GENERATED: SchemaOrgItemCondition:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Value | Description |
|---|---|
| `DamagedCondition` | Product has damage or defects. |
| `NewCondition` | Product is brand new and unused. |
| `RefurbishedCondition` | Product has been professionally restored to working condition. |
| `UsedCondition` | Product has been previously used. |

<!-- GENERATED: SchemaOrgItemCondition:end -->

**Example:**
```json
{
  "sku": "product-123",
  "name": "Example Product",
  "itemCondition": "NewCondition"
}
```

## Orders

Request body schemas for the order and checkout endpoints — what a client sends when previewing or placing an order. These are distinct from the stored order shape returned in responses.

For how `estimateToken` fits into preview and order creation, see [Estimate tokens](/orders/lifecycle#estimate-tokens).

### Order

The full order request body used when placing an order.

<!-- GENERATED: Order:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `customer` | [Customer](#customer) | Yes | Customer contact details supplied with the order. |
| `shipping` | [Address](#address) | Yes | Shipping address. |
| `billing` | [Address](#address) | No | Billing address for payment AVS verification. Falls back to shipping if omitted. |
| `items` | [OrderItem](#orderitem)[] | Yes | Line items in the order. |
| `country` | string | Yes | Store country as an ISO 3166-1 alpha-2 code. Falls back to shipping.country if absent. pattern constrained |
| `locale` | string | Yes | Customer language as a BCP-47 tag. pattern constrained |
| `shippingMethod` | object | No | Shipping method selected by the customer from the estimate rates. Required for order preview. |
| `estimateToken` | string | No | Estimate token from a prior order preview. Used to lock in estimates at order creation time. |
| `paymentMethod` | string | No | Payment method identifier. |
| `checkoutFlow` | `standard` \| `express` | No | Checkout flow type. `express` identifies wallet or shortcut checkout flows. |
| `entryPoint` | `cart` \| `checkout` \| `pdp` | No | Page or experience where checkout started. |
| `couponCode` | string | No | Coupon code applied to the order. |
| `giftMessage` | string | No | Optional gift message to include with the order. Max 250 characters. max length 250 |
| `customerTimezone` | string | No | IANA timezone captured from the shopper's browser at checkout. max length 100; pattern constrained |
| `custom` | Record<string, string> | No | Customer-defined key/value pairs for linking the order to external systems. |

<!-- GENERATED: Order:end -->

### OrderItem

A single line item in an order. Bundle parents carry their resolved components in `bundleItems`.

<!-- GENERATED: OrderItem:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | No | Display name for this line item. |
| `note` | string | No | Optional customer note for this line item. |
| `sku` | string | Yes | SKU of the product. |
| `path` | string | Yes | Product page path. |
| `imageUrl` | string | No | Product image URL for order confirmation display. |
| `productUrl` | string | No | Canonical product URL. |
| `quantity` | integer | Yes | Quantity ordered. Must be a whole number from 1 to 1000. |
| `price` | [ProductBusPrice](#productbusprice) | Yes | Price information for a product or variant. |
| `shippingDimensions` | [ShippingDimensions](#shippingdimensions) | No | Physical dimensions used for shipping rate calculation. |
| `selectedOptions` | [SelectedOption](#selectedoption)[] | No | Option values selected by the customer. |
| `bundleItems` | [NestedBundleItem](#nestedbundleitem)[] | No | Resolved bundle component line items nested on a bundle parent. Not counted toward the order subtotal -- the parent price is the chargeable value. |
| `custom` | Record<string, any> | No | Arbitrary custom data for this line item. |

<!-- GENERATED: OrderItem:end -->

### SelectedOption

An option value selected by the customer on a line item (for example, a color or size). Used to resolve which variant of a configurable bundle item to ship.

<!-- GENERATED: SelectedOption:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Option identifier. |
| `value` | string | Yes | Selected value. |

<!-- GENERATED: SelectedOption:end -->

### NestedBundleItem

A resolved bundle component nested on a bundle parent line. Components are not counted toward the order's charged subtotal — the parent line's `price` represents the chargeable value.

<!-- GENERATED: NestedBundleItem:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | No | Display name of the component. |
| `sku` | string | No | SKU of the component. |
| `path` | string | Yes | Product page path of the component. |
| `quantity` | integer | Yes | Quantity ordered. Must be a whole number from 1 to 1000. |
| `price` | [ProductBusPrice](#productbusprice) | Yes | Price information for a product or variant. |

<!-- GENERATED: NestedBundleItem:end -->

### Address

A shipping or billing address. `country` and `state` are always required because they drive tax and shipping rate lookups.

<!-- GENERATED: Address:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Full name of the recipient. max length 255 |
| `company` | string | No | Company name. max length 255 |
| `address1` | string | Yes | Primary street address line. max length 255 |
| `address2` | string | No | Secondary address line (apartment, suite, etc.). max length 255 |
| `city` | string | Yes | City name. max length 255 |
| `state` | string | Yes | State or province code. max length 255 |
| `zip` | string | Yes | Postal or ZIP code. max length 255 |
| `country` | string | Yes | ISO 3166-1 alpha-2 country code. max length 255 |
| `phone` | string | No | Phone number. max length 255 |
| `email` | string | Yes | max length 255; pattern constrained |
| `isDefault` | boolean | No | Whether this is the default address for the customer. |
| `isValidated` | boolean | No | Whether this address has been validated by an address verification service. |

<!-- GENERATED: Address:end -->

### Customer

Customer contact details supplied with an order.

<!-- GENERATED: Customer:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `firstName` | string | Yes | Customer first name. max length 255 |
| `lastName` | string | Yes | Customer last name. max length 255 |
| `email` | string | Yes | max length 255; pattern constrained |
| `phone` | string | No | Customer phone number. |

<!-- GENERATED: Customer:end -->

### PreviewOrder

The relaxed order request used for previews and estimates. `customer` is optional and only `items` and `shipping` are required, so express checkout flows (Apple Pay, PayPal, Google Pay) can request an estimate before full details are available.

<!-- GENERATED: PreviewOrder:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `customer` | [Customer](#customer) | No | Customer contact details supplied with the order. |
| `shipping` | [PreviewAddress](#previewaddress) | Yes | Shipping address. |
| `billing` | [Address](#address) | No | Billing address for payment AVS verification. Falls back to shipping if omitted. |
| `items` | [OrderItem](#orderitem)[] | Yes | Line items in the order. |
| `country` | string | No | Store country as an ISO 3166-1 alpha-2 code. Falls back to shipping.country if absent. pattern constrained |
| `locale` | string | No | Customer language as a BCP-47 tag. pattern constrained |
| `shippingMethod` | object | No | Shipping method selected by the customer from the estimate rates. Required for order preview. |
| `estimateToken` | string | No | Estimate token from a prior order preview. Used to lock in estimates at order creation time. |
| `paymentMethod` | string | No | Payment method identifier. |
| `checkoutFlow` | `standard` \| `express` | No | Checkout flow type. `express` identifies wallet or shortcut checkout flows. |
| `entryPoint` | `cart` \| `checkout` \| `pdp` | No | Page or experience where checkout started. |
| `couponCode` | string | No | Coupon code applied to the order. |
| `giftMessage` | string | No | Optional gift message to include with the order. Max 250 characters. max length 250 |
| `customerTimezone` | string | No | IANA timezone captured from the shopper's browser at checkout. max length 100; pattern constrained |
| `custom` | Record<string, string> | No | Customer-defined key/value pairs for linking the order to external systems. |
| `couponSource` | string | No | Origin of the coupon code, e.g. a campaign source (order preview only). |

<!-- GENERATED: PreviewOrder:end -->

### PreviewAddress

The relaxed address used in order previews. Only `country` and `state` are required — enough to compute tax and shipping estimates from a wallet's partial address.

<!-- GENERATED: PreviewAddress:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | No | Full name of the recipient. max length 255 |
| `company` | string | No | Company name. max length 255 |
| `address1` | string | No | Primary street address line. max length 255 |
| `address2` | string | No | Secondary address line (apartment, suite, etc.). max length 255 |
| `city` | string | No | City name. max length 255 |
| `state` | string | Yes | State or province code. max length 255 |
| `zip` | string | No | Postal or ZIP code. max length 255 |
| `country` | string | Yes | ISO 3166-1 alpha-2 country code. max length 255 |
| `phone` | string | No | Phone number. max length 255 |
| `email` | string | No | max length 255; pattern constrained |
| `isDefault` | boolean | No | Whether this is the default address for the customer. |
| `isValidated` | boolean | No | Whether this address has been validated by an address verification service. |

<!-- GENERATED: PreviewAddress:end -->

## Errors

Error response envelopes returned for non-2xx responses across the API.

### ErrorResponse

The standard error envelope. The `code` and `message` are also returned as the `x-error-code` and `x-error` response headers.

<!-- GENERATED: ErrorResponse:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `code` | string | Yes | Machine-readable error code (also sent as the `x-error-code` header). |
| `message` | string | Yes | Human-readable error message (also sent as the `x-error` header). |
| `resource` | string | No | The resource type involved, when applicable. |
| `retryable` | boolean | No | Whether the caller may retry the request. |
| `details` | Record<string, any> | No | Optional structured detail. |

<!-- GENERATED: ErrorResponse:end -->

### ValidationErrorResponse

Returned when a request body fails schema validation (HTTP 400). Adds a per-field `errors` array to the standard envelope.

<!-- GENERATED: ValidationErrorResponse:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `code` | string | Yes | Machine-readable error code. |
| `message` | string | Yes | Human-readable error message. |
| `errors` | [ValidationErrorDetail](#validationerrordetail)[] | No | Per-field validation failures. |

<!-- GENERATED: ValidationErrorResponse:end -->

### ValidationErrorDetail

A single field-level validation failure within `ValidationErrorResponse.errors`.

<!-- GENERATED: ValidationErrorDetail:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `path` | string | Yes | JSON path to the offending value, e.g. `$.allowedOrigins[0]`. |
| `message` | string | Yes | What was wrong at this path. |
| `details` | string | No | Optional extra context. |

<!-- GENERATED: ValidationErrorDetail:end -->

## Next steps

- [API Reference](/api-reference#create-or-update-a-product): Use the API to create and manage products with this schema
- [Data Ingestion Guide](/data-ingestion#etl-process-overview): Transform your source data into this schema format
- [Rendering Guide](/rendering-guide#data-rendering-locations): Learn how schema fields are rendered in HTML and JSON output
