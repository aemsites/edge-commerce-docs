import { matchDocs } from './search-match.js';

/**
 * Hero block — eyebrow, title, intro, CTAs (+ inline docs search) on the
 * left, an illustration on the right.
 *
 * Content model (block table, 2 columns):
 *   | Hero | |
 *   | ---- | --- |
 *   | `Documentation` ### Title \n intro \n [Primary](/x) [Secondary](/y) | ![art](/img/..) |
 *
 * The copy cell holds: an optional eyebrow (inline code or emphasis as the
 * first node), a heading, an intro paragraph, and one or more links. The art
 * cell holds an image (optional).
 */

const INDEX_PATH = '/query-index-docs.json';
const RESULT_LIMIT = 6;
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

function renderResults(list, terms, results) {
  list.innerHTML = '';

  if (!terms.length) {
    list.hidden = true;
    return;
  }

  if (!results.length) {
    const li = document.createElement('li');
    li.className = 'hero-search-empty';
    li.textContent = 'No matches. Try different terms.';
    list.append(li);
    list.hidden = false;
    return;
  }

  results.forEach((result) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = result.path;
    const title = document.createElement('span');
    title.className = 'hero-search-result-title';
    // titleHighlighted is HTML-escaped by matchDocs()/highlight(); safe to insert.
    title.innerHTML = result.titleHighlighted || result.path;
    a.append(title);
    if (result.descriptionHighlighted) {
      const desc = document.createElement('span');
      desc.className = 'hero-search-result-desc';
      desc.innerHTML = result.descriptionHighlighted;
      a.append(desc);
    }
    li.append(a);
    list.append(li);
  });
  list.hidden = false;
}

function closeResults(list) {
  list.hidden = true;
}

/** Builds the inline typeahead search box and appends it to `copy`. */
function buildSearch(copy) {
  const wrapper = document.createElement('div');
  wrapper.className = 'hero-search';

  const form = document.createElement('form');
  form.className = 'hero-search-form';
  form.setAttribute('role', 'search');

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'hero-search-input';
  input.placeholder = 'Search the documentation';
  input.setAttribute('aria-label', 'Search the documentation');
  input.autocomplete = 'off';

  const kbd = document.createElement('kbd');
  kbd.textContent = '⌘K';

  form.append(input, kbd);

  const results = document.createElement('ul');
  results.className = 'hero-search-results';
  results.hidden = true;

  wrapper.append(form, results);

  const runSearch = debounce(async () => {
    const query = input.value;
    if (!query.trim()) {
      closeResults(results);
      return;
    }
    const docs = await loadDocs();
    const { terms, results: matches } = matchDocs(docs, query, RESULT_LIMIT);
    renderResults(results, terms, matches);
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
    if (e.key === 'Escape') closeResults(results);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const top = results.querySelector('a');
    if (top) window.location.href = top.getAttribute('href');
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) closeResults(results);
  });

  document.addEventListener('keydown', (e) => {
    const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    if (isShortcut) {
      e.preventDefault();
      input.focus();
    }
  });

  copy.append(wrapper);
}

export default function init(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const [copy, art] = cells;
  if (!copy) return;

  copy.classList.add('hero-copy');

  // Eyebrow: a leading <p> whose only content is <code> or <em>.
  const first = copy.firstElementChild;
  if (first && first.tagName === 'P') {
    const only = first.children.length === 1 ? first.firstElementChild : null;
    if (only && (only.tagName === 'CODE' || only.tagName === 'EM')) {
      first.classList.add('hero-eyebrow');
      first.textContent = only.textContent;
    }
  }

  // Intro: first paragraph after the heading that isn't the eyebrow / actions.
  const heading = copy.querySelector('h1, h2');
  heading?.classList.add('hero-title');

  // Collect links into an actions row; first is primary, rest secondary.
  const links = [...copy.querySelectorAll('a')];
  if (links.length) {
    const actions = document.createElement('div');
    actions.className = 'hero-actions';
    links.forEach((a, i) => {
      a.classList.add('hero-btn', i === 0 ? 'hero-btn-primary' : 'hero-btn-secondary');
      // Unwrap a paragraph that only wraps this link.
      const p = a.closest('p');
      actions.append(a);
      if (p && !p.textContent.trim()) p.remove();
    });
    copy.append(actions);
  }

  buildSearch(copy);

  // Art cell.
  if (art) {
    art.classList.add('hero-art');
    if (!art.querySelector('img')) art.classList.add('hero-art-placeholder');
  }
}
