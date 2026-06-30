---
title: "Estimates and cart totals"
description: "Choose the right estimate endpoint for tax, shipping, promotions, coupons, and cart totals."
daPath: "/estimates"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.42.1"
    lastReviewedCommit: "e77382f"
    lastContentCommit: "e77382f"
---

# Estimates and cart totals

Estimate endpoints help storefronts show cart totals before an order is created. They are designed for interactive checkout screens where the shopper is still changing products, quantities, address details, shipping method, or coupon codes.

Estimates do not create an order and do not lock the final total. Use [Order preview](/orders/lifecycle#preview-the-selected-order) when the shopper is ready to place the order and you need an [`estimateToken`](/orders/lifecycle#estimate-tokens).

## Which estimate endpoint to call

All estimate endpoints use:

```text
POST /{org}/sites/{site}/estimate/{estimateType}
```

| Estimate type | Call when | Main response |
|---------------|-----------|---------------|
| `tax` | You only need a tax rate for a country/state address | `tax` |
| `shipping` | The shopper enters or changes a shipping address | `rates` and method-level free-shipping effects |
| `price` | The shopper changes products, quantities, or coupon code | discounts, free shipping flag, line-item discount attribution, free-item grants |
| `order` | You need full cart totals across one or more shipping methods | `shippingMethods` with rate, tax, and total per method |

For final checkout submission, use `POST /orders/preview`, not `/estimate/order`.

## Estimate vs order preview

| Capability | `/estimate/*` | `/orders/preview` |
|------------|---------------|-------------------|
| Used while cart is changing | Yes | No, use after the shopper selects the final shipping method |
| Creates an order | No | No |
| Returns `estimateToken` | No | Yes |
| Validates final selected shipping method | Only for estimate context | Yes |
| Used by order creation | No | Yes, through `estimateToken` |
| Can be reCAPTCHA-gated | No | Yes, for unauthenticated callers when enabled |

Use estimates for cart UX. Use preview for commitment.

## Common request fields

Estimate request shapes vary by type, but these fields are common across shipping, price, and order estimates:

| Field | Description |
|-------|-------------|
| `country` | Store country as an ISO 3166-1 alpha-2 code. Can fall back to `shipping.country` |
| `locale` | Optional BCP-47 locale used for localized shipping method labels |
| `shipping` | Partial shipping address. `country`, `state`, and sometimes `zip` are enough for estimates |
| `items` | Cart line items with SKU, path, quantity, price, and optional shipping dimensions |
| `customer.email` | Optional. Used when coupon rules depend on customer usage limits |
| `couponCode` | Optional coupon code |
| `couponSource` | Optional coupon source, such as `manual` or `auto` |

## Tax estimate

Use `tax` when you only need the tax rate for a country and state.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/estimate/tax" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "shipping": {
      "state": "CA"
    }
  }'
```

Example response:

```json
{
  "tax": {
    "id": "CA",
    "rate": 7.25
  }
}
```

If no matching tax row or provider result is available, `tax` can be `null`.

## Shipping estimate

Use `shipping` when the shopper enters or changes a shipping address. The response returns available rates. Free-shipping coupon or cart-rule effects can zero out the returned rate for eligible methods.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/estimate/shipping" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "locale": "en-US",
    "shipping": {
      "country": "US",
      "state": "CA",
      "zip": "94105"
    },
    "items": [
      {
        "sku": "BLENDER-RED",
        "path": "/us/en/products/blender-pro-500",
        "quantity": 1,
        "price": { "final": "99.99", "currency": "USD" }
      }
    ],
    "couponCode": "FREESHIP",
    "couponSource": "manual"
  }'
```

Example response:

```json
{
  "rates": [
    {
      "id": "standard-us",
      "label": "Standard shipping",
      "rate": "0.00",
      "currency": "USD"
    },
    {
      "id": "express-us",
      "label": "Express shipping",
      "rate": "19.95",
      "currency": "USD"
    }
  ],
  "discounts": [
    {
      "id": "coupon:FREESHIP",
      "name": "Free shipping",
      "type": "free_shipping",
      "amount": 0,
      "freeShipping": true,
      "source": "coupon"
    }
  ]
}
```

Shipping estimates are intentionally tolerant of invalid coupons. If a coupon fails validation, the shipping estimate ignores it and returns base shipping rates. Coupon validity is enforced by `price`, `order`, and `orders/preview`.

## Price estimate

Use `price` when the shopper changes products, quantities, or coupon code and you need product-level discounts, automatic cart rules, coupon effects, or free-item grants.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/estimate/price" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "customer": { "email": "jane@example.com" },
    "items": [
      {
        "sku": "BLENDER-RED",
        "path": "/us/en/products/blender-pro-500",
        "quantity": 1,
        "price": { "final": "99.99", "regular": "129.99", "currency": "USD" }
      }
    ],
    "couponCode": "SAVE10",
    "couponSource": "manual"
  }'
```

Example response:

```json
{
  "subtotal": 89.99,
  "discounts": [
    {
      "id": "coupon:SAVE10",
      "name": "Save 10",
      "type": "fixed",
      "amount": 10,
      "source": "coupon"
    }
  ],
  "orderDiscountTotal": 10,
  "freeShipping": false,
  "lineItems": [
    {
      "sku": "BLENDER-RED",
      "path": "/us/en/products/blender-pro-500",
      "quantity": 1,
      "price": { "final": "99.99", "regular": "129.99", "currency": "USD" },
      "discounts": [
        { "id": "coupon:SAVE10", "amount": 10 }
      ]
    }
  ]
}
```

`price` applies catalog promotions first, validates coupons against the post-promotion subtotal, applies coupon stacking rules, and then applies automatic cart rules.

## Order estimate

Use `order` when you need full totals that include shipping, tax, discounts, and one or more shipping methods. This is useful for final review screens before the shopper commits, wallet address callbacks, or UI that compares shipping methods with complete totals.

Without `shippingMethod.id`, `order` returns totals for all matching shipping methods:

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/estimate/order" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "locale": "en-US",
    "shipping": {
      "country": "US",
      "state": "CA",
      "zip": "94105"
    },
    "items": [
      {
        "sku": "BLENDER-RED",
        "path": "/us/en/products/blender-pro-500",
        "quantity": 1,
        "price": { "final": "99.99", "currency": "USD" }
      }
    ],
    "couponCode": "SAVE10",
    "couponSource": "manual"
  }'
```

Example response:

```json
{
  "subtotal": "89.99",
  "discountTotal": "10.00",
  "discounts": [
    {
      "id": "coupon:SAVE10",
      "name": "Save 10",
      "type": "fixed",
      "amount": 10,
      "source": "coupon"
    }
  ],
  "taxRate": 7.25,
  "shippingMethods": [
    {
      "id": "standard-us",
      "label": "Standard shipping",
      "rate": "8.95",
      "taxAmount": "6.52",
      "total": "95.46"
    },
    {
      "id": "express-us",
      "label": "Express shipping",
      "rate": "19.95",
      "taxAmount": "6.52",
      "total": "106.46"
    }
  ]
}
```

With `shippingMethod.id`, `order` returns a single matching method:

```json
{
  "shippingMethod": { "id": "express-us" }
}
```

If the requested method does not match any available rate, `shippingMethods` is an empty array.

`/estimate/order` computes tax once against the default matching method and reuses that tax amount across methods. When the shopper selects a final method and submits checkout, `/orders/preview` recomputes the committed selected-method total and returns the `estimateToken` used by order creation.

## How discounts are applied

Estimate totals use this order of operations:

1. Load catalog promotions and automatic cart rules for the country.
2. Apply catalog promotion price overrides to line items.
3. Validate coupon code, source, country, eligibility, usage limits, and minimum order amount when applicable.
4. Apply coupon stacking rules. Non-stackable coupons suppress automatic cart rules.
5. Apply automatic cart rules, including method-scoped free shipping.
6. Attribute order-level cash discounts back to eligible line items where applicable.
7. Evaluate conditional promotions that grant free items.

See [Promotions](/promotions) and [Coupons](/coupons) for rule configuration and coupon behavior.

## Relationship to tax providers

Tax estimate and order estimate use the configured tax provider chain. When [Avalara](/checkout/tax/avalara) is configured, estimates can use Avalara for tax calculation. If the configured provider is unavailable or not configured for the request, the API can fall back to rate-based tax configuration when available.

`/orders/preview` performs the final selected-method tax calculation for order creation.

## Relationship to order preview

Use `/orders/preview` after estimates, when the shopper has selected the final shipping method and is ready to place the order.

Preview differs from estimates because it:

- Requires `shippingMethod.id`.
- Validates item prices against product data.
- Validates item country availability.
- Computes the committed tax, shipping, and discount result.
- Returns an [`estimateToken`](/orders/lifecycle#estimate-tokens).

See [Order lifecycle](/orders/lifecycle) for the full checkout sequence.

## Next steps

- [Order lifecycle](/orders/lifecycle): Understand how estimates lead into preview and order creation
- [Coupons](/coupons): Configure coupon types and codes
- [Promotions](/promotions): Configure catalog promotions and cart rules
- [Avalara tax](/checkout/tax/avalara): Configure tax provider credentials
- [API reference](/api-reference): Complete endpoint details
