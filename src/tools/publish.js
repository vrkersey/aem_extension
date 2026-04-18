'use strict';

/**
 * Manage Publication
 * Opens the AEM Manage Publication wizard for the current page.
 * Requires the user to be on an author instance with a content page open.
 */
(function () {
  window.__aemToolInits = window.__aemToolInits || [];
  window.__aemToolInits.push(function (state, tabId) {
    const btn = document.getElementById('btn-manage-publication');
    if (!btn) return;
    BrowserUtil.wireClick(btn, (alt) => {
      const url    = state.currentUrl;
      const path   = HelperUtils.getContentPath(url, { contentRoot: HelperUtils.CONTENT_ROOT });
      if (!path) return;

      // Always open the wizard on an author instance
      let authorOrigin = HelperUtils.getOrigin(url);
      if (state.context.isPublish && state.domain && state.domain.authorOrigins) {
        authorOrigin = state.domain.authorOrigins.prod;
      }
      if (!authorOrigin) return;

      BrowserUtil.navigate(tabId, HelperUtils.buildManagePublicationUrl(authorOrigin, path), alt);
    });
  });
})();
