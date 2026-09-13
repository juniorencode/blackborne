/*
 * Writes the two generated stylesheets. Run: `pnpm --filter blackborne tokens`.
 *
 *   src/styles/primitives.css   the six families the library is built from
 *   src/styles/palette.css      all twenty-five, as scopes, shipped opt-in
 *
 * The rendering lives in `primitives.mjs` and `palette-css.mjs` so that
 * `check-tokens.mjs` can import it without writing anything — the first of
 * those has the reasoning, and it is why the counting below is duplicated
 * there rather than exported from here: importing this module would WRITE the
 * files, which is the one thing a check may not do.
 */
import { writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import * as primitives from './primitives.mjs';
import * as palette from './palette-css.mjs';

for (const { render, TARGET } of [primitives, palette]) {
  const out = render();
  writeFileSync(TARGET, out);

  /*
   * Anchored to declaration LINES. The pattern was `/--bb-x-/g`, which also
   * matched the generated file's own header prose — "the `x` marks layer 1" —
   * and so printed 193 where 192 are declared. A number in output that nobody
   * can trust is doc 10 §11.6's subject at its smallest scale.
   *
   * The indent is `+` rather than a fixed four: primitives sit inside `:root`
   * and the palette's sit inside a scope, at different depths.
   */
  const count = (out.match(/^ +--bb-x-/gm) ?? []).length;
  const where = relative(process.cwd(), TARGET).split('\\').join('/');
  /*
   * `Buffer.byteLength`, not `out.length`: a JS string counts UTF-16 code
   * units and these files are full of em dashes and box drawing, so the two
   * disagreed by 28 bytes and 235 bytes. The check beside this one prints
   * BYTES, because it compares them — and one file with two different sizes
   * printed at it is worse than either number alone (doc 10 §11.6).
   */
  console.log(
    `${where} written: ${count} private tokens, ${Buffer.byteLength(out)} bytes`
  );
}
