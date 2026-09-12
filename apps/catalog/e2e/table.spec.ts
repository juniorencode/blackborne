/*
 * The table, in a browser, for the five things jsdom cannot answer.
 *
 * Where the heading row is after the body scrolls. Whether the component
 * encloses its own horizontal scrolling without the page scrolling with it
 * (doc 04 §7). Whether the focus ring is a real outline or an
 * `outline-hidden` that cancelled it. What a screen reader is given for a row.
 * And whether the sort mark turns rather than appearing, which is a layout
 * question the unit tests are forbidden from asking with a class assertion.
 *
 * Deliberately absent: anything that tests the base. The grid keyboard, the
 * sort descriptor and the announcement come from `react-aria-components`.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-table--overview';
const SORTABLE = 'components-table--sortable';
const TOO_WIDE = 'components-table--too-wide';
const SCROLLS_DOWN = 'components-table--scrolls-down';
const ABSENCES = 'components-table--absences';

test('the heading row stays put while the body scrolls', async ({ page }) => {
  await gotoStory(page, SCROLLS_DOWN);

  const heading = page.getByRole('columnheader', { name: /Number/ }).first();
  /*
   * THE COMPONENT'S OWN SCROLLER, and that is the finding rather than a
   * selector detail. `overflow-x: auto` makes it a scroll container in both
   * axes, so a height-constrained table is constrained on this element. The
   * first version of this check scrolled a WRAPPER with its own `overflow-y`,
   * which scrolled the wrapper and left the heading stuck to a scroller that
   * had not moved — and read as sticky being broken.
   */
  const scroller = page.locator('.bb-table-scroller');

  const before = await heading.boundingBox();
  expect(before?.y).toBeGreaterThan(0);

  /*
   * Scrolled as a STATE rather than waited for: the assertion below is what
   * says the scroll happened, so a scroll that never lands fails here rather
   * than making the sticky check pass for nothing (doc 10 §11.1.1).
   */
  const moved = await scroller.evaluate(element => {
    element.scrollTop = 400;
    return element.scrollTop;
  });
  expect(moved).toBeGreaterThan(100);

  const after = await heading.boundingBox();
  expect(
    Math.abs((before?.y ?? 0) - (after?.y ?? 0)),
    'the heading row moved with the body, so it is not sticky against the scroller'
  ).toBeLessThan(2);
});

test('a table too wide for its container scrolls itself, and the page does not', async ({
  page
}) => {
  await gotoStory(page, TOO_WIDE);

  const scroller = page.locator('.bb-table-scroller');

  const enclosed = await scroller.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
  }));
  expect(
    enclosed.scrollWidth,
    'this story exists to overflow; if it fits, it is measuring nothing'
  ).toBeGreaterThan(enclosed.clientWidth + 8);

  /*
   * Doc 04 §7's promise is that the consumer's page never scrolls sideways
   * BECAUSE OF US, and the first version of this asserted it on the document.
   * That was measuring the fixture: the catalog's own `.catalog-resizable`
   * decorator is 1274px inside a 1280px viewport at a 16px offset, so the
   * document overflows by 10px on every story in the suite and has nothing to
   * do with this component (doc 10 §11).
   *
   * What is ours is that the overflow is ENCLOSED: the scroller is no wider
   * than the element it was given, whatever its content does.
   */
  const enclosure = await scroller.evaluate(element => {
    const parent = element.parentElement;
    return {
      own: element.getBoundingClientRect().width,
      given: parent?.getBoundingClientRect().width ?? 0
    };
  });
  expect(
    enclosure.own,
    'the table widened the element it was given, so the page around it scrolls'
  ).toBeLessThanOrEqual(enclosure.given + 1);
});

test('and the keyboard reaches what the overflow hides', async ({ page }) => {
  await gotoStory(page, TOO_WIDE);

  const scroller = page.locator('.bb-table-scroller');
  expect(await scroller.evaluate(element => element.scrollLeft)).toBe(0);

  await page
    .getByRole('columnheader', { name: /Number/ })
    .first()
    .click();
  for (let step = 0; step < 5; step++) await page.keyboard.press('ArrowRight');

  /* A STATE, polled: the scroll follows focus asynchronously. */
  await expect
    .poll(() => scroller.evaluate(element => element.scrollLeft))
    .toBeGreaterThan(0);
});

test('the focus ring is a real outline and not a cancelled one', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  await page
    .getByRole('columnheader', { name: /Number/ })
    .first()
    .click();
  await page.keyboard.press('ArrowDown');

  const ring = await page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return null;
    const style = getComputedStyle(active);
    return {
      tag: active.tagName,
      width: style.outlineWidth,
      style: style.outlineStyle
    };
  });

  /*
   * `outline-hidden` sets `outline-style: none` and beats an `outline-2`
   * beside it — measured on `ColorSwatchField`, where three swatches on a row
   * labelled "Chosen" drew no ring at all. This is the assertion that would
   * have caught it.
   */
  expect(ring?.style, 'the outline was cancelled rather than drawn').not.toBe(
    'none'
  );
  expect(Number.parseFloat(ring?.width ?? '0')).toBeGreaterThan(0);
});

test('a row is named by the column that identifies it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const row = page.getByRole('row').nth(1);
  const named = await row.evaluate(element =>
    (element.getAttribute('aria-labelledby') ?? '').trim()
  );

  /*
   * NON-EMPTY, which is the whole finding. The base renders
   * `aria-labelledby=""` on a row with no row header rather than omitting the
   * attribute, so a check for the attribute's presence is satisfied by the
   * broken case. Measured in wave 0 and refined in wave 1.
   */
  expect(
    named,
    'the row carries an empty aria-labelledby, so it has no name'
  ).not.toBe('');

  const snapshot = await row.ariaSnapshot();
  expect(snapshot).toContain('F001-000412');
});

test('the sort mark turns rather than appearing', async ({ page }) => {
  await gotoStory(page, SORTABLE);

  const mark = page
    .getByRole('columnheader', { name: /Customer/ })
    .locator('.bb-table-sort');

  /*
   * The box is there before anything is sorted, which is the point: a mark
   * that appears widens the heading and shifts the whole row the first time
   * anybody sorts. So its WIDTH is asserted while it is invisible.
   */
  const resting = await mark.boundingBox();
  expect(resting?.width ?? 0).toBeGreaterThan(0);
  expect(
    Number.parseFloat(
      await mark.evaluate(element => getComputedStyle(element).opacity)
    )
  ).toBeLessThan(0.5);

  await page.getByRole('columnheader', { name: /Customer/ }).click();

  await expect
    .poll(() =>
      mark.evaluate(element =>
        Number.parseFloat(getComputedStyle(element).opacity)
      )
    )
    .toBeGreaterThan(0.5);

  const sorted = await mark.boundingBox();
  expect(
    Math.abs((resting?.width ?? 0) - (sorted?.width ?? 0)),
    'the heading changed width when it became the sorted one'
  ).toBeLessThan(1);
});

test('the three absences fill the table rather than sitting beside it', async ({
  page
}) => {
  await gotoStory(page, ABSENCES);

  for (const text of [
    'Nothing here yet',
    'No invoices match',
    'The request timed out before the invoices arrived.'
  ]) {
    const absence = page.getByText(text, { exact: false }).first();
    await expect(absence).toBeVisible();

    const inside = await absence.evaluate(element => {
      const cell = element.closest('td, th');
      const table = element.closest('table');
      if (!cell || !table) return null;
      return {
        cellWidth: cell.getBoundingClientRect().width,
        tableWidth: table.getBoundingClientRect().width
      };
    });

    expect(inside, `"${text}" is not inside a table cell`).not.toBeNull();
    expect(
      inside?.cellWidth ?? 0,
      `"${text}" does not span the table, so the columns show through it`
    ).toBeGreaterThan((inside?.tableWidth ?? 0) - 4);
  }

  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
