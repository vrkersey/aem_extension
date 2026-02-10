const isFirefox = typeof browser !== 'undefined';
const extension = isFirefox ? browser : chrome;

export const CONFIG_VERSION = 2;

export const StorageUtil = {
    async set(options) {
        await extension.storage.local.set(options);
    },

    async get(keys = null) {
        return await extension.storage.local.get(keys);
    },

    async clear() {
        await extension.storage.local.clear();
    },

    async isConfigured() {
        const options = await this.get();
        if (options.configVersion !== CONFIG_VERSION) {
            return false;
        }
        return Boolean(
            options.program_id
            && options.dev_env_id
            && options.stage_env_id
            && options.prod_env_id)
    },
    sync: {
        async get(keys = null) {
            return await extension.storage.sync.get(keys);
        },
        async clear() {
            await extension.storage.sync.clear();
        }
    }
};

function getCookieDomainForUrl(url) {
    const hostname = url.hostname;

    if (hostname.includes("localhost")) {
        return "localhost";
    } else if (hostname.includes('paylocity')) {
        return '.paylocity.com';
    } else {
        return hostname;
    }
}

export const BrowserUtil = {
    async newTab(url) {
        const [tab] = await extension.tabs.query({ active: true, currentWindow: true });
        if (!tab || typeof tab.index !== "number") {
            await extension.tabs.create({ url });
            return;
        }

        await extension.tabs.create({
            url,
            index: tab.index + 1,
            active: true
        });
    },

    async updateUrl(url) {
        const [tab] = await extension.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;
        if (isFirefox) {
            // Firefox has issues with back history so using default tabs api navigation instead.
            await extension.tabs.update(tab.id, { url });
            return;
        }
        if (tab.url && !tab.url.startsWith("chrome://")) {
            await extension.scripting.executeScript({
                target: { tabId: tab.id },
                func: (nextUrl) => {
                    window.location.assign(nextUrl)
                },
                args: [url]
            })
        } else {
            await extension.tabs.update((tab.id, {url}))
        }
    },
    async currentUrl() {
        const [tab] = await extension.tabs.query({ active: true, currentWindow: true });
        return tab?.url ?? null;
    },
    async hasCookiePermission(url) {
        const origins = [
            "https://*.paylocity.com/*",
            "http://localhost:4502/*",
            "http://localhost:4503/*",
            "https://*.adobeaemcloud.com/"
        ];
        return await extension.permissions.contains({ origins });
    },
    async isClient() {
        const state = await this.getState();
        const url = new URL(state.currentUrl)
        const cookie = await extension.cookies.get({name: "pcty_audience", url: url.origin});
        return cookie?.value === "client";
    },
    async toggleClientCookie() {
        const state = await this.getState();
        const url = new URL(state.currentUrl);
        const domain = getCookieDomainForUrl(url);

        const existing = await extension.cookies.get({
            name: "pcty_audience",
            url: url.origin
        });

        const newValue = existing?.value === "client" ? "" : "client";

        await extension.cookies.set({
            name: "pcty_audience",
            value: newValue,
            url: url.origin,
            domain
        });
    },
    openOptions() {
        extension.runtime.openOptionsPage();
    },
    async getState() {
        return await extension.runtime.sendMessage({ type: "GET_STATE" });
    },
    async executeInActiveTab(func, args = []) {
        const [tab] = await extension.tabs.query({active: true, currentWindow: true});
        if (!tab?.id) return;
        await extension.scripting.executeScript({
            target: {tabId: tab.id},
            func,
            args
        });
    },

    onStorageChanged(handler) {
        extension.storage.onChanged.addListener(handler);
    },

    onActiveTabChanged(handler) {
        // Fired when the active tab changes
        extension.tabs.onActivated.addListener(() => handler());

        // Fired when the URL of the active tab changes (navigation)
        extension.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (tab.active && changeInfo.url) {
                handler();
            }
        });

        // Chrome-specific: switching windows can change the active tab context
        if (!isFirefox) {
            extension.windows.onFocusChanged.addListener(() => handler());
        }
    },
    onMessage(handler) {
        extension.runtime.onMessage.addListener((msg, sender, sendResponse) => {
            handler(msg, sender, sendResponse);
            return true; // keeps the message channel open for async responses
        });
    },
};
