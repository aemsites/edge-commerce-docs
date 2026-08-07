---
title: "Product catalog modeling"
description: "Model standalone products, products with variants, and bundle compositions in the Product Bus."
daPath: "/product-catalog-modeling"
status: migrated
managed: true
sourceFormat: markdown
sources:
  helix-commerce-api:
    version: "v2.49.1"
    lastReviewedCommit: "b95c8fa"
    lastContentCommit: "b95c8fa"
  helix-product-pipeline:
    version: "v2.9.1"
    lastReviewedCommit: "893adf9"
    lastContentCommit: "893adf9"
---

# Product catalog modeling

The Product Bus uses one unified product schema, `ProductBusEntry`. It does not enforce a fixed set of mutually exclusive product types. Instead, the structures present in a product record determine how it is modeled and, for bundles, how it is processed at checkout.

The optional `type` field is a descriptive identifier such as `simple`, `configurable`, or `bundle`. Edge Commerce does not use it to select a schema shape or resolve bundle checkout behavior.

## Modeling patterns

### Standalone products

A standalone product has no `variants` array and no non-empty `bundleItems` array. Its product SKU and price identify the purchasable item.

```json
{
  "sku": "BLENDER-500",
  "path": "/products/blender-500",
  "name": "Blender 500",
  "price": {
    "final": "199.00",
    "currency": "USD"
  }
}
```

### Products with variants

A product with a `variants` array represents multiple purchasable SKU and option combinations under one parent product. The parent can declare the available `options`; each variant identifies its selected option values.

The Product Pipeline renders each variant as an Offer in the product page's automatically generated JSON-LD. The Product Bus does not require `type: "configurable"` for this behavior.

For example, this product has two purchasable color variants without declaring a `type`:

```json
{
  "sku": "TUMBLER-20OZ",
  "path": "/products/tumbler-20oz",
  "name": "20 oz tumbler",
  "price": { "final": "24.00", "currency": "USD" },
  "options": [
    {
      "id": "color",
      "label": "Color",
      "values": [{ "value": "Red" }, { "value": "Black" }]
    }
  ],
  "variants": [
    {
      "sku": "TUMBLER-20OZ-RED",
      "name": "20 oz tumbler - Red",
      "url": "https://www.example.com/products/tumbler-20oz?color=red",
      "images": [{ "url": "https://cdn.example.com/tumbler-red.jpg" }],
      "price": { "final": "24.00", "currency": "USD" },
      "options": [{ "id": "color", "value": "Red" }]
    },
    {
      "sku": "TUMBLER-20OZ-BLACK",
      "name": "20 oz tumbler - Black",
      "url": "https://www.example.com/products/tumbler-20oz?color=black",
      "images": [{ "url": "https://cdn.example.com/tumbler-black.jpg" }],
      "price": { "final": "24.00", "currency": "USD" },
      "options": [{ "id": "color", "value": "Black" }]
    }
  ]
}
```

For the complete field definitions, see [ProductBusVariant](/schema-reference#productbusvariant) and [ProductBusOption](/schema-reference#productbusoption).

### Bundle compositions

A bundle product has a non-empty `bundleItems` array. Each entry represents a component that is fulfilled and evaluated for tax as part of the parent product. The bundle parent remains the product that the shopper adds to the cart and the line whose price is charged.

Set `type: "bundle"` when it is useful to label the product for storefront presentation or external systems, but use `bundleItems` to model the composition. An empty `bundleItems` array is accepted as product data but is not processed as a bundle during checkout.

A bundle can also have variants. For example, a bundle parent may offer a color selection while its component items are resolved from that selection. Bundle composition and product variants are therefore not mutually exclusive product types.

#### Simple components

A simple component provides its own SKU and price. The component's `price.final` is expressed in the parent line item's currency.

```json
{
  "sku": "STARTER-KIT",
  "path": "/products/starter-kit",
  "name": "Starter kit",
  "type": "bundle",
  "price": {
    "final": "120.00",
    "currency": "USD"
  },
  "bundleItems": [
    {
      "sku": "BLENDER-500",
      "name": "Blender 500",
      "price": { "final": "100.00" }
    },
    {
      "sku": "RECIPE-BOOK",
      "name": "Recipe book",
      "price": { "final": "20.00" }
    }
  ]
}
```

#### Configurable components

A configurable component supplies a `variants` array rather than one fixed SKU. Each component variant declares the option pairs that select it. At order preview, the service matches those pairs with the parent line item's `selectedOptions` and requires exactly one matching component variant.

The following bundle has color variants of its own. It always includes a blender and resolves the included cup to the selected color. The parent product's variant options use `value`; the nested bundle component's options use `name` to match the order item's selected value.

```json
{
  "sku": "STARTER-KIT",
  "path": "/products/starter-kit",
  "name": "Starter kit",
  "type": "bundle",
  "price": { "final": "120.00", "currency": "USD" },
  "options": [
    {
      "id": "color",
      "label": "Color",
      "values": [{ "value": "Red" }, { "value": "Black" }]
    }
  ],
  "variants": [
    {
      "sku": "STARTER-KIT-RED",
      "name": "Starter kit - Red",
      "url": "https://www.example.com/products/starter-kit?color=red",
      "images": [],
      "price": { "final": "120.00", "currency": "USD" },
      "options": [{ "id": "color", "value": "Red" }]
    },
    {
      "sku": "STARTER-KIT-BLACK",
      "name": "Starter kit - Black",
      "url": "https://www.example.com/products/starter-kit?color=black",
      "images": [],
      "price": { "final": "120.00", "currency": "USD" },
      "options": [{ "id": "color", "value": "Black" }]
    }
  ],
  "bundleItems": [
    {
      "sku": "BLENDER-500",
      "name": "Blender 500",
      "price": { "final": "100.00" }
    },
    {
      "variants": [
        {
          "sku": "CUP-RED",
          "name": "Red cup",
          "price": { "final": "20.00" },
          "options": [{ "id": "color", "name": "Red" }]
        },
        {
          "sku": "CUP-BLACK",
          "name": "Black cup",
          "price": { "final": "20.00" },
          "options": [{ "id": "color", "name": "Black" }]
        }
      ]
    }
  ]
}
```

For the red selection, the storefront sends the parent variant and the selected option; it does not send the resolved component lines:

```json
{
  "sku": "STARTER-KIT-RED",
  "path": "/products/starter-kit",
  "quantity": 1,
  "price": { "final": "120.00", "currency": "USD" },
  "selectedOptions": [{ "id": "color", "value": "Red" }]
}
```

The service resolves `CUP-RED` for the second component. The resolved component prices are `100.00` and `20.00`, which add up to the parent line price of `120.00`.

See [BundleItem](/schema-reference#bundleitem), [BundleItemVariant](/schema-reference#bundleitemvariant), and [SelectedOption](/schema-reference#selectedoption) for the complete shapes.

## Checkout behavior

Storefronts submit the bundle parent as the order item. They must not calculate or submit the component lines: the service resolves them from the current Product Bus entry and replaces any client-supplied nested `bundleItems`.

The resolved component prices must add up to the parent order item's `price.final`. Each resolved component inherits the parent quantity and currency.

Order previews and created orders retain the resolved component lines nested under the bundle parent. Those nested lines are not additional chargeable order items; the parent line remains the chargeable value. See [OrderItem](/schema-reference#orderitem) and [Estimates and cart totals](/estimates) for the order and estimate response shapes.

## Rendering and structured data

Bundle composition is available in Product Bus JSON data, but it is not expanded in the Product Pipeline's automatic JSON-LD. A bundle parent receives the same Product and Offer markup as another product; the generated markup does not list its `bundleItems` or their component prices.

Use the `jsonld` override only when another structured-data consumer requires a different JSON-LD document. It does not change the Product Bus model or checkout resolution. See [JSON-LD structured data](/rendering-guide#json-ld-structured-data) for the generated output and override behavior.

## Next steps

- [Schema reference](/schema-reference#productbusentry): Review the complete Product Bus and order field definitions
- [Data ingestion](/data-ingestion): Load product records into the Product Bus
- [Rendering guide](/rendering-guide): Understand product-page and JSON-LD output
- [Estimates and cart totals](/estimates): Preview tax, shipping, and discounts before order creation