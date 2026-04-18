import { describe, it, expect } from 'vitest';
import { HelperUtils } from '../../src/utils/helperUtils.js';

const {
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
} = HelperUtils;

const AUTHOR = 'https://author-p1234-e5678.adobeaemcloud.com';
const PUBLISH = 'https://publish-p1234-e5678.adobeaemcloud.com';
const PAGE_PATH = '/content/paylocity/us/en/products/hr/payroll';

// ── CONTENT_ROOT ──────────────────────────────────────────────────────────────

describe('CONTENT_ROOT', () => {
  it('is the expected AEM content root', () => {
    expect(CONTENT_ROOT).toBe('/content/paylocity/us/en');
  });
});

// ── isSystemPath ──────────────────────────────────────────────────────────────

describe('isSystemPath', () => {
  it.each([
    ['/libs/granite/core/content/login.html',       true],
    ['/bin/querybuilder.json',                       true],
    ['/content/dam/paylocity/images/logo.png',       true],
    ['/assets.html',                                 true],
    ['/assets.html/content/dam',                     true],
    ['/system/sling/page',                           true],
    ['/crx/de/index.jsp',                            true],
    ['/etc/clientlibs/paylocity.css',                true],
    ['/mnt/override/libs/wcm/core/content/common',   true],
    ['/var/audit/com.day.cq.replication',            true],
  ])('returns true for system path %s', (path, expected) => {
    expect(isSystemPath(path)).toBe(expected);
  });

  it.each([
    ['/content/paylocity/us/en/page.html',   false],
    ['/products/hr/payroll',                 false],
    ['/',                                    false],
    ['/about-us',                            false],
  ])('returns false for non-system path %s', (path, expected) => {
    expect(isSystemPath(path)).toBe(expected);
  });
});

// ── parseCloudHostname ────────────────────────────────────────────────────────

describe('parseCloudHostname', () => {
  it.each([
    ['author-p1234-e5678.adobeaemcloud.com',  { instance: 'author',  programId: '1234', envId: '5678' }],
    ['publish-p1234-e5678.adobeaemcloud.com', { instance: 'publish', programId: '1234', envId: '5678' }],
    ['preview-p9999-e1111.adobeaemcloud.com', { instance: 'preview', programId: '9999', envId: '1111' }],
  ])('parses valid cloud hostname %s', (hostname, expected) => {
    expect(parseCloudHostname(hostname)).toEqual(expected);
  });

  it.each([
    ['www.paylocity.com'],
    ['adobeaemcloud.com'],
    ['author-notanumber-e5678.adobeaemcloud.com'],
    ['unknown-p1234-e5678.adobeaemcloud.com'],
    [''],
  ])('returns null for non-cloud hostname %s', (hostname) => {
    expect(parseCloudHostname(hostname)).toBeNull();
  });
});

// ── isLocalAuthor ─────────────────────────────────────────────────────────────

describe('isLocalAuthor', () => {
  it('returns true for localhost:4502', () => {
    expect(isLocalAuthor('http://localhost:4502/')).toBe(true);
    expect(isLocalAuthor('http://localhost:4502/content/paylocity/us/en/page.html')).toBe(true);
  });

  it('returns false for localhost:4503', () => {
    expect(isLocalAuthor('http://localhost:4503/')).toBe(false);
  });

  it('returns false for other hosts', () => {
    expect(isLocalAuthor(`${AUTHOR}/content/page.html`)).toBe(false);
    expect(isLocalAuthor('https://www.paylocity.com/')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isLocalAuthor('not-a-url')).toBe(false);
    expect(isLocalAuthor('')).toBe(false);
  });
});

// ── isLocalPublish ────────────────────────────────────────────────────────────

describe('isLocalPublish', () => {
  it('returns true for localhost:4503', () => {
    expect(isLocalPublish('http://localhost:4503/')).toBe(true);
    expect(isLocalPublish('http://localhost:4503/content/paylocity/us/en/page.html')).toBe(true);
  });

  it('returns false for localhost:4502', () => {
    expect(isLocalPublish('http://localhost:4502/')).toBe(false);
  });

  it('returns false for other hosts', () => {
    expect(isLocalPublish(`${PUBLISH}/content/page.html`)).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isLocalPublish('not-a-url')).toBe(false);
  });
});

// ── isCloudAem ────────────────────────────────────────────────────────────────

describe('isCloudAem', () => {
  it.each([
    [`${AUTHOR}/content/page.html`],
    [`${PUBLISH}/content/page.html`],
    ['https://preview-p1234-e5678.adobeaemcloud.com/'],
  ])('returns true for cloud AEM URL %s', (url) => {
    expect(isCloudAem(url)).toBe(true);
  });

  it.each([
    ['https://www.paylocity.com/'],
    ['http://localhost:4502/'],
    ['https://someother.adobeaemcloud.com/'],
    ['not-a-url'],
  ])('returns false for non-cloud URL %s', (url) => {
    expect(isCloudAem(url)).toBe(false);
  });
});

// ── isEditorMode ──────────────────────────────────────────────────────────────

describe('isEditorMode', () => {
  it('returns true for /editor.html/ prefix', () => {
    expect(isEditorMode(`${AUTHOR}/editor.html${PAGE_PATH}.html`)).toBe(true);
    expect(isEditorMode('http://localhost:4502/editor.html/content/paylocity/us/en/home.html')).toBe(true);
  });

  it('returns false when /editor.html is not followed by /', () => {
    expect(isEditorMode(`${AUTHOR}/editor.html`)).toBe(false);
  });

  it('returns false for plain content paths', () => {
    expect(isEditorMode(`${AUTHOR}${PAGE_PATH}.html`)).toBe(false);
    expect(isEditorMode(`${AUTHOR}${PAGE_PATH}.html?wcmmode=disabled`)).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isEditorMode('not-a-url')).toBe(false);
  });
});

// ── isWcmDisabled ─────────────────────────────────────────────────────────────

describe('isWcmDisabled', () => {
  it('returns true when wcmmode=disabled', () => {
    expect(isWcmDisabled(`${AUTHOR}${PAGE_PATH}.html?wcmmode=disabled`)).toBe(true);
    expect(isWcmDisabled(`${AUTHOR}${PAGE_PATH}.html?foo=bar&wcmmode=disabled`)).toBe(true);
  });

  it('returns false for other wcmmode values', () => {
    expect(isWcmDisabled(`${AUTHOR}${PAGE_PATH}.html?wcmmode=edit`)).toBe(false);
  });

  it('returns false when wcmmode param is absent', () => {
    expect(isWcmDisabled(`${AUTHOR}${PAGE_PATH}.html`)).toBe(false);
    expect(isWcmDisabled(`${AUTHOR}/editor.html${PAGE_PATH}.html`)).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isWcmDisabled('not-a-url')).toBe(false);
  });
});

// ── isJsonView ────────────────────────────────────────────────────────────────

describe('isJsonView', () => {
  it('returns true for .infinity.json suffix', () => {
    expect(isJsonView(`${AUTHOR}${PAGE_PATH}/jcr:content.infinity.json`)).toBe(true);
  });

  it('returns false for other URLs', () => {
    expect(isJsonView(`${AUTHOR}${PAGE_PATH}.html`)).toBe(false);
    expect(isJsonView(`${AUTHOR}${PAGE_PATH}.json`)).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isJsonView('not-a-url')).toBe(false);
  });
});

// ── getContentPath ────────────────────────────────────────────────────────────

describe('getContentPath', () => {
  describe('author editor URLs', () => {
    it('strips /editor.html prefix and .html suffix', () => {
      expect(getContentPath(`${AUTHOR}/editor.html${PAGE_PATH}.html`))
        .toBe(PAGE_PATH);
    });

    it('handles local author editor URLs', () => {
      expect(getContentPath(`http://localhost:4502/editor.html${PAGE_PATH}.html`))
        .toBe(PAGE_PATH);
    });
  });

  describe('JSON view URLs', () => {
    it('strips .infinity.json suffix', () => {
      expect(getContentPath(`${AUTHOR}${PAGE_PATH}/jcr:content.infinity.json`))
        .toBe(PAGE_PATH);
    });

    it('strips /jcr:content suffix', () => {
      expect(getContentPath(`${AUTHOR}${PAGE_PATH}/jcr:content`))
        .toBe(PAGE_PATH);
    });
  });

  describe('plain content URLs', () => {
    it('strips .html extension', () => {
      expect(getContentPath(`${AUTHOR}${PAGE_PATH}.html`))
        .toBe(PAGE_PATH);
    });

    it('returns path as-is when already /content/ path without .html', () => {
      expect(getContentPath(`${AUTHOR}${PAGE_PATH}`))
        .toBe(PAGE_PATH);
    });
  });

  describe('short publish paths (dispatcher-stripped)', () => {
    const opts = { contentRoot: CONTENT_ROOT };

    it('reconstructs full content path from short publish path', () => {
      expect(getContentPath('https://www.paylocity.com/products/hr/payroll', opts))
        .toBe(`${CONTENT_ROOT}/products/hr/payroll`);
    });

    it('maps root path / to the content root', () => {
      expect(getContentPath('https://www.paylocity.com/', opts))
        .toBe(CONTENT_ROOT);
    });

    it('strips trailing slash before joining', () => {
      expect(getContentPath('https://www.paylocity.com/products/hr/', opts))
        .toBe(`${CONTENT_ROOT}/products/hr`);
    });

    it('returns null for system paths even with contentRoot', () => {
      expect(getContentPath('https://www.paylocity.com/libs/granite/login', opts))
        .toBeNull();
      expect(getContentPath('https://www.paylocity.com/bin/querybuilder.json', opts))
        .toBeNull();
    });

    it('returns null for short paths without contentRoot', () => {
      expect(getContentPath('https://www.paylocity.com/products/hr')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('returns null for invalid URLs', () => {
      expect(getContentPath('not-a-url')).toBeNull();
      expect(getContentPath('')).toBeNull();
    });

    it('ignores query string and hash', () => {
      expect(getContentPath(`${AUTHOR}${PAGE_PATH}.html?foo=bar#anchor`))
        .toBe(PAGE_PATH);
    });
  });
});

// ── getOrigin ─────────────────────────────────────────────────────────────────

describe('getOrigin', () => {
  it('returns scheme + host for valid URLs', () => {
    expect(getOrigin(`${AUTHOR}/content/page.html`)).toBe(AUTHOR);
    expect(getOrigin('http://localhost:4502/content/page.html')).toBe('http://localhost:4502');
  });

  it('returns null for invalid URLs', () => {
    expect(getOrigin('not-a-url')).toBeNull();
    expect(getOrigin('')).toBeNull();
  });
});

// ── buildCloudOrigin ──────────────────────────────────────────────────────────

describe('buildCloudOrigin', () => {
  it('builds author cloud origin', () => {
    expect(buildCloudOrigin('author', '1234', '5678'))
      .toBe('https://author-p1234-e5678.adobeaemcloud.com');
  });

  it('builds publish cloud origin', () => {
    expect(buildCloudOrigin('publish', '1234', '5678'))
      .toBe('https://publish-p1234-e5678.adobeaemcloud.com');
  });

  it('builds preview cloud origin', () => {
    expect(buildCloudOrigin('preview', '1234', '5678'))
      .toBe('https://preview-p1234-e5678.adobeaemcloud.com');
  });
});

// ── buildEditorUrl ────────────────────────────────────────────────────────────

describe('buildEditorUrl', () => {
  it('builds an editor.html URL', () => {
    expect(buildEditorUrl(AUTHOR, PAGE_PATH))
      .toBe(`${AUTHOR}/editor.html${PAGE_PATH}.html`);
  });

  it('is parseable by isEditorMode', () => {
    expect(isEditorMode(buildEditorUrl(AUTHOR, PAGE_PATH))).toBe(true);
  });
});

// ── buildWcmDisabledUrl ───────────────────────────────────────────────────────

describe('buildWcmDisabledUrl', () => {
  it('builds a wcmmode=disabled URL', () => {
    expect(buildWcmDisabledUrl(AUTHOR, PAGE_PATH))
      .toBe(`${AUTHOR}${PAGE_PATH}.html?wcmmode=disabled`);
  });

  it('is detected by isWcmDisabled', () => {
    expect(isWcmDisabled(buildWcmDisabledUrl(AUTHOR, PAGE_PATH))).toBe(true);
  });
});

// ── buildContentHtmlUrl ───────────────────────────────────────────────────────

describe('buildContentHtmlUrl', () => {
  it('builds a plain .html content URL', () => {
    expect(buildContentHtmlUrl(AUTHOR, PAGE_PATH))
      .toBe(`${AUTHOR}${PAGE_PATH}.html`);
  });

  it('does not include wcmmode param', () => {
    const url = buildContentHtmlUrl(AUTHOR, PAGE_PATH);
    expect(url).not.toContain('wcmmode');
  });
});

// ── buildPublishUrl ───────────────────────────────────────────────────────────

describe('buildPublishUrl', () => {
  it('concatenates origin and path', () => {
    expect(buildPublishUrl(PUBLISH, PAGE_PATH))
      .toBe(`${PUBLISH}${PAGE_PATH}`);
  });
});

// ── buildDamUrl ───────────────────────────────────────────────────────────────

describe('buildDamUrl', () => {
  it('builds the DAM assets URL', () => {
    expect(buildDamUrl(AUTHOR))
      .toBe(`${AUTHOR}/assets.html/content/dam`);
  });
});

// ── buildManagePublicationUrl ─────────────────────────────────────────────────

describe('buildManagePublicationUrl', () => {
  it('builds the manage publication wizard URL with encoded item param', () => {
    const url = buildManagePublicationUrl(AUTHOR, PAGE_PATH);
    expect(url).toContain('/mnt/override/libs/wcm/core/content/common/managepublicationwizard.html');
    expect(url).toContain(`item=${encodeURIComponent(PAGE_PATH)}`);
    expect(url.startsWith(AUTHOR)).toBe(true);
  });

  it('encodes special characters in the path', () => {
    const pathWithSpecials = '/content/paylocity/us/en/page with spaces';
    const url = buildManagePublicationUrl(AUTHOR, pathWithSpecials);
    expect(url).toContain(encodeURIComponent(pathWithSpecials));
    expect(url).not.toContain(' ');
  });
});

// ── buildJsonUrl ──────────────────────────────────────────────────────────────

describe('buildJsonUrl', () => {
  it('builds a jcr:content.infinity.json URL', () => {
    expect(buildJsonUrl(AUTHOR, PAGE_PATH))
      .toBe(`${AUTHOR}${PAGE_PATH}/jcr:content.infinity.json`);
  });

  it('is detected by isJsonView', () => {
    expect(isJsonView(buildJsonUrl(AUTHOR, PAGE_PATH))).toBe(true);
  });
});

// ── buildCacheBustUrl ─────────────────────────────────────────────────────────

describe('buildCacheBustUrl', () => {
  it('adds a cache-buster query parameter', () => {
    const url = buildCacheBustUrl(`${AUTHOR}${PAGE_PATH}.html`);
    const busted = new URL(url);
    const param = busted.searchParams.get('cache-buster');
    expect(param).not.toBeNull();
    expect(Number(param)).toBeGreaterThanOrEqual(100000);
    expect(Number(param)).toBeLessThan(1000000);
  });

  it('preserves other query parameters', () => {
    const input = `${AUTHOR}${PAGE_PATH}.html?foo=bar`;
    const url = buildCacheBustUrl(input);
    expect(new URL(url).searchParams.get('foo')).toBe('bar');
  });

  it('replaces an existing cache-buster param', () => {
    const input = `${AUTHOR}${PAGE_PATH}.html?cache-buster=123456`;
    const url = buildCacheBustUrl(input);
    const busted = new URL(url);
    expect(busted.searchParams.get('cache-buster')).not.toBe('123456');
  });

  it('returns the original URL when input is invalid', () => {
    expect(buildCacheBustUrl('not-a-url')).toBe('not-a-url');
  });

  it('produces different values on successive calls', () => {
    const url = `${AUTHOR}${PAGE_PATH}.html`;
    const results = new Set(
      Array.from({ length: 20 }, () =>
        new URL(buildCacheBustUrl(url)).searchParams.get('cache-buster')
      )
    );
    // Very unlikely (but not impossible) that all 20 values are identical
    expect(results.size).toBeGreaterThan(1);
  });
});
