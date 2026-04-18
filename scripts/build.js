#!/usr/bin/env node
'use strict';

/**
 * Build script — produces browser-specific distributions in target/.
 *
 * Usage:
 *   node scripts/build.js            # dev build (unpacked only)
 *   node scripts/build.js --release  # dev build + submission ZIPs
 */

const fs    = require('fs');
const path  = require('path');
const zlib  = require('zlib');
const { execSync } = require('child_process');

const ROOT    = path.resolve(__dirname, '..');
const TARGET  = path.join(ROOT, 'target');
const RELEASE = process.argv.includes('--release');

// ── Helpers ───────────────────────────────────────────────────────────────────

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function copyRecursive(src, dest, excludes) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const base = path.basename(src);
    if (excludes.includes(base)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child), excludes);
    }
  } else {
    const base = path.basename(src);
    if (excludes.includes(base)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// ── PNG icon generation ───────────────────────────────────────────────────────
// Generates solid-colour PNG files without any npm dependency.
// Uses only Node's built-in `zlib` module for DEFLATE compression.

const CRC_TABLE = new Uint32Array(256);
(function buildCrcTable() {
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    CRC_TABLE[i] = c;
  }
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t  = Buffer.from(type, 'ascii');
  const td = Buffer.concat([t, data]);
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, t, data, crc]);
}

function makePNG(size, r, g, b) {
  // Build raw scanlines: filter byte 0x00 followed by RGB triples
  const rowLen = 1 + size * 3;
  const raw    = Buffer.alloc(size * rowLen);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0;
    for (let x = 0; x < size; x++) {
      const off = y * rowLen + 1 + x * 3;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // RGB colour type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function generateIcons(dir) {
  fs.mkdirSync(dir, { recursive: true });
  // Paylocity blue: #1a4f7a → R=26 G=79 B=122
  for (const size of [16, 32, 48, 128]) {
    fs.writeFileSync(path.join(dir, `icon${size}.png`), makePNG(size, 26, 79, 122));
  }
}

// ── Build ─────────────────────────────────────────────────────────────────────

const { version } = readJson(path.join(ROOT, 'package.json'));
console.log(`Building Paylocity AEM Developer Tools v${version} …`);

// Directories / files excluded from the distribution
const EXCLUDES = [
  // Version control / editor artefacts
  '.git', '.claude', '.idea', '.DS_Store',
  // Development tooling
  'node_modules', 'scripts', 'target', 'coverage',
  'tests', 'vitest.config.js',
  'package.json', 'package-lock.json', 'yarn.lock',
  // Build-time manifests (replaced by the generated manifest.json)
  'manifest.chrome.json', 'manifest.firefox.json',
  // Documentation
  'DESIGN.md', 'REQUIREMENTS.md', 'UI.md',
];

// ── Source files to copy (everything else in ROOT) ────────────────────────────
const SOURCE_ENTRIES = fs.readdirSync(ROOT).filter(e => !EXCLUDES.includes(e));

for (const browser of ['chrome', 'firefox']) {
  const outDir     = path.join(TARGET, browser);
  const manifestSrc = path.join(ROOT, `manifest.${browser}.json`);

  // Clean output directory
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // Copy source files
  for (const entry of SOURCE_ENTRIES) {
    copyRecursive(path.join(ROOT, entry), path.join(outDir, entry), []);
  }

  // Generate placeholder icons only if the source icons folder is missing PNGs
  const srcIconsDir = path.join(ROOT, 'icons');
  const hasSrcIcons = fs.existsSync(srcIconsDir) &&
    [16, 32, 48, 128].every(s => fs.existsSync(path.join(srcIconsDir, `icon${s}.png`)));
  if (!hasSrcIcons) {
    generateIcons(path.join(outDir, 'icons'));
  }

  // Copy browser-specific manifest with version substituted
  const manifestContent = fs.readFileSync(manifestSrc, 'utf8')
    .replace(/__VERSION__/g, version);
  fs.writeFileSync(path.join(outDir, 'manifest.json'), manifestContent);

  // Substitute __FIREFOX_CONFIG_HINT__ in options.html
  const firefoxHint = browser === 'firefox' ? `
      <!-- ── Firefox back-button fix ──────────────────────────────────────── -->
      <section class="firefox-hint">
        <h2>Firefox: Back Button Fix</h2>
        <p class="section-hint">
          If the browser back button stops working after using this extension,
          a Firefox configuration change is needed:
        </p>
        <ol>
          <li>Open a new tab and type <code>about:config</code> in the address bar, then press Enter.</li>
          <li>Accept the risk warning if prompted.</li>
          <li>Search for <code>browser.navigation.requireUserInteraction</code>.</li>
          <li>Double-click the preference to toggle its value to <code>false</code>.</li>
        </ol>
      </section>` : '';
  const optionsHtmlPath = path.join(outDir, 'options.html');
  const optionsHtmlContent = fs.readFileSync(optionsHtmlPath, 'utf8')
    .replace('__FIREFOX_CONFIG_HINT__', firefoxHint);
  fs.writeFileSync(optionsHtmlPath, optionsHtmlContent);

  // Substitute __IS_FIREFOX__ in browserUtil.js
  const browserUtilPath = path.join(outDir, 'src', 'utils', 'browserUtil.js');
  const browserUtilContent = fs.readFileSync(browserUtilPath, 'utf8')
    .replace(/__IS_FIREFOX__/g, browser === 'firefox' ? 'true' : 'false');
  fs.writeFileSync(browserUtilPath, browserUtilContent);

  console.log(`  ✓ target/${browser}/`);

  // Release: create submission ZIP
  if (RELEASE) {
    const zipPath = path.join(TARGET, `${browser}.zip`);
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    try {
      execSync(`cd "${outDir}" && zip -r "../${browser}.zip" .`, { stdio: 'inherit' });
      console.log(`  ✓ target/${browser}.zip`);
    } catch (err) {
      console.warn(`  ✗ Could not create ${browser}.zip (zip command unavailable?):`, err.message);
    }
  }
}

console.log('Build complete.');
