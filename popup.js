
const jsTools = ["cache-buster.js", "go-to.js", "json.js", "publish.js", "wcmmode.js", "toggle-client.js"];

const ADOBE_ENVIRONMENTS = {
    cloud_manager: "https://experience.adobe.com/#/@paylocity/cloud-manager/landing.html",
    admin_console: "https://adminconsole.adobe.com/1C931ED964795FF80A495EF3@AdobeOrg/overview"
}

const LOCAL_DOMAINS = {
    uiEnabled: false,
    author: "http://localhost:4502",
    publish: "http://localhost:4503",
    preview: "http://localhost:4503",
    cdn: "http://localhost:4503"
}

const DEV_DOMAINS = {
    uiEnabled: true,
    author: "https://author-p116368-e1156319.adobeaemcloud.com",
    publish: "https://publish-p116368-e1156319.adobeaemcloud.com",
    preview: "https://preview-p116368-e1156319.adobeaemcloud.com",
    cdn: "https://dev-www.paylocity.com"
}

const STAGE_DOMAINS = {
    uiEnabled: true,
    author: "https://author-p116368-e1156414.adobeaemcloud.com",
    publish: "https://publish-p116368-e1156414.adobeaemcloud.com",
    preview: "https://preview-p116368-e1156414.adobeaemcloud.com",
    cdn: "https://stage-www.paylocity.com"
}

const PROD_DOMAINS = {
    uiEnabled: false,
    author: "https://author-p116368-e1156320.adobeaemcloud.com",
    publish: "https://publish-p116368-e1156320.adobeaemcloud.com",
    preview: "https://uat-www.paylocity.com",
    cdn: "https://www.paylocity.com"
}

const DOMAINS = [LOCAL_DOMAINS, DEV_DOMAINS, STAGE_DOMAINS, PROD_DOMAINS];

const URL_CONSTANTS = {
    uiPrefix: "/ui#/aem",
    authPrefix: "/editor.html",
    contentPath: "/content/paylocity/us/en",
    authSuffix: ".html",
    uiSuffix: "?appId=aemshell",
    wcmmode: "wcmmode",
    assetDetail: "/assetdetails.html"
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
    return !!DOMAINS.find(domain => url.startsWith(domain.author));
}

function isPublish(url) {
    return !!DOMAINS.find(domain => url.startsWith(domain.publish) || url.startsWith(domain.preview) || url.startsWith(domain.cdn));
}

function findCurrentDomain(url) {
    return DOMAINS.find(domain => url.startsWith(domain.author) || url.startsWith(domain.publish) || url.startsWith(domain.preview) || url.startsWith(domain.cdn));
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
    let origin = domain.cdn;
    return domain ? origin + contentPath : "";
}

function getAuthorUrl(url) {
    const domain = findCurrentDomain(url);
    let contentPath = getContentPath(url);
    contentPath = URL_CONSTANTS.authPrefix + contentPath + URL_CONSTANTS.authSuffix;
    return domain ? domain.author + contentPath : "";
}

function getPreviewUrl(url) {
    const domain = findCurrentDomain(url);
    const contentPath = getContentPath(url);
    return domain.author + contentPath + `${URL_CONSTANTS.authSuffix}?${URL_CONSTANTS.wcmmode}=disabled`;
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
        page: "-page"
    }

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tab = tabs[0];
        const aemInstance = isAemUrl(tab.url);
        const authorInstance = aemInstance && isAuthor(tab.url);
        const publishInstance = aemInstance && isPublish(tab.url);
        const page = aemInstance && (isPreviewMode(tab.url) || isEditMode(tab.url) || isPublish(tab.url))
        const buttons = document.querySelectorAll(BUTTON_SELECTOR);
        buttons.forEach((button) => {
            button.disabled = false;

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
    jsTools.forEach(tool => {
        let script = document.createElement("script");
        script.src = `tools/${tool}`;
        document.head.appendChild(script);
    });

    document.readyState !== `interactive` ? resetUI() : document.addEventListener(`readystatechange`, () => {
        document.readyState === `complete` && resetUI()
    });
})();
