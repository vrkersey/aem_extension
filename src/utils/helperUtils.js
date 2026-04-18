'use strict';

/**
 * AEM URL construction and path-extraction utilities.
 * All functions are pure (no side-effects, no browser APIs).
 */
const HelperUtils = (function () {
  const CONTENT_ROOT    = '/content/paylocity/us/en';
  const EDITOR_PREFIX   = '/editor.html';
  const CLOUD_SUFFIX    = '.adobeaemcloud.com';
  const CLOUD_PATTERN   = /^(author|publish|preview)-p(\d+)-e(\d+)\.adobeaemcloud\.com$/;

  // Paths that exist on publish instances but are NOT content pages.
  const SYSTEM_PATH_PREFIXES = [
    '/libs/', '/bin/', '/content/dam/', '/assets.html',
    '/system/', '/crx/', '/etc/', '/mnt/', '/var/',
  ];

  function isSystemPath(path) {
    return SYSTEM_PATH_PREFIXES.some(p => path.startsWith(p));
  }

  // ── URL analysis ──────────────────────────────────────────────────────────

  /**
   * Parse an Adobe Cloud URL hostname.
   * Returns { instance, programId, envId } or null.
   */
  function parseCloudHostname(hostname) {
    const m = hostname.match(CLOUD_PATTERN);
    if (!m) return null;
    return { instance: m[1], programId: m[2], envId: m[3] };
  }

  /**
   * Return true if the URL is a localhost AEM author (port 4502).
   */
  function isLocalAuthor(url) {
    try {
      const u = new URL(url);
      return u.hostname === 'localhost' && u.port === '4502';
    } catch { return false; }
  }

  /**
   * Return true if the URL is a localhost AEM publish (port 4503).
   */
  function isLocalPublish(url) {
    try {
      const u = new URL(url);
      return u.hostname === 'localhost' && u.port === '4503';
    } catch { return false; }
  }

  /**
   * Return true if the URL belongs to an Adobe Cloud AEM instance.
   */
  function isCloudAem(url) {
    try {
      return CLOUD_PATTERN.test(new URL(url).hostname);
    } catch { return false; }
  }

  /**
   * Return true if the URL path indicates AEM edit mode (/editor.html/…).
   */
  function isEditorMode(url) {
    try {
      return new URL(url).pathname.startsWith(EDITOR_PREFIX + '/');
    } catch { return false; }
  }

  /**
   * Return true if the URL has ?wcmmode=disabled.
   */
  function isWcmDisabled(url) {
    try {
      return new URL(url).searchParams.get('wcmmode') === 'disabled';
    } catch { return false; }
  }

  /**
   * Return true if the URL is already a JCR JSON view.
   */
  function isJsonView(url) {
    try {
      return new URL(url).pathname.endsWith('.infinity.json');
    } catch { return false; }
  }

  // ── Path extraction ───────────────────────────────────────────────────────

  /**
   * Extract the raw AEM content path from any AEM URL variant.
   * Strips /editor.html prefix and query/hash.
   *
   * opts.contentRoot — when provided and the path does not already start with
   *   /content/, it is treated as a short publish path (dispatcher-stripped)
   *   and the content root is prepended to reconstruct the full AEM path.
   *   e.g. /products/hr/payroll → /content/paylocity/us/en/products/hr/payroll
   *
   * Returns null if no content path can be resolved.
   */
  function getContentPath(url, opts) {
    try {
      const u = new URL(url);
      let path = u.pathname;

      // Strip editor prefix
      if (path.startsWith(EDITOR_PREFIX + '/')) {
        path = path.slice(EDITOR_PREFIX.length);
      }

      // Strip JCR JSON suffix
      if (path.endsWith('.infinity.json')) {
        path = path.slice(0, -'.infinity.json'.length);
      }
      // Strip /jcr:content suffix if present
      if (path.endsWith('/jcr:content')) {
        path = path.slice(0, -'/jcr:content'.length);
      }
      // Strip .html page extension — AEM publish URLs include it but the
      // underlying node path and the author editor URL do not.
      if (path.endsWith('.html')) {
        path = path.slice(0, -'.html'.length);
      }

      if (path.startsWith('/content/')) return path;

      // Short publish path — reconstruct with content root if provided
      const contentRoot = opts && opts.contentRoot;
      if (contentRoot && !isSystemPath(path)) {
        // Normalise: strip trailing slash before joining (/ alone → root page)
        const shortPath = (path.endsWith('/') && path.length > 1) ? path.slice(0, -1) : path;
        // Root path (/) maps directly to the content root (e.g. homepage)
        return shortPath === '/' ? contentRoot : contentRoot + shortPath;
      }

      return null;
    } catch { return null; }
  }

  /**
   * Return the origin (scheme + host) of a URL, or null on error.
   */
  function getOrigin(url) {
    try { return new URL(url).origin; } catch { return null; }
  }

  // ── URL construction ──────────────────────────────────────────────────────

  /**
   * Build an Adobe Cloud origin for the given instance and environment.
   *   buildCloudOrigin('author', '1234', '5678')
   *   → https://author-p1234-e5678.adobeaemcloud.com
   */
  function buildCloudOrigin(instance, programId, envId) {
    return `https://${instance}-p${programId}-e${envId}${CLOUD_SUFFIX}`;
  }

  /**
   * Build an editor.html URL from an origin and content path.
   * The .html extension is appended to the content path per AEM convention:
   *   https://author-pX-eY.../editor.html/content/paylocity/us/en/page.html
   */
  function buildEditorUrl(authorOrigin, contentPath) {
    return `${authorOrigin}${EDITOR_PREFIX}${contentPath}.html`;
  }

  /**
   * Build a preview URL: content path with .html extension and ?wcmmode=disabled.
   *   e.g. https://author-pX-eY.../content/paylocity/us/en/page.html?wcmmode=disabled
   */
  function buildWcmDisabledUrl(authorOrigin, contentPath) {
    return `${authorOrigin}${contentPath}.html?wcmmode=disabled`;
  }

  /**
   * Build a plain content URL with .html extension and no wcmmode parameter.
   *   e.g. https://author-pX-eY.../content/paylocity/us/en/page.html
   */
  function buildContentHtmlUrl(authorOrigin, contentPath) {
    return `${authorOrigin}${contentPath}.html`;
  }

  /**
   * Build a publish/preview URL (plain content path, no editor prefix).
   */
  function buildPublishUrl(publishOrigin, contentPath) {
    return `${publishOrigin}${contentPath}`;
  }

  /**
   * Build a DAM URL for the given author origin.
   */
  function buildDamUrl(authorOrigin) {
    return `${authorOrigin}/assets.html/content/dam`;
  }

  /**
   * Build a Manage Publication wizard URL.
   */
  function buildManagePublicationUrl(authorOrigin, contentPath) {
    const item = encodeURIComponent(contentPath);
    return `${authorOrigin}/mnt/override/libs/wcm/core/content/common/managepublicationwizard.html?item=${item}`;
  }

  /**
   * Build a JCR content JSON URL.
   */
  function buildJsonUrl(origin, contentPath) {
    return `${origin}${contentPath}/jcr:content.infinity.json`;
  }

  /**
   * Add (or replace) a cache-bust query parameter on any URL.
   */
  function buildCacheBustUrl(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('cache-buster', Math.floor(100000 + Math.random() * 900000));
      return u.toString();
    } catch { return url; }
  }

  return {
    CONTENT_ROOT,
    isSystemPath,
    parseCloudHostname,
    isLocalAuthor,
    isLocalPublish,
    isCloudAem,
    isEditorMode,
    isWcmDisabled,
    isJsonView,
    getContentPath,
    getOrigin,
    buildCloudOrigin,
    buildEditorUrl,
    buildWcmDisabledUrl,
    buildContentHtmlUrl,
    buildPublishUrl,
    buildDamUrl,
    buildManagePublicationUrl,
    buildJsonUrl,
    buildCacheBustUrl,
  };
})();
