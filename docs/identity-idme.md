---
title: "ID.me identity verification"
description: "Configuration schema for the ID.me community verification provider."
daPath: "/checkout/identity/idme"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.42.1"
    lastReviewedCommit: "e77382f"
    lastContentCommit: "e77382f"
---

# ID.me identity verification

ID.me verifies that a customer belongs to a group (such as military, medical workers, nurses, first responders, or teachers) so the storefront can grant group-based discounts. Verification uses OAuth 2.0: the customer is sent to ID.me to confirm their status, and on success the API applies a configured coupon code to the cart.

Configuration is stored in the secrets store as `identity-idme.json`. See the [secrets store guide](/checkout/secrets) for how to write it and how country/locale resolution works.

## Writing the configuration

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/secrets/identity-idme.json" \
  -H "Authorization: Bearer {your-admin-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "{idme-client-id}",
    "clientSecret": "{idme-client-secret}",
    "couponCode": "IDME_VERIFIED",
    "redirectUri": "https://api.adobecommerce.live/{org}/sites/{site}/identity/idme/callback",
    "scopes": "military medical nurse responder teacher"
  }'
```

## Schema

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `clientId` | string | OAuth 2.0 client ID issued by ID.me |
| `clientSecret` | string | OAuth 2.0 client secret issued by ID.me. Treat as a secret |
| `couponCode` | string | Coupon code applied to the cart when verification succeeds |
| `redirectUri` | string (HTTPS) | Exact redirect URI registered with ID.me. Must match the value sent in the authorization request, or ID.me rejects it |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `scopes` | string | Space- or comma-separated ID.me group scopes requested at authorization. Defaults to the standard retail groups when omitted |
| `sandbox` | boolean | When `true`, directs ID.me calls to the sandbox environment. Must be `false` or omitted in production |
| `apiBase` | string (HTTPS) | API base URL override. When set, takes precedence over the sandbox/production defaults. No trailing slash |

## Next steps

- [Coupons guide](/coupons): How the applied coupon code is defined
- [Secrets store](/checkout/secrets): Writing and resolving credentials
- [Checkout overview](/checkout/overview): How identity verification fits in
