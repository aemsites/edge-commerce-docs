---
title: "reCAPTCHA verification"
description: "Configuration schema for reCAPTCHA Enterprise abuse protection on unauthenticated endpoints."
daPath: "/checkout/recaptcha"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "d180131"
    lastContentCommit: "e77382f"
---

# reCAPTCHA verification

reCAPTCHA Enterprise protects the API's unauthenticated write endpoints from automated abuse. When configured, the API verifies a reCAPTCHA token on each protected request (order creation, order preview, and login) and rejects requests that fail the assessment. This helps block automated abuse before payment is initiated.

Unlike the payment, fraud, tax, and identity providers, reCAPTCHA is not tied to a single checkout step and is configured site-wide; it does not use country or locale scoping.

reCAPTCHA uses two pieces of configuration:

- Site configuration enables enforcement and optional bypass rules with `recaptcha.enabled`, `recaptcha.bypassOrigins`, and `recaptcha.bypassDeliverySites`.
- The encrypted secrets store holds `recaptcha.json`, which contains the Google project and API key values.

See [Site configuration](/configuration/site#recaptcha-settings) for the enforcement switch and bypass rules. See the [secrets store guide](/checkout/secrets) for how to write `recaptcha.json`.

## Enabling

Set `recaptcha.enabled` to `true` in site configuration and write `recaptcha.json` to the secrets store. To disable enforcement, set `recaptcha.enabled` to `false` or remove the field from site configuration.

## Writing the configuration

Because reCAPTCHA is configured site-wide, write it to the root path with no country or locale prefix:

```bash
curl -X PUT "https://api.adobecommerce.live/{org}/sites/{site}/secrets/recaptcha.json" \
  -H "Authorization: Bearer {your-admin-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{gcp-project-id}",
    "siteKey": "{recaptcha-site-key}",
    "apiKey": "{recaptcha-enterprise-api-key}"
  }'
```

## Schema

All three fields are required.

| Field | Type | Secret? | Description |
|-------|------|---------|-------------|
| `projectId` | string | No | Google Cloud project ID that contains the reCAPTCHA Enterprise key. A public identifier, not a credential. Must be 6–30 characters: lowercase letter first, lowercase alphanumeric or hyphens in the middle, and a lowercase alphanumeric character last |
| `siteKey` | string | No | The reCAPTCHA Enterprise score-based key ID. Public by design; it is also embedded in the storefront and bound to your domain on Google's side. Stored here so the verifier can pin assessments to this key. Typically 30–80 characters |
| `apiKey` | string | **Yes** | A Google Cloud API key restricted to the reCAPTCHA Enterprise API, used by the API to request assessments. Treat as a secret; never log or expose. Typically 30–80 characters |

Of the three, only `apiKey` is a true secret. `projectId` and `siteKey` are public identifiers stored so the API can validate tokens against the correct project and key.

## Protected endpoints

When `recaptcha.enabled` is set in site configuration and `recaptcha.json` is present, verification is enforced on unauthenticated write endpoints:

- [Order creation](/orders/lifecycle#create-the-order)
- [Order preview](/orders/lifecycle#preview-the-selected-order)
- [Login](/authentication/overview)

The storefront obtains a reCAPTCHA token from the embedded `siteKey` and includes it with these requests; the API exchanges it for an assessment using the `apiKey`.

## Next steps

- [Site configuration](/configuration/site#recaptcha-settings): Enable enforcement and configure bypass rules
- [Order lifecycle](/orders/lifecycle): Understand protected checkout endpoints
- [Secrets store](/checkout/secrets): Store the Google project and API key values
- [Payments overview](/checkout/payments/overview): How abuse protection complements payment-time controls
- [API reference](/api-reference): Complete API endpoint reference
