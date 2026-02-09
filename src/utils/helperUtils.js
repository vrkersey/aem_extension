export const URL_CONSTANTS = {
    uiPrefix: "/ui#/aem",
    authPrefix: "/editor.html",
    contentPath: "/content/paylocity/us/en",
    authSuffix: ".html",
    uiSuffix: "?appId=aemshell",
    wcmmode: "wcmmode",
    assetDetail: "/assetdetails.html",
    cloudManager: "/cloud-manager/home.html/program",
    target: "/target/activities/activityLibrary"
};

const AEM_ADMIN_CONSOLES = {
    sites: "/sites.html",
    assets: "/assets.html",
    xfs: "/aem/experience-fragments.html",
    templates: "/libs/wcm/core/content/sites/templates.html"
};

export const Helpers = {
    registerToolButtons(idPrefix, handler) {
        const toolButtons = document.querySelectorAll(`button:not([disabled])[id^="${idPrefix}"]`);
        toolButtons.forEach(button => button.addEventListener('click', (e) => {
            handler(e.currentTarget, !e.currentTarget.classList.contains("new-tab-button"))
                .finally(() => {
                  setTimeout(() => window.close(), 50)
                })
        }));
    },
    isAemPage(url, domain, isAuthor, isPublish) {
        const urlObj = new URL(url);
        const isPreviewMode = isAuthor && (urlObj?.search.includes(URL_CONSTANTS.wcmmode) || urlObj?.pathname.startsWith(URL_CONSTANTS.contentPath))
        const isEditMode = isAuthor && urlObj?.pathname.startsWith(URL_CONSTANTS.authPrefix);
        return !!domain && (isPreviewMode || isEditMode || isPublish);
    },
    getPagePath(state) {
        const urlObj = new URL(state.currentUrl);
        let path = urlObj.pathname;
        if (state.context.isAuthor) {
            path = path + urlObj.hash;
            path = path.replace(URL_CONSTANTS.uiPrefix, "");
            path = path.replace(URL_CONSTANTS.authPrefix, "");
            path = path.replace(URL_CONSTANTS.assetDetail, "");
            path = path.split("?")[0];
            path = path.replace(URL_CONSTANTS.authSuffix, "");
        } else if (state.context.isPublish) {
            path = path.replace(/\/$/, "");
            const contentPath = path.startsWith("/content") ? "" : URL_CONSTANTS.contentPath;
            path = contentPath + path;
        }
        return path;
    },
    getMappedPagePath(state) {
        const pagePath = this.getPagePath(state);
        return pagePath.replace(URL_CONSTANTS.contentPath, "");
    },
    getWcmmodeToggleUrl(state) {
        const currentUrl = new URL(state.currentUrl);
        const destinationUrl = new URL(state.domain.authorUrl);
        destinationUrl.pathname = this.getPagePath(state) + ".html";
        if (state.context.isAuthor && currentUrl?.pathname.startsWith(URL_CONSTANTS.authPrefix)) {
            destinationUrl.searchParams.set(URL_CONSTANTS.wcmmode, 'disabled');
        } else if (state.context.isAuthor && (currentUrl?.search.includes(URL_CONSTANTS.wcmmode) || currentUrl?.pathname.startsWith(URL_CONSTANTS.contentPath))){
            destinationUrl.pathname = URL_CONSTANTS.authPrefix + destinationUrl.pathname;
            currentUrl.searchParams.delete(URL_CONSTANTS.wcmmode);
            destinationUrl.search = currentUrl.search;
        }
        return destinationUrl.toString();
    },
    buildDefaultAdobeCloudDomain(environment, programId, environmentId) {
        return `https://${environment}-p${programId}-e${environmentId}.adobeaemcloud.com`
    }
}
