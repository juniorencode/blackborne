/*
 * A menu is almost entirely keyboard behaviour, and jsdom implements no real
 * tab order — so this file carries more of the component than its unit tests
 * do, which is the opposite of the usual balance.
 *
 * The first test is the open question of the wave: a menu's panel is the
 * base's `Popover`, and that component gives itself `role="dialog"` unless it
 * is told it is not modal. So what does a screen reader actually meet — a
 * dialog wrapping a menu, or a menu?
 *
 * Measured rather than reasoned about, the way doc 08 §4's containment claim
 * had to be — and the guess was wrong. It is a dialog containing a menu, with
 * the same name on both. The assertion records that, and the reasoning for
 * leaving it alone is beside it.
 */
import { expect, test } from '@playwright/test';
import { travelTo } from './pointer';
import { gotoStory } from './story';

const OVERVIEW = 'components-menu--overview';
const OPEN = 'components-menu--open';
const LONG_LIST = 'components-menu--long-list';
const DIRECTION = 'components-menu--direction';
const IN_A_ROW = 'components-menu--in-a-row';

test('what a reader meets is a menu, and it is named by its trigger', async ({
  page
}) => {
  await gotoStory(page, OPEN);

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAccessibleName('Actions');
  await expect(page.getByRole('menuitem')).toHaveCount(4);

  /*
   * The measurement. The base wraps a menu in its own `Popover`, which takes
   * `role="dialog"` unless told otherwise — so the question is whether a
   * dialog is announced around the menu.
   *
   * What the tree holds is recorded either way, because a future version of
   * the base changing this is exactly the kind of thing that would otherwise
   * be noticed by a person with a screen reader and nobody else.
   */
  const shape = await page.evaluate(() => {
    const menuElement = document.querySelector('[role="menu"]');
    const roles: string[] = [];
    let node = menuElement?.parentElement ?? null;
    while (node !== null && node !== document.body) {
      const role = node.getAttribute('role');
      if (role !== null) roles.push(role);
      node = node.parentElement;
    }
    return { above: roles };
  });

  /*
   * MEASURED, AND IT IS NOT WHAT THIS COMMENT FIRST SAID.
   *
   * The guess written here was that the base would leave the role off for a
   * menu. It does not: the popover takes `role="dialog"`, labelled by the same
   * trigger the menu is, so the tree is a dialog containing a menu and the
   * name appears twice.
   *
   * Kept as the assertion rather than argued away, for two reasons. It is the
   * base's own deliberate branch — its source says "automatically render
   * Popover with role=dialog except when isNonModal is true" — and doc 06 §2
   * puts roles in the base's column. And the lever that removes it,
   * `isNonModal`, removes the underlay and the scroll lock with it: an outside
   * click would then both close the menu AND press whatever is under it, which
   * is the behaviour doc 08 §5.1 measured and rejected for `Popover`.
   *
   * So what is left is a question about what a person HEARS, and that is the
   * one thing nothing in this repository can measure. It goes on the
   * screen-reader list, and this assertion is what will notice if the base
   * changes its mind.
   */
  expect(shape.above).toEqual(['dialog']);
});

test('the keyboard opens it with the first command highlighted', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const trigger = page.getByRole('button', { name: 'Actions' });
  await trigger.focus();
  await page.keyboard.press('Enter');

  const items = page.getByRole('menuitem');
  await expect(items.first()).toBeFocused();
  await expect(items.first()).toHaveAttribute('data-focused', 'true');
});

test('the arrows move, and skip what cannot be run', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  await page.getByRole('button', { name: 'Actions' }).focus();
  await page.keyboard.press('Enter');

  const send = page.getByRole('menuitem', { name: 'Send to the customer' });
  const duplicate = page.getByRole('menuitem', { name: 'Duplicate' });
  const credit = page.getByRole('menuitem', { name: 'Issue a credit note' });
  const remove = page.getByRole('menuitem', { name: 'Delete' });

  await expect(send).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(duplicate).toBeFocused();

  /*
   * The disabled command is stepped over rather than focused — and it is still
   * in the tree, announced as unavailable. Doc 06 §4 rule 7: switching a
   * control off without a way to know why is the failure, not switching it
   * off.
   */
  await page.keyboard.press('ArrowDown');
  await expect(credit).not.toBeFocused();
  await expect(remove).toBeFocused();
  await expect(credit).toHaveAttribute('aria-disabled', 'true');

  // And it wraps, which is what a menu does and a list of buttons does not.
  await page.keyboard.press('ArrowDown');
  await expect(send).toBeFocused();
});

test('typing skips to a command', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  await page.getByRole('button', { name: 'Actions' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('d');

  await expect(page.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused();
});

test('Escape closes it and focus goes back to the trigger', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const trigger = page.getByRole('button', { name: 'Actions' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  /*
   * Doc 06 §3's focus return. Without it a keyboard user is dropped at the top
   * of the document, which is the single most common way a layer ruins a
   * form.
   */
  await expect(trigger).toBeFocused();
});

test('running a command closes the menu and returns focus', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const trigger = page.getByRole('button', { name: 'Actions' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

/*
 * The highlight follows the pointer as well as the keyboard, and there is only
 * ever one of it. Two marks at once would be two answers to "where am I".
 */
test('the pointer moves the same single highlight', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  await page.getByRole('button', { name: 'Actions' }).focus();
  await page.keyboard.press('Enter');

  const send = page.getByRole('menuitem', { name: 'Send to the customer' });
  const duplicate = page.getByRole('menuitem', { name: 'Duplicate' });
  await expect(send).toHaveAttribute('data-focused', 'true');

  /*
   * AND THE NEUTRAL MOVE IS WHAT MAKES THIS WORK, which is least obvious here
   * of all places: the menu was opened with `Enter` above, and a keydown sets
   * the base's global interaction modality to 'keyboard'. `useMenuItem` moves
   * its highlight only while `isFocusVisible()` is false, which is only while
   * that modality is 'pointer'. So without the neutral move this check would
   * assert that hovering a row does nothing — and pass. `e2e/pointer.ts` has
   * the source lines.
   */
  await travelTo(page, duplicate);

  await expect(duplicate).toHaveAttribute('data-focused', 'true');
  await expect(send).not.toHaveAttribute('data-focused', /.*/);
});

test('a destructive command is red as well as saying what it does', async ({
  page
}) => {
  await gotoStory(page, OPEN);

  const ink = async (name: string) =>
    page
      .getByRole('menuitem', { name })
      .evaluate(element => getComputedStyle(element).color);

  const ordinary = await ink('Duplicate');
  const destructive = await ink('Delete');
  const danger = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--bb-danger')
      .trim()
  );

  expect(destructive).not.toBe(ordinary);
  expect(danger).not.toBe('');
});

test('a long list scrolls inside itself, and stays inside the window', async ({
  page
}) => {
  await gotoStory(page, LONG_LIST);

  const list = page.locator('.bb-menu-list');
  const seen = await list.evaluate(element => ({
    scrolls: element.scrollHeight > element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
    bottom: Math.round(element.getBoundingClientRect().bottom)
  }));
  const viewport = page.viewportSize();

  expect(seen.scrolls).toBe(true);
  expect(seen.overflowY).toBe('auto');
  // Doc 04 §7: the component that produces the overflow encloses it, and the
  // window is not asked to scroll.
  expect(seen.bottom).toBeLessThanOrEqual((viewport?.height ?? 0) + 1);

  /*
   * And the element that scrolls is the element the keyboard reaches. A
   * browser scrolls the nearest scrollable ANCESTOR of what has focus, so a
   * scroll container the arrows cannot reach moves nothing — the failure
   * `Dialog` paid for.
   */
  const scrollsWithTheKeyboard = await page.evaluate(() => {
    const menu = document.querySelector('.bb-menu-list');
    if (menu === null) return false;
    const before = menu.scrollTop;
    (menu as HTMLElement).scrollTop = 40;
    const moved = menu.scrollTop !== before;
    (menu as HTMLElement).scrollTop = before;
    return moved;
  });
  expect(scrollsWithTheKeyboard).toBe(true);
});

test('in RTL it aligns to the other edge of its trigger', async ({ page }) => {
  await gotoStory(page, DIRECTION);

  /*
   * Named, because a modal popover holds two more buttons than it looks: the
   * base renders a hidden dismiss control at each end of it, labelled from its
   * own localised strings — "تجاهل" here. They are the touch-screen route out
   * for a screen reader, and they make a bare `getByRole('button')`
   * ambiguous.
   */
  const trigger = await page
    .getByRole('button', { name: 'إجراءات' })
    .boundingBox();
  const panel = await page.locator('.bb-menu').boundingBox();
  expect(trigger).not.toBeNull();
  expect(panel).not.toBeNull();

  /*
   * `bottom start` in Arabic is the RIGHT edge, so the panel's right edge
   * lines up with the trigger's rather than its left. Nothing in the component
   * says either word — the base derives it from the locale the provider
   * supplies.
   */
  expect(panel!.x + panel!.width).toBeCloseTo(trigger!.x + trigger!.width, 0);
});

test('a menu with no label on its trigger is still named', async ({ page }) => {
  await gotoStory(page, IN_A_ROW);

  /*
   * The case doc 02 §11.3 exists for: a button whose content is a mark needs
   * an accessible name, and the menu takes the same one — so one string names
   * both, and there is nowhere for the two to disagree.
   */
  await expect(page.getByRole('menu')).toHaveAccessibleName('Invoice actions');
  await expect(
    page.getByRole('button', { name: 'Invoice actions' })
  ).toBeVisible();
});
