/* navigation.js — shared header/footer chrome, mobile menu, breadcrumbs */
(function (global) {
  'use strict';

  var utils = global.FSUtils;
  var content = global.FSContent;
  var el = utils.el;

  var NAV_PAGES = [
    { key: 'privacy', label: 'Privacy' },
    { key: 'terms', label: 'Terms' },
    { key: 'faq', label: 'FAQ' },
    { key: 'support', label: 'Support' },
  ];

  function renderHeader(container, brand, app, currentPageKey) {
    utils.clear(container);
    var header = el('header', { className: 'site-header' });
    var shell = el('div', { className: 'site-shell site-header-inner' });

    var logoLink = el('a', { className: 'site-logo', href: utils.withRoot('index.html'), 'aria-label': brand.site.name + ' home' });
    logoLink.appendChild(
      el('img', { src: utils.withRoot(brand.site.branding && brand.site.branding.logo || ''), alt: '', width: '190', height: '38' })
    );
    shell.appendChild(logoLink);

    var nav = el('nav', { className: 'site-nav', 'aria-label': 'Primary' });
    var menu = el('ul', { className: 'nav-menu', id: 'primary-nav-menu' });

    menu.appendChild(navItem('Apps', utils.withRoot('apps.html'), currentPageKey === 'apps'));

    if (app) {
      NAV_PAGES.forEach(function (item) {
        if (!content.isPageEnabled(app, item.key)) return;
        menu.appendChild(
          navItem(item.label, utils.withRoot(content.appPageHref(item.key, app)), currentPageKey === item.key)
        );
      });
    }

    nav.appendChild(menu);
    shell.appendChild(nav);

    var toggle = el(
      'button',
      { type: 'button', className: 'nav-toggle', 'aria-expanded': 'false', 'aria-controls': 'primary-nav-menu' },
      [el('span', { className: 'nav-toggle-icon' }), el('span', { className: 'visually-hidden' }, 'Menu')]
    );

    function isOpen() {
      return menu.getAttribute('data-open') === 'true';
    }

    function setOpen(open) {
      menu.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      /* Only lock background scroll below the breakpoint where the menu overlays
         content — on desktop the menu is always laid out inline and never opens. */
      document.body.style.overflow = open && global.matchMedia && global.matchMedia('(max-width: 768px)').matches ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!isOpen()) return;
      if (shell.contains(event.target)) return;
      setOpen(false);
    });

    shell.appendChild(toggle);

    shell.appendChild(renderThemeSwitcher());

    header.appendChild(shell);
    container.appendChild(header);
  }

  function navItem(label, href, isCurrent) {
    var li = el('li', {});
    li.appendChild(el('a', { className: 'nav-link', href: href, 'aria-current': isCurrent ? 'page' : null }, label));
    return li;
  }

  function renderThemeSwitcher() {
    var wrap = el('div', { className: 'theme-switcher', role: 'group', 'aria-label': 'Theme' });
    [
      ['system', 'System'],
      ['light', 'Light'],
      ['dark', 'Dark'],
    ].forEach(function (pair) {
      wrap.appendChild(
        el('button', { type: 'button', className: 'theme-switcher-btn', 'data-theme-option': pair[0], 'aria-pressed': 'false' }, pair[1])
      );
    });
    return wrap;
  }

  function renderFooter(container, brand, app) {
    utils.clear(container);
    var footer = el('footer', { className: 'site-footer' });
    var shell = el('div', { className: 'site-shell' });
    var grid = el('div', { className: 'footer-grid' });

    var about = el('div', { className: 'footer-col' });
    about.appendChild(el('p', { className: 'footer-brand' }, brand.site.name));
    if (utils.isNonEmptyString(brand.site.tagline)) about.appendChild(el('p', { className: 'text-muted' }, brand.site.tagline));
    grid.appendChild(about);

    if (app) {
      var linksCol = el('div', { className: 'footer-col' });
      linksCol.appendChild(el('p', { className: 'footer-col-title' }, app.name));
      var list = el('div', { className: 'footer-links' });
      NAV_PAGES.concat([{ key: 'accountDeletion', label: 'Account Deletion' }, { key: 'about', label: 'About' }]).forEach(function (item) {
        if (!content.isPageEnabled(app, item.key)) return;
        list.appendChild(el('a', { href: utils.withRoot(content.appPageHref(item.key, app)) }, item.label));
      });
      linksCol.appendChild(list);
      grid.appendChild(linksCol);
    }

    var contactCol = el('div', { className: 'footer-col' });
    contactCol.appendChild(el('p', { className: 'footer-col-title' }, 'Contact'));
    var supportEmail = (brand.site.contact && brand.site.contact.supportEmail) || (app && app.support && app.support.email);
    if (utils.isNonEmptyString(supportEmail)) {
      contactCol.appendChild(el('p', { className: 'overflow-anywhere' }, el('a', { href: 'mailto:' + supportEmail }, supportEmail)));
    }
    if (app && utils.isNonEmptyString(app.links && app.links.googlePlay)) {
      contactCol.appendChild(el('p', {}, el('a', { href: app.links.googlePlay, rel: 'noopener' }, 'Get it on Google Play')));
    }
    grid.appendChild(contactCol);

    shell.appendChild(grid);

    var bottom = el('div', { className: 'footer-bottom' });
    var year = new Date().getFullYear();
    bottom.appendChild(el('p', {}, '© ' + year + ' ' + brand.site.legalName));
    shell.appendChild(bottom);

    footer.appendChild(shell);
    container.appendChild(footer);
  }

  function renderBreadcrumbs(container, items) {
    utils.clear(container);
    var nav = el('nav', { className: 'breadcrumbs', 'aria-label': 'Breadcrumb' });
    var list = el('ol', {});
    items.forEach(function (item, index) {
      var li = el('li', {});
      if (item.href && index !== items.length - 1) {
        li.appendChild(el('a', { href: item.href }, item.label));
      } else {
        li.appendChild(el('span', { 'aria-current': 'page' }, item.label));
      }
      list.appendChild(li);
    });
    nav.appendChild(list);
    container.appendChild(nav);
  }

  global.FSNavigation = {
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    renderBreadcrumbs: renderBreadcrumbs,
    NAV_PAGES: NAV_PAGES,
  };
})(window);
