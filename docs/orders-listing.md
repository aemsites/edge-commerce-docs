---
title: "List site orders"
description: "Explain how authorized integrations list orders for a site through the orders listing API."
daPath: "/orders-listing"
tags: "pagination, cursor based, service tokens, permissions"
status: draft
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "unknown"
    lastReviewedCommit: "70951d6"
    lastContentCommit: "70951d6"
---

# List site orders

Use the site orders listing endpoint to retrieve orders associated with a site. The endpoint supports cursor-based pagination and requires an authenticated caller with the `orders:list` permission.

## Endpoint

```http
GET https://api.adobecommerce.live/{org}/{site}/orders
```

Replace:

- `{org}` with your organization identifier.
- `{site}` with the site identifier.

Send the credential in the `Authorization` header:

```bash
curl \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/{site}/orders"
```

The endpoint lists orders for the specified site only. It does not list orders across multiple sites.

## Required permission

The caller must have the `orders:list` permission.

For service tokens, include `orders:list` in the token's permissions. A token that can create or retrieve an individual order does not automatically have permission to list all site orders.

```json
{
  "permissions": [
    "orders:list"
  ]
}
```

The permission applies to callers using service tokens and other non-operator credentials. Operator credentials are not subject to regular permission checks.

If the credential is missing `orders:list`, the request is rejected with `403 Forbidden`.

## Query parameters

The endpoint uses cursor-based pagination.

| Parameter | Required | Description |
|---|---:|---|
| `limit` | No | Maximum number of orders to return in the page. |
| `cursor` | No | Opaque cursor returned for the next page. Omit it when requesting the first page. |

The cursor is tied to the result position for the site. Treat it as an opaque value: do not decode it, modify it, or construct it manually.

### Request the first page

```bash
curl \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/{site}/orders?limit=25"
```

### Request a subsequent page

Use the cursor from the previous response as the `cursor` query parameter:

```bash
curl \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/{site}/orders?limit=25&cursor={next-cursor}"
```

Continue requesting pages until the response does not contain a next-page cursor.

## Response

A successful request returns an object containing the orders for the current page and, when more results are available, a cursor for the next page.

```json
{
  "orders": [
    {
      "id": "order-123",
      "site": "site-a",
      "email": "customer@example.com",
      "status": "completed",
      "createdAt": "2026-11-25T14:32:10.000Z",
      "updatedAt": "2026-11-25T14:35:02.000Z",
      "total": 129.99,
      "currency": "USD",
      "items": [
        {
          "sku": "example-sku",
          "quantity": 1,
          "price": 129.99
        }
      ]
    }
  ],
  "cursor": "{next-cursor}"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `orders` | array | Orders included in the current page. |
| `cursor` | string | Opaque cursor for the next page. The field is omitted when there are no more results. |

Each order includes its order identifier, customer information, lifecycle timestamps, status, totals, currency, and line items. The exact order fields depend on the order data captured by the site.

An empty result contains an empty `orders` array:

```json
{
  "orders": []
}
```

## Pagination example

The following example retrieves all pages:

```js
async function listOrders(org, site, apiKey) {
  const orders = [];
  let cursor;

  do {
    const params = new URLSearchParams({ limit: '100' });
    if (cursor) params.set('cursor', cursor);

    const response = await fetch(
      `https://api.adobecommerce.live/${org}/${site}/orders?${params}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Order listing failed: ${response.status}`);
    }

    const page = await response.json();
    orders.push(...page.orders);
    cursor = page.cursor;
  } while (cursor);

  return orders;
}
```

Store the cursor only for continuing the current traversal. If you need to start over, omit `cursor` and request the first page again.

## Errors

| Status | Description |
|---:|---|
| `401 Unauthorized` | The request does not include valid authentication. |
| `403 Forbidden` | The authenticated caller does not have the `orders:list` permission. |
| `404 Not Found` | The organization or site does not exist, or is not available to the caller. |
| `400 Bad Request` | A query parameter is invalid, including an invalid pagination cursor. |

## Next steps

- [Order details](/orders): Retrieve or process an individual order
- [Authentication](/authentication): Configure credentials for API requests
- [Service tokens](/service-tokens): Create tokens with the permissions required by an integration