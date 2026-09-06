/*
 * Doc 03 §9 carries a required check that could not be made until two
 * controls existed: "a field, a select and a button of the same size align
 * exactly in a row".
 *
 * It reads like a detail and it is not. When controls of the same nominal size
 * differ by two pixels, nothing on a form quite lines up, and the usual
 * response is to nudge a margin somewhere — which hides the symptom and keeps
 * the cause. The cause is always the same: heights that came from somewhere
 * other than the shared scale.
 *
 * Eyeballing two pixels is not a check, so it is asserted.
 */
import { expect, test } from '@playwright/test';
import { fieldBox } from './field';
import { gotoStory } from './story';

const SIZES = ['sm', 'md', 'lg'] as const;

for (const size of SIZES) {
  test(`a field and a button of size ${size} are exactly the same height`, async ({
    page
  }) => {
    await gotoStory(page, 'components-textfield--aligns-with-button');

    const row = page.getByTestId(`align-${size}`);
    /*
     * The FRAME, not the input. A field draws its box on a wrapper so that an
     * affix can sit inside the border and in the flow beside the value, so the
     * input measures two pixels short of the control — it is inside the
     * borders. tabular-figures.spec.ts has said the same thing about the
     * numeric field since it was written; now every field works that way.
     *
     * Measuring the input compares the wrong box, and it does not fail
     * loudly: it fails by two pixels, which is exactly the size of difference
     * this check exists to catch.
     */
    const input = fieldBox(row.getByRole('textbox'));
    const buttons = row.getByRole('button');

    const inputBox = await input.boundingBox();
    expect(inputBox).not.toBeNull();

    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
      const buttonBox = await buttons.nth(i).boundingBox();
      expect(buttonBox).not.toBeNull();
      // Exactly, not approximately. Both read the same control-height token,
      // so any difference means one of them stopped doing that.
      expect(buttonBox?.height).toBe(inputBox?.height);
    }
  });
}

test('the three sizes are a scale, not three arbitrary numbers', async ({
  page
}) => {
  await gotoStory(page, 'components-textfield--aligns-with-button');

  const heights: number[] = [];
  for (const size of SIZES) {
    const control = page.getByTestId(`align-${size}`).getByRole('textbox');
    const box = await fieldBox(control).boundingBox();
    heights.push(box?.height ?? 0);
  }

  const [sm, md, lg] = heights;
  expect(sm).toBeLessThan(md ?? 0);
  expect(md).toBeLessThan(lg ?? 0);
});

test('compact density shrinks the control and keeps it aligned', async ({
  page
}) => {
  await gotoStory(page, 'components-textfield--densities');

  const panel = (label: string) =>
    page.locator(`.catalog-panel:has(.catalog-label:text-is("${label}"))`);

  const normal = await fieldBox(
    panel('Normal').getByRole('textbox').first()
  ).boundingBox();
  const compact = await fieldBox(
    panel('Compact').getByRole('textbox').first()
  ).boundingBox();

  expect(compact?.height).toBeLessThan(normal?.height ?? 0);
});

test('every field sets its value at the same type size', async ({ page }) => {
  /*
   * The other half of "controls of the same size agree", and the half that
   * had no check.
   *
   * An `<input>` does not inherit `font-size`: browsers set a font on form
   * controls, and this package ships no reset to undo it — a library may not
   * overwrite a consumer's styles. So a size class on a WRAPPER reaches the
   * box and never the value.
   *
   * Measured on main before this was fixed, the numeric field's value came out
   * at the browser's 13.333px while every other field used the 14px token, in
   * the same form, at the same nominal size. The heights matched perfectly,
   * which is why the alignment check above never saw it, and the digits were
   * still tabular, which is why the tabular-figures check never saw it either.
   */
  await gotoStory(page, 'components-numberfield--aligns-with-others');

  const sizeOf = (locator: import('@playwright/test').Locator) =>
    locator.evaluate(node => getComputedStyle(node).fontSize);

  for (const size of SIZES) {
    const row = page.getByTestId(`nf-align-${size}`);

    /*
     * By its input mode, not by a role: measured, the base's numeric input
     * carries no `role` at all in 1.21 — it is an implicit textbox with
     * `inputmode="numeric"`, which is worth knowing because a locator asking
     * for a spinbutton here waits thirty seconds and finds nothing.
     */
    const number = await sizeOf(row.locator('input[inputmode="numeric"]'));
    const text = await sizeOf(row.getByRole('textbox', { name: 'Text' }));

    expect(number, `size ${size}`).toBe(text);

    // And not the browser's default, which is the value both would fall back
    // to if the class stopped reaching either of them.
    expect(number).not.toBe('13.3333px');
  }
});
