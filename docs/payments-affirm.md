---
title: "Affirm payments"
description: "Configuration schema for the Affirm buy-now-pay-later provider."
daPath: "/checkout/payments/affirm"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "43a89f0"
    lastContentCommit: "e77382f"
---

# Affirm payments

Affirm is a buy-now-pay-later provider. At checkout the customer is taken through Affirm's flow (either a full-page redirect or an in-page modal) to set up financing, then returned to the storefront. Affirm is region-specific: a US account and a Canadian account use different keys and endpoints, configured with separate secret files per country.

Configuration is stored in the secrets store as `payments-affirm.json`. See the [secrets store guide](/checkout/secrets) for how to write it and how country/locale resolution works.

## Writing the configuration

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/secrets/payments-affirm.json" \
  -H "Authorization: Bearer {your-admin-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "publicApiKey": "{affirm-public-api-key}",
    "privateApiKey": "{affirm-private-api-key}",
    "apiBaseUrl": "https://api.affirm.com",
    "affirmJsUrl": "https://cdn1.affirm.com/js/v2/affirm.js",
    "countryCode": "USA",
    "paymentAction": "auth_capture",
    "successUrl": "https://www.example.com/checkout/confirmation",
    "cancelUrl": "https://www.example.com/checkout/payment-failed"
  }'
```

For Canadian operation, write a full Affirm-Canada configuration to a country-scoped path such as `/ca/payments-affirm.json` with `countryCode: "CAN"`. Because resolution does not merge tiers, the country file must be complete on its own.

## Schema

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `publicApiKey` | string | Affirm public API key (region-specific). Passed to the Affirm client and used for server-to-server calls |
| `privateApiKey` | string | Affirm private API key (region-specific). Treat as a secret |
| `apiBaseUrl` | string (HTTPS) | Affirm API base URL, from the Affirm dashboard |
| `affirmJsUrl` | string (HTTPS) | URL of the Affirm client script for the target region and environment |
| `countryCode` | string | Region the account operates in: `USA` (United States, USD) or `CAN` (Canada, CAD) |
| `paymentAction` | string | When Affirm settles: `auth_capture` (authorize and capture during checkout) or `authorize` (authorize only, capture when goods ship) |
| `successUrl` | string (HTTPS) | Storefront URL to return to after a successful payment. The order ID is appended as a query parameter |
| `cancelUrl` | string (HTTPS) | Storefront URL to return to after a failed or cancelled payment. The order ID and a reason are appended |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `minOrderTotal` | number | Minimum order total (in the order's currency) for Affirm to be offered. Initiation below this is rejected. Affirm enforces its own floor as well |
| `maxOrderTotal` | number | Maximum order total for Affirm to be offered. Initiation above this is rejected |
| `merchantName` | string | Merchant display name shown on the Affirm checkout page |
| `checkoutMode` | string | How the Affirm client presents checkout: `modal` (in-page overlay) or `redirect` (full-page redirect, default) |

> The `enabled` field is reserved for future use. Configuring it does not currently change provider behavior.

## Next steps

- [Payments overview](/checkout/payments/overview): The payment flow
- [Order lifecycle](/orders/lifecycle): Order states and payment callbacks
- [Secrets store](/checkout/secrets): Writing and resolving credentials
- [API reference](/api-reference): Complete API endpoint reference
