import { fileURLToPath } from 'node:url';
import { PALETTE } from './palette.mjs';

/*
 * Bakes the whole palette into a file a project can OPT IN to.
 *
 * ## Why this is a second file and not part of the stylesheet
 *
 * Twenty-five families is six hundred declarations, against a stylesheet whose
 * published gzip ceiling has about 1 kB of headroom. Everything shipped is paid
 * for by everyone, and a project that never changes its accent should not carry
 * eighteen it never uses. So `styles.css` keeps the six families it is built
 * from and this is imported beside it by whoever wants the switch:
 *
 * The BYTES are in the README's weight table, which `check:budget` reads and
 * nothing else owns — a size written here would be a number describing the
 * file it is written in, which changes every time this comment does.
 *
 *     import 'blackborne/styles.css';
 *     import 'blackborne/palette.css';
 *
 * ## What it does
 *
 * It redefines a family's twelve steps inside a scope, which is the mechanism
 * the three theme axes already use (doc 03 §3) and the one the catalog's own
 * alternative brand has always used by hand. Nothing new is invented:
 *
 *     <div data-bb-accent="red">      every accent-coloured thing is red
 *     <div data-bb-base="stone">      the greys are warm
 *
 * `data-bb-accent` moves the BRAND family and nothing else. The four tone
 * families do not follow it — a listing whose accent is red still marks an
 * error in `danger` (decision 0028) — so `info` stays blue even when the accent
 * is not.
 *
 * ## AND A SCOPE CARRIES THE PAIR, WHICH IS MOST OF THIS FILE'S REASONING
 *
 * Doc 03 §4.0: every background declares the text that goes on it, and they
 * are used together. `--bb-accent-on` is `#fff` because the default brand is
 * a dark blue — and semantic.css says so in as many words: "if the brand is
 * overridden to a lighter colour, --bb-accent-on has to change with it".
 *
 * Eighteen accents is where that sentence stops being hypothetical. Measured,
 * white text on the solid step:
 *
 *     amber 3.12   cyan 3.68   emerald 3.78   green 3.28   lime 3.08
 *     orange 3.50  sky 4.07    teal 3.72      yellow 2.89
 *
 * Nine of the eighteen under 4.5:1, three of them under 3.5. So a scope whose
 * solid is a LIGHT colour declares its own text, and which one is a
 * measurement rather than a judgement: whichever of white and the family's own
 * darkest step reads better on its solid. Step 9 is mode-invariant by
 * construction, so that choice is one per family rather than one per mode.
 *
 * ## The interaction steps follow from the same choice
 *
 * Hover and press move AWAY from the text's lightness, so interacting SPENDS
 * no contrast:
 *
 *     white text  ->  light 9, 10, 11    dark 9, 8, 7
 *     dark text   ->  light 9,  8,  7    dark 9, 10, 11
 *
 * The first row's dark half is the default's, and it is restated in
 * semantic.css with the failure that prompted it: step 11 is the scale's
 * low-contrast TEXT step, and using it as a FILL put white on `#87b5ff` at
 * 2.08:1. Only the second row is this file's business.
 *
 * With both in place every one of the eighteen clears 4.5:1 at rest, hovered
 * and pressed, in both modes, except the four whose solid is a mid-tone —
 * cyan 4.48, emerald 4.31, sky 4.07, teal 4.39 in light. Those are a property
 * of the palette rather than of the mapping, and decision 0028 names them. The
 * numbers there are read off a BROWSER painting the built file, which is a
 * hair from the ones computed here: the palette's stored hex and Chrome's own
 * clip of the same `oklch` disagree in the last digit of a channel.
 *
 * ## The mode goes outermost, and that is a real constraint
 *
 * The scope belongs on the element carrying `data-bb-mode`, or inside it with
 * no other mode in between. Doc 03 §3.2 has the rule; the mechanism is that
 * both this file and `semantic.css` answer "is there a dark ancestor" with a
 * descendant selector, and no plain selector can ask which mode ancestor is
 * NEAREST. Two arrangements are therefore undefined and both are written down
 * rather than guarded: a mode nested between a scope and its own mode, and a
 * mode nested inside a scope — where `primitives.css`'s own
 * `[data-bb-mode='dark']` block redeclares the default family and wins,
 * because a declaration beats an inherited value.
 *
 * ## And this file is imported AFTER the stylesheet
 *
 * The light rule is `[data-bb-accent='red']` at (0,1,0), the same weight as
 * `semantic.css`'s own `[data-bb-accent]` and as `primitives.css`'s `:root`.
 * Equal weight means the later file wins, which is what lets a scope's
 * `--bb-accent-on` beat the default's. The dark rules are (0,2,0) and tie with
 * semantic.css's dark block for the same reason.
 */

/** Which library family a scope replaces, and which kind fills it. */
const SCOPES = {
  accent: { attribute: 'data-bb-accent', family: 'brand', kind: 'accent' },
  base: { attribute: 'data-bb-base', family: 'gray', kind: 'base' }
};

const channels = value =>
  [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));

const luminance = colour => {
  const channel = v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = channels(colour);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/**
 * WCAG's ratio, to two places.
 *
 * Computed from the CLIPPED hex rather than from the `oklch` the file emits,
 * because the hex is what an ordinary screen paints — decision 0028's rule,
 * and the reason the palette carries every colour twice.
 */
const contrast = (one, other) => {
  const a = luminance(one);
  const b = luminance(other);
  return (
    Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100
  );
};

const WHITE = '#ffffff';

/**
 * What one accent family's solid needs, decided by measurement.
 *
 * `light[8]` is step 9, which is the same colour in both modes by
 * construction — so one answer serves both.
 */
const solidOf = family => {
  const solid = family.light[8];
  const own = family.light[11];
  const white = contrast(WHITE, solid) >= contrast(own, solid);
  return {
    white,
    /* rest, hovered, pressed — as step numbers, per mode. */
    light: white ? [9, 10, 11] : [9, 8, 7],
    dark: white ? [9, 8, 7] : [9, 10, 11]
  };
};

/**
 * Whether this family's SOLID step can carry a run of text on the page.
 *
 * `--bb-link` is the solid step in light mode, which is a colour meant to be
 * looked at rather than read. Measured against the page, nine of the eighteen
 * are under the 4.5:1 a run of text needs — amber 3.04, yellow 2.82, sky 3.96
 * — and the scale's own step 11 is the low-contrast TEXT step that exists for
 * exactly this. In dark `--bb-link` is already step 11 and every family clears
 * 8.8:1 there, so this only ever fires in light.
 *
 * The page is the DEFAULT base's step 1. A project that also switches its base
 * moves that number, and measured across all seven bases it moves by under
 * 0.2 — they are built to the same lightness.
 */
const linkNeedsTextStep = (family, mode) => {
  if (mode !== 'light') return false;
  return contrast(family.light[8], PALETTE.slate.light[0]) < 4.5;
};

/**
 * What a scope declares beyond the twelve steps.
 *
 * Only the DEVIATIONS. A family that already matches what semantic.css
 * declares emits nothing here and follows the default — so if the default ever
 * moves, those families move with it, which is right.
 */
const pairing = (familyName, mode) => {
  const family = PALETTE[familyName];
  const solid = solidOf(family);
  const scale = mode === 'light' ? family.light : family.dark;
  /* One entry per thing the scope deviates in, each its own comment and its
     own declarations, so a reader sees which measurement caused which line. */
  const blocks = [];

  if (!solid.white) {
    /* The family's own darkest step: 12 in light, 1 in dark, because the dark
       scales run the other way round. */
    const onStep = mode === 'light' ? 12 : 1;
    const [rest, hover, active] = solid[mode];
    const measured = [rest, hover, active]
      .map(step => contrast(scale[onStep - 1], scale[step - 1]).toFixed(2))
      .join(' / ');

    blocks.push(
      [
        '  /* A light solid, so it carries dark text and its states move the',
        `     other way: ${measured} at rest, hovered and pressed. */`,
        `  --bb-accent-on: var(--bb-x-brand-${String(onStep)});`,
        `  --bb-accent-hover: var(--bb-x-brand-${String(hover)});`,
        `  --bb-accent-active: var(--bb-x-brand-${String(active)});`
      ].join('\n')
    );
  }

  if (linkNeedsTextStep(family, mode)) {
    const page = PALETTE.slate.light[0];
    blocks.push(
      [
        `  /* The solid is ${contrast(scale[8], page).toFixed(2)}:1 on the page, so a link takes`,
        `     the text step instead: ${contrast(scale[10], page).toFixed(2)}:1. */`,
        '  --bb-link: var(--bb-x-brand-11);'
      ].join('\n')
    );
  }

  return blocks.length ? `\n\n${blocks.join('\n\n')}` : '';
};

const steps = (name, familyName, mode) => {
  const family = PALETTE[familyName];
  const scale = mode === 'light' ? family.lightOklch : family.darkOklch;
  return scale
    .map((value, index) => `  --bb-x-${name}-${String(index + 1)}: ${value};`)
    .join('\n');
};

const scopeFor = ({ attribute, family, kind }) =>
  Object.entries(PALETTE)
    .filter(([, one]) => one.kind === kind)
    .map(([familyName]) => {
      const selector = `[${attribute}='${familyName}']`;
      const extra = mode =>
        kind === 'accent' ? pairing(familyName, mode) : '';
      return [
        `${selector} {`,
        steps(family, familyName, 'light') + extra('light'),
        '}',
        '',
        `[data-bb-mode='dark'] ${selector},`,
        `${selector}[data-bb-mode='dark'] {`,
        steps(family, familyName, 'dark') + extra('dark'),
        '}'
      ].join('\n');
    })
    .join('\n\n');

const header = `/*
 * GENERATED FILE — do not edit.
 * Source: scripts/palette.mjs, this library's own palette.
 * Regenerate: pnpm --filter blackborne tokens
 *
 * THE WHOLE PALETTE, as scopes a project can switch between.
 *
 *   import 'blackborne/styles.css';
 *   import 'blackborne/palette.css';   (in this order)
 *
 *   <div data-bb-accent="red">    everything accent-coloured is red
 *   <div data-bb-base="stone">    the greys are warm
 *
 * Optional on purpose: a project that never changes its accent should not pay
 * for eighteen it never uses, so the stylesheet carries only the six families
 * it is built from and this carries the rest.
 *
 * THE MODE GOES OUTERMOST: put the scope on the element carrying
 * \`data-bb-mode\`, or inside it with no other mode in between (doc 03 §3.2).
 *
 * An accent whose solid is a LIGHT colour also declares the text that goes on
 * it and the direction its hover and pressed states move in, because a
 * background and its text are a pair (doc 03 §4.0). The ratios are in the
 * comment above each one, generated from the same numbers.
 *
 * The four tone families do not follow the accent, which is decision 0028.
 */
`;

export const render = () =>
  [
    header,
    '/* ── accents ─────────────────────────────────────────────────────── */',
    '',
    scopeFor(SCOPES.accent),
    '',
    '/* ── bases ───────────────────────────────────────────────────────── */',
    '',
    scopeFor(SCOPES.base),
    ''
  ].join('\n');

export const TARGET = fileURLToPath(
  new URL('../src/styles/palette.css', import.meta.url)
);
