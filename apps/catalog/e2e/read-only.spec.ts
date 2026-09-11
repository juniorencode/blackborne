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
import { fieldBox } from './field';
import { gotoStory } from './story';

/**
 * The element that draws the box. A single-line field paints it on the frame
 * that wraps the control; a text area paints it on the control itself, having
 * no frame.
 */
const box = (page: import('@playwright/test').Page, name: string) =>
  page
    .getByRole('textbox', { name })
    .or(page.getByRole('spinbutton', { name }));

for (const [story, framed] of [
  ['components-textfield--states', true],
  ['components-textarea--states', false]
] as const) {
  test(`read-only is visibly not a box in ${story}`, async ({ page }) => {
    await gotoStory(page, story);

    const control = (name: string) => box(page, name);
    const measured = (name: string) =>
      framed ? fieldBox(control(name)) : control(name);

    const ordinary = measured('With value');
    const readOnly = measured('Read only');

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

    const measured = (name: string) =>
      framed ? fieldBox(box(page, name)) : box(page, name);
    const edgeOf = (locator: import('@playwright/test').Locator) =>
      locator.evaluate(node => getComputedStyle(node).borderTopColor);

    /*
     * ONE OF EACH (doc 10 §11.1), and the ordinary field is the half that
     * proves the RULE is still there. `internal/Field/controlBox` puts
     * `border-border-strong` on `data-hovered`, and keeping that off a
     * read-only box is this whole test. Without this half, deleting the hover
     * rule outright would make the check below pass.
     *
     * A bare `hover()` is right here, and that is measured rather than
     * assumed: the base's `useHover` has no modality gate — it tests only
     * `isDisabled`, a touch pointer, an already-hovered state and containment
     * — so a teleport does publish `data-hovered`. It is a tooltip's trigger
     * and a menu item that consult the global modality, which is why they need
     * `e2e/pointer.ts` and this does not.
     */
    const ordinary = measured('With value');
    const atRest = await edgeOf(ordinary);
    await ordinary.hover();
    await expect.poll(() => edgeOf(ordinary)).not.toBe(atRest);

    const readOnly = measured('Read only');
    const before = await edgeOf(readOnly);
    await readOnly.hover();

    /*
     * The pointer is demonstrably on THIS box. Presence rather than the value:
     * `select.spec.ts` records that the base spells these two different ways,
     * so pinning the string would assert the spelling.
     */
    await expect(readOnly).toHaveAttribute('data-hovered', /.*/);

    /*
     * And the edge is asked of the ANIMATION rather than of a clock (doc 10
     * §11). One read of the colour lands at t≈0 of a 100ms transition, so an
     * edge that WAS coming back reads as the old colour and the check passes
     * over exactly the precedence regression `controlBox.css` was written to
     * state. The two assertions cover the whole window between them: the
     * transition names it while it runs, the colour names it once it is done.
     */
    const settling = await readOnly.evaluate(node =>
      node
        .getAnimations()
        .map(animation =>
          animation instanceof CSSTransition ? animation.transitionProperty : ''
        )
    );
    expect(settling, 'the edge started coming back on hover').not.toContain(
      'border-top-color'
    );

    expect(
      await edgeOf(readOnly),
      'the box answered the pointer as if editable'
    ).toBe(before);
  });
}
