/* app.js — per-page bootstrap: detect page, load brand JSON, resolve app, render, wire chrome */
(function (global) {
  'use strict';

  var utils = global.FSUtils;
  var content = global.FSContent;
  var render = global.FSRender;
  var nav = global.FSNavigation;
  var theme = global.FSTheme;

  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.dataset.page;
    var appId = document.body.dataset.appId || null;

    content
      .loadBrand()
      .then(function (brand) {
        var app = appId ? content.resolveApp(brand, appId) : null;
        var appMissing = !!appId && !app;
        /* Root pages (home, apps listing) have no single-app context of their own, but the
           header/footer should still surface Privacy/Terms/Support links — use the first
           app in the brand for those, without affecting which app the page content renders. */
        var navApp = app || (brand.apps.length ? brand.apps[0] : null);

        nav.renderHeader(document.getElementById('site-header'), brand, navApp, page);
        nav.renderFooter(document.getElementById('site-footer'), brand, navApp);
        theme.initThemeSwitcher();

        /* Give an app's own pages its own accent (falls back to the site brand color
           everywhere this isn't set) instead of every app looking identically teal. */
        var appAccent = app && app.branding && app.branding.accent;
        if (appAccent) {
          document.body.setAttribute('data-app-accent', '');
          document.body.style.setProperty('--app-accent', appAccent);
        }

        var main = document.getElementById('site-main');
        if (appMissing) {
          renderAppNotFound(main, utils.withRoot('apps.html'));
          render.renderMeta({ title: 'Application not found | ' + brand.site.name, description: 'This application could not be found.' });
          return;
        }

        renderPage(page, brand, app);
      })
      .catch(function (error) {
        console.error(error);
        var main = document.getElementById('site-main');
        renderLoadError(main);
      });
  });

  function renderLoadError(main) {
    if (!main) return;
    utils.clear(main);
    var box = utils.el('div', { className: 'error-state', role: 'alert' });
    box.appendChild(utils.el('h1', {}, "We're unable to load this information right now."));
    box.appendChild(utils.el('p', {}, 'Please try again, or return to the home page.'));
    box.appendChild(utils.el('a', { className: 'btn btn-secondary', href: utils.withRoot('index.html') }, 'Return home'));
    main.appendChild(box);
  }

  function renderAppNotFound(main, appsHref) {
    if (!main) return;
    utils.clear(main);
    var box = utils.el('div', { className: 'error-state' });
    box.appendChild(utils.el('h1', {}, 'Application not found'));
    box.appendChild(utils.el('p', {}, "We couldn't find the application you were looking for."));
    box.appendChild(utils.el('a', { className: 'btn btn-secondary', href: appsHref }, 'View all applications'));
    main.appendChild(box);
  }

  function renderPage(page, brand, app) {
    switch (page) {
      case 'home':
        return renderHome(brand);
      case 'apps':
        return renderApps(brand);
      case 'app-home':
        return renderAppHome(brand, app);
      case 'privacy':
        return renderPolicyPage(brand, app, 'privacy', app.privacy);
      case 'terms':
        return renderPolicyPage(brand, app, 'terms', app.terms);
      case 'account-deletion':
        return renderAccountDeletion(brand, app);
      case 'support':
        return renderSupport(brand, app);
      case 'faq':
        return renderFaqPage(brand, app);
      case 'about':
        return renderAboutPage(brand, app);
      default:
        return;
    }
  }

  function setIcon(imgEl, app) {
    if (!imgEl) return;
    var icon = app.branding && app.branding.icon;
    if (utils.isNonEmptyString(icon)) {
      imgEl.src = utils.withRoot(icon);
      imgEl.alt = app.name + ' icon';
    } else {
      imgEl.hidden = true;
    }
  }

  function renderHome(brand) {
    render.renderMeta({
      title: brand.site.name + ' — ' + brand.site.tagline,
      description: brand.site.description,
      canonical: brand.site.url || undefined,
    });

    var apps = brand.apps;
    var featured = apps[0];

    var heroName = document.getElementById('hero-app-name');
    var heroTagline = document.getElementById('hero-tagline');
    var heroDescription = document.getElementById('hero-description');
    var heroIcon = document.getElementById('hero-icon');
    var heroPlayLink = document.getElementById('hero-play-link');
    var heroLearnLink = document.getElementById('hero-learn-link');

    if (heroName) utils.setText(heroName, featured.name);
    if (heroTagline) utils.setText(heroTagline, featured.tagline || brand.site.tagline);
    if (heroDescription) utils.setText(heroDescription, featured.shortDescription || brand.site.description);
    setIcon(heroIcon, featured);
    if (heroPlayLink) {
      var playUrl = featured.links && featured.links.googlePlay;
      if (utils.isNonEmptyString(playUrl)) {
        heroPlayLink.href = playUrl;
      } else {
        heroPlayLink.hidden = true;
      }
    }
    if (heroLearnLink) heroLearnLink.href = utils.withRoot(content.appPageHref('index', featured));

    var featuresContainer = document.getElementById('home-features');
    if (featuresContainer) render.renderFeatureGrid(featuresContainer, featured.features);

    var privacyLink = document.getElementById('home-privacy-link');
    var termsLink = document.getElementById('home-terms-link');
    var deletionLink = document.getElementById('home-deletion-link');
    var supportLink = document.getElementById('home-support-link');
    [
      [privacyLink, 'privacy'],
      [termsLink, 'terms'],
      [deletionLink, 'accountDeletion'],
      [supportLink, 'support'],
    ].forEach(function (pair) {
      var linkEl = pair[0];
      var key = pair[1];
      if (!linkEl) return;
      if (content.isPageEnabled(featured, key)) {
        linkEl.href = utils.withRoot(content.appPageHref(key, featured));
        linkEl.closest('li,p') && (linkEl.closest('li,p').hidden = false);
      } else if (linkEl.closest('li,p')) {
        linkEl.closest('li,p').hidden = true;
      }
    });

    var supportEmailEl = document.getElementById('home-support-email');
    var email = brand.site.contact && brand.site.contact.supportEmail;
    if (supportEmailEl) {
      if (utils.isNonEmptyString(email)) {
        supportEmailEl.href = 'mailto:' + email;
        utils.setText(supportEmailEl, email);
      } else if (supportEmailEl.closest('p')) {
        supportEmailEl.closest('p').hidden = true;
      }
    }

    var appsGrid = document.getElementById('home-apps-grid');
    if (appsGrid) {
      utils.clear(appsGrid);
      apps.forEach(function (app) {
        appsGrid.appendChild(render.renderAppCard(app, brand, content));
      });
    }
  }

  function renderApps(brand) {
    render.renderMeta({
      title: 'Applications | ' + brand.site.name,
      description: 'Every application published by ' + brand.site.name + '.',
    });
    var grid = document.getElementById('apps-grid');
    if (!grid) return;
    utils.clear(grid);
    brand.apps.forEach(function (app) {
      grid.appendChild(render.renderAppCard(app, brand, content));
    });
  }

  function renderAppHome(brand, app) {
    render.renderMeta({
      title: app.name + ' — ' + app.tagline,
      description: app.shortDescription,
    });

    setIcon(document.getElementById('app-hero-icon'), app);
    utils.setText(document.getElementById('app-hero-name'), app.name);
    utils.setText(document.getElementById('app-hero-tagline'), app.tagline);
    utils.setText(document.getElementById('app-hero-description'), app.description);

    var badge = document.getElementById('app-hero-status');
    if (badge) {
      badge.className = 'status-badge status-badge--' + (app.status || 'in-development');
      utils.setText(badge, render.statusLabel(app.status));
    }

    var playLink = document.getElementById('app-hero-play-link');
    if (playLink) {
      var playUrl = app.links && app.links.googlePlay;
      if (utils.isNonEmptyString(playUrl)) {
        playLink.href = playUrl;
      } else {
        playLink.hidden = true;
      }
    }

    var featuresContainer = document.getElementById('app-features');
    if (featuresContainer) render.renderFeatureGrid(featuresContainer, app.features);

    var quickLinks = document.getElementById('app-quick-links');
    if (quickLinks) {
      utils.clear(quickLinks);
      nav.NAV_PAGES.concat([{ key: 'accountDeletion', label: 'Account Deletion' }, { key: 'about', label: 'About' }]).forEach(function (item) {
        if (!content.isPageEnabled(app, item.key)) return;
        var li = utils.el('li', {});
        li.appendChild(utils.el('a', { className: 'btn btn-secondary', href: utils.withRoot(content.appPageHref(item.key, app)) }, item.label));
        quickLinks.appendChild(li);
      });
    }
  }

  function renderPolicyHeader(app, key, block) {
    setIcon(document.getElementById(key + '-app-icon'), app);
    var effectiveEl = document.getElementById(key + '-effective-date');
    var updatedEl = document.getElementById(key + '-last-updated');
    var versionEl = document.getElementById(key + '-version');
    if (effectiveEl && utils.isNonEmptyString(block.effectiveDate)) {
      utils.setText(effectiveEl, 'Effective: ' + utils.formatDate(block.effectiveDate));
    } else if (effectiveEl) {
      effectiveEl.hidden = true;
    }
    if (updatedEl && utils.isNonEmptyString(block.lastUpdated)) {
      utils.setText(updatedEl, 'Last updated: ' + utils.formatDate(block.lastUpdated));
    } else if (updatedEl) {
      updatedEl.hidden = true;
    }
    var version = key === 'privacy' ? app.metadata && app.metadata.privacyPolicyVersion : app.metadata && app.metadata.termsVersion;
    if (versionEl && utils.isNonEmptyString(version)) {
      utils.setText(versionEl, 'Version: ' + version);
    } else if (versionEl) {
      versionEl.hidden = true;
    }
    var summaryEl = document.getElementById(key + '-summary');
    if (summaryEl && utils.isNonEmptyString(block.summary)) {
      utils.setText(summaryEl, block.summary);
    } else if (summaryEl) {
      summaryEl.hidden = true;
    }
  }

  function renderPolicyPage(brand, app, key, block) {
    render.renderMeta({
      title: (key === 'privacy' ? 'Privacy Policy' : 'Terms of Service') + ' | ' + app.name,
      description: (key === 'privacy' ? 'Privacy Policy for ' : 'Terms of Service for ') + app.name,
    });
    utils.setText(document.getElementById(key + '-app-name'), app.name);
    renderPolicyHeader(app, key, block);
    var toc = document.getElementById(key + '-toc');
    if (toc) render.renderTOC(toc, block.sections);
    var sections = document.getElementById(key + '-sections');
    if (sections) render.renderSections(sections, block.sections);
    render.initActiveSection(toc, sections);
  }

  function renderAccountDeletion(brand, app) {
    render.renderMeta({
      title: 'Delete Your Account | ' + app.name,
      description: 'Account deletion information for ' + app.name,
    });
    utils.setText(document.getElementById('deletion-app-name'), app.name);
    var sections = document.getElementById('deletion-sections');
    if (sections) render.renderSections(sections, app.accountDeletion.sections);
  }

  function renderSupport(brand, app) {
    render.renderMeta({
      title: 'Support | ' + app.name,
      description: 'Support and contact information for ' + app.name,
    });
    setIcon(document.getElementById('support-app-icon'), app);
    utils.setText(document.getElementById('support-app-name'), app.name);

    var email = (app.support && app.support.email) || (brand.site.contact && brand.site.contact.supportEmail);
    var cta = document.getElementById('support-email-cta');
    var emailText = document.getElementById('support-email-text');
    if (utils.isNonEmptyString(email)) {
      if (cta) cta.href = 'mailto:' + email;
      if (emailText) utils.setText(emailText, email);
    } else {
      var emailBlock = document.getElementById('support-email-block');
      if (emailBlock) emailBlock.hidden = true;
    }

    var responseEl = document.getElementById('support-response-time');
    if (responseEl) {
      if (utils.isNonEmptyString(app.support && app.support.responseTime)) {
        utils.setText(responseEl, app.support.responseTime);
      } else {
        responseEl.hidden = true;
      }
    }

    var topicsEl = document.getElementById('support-topics');
    if (topicsEl) {
      utils.clear(topicsEl);
      (app.support && app.support.topics || []).forEach(function (topic) {
        topicsEl.appendChild(utils.el('li', {}, topic));
      });
    }

    var faqLink = document.getElementById('support-faq-link');
    if (faqLink) {
      if (content.isPageEnabled(app, 'faq')) {
        faqLink.href = utils.withRoot(content.appPageHref('faq', app));
      } else if (faqLink.closest('p')) {
        faqLink.closest('p').hidden = true;
      }
    }

    var privacyLink = document.getElementById('support-privacy-link');
    if (privacyLink && content.isPageEnabled(app, 'privacy')) {
      privacyLink.href = utils.withRoot(content.appPageHref('privacy', app));
    }

    var playLink = document.getElementById('support-play-link');
    if (playLink) {
      var playUrl = app.links && app.links.googlePlay;
      if (utils.isNonEmptyString(playUrl)) {
        playLink.href = playUrl;
      } else if (playLink.closest('p')) {
        playLink.closest('p').hidden = true;
      }
    }
  }

  function renderFaqPage(brand, app) {
    render.renderMeta({
      title: 'FAQ | ' + app.name,
      description: 'Frequently asked questions about ' + app.name,
    });
    utils.setText(document.getElementById('faq-app-name'), app.name);
    var container = document.getElementById('faq-container');
    if (container) render.renderFAQ(container, app.faq);
  }

  function renderAboutPage(brand, app) {
    render.renderMeta({
      title: 'About ' + app.name + ' | ' + brand.site.name,
      description: app.description,
    });
    utils.setText(document.getElementById('about-app-name'), app.name);
    var descEl = document.getElementById('about-description');
    if (descEl) utils.setText(descEl, app.description);
    var studioEl = document.getElementById('about-studio-name');
    if (studioEl) utils.setText(studioEl, brand.site.name);
    var studioDescEl = document.getElementById('about-studio-description');
    if (studioDescEl) utils.setText(studioDescEl, brand.site.description);
  }
})(window);
