---
title: "Multi-store configuration"
description: "Structure multiple stores and locales in Edge Delivery Commerce."
status: migrated
managed: true
sourceFormat: markdown
---

# Multi-store configuration

If you have multiple stores, or serve multiple languages, use the following structure:

```text
Org
  └── Site
      └── Store (e.g., "us", "eu", "default")
          └── View (e.g., "en_us", "en_gb", "fr_fr")
```

This can be useful for organizing stores based on geography, so that you can manage inventory and pricing for each region. It allows language views, with multiple languages within the same store. Finally, you can enforce brand separation and serve multiple brands under one organization.

As a result, you will have an API structure like this, with each store/view combination having independent product data:

```text
/{org}/{site}/catalog/us/en_us/products/...     (US English)
/{org}/{site}/catalog/us/es_us/products/...     (US Spanish)
/{org}/{site}/catalog/eu/en_gb/products/...     (UK English)
```

## Next steps

- [Data Ingestion Guide](/data-ingestion#etl-process-overview): Map source data to per-store paths
- [API Reference](/api-reference#path-structure): Path structure and routing rules
