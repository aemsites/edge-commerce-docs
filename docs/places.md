---
title: "Places and address validation"
description: "How address autocomplete, place details, and address validation work in checkout."
daPath: "/places"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.42.1"
    lastReviewedCommit: "e77382f"
    lastContentCommit: "e77382f"
---

# Places and address validation

The Places endpoints help storefronts collect shipping and billing addresses during checkout. They proxy address autocomplete, place details, and address validation through the Edge Commerce API so browser code does not need direct access to the platform Places key.

Places requests are intended for storefront browser flows. Access is controlled by the request origin, not by a bearer token. The request must come from a site origin allowed by [site configuration](/configuration/site#browser-access-settings).

## When to use Places

Use Places when a checkout or account form needs to:

- suggest addresses while a shopper types
- resolve a selected place into address components
- validate an entered postal address before order preview or order creation
- reduce address entry errors before storing a [customer address](/customers#address-book) or running [estimates](/estimates)

Places complements, but does not replace, checkout validation. Order preview, order creation, tax, shipping, and payment providers still validate the request data they receive.

## Access rules

Places endpoints are origin-gated:

- AEM delivery origins are allowed when they match `allowedDeliverySites`. If `allowedDeliverySites` is not configured, the default pattern is `*--{site}--{org}`.
- Custom storefront domains must be listed exactly in `allowedOrigins`.
- Local development with `http://localhost:3000` is allowed only against the stage environment and only when that origin is listed in `allowedOrigins`.
- Requests without an `Origin` header, or without a parseable `Referer` fallback, are rejected.

See [Site configuration](/configuration/site#browser-access-settings) for configuration examples.

## Endpoint overview

All endpoints share the same path shape:

```text
/{org}/sites/{site}/places/{action}
```

Supported actions:

| Action | Methods | Purpose |
|--------|---------|---------|
| `autocomplete` | `GET`, `POST` | Returns address suggestions for typed input |
| `details` | `GET`, `POST` | Resolves a selected place ID into address components and a formatted address |
| `validate` | `POST` | Validates a postal address and returns a normalized response |

`OPTIONS` is supported for browser preflight requests.

## Autocomplete

Use `autocomplete` while the shopper types an address. The request requires `input` and accepts optional `sessiontoken` and `regioncode` values.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/places/autocomplete?input=123%20Main&sessiontoken={session-token}&regioncode=us" \
  -H "Origin: https://www.example.com"
```

Behavior:

- `input` is required.
- `sessiontoken` is forwarded to the upstream Places session.
- `regioncode` is uppercased and sent as a regional filter.
- The response body is returned from the upstream Places API.

Use one session token for the shopper's address-entry session so autocomplete and details can be associated by the provider.

## Place details

Use `details` after the shopper selects a suggestion. The request requires `place_id` and accepts an optional `sessiontoken`.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/places/details?place_id={place-id}&sessiontoken={session-token}" \
  -H "Origin: https://www.example.com"
```

The response contains the upstream place details response with address components and formatted address fields. Use these values to populate the checkout or account address form.

## Address validation

Use `validate` when the shopper submits an address or before a checkout flow depends on a final shipping address. Validation requires `POST` with an `address.addressLines` array.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/places/validate?sessiontoken={session-token}" \
  -H "Origin: https://www.example.com" \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "addressLines": ["123 Main St", "Apt 4"],
      "regionCode": "US"
    }
  }'
```

The response is normalized:

```json
{
  "action": null,
  "formattedAddress": "123 Main St Apt 4, Anytown, CA 12345, USA",
  "addressComponents": [
    {
      "longText": "California",
      "shortText": "CA",
      "types": ["administrative_area_level_1"]
    }
  ],
  "uspsDeliverable": true
}
```

Fields:

| Field | Description |
|-------|-------------|
| `action` | Suggested next action from address validation, or `null` when no action is provided |
| `formattedAddress` | Provider-formatted address, or `null` when not available |
| `addressComponents` | Normalized address components with `longText`, `shortText`, and component `types` |
| `uspsDeliverable` | `true` or `false` for United States Postal Service deliverability when available, otherwise `null` |

For US and Puerto Rico addresses, USPS CASS processing is enabled automatically.

## Checkout flow

A typical checkout flow uses Places like this:

1. The storefront generates a client-side session token for address entry.
2. The shopper types into the address field.
3. The storefront calls `places/autocomplete` with `input`, `sessiontoken`, and an optional `regioncode`.
4. The shopper selects a suggestion.
5. The storefront calls `places/details` with `place_id` and the same `sessiontoken`.
6. The storefront fills the address form and lets the shopper confirm or edit the address.
7. The storefront calls `places/validate` before saving the address or sending it to [estimate](/estimates) and [order preview](/orders/lifecycle#preview-the-selected-order) endpoints.

Do not treat a Places response as final order authorization. Estimate, tax, shipping, and order creation still run their own validation and provider checks.

## Error handling

| Status | Meaning |
|--------|---------|
| `400` | A required field is missing, such as `input`, `place_id`, or `address.addressLines` |
| `403` | The request origin is missing or is not allowed for the site |
| `405` | The method is not allowed for the selected action, such as `GET` for `validate` |
| `500` | The platform Places key is not configured |
| `502` | The upstream Places or Address Validation API failed or could not be reached |

For autocomplete and details, non-200 statuses from the upstream Places API may be passed through so the storefront can handle quota or provider-specific errors.

## Next steps

- [Site configuration](/configuration/site#browser-access-settings): Allow storefront origins for browser calls
- [Customers](/customers#address-book): Store validated customer addresses
- [Estimates and cart totals](/estimates): Use validated addresses for shipping and tax estimates
- [Order lifecycle](/orders/lifecycle): Preview and create orders after address entry
- [API reference](/api-reference): Complete endpoint reference
