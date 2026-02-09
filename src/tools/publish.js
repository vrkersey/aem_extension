import { BrowserUtil } from '../utils/browserUtil.js';
import { Helpers } from '../utils/helperUtils.js';

(function () {
    'use strict';

    const id = 'manage-publication';

    const wizardPath = "/mnt/override/libs/wcm/core/content/common/managepublicationwizard.html";

    async function init()  {
        const state = await BrowserUtil.getState();
        const currentPath = Helpers.getPagePath(state);
        const destinationUrl = new URL(state.domain.authorUrl + wizardPath);
        destinationUrl.searchParams.set("item", currentPath);
        BrowserUtil.updateUrl(destinationUrl.toString());
    }

    Helpers.registerToolButtons(id, init);
})();
