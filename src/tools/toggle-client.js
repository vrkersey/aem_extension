import { BrowserUtil } from '../utils/browserUtil.js';
import { Helpers } from '../utils/helperUtils.js';

(function () {
    'use strict';

    const id = 'toggle-client-cookie';

    async function init() {
        const state = await BrowserUtil.getState();
        await BrowserUtil.toggleClientCookie();
        await BrowserUtil.updateUrl(state.currentUrl);
    }

    Helpers.registerToolButtons(id, init);
})();
