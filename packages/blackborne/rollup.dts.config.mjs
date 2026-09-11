import { dts } from 'rollup-plugin-dts';

/*
 * ONE DECLARATION FILE, because a published `.d.ts` may not contain a relative
 * import that a consumer's TypeScript cannot follow.
 *
 * ## The failure this exists for
 *
 * `tsc` emits one `.d.ts` per module and keeps each specifier exactly as the
 * source wrote it. This package's source is resolved with
 * `moduleResolution: bundler`, where `from './components/Button'` is legal, so
 * the emitted `dist/index.d.ts` re-exported 110 extensionless relative paths.
 * ECMAScript resolution — `node16` and `nodenext`, which is what a plain
 * Node + TypeScript project uses — requires a full path with an extension and
 * cannot follow any of them.
 *
 * Measured against the built package on 2026-09-10, from a consumer:
 *
 * | Consumer setting                  | What they got                        |
 * | --------------------------------- | ------------------------------------ |
 * | `bundler`                         | real types                           |
 * | `nodenext`, `skipLibCheck: true`  | **`ButtonProps` was `any`**          |
 * | `nodenext`, `skipLibCheck: false` | 110 × TS2834, inside our own file    |
 *
 * The middle row is the dangerous one and it is why this went unnoticed: the
 * failure does not announce itself, it DEGRADES. Every prop name, every union
 * and every required field silently became unchecked, and the build kept
 * working, because the runtime half was never affected — `vite build` bundles
 * the JavaScript into a single file with no relative imports left in it.
 *
 * ## Why bundling rather than adding extensions
 *
 * The alternative is writing every source import as `'./components/Button/index.js'`,
 * which is hundreds of call sites, and which fights the rule that a component
 * is imported through its index. A declaration file with no relative imports
 * at all has nothing to resolve, so the question does not arise — and the
 * shape matches what `vite build` already does to the JavaScript.
 *
 * It also closes a smaller thing: `dist` is no longer a tree of declarations
 * that `tsc` never prunes, so a deleted module cannot leave a `.d.ts` behind
 * for a consumer to find. Two such orphans were on disk when this landed.
 *
 * The input is `.types/`, which `tsc -p tsconfig.build.json` writes and
 * nothing publishes; `dist` receives only the bundle.
 */
export default {
  input: '.types/index.d.ts',
  output: { file: 'dist/index.d.ts', format: 'es' },
  plugins: [dts()]
};
