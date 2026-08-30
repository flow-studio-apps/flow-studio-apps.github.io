/* site.js — behaviour only. All page content is generated statically by tools/build.js,
   so nothing here fetches, renders or is required for the page to be readable: mobile
   navigation, the policy TOC scroll-spy, and the FAQ accordion. Paired with theme.js. */
(function (global) {
  'use strict';

  var MOBILE_QUERY = '(max-width: 768px)';

  /* Assigned by initHeaderAutoHide; a no-op until then, and if that never runs the
     header simply was never hidden in the first place. */
  var showHeader = function () {};

  function matchesMobile() {
    return !!(global.matchMedia && global.matchMedia(MOBILE_QUERY).matches);
  }

  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('primary-nav-menu');
    var shell = document.querySelector('.site-header .site-shell');
    var backdrop = document.querySelector('.nav-backdrop');
    if (!toggle || !menu || !shell) return;

    function isOpen() {
      return menu.getAttribute('data-open') === 'true';
    }

    function setOpen(open) {
      menu.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (backdrop) backdrop.setAttribute('data-open', open ? 'true' : 'false');
      /* Only lock background scroll below the breakpoint where the menu overlays
         content — on desktop the menu is laid out inline and never opens. */
      document.body.style.overflow = open && matchesMobile() ? 'hidden' : '';
      /* The dropdown hangs off the bottom of the header, so the header has to be
         on screen for the menu to be usable. */
      if (open) showHeader();
    }

    /* Focus must stay inside the overlay while it is open, or Tab walks straight
       through into the page behind it. */
    function focusables() {
      return Array.prototype.filter.call(menu.querySelectorAll('a[href], button:not([disabled])'), function (node) {
        return node.offsetParent !== null;
      });
    }

    toggle.addEventListener('click', function () {
      var opening = !isOpen();
      setOpen(opening);
      if (opening && matchesMobile()) {
        var items = focusables();
        if (items.length) items[0].focus();
      }
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    shell.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab' || !isOpen() || !matchesMobile()) return;
      var items = [toggle].concat(focusables());
      if (items.length < 2) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
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

    /* Crossing the breakpoint (a phone rotating to landscape) lays the menu out inline
       again, so the overlay visually disappears while data-open and the body scroll
       lock stay set — leaving the page unscrollable with no way to recover. */
    if (global.matchMedia) {
      var query = global.matchMedia(MOBILE_QUERY);
      var onChange = function () {
        if (isOpen()) setOpen(false);
      };
      if (query.addEventListener) query.addEventListener('change', onChange);
      else if (query.addListener) query.addListener(onChange);
    }
  }

  /* Hides the sticky header while scrolling down, restores it on the first scroll
     back up. Deliberately conservative about when it is allowed to hide, because a
     header that vanishes at the wrong moment is worse than one that never moves. */
  function initHeaderAutoHide() {
    var header = document.querySelector('.site-header');
    var menu = document.getElementById('primary-nav-menu');
    if (!header) return;

    /* Below this the header is always shown: near the top there is nothing to gain,
       and hiding it during the tiny scrolls that follow an anchor jump reads as a
       glitch rather than a feature. */
    var REVEAL_ABOVE = 120;
    /* Ignore sub-pixel and rubber-band jitter; only a deliberate scroll counts. */
    var DELTA = 6;

    var lastY = global.scrollY || 0;
    var ticking = false;

    function show() {
      header.setAttribute('data-hidden', 'false');
    }
    showHeader = show;

    function canHide() {
      /* The mobile menu is positioned at top:100% of the header, so hiding the header
         takes the open dropdown off-screen with it. */
      if (menu && menu.getAttribute('data-open') === 'true') return false;
      /* Never pull the header out from under someone's keyboard focus. */
      if (header.contains(document.activeElement)) return false;
      return true;
    }

    function update() {
      ticking = false;
      var y = global.scrollY || 0;
      var delta = y - lastY;

      if (y <= REVEAL_ABOVE) {
        show();
      } else if (delta > DELTA && canHide()) {
        header.setAttribute('data-hidden', 'true');
      } else if (delta < -DELTA) {
        show();
      } else {
        return; /* below the threshold — leave lastY alone so small moves accumulate */
      }
      lastY = y;
    }

    global.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        global.requestAnimationFrame(update);
      },
      { passive: true }
    );

    /* Tabbing into the header (or opening the menu) while it is hidden must bring it
       back, or the focused control is invisible. */
    header.addEventListener('focusin', show);
    show();
  }

  function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(function (button) {
      var answer = document.getElementById(button.getAttribute('aria-controls'));
      if (!answer) return;
      button.addEventListener('click', function () {
        var expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        answer.hidden = expanded;
      });
    });
  }

  /* Highlights the TOC link for whichever policy section is at the top of the viewport. */
  function initTOC() {
    var links = document.querySelectorAll('[data-toc-target]');
    var sections = document.querySelectorAll('.policy-section[id]');
    if (!links.length || !sections.length || !global.IntersectionObserver) return;

    var linkById = {};
    links.forEach(function (link) {
      linkById[link.getAttribute('data-toc-target')] = link;
    });

    function setActive(id) {
      links.forEach(function (link) {
        link.removeAttribute('aria-current');
      });
      if (linkById[id]) linkById[id].setAttribute('aria-current', 'true');
    }

    /* Entry order in the observer callback is unspecified, so picking entries[0] could
       highlight a section below the one actually in view. Track what is intersecting
       and always choose the topmost by document position. */
    var order = {};
    var intersecting = Object.create(null);
    Array.prototype.forEach.call(sections, function (section, index) {
      order[section.id] = index;
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          intersecting[entry.target.id] = entry.isIntersecting;
        });
        var ids = Object.keys(intersecting).filter(function (id) {
          return intersecting[id];
        });
        if (!ids.length) return;
        ids.sort(function (a, b) {
          return order[a] - order[b];
        });
        setActive(ids[0]);
      },
      { rootMargin: '-96px 0px -70% 0px' }
    );
    Array.prototype.forEach.call(sections, function (section) {
      observer.observe(section);
    });

    /* Nothing was highlighted until the first scroll otherwise. */
    var initial = (global.location.hash || '').slice(1);
    setActive(order[initial] !== undefined ? initial : sections[0].id);
  }

  function init() {
    initNav();
    initHeaderAutoHide();
    initFAQ();
    initTOC();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
