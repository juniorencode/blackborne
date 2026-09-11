/*
 * PRIMITIVES.CSS STILL MATCHES ITS GENERATOR.
 *
 * ## Why this file has less cover than any other in the package
 *
 * `src/styles/primitives.css` is the bottom of the token stack: hard rule 1
 * says a component uses semantic tokens, and every semantic token resolves
 * into a `--bb-x-*` declared there (doc 03 §4.5). It is also the only source
 * file that ESLint ignores BY NAME and prettier ignores BY NAME, and no test
 * read it.
 *
 * Measured: of its 192 declarations, exactly TWO are asserted anywhere — light
 * `slate-2` and dark `slateDark-2`, as `rgb()` strings in
 * `e2e/theme-axes.spec.ts`, and only in the slow job. A hand-edited hex in the
 * other 190 reached `dist/styles.css` unopposed, and a stale generation
 * against a bumped `@radix-ui/colors` did the same.
 *
 * ## Why it compares rather than writes
 *
 * The obvious form is `pnpm tokens && git diff --exit-code`. Two problems, and
 * the second is the one that matters. It WRITES a source file as a side effect
 * of checking it, so a failing gate leaves the tree dirty; and it needs a git
 * working tree, which a packed tarball or a fresh checkout of one commit does
 * not always have. Rendering to a string and comparing bytes needs neither.
 *
 * `render` is imported from the same module the writer uses, deliberately: a
 * check that reimplements the thing it checks agrees with itself forever.
 *
 * ## What it cannot catch
 *
 * That the VALUES are right. `@radix-ui/colors` is pinned exactly — 3.0.0, no
 * range, with an integrity hash in the lockfile — so this asserts the file
 * matches that package, not that the palette is any good. Two of the 192 are
 * checked against a real browser elsewhere; the other 190 are trusted because
 * they are generated, which is exactly the claim this makes true.
 */
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { render, TARGET } from './primitives.mjs';

const committed = readFileSync(TARGET);
const rendered = Buffer.from(render(), 'utf8');
const where = relative(process.cwd(), TARGET).split('\\').join('/');

if (!committed.equals(rendered)) {
  /*
   * Say WHERE, because a 7 kB diff is unreadable and the first divergence is
   * almost always the whole story: a hand edit is one line, a radix bump is
   * many and starts at the first changed step.
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
          `    generated: ${JSON.stringify(b[at])}\n`) +
      '\nThis file is GENERATED and is ignored by eslint and by prettier, so a\n' +
      'hand edit here is invisible to every other check. Either the edit belongs\n' +
      'in scripts/primitives.mjs, or `@radix-ui/colors` moved and the file needs\n' +
      'regenerating: `pnpm --filter blackborne tokens`.\n'
  );
  process.exit(1);
}

const declarations = (render().match(/^ {4}--bb-x-/gm) ?? []).length;
process.stdout.write(
  `  ${where} matches its generator (${String(committed.length)} bytes, ${String(declarations)} private tokens)\n`
);
