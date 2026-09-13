/*
 * THE CATALOGUE OF COLOURS, IN A BROWSER.
 *
 * `palette.css` is 600 declarations of nothing but custom properties, and
 * nothing resolves any of them by default — a project reaches them by naming a
 * scope. `check:tokens` proves the FILE matches its generator; only a browser
 * can say whether a scope actually reaches the components, and none of these
 * questions can be asked anywhere else:
 *
 *   - a var() resolves at the element that DECLARES it, so whether a scope
 *     re-declares the mapping is a question about the cascade
 *   - the dark mapping is 25 restatements a scope must not clobber
 *   - a contrast ratio is a property of two PAINTED colours
 *
 * The colours are read with `e2e/colour`, which paints and reads the bytes:
 * the palette ships in `oklch` and a computed value comes back in the same
 * space, so a string comparison would compare spellings (decision 0028).
 */
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { contrast, toSrgb } from './colour';
import { gotoStory } from './story';

/** A panel inside a story, found by the label it prints. */
const panel = (label: string) =>
  `.catalog-panel:has(> .catalog-label:text-is("${label}"))`;

/** One custom property on one element, as the colour a screen would show. */
const token = async (
  page: Page,
  locator: Locator,
  name: string
): Promise<string> =>
  (
    await toSrgb(
      page,
      await locator.evaluate(
        (node: Element, property: string) =>
          getComputedStyle(node).getPropertyValue(property).trim(),
        name
      )
    )
  ).join(',');

/** The painted background of an element. */
const background = async (page: Page, locator: Locator): Promise<string> =>
  (
    await toSrgb(
      page,
      await locator.evaluate(
        (node: Element) => getComputedStyle(node).backgroundColor
      )
    )
  ).join(',');

test.describe('an accent scope reaches the components', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStory(page, 'foundations-palette--switching');
  });

  test('a red scope paints the primary button red', async ({ page }) => {
    const asDefault = page
      .locator(panel('light · default'))
      .getByRole('button', { name: 'Save' });
    const asRed = page
      .locator(panel('light · red'))
      .getByRole('button', { name: 'Save' });

    /*
     * Both halves in one test (doc 10 §11.1.1). "The red one is red" passes on
     * a page where everything is red, and "they differ" passes on a page where
     * the scope did nothing but the two buttons happen to differ for another
     * reason. The pair is what says the scope did it.
     */
    const red = await background(page, asRed);
    expect(red).not.toBe(await background(page, asDefault));

    /* Red's solid step, which is mode-invariant by construction — so the same
       constant is what the dark panel must show too. */
    expect(red).toBe('227,0,36');
    expect(
      await background(
        page,
        page.locator(panel('dark · red')).getByRole('button', { name: 'Save' })
      )
    ).toBe('227,0,36');
  });

  /*
   * THE HALF A SWATCH CANNOT SHOW.
   *
   * Nine of the eighteen accents have a solid too light for white text —
   * amber's measures 3.12:1 — so a scope whose solid is light declares its own
   * `--bb-accent-on`. Without that line this test reads 3.12 and fails, which
   * is the point: it is the guard on the pair rule (doc 03 §4.0) for every
   * family a project can switch to.
   */
  test('a light accent carries dark text on its solid', async ({ page }) => {
    for (const label of ['light · amber', 'dark · amber']) {
      const button = page
        .locator(panel(label))
        .getByRole('button', { name: 'Save' });
      const fill = await button.evaluate(
        (node: Element) => getComputedStyle(node).backgroundColor
      );
      const text = await button.evaluate(
        (node: Element) => getComputedStyle(node).color
      );
      expect(
        await contrast(page, text, fill),
        `amber's solid against its text in ${label}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/*
 * THE INVARIANT DECISION 0028 SETTLED, ASSERTED.
 *
 * A listing whose accent is red still marks an error in `danger`. It is the
 * one thing about this feature that is a DECISION rather than a mechanism, so
 * it is the one most likely to be "improved" by someone who thinks the tones
 * should follow the brand.
 */
test('the tone families do not follow the accent or the base', async ({
  page
}) => {
  await gotoStory(page, 'foundations-palette--tones-do-not-follow');

  /*
   * `xpath=..` because a `Badge` wraps its text in an inner span: `getByText`
   * finds the deepest element holding the string, which is that wrapper, and
   * its background is transparent. The parent is the badge itself.
   */
  const badge = (label: string, name: string) =>
    page
      .locator(panel(label))
      .getByText(name, { exact: true })
      .locator('xpath=..');

  for (const tone of ['danger', 'warning', 'success', 'info']) {
    const asDefault = await background(page, badge('default', tone));
    for (const label of ['accent red', 'base stone', 'both']) {
      expect(
        await background(page, badge(label, tone)),
        `${tone} in ${label}`
      ).toBe(asDefault);
    }
  }

  /* And the positive control in the same test: the accent badge DOES move, so
     the four above being equal is the tones holding still rather than the
     scopes doing nothing at all. */
  expect(await background(page, badge('accent red', 'accent'))).not.toBe(
    await background(page, badge('default', 'accent'))
  );
});

test('a base scope moves the greys and leaves the accent alone', async ({
  page
}) => {
  await gotoStory(page, 'foundations-palette--tones-do-not-follow');

  const asDefault = page.locator(panel('default'));
  const stone = page.locator(panel('base stone'));

  expect(await token(page, stone, '--bb-surface')).not.toBe(
    await token(page, asDefault, '--bb-surface')
  );
  expect(await token(page, stone, '--bb-accent')).toBe(
    await token(page, asDefault, '--bb-accent')
  );
});

/*
 * THE SCOPE INSIDE THE MODE, which is the arrangement an application is in and
 * the one that was broken.
 *
 * A theme scope re-declares the whole light mapping, so until 2026-09-13 a
 * scope nested inside a dark element re-declared it and nothing put the 25
 * dark restatements back. Measured then: `--bb-surface-raised` collapsed onto
 * `--bb-surface`, and `--bb-surface-sunken` came out LIGHTER than the page.
 *
 * This has teeth: removing the descendant selectors from semantic.css's dark
 * block makes both assertions fail.
 */
test('a scope nested inside dark keeps the dark mapping', async ({ page }) => {
  await gotoStory(page, 'foundations-palette--nesting');

  const scope = page
    .locator(panel('dark · scope inside the mode'))
    .locator('[data-bb-accent="red"]');

  const surface = await token(page, scope, '--bb-surface');
  expect(await token(page, scope, '--bb-surface-raised')).not.toBe(surface);

  /* Elevation in dark is carried by a LIGHTER surface (doc 03 §5 rule 5), so
     the DIRECTION is asserted rather than only the difference — the broken
     version got `sunken` the wrong way round rather than equal, which "not
     the same" would have passed over. */
  const lightness = async (name: string) =>
    (await token(page, scope, name))
      .split(',')
      .reduce((total, channel) => total + Number(channel), 0);

  expect(await lightness('--bb-surface-raised')).toBeGreaterThan(
    await lightness('--bb-surface')
  );
  expect(await lightness('--bb-surface-sunken')).toBeLessThan(
    await lightness('--bb-surface-raised')
  );
});

/*
 * AND THE DEFAULT'S OWN PRESSED STATE IN DARK.
 *
 * Not a catalogue question — this is the shipped brand, and it was white on
 * `#87b5ff` at 2.08:1 because step 11 is the scale's low-contrast TEXT step
 * and was being used as a FILL. Nothing had seen it: the states story is
 * light-only, so a pressed primary button in dark had never been photographed.
 *
 * Asserted on the tokens rather than on a forced state, because the pairing is
 * what is wrong when this is wrong, and a token is readable in both modes from
 * one story.
 */
test('the accent stays readable through its own states', async ({ page }) => {
  await gotoStory(page, 'foundations-palette--switching');

  for (const label of ['light · default', 'dark · default']) {
    const scope = page.locator(panel(label));
    const on = await scope.evaluate((node: Element) =>
      getComputedStyle(node).getPropertyValue('--bb-accent-on').trim()
    );
    for (const state of [
      '--bb-accent',
      '--bb-accent-hover',
      '--bb-accent-active'
    ]) {
      const fill = await scope.evaluate(
        (node: Element, property: string) =>
          getComputedStyle(node).getPropertyValue(property).trim(),
        state
      );
      expect(
        await contrast(page, on, fill),
        `${state} against --bb-accent-on in ${label}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});
