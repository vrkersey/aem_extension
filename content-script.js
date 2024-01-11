chrome.runtime.onMessage.addListener((media, sender, sendResponse) => {
    if (media.event === 'myTest') {
        const contentPaths = [];
        const checkedItems = document.querySelectorAll("coral-checkbox._coral-Checkbox[checked]");
        for (let i = 0; i < checkedItems.length; i++) {
            const contentPath = checkedItems[i].parentNode.querySelector("link").getAttribute("href");
            contentPaths.push(contentPath);
        }
        sendResponse({msg:document.body.innerHTML});
    }
})