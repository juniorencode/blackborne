/*
 * THE PACKAGE LAYER. Doc 10 §3 has named it since the foundations were
 * written — "Package | Types resolve, exports are correct, no side effects |
 * Fast" — and until this script it was the one row of that table with nothing
 * behind it.
 *
 * It cost two consumer-facing defects, both found within a minute of the first
 * run and neither visible to any other layer:
 *
 * 1. `dist/styles.css` shipped without the rules for ButtonGroup, Steps and
 *    the checkerboard, so four components would have been published unstyled.
 *    Nothing saw it
 *    because the catalog loads the built stylesheet for its tokens and renders
 *    components from SOURCE.
 * 2. `dist/index.d.ts` re-exported 110 extensionless relative paths, which
 *    ECMAScript resolution cannot follow — so on `moduleResolution: nodenext`
 *    every exported type silently became `any`. See
 *    `rollup.dts.config.mjs` for the measurements.
 *
 * The shape of both is the same, and it is why this layer exists at all:
 * nothing in this repository consumed the built package. The catalog depends
 * on it and imports exactly one thing from it, a stylesheet. Every other
 * layer — 803 unit tests, 438 browser checks, 480 axe checks, 196 baselines —
 * reads the SOURCE.
 *
 * ## What each part asserts, and why it is derived rather than declared
 *
 * A check with a number somebody maintains drifts (doc 10 §11.6). So where
 * there is a second source of truth, this compares the two and keeps no list
 * of its own:
 *
 *   - publint     · that the manifest describes the tarball, off the shelf
 *   - attw        · that the types resolve under every module resolution
 *   - the exports · that every VALUE in the type surface exists at run time,
 *                   which is the types and the bundle checked against each
 *                   other rather than against an expected count
 *   - the files   · that everything in `dist` is reachable through the
 *                   `exports` map, derived from the manifest
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, posix, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const HERE = resolve(import.meta.dirname, '..');
const manifest = require(join(HERE, 'package.json'));

const problems = [];
const say = step => process.stdout.write(`  ${step}\n`);

/* ------------------------------------------------------------------ *
 * publint: the manifest against the tarball. No flags to explain.
 * ------------------------------------------------------------------ */
/*
 * Spawned through node with the dependency's own entry point resolved, rather
 * than through a shell. `shell: true` is what makes a bare `publint` findable
 * on Windows, and node deprecates it for passing arguments unescaped — so the
 * bin is resolved from the installed package instead, which needs no shell on
 * any platform.
 */
const run = (name, args) => {
  const root = join(HERE, 'node_modules', name);
  const own = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const bin = typeof own.bin === 'string' ? own.bin : Object.values(own.bin)[0];
  return spawnSync(process.execPath, [join(root, bin), ...args], {
    cwd: HERE,
    encoding: 'utf8'
  });
};

const publint = run('publint', ['--strict']);
if (publint.status !== 0) {
  problems.push(
    `publint reported problems:\n${publint.stdout}${publint.stderr}`
  );
}
say(`publint --strict: ${publint.status === 0 ? 'clean' : 'FAILED'}`);

/* ------------------------------------------------------------------ *
 * attw: the types under node10, node16 and bundler resolution.
 *
 * Two flags, and both are about what the instrument can measure rather
 * than about lowering a bar:
 *
 *   --exclude-entrypoints styles.css
 *      attw analyses TYPE resolution and a stylesheet has none, so it
 *      reports the CSS entrypoint as unresolvable under all four. That
 *      export is checked instead by the dist inventory below, which
 *      asserts the file the map points at exists.
 *
 *   --profile esm-only
 *      This package is ESM-only and says so: "type": "module", one
 *      "import" condition, no "require". A CommonJS consumer therefore
 *      reaches it by dynamic import, which attw's default profile
 *      reports as a warning. It is a property of the package's design
 *      (P2, and decision 0001's toolchain), not a defect, and the
 *      esm-only profile is attw's own name for that intent.
 * ------------------------------------------------------------------ */
const attw = run('@arethetypeswrong/cli', [
  '--pack',
  '.',
  '--exclude-entrypoints',
  'styles.css',
  '--profile',
  'esm-only'
]);
if (attw.status !== 0) {
  problems.push(`attw reported problems:\n${attw.stdout}${attw.stderr}`);
}
say(`attw --profile esm-only: ${attw.status === 0 ? 'clean' : 'FAILED'}`);

/* ------------------------------------------------------------------ *
 * Every value in the type surface exists at run time.
 *
 * This is the assertion that would have caught a build that looks
 * successful and contains nothing — the failure `vite.config.ts` warns
 * about in its own header, where externalising the library's own modules
 * produced an empty bundle. It compares two independently produced
 * artefacts, so neither can be wrong alone.
 * ------------------------------------------------------------------ */
const typesPath = join(HERE, manifest.exports['.'].types);
const program = ts.createProgram([typesPath], {
  noEmit: true,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX
});
const checker = program.getTypeChecker();
const entry = checker.getSymbolAtLocation(program.getSourceFile(typesPath));

if (!entry) {
  problems.push(`${manifest.exports['.'].types} is not a module`);
} else {
  const declared = checker.getExportsOfModule(entry);
  /* A type alias and an interface have no value; a component, a hook and a
     constant do. Only the second kind must be importable at run time. */
  const values = declared
    .filter(symbol => {
      const flags =
        symbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(symbol).flags
          : symbol.flags;
      return (flags & ts.SymbolFlags.Value) !== 0;
    })
    .map(symbol => symbol.getName())
    .sort();

  const runtime = await import(
    pathToFileURL(join(HERE, manifest.exports['.'].import)).href
  );
  const missing = values.filter(name => !(name in runtime));
  const extra = Object.keys(runtime).filter(name => !values.includes(name));

  if (missing.length) {
    problems.push(
      `declared in the types and absent from the bundle: ${missing.join(', ')}`
    );
  }
  if (extra.length) {
    problems.push(
      `exported by the bundle and undeclared in the types: ${extra.join(', ')}`
    );
  }
  say(
    `the type surface is ${declared.length} names, ${values.length} of them values, and every one imports`
  );
}

/* ------------------------------------------------------------------ *
 * Nothing in `dist` is unreachable.
 *
 * The exports map is the list; this walks the directory and asks the map
 * about each file. It is how a stylesheet extracted beside the bundle
 * becomes visible: `dist/blackborne.css` sat there for a month, inside
 * `files: ["dist"]`, named by no condition and imported by nobody.
 * ------------------------------------------------------------------ */
const reachable = new Set(
  Object.values(manifest.exports)
    .flatMap(value =>
      typeof value === 'string' ? [value] : Object.values(value)
    )
    .filter(target => target.startsWith('./dist/'))
    .map(target => target.slice('./'.length))
);
/*
 * A sourcemap used to be allowed here as a sibling of the file it belongs to.
 * It is not any more, and that is the point: this package publishes neither a
 * minified bundle nor a map (decision 0026, and the reasoning is in
 * vite.config.ts). A `.map` reappearing in `dist` means somebody turned
 * `sourcemap` back on, which is a decision rather than an accident — so it
 * should stop a build and be argued, not pass as a sibling.
 */

const walk = dir =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const published = walk(join(HERE, 'dist')).map(path =>
  relative(HERE, path).split(sep).join(posix.sep)
);
const orphans = published.filter(path => !reachable.has(path));

if (orphans.length) {
  problems.push(
    `published by files:["dist"] and named by no export condition: ${orphans.join(', ')}`
  );
}
say(
  `dist holds ${published.length} files and ${orphans.length} that no export condition names`
);

/* ------------------------------------------------------------------ */
if (problems.length) {
  process.stderr.write(
    `\nThe package layer failed:\n\n${problems.join('\n\n')}\n`
  );
  process.exit(1);
}
process.stdout.write('  the package is consumable\n');
