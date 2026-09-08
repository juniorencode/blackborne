/*
 * The one thing about a confirmation that cannot be checked without a browser,
 * and it is the most important one: WHERE FOCUS LANDS.
 *
 * Doc 09 §5.5 — in a confirmation the destructive action is not the option
 * focused by default — and doc 08 §4 allows a component to focus a control on
 * open only with a written reason. `ConfirmDialog` is the library's first, so
 * this is the check that the reason is honoured rather than merely written.
 *
 * jsdom cannot say (doc 08 §9), and the failure is silent in the worst way: a
 * dialog that focuses Delete looks identical in a screenshot and deletes a
 * customer for anybody who answers it by reflex with the space bar.
 *
 * Everything else — the promise, the words, the role, the description — is in
 * the unit suite, where it is state and callbacks rather than pixels.
 *
 * One locator trap, recorded because it cost five red tests: Playwright matches
 * an accessible name by case-insensitive SUBSTRING unless told otherwise, so
 * `{ name: 'Delete' }` also matches the trigger button called "Delete
 * customer" and the click fails on strict mode rather than on the component.
 * Every button here is therefore scoped to the layer and matched exactly.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-confirmdialog--overview';
const ASYNC = 'components-confirmdialog--asynchronous';
const FAILING = 'components-confirmdialog--failing';

/** What has focus, by its accessible name. */
const focused = (page: import('@playwright/test').Page) =>
  page.evaluate(
    () =>
      document.activeElement?.textContent?.trim() ??
      document.activeElement?.getAttribute('aria-label') ??
      '(none)'
  );

test.describe('focus', () => {
  test('lands on the way out, not on the destructive answer', async ({
    page
  }) => {
    await gotoStory(page, OVERVIEW);
    await page.getByTestId('open').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    /*
     * Cancel, and by NAME rather than by position: "the second button" would
     * pass if the two were reordered, and the order is itself deliberate —
     * the way out is first in the reading order too.
     */
    expect(await focused(page)).toBe('Cancel');
  });

  test('so answering by reflex deletes nothing', async ({ page }) => {
    await gotoStory(page, OVERVIEW);
    await page.getByTestId('open').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    /*
     * The failure this exists to prevent, played out. Somebody hits the space
     * bar at a dialog they have not read — which is what doc 09 §5.2 means by
     * a confirmation repeated a hundred times being answered automatically.
     *
     * The dialog closes either way, so "it closed" proves nothing. What proves
     * it is that the delete did NOT happen: the story shows a success message
     * afterwards, and it must not be there.
     */
    await page.keyboard.press('Space');
    await expect(page.getByRole('alertdialog')).toBeHidden();
    await expect(page.getByText('Customer deleted')).toBeHidden();
  });

  test('and the destructive answer is one Tab away, not zero', async ({
    page
  }) => {
    await gotoStory(page, OVERVIEW);
    await page.getByTestId('open').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    await page.keyboard.press('Tab');
    expect(await focused(page)).toBe('Delete');

    // And pressing it there does delete, so the check above is measuring the
    // focus and not a broken button.
    await page.keyboard.press('Space');
    await expect(page.getByRole('alertdialog')).toBeHidden();
    await expect(page.getByText('Customer deleted')).toBeVisible();
  });

  test('returns to the control that opened it', async ({ page }) => {
    await gotoStory(page, OVERVIEW);

    const open = page.getByTestId('open');
    await open.click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('alertdialog')).toBeHidden();

    // There is a decoy button after it, so "focus went back to the page" does
    // not pass for "focus went back to this control".
    await expect(open).toBeFocused();
  });
});

test.describe('while the action is in flight', () => {
  test('Escape does not close it', async ({ page }) => {
    await gotoStory(page, ASYNC);
    await page.getByTestId('open').click();

    const layer = page.getByRole('alertdialog');
    await expect(layer).toBeVisible();

    await layer.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.keyboard.press('Escape');

    /*
     * `Dialog` deliberately cannot do this: doc 09 §8, one component that
     * swallows `Escape` costs the other twenty-nine their credibility. It is
     * allowed here because this component owns the promise and knows exactly
     * when the key is unsafe — doc 09 §7, you cannot dismiss something whose
     * action is already happening.
     */
    await expect(layer).toBeVisible();

    // And it closes on its own when the work finishes, so the block is
    // temporary rather than a dead end.
    await expect(layer).toBeHidden({ timeout: 5000 });
  });

  test('a click outside does not close it either', async ({ page }) => {
    await gotoStory(page, ASYNC);
    await page.getByTestId('open').click();

    const layer = page.getByRole('alertdialog');
    await expect(layer).toBeVisible();

    await layer.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.mouse.click(8, 8);
    await expect(layer).toBeVisible();

    await expect(layer).toBeHidden({ timeout: 5000 });
  });

  test('the confirming button shows a spinner and keeps its width', async ({
    page
  }) => {
    /*
     * Doc 09 §3: past a second, indicate it is still going. This is the first
     * place in the library where a button is pending on a promise the library
     * owns, and the button's own note says the size must not change — a row of
     * actions that reshuffles under the cursor of somebody who just pressed one
     * of them is the shift doc 09 §3 forbids.
     */
    await gotoStory(page, ASYNC);
    await page.getByTestId('open').click();

    const layer = page.getByRole('alertdialog');
    await expect(layer).toBeVisible();

    const confirm = layer.getByRole('button', { name: 'Delete', exact: true });
    await expect(confirm).toBeVisible();
    const before = await confirm.boundingBox();

    await confirm.click();

    // The spinner is inside the button, and decorative — so it is found by
    // shape rather than by name.
    await expect(confirm.locator('svg')).toBeVisible();

    const during = await confirm.boundingBox();
    expect(during?.width).toBe(before?.width);
    expect(during?.height).toBe(before?.height);
  });
});

test.describe('a failure', () => {
  test('leaves the dialog open, with the error inside it', async ({ page }) => {
    /*
     * The decision most likely to be argued with, checked end to end rather
     * than only as state: the promise rejects, the dialog stays, and the
     * consumer's `Alert` is in it. Doc 09 §4 — the error is shown where the
     * problem happened.
     *
     * Closing instead would leave somebody looking at a listing with no idea
     * whether the delete went through.
     */
    await gotoStory(page, FAILING);
    await page.getByTestId('open').click();

    const layer = page.getByRole('alertdialog');
    await expect(layer).toBeVisible();

    await layer.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(layer.getByText('The customer was not deleted')).toBeVisible();
    await expect(layer).toBeVisible();
  });

  test('and it can be answered again', async ({ page }) => {
    await gotoStory(page, FAILING);
    await page.getByTestId('open').click();

    const layer = page.getByRole('alertdialog');
    await expect(layer).toBeVisible();

    const confirm = layer.getByRole('button', { name: 'Delete', exact: true });
    await confirm.click();
    await expect(layer.getByText('The customer was not deleted')).toBeVisible();

    /*
     * A failure that left the button pending for good would be worse than
     * closing: the dialog would be a dead end with two controls that do
     * nothing. `aria-disabled` clearing is the base's own signal that the
     * pending state is over.
     */
    await expect(confirm).not.toHaveAttribute('aria-disabled', 'true');
    await expect(layer.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });
});

test.describe('the glyph', () => {
  test('is what tells the tones apart, and it survives greyscale', async ({
    page
  }) => {
    /*
     * Doc 06 §3 forbids colour as the only channel. The three tones differ in
     * their glyph's SILHOUETTE before they differ in colour — the warning is
     * the only triangle — and this asserts the glyph is there to do it rather
     * than checking a colour, which is the thing greyscale takes away.
     */
    await gotoStory(page, 'components-confirmdialog--greyscale');

    const layer = page.getByRole('alertdialog');
    await expect(layer).toBeVisible();

    const glyph = layer.locator('header svg');
    await expect(glyph).toBeVisible();

    // Hidden from assistive technology: the message says what happened, and a
    // glyph announced as well would be one more thing to listen past.
    await expect(glyph).toHaveAttribute('aria-hidden', 'true');
  });
});
