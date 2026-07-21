---
title: "Checkout overview"
description: "How payments, fraud, tax, and identity providers fit together at checkout, and where their credentials live."
daPath: "/checkout/overview"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.3"
    lastReviewedCommit: "d180131"
    lastContentCommit: "2731b0a"
---

# Checkout overview

Turning a cart into a paid order involves several third-party services: a **payment** provider to collect funds, a **fraud** service to screen the transaction, a **tax** engine to calculate what's owed, and optionally an **identity** provider to verify eligibility for special pricing. The Edge Commerce API integrates each of these through a common provider model, and stores their credentials in a shared, encrypted secrets store.

This section explains how those providers are configured and how they participate in the order flow. See [Order lifecycle](/orders/lifecycle) for the full sequence from estimate through payment result.

## The provider model

Each integration is a named provider that the API calls at the right moment in the checkout flow. Providers are grouped by what they do:

| Group | Providers | Role |
|-------|-----------|------|
| [Payments](/checkout/payments/overview) | Chase, PayPal, Affirm, Apple Pay | Collect payment for an order |
| [Fraud](/checkout/fraud/forter) | Forter | Screen transactions for fraud before approval |
| [Tax](/checkout/tax/avalara) | Avalara | Calculate tax during order preview |
| [Identity](/checkout/identity/idme) | ID.me | Verify eligibility for group-based discounts |

## Where credentials live

Every provider needs credentials: API tokens, merchant IDs, client secrets, and endpoint URLs. These are never kept in regular site config. They go in the [secrets store](/checkout/secrets): an encrypted, write-only store that resolves the right credentials for each order based on its country and locale.

The mechanics of writing and resolving secrets are identical for every provider, so they are documented once in the [secrets store guide](/checkout/secrets).

For PayPal, the provider configuration can optionally enable an order-review step independently for standard checkout and express flows. When review is enabled, the configuration must include a secure `reviewUrl`.

## How a checkout flows

At a high level, an order moves through these stages:

1. **Estimate**: the storefront previews shipping, tax, and discounts for the cart. Tax can be calculated by the [Avalara](/checkout/tax/avalara) provider when configured. See [Estimates and cart totals](/estimates).
2. **Order creation**: the customer confirms, and the order is created with its locked-in estimates.
3. **Payment initiation**: the storefront initiates payment with a [payment provider](/checkout/payments/overview). The API loads that provider's credentials, computes the amount from the stored order, and returns the next step (typically a redirect).
4. **Fraud screening**: when [Forter](/checkout/fraud/forter) is configured, the transaction is screened before it is approved.
5. **Confirmation**: the provider confirms the result, the order state is updated, and the customer is returned to the storefront. For PayPal flows configured for order review, approval returns a `review` action instead. The storefront sends the customer to the configured review URL, and the order remains in `payment_requires_confirmation` until the storefront explicitly confirms payment capture.

## Next steps

- [Order lifecycle](/orders/lifecycle): How estimates, orders, payments and journals fit together
- [Estimates and cart totals](/estimates): How cart estimates are computed
- [Secrets store](/checkout/secrets): How provider credentials are stored and resolved
- [Payments overview](/checkout/payments/overview): The payment flow and supported providers
- [API reference](/api-reference): Complete API endpoint reference