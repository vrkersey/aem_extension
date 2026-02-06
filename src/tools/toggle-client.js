import { BrowserUtil } from '../utils/browserUtil.js';
import { Helpers } from '../utils/helperUtils.js';

(function () {
    'use strict';

    const id = 'toggle-client-cookie';

    async function init() {
        await BrowserUtil.executeInActiveTab(() => {
            function setAudienceCookie(audience) {
                document.cookie = `pcty_audience=${audience};domain=.paylocity.com;path=/;`
                document.cookie = `pcty_audience=${audience};domain=localhost;path=/;`
            }

            const audience = document.cookie.match(/pcty_audience=client/);
            if (audience) {
                setAudienceCookie("");
            } else {
                setAudienceCookie("client");
            }
            window.location.reload();
        });
    }

    Helpers.registerToolButtons(id, init);
})();
