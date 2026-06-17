import { loadArea, loadBlock, setConfig } from './nx.js';

// Supported locales
const locales = {
  '': { ietf: 'en', tk: 'etj3wuq.css' },
  '/de': { ietf: 'de', tk: 'etj3wuq.css' },
};

// Widget patterns to look for
const widgets = [
  { fragment: '/fragments/' },
  { youtube: 'https://www.youtube' },
];

// How to decorate an area before loading it
const decorateArea = ({ area = document }) => {
  const eagerLoad = (parent, selector) => {
    const img = parent.querySelector(selector);
    img?.removeAttribute('loading');
  };

  eagerLoad(area, 'img');
};

function detectTutorial() {
  const { classList } = document.body;
  if (!classList.contains('tutorial-template')) return;
  const section = document.createElement('div');
  const block = document.createElement('div');
  block.className = 'tutorial-nav';
  section.append(block);
  document.querySelector('main').append(section);
}

// Early-access notice. Pages opt in with `<meta name="labs" content="...">`; the
// content names the team (e.g. "Commerce") and is woven into the tagline. We
// prepend the block to the first section so loadArea decorates + loads it; the
// block builds its own copy from the `data-labs` value.
function detectLabs() {
  const labs = document.querySelector('meta[name="labs"]')?.content;
  if (!labs) return;
  const firstSection = document.querySelector('main > div');
  if (!firstSection) return;
  const block = document.createElement('div');
  block.className = 'early-access';
  block.dataset.labs = labs;
  firstSection.prepend(block);
}

// Make content headings deep-linkable. Each heading with an id gets an anchor
// link so clicking it updates the URL hash (and copies a sharable link).
function decorateHeadingAnchors() {
  if (!document.body.classList.contains('docs-template')) return;
  const main = document.querySelector('main');
  if (!main) return;

  const headings = main.querySelectorAll(
    '.default-content h2[id], .default-content h3[id], .default-content h4[id]',
  );
  headings.forEach((heading) => {
    if (heading.querySelector('a.heading-anchor')) return;
    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = `#${heading.id}`;
    anchor.setAttribute('aria-label', `Link to ${heading.textContent}`);
    // Wrap the existing heading content so the whole heading is clickable.
    // The trailing # affordance is added via CSS so it never leaks into
    // textContent (the pagenav builds its labels from heading.textContent).
    while (heading.firstChild) anchor.append(heading.firstChild);
    heading.append(anchor);
  });
}

const loadNav = async (name) => {
  const position = name === 'sitenav' ? 'beforebegin' : 'afterend';
  const main = document.querySelector('main');
  const nav = document.createElement('nav');
  nav.dataset.status = 'decorated';
  nav.className = name;
  main.insertAdjacentElement(position, nav);
  await loadBlock(nav);
};

function setLabPlaceholders() {
  const org = localStorage.getItem('lab-org');
  const site = localStorage.getItem('lab-site');
  if (!(site || org)) return;
  document.body.outerHTML = document.body.outerHTML
    .replaceAll('{ORG}', org)
    .replaceAll('{SITE}', site)
    .replaceAll('%7BORG%7D', org)
    .replaceAll('%7BSITE%7D', site);
}

function setColorScheme() {
  const { classList } = document.body;
  const hasScheme = classList.contains('light-theme') || classList.contains('dark-theme');
  if (hasScheme) return;
  const scheme = matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark-theme'
    : 'light-theme';
  classList.add(scheme);
}

export async function loadPage() {
  setConfig({ locales, widgets, decorateArea });

  setColorScheme();
  detectTutorial();
  detectLabs();
  setLabPlaceholders();
  loadNav('sitenav');

  await loadArea();
  decorateHeadingAnchors();
  await loadNav('pagenav');
}

await loadPage();
