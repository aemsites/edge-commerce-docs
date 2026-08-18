---
title: "PayPal order review and deferred capture"
description: "Explain the PayPal order-review payment flows, confirmation APIs, redirects, and deferred-capture behavior."
daPath: "/paypal-order-review"
status: draft
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "unknown"
    lastReviewedCommit: "05b753f"
    lastContentCommit: "05b753f"
---

# PayPal order review and deferred capture

PayPal order review lets a buyer approve a PayPal order before the storefront confirms the final purchase. The order remains uncaptured while the buyer reviews the order on your site. Capture occurs only when the storefront calls the PayPal confirm endpoint.

The feature supports two flows:

- **Checkout review**: The buyer approves a PayPal order on PayPal and returns to a storefront review page.
- **Express review**: The buyer approves an existing PayPal order through the PayPal Express flow. The payment initiation request validates the approval and returns control to the storefront without capturing the order.

Both flows use the `payment_requires_confirmation` order state.

## Configure order review

Configure order review in the PayPal provider settings:

```json
{
  "orderReview": {
    "checkout": true,
    "express": true
  },
  "reviewUrl": "https://shop.example/review"
}
```

The settings have the following behavior:

| Setting | Behavior |
| --- | --- |
| `orderReview.checkout` | Defers capture for the PayPal redirect checkout flow. |
| `orderReview.express` | Defers capture for the PayPal Express flow. |
| `reviewUrl` | Destination for the storefront review page. The API appends `orderId` as a query parameter. |

When either review flow is enabled, `reviewUrl` is required and must be a valid HTTPS URL with a hostname. For example:

```text
https://shop.example/review
```

The resulting redirect includes the order ID:

```text
https://shop.example/review?orderId={order-id}
```

If the review URL already contains query parameters, the API preserves them and adds or replaces the `orderId` parameter.

## Checkout review flow

The checkout review flow uses a PayPal redirect. The payment provider creates a PayPal order with a `CONTINUE` buyer action instead of an immediate `PAY_NOW` action.

### 1. Start payment initiation

Call the payment initiation endpoint as usual:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Idempotency-Key: {your-idempotency-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/orders/{order-id}/payments"
```

The request must identify the PayPal payment method and the PayPal order created for the checkout. The exact request fields depend on the payment integration.

The response indicates that additional action is required:

```json
{
  "orderId": "{order-id}",
  "paymentAttemptId": "{payment-attempt-id}",
  "provider": "paypal",
  "status": "requires_action",
  "action": "redirect"
}
```

The storefront redirects the buyer to the PayPal approval page using the redirect information returned by the payment provider.

### 2. Handle the PayPal return

After the buyer approves the payment, PayPal redirects the buyer to the configured return URL. The return contains the PayPal order token.

The API verifies that:

- The order is still in `payment_processing`.
- The returned PayPal order is the PayPal order created for this payment attempt.
- The PayPal order is approved.
- The payment attempt and order identifiers match.

When checkout review is enabled, the API does not capture the payment. It changes the order state to:

```text
payment_requires_confirmation
```

The buyer is then redirected to the configured review URL:

```text
https://shop.example/review?orderId={order-id}
```

The review page should display the order summary and provide actions to confirm or cancel the purchase.

## Express review flow

The Express review flow starts after the buyer has approved a PayPal order through the PayPal JavaScript integration.

PayPal Express sessions always use `user_action=CONTINUE`, regardless of whether express order review is enabled. This allows the session to update the order when the buyer changes the shipping option. The server re-estimates tax for the selected shipping method, then updates both the PayPal order amount and the selected shipping option so the shipping amount and selection remain consistent.

If PayPal rejects a shipping-option update, the API returns a retryable `502` error. The storefront should retry the update after addressing the transient failure rather than treating it as a payment cancellation.

### 1. Start payment initiation

Call the payment initiation endpoint with the PayPal order ID:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Idempotency-Key: {your-idempotency-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/orders/{order-id}/payments"
```

When `orderReview.express` is enabled, the API validates the PayPal order without capturing it.

A successful review response has this form:

```json
{
  "orderId": "{order-id}",
  "paymentAttemptId": "{payment-attempt-id}",
  "provider": "paypal-express",
  "status": "requires_action",
  "action": "review",
  "paypalOrderId": "{paypal-order-id}"
}
```

The order moves directly to:

```text
payment_requires_confirmation
```

The storefront should navigate the buyer to the review page:

```text
https://shop.example/review?orderId={order-id}
```

The API does not capture or authorize funds during this initiation request.

### 2. Handle validation failures

The Express flow distinguishes between a definitive PayPal order status and an upstream validation failure.

The order is cancelled when:

- PayPal returns a successful response whose order status is not `APPROVED`.
- PayPal returns `404`, indicating that the PayPal order cannot be found.

The order remains `pending` and the request returns a retryable error when validation fails because of an upstream or transport problem, such as:

- Authentication or permission errors
- Timeouts
- Conflicts
- Rate limiting
- Server errors

These failures do not prove that the buyer rejected the payment. Retry the initiation request after addressing the upstream failure. Do not create a new storefront order solely because the validation request failed.

## Confirm the reviewed order

The review page confirms the payment by calling the PayPal confirm endpoint:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Idempotency-Key: {your-confirm-idempotency-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/orders/{order-id}/payments/paypal/confirm"
```

The confirm operation:

1. Verifies that the order is ready for confirmation.
2. Uses the PayPal order bound to the payment attempt.
3. Captures the PayPal payment.
4. Updates the order to `payment_completed` when capture succeeds.

Capture does not occur during payment initiation, PayPal approval, or the redirect return. It occurs only as part of this explicit confirmation step.

A successful confirmation completes the order. The storefront should display its normal payment-success state after receiving the successful response.

If confirmation fails because of a transient service problem, the endpoint returns a retryable `503` error. The failure is not persisted as a terminal cancellation, so the storefront can retry confirmation. If capture fails for a terminal reason, the order moves to `payment_cancelled`, and the response includes `cancelled: true` and `checkoutFailure`. A `checkoutFailure` value of `retry` indicates an authorization-stage decline that allows the buyer to try again; `contact_support` indicates that the storefront should direct the buyer to customer support. The raw provider failure reason is not returned to the buyer and is retained only in the administrative payment journal.

Use the same confirmation idempotency key when retrying a request whose outcome is unknown. This prevents a network retry from being treated as a separate confirmation attempt.

## Cancel the reviewed order

The review page can cancel the payment without capturing it:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Idempotency-Key: {your-confirm-idempotency-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/orders/{order-id}/payments/paypal/cancel"
```

Cancellation changes the order to:

```text
payment_cancelled
```

A cancelled order cannot be restarted by calling payment initiation again because payment initiation accepts orders in the `pending` state. If the buyer wants to try another payment method, create the retry experience around the order lifecycle supported by your storefront rather than repeatedly initiating payment on a cancelled order.

## Order and PayPal-order binding

The API binds the PayPal order ID to the payment attempt when the PayPal order is created or supplied for payment.

The binding is used to prevent a return or confirmation request from substituting a different PayPal order. The following identifiers should remain associated throughout the flow:

- Storefront order ID
- Payment attempt ID
- PayPal order ID
- Idempotency key for the relevant API operation

The checkout return flow verifies that the PayPal token returned by PayPal matches the PayPal order recorded for the attempt. The confirm operation captures the bound PayPal order rather than accepting an unrelated PayPal order ID from the browser.

Do not modify or replace these identifiers on the review page. The browser should submit the storefront order ID, while the API resolves the payment attempt and its bound PayPal order.

## Replay behavior

Review flows can receive duplicate browser requests or callbacks, for example when a buyer refreshes the page, uses the browser Back button, or does not receive a redirect response.

The API handles these cases as follows:

- A callback for an order already in `payment_requires_confirmation` is redirected back to the review page when the stored review URL is available.
- A replay does not capture the payment.
- A callback for a completed or cancelled order is not processed as a new payment.
- The stored review decision is used for the payment attempt. Changing the provider configuration while a buyer is on PayPal does not change that attempt from review mode to immediate capture, or vice versa.
- The confirm operation is the only operation that can capture a reviewed payment.

If the stored review URL cannot be resolved during a replay, the API redirects to the configured cancel URL without changing the order state. The order remains `payment_requires_confirmation` and can still be confirmed through the API if the review page can be reached another way.

## Recommended storefront sequence

Implement the review experience with this sequence:

1. Create or load the storefront order.
2. Start PayPal payment initiation.
3. If the response contains `action: "redirect"`, send the buyer to PayPal.
4. If the buyer returns and the order enters `payment_requires_confirmation`, display the review page.
5. If the Express response contains `action: "review"`, display the review page directly.
6. On buyer confirmation, call the PayPal confirm endpoint.
7. On buyer cancellation, call the PayPal cancel endpoint.
8. Use an idempotency key for initiation and confirmation retries.
9. Treat retryable upstream validation failures as pending payment attempts, not buyer cancellations.

## Next steps

- [Configure PayPal payments](/payments/paypal): Set up PayPal provider credentials and payment flows
- [Payment API reference](/api-reference): Review payment initiation, confirmation, and cancellation request details
- [Order states](/orders): Learn how payment states affect order processing