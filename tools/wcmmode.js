(function () {
    'use strict';

    const id = 'wcmmode';

    const init = () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            if (tab) {
                if (isPreviewMode(tab.url)) {
                    const newUrl = getAuthorUrl(tab.url);
                    navigateToUrl(tab.id, newUrl);
                } else if (isEditMode(tab.url)) {
                    const newUrl = getPreviewUrl(tab.url);
                    navigateToUrl(tab.id, newUrl);
                }
            }
        });
    };

    document.querySelector(`.tool-button#${id}`).addEventListener('click', init);
})();