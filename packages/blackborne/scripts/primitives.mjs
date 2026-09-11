/*
 * Bakes the layer-1 primitives from @radix-ui/colors into a CSS file.
 *
 * Why generated and not hand-written: copying 12 steps across 6 families and
 * 2 modes by hand is 144 hex values, and a single typo is invisible.
 *
 * Why baked and not imported at runtime: @radix-ui/colors is a DEVELOPMENT
 * dependency (decision in doc 03 §1.1). Importing its CSS would leak
 * unprefixed --slate-1 style variables into the consumer's page and put the
 * package in their dependency tree. The values end up in our compiled CSS and
 * nobody downstream knows the palette exists.
 *
 * The private naming convention is `--bb-x-*`: the `x` marks layer 1, which no
 * component may reference (doc 03 §4.5). Only semantic.css reads these.
 *
 * Run: pnpm --filter blackborne tokens
 *
 * THIS MODULE WRITES NOTHING, and that is the whole reason it exists as its
 * own file. `check-primitives.mjs` imports `render` below and compares it with
 * what is committed — so the check measures the same function the write uses
 * rather than a reimplementation of it, which would agree with itself forever.
 *
 * Two files rather than one module guarded by a `process.argv[1]` comparison:
 * that is a path comparison, drive letter and all on Windows, and a check that
 * silently stops running is worse than no check at all.
 */
import { fileURLToPath } from 'node:url';
import * as radix from '@radix-ui/colors';

/** Semantic family -> [light scale, dark scale] in @radix-ui/colors. */
const FAMILIES = {
  gray: ['slate', 'slateDark'],
  brand: ['indigo', 'indigoDark'],
  danger: ['red', 'redDark'],
  warning: ['amber', 'amberDark'],
  success: ['green', 'greenDark'],
  info: ['blue', 'blueDark']
};

/**
 * Translucent scales, for anything drawn OVER a background we do not control.
 *
 * The focus ring is the reason brand is here: a halo has to sit on whatever
 * surface the control happens to be on — a white panel, a grey table row, a
 * dark dialog — and a solid colour cannot do that without knowing what is
 * underneath. A translucent one does not need to know.
 */
const ALPHA = {
  gray: ['slateA', 'slateDarkA'],
  brand: ['indigoA', 'indigoDarkA']
};

const stepsOf = scaleName => {
  const scale = radix[scaleName];
  if (!scale) throw new Error(`unknown radix scale: ${scaleName}`);
  // Keys look like `slate1` ... `slate12`, or `slateA1` ... for alpha.
  return Object.entries(scale)
    .map(([key, value]) => [Number(key.replace(/^\D+/, '')), value])
    .sort((a, b) => a[0] - b[0]);
};

const block = (families, suffix, mode) =>
  Object.entries(families)
    .map(([name, scales]) => {
      const scaleName = mode === 'light' ? scales[0] : scales[1];
      const lines = stepsOf(scaleName).map(
        ([step, value]) => `    --bb-x-${name}${suffix}-${step}: ${value};`
      );
      return `    /* ${name}${suffix} — ${scaleName} */\n${lines.join('\n')}`;
    })
    .join('\n\n');

const header = `/*
 * GENERATED FILE — do not edit.
 * Source: @radix-ui/colors (a development dependency, never shipped).
 * Regenerate: pnpm --filter blackborne tokens
 *
 * Layer 1: primitives. Values with no meaning. NO COMPONENT MAY USE THESE.
 * The \`x\` in --bb-x-* marks them private (doc 03 §4.5). Only semantic.css
 * reads them; lint enforces the rest.
 *
 * Each step has a fixed role, identical in both modes, which is the whole
 * reason for choosing role-based scales (doc 03 §1.1):
 *
 *   1-2   backgrounds          7    normal border
 *   3     component background 8    strong border, focus ring
 *   4     hovered              9    solid
 *   5     pressed / selected   10   solid hovered
 *   6     subtle border        11   low-contrast text
 *                              12   high-contrast text
 */
`;

/** The whole file, as a string — byte-identical to what `tokens` writes. */
export const render = () =>
  [
    header,
    ':root {',
    block(FAMILIES, '', 'light'),
    '',
    block(ALPHA, '-a', 'light'),
    '}',
    '',
    "[data-bb-mode='dark'] {",
    block(FAMILIES, '', 'dark'),
    '',
    block(ALPHA, '-a', 'dark'),
    '}',
    ''
  ].join('\n');

/** Exported so the check reads the path the write uses, not a second copy. */
export const TARGET = fileURLToPath(
  new URL('../src/styles/primitives.css', import.meta.url)
);
