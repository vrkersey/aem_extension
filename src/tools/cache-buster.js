import { BrowserUtil } from '../utils/browserUtil.js';
import { Helpers } from '../utils/helperUtils.js';

(function () {
    'use strict';

    const id = 'cache-buster';
    async function init(button, currentTab){
        const state = await BrowserUtil.getState();
        const randomNumber = Math.floor(100000 + Math.random() * 900000);
        const destinationUrl = new URL(state.currentUrl);
        destinationUrl?.searchParams.set(id, randomNumber.toString());
        currentTab ? BrowserUtil.updateUrl(destinationUrl.toString()) : BrowserUtil.newTab(destinationUrl.toString());
    }
    Helpers.registerToolButtons(id, init);
})();

(function () {
    'use strict';

    const id = 'purgeCache';
    const purgePath = '/content/api/tools/purge-cache.html';

    async function init(button, currentTab) {
        const state = await BrowserUtil.getState();
        const destinationUrl = new URL(state.domain.authorUrl + purgePath);
        destinationUrl.searchParams.set("url", state.domain.publishUrl + Helpers.getMappedPagePath(state) + "/");
        if (state.domain.previewUrl) {
            destinationUrl.searchParams.append("url", state.domain.previewUrl + Helpers.getMappedPagePath(state) + "/");
        }
        currentTab ? BrowserUtil.updateUrl(destinationUrl.toString()) : BrowserUtil.newTab(destinationUrl.toString());
    }
    Helpers.registerToolButtons(id, init);
})();
