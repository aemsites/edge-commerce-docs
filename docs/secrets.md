---
title: "Secrets store"
description: "Encrypted, write-only store for provider credentials, with country and locale scoping."
daPath: "/checkout/secrets"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "2731b0a"
    lastContentCommit: "2731b0a"
---

# Secrets store

Payment providers, fraud services, tax engines, and identity providers all need credentials: API tokens, merchant IDs, client secrets, and endpoint URLs. The Edge Commerce API stores these in a dedicated secrets store that is kept separate from regular site config: it is encrypted at rest, write-only, and isolated per site.

This guide explains how the secrets store works for every provider. Each provider's own configuration fields are documented on its own page; see [Provider secret types](#provider-secret-types) below.

## Why secrets are stored separately from config

Regular site configuration (such as tax and shipping sheets) is readable and stored in the clear. Provider credentials are different: if leaked, they could be used to process fraudulent transactions or impersonate the merchant to a provider. The secrets store treats them accordingly:

- **Encrypted at rest**: every secret is encrypted with AES-256-GCM (authenticated encryption) before it is stored, and each site has its own distinct encryption key. One site's secrets can never be decrypted with another site's key.
- **Write-only**: there is no read endpoint. Secrets can be written and overwritten through the API, but never read back. The API decrypts them internally only when a checkout flow needs them.
- **Admin-only**: writing a secret requires an authenticated admin token with the `secrets:write` permission. Service tokens are rejected even if they otherwise carry the permission.
- **Per-site isolation**: secrets are namespaced and encrypted per organization and site, so tenants never share credentials or keys.

## Writing a secret

Secrets are written with a single `PUT` request. The trailing filename in the path selects which provider schema the body is validated against.

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
    "cancelUrl": "https://www.example.com/checkout/payment-failed"
  }'
```

A successful write returns `204 No Content` with an empty body; the API does not echo back what was stored. There is no `GET`, `DELETE`, or `PATCH`; only `PUT`. To rotate a credential, write a new file to the same path and it replaces the previous one.

### Request lifecycle

Each write request runs through a strict sequence before anything is stored:

1. **Request body size**: requests that declare a body larger than 10 MiB are rejected with `413`.
2. **Authentication**: the request must carry a valid admin token.
3. **Permission**: the token must have the `secrets:write` permission.
4. **Service-token block**: service tokens are rejected with `403`, even with the permission.
5. **Org/site scope**: the token must be scoped to the same organization and site as the path.
6. **Path validation**: the path must end with `.json`, must not contain `..`, and must match the secrets-path pattern.
7. **Schema lookup**: the filename (without `.json`) must be a known provider schema; otherwise the request is rejected with `404`.
8. **Payload validation**: the body is validated against the matching schema. Unknown fields are rejected, and every URL field must use HTTPS.
9. **Encrypt and store**: the validated payload is encrypted and written.

### Response codes

| Status | Meaning |
|--------|---------|
| `204` | Secret stored (encrypted). No content returned |
| `400` | Invalid secrets path, or the body failed schema validation |
| `403` | The caller is a service token (secret writes are forbidden for service tokens) |
| `404` | The filename is not a known secret store |
| `413` | Request body is larger than 10 MiB |
| `500` | Storage error while writing the secret |

## Country and locale scoping

A site can store one global secret per provider, or override it for specific countries and locales by prefixing the filename with a country and an optional locale:

| Path | Scope |
|------|-------|
| `/payments-chase.json` | Global default |
| `/us/payments-chase.json` | Country-wide (US) |
| `/us/en-US/payments-chase.json` | Locale-specific (US / en-US) |

The country segment is a lowercase ISO 3166-1 alpha-2 code (`us`, `ca`, `de`). The locale segment is a BCP-47 language tag (`en-US`, `fr-CA`).

### How a secret is resolved at runtime

When a checkout flow needs a provider's credentials, the API resolves the secret using three-tier fallback based on the order's country and locale. It checks each candidate path in order and uses the **first one that exists**; there is no merging across tiers, so whichever file is matched must be complete on its own.

For an order with country `us` and locale `en-US`, the API looks for `payments-chase` in this order:

1. `/us/en-US/payments-chase.json`: locale-specific override
2. `/us/payments-chase.json`: country-wide default
3. `/payments-chase.json`: global default

If the order has a valid country but no valid locale, only tiers 2 and 3 are checked. If neither a valid country nor locale is present, only the global tier (3) is checked. If no file is found in any tier, the flow behaves as if the provider is not configured.

This lets a merchant keep, for example, a single global PayPal account while running separate Chase configurations for US and Canadian orders that use different merchant accounts or endpoints.

> **Important:** Resolution selects exactly one file; it does not merge a locale file on top of a global file. If you create a locale-specific override, copy all required fields into it, not just the values that differ.

## Provider secret types

The filename (without `.json`) selects the validation schema. Only these filenames are accepted:

| Filename | Provider | Documentation |
|----------|----------|---------------|
| `payments-chase` | Chase Payment Solutions | [Chase](/checkout/payments/chase) |
| `payments-paypal` | PayPal Orders v2 | [PayPal](/checkout/payments/paypal) |
| `payments-affirm` | Affirm buy-now-pay-later | [Affirm](/checkout/payments/affirm) |
| `payments-apple-pay` | Apple Pay merchant identity | [Apple Pay](/checkout/payments/apple-pay) |
| `fraud-forter` | Forter fraud detection | [Forter](/checkout/fraud/forter) |
| `taxes-avalara` | Avalara tax calculation | [Avalara](/checkout/tax/avalara) |
| `identity-idme` | ID.me identity verification | [ID.me](/checkout/identity/idme) |
| `recaptcha` | reCAPTCHA verification | [reCAPTCHA](/checkout/recaptcha) |

Each provider page documents that provider's full schema, every field, and any provider-specific behavior. Writing any of them uses the same `PUT` request and lifecycle described above; only the filename and body schema change.

### PayPal order review

The `payments-paypal.json` secret can configure an order-review step separately for standard checkout and express PayPal flows:

```json
{
  "orderReview": {
    "checkout": true,
    "express": false
  },
  "reviewUrl": "https://www.example.com/checkout/review"
}
```

Set `orderReview.checkout` to enable review after approval in the standard checkout flow. Set `orderReview.express` to enable it for express PayPal buttons. When either value is `true`, `reviewUrl` is required and must use HTTPS.

With order review enabled, the buyer returns to `reviewUrl` after approving the payment. Payment capture is deferred until the buyer explicitly confirms the order. The API appends the order ID as a query parameter to `reviewUrl`. When order review is omitted or disabled for a flow, payment is captured immediately after approval and the buyer is sent to `successUrl`.

### reCAPTCHA

The `recaptcha.json` secret provides the Google project and API key values used for reCAPTCHA verification on unauthenticated write endpoints, such as order creation, order preview, and login. Enforcement is enabled in [site configuration](/configuration/site#recaptcha-settings) with `recaptcha.enabled`. Unlike the providers above, the secret is configured site-wide and does not use country or locale scoping. See the [reCAPTCHA page](/checkout/recaptcha) for the full schema and protected endpoints.

## Next steps

- [Checkout overview](/checkout/overview): How the provider groups fit together
- [Payments overview](/checkout/payments/overview): How payment providers use these credentials
- [Site configuration](/configuration/site): Configure non-secret site settings
- [API reference](/api-reference): Complete API endpoint reference