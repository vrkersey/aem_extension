# Paylocity AEM Developer Tools — Business Requirements

## 1. Overview

A browser extension for Chrome and Firefox that provides contextual developer tooling for navigating and managing Paylocity AEM environments. The popup toolbar adapts to the page currently open in the active tab and exposes only the actions that are relevant to that context.

---

## 2. Context Detection

The extension inspects the active tab's URL on every popup open to determine the current context.

**AEM recognition:**
- When the active tab is `localhost:4502`, then the page is treated as a local AEM Author instance.
- When the active tab is `localhost:4503`, then the page is treated as a local AEM Publish instance.
- When the active tab hostname matches `author-p{id}-e{id}.adobeaemcloud.com`, then the page is treated as a Cloud AEM Author instance.
- When the active tab hostname matches `publish-p{id}-e{id}.adobeaemcloud.com` or `preview-p{id}-e{id}.adobeaemcloud.com`, then the page is treated as a Cloud AEM Publish/Preview instance.
- When the active tab origin matches a configured custom domain URL, then the page is treated as an AEM Publish instance for the corresponding environment.
- When none of the above conditions are met, then the page is treated as a non-AEM page.

**Page recognition (within AEM):**
- When on an Author instance and the path starts with `/content/paylocity/` or `/editor.html/content/paylocity/`, then the page is treated as a content page.
- When on a Publish instance and the path does not start with a system prefix (`/libs/`, `/bin/`, `/content/dam/`, `/assets.html`, `/system/`, `/crx/`, `/etc/`, `/mnt/`, `/var/`), then the page is treated as a content page.

**Environment detection:**
- When the URL is localhost, then the environment is `local`.
- When the Cloud URL environment ID matches the configured dev ID, then the environment is `dev`.
- When the Cloud URL environment ID matches the configured stage ID, then the environment is `stage`.
- When the Cloud URL environment ID matches the configured prod ID, then the environment is `prod`.
- When the origin matches a configured custom domain, then the environment is the matching configured environment (`dev`, `stage`, or `prod`).

---

## 3. Popup Toolbar

### 3.1 Popup State

- When the popup is opened, then the extension immediately reads the active tab URL and storage config to build state — there is no background service worker.
- When state cannot be loaded, then a user-facing error message is displayed and no tools are shown.
- When the extension is not configured, then the toolbar is hidden entirely and a notice is shown prompting the user to open Options.

### 3.2 Context Label

- When the active tab is an AEM content page on Author, then the label reads `{Program Name} — Author`.
- When the active tab is an AEM content page on Publish, then the label reads `{Program Name} — Publish`.
- When the active tab is an AEM URL but not a content page, then the label reads `AEM (non-page)`.
- When the active tab is not an AEM page, then the label reads `Not an AEM page`.

### 3.3 Button Availability

All buttons are always visible. A button is enabled only when its conditions are met; otherwise it is greyed out and non-interactive.

| Button | Enabled when |
|---|---|
| Toggle Preview | On Author, on a content page |
| Go to Author | On Publish (any instance) |
| Go to Adobe Publish | On any AEM page, in a cloud environment (not local), with a configured Cloud publish origin for that environment |
| Go to Publish | On Author, on a content page |
| Go to DAM | On any AEM page |
| Cache Bypass | On Publish, on a content page |
| Toggle JSON | Developer Mode enabled, on Author, on a content page |
| Manage Publication | On Author, on a content page |
| Client Cookie | Cookie permission is available |
| Purge Cache | Admin Mode enabled, on a content page |
| Prod / Stage / Dev Author | Extension is configured |
| Cloud Manager | Developer Mode enabled |
| Adobe Target | Developer Mode enabled |
| Admin Console | Admin Mode enabled |

### 3.4 Navigation Behaviour

- When a button is clicked normally, then the active tab navigates to the target URL.
- When a button is clicked with Ctrl/Cmd held, then the target URL opens in a new background tab.
- When a button is middle-clicked, then the target URL opens in a new background tab.

---

## 4. Page Tools

### 4.1 Toggle Preview

**Available when:** On Author, on a content page.  
**Mode required:** None

Switches between AEM editor mode and preview mode.

- When on Author in editor mode (`/editor.html/…`), then navigate to the same content path with `?wcmmode=disabled` (preview).
- When on Author in preview mode (`?wcmmode=disabled`), then navigate back to the editor (`/editor.html/…`).
- When on Author in any other view, then navigate to the editor (`/editor.html/…`).

### 4.2 Go to Author

**Available when:** On Publish (any instance).  
**Mode required:** None

Navigates from a Publish page to the Author editor for the same content path.

- When on a Cloud Publish instance whose environment ID matches the configured dev ID, then navigate to the dev Author editor for the current content path.
- When on a Cloud Publish instance whose environment ID matches the configured stage ID, then navigate to the stage Author editor for the current content path.
- When on a Cloud Publish instance whose environment ID matches the configured prod ID, then navigate to the prod Author editor for the current content path.
- When on a custom domain matching a configured environment, then navigate to the corresponding Author editor for the current content path.
- When on localhost Publish (`:4503`), then navigate to localhost Author (`:4502`) editor for the current content path.

### 4.3 Go to Adobe Publish

**Available when:** On any AEM page, in a configured non-local cloud environment.  
**Mode required:** None

Navigates to the raw Adobe Cloud Publish instance, bypassing any custom CDN domain.

- When on an AEM page in a cloud environment, then navigate to the Adobe Cloud publish origin for the same environment using the dispatcher short path (strips `/content/paylocity/us/en` prefix).

### 4.4 Go to Publish

**Available when:** On Author, on a content page.  
**Mode required:** None

Navigates from an Author page to the corresponding Publish instance.

- When on localhost Author (`:4502`), then navigate to localhost Publish (`:4503`) for the same content path.
- When on a Cloud Author instance whose environment ID matches the configured dev ID, then navigate to the configured dev publish origin for the same content path.
- When on a Cloud Author instance whose environment ID matches the configured stage ID, then navigate to the configured stage publish origin for the same content path.
- When on a Cloud Author instance whose environment ID matches the configured prod ID, then navigate to the configured prod publish origin (custom domain if set, otherwise Adobe Cloud) for the same content path.

### 4.5 Go to DAM

**Available when:** On any AEM page.  
**Mode required:** None

Navigates to the Digital Asset Manager on the current or matching Author instance.

- When on any Author instance, then navigate to `{authorOrigin}/assets.html/content/dam`.
- When on a Publish instance, then resolve the matching Author origin first, then navigate to DAM there.

### 4.6 Cache Bypass

**Available when:** On Publish, on a content page.  
**Mode required:** None

Appends a random cache-busting parameter to the current URL to bypass CDN and browser caches.

- When clicked, then navigate to the current URL with `?cache-buster={random 6-digit number}` appended (or replaced if already present).

### 4.7 Toggle JSON

**Available when:** On Author, on a content page.  
**Mode required:** Developer Mode

Toggles the JCR content JSON view for the current page on Author.

- When not in JSON view, then navigate to `{origin}{contentPath}/jcr:content.infinity.json`.
- When already in JSON view, then navigate back to the editor (`/editor.html/…`).

---

## 5. Advanced Tools

### 5.1 Manage Publication

**Available when:** On Author, on a content page.  
**Mode required:** None

Opens the AEM Manage Publication wizard for the current page.

- When on Author on a content page, then open the Manage Publication wizard at `{authorOrigin}/mnt/override/libs/wcm/core/content/common/managepublicationwizard.html?item={encodedContentPath}`.

### 5.2 Client Cookie

**Available when:** Cookie permission is granted to the extension.  
**Mode required:** None

Toggles the `pcty_audience=client` cookie, then reloads the tab.

- When no `pcty_audience` cookie exists, then set a `pcty_audience=client` cookie scoped to the appropriate domain (`.paylocity.com`, `.adobeaemcloud.com`, or `localhost`) and reload the active tab.
- When one or more `pcty_audience` cookies already exist, then remove all of them across all domains they are scoped to and reload the active tab.
- When one or more cookie removals fail, then log a warning and proceed — partial success still triggers the tab reload.

**Cookie domain scoping:**
- When the page hostname ends with `.paylocity.com` or is `paylocity.com`, then scope the cookie to `.paylocity.com`.
- When the page hostname ends with `.adobeaemcloud.com`, then scope the cookie to `.adobeaemcloud.com`.
- When the page hostname is `localhost`, then scope the cookie to `localhost`.

### 5.3 Purge Cache

**Available when:** On a content page.  
**Mode required:** Admin Mode

Opens the Paylocity custom purge-cache tool on the Author instance with the relevant publish URLs pre-filled.

- When on a prod content page, then open the purge tool with two URLs: the configured prod publish origin and the UAT origin (`https://uat-www.paylocity.com`), both using the short dispatcher path.
- When on a dev or stage content page, then open the purge tool with a single URL for that environment's publish origin using the short dispatcher path.
- When on a localhost content page, then open the purge tool with `http://localhost:4503` as the publish URL.
- When on Author, then use the current origin as the author instance for the tool URL.
- When on Publish, then resolve the author origin for the current environment.

---

## 6. Quick Links

### 6.1 Prod Author

**Available when:** Extension is configured.  
**Mode required:** None

- When clicked, then navigate to the configured prod Author instance root.

### 6.2 Stage Author

**Available when:** Extension is configured.  
**Mode required:** None

- When clicked, then navigate to the configured stage Author instance root.

### 6.3 Dev Author

**Available when:** Extension is configured.  
**Mode required:** None

- When clicked, then navigate to the configured dev Author instance root.

### 6.4 Cloud Manager

**Available when:** Any page.  
**Mode required:** Developer Mode

- When clicked and a program ID is configured, then navigate to `https://experience.adobe.com/#/cloud-manager/home.html/program/{programId}`.
- When clicked and no program ID is configured, then navigate to `https://experience.adobe.com/#/cloud-manager`.

### 6.5 Adobe Target

**Available when:** Any page.  
**Mode required:** Developer Mode

- When clicked, then navigate to `https://experience.adobe.com/#/target/activities`.

### 6.6 Admin Console

**Available when:** Any page.  
**Mode required:** Admin Mode

- When clicked, then navigate to `https://adminconsole.adobe.com/`.

---

## 7. Options Page

### 7.1 Program Configuration

- **Program Name** — Display name shown in the popup context label
- **Program ID** — Required. Numeric Adobe Cloud Manager program identifier used to construct Cloud AEM URLs.

### 7.2 Environment IDs

Numeric Adobe Cloud environment identifiers used to construct `author/publish/preview-p{programId}-e{envId}.adobeaemcloud.com` URLs.

- At least one of Dev, Stage, or Prod Environment ID must be provided.
- IDs left blank disable navigation for that environment.

### 7.3 Custom Publish Domain URLs

Optional overrides for the publish origin used in navigation. When set, the custom domain is used instead of the Adobe Cloud publish hostname for that environment.

- Applies to: Dev Publish URL, Stage Publish URL, Prod Publish URL, Prod Preview URL.
- The Cloud publish hostname is still used by the Go to Adobe Publish button regardless of custom domain configuration.

### 7.4 Mode Toggles

- **Developer Mode** — Unlocks Toggle JSON, Cloud Manager link, and Adobe Target link.
- **Admin Mode** — Unlocks Purge Cache and Admin Console link.

### 7.5 Validation

- When **Program ID** is empty or not a positive integer on save, then mark the field invalid, show an error, and block the save.
- When all three Environment IDs are empty on save, then mark all three fields invalid, show an error, and block the save.
- When a URL field contains a non-empty value that does not start with `http://` or `https://` on save, then mark all such fields invalid, show an error, and block the save.
- When a URL field contains a value with a trailing slash, then strip the trailing slash before storing.
- When a URL field contains a value with a path component, then strip the path and store only the origin (`scheme://host`).

### 7.6 Save Behaviour

- When the form is saved successfully, then write all configuration values to `chrome.storage.local` and display a `Saved!` confirmation.
- When this is the first time the form has been saved (no prior `configVersion` in storage), then also write the configuration to `chrome.storage.sync` so it is available across the user's devices.
- When **Clear All** is confirmed, then set all storage keys to `null`, reset all form fields, and display a confirmation.

### 7.7 Storage Keys

| Field | Storage key |
|---|---|
| Program Name | `programName` |
| Program ID | `program_id` |
| Dev Environment ID | `dev_env_id` |
| Stage Environment ID | `stage_env_id` |
| Prod Environment ID | `prod_env_id` |
| Dev Publish URL | `dev_env_url` |
| Stage Publish URL | `stage_env_url` |
| Prod Publish URL | `prod_env_url` |
| Prod Preview URL | `prod_prev_url` |
| Admin Mode | `mode_admin` |
| Developer Mode | `mode_developer` |
| Config Version | `configVersion` |

---

## 8. Content Path Resolution

The extension resolves AEM content paths from URLs in two modes:

- When the URL path starts with `/editor.html/content/`, then strip the `/editor.html` prefix to get the content path.
- When the URL path starts with `/content/`, then use it as-is.
- When the URL path is a short dispatcher path (does not start with `/content/`) and is not a system path, then prepend `/content/paylocity/us/en` to reconstruct the full AEM content path.
- When the URL path ends with `.html`, then strip it before using the path.
- When the URL path ends with `.infinity.json` or `/jcr:content`, then strip those suffixes before using the path.
- When the path is `/` (root), then map it to `/content/paylocity/us/en` (the site root page).
