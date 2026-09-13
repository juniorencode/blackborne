/*
 * THE GENERATED STYLESHEETS STILL MATCH THEIR GENERATORS.
 *
 *   src/styles/primitives.css   the six families the library is built from
 *   src/styles/palette.css      all twenty-five, as scopes, shipped opt-in
 *
 * ## Why these files have less cover than any other in the package
 *
 * `primitives.css` is the bottom of the token stack: hard rule 1 says a
 * component uses semantic tokens, and every semantic token resolves into a
 * `--bb-x-*` declared there (doc 03 §4.5). It is also one of the two source
 * files that ESLint ignores BY NAME and prettier ignores BY NAME, and no test
 * read it.
 *
 * Measured: of its 144 declarations, exactly TWO are asserted anywhere — light
 * `gray-2` and dark `gray-2`, in `e2e/theme-axes.spec.ts`, and only in the slow
 * job. A hand-edited value in the other 142 reached `dist/styles.css`
 * unopposed.
 *
 * `palette.css` is the same shape with the numbers an order larger — 600
 * declarations, none of which any component resolves by default, because a
 * project only reaches them by naming a scope. What a browser check can reach
 * is one accent and one base; the rest are trusted because they are generated,
 * which is exactly the claim this makes true.
 *
 * ## Why it compares rather than writes
 *
 * The obvious form is `pnpm tokens && git diff --exit-code`. Two problems, and
 * the second is the one that matters. It WRITES a source file as a side effect
 * of checking it, so a failing gate leaves the tree dirty; and it needs a git
 * working tree, which a packed tarball or a fresh checkout of one commit does
 * not always have. Rendering to a string and comparing bytes needs neither.
 *
 * `render` is imported from the same modules the writer uses, deliberately: a
 * check that reimplements the thing it checks agrees with itself forever. It
 * imports those modules rather than the WRITER, which would write the files as
 * a side effect of being loaded.
 *
 * ## What it cannot catch
 *
 * That the VALUES are right. The palette is data in this repository now
 * (decision 0028), so this asserts the files match `scripts/palette.mjs` — not
 * that the palette is any good. That question is answered by contrast
 * measurements and by looking at a baseline, both of which live elsewhere.
 */
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import * as primitives from './primitives.mjs';
import * as palette from './palette-css.mjs';

let failed = false;

for (const { render, TARGET } of [primitives, palette]) {
  const committed = readFileSync(TARGET);
  const rendered = Buffer.from(render(), 'utf8');
  const where = relative(process.cwd(), TARGET).split('\\').join('/');

  if (committed.equals(rendered)) {
    /* The indent is `+` rather than a fixed four: primitives sit inside
       `:root` and the palette's sit inside a scope, at different depths. */
    const declarations = (rendered.toString('utf8').match(/^ +--bb-x-/gm) ?? [])
      .length;
    process.stdout.write(
      `  ${where} matches its generator (${String(committed.length)} bytes, ${String(declarations)} private tokens)\n`
    );
    continue;
  }

  failed = true;

  /*
   * Say WHERE, because a 30 kB diff is unreadable and the first divergence is
   * almost always the whole story: a hand edit is one line, a re-tuned family
   * is many and starts at the first changed step.
   */
  /* Both sides as text. `rendered` is a Buffer — comparing bytes is the
     point — and calling `split` on it throws, which is how the diagnostic
     came to fail on the only path it exists for. Exercised now. */
  const a = committed.toString('utf8').split('\n');
  const b = rendered.toString('utf8').split('\n');
  const at = a.findIndex((line, index) => line !== b[index]);

  process.stderr.write(
    `\n${where} does not match its generator.\n\n` +
      `  committed: ${String(committed.length)} bytes, ${String(a.length)} lines\n` +
      `  generated: ${String(rendered.length)} bytes, ${String(b.length)} lines\n` +
      (at === -1
        ? '  every line matches, so the difference is trailing bytes or the encoding\n'
        : `  first difference at line ${String(at + 1)}:\n` +
          `    committed: ${JSON.stringify(a[at])}\n` +
          `    generated: ${JSON.stringify(b[at])}\n`)
  );
}

if (failed) {
  process.stderr.write(
    '\nThese files are GENERATED and are ignored by eslint and by prettier, so\n' +
      'a hand edit is invisible to every other check. Either the edit belongs in\n' +
      'scripts/palette.mjs — which is where the colours live — or in the module\n' +
      'that renders the file, and then: `pnpm --filter blackborne tokens`.\n'
  );
  process.exit(1);
}
