/**
 * ClimaSUS Portal — Theme engine (dark / light)
 * 
 * Supports:
 *   - System preference via prefers-color-scheme
 *   - Manual toggle via localStorage "climasus-theme"
 *   - Sets data-theme="dark" | "light" on <html>
 */

const STORAGE_KEY = 'climasus-theme';

function getPreferredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);

  // Update toggle button icons/labels
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    const iconEl = btn.querySelector('.theme-icon');
    if (iconEl) iconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

export function initTheme() {
  applyTheme(getPreferredTheme());

  // React to system-level preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}
