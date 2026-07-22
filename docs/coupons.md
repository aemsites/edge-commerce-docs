---
title: "Coupons guide"
description: "Coupon data model, validation, and redemption flows."
daPath: "/coupons"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "59379a6"
    lastContentCommit: "844b959"
migration:
  from: "helix-commerce-documentation/documentation/coupons.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# Coupons guide

Coupons are code-based discounts that customers enter at checkout. The coupons system is built on a two-tier model: _coupon types_ define the discount behavior, and _coupon codes_ are the individual codes that customers redeem. A type acts as a template — it carries all the business rules (discount amount, eligibility, restrictions) while codes are lightweight references to that template.

## Coupon types

A coupon type describes what discount is granted when a matching code is applied. It defines whether the discount is a fixed amount or a percentage, which products or categories are eligible, which countries or locales the discount is valid in, and whether codes can be entered manually by customers or only applied programmatically.

### Creating a coupon type

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/coupons/types" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "summer10",
    "name": "10% Off Summer",
    "discountType": "percentage",
    "discountValue": 10,
    "minimumOrderAmount": 25,
    "stackable": true,
    "allowManualEntry": true
  }'
```

To retrieve, update, or delete a type, use `GET`, `PUT`, or `DELETE` at `/{org}/sites/{site}/coupons/types/{typeId}`. A type cannot be deleted while coupon codes still reference it.

### Coupon type schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this type. Immutable after creation |
| `name` | string | Yes | Human-readable name shown in the order discount breakdown |
| `discountType` | string | Conditional | `"percentage"` or `"fixed"`. Required unless `discountedProducts` is used |
| `discountValue` | number | No | Discount magnitude: a percentage (e.g., `10` for 10%) or a fixed currency amount. Defaults to `0` for percentage and fixed coupon types |
| `minimumOrderAmount` | number | No | Minimum eligible subtotal required to apply the coupon. Defaults to `0` |
| `maximumDiscountAmount` | number | No | Cap on the discount for percentage types. `null` means no cap |
| `freeShipping` | boolean | No | When `true`, removes shipping charges in addition to any price discount |
| `includedShippingTypes` | string[] | No | Restricts free shipping to specific shipping type identifiers. Only meaningful when `freeShipping` is `true` |
| `stackable` | boolean | No | Whether the coupon can be combined with auto-applied cart rules. When `false`, all cart rules are suppressed while the coupon is active. Defaults to `true` |
| `excludeDiscountedProducts` | boolean | No | When `true`, already-discounted items (products where `price.final < price.regular`) are excluded from the coupon's scope. Defaults to `false` |
| `applyToSalePrice` | boolean | No | When `true`, applies the coupon to the current sale price. When `false` (default), compares the sale price with the coupon-adjusted regular price and uses the lower price |
| `discountedProducts` | array | Conditional | Product-list pricing that maps product paths, and optionally variant SKUs, to absolute final unit prices. Used instead of `discountType` and `discountValue` |
| `autoApply` | boolean | No | Signals that the storefront should apply this coupon type automatically without customer input. The storefront is responsible for selecting eligible codes and passing them in the estimate request with `couponSource: "auto"`. Defaults to `false` |
| `allowManualEntry` | boolean | No | When `false`, the coupon code is rejected if submitted with `couponSource: "manual"`, preventing customers from typing it. Defaults to `true` |
| `includedProducts` | array | No | Restricts the discount to specific products. Each entry is a product path string or a `{ path, sku }` object |
| `excludedProducts` | array | No | Excludes specific products from the discount scope. Mutually exclusive with `includedProducts` |
| `includedCategories` | string[] | No | Restricts the discount to items in these categories |
| `excludedCategories` | string[] | No | Excludes items in these categories from the discount scope. Mutually exclusive with `includedCategories` |
| `country` | string | No | ISO 3166-1 alpha-2 code. Coupon is only valid for orders with a matching country. Mutually exclusive with `countries` |
| `countries` | string[] | No | Array of ISO 3166-1 alpha-2 codes. Coupon is only valid for orders from one of these countries. Mutually exclusive with `country` |
| `locale` | string | No | Locale string (e.g., `"en-US"`). Limits the coupon to that locale |
| `defaultUsageLimit` | number | No | Default `usageLimit` applied to codes created under this type when no explicit limit is given |
| `defaultUsesPerCode` | number | No | Default `usesPerCustomer` applied to codes created under this type |
| `notes` | string | No | Internal notes. Not surfaced to customers |

### Discount calculation

For `"percentage"` discount types, the discount is `(eligibleSubtotal × discountValue) / 100`, capped at `maximumDiscountAmount` when set. For `"fixed"` discount types, the discount is the lesser of `discountValue` and the eligible subtotal, ensuring the subtotal never goes negative.

By default, `applyToSalePrice` is `false`. The API calculates the coupon against each eligible item's regular price, compares that result with the item's current sale price, and uses whichever price is lower. If the sale is already better than the coupon, the coupon contributes no additional discount for that line. Set `applyToSalePrice` to `true` to calculate the coupon from post-promotion prices instead.

When `excludeDiscountedProducts` is `true`, products already reduced below their regular price are removed from the coupon scope. This setting takes precedence over `applyToSalePrice`.

An individual code's `discountOverride` field can replace the type's `discountType` and `discountValue` for that specific code, which allows issuing special codes with a different discount magnitude without creating a separate type.

### Product-list pricing

Use `discountedProducts` when a coupon sets absolute final prices instead of calculating a percentage or fixed discount:

```json
{
  "id": "bundle-prices",
  "name": "Bundle pricing",
  "discountedProducts": [
    { "path": "/us/en/products/blender", "price": "199.00" },
    { "path": "/us/en/products/blender", "sku": "BLENDER-RED", "price": "189.00" }
  ]
}
```

Each entry requires a product `path` and a non-negative price supplied as a finite number or canonical decimal string, such as `19.99`. An optional `sku` limits the price to one variant. When both a path-only entry and a matching path-and-SKU entry apply, the SKU-specific entry wins. The API compares the configured coupon price with the current line-item price and uses the lower value.

`discountedProducts` cannot be combined with `discountType`, `discountValue`, `applyToSalePrice`, `excludeDiscountedProducts`, or product/category scope fields. Coupon codes belonging to a product-list type also cannot set `discountOverride`. Exact duplicate entries are rejected.

## Coupon codes

A coupon code is a string that a customer enters at checkout. It references a type, tracks how many times it has been used, and can carry code-specific overrides such as a different discount value or expiry date.

### Creating a single code

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/coupons" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER10",
    "typeId": "summer10",
    "usageLimit": 500,
    "expiresAt": "2026-08-31T23:59:59Z"
  }'
```

### Batch-generating codes

For campaigns that require many unique codes, the batch endpoint generates up to 500 codes in a single request. Each code is a random 8-character alphanumeric suffix appended to an optional prefix.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/coupons/batch" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "typeId": "summer10",
    "count": 200,
    "prefix": "SUM26",
    "usageLimit": 1,
    "expiresAt": "2026-08-31T23:59:59Z"
  }'
```

This creates 200 codes like `SUM26-A3B7CX9Z`. The response includes the full list of generated codes:

```json
{
  "count": 200,
  "codes": ["SUM26-A3B7CX9Z", "SUM26-Q1R4WE2P", "..."]
}
```

### Coupon code schema

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | The redemption code. Uppercase letters, digits, hyphens, and underscores; max 64 characters. Immutable after creation |
| `typeId` | string | The coupon type this code belongs to. Immutable after creation |
| `discountOverride` | object | Optional `{ discountType, discountValue }` that overrides the type's discount for this code only |
| `usageLimit` | number | Maximum total number of redemptions. `null` means unlimited |
| `usageCount` | number | Current number of redemptions. Managed by the system; not writable through the API |
| `usesPerCustomer` | number | Maximum redemptions per customer email address. `null` means no per-customer limit |
| `expiresAt` | string | ISO 8601 timestamp. The code is rejected after this time. Omit for codes that never expire |
| `active` | boolean | When `false`, the code is immediately rejected at validation time |

### Listing codes

```bash
# List all codes for the site (paginated)
curl "https://api.adobecommerce.live/{org}/sites/{site}/coupons?limit=100" \
  -H "Authorization: Bearer {your-api-key}"

# Filter by type
curl "https://api.adobecommerce.live/{org}/sites/{site}/coupons?type=summer10" \
  -H "Authorization: Bearer {your-api-key}"

# Filter by active status
curl "https://api.adobecommerce.live/{org}/sites/{site}/coupons?active=true" \
  -H "Authorization: Bearer {your-api-key}"
```

The response includes a `cursor` field for pagination. Pass `cursor` as a query parameter in the next request to retrieve the following page.

### Code format and tracking suffixes

Coupon codes accept uppercase letters, digits, hyphens, and underscores, up to 64 characters. Case is normalized: a customer entering `save10` is treated the same as `SAVE10`.

Codes also support an optional tracking suffix separated by `+`. The suffix is stripped before validation and does not affect which code is looked up, but it is preserved in the order's discount record for attribution. This allows a single base code to be distributed across multiple channels while tracking which channel drove each redemption.

```text
SAVE10+FACEBOOK     → base code: SAVE10, source: FACEBOOK
SAVE10+EMAIL_JUN26  → base code: SAVE10, source: EMAIL_JUN26
```

## Applying a coupon at checkout

The storefront includes the coupon code in the body of an estimate request. The estimate endpoint validates the code and, if it passes all checks, applies the discount to the cart and returns the breakdown. See [Estimates and cart totals](/estimates) for how coupon validation fits into tax, shipping, price, and order estimates.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/estimate/shipping" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "sku": "BLENDER-RED", "path": "/us/en/products/blender-pro-500", "quantity": 1,
        "price": { "final": "29.99", "currency": "USD" } }
    ],
    "shipping": { "country": "US", "state": "CA" },
    "couponCode": "SAVE10",
    "couponSource": "manual"
  }'
```

`couponSource` should be `"manual"` when the customer typed the code, and `"auto"` when the storefront applied it programmatically (for example, from an auto-apply type). Codes belonging to a type with `allowManualEntry: false` are rejected when `couponSource` is `"manual"`.

### Validation sequence

When a coupon code is submitted, the following checks are performed in order. Any failure stops validation and returns a `422` response.

| Check | Error code |
|-------|-----------|
| Code format (valid characters, max 64 chars, at most one `+`) | `ADOBE_COMMERCE_COUPON_INVALID_FORMAT` |
| Code exists | `ADOBE_COMMERCE_COUPON_NOT_FOUND` |
| Code is active | `ADOBE_COMMERCE_COUPON_INACTIVE` |
| Code has not expired | `ADOBE_COMMERCE_COUPON_EXPIRED` |
| Global usage limit not exhausted | `ADOBE_COMMERCE_COUPON_EXHAUSTED` |
| Country restriction satisfied (type-level) | `ADOBE_COMMERCE_COUPON_COUNTRY_MISMATCH` |
| Minimum order amount met (using post-promotion subtotal) | `ADOBE_COMMERCE_COUPON_MINIMUM_NOT_MET` |
| Manual entry permitted for this type | `ADOBE_COMMERCE_COUPON_MANUAL_ENTRY_REJECTED` |
| Per-customer limit not exhausted (when email is known) | `ADOBE_COMMERCE_COUPON_EXHAUSTED` |
| At least one cart line is eligible (product/category scope) | `ADOBE_COMMERCE_COUPON_PRODUCT_NOT_ELIGIBLE` |

All failures return HTTP 422 with the human-readable message `"coupon not applicable"` regardless of the specific reason. The machine-readable error code is available in the `x-error-code` response header for programmatic branching. This ensures that the error messages shown to customers do not reveal whether a code exists, has expired, or has been exhausted.

## Stacking behavior

When a coupon is active, its type's `stackable` field and `incompatibleTypes` setting control how it interacts with automatic cart rules.

When `stackable` is `false`, all auto-applied cart rules are suppressed for the duration of the estimate. The customer receives the coupon discount but no additional automatic discounts. When `stackable` is `true`, cart rules that list the coupon type's ID in their `incompatibleTypes` array are removed, and all other qualifying rules are still applied.

This gives you precise control: a large promotional coupon can be declared non-stackable so customers cannot combine it with a free-shipping threshold, while a small loyalty coupon can remain stackable.

## Usage tracking

After a successful order payment, the system asynchronously increments `usageCount` on the code. When `usesPerCustomer` is set on the code, a separate per-email usage record is also updated. The per-customer check is performed at estimate time using the customer's email — if no email is available (for example, a guest checkout before the email step), the per-customer limit is not enforced at estimate time and is checked again at order-preview time when the email is known.

## Next steps

- [Promotions guide](/promotions): Set up automatic catalog and cart discounts that apply without a code
- [Rendering guide](/rendering-guide#catalog-price-rules): How promotions affect rendered product pages and indexes
- [API reference](/api-reference): Complete API endpoint reference
