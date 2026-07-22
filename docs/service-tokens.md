---
title: "Service tokens"
description: "Create and manage scoped tokens for automation and integrations."
daPath: "/authentication/service-tokens"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "59379a6"
    lastContentCommit: "5577796"
---

# Service tokens

Service tokens are bearer tokens for automation. Use them for integrations that need to call the Edge Commerce API without a human session, such as catalog ingestion, order processing, transactional email, or promotion management.

A service token is scoped to one organization and site, has an explicit permission list, and expires after a configured lifetime. The maximum lifetime is one year.

## When to use a service token

Use a service token for recurring machine-to-machine tasks:

| Task | Example permissions |
|------|---------------------|
| Product ingestion | `catalog:read`, `catalog:write`, `index:write` |
| Order automation | `orders:read`, `orders:write` |
| Customer data sync | `customers:read`, `customers:write` |
| Transactional email | `emails:send` plus optional destination scopes |
| Promotions management | `coupons:read`, `coupons:write`, `price_rules:read`, `price_rules:write` |
| [Journal reads](/orders/journal) | `journal:orders:read`, `journal:general:read` |

Do not use service tokens for credential setup, site configuration, site-admin management, or token administration. Those operations require an authenticated admin session or are handled outside service-token automation.

## Create a service token

Creating a service token requires an authenticated admin session with `service_token:create`. Service tokens cannot create other service tokens.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/auth/service-token" \
  -H "Authorization: Bearer {your-admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Catalog ingestion",
    "permissions": ["catalog:read", "catalog:write", "index:write"],
    "ttl": 2592000,
    "contactEmails": ["ops@example.com"]
  }'
```

The response includes the token and the requested lifetime:

```json
{
  "token": "eyJhbGci...",
  "ttl": 2592000
}
```

Store the token securely. It is only returned when it is created.

## Request fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Human-readable label for the token. Use a label that identifies the integration or owner |
| `permissions` | Yes | Non-empty list of permissions from the service-token allowlist |
| `ttl` | Yes | Lifetime in seconds. Must be a positive integer and cannot exceed one year |
| `contactEmails` | No | Up to 25 owner contact emails. When omitted, the caller's email is used when available |

## Allowed permissions

A service token can be created only with permissions from this allowlist:

| Permission | Use |
|------------|-----|
| `catalog:read` | Read product data |
| `catalog:write` | Create, update, or delete product data |
| `orders:read` | Read orders |
| `orders:write` | Create or update orders |
| `orders:custom:write` | Add, replace, or remove custom metadata on existing orders |
| `index:read` | Read index configuration |
| `index:write` | Create or update index configuration |
| `customers:read` | Read customer records |
| `customers:write` | Create or update customer records |
| `emails:send` | Send transactional email |
| `journal:orders:read` | Read [order journal](/orders/journal) entries |
| `journal:general:read` | Read general journal entries |
| `coupons:read` | Read coupon types and codes |
| `coupons:write` | Create or update coupon types and codes |
| `price_rules:read` | Read catalog and cart price rules |
| `price_rules:write` | Create or update catalog and cart price rules |

Permissions outside this list are rejected at token creation time.

Updating `PATCH /orders/{orderId}/custom` requires `orders:custom:write`. The broader `orders:write` permission does not grant access to this endpoint.

## Email destination scopes

A service token with `emails:send` can optionally restrict which recipients it may send to. Add one or more scoped permissions using exact addresses or a domain pattern:

```json
{
  "permissions": [
    "emails:send",
    "emails:send:orders@example.com",
    "emails:send:*@example.com"
  ]
}
```

If a scoped `emails:send:{scope}` permission is present, the base `emails:send` permission must also be present. Domain patterns support `*` only as the local part, such as `*@example.com`.

## Revoke a service token

Revoking a service token requires an authenticated admin session with `service_token:write`. A service token cannot revoke itself or another service token.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/auth/service-token/revoke" \
  -H "Authorization: Bearer {your-admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "{service-token-to-revoke}"
  }'
```

A successful revoke returns `204 No Content`.

## Legacy site tokens

The API also supports a legacy per-site token managed at `/auth/token`. Site tokens are retained for compatibility with older automation flows. New integrations should use scoped JWT service tokens because they can expire and carry a narrower permission set.

Legacy site tokens have a fixed legacy service role. They can read and write catalog data, read and write orders, read service-token state, and read/write index configuration. They cannot write secrets, create service tokens, revoke service tokens, or manage admins.

## Best practices

- Create one token per integration or automation job.
- Grant only the permissions the integration needs.
- Use the shortest practical `ttl` and rotate tokens regularly.
- Store tokens in a secret management system, not source code.
- Revoke tokens when an integration is retired or ownership changes.
- Use an admin session, not a service token, for credential setup in the [secrets store](/checkout/secrets).

## Next steps

- [Authentication overview](/authentication/overview): Understand token types and site scoping
- [Roles and permissions](/authentication/roles-permissions): Compare service-token permissions with user and admin roles
- [API reference](/api-reference): Complete endpoint details
