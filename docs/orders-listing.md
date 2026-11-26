---
title: "List site orders"
description: "Explain how authorized integrations list orders for a site through the orders listing API."
daPath: "/orders-listing"
tags: "service tokens, permissions, updatedAt, order state"
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

Use the site orders endpoint to retrieve orders for one organization and site. The endpoint requires the `orders:list` permission and returns all matching orders in one response. It does not support pagination.

## Endpoint

```http
GET https://api.adobecommerce.live/{org}/sites/{site}/orders
```

Replace `{org}` with your organization identifier and `{site}` with your site identifier. Send an admin session or a service token with `orders:list` in the `Authorization` header:

```bash
curl \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/orders"
```

Customer sessions do not have `orders:list`. See [Service tokens](/authentication/service-tokens) to create a token with this permission.

## Query parameters

All parameters are optional.

| Parameter | Description |
|---|---|
| `since` | Inclusive lower bound on `updatedAt`, in ISO 8601 format. Also sets the first UTC creation day scanned. If omitted, scanning starts on the UTC day 30 days ago and no lower `updatedAt` bound is applied. |
| `until` | Inclusive upper bound on `updatedAt`, in ISO 8601 format. Also sets the last UTC creation day scanned. If omitted, scanning ends today and no upper `updatedAt` bound is applied. |
| `state` | Filter by the current order state. |

The API scans orders created on each UTC day from the first scanned day through the last, keeps the latest snapshot of each order, then filters on `updatedAt`. An order created before the first scanned day is not returned, even if it was updated inside the requested range.

For example, request orders updated within a date range and in a particular state:

```bash
curl \
  -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/orders?since=2026-11-01T00:00:00Z&until=2026-11-07T23:59:59Z&state=payment_completed"
```

## Response

A successful response contains an `orders` array:

```json
{
  "orders": []
}
```

The response is not paginated. All matching orders are returned at once, so use a short time range when listing orders.
