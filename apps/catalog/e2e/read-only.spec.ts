/*
 * Doc 07 §6, and the entry gate with it: **disabled and read-only look
 * different**, because they mean different things. Read-only shows a value you
 * can read, select and copy; disabled says this does not apply right now.
 *
 * The reason this file exists is that they did not, for as long as the library
 * has had a field. The class was `data-readonly:` on the control, and a
 * read-only input gets the native `readonly` attribute and no data attribute
 * at all — the state lives on the field's ROOT. So the rule was written, the
 * class was written, and nothing connected them.
 *
 * It survived every layer of checking, which is the part worth learning from:
 * the unit test asserts they BEHAVE differently and they do; the catalog has a
 * read-only row and it looked like an ordinary field with a value, which is
 * exactly what it was; and a screenshot only says a picture changed, never
 * that it was right in the first place.
 *
 * Comparing computed colours is the only instrument that would have caught it,
 * and jsdom resolves no variables.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

/** The control that draws the box, found by its accessible name. */
const box = (page: import('@playwright/test').Page, name: string) =>
  page
    .getByRole('textbox', { name })
    .or(page.getByRole('spinbutton', { name }));

for (const story of [
  'components-textfield--states',
  'components-textarea--states'
]) {
  test(`read-only is visibly not a box in ${story}`, async ({ page }) => {
    await gotoStory(page, story);

    const ordinary = box(page, 'With value');
    const readOnly = box(page, 'Read only');

    const paint = (locator: import('@playwright/test').Locator) =>
      locator.evaluate(node => {
        const style = getComputedStyle(node);
        return {
          background: style.backgroundColor,
          border: style.borderTopColor,
          text: style.color
        };
      });

    const normal = await paint(ordinary);
    const read = await paint(readOnly);

    // The fill drops to the page's own, so the field stops reading as a box.
    expect(read.background, 'read-only keeps the control fill').not.toBe(
      normal.background
    );

    // And the edge goes, which is the channel that does not depend on being
    // able to tell two greys apart (doc 06 §3).
    expect(read.border, 'read-only still draws an edge').not.toBe(
      normal.border
    );

    /*
     * The value stays at full contrast. Read-only is not disabled: somebody
     * has to be able to read it and copy it, which is the whole distinction
     * doc 07 §6 draws between the two.
     */
    expect(read.text).toBe(normal.text);
  });

  test(`hovering a read-only field does not bring its edge back in ${story}`, async ({
    page
  }) => {
    await gotoStory(page, story);

    const readOnly = box(page, 'Read only');
    const edge = () =>
      readOnly.evaluate(node => getComputedStyle(node).borderTopColor);

    const before = await edge();
    await readOnly.hover();
    expect(await edge(), 'the box answered the pointer as if editable').toBe(
      before
    );
  });
}
