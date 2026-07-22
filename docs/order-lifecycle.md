---
title: "Order lifecycle"
description: "How carts become orders, payments, confirmations, and journal entries."
daPath: "/orders/lifecycle"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "59379a6"
    lastContentCommit: "59379a6"
---

# Order lifecycle

The Edge Commerce API supports guest and authenticated checkout. A typical order starts as a cart estimate, becomes a persisted order in `pending` state, moves into payment processing, and then reaches a terminal payment state after the provider callback or wallet response is verified.

Use this guide to understand the sequence of API calls, order states, and safeguards that keep checkout totals and payment attempts consistent.

## Which API to call when

Checkout uses three different order-related APIs because they answer different questions:

| Shopper or system moment | Call this API | Role in the lifecycle |
|--------------------------|---------------|-----------------------|
| Shopper is editing the cart, address, coupon, or shipping selection | `POST /{org}/sites/{site}/estimate/{estimateType}` | Provides interactive estimates and UI updates before commitment |
| Shopper is ready to place the order and has selected a shipping method | `POST /{org}/sites/{site}/orders/preview` | Performs final pre-submit validation and returns an [`estimateToken`](#estimate-tokens) that locks tax, shipping, and discounts |
| Shopper confirms the order | `POST /{org}/sites/{site}/orders` | Persists the committed cart as an order in `pending` state |
| Shopper chooses a payment method | `POST /{org}/sites/{site}/orders/{orderId}/payments` | Starts a provider-specific payment flow for a pending order |
| Provider returns the payment result | Provider callback routes | Verifies the provider result and moves the order to a terminal state or, for PayPal order review, to confirmation-required state |
| Customer, admin, or integration needs order data | `GET /{org}/sites/{site}/orders/{orderId}` | Reads one order by full or friendly ID |
| Admin needs order reporting | `GET /{org}/sites/{site}/orders` | Lists orders by time range or state |
| Integration needs to attach metadata | `PATCH /{org}/sites/{site}/orders/{orderId}/custom` | Adds or removes custom order fields |
| Operations needs state history | `GET /{org}/sites/{site}/orders/journal` | Reads order state transition entries |

The short version: use estimates while the cart is still changing, use preview when the cart is ready to become an order, use order creation to persist that committed cart, and use payment initiation only after the order exists.

## Lifecycle summary

| Step | API | Role in lifecycle | Authentication |
|------|-----|-------------------|----------------|
| Cart estimate | `POST /{org}/sites/{site}/estimate/{estimateType}` | Calculates provisional totals for cart UX | Not required |
| Order preview | `POST /{org}/sites/{site}/orders/preview` | Produces the final committed estimate and [`estimateToken`](#estimate-tokens) | Optional, reCAPTCHA-gated for guests |
| Order creation | `POST /{org}/sites/{site}/orders` | Creates a persisted `pending` order from the committed cart | Optional, reCAPTCHA-gated for guests |
| Payment initiation | `POST /{org}/sites/{site}/orders/{orderId}/payments` | Starts payment for a pending order | Optional |
| Payment callback or wallet result | Provider callback routes | Verifies payment and updates the order state | Provider-controlled |
| Order lookup | `GET /{org}/sites/{site}/orders/{orderId}` | Retrieves one order by full or friendly ID | Required |
| Order listing | `GET /{org}/sites/{site}/orders` | Lists orders by time range or state | Admin only |
| Custom data update | `PATCH /{org}/sites/{site}/orders/{orderId}/custom` | Adds integration metadata after creation | Required |
| Order journal | `GET /{org}/sites/{site}/orders/journal` | Reads state transition entries | Required |

## Order states

| State | Meaning |
|-------|---------|
| `pending` | The order has been created and can accept a first payment initiation |
| `payment_processing` | A redirect-based payment has been initiated and the API is waiting for a provider return or cancel callback |
| `payment_requires_confirmation` | The buyer approved a PayPal payment configured for order review, but payment capture is deferred until the shopper explicitly confirms the order |
| `payment_completed` | The provider result was verified and the payment completed |
| `payment_cancelled` | The customer cancelled, the provider declined, fraud evaluation failed, or the payment flow otherwise ended without completion |

Only `pending` orders accept a new payment initiation. If a payment initiation is retried with the same idempotency key, the API returns the stored result even when the order has already moved out of `pending`.

## Example checkout sequence

This example shows a guest checkout flow. If reCAPTCHA is enabled for the site, include `X-Recaptcha-Token` on `POST /orders/preview` and `POST /orders`.

### 1. Estimate available shipping methods

Use `POST /estimate/shipping` while the shopper is editing the cart or address. If the storefront needs autocomplete or postal validation before estimating, use [Places and address validation](/places) first.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/estimate/shipping" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "locale": "en-US",
    "shipping": {
      "country": "US",
      "state": "CA",
      "zip": "94105"
    },
    "items": [
      {
        "sku": "BLENDER-RED",
        "path": "/us/en/products/blender-pro-500",
        "quantity": 1,
        "price": { "final": "99.99", "currency": "USD" }
      }
    ],
    "couponCode": "SAVE10",
    "couponSource": "manual"
  }'
```

The response shape depends on the estimate type. For `shipping`, use the returned rate IDs to let the shopper select a shipping method.

```json
{
  "rates": [
    {
      "id": "standard-us",
      "label": "Standard shipping",
      "rate": "8.95",
      "currency": "USD"
    }
  ],
  "discounts": []
}
```

### 2. Preview the selected order

After the shopper chooses a shipping method, call `POST /orders/preview`. This creates the committed estimate and returns an [`estimateToken`](#estimate-tokens) for order creation.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/orders/preview" \
  -H "Content-Type: application/json" \
  -H "X-Recaptcha-Token: {recaptcha-token}" \
  -d '{
    "country": "US",
    "locale": "en-US",
    "customerTimezone": "America/Los_Angeles",
    "paymentMethod": "apple-pay",
    "checkoutFlow": "express",
    "entryPoint": "cart",
    "customer": {
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Doe"
    },
    "shipping": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "address1": "123 Market St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "shippingMethod": { "id": "standard-us" },
    "items": [
      {
        "sku": "BLENDER-RED",
        "path": "/us/en/products/blender-pro-500",
        "quantity": 1,
        "price": { "final": "99.99", "currency": "USD" }
      }
    ],
    "couponCode": "SAVE10",
    "couponSource": "manual"
  }'
```

The response includes the calculated totals and a signed [`estimateToken`](#estimate-tokens).

```json
{
  "subtotal": "89.99",
  "taxAmount": "7.42",
  "shippingMethod": {
    "id": "standard-us",
    "label": "Standard shipping",
    "rate": "8.95",
    "currency": "USD"
  },
  "discounts": [
    { "id": "coupon:SAVE10", "name": "Save 10", "type": "fixed", "amount": 10 }
  ],
  "total": "106.36",
  "lineItems": [
    {
      "sku": "BLENDER-RED",
      "path": "/us/en/products/blender-pro-500",
      "quantity": 1,
      "price": { "final": "99.99", "currency": "USD" }
    }
  ],
  "estimateToken": "{estimate-token}"
}
```

### 3. Create the order with the estimate token

Submit the order with the same customer, shipping, item, coupon, selected shipping method, and checkout context, plus the [`estimateToken`](#estimate-tokens) from preview.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/orders" \
  -H "Content-Type: application/json" \
  -H "X-Recaptcha-Token: {recaptcha-token}" \
  -d '{
    "country": "US",
    "locale": "en-US",
    "customerTimezone": "America/Los_Angeles",
    "paymentMethod": "apple-pay",
    "checkoutFlow": "express",
    "entryPoint": "cart",
    "customer": {
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Doe"
    },
    "shipping": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "address1": "123 Market St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "shippingMethod": { "id": "standard-us" },
    "items": [
      {
        "sku": "BLENDER-RED",
        "path": "/us/en/products/blender-pro-500",
        "quantity": 1,
        "price": { "final": "99.99", "currency": "USD" }
      }
    ],
    "couponCode": "SAVE10",
    "couponSource": "manual",
    "estimateToken": "{estimate-token}"
  }'
```

The response wraps the stored order. The new order starts in `pending` state.

```json
{
  "order": {
    "id": "2026-06-29T12-34-56.789Z-AbCd1234",
    "friendlyId": "AbCd1234",
    "state": "pending",
    "country": "US",
    "locale": "en-US"
  }
}
```

### 4. Initiate payment

Use the returned full order ID or friendly ID to start payment. Include a unique `idempotencyKey` for each new attempt.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/orders/{orderId}/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "chase",
    "paymentMethod": "card",
    "idempotencyKey": "checkout-7f5c4b9a"
  }'
```

Redirect-based providers return an action for the storefront to follow.

```json
{
  "status": "requires_action",
  "action": "redirect",
  "url": "https://provider.example/checkout/session"
}
```

## Estimate before creating an order

The estimate APIs are for provisional cart decisions. Call them whenever the shopper changes information that affects the cart, such as address, shipping country, coupon code, selected products, or quantity. See [Estimates and cart totals](/estimates) for endpoint selection, examples, and discount behavior.

`POST /estimate/{estimateType}` supports four calculation modes:

| Estimate type | When to call it | What it returns |
|---------------|-----------------|-----------------|
| `tax` | You need a tax rate for an address | Tax estimate for the supplied address |
| `shipping` | The shopper enters or changes a shipping address | Available shipping rates, adjusted for eligible free-shipping discounts |
| `price` | The shopper changes products, quantities, or coupon code | Promotions, coupons, auto-rule discounts, line-item discounts, and free-item grants |
| `order` | You need complete totals across one or more shipping methods | Per-method totals that include subtotal, tax, shipping, and discounts |

Use these endpoints for cart pages, shipping selection, wallet address callbacks, and other interactive cart updates. Their results help the storefront display choices, but they do not create an order and do not lock the final order total.

## Preview the selected order

Call `POST /orders/preview` after the shopper has selected a shipping method and is ready to submit the order. Preview is the commitment step between a changing cart and a persisted order.

This endpoint exists because interactive estimates are not enough to place an order. Preview validates the final submitted cart, computes the selected-method totals, and returns the signed `estimateToken` that order creation uses to verify those totals.

The preview endpoint:

- Validates the order shape and requires `shippingMethod.id`.
- Validates item prices against product data unless price consistency is disabled in site configuration.
- Validates item country availability.
- Applies catalog promotions, coupons, automatic cart rules, shipping, and tax.
- Returns the computed totals and line items.
- Returns a signed `estimateToken` that locks the selected tax, shipping method, and discounts.

For guest checkout, this endpoint is protected by reCAPTCHA when `recaptcha.enabled` is configured. See [reCAPTCHA verification](/checkout/recaptcha) and [Site configuration](/configuration/site#recaptcha-settings).

## Create the order

Call `POST /orders` only after preview succeeds. This endpoint turns the committed cart into a persisted order. It does not start payment.

Guest checkout is supported. Authenticated callers must have `orders:write`, and customer-scoped callers can only create orders for their own email address.

At creation time, the API:

- Validates the order schema.
- Verifies item prices and countries.
- Verifies the `estimateToken` when one is supplied.
- Rejects unauthorized free items that are not covered by a promotion grant.
- Creates or associates the customer record when needed.
- Records `customerType` as `registered` when the authenticated human caller has an email, or `guest` for unauthenticated and service-token checkout.
- Records `customerCreated` as `true` when the order creates a new customer profile for the email address, or `false` when the shopper already has a customer profile.
- Persists the order with state `pending`.
- Creates the first order history entry.

The response wraps the stored order as `{ "order": { ... } }`. The `customerType` and `customerCreated` values are generated from server-side request and customer-profile context; clients cannot set them in the request.

### Estimate tokens

An `estimateToken` is an opaque, signed token returned by `POST /orders/preview`. It binds the final preview result to the later `POST /orders` request.

The token exists to protect the handoff between preview and order creation. A shopper can pause on the checkout page, edit the browser request, retry from an old tab, or submit after prices, shipping, discounts, or tax inputs have changed. The estimate token lets the API verify that the order being created still matches the committed preview the shopper saw.

Conceptually, the token represents the selected-method checkout result:

| Token-bound information | Why it matters |
|-------------------------|----------------|
| Selected shipping method | Prevents order creation with a different shipping method than the one previewed |
| Tax result | Keeps the tax calculation tied to the previewed address, cart, and provider result |
| Discounts and free-item grants | Prevents unapproved coupon, promotion, or free-item changes during order creation |
| Payment method and checkout context | Keeps `paymentMethod`, `checkoutFlow`, and `entryPoint` consistent when they affect tax or provider rules |
| Relevant cart and customer inputs | Lets order creation reject a mismatched or stale checkout submission |

Treat the token as opaque. Do not parse it, modify it, or use it as a source of display data. Use the response fields from preview to render the checkout review screen, and pass the token unchanged in the order creation request.

Request a new preview, and therefore a new estimate token, whenever the shopper changes anything that can affect totals or eligibility:

- Products or quantities
- Shipping address or shipping country
- Selected shipping method
- Coupon code or coupon source
- Customer email when discounts or limits depend on customer identity
- Payment method, checkout flow, or checkout entry point when tax or provider rules depend on them

If the token is invalid, expired, or does not match the submitted order, `POST /orders` returns a validation error. The storefront should send the shopper back through preview, show the refreshed totals, and then retry order creation with the new token.

## Initiate payment

Call `POST /orders/{orderId}/payments` after order creation, when the shopper chooses a payment method. This endpoint starts the provider flow for an existing `pending` order. It does not reprice the cart and does not accept a client-supplied charge amount.

Required fields:

| Field | Description |
|-------|-------------|
| `provider` | Provider name, such as `chase`, `paypal`, `affirm`, `chase-wallet`, or `paypal-express` |
| `paymentMethod` | Payment method selected by the storefront |
| `idempotencyKey` | Client-generated key used to make retries safe |
| `fraudToken` | Optional fraud-provider browser token |

Payment initiation is available to guest checkout flows. It is protected by order-state checks, idempotency, provider configuration validation, attempt limits, fraud evaluation when configured, and server-computed totals.

The API computes the payable amount from the stored order and its locked-in estimates. The request body does not control the charge amount.

See [Payments overview](/checkout/payments/overview) for provider-specific payment behavior.

## Payment result handling

Redirect-based providers move the order to `payment_processing` when initiation succeeds. The provider then redirects to an API callback URL. The callback verifies the payment with the provider before updating the order.

PayPal can be configured with an order review step independently for standard checkout and express flows. When order review is enabled, PayPal approval does not capture payment immediately. Instead, the API returns a `review` action, sends the shopper to the configured review URL, and moves the order to `payment_requires_confirmation`. The storefront displays its final order review and requires an explicit shopper confirmation before payment capture.

When configuring PayPal order review, provide a secure `reviewUrl`. The API appends the order ID as a query parameter. A review URL is required when order review is enabled for either checkout flow.

Wallet or direct-charge flows may complete during initiation. These flows can move directly from `pending` to `payment_completed` or `payment_cancelled` without a separate `payment_processing` step.

Provider callbacks guard against replay. Once an order is terminal, later callbacks do not move it backward.

## Retrieve and list orders

Use `GET /orders/{orderId}` to retrieve an order by full order ID or friendly ID. Non-admin, non-service callers can only read their own order, matched by customer email.

Use `GET /orders` to list orders. Listing requires `orders:read` and admin access. Optional filters include:

| Query parameter | Description |
|-----------------|-------------|
| `since` | Lower creation-time bound in ISO 8601 format |
| `until` | Upper creation-time bound in ISO 8601 format |
| `state` | Current order state |

## Update custom order data

Use `PATCH /orders/{orderId}/custom` to attach integration metadata to an order.

The request body is a flat object. String values set or replace keys. `null` removes a key. Each key and value is capped at 2048 characters.

This endpoint requires `orders:custom:write`; `orders:write` alone does not authorize the request. This dedicated permission lets integrations annotate orders without granting broader order-management access.

See [Service tokens](/authentication/service-tokens) for scoped automation tokens.

## Order journal

Order state transitions are written to the order journal. Use `GET /orders/journal` to read entries by time range or by order ID. See [Order journal](/orders/journal) for event types, query examples, and troubleshooting patterns.

Supported query parameters:

| Query parameter | Description |
|-----------------|-------------|
| `orderId` | Return entries for one order, using the full or friendly ID |
| `since` | Lower bound as ISO 8601 or relative time, such as `5m`, `1h`, or `2d`. Defaults to the last 12 hours |
| `until` | Upper bound as ISO 8601. Defaults to now |

Reading the order journal requires `journal:orders:read`.

## Order confirmation email

Order confirmation email is sent by the order email flow after checkout has enough order context. Email branding and sender settings come from [Site configuration](/configuration/site#email-settings). See [Transactional email](/emails#order-confirmation-email-flow) for template paths, variables, and send outcomes.

For automation that sends transactional emails directly, use a service token with `emails:send` and optional destination scopes. See [Service tokens](/authentication/service-tokens#email-destination-scopes).

## Safeguards

The lifecycle is designed so the browser can drive checkout without controlling sensitive outcomes:

- Guest checkout can create orders and start payments, but unauthenticated preview and order creation can be reCAPTCHA-gated.
- Order creation verifies product prices, country availability, and preview tokens.
- Payment initiation uses stored order totals, not client-supplied totals.
- Only `pending` orders accept a new payment initiation.
- Idempotency keys make safe retries possible.
- Provider callbacks verify the result directly with the provider before changing terminal state.
- Requests with a declared body larger than 10 MiB are rejected with HTTP 413 before the API processes the body.
- Service tokens can be scoped to narrow order permissions for automation.

## Related configuration

| Need | Documentation |
|------|---------------|
| Enable reCAPTCHA for guest checkout | [Site configuration](/configuration/site#recaptcha-settings) |
| Store payment, tax, fraud, or reCAPTCHA credentials | [Secrets store](/checkout/secrets) |
| Configure payment providers | [Payments overview](/checkout/payments/overview) |
| Configure email branding and senders | [Site configuration](/configuration/site#email-settings) |
| Author OTP and order confirmation email templates | [Transactional email](/emails) |
| Create automation tokens | [Service tokens](/authentication/service-tokens) |
| Manage customer profiles, addresses, and customer order lookup | [Customers and account data](/customers) |

## Next steps

- [Checkout overview](/checkout/overview): How provider groups fit into checkout
- [Estimates and cart totals](/estimates): Compute tax, shipping, discounts, and cart totals
- [Places and address validation](/places): Autocomplete and validate checkout addresses
- [Payments overview](/checkout/payments/overview): Initiate payment and handle provider actions
- [Order journal](/orders/journal): Read order history and operational events
- [Customers and account data](/customers): Manage profiles, addresses and customer orders
- [Site configuration](/configuration/site): Configure auth, reCAPTCHA, email, and friendly IDs
- [API reference](/api-reference): Complete endpoint details