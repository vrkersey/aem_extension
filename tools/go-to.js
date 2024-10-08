(function (){
    'use strict';

    const goToAuthor = function (e) {
        const currentTab = !e.currentTarget.classList.contains("new-tab-button");
        getCurrentTabUrl(function (url) {
            const destinationUrl = getAuthorUrl(url);
            currentTab ? navigateToUrl(destinationUrl) : navigateToUrlNewTab(destinationUrl);
        });
    }
    document.querySelector(`.tool-button#go-to-author`)?.addEventListener('click', goToAuthor);
    document.querySelector(`.tool-button#go-to-author + .new-tab-button`)?.addEventListener('click', goToAuthor);

    const goToPublish = function(e) {
        const currentTab = !e.currentTarget.classList.contains("new-tab-button");
        getCurrentTabUrl(function (url) {
            const destinationUrl = getPublishUrl(url);
            currentTab ? navigateToUrl(destinationUrl) : navigateToUrlNewTab(destinationUrl);
        });
    }
    document.querySelector(`.tool-button#go-to-publish`)?.addEventListener('click', goToPublish);
    document.querySelector(`.tool-button#go-to-publish + .new-tab-button`)?.addEventListener('click', goToPublish);

    const goToDam = function(e) {
        const currentTab = !e.currentTarget.classList.contains("new-tab-button");
        getCurrentTabUrl(function (url) {
            const path = "/assets.html/content/dam/paylocity";
            const domain = findCurrentDomain(url);
            const destinationUrl = domain.authorUrl + path;
            currentTab ? navigateToUrl(destinationUrl) : navigateToUrlNewTab(destinationUrl);
        });
    }
    document.querySelector(`.tool-button#go-to-dam`)?.addEventListener('click', goToDam);
    document.querySelector(`.tool-button#go-to-dam + .new-tab-button`)?.addEventListener('click', goToDam);

    document.querySelectorAll(`.tool-button[data-href]`).forEach(button => {
        button.addEventListener('click', function () {
            navigateToUrl(button.getAttribute('data-href'));
        });
        button.closest(".button-container")?.querySelector(`.new-tab-button`)?.addEventListener('click', function(){
            navigateToUrlNewTab(button.getAttribute('data-href'));
        });
    });
})();
