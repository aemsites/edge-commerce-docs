#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const DOC_PATH = path.join(ROOT, 'docs', 'schema-reference.md');
const API_REPO = process.env.HELIX_COMMERCE_API_PATH
  ?? path.resolve(ROOT, '..', 'helix-commerce-api');
const PRODUCT_BUS_SCHEMA_PATH = path.join(API_REPO, 'src', 'schemas', 'ProductBus.js');
const SHIPPING_SCHEMA_PATH = path.join(API_REPO, 'src', 'schemas', 'Shipping.js');

const CHECK = process.argv.includes('--check');

/**
 * Human-authored field descriptions keyed by schema name then field name.
 * The runtime schema carries types, enums, required flags, and constraints;
 * prose descriptions live here so they stay reviewable and stable.
 */
const DESCRIPTIONS = {
  ProductBusEntry: {
    sku: 'Unique product identifier.',
    path: 'Product URL path used for path-based storage.',
    urlKey: 'Human-readable product identifier for URL generation.',
    description: 'Full product description. HTML content is supported.',
    name: 'Display name for the product.',
    metaTitle: 'SEO title tag content.',
    metaDescription: 'SEO meta description.',
    gtin: 'Barcode or Global Trade Item Number.',
    url: 'Canonical product page URL. Used directly in sitemap output when present.',
    brand: 'Brand or manufacturer name.',
    type: 'Product type classification.',
    availability: 'Stock status using schema.org availability vocabulary.',
    availabilityDate: 'Date when product becomes available.',
    itemCondition: 'Product condition using schema.org item condition vocabulary.',
    metadata: 'Generic metadata map rendered as meta tags in HTML output.',
    options: 'Configurable product options, such as color or size.',
    aggregateRating: 'Product review and rating information.',
    specifications: 'Product specifications content.',
    images: 'Media gallery for product images and videos.',
    variants: 'Product variants for configurable products.',
    jsonld: 'Custom schema.org JSON-LD override. Replaces generated JSON-LD entirely.',
    custom: 'Custom data bag preserved in responses.',
    jsonldExtensions: 'Additional schema.org properties shallow-merged into generated Product JSON-LD.',
    shipping: 'Shipping information for merchant feed output.',
    bundleItems: 'Bundle composition entries for bundle products.',
    feeds: 'Feed configuration for product distribution.',
    weight: 'Product weight for JSON-LD structured data.',
    shippingDimensions: 'Product shipping dimensions emitted as Offer.shippingDetails in JSON-LD.',
    taxCode: 'Tax classification code.',
    taxData: 'Additional tax provider data.',
    country: 'Country code for country-scoped product data.',
    locale: 'Locale code for locale-scoped product data.',
  },
  ProductBusVariant: {
    sku: 'Unique variant identifier.',
    name: 'Display name for the variant.',
    price: 'Variant-specific pricing. Falls back to the parent product price when omitted.',
    url: 'Canonical variant page URL.',
    images: 'Media gallery for the variant.',
    gtin: 'Barcode or Global Trade Item Number for the variant.',
    description: 'Variant-specific description. HTML content is supported.',
    availability: 'Stock status using schema.org availability vocabulary.',
    options: 'Selected option values that identify this variant.',
    itemCondition: 'Variant condition using schema.org item condition vocabulary.',
    custom: 'Custom data bag for variant-specific data.',
    jsonldExtensions: 'Additional schema.org properties shallow-merged into this variant\'s Offer in generated JSON-LD.',
    weight: 'Variant weight for JSON-LD structured data.',
    shippingDimensions: 'Variant shipping dimensions. Inherits the parent product value when omitted.',
  },
  ProductBusPrice: {
    final: 'Final price the customer pays, as a decimal string.',
    currency: 'ISO 4217 currency code, e.g. "USD".',
    regular: 'Original price before any discount, as a decimal string.',
  },
  ProductBusWeight: {
    value: 'Numeric weight value.',
    unit: 'Weight unit. Maps to UN/CEFACT codes in JSON-LD output.',
  },
  ShippingDimensions: {
    weight: 'Package weight.',
    height: 'Package height.',
    width: 'Package width.',
    depth: 'Package depth.',
    dimensionsUnit: 'Unit for height, width, and depth. Maps to UN/CEFACT codes in JSON-LD output.',
  },
  ProductBusMedia: {
    url: 'Media URL (external or relative path after processing).',
    label: 'Label or alt text.',
    filename: 'Human-readable filename segment for the rendered media URL.',
    roles: 'Roles such as "thumbnail", "small", or "large".',
    video: 'Associated video URL.',
  },
  ProductBusOption: {
    id: 'Option identifier.',
    label: 'Display label.',
    position: 'Sort order.',
    values: 'Available option values.',
  },
  AggregateRating: {
    ratingValue: 'Average rating, e.g. "4.5".',
    reviewCount: 'Number of reviews, e.g. "127". Converts to an integer in JSON-LD.',
    bestRating: 'Maximum possible rating, e.g. "5".',
    worstRating: 'Minimum possible rating, e.g. "1".',
  },
};

const ENUM_DESCRIPTIONS = {
  SchemaOrgAvailability: {
    BackOrder: 'Product is available for order but currently out of stock.',
    Discontinued: 'Product is no longer being manufactured or sold.',
    InStock: 'Product is available for immediate purchase.',
    InStoreOnly: 'Product is only available for purchase in physical stores.',
    LimitedAvailability: 'Product has limited stock available.',
    MadeToOrder: 'Product is manufactured upon order placement.',
    OnlineOnly: 'Product is only available for online purchase.',
    OutOfStock: 'Product is temporarily out of stock.',
    PreOrder: 'Product can be ordered before official release.',
    PreSale: 'Product is available for pre-sale purchase.',
    Reserved: 'Product is reserved and not available for general purchase.',
    SoldOut: 'Product has sold out completely.',
  },
  SchemaOrgItemCondition: {
    DamagedCondition: 'Product has damage or defects.',
    NewCondition: 'Product is brand new and unused.',
    RefurbishedCondition: 'Product has been professionally restored to working condition.',
    UsedCondition: 'Product has been previously used.',
  },
};

/** Object-schema sections rendered as field tables, in document order. */
const FIELD_SECTIONS = [
  { key: 'product-bus-entry', name: 'ProductBusEntry' },
  { key: 'product-bus-variant', name: 'ProductBusVariant' },
  { key: 'product-bus-price', name: 'ProductBusPrice' },
  { key: 'product-bus-weight', name: 'ProductBusWeight' },
  { key: 'shipping-dimensions', name: 'ShippingDimensions' },
  { key: 'product-bus-media', name: 'ProductBusMedia' },
  { key: 'product-bus-option', name: 'ProductBusOption' },
  { key: 'aggregate-rating', name: 'AggregateRating' },
];

/** Enum sections rendered as value tables, in document order. */
const ENUM_SECTIONS = [
  { key: 'schema-org-availability', name: 'SchemaOrgAvailability' },
  { key: 'schema-org-item-condition', name: 'SchemaOrgItemCondition' },
];

function escapeCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');
}

function anchor(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function schemaType(schema, names) {
  if (Array.isArray(schema)) return schema.map((entry) => schemaType(entry, names)).join(' | ');
  if (!schema) return 'unknown';
  if (names.has(schema)) return `[${names.get(schema)}](#${anchor(names.get(schema))})`;
  if (schema.enum) return schema.enum.map((value) => `\`${value}\``).join(' | ');
  if (schema.type === 'array') return `${schemaType(schema.items, names)}[]`;
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    return `Record<string, ${schemaType(schema.additionalProperties, names)}>`;
  }
  if (schema.additionalProperties === true && schema.type === 'object') return 'Record<string, any>';
  return schema.type || 'unknown';
}

function constraints(schema) {
  const values = [];
  if (schema?.maxLength) values.push(`max length ${schema.maxLength}`);
  if (schema?.minLength) values.push(`min length ${schema.minLength}`);
  if (schema?.pattern) values.push('pattern constrained');
  if (schema?.['not.pattern']) values.push('excludes matching pattern');
  return values.join('; ');
}

function description(schema, fallback) {
  const parts = [];
  if (fallback) parts.push(fallback);
  else if (schema?.description) parts.push(schema.description);
  const rules = constraints(schema);
  if (rules) parts.push(rules);
  return parts.join(' ');
}

function renderFieldTable(name, schema, names) {
  const required = new Set(schema.required || []);
  const descriptions = DESCRIPTIONS[name] || {};
  const rows = Object.entries(schema.properties || {}).map(([field, fieldSchema]) => [
    `\`${field}\``,
    schemaType(fieldSchema, names),
    required.has(field) ? 'Yes' : 'No',
    description(fieldSchema, descriptions[field]),
  ]);

  return [
    '| Field | Type | Required | Description |',
    '|---|---|---|---|',
    ...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
  ].join('\n');
}

function renderEnumTable(name, schema) {
  const descriptions = ENUM_DESCRIPTIONS[name] || {};
  const rows = (schema.enum || []).map((value) => [
    `\`${value}\``,
    descriptions[value] || '',
  ]);

  return [
    '| Value | Description |',
    '|---|---|',
    ...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
  ].join('\n');
}

async function loadSchemas() {
  const productBus = await import(pathToFileURL(PRODUCT_BUS_SCHEMA_PATH));
  const shipping = await import(pathToFileURL(SHIPPING_SCHEMA_PATH));
  const entry = productBus.default;

  return {
    ProductBusEntry: entry,
    ProductBusVariant: productBus.ProductBusVariant,
    ProductBusPrice: productBus.ProductBusPrice,
    ProductBusWeight: shipping.ProductBusWeight,
    ShippingDimensions: shipping.ShippingDimensions,
    ProductBusMedia: entry.properties.images.items,
    ProductBusOption: entry.properties.options.items,
    AggregateRating: entry.properties.aggregateRating,
    SchemaOrgAvailability: entry.properties.availability,
    SchemaOrgItemCondition: entry.properties.itemCondition,
  };
}

function wrap(key, body) {
  return [
    `<!-- GENERATED: ${key}:start -->`,
    '<!-- This section is generated by `npm run docs:schema:generate`. Do not edit by hand. -->',
    '',
    body,
    '',
    `<!-- GENERATED: ${key}:end -->`,
  ].join('\n');
}

function replaceRegion(doc, key, generated) {
  const start = `<!-- GENERATED: ${key}:start -->`;
  const end = `<!-- GENERATED: ${key}:end -->`;
  if (!doc.includes(start) || !doc.includes(end)) {
    throw new Error(`Missing generated markers for "${key}" in ${DOC_PATH}`);
  }
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  return doc.replace(pattern, generated);
}

async function main() {
  const schemas = await loadSchemas();
  const names = new Map(Object.entries(schemas).map(([name, schema]) => [schema, name]));

  let doc = await readFile(DOC_PATH, 'utf8');

  for (const { key, name } of FIELD_SECTIONS) {
    doc = replaceRegion(doc, key, wrap(key, renderFieldTable(name, schemas[name], names)));
  }
  for (const { key, name } of ENUM_SECTIONS) {
    doc = replaceRegion(doc, key, wrap(key, renderEnumTable(name, schemas[name])));
  }

  const original = await readFile(DOC_PATH, 'utf8');

  if (CHECK) {
    if (doc !== original) {
      process.stderr.write('docs/schema-reference.md generated schema sections are out of date\n');
      process.exit(1);
    }
    process.stdout.write('docs/schema-reference.md generated schema sections are up to date\n');
    return;
  }

  await writeFile(DOC_PATH, doc);
  process.stdout.write('Updated docs/schema-reference.md generated schema sections\n');
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
