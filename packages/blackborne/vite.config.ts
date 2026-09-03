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
    sourcemap: true,
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
