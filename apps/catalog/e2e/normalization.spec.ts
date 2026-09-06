/*
 * Where the caret ends up after a field rewrites what was typed.
 *
 * This is the whole reason `normalize` is a prop on a field rather than
 * something a consumer does in their own `onChange`. The transformations are a
 * few lines each; keeping the cursor where the person put it is not, and it is
 * invisible until somebody edits the middle of a value.
 *
 * jsdom implements no selection, so the unit tests assert which value comes
 * out and deliberately say nothing about where the caret is. This file is the
 * only instrument for the other half (doc 07 §2.1).
 *
 * Doc 09 §7 in one line: nothing moves under the cursor. A field that sends
 * the caret to the end on every keystroke that rewrites something breaks that
 * once per key.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const STORY = 'components-textfield--normalization';

/** Put the caret at a known place, the way a person clicking would. */
const place = async (
  input: import('@playwright/test').Locator,
  position: number
) => {
  await input.evaluate((node, at) => {
    (node as HTMLInputElement).setSelectionRange(at, at);
  }, position);
};

const caretOf = (input: import('@playwright/test').Locator) =>
  input.evaluate(node => (node as HTMLInputElement).selectionStart);

test('a rewritten value comes out normalized', async ({ page }) => {
  await gotoStory(page, STORY);

  /*
   * The test id lands on the field's outer element, because that is where a
   * spread prop goes (doc 02 §2). The input is inside it.
   */
  const plate = page.getByTestId('plate').getByRole('textbox');
  await plate.fill('');
  await plate.pressSequentially('ab 12 cd');

  await expect(plate).toHaveValue('AB12CD');
});

test('the caret stays where it was put when a keystroke is rewritten', async ({
  page
}) => {
  await gotoStory(page, STORY);

  /*
   * The test id lands on the field's outer element, because that is where a
   * spread prop goes (doc 02 §2). The input is inside it.
   */
  const plate = page.getByTestId('plate').getByRole('textbox');
  await plate.fill('');
  await plate.pressSequentially('AB12CD');

  // Between the B and the 1, the way somebody correcting a value would click.
  await place(plate, 2);
  await page.keyboard.type('z');

  await expect(plate).toHaveValue('ABZ12CD');

  /*
   * Three, immediately after the character just typed. Without the correction
   * this is seven — the end — because React rewrites the whole value and the
   * browser puts the cursor after it.
   */
  expect(await caretOf(plate)).toBe(3);
});

test('the caret survives a keystroke that changes nothing at all', async ({
  page
}) => {
  await gotoStory(page, STORY);

  /*
   * The test id lands on the field's outer element, because that is where a
   * spread prop goes (doc 02 §2). The input is inside it.
   */
  const plate = page.getByTestId('plate').getByRole('textbox');
  await plate.fill('');
  await plate.pressSequentially('AB12CD');

  await place(plate, 2);
  // A space, which this field drops — so the value is identical afterwards.
  await page.keyboard.type(' ');

  await expect(plate).toHaveValue('AB12CD');

  /*
   * The case that produced a real bug rather than a theoretical one. The
   * normalized value equals the state React already holds, so React declines
   * to re-render — and with it, the effect that puts the caret back never
   * runs. Measured with that hole open, typing "ab 12" came out as "AB21",
   * because the position recorded for the space was applied to the NEXT key.
   */
  expect(await caretOf(plate)).toBe(2);

  // And the proof that it was not merely parked: typing continues correctly
  // from where the caret is.
  await page.keyboard.type('9');
  await expect(plate).toHaveValue('AB912CD');
});
