---
title: "Chase payments"
description: "Configuration schema for the Chase Payment Solutions provider."
daPath: "/checkout/payments/chase"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "fef463d"
    lastContentCommit: "e77382f"
---

# Chase payments

Chase Payment Solutions is integrated through the Orbital Hosted Pay Page (HPP): the customer is redirected to a Chase-hosted page to enter their card details, so card data never touches the storefront or the API. After payment, Chase returns the customer to the API, which verifies the transaction directly with Chase before confirming the order.

Configuration is stored in the secrets store as `payments-chase.json`. See the [secrets store guide](/checkout/secrets) for how to write it and how country/locale resolution works.

## Writing the configuration

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/secrets/payments-chase.json" \
  -H "Authorization: Bearer {your-admin-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "hostedSecureId": "{hosted-secure-id}",
    "hostedSecureApiToken": "{hosted-secure-api-token}",
    "initUrl": "https://{merchant}.chasepaymentechhostedpay-var.com/direct/services/request/init",
    "redirectUrl": "https://{merchant}.chasepaymentechhostedpay-var.com/securepayments/a1/cc_collection.php",
    "serviceUrl": "https://{merchant}.chasepaymentechhostedpay-var.com/direct/services/request/query",
    "successUrl": "https://www.example.com/checkout/confirmation",
    "cancelUrl": "https://www.example.com/checkout/payment-failed",
    "creditCardTypes": ["Visa", "MasterCard", "American Express", "Discover"],
    "transType": "auth_capture"
  }'
```

## Schema

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `hostedSecureId` | string | Merchant Hosted Pay Page identifier. Sent on every call to Chase |
| `hostedSecureApiToken` | string | API token that authenticates calls to Chase. Treat as a secret |
| `initUrl` | string (HTTPS) | Hosted Pay Page Init URL that creates a payment session |
| `redirectUrl` | string (HTTPS) | Hosted Pay Page the customer is redirected to for card entry |
| `serviceUrl` | string (HTTPS) | Hosted Pay Page Service URL that queries and verifies a completed transaction |
| `successUrl` | string (HTTPS) | Storefront URL to return to after a successful payment. The order ID is appended as a query parameter |
| `cancelUrl` | string (HTTPS) | Storefront URL to return to after a failed or cancelled payment. The order ID and a reason are appended |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `creditCardTypes` | string[] | Card brands accepted on the hosted page. One or more of `Visa`, `MasterCard`, `American Express`, `Discover`, `JCB`, `Diners Club` |
| `transType` | string | When funds are captured: `auth_capture` (authorize and capture immediately, default), `auth_only` (authorize only, capture later), or `store_authorize` (authorize and store credentials for installments) |
| `maxUserRetries` | number | How many times the customer can retry card entry on the hosted page (0–10) before Chase redirects to the cancel URL |
| `templateUrl` | string (HTTPS) | URL of a merchant-hosted template used to brand the Chase hosted page |
| `safetechMerchantId` | string | Enables Chase SafeTech fraud screening. When set, Chase runs fraud rules and can decline a transaction before approval. Omit to disable |

> The schema also defines several fields reserved for future capabilities (Orbital Gateway credentials such as `username`, `password`, `merchantId`, `terminalId`, `bin`, `avsUrl`, and `orbitalEndpoint`, plus `enabled`, `title`, and `language`). Configure them only when your implementation requires the corresponding wallet or Orbital feature.

## Apple Pay and Google Pay through Chase

Apple Pay and Google Pay can be processed through the same Chase account using the wallet flow. That flow reuses this `payments-chase.json` configuration; you do not create a separate secret file for it. See [Apple Pay](/checkout/payments/apple-pay) for the Apple-side identity configuration that accompanies it.

## Next steps

- [Payments overview](/checkout/payments/overview): The payment flow
- [Order lifecycle](/orders/lifecycle): Order states and payment callbacks
- [Secrets store](/checkout/secrets): Writing and resolving credentials
- [Apple Pay](/checkout/payments/apple-pay): Apple Pay merchant identity
