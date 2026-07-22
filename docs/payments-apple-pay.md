---
title: "Apple Pay"
description: "Apple Pay merchant identity configuration."
daPath: "/checkout/payments/apple-pay"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "fef463d"
    lastContentCommit: "e77382f"
---

# Apple Pay

Apple Pay lets customers pay with a card stored in their Apple Wallet, confirmed with Face ID or Touch ID. The customer never leaves the storefront. The wallet produces an encrypted payment token that is processed through a payment processor (for example, [Chase](/checkout/payments/chase)).

The `payments-apple-pay.json` secret holds only the **Apple-side merchant identity** used to start an Apple Pay session. It is provider-agnostic: the same identity is used regardless of which processor settles the payment. The processor's own credentials live in that processor's secret file.

Configuration is stored in the secrets store as `payments-apple-pay.json`. See the [secrets store guide](/checkout/secrets) for how to write it and how country/locale resolution works.

## Merchant certificate

The Apple Pay merchant identity **certificate and private key are not stored in this file**. They are provisioned separately for the site and presented automatically when the API starts an Apple Pay session. This secret holds only the identity fields below.

## Writing the configuration

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/secrets/payments-apple-pay.json" \
  -H "Authorization: Bearer {your-admin-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant.com.example.store",
    "merchantDisplayName": "Example Store",
    "merchantDomain": "www.example.com",
    "applePayGatewayUrl": "https://apple-pay-gateway.apple.com/paymentservices/startSession"
  }'
```

## Schema

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `merchantId` | string | Merchant ID registered in the Apple Developer Portal |
| `merchantDisplayName` | string | Name shown to customers on the Apple Pay sheet |
| `merchantDomain` | string | Domain registered with Apple Pay |
| `applePayGatewayUrl` | string | Apple Pay gateway URL used to start a session. Must be an Apple Pay gateway host. Production: `https://apple-pay-gateway.apple.com/paymentservices/startSession`; sandbox: `https://apple-pay-gateway-cert.apple.com/paymentservices/startSession`; China: `https://cn-apple-pay-gateway.apple.com/paymentservices/startSession` |

The configured gateway is enforced per site: a production site configured with the production gateway will reject sandbox session requests and vice versa.

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `supportedNetworks` | string[] | Card networks shown on the Apple Pay sheet. One or more of `visa`, `masterCard`, `amex`, `discover`. When omitted, the storefront supplies the network list |

> The `enabled` field is reserved for future use. Configuring it does not currently change provider behavior.

## Next steps

- [Chase](/checkout/payments/chase): Processing Apple Pay through Chase
- [Payments overview](/checkout/payments/overview): The payment flow
- [Order lifecycle](/orders/lifecycle): Wallet payment state transitions
- [Secrets store](/checkout/secrets): Writing and resolving credentials
