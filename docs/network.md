---
title: "AEM Edge Network"
description: "Configure AEM Network routing for Edge Delivery Commerce sites."
daPath: "/network"
status: "migrated"
managed: "true"
sourceFormat: "markdown"
sources:
  helix-commerce-api:
    version: "2.52.2"
    lastReviewedCommit: "b5639ec5767e8cb3ea0f9683dd3b895f84363f60"
    lastContentCommit: "8af300d"
  helix-mixer:
    version: "v1.6.1"
    lastReviewedCommit: "b8acff4"
    lastContentCommit: "b8acff4"
  helix-product-pipeline:
    version: "v2.4.0"
    lastReviewedCommit: "5f3de79"
    lastContentCommit: "5f3de79"
  helix-product-indexer:
    version: "v2.0.1"
    lastReviewedCommit: "7f3fc84"
    lastContentCommit: "7f3fc84"
  helix-product-indexer-pump:
    version: "v2.0.1"
    lastReviewedCommit: "b745180"
    lastContentCommit: "b745180"
  helix-product-shared:
    version: "v1.5.3"
    lastReviewedCommit: "6ea43b0"
    lastContentCommit: "6ea43b0"
  helix-product-image-collector:
    version: "v2.0.1"
    lastReviewedCommit: "853fc30"
    lastContentCommit: "853fc30"
migration:
  from: "helix-commerce-documentation/documentation/network.md"
  migratedAt: "2026-06-15"
  notes: "Migrated as-is from the legacy documentation repo; source commits retain the original frontmatter baseline."
---

# AEM Edge Network

## Overview

The AEM Edge Network is a reverse proxy service running at the edge that acts as a traffic router for AEM's Edge Delivery Services and other backends, allowing you to combine multiple backends into a single entry point. It is the `aem.network` to Edge Delivery's `aem.live`. AEM Network is based on a declarative configuration, so that routes and URL patterns can be updated without deployment.

There are two configurable concepts in AEM Network:

1. Patterns: describe the traffic patterns that incoming requests match against
2. Backends: define the destinations for requests that match specific patterns

## Pattern-based routing

Every incoming request is matched against a path pattern. The pattern matching is based on the specificity of the pattern (longest pattern first). More specific patterns override general ones.

Pattern matching uses a glob syntax to evaluate requests and following expressions are supported:

- `*` - Matches any characters in a single path segment
- `**` - Matches any characters across multiple path segments
- `default` - Fallback when no pattern matches

In the JSON configuration, each pattern is a key, and the corresponding value will be the name of the backend to route the request to. This allows you to use the same backend for multiple patterns.

A special `default` pattern is used as a fallback when no other pattern matches. If no `default` pattern is defined, the request will be routed to the corresponding `aem.live` backend.

### Example configuration
```json
{
  "public": {
    "mixerConfig": {
      "patterns": {
        "/cart/checkout/**": "commerce-backend",
        "/blog/**": "wordpress-backend",
        "/products/**": "pipeline-backend",
        "default": "edge-delivery"
      },
      "backends": {
        "commerce-backend": {
          "origin": "commerce.example.com",
          "protocol": "https"
        },
        "wordpress-backend": {
          "origin": "legacy-blog.example.com",
          "pathPrefix": "/blog"
        },
        "pipeline-backend": {
          "origin": "pipeline-cloudflare.adobecommerce.live",
          "pathPrefix": "/acme/commerce-site/main/"
        },
        "edge-delivery": {
          "origin": "main--mysite--acme.aem.live"
        }
      },
      "inlineNav": true,
      "inlineFooter": true
    }
  }
}
```

## Backend configuration

Each backend is defined with the following properties:

- `origin` (required): Hostname or full URL of the backend service
- `protocol` (optional): `http` or `https` (defaults to `https`)
- `pathPrefix` (optional): Base path prepended to all requests
- `path` (optional): Complete path override (replaces incoming path)

## How AEM Network works

AEM Network runs at the edge for global low-latency access. It processes requests near users, ensuring fast response times. It provides high availability with multiple edge locations worldwide, ensuring reliable performance and supports the same multi-CDN infrastructure as `aem.live`.

For every `*.aem.live` domain, there is a corresponding `*.aem.network` domain powered by AEM Network. Without any configuration, it will simply forward requests to the `*.aem.live` domain.

## Experimental features

AEM Network offers an experimental feature for resource inlining, which can be configured as follows:

```json
{
  "inlineNav": true,
  "inlineFooter": true
}
```

Under some conditions, resource inlining is claimed to improve performance. If you want to enable resource inlining, please contact Adobe, so that we can compare before and after performance metrics. Note that resource inlining is experimental and support may be removed.

### Zero-deployment configuration

To apply configuration changes to your AEM site, update the `public` configuration in your AEM Live site configuration. Changes apply on the next request, typically within 60 seconds. There is no downtime and no separate deployment pipeline needed, but all configuration can be performed programmatically. Configuration changes can be rolled back by reverting the configuration to an earlier, working version.


#### Update network configuration via API

Use the `admin.hlx.page` API to programmatically update your network configuration against the `https://admin.hlx.page/config/{org}/{site}/public.json` [endpoint with a POST request](https://main--helix-website--adobe.aem.live/docs/admin.html#tag/siteConfig/operation/updateConfigSite). You must provide a valid [admin token](https://main--helix-website--adobe.aem.live/docs/admin.html#tag/authentication) in the `authorization` header.

Attention: the configuration API updates the full configuration, so if you have an existing configuration, you must include it in your request, otherwise it will be overwritten. The example below uses a minimal configuration.

```bash
curl -X POST "https://admin.hlx.page/config/{org}/{site}/public.json" \
  -H "authorization: token {your-admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "mixerConfig": {
      "patterns": {
        "/products/**": "pipeline-backend",
        "/api/catalog/**": "commerce-backend",
        "default": "main-backend"
      },
      "backends": {
        "pipeline-backend": {
          "origin": "main--mysite--acme.aem.live"
        },
        "commerce-backend": {
          "origin": "api.adobecommerce.live",
          "protocol": "https"
        },
        "main-backend": {
          "origin": "main--mysite--acme.aem.live"
        }
      },
      "inlineNav": true,
      "inlineFooter": true
    }
  }'
```

The request will confirm a successful update with a status code of 200 and response body containing the full configuration object. See the full [API documentation](https://main--helix-website--adobe.aem.live/docs/admin.html#tag/siteConfig/operation/updateConfigSite) for other status codes and response details.

## Common use cases

AEM Network has been used for following common scenarios: e-commerce integration, microservices architecture, and multi-region content.

### 1. E-commerce integration
Route product pages and checkout to commerce platform, keep marketing content on AEM:
```text
/products/**     → Product Pipeline Backend
/checkout/**     → Commerce Backend
/cart/**         → Commerce Backend
/blog/**         → AEM Live
default          → AEM Live
```

Note that Commerce backend support is still in development.

### 2. Microservices architecture
Combine multiple microservices under a single domain:
```text
/api/products/**   → Product Pipeline
/api/users/**      → User Service
/api/orders/**     → Order Service
default            → Edge Delivery Site
```

### 3. Multi-region content
Route to different backends based on geographic structure:
```text
/us/**             → US Content Origin
/eu/**             → EU Content Origin
/asia/**           → Asia Content Origin
```

## URL structure

All `aem.network` requests follow this pattern:
```text
https://{ref}--{site}--{org}.aem.network/{path}
```

- `{ref}`: Branch/environment (e.g., `main`, `preview`, `staging`)
- `{site}`: Your site identifier
- `{org}`: Your organization identifier
- `{path}`: The request path to be routed

```text
https://main--mystore--acme.aem.network/products/mens-shoes
        └──┘  └─────┘  └──┘
         ref    site   org
```

## Using AEM Network with your CDN


AEM Network [supports the same Content Delivery Network (CDN) options as Edge Delivery Services](https://main--helix-website--adobe.aem.live/docs/byo-cdn-setup). Push invalidation is handled transparently.

When [setting up your CDN](https://main--helix-website--adobe.aem.live/docs/byo-cdn-setup#vendor-specific-setup-instructions), replace `aem.live` with `aem.network` in your backend or origin configuration.

## Production readiness note

AEM Network is used in production for sites with millions of page views, but custom configurations not applied by the AEM engineering team should be validated thoroughly before production use. Configuration changes have the potential to impact live traffic and should be thoroughly tested in a staging environment before deployment.

For assistance with custom routing configurations, consult with the Adobe team.

## Next steps

- [Getting Started](/getting-started#step-1-configure-url-patterns-and-routing): Step-by-step guide for configuring network routing with Product Pipeline
- [Rendering Guide](/rendering-guide#url-pattern-configuration): Learn how network and pipeline work together to render products
- [Security best practices](/security): API key management and data validation
