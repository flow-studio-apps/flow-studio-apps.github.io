/* theme.js — light/dark/system theme, persisted, no-flash (paired with an inline head script) */
(function (global) {
  'use strict';

  var THEME_KEY = 'flow-studio-theme';
  var VALID = ['light', 'dark', 'system'];
  /* Glyph + label for the compact single-button switcher shown below 640px. */
  var LABELS = { system: 'System', light: 'Light', dark: 'Dark' };
  var GLYPHS = { system: '\u25D0', light: '\u2600', dark: '\u263D' };

  function getStoredTheme() {
    try {
      var value = localStorage.getItem(THEME_KEY);
      return VALID.indexOf(value) !== -1 ? value : 'system';
    } catch (e) {
      return 'system';
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* localStorage unavailable (private mode etc.) — theme just won't persist */
    }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
  }

  function setTheme(theme) {
    if (VALID.indexOf(theme) === -1) theme = 'system';
    applyTheme(theme);
    setStoredTheme(theme);
    updateSwitcherUI(theme);
  }

  function nextTheme(theme) {
    return VALID[(VALID.indexOf(theme) + 1) % VALID.length];
  }

  /* The three options are mutually exclusive, so the group is a radiogroup and the
     state is aria-checked — aria-pressed described three independently-toggleable
     buttons, which is not what this is. */
  function updateSwitcherUI(theme) {
    document.querySelectorAll('[data-theme-option]').forEach(function (button) {
      var checked = button.getAttribute('data-theme-option') === theme;
      button.setAttribute('aria-checked', checked ? 'true' : 'false');
      button.setAttribute('tabindex', checked ? '0' : '-1');
    });

    document.querySelectorAll('[data-theme-cycle]').forEach(function (button) {
      var glyph = button.querySelector('[data-theme-glyph]');
      var label = button.querySelector('[data-theme-label]');
      if (glyph) glyph.textContent = GLYPHS[theme] || GLYPHS.system;
      if (label) label.textContent = 'Theme: ' + (LABELS[theme] || LABELS.system) + '. Switch to ' + LABELS[nextTheme(theme)] + '.';
    });
  }

  function initThemeSwitcher() {
    var theme = getStoredTheme();
    applyTheme(theme);
    updateSwitcherUI(theme);

    var buttons = document.querySelectorAll('[data-theme-option]');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        setTheme(button.getAttribute('data-theme-option'));
      });
    });

    document.querySelectorAll('[data-theme-cycle]').forEach(function (button) {
      button.addEventListener('click', function () {
        setTheme(nextTheme(getStoredTheme()));
      });
    });

    if (global.matchMedia) {
      var media = global.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (getStoredTheme() === 'system') applyTheme('system');
      };
      if (media.addEventListener) media.addEventListener('change', onChange);
      else if (media.addListener) media.addListener(onChange);
    }
  }

  /* The switcher markup is generated statically, so this can self-initialise; it is
     loaded with `defer`, so the header is always in the DOM by the time this runs. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSwitcher);
  } else {
    initThemeSwitcher();
  }

  global.FSTheme = {
    THEME_KEY: THEME_KEY,
    getStoredTheme: getStoredTheme,
    setTheme: setTheme,
    initThemeSwitcher: initThemeSwitcher,
  };
})(window);
