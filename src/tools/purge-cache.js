'use strict';

/**
 * Purge Cache (Admin)
 * Navigates to the custom Paylocity purge tool on the author instance with
 * the publish URL(s) as query parameters:
 *   {authorOrigin}/content/api/tools/purge-cache.html?url={url1}&url={url2}
 *
 * On production both the live domain and the UAT domain are included so a
 * single trip to the tool clears both environments.
 */
(function () {
  const PROD_UAT_ORIGIN = 'https://uat-www.paylocity.com';

  window.__aemToolInits = window.__aemToolInits || [];
  window.__aemToolInits.push(function (state, tabId) {
    const btn = document.getElementById('btn-purge-cache');
    if (!btn) return;
    BrowserUtil.wireClick(btn, (alt) => purgeCache(state, tabId, alt));
  });

  function purgeCache(state, tabId, altClick) {
    const url    = state.currentUrl;
    const domain = state.domain;
    const env    = state.context.env;

    const contentPath = HelperUtils.getContentPath(url, { contentRoot: HelperUtils.CONTENT_ROOT });
    if (!contentPath) return;

    // Strip the AEM content root to get the short publish path.
    // e.g. /content/paylocity/us/en/products/hr/payroll → /products/hr/payroll
    //      /content/paylocity/us/en                     → /
    const shortPath = contentPath.startsWith(HelperUtils.CONTENT_ROOT)
      ? (contentPath.slice(HelperUtils.CONTENT_ROOT.length) || '/')
      : contentPath;

    // Resolve the author origin — the purge tool lives on author.
    let authorOrigin;
    if (state.context.isAuthor) {
      authorOrigin = HelperUtils.getOrigin(url);
    } else if (domain && domain.authorOrigins) {
      authorOrigin = domain.authorOrigins[env] || domain.authorOrigins.prod;
    }
    if (!authorOrigin) return;

    // Build the list of publish URLs to pass to the purge tool.
    const publishUrls = [];
    if (env === 'prod' && domain && domain.publishOrigins && domain.publishOrigins.prod) {
      publishUrls.push(domain.publishOrigins.prod + shortPath);
      publishUrls.push(PROD_UAT_ORIGIN + shortPath);
    } else if (env && env !== 'local' && domain && domain.publishOrigins) {
      const origin = domain.publishOrigins[env];
      if (origin) publishUrls.push(origin + shortPath);
    } else if (env === 'local') {
      publishUrls.push('http://localhost:4503' + shortPath);
    }

    if (!publishUrls.length) return;

    // Build the tool URL with one ?url= parameter per publish URL.
    const params = new URLSearchParams();
    publishUrls.forEach(u => params.append('url', u));
    const toolUrl = `${authorOrigin}/content/api/tools/purge-cache.html?${params.toString()}`;

    BrowserUtil.navigate(tabId, toolUrl, altClick);
  }
})();
