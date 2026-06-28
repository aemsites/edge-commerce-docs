---
title: "Security best practices"
description: "API key management and data validation best practices."
status: migrated
managed: true
sourceFormat: markdown
---

# Security best practices

## Token management

Use [service tokens](/authentication/service-tokens) for automation and integrations. Create one token per integration, grant only the permissions it needs, and rotate tokens regularly. Never commit tokens to version control; store them in a secret management system.

Use an authenticated admin session for sensitive setup tasks such as writing provider credentials. Service tokens are intentionally blocked from some high-privilege operations, including secrets writes and token administration.

## Access control

Review [roles and permissions](/authentication/roles-permissions) before granting access. Permissions are scoped by organization and site, and routes check the specific permission required for the operation.

## Data validation

Validate all product data before ingestion to catch issues early. Sanitize HTML content to prevent Cross-Site Scripting (XSS) vulnerabilities, and validate external URLs for images to ensure they point to trusted sources.

## Next steps

- [Site configuration](/configuration/site): Configure allowed origins, auth and reCAPTCHA
- [Authentication overview](/authentication/overview): Learn how tokens and site scoping work
- [Roles and permissions](/authentication/roles-permissions): Review access levels and permission groups
- [Data ingestion](/data-ingestion#etl-process-overview): Validate data during the ETL process
- [API reference](/api-reference): Complete endpoint details
