---
title: "Payments overview"
description: "The payment flow, supported providers, and how payment initiation works."
daPath: "/checkout/payments/overview"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.42.1"
    lastReviewedCommit: "e77382f"
    lastContentCommit: "e77382f"
---

# Payments overview

The Edge Commerce API collects payment for an order through a payment provider. Each provider is integrated behind a common model, so the storefront initiates payment the same way regardless of which provider handles it. The provider's credentials come from the [secrets store](/checkout/secrets), resolved by the order's country and locale.

## Supported providers

| Provider | Method | Flow | Configuration |
|----------|--------|------|---------------|
| Chase Payment Solutions | Card | Redirect to a hosted payment page | [Chase](/checkout/payments/chase) |
| PayPal | PayPal / card | Redirect to PayPal checkout | [PayPal](/checkout/payments/paypal) |
| Affirm | Buy-now-pay-later | Redirect or in-page modal | [Affirm](/checkout/payments/affirm) |
| Apple Pay | Wallet | In-sheet, processed through a payment processor | [Apple Pay](/checkout/payments/apple-pay) |

## The payment flow

Payment builds on the order estimate flow:

1. **Estimate and preview**: the storefront previews the cart to lock in shipping, tax, and discounts. The result is stored on the order when it is created.
2. **Order creation**: the order is created with its locked-in estimates. The customer agrees to pay.
3. **Payment initiation**: the storefront initiates payment for the order, naming the provider. The API loads the provider's credentials from the secrets store, computes the amount from the stored order (never from client input), and returns the next step for the customer.
4. **Customer completes payment**: for redirect-based providers, the customer is sent to the provider's hosted page to enter payment details. Card data never passes through the storefront or the API.
5. **Verification and confirmation**: the provider returns the result, the API verifies it directly with the provider, updates the order state, and redirects the customer back to the configured success or cancel URL.

### Next-step actions

When payment is initiated, the API returns an action that tells the storefront what to do next. The action depends on the provider and method:

| Action | Meaning |
|--------|---------|
| `redirect` | Send the customer to the provider's hosted page (Chase card, PayPal, Affirm) |
| `complete` | Payment finished server-side; no further customer action (wallet flows) |

## Shared credentials across provider variants

Some providers expose more than one flow that share the same merchant account. These variants reuse a single secret file rather than requiring a duplicate:

- The **Chase wallet** flow (Apple Pay or Google Pay processed through Chase) uses the [`payments-chase`](/checkout/payments/chase) credentials.
- The **PayPal Express** flow uses the [`payments-paypal`](/checkout/payments/paypal) credentials.

You do not create separate secret files for these variants.

## How initiation stays safe

Payment initiation does not require customer authentication, so guests can check out. It is protected by several layered controls instead:

- **Server-computed amount**: the charge is derived from the stored order and its locked-in estimates, never from the request body, so the total cannot be manipulated.
- **Payable orders only**: only an order that has not already been paid, cancelled, or moved past the payable state accepts a payment initiation.
- **Single active initiation**: once an order enters payment processing it does not accept further initiations; once it is paid or cancelled it is terminal.
- **Per-order attempt limit**: the number of payment attempts for a single order is capped to deter card-testing abuse.
- **Idempotency key**: every initiation includes a client-generated key, so a retried request returns the original result instead of starting a second payment.

## Next steps

- [Chase](/checkout/payments/chase) · [PayPal](/checkout/payments/paypal) · [Affirm](/checkout/payments/affirm) · [Apple Pay](/checkout/payments/apple-pay): Provider configuration
- [Secrets store](/checkout/secrets): How payment credentials are stored and resolved
- [API reference](/api-reference): Complete API endpoint reference
