/*
 * One control, two fields, a pair of calendars — and THE ONE VIEWPORT QUESTION
 * this library asks.
 *
 * Doc 04 §5 grants that exception to components rendered in a portal, and this
 * is the component that needed it: a range calendar inside a popover has to
 * build one month or two, the count is a prop of the base's state rather than a
 * paint, and a container query collapses inside a content-sized layer (§4.3).
 * So the check that matters here resizes the WINDOW and asks whether the range
 * survived — rule 4, read across a structural change nothing else in this
 * library makes.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pinClock } from './clock';
import { gotoStory } from './story';

const OVERVIEW = 'components-daterangepicker--overview';
const OPENED = 'components-daterangepicker--opened';
const STATES = 'components-daterangepicker--states';
const NARROW = 'components-daterangepicker--in-a-narrow-panel';
const MAXIMUM = 'components-daterangepicker--a-maximum-length';
const TOGETHER = 'components-daterangepicker--together';
const RTL = 'components-daterangepicker--direction';

test.beforeEach(async ({ page }) => {
  await pinClock(page);
});

/** What the layer is showing, read from the page. */
const layer = (page: Page) =>
  page.evaluate(() => {
    const found = document.querySelector('.bb-date-range-picker-layer');
    if (found === null) return null;
    const box = found.getBoundingClientRect();
    return {
      months: found.querySelectorAll('.bb-calendar-grid').length,
      title: found.querySelector('.bb-calendar-title')?.textContent ?? '',
      chosen: [...found.querySelectorAll('[data-selected]')].map(cell =>
        (cell as HTMLElement).innerText.trim()
      ),
      left: Math.round(box.left),
      right: Math.round(box.right),
      viewport: document.documentElement.clientWidth
    };
  });

test('the WINDOW decides how many months, and the range survives it', async ({
  page
}) => {
  await gotoStory(page, OPENED);
  await expect(page.locator('.bb-date-range-picker-layer')).toBeVisible();

  const wide = await layer(page);
  expect(wide?.months).toBe(2);
  expect(wide?.chosen).toHaveLength(8);

  /*
   * ACROSS THE THRESHOLD AND BACK. The number is `34rem`, declared in the
   * component with the reason beside it — and deliberately not the container
   * scale, because that one says how wide a container is rather than when a
   * window has run out of room (`Dialog.css`'s sentence).
   */
  await page.setViewportSize({ width: 420, height: 900 });
  await expect.poll(async () => (await layer(page))?.months).toBe(1);
  const narrow = await layer(page);

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(async () => (await layer(page))?.months).toBe(2);
  const back = await layer(page);

  /*
   * RULE 4, asked of the only structural change in this library that a WINDOW
   * drives: the eight days are the same eight at every size, and the check
   * comes back because a structure that loses the value on the way out looks
   * fine on the way in.
   */
  expect(narrow?.chosen).toEqual(wide?.chosen);
  expect(back?.chosen).toEqual(wide?.chosen);
  expect(narrow?.title).not.toContain('October');
  expect(back?.title).toContain('October');
});

test('the two halves take different props from the base slots', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const halves = await page.locator('.bb-date-segments').evaluateAll(rows =>
    rows.map(row => ({
      slot: row.getAttribute('slot'),
      text: (row as HTMLElement).innerText.replace(/\s/g, '')
    }))
  );

  /*
   * A range picker publishes a SLOTTED field context, so a shared segment row
   * inside one has to name which half it is. Without that both rows take the
   * same props and a range is one date typed twice — the same rule the package
   * guide records for a shared button, arriving on a second kind of element.
   */
  expect(halves).toHaveLength(2);
  expect(halves.map(half => half.slot)).toEqual(['start', 'end']);
  expect(halves[0]!.text).not.toBe(halves[1]!.text);
});

test('the layer stays on screen in a 320px panel', async ({ page }) => {
  await gotoStory(page, NARROW);
  await expect(page.locator('.bb-date-range-picker-layer')).toBeVisible();

  const seen = await layer(page);

  /*
   * TWO MONTHS IN A 320px PANEL, and that is the exception working rather
   * than failing: the layer renders in a portal, so its real container is the
   * WINDOW and the window here is 1280. A panel's width decides nothing about
   * something that is not inside it — which is the whole reason doc 04 §5
   * grants the exception, and the reason the check that matters resizes the
   * window instead.
   *
   * What the panel's width DOES decide is where the layer is anchored, so the
   * two assertions below are the ones about it: on screen at both edges.
   */
  expect(seen?.months).toBe(2);
  expect(seen!.left).toBeGreaterThanOrEqual(0);
  expect(seen!.right).toBeLessThanOrEqual(seen!.viewport);
});

test('the chevron and the cross both clear the minimum target', async ({
  page
}) => {
  await gotoStory(page, TOGETHER);

  const measured = await page
    .locator('.bb-date-range-picker-toggle, .bb-field-clear')
    .evaluateAll(nodes =>
      nodes.map(node => {
        const box = node.getBoundingClientRect();
        return {
          what: node.className.includes('clear') ? 'cross' : 'chevron',
          width: box.width,
          height: box.height,
          floor: Number.parseFloat(
            getComputedStyle(node).getPropertyValue('--bb-control-hit-area')
          )
        };
      })
    );

  /* Doc 07 §2.2a's first condition, on the second component under it. */
  expect(measured.filter(one => one.what === 'cross').length).toBeGreaterThan(
    0
  );
  expect(measured.filter(one => one.what === 'chevron').length).toBeGreaterThan(
    0
  );
  for (const one of measured) {
    expect(one.floor).toBeGreaterThan(0);
    expect(
      one.width,
      `a ${one.what} measured ${one.width} against a floor of ${one.floor}`
    ).toBeGreaterThanOrEqual(one.floor - 0.5);
    expect(one.height).toBeGreaterThanOrEqual(one.floor - 0.5);
  }
});

test('the cross empties the range and does NOT open the layer', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const value = () => page.locator('.catalog-label').last().innerText();
  expect(await value()).toContain('2026-09-05');

  await page.locator('.bb-field-clear').click();

  /* The unslotted button context again, and `slot={null}` is what stops it. */
  expect(await value()).toContain('Empty');
  await expect(page.locator('.bb-date-range-picker-layer')).toHaveCount(0);
});

test('the chevron turns over while the layer is open', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const rotation = () =>
    page
      .locator('.bb-date-range-picker-toggle svg')
      .evaluate(glyph => getComputedStyle(glyph).rotate);

  expect(await rotation()).toBe('none');
  await page.locator('.bb-date-range-picker-toggle').click();
  await expect(page.locator('.bb-date-range-picker-layer')).toBeVisible();
  await expect.poll(rotation).toBe('180deg');
});

test('a maximum length reaches the calendar through the anchor', async ({
  page
}) => {
  await gotoStory(page, MAXIMUM);
  await expect(page.locator('.bb-date-range-picker-layer')).toBeVisible();

  /*
   * The story's rule is "at most seven nights from the day you pick first", and
   * it is the unavailable-day function rather than a prop — which is the point:
   * a maximum that moves with the anchor is not a number. Pressing a day sets
   * the anchor, and the days more than a week away go unavailable.
   */
  const before = await page
    .locator('.bb-date-range-picker-layer .bb-calendar-day[data-unavailable]')
    .count();

  await page
    .locator('.bb-date-range-picker-layer .bb-calendar-day')
    .filter({ hasText: /^16$/ })
    .first()
    .click();

  const after = await page
    .locator('.bb-date-range-picker-layer .bb-calendar-day[data-unavailable]')
    .count();

  expect(before).toBe(0);
  expect(after).toBeGreaterThan(0);
});

test('a busy control offers neither of its two edges', async ({ page }) => {
  await gotoStory(page, STATES);

  const saving = page.locator('.catalog-panel').filter({ hasText: 'Saving' });
  const seen = await saving.evaluate(panel => {
    const frame = panel.querySelector('.bb-field-box')!;
    return [...frame.children]
      .filter(child => child.querySelector('button') !== null)
      .map(edge => ({
        width: Math.round(edge.getBoundingClientRect().width),
        inert: edge.hasAttribute('inert')
      }));
  });

  expect(seen.length).toBeGreaterThan(0);
  for (const edge of seen) {
    expect(edge.width).toBeGreaterThan(0);
    expect(edge.inert).toBe(true);
  }
});

test('in Arabic the halves and the chevron swap ends', async ({ page }) => {
  await gotoStory(page, RTL);

  const seen = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.bb-date-segments')];
    const toggle = document.querySelector('.bb-date-range-picker-toggle')!;
    return {
      first: Math.round(rows[0]!.getBoundingClientRect().x),
      second: Math.round(rows[1]!.getBoundingClientRect().x),
      toggle: Math.round(toggle.getBoundingClientRect().x)
    };
  });

  /* The start is furthest right, and the chevron is at the reading end. */
  expect(seen.first).toBeGreaterThan(seen.second);
  expect(seen.toggle).toBeLessThan(seen.second);
});
