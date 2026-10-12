/* Apply the saved appearance before styles paint. Course progress uses its own key. */
(() => {
  'use strict';
  const storageKey = 'cv-maths-theme-v1';
  const deviceTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference;

  function readPreference() {
    try {
      const value = localStorage.getItem(storageKey);
      return value === 'dark' || value === 'light' ? value : null;
    } catch { return null; }
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }

  function followPreference() {
    apply(preference || (deviceTheme.matches ? 'dark' : 'light'));
  }

  preference = readPreference();
  followPreference();
  document.addEventListener('DOMContentLoaded', () => {
    followPreference();
    document.getElementById('theme-toggle').addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(storageKey, preference); } catch {}
      apply(preference);
    });
  });
  deviceTheme.addEventListener('change', () => { if (!preference) followPreference(); });
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      preference = readPreference();
      followPreference();
    }
  });
})();
