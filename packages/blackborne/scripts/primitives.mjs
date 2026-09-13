/*
 * Bakes the layer-1 primitives from this library's own palette into a CSS file.
 *
 * Why generated and not hand-written: copying 12 steps across 6 families and
 * 2 modes by hand is 144 values, and a single typo is invisible.
 *
 * Why baked and not imported at runtime: the palette is data in this
 * repository (`scripts/palette.mjs`), and the values end up in our compiled CSS
 * with nothing leaking into a consumer's page. Until 2026-09-12 the source was
 * `@radix-ui/colors`, a development dependency, for the same reason — that
 * package is gone now and nothing replaced it.
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
import { PALETTE } from './palette.mjs';

/**
 * Semantic family -> the palette family it is made of.
 *
 * Six, and they are the same six roles this library has always had. What
 * changed is where the numbers come from.
 *
 * `brand` is `blue` where it used to be `indigo`. Those are separate families
 * in this palette, so it is a choice of default rather than a rename.
 *
 * THE FOUR TONE FAMILIES DO NOT FOLLOW A PROJECT THAT CHANGES ITS ACCENT. A
 * listing whose accent is red still marks an error in `danger`, and two reds
 * beside each other is avoided by not choosing red — which is the project's
 * call rather than this library's. Decided rather than discovered, so it is
 * written here and not left to be rediscovered by whoever meets it.
 */
const FAMILIES = {
  gray: 'slate',
  brand: 'blue',
  danger: 'red',
  warning: 'amber',
  success: 'green',
  info: 'blue'
};

/**
 * The twelve steps of one family in one mode, as `oklch`.
 *
 * The palette carries every colour twice — `oklch` and the same colour clipped
 * to sRGB as a hex. This emits the `oklch`, because a screen that can show more
 * than sRGB should show the colour that was chosen rather than the nearest
 * thing a hex could name, and a screen that cannot will clip it itself.
 *
 * The hex half is not dead weight: it is what a contrast has to be measured
 * against, because it is what an ordinary screen actually paints. Measuring the
 * ideal value would report ratios nobody ever sees.
 */
const stepsOf = (familyName, mode) => {
  const family = PALETTE[familyName];
  if (!family) throw new Error(`unknown palette family: ${familyName}`);

  const scale = mode === 'light' ? family.lightOklch : family.darkOklch;
  if (scale.length !== 12) {
    throw new Error(
      `${familyName} ${mode} has ${String(scale.length)} steps, not 12`
    );
  }
  return scale.map((value, index) => [index + 1, value]);
};

const block = mode =>
  Object.entries(FAMILIES)
    .map(([name, familyName]) => {
      const lines = stepsOf(familyName, mode).map(
        ([step, value]) => `    --bb-x-${name}-${step}: ${value};`
      );
      return `    /* ${name} — ${familyName} */\n${lines.join('\n')}`;
    })
    .join('\n\n');

const header = `/*
 * GENERATED FILE — do not edit.
 * Source: scripts/palette.mjs, this library's own palette.
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
 *
 * Step 9 is the one value that is the same in both modes, by construction: it
 * is the solid the brand is recognised by, and a brand that changed shade with
 * the lights would not be one.
 */
`;

/** The whole file, as a string — byte-identical to what `tokens` writes. */
export const render = () =>
  [
    header,
    ':root {',
    block('light'),
    '}',
    '',
    "[data-bb-mode='dark'] {",
    block('dark'),
    '}',
    ''
  ].join('\n');

/** Exported so the check reads the path the write uses, not a second copy. */
export const TARGET = fileURLToPath(
  new URL('../src/styles/primitives.css', import.meta.url)
);
