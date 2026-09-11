/*
 * Writes `src/styles/primitives.css`. Run: `pnpm --filter blackborne tokens`.
 *
 * The rendering lives in `primitives.mjs` so that `check-primitives.mjs` can
 * import it without writing anything — that file's header has the reasoning.
 */
import { writeFileSync } from 'node:fs';
import { render, TARGET } from './primitives.mjs';

const out = render();
writeFileSync(TARGET, out);

/*
 * Anchored to declaration LINES. The pattern was `/--bb-x-/g`, which also
 * matched the generated file's own header prose — "the `x` marks layer 1" —
 * and so printed 193 where 192 are declared. A number in output that nobody
 * can trust is doc 10 §11.6's subject at its smallest scale.
 */
const count = (out.match(/^ {4}--bb-x-/gm) ?? []).length;
console.log(`primitives.css written: ${count} private tokens`);
