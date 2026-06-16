---
title: "Security best practices"
description: "API key management and data validation best practices."
status: migrated
managed: true
sourceFormat: markdown
---

# Security best practices

## API key management

Rotate your API keys regularly, quarterly rotation is recommended as a baseline. Never commit keys to version control, and instead use environment variables or a secret management service to store and access them securely.

## Data validation

Validate all product data before ingestion to catch issues early. Sanitize HTML content to prevent Cross-Site Scripting (XSS) vulnerabilities, and validate external URLs for images to ensure they point to trusted sources.

## Next steps

- [Data Ingestion Guide](/data-ingestion#etl-process-overview): Validation during the ETL process
- [API Reference](/api-reference#authentication): Authentication and authorization
