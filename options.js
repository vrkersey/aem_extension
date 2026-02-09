(function () {
    import('./src/utils/browserUtil.js').then(({StorageUtil, CONFIG_VERSION}) => {
        const form = document.getElementById("options");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = new FormData(e.target);
            const json = Object.fromEntries(data.entries());

            const normalizeUrl = (value) => {
                if (!value) return value;

                let url = value.trim();

                if (!url.startsWith("https://")) {
                    url = `https://${url.replace(/^https?:\/\//, "")}`;
                }

                if (url.endsWith("/")) {
                    url.substring(0, url.length - 1);
                }

                return url;
            };

            Object.keys(json).forEach((key) => {
                if (key.endsWith("_env_url") || key.endsWith("_prev_url")) {
                    json[key] = normalizeUrl(json[key]);
                }
            });

            json['configVersion'] = CONFIG_VERSION;
            await StorageUtil.clear();
            await StorageUtil.set(json);

            window.close();
        });

        const restoreOptions = async () => {
            const result = await StorageUtil.get();

            for (const [key, value] of Object.entries(result)) {
                if (value) {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (!input) continue;

                    if (input.type === "text" || input.type === "number") {
                        input.value = value;
                    } else if (input.type === "checkbox") {
                        input.checked = true;
                    }
                }
            }
        };

        restoreOptions();
    });
})();
