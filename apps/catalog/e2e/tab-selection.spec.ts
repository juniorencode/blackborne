/*
 * What happens to the text already in a field when you tab into it.
 *
 * Measured rather than assumed, after the behaviour looked random from the
 * catalog. It is not random — it splits cleanly by kind of field:
 *
 *   single-line, with a value  ->  the whole value is selected
 *   multi-line, with a value   ->  the caret goes to the start
 *   any field, empty           ->  the caret goes to the start
 *
 * And the split is the right one. A single-line value is nearly always
 * REPLACED: you tab to "12" to make it "40", so arriving with it selected
 * means typing does the job. A long note is EDITED, and arriving with three
 * paragraphs selected means one keystroke destroys them.
 *
 * The reason this file exists is that nothing was enforcing any of it. The
 * behaviour comes from the base and could change under us in a minor upgrade,
 * silently, in a way no unit test would notice — jsdom does not implement
 * selection on tab.
 *
 * Doc 09 §8 requires that keys mean the same thing across the library. This is
 * the written form of that for Tab, and doc 07 §11 carries the rule.
 */
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

type Selection = 'all' | 'start' | 'other';

/** How the active text control's selection sits. */
const selectionState = (
  page: import('@playwright/test').Page
): Promise<Selection> =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLInputElement | null;
    if (!el || !('selectionStart' in el)) return 'other';
    const { selectionStart: start, selectionEnd: end, value } = el;
    if (value.length > 0 && start === 0 && end === value.length) return 'all';
    if (start === 0 && end === 0) return 'start';
    return 'other';
  }) as Promise<Selection>;

/** Tab until a text control with the given value has focus. */
const tabTo = async (
  page: import('@playwright/test').Page,
  value: string,
  limit = 12
) => {
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  for (let i = 0; i < limit; i += 1) {
    await page.keyboard.press('Tab');
    const current = await page.evaluate(() => {
      const el = document.activeElement as HTMLInputElement | null;
      return el && 'value' in el ? el.value : null;
    });
    if (current === value) return true;
  }
  return false;
};

test('a single-line field arrives with its value selected', async ({
  page
}) => {
  await page.goto(story('components-textfield--states'));

  expect(await tabTo(page, 'Ada Lovelace')).toBe(true);
  // Typing replaces, which is what someone tabbing to a short value wants.
  expect(await selectionState(page)).toBe('all');
});

test('a number field arrives with its value selected', async ({ page }) => {
  await page.goto(story('components-numberfield--states'));

  expect(await tabTo(page, '1,234.5')).toBe(true);
  // Most true of all here: you tab to a quantity to change it, not to insert
  // a digit in the middle of it.
  expect(await selectionState(page)).toBe('all');
});

test('a multi-line field arrives with the caret at the start', async ({
  page
}) => {
  await page.goto(story('components-textarea--states'));

  const value = 'Delivered on Tuesday, signed for by reception.';
  expect(await tabTo(page, value)).toBe(true);

  // NOT selected, deliberately. A long note is edited rather than replaced,
  // and arriving with it all selected means one keystroke destroys it.
  expect(await selectionState(page)).toBe('start');
});

test('an empty field of any kind puts the caret at the start', async ({
  page
}) => {
  for (const id of [
    'components-textfield--states',
    'components-textarea--states',
    'components-numberfield--states'
  ]) {
    await page.goto(story(id));
    expect(await tabTo(page, ''), id).toBe(true);
    expect(await selectionState(page), id).toBe('start');
  }
});
