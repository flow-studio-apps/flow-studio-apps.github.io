/* render.js — whitelisted structured-content renderer. Only textContent/DOM APIs are used on
   JSON-sourced data; nothing here ever assigns innerHTML from content that came out of JSON. */
(function (global) {
  'use strict';

  var utils = global.FSUtils;
  var el = utils.el;

  /* One entry per app.privacy/terms/accountDeletion "sections[]" item:
     { id, title, paragraphs?: string[], bullets?: string[], numbered?: string[],
       notice?: {type: 'info'|'warning', text: string}, table?: {headers: string[], rows: string[][]} } */
  function renderSections(container, sections) {
    utils.clear(container);
    sections.forEach(function (section) {
      var article = el('section', { id: section.id, className: 'policy-section' });
      article.appendChild(el('h2', {}, section.title));

      if (utils.isNonEmptyArray(section.paragraphs)) {
        section.paragraphs.forEach(function (paragraph) {
          article.appendChild(el('p', {}, paragraph));
        });
      }

      if (utils.isNonEmptyArray(section.bullets)) {
        var ul = el('ul', {});
        section.bullets.forEach(function (item) {
          ul.appendChild(el('li', {}, item));
        });
        article.appendChild(ul);
      }

      if (utils.isNonEmptyArray(section.numbered)) {
        var ol = el('ol', {});
        section.numbered.forEach(function (item) {
          ol.appendChild(el('li', {}, item));
        });
        article.appendChild(ol);
      }

      if (section.notice && utils.isNonEmptyString(section.notice.text)) {
        var type = section.notice.type === 'warning' ? 'warning' : 'info';
        article.appendChild(
          el('div', { className: 'notice notice--' + type, role: 'note' }, section.notice.text)
        );
      }

      if (section.table && utils.isNonEmptyArray(section.table.headers)) {
        article.appendChild(renderTable(section.table));
      }

      container.appendChild(article);
    });
  }

  function renderTable(table) {
    var wrap = el('div', { className: 'table-scroll' });
    var el_table = el('table', { className: 'data-table' });
    var thead = el('thead', {});
    var headRow = el('tr', {});
    table.headers.forEach(function (h) {
      headRow.appendChild(el('th', { scope: 'col' }, h));
    });
    thead.appendChild(headRow);
    el_table.appendChild(thead);

    var tbody = el('tbody', {});
    (table.rows || []).forEach(function (row) {
      var tr = el('tr', {});
      row.forEach(function (cell) {
        tr.appendChild(el('td', {}, cell));
      });
      tbody.appendChild(tr);
    });
    el_table.appendChild(tbody);
    wrap.appendChild(el_table);
    return wrap;
  }

  function renderTOC(container, sections) {
    utils.clear(container);
    if (!utils.isNonEmptyArray(sections)) {
      container.hidden = true;
      return;
    }
    container.hidden = false;
    var details = el('details', { className: 'policy-toc', open: true });
    details.appendChild(el('summary', {}, 'On this page'));
    var nav = el('nav', { 'aria-label': 'Sections on this page' });
    var list = el('ul', {});
    sections.forEach(function (section) {
      var li = el('li', {});
      li.appendChild(el('a', { href: '#' + section.id, 'data-toc-target': section.id }, section.title));
      list.appendChild(li);
    });
    nav.appendChild(list);
    details.appendChild(nav);
    container.appendChild(details);
  }

  /* Highlights the TOC link for whichever policy section is currently in view.
     No-op (rather than erroring) if either container is missing or empty — callers
     don't need to know whether a given page actually has a TOC/sections. */
  function initActiveSection(tocContainer, sectionsContainer) {
    if (!tocContainer || !sectionsContainer || !global.IntersectionObserver) return;
    var links = tocContainer.querySelectorAll('[data-toc-target]');
    var sections = sectionsContainer.querySelectorAll('.policy-section[id]');
    if (!links.length || !sections.length) return;

    var linkById = {};
    links.forEach(function (link) {
      linkById[link.getAttribute('data-toc-target')] = link;
    });

    function setActive(id) {
      links.forEach(function (link) {
        link.removeAttribute('aria-current');
      });
      var active = linkById[id];
      if (active) active.setAttribute('aria-current', 'true');
    }

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries.filter(function (entry) {
          return entry.isIntersecting;
        });
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px' }
    );
    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* container is expected to already carry the "feature-grid" class in its markup — this
     only fills it with items, it doesn't nest another grid inside (that nesting made the
     grid's auto-fill algorithm treat the single wrapper as one narrow column). */
  function renderFeatureGrid(container, features) {
    utils.clear(container);
    if (!utils.isNonEmptyArray(features)) {
      container.hidden = true;
      return;
    }
    container.hidden = false;
    features.forEach(function (feature) {
      var item = el('div', { className: 'feature-item' });
      item.appendChild(el('h3', {}, feature.name));
      item.appendChild(el('p', {}, feature.description));
      container.appendChild(item);
    });
  }

  function renderFAQ(container, faqItems) {
    utils.clear(container);
    if (!utils.isNonEmptyArray(faqItems)) {
      container.hidden = true;
      return;
    }
    container.hidden = false;
    var list = el('div', { className: 'faq-list' });
    faqItems.forEach(function (item, index) {
      var questionId = 'faq-question-' + index;
      var answerId = 'faq-answer-' + index;
      var wrapper = el('div', { className: 'faq-item' });

      var button = el(
        'button',
        {
          type: 'button',
          className: 'faq-question',
          id: questionId,
          'aria-expanded': index === 0 ? 'true' : 'false',
          'aria-controls': answerId,
        },
        el('span', {}, item.question)
      );

      var answer = el(
        'div',
        {
          className: 'faq-answer',
          id: answerId,
          role: 'region',
          'aria-labelledby': questionId,
        },
        el('p', {}, item.answer)
      );
      if (index !== 0) answer.hidden = true;

      button.addEventListener('click', function () {
        var expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        answer.hidden = expanded;
      });

      wrapper.appendChild(button);
      wrapper.appendChild(answer);
      list.appendChild(wrapper);
    });
    container.appendChild(list);
  }

  function statusLabel(status) {
    if (status === 'published') return 'Published';
    if (status === 'beta') return 'Beta';
    return 'In development';
  }

  function renderAppCard(app, brand, contentModule) {
    var badge = el(
      'span',
      { className: 'status-badge status-badge--' + (app.status || 'in-development') },
      statusLabel(app.status)
    );

    var iconEl;
    if (utils.isNonEmptyString(app.branding && app.branding.icon)) {
      iconEl = el('img', {
        className: 'app-icon',
        src: utils.withRoot(app.branding.icon),
        alt: app.name + ' icon',
        loading: 'lazy',
      });
    } else {
      iconEl = el('span', { className: 'app-icon--fallback', 'aria-hidden': 'true' }, app.name.charAt(0));
    }

    var card = el('article', {
      className: 'app-card',
      'data-app-accent': '',
      style: '--app-accent: ' + ((app.branding && app.branding.accent) || 'var(--brand-primary)'),
    });

    var head = el('div', { className: 'app-card-head' });
    head.appendChild(iconEl);
    head.appendChild(el('span', { className: 'app-card-title' }, app.name));
    head.appendChild(badge);
    card.appendChild(head);

    if (utils.isNonEmptyString(app.shortDescription)) {
      card.appendChild(el('p', { className: 'app-card-desc' }, app.shortDescription));
    }

    var metaBits = [];
    if (utils.isNonEmptyString(app.category)) metaBits.push(app.category);
    if (utils.isNonEmptyArray(app.platforms)) metaBits.push(app.platforms.join(', '));
    if (metaBits.length) {
      card.appendChild(el('p', { className: 'app-card-desc text-muted' }, metaBits.join(' · ')));
    }

    var links = el('div', { className: 'app-card-links' });
    links.appendChild(
      el('a', { className: 'btn btn-app', href: utils.withRoot(contentModule.appPageHref('index', app)) }, 'View app')
    );
    if (contentModule.isPageEnabled(app, 'privacy')) {
      links.appendChild(
        el('a', { className: 'btn btn-secondary', href: utils.withRoot(contentModule.appPageHref('privacy', app)) }, 'Privacy')
      );
    }
    if (contentModule.isPageEnabled(app, 'support')) {
      links.appendChild(
        el('a', { className: 'btn btn-secondary', href: utils.withRoot(contentModule.appPageHref('support', app)) }, 'Support')
      );
    }
    if (utils.isNonEmptyString(app.links && app.links.googlePlay)) {
      links.appendChild(el('a', { className: 'btn btn-secondary', href: app.links.googlePlay, rel: 'noopener' }, 'Google Play'));
    }
    card.appendChild(links);
    return card;
  }

  function renderMeta(pageMeta) {
    document.title = pageMeta.title;
    setMetaTag('name', 'description', pageMeta.description);
    setMetaTag('property', 'og:title', pageMeta.title);
    setMetaTag('property', 'og:description', pageMeta.description);
    setMetaTag('property', 'og:type', 'website');
    setLinkTag('canonical', pageMeta.canonical);
  }

  function setMetaTag(attr, key, content) {
    if (!utils.isNonEmptyString(content)) return;
    var selector = 'meta[' + attr + '="' + key + '"]';
    var node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement('meta');
      node.setAttribute(attr, key);
      document.head.appendChild(node);
    }
    node.setAttribute('content', content);
  }

  function setLinkTag(rel, href) {
    if (!utils.isNonEmptyString(href)) return;
    var node = document.head.querySelector('link[rel="' + rel + '"]');
    if (!node) {
      node = document.createElement('link');
      node.setAttribute('rel', rel);
      document.head.appendChild(node);
    }
    node.setAttribute('href', href);
  }

  global.FSRender = {
    renderSections: renderSections,
    renderTable: renderTable,
    renderTOC: renderTOC,
    initActiveSection: initActiveSection,
    renderFeatureGrid: renderFeatureGrid,
    renderFAQ: renderFAQ,
    renderAppCard: renderAppCard,
    renderMeta: renderMeta,
    statusLabel: statusLabel,
  };
})(window);
