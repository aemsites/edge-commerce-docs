---
title: "Forter fraud detection"
description: "Configuration schema for the Forter fraud detection provider."
daPath: "/checkout/fraud/forter"
status: "new"
managed: "true"
sourceFormat: "markdown"
sources:
  helix-commerce-api:
    version: "2.52.2"
    lastReviewedCommit: "b5639ec5767e8cb3ea0f9683dd3b895f84363f60"
    lastContentCommit: "e77382f"
---

# Forter fraud detection

Forter is a real-time fraud detection service. When configured, the Edge Commerce API submits each transaction to Forter during the payment flow, and Forter returns an approve or decline decision before the payment is finalized. Fraud screening is optional: it is enabled simply by storing a Forter configuration. See [Order lifecycle](/orders/lifecycle) for payment state transitions and [Order journal](/orders/journal) for fraud outcome events.

Configuration is stored in the secrets store as `fraud-forter.json`. See the [secrets store guide](/checkout/secrets) for how to write it and how country/locale resolution works.

## Enabling and disabling

The presence of `fraud-forter.json` enables fraud evaluation. To turn it off without deleting the file, set `enabled` to `false`.

## Writing the configuration

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/secrets/fraud-forter.json" \
  -H "Authorization: Bearer {your-admin-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "{forter-site-id}",
    "secretKey": "{forter-secret-key}",
    "apiUrl": "https://api.forter-secure.com/v2/orders/",
    "onNotReviewed": "approve",
    "providers": {
      "chase": { "gatewayName": "chase", "gatewayMerchantId": "{merchant-id}" }
    }
  }'
```

## Schema

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `siteId` | string | Forter site ID, provided at onboarding. Used in authentication and request headers |
| `secretKey` | string | Forter secret key, provided at onboarding. Treat as a secret |
| `apiUrl` | string (HTTPS) | Forter orders API base URL. Must include a trailing slash |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Whether fraud evaluation is active. Defaults to `true` when the file exists |
| `onNotReviewed` | string | What to do when Forter cannot make a decision: `approve` (proceed, default) or `decline` (cancel the order) |
| `providers` | object | Per-payment-provider metadata Forter needs for risk scoring, keyed by provider name |

### Provider metadata

The `providers` object carries gateway details for each payment provider you use. Known providers (`chase`, `chase-wallet`, `paypal`) accept these fields:

| Field | Type | Description |
|-------|------|-------------|
| `gatewayName` | string | Gateway name reported to Forter |
| `gatewayMerchantId` | string | Gateway-level merchant identifier used for risk scoring |

Providers not listed above are accepted as free-form string maps, so a new payment provider can be added without a schema change.

## Next steps

- [Payments overview](/checkout/payments/overview): How fraud screening fits into the payment flow
- [Order journal](/orders/journal): Read fraud and payment outcome events
- [Secrets store](/checkout/secrets): Writing and resolving credentials
- [API reference](/api-reference): Complete API endpoint reference
