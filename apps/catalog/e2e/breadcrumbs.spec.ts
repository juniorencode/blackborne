/*
 * A trail, and the three things about it that a stylesheet decides.
 *
 * 1. WHICH SEPARATORS EXIST. Every step draws one and the first one's is
 *    dropped by a rule keyed on `:first-child` — chosen over counting in
 *    JavaScript because CSS re-evaluates on its own when a consumer renders the
 *    first step conditionally. jsdom applies no stylesheet, so the count is
 *    only measurable here.
 * 2. WHICH WAY THEY POINT. This is the first directional icon the library
 *    draws, so it is the first one doc 02 §11.4's rule bites on: the glyph
 *    points down and is turned a quarter turn along the reading direction,
 *    which means the opposite quarter turn in Arabic.
 * 3. WHAT HAPPENS WHEN IT DOES NOT FIT. It wraps. The proper answer — the
 *    middle folding into a menu — waits for `Menu`, and until then the check
 *    is that nothing overflows sideways.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

type Page = import('@playwright/test').Page;

const OVERVIEW = 'components-breadcrumbs--overview';
const LENGTHS = 'components-breadcrumbs--lengths';
const DIRECTION = 'components-breadcrumbs--direction';
const NARROW = 'components-breadcrumbs--narrow-container';

/** The scoped panels the axis stories are built from. */
const scope = (page: Page, label: string) =>
  page.locator(`.catalog-panel:has(.catalog-label:text-is("${label}"))`);

test('every step but the first has a separator before it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const separators = page.locator('.bb-breadcrumb-separator');
  await expect(separators).toHaveCount(3);

  /*
   * Three in the DOM, two on the screen. Both halves matter: the count in the
   * markup says every step draws one, and the visibility says the rule that
   * drops the first one is in effect. A check on either alone passes on a
   * component with no separators at all.
   */
  const shown = await separators.evaluateAll(nodes =>
    nodes.map(node => getComputedStyle(node).display !== 'none')
  );
  expect(shown).toEqual([false, true, true]);
});

test('the separator points along the reading direction, both ways', async ({
  page
}) => {
  await gotoStory(page, DIRECTION);

  const rotationIn = async (label: string) =>
    scope(page, label)
      .locator('.bb-breadcrumb-separator')
      .nth(1)
      .evaluate(node => getComputedStyle(node).rotate);

  /*
   * The glyph is drawn pointing down. A quarter turn anti-clockwise points it
   * along a left-to-right line; the same turn clockwise points it along a
   * right-to-left one. Asserting both is what makes this a check rather than a
   * restatement — one of the two would pass on an icon that never turns.
   */
  expect(await rotationIn('LTR')).toBe('-90deg');
  expect(await rotationIn('RTL · العربية')).toBe('90deg');
});

test('and it is drawn, not merely positioned', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const separator = page.locator('.bb-breadcrumb-separator').nth(1);
  const box = await separator.boundingBox();
  expect(box).not.toBeNull();

  /*
   * A computed style is not paint (doc 08 §9). The glyph is a stroke inside a
   * 14px box, so the centre of the box is not on the ink — the middle of the
   * chevron's own stroke is, one third of the way along after the quarter
   * turn. Hit-tested rather than assumed, because a clipped or transparent
   * icon has a perfect box and nothing on the screen.
   */
  const painted = await page.evaluate(
    ({ x, y }) => {
      const hit = document.elementFromPoint(x, y);
      return hit?.closest('.bb-breadcrumb-separator') !== null;
    },
    { x: box!.x + box!.width / 3, y: box!.y + box!.height / 2 }
  );
  expect(painted).toBe(true);
});

test('the last step is the page you are on, and is not a stop', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const current = page.getByText('Invoices', { exact: true });
  await expect(current).toHaveAttribute('aria-current', 'page');

  // Two links, and the current step is not one of them.
  await expect(page.getByRole('link')).toHaveCount(2);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Customers' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Astilleros del Sur' })
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(current).not.toBeFocused();
});

test('a trail of one is the page you are on and nothing else', async ({
  page
}) => {
  await gotoStory(page, LENGTHS);

  const first = page.locator('.bb-breadcrumbs').first();
  await expect(first.locator('.bb-breadcrumb')).toHaveCount(1);
  await expect(first.getByRole('link')).toHaveCount(0);
  await expect(first.getByText('Customers')).toHaveAttribute(
    'aria-current',
    'page'
  );

  // And its one separator is the one that is dropped.
  const display = await first
    .locator('.bb-breadcrumb-separator')
    .evaluate(node => getComputedStyle(node).display);
  expect(display).toBe('none');
});

test('a trail too long for its container wraps instead of overflowing', async ({
  page
}) => {
  await gotoStory(page, NARROW);

  const trail = page.locator('.bb-breadcrumbs');
  const seen = await trail.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    lines: new Set(
      [...element.querySelectorAll('li')].map(step =>
        Math.round(step.getBoundingClientRect().y)
      )
    ).size
  }));

  expect(seen.scrollWidth).toBeLessThanOrEqual(seen.clientWidth + 1);
  // More than one row of steps, which is what wrapping means. A trail that
  // clipped or overflowed would report one.
  expect(seen.lines).toBeGreaterThan(1);
});

test('the trail is named, and the separator is not part of the name', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const list = page.locator('.bb-breadcrumbs');
  const label = await list.getAttribute('aria-label');
  expect(label).not.toBeNull();
  expect(label).not.toBe('');

  /*
   * The glyphs are `aria-hidden`, so the accessible tree holds three items and
   * not six. Asserted through the roles rather than the attribute, because the
   * attribute is what we wrote and this is what a reader gets.
   */
  await expect(list.getByRole('listitem')).toHaveCount(3);
});
