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

This reference documents the schemas used by the Commerce API: the Product Bus product schema and the order and checkout request schemas.

## Product Bus

Schemas for product catalog data stored in the Product Bus.

### ProductBusEntry

The main product schema supports rich product data with HTML content, variants, and custom fields.

<!-- GENERATED: ProductBusEntry:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `sku` | string | Yes | Unique product identifier. |
| `path` | string | Yes | Product URL path used for path-based storage. max length 900; pattern constrained |
| `urlKey` | string | No | Human-readable product identifier for URL generation. excludes matching pattern |
| `description` | string | No | Full product description. HTML content is supported. |
| `name` | string | Yes | Display name for the product. |
| `metaTitle` | string | No | SEO title tag content. |
| `metaDescription` | string | No | SEO meta description. |
| `gtin` | string | No | Barcode or Global Trade Item Number. |
| `url` | string | No | Canonical product page URL; used directly in sitemap output when present. |
| `brand` | string | No | Brand or manufacturer name. |
| `type` | string | No | Product type classification. |
| `availability` | [SchemaOrgAvailability](#schemaorgavailability) | No | Stock status using schema.org availability vocabulary. |
| `availabilityDate` | string | No | Date when the product becomes available. |
| `price` | [ProductBusPrice](#productbusprice) | No | Price information for the product. |
| `itemCondition` | [SchemaOrgItemCondition](#schemaorgitemcondition) | No | Product condition using schema.org item condition vocabulary. |
| `metadata` | Record<string, string> | No | Generic metadata map rendered as meta tags in HTML output. |
| `options` | [ProductBusOption](#productbusoption)[] | No | Configurable product options, such as color or size. |
| `aggregateRating` | [AggregateRating](#aggregaterating) | No | Product review and rating information. |
| `specifications` | string | No | Product specifications content. |
| `images` | [ProductBusMedia](#productbusmedia)[] | No | Media gallery for product images and videos. |
| `variants` | [ProductBusVariant](#productbusvariant)[] | No | Product variants for configurable products. |
| `jsonld` | string | No | Override "escape hatch" for json-ld max length 128000 |
| `custom` | Record<string, any> | No | Additional data that can be retrieved via .json API |
| `jsonldExtensions` | Record<string, any> | No | Additional schema.org properties shallow-merged into the auto-generated Product JSON-LD object. Intended for additive fields (e.g. potentialAction, aggregateRating, review) but can overwrite any pipeline-generated key. Ignored when jsonld override is used. Max 32,000 characters when serialized. max length 32000 |
| `shipping` | string \| object \| object[] | No | Shipping options, as string, object, or array of objects. If an array, each object contains shipping information for one option. |
| `bundleItems` | object[] | No | Bundle composition. When present (regardless of contents), marks this product as a bundle: the cart treats it as a single purchasable SKU, and the Commerce API expands it into component line items at order preview for tax calculation. Bundle item prices must sum to this product's price. |
| `feeds` | object | No | Feed configuration for product distribution. |
| `weight` | [ProductBusWeight](#productbusweight) | No | Product weight for display and JSON-LD structured data. |
| `shippingDimensions` | [ShippingDimensions](#shippingdimensions) | No | Physical dimensions used for shipping rate calculation. |
| `taxCode` | string | No | Tax classification code for this product. max length 255 |
| `taxData` | Record<string, any> | No | Free-form map of supplementary tax data |
| `country` | string | No | Country code for country-scoped product data. pattern constrained |
| `locale` | string | No | Locale code for locale-scoped product data. pattern constrained |

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
| `sku` | string | Yes | Unique variant identifier. |
| `name` | string | Yes | Display name for the variant. |
| `price` | [ProductBusPrice](#productbusprice) | No | Variant-specific pricing; falls back to the parent product price when omitted. |
| `url` | string | Yes | Canonical variant page URL. |
| `images` | [ProductBusMedia](#productbusmedia)[] | Yes | Media gallery for the variant. |
| `gtin` | string | No | Barcode or Global Trade Item Number for the variant. |
| `description` | string | No | Variant-specific description. HTML content is supported. |
| `availability` | [SchemaOrgAvailability](#schemaorgavailability) | No | Stock status using schema.org availability vocabulary. |
| `options` | object[] | No |  |
| `itemCondition` | [SchemaOrgItemCondition](#schemaorgitemcondition) | No | Variant condition using schema.org item condition vocabulary. |
| `custom` | Record<string, any> | No | Custom data bag for variant-specific data. |
| `jsonldExtensions` | Record<string, any> | No | Additional schema.org properties shallow-merged into this variant's Offer in the auto-generated JSON-LD. Ignored when the product-level jsonld override is used. Max 16,000 characters when serialized. max length 16000 |
| `weight` | [ProductBusWeight](#productbusweight) | No | Variant weight; inherits the parent product value when omitted. |
| `shippingDimensions` | [ShippingDimensions](#shippingdimensions) | No | Variant shipping dimensions; inherits the parent product value when omitted. |

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
| `unit` | `kg` \| `g` \| `lb` \| `oz` | Yes | Weight unit. Maps to UN/CEFACT codes in JSON-LD output. |

<!-- GENERATED: ProductBusWeight:end -->

Unit codes map to UN/CEFACT values in the JSON-LD output: `kg`→`KGM`, `g`→`GRM`, `lb`→`LBR`, `oz`→`ONZ`. The original unit string is preserved in `unitText`.

### ShippingDimensions

Shipping dimensions for a product or variant, emitted as `Offer.shippingDetails` in JSON-LD structured data.

<!-- GENERATED: ShippingDimensions:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `weight` | [ProductBusWeight](#productbusweight) | No | Package weight. |
| `height` | number | No | Package height. |
| `width` | number | No | Package width. |
| `depth` | number | No | Package depth. |
| `dimensionsUnit` | `cm` \| `mm` \| `in` | No | Unit for height, width, and depth. Maps to UN/CEFACT codes in JSON-LD. |

<!-- GENERATED: ShippingDimensions:end -->

Dimension unit codes map to UN/CEFACT values in the JSON-LD output: `cm`→`CMT`, `mm`→`MMT`, `in`→`INH`. At least one measurement must be present for `shippingDetails` to be emitted. Variants that omit `shippingDimensions` inherit the parent product's value.

### ProductBusMedia

Media asset (image or video) associated with a product.

<!-- GENERATED: ProductBusMedia:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | Yes | Media URL (external or relative path after processing). |
| `label` | string | No | Label or alt text. |
| `filename` | string | No | Human-readable filename segment for the rendered media URL. pattern constrained |
| `roles` | string[] | No | Roles such as "thumbnail", "small", or "large". |
| `video` | string | No |  |

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
| `id` | string | No | Option identifier. |
| `label` | string | Yes | Display label. |
| `position` | number | No | Sort order. |
| `values` | object[] | Yes | Available option values. |

<!-- GENERATED: ProductBusOption:end -->

### AggregateRating

Product review/rating information.

<!-- GENERATED: AggregateRating:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `ratingValue` | string | No | Average rating, e.g. "4.5". |
| `reviewCount` | string | No | Number of reviews; converts to an integer in JSON-LD. |
| `bestRating` | string | No | Maximum possible rating, e.g. "5". |
| `worstRating` | string | No | Minimum possible rating, e.g. "1". |

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
| `name` | string | No | Product name. |
| `note` | string | No | Free-form note for this line item. |
| `sku` | string | Yes | Product SKU. |
| `path` | string | Yes | Product URL path. |
| `imageUrl` | string | No | Product image URL. |
| `productUrl` | string | No | Product page URL. |
| `quantity` | number | Yes | Quantity ordered. |
| `price` | [ProductBusPrice](#productbusprice) | Yes | Price information for the line item. |
| `shippingDimensions` | [ShippingDimensions](#shippingdimensions) | No | Physical dimensions used for shipping rate calculation. |
| `selectedOptions` | [SelectedOption](#selectedoption)[] | No | Option values selected by the customer for this line. Used at order preview to resolve which variant of each configurable bundle item to ship. |
| `bundleItems` | [NestedBundleItem](#nestedbundleitem)[] | No | For bundle parents: the resolved component line items, nested on the parent. Not included in the order's charged subtotal — the parent line's `price` represents the chargeable value. Distinct from `ProductBusEntry.bundleItems`, which is the template form (can include configurable `variants`). |
| `custom` | Record<string, any> | No | Custom line-item data preserved on the order. |

<!-- GENERATED: OrderItem:end -->

### SelectedOption

An option value selected by the customer on a line item (for example, a color or size). Used to resolve which variant of a configurable bundle item to ship.

<!-- GENERATED: SelectedOption:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Option identifier, e.g. "color". |
| `value` | string | Yes | Selected option value, e.g. "Red". |

<!-- GENERATED: SelectedOption:end -->

### NestedBundleItem

A resolved bundle component nested on a bundle parent line. Components are not counted toward the order's charged subtotal — the parent line's `price` represents the chargeable value.

<!-- GENERATED: NestedBundleItem:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | No | Component product name. |
| `sku` | string | No | Component product SKU. |
| `path` | string | Yes | Component product URL path. |
| `quantity` | number | Yes | Quantity of this component in the bundle. |
| `price` | [ProductBusPrice](#productbusprice) | Yes | Price information for the component. |

<!-- GENERATED: NestedBundleItem:end -->

### Address

A shipping or billing address. `country` and `state` are always required because they drive tax and shipping rate lookups.

<!-- GENERATED: Address:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Recipient full name. max length 255 |
| `company` | string | No | Company name. max length 255 |
| `address1` | string | Yes | Street address line 1. max length 255 |
| `address2` | string | No | Street address line 2 (apartment, suite, etc.). max length 255 |
| `city` | string | Yes | City or locality. max length 255 |
| `state` | string | Yes | State, province, or region. Required for tax and shipping rate lookups. max length 255 |
| `zip` | string | Yes | Postal or ZIP code. max length 255 |
| `country` | string | Yes | Country. Required for tax and shipping rate lookups. max length 255 |
| `phone` | string | No | Contact phone number. max length 255 |
| `email` | string | Yes | Email address. max length 255; pattern constrained |
| `isDefault` | boolean | No | Whether this is the customer's default address. |
| `isValidated` | boolean | No | Whether the address has been validated. |

<!-- GENERATED: Address:end -->

### Customer

Customer contact details supplied with an order.

<!-- GENERATED: Customer:start -->
<!-- Generated from helix-commerce-api schemas (npm run docs:schema). Do not edit by hand. -->

| Field | Type | Required | Description |
|---|---|---|---|
| `firstName` | string | Yes | Customer first name. max length 255 |
| `lastName` | string | Yes | Customer last name. max length 255 |
| `email` | string | Yes | Email address. max length 255; pattern constrained |
| `phone` | string | No | Customer contact phone number. |

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
| `name` | string | No | Recipient full name. max length 255 |
| `company` | string | No | Company name. max length 255 |
| `address1` | string | No | Street address line 1. max length 255 |
| `address2` | string | No | Street address line 2 (apartment, suite, etc.). max length 255 |
| `city` | string | No | City or locality. max length 255 |
| `state` | string | Yes | State, province, or region. Required for tax and shipping rate lookups. max length 255 |
| `zip` | string | No | Postal or ZIP code. max length 255 |
| `country` | string | Yes | Country. Required for tax and shipping rate lookups. max length 255 |
| `phone` | string | No | Contact phone number. max length 255 |
| `email` | string | No | Email address. max length 255; pattern constrained |
| `isDefault` | boolean | No | Whether this is the customer's default address. |
| `isValidated` | boolean | No | Whether the address has been validated. |

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
