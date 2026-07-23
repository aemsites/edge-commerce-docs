---
title: "Order journal"
description: "Read order lifecycle events, payment transitions, fraud outcomes, custom data updates, and email outcomes."
daPath: "/orders/journal"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.56.0"
    lastReviewedCommit: "43a89f0"
    lastContentCommit: "59379a6"
---

# Order journal

The order journal records important events that happen during the order lifecycle. It is useful for troubleshooting checkout, reconciling payment state, checking fraud and email outcomes, and building read-only operational views.

Use the order journal when you need the history of what happened to an order. Use `GET /orders/{orderId}` when you only need the current order state.

Journal entries are not intended to appear immediately after an order event. They are emitted asynchronously and become queryable after the journal pipeline processes them. In normal operation, allow several minutes before expecting a new order, payment, or email event to appear in `GET /orders/journal`.

## Availability delay

Order journaling is asynchronous. Checkout and payment flows emit journal entries without waiting for the journal storage pipeline to finish. The journal pipeline batches entries into 5-minute windows and then writes queryable journal files and per-order indexes.

This means:

- A newly placed order may be visible from `GET /orders/{orderId}` before its `create` journal entry is visible.
- Payment and email outcomes may take a few minutes to appear in the journal after the checkout response returns.
- Support or monitoring tools should retry journal reads with backoff instead of assuming an empty result means no event occurred.
- For immediate storefront state, read the order document. For history and diagnostics, read the journal after the pipeline has had time to process entries.

## What the order journal records

Journal entries are appended as order-related work happens. Common events include:

| Event | When it is emitted |
|-------|--------------------|
| `create` | An order is created in `pending` state |
| `custom_updated` | Custom order data is updated |
| `payment_initiated` | A payment attempt starts |
| `payment_completed` | A provider result is verified and the order reaches `payment_completed` |
| `payment_cancelled` | A payment flow ends without completion |
| `payment_attempt_save_failed` | The API could not persist a payment attempt after retries |
| `payment_void_failed` | A payment authorization void failed after a cancellation or fraud decision |
| `fraud_evaluated` | A fraud provider returned a decision |
| `email_outcome` | Order confirmation email reached a terminal or tracked send state |
| `http_request` | A provider request was journaled for diagnostics |

Not every order has every event. The event sequence depends on provider type, wallet vs redirect flow, fraud configuration, email result, and whether integrations update custom order data.

## Entry shape

Each journal entry includes common metadata and event-specific fields.

Common fields include:

| Field | Description |
|-------|-------------|
| `id` | Journal entry ID |
| `timestamp` | Time the journal entry was emitted |
| `org` | Organization identifier |
| `site` | Site identifier |
| `journal` | Journal name, `orders` for order journal entries |
| `event` | Event type |
| `orderId` | Order ID when the event is tied to one order |
| `state` | Order state for state transition events |

Event-specific fields vary. Payment events can include provider, attempt, reason, transaction, or authorization fields. Email events can include recipient, sender, outcome, attempt count, and message identifiers. Provider request entries can include service, method, status, duration, and non-sensitive diagnostic response details.

For failed provider requests, diagnostic response bodies are limited to 512 characters and receive basic redaction for apparent bearer tokens and payment card number patterns. Treat all diagnostic response details as sensitive and do not expose them in storefronts or other customer-facing views.

## Access

Reading the order journal requires `journal:orders:read` and matching organization/site scope. Admin tokens can read the journal. Service tokens can be created with `journal:orders:read` for read-only operational integrations.

See [Roles and permissions](/authentication/roles-permissions) and [Service tokens](/authentication/service-tokens) for access details.

## Query by order ID

Use `orderId` when debugging one checkout or rendering an order timeline.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/orders/journal?orderId={order-id}" \
  -H "Authorization: Bearer {service-token-or-admin-token}"
```

The `orderId` parameter accepts the full order ID or friendly ID. When querying by order ID, the API uses the per-order index and returns entries for that order. Because the per-order index is also written asynchronously, a very recent order may return no journal entries until the journal pipeline catches up.

You can also add time bounds if you want to narrow the returned entries:

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/orders/journal?orderId={order-id}&since=2026-06-29T12:00:00Z&until=2026-06-29T13:00:00Z" \
  -H "Authorization: Bearer {service-token-or-admin-token}"
```

## Query by time range

Use a time range when monitoring recent checkout activity across many orders. For very recent events, choose a range that includes the last several minutes and expect entries to appear after the asynchronous journal pipeline runs.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/orders/journal?since=1h" \
  -H "Authorization: Bearer {service-token-or-admin-token}"
```

`since` accepts either an ISO 8601 timestamp or a relative value:

| Format | Example |
|--------|---------|
| Seconds | `30s` |
| Minutes | `15m` |
| Hours | `1h` |
| Days | `2d` |
| ISO 8601 | `2026-06-29T12:00:00Z` |

`until` accepts an ISO 8601 timestamp. When omitted, it defaults to now.

When `orderId` is not supplied, the range defaults to the last 12 hours and the maximum range span is 12 hours. Use `orderId` for longer single-order investigations.

## Example response

```json
{
  "entries": [
    {
      "id": "2f6c5c6e-6d7f-4f6a-8a1e-8d6c0b9f4c21",
      "timestamp": "2026-06-29T12:34:56.789Z",
      "org": "example",
      "site": "store",
      "journal": "orders",
      "event": "create",
      "orderId": "2026-06-29T12-34-56.789Z-AbCd1234",
      "state": "pending"
    },
    {
      "id": "7b9d0f04-1dc0-4a85-8a72-4f6d3d53c4db",
      "timestamp": "2026-06-29T12:36:10.120Z",
      "org": "example",
      "site": "store",
      "journal": "orders",
      "event": "payment_completed",
      "orderId": "2026-06-29T12-34-56.789Z-AbCd1234",
      "state": "payment_completed",
      "provider": "chase"
    },
    {
      "id": "b21e8c0a-96b2-45a8-88ef-76a5cf4ad5c9",
      "timestamp": "2026-06-29T12:36:12.402Z",
      "org": "example",
      "site": "store",
      "journal": "orders",
      "event": "email_outcome",
      "type": "order-confirmation",
      "orderId": "2026-06-29T12-34-56.789Z-AbCd1234",
      "outcome": "sent",
      "toEmail": "jane@example.com"
    }
  ]
}
```

## How to use journal data

| Task | Recommended query |
|------|-------------------|
| Show an order timeline in support tooling | Query by `orderId` |
| Confirm whether a payment completed | Query by `orderId` and look for `payment_completed` |
| Debug a cancelled checkout | Query by `orderId` and inspect `payment_cancelled`, fraud, and provider request entries |
| Check whether order confirmation email was sent | Query by `orderId` and inspect `email_outcome` |
| Monitor recent payment failures | Query a recent time range and filter entries by event in your tooling |

## Relationship to order state

The current order state is stored on the order itself. See [Order states](/orders/lifecycle#order-states) for the supported states and transition behavior. The journal is an append-only history of events that led to that state.

For example, an order may currently be `payment_completed`, while the journal shows:

1. `create`
2. `payment_initiated`
3. provider `http_request` entries
4. `fraud_evaluated`
5. `payment_completed`
6. `email_outcome`

Use the current order document for storefront state. Use the journal for debugging, audit, reconciliation, and operational workflows.

## Related docs

- [Order lifecycle](/orders/lifecycle): Understand the order and payment states that emit journal entries
- [Transactional email](/emails): Understand order confirmation email outcomes
- [Payments overview](/checkout/payments/overview): Understand payment initiation and provider actions
- [Service tokens](/authentication/service-tokens): Create read-only journal tokens
- [API reference](/api-reference): Complete endpoint details
