import { BrowserUtil } from '../utils/browserUtil.js';
import { Helpers } from '../utils/helperUtils.js';

(function () {
    'use strict';

    const id = 'wcmmode';

    async function init (button, currentTab) {
        const state = await BrowserUtil.getState();
        const destinationUrl = Helpers.getWcmmodeToggleUrl(state)

        if (currentTab) {
            await BrowserUtil.updateUrl(destinationUrl);
        } else {
            await BrowserUtil.newTab(destinationUrl);
        }
    }
    Helpers.registerToolButtons(id, init)
})();
