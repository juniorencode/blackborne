import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = fileURLToPath(new URL('.', import.meta.url));
const pkg = createRequire(import.meta.url)('./package.json') as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/*
 * A library bundles none of its dependencies: shipping a second copy of React
 * Aria would be weight the consumer cannot deduplicate.
 *
 * The list comes from what package.json actually declares, so adding a
 * dependency cannot silently start bundling it.
 *
 * Matched by exact name or by subpath — that is how `react/jsx-runtime` gets
 * excluded. Deliberately NOT a "does it start with a dot" predicate: on
 * Windows a resolved relative import arrives as `C:/...` and such a predicate
 * externalises the library's own modules, which produces a build that looks
 * successful and contains nothing.
 */
const externalNames = [
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.dependencies ?? {})
];

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Types come from tsc and CSS from the Tailwind CLI, so this step must not
    // wipe what they wrote.
    emptyOutDir: false,
    /*
     * NEITHER MINIFIED NOR MAPPED, and the two decisions are one decision.
     *
     * A library is an input to somebody else's bundler, and that bundler
     * minifies the application. Minifying here buys the end user nothing and
     * costs them the only thing a stack trace has: names. Measured on this
     * package:
     *
     * | What is published    | Tarball  | index.js | An identifier reads |
     * | -------------------- | -------- | -------- | ------------------- |
     * | minified, with a map | 398.8 kB | 149.3 kB | `cs`, `lc`, `L`     |
     * | minified, no map     | 113.4 kB | 155.7 kB | `cs`, `lc`, `L`     |
     * | neither              | 165.4 kB | 304.1 kB | `useConfig`         |
     *
     * The source map was two thirds of the download — 967 kB of it, raw — and
     * it existed to undo the minification on the line above. Dropping it alone
     * gives the middle row, which is the SMALLEST of the three and the only
     * one nobody can debug; the 52 kB between it and the last row is what
     * names cost, and it is the trade this makes on purpose.
     *
     * The intermediate file doubles, and that is the rest of the cost: 304 kB
     * reaches the consumer's bundler instead of 156, and what reaches their
     * user is whatever their own minifier produces, which is the same either
     * way. It is only a runtime cost to a consumer who ships unminified.
     *
     * `react-aria` and `react-aria-components` — the packages this one is
     * built on — publish exactly this shape: unminified, no source map.
     * Measured in node_modules rather than assumed.
     */
    sourcemap: false,
    minify: false,
    lib: {
      entry: resolve(here, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: id =>
        externalNames.some(name => id === name || id.startsWith(name + '/'))
    }
  }
});
