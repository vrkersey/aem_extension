import { BrowserUtil } from '../utils/browserUtil.js';
import { Helpers, URL_CONSTANTS } from '../utils/helperUtils.js';

(function () {
    'use strict';

    const id = 'json';
    async function init(button, currentTab) {
        const state = await BrowserUtil.getState();
        const path = Helpers.getPagePath(state);
        let destinationUrl;
        if (path.includes("jcr:content") && path.endsWith(".json")) {
            destinationUrl = state.domain.authorUrl + URL_CONSTANTS.authPrefix + path.substring(0, path.indexOf("/jcr:content")) + ".html";
        } else {
            destinationUrl = state.domain.authorUrl + path + "/jcr:content.infinity.json";
        }
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }
    Helpers.registerToolButtons(id, init);
})();
