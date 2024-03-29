(function (){
    'use strict';

    document.querySelector(`.tool-button#go-to-author`).addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            navigateToUrl(tab.id, getAuthorUrl(tab.url));
        });
    });
    document.querySelector(`.tool-button#go-to-publish`).addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            navigateToUrl(tab.id, getPublishUrl(tab.url));
        });
    });
    document.querySelector(`.tool-button#go-to-dam`).addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            const path = "/assets.html/content/dam/paylocity";
            const domain = findCurrentDomain(tab.url);
            navigateToUrlNewTab(domain.authorUrl + path);
        });
    });
    document.querySelectorAll(`a.tool-button[href]`).forEach(button => {
        button.addEventListener('click', function (e) {
            navigateToUrlNewTab(e.target.href);
        });
    });
})();