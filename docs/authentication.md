---
title: "Authentication overview"
description: "How users, roles, bearer tokens, and site scoping work in the Edge Commerce API."
daPath: "/authentication/overview"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "d180131"
    lastContentCommit: "ce71bd0"
---

# Authentication overview

The Edge Commerce API uses bearer tokens to identify callers and determine what they can do. A token is evaluated for three things:

1. **Identity**: who or what is calling, such as a customer, site admin, or service token.
2. **Scope**: which organization and site the token belongs to.
3. **Permissions**: which operations the token can perform.

Most management operations require an `Authorization` header:

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/products/us/en/products/example" \
  -H "Authorization: Bearer {your-token}"
```

Some checkout and customer-facing endpoints are intentionally unauthenticated, such as login, order preview, order creation, payment initiation, and payment callbacks. Those endpoints use other controls such as reCAPTCHA, order-state checks, and provider verification.

## Token types

| Token type | Used by | Notes |
|------------|---------|-------|
| Session token | Customers and admins | Issued by the one-time password login flow. Returned in the response body and as the `auth_token` cookie. The current lifetime is 24 hours |
| JWT service token | Integrations and automation | Created by an authenticated admin. Carries an explicit permission list and a maximum lifetime of one year |
| Site token | Legacy integrations | Org/site-scoped token stored for compatibility with older automation flows |

## Login flow

The user login flow has two steps:

1. `POST /auth/login`: validates the email address, checks the site's authentication setting, sends a one-time password, and returns an opaque challenge. When `auth.enabled` is unset, an existing site admin may log in to finish configuring the site. An explicit `auth.enabled: false` blocks login for all users. See [Site configuration](/configuration/site#authentication-settings) for the setting and [Transactional email](/emails#otp-email-flow) for OTP email rendering.
2. `POST /auth/callback`: verifies the code and challenge, resolves the caller's role, and issues the session token.

The callback returns the token in the response body and also sets an `auth_token` cookie with `HttpOnly`, `Secure`, and `SameSite=Strict`.

## Site scoping

Tokens are scoped to an organization and site. For most authenticated routes, the API checks that the token's org/site matches the `{org}` and `{site}` path parameters. A token for one site cannot manage another site.

Admin and service-token access is scoped to a specific organization and site.

## Roles and permissions

Roles grant permissions. Endpoints check permissions such as `catalog:read`, `orders:write`, or `secrets:write` before they run. See [Roles and permissions](/authentication/roles-permissions) for the full authored reference.

Use the smallest permission set that supports the task. For automation, prefer [service tokens](/authentication/service-tokens) rather than a human session token.

## When authentication is not required

Some endpoints are unauthenticated by design because customers or external providers need to call them. Examples include:

| Flow | Why it may be unauthenticated |
|------|-------------------------------|
| Login | A user does not have a token before requesting a one-time password |
| Order preview and creation | Guest checkout must work before the customer has an account session |
| Payment initiation | Guest checkout must be able to start payment for an existing order |
| Payment callbacks | Providers need to return the customer or payment result to the API |
| Places autocomplete | Storefront-origin validation is used rather than bearer-token authentication |

Unauthenticated does not mean unprotected. These flows use validation, rate limits, reCAPTCHA, idempotency, order-state checks, and provider verification depending on the route.

## Next steps

- [Site configuration](/configuration/site): Enable auth and configure allowed origins
- [Roles and permissions](/authentication/roles-permissions): Understand what each role can do
- [Service tokens](/authentication/service-tokens): Create scoped tokens for automation
- [API reference](/api-reference): Complete endpoint details
