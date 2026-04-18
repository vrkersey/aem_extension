import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/helperUtils.js', 'src/utils/aemState.js'],
    },
  },
  plugins: [extensionModulePlugin()],
});

/**
 * Transform browser-global IIFE files into importable ES modules by
 * appending named exports. No source files are modified.
 *
 * Browser extension scripts declare top-level `const`/`class`/`function`
 * identifiers that are shared via the browser's shared script scope. In
 * Vite's ESM pipeline those same identifiers are module-scope and therefore
 * exportable once we append the export statement.
 */
function extensionModulePlugin() {
  return {
    name: 'extension-module-transform',
    transform(code, id) {
      if (id.endsWith('src/utils/helperUtils.js')) {
        return { code: code + '\nexport { HelperUtils };\n', map: null };
      }
      if (id.endsWith('src/utils/aemState.js')) {
        return {
          code: code + '\nexport { STORAGE_KEYS, Domain, analyzeUrl, buildState };\n',
          map: null,
        };
      }
    },
  };
}
