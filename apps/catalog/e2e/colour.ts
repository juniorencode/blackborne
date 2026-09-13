import type { Page } from '@playwright/test';

/*
 * READING A COLOUR THE BROWSER HAS ALREADY DECIDED.
 *
 * ## Why parsing stopped working
 *
 * The palette is published in `oklch`, so a screen that can show more than
 * sRGB shows the colour that was chosen rather than the nearest thing a hex
 * could name. The cost lands here: `getComputedStyle` hands back what was
 * declared, and Chrome serialises it in the same space.
 *
 *     --bb-x-brand-9        oklch(54.6% .22 259.8)
 *     computed `color`      oklch(0.546 0.22 259.8)
 *     computed `box-shadow` oklch(0.546 0.22 259.8) 0px 0px 0px 2px
 *
 * Four specs had grown their own `/rgba?\(([^)]+)\)/` and a luminance sum
 * beside it — the cross in four copies again — and every one of them threw
 * `not a colour` on the first oklch it met.
 *
 * ## Why this paints instead of converting
 *
 * Teaching those parsers oklch means writing oklch → oklab → linear sRGB →
 * gamma in a test helper, which is real colour-space arithmetic and is exactly
 * the kind of thing that is subtly wrong for months.
 *
 * A canvas already has that code, and using it answers a better question. What
 * comes back is the colour CLIPPED to sRGB — which is what an ordinary screen
 * actually paints, and therefore the only honest thing to measure a contrast
 * against. Measured against the ideal value a check would report ratios nobody
 * ever sees.
 *
 * It also takes anything the browser can paint, which is more than a parser
 * would have: `rgb()`, `oklch()`, and a `color-mix()` straight out of a
 * computed value.
 *
 *     oklch(0.546 0.22 259.8)                        → rgb(0, 101, 237)
 *     rgb(62, 99, 221)                               → rgb(62, 99, 221)
 *     color-mix(in oklab, oklch(…) 24%, transparent) → rgb(0, 100, 238)
 */

/** One colour, painted and read back as clipped sRGB. */
export const toSrgb = (
  page: Page,
  colour: string
): Promise<[number, number, number]> =>
  page.evaluate(value => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b] as [number, number, number];
  }, colour);

const luminance = ([r, g, b]: [number, number, number]) => {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/**
 * WCAG's ratio between two colours, whatever space they arrived in.
 *
 * Rounded to two places, because a check comparing against a floor does not
 * want to fail on the sixteenth decimal of a gamma curve.
 */
export const contrast = async (
  page: Page,
  one: string,
  other: string
): Promise<number> => {
  const a = luminance(await toSrgb(page, one));
  const b = luminance(await toSrgb(page, other));
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return Math.round(ratio * 100) / 100;
};

/**
 * How opaque a colour is, from 0 to 1, whatever space it arrived in.
 *
 * The same painting trick, reading the fourth byte. It replaces a
 * `startsWith('rgba(')` that used to be the question — an opaque computed
 * colour serialised as `rgb(...)` and a translucent one as `rgba(...)`, so the
 * prefix WAS the answer until the palette moved to `oklch` and both became
 * `oklch(...)`. A poll waiting on that prefix is then satisfied by its own
 * first read and waits for nothing, which is doc 10 §11.1.1 exactly.
 */
export const opacity = (page: Page, colour: string): Promise<number> =>
  page.evaluate(value => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data[3]! / 255;
  }, colour);
