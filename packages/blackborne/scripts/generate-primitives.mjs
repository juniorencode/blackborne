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
 */
import { writeFileSync } from 'node:fs';
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

/** Translucent greys, for states over a background we do not control. */
const ALPHA = { gray: ['slateA', 'slateDarkA'] };

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

const out = [
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

const target = fileURLToPath(
  new URL('../src/styles/primitives.css', import.meta.url)
);
writeFileSync(target, out);

const count = (out.match(/--bb-x-/g) ?? []).length;
console.log(`primitives.css written: ${count} private tokens`);
