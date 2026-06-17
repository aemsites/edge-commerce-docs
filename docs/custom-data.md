---
title: "Custom data and extensions"
description: "Extend product data with custom fields in Edge Delivery Commerce."
status: migrated
managed: true
sourceFormat: markdown
---

# Custom data and extensions

The `custom` object provides a flexible way to extend product data with arbitrary structures that suit your specific needs. The API does not validate the contents of this object, allowing you to store any application-specific data without schema restrictions. When you include custom data in your product records, it will be preserved and returned in all API responses. You can add the `custom` object at both the top-level product and on individual variants, giving you fine-grained control over where you store additional information.

```json
{
  "sku": "product-123",
  "name": "Product Name",
  "custom": {
    "internalId": "INT-9876",
    "supplierData": {
      "code": "SUP-ABC",
      "leadTime": "3-5 days"
    },
    "promotions": ["spring-sale", "clearance"],
    "customAttributes": {
      "eco-friendly": true,
      "handmade": false
    }
  }
}
```

When working with the `custom` object, focus on using it for integration-specific data that doesn't fit into the standard product schema. Since the API doesn't validate this data, you should implement validation on the client side to ensure data quality and consistency. Be mindful not to overload the custom object with unnecessary data, as this can impact performance and make your product records harder to maintain.

## Next steps

- [Schema Reference](/schema-reference#productbusentry): Standard product fields and the `custom` field
- [Data Ingestion Guide](/data-ingestion#etl-process-overview): Transform source data into the product schema
