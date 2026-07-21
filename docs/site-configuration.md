---
title: "Site configuration"
description: "Configure allowed origins, authentication, reCAPTCHA, email branding, friendly order IDs, and experimental flags."
daPath: "/configuration/site"
status: "new"
managed: "true"
sourceFormat: "markdown"
sources:
  helix-commerce-api:
    version: "2.52.2"
    lastReviewedCommit: "b5639ec5767e8cb3ea0f9683dd3b895f84363f60"
    lastContentCommit: "e8f6b93"
---

# Site configuration

Site configuration controls behavior that applies to one organization and site: allowed storefront origins, authentication, reCAPTCHA enforcement, email branding, friendly order IDs, and experimental flags.

Configuration is stored as one JSON document per site and is separate from the encrypted [secrets store](/checkout/secrets). Use site configuration for non-secret settings. Use the secrets store for provider credentials, API keys, private tokens, and payment processor configuration.

## Manage configuration

Retrieving configuration requires `config:read`. Creating, replacing, or deleting configuration requires `config:write`. See [Roles and permissions](/authentication/roles-permissions#permission-groups) for how these permissions fit into the access model.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/config" \
  -H "Authorization: Bearer {your-admin-token}"
```

`POST /config` replaces the full configuration document:

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/config" \
  -H "Authorization: Bearer {your-admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "allowedOrigins": ["https://www.example.com"],
    "allowedDeliverySites": ["main--example--aemsites"],
    "auth": { "enabled": true },
    "recaptcha": { "enabled": true },
    "emails": {
      "branding": {
        "logoUrl": "https://www.example.com/logo.png",
        "brandColor": "#0367e0",
        "supportEmail": "support@example.com"
      },
      "transactional": {
        "sender": "orders@example.com",
        "fromName": "Example Store",
        "replyTo": "support@example.com"
      }
    }
  }'
```

A successful update returns the stored configuration. `DELETE /config` removes the configuration document and returns `204 No Content`.

## Schema overview

All top-level fields are optional, and unknown fields are rejected.

| Field | Type | Description |
|-------|------|-------------|
| `allowedOrigins` | string[] | Canonical storefront origins allowed to call origin-sensitive endpoints |
| `allowedDeliverySites` | string[] | Delivery site slugs allowed to call origin-sensitive endpoints |
| `auth` | object | One-time password login settings |
| `recaptcha` | object | reCAPTCHA enforcement and bypass settings |
| `emails` | object | Branding and sender settings for OTP and transactional email |
| `experimentalFlags` | object | Boolean feature flags |
| `friendlyId` | object | Friendly order ID generation settings |
| `geoOverrides` | array | Country-specific overrides for selected configuration fields |

## Allowed origins

`allowedOrigins` entries must be canonical origins. These values are enforced by browser-facing flows such as [Places and address validation](/places) and reCAPTCHA-protected checkout requests:

```json
{
  "allowedOrigins": ["https://www.example.com", "https://shop.example.com"]
}
```

Rules:

- Include the scheme (`https://` or, for local development only, `http://`).
- Include only the origin: no path, query string, fragment, or trailing slash.
- Ports are allowed when they are part of the origin, such as `http://localhost:3000`.

Valid examples:

```text
https://www.example.com
https://shop.example.com
http://localhost:3000
```

Invalid examples:

```text
www.example.com
https://www.example.com/
https://www.example.com/checkout
https://www.example.com?preview=true
```

## Allowed delivery sites

`allowedDeliverySites` entries use delivery slugs, not full URLs:

```json
{
  "allowedDeliverySites": ["main--example--aemsites", "*--example--aemsites"]
}
```

The format is:

```text
{ref}--{site}--{org}
```

Each segment may be a concrete slug or `*` at the root `allowedDeliverySites` level. Do not include `https://` or `.aem.page` / `.aem.live`.

## Authentication settings

The `auth` object controls whether the one-time password login flow is enabled for the site.

```json
{
  "auth": { "enabled": true }
}
```

When `auth.enabled` is `true`, customers and admins can use `POST /auth/login`. When the value is unset, an existing site admin may still log in to bootstrap configuration. Creating the first admin also enables authentication when no value has been set. An explicit `auth.enabled: false` blocks login for everyone. The only supported field under `auth` is `enabled`.

See [Authentication overview](/authentication/overview) for the login flow and token model.

## reCAPTCHA settings

The `recaptcha` object controls enforcement for protected unauthenticated endpoints. This is separate from the `recaptcha.json` secret, which stores the Google project and API key values.

```json
{
  "recaptcha": {
    "enabled": true,
    "bypassOrigins": ["https://tools.example.com"],
    "bypassDeliverySites": ["*--tools-site--aemsites"]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Enables reCAPTCHA checks for protected unauthenticated requests |
| `bypassOrigins` | string[] | Canonical origins that skip the reCAPTCHA gate |
| `bypassDeliverySites` | string[] | Delivery site slugs that skip the reCAPTCHA gate |

`bypassOrigins` uses the same canonical-origin format as `allowedOrigins`.

`bypassDeliverySites` uses the same `{ref}--{site}--{org}` format as `allowedDeliverySites`, but only the `{ref}` segment may be `*`. The `{site}` and `{org}` segments must be concrete.

Do not put `allowedOrigins` or `allowedDeliverySites` inside `recaptcha`; those fields live at the root level.

See [reCAPTCHA verification](/checkout/recaptcha) for the secret and protected endpoints.

## Email settings

The `emails` object configures branding and sender information for one-time password and transactional email. See [Transactional email](/emails) for template paths and rendering behavior.

```json
{
  "emails": {
    "branding": {
      "logoUrl": "https://www.example.com/logo.png",
      "brandColor": "#0367e0",
      "supportEmail": "support@example.com",
      "supportPhone": "800-555-0123",
      "footerAddress": "Example Inc., 123 Main St, Portland OR 97201"
    },
    "otp": {
      "sender": "login@example.com",
      "fromName": "Example Store",
      "replyTo": "support@example.com"
    },
    "transactional": {
      "sender": "orders@example.com",
      "fromName": "Example Store",
      "replyTo": "support@example.com"
    }
  }
}
```

### Branding fields

| Field | Type | Description |
|-------|------|-------------|
| `logoUrl` | string | HTTPS logo URL shown in fallback email templates |
| `brandColor` | string | Hex color or CSS color name used in fallback templates |
| `supportEmail` | string | Support email address shown in fallback templates |
| `supportPhone` | string | Support phone number shown in fallback templates. HTML characters are rejected |
| `footerAddress` | string | Merchant address shown in fallback templates. HTML characters are rejected |

### Sender fields

Both `emails.otp` and `emails.transactional` support:

| Field | Type | Description |
|-------|------|-------------|
| `sender` | string | Sender email address |
| `fromName` | string | Display name in the From header |
| `replyTo` | string | Reply-To address |

## Friendly order IDs

`friendlyId` controls the short order identifier appended to generated order IDs and used in provider-facing order references.

```json
{
  "friendlyId": {
    "characters": "digits",
    "length": 8,
    "prefix": "ord"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `characters` | string | Named preset or literal character set. Must contain at least two characters and cannot include `/`, URL separators, spaces, or HTML-sensitive characters |
| `length` | integer | Number of generated characters, from 4 to 32 |
| `prefix` | string | Optional prefix, from 1 to 8 characters. Uses the same character restrictions |

## Geographic overrides

Use `geoOverrides` to replace selected configuration values for requests associated with a specific country. Each entry requires a lowercase ISO 3166-1 alpha-2 `country` code. When a request country matches, the entry is deep-merged over the top-level configuration; without a match, the top-level values remain in effect.

```json
{
  "emails": {
    "branding": { "supportEmail": "support@example.com" }
  },
  "friendlyId": {
    "prefix": "ord",
    "length": 8
  },
  "geoOverrides": [
    {
      "country": "ca",
      "emails": {
        "branding": { "supportEmail": "support-ca@example.com" },
        "transactional": { "sender": "orders-ca@example.com" }
      },
      "friendlyId": { "prefix": "ca" },
      "experimentalFlags": { "regionalCheckout": true }
    }
  ]
}
```

An override may contain:

- `friendlyId`
- `emails.branding`
- `emails.transactional`
- `experimentalFlags`

Browser access, authentication, reCAPTCHA, and OTP email settings cannot be overridden because those flows do not resolve a request country before using configuration. Do not include `allowedOrigins`, `allowedDeliverySites`, `auth`, `recaptcha`, or `emails.otp` in an override.

If duplicate entries use the same country, the first match wins. Keep one entry per country so behavior remains clear.

## Experimental flags

`experimentalFlags` is an object of boolean flags:

```json
{
  "experimentalFlags": {
    "disablePriceConsistency": true
  }
}
```

Only boolean values are accepted. Experimental flags should be used only when directed by the Adobe team because they may change behavior without the same compatibility guarantees as stable configuration fields.

## Validation rules

The configuration schema rejects unknown fields at every level. This means older flat keys such as `authEnabled`, `otpEmailSender`, or `transactionalEmails` are not accepted. Use the nested objects documented above.

If a configuration update fails validation, the API returns `400` with field-level validation errors.

## Next steps

- [Authentication overview](/authentication/overview): Configure auth and understand login behavior
- [reCAPTCHA verification](/checkout/recaptcha): Configure the reCAPTCHA secret used with `recaptcha.enabled`
- [Service tokens](/authentication/service-tokens): Create scoped tokens for automation
- [Transactional email](/emails): Configure OTP and order confirmation templates
- [Places and address validation](/places): Configure allowed origins for browser address flows
- [API reference](/api-reference): Complete endpoint details
