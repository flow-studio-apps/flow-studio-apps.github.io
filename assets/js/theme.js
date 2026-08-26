/* theme.js — light/dark/system theme, persisted, no-flash (paired with an inline head script) */
(function (global) {
  'use strict';

  var THEME_KEY = 'flow-studio-theme';
  var VALID = ['light', 'dark', 'system'];

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

  function updateSwitcherUI(theme) {
    var buttons = document.querySelectorAll('[data-theme-option]');
    buttons.forEach(function (button) {
      var pressed = button.getAttribute('data-theme-option') === theme;
      button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
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

    if (global.matchMedia) {
      var media = global.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (getStoredTheme() === 'system') applyTheme('system');
      };
      if (media.addEventListener) media.addEventListener('change', onChange);
      else if (media.addListener) media.addListener(onChange);
    }
  }

  global.FSTheme = {
    THEME_KEY: THEME_KEY,
    getStoredTheme: getStoredTheme,
    setTheme: setTheme,
    initThemeSwitcher: initThemeSwitcher,
  };
})(window);
