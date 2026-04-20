/**
 * ClimaSUS Portal — i18n engine
 * Loads a JSON translation file and applies it to all [data-i18n] elements.
 * 
 * Usage:
 *   <span data-i18n="hero.title"></span>
 *   <a data-i18n="nav.docs" href="..."></a>  ← sets textContent only
 *   <meta data-i18n-attr="content" data-i18n="meta.description">
 * 
 * Language detection order:
 *   1. localStorage item "climasus-lang"
 *   2. navigator.language prefix (pt, en, es)
 *   3. Fallback: "pt"
 */

const SUPPORTED_LANGS = ['pt', 'en', 'es'];
const DS_BASE = 'https://climasus.github.io/design-system/data/i18n';

let _translations = {};

function detectLang() {
  const stored = localStorage.getItem('climasus-lang');
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

  const browser = (navigator.language || 'pt').split('-')[0].toLowerCase();
  return SUPPORTED_LANGS.includes(browser) ? browser : 'pt';
}

async function loadTranslations(lang) {
  // Try local copy first (placed by CI workflow), fall back to remote
  const urls = [
    `./assets/i18n/${lang}.json`,
    `${DS_BASE}/${lang}.json`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (_) { /* try next */ }
  }

  // Ultimate fallback: return empty object (elements keep their fallback text)
  console.warn(`[i18n] Could not load translations for "${lang}"`);
  return {};
}

function applyTranslations(t) {
  _translations = t;

  // Standard text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // HTML content elements
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // Attribute updates (e.g., placeholder, title, aria-label)
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const attr = el.dataset.i18nAttr;
    const key  = el.dataset.i18n;
    if (attr && key && t[key] !== undefined) el.setAttribute(attr, t[key]);
  });

  // Update <html lang>
  const lang = t['lang'] || detectLang();
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;

  // Update lang selector UI
  document.querySelectorAll('[data-lang-option]').forEach(el => {
    el.classList.toggle('active', el.dataset.langOption === lang);
  });
}

export async function initI18n() {
  const lang = detectLang();
  const t = await loadTranslations(lang);
  applyTranslations(t);
  return lang;
}

export async function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  localStorage.setItem('climasus-lang', lang);
  const t = await loadTranslations(lang);
  applyTranslations(t);
  // Notify dynamic sections to re-render with new lang
  document.dispatchEvent(new CustomEvent('climasus:langchange', { detail: { lang } }));
}

export function t(key, fallback = '') {
  return _translations[key] ?? fallback;
}
