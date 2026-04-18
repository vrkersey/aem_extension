'use strict';

/**
 * Go-To navigation tool.
 * Handles all navigation buttons: author ↔ publish, DAM,
 * environment quick-links, Cloud Manager, Adobe Target, Admin Console.
 */
(function () {
  window.__aemToolInits = window.__aemToolInits || [];
  window.__aemToolInits.push(function (state, tabId) {
    wire('btn-go-to-author',        (alt) => goToAuthor(state, tabId, alt));
    wire('btn-go-to-adobe-publish', (alt) => goToAdobePublish(state, tabId, alt));
    wire('btn-go-to-publish',       (alt) => goToPublish(state, tabId, alt));
    wire('btn-go-to-dam',           (alt) => goToDam(state, tabId, alt));
    wire('btn-prod-author',         (alt) => goToEnvAuthor(state, tabId, 'prod', alt));
    wire('btn-stage-author',        (alt) => goToEnvAuthor(state, tabId, 'stage', alt));
    wire('btn-dev-author',          (alt) => goToEnvAuthor(state, tabId, 'dev', alt));
    wire('btn-cloud-manager',       (alt) => goToCloudManager(state, tabId, alt));
    wire('btn-adobe-target',        (alt) => goToAdobeTarget(state, tabId, alt));
    wire('btn-admin-console',       (alt) => goToAdminConsole(state, tabId, alt));
  });

  // ── Helpers ─────────────────────────────────────────────────────────────

  function wire(id, handler) {
    BrowserUtil.wireClick(document.getElementById(id), handler);
  }

  function authorOriginForCurrentUrl(state) {
    const url    = state.currentUrl;
    const domain = state.domain;
    if (HelperUtils.isLocalPublish(url)) return 'http://localhost:4502';
    if (!domain || !domain.authorOrigins) return null;
    try {
      const h = new URL(url).hostname;
      const m = h.match(/^(publish|preview)-p\d+-e(\d+)\.adobeaemcloud\.com$/);
      if (m) {
        if (domain.envIds.dev   === m[2]) return domain.authorOrigins.dev;
        if (domain.envIds.stage === m[2]) return domain.authorOrigins.stage;
      }
    } catch (_) { /* ignore */ }
    // Custom domain or fallback
    if (domain.customUrls) {
      const origin = HelperUtils.getOrigin(url);
      if (origin === domain.customUrls.dev)   return domain.authorOrigins.dev;
      if (origin === domain.customUrls.stage) return domain.authorOrigins.stage;
      if (origin === domain.customUrls.prod)  return domain.authorOrigins.prod;
    }
    return domain.authorOrigins.prod;
  }

  function publishOriginForCurrentUrl(state) {
    const url    = state.currentUrl;
    const domain = state.domain;
    if (HelperUtils.isLocalAuthor(url)) return 'http://localhost:4503';
    if (!domain || !domain.publishOrigins) return null;
    try {
      const h = new URL(url).hostname;
      const m = h.match(/^author-p\d+-e(\d+)\.adobeaemcloud\.com$/);
      if (m) {
        if (domain.envIds.dev   === m[1]) return domain.publishOrigins.dev;
        if (domain.envIds.stage === m[1]) return domain.publishOrigins.stage;
        if (domain.envIds.prod  === m[1]) return domain.publishOrigins.prod;
      }
    } catch (_) { /* ignore */ }
    return domain.publishOrigins.prod;
  }

  // ── Path helper ──────────────────────────────────────────────────────────

  /**
   * Get the AEM content path from the current URL, handling both:
   * - Author URLs  (/editor.html/content/paylocity/…  or  /content/paylocity/…)
   * - Publish/CDN short paths  (/products/hr/payroll/)  — reconstructed via contentRoot
   */
  function contentPath(state) {
    return HelperUtils.getContentPath(state.currentUrl, { contentRoot: HelperUtils.CONTENT_ROOT });
  }

  // ── Navigation functions ─────────────────────────────────────────────────

  /** From publish/preview → author editor */
  function goToAuthor(state, tabId, altClick) {
    const path         = contentPath(state);
    const authorOrigin = authorOriginForCurrentUrl(state);
    if (!path || !authorOrigin) return;
    BrowserUtil.navigate(tabId, HelperUtils.buildEditorUrl(authorOrigin, path), altClick);
  }

  /** From any AEM page → Adobe Cloud publish instance for the current environment */
  function goToAdobePublish(state, tabId, altClick) {
    const path   = contentPath(state);
    const domain = state.domain;
    const env    = state.context.env;
    if (!path || !domain || !env || env === 'local') return;

    const cloudPublishOrigin = domain.cloudPublishOrigins && domain.cloudPublishOrigins[env];
    if (!cloudPublishOrigin) return;

    // Convert the full AEM content path to the short publish path that the
    // dispatcher exposes (strips /content/paylocity/us/en prefix).
    const shortPath = path.startsWith(HelperUtils.CONTENT_ROOT)
      ? (path.slice(HelperUtils.CONTENT_ROOT.length) || '/')
      : path;

    BrowserUtil.navigate(tabId, cloudPublishOrigin + shortPath, altClick);
  }

  /** From author → publish instance */
  function goToPublish(state, tabId, altClick) {
    const path          = contentPath(state);
    const publishOrigin = publishOriginForCurrentUrl(state);
    if (!path || !publishOrigin) return;
    BrowserUtil.navigate(tabId, HelperUtils.buildPublishUrl(publishOrigin, path), altClick);
  }

  /** Navigate to DAM on the current (or nearest) author instance */
  function goToDam(state, tabId, altClick) {
    let authorOrigin = HelperUtils.getOrigin(state.currentUrl);
    // If on publish, switch to author first
    if (state.context.isPublish) {
      authorOrigin = authorOriginForCurrentUrl(state);
    }
    if (!authorOrigin) return;
    BrowserUtil.navigate(tabId, HelperUtils.buildDamUrl(authorOrigin), altClick);
  }

  /** Navigate to an environment's author root */
  function goToEnvAuthor(state, tabId, env, altClick) {
    const domain = state.domain;
    if (!domain || !domain.authorOrigins) return;
    const origin = domain.authorOrigins[env];
    if (!origin) return;
    BrowserUtil.navigate(tabId, origin + '/', altClick);
  }

  function goToCloudManager(state, tabId, altClick) {
    const programId = state.domain && state.domain.programId;
    const url = programId
      ? `https://experience.adobe.com/#/cloud-manager/home.html/program/${programId}`
      : 'https://experience.adobe.com/#/cloud-manager';
    BrowserUtil.navigate(tabId, url, altClick);
  }

  function goToAdobeTarget(state, tabId, altClick) {
    BrowserUtil.navigate(tabId, 'https://experience.adobe.com/#/target/activities', altClick);
  }

  function goToAdminConsole(state, tabId, altClick) {
    BrowserUtil.navigate(tabId, 'https://adminconsole.adobe.com/', altClick);
  }
})();
