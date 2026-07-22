---
title: "Avalara tax"
description: "Configuration schema for the Avalara AvaTax tax provider."
daPath: "/checkout/tax/avalara"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "59379a6"
    lastContentCommit: "59c24a6"
---

# Avalara tax

Avalara AvaTax calculates tax in real time during estimates and order preview. When configured, the Edge Commerce API sends the cart, ship-to address, and ship-from address to Avalara and uses the returned tax in the order estimate. When Avalara is not configured, tax falls back to the merchant's table-based rules. See [Estimates and cart totals](/estimates#relationship-to-tax-providers) for how tax fits into cart totals.

Configuration is stored in the secrets store as `taxes-avalara.json`. See the [secrets store guide](/checkout/secrets) for how to write it and how country/locale resolution works.

## Enabling and disabling

The presence of `taxes-avalara.json` (with `enabled` not set to `false`) activates Avalara. To turn it off without deleting the file, set `enabled` to `false`.

## Writing the configuration

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/secrets/taxes-avalara.json" \
  -H "Authorization: Bearer {your-admin-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "{avalara-account-number}",
    "licenseKey": "{avalara-license-key}",
    "serviceUrl": "https://rest.avatax.com/api/v2/transactions/createoradjust",
    "companyCode": "EXAMPLE_US",
    "originAddress": {
      "line1": "123 Warehouse Way",
      "city": "Portland",
      "region": "OR",
      "postalCode": "97201",
      "country": "US"
    }
  }'
```

## Schema

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `accountNumber` | string | Avalara account number |
| `licenseKey` | string | Avalara license key. Treat as a secret |
| `serviceUrl` | string (HTTPS) | Full Avalara API endpoint URL (sandbox or production) |
| `companyCode` | string | Avalara company code for this site or country (e.g. `EXAMPLE_US`, `EXAMPLE_CAN`) |
| `originAddress` | object | Ship-from address used to determine tax jurisdiction |

The `originAddress` object requires `line1`, `city`, `region`, `postalCode`, and `country` (ISO 3166-1 alpha-2).

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Whether Avalara is active. Defaults to `true` when the file exists |
| `currencyCode` | string | ISO 4217 currency code. Defaults to `USD` |
| `transactionType` | string | Avalara transaction type. Defaults to `SalesOrder` |
| `commit` | boolean | Whether to finalize the transaction in Avalara. Defaults to `false` (recorded but not committed) |
| `shippingCode` | string | Item code used for the shipping line. Defaults to `Freight` |
| `adjustmentReason` | string | Reason code for adjustment calls. Defaults to `Other` |
| `adjustmentDescription` | string | Optional description for adjustment calls |
| `timeoutMs` | number | Request timeout in milliseconds. Defaults to `5000` |
| `paymentMethodFees` | object | Per-payment-method fee multipliers folded into the tax total, keyed by payment method (e.g. `{ "chase": 0.02 }`) |
| `taxRules` | array | Conditional rules that select provider-backed or fallback tax and can adjust provider results |

## Conditional tax rules

Use `taxRules` when tax behavior depends on the payment method, checkout flow, or checkout entry point. Each rule requires a `name` and a `taxSource` of `provider` or `fallback`.

```json
{
  "taxRules": [
    {
      "name": "express-cart-adjustment",
      "match": {
        "paymentMethod": "apple-pay",
        "checkoutFlow": "express",
        "entryPoint": "cart"
      },
      "taxSource": "provider",
      "adjustments": {
        "taxAdjustmentRate": 0.1
      }
    },
    {
      "name": "default-provider",
      "taxSource": "provider"
    }
  ]
}
```

The optional `match` object supports these fields:

| Field | Values |
|-------|--------|
| `paymentMethod` | A non-empty payment method identifier |
| `checkoutFlow` | `standard` or `express` |
| `entryPoint` | `cart`, `checkout`, or `pdp` |

Omitted match fields act as wildcards. A rule without `match` is a default candidate. When multiple rules match, the rule with the most configured match fields wins; configuration order breaks ties.

A `provider` rule uses Avalara. Its optional `adjustments.taxAdjustmentRate` must be between `0` and `1`; `0.1` adds 10% to the provider's total and line-level tax values. A matched rule adjustment takes precedence over `paymentMethodFees`. A `fallback` rule skips Avalara and uses the configured rate-based tax table. Fallback rules cannot include `adjustments`.

Storefronts must send the matching `paymentMethod`, `checkoutFlow`, and `entryPoint` values in order estimates and order previews. See [Estimates and cart totals](/estimates#common-request-fields).

## Next steps

- [Checkout overview](/checkout/overview): How tax fits into the order flow
- [Estimates and cart totals](/estimates): How tax is calculated during cart estimates
- [Secrets store](/checkout/secrets): Writing and resolving credentials
- [API reference](/api-reference): Complete API endpoint reference
