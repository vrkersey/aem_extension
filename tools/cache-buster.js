(function(){"use strict";const id="cache-buster";const init=e=>{const currentTab=!e.currentTarget.classList.contains("new-tab-button");getCurrentTabUrl((function(url){const randomNumber=Math.floor(1e5+Math.random()*9e5);const destinationUrl=new URL(url);destinationUrl.searchParams.set(id,randomNumber.toString());currentTab?navigateToUrl(destinationUrl.toString()):navigateToUrlNewTab(destinationUrl.toString())}))};document.querySelector(`.tool-button#${id}`)?.addEventListener("click",init);document.querySelector(`.tool-button#${id} + .new-tab-button`)?.addEventListener("click",init)})();