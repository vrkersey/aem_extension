'use strict';

// ── Storage keys ──────────────────────────────────────────────────────────────

const STORAGE_KEYS = [
  'configVersion', 'programName', 'program_id',
  'dev_env_id', 'stage_env_id', 'prod_env_id',
  'dev_env_url', 'stage_env_url', 'prod_env_url', 'prod_prev_url',
  'mode_admin', 'mode_developer',
];

// ── Domain Model ──────────────────────────────────────────────────────────────

class Domain {
  constructor(cfg) {
    this.name      = cfg.programName || '';
    this.programId = String(cfg.program_id || '');
    this.envIds    = {
      dev:   String(cfg.dev_env_id   || ''),
      stage: String(cfg.stage_env_id || ''),
      prod:  String(cfg.prod_env_id  || ''),
    };
    this.customUrls = {
      dev:         cfg.dev_env_url   || null,
      stage:       cfg.stage_env_url || null,
      prod:        cfg.prod_env_url  || null,
      prodPreview: cfg.prod_prev_url || null,
    };
  }

  // ── Origin builders ───────────────────────────────────────────────────────

  _cloudOrigin(instance, env) {
    const eid = this.envIds[env];
    if (!eid || !this.programId) return null;
    return `https://${instance}-p${this.programId}-e${eid}.adobeaemcloud.com`;
  }

  getAuthorOrigin(env) {
    return this._cloudOrigin('author', env || 'prod');
  }

  getPublishOrigin(env) {
    env = env || 'prod';
    if (env === 'dev'   && this.customUrls.dev)   return this.customUrls.dev.replace(/\/$/, '');
    if (env === 'stage' && this.customUrls.stage) return this.customUrls.stage.replace(/\/$/, '');
    if (env === 'prod'  && this.customUrls.prod)  return this.customUrls.prod.replace(/\/$/, '');
    return this._cloudOrigin('publish', env);
  }

  getPreviewOrigin(env) {
    env = env || 'prod';
    if (env === 'prod' && this.customUrls.prodPreview) {
      return this.customUrls.prodPreview.replace(/\/$/, '');
    }
    return this._cloudOrigin('preview', env);
  }

  // ── URL matching ──────────────────────────────────────────────────────────

  /**
   * Return the env name ('dev' | 'stage' | 'prod') for a given env ID, or null.
   */
  envNameForId(envId) {
    for (const [name, id] of Object.entries(this.envIds)) {
      if (id && id === String(envId)) return name;
    }
    return null;
  }

  /**
   * Test whether a URL belongs to this domain's configured instances.
   */
  matchesUrl(url) {
    try {
      const u = new URL(url);
      const h = url && u.hostname;
      const cloudMatch = h && h.match(/^(author|publish|preview)-p(\d+)-e(\d+)\.adobeaemcloud\.com$/);
      if (cloudMatch) {
        return cloudMatch[2] === this.programId &&
               Object.values(this.envIds).includes(cloudMatch[3]);
      }
      const origin = u.origin;
      for (const cu of Object.values(this.customUrls)) {
        if (cu && origin === cu.replace(/\/$/, '')) return true;
      }
      return false;
    } catch { return false; }
  }

  /**
   * Return { instance, env } metadata for a URL belonging to this domain.
   */
  getUrlMeta(url) {
    try {
      const u    = new URL(url);
      const h    = u.hostname;
      const m    = h.match(/^(author|publish|preview)-p(\d+)-e(\d+)\.adobeaemcloud\.com$/);
      if (m) return { instance: m[1], env: this.envNameForId(m[3]) };
      const origin = u.origin;
      for (const [key, cu] of Object.entries(this.customUrls)) {
        if (cu && origin === cu.replace(/\/$/, '')) {
          return { instance: 'publish', env: key === 'prodPreview' ? 'prod' : key };
        }
      }
      return null;
    } catch { return null; }
  }

  // ── Serialization ─────────────────────────────────────────────────────────

  /**
   * Return a plain object with all pre-computed origin URLs.
   */
  serialize() {
    return {
      name:       this.name,
      programId:  this.programId,
      envIds:     { ...this.envIds },
      customUrls: { ...this.customUrls },
      authorOrigins: {
        dev:   this.getAuthorOrigin('dev'),
        stage: this.getAuthorOrigin('stage'),
        prod:  this.getAuthorOrigin('prod'),
      },
      publishOrigins: {
        dev:   this.getPublishOrigin('dev'),
        stage: this.getPublishOrigin('stage'),
        prod:  this.getPublishOrigin('prod'),
      },
      // Raw Adobe Cloud publish origins — never overridden by custom domains.
      cloudPublishOrigins: {
        dev:   this._cloudOrigin('publish', 'dev'),
        stage: this._cloudOrigin('publish', 'stage'),
        prod:  this._cloudOrigin('publish', 'prod'),
      },
      previewOrigins: {
        prod: this.getPreviewOrigin('prod'),
      },
    };
  }
}

// ── Context analysis ──────────────────────────────────────────────────────────

function analyzeUrl(url, domain) {
  const fallback = { isAem: false, isAuthor: false, isPublish: false, isPage: false, env: null };
  if (!url) return fallback;

  let u;
  try { u = new URL(url); } catch { return fallback; }

  const h    = u.hostname;
  const port = u.port;

  const isLocalAuthor  = h === 'localhost' && port === '4502';
  const isLocalPublish = h === 'localhost' && port === '4503';
  const cloudMatch     = h.match(/^(author|publish|preview)-p\d+-e\d+\.adobeaemcloud\.com$/);
  const isCloudAem     = !!cloudMatch;
  const isCustom       = domain ? domain.matchesUrl(url) : false;

  const isAem = isLocalAuthor || isLocalPublish || isCloudAem || isCustom;

  let isAuthor  = isLocalAuthor;
  let isPublish = isLocalPublish;

  if (isCloudAem) {
    const inst = h.split('-')[0];
    isAuthor  = inst === 'author';
    isPublish = inst === 'publish' || inst === 'preview';
  }

  if (isCustom && domain && !isCloudAem) {
    const meta = domain.getUrlMeta(url);
    if (meta) {
      isAuthor  = meta.instance === 'author';
      isPublish = meta.instance !== 'author';
    }
  }

  const path = u.pathname;

  // On author instances the content path prefix is always present.
  // On publish/preview (including custom CDN domains) the dispatcher strips
  // /content/paylocity/us/en, so the path looks like /products/hr/payroll/.
  // Treat any non-system publish path as a page.
  const SYSTEM_PATH_PREFIXES = [
    '/libs/', '/bin/', '/content/dam/', '/assets.html',
    '/system/', '/crx/', '/etc/', '/mnt/', '/var/',
  ];
  const isSystemPath = SYSTEM_PATH_PREFIXES.some(p => path.startsWith(p));

  const isPage = isAem && (
    path.startsWith('/content/paylocity/') ||
    path.startsWith('/editor.html/content/paylocity/') ||
    (isPublish && !isSystemPath)
  );

  // Determine which configured environment this URL belongs to.
  // 'local' for localhost, 'dev'/'stage'/'prod' when matched via domain config.
  let env = null;
  if (isLocalAuthor || isLocalPublish) {
    env = 'local';
  } else if (domain) {
    const meta = domain.getUrlMeta(url);
    if (meta) env = meta.env; // 'dev' | 'stage' | 'prod' | null
  }

  return { isAem, isAuthor, isPublish, isPage, env };
}

// ── State builder ─────────────────────────────────────────────────────────────

/**
 * Build the full popup state directly from browser APIs.
 * Returns a plain object consumed by popup.js; also includes tabId so the
 * caller does not need a separate getActiveTab() call.
 */
async function buildState() {
  const api = BrowserUtil.api;

  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  const tab  = tabs[0] || null;
  const url  = tab ? (tab.url || '') : '';

  const cfg = await api.storage.local.get(STORAGE_KEYS);

  let domain = null;
  if (cfg.program_id && (cfg.dev_env_id || cfg.stage_env_id || cfg.prod_env_id)) {
    domain = new Domain(cfg);
  }

  const modes = {
    admin:     !!cfg.mode_admin,
    developer: !!cfg.mode_developer,
  };

  const context = analyzeUrl(url, domain);

  let hasCookiePermission = true;
  try {
    hasCookiePermission = await api.permissions.contains({ permissions: ['cookies'] });
  } catch (_) { /* cookies is declared in manifest */ }

  return {
    tabId:              tab ? tab.id : null,
    currentUrl:         url,
    modes,
    context,
    hasCookiePermission,
    configured:         !!domain,
    domain:             domain ? domain.serialize() : null,
  };
}
