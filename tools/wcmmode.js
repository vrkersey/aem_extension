(function () {
    'use strict';

    const id = 'wcmmode';

    const init = (e) => {
        const currentTab = !e.currentTarget.classList.contains("new-tab-button");
        getCurrentTabUrl(function (url) {
            if (isPreviewMode(url)) {
                const destinationUrl = getAuthorUrl(url);
                currentTab ? navigateToUrl(destinationUrl) : navigateToUrlNewTab(destinationUrl);
            } else if (isEditMode(url)) {
                const destinationUrl = getPreviewUrl(url);
                currentTab ? navigateToUrl(destinationUrl) : navigateToUrlNewTab(destinationUrl);
            }
        });
    };

    document.querySelector(`.tool-button#${id}`)?.addEventListener('click', init);
    document.querySelector(`.tool-button#${id} + .new-tab-button`)?.addEventListener('click', init);
})();
