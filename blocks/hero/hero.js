import { buildDocSearch } from '../../scripts/utils/doc-search.js';

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

/**
 * Builds the inline typeahead search box and appends it to `copy`. The
 * header block renders its own compact instance of the same widget and owns
 * the global Cmd/Ctrl+K shortcut, so this one doesn't bind it too.
 */
function buildSearch(copy) {
  copy.append(buildDocSearch({
    classPrefix: 'hero-search',
    placeholder: 'Search the documentation',
    resultLimit: 6,
    globalShortcut: false,
  }));
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
