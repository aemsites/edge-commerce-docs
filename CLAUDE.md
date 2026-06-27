# Edge Commerce documentation guidelines

## Purpose

This repository contains public-facing documentation for Edge Commerce. Write for developers, solution architects, and implementers using the platform.

## Writing guidelines

1. **Format**: All documentation must be written in Markdown.
2. **Clarity**: Write for developers and architects. Be precise and technical, but clear.
3. **Examples**: Include concrete examples, code snippets, and use cases where helpful.
4. **Accuracy**: Technical details must be verifiable against the actual codebase.
5. **Public audience**: Avoid exposing unnecessary internal implementation details.

## Customer-facing documentation style

### Avoid implementation details

Customer-facing documentation should avoid exposing specific implementation technologies.

Do not mention:

- Specific cloud providers or runtimes.
- Specific storage technologies.
- Internal storage architecture.
- Deployment architecture.
- Internal infrastructure topology.

Use benefit-focused language instead:

- “Encrypted at rest”
- “Low-latency access”
- “Reliable storage”
- “Scalable”
- “Globally available”
- “Cached by major CDN providers”

Focus on what customers need to know and what capability they get, not how it is implemented internally.

Architecture or internal engineering documents may include implementation details, but public docs should not.

## Code examples and placeholders

Use inline placeholders in curly braces.

Good:

```bash
curl -H "Authorization: Bearer {your-api-key}" \
  "https://api.adobecommerce.live/{org}/sites/{site}/..."
```

Avoid exported environment variables in examples:

```bash
export KEY="your-api-key"
curl -H "Authorization: Bearer $KEY" ...
```

Inline placeholders are easier to read and require fewer setup steps.

## Schema descriptions

Do not describe the Product Bus schema as “inspired by schema.org”. It is a custom schema.

Use:

- “custom schema”
- “unified product schema”

It is fine to mention schema.org when documenting JSON-LD structured data.

## CDN provider lists

Do not enumerate specific CDN providers in public docs.

Avoid:

```text
Cloudflare, Fastly, Akamai, CloudFront
```

Use:

```text
major CDN providers
```

or:

```text
multiple CDN providers
```

## Acronyms

Expand acronyms on first use only, once per document.

Format:

```text
Extract, Transform, Load (ETL)
```

Then use the acronym afterward.

Do not expand commonly understood acronyms:

- URL
- JSON
- JSON-LD
- HTML
- XML
- CRUD
- REST
- API
- DOM
- AEM
- CDN
- SKU
- SEO
- GTIN
- ISO

## Promotional language

Avoid promotional adjectives or marketing-style claims.

Avoid:

- “comprehensive”
- “powerful”
- “seamless”
- “best-in-class”
- “high-performance” when used as marketing filler

Prefer descriptive, factual language focused on capabilities.

Example:

```text
The system stores provider credentials in an encrypted, write-only secrets store.
```

instead of:

```text
The system provides a comprehensive, powerful secrets solution.
```

## List formatting

Use colons in “Next steps” sections.

Good:

```md
## Next steps

- [Configure authentication](/auth): Set up API keys and access control
- [API reference](/api-reference): Review complete endpoint details
```

## Headline formatting

Use sentence case for all headings.

Good:

```md
## Your first product ingestion
```

Avoid title case:

```md
## Your First Product Ingestion
```

Do not use trailing colons in headings.

Avoid:

```md
## Configure product indexing:
```

## Link ordering

Order links from narrative to reference:

1. Narrative or tutorial
2. Configuration guide
3. Reference

Good:

```md
- [Getting started](/getting-started): Build your first integration
- [Schema reference](/schema-reference): Review product data fields
- [API reference](/api-reference): Complete endpoint details
```

## Accuracy

When documenting behavior:

- Verify against source code when possible.
- Use tests as supporting evidence when implementation details are unclear.
- Do not rely on proposals when code disagrees with them.
- If a proposal and code differ, document the code behavior.

## Public documentation checklist

Before considering a page complete:

- Technical behavior is verified against code.
- Examples use inline placeholders.
- Headings use sentence case.
- Public docs avoid internal infrastructure details.
- Links use narrative-to-reference ordering.
- Acronyms are expanded only when needed.
- Language is factual, not promotional.
