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
import { expect, test, type Locator } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

/**
 * The vertical gap of the field that contains this control, in pixels.
 *
 * A field wrapper is a flex COLUMN, and that qualifier is load-bearing:
 * without it, walking up from a checkbox finds the horizontal gap between its
 * box and its text first, and reports a disagreement between field types that
 * does not exist. The first version of this test did exactly that.
 */
const fieldGap = (control: Locator) =>
  control.evaluate(el => {
    let node: HTMLElement | null = el as HTMLElement;
    while (node) {
      const style = getComputedStyle(node);
      const gap = Number.parseFloat(style.rowGap);
      const isColumn =
        style.display.includes('flex') && style.flexDirection === 'column';
      if (isColumn && Number.isFinite(gap) && gap > 0) return gap;
      node = node.parentElement;
    }
    return 0;
  });

test('a text field and a checkbox agree on the gap inside a field', async ({
  page
}) => {
  await page.goto(story('components-checkbox--in-a-form'));

  const inText = await fieldGap(
    page.getByRole('textbox', { name: /Full name/ })
  );
  const inCheckbox = await fieldGap(
    page.getByRole('checkbox', { name: /product news/ })
  );

  expect(inText).toBeGreaterThan(0);
  // Two field types disagreeing here is what breaks the rhythm of a form.
  expect(inCheckbox).toBe(inText);
});

test('the gap between fields is larger than the gap inside one', async ({
  page
}) => {
  await page.goto(story('components-checkbox--in-a-form'));

  const between = Number.parseFloat(
    await page.getByTestId('form').evaluate(el => getComputedStyle(el).rowGap)
  );
  const inside = await fieldGap(
    page.getByRole('textbox', { name: /Full name/ })
  );

  expect(between).toBeGreaterThan(inside);
});

test('compact trims both gaps rather than one of them', async ({ page }) => {
  await page.goto(story('components-checkbox--in-a-form'));
  const normalInside = await fieldGap(
    page.getByRole('textbox', { name: /Full name/ })
  );
  const normalBetween = Number.parseFloat(
    await page.getByTestId('form').evaluate(el => getComputedStyle(el).rowGap)
  );

  await page.goto(story('components-checkbox--in-a-form-dark-compact'));
  const compactInside = await fieldGap(
    page.getByRole('textbox', { name: /Full name/ })
  );
  const compactBetween = Number.parseFloat(
    await page.locator('form').evaluate(el => getComputedStyle(el).rowGap)
  );

  // Density trims air everywhere, not in one place (doc 03 §3).
  expect(compactBetween).toBeLessThan(normalBetween);
  expect(compactInside).toBeLessThan(normalInside);
});
