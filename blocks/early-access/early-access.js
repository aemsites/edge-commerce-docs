// Standing "early-access technology" notice. Inserted by scripts.js on pages
// carrying `<meta name="labs" content="...">`; the team name arrives on
// `data-labs`. The block builds its own copy (title + tagline) and lays out as
// icon | text.
export default function init(el) {
  const labs = el.dataset.labs || 'Commerce';
  el.textContent = '';

  const icon = document.createElement('span');
  icon.className = 'early-access-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '🚀';

  const text = document.createElement('div');
  text.className = 'early-access-text';

  const title = document.createElement('p');
  title.className = 'early-access-title';
  title.textContent = 'Early-access technology';

  const body = document.createElement('p');
  body.className = 'early-access-body';
  body.textContent = `Ask us about this feature from ${labs} Labs on your Teams or Slack channel!`;

  text.append(title, body);
  el.append(icon, text);
}
