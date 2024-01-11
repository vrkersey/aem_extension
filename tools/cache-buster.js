(function () {
    'use strict';

    const id = 'cache-buster';

    const init = () => {

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            const url = new URL(tab.url);
            const randomNumber = Math.floor(100000 + Math.random() * 900000);
            url.searchParams.set(id, randomNumber.toString());
            navigateToUrl(tab.id, url.toString());
        });
    };

    document.querySelector(`.tool-button#${id}`).addEventListener('click', init);
})();