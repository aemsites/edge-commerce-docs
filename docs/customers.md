---
title: "Customers and account data"
description: "How customer profiles, addresses, and customer-scoped orders work in the Edge Commerce API."
daPath: "/customers"
status: new
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.52.2"
    lastReviewedCommit: "8f53823"
    lastContentCommit: "8f53823"
---

# Customers and account data

Customer APIs manage customer profiles, saved addresses, and customer-scoped order lookup. They support both checkout-created customer records and authenticated account experiences.

A customer profile is keyed by email address within an organization and site. Customer-scoped routes require the authenticated user to match the requested email, except for the guest order-status lookup that uses email plus order ID.

## How customer records are created

Customers can enter the system in two ways:

| Flow | What happens |
|------|--------------|
| Order creation | `POST /orders` validates the order customer, creates the customer if one does not already exist, links the order to the customer email, saves the shipping address to the customer's address book, and sets `customerCreated` to `true` on the order when it creates the profile |
| Direct customer creation | `POST /customers` creates a customer profile directly and requires `customers:write` |

Most storefront checkout flows do not need to call `POST /customers` before placing an order. [Order creation](/orders/lifecycle#create-the-order) handles the customer profile when needed.

When checkout finds an existing profile, it preserves the profile's existing values and backfills only empty `firstName`, `lastName`, and `phone` fields from the order. It does not overwrite values the customer previously set. The order's `customerCreated` value remains `false` for an existing profile.

## API overview

| Need | API | Authentication |
|------|-----|----------------|
| Create a customer profile directly | `POST /{org}/sites/{site}/customers` | `customers:write` |
| List customers | `GET /{org}/sites/{site}/customers` | `customers:read` |
| Retrieve the signed-in customer's profile | `GET /{org}/sites/{site}/customers/{email}` | Authenticated user matching `{email}` |
| Create or update the signed-in customer's profile | `PATCH /{org}/sites/{site}/customers/{email}` | Authenticated user matching `{email}` |
| Delete a customer profile | `DELETE /{org}/sites/{site}/customers/{email}` | Admin |
| List saved addresses | `GET /{org}/sites/{site}/customers/{email}/addresses` | Authenticated user matching `{email}` |
| Create a saved address | `POST /{org}/sites/{site}/customers/{email}/addresses` | Authenticated user matching `{email}` |
| Retrieve, replace, or delete a saved address | `GET`, `PUT`, or `DELETE /{org}/sites/{site}/customers/{email}/addresses/{addressId}` | Authenticated user matching `{email}` |
| List a customer's orders | `GET /{org}/sites/{site}/customers/{email}/orders` | `orders:read` and authenticated user matching `{email}` |
| Retrieve one customer order | `GET /{org}/sites/{site}/customers/{email}/orders/{orderId}` | Optional bearer token. Email plus order ID is used for guest order-status lookup |

## Customer profile shape

A customer profile contains checkout contact information and optional site-specific custom attributes. Custom attributes are string-valued and can store site-specific data such as a marketing opt-in, preferred contact method, or consent timestamp. See [Schema reference](/schema-reference#customer) for the generated schema.

| Field | Required | Description |
|-------|----------|-------------|
| `firstName` | Yes | Customer first name |
| `lastName` | Yes | Customer last name |
| `email` | Yes | Customer email address |
| `phone` | No | Customer phone number |
| `custom` | No | Site-specific customer attributes with string values |

The API adds timestamps when the profile is stored.

## Customer passwords

Customer profiles do not include passwords, password hashes, password reset tokens, or password policy settings. Customer authentication uses the [one-time password login flow](/authentication/overview) when [auth is enabled for the site](/configuration/site#authentication-settings).

After login, the customer is represented by a bearer token scoped to the organization, site, and email address. Customer-scoped routes compare that token email with the `{email}` path parameter.

## Create a customer directly

Direct customer creation is useful for account setup, migration, or integrations. It is not required for normal guest checkout. Integrations should use an admin token or [service token](/authentication/service-tokens) with the required customer permission.

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/customers" \
  -H "Authorization: Bearer {your-service-token-or-admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "phone": "800-555-0123"
  }'
```

If a customer with the same email already exists for the site, the API returns `409`.

## Retrieve the signed-in customer

A customer can retrieve their own profile with a [bearer token](/authentication/overview) for the same email address.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/customers/jane@example.com" \
  -H "Authorization: Bearer {customer-session-token}"
```

The token must belong to the same organization, site, and email address. Admin and service use cases should use the collection or order APIs with the appropriate permissions instead of impersonating customer-scoped profile reads.

## Update the signed-in customer

Use `PATCH /customers/{email}` to create or partially update the signed-in customer's profile. The bearer token email must match the `{email}` path parameter, and the token must have membership in the requested organization and site. This self-service route does not require `customers:write`.

The request body can include `firstName`, `lastName`, `phone`, and `custom`. Provided first-class fields replace their existing values, while fields not included in the request are preserved. The `custom` attributes are shallow-merged, so custom attributes not included in the request are preserved. The email is taken from the path and cannot be changed; including `email` in the request body is rejected.

If no profile exists, the route creates one from the merged request. A create-via-patch must include both `firstName` and `lastName`. For an existing profile, those fields can be omitted because the API validates the resulting merged profile.

```bash
curl -X PATCH "https://api.adobecommerce.live/{org}/sites/{site}/customers/jane@example.com" \
  -H "Authorization: Bearer {customer-session-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "custom": {
      "newsletterOptIn": "true",
      "preferredContactMethod": "email"
    }
  }'
```

A successful request returns `200` with the created or updated profile in a `customer` property. The API returns `400` when the body contains an unknown field, an invalid value type, an email field, or a create request without the required name fields. It returns `403` when the bearer token does not own the path email or lacks organization/site membership.

## Address book

Saved addresses belong to a customer email. Address routes require the authenticated email to match the `{email}` path parameter. Storefronts can use [Places and address validation](/places) before saving an address to reduce entry errors. See [Schema reference](/schema-reference#address) for the generated address schema.

### Address shape

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Full name of the recipient |
| `email` | Yes | Email address for the address record |
| `address1` | Yes | Primary street address |
| `address2` | No | Secondary street address |
| `company` | No | Company name |
| `city` | Yes | City |
| `state` | Yes | State or province code |
| `zip` | Yes | Postal or ZIP code |
| `country` | Yes | ISO 3166-1 alpha-2 country code |
| `phone` | No | Phone number |
| `isDefault` | No | Whether this is the default address |
| `isValidated` | No | Whether the address has been validated |

### Save an address

```bash
curl -X POST "https://api.adobecommerce.live/{org}/sites/{site}/customers/jane@example.com/addresses" \
  -H "Authorization: Bearer {customer-session-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "address1": "123 Market St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US",
    "phone": "800-555-0123",
    "isDefault": true
  }'
```

The response returns the stored address, including its generated `id`.

### Replace or delete an address

Use `PUT /customers/{email}/addresses/{addressId}` to replace an address. Use `DELETE /customers/{email}/addresses/{addressId}` to delete it.

```bash
curl -X DELETE "https://api.adobecommerce.live/{org}/sites/{site}/customers/jane@example.com/addresses/{address-id}" \
  -H "Authorization: Bearer {customer-session-token}"
```

Address updates are replacements, not partial patches. Send the full address body when using `PUT`.

## Customer orders

[Order creation](/orders/lifecycle#create-the-order) links each order to the order customer's email address. This enables account order history and guest order-status flows.

When order creation creates a new customer profile, the stored order includes `customerCreated: true`. The API derives this value; clients cannot set it. Orders for customers whose profiles already existed include `customerCreated: false`.

### List customer orders

Listing a customer's orders requires `orders:read`, an authenticated token for the same email address, and matching organization/site scope. The response returns up to 1,000 order links for client-side sorting. See [Roles and permissions](/authentication/roles-permissions) for permission details.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/customers/jane@example.com/orders" \
  -H "Authorization: Bearer {customer-session-token}"
```

### Retrieve one customer order

Retrieving one customer order by email and order ID supports guest order-status pages. A bearer token is optional for this operation. If the order does not exist or the order's customer email does not match the path email, the API returns `404`.

```bash
curl "https://api.adobecommerce.live/{org}/sites/{site}/customers/jane@example.com/orders/{order-id}"
```

Use this route for confirmation pages or “track your order” flows where the shopper has both their email address and order identifier. See [Order lifecycle](/orders/lifecycle#retrieve-and-list-orders) for the broader order lookup model.

## Access rules

| Operation | Access rule |
|-----------|-------------|
| Create customer directly | Requires `customers:write` |
| List customers | Requires `customers:read` |
| Retrieve one customer profile | Requires authenticated email ownership |
| Create or update the signed-in customer profile | Requires authenticated email ownership and organization/site membership |
| Delete customer profile | Requires admin role |
| Manage addresses | Requires authenticated email ownership |
| List customer orders | Requires `orders:read` and authenticated email ownership |
| Retrieve one customer order | Email plus order ID is sufficient for guest order-status lookup |

See [Roles and permissions](/authentication/roles-permissions) for the full permission model.

## Relationship to checkout

Checkout and customer data are connected but separate. When `POST /orders` creates an order, it also:

- Creates a customer profile if one does not already exist.
- Sets the server-derived `customerCreated` order field to indicate whether it created that profile.
- Links the order to the customer email for later customer order lookup.
- Saves the shipping address to the customer's address book.

For an existing customer, checkout preserves the profile's first-class values and fills only empty `firstName`, `lastName`, and `phone` fields from the order. It does not overwrite customer-edited values. Customer custom attributes are site-specific string values and are managed through the customer profile APIs.

Customer APIs let account experiences read and update profiles, manage addresses, and show order history.

See [Order lifecycle](/orders/lifecycle) for the full checkout flow.

## Next steps

- [Order lifecycle](/orders/lifecycle): Understand how checkout creates customers and links orders
- [Places and address validation](/places): Autocomplete and validate customer addresses
- [Authentication overview](/authentication/overview): Learn how email ownership and site scoping work
- [Roles and permissions](/authentication/roles-permissions): Review customer and order permissions
- [API reference](/api-reference): Complete endpoint details