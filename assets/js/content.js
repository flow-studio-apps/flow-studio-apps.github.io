/* content.js — load the active brand's JSON, validate it, resolve the current app.
   URL scheme: each app has its own folder, apps/<app-id>/<page>.html. The app id for a
   given page is read from <body data-app-id="...">, not a query string.
   Data scheme: data/brands/<brand-id>.json holds `site` config plus an `apps` array of
   plain id strings; each app's full content lives in its own data/apps/<app-id>.json —
   loadBrand() fetches the brand file, then every listed app file in parallel, and returns
   the same {site, apps: [...]} shape callers already expect (apps[] now holds full app
   objects again, just assembled from separate files instead of one big one). */
(function (global) {
  'use strict';

  var utils = global.FSUtils;
  var SITE_JSON_URL = 'data/site.json';
  var BRANDS_DIR = 'data/brands/';
  var APPS_DIR = 'data/apps/';

  function validateBrand(brand) {
    var errors = [];
    if (!brand || typeof brand !== 'object') errors.push('brand config is not an object');
    if (!brand.site) errors.push('missing site');
    if (brand.site && !utils.isNonEmptyString(brand.site.name)) errors.push('missing site.name');
    if (brand.site && !brand.site.contact) errors.push('missing site.contact');
    if (!utils.isNonEmptyArray(brand.apps)) errors.push('missing apps[]');
    if (utils.isNonEmptyArray(brand.apps)) {
      brand.apps.forEach(function (app, index) {
        if (!utils.isNonEmptyString(app.id)) errors.push('apps[' + index + '] missing id');
        if (!utils.isNonEmptyString(app.name)) errors.push('apps[' + index + '] missing name');
      });
    }
    return errors;
  }

  /* Throws on any failure — callers show one consistent error state rather than a blank page. */
  async function loadBrand() {
    var site = await utils.fetchJSON(utils.withRoot(SITE_JSON_URL));
    if (!site || !utils.isNonEmptyString(site.activeBrand)) {
      throw new Error('data/site.json is missing "activeBrand"');
    }
    var brandMeta = await utils.fetchJSON(utils.withRoot(BRANDS_DIR + site.activeBrand + '.json'));
    if (!brandMeta || !utils.isNonEmptyArray(brandMeta.apps)) {
      throw new Error('Brand configuration (' + site.activeBrand + ') is missing "apps"');
    }

    var appFiles;
    try {
      appFiles = await Promise.all(
        brandMeta.apps.map(function (appId) {
          return utils.fetchJSON(utils.withRoot(APPS_DIR + appId + '.json'));
        })
      );
    } catch (fetchError) {
      console.error('Failed to load one or more app files for brand "' + site.activeBrand + '":', fetchError);
      throw new Error('One or more app data files failed to load');
    }

    var brand = { site: brandMeta.site, apps: appFiles };
    var errors = validateBrand(brand);
    if (errors.length) {
      console.error('Invalid brand config (' + site.activeBrand + '):', errors);
      throw new Error('Brand configuration is invalid: ' + errors.join('; '));
    }
    return brand;
  }

  /* A page with data-app-id must match an app exactly, or the caller shows a "not found"
     state — never a silent fallback to a different app. A page with no data-app-id (site
     home, the apps listing, 404) has no single-app context. */
  function resolveApp(brand, requestedId) {
    if (!requestedId) return null;
    return brand.apps.find(function (app) {
      return app.id === requestedId;
    }) || null;
  }

  /* app.pages{}/JS use the camelCase key "accountDeletion" (matching the JSON field name);
     the actual file on disk is hyphenated to match the rest of this site's filenames. */
  var PAGE_SLUGS = { accountDeletion: 'account-deletion' };

  function appPageHref(pageKey, app) {
    var slug = PAGE_SLUGS[pageKey] || pageKey;
    return 'apps/' + app.id + '/' + slug + '.html';
  }

  function isPageEnabled(app, pageKey) {
    return !!(app.pages && app.pages[pageKey]);
  }

  global.FSContent = {
    loadBrand: loadBrand,
    resolveApp: resolveApp,
    appPageHref: appPageHref,
    isPageEnabled: isPageEnabled,
  };
})(window);
