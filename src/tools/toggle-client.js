'use strict';

/**
 * Toggle Client Cookie
 * If no pcty_audience=client cookie exists, sets one scoped to the current
 * environment's domain.  If one (or more) already exist, removes all of them.
 * Reloads the active tab after the change so the new audience takes effect.
 *
 *   *.paylocity.com        → .paylocity.com
 *   *.adobeaemcloud.com    → .adobeaemcloud.com
 *   localhost              → localhost
 */
(function () {
  window.__aemToolInits = window.__aemToolInits || [];
  window.__aemToolInits.push(function (state, tabId) {
    const btn = document.getElementById('btn-toggle-client-cookie');
    if (!btn) return;
    btn.addEventListener('click', function () {
      toggleClientCookie(state.currentUrl, tabId);
    });
  });

  function getCookieDomain(hostname) {
    if (hostname === 'localhost') return 'localhost';
    if (hostname.endsWith('.adobeaemcloud.com')) return '.adobeaemcloud.com';
    if (hostname.endsWith('.paylocity.com') || hostname === 'paylocity.com') {
      return '.paylocity.com';
    }
    return hostname;
  }

  async function toggleClientCookie(pageUrl, tabId) {
    try {
      const url       = new URL(pageUrl);
      const cookieUrl = url.origin;
      const domain    = getCookieDomain(url.hostname);

      const existing = await BrowserUtil.api.cookies.getAll({ name: 'pcty_audience' });

      if (existing && existing.length > 0) {
        // Remove every pcty_audience cookie found.
        // Build the removal URL from each cookie's own domain so cookies scoped
        // to different domains (e.g. .paylocity.com vs .adobeaemcloud.com) are
        // all correctly removed.
        // Use allSettled so a single removal failure doesn't abort the rest.
        const results = await Promise.allSettled(existing.map(c => {
          const scheme       = c.secure ? 'https' : 'http';
          const cookieDomain = c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
          const removalUrl   = `${scheme}://${cookieDomain}${c.path || '/'}`;
          return BrowserUtil.api.cookies.remove({ url: removalUrl, name: 'pcty_audience' });
        }));
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.warn('[AEM Tools] Some pcty_audience cookies could not be removed:',
            failures.map(f => f.reason));
        }
      } else {
        await BrowserUtil.api.cookies.set({
          url:    cookieUrl,
          name:   'pcty_audience',
          value:  'client',
          domain,
          path:   '/',
          secure: true
        });
      }

      await BrowserUtil.api.tabs.reload(tabId);
      window.close();
    } catch (err) {
      console.error('[AEM Tools] toggleClientCookie failed:', err);
    }
  }
})();
