/**
 * Pure matching/highlighting helpers for the hero search typeahead.
 * Kept separate from hero.js so the scoring logic can be unit tested
 * without touching the DOM.
 */

/**
 * Splits a raw query into lowercase terms, dropping empty/1-char noise.
 * @param {string} query
 * @returns {string[]}
 */
export function toTerms(query) {
  return (query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

/**
 * Normalizes a query-index `tags` cell into a lowercase array. The indexer's
 * built-in `tags` property is documented to return an array, but sheet-backed
 * indexes can serialize multi-value cells as a single comma-separated string,
 * so both shapes are handled here.
 * @param {string[]|string} [tags]
 * @returns {string[]}
 */
export function toTagList(tags) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : String(tags).split(',');
  return list.map((t) => t.trim().toLowerCase()).filter(Boolean);
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escapes text for safe insertion via innerHTML.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/**
 * Escapes `text` and wraps every case-insensitive occurrence of any term
 * with <mark>. Output is always safe to insert via innerHTML, regardless
 * of what `text` contains.
 * @param {string} text
 * @param {string[]} terms
 * @returns {string}
 */
export function highlight(text, terms) {
  if (!text) return '';
  const matches = [];
  const lower = text.toLowerCase();
  terms.forEach((term) => {
    const offset = lower.indexOf(term);
    if (offset >= 0) matches.push({ offset, term });
  });
  if (!matches.length) return escapeHtml(text);

  matches.sort((a, b) => a.offset - b.offset);
  let out = escapeHtml(text.slice(0, matches[0].offset));
  matches.forEach((match, i) => {
    out += `<mark>${escapeHtml(text.slice(match.offset, match.offset + match.term.length))}</mark>`;
    const next = i === matches.length - 1 ? text.length : matches[i + 1].offset;
    out += escapeHtml(text.slice(match.offset + match.term.length, next));
  });
  return out;
}

/**
 * Ranks query-index rows against a query using five tiers, strongest first:
 * every term in the title, every term matched across the doc's tags, some
 * term in the title, some term matched across the doc's tags, some term in
 * the description. A full tag match (a deliberately curated signal) ranks
 * above a partial title match (which can be a single incidental shared
 * word); a partial tag match still ranks above the loosest signal,
 * description substring matches. Ties are broken by tier order; within a
 * tier, input order is kept.
 * @param {Array<{title?: string, description?: string, tags?: string[]|string, path: string}>} docs
 * @param {string} query
 * @param {number} limit
 * @returns {{ terms: string[], results: Array }}
 */
export function matchDocs(docs, query, limit = 6) {
  const terms = toTerms(query);
  if (!terms.length || !docs?.length) return { terms, results: [] };

  const seen = new Set();
  const tiers = [[], [], [], [], []];
  docs.forEach((doc) => {
    const title = (doc.title || '').toLowerCase();
    const description = (doc.description || '').toLowerCase();
    const tagList = toTagList(doc.tags);
    const hasTag = (term) => tagList.some((tag) => tag.includes(term));

    if (terms.every((t) => title.includes(t))) tiers[0].push(doc);
    else if (tagList.length && terms.every(hasTag)) tiers[1].push(doc);
    else if (terms.some((t) => title.includes(t))) tiers[2].push(doc);
    else if (tagList.length && terms.some(hasTag)) tiers[3].push(doc);
    else if (terms.some((t) => description.includes(t))) tiers[4].push(doc);
  });

  const results = [];
  tiers.flat().forEach((doc) => {
    if (seen.has(doc.path) || results.length >= limit) return;
    seen.add(doc.path);
    results.push({
      ...doc,
      titleHighlighted: highlight(doc.title || '', terms),
      descriptionHighlighted: highlight(doc.description || '', terms),
    });
  });

  return { terms, results };
}
