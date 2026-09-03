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

/** Radix slate, the steps the semantic mapping uses for a control. */
const CONTROL_LIGHT = 'rgb(240, 240, 243)';
const CONTROL_DARK = 'rgb(33, 34, 37)';
/** The alternate brand the catalog stories inject. */
const BRAND_ALT = 'rgb(124, 58, 237)';

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

/** A panel inside a story, found by the label it prints. */
const panel = (label: string) =>
  `.catalog-panel:has(.catalog-label:text-is("${label}"))`;

test.describe('mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(story('components-button--modes'));
  });

  test('a control uses the control surface in light', async ({ page }) => {
    const button = page
      .locator(panel('Light'))
      .getByRole('button', { name: 'secondary' });
    await expect(button).toHaveCSS('background-color', CONTROL_LIGHT);
  });

  test('dark mode actually reaches the control', async ({ page }) => {
    const button = page
      .locator(panel('Dark'))
      .getByRole('button', { name: 'secondary' });
    await expect(button).toHaveCSS('background-color', CONTROL_DARK);
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
    await page.goto(story('components-button--brand-override'));
  });

  test('an override reaches the accent colour', async ({ page }) => {
    const button = page
      .locator(panel('Overridden brand · light'))
      .getByRole('button', { name: 'primary' });
    await expect(button).toHaveCSS('background-color', BRAND_ALT);
  });

  test('an override does not leak into a scope that did not ask', async ({
    page
  }) => {
    const button = page
      .locator(panel('Default brand'))
      .getByRole('button', { name: 'primary' });
    await expect(button).not.toHaveCSS('background-color', BRAND_ALT);
  });

  test('the override survives dark mode', async ({ page }) => {
    const button = page
      .locator(panel('Overridden brand · dark'))
      .getByRole('button', { name: 'primary' });
    await expect(button).toHaveCSS('background-color', BRAND_ALT);
  });
});

test.describe('density', () => {
  test('it moves the height and leaves the colour alone', async ({ page }) => {
    await page.goto(story('components-button--densities'));

    const at = (label: string) =>
      page.locator(panel(label)).getByRole('button', { name: 'secondary' });

    const height = async (label: string) =>
      (await at(label).boundingBox())?.height ?? 0;

    expect(await height('Normal')).toBeGreaterThan(await height('Compact'));
    // Doc 03 §3: density moves spacing and heights, and no colour.
    await expect(at('Compact')).toHaveCSS('background-color', CONTROL_LIGHT);
  });
});
