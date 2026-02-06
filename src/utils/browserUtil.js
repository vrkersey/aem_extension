const isFirefox = typeof browser !== 'undefined';
const ext = isFirefox ? browser : chrome;

// Promisify chrome APIs when needed
const promisify = (fn, context) => (...args) =>
    new Promise((resolve, reject) => {
        fn.call(context, ...args, (...cbArgs) => {
            const err = ext?.runtime?.lastError;
            if (err) {
                reject(err);
                return;
            }
            resolve(cbArgs.length <= 1 ? cbArgs[0] : cbArgs);
        });
    });


const localStorage = isFirefox
    ? ext.storage.local
    : {
        get: promisify(ext.storage.local.get, ext.storage.local),
        set: promisify(ext.storage.local.set, ext.storage.local),
        clear: promisify(ext.storage.local.clear, ext.storage.local),
    };

export const StorageUtil = {
    local: {
        async set(options) {
            await localStorage.set(options);
        },

        async get(keys = null) {
            return await localStorage.get(keys);
        },

        async clear() {
            await localStorage.clear();
        }
    }
};

const tabs = isFirefox
    ? ext.tabs
    : {
        query: promisify(ext.tabs.query, ext.tabs),
        update: promisify(ext.tabs.update, ext.tabs),
        create: promisify(ext.tabs.create, ext.tabs),
    };

const scripting = (() => {
    // MV3: both Chrome and modern Firefox expose ext.scripting (Promise-based in Firefox, callback-based in Chrome).
    if (ext.scripting?.executeScript) {
        return isFirefox
            ? ext.scripting
            : { executeScript: promisify(ext.scripting.executeScript, ext.scripting) };
    }

    // Legacy Firefox: fall back to tabs.executeScript (code/file only).
    if (isFirefox && ext.tabs?.executeScript) {
        return {
            executeScript: async ({ target, func, args = [] }) => {
                const tabId = target?.tabId;
                if (!tabId) return;

                const argJson = JSON.stringify(args);
                const code = `(${func.toString()}).apply(null, ${argJson})`;
                await ext.tabs.executeScript(tabId, { code });
            }
        };
    }

    return null;
})();

export const BrowserUtil = {
    async newTab(url) {
        const [tab] = await tabs.query({ active: true, currentWindow: true });
        if (!tab || typeof tab.index !== "number") {
            await tabs.create({ url });
            return;
        }

        await tabs.create({
            url,
            index: tab.index + 1,
            active: true
        });
    },

    async updateUrl(url) {
        const [tab] = await tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;
        if (tab.url && !tab.url.startsWith("chrome://")) {
            scripting.executeScript({
                target: { tabId: tab.id },
                func: (nextUrl) => {
                    window.location.assign(nextUrl)
                },
                args: [url]
            })
        } else {
            await tabs.update((tab.id, {url}))
        }
    },

    async currentUrl() {
        const [tab] = await tabs.query({ active: true, currentWindow: true });
        return tab?.url ?? null;
    },
    openOptions() {
        ext.runtime.openOptionsPage();
    },

    async getState() {
        return await ext.runtime.sendMessage({ type: "GET_STATE" });
    },

    async executeInActiveTab(func, args = []) {
        const [tab] = await tabs.query({active: true, currentWindow: true});
        if (!tab?.id) return;
        if (!scripting?.executeScript) return;
        await scripting.executeScript({
            target: {tabId: tab.id},
            func,
            args
        });
    },

    onStorageChanged(handler) {
        ext.storage.onChanged.addListener(handler);
    },

    onActiveTabChanged(handler) {
        // Fired when the active tab changes
        ext.tabs.onActivated.addListener(() => handler());

        // Fired when the URL of the active tab changes (navigation)
        ext.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (tab.active && changeInfo.url) {
                handler();
            }
        });

        // Chrome-specific: switching windows can change the active tab context
        if (!isFirefox) {
            ext.windows.onFocusChanged.addListener(() => handler());
        }
    },
    onMessage(handler) {
        ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
            handler(msg, sender, sendResponse);
            return true; // keeps the message channel open for async responses
        });
    },
};
