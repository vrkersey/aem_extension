import { BrowserUtil } from './src/utils/browserUtil.js';

const jsTools = ["cache-buster.js", "go-to.js", "json.js", "publish.js", "wcmmode.js", "toggle-client.js"];

function disabledButton(button) {
    button.disabled = true;
}

function renderUI(state) {
    if (!state.configured) {
        const mainContent = document.getElementById('main-content');
        const notConfigured = document.createElement("div");
        notConfigured.innerText = "Extension is not configured. Please open the options page and configure the extension.";
        notConfigured.style.margin = "100px 20px";
        notConfigured.style.fontSize = "18px";
        if (mainContent) {
            mainContent.replaceWith(notConfigured)
        } else {
            document.body.appendChild(notConfigured);
        }
        return;
    }


    const BUTTON_SELECTOR = "button";
    const CLASSES = {
        aem: "-aem",
        author: "-author",
        publish: "-publish",
        page: "-page",
        admin: "-mode-admin",
        developer: "-mode-developer"
    };

    const { context, modes } = state;

    const buttons = document.querySelectorAll(BUTTON_SELECTOR);

    buttons.forEach(button => {
        if (button.classList.contains(CLASSES.aem) && !context.isAem) disabledButton(button);
        if (button.classList.contains(CLASSES.author) && !context.isAuthor) disabledButton(button);
        if (button.classList.contains(CLASSES.publish) && !context.isPublish) disabledButton(button);
        if (button.classList.contains(CLASSES.page) && !context.isPage) disabledButton(button);
        if (button.classList.contains(CLASSES.admin) && !modes.admin) disabledButton(button);
        if (button.classList.contains(CLASSES.developer) && !modes.developer) disabledButton(button);
    });
}

function init() {
    BrowserUtil.getState()
        .then(state => renderUI(state))
        .catch(err => {
            console.error("Failed to load state", err);
        });

    document.getElementById("openOptions")
        ?.addEventListener("click", () => BrowserUtil.openOptions());
}

function loadTools() {
    jsTools.forEach(tool => {
        let script = document.createElement("script");
        script.src = `src/tools/${tool}`;
        script.type = "module";
        script.async = true;
        document.head.appendChild(script);
    });
}

init();
loadTools();
