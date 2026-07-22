---
title: "PayPal payments"
description: "Configuration schema for the PayPal Orders v2 provider."
daPath: "/checkout/payments/paypal"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "fef463d"
    lastContentCommit: "59379a6"
---

# PayPal payments

PayPal is integrated through the Orders v2 REST API. The customer is redirected to PayPal's checkout to approve the payment, then returned to the storefront. When order review is enabled, payment capture is deferred until the customer explicitly confirms the order on the storefront. The PayPal Express variant uses the same configuration.

Configuration is stored in the secrets store as `payments-paypal.json`. See the [secrets store guide](/checkout/secrets) for how to write it and how country/locale resolution works.

## Writing the configuration

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/secrets/payments-paypal.json" \
  -H "Authorization: Bearer {your-admin-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "{paypal-client-id}",
    "clientSecret": "{paypal-client-secret}",
    "apiBaseUrl": "https://api-m.paypal.com",
    "successUrl": "https://www.example.com/checkout/confirmation",
    "cancelUrl": "https://www.example.com/checkout/payment-failed",
    "brandName": "Example Store",
    "shippingPreference": "set_provided_address"
  }'
```

## Schema

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `clientId` | string | PayPal REST API client ID, from the PayPal Developer Dashboard |
| `clientSecret` | string | PayPal REST API client secret. Treat as a secret |
| `apiBaseUrl` | string | PayPal API environment. Must be one of `https://api-m.paypal.com` (production) or `https://api-m.sandbox.paypal.com` (sandbox) |
| `successUrl` | string (HTTPS) | Storefront URL to return to after a successful payment. The order ID is appended as a query parameter |
| `cancelUrl` | string (HTTPS) | Storefront URL to return to after a failed or cancelled payment. The order ID and a reason are appended |

The `apiBaseUrl` is restricted to PayPal's two known hostnames so a misconfiguration cannot redirect payment traffic elsewhere.

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `merchantId` | string | PayPal merchant account ID. Used for fraud evaluation as the gateway merchant ID |
| `paymentAction` | string | When funds are collected: `capture` (authorize and capture immediately, default) or `authorize` (hold, capture later) |
| `allowedCountries` | string[] | ISO 3166-1 alpha-2 codes restricting where PayPal is offered. Empty means all countries |
| `brandName` | string | Merchant name shown on PayPal's checkout page |
| `landingPage` | string | Which page PayPal shows first: `login`, `guest_checkout`, or `no_preference` (default) |
| `shippingPreference` | string | Which shipping address PayPal uses: `set_provided_address` (use the order's address), `get_from_file` (use the buyer's PayPal address), or `no_shipping` |
| `orderReview` | object | Controls whether payment capture waits for storefront order confirmation. Set `checkout` to `true` for the standard redirected checkout flow, `express` to `true` for PayPal Express, or both. Each flow defaults to `false` when omitted. |
| `orderReview.checkout` | boolean | Enables order review for the standard redirected checkout flow |
| `orderReview.express` | boolean | Enables order review for the PayPal Express flow |
| `reviewUrl` | string (HTTPS) | Storefront URL to return to after PayPal approval when order review is enabled. The order ID is appended as a query parameter. Required when `orderReview.checkout` or `orderReview.express` is `true`; ignored otherwise. |
| `locale` | string | PayPal checkout page locale (e.g. `en-US`). When empty, PayPal auto-detects from the browser |

When order review is enabled for a flow, PayPal approval returns the customer to `reviewUrl` and leaves the order in `payment_requires_confirmation`. Your storefront must display an order-review step and explicitly confirm the order to capture payment. Without order review, payment is captured after approval and the customer is sent to `successUrl`.

> The `enabled` field is reserved for future use. Configuring it does not currently change provider behavior.

## Next steps

- [Payments overview](/checkout/payments/overview): The payment flow
- [Order lifecycle](/orders/lifecycle): Order states and payment callbacks
- [Secrets store](/checkout/secrets): Writing and resolving credentials
- [API reference](/api-reference): Complete API endpoint reference
