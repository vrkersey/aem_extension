const jsTools = ["cache-buster.js", "go-to.js", "json.js", "publish.js", "wcmmode.js", "toggle-client.js"];

const ADOBE_ENVIRONMENT_DOMAINS = {
    experience: "https://experience.adobe.com/#/",
    admin_console: "https://adminconsole.adobe.com"
};

class Domain {
    constructor(programId, environmentId, authorHref, publishHref, previewHref) {
        this.programId = programId;
        this.environmentId = environmentId;
        this.authorHref = authorHref;
        this.publishHref = publishHref;
        this.previewHref = previewHref;
    }

    get defaultAuthorUrl() {
        return `https://author-p${this.programId}-e${this.environmentId}.adobeaemcloud.com`;
    }

    get authorUrl() {
        return this.authorHref ? this.authorHref : this.defaultAuthorUrl;
    }

    get defaultPublishUrl() {
        return `https://publish-p${this.programId}-e${this.environmentId}.adobeaemcloud.com`;
    }

    get publishUrl() {
        return this.publishHref ? this.publishHref : this.defaultPublishUrl;
    }

    get defaultPreviewUrl() {
        return `https://preview-p${this.programId}-e${this.environmentId}.adobeaemcloud.com`;
    }

    get previewUrl() {
        return this.previewHref ? this.previewHref : this.defaultPreviewUrl;
    }

    isPublish(url) {
        return !!url.match(this.defaultPublishUrl) || !!url.match(this.publishUrl) || !!url.match(this.defaultPreviewUrl) || !!url.match(this.previewUrl);
    }

    isAuthor(url) {
        return !!url.match(this.defaultAuthorUrl) || url.match(this.authorUrl);
    }

    isDomain(url) {
        return this.isAuthor(url) || this.isPublish(url);
    }

    static getUnknownDomain(url) {
        const regex = /https:\/\/(?:author|publish|preview)-p(\d+)-e(\d+)\.adobeaemcloud\.com/;
        const matchResults = url.match(regex);
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

const DOMAINS = [];

const URL_CONSTANTS = {
    uiPrefix: "/ui#/aem",
    authPrefix: "/editor.html",
    contentPath: "/content/paylocity/us/en",
    authSuffix: ".html",
    uiSuffix: "?appId=aemshell",
    wcmmode: "wcmmode",
    assetDetail: "/assetdetails.html",
    cloudManager: "/cloud-manager/landing.html",
    target: "/target/activities/activityLibrary"
};

const AEM_ADMIN_CONSOLES = {
    sites: "/sites.html",
    assets: "/assets.html",
    xfs: "/aem/experience-fragments.html",
    templates: "/libs/wcm/core/content/sites/templates.html"
};

function isAemUrl(url) {
    return !!findCurrentDomain(url);
}

function isAuthor(url) {
    const domain = findCurrentDomain(url);
    return domain.isAuthor(url);
}

function isPublish(url) {
    const domain = findCurrentDomain(url);
    return domain.isPublish(url);
}

function findCurrentDomain(url) {
    return DOMAINS.find(domain => domain.isDomain(url)) || Domain.getUnknownDomain(url);
}

function getContentPath(url) {
    const urlObj = new URL(url);
    let path = urlObj.pathname;
    if (isAuthor(url)) {
        path = path + urlObj.hash;
        path = path.replace(URL_CONSTANTS.uiPrefix, "");
        path = path.replace(URL_CONSTANTS.authPrefix, "");
        path = path.replace(URL_CONSTANTS.assetDetail, "");
        path = path.split("?")[0];
        path = path.replace(URL_CONSTANTS.authSuffix, "");
    } else if (isPublish(url)) {
        path = path.replace(/\/$/, "");
        const contentPath = path.startsWith("/content") ? "" : URL_CONSTANTS.contentPath;
        path = contentPath + path;
    }
    return path;
}

function getPublishUrl(url) {
    const domain = findCurrentDomain(url);
    let contentPath = getContentPath(url);
    contentPath = contentPath.replace(URL_CONSTANTS.contentPath, "").replace(URL_CONSTANTS.authSuffix, "").replace(URL_CONSTANTS.assetDetail, "");
    let origin = domain.publishUrl;
    return domain ? origin + contentPath : "";
}

function getAuthorUrl(url) {
    const domain = findCurrentDomain(url);
    let contentPath = getContentPath(url);
    const prefix = contentPath.startsWith("/content/dam") ? URL_CONSTANTS.assetDetail : URL_CONSTANTS.authPrefix;
    const extension = contentPath.includes(".") ? "" : URL_CONSTANTS.authSuffix;
    contentPath = prefix + contentPath + extension;
    return domain ? domain.authorUrl + contentPath : "";
}

function getPreviewUrl(url) {
    const domain = findCurrentDomain(url);
    const contentPath = getContentPath(url);
    return domain.authorUrl + contentPath + `${URL_CONSTANTS.authSuffix}?${URL_CONSTANTS.wcmmode}=disabled`;
}

function isEditMode(url) {
    return isAuthor(url) && url.includes(URL_CONSTANTS.authPrefix);
}

function isPreviewMode(url) {
    let urlObj = new URL(url);
    return isAuthor(url) && (url.includes(URL_CONSTANTS.wcmmode) || urlObj.pathname.startsWith(URL_CONSTANTS.contentPath));
}

function navigateToUrlNewTab(url) {
    chrome.tabs.create({url: url});
    window.close();
}

function navigateToUrl(url) {


    chrome.tabs.query({
            active: true,
            currentWindow: true
        },
        function (tabs) {
            if (tabs.length > 0) {
                const currentTabId = tabs[0].id;
                const currentTabUrl = tabs[0].url;
                if (!currentTabUrl.startsWith('chrome://')) {
                    chrome.scripting.executeScript({
                        target: { tabId: currentTabId },
                        func: function(url) {
                            window.location = url;
                        },
                        args: [url]
                    });
                } else {
                    chrome.tabs.update(currentTabId, { url: url });
                }
                window.close();
            }
        });
}

function getCurrentTabUrl(callback) {
    chrome.tabs.query({
            active: true,
            currentWindow: true
        },
        function (tabs) {
            if (tabs.length > 0) {
                const currentTabUrl = tabs[0].url;
                callback(currentTabUrl);
            }
        });
}

function resetUI() {
    const BUTTON_SELECTOR = ".tool-button";
    const CLASSES = {
        author: "-author",
        publish: "-publish",
        aem: "-aem",
        page: "-page",
        admin: "-mode-admin",
        developer: "-mode-developer"
    };
    chrome.storage.sync.get(["mode_admin", "mode_developer"]).then((result) => {
        const isAdminMode = result.mode_admin === "on";
        const isDeveloperMode = result.mode_developer === "on";

        const buttons = document.querySelectorAll(BUTTON_SELECTOR);
        buttons.forEach((button) => {
            if (button.classList.contains(CLASSES.admin) && !isAdminMode) {
                button.closest(".button-container") ? button.closest(".button-container").remove() : button.remove();
            }
            if (button.classList.contains(CLASSES.developer) && !isDeveloperMode) {
                button.closest(".button-container") ? button.closest(".button-container").remove() : button.remove();
            }
        });
    });

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tab = tabs[0];
        const aemInstance = isAemUrl(tab.url);
        const authorInstance = aemInstance && isAuthor(tab.url);
        const publishInstance = aemInstance && isPublish(tab.url);
        const page = aemInstance && (isPreviewMode(tab.url) || isEditMode(tab.url) || isPublish(tab.url));
        const buttons = document.querySelectorAll(BUTTON_SELECTOR);

        function disableButton(button) {
            button.disabled = true;
            const newTabButton = button.closest(".button-container")?.querySelector('.new-tab-button');
            if (newTabButton) {
                newTabButton.disabled = true;
            }
        }

        buttons.forEach((button) => {
            if (button.classList.contains(CLASSES.aem) && !aemInstance) {
                disableButton(button);
            }
            if (button.classList.contains(CLASSES.author) && !authorInstance) {
                disableButton(button);
            }
            if (button.classList.contains(CLASSES.publish) && !publishInstance) {
                disableButton(button);
            }
            if (button.classList.contains(CLASSES.page) && !page) {
                disableButton(button);
            }
        });
    });
}


(function () {

    function setupDomains() {
        const environmentFormPrefix = ["dev", "stage", "prod"];
        //add local
        DOMAINS.push(Domain.getLocalDomain());

        chrome.storage.sync.get().then((result) => {
            const programName = result['program_name'];
            const adminMode = result['mode_admin'];
            if (programName && adminMode) {
                document.getElementById(`go-to-cloud-manager`).setAttribute('data-href', ADOBE_ENVIRONMENT_DOMAINS.experience + programName + URL_CONSTANTS.cloudManager);
                document.getElementById(`go-to-target`).setAttribute('data-href', ADOBE_ENVIRONMENT_DOMAINS.experience + programName + URL_CONSTANTS.target);
            }
            if (adminMode) {
                document.getElementById(`go-to-admin-console`).setAttribute('data-href', ADOBE_ENVIRONMENT_DOMAINS.admin_console);
            }
            const programId = result['program_id'];
            if (programId) {
                environmentFormPrefix.forEach(prefix => {
                    const id = result[`${prefix}_env_id`];
                    const url = result[`${prefix}_env_url`];
                    const uatUrl = result[`${prefix}_prev_url`];
                    if (id) {
                        const domain = new Domain(programId, id?.trim(), null, url?.trim(), uatUrl?.trim());
                        DOMAINS.push(domain);
                        document.getElementById(`go-to-${prefix}`).setAttribute('data-href', domain.authorUrl);
                    }
                });
            }
        });
    }

    jsTools.forEach(tool => {
        let script = document.createElement("script");
        script.src = `tools/${tool}`;
        document.head.appendChild(script);
    });

    function init() {
        setupDomains();
        resetUI();
        document.getElementById("openOptions").addEventListener('click', function() {
            chrome.runtime.openOptionsPage();
        });
    }

    if (document.readyState !== "loading") {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init);
    }
})();
