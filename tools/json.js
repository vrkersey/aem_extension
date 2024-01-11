(function () {
    'use strict';

    const id = 'json';
    const init = () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            let url = isEditMode(tab.url) ? getPreviewUrl(tab.url) : tab.url;
            url = url.split("?")[0];
            url = url.replace(URL_CONSTANTS.authSuffix, ".infinity.json")
            navigateToUrl(tab.id, url.toString());
        });
    };

    document.querySelector(`.tool-button#${id}`).addEventListener('click', init);
})();