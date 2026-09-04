---
title: "Set up administrative access"
description: "Provision a site, sign in with a one-time password, manage site admins, and create service tokens."
daPath: "/authentication/setup"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.62.0"
    lastReviewedCommit: "1c9224b"
    lastContentCommit: "6fb1e2b"
---

# Set up administrative access

Use this walkthrough when setting up access to an Edge Commerce site for the first time. It covers the required Adobe provisioning step, signing in with a one-time password (OTP), adding site admins, and creating a service token for an integration.

## Choose an environment

Edge Commerce has separate production and staging environments:

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.adobecommerce.live` |
| Staging | `https://api-stage.adobecommerce.live` |

Staging and production are set up separately. Configure your site and admin access in each environment. Sign in to the environment you are working in and use its session or service token with the matching API URL. The examples below use production; for staging, replace `api.adobecommerce.live` with `api-stage.adobecommerce.live`.

## Before you begin

Initial site access is not self-service. Contact your Adobe representative for each environment you need to use and provide:

- Your org and site.
- The email address for the initial site administrator.

Adobe must create the site configuration and register the initial administrator together in each environment. Until those steps are complete, the initial administrator cannot obtain an administrative session or create service tokens.

After Adobe confirms that setup is complete, record the org and site. They appear in every API path in this guide.

## Step 1: Sign in with OTP

The OTP flow has two requests. First, request a code for the email address registered as an administrator:

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "{initial-admin-email}"
  }'
```

A successful response contains the challenge values required to verify the code:

```json
{
  "email": "admin@example.com",
  "hash": "{opaque-challenge-hash}",
  "exp": 1760000000000
}
```

Retrieve the code from the email, then submit the code and every value from the preceding response. The code expires after five minutes and can be used once.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/auth/callback" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "{email-from-login-response}",
    "code": "{otp-code}",
    "hash": "{hash-from-login-response}",
    "exp": {exp-from-login-response}
  }'
```

The response contains the session token and resolved roles:

```json
{
  "success": true,
  "token": "{admin-session-token}",
  "email": "admin@example.com",
  "roles": ["admin"],
  "org": "{org}",
  "site": "{site}"
}
```

Use the response `token` as `{admin-session-token}` in the `Authorization` header for the remaining steps. The response also sets an `auth_token` cookie for browser clients. A session token is valid for 24 hours.

If `roles` does not include `admin`, the email has authenticated as a user but is not registered as a site administrator.

## Step 2: Add site administrators

An administrator record grants the matching email address the `admin` role after that person completes the OTP flow. Adding an administrator does not send an invitation or an OTP email.

Listing, retrieving, and creating administrator records requires the corresponding `admins:read` or `admins:write` permission; removing an administrator requires `admins:write`. The caller must also be a current administrator for the organization and site. Do not use a service token: service tokens cannot manage administrators. If your session does not have the required permission, contact Adobe or your site administrator to make the change.

Optionally, list the current administrators before adding someone:

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/auth/admins" \
  -H "Authorization: Bearer {admin-session-token}"
```

Add an administrator by email address. There is no request body:

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/auth/admins/{new-admin-email}" \
  -H "Authorization: Bearer {admin-session-token}"
```

A successful request returns `201 Created` and the new administrator record:

```json
{
  "email": "new-admin@example.com",
  "dateAdded": "2026-01-01T00:00:00.000Z",
  "addedBy": "{actor-identifier}"
}
```

The new administrator can now complete [Step 1](#step-1-sign-in-with-otp) using that email address. An administrator is scoped to one organization and site; add the email separately for each site they must manage.

If the API returns `409 Conflict`, that email is already registered as an administrator. If it returns a permission error, use a session with the required admin-management permission or contact Adobe.

### Remove an administrator

Removing an administrator requires `admins:write`. Use the email returned by the add or list request:

```bash
curl -X DELETE "https://api.adobecommerce.live/{org}/sites/{site}/auth/admins/{admin-email}" \
  -H "Authorization: Bearer {admin-session-token}"
```

A successful request returns the removed email and `"removed": true`. Removing an administrator prevents new administrative sessions for that email. Existing session tokens remain valid until they expire or the person signs out.

## Step 3: Create a service token

Create a service token for each integration or automation job. Service tokens are scoped to the organization and site, carry only the permissions selected at creation time, and expire after the requested lifetime. They are for machine-to-machine use, not for browser users or administrator setup.

Creating a token requires an authenticated admin session with `service_token:create`. The following example creates a 30-day token for catalog ingestion:

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/auth/service_token" \
  -H "Authorization: Bearer {admin-session-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Catalog ingestion",
    "permissions": ["catalog:read", "catalog:write", "index:write"],
    "ttl": 2592000,
    "contactEmails": ["ops@example.com"]
  }'
```

The response contains the bearer token and its lifetime in seconds:

```json
{
  "token": "{service-token}",
  "ttl": 2592000
}
```

Store the token in your secret management system immediately. It is returned only when it is created. Do not put it in source control, browser code, or logs.

Choose only the permissions the integration needs. See [allowed permissions](/authentication/service-tokens#allowed-permissions) for the complete service-token scope list. The maximum `ttl` is one year. Service tokens cannot create or revoke other service tokens, manage site admins, write secrets, or manage site configuration.

## Ongoing access management

- Create one service token per integration or automation job so it can be rotated or revoked independently.
- Use a human administrative session for site configuration, credential setup, and administrator changes.
- Revoke a service token when the integration is retired or its owner changes.
- Remove administrator access when a person's responsibilities change.

## Troubleshooting

| Problem | What to check |
|---------|---------------|
| Login returns `401 Unauthorized` | Confirm that Adobe completed site provisioning and registered the email as the initial administrator. An explicit disabled authentication setting also prevents OTP login. |
| The code is rejected | Request a new OTP code. Codes expire after five minutes and cannot be reused. |
| The OTP email does not arrive | Confirm that you used the registered email address, then review the [OTP email flow](/emails#otp-email-flow). |
| The callback returns only the `user` role | The email is not a site administrator. Confirm that it was added for the correct organization and site. |
| Adding an admin returns a permission error | The session lacks `admins:write`. Use an authorized session or contact Adobe. |
| Creating a service token returns a permission error | Use an authenticated administrator session with `service_token:create`, not a service token. |

## Next steps

- [Authentication overview](/authentication/overview): Learn how tokens, roles, and site scoping work
- [Roles and permissions](/authentication/roles-permissions): Review available permissions and service-token restrictions
- [Service tokens](/authentication/service-tokens): Choose permissions, manage lifetimes, and revoke tokens
- [Site configuration](/configuration/site): Configure authentication and other site settings
