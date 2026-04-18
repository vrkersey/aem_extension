'use strict';

/**
 * Cache Buster
 * Appends (or replaces) a random 6-digit cachebust query parameter
 * on the current URL to break CDN and browser caches.
 */
(function () {
  window.__aemToolInits = window.__aemToolInits || [];
  window.__aemToolInits.push(function (state, tabId) {
    const btn = document.getElementById('btn-cache-bypass');
    if (!btn) return;
    BrowserUtil.wireClick(btn, (alt) => {
      BrowserUtil.navigate(tabId, HelperUtils.buildCacheBustUrl(state.currentUrl), alt);
    });
  });
})();
