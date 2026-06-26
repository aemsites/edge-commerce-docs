---
title: "Avalara tax"
description: "Configuration schema for the Avalara AvaTax tax provider."
daPath: "/checkout/tax/avalara"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.42.1"
    lastReviewedCommit: "e77382f"
    lastContentCommit: "e77382f"
---

# Avalara tax

Avalara AvaTax calculates tax in real time during order preview. When configured, the Edge Commerce API sends the cart, ship-to address, and ship-from address to Avalara and uses the returned tax in the order estimate. When Avalara is not configured, tax falls back to the merchant's table-based rules.

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

## Next steps

- [Checkout overview](/checkout/overview): How tax fits into the order flow
- [Secrets store](/checkout/secrets): Writing and resolving credentials
- [API reference](/api-reference): Complete API endpoint reference
