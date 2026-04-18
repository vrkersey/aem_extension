'use strict';

/**
 * Cross-browser API abstraction layer.
 * Isolates Chrome vs Firefox differences so tool code stays portable.
 *
 * Key difference: Chrome MV3 uses scripting.executeScript for same-session
 * navigation (keeps cookies / scroll position); Firefox uses tabs.update.
 */
const BrowserUtil = (function () {
  const isFirefox = __IS_FIREFOX__;
  const api = isFirefox ? browser : chrome;

  /**
   * Navigate the given tab to a URL.
   * Pass newTab=true (or Ctrl/Meta+click) to open in a new tab instead.
   */
  async function navigate(tabId, url, newTab) {
    if (newTab) {
      api.tabs.create({ url });
    } else if (isFirefox) {
      api.tabs.update(tabId, { url, loadReplace: false });
    } else {
      try {
        await api.scripting.executeScript({
          target: { tabId },
          func: (nextUrl) => {
            window.location.assign(nextUrl)
          },
          args: [url]
        });
      } catch (e) {
        api.tabs.update(tabId, { url });
      }
    }
    window.close();
  }

  /**
   * Open a URL in a new tab (background).
   */
  async function openTab(url) {
    return api.tabs.create({ url });
  }

  /**
   * Return the active tab in the current window, or null.
   */
  async function getActiveTab() {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  }

  /**
   * Read one or more keys from local storage.
   */
  async function storageGet(keys) {
    return api.storage.local.get(keys);
  }

  /**
   * Write data to local storage.
   */
  async function storageSet(data) {
    return api.storage.local.set(data);
  }

  /**
   * Read one or more keys from sync storage.
   */
  async function storageSyncGet(keys) {
    return api.storage.sync.get(keys);
  }

  /**
   * Write data to sync storage.
   */
  async function storageSyncSet(data) {
    return api.storage.sync.set(data);
  }

  /**
   * Check whether the extension currently holds the given permissions.
   */
  async function permissionsContains(descriptor) {
    try {
      if (api.permissions && api.permissions.contains) {
        return api.permissions.contains(descriptor);
      }
    } catch (_) {
      // ignore
    }
    return false;
  }

  /**
   * Open the extension's options page in a new tab.
   */
  function openOptionsPage() {
    api.runtime.openOptionsPage();
  }

  /**
   * Attach a unified click handler to a button that treats both
   * Ctrl/Cmd+click and middle-click as "open in new tab" (altClick=true).
   *
   * Middle clicks fire `auxclick` (not `click`) so both events are needed.
   * `e.preventDefault()` on auxclick suppresses auto-scroll on Windows.
   *
   * handler(altClick: boolean) — called with true when a new tab is wanted.
   */
  function wireClick(el, handler) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      handler(e.ctrlKey || e.metaKey);
    });
    el.addEventListener('auxclick', function (e) {
      if (e.button === 1) {
        e.preventDefault();
        handler(true);
      }
    });
  }

  return {
    isFirefox,
    api,
    navigate,
    openTab,
    getActiveTab,
    storageGet,
    storageSet,
    storageSyncGet,
    storageSyncSet,
    permissionsContains,
    openOptionsPage,
    wireClick,
  };
})();
