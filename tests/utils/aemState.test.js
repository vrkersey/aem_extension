import { describe, it, expect } from 'vitest';
import { Domain, analyzeUrl } from '../../src/utils/aemState.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FULL_CFG = {
  programName:   'Paylocity',
  program_id:    1234,
  dev_env_id:    100,
  stage_env_id:  200,
  prod_env_id:   300,
  dev_env_url:   'https://dev.paylocity.com',
  stage_env_url: 'https://stage.paylocity.com',
  prod_env_url:  'https://www.paylocity.com',
  prod_prev_url: 'https://preview.paylocity.com',
};

// Cloud origins derived from FULL_CFG
const AUTHOR_PROD  = 'https://author-p1234-e300.adobeaemcloud.com';
const AUTHOR_STAGE = 'https://author-p1234-e200.adobeaemcloud.com';
const AUTHOR_DEV   = 'https://author-p1234-e100.adobeaemcloud.com';

// ── Domain ────────────────────────────────────────────────────────────────────

describe('Domain', () => {
  describe('constructor', () => {
    it('stores program name, id, env ids, and custom URLs', () => {
      const d = new Domain(FULL_CFG);
      expect(d.name).toBe('Paylocity');
      expect(d.programId).toBe('1234');
      expect(d.envIds).toEqual({ dev: '100', stage: '200', prod: '300' });
      expect(d.customUrls).toEqual({
        dev:         'https://dev.paylocity.com',
        stage:       'https://stage.paylocity.com',
        prod:        'https://www.paylocity.com',
        prodPreview: 'https://preview.paylocity.com',
      });
    });

    it('falls back to empty strings for missing env ids', () => {
      const d = new Domain({ program_id: 1234 });
      expect(d.envIds).toEqual({ dev: '', stage: '', prod: '' });
    });

    it('stores null for missing custom URLs', () => {
      const d = new Domain({ program_id: 1234, prod_env_id: 300 });
      expect(d.customUrls.prod).toBeNull();
      expect(d.customUrls.prodPreview).toBeNull();
    });

    it('coerces numeric IDs to strings', () => {
      const d = new Domain({ program_id: 9999, prod_env_id: 777 });
      expect(d.programId).toBe('9999');
      expect(d.envIds.prod).toBe('777');
    });
  });

  // ── getAuthorOrigin ─────────────────────────────────────────────────────────

  describe('getAuthorOrigin', () => {
    const d = new Domain(FULL_CFG);

    it('returns prod author origin by default', () => {
      expect(d.getAuthorOrigin()).toBe(AUTHOR_PROD);
    });

    it('returns env-specific author origins', () => {
      expect(d.getAuthorOrigin('prod')).toBe(AUTHOR_PROD);
      expect(d.getAuthorOrigin('stage')).toBe(AUTHOR_STAGE);
      expect(d.getAuthorOrigin('dev')).toBe(AUTHOR_DEV);
    });

    it('returns null when env id is missing', () => {
      const d2 = new Domain({ program_id: 1234, prod_env_id: 300 });
      expect(d2.getAuthorOrigin('dev')).toBeNull();
      expect(d2.getAuthorOrigin('stage')).toBeNull();
    });

    it('returns null when program id is missing', () => {
      const d2 = new Domain({ prod_env_id: 300 });
      expect(d2.getAuthorOrigin('prod')).toBeNull();
    });
  });

  // ── getPublishOrigin ────────────────────────────────────────────────────────

  describe('getPublishOrigin', () => {
    const d = new Domain(FULL_CFG);

    it('returns custom URL when configured (trailing slash stripped)', () => {
      expect(d.getPublishOrigin('dev')).toBe('https://dev.paylocity.com');
      expect(d.getPublishOrigin('stage')).toBe('https://stage.paylocity.com');
      expect(d.getPublishOrigin('prod')).toBe('https://www.paylocity.com');
    });

    it('strips trailing slash from custom URLs', () => {
      const d2 = new Domain({ ...FULL_CFG, prod_env_url: 'https://www.paylocity.com/' });
      expect(d2.getPublishOrigin('prod')).toBe('https://www.paylocity.com');
    });

    it('falls back to cloud origin when no custom URL', () => {
      const d2 = new Domain({ program_id: 1234, prod_env_id: 300 });
      expect(d2.getPublishOrigin('prod'))
        .toBe('https://publish-p1234-e300.adobeaemcloud.com');
    });

    it('defaults to prod', () => {
      expect(d.getPublishOrigin()).toBe('https://www.paylocity.com');
    });
  });

  // ── getPreviewOrigin ────────────────────────────────────────────────────────

  describe('getPreviewOrigin', () => {
    const d = new Domain(FULL_CFG);

    it('returns custom prod preview URL when configured', () => {
      expect(d.getPreviewOrigin('prod')).toBe('https://preview.paylocity.com');
      expect(d.getPreviewOrigin()).toBe('https://preview.paylocity.com');
    });

    it('falls back to cloud preview origin when no custom prod preview URL', () => {
      const d2 = new Domain({ program_id: 1234, prod_env_id: 300 });
      expect(d2.getPreviewOrigin('prod'))
        .toBe('https://preview-p1234-e300.adobeaemcloud.com');
    });

    it('uses cloud origin for dev/stage (no custom preview for those)', () => {
      expect(d.getPreviewOrigin('dev'))
        .toBe('https://preview-p1234-e100.adobeaemcloud.com');
      expect(d.getPreviewOrigin('stage'))
        .toBe('https://preview-p1234-e200.adobeaemcloud.com');
    });
  });

  // ── envNameForId ────────────────────────────────────────────────────────────

  describe('envNameForId', () => {
    const d = new Domain(FULL_CFG);

    it('returns the env name for a known env id', () => {
      expect(d.envNameForId('100')).toBe('dev');
      expect(d.envNameForId('200')).toBe('stage');
      expect(d.envNameForId('300')).toBe('prod');
    });

    it('coerces numeric envId to string for comparison', () => {
      expect(d.envNameForId(100)).toBe('dev');
    });

    it('returns null for unknown env id', () => {
      expect(d.envNameForId('999')).toBeNull();
      expect(d.envNameForId('')).toBeNull();
    });
  });

  // ── matchesUrl ──────────────────────────────────────────────────────────────

  describe('matchesUrl', () => {
    const d = new Domain(FULL_CFG);

    it('matches cloud author URLs for this program', () => {
      expect(d.matchesUrl(`${AUTHOR_PROD}/content/page`)).toBe(true);
      expect(d.matchesUrl(`${AUTHOR_STAGE}/content/page`)).toBe(true);
      expect(d.matchesUrl(`${AUTHOR_DEV}/content/page`)).toBe(true);
    });

    it('matches cloud publish URLs for this program', () => {
      expect(d.matchesUrl('https://publish-p1234-e300.adobeaemcloud.com/')).toBe(true);
    });

    it('does not match cloud URLs for a different program', () => {
      expect(d.matchesUrl('https://author-p9999-e300.adobeaemcloud.com/')).toBe(false);
    });

    it('does not match cloud URLs with unknown env id', () => {
      expect(d.matchesUrl('https://author-p1234-e999.adobeaemcloud.com/')).toBe(false);
    });

    it('matches custom publish domain URLs', () => {
      expect(d.matchesUrl('https://www.paylocity.com/products/hr')).toBe(true);
      expect(d.matchesUrl('https://dev.paylocity.com/about')).toBe(true);
    });

    it('does not match unrelated origins', () => {
      expect(d.matchesUrl('https://unrelated.example.com/')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
      expect(d.matchesUrl('not-a-url')).toBe(false);
      expect(d.matchesUrl('')).toBe(false);
    });
  });

  // ── getUrlMeta ──────────────────────────────────────────────────────────────

  describe('getUrlMeta', () => {
    const d = new Domain(FULL_CFG);

    it('returns instance and env for cloud author URLs', () => {
      expect(d.getUrlMeta(`${AUTHOR_PROD}/content/page`))
        .toEqual({ instance: 'author', env: 'prod' });
      expect(d.getUrlMeta(`${AUTHOR_DEV}/content/page`))
        .toEqual({ instance: 'author', env: 'dev' });
    });

    it('returns instance and env for cloud publish URLs', () => {
      expect(d.getUrlMeta('https://publish-p1234-e300.adobeaemcloud.com/'))
        .toEqual({ instance: 'publish', env: 'prod' });
    });

    it('returns publish instance for custom domain URLs', () => {
      expect(d.getUrlMeta('https://www.paylocity.com/products/hr'))
        .toEqual({ instance: 'publish', env: 'prod' });
      expect(d.getUrlMeta('https://dev.paylocity.com/about'))
        .toEqual({ instance: 'publish', env: 'dev' });
    });

    it('returns prod env for prodPreview custom URL', () => {
      expect(d.getUrlMeta('https://preview.paylocity.com/about'))
        .toEqual({ instance: 'publish', env: 'prod' });
    });

    it('returns null for unrecognized URLs', () => {
      expect(d.getUrlMeta('https://unrelated.example.com/')).toBeNull();
      expect(d.getUrlMeta('not-a-url')).toBeNull();
    });
  });

  // ── serialize ───────────────────────────────────────────────────────────────

  describe('serialize', () => {
    it('returns a plain object with all pre-computed origins', () => {
      const d = new Domain(FULL_CFG);
      const s = d.serialize();

      expect(s.name).toBe('Paylocity');
      expect(s.programId).toBe('1234');
      expect(s.envIds).toEqual({ dev: '100', stage: '200', prod: '300' });

      expect(s.authorOrigins.prod).toBe(AUTHOR_PROD);
      expect(s.authorOrigins.stage).toBe(AUTHOR_STAGE);
      expect(s.authorOrigins.dev).toBe(AUTHOR_DEV);

      // Custom URLs take precedence for publish origins
      expect(s.publishOrigins.prod).toBe('https://www.paylocity.com');
      expect(s.publishOrigins.dev).toBe('https://dev.paylocity.com');

      // cloudPublishOrigins are always the raw Adobe Cloud URLs
      expect(s.cloudPublishOrigins.prod).toBe('https://publish-p1234-e300.adobeaemcloud.com');

      expect(s.previewOrigins.prod).toBe('https://preview.paylocity.com');
    });

    it('returns null cloud origins for missing env ids', () => {
      const d = new Domain({ program_id: 1234 });
      const s = d.serialize();
      expect(s.authorOrigins.prod).toBeNull();
      expect(s.cloudPublishOrigins.dev).toBeNull();
    });
  });
});

// ── analyzeUrl ────────────────────────────────────────────────────────────────

describe('analyzeUrl', () => {
  const domain = new Domain(FULL_CFG);

  describe('fallback for non-AEM URLs', () => {
    it('returns all-false context for a generic website', () => {
      const ctx = analyzeUrl('https://www.google.com/');
      expect(ctx).toEqual({ isAem: false, isAuthor: false, isPublish: false, isPage: false, env: null });
    });

    it('returns all-false for null/undefined', () => {
      expect(analyzeUrl(null)).toEqual({ isAem: false, isAuthor: false, isPublish: false, isPage: false, env: null });
      expect(analyzeUrl(undefined)).toEqual({ isAem: false, isAuthor: false, isPublish: false, isPage: false, env: null });
    });

    it('returns all-false for an invalid URL string', () => {
      const ctx = analyzeUrl('not-a-url');
      expect(ctx.isAem).toBe(false);
    });
  });

  describe('local instances', () => {
    it('detects local author (localhost:4502)', () => {
      const ctx = analyzeUrl('http://localhost:4502/content/paylocity/us/en/home.html');
      expect(ctx.isAem).toBe(true);
      expect(ctx.isAuthor).toBe(true);
      expect(ctx.isPublish).toBe(false);
      expect(ctx.env).toBe('local');
    });

    it('detects local publish (localhost:4503)', () => {
      const ctx = analyzeUrl('http://localhost:4503/content/paylocity/us/en/home.html');
      expect(ctx.isAem).toBe(true);
      expect(ctx.isAuthor).toBe(false);
      expect(ctx.isPublish).toBe(true);
      expect(ctx.env).toBe('local');
    });

    it('is a page on local author with /content/paylocity/ path', () => {
      const ctx = analyzeUrl('http://localhost:4502/content/paylocity/us/en/home.html');
      expect(ctx.isPage).toBe(true);
    });

    it('is a page on local publish with non-system path', () => {
      const ctx = analyzeUrl('http://localhost:4503/products/hr/payroll');
      expect(ctx.isPage).toBe(true);
    });

    it('is not a page for system paths on local publish', () => {
      const ctx = analyzeUrl('http://localhost:4503/libs/granite/core/content/login.html');
      expect(ctx.isPage).toBe(false);
    });
  });

  describe('cloud instances (no domain config)', () => {
    it('detects cloud author', () => {
      const ctx = analyzeUrl(`${AUTHOR_PROD}/editor.html/content/paylocity/us/en/page.html`);
      expect(ctx.isAem).toBe(true);
      expect(ctx.isAuthor).toBe(true);
      expect(ctx.isPublish).toBe(false);
    });

    it('detects cloud publish', () => {
      const ctx = analyzeUrl('https://publish-p1234-e300.adobeaemcloud.com/content/paylocity/us/en/page.html');
      expect(ctx.isAem).toBe(true);
      expect(ctx.isAuthor).toBe(false);
      expect(ctx.isPublish).toBe(true);
    });

    it('detects cloud preview as publish', () => {
      const ctx = analyzeUrl('https://preview-p1234-e300.adobeaemcloud.com/content/paylocity/us/en/page.html');
      expect(ctx.isAem).toBe(true);
      expect(ctx.isPublish).toBe(true);
    });
  });

  describe('page detection', () => {
    it('is a page for /content/paylocity/ paths on author', () => {
      const ctx = analyzeUrl(`${AUTHOR_PROD}/content/paylocity/us/en/page.html`);
      expect(ctx.isPage).toBe(true);
    });

    it('is a page for editor.html paths on author', () => {
      const ctx = analyzeUrl(`${AUTHOR_PROD}/editor.html/content/paylocity/us/en/page.html`);
      expect(ctx.isPage).toBe(true);
    });

    it('is not a page for system paths on author', () => {
      const ctx = analyzeUrl(`${AUTHOR_PROD}/libs/granite/core/content/login.html`);
      expect(ctx.isPage).toBe(false);
    });

    it('is not a page for /content/dam paths', () => {
      const ctx = analyzeUrl('http://localhost:4502/content/dam/paylocity/images/logo.png');
      expect(ctx.isPage).toBe(false);
    });
  });

  describe('environment detection with domain config', () => {
    it('identifies prod environment from cloud author URL', () => {
      const ctx = analyzeUrl(`${AUTHOR_PROD}/content/page`, domain);
      expect(ctx.env).toBe('prod');
    });

    it('identifies stage environment from cloud author URL', () => {
      const ctx = analyzeUrl(`${AUTHOR_STAGE}/content/page`, domain);
      expect(ctx.env).toBe('stage');
    });

    it('identifies dev environment from cloud author URL', () => {
      const ctx = analyzeUrl(`${AUTHOR_DEV}/content/page`, domain);
      expect(ctx.env).toBe('dev');
    });

    it('identifies prod environment from custom publish domain', () => {
      const ctx = analyzeUrl('https://www.paylocity.com/products/hr', domain);
      expect(ctx.isAem).toBe(true);
      expect(ctx.isPublish).toBe(true);
      expect(ctx.env).toBe('prod');
    });

    it('identifies dev environment from custom dev publish domain', () => {
      const ctx = analyzeUrl('https://dev.paylocity.com/about', domain);
      expect(ctx.isAem).toBe(true);
      expect(ctx.env).toBe('dev');
    });

    it('leaves env null when cloud URL does not match domain config', () => {
      const ctx = analyzeUrl('https://author-p9999-e888.adobeaemcloud.com/content/page', domain);
      // Not a configured domain — no env can be determined
      expect(ctx.env).toBeNull();
    });
  });
});
