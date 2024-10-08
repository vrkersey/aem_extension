(function () {
    'use strict';

    const id = 'toggle-client-cookie';

    const init = () => {

        function toggleClientCookie() {

            function setAudienceCookie(audience) {
                document.cookie = `pcty_audience=${audience};domain=.paylocity.com;path=/;`
            }

            const audience = document.cookie.match(/pcty_audience=client/);
            if (audience) {
                setAudienceCookie("");
            } else {
                setAudienceCookie("client");
            }
            window.location.reload();
        }

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            const currentTabUrl = tabs[0].url;
            if (!currentTabUrl.startsWith('chrome://')) {
                chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    func: toggleClientCookie
                }, () => {
                    window.close();
                });
            }
        });
    };

    document.querySelector(`.tool-button#${id}`).addEventListener('click', init);
})();
