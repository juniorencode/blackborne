/*
 * Exactly one mark, in every combination.
 *
 * This exists because of a reported bug: a checkbox that was both
 * indeterminate and selected drew the tick on top of the dash. The cause was
 * relying on utility order to resolve a conflict — two utilities of equal
 * specificity, whose winner is decided by whatever order the generator emits,
 * not by the order they are written in the component.
 *
 * Which is why this is a browser test and not a unit test: the question is
 * "what did the browser actually paint", and jsdom applies no stylesheet.
 */
import { expect, test } from '@playwright/test';

const story = '/iframe.html?id=components-checkbox--marks&viewMode=story';

const CASES = [
  { id: 'mark-none', check: false, dash: false },
  { id: 'mark-selected', check: true, dash: false },
  { id: 'mark-indeterminate', check: false, dash: true },
  // The reported bug. A mixed state is mixed regardless of the underlying
  // value, so indeterminate wins and the tick stays hidden.
  { id: 'mark-both', check: false, dash: true }
] as const;

/**
 * The computed `display` of both marks.
 *
 * Not Playwright's toBeVisible: that requires a non-empty bounding box, and
 * the dash is a horizontal stroke whose geometric box is zero pixels tall. It
 * reported the dash as hidden while the browser was painting it perfectly.
 *
 * The rule under test is which mark is DISPLAYED, so that is what is asserted.
 */
const displays = async (page: import('@playwright/test').Page, id: string) =>
  page.getByTestId(id).evaluate(row => ({
    tick: getComputedStyle(row.querySelector('.bb-checkbox-check')!).display,
    dash: getComputedStyle(row.querySelector('.bb-checkbox-dash')!).display
  }));

test.beforeEach(async ({ page }) => {
  await page.goto(story);
});

for (const { id, check, dash } of CASES) {
  test(`${id}: tick ${check ? 'shown' : 'hidden'}, dash ${dash ? 'shown' : 'hidden'}`, async ({
    page
  }) => {
    const marks = await displays(page, id);

    expect(marks.tick).toBe(check ? 'block' : 'none');
    expect(marks.dash).toBe(dash ? 'block' : 'none');
  });
}

test('the two marks are never shown at once', async ({ page }) => {
  for (const { id } of CASES) {
    const marks = await displays(page, id);
    const both = marks.tick !== 'none' && marks.dash !== 'none';
    // The reported bug, stated as an invariant rather than as one case.
    expect(both, `${id} shows both marks`).toBe(false);
  }
});
