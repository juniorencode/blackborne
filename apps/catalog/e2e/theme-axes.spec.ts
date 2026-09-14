/*
 * What a real browser can answer and jsdom cannot: what colour did this
 * element actually end up.
 *
 * These exist because of a real bug. A CSS var() resolves at the element that
 * declares it, so the semantic tokens were frozen against the light
 * primitives: dark mode and brand overrides had no effect at all, and nothing
 * in the unit tests noticed. Verified to have teeth — reverting the fix in
 * semantic.css makes the dark-mode and brand assertions here fail.
 *
 * Expected values come from the palette, so remapping a token is a visible
 * test failure rather than something spotted in a screenshot weeks later.
 */
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { toSrgb } from './colour';
import { gotoStory } from './story';

/**
 * Gray step 2, which is what --bb-surface-control maps to in each mode.
 *
 * Pinned to the palette on purpose: these three constants are the reason a
 * token remap shows up as a named failure. They did exactly that when the
 * control surface moved from step 3 to step 2, again when the alternate brand
 * changed, and again when this library's own palette replaced Radix — red
 * tests naming the token, rather than a difference somebody might or might not
 * notice in a screenshot.
 */
const CONTROL_LIGHT = '247,249,251';
const CONTROL_DARK = '12,25,44';
/** The alternate brand, still a hand-written hex in catalog.css. */
const BRAND_ALT = '110,86,207';

/*
 * COMPARED AS A PAINTED COLOUR, NOT AS A STRING, and that is the palette's
 * doing rather than a preference. The palette ships in `oklch`, so a computed
 * background comes back as `oklch(0.238 0.043 259.4)` — `toHaveCSS` against an
 * `rgb(...)` literal then fails on the spelling rather than on the colour, and
 * would go on failing after any correct remap.
 *
 * `e2e/colour` paints it and reads the bytes, which is the same colour an
 * ordinary screen shows and compares equal whatever space it was declared in.
 * The pinning below is unchanged in spirit: these three constants exist so a
 * token remap arrives as a named failure rather than as a difference somebody
 * might or might not notice in a screenshot — which is exactly what they did
 * when the palette replaced Radix.
 */
const painted = (page: Page, locator: Locator) =>
  expect.poll(async () =>
    (
      await toSrgb(
        page,
        await locator.evaluate(
          (node: Element) => getComputedStyle(node).backgroundColor
        )
      )
    ).join(',')
  );

/** A panel inside a story, found by the label it prints. */
const panel = (label: string) =>
  `.catalog-panel:has(.catalog-label:text-is("${label}"))`;

test.describe('mode', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStory(page, 'components-button--modes');
  });

  test('a control uses the control surface in light', async ({ page }) => {
    const button = page
      .locator(panel('Light'))
      .getByRole('button', { name: 'secondary' });
    await painted(page, button).toBe(CONTROL_LIGHT);
  });

  test('dark mode actually reaches the control', async ({ page }) => {
    const button = page
      .locator(panel('Dark'))
      .getByRole('button', { name: 'secondary' });
    await painted(page, button).toBe(CONTROL_DARK);
  });

  /*
   * A CONTROL IS A WELL, AND IT IS ONE IN BOTH MODES. Rewritten 2026-09-13,
   * and the version it replaces is worth reading before changing it back.
   *
   * It used to assert the opposite in dark — that a control is LIGHTER than
   * its panel — with the reason beside it: "a control darker than its
   * container reads as a hole punched in the panel rather than something
   * sitting on it. That was the reported bug."
   *
   * That reason was about a control that was darker while everything around it
   * said raised-is-lighter, so it read as a hole because it disagreed with its
   * own system. The system changed: the dark page moved up the scale and the
   * control moved down, so a field is now a well you type into and every
   * control surface is darker than its ground IN BOTH MODES. Consistency is
   * what stops it reading as a hole, not the direction.
   *
   * So the rule is stronger than the one it replaces, rather than looser: it
   * asserts the SAME direction twice instead of one direction once. A library
   * where light sinks its controls and dark lifts them would pass the old test
   * and be the thing the old test was written to prevent.
   */
  test('a control is darker than its panel, in both modes', async ({
    page
  }) => {
    /*
     * Resolved through a canvas rather than by reading the digits out of the
     * string, and that is not tidying: the version this replaces summed the
     * first three numbers it found, which for `oklch(0.213 0.042 257.4)` is
     * the LIGHTNESS and for `rgb(255, 255, 255)` is 765. It compared them to
     * each other and was right only while both happened to be oklch. The page
     * became `#fff` and the check started reading 981 against 765 for two
     * colours that differ by a hair.
     */
    const brightness = (label: string) =>
      page
        .locator(panel(label))
        .getByRole('button', { name: 'secondary' })
        .evaluate(el => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
          const luminance = (colour: string) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = '#000';
            ctx.fillStyle = colour;
            ctx.fillRect(0, 0, 1, 1);
            /* Indexed with a floor rather than destructured: the pixel
               buffer is typed as possibly-undefined at every index under
               `noUncheckedIndexedAccess`, and a canvas that was just painted
               has four bytes. */
            const pixel = ctx.getImageData(0, 0, 1, 1).data;
            const r = pixel[0] ?? 0;
            const g = pixel[1] ?? 0;
            const b = pixel[2] ?? 0;
            const channel = (value: number) => {
              const v = value / 255;
              return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            };
            return (
              0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
            );
          };
          const container = el.closest('.catalog-panel') as HTMLElement;
          return {
            control: luminance(getComputedStyle(el).backgroundColor),
            panel: luminance(getComputedStyle(container).backgroundColor)
          };
        });

    const light = await brightness('Light');
    const dark = await brightness('Dark');

    expect(light.control).toBeLessThan(light.panel);
    expect(dark.control).toBeLessThan(dark.panel);

    /*
     * And SEPARATED, not merely different. A difference of one part in a
     * thousand satisfies the direction and is invisible, which is the failure
     * this pair exists to catch — the fill is what says "you can type here".
     * The floor is in relative luminance, where the two currently differ by
     * 0.026 in light and 0.005 in dark.
     */
    expect(light.panel - light.control).toBeGreaterThan(0.002);
    expect(dark.panel - dark.control).toBeGreaterThan(0.002);
  });

  test('ghost text is legible in dark mode', async ({ page }) => {
    const ghost = page
      .locator(panel('Dark'))
      .getByRole('button', { name: 'ghost' });

    const brightness = await ghost.evaluate(el =>
      (getComputedStyle(el).color.match(/\d+/g) ?? [])
        .slice(0, 3)
        .reduce((a, b) => a + Number(b), 0)
    );

    // Near-white sums close to 765. The bug rendered near-black, close to 0.
    expect(brightness).toBeGreaterThan(500);
  });
});

test.describe('brand', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStory(page, 'components-button--brand-override');
  });

  test('an override reaches the accent colour', async ({ page }) => {
    const button = page
      .locator(panel('Overridden brand · light'))
      .getByRole('button', { name: 'primary' });
    await painted(page, button).toBe(BRAND_ALT);
  });

  test('an override does not leak into a scope that did not ask', async ({
    page
  }) => {
    const button = page
      .locator(panel('Default brand'))
      .getByRole('button', { name: 'primary' });
    await painted(page, button).not.toBe(BRAND_ALT);
  });

  test('the override survives dark mode', async ({ page }) => {
    const button = page
      .locator(panel('Overridden brand · dark'))
      .getByRole('button', { name: 'primary' });
    await painted(page, button).toBe(BRAND_ALT);
  });
});

test.describe('density', () => {
  test('it moves the height and leaves the colour alone', async ({ page }) => {
    await gotoStory(page, 'components-button--densities');

    const at = (label: string) =>
      page.locator(panel(label)).getByRole('button', { name: 'secondary' });

    const height = async (label: string) =>
      (await at(label).boundingBox())?.height ?? 0;

    expect(await height('Normal')).toBeGreaterThan(await height('Compact'));
    // Doc 03 §3: density moves spacing and heights, and no colour.
    await painted(page, at('Compact')).toBe(CONTROL_LIGHT);
  });
});
