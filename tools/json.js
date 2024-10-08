(function () {
    'use strict';

    const id = 'json';
    const init = (e) => {
        const currentTab = !e.currentTarget.classList.contains("new-tab-button");
        getCurrentTabUrl(function (url) {
            let destinationUrl = isEditMode(url) ? getPreviewUrl(url) : url;
            destinationUrl = destinationUrl.split("?")[0];
            destinationUrl = destinationUrl.replace(URL_CONSTANTS.authSuffix, "/jcr:content.infinity.json")
            currentTab ? navigateToUrl(destinationUrl) : navigateToUrlNewTab(destinationUrl);
        });
    };

    document.querySelector(`.tool-button#${id}`)?.addEventListener('click', init);
    document.querySelector(`.tool-button#${id} + .new-tab-button`)?.addEventListener('click', init);
})();
