(function () {
    'use strict';

    const id = 'manage-publication';

    const wizardPath = "/mnt/override/libs/wcm/core/content/common/managepublicationwizard.html";

    function getManagePublicationUrl(currentDomain, publishItemPaths) {
        const url = currentDomain.authorUrl;
        const urlObj = new URL(url);
        urlObj.pathname = wizardPath;
        if (publishItemPaths) {
            publishItemPaths.forEach(itemPath => {
                const path = itemPath.replaceAll(URL_CONSTANTS.authSuffix, '');
                urlObj.searchParams.append('item', path)
            })
        }
        return urlObj.toString();
    }

    function modifyDOM() {
        const iframeElement = document.querySelector("iframe[name='Main Content']");
        const documentElement = iframeElement ? iframeElement.contentDocument : document;
        const contentPaths = [];
        const checkedItems = documentElement.querySelectorAll("coral-checkbox._coral-Checkbox[checked]");
        for (let i = 0; i < checkedItems.length; i++) {
            const parentNode = checkedItems[i].closest("[data-granite-collection-item-id]");
            let contentPath = parentNode.getAttribute("data-granite-collection-item-id");
            contentPaths.push(contentPath);
        }
        return contentPaths;
    }

    const init = () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            const url = new URL(tab.url);
            const domain = findCurrentDomain(tab.url);

            if (tab.url.includes(URL_CONSTANTS.authPrefix)
                || tab.url.includes(URL_CONSTANTS.assetDetail)
                || url.pathname.startsWith(URL_CONSTANTS.contentPath)
                || tab.url.includes(URL_CONSTANTS.assetDetail)) {
                const contentPath = getContentPath(tab.url);
                const finalUrl = getManagePublicationUrl(domain, [contentPath]);
                domain.uiEnabled ? navigateToUrlNewTab(finalUrl) : navigateToUrl(tab.id, finalUrl);
            } else if (tab.url.includes(AEM_ADMIN_CONSOLES.sites)
                || tab.url.includes(AEM_ADMIN_CONSOLES.assets)
                || tab.url.includes(AEM_ADMIN_CONSOLES.xfs)) {
                chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    func: modifyDOM
                }, (results) => {
                    const contentPaths = results[0].result;
                    const finalUrl = getManagePublicationUrl(domain, contentPaths);
                    domain.uiEnabled ? navigateToUrlNewTab(finalUrl) : navigateToUrl(tab.id, finalUrl);
                });
            } else {
                const finalUrl = getManagePublicationUrl(domain, []);
                domain.uiEnabled ? navigateToUrlNewTab(finalUrl) : navigateToUrl(tab.id, finalUrl);
            }
        });
    };

    document.querySelector(`.tool-button#${id}`).addEventListener('click', init);
})();