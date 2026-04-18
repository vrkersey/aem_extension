# Paylocity AEM Developer Tools — Design Document

## 1. Overview

**Paylocity AEM Developer Tools** is a cross-browser extension (Chrome and Firefox) built for the Paylocity Web Team. It provides a contextual toolbar with shortcuts for navigating, inspecting, and managing Adobe Experience Manager (AEM) pages across multiple environments (local, Dev, Stage, Production) and Adobe Experience Cloud services.

The extension is context-aware: it reads the active tab's URL on every popup open, determines what kind of AEM environment is loaded (author, publish, preview, local), and enables or disables tools accordingly. Admins and developers can unlock additional tools through mode toggles in the options page.

---

## 2. Goals

- Eliminate repetitive manual URL manipulation when moving between AEM environments.
- Provide fast access to AEM author tools (publication wizard, WCM mode toggle, cache management).
- Surface developer and admin utilities behind mode gates to avoid cluttering the UI for general users.
- Work identically on Chrome and Firefox from a single shared codebase, with browser-specific manifests generated at build time.

---

## 3. Architecture

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Popup UI                                        │   │
│  │  popup.html / popup.js / popup.css               │   │
│  │                                                  │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  aemState.js  (Domain · analyzeUrl ·       │  │   │
│  │  │               buildState)                  │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 │ tabs / storage / scripting APIs        │
│                 ▼                                        │
│  ┌──────────────┐         ┌─────────────────────────┐   │
│  │  Active Tab  │         │  Extension Storage      │   │
│  │  (AEM page)  │         │  (local + sync)         │   │
│  └──────────────┘         └─────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────┐                       │
│  │  Options Page                │                       │
│  │  options.html / options.js   │                       │
│  └──────────────────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Components

| Component | File(s) | Role |
|---|---|---|
| Popup UI | `popup.html`, `popup.js`, `popup.css` | Builds state, renders contextual toolbar, dispatches tool actions |
| AEM State | `src/utils/aemState.js` | `Domain` model, `analyzeUrl`, and `buildState` — all state logic used by the popup |
| Options page | `options.html`, `options.js`, `options.css` | Manages multi-environment configuration |
| Browser util | `src/utils/browserUtil.js` | Cross-browser API abstraction (Chrome / Firefox) |
| Helper util | `src/utils/helperUtils.js` | AEM URL construction and path extraction |
| Tools | `src/tools/*.js` | Self-contained action handlers (one file per tool) |
| Build script | `scripts/build.js` | Produces browser-specific distributions |

There is no background service worker. All state is built directly in the popup on each open.

---

## 4. State Management

### 4.1 How State is Built

When the popup opens, `buildState()` in `aemState.js` makes three browser API calls in sequence:

1. `chrome.tabs.query({ active: true, currentWindow: true })` — gets the active tab URL and ID
2. `chrome.storage.local.get(STORAGE_KEYS)` — reads user configuration
3. `chrome.permissions.contains({ permissions: ['cookies'] })` — checks cookie access

It then constructs a `Domain` object (if configured) and calls `analyzeUrl()` to derive the page context, returning a plain state object. The popup renders directly from this result — there is no caching layer, no message passing, and no stale-state risk.

### 4.2 State Shape

```js
{
  tabId: Number,               // Active tab ID
  currentUrl: String,          // Active tab URL
  modes: {
    admin: Boolean,            // Admin tools visible
    developer: Boolean,        // Developer tools visible
  },
  context: {
    isAem: Boolean,            // Active tab is an AEM instance
    isAuthor: Boolean,         // Active tab is an author instance
    isPublish: Boolean,        // Active tab is a publish/preview instance
    isPage: Boolean,           // Active tab is an AEM content page
    env: String | null,        // 'local' | 'dev' | 'stage' | 'prod' | null
  },
  hasCookiePermission: Boolean, // Cookie API available
  configured: Boolean,          // At least one domain configured
  domain: Object | null,        // Serialized Domain for current URL
}
```

### 4.3 Domain Model

A `Domain` represents one configured AEM program. It is constructed from storage config and exposes methods to:

- Build author, publish, and preview origin URLs for each environment
- Test whether a given URL belongs to the program (`matchesUrl`)
- Identify which environment and instance type a URL represents (`getUrlMeta`)
- Return a pre-computed serialized object (`serialize`) consumed by the popup and tools

URLs for each instance default to the Adobe Cloud pattern:
```
https://{author|publish|preview}-p{programId}-e{envId}.adobeaemcloud.com
```

Custom domains can override the publish/preview origins per environment.

### 4.4 State Flow

```
User opens popup
      │
      ▼
buildState() runs in popup context
  ├── tabs.query        → active tab URL + tabId
  ├── storage.local.get → user config
  └── permissions.contains → cookie access
      │
      ▼
Domain constructed + analyzeUrl() called
      │
      ▼
Popup renders UI, tool inits wired
```

---

## 5. User Interface

### 5.1 Popup

The popup opens when the extension icon is clicked. It renders a three-column grid of action buttons. Button availability depends on the current context and enabled modes.

**Left column — Page Tools**

| Button | Available when | Mode |
|---|---|---|
| Toggle Preview | Author, content page | None |
| Go to Author | Publish (any) | None |
| Go to Adobe Publish | Any AEM, non-local cloud env | None |
| Go to Publish | Author, content page | None |
| Go to DAM | Any AEM page | None |
| Cache Bypass | Publish, content page | None |
| Toggle JSON | Author, content page | Developer |

**Middle column — Advanced Tools**

| Button | Available when | Mode |
|---|---|---|
| Manage Publication | Author, content page | None |
| Client Cookie | Cookie permission granted | None |
| Purge Cache | Content page | Admin |

**Right column — Quick Links**

| Button | Available when | Mode |
|---|---|---|
| Prod Author | Extension configured | None |
| Stage Author | Extension configured | None |
| Dev Author | Extension configured | None |
| Cloud Manager | Any page | Developer |
| Adobe Target | Any page | Developer |
| Admin Console | Any page | Admin |

### 5.2 Context CSS Classes

The popup body receives CSS classes that the stylesheet uses to style buttons without individual JavaScript toggling.

| Class | Applied when |
|---|---|
| `-aem` | `context.isAem` |
| `-author` | `context.isAuthor` |
| `-publish` | `context.isPublish` |
| `-page` | `context.isPage` |
| `-mode-admin` | `modes.admin` |
| `-mode-developer` | `modes.developer` |
| `-configured` | `configured` |
| `-has-cookies` | `hasCookiePermission` |
| `-env-{local\|dev\|stage\|prod}` | `context.env` |

### 5.3 Options Page

The options page is a form with the following sections:

**Program Configuration (required)**
- Program Name (display label; defaults to blank if omitted)
- Program ID (numeric Adobe Cloud program identifier; required)

**Environment IDs (at least one required)**
- Dev Environment ID
- Stage Environment ID
- Prod Environment ID

**Custom Publish Domain URLs (optional)**
Per-environment overrides for the publish origin. When set, the custom domain is used in navigation instead of the Adobe Cloud publish hostname. The Go to Adobe Publish button always uses the raw Adobe Cloud hostname regardless.

**Mode Toggles**
- Developer Mode — unlocks Toggle JSON, Cloud Manager, Adobe Target
- Admin Mode — unlocks Purge Cache, Admin Console

### 5.4 Options Validation

Validation runs on save before writing to storage:

1. Program ID must be a positive integer.
2. At least one of Dev / Stage / Prod Environment ID must be provided.
3. Any non-empty URL field must begin with `http://` or `https://`.

Fields that fail validation are highlighted with a red border and save is blocked until corrected. Additionally, trailing slashes and path components are stripped from URL fields before storage (`getUrl()` returns `new URL(val).origin`).

---

## 6. Tool Implementations

Each tool in `src/tools/` is an IIFE that pushes an init function onto `window.__aemToolInits`. The popup calls each init with the current state object and `tabId` after rendering. Tools use `BrowserUtil.wireClick` to attach handlers that receive an `altClick` boolean (`true` for Ctrl/Cmd+click or middle-click, which opens a new tab instead of navigating the current one).

### 6.1 Tool Reference

| Tool | File | Description |
|---|---|---|
| WCM Mode Toggle | `wcmmode.js` | Switches between `/editor.html` (edit) and `?wcmmode=disabled` (preview) on Author. |
| Go To | `go-to.js` | Navigation functions for author ↔ publish, Adobe Cloud publish, DAM, environment quick-links, Cloud Manager (deep-links to configured program), Adobe Target, and Admin Console. |
| Cache Buster | `cache-buster.js` | Appends or replaces a random 6-digit `cache-buster` query parameter. |
| Manage Publication | `publish.js` | Opens the AEM Manage Publication wizard for the current content path. |
| JSON View | `json.js` | Toggles `/jcr:content.infinity.json` view; navigates back to the editor if already in JSON view. |
| Toggle Client Cookie | `toggle-client.js` | Sets or removes the `pcty_audience=client` cookie, then reloads the tab. Uses `Promise.allSettled` so a single removal failure does not abort remaining cookies. |
| Purge Cache | `purge-cache.js` | Opens the Paylocity purge-cache tool on the Author instance. On prod, passes both the live domain and `https://uat-www.paylocity.com` as targets. |

---

## 7. Cross-Browser Compatibility

The extension targets Chrome (Manifest V3) and Firefox (Manifest V3, minimum version 142). Browser differences are isolated to `BrowserUtil`.

| Behavior | Chrome | Firefox |
|---|---|---|
| Navigate current tab | `chrome.scripting.executeScript` → `location.href` | `browser.tabs.update` |
| Global API namespace | `chrome` | `browser` (Promise-based) |

`BrowserUtil` uses a build-time constant injected by the build script:
```js
const isFirefox = __IS_FIREFOX__; // replaced with true/false at build time
const api = isFirefox ? browser : chrome;
```

The build script applies two substitutions after copying source files to each browser's output directory, following the same pattern as the `__VERSION__` substitution in the manifests:

- `__IS_FIREFOX__` in `src/utils/browserUtil.js` → `true` (Firefox) or `false` (Chrome)
- `__FIREFOX_CONFIG_HINT__` in `options.html` → an instructional section (Firefox) or removed entirely (Chrome)

All tool code uses `BrowserUtil.api` exclusively; no tool file references `chrome` or `browser` directly.

A separate manifest is maintained for each browser (`manifest.chrome.json`, `manifest.firefox.json`). The build script injects the version string and copies the correct manifest as `manifest.json` into each distribution directory.

---

## 8. URL Conventions

### 8.1 Adobe Cloud URL Pattern

```
https://{instance}-p{programId}-e{envId}.adobeaemcloud.com
```

Where `instance` is one of `author`, `publish`, or `preview`.

### 8.2 AEM Path Conventions

| Path segment | Meaning |
|---|---|
| `/editor.html` | Page editor prefix (Author) |
| `/content/paylocity/us/en` | Content root — stripped when mapping to dispatcher short paths |
| `?wcmmode=disabled` | Preview mode (Author) |
| `/jcr:content.infinity.json` | Full JCR content tree |
| `/assets.html/content/dam` | Digital Asset Management |
| `/mnt/override/libs/wcm/core/content/common/managepublicationwizard.html` | Manage Publication wizard |

### 8.3 Dispatcher Short Paths

On Publish, the dispatcher strips the `/content/paylocity/us/en` content root prefix. The extension reconstructs full AEM content paths from these short paths when needed (e.g. for Go to Author, Purge Cache).

---

## 9. Configuration Storage

All keys are stored in `chrome.storage.local`. On first save, keys are also written to `chrome.storage.sync` for cross-device availability.

| Key | Type | Description |
|---|---|---|
| `configVersion` | Number | Schema version (current: `2`) |
| `programName` | String | Display name shown in the popup label |
| `program_id` | Number | Adobe Cloud program identifier |
| `dev_env_id` | Number | Dev environment ID |
| `stage_env_id` | Number | Stage environment ID |
| `prod_env_id` | Number | Prod environment ID |
| `dev_env_url` | String | Optional custom dev publish origin |
| `stage_env_url` | String | Optional custom stage publish origin |
| `prod_env_url` | String | Optional custom prod publish origin |
| `prod_prev_url` | String | Optional custom prod preview origin |
| `mode_admin` | Boolean | Admin mode enabled |
| `mode_developer` | Boolean | Developer mode enabled |

---

## 10. Build & Distribution

### 10.1 Build Script (`scripts/build.js`)

The build script is a plain Node.js script with no bundler dependency. It:

1. Reads `version` from `package.json`.
2. Cleans and recreates `target/chrome/` and `target/firefox/`.
3. Copies all source files, excluding development artifacts: `.git`, `.claude`, `.idea`, `node_modules`, `scripts/`, `target/`, manifest source files, `package*.json`, `DESIGN.md`.
4. Copies the browser-specific manifest as `manifest.json`, substituting the `__VERSION__` placeholder.
5. In release mode (`--release` flag), creates submission ZIPs by running `zip` from within each browser's output directory so `manifest.json` sits at the archive root (required by the Chrome Web Store and Mozilla Add-ons).

### 10.2 NPM Scripts

| Command | Description |
|---|---|
| `npm run build:dev` | Produces unpacked extensions for local sideloading |
| `npm run build:release` | Produces unpacked extensions + submission ZIPs |

### 10.3 Version Management

The authoritative version is in `package.json`. It is injected into both manifests at build time via the `__VERSION__` placeholder, ensuring the extension store version and the manifest version are always in sync.

---

## 11. Permissions

| Permission | Justification |
|---|---|
| `activeTab` | Read the current tab URL to derive AEM context |
| `tabs` | Open new tabs and update tab URLs |
| `scripting` | Execute navigation scripts in the active tab (Chrome) |
| `storage` | Persist and retrieve user configuration |
| `cookies` | Read and write the `pcty_audience` audience toggle cookie |

**Host permissions** are scoped to Paylocity and Adobe domains only:
- `https://*.paylocity.com/*`
- `http://localhost:4502/*` (local AEM author)
- `http://localhost:4503/*` (local AEM publish)
- `https://*.adobeaemcloud.com/*`

---

## 12. Future Considerations

- **Multi-program support:** The current data model supports a single configured AEM program. A natural extension would allow users to store and switch between multiple program configurations.
- **Options sync conflict resolution:** The first-save-to-sync strategy is simple but could silently discard newer remote config. A proper merge or last-write-wins strategy would improve multi-device reliability.
- **Automated testing:** The tool modules and all URL utilities are pure functions of state and URL, making them straightforward candidates for unit tests without browser APIs.
