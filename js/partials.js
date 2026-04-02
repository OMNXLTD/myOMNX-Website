(function () {
  function loadInclude(el) {
    var url = el.getAttribute('data-include');
    if (!url) return Promise.resolve();
    return fetch(url, { credentials: 'same-origin' })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.text(); })
      .then(function (html) { el.innerHTML = html; })
      .catch(function (err) { console.error('[partials] Failed to load', url, err); });
  }

  function reinitWebflow() {
    try {
      if (window.Webflow) {
        // Clean up any existing components/interactions first
        if (typeof window.Webflow.destroy === 'function') {
          window.Webflow.destroy();
        }
        // Re-run component initializers (dropdowns, navbar, etc.)
        if (typeof window.Webflow.ready === 'function') {
          window.Webflow.ready();
        }
        // Re-initialize IX2 interactions last
        if (window.Webflow.require) {
          var ix2 = window.Webflow.require('ix2');
          if (ix2 && typeof ix2.init === 'function') ix2.init();
          // Nudge core components in case ready() didn't cover it
          var dd = window.Webflow.require('dropdown');
          if (dd && typeof dd.ready === 'function') dd.ready();
          var nb = window.Webflow.require('navbar');
          if (nb && typeof nb.ready === 'function') nb.ready();
        }
      }
    } catch (e) {
      console.warn('[partials] Webflow re-init skipped:', e);
    }
  }

  function init() {
    var nodes = document.querySelectorAll('[data-include]');
    var jobs = [];
    nodes.forEach(function (n) { jobs.push(loadInclude(n)); });
    Promise.all(jobs).then(function () {
      // Give the DOM a breath so Webflow can see the injected nodes
      setTimeout(function(){ reinitWebflow(); document.dispatchEvent(new Event('partials:loaded')); }, 0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();