import { expect } from '@esm-bundle/chai';
import { toTerms, toTagList, highlight, matchDocs } from '../../blocks/hero/search-match.js';

describe('toTerms', () => {
  it('lowercases, splits and drops 1-char/empty tokens', () => {
    expect(toTerms('  Product  Bus a  ')).to.deep.equal(['product', 'bus']);
  });

  it('returns an empty array for an empty query', () => {
    expect(toTerms('')).to.deep.equal([]);
    expect(toTerms(undefined)).to.deep.equal([]);
  });
});

describe('toTagList', () => {
  it('lowercases and trims an array of tags', () => {
    expect(toTagList([' Webhooks ', 'JWT'])).to.deep.equal(['webhooks', 'jwt']);
  });

  it('splits a comma-separated string into a lowercase array', () => {
    expect(toTagList('Idempotency, Webhooks , jwt')).to.deep.equal(['idempotency', 'webhooks', 'jwt']);
  });

  it('returns an empty array for missing/empty tags', () => {
    expect(toTagList(undefined)).to.deep.equal([]);
    expect(toTagList('')).to.deep.equal([]);
    expect(toTagList([])).to.deep.equal([]);
  });
});

describe('highlight', () => {
  it('wraps a single match in <mark>', () => {
    expect(highlight('Getting started', ['started'])).to.equal('Getting <mark>started</mark>');
  });

  it('wraps multiple non-overlapping matches', () => {
    expect(highlight('Product indexing guide', ['product', 'guide']))
      .to.equal('<mark>Product</mark> indexing <mark>guide</mark>');
  });

  it('returns the original text untouched when nothing matches', () => {
    expect(highlight('Checkout overview', ['payments'])).to.equal('Checkout overview');
  });

  it('returns an empty string for empty/undefined text', () => {
    expect(highlight('', ['x'])).to.equal('');
    expect(highlight(undefined, ['x'])).to.equal('');
  });

  it('HTML-escapes the source text so it is safe to insert via innerHTML', () => {
    expect(highlight('A & B <script>', ['script']))
      .to.equal('A &amp; B &lt;<mark>script</mark>&gt;');
    expect(highlight('A & B', ['nomatch'])).to.equal('A &amp; B');
  });
});

describe('matchDocs', () => {
  const docs = [
    { title: 'Getting started', description: 'Your first ingestion', path: '/getting-started' },
    { title: 'Product catalog modeling', description: 'ProductBusEntry fields', path: '/product-catalog-modeling' },
    { title: 'Payments', description: 'Payment, fraud & tax providers', path: '/checkout/payments' },
    { title: 'Order lifecycle', description: 'Preview, creation and payment state', path: '/orders/lifecycle' },
  ];

  it('returns no results for an empty query', () => {
    expect(matchDocs(docs, '')).to.deep.equal({ terms: [], results: [] });
  });

  it('returns no results when there are no docs', () => {
    expect(matchDocs([], 'payments').results).to.deep.equal([]);
  });

  it('ranks a full title match above a partial title match', () => {
    const { results } = matchDocs(docs, 'product catalog');
    expect(results[0].path).to.equal('/product-catalog-modeling');
  });

  it('ranks a title match above a description-only match', () => {
    const { results } = matchDocs(docs, 'payment');
    // "Payments" matches by title; "Order lifecycle" only matches by description.
    expect(results[0].path).to.equal('/checkout/payments');
    expect(results[1].path).to.equal('/orders/lifecycle');
  });

  it('falls back to a description match when no title matches', () => {
    const { results } = matchDocs(docs, 'ingestion');
    expect(results).to.have.lengthOf(1);
    expect(results[0].path).to.equal('/getting-started');
  });

  it('excludes docs matching none of the terms', () => {
    const { results } = matchDocs(docs, 'nonexistentterm');
    expect(results).to.deep.equal([]);
  });

  it('caps results at the given limit', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      title: `Payments guide ${i}`,
      description: '',
      path: `/payments-${i}`,
    }));
    const { results } = matchDocs(many, 'payments', 3);
    expect(results).to.have.lengthOf(3);
  });

  it('ranks a full tag match above a partial title match', () => {
    const withTags = [
      { title: 'Order lifecycle', description: '', path: '/orders/lifecycle', tags: 'idempotency, safeguards' },
      { title: 'Order journal', description: '', path: '/orders/journal', tags: '' },
    ];
    // "idempotency" isn't in either title, but only appears (fully) as a tag on the first doc.
    // "order" partially matches both titles, so without tag-awareness they'd tie on title alone.
    const { results } = matchDocs(withTags, 'idempotency order');
    expect(results[0].path).to.equal('/orders/lifecycle');
  });

  it('ranks a partial tag match above a description-only match', () => {
    const withTags = [
      { title: 'Payments overview', description: 'no relevant words here', path: '/payments', tags: 'webhooks, idempotency' },
      { title: 'Getting started', description: 'covers webhooks briefly', path: '/getting-started', tags: '' },
    ];
    const { results } = matchDocs(withTags, 'webhooks');
    expect(results[0].path).to.equal('/payments');
    expect(results[1].path).to.equal('/getting-started');
  });

  it('accepts tags as an array (the indexer\'s documented shape), not just a string', () => {
    const withTags = [
      { title: 'Payments overview', description: '', path: '/payments', tags: ['webhooks', 'idempotency'] },
    ];
    const { results } = matchDocs(withTags, 'webhooks');
    expect(results).to.have.lengthOf(1);
  });

  it('does not throw and ranks normally for docs with no tags field', () => {
    const { results } = matchDocs(docs, 'payment');
    expect(results[0].path).to.equal('/checkout/payments');
  });

  it('does not include a matchedTags field on results — tags only affect ranking', () => {
    const withTags = [
      { title: 'Payments overview', description: '', path: '/payments', tags: 'webhooks' },
    ];
    const { results } = matchDocs(withTags, 'webhooks');
    expect(results[0]).to.not.have.property('matchedTags');
  });

  it('attaches highlighted title/description to each result', () => {
    const { results } = matchDocs(docs, 'payment');
    expect(results[0].titleHighlighted).to.equal('<mark>Payment</mark>s');
    expect(results[0].descriptionHighlighted).to.equal('<mark>Payment</mark>, fraud &amp; tax providers');
  });
});
