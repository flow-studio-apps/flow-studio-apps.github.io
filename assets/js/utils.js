/* utils.js — DOM helpers, date formatting, safe text rendering, URL helpers */
(function (global) {
  'use strict';

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /* Renders ISO date-only strings ("2026-08-25") as "August 25, 2026",
     parsed as UTC so the displayed day never shifts with the viewer's timezone. */
  function formatDate(isoDate) {
    if (!isoDate || typeof isoDate !== 'string') return '';
    var parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    var y = Number(parts[0]);
    var m = Number(parts[1]);
    var d = Number(parts[2]);
    if (!y || !m || !d) return isoDate;
    var date = new Date(Date.UTC(y, m - 1, d));
    if (isNaN(date.getTime())) return isoDate;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === 'className') {
          node.className = value;
        } else if (key.indexOf('on') === 0 && typeof value === 'function') {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (value === true) {
          node.setAttribute(key, '');
        } else {
          node.setAttribute(key, String(value));
        }
      });
    }
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    if (children === null || children === undefined) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      if (typeof child === 'string' || typeof child === 'number') {
        node.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        node.appendChild(child);
      }
    });
  }

  function text(str) {
    return document.createTextNode(str == null ? '' : String(str));
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setText(node, str) {
    clear(node);
    node.appendChild(text(str));
  }

  async function fetchJSON(url) {
    var response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error('Request for ' + url + ' failed with status ' + response.status);
    }
    return response.json();
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function isNonEmptyArray(value) {
    return Array.isArray(value) && value.length > 0;
  }

  /* Prefixes a root-relative path (e.g. "apps/money-flow/privacy.html", "assets/css/styles.css")
     with this page's distance back to the site root (set inline per page as window.FS_ROOT,
     e.g. "../../" for apps/<id>/*.html, "" for top-level pages). Leaves absolute/external
     URLs (http, mailto, #anchors) untouched. */
  function withRoot(path) {
    if (!path) return path;
    if (/^([a-z]+:|#|\/)/i.test(path)) return path;
    return (global.FS_ROOT || '') + path;
  }

  global.FSUtils = {
    qs: qs,
    formatDate: formatDate,
    el: el,
    text: text,
    clear: clear,
    setText: setText,
    fetchJSON: fetchJSON,
    isNonEmptyString: isNonEmptyString,
    isNonEmptyArray: isNonEmptyArray,
    withRoot: withRoot,
  };
})(window);
