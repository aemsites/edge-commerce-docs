import { loadStyle } from './nx.js';

export const GATE_STORAGE_KEY = 'invite-gate';
export const GATE_CLASS = 'invite-gated';

const INTRO = 'We\'re excited that you\'re interested in Edge Commerce! Edge Commerce is currently '
  + 'available only through a co-innovation partnership with Adobe Commerce engineering.';
const HINT = 'To get your access code, reach out to your Adobe Engineering contact.';
const RETRY = 'That access code didn\'t work. Please check it and try again.';

function readStoredHash() {
  try {
    return localStorage.getItem(GATE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredHash(hash) {
  try {
    if (hash) localStorage.setItem(GATE_STORAGE_KEY, hash);
    else localStorage.removeItem(GATE_STORAGE_KEY);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Unable to save the invitation gate code.', error);
  }
}

/**
 * Blurs the page immediately unless a previously accepted code is stored.
 * Must run synchronously before first paint to avoid a flash of content.
 */
export function preGate() {
  if (!readStoredHash()) document.documentElement.classList.add(GATE_CLASS);
}

async function fetchExpectedHash() {
  try {
    const resp = await fetch('/placeholders.json');
    if (!resp.ok) return null;
    const { data = [] } = await resp.json();
    const row = data.find(({ Key }) => Key?.trim().toLowerCase() === 'gate');
    const hash = row?.Text?.trim().toLowerCase();
    return /^[a-f0-9]{64}$/.test(hash || '') ? hash : null;
  } catch {
    return null;
  }
}

async function sha256(value) {
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function showGateDialog(expectedHash) {
  const dialog = document.createElement('dialog');
  dialog.className = 'invite-gate';
  dialog.setAttribute('aria-labelledby', 'invite-gate-title');
  dialog.setAttribute('aria-describedby', 'invite-gate-intro');
  dialog.innerHTML = `
    <form>
      <p class="invite-gate-eyebrow">Invitation only</p>
      <h2 id="invite-gate-title">Welcome to Edge Commerce</h2>
      <p id="invite-gate-intro"></p>
      <p class="invite-gate-hint"></p>
      <label for="invite-gate-code">Access code</label>
      <input id="invite-gate-code" name="code" type="password"
        autocomplete="current-password" required aria-describedby="invite-gate-error">
      <p id="invite-gate-error" class="invite-gate-error" role="alert"></p>
      <button type="submit">Unlock documentation</button>
    </form>
  `;
  dialog.querySelector('#invite-gate-intro').textContent = INTRO;
  dialog.querySelector('.invite-gate-hint').textContent = HINT;
  const input = dialog.querySelector('input');
  const error = dialog.querySelector('.invite-gate-error');
  const button = dialog.querySelector('button');

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    input.focus();
  });

  dialog.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = input.value.trim();
    if (!code) return;
    button.disabled = true;
    const hash = await sha256(code);
    button.disabled = false;
    if (expectedHash && hash === expectedHash) {
      writeStoredHash(hash);
      dialog.close();
      dialog.remove();
      document.documentElement.classList.remove(GATE_CLASS);
      return;
    }
    input.value = '';
    error.textContent = RETRY;
    input.focus();
  });

  document.body.append(dialog);
  dialog.showModal();
  input.focus();
}

/**
 * Verifies the stored access code against the `Gate` placeholder (a SHA-256
 * hex digest) and shows the access-code dialog over the blurred page if needed.
 * This is a soft, client-side gate; it does not block page loading.
 */
export async function checkInviteGate() {
  const expectedHash = await fetchExpectedHash();
  const stored = readStoredHash();
  if (expectedHash && stored === expectedHash) {
    document.documentElement.classList.remove(GATE_CLASS);
    return;
  }
  if (!expectedHash) {
    // eslint-disable-next-line no-console
    console.error('The Gate placeholder must contain a SHA-256 hex digest.');
  }
  if (stored) writeStoredHash(null);
  document.documentElement.classList.add(GATE_CLASS);
  await loadStyle('/styles/invite-gate.css');
  showGateDialog(expectedHash);
}
