import { matchDocs } from './search-match.js';

/**
 * Shared docs-search typeahead widget. Fetches the docs query-index once,
 * ranks matches via matchDocs() (title, tags, description), and renders a
 * results dropdown. Used by both the hero block (prominent, homepage-only)
 * and the header block (compact, every page) so the fetch/debounce/ranking
 * logic isn't duplicated — each caller supplies its own `classPrefix` so its
 * own stylesheet controls the look.
 */

const INDEX_PATH = '/query-index-docs.json';
const DEBOUNCE_MS = 200;

let docsPromise;

/** Fetches the docs query-index once and caches the promise for reuse. */
function loadDocs() {
  docsPromise ??= fetch(INDEX_PATH)
    .then((res) => (res.ok ? res.json() : { data: [] }))
    .then((json) => json.data || [])
    .catch(() => []);
  return docsPromise;
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Builds a self-contained docs search widget (input + typeahead results
 * list) and returns its root element. Every generated class is
 * `${classPrefix}`, `${classPrefix}-form`, `${classPrefix}-input`, etc., so
 * the caller's own block stylesheet owns the visual style.
 *
 * @param {object} [opts]
 * @param {string} [opts.classPrefix] CSS class prefix for every element.
 * @param {string} [opts.placeholder] Input placeholder / aria-label text.
 * @param {number} [opts.resultLimit] Max results shown.
 * @param {boolean} [opts.globalShortcut] Bind Cmd/Ctrl+K globally to focus
 *   this instance's input. Only one widget per page should set this — if a
 *   page renders two widgets (e.g. hero + header on the homepage), only the
 *   one meant to be "the" site-wide search should opt in.
 * @returns {HTMLElement} the widget's root element, ready to append anywhere.
 */
export function buildDocSearch({
  classPrefix = 'doc-search',
  placeholder = 'Search the documentation',
  resultLimit = 6,
  globalShortcut = false,
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = classPrefix;

  const form = document.createElement('form');
  form.className = `${classPrefix}-form`;
  form.setAttribute('role', 'search');

  const input = document.createElement('input');
  input.type = 'search';
  input.className = `${classPrefix}-input`;
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  input.autocomplete = 'off';

  form.append(input);

  if (globalShortcut) {
    const kbd = document.createElement('kbd');
    kbd.textContent = '⌘K';
    form.append(kbd);
  }

  const results = document.createElement('ul');
  results.className = `${classPrefix}-results`;
  results.hidden = true;

  wrapper.append(form, results);

  function closeResults() {
    results.hidden = true;
  }

  function renderResults(terms, matches) {
    results.innerHTML = '';

    if (!terms.length) {
      results.hidden = true;
      return;
    }

    if (!matches.length) {
      const li = document.createElement('li');
      li.className = `${classPrefix}-empty`;
      li.textContent = 'No matches. Try different terms.';
      results.append(li);
      results.hidden = false;
      return;
    }

    matches.forEach((result) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = result.path;
      const title = document.createElement('span');
      title.className = `${classPrefix}-result-title`;
      // titleHighlighted is HTML-escaped by matchDocs()/highlight(); safe to insert.
      title.innerHTML = result.titleHighlighted || result.path;
      a.append(title);
      if (result.descriptionHighlighted) {
        const desc = document.createElement('span');
        desc.className = `${classPrefix}-result-desc`;
        desc.innerHTML = result.descriptionHighlighted;
        a.append(desc);
      }
      li.append(a);
      results.append(li);
    });
    results.hidden = false;
  }

  const runSearch = debounce(async () => {
    const query = input.value;
    if (!query.trim()) {
      closeResults();
      return;
    }
    const docs = await loadDocs();
    const { terms, results: matches } = matchDocs(docs, query, resultLimit);
    renderResults(terms, matches);
  }, DEBOUNCE_MS);

  input.addEventListener('focus', () => { loadDocs(); });
  input.addEventListener('input', runSearch);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && !results.hidden) {
      const first = results.querySelector('a');
      if (first) {
        e.preventDefault();
        first.focus();
      }
    }
    if (e.key === 'Escape') closeResults();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const top = results.querySelector('a');
    if (top) window.location.href = top.getAttribute('href');
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) closeResults();
  });

  if (globalShortcut) {
    document.addEventListener('keydown', (e) => {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isShortcut) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  return wrapper;
}
