---
title: "Roles and permissions"
description: "Role-based permissions for users, admins, and service tokens."
daPath: "/authentication/roles-permissions"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "6fb1e2b"
    lastContentCommit: "6fb1e2b"
---

# Roles and permissions

The Edge Commerce API uses role-based permissions. Each authenticated request is evaluated against the permission required by the route. If the token does not carry the required permission, the API returns an insufficient-scope error.

A permission has the form `{domain}:{action}`, for example `catalog:read` or `orders:write`. Some domains include a third segment, such as `journal:orders:read`.

## Roles

| Role | Who it represents | How permissions are assigned |
|------|-------------------|------------------------------|
| `user` | Authenticated customer | Automatically added to any valid user session with an email address |
| `admin` | Site administrator | Granted when the email is registered as an admin for the site |
| `service` | Legacy site-token caller | Granted when a legacy site token matches the site's configured token |
| Service token | Automation token | Not a role. A JWT service token carries an explicit permission list |

Unknown roles are ignored. A user session with an email always receives the `user` role even when no admin record exists.

## Role permissions

| Permission | User | Admin | Legacy service | JWT service token eligible |
|------------|------|-------|----------------|----------------------------|
| `catalog:read` | No | Yes | Yes | Yes |
| `catalog:write` | No | Yes | Yes | Yes |
| `orders:read` | Yes | Yes | Yes | Yes |
| `orders:write` | Yes | Yes | Yes | Yes |
| `orders:custom:write` | No | No | No | Yes |
| `index:read` | No | Yes | Yes | Yes |
| `index:write` | No | Yes | Yes | Yes |
| `customers:read` | No | Yes | No | Yes |
| `customers:write` | No | Yes | No | Yes |
| `admins:read` | No | Yes | No | No |
| `admins:write` | No | Yes | No | No |
| `service_token:read` | No | Yes | Yes | No |
| `service_token:write` | No | Yes | No | No |
| `service_token:create` | No | Yes | No | No |
| `config:read` | No | Yes | No | No |
| `config:write` | No | Yes | No | No |
| `emails:send` | No | Yes | No | Yes |
| `secrets:write` | No | Yes | No | No |
| `journal:orders:read` | No | Yes | No | Yes |
| `journal:general:read` | No | Yes | No | Yes |
| `coupons:read` | No | Yes | No | Yes |
| `coupons:write` | No | Yes | No | Yes |
| `price_rules:read` | No | Yes | No | Yes |
| `price_rules:write` | No | Yes | No | Yes |

The `JWT service token eligible` column means the permission may be delegated when creating a JWT service token. The token still receives only the permissions explicitly listed at creation time.

Administrator-management operations require both the applicable `admins:read` or `admins:write` permission and verification that the caller remains a current admin for the target site.

`PATCH /orders/{orderId}/custom` requires `orders:custom:write`. Holding `orders:write` without that dedicated permission does not authorize custom metadata updates.

## Permissions by use case

The groups below help you find individual permissions for a task. They do not grant access or create a separate API scope; the API evaluates the individual permission strings.

| Group | Permissions | Typical use |
|-------|-------------|-------------|
| Catalog | `catalog:read`, `catalog:write` | Product ingestion and product data retrieval |
| Orders | `orders:read`, `orders:write`, `orders:custom:write` | Order lookup, order creation, and custom metadata updates |
| Indexes | `index:read`, `index:write` | Product index configuration and updates |
| Customers | `customers:read`, `customers:write` | [Customer profile and address management](/customers) |
| Config | `config:read`, `config:write` | [Site configuration](/configuration/site) management |
| Checkout secrets | `secrets:write` | Writing encrypted provider credentials |
| Service tokens | `service_token:read`, `service_token:write`, `service_token:create` | Managing service and legacy site tokens |
| Admins | `admins:read`, `admins:write` | Internal site-admin record management. Not available to service tokens |
| Email | `emails:send` and optional scoped variants | Sending transactional emails |
| Journal | `journal:orders:read`, `journal:general:read` | Reading [journal entries](/orders/journal) |
| Promotions | `coupons:read`, `coupons:write`, `price_rules:read`, `price_rules:write` | Managing coupons and price rules |

## Email scopes

Service tokens can include scoped email permissions such as:

```text
emails:send:alerts@example.com
emails:send:*@example.com
```

When scoped email permissions are present, the token must also include the base `emails:send` permission. Admin sessions bypass email destination scoping.

## Next steps

- [Authentication overview](/authentication/overview): How tokens and site scoping work
- [Service tokens](/authentication/service-tokens): Create scoped tokens for automation
- [Site configuration](/configuration/site): Understand config permissions
- [Checkout secrets](/checkout/secrets): Understand why secrets require admin access
