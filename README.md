

# Paylocity AEM Browser Extension

This repository contains a cross-browser (Chrome + Firefox) browser extension, with a custom Node.js build script to produce browser-specific artifacts for local development and release.

The build process:
- Injects the extension version from `package.json`
- Uses browser-specific manifest files
- Outputs unpacked builds for local testing
- Optionally produces zipped artifacts for release

---

## Project Structure

```
.
├── background.js
├── manifest.chrome.json
├── manifest.firefox.json
├── options.css
├── options.html
├── options.js
├── popup.css
├── popup.html
├── popup.js
├── src/
│   └── tools/
│       └── (tool scripts)
│   └── utils/
│       └── (importable utility scripts)
├── scripts/
│   └── build.js
├── target/
│   ├── chrome/
│   └── firefox/
├── package.json
└── README.md
```

### Key Files

- **`background.js`**  
  Background script for holding the shared state of the current tab

- **`manifest.chrome.json`**  
  Chrome-specific manifest template

- **`manifest.firefox.json`**  
  Firefox-specific manifest template

- **`options.css/html/js`**  
  Options page for configuring the extension
- 
- **`popup.css/html/js`**  
  Popup for the extension's main UI

- **`scripts/build.js`**  
  Custom build script that:
  - Copies extension files
  - Excludes development artifacts
  - Injects version into the manifest
  - Optionally zips the output

- **`target/`**  
  Generated build output (safe to delete and re-generate)

---

## Versioning

The extension version is sourced from `package.json`:

```json
{
  "version": "1.3.3"
}
```

During the build, `__VERSION__` placeholders in the manifest files are replaced automatically.

---

## Build Commands

### Development Build (Unpacked)

Creates unpacked builds for local testing:

```bash
npm run build:dev
```

Output:
```
target/
├── chrome/
└── firefox/
```

No zip files are created in dev mode.

---

### Release Build (Zipped)

Creates unpacked builds **and** zipped artifacts:

```bash
npm run build:release
```

Output:
```
target/
├── chrome/
│   └── (extension files)
├── firefox/
│   └── (extension files)
├── chrome.zip
└── firefox.zip
```

---

## Local Testing (Unpacked Extensions)

### Chrome

1. Open Chrome and navigate to:
   ```
   chrome://extensions
   ```
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select:
   ```
   target/chrome
   ```
5. The extension will load immediately
6. Changes require a rebuild + reload in `chrome://extensions`

---

### Firefox

1. Open Firefox and navigate to:
   ```
   about:debugging#/runtime/this-firefox
   ```
2. Click **Load Temporary Add-on**
3. Select **any file** inside:
   ```
   target/firefox
   ```
   (usually `manifest.json`)
4. The extension loads for the current browser session
5. Rebuild + reload after changes  

---

## Notes & Gotchas

- `target/` is fully regenerated on each build
- Files excluded from builds:
  - `node_modules`
  - `.git`
  - `.idea`
  - `.github`
  - build scripts
  - browser-specific manifest templates
- Chrome and Firefox manifests can diverge safely
- Zip creation requires `zip` to be available on your system

---

## Cleanup

To reset builds manually:

```bash
rm -rf target
```

---

## Why a Custom Build Script?

This approach avoids:
- Complex bundlers
- Browser-specific build pipelines
- Duplicate extension source trees

Instead, it favors:
- Explicit control
- Easy debugging
- Minimal magic
