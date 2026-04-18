'use strict';

/**
 * JSON View Toggle
 * Appends /jcr:content.infinity.json to the current page path to view
 * the full JCR content tree.  If already in JSON view, navigates back
 * to the editor.
 */
(function () {
  window.__aemToolInits = window.__aemToolInits || [];
  window.__aemToolInits.push(function (state, tabId) {
    const btn = document.getElementById('btn-toggle-json');
    if (!btn) return;
    BrowserUtil.wireClick(btn, (alt) => {
      const url    = state.currentUrl;
      const path   = HelperUtils.getContentPath(url, { contentRoot: HelperUtils.CONTENT_ROOT });
      const origin = HelperUtils.getOrigin(url);
      if (!path || !origin) return;

      if (HelperUtils.isJsonView(url)) {
        BrowserUtil.navigate(tabId, HelperUtils.buildEditorUrl(origin, path), alt);
      } else {
        BrowserUtil.navigate(tabId, HelperUtils.buildJsonUrl(origin, path), alt);
      }
    });
  });
})();
