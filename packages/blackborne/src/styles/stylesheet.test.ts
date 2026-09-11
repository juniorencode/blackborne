/*
 * THE STYLESHEET SHIPS EVERY COMPONENT'S RULES, asserted against the
 * filesystem rather than against a list somebody maintains.
 *
 * ## The failure this exists for
 *
 * `src/styles/index.css` names every layer-3 stylesheet by hand, one line
 * each, and the Tailwind CLI compiles that file and nothing else:
 * `@source` scans `.ts` and `.tsx` for class NAMES and follows no import. So a
 * stylesheet missing from the list is a component shipping with no CSS.
 *
 * Measured, on 2026-09-10, before this test existed: `ButtonGroup.css`,
 * `Steps.css` and `internal/checkerboard.css` were absent from the list, and
 * `dist/styles.css` held zero occurrences of `bb-button-group`, zero of
 * `bb-checkerboard` and none of the `bb-step` rules. **Four** components would
 * have been published unstyled — ButtonGroup, Steps, and the two that use the
 * checkerboard, ColorPicker and ColorSwatchField. No consumer received it only
 * because the rewrite is unreleased; npm still holds `0.1.1`.
 *
 * Nothing caught it, and the reason is worth writing down: those three
 * stylesheets arrived through a second door, a JavaScript `import './X.css'`,
 * which Vite's library build extracts into a file beside the bundle and strips
 * from `index.js`. The catalog loads the BUILT stylesheet for its tokens but
 * renders components from source, so Storybook's own Vite processed those
 * imports and injected them: 196 baselines, 480 axe checks and 438 browser
 * checks all looked at a correctly styled page. A lint rule now refuses that
 * import (`eslint.rules.js`, the `**\/*.css` group).
 *
 * ## Why a test and not just the lint rule
 *
 * They answer different questions, which is doc 01 §7 rather than belt and
 * braces. The lint rule says the JS door is shut. This says the remaining door
 * is COMPLETE — a new `Foo.css` that nobody imports at all passes lint,
 * compiles to nothing, and looks right in the catalog for as long as nobody
 * renders it outside Storybook.
 *
 * It reads the directory rather than a fixture list on purpose: a list here
 * would be the same thing that failed, spelled a third way.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

/*
 * Anchored on the working directory rather than on `import.meta.url`, which
 * vitest rewrites to a non-file URL under jsdom — `fileURLToPath` throws on it.
 * The anchor is asserted below, so a run from the wrong directory fails with a
 * sentence instead of finding no stylesheets and passing.
 */
const SRC = join(process.cwd(), 'src');
const INDEX = 'styles/index.css';

/** Every stylesheet under `src`, in posix form, relative to `src`. */
const stylesheets = (): string[] =>
  readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .map(entry => entry.split('\\').join('/'))
    .filter(entry => entry.endsWith('.css'))
    .sort();

/**
 * What `index.css` imports, as paths relative to `src`.
 *
 * Only the relative imports: `tailwindcss/theme.css` and
 * `tailwindcss/utilities.css` come from the dependency and are not ours to
 * account for.
 */
const imported = (): string[] => {
  const text = readFileSync(join(SRC, INDEX), 'utf8');
  return [...text.matchAll(/@import\s+'(\.[^']+)'/g)]
    .map(match => {
      /* The capture group is the whole reason for the match, so an empty one
         would be a broken pattern rather than a missing import — hence the
         throw rather than a skip. `noUncheckedIndexedAccess` asks for it. */
      const specifier = match[1];
      if (specifier === undefined) {
        throw new Error(`matched an @import with no path: ${match[0]}`);
      }
      const segments = 'styles'.split('/').concat(specifier.split('/'));
      const resolved: string[] = [];
      for (const segment of segments) {
        if (segment === '.') continue;
        if (segment === '..') resolved.pop();
        else resolved.push(segment);
      }
      return resolved.join('/');
    })
    .sort();
};

test('every stylesheet in the package is imported by the one the CLI compiles', () => {
  /*
   * `styles/` itself is excluded: `primitives.css`, `semantic.css` and
   * `utilities.css` are the token layers, imported at the top of the same
   * file, and `index.css` cannot import itself.
   */
  expect(
    existsSync(join(SRC, INDEX)),
    `${INDEX} was not found under ${SRC}; this test is anchored on the working directory`
  ).toBe(true);

  const layerThree = stylesheets().filter(path => !path.startsWith('styles/'));

  expect(layerThree.length).toBeGreaterThan(10);
  expect(imported()).toEqual(expect.arrayContaining(layerThree));
});

test('and every line in that list points at a file that exists', () => {
  /*
   * The other direction, which is what makes a rename fail loudly here rather
   * than quietly in the compiled sheet: Tailwind warns about an unresolved
   * `@import` and still emits a stylesheet.
   */
  const present = new Set(stylesheets().concat([INDEX]));

  for (const path of imported()) {
    expect(
      present.has(path),
      `${path} is imported by ${INDEX} and does not exist`
    ).toBe(true);
  }
});
