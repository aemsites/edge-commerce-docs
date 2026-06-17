---
title: "Product Bus Documentation"
description: "Everything you need to build on the Helix Commerce ecosystem — from your first product ingestion to advanced rendering, indexing, and promotions."
daPath: "/"
status: migrated
managed: true
sourceFormat: markdown
---

<div class="hero">
<div>
<div>
<p><code>Documentation</code></p>
<h1>Product Bus Documentation</h1>
<p>Everything you need to build on the Helix Commerce ecosystem — from your first product ingestion to advanced rendering, indexing, and promotions.</p>
<p><a href="/getting-started">Get started</a></p>
<p><a href="/api/get-config.html">API reference</a></p>
</div>
<div></div>
</div>
</div>

## Core documentation

The four guides that explain how the system works end to end.

<div class="cards core">
<div>
<div><span class="icon icon-explore"></span></div>
<div>
<h3><a href="/overview">Overview</a></h3>
<p>Edge Delivery Commerce</p>
<ul><li>System architecture &amp; key components</li><li>Data flow explanation</li><li>Product Bus, Commerce API, Pipeline, Indexer &amp; Mixer</li></ul>
</div>
</div>
<div>
<div><span class="icon icon-rocket_launch"></span></div>
<div>
<h3><a href="/getting-started">Getting started</a></h3>
<p>Your first ingestion</p>
<ul><li>Prerequisites &amp; obtaining an API key</li><li>First product ingestion — 4-step walkthrough</li><li>URL pattern, mixer config &amp; indexing setup</li></ul>
</div>
</div>
<div>
<div><span class="icon icon-api"></span></div>
<div>
<h3><a href="/api/get-config.html">API reference</a></h3>
<p>Product Bus API</p>
<ul><li>Path-based product storage &amp; CRUD</li><li>Complete endpoint documentation</li><li>Authentication, cache &amp; error formats</li></ul>
</div>
</div>
<div>
<div><span class="icon icon-schema"></span></div>
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
<div><span class="icon icon-cloud_upload"></span></div>
<div>
<h3><a href="/data-ingestion">Data ingestion</a></h3>
<p>ETL process, common approaches and path-based storage considerations.</p>
<p><code>batch</code> <code>event</code> <code>hybrid</code></p>
</div>
</div>
<div>
<div><span class="icon icon-web"></span></div>
<div>
<h3><a href="/rendering-guide">Rendering guide</a></h3>
<p>Five output formats, rendering locations and dual content sources.</p>
<p><code>HTML</code> <code>JSON-LD</code> <code>feeds</code></p>
</div>
</div>
<div>
<div><span class="icon icon-search"></span></div>
<div>
<h3><a href="/indexing">Product indexing</a></h3>
<p>Index configuration, merchant feed generation and access patterns.</p>
<p><code>index</code> <code>feeds</code></p>
</div>
</div>
<div>
<div><span class="icon icon-lan"></span></div>
<div>
<h3><a href="/network">AEM Network</a></h3>
<p>Pattern-based routing, backend config and performance optimizations.</p>
<p><code>glob</code> <code>routing</code></p>
</div>
</div>
<div>
<div><span class="icon icon-sell"></span></div>
<div>
<h3><a href="/promotions">Promotions</a></h3>
<p>Catalog &amp; conditional promotions, cart rules, stacking and scoping.</p>
<p><code>price</code> <code>cart</code></p>
</div>
</div>
<div>
<div><span class="icon icon-confirmation_number"></span></div>
<div>
<h3><a href="/coupons">Coupons</a></h3>
<p>Coupon types &amp; codes, batch generation, validation and usage tracking.</p>
<p><code>codes</code> <code>rules</code></p>
</div>
</div>
</div>

## Operations &amp; best practices

<div class="link-list">
<div><div><h3><span class="icon icon-tune"></span> Operations &amp; best practices</h3></div></div>
<div><div><a href="/limits">Limits &amp; guidance</a> — Bulk operation &amp; data limits</div></div>
<div><div><a href="/multi-store">Multi-store</a> — Store &amp; locale structure</div></div>
<div><div><a href="/caching">Caching strategy</a> — TTLs &amp; push invalidation</div></div>
<div><div><a href="/image-processing">Image processing</a> — How images are fetched</div></div>
<div><div><a href="/security">Security</a> — API keys &amp; data validation</div></div>
<div><div><a href="/custom-data">Custom data</a> — Extending with custom fields</div></div>
</div>

## How it fits together

Product data flows from your sources through the pipeline into the Product Bus, then out to search and delivery.

<div class="flow">
<div><div><span class="icon icon-storage"></span></div><div>Sources</div><div>Catalog &amp; commerce data</div></div>
<div><div><span class="icon icon-bolt"></span></div><div>Product Pipeline</div><div>ETL ingestion</div></div>
<div><div><span class="icon icon-hub"></span></div><div><strong>Product Bus</strong></div><div>Path-based storage</div></div>
<div><div><span class="icon icon-search"></span></div><div>Indexer</div><div>Search &amp; feeds</div></div>
<div><div><span class="icon icon-alt_route"></span></div><div>Helix Mixer</div><div>URL routing</div></div>
<div><div><span class="icon icon-public"></span></div><div>Delivery</div><div>HTML · JSON · feeds</div></div>
</div>

## Reading paths

Suggested reading order depending on what you're building.

<div class="cards paths">
<div>
<div><span class="icon icon-person"></span></div>
<div>
<h3>First-time users</h3>
<ol><li><a href="/overview">Overview</a> — ecosystem &amp; architecture</li><li><a href="/getting-started">Getting started</a> — set up your first product</li><li><a href="/schema-reference">Schema reference</a> — learn the data structure</li><li><a href="/api/get-config.html">API reference</a> — explore operations</li></ol>
</div>
</div>
<div>
<div><span class="icon icon-database"></span></div>
<div>
<h3>Building ETL</h3>
<ol><li><a href="/data-ingestion">Data ingestion</a> — process &amp; considerations</li><li><a href="/schema-reference">Schema reference</a> — required data structures</li><li><a href="/api/get-config.html">API reference</a> — endpoints for loading</li><li><a href="/limits">Limits &amp; guidance</a> — bulk operation limits</li></ol>
</div>
</div>
<div>
<div><span class="icon icon-design_services"></span></div>
<div>
<h3>Frontend developers</h3>
<ol><li><a href="/rendering-guide">Rendering guide</a> — how products render</li><li><a href="/indexing">Product indexing</a> — search &amp; catalog data</li><li><a href="/schema-reference">Schema reference</a> — available product fields</li><li><a href="/network">Mixer configuration</a> — URL routing</li></ol>
</div>
</div>
<div>
<div><span class="icon icon-shield"></span></div>
<div>
<h3>System administrators</h3>
<ol><li><a href="/overview">Overview</a> — system architecture</li><li><a href="/network">Mixer configuration</a> — traffic routing</li><li><a href="/caching">Caching strategy</a> — invalidation &amp; TTLs</li><li><a href="/security">Security</a> — API keys &amp; validation</li></ol>
</div>
</div>
</div>

## Additional resources

<div class="cards resources">
<div>
<div>
<h3><span class="icon icon-menu_book"></span> Documentation</h3>
<p><a href="https://github.com/adobe-rnd/helix-commerce-api">Helix Commerce API README</a></p>
<p><a href="https://github.com/adobe-rnd/helix-product-pipeline">Product Pipeline README</a></p>
<p><a href="https://github.com/adobe-rnd/helix-mixer">Helix Mixer README</a></p>
</div>
</div>
<div>
<div>
<h3><span class="icon icon-terminal"></span> Repositories</h3>
<p><a href="https://github.com/adobe-rnd/helix-commerce-api"><code>helix-commerce-api</code></a></p>
<p><a href="https://github.com/adobe-rnd/helix-product-pipeline"><code>helix-product-pipeline</code></a></p>
<p><a href="https://github.com/adobe-rnd/helix-mixer"><code>helix-mixer</code></a></p>
</div>
</div>
<div>
<div>
<h3><span class="icon icon-forum"></span> Support</h3>
<p><strong>Issues</strong> — submit to the GitHub repos</p>
<p><strong>Adobe team</strong> — reach out on Slack</p>
<p><strong>Community</strong> — Edge Delivery channels</p>
</div>
</div>
</div>
