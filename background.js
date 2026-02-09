import { BrowserUtil, StorageUtil } from './src/utils/browserUtil.js';
import { Helpers } from "./src/utils/helperUtils.js";

// Initial state for the extension, will be built out on load and when changes are detected
let ExtensionState = {
    currentUrl: null,
    domains: [],
    modes: {
        admin: false,
        developer: false
    },
    context: {
        isAem: false,
        isAuthor: false,
        isPublish: false,
        isPage: false,
    },
    configured: false,
    domain: {
        authorUrl: null,
        publishUrl: null,
        previewUrl: null,
        object: null
    }
};

// Class representing an AEM domain, with helper methods to determine the type of domain and construct default URLs based on program and environment IDs
class Domain {
    constructor(programId, environmentId, authorHref, publishHref, previewHref) {
        this.programId = programId;
        this.environmentId = environmentId;
        this.authorHref = authorHref;
        this.publishHref = publishHref;
        this.previewHref = previewHref;
    }

    get defaultAuthorUrl() {
        return Helpers.buildDefaultAdobeCloudDomain("author", this.programId, this.environmentId);
    }

    get authorUrl() {
        return this.authorHref || this.defaultAuthorUrl;
    }

    get defaultPublishUrl() {
        return Helpers.buildDefaultAdobeCloudDomain("publish", this.programId, this.environmentId);
    }

    get publishUrl() {
        return this.publishHref || this.defaultPublishUrl;
    }

    get defaultPreviewUrl() {
        return Helpers.buildDefaultAdobeCloudDomain("preview", this.programId, this.environmentId);
    }

    get previewUrl() {
        return this.previewHref || this.defaultPreviewUrl;
    }

    // Helper methods to determine if a given URL belongs to the author, publish, or preview instance of this domain
    isAuthor(url) {
        return url?.includes(this.authorUrl);
    }
    isPublish(url) {
        return url?.includes(this.publishUrl);
    }
    isPreview(url) {
        return url?.includes(this.previewUrl);
    }

    // Helper method to determine if a given URL belongs to any instance of this domain
    isDomain(url) {
        return this.isAuthor(url) || this.isPublish(url) || this.isPreview(url);
    }

    static getUnknownDomain(url) {
        const regex = /^https:\/\/(?:author|publish|preview)-p(\d+)-e(\d+)\.adobeaemcloud\.com(?:\/|$)/;
        const matchResults = url?.match(regex);
        if (matchResults) {
            const programId = matchResults[1];
            const environmentId = matchResults[2];
            return new Domain(programId, environmentId);
        }
    }

    static getLocalDomain() {
        return new Domain(null, null, "http://localhost:4502", "http://localhost:4503", null);
    }
}

/* ---------- State building ---------- */

async function buildDomains(options) {
    const domains = [Domain.getLocalDomain()];
    const programId = options.program_id;

    if (!programId) return domains;

    ["dev", "stage", "prod"].forEach(prefix => {
        const id = options[`${prefix}_env_id`];
        if (!id) return;

        domains.push(
            new Domain(
                programId,
                id.trim(),
                Helpers.buildDefaultAdobeCloudDomain("author", programId, id.trim()),
                options[`${prefix}_env_url`]?.trim(),
                options[`${prefix}_prev_url`]?.trim()
            )
        );
    });

    return domains;
}

function findCurrentDomain(url, domains) {
    return domains.find(domain => domain.isDomain(url)) || Domain.getUnknownDomain(url);
}

function deriveContext(url, domain) {
    const isPublish = domain?.isPublish(url) || domain?.isPreview(url) || false;
    const isAuthor = domain?.isAuthor(url) || false;
    return {
        isAem: !!domain,
        isAuthor: isAuthor,
        isPublish: isPublish,
        isPage: Helpers.isAemPage(url, domain, isAuthor, isPublish),
    };
}

async function rebuildState() {
    const [url, options] = await Promise.all([
        BrowserUtil.currentUrl(),
        StorageUtil.get()
    ]);

    const domains = await buildDomains(options);
    const currentDomain = findCurrentDomain(url, domains);
    const context = url ? deriveContext(url, currentDomain) : {
        isAem: false,
        isAuthor: false,
        isPublish: false,
        isPage: false,
    };

    ExtensionState = {
        currentUrl: url,
        domains,
        context,
        modes: {
            admin: options.mode_admin === "on",
            developer: options.mode_developer === "on"
        },
        configured: StorageUtil.isConfigured(),
        domain: {
            authorUrl: currentDomain?.authorUrl,
            publishUrl: currentDomain?.publishUrl,
            previewUrl: currentDomain?.previewUrl,
            programId: currentDomain?.programId,
            environmentId: currentDomain?.environmentId,
        }
    };
}

let rebuildTimer = null;

function scheduleRebuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => {
        rebuildState();
    }, 75);
}

BrowserUtil.onActiveTabChanged(scheduleRebuild);
BrowserUtil.onStorageChanged(async (changes, area) => {
    if (area !== "local") return;
    const keys = Object.keys(changes);
    const relevant = keys.some(k =>
        k === "program_id" ||
        k === "mode_admin" ||
        k === "mode_developer" ||
        k.endsWith("_env_id") ||
        k.endsWith("_env_url") ||
        k.endsWith("_prev_url")
    );
    if (relevant) {
        await scheduleRebuild();
    }
});

BrowserUtil.onMessage(async (msg, _, sendResponse) => {
    if (msg.type === "GET_STATE") {
        sendResponse(ExtensionState);
        return;
    }

    if (msg.type === "REBUILD_STATE") {
        await rebuildState();
        sendResponse({ success: true });
    }
});

rebuildState();
