/*
 * Doc 03 §4.6c allows a form exactly two vertical gaps: a small one INSIDE a
 * field, between label, control and message, and a larger one BETWEEN fields.
 * Two values, decided once.
 *
 * It reads like fussiness and it is not. Six gaps is how a long form ends up
 * looking untidy without anyone being able to say where, and the usual
 * response is to add a seventh. The check only became possible with two field
 * types built, because the real risk is not the numbers themselves — it is two
 * different field types disagreeing about them.
 *
 * The gap is found by walking up from the control to the first ancestor that
 * declares one, rather than by guessing at DOM structure. That way the test
 * asserts the rule and does not break when a wrapper is added.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoStory } from './story';

/**
 * MEASURED AS GEOMETRY, not read off `row-gap`, and that is the whole point of
 * this rewrite.
 *
 * The first version walked up from the control to the first flex COLUMN with a
 * gap and returned it. That stopped being the field's gap on 2026-09-13, when
 * the space moved from the column onto a margin on whatever sits above the
 * control — so the walk sailed past the field and returned the FORM's gap.
 * Both field types then reported 16 and the test comparing them passed for the
 * wrong reason, which is worse than the failure beside it.
 *
 * Pixels between two boxes answer the question the rule actually asks, and
 * they keep answering it whichever property a component uses to produce them.
 */
const distanceBetween = async (above: Locator, below: Locator) => {
  const top = await above.boundingBox();
  const bottom = await below.boundingBox();
  if (!top || !bottom) throw new Error('one of the two boxes is not rendered');
  return Math.round((bottom.y - (top.y + top.height)) * 10) / 10;
};

/**
 * The space above a message, measured from whatever the field actually drew
 * above it.
 *
 * From the previous SIBLING rather than from the control, because the control
 * is not the same element in the two field types and neither one is the box a
 * person sees: a checkbox's input is visually hidden inside its label, and a
 * text field's input sits inside the frame that draws the border. Measuring
 * from either reported a difference that was the markup rather than the gap.
 *
 * Siblings with no height are skipped, and there is one that matters: `Field`
 * renders an `aria-live` region between the control and the description, which
 * is `sr-only` and therefore exactly 1px tall. That 1px WAS the reading.
 */
const spaceAboveMessage = (message: Locator) =>
  message.evaluate(el => {
    let previous = el.previousElementSibling as HTMLElement | null;
    while (previous && previous.getBoundingClientRect().height <= 2) {
      previous = previous.previousElementSibling as HTMLElement | null;
    }
    if (!previous) throw new Error('nothing is drawn above this message');
    const above = previous.getBoundingClientRect();
    const below = el.getBoundingClientRect();
    return Math.round((below.top - above.bottom) * 10) / 10;
  });

/** The one gap a field has: whatever is above the control, to the control. */
const gapAboveControl = (page: Page, label: RegExp, control: Locator) =>
  distanceBetween(page.getByText(label, { exact: false }).first(), control);

test('a text field and a checkbox agree on the space under the control', async ({
  page
}) => {
  await gotoStory(page, 'components-checkbox--in-a-form');

  /*
   * The rule changed on 2026-09-13 and this test with it. A field's one inner
   * gap sits ABOVE its control; underneath, a description or an error belongs
   * to the control it explains and hugs it. A checkbox has nothing above its
   * control at all, so "the gap inside a field" is not a number the two share
   * — what they share is this one, and a form of mixed field types is exactly
   * where disagreeing about it shows.
   */
  const underText = await spaceAboveMessage(
    page.getByText('As it appears on your identity document.').first()
  );
  const underCheckbox = await spaceAboveMessage(
    page.getByText('You can withdraw consent at any time.').first()
  );

  expect(underCheckbox).toBe(underText);
});

test('the gap between fields is larger than the gap inside one', async ({
  page
}) => {
  await gotoStory(page, 'components-checkbox--in-a-form');

  const between = Number.parseFloat(
    await page.getByTestId('form').evaluate(el => getComputedStyle(el).rowGap)
  );
  const inside = await gapAboveControl(
    page,
    /Full name/,
    page.getByRole('textbox', { name: /Full name/ })
  );

  expect(inside).toBeGreaterThan(0);
  expect(between).toBeGreaterThan(inside);
});

test('compact trims both gaps rather than one of them', async ({ page }) => {
  await gotoStory(page, 'components-checkbox--in-a-form');
  const normalInside = await gapAboveControl(
    page,
    /Full name/,
    page.getByRole('textbox', { name: /Full name/ })
  );
  const normalBetween = Number.parseFloat(
    await page.getByTestId('form').evaluate(el => getComputedStyle(el).rowGap)
  );

  await gotoStory(page, 'components-checkbox--in-a-form-dark-compact');
  const compactInside = await gapAboveControl(
    page,
    /Full name/,
    page.getByRole('textbox', { name: /Full name/ })
  );
  const compactBetween = Number.parseFloat(
    await page.locator('form').evaluate(el => getComputedStyle(el).rowGap)
  );

  // Density trims air everywhere, not in one place (doc 03 §3).
  expect(compactBetween).toBeLessThan(normalBetween);
  expect(compactInside).toBeLessThan(normalInside);
});
