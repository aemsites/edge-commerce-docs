---
title: "Promotions guide"
description: "Promotion models for catalog, cart, and conditional discounts."
daPath: "/promotions"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.10.2"
    lastReviewedCommit: "90dccc8"
    lastContentCommit: "90dccc8"
  helix-product-pipeline:
    version: "v2.9.1"
    lastReviewedCommit: "893adf9"
    lastContentCommit: "893adf9"
migration:
  from: "helix-commerce-documentation/documentation/promotions.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Promotions guide

Edge Commerce promotions have two layers: catalog promotions that lower displayed product prices, and cart rules that apply automatic discounts at checkout. Both are managed through the Edge Commerce API and evaluated against the customer's shopping context at the appropriate point in the purchase flow.

## Catalog promotions

Catalog promotions define product-level price overrides grouped into named campaigns. Each campaign is a _promotion_ containing a set of _rules_, where each rule targets a specific product path and supplies the discounted price to use. When the pipeline serves a product page, JSON response, or product index, it evaluates the active catalog promotions for your site and applies the best matching rule to the product's `price.final`.

### Creating and updating catalog promotions

Catalog promotions are stored as a single document per site and replaced in full with each write.

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/price-rules/catalog" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "promotions": [
      {
        "id": "summer-sale",
        "name": "Summer Sale 2026",
        "rules": [
          {
            "path": "/us/en/products/blender-pro-500",
            "price": "29.99",
            "start": "2026-06-01T00:00:00Z",
            "end": "2026-08-31T23:59:59Z"
          }
        ]
      }
    ]
  }'
```

To read the current catalog promotions, use `GET` on the same endpoint. Authentication is required for both reads and writes.

### Promotion schema

The request body is a `CatalogPriceRules` object with a single `promotions` array. Each element is a `CatalogPromotion`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique promotion identifier |
| `name` | string | Yes | Human-readable promotion name |
| `rules` | array | No | Price override rules (see below) |
| `country` | string | No | ISO 3166-1 alpha-2 country code. When set, the promotion is only applied for requests from that country |
| `locale` | string | No | Locale string (e.g., `"en-US"`). When set, limits the promotion to that locale |
| `conditions` | object | No | When present, marks this as a conditional promotion evaluated at cart time rather than render time (see [Conditional promotions](#conditional-promotions)) |

Each `CatalogPriceRule` within `rules`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Product URL path this rule applies to (e.g., `"/us/en/products/blender-pro-500"`) |
| `price` | string | Yes | Discounted price to use when this rule is active |
| `start` | string | No | ISO 8601 timestamp. Rule is inactive before this time |
| `end` | string | No | ISO 8601 timestamp. Rule is inactive after this time |
| `variants` | object | No | Per-SKU price overrides. Keys are variant SKUs, values are `VariantPriceRule` objects (see below) |

`VariantPriceRule` within `variants`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sku` | string | Yes | Variant SKU |
| `price` | string | Yes | Discounted price for this variant |
| `start` | string | No | ISO 8601 timestamp. Variant rule is inactive before this time |
| `end` | string | No | ISO 8601 timestamp. Variant rule is inactive after this time |

### How rules are selected and applied

When the pipeline evaluates catalog promotions for a product, it finds the best active promotion rule for that product path across all promotions. A rule qualifies if its price is lower than the product's current `price.final` or if any of its active variant-specific prices are lower than the corresponding variants' current prices. Among qualifying rules, the one with the lowest product-level price wins.

A rule is considered active when the current time falls within its optional `start`/`end` window. Rules without a `start` or `end` are always active.

Variants not explicitly listed in `rule.variants` inherit the parent product's rule price if it is lower than their current price.

### Date-limited promotions

Promotions that have `start` and `end` timestamps on their rules automatically become active and expire without any manual intervention. The pipeline evaluates the rule's active window at request time, so a rule that has not yet started or has already ended is never applied.

Timestamps must include an explicit timezone offset — bare datetimes are not accepted. UTC (`Z`) is recommended for consistency since rule windows are evaluated against the server's UTC clock. If you need a rule to activate at a specific local business time, use the corresponding UTC offset (for example, `2026-06-01T08:00:00-05:00` for 8 AM US Central Standard Time).

```json
{
  "id": "holiday-flash",
  "name": "Holiday Flash Sale",
  "rules": [
    {
      "path": "/us/en/products/espresso-machine",
      "price": "199.99",
      "start": "2026-12-24T08:00:00Z",
      "end": "2026-12-26T08:00:00Z"
    }
  ]
}
```

### Country-scoped promotions

A promotion with a `country` field is only applied when the request's resolved country matches. Requests without a country header are not matched against country-scoped promotions. Multiple country-specific promotions can coexist alongside global promotions.

```json
{
  "promotions": [
    {
      "id": "us-sale",
      "name": "US Summer Sale",
      "country": "US",
      "rules": [...]
    },
    {
      "id": "global-clearance",
      "name": "Global Clearance",
      "rules": [...]
    }
  ]
}
```

### Previewing promotions

To preview how catalog promotions will look before activating them in production, send the `x-env: stage` request header to the pipeline. The pipeline loads promotions from a separate staging store and returns the adjusted prices without caching the response. This does not affect production traffic.

## Conditional promotions

When a catalog promotion has a `conditions` object, it behaves differently. Rather than being applied at render time to lower displayed prices, a conditional promotion is evaluated at cart/estimate time. The typical use case is granting a free product when the cart meets a spending threshold. See [Estimates and cart totals](/estimates) for estimate-time discount behavior.

```json
{
  "id": "spend-100-get-item",
  "name": "Free item with $100 order",
  "conditions": {
    "minimumSubtotal": 100
  },
  "rules": [
    {
      "path": "/us/en/products/free-gift",
      "price": "0.00"
    }
  ]
}
```

The `conditions` object supports `minimumSubtotal` for a spending threshold, `requiredProducts` and `excludedProducts` for cart content requirements, and `requiredCategories` and `excludedCategories` for category-level requirements.

Conditional promotions are never applied by the pipeline when rendering product pages or indexes. They are only evaluated at cart and checkout time, when the storefront calls the estimate endpoint and returns the qualifying free-item grants as part of the discount breakdown.

## Cart rules

Cart rules are automatic discounts applied at checkout based on the contents or value of the customer's cart. Unlike catalog promotions (which lower the product's stored price), cart rules reduce the cart total at estimate time without changing product data.

### Creating and updating cart rules

Cart rules are stored as an array and replaced in full with each write.

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/price-rules/cart" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "id": "free-shipping-50",
      "name": "Free shipping on orders over $50",
      "priority": 10,
      "conditions": {
        "minimumSubtotal": 50
      },
      "actions": {
        "freeShipping": true
      },
      "stackable": true,
      "incompatibleTypes": []
    }
  ]'
```

To read the current cart rules, use `GET` on the same endpoint. Authenticated reads return all rules. Unauthenticated reads with the `?active=true` query parameter return only currently active rules, which allows the storefront to display promotion banners without requiring API credentials.

```bash
# Public read — returns active rules only
curl "https://api.adobecommerce.live/{org}/sites/{site}/price-rules/cart?active=true"
```

### Cart rule schema

Each object in the array is a `CartPriceRule`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique rule identifier |
| `name` | string | Yes | Display name shown in the discount breakdown |
| `priority` | integer | Yes | Evaluation order. Lower numbers are evaluated first |
| `conditions` | object | Yes | Conditions that must be met for the rule to apply (see below) |
| `actions` | object | Yes | Discount to apply when conditions are met (see below) |
| `stackable` | boolean | No | Whether this rule can apply alongside other discounts (default `true`) |
| `incompatibleTypes` | string[] | No | Coupon type IDs that suppress this rule when active |
| `country` | string | No | ISO 3166-1 alpha-2 code. Rule applies only when the order country matches |
| `locale` | string | No | Locale string. Rule applies only when the request locale matches |
| `start` | string | No | ISO 8601 timestamp. Rule is inactive before this time |
| `end` | string | No | ISO 8601 timestamp. Rule is inactive after this time |

**Conditions** (`conditions` object):

| Field | Type | Description |
|-------|------|-------------|
| `minimumSubtotal` | number | Cart subtotal must meet or exceed this amount |
| `requiredProducts` | array | One or more product paths or `{ path, sku }` objects that must be in the cart |
| `excludedProducts` | array | Products that must not be in the cart |
| `requiredCategories` | string[] | Category identifiers that must be present in the cart |
| `excludedCategories` | string[] | Category identifiers that must not be present in the cart |

At least one condition must be specified.

**Actions** (`actions` object):

| Field | Type | Description |
|-------|------|-------------|
| `percentOff` | number | Percentage discount applied to the eligible subtotal |
| `fixedOff` | number | Fixed amount deducted from the eligible subtotal |
| `freeShipping` | boolean | Removes shipping charges when `true` |
| `includedShippingTypes` | string[] | When set with `freeShipping`, limits free shipping to specific shipping type identifiers |

At least one action must be specified.

### Stacking and priority

When multiple cart rules qualify for a cart, their priority values control evaluation order. Rules with lower priority numbers are evaluated first. All stackable rules that qualify are applied; a non-stackable rule is applied alone (other rules are suppressed).

Cart rules that list a coupon type ID in their `incompatibleTypes` array are automatically suppressed when a coupon of that type is active. When a non-stackable coupon is applied, all cart rules are suppressed regardless of their `incompatibleTypes` setting.

## How promotions apply during the purchase flow

The estimate endpoint applies each discount layer in sequence. First, catalog promotion overrides lower the per-item prices. Second, any coupon code is validated against the post-promotion subtotal. Third, cart rules are evaluated — non-stackable coupon types suppress all rules, and incompatible type declarations remove specific rules. Finally, the remaining qualifying cart rules are applied, and the full discount breakdown is returned to the client.

## Next steps

- [Coupons guide](/coupons): Create and manage coupon codes that customers enter at checkout
- [Rendering guide](/rendering-guide#catalog-price-rules): How catalog promotions affect rendered product pages and indexes
- [API reference](/api-reference): Complete API endpoint reference
