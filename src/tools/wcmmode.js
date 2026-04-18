'use strict';

/**
 * WCM Mode Toggle
 * Switches between /editor.html (author edit mode) and ?wcmmode=disabled (preview).
 * When on a publish/preview instance, navigates to the author editor instead.
 */
(function () {
  window.__aemToolInits = window.__aemToolInits || [];
  window.__aemToolInits.push(function (state, tabId) {
    const btn = document.getElementById('btn-toggle-preview');
    if (!btn) return;
    BrowserUtil.wireClick(btn, (alt) => toggleWcmMode(state, tabId, alt));
  });

  function toggleWcmMode(state, tabId, altClick) {
    const url    = state.currentUrl;
    const domain = state.domain;

    // If on publish/preview — navigate to author editor
    if (state.context.isPublish) {
      const path = HelperUtils.getContentPath(url, { contentRoot: HelperUtils.CONTENT_ROOT });
      if (!path) return;
      const authorOrigin = domain
        ? getAuthorOriginForUrl(url, domain)
        : (HelperUtils.isLocalPublish(url) ? 'http://localhost:4502' : null);
      if (!authorOrigin) return;
      BrowserUtil.navigate(tabId, HelperUtils.buildEditorUrl(authorOrigin, path), altClick);
      return;
    }

    // On author — toggle between preview and non-preview
    if (state.context.isAuthor) {
      const origin = HelperUtils.getOrigin(url);
      const path   = HelperUtils.getContentPath(url, { contentRoot: HelperUtils.CONTENT_ROOT });
      if (!path || !origin) return;

      if (HelperUtils.isWcmDisabled(url)) {
        // Preview → back to editor (/editor.html/content/…/page.html)
        BrowserUtil.navigate(tabId, HelperUtils.buildEditorUrl(origin, path), altClick);
      } else {
        // Editor or plain view → preview (/content/…/page.html?wcmmode=disabled)
        BrowserUtil.navigate(tabId, HelperUtils.buildWcmDisabledUrl(origin, path), altClick);
      }
    }
  }

  /**
   * Find the author origin that matches the URL's environment, or fall back to prod.
   */
  function getAuthorOriginForUrl(url, domain) {
    const meta = domain && domain.authorOrigins ? null : null; // domain is already serialized
    // domain is a plain serialized object here
    if (!domain || !domain.authorOrigins) return null;
    // Try to detect which env this publish URL belongs to
    try {
      const u = new URL(url);
      const h = u.hostname;
      const m = h.match(/^(publish|preview)-p\d+-e(\d+)\.adobeaemcloud\.com$/);
      if (m) {
        const envId = m[2];
        if (domain.envIds.dev   === envId) return domain.authorOrigins.dev;
        if (domain.envIds.stage === envId) return domain.authorOrigins.stage;
        if (domain.envIds.prod  === envId) return domain.authorOrigins.prod;
      }
    } catch (_) { /* ignore */ }
    return domain.authorOrigins.prod;
  }
})();
