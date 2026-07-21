---
title: "Transactional email"
description: "Configure OTP and order confirmation email, author Edge Delivery templates, and manage sender identity."
daPath: "/emails"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "2731b0a"
    lastContentCommit: "e8f6b93"
---

# Transactional email

The Edge Commerce API sends customer email for authentication and order communication. Email behavior is split into three areas:

| Area | Purpose | Template source | Sender settings |
|------|---------|-----------------|-----------------|
| OTP email | Sends one-time password login codes | Edge-authored OTP templates or fallback HTML | `emails.otp` |
| Order confirmation email | Sends order confirmation after successful payment | Edge-authored order templates or fallback HTML | `emails.transactional` |


Shared branding for fallback templates comes from `emails.branding` in [Site configuration](/configuration/site#email-settings).

## Configure email settings

Configure email sender and branding settings in site configuration:

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

| Group | Used by |
|-------|---------|
| `emails.branding` | Fallback OTP and order confirmation templates, plus custom order template view data |
| `emails.otp` | OTP login code email sender, display name, and Reply-To |
| `emails.transactional` | Order confirmation sender, display name, and Reply-To |

See [Site configuration](/configuration/site#email-settings) for the full schema and validation rules.

## Sender identity

OTP and order confirmation emails are sent on behalf of the site. If no custom sender is configured, the API uses an Adobe-managed sender address:

| Email type | Site config sender | Fallback sender |
|------------|--------------------|-----------------|
| OTP email | `emails.otp.sender` | `noreply@adobecommerce.live` |
| Order confirmation email | `emails.transactional.sender` | `noreply@mail.adobecommerce.live` |

Use `fromName` to set the display name customers see in their inbox, such as `Example Store`. Use `replyTo` when customer replies should go to a support inbox instead of the sender address.

Custom sender addresses and domains must be set up before they are used. If you want OTP or order confirmation email to come from your own domain, contact your Adobe team to configure and verify the sender domain. After the sender is ready, set `emails.otp.sender` or `emails.transactional.sender` in site configuration.

For order email, country-specific `geoOverrides` can replace `emails.branding` and `emails.transactional` values. OTP email does not have request-country context, so `emails.otp` cannot be overridden geographically. See [Geographic overrides](/configuration/site#geographic-overrides).

## OTP email flow

OTP email is part of the [one-time password login flow](/authentication/overview). When `POST /auth/login` accepts a login request, the API generates a short-lived code and sends it to the shopper.

OTP email uses this resolution order:

1. Resolve sender fields from `emails.otp`.
2. Resolve the site host from the organization, site, and environment.
3. Look for an Edge-authored OTP template in the configured locale fallback order.
4. Render the template with the `code` variable when a template is found.
5. Use the built-in branded fallback email when no template is found.

The OTP code expires after five minutes.

### OTP template paths

Author OTP templates at these Edge Delivery paths:

```text
/config/email/otp/{country}/{locale}
/config/email/otp/{country}/{language}
/config/email/otp/{country}/default
/config/email/otp/default
```

For `country=ca` and `locale=fr-CA`, the API tries:

```text
/config/email/otp/ca/fr-CA
/config/email/otp/ca/fr
/config/email/otp/ca/default
/config/email/otp/default
```

The first template that exists is used. If none exists, the built-in fallback template is used.

### OTP template variables

OTP templates can use Mustache variables:

| Variable | Description |
|----------|-------------|
| `{{code}}` | One-time password code |

Example OTP template body:

```html
<table>
  <tr><td>Subject</td><td>Your login code: {{code}}</td></tr>
</table>

<h1>Your login code</h1>
<p>Use this code to finish signing in:</p>
<p><strong>{{code}}</strong></p>
<p>This code expires in five minutes.</p>
```

The optional `Subject` metadata table sets the email subject. If it is absent, the subject defaults to `Your login code`.

## Order confirmation email flow

Order confirmation email is sent automatically after a payment provider verifies a successful payment and the order reaches `payment_completed`. Storefronts do not need to call a separate email endpoint for the standard order confirmation.

The send runs after the payment result is processed so it does not block the checkout response.

The order confirmation flow:

1. Builds a deduplication key from organization, site, and order ID.
2. Skips sending if the order confirmation was already sent or is already in flight.
3. Loads site configuration for sender and branding settings.
4. Looks for an Edge-authored order confirmation template in locale fallback order.
5. Renders the custom template when found, or uses the built-in fallback template.
6. Sends the email to the order customer's email address.
7. Records the email outcome in the order journal.

The built-in fallback template includes order summary, shipping and billing addresses, line items, totals, support contact details, and footer address when available.

### Order confirmation template paths

Author order confirmation templates at these Edge Delivery paths:

```text
/config/email/order-confirmation/{country}/{locale}
/config/email/order-confirmation/{country}/{language}
/config/email/order-confirmation/{country}/default
/config/email/order-confirmation/default
```

For `country=us` and `locale=en-US`, the API tries:

```text
/config/email/order-confirmation/us/en-US
/config/email/order-confirmation/us/en
/config/email/order-confirmation/us/default
/config/email/order-confirmation/default
```

The first template that exists is used. If none exists, the built-in fallback template is used.

## Authoring Edge email templates

Email templates are authored as Edge Delivery pages. The API fetches the rendered page, converts it to email-safe HTML, extracts the optional subject metadata table, and renders Mustache variables.

### Subject metadata

Add a two-cell table with `Subject` in the first cell to set the subject line:

```html
<table>
  <tr><td>Subject</td><td>Order {{order.friendlyId}} confirmed</td></tr>
</table>
```

The subject table is removed from the email body before sending.

### Order template variables

Order confirmation templates can use these variables:

| Variable | Description |
|----------|-------------|
| `{{order.id}}` | Full order ID |
| `{{order.friendlyId}}` | Friendly order ID, or full order ID when no friendly ID exists |
| `{{order.createdAt}}` | Localized order creation date and time |
| `{{order.locale}}` | Order locale |
| `{{order.currency}}` | Order currency |
| `{{customer.firstName}}` | Customer first name |
| `{{customer.lastName}}` | Customer last name |
| `{{customer.name}}` | Customer full name |
| `{{customer.email}}` | Customer email |
| `{{shipping.*}}` | Shipping address fields |
| `{{billing.*}}` | Billing address fields |
| `{{payment.method}}` | Display label for payment method |
| `{{shippingMethod.name}}` | Selected shipping method name, label, or ID |
| `{{totals.subtotal}}` | Formatted subtotal |
| `{{totals.shipping}}` | Formatted shipping amount |
| `{{totals.tax}}` | Formatted tax amount |
| `{{totals.discount}}` | Formatted discount amount |
| `{{totals.grandTotal}}` | Formatted grand total |
| `{{support.email}}` | Support email from branding settings |
| `{{support.phone}}` | Support phone from branding settings |
| `{{support.footerAddress}}` | Footer address from branding settings |
| `{{branding.logoUrl}}` | Sanitized logo URL from branding settings |
| `{{branding.brandColor}}` | Brand color from branding settings |

Items are available as an `items` list with `name`, `sku`, `quantity`, `imageUrl`, `unitPrice`, and `lineTotal`.

### Built-in partials

Order templates can use built-in partials for common sections:

```html
<h1>Thanks, {{customer.firstName}}</h1>
<p>Order {{order.friendlyId}} is confirmed.</p>

{{>items}}
{{>totals}}
```

| Partial | Output |
|---------|--------|
| `{{>items}}` | Email-safe line-items table |
| `{{>totals}}` | Email-safe subtotal, shipping, tax, discount, and grand total table |

### Example order confirmation template

```html
<table>
  <tr><td>Subject</td><td>Your order {{order.friendlyId}} is confirmed</td></tr>
</table>

<h1>Thanks for your order, {{customer.firstName}}</h1>
<p>We received order <strong>{{order.friendlyId}}</strong> on {{order.createdAt}}.</p>

<h2>Items</h2>
{{>items}}

<h2>Totals</h2>
{{>totals}}

<p>Questions? Contact {{support.email}}.</p>
```

## Email outcomes and order journal

Order confirmation email records outcomes in the order journal. Outcomes include sent, render failure, permanent failure, and in-flight states. Journal entries include the order ID, recipient, sender, outcome, and send timestamp when available.

Use [Order journal](/orders/journal) for event types and query examples.

## Next steps

- [Site configuration](/configuration/site#email-settings): Configure branding, OTP sender, and transactional sender settings
- [Authentication overview](/authentication/overview): Understand the OTP login flow
- [Order lifecycle](/orders/lifecycle): See where order confirmation fits after payment
- [API reference](/api-reference): Complete endpoint details
