const jsTools = ["cache-buster.js", "go-to.js", "json.js", "publish.js", "wcmmode.js", "toggle-client.js"];

const ADOBE_ENVIRONMENT_DOMAINS = {
    experience: "https://experience.adobe.com/#/",
    admin_console: "https://adminconsole.adobe.com"
}

class Domain {
    constructor(programId, environmentId, authorHref, publishHref, previewHref) {
        this.programId = programId;
        this.environmentId = environmentId;
        this.authorHref = authorHref;
        this.publishHref = publishHref;
        this.previewHref = previewHref;
    }

    get defaultAuthorUrl() {
        return `https://author-p${this.programId}-e${this.environmentId}.adobeaemcloud.com`
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
}

const AEM_ADMIN_CONSOLES = {
    sites: "/sites.html",
    assets: "/assets.html",
    xfs: "/aem/experience-fragments.html"
}

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
    let path = urlObj.pathname
    if (isAuthor(url)) {
        path = path + urlObj.hash;
        path = path.replace(URL_CONSTANTS.uiPrefix, "");
        path = path.replace(URL_CONSTANTS.authPrefix, "");
        path = path.replace(URL_CONSTANTS.assetDetail, "");
        path = path.split("?")[0];
        path = path.replace(URL_CONSTANTS.authSuffix, "");
    } else if (isPublish(url)) {
        path = path.replace(/\/$/, "");
        path = URL_CONSTANTS.contentPath + path;
    }
    return path;
}

function getPublishUrl(url) {
    const domain = findCurrentDomain(url);
    let contentPath = getContentPath(url);
    contentPath = contentPath.replace(URL_CONSTANTS.contentPath, "").replace(URL_CONSTANTS.authSuffix, "");
    let origin = domain.publishUrl;
    return domain ? origin + contentPath : "";
}

function getAuthorUrl(url) {
    const domain = findCurrentDomain(url);
    let contentPath = getContentPath(url);
    contentPath = URL_CONSTANTS.authPrefix + contentPath + URL_CONSTANTS.authSuffix;
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

function navigateToUrl(tabId, url) {
    function documentGoToUrl(url) {
        window.location = url;
    }

    chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: documentGoToUrl,
        args: [url]
    });
    window.close();
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
    }
    chrome.storage.sync.get(["mode_admin", "mode_developer"]).then((result) => {
        const isAdminMode = result.mode_admin === "on";
        const isDeveloperMode = result.mode_developer === "on";

        const buttons = document.querySelectorAll(BUTTON_SELECTOR);
        buttons.forEach((button) => {
            if (button.classList.contains(CLASSES.admin) && !isAdminMode) {
                button.remove();
            }
            if (button.classList.contains(CLASSES.developer) && !isDeveloperMode) {
                button.remove();
            }
        });
    });

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tab = tabs[0];
        const aemInstance = isAemUrl(tab.url);
        const authorInstance = aemInstance && isAuthor(tab.url);
        const publishInstance = aemInstance && isPublish(tab.url);
        const page = aemInstance && (isPreviewMode(tab.url) || isEditMode(tab.url) || isPublish(tab.url))
        const buttons = document.querySelectorAll(BUTTON_SELECTOR);
        buttons.forEach((button) => {
            if (button.classList.contains(CLASSES.aem) && !aemInstance) {
                button.disabled = true;
            }
            if (button.classList.contains(CLASSES.author) && !authorInstance) {
                button.disabled = true;
            }
            if (button.classList.contains(CLASSES.publish) && !publishInstance) {
                button.disabled = true;
            }
            if (button.classList.contains(CLASSES.page) && !page) {
                button.disabled = true;
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
                document.getElementById(`go-to-cloud-manager`).href = ADOBE_ENVIRONMENT_DOMAINS.experience + programName + URL_CONSTANTS.cloudManager;
                document.getElementById(`go-to-target`).href = ADOBE_ENVIRONMENT_DOMAINS.experience + programName + URL_CONSTANTS.target;
            }
            if (adminMode) {
                document.getElementById(`go-to-admin-console`).href = ADOBE_ENVIRONMENT_DOMAINS.admin_console;
            }
            const programId = result['program_id'];
            if (programId) {
                environmentFormPrefix.forEach(prefix => {
                    const id = result[`${prefix}_env_id`];
                    const url = result[`${prefix}_env_url`];
                    if (id) {
                        const domain = new Domain(programId, id, null, url, null)
                        DOMAINS.push(domain);
                        document.getElementById(`go-to-${prefix}`).href = domain.authorUrl;
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
    }

    document.readyState !== `interactive` ? init() : document.addEventListener(`readystatechange`, () => {
        document.readyState === `complete` && init()
    });
})();
