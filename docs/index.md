---
title: "Edge Commerce documentation"
description: "Everything you need to build on Edge Commerce, from your first product ingestion to rendering, indexing, checkout, and promotions."
daPath: "/"
status: migrated
managed: true
sourceFormat: markdown
---

<div class="hero">
<div>
<div>
<p><code>Documentation</code></p>
<h1>Edge Commerce</h1>
<p>Everything you need to build on Edge Commerce, from your first product ingestion to rendering, indexing, checkout, and promotions.</p>
<p><a href="/getting-started">Get started</a></p>
<p><a href="/api/get-config.html">API reference</a></p>
</div>
<div><img src="https://main--edge-commerce-docs--aemsites.aem.page/media_19545b8154be669cdc0c6fce225a73d7c01210009.jpg?width=2000&format=webply&optimize=medium" alt="Edge Commerce documentation illustration"></div>
</div>
</div>

## Core documentation

The four guides that explain how the system works end to end.

<div class="cards core">
<div>
<div>:explore:</div>
<div>
<h3><a href="/overview">Overview</a></h3>
<p>Edge Commerce architecture</p>
<ul><li>System architecture &amp; key components</li><li>Data flow explanation</li><li>Product data, Edge Commerce API, Pipeline, Indexer &amp; Network</li></ul>
</div>
</div>
<div>
<div>:rocket_launch:</div>
<div>
<h3><a href="/getting-started">Getting started</a></h3>
<p>Your first ingestion</p>
<ul><li>Prerequisites &amp; access setup</li><li>First product ingestion walkthrough</li><li>URL pattern, network routing &amp; indexing setup</li></ul>
</div>
</div>
<div>
<div>:api:</div>
<div>
<h3><a href="/api/get-config.html">API reference</a></h3>
<p>Edge Commerce API</p>
<ul><li>Path-based product storage &amp; CRUD</li><li>Complete endpoint documentation</li><li>Authentication, cache &amp; error formats</li></ul>
</div>
</div>
<div>
<div>:schema:</div>
<div>
<h3><a href="/schema-reference">Schema reference</a></h3>
<p>Product Bus schema</p>
<ul><li>ProductBusEntry &amp; ProductBusVariant</li><li>Price, Media, Option &amp; AggregateRating</li><li>Field descriptions, types &amp; validation rules</li></ul>
</div>
</div>
</div>

## Specialized guides

Focused, task-oriented guides for each part of the platform.

<div class="cards guides">
<div>
<div>:cloud_upload:</div>
<div>
<h3><a href="/data-ingestion">Data ingestion</a></h3>
<p>ETL process, common approaches and path-based storage considerations.</p>
<p><code>batch</code> <code>event</code> <code>hybrid</code></p>
</div>
</div>
<div>
<div>:web:</div>
<div>
<h3><a href="/rendering-guide">Rendering guide</a></h3>
<p>Five output formats, rendering locations and dual content sources.</p>
<p><code>HTML</code> <code>JSON-LD</code> <code>feeds</code></p>
</div>
</div>
<div>
<div>:search:</div>
<div>
<h3><a href="/indexing">Product indexing</a></h3>
<p>Index configuration, merchant feed generation and access patterns.</p>
<p><code>index</code> <code>feeds</code></p>
</div>
</div>
<div>
<div>:lan:</div>
<div>
<h3><a href="/network">AEM Network</a></h3>
<p>Pattern-based routing, backend config and performance optimizations.</p>
<p><code>glob</code> <code>routing</code></p>
</div>
</div>
<div>
<div>:sell:</div>
<div>
<h3><a href="/promotions">Promotions</a></h3>
<p>Catalog &amp; conditional promotions, cart rules, stacking and scoping.</p>
<p><code>price</code> <code>cart</code></p>
</div>
</div>
<div>
<div>:confirmation_number:</div>
<div>
<h3><a href="/coupons">Coupons</a></h3>
<p>Coupon types &amp; codes, batch generation, validation and usage tracking.</p>
<p><code>codes</code> <code>rules</code></p>
</div>
</div>
<div>
<div>:shopping_cart:</div>
<div>
<h3><a href="/orders/lifecycle">Orders</a></h3>
<p>Order preview, creation, customer data, address validation, payment state and journals.</p>
<p><code>orders</code> <code>customers</code> <code>places</code></p>
</div>
</div>
<div>
<div>:credit_card:</div>
<div>
<h3><a href="/checkout/overview">Checkout</a></h3>
<p>Payment, fraud, tax &amp; identity providers, and the encrypted secrets store.</p>
<p><code>payments</code> <code>fraud</code> <code>tax</code></p>
</div>
</div>
<div>
<div>:tune:</div>
<div>
<h3><a href="/configuration/site">Site configuration</a></h3>
<p>Allowed origins, auth, reCAPTCHA, email branding and friendly order IDs.</p>
<p><code>config</code> <code>auth</code> <code>email</code></p>
</div>
</div>
<div>
<div>:shield:</div>
<div>
<h3><a href="/authentication/overview">Authentication &amp; access</a></h3>
<p>Bearer tokens, roles, permissions and scoped service tokens.</p>
<p><code>auth</code> <code>roles</code> <code>tokens</code></p>
</div>
</div>
</div>

## Operations &amp; best practices

<div class="link-list">
<div><div><h3>:tune: Operations &amp; best practices</h3></div></div>
<div><div><a href="/limits">Limits &amp; guidance</a>: Bulk operation &amp; data limits</div></div>
<div><div><a href="/multi-store">Multi-store</a>: Store &amp; locale structure</div></div>
<div><div><a href="/caching">Caching strategy</a>: TTLs &amp; push invalidation</div></div>
<div><div><a href="/image-processing">Image processing</a>: How images are fetched</div></div>
<div><div><a href="/orders/lifecycle">Order lifecycle</a>: Preview, payment state &amp; journals</div></div>
<div><div><a href="/estimates">Estimates and cart totals</a>: Tax, shipping, coupons &amp; totals</div></div>
<div><div><a href="/orders/journal">Order journal</a>: Event history &amp; troubleshooting</div></div>
<div><div><a href="/customers">Customers</a>: Profiles, addresses &amp; customer orders</div></div>
<div><div><a href="/places">Places and address validation</a>: Autocomplete, details &amp; validation</div></div>
<div><div><a href="/emails">Transactional email</a>: OTP, order confirmation &amp; templates</div></div>
<div><div><a href="/configuration/site">Site configuration</a>: Allowed origins, auth &amp; email settings</div></div>
<div><div><a href="/authentication/overview">Authentication &amp; access</a>: Tokens, roles &amp; permissions</div></div>
<div><div><a href="/security">Security</a>: Token management &amp; data validation</div></div>
<div><div><a href="/custom-data">Custom data</a>: Extending with custom fields</div></div>
</div>

## How it fits together

Product data flows from your sources into the product data store, then out to search and delivery.

<div class="flow">
<div><div>:storage:</div><div>Sources</div><div>Catalog &amp; commerce data</div></div>
<div><div>:bolt:</div><div>Product Pipeline</div><div>ETL ingestion</div></div>
<div><div>:hub:</div><div><strong>Product data</strong></div><div>Path-based storage</div></div>
<div><div>:search:</div><div>Indexer</div><div>Search &amp; feeds</div></div>
<div><div>:alt_route:</div><div>AEM Network</div><div>URL routing</div></div>
<div><div>:public:</div><div>Delivery</div><div>HTML · JSON · feeds</div></div>
</div>

## Reading paths

Suggested reading order depending on what you're building.

<div class="cards paths">
<div>
<div>:person:</div>
<div>
<h3>First-time users</h3>
<ol><li><a href="/overview">Overview</a>: Ecosystem &amp; architecture</li><li><a href="/getting-started">Getting started</a>: Set up your first product</li><li><a href="/schema-reference">Schema reference</a>: Learn the data structure</li><li><a href="/api/get-config.html">API reference</a>: Explore operations</li></ol>
</div>
</div>
<div>
<div>:database:</div>
<div>
<h3>Building ETL</h3>
<ol><li><a href="/data-ingestion">Data ingestion</a>: Process &amp; considerations</li><li><a href="/schema-reference">Schema reference</a>: Required data structures</li><li><a href="/api/get-config.html">API reference</a>: Endpoints for loading</li><li><a href="/limits">Limits &amp; guidance</a>: Bulk operation limits</li></ol>
</div>
</div>
<div>
<div>:design_services:</div>
<div>
<h3>Frontend developers</h3>
<ol><li><a href="/rendering-guide">Rendering guide</a>: How products render</li><li><a href="/orders/lifecycle">Order lifecycle</a>: Checkout flow</li><li><a href="/places">Places and address validation</a>: Address entry</li><li><a href="/estimates">Estimates and cart totals</a>: Checkout totals</li><li><a href="/customers">Customers</a>: Account data</li><li><a href="/emails">Transactional email</a>: OTP and order email</li><li><a href="/indexing">Product indexing</a>: Search and catalog data</li><li><a href="/schema-reference">Schema reference</a>: Available product fields</li><li><a href="/network">Network configuration</a>: URL routing</li></ol>
</div>
</div>
<div>
<div>:shield:</div>
<div>
<h3>System administrators</h3>
<ol><li><a href="/overview">Overview</a>: System architecture</li><li><a href="/authentication/overview">Authentication &amp; access</a>: Tokens, roles &amp; permissions</li><li><a href="/network">Network configuration</a>: Traffic routing</li><li><a href="/security">Security</a>: Token management &amp; validation</li></ol>
</div>
</div>
</div>
