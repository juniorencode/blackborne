# 0025 — The package ships one declaration file

**Status:** accepted · **Date:** 2026-09-11

## Context

`tsc` emits one `.d.ts` per module and keeps every import specifier exactly as
the source wrote it. This package's source is compiled with
`moduleResolution: bundler` (`tsconfig.base.json`), where
`from './components/Button'` is legal — so the published `dist/index.d.ts`
re-exported **110 extensionless relative paths**.

ECMAScript resolution cannot follow any of them. `node16` and `nodenext` — what
a plain Node plus TypeScript project uses, and what TypeScript recommends for
new Node projects — require a full path with an extension.

Measured from a consumer on 2026-09-10, against the built package:

| Consumer setting                  | What they got                                     |
| --------------------------------- | ------------------------------------------------- |
| `moduleResolution: bundler`       | Real types. A bogus prop errors with TS2353.      |
| `nodenext`, `skipLibCheck: true`  | **`ButtonProps` was `any`.** A bogus prop passed. |
| `nodenext`, `skipLibCheck: false` | 110 × TS2834, reported inside our own file.       |

The middle row is why nothing noticed: the failure does not announce itself,
it **degrades**. Every prop name, every union and every
required field silently became unchecked, while the package kept working —
the runtime half was never affected, because `vite build` bundles the
JavaScript into a single file with no relative imports left in it.

Nothing in this repository could have seen it. The catalog depends on the
package and imports exactly one thing from it, a stylesheet; 803 unit tests,
438 browser checks, 480 accessibility checks and 196 baselines all read the
**source**. Doc 10 §3 has named a `Package` layer — "Types resolve, exports are
correct, no side effects" — since the foundations were written, and it was the
one row of that table with nothing behind it.

## Decision

**`build:types` emits into `.types/`, and `build:dts` rolls that tree into a
single self-contained `dist/index.d.ts`.** A declaration file with no relative
imports has nothing for a consumer's resolver to follow, so the question does
not arise under any setting.

`rollup-plugin-dts` does the rolling, configured in
`packages/blackborne/rollup.dts.config.mjs`, and the shape now matches what
`vite build` already does to the JavaScript: one entry point, one file.

## Why not the alternatives

**Write the extensions in the source.** `from './components/Button/index.js'`
resolves everywhere. It is also several hundred call sites, it puts a build
artefact's extension into source that never runs as `.js`, and it fights the
rule that a component is reached through its index — which
`no-restricted-imports` enforces in the other direction.

**Declare that consumers must use `bundler` resolution.** Defensible for an
application, not for a published library: it makes the package unusable to a
correct consumer configuration, and the failure they would see is the silent
`any` rather than an error telling them why.

**Post-process the emitted files, appending `/index.js` to each specifier.**
Textual surgery on generated output, and it keeps the tree — so it keeps the
second problem below.

## What came with it

`dist` now holds exactly what the `exports` map names: `index.js`, its source
map, `index.d.ts` and `styles.css`. Two consequences worth recording.

`tsc` never prunes; it had left two declarations on disk for modules that no
longer exist (`internal/useNormalizedField.d.ts`, `components/Calendar/limits.d.ts`),
and `files: ["dist"]` publishes whatever is there. With no tree to go stale,
that class is gone — and `build:clean` empties `dist` first so a local build
cannot resurrect it.

The surface was verified to be **identical**, not merely present: the
TypeScript API reports 191 exported names from the multi-file entry point and
191 from the bundle, with none missing and none added. A declaration bundler
renames on collision, and a renamed public type would be a silent breaking
change, so this is the check that mattered.

## How it is held

`pnpm --filter blackborne check:package` runs `publint` and
`@arethetypeswrong/cli` against the packed tarball, asserts that every value in
the type surface imports at run time, and asserts that nothing in `dist` is
unreachable through the `exports` map. It is part of the fast CI job, because
doc 10 §3 prices this layer at "Fast" and it takes seconds.

The same run found the other defect this decision's wave fixes: four components
shipping with no CSS at all
([the stylesheet's single door](../../packages/blackborne/src/styles/index.css)).
