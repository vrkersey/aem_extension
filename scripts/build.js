#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mode = process.argv[2]; // dev | release

if (!['dev', 'release'].includes(mode)) {
    console.error('Usage: node scripts/build.js <dev|release>');
    process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'target');

const EXCLUDE = new Set([
    'manifest.chrome.json',
    'manifest.firefox.json',
    'scripts',
    'target',
    'node_modules',
    '.git',
    '.gitignore',
    '.idea',
    '.github',
    'package.json',
    '.DS_Store'
]);

const BROWSERS = [
    { name: 'chrome', manifest: 'manifest.chrome.json' },
    { name: 'firefox', manifest: 'manifest.firefox.json' }
];


const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')
);

const VERSION = pkg.version;

function cleanDir(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });

    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (EXCLUDE.has(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        entry.isDirectory()
            ? copyRecursive(srcPath, destPath)
            : fs.copyFileSync(srcPath, destPath);
    }
}

cleanDir(TARGET);

for (const browser of BROWSERS) {
    const outDir = path.join(TARGET, browser.name);

    console.log(`\n▶ Building ${browser.name} (${mode})`);

    cleanDir(outDir);

    // Copy all extension source files
    copyRecursive(ROOT, outDir);

    // Inject correct manifest
    const manifestPath = path.join(ROOT, browser.manifest);
    const manifestOut = path.join(outDir, 'manifest.json');

    let manifest = fs.readFileSync(manifestPath, 'utf-8');
    manifest = manifest.replace(/__VERSION__/g, VERSION);

    fs.writeFileSync(manifestOut, manifest);

    if (mode === 'release') {
        const zipPath = path.join(TARGET, `${browser.name}.zip`);

        console.log(`📦 Zipping ${browser.name}.zip`);

        execSync(`zip -r ${zipPath} .`, {
            cwd: outDir,
            stdio: 'inherit'
        });
    }
}

console.log('\n✅ Build complete');
