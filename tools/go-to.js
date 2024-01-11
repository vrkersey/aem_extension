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
            navigateToUrlNewTab(domain.author + path);
        });
    });

    document.querySelector(`.tool-button#go-to-dev`).addEventListener('click', function() {
        navigateToUrlNewTab(DEV_DOMAINS.author);
    });
    document.querySelector(`.tool-button#go-to-stage`).addEventListener('click', function() {
        navigateToUrlNewTab(STAGE_DOMAINS.author);
    });
    document.querySelector(`.tool-button#go-to-prod`).addEventListener('click', function() {
        navigateToUrlNewTab(PROD_DOMAINS.author);
    });
    document.querySelector(`.tool-button#go-to-cloud-manager`).addEventListener('click', function() {
        navigateToUrlNewTab(ADOBE_ENVIRONMENTS.cloud_manager);
    });
    document.querySelector(`.tool-button#go-to-admin-console`).addEventListener('click', function() {
        navigateToUrlNewTab(ADOBE_ENVIRONMENTS.admin_console);
    });
})();