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
 * Radix slate step 2, which is what --bb-surface-control maps to in each mode.
 *
 * Pinned to the palette on purpose: these three constants are the reason a
 * token remap shows up as a named failure. They did exactly that when the
 * control surface moved from step 3 to step 2 and the alternate brand became
 * Radix violet — five red tests naming the token, rather than a difference
 * somebody might or might not notice in a screenshot.
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

  test('the control is lighter than its panel in dark mode', async ({
    page
  }) => {
    // A control darker than its container reads as a hole punched in the
    // panel rather than something sitting on it. That was the reported bug.
    const button = page
      .locator(panel('Dark'))
      .getByRole('button', { name: 'secondary' });

    const brightness = await button.evaluate(el => {
      const sum = (colour: string) =>
        (colour.match(/\d+/g) ?? [])
          .slice(0, 3)
          .reduce((a, b) => a + Number(b), 0);
      const container = el.closest('.catalog-panel') as HTMLElement;
      return {
        control: sum(getComputedStyle(el).backgroundColor),
        panel: sum(getComputedStyle(container).backgroundColor)
      };
    });

    expect(brightness.control).toBeGreaterThan(brightness.panel);
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
