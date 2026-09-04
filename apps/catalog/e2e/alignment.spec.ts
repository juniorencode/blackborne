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

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

const SIZES = ['sm', 'md', 'lg'] as const;

for (const size of SIZES) {
  test(`a field and a button of size ${size} are exactly the same height`, async ({
    page
  }) => {
    await page.goto(story('components-textfield--aligns-with-button'));

    const row = page.getByTestId(`align-${size}`);
    const input = row.getByRole('textbox');
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
  await page.goto(story('components-textfield--aligns-with-button'));

  const heights: number[] = [];
  for (const size of SIZES) {
    const box = await page
      .getByTestId(`align-${size}`)
      .getByRole('textbox')
      .boundingBox();
    heights.push(box?.height ?? 0);
  }

  const [sm, md, lg] = heights;
  expect(sm).toBeLessThan(md ?? 0);
  expect(md).toBeLessThan(lg ?? 0);
});

test('compact density shrinks the control and keeps it aligned', async ({
  page
}) => {
  await page.goto(story('components-textfield--densities'));

  const panel = (label: string) =>
    page.locator(`.catalog-panel:has(.catalog-label:text-is("${label}"))`);

  const normal = await panel('Normal')
    .getByRole('textbox')
    .first()
    .boundingBox();
  const compact = await panel('Compact')
    .getByRole('textbox')
    .first()
    .boundingBox();

  expect(compact?.height).toBeLessThan(normal?.height ?? 0);
});
