(function() {

    const form = document.getElementById("options");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const json = Object.fromEntries(data.entries());
        chrome.storage.sync.clear();
        chrome.storage.sync.set(json, () => {});
        window.close();
    });

    const restoreOptions = () => {
        chrome.storage.sync.get().then((result) => {
            for (const [key, value] of Object.entries(result)) {
                if (value) {
                    const input = form.querySelector(`[name=${key}]`);
                    if (input.type === "text" || input.type === "number") {
                        input.value = value;
                    } else if (input.type === "checkbox" && input.value === "on"){
                        input.checked = true;
                    }
                }
            }
        });
    };

    document.addEventListener('DOMContentLoaded', restoreOptions);
})();