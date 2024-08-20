(function () {
    'use strict';

    const id = 'cache-buster';

    const init = (e) => {
        const currentTab = !e.currentTarget.classList.contains("new-tab-button");
        getCurrentTabUrl(function (url){
            const randomNumber = Math.floor(100000 + Math.random() * 900000);
            const destinationUrl = new URL(url);
            destinationUrl.searchParams.set(id, randomNumber.toString());
            currentTab ? navigateToUrl(destinationUrl.toString()) : navigateToUrlNewTab(destinationUrl.toString());
        });
    };

    document.querySelector(`.tool-button#${id}`)?.addEventListener('click', init);
    document.querySelector(`.tool-button#${id} + .new-tab-button`)?.addEventListener('click', init);
})();

(function () {
    'use strict';

    const id = 'purgeCache';
    const path = '/content/api/tools/purge-cache.html';

    const init = (e) => {
        const currentTab = !e.currentTarget.classList.contains("new-tab-button");
        getCurrentTabUrl(function (url){
            const domain = findCurrentDomain(url);
            const cacheClearUrl = getPublishUrl(url);
            const destinationUrl = new URL(domain.authorUrl + path);
            destinationUrl.searchParams.set("url", cacheClearUrl);
            currentTab ? navigateToUrl(destinationUrl.toString()) : navigateToUrlNewTab(destinationUrl.toString());
        });
    };

    document.querySelector(`.tool-button#${id}`)?.addEventListener('click', init);
    document.querySelector(`.tool-button#${id} + .new-tab-button`)?.addEventListener('click', init);
})();
