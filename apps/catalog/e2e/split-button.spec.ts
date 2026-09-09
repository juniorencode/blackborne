/*
 * THE SEAM, which is the whole of what a browser has to decide here.
 *
 * Two buttons have to read as one control, and every part of that is a
 * compiled stylesheet and a rendered box: which corners are round, whether the
 * two borders became one line, whether the primary variant's divider is
 * visible at all, and where the menu lands. None of it is visible to jsdom,
 * which resolves no variable and lays nothing out.
 *
 * The behaviour — two named buttons, the pending arrow, the warning about a
 * destructive first row — is in `SplitButton.test.tsx`, where it needs no
 * browser.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-splitbutton--overview';
const VARIANTS = 'components-splitbutton--variants';
const SIZES = 'components-splitbutton--sizes';
const FOOTER = 'components-splitbutton--in-a-footer';
const DIRECTION = 'components-splitbutton--direction';

test('the two halves are one control, with the corners to prove it', async ({
  page
}) => {
  await gotoStory(page, VARIANTS);

  const corners = await page
    .locator('.bb-split-button')
    .first()
    .evaluate(root => {
      const action = root.querySelector('.bb-split-button-action') as Element;
      const arrow = root.querySelector('.bb-split-button-arrow') as Element;
      const of = (element: Element) => {
        const style = getComputedStyle(element);
        return {
          startTop: style.borderStartStartRadius,
          endTop: style.borderStartEndRadius
        };
      };
      return { action: of(action), arrow: of(arrow) };
    });

  /*
   * The action keeps its leading corner and loses its trailing one; the arrow
   * does the opposite. Asserted as "round" against "square" rather than
   * against a number, because the radius is a token and this check is about
   * which corners it applies to.
   */
  expect(corners.action.startTop).not.toBe('0px');
  expect(corners.action.endTop).toBe('0px');
  expect(corners.arrow.startTop).toBe('0px');
  expect(corners.arrow.endTop).not.toBe('0px');
});

test('and one line down the middle, not two', async ({ page }) => {
  await gotoStory(page, VARIANTS);

  /*
   * Both halves carry a border, so without the negative margin the seam is
   * 2px where every other border in the library is 1. Measured as a gap
   * between the two boxes: the arrow's leading edge sits exactly one border
   * inside the action's trailing edge.
   */
  const seam = await page
    .locator('.bb-split-button')
    .nth(1)
    .evaluate(root => {
      const action = (
        root.querySelector('.bb-split-button-action') as Element
      ).getBoundingClientRect();
      const arrow = (
        root.querySelector('.bb-split-button-arrow') as Element
      ).getBoundingClientRect();
      const width = getComputedStyle(
        root.querySelector('.bb-split-button-arrow') as Element
      ).borderInlineStartWidth;
      return { overlap: action.right - arrow.left, width };
    });

  expect(seam.width).toBe('1px');
  expect(seam.overlap).toBeCloseTo(1, 0);
});

test('the primary variant draws a divider, because its border is invisible', async ({
  page
}) => {
  await gotoStory(page, VARIANTS);

  const [primary, secondary] = await page
    .locator('.bb-split-button')
    .evaluateAll(roots =>
      roots.map(root => {
        const arrow = root.querySelector('.bb-split-button-arrow') as Element;
        const style = getComputedStyle(arrow);
        return {
          divider: style.borderInlineStartColor,
          fill: style.backgroundColor
        };
      })
    );

  /*
   * The point of the divider: on a filled half the border is the fill's own
   * colour, so the two halves would be one blob. It is mixed from the pair's
   * text colour, so it differs from the fill — and the secondary variant needs
   * no such thing, because its border is already visible against the surface.
   */
  expect(primary?.divider).not.toBe(primary?.fill);
  expect(secondary?.divider).not.toBe(secondary?.fill);
  expect(primary?.divider).not.toBe(secondary?.divider);
});

test('both halves are exactly the same height, at every size', async ({
  page
}) => {
  await gotoStory(page, SIZES);

  const rows = await page.locator('.bb-split-button').evaluateAll(roots =>
    roots.map(root => {
      const action = root.querySelector('.bb-split-button-action') as Element;
      const arrow = root.querySelector('.bb-split-button-arrow') as Element;
      return {
        action: Math.round(action.getBoundingClientRect().height),
        arrow: Math.round(arrow.getBoundingClientRect().height)
      };
    })
  );

  expect(rows).toHaveLength(6);
  for (const row of rows) {
    expect(row.action, JSON.stringify(row)).toBeGreaterThan(0);
    expect(row.arrow, JSON.stringify(row)).toBe(row.action);
  }
});

test('and it lines up with a plain button of the same size', async ({
  page
}) => {
  await gotoStory(page, FOOTER);

  /*
   * Doc 03 §9's check, reaching one more control: a footer where the split
   * button is a pixel taller than the button beside it is the detail that
   * gives away a set of components built separately.
   */
  const heights = await page.evaluate(() => {
    /*
     * The plain button is the one that is a DIRECT CHILD of the row, which is
     * a narrower question than "a button that is not one of the halves".
     * `Button` carries no marker class of its own, and the first button in the
     * document turned out to be neither of the three — measured at zero
     * height, which is a hidden one the base renders and a check should never
     * have found.
     */
    const cancel = document.querySelector('.catalog-row > button') as Element;
    const action = document.querySelector('.bb-split-button-action') as Element;
    return {
      cancel: Math.round(cancel.getBoundingClientRect().height),
      action: Math.round(action.getBoundingClientRect().height)
    };
  });

  expect(heights.cancel).toBeGreaterThan(0);
  expect(heights.action).toBe(heights.cancel);
});

test('the menu lands under the arrow, aligned to its outer edge', async ({
  page
}) => {
  /*
   * MEASURED IN THE FOOTER STORY, and the first draft of this check measured
   * it in the overview — where the control sits 83px from the edge, so a panel
   * aligned to the arrow's end would start at −44 and the base shifts it into
   * the window instead. The alignment was correct and unmeasurable: an
   * instrument placed where the thing it measures cannot happen.
   *
   * A footer puts the control at the end of the row, which is both where one
   * actually goes and where `bottom end` has room to be itself.
   */
  await gotoStory(page, FOOTER);

  await page.locator('.bb-split-button-arrow').click();
  await expect(page.getByRole('menu')).toBeVisible();

  const boxes = await page.evaluate(() => {
    const a = document
      .querySelector('.bb-split-button-arrow')!
      .getBoundingClientRect();
    const panel = document
      .querySelector('[role="menu"]')!
      .getBoundingClientRect();
    return {
      arrow: { left: a.left, right: a.right, bottom: a.bottom },
      panel,
      window: document.documentElement.clientWidth
    };
  });

  // Under the arrow, hanging inwards from its outer edge, and on the screen.
  expect(boxes.panel.top).toBeGreaterThanOrEqual(boxes.arrow.bottom - 1);
  expect(boxes.panel.right).toBeLessThanOrEqual(boxes.arrow.right + 1);
  expect(boxes.panel.left).toBeLessThan(boxes.arrow.left);
  expect(boxes.panel.right).toBeLessThanOrEqual(boxes.window);
});

test('and in a crowded corner the base moves it rather than clipping it', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  await page.locator('.bb-split-button-arrow').click();
  await expect(page.getByRole('menu')).toBeVisible();

  /*
   * The other half of the same behaviour, and the reason the check above had
   * to move: this control is near the leading edge, so an end-aligned panel
   * would start off-screen. The base shifts it in. Doc 02 §3.3 — where a layer
   * sits is a preference, and whether it fits is not negotiable.
   */
  const panel = await page
    .getByRole('menu')
    .evaluate(element => element.getBoundingClientRect().left);
  expect(panel).toBeGreaterThanOrEqual(0);
});

test('the arrow turns over while the menu is open', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const chevron = page.locator('.bb-split-button-chevron');
  const rotation = () =>
    chevron.evaluate(element => getComputedStyle(element).rotate);

  expect(await rotation()).toBe('none');

  await page.locator('.bb-split-button-arrow').click();
  await expect(page.getByRole('menu')).toBeVisible();

  /*
   * Polled rather than read once: the mark turns on a transition bounded by
   * the fast duration token, and reading it the instant the menu appears
   * catches it in flight — the mistake the accordion's height and the select's
   * chevron both made before it.
   */
  await expect.poll(rotation).toBe('180deg');
});

test('the keyboard reaches both halves, and comes back to the arrow', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const action = page.getByRole('button', { name: 'Save' });
  const arrow = page.getByRole('button', { name: 'More actions' });

  await action.focus();
  await page.keyboard.press('Tab');
  await expect(arrow).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem').first()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(arrow).toBeFocused();
});

test('pressing the action does not open the menu', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
});

test('in RTL the arrow changes hands, and so do the corners', async ({
  page
}) => {
  await gotoStory(page, DIRECTION);

  const measured = await page
    .locator('.bb-split-button')
    .first()
    .evaluate(root => {
      const action = root.querySelector('.bb-split-button-action') as Element;
      const arrow = root.querySelector('.bb-split-button-arrow') as Element;
      const style = getComputedStyle(action);
      return {
        actionX: Math.round(action.getBoundingClientRect().x),
        arrowX: Math.round(arrow.getBoundingClientRect().x),
        // The physical corner that is square is now the TOP-LEFT one.
        leftTop: style.borderTopLeftRadius,
        rightTop: style.borderTopRightRadius
      };
    });

  // The arrow is to the left of the action, which is the end of the line here.
  expect(measured.arrowX).toBeLessThan(measured.actionX);
  expect(measured.leftTop).toBe('0px');
  expect(measured.rightTop).not.toBe('0px');
});

test('the state a forced hover produces actually paints', async ({ page }) => {
  await gotoStory(page, 'components-splitbutton--states');

  /*
   * The guard the select wave earned, and the tabs wave needed a second time:
   * a forced state on the wrong element lands in the DOM, matches no rule, and
   * photographs identically to the default. Here it is asked of both halves,
   * because pointing at one must not light up the other.
   */
  const fills = await page.locator('.catalog-panel').evaluateAll(panels =>
    panels.map(panel => ({
      label: panel.querySelector('.catalog-label')?.textContent ?? '',
      action: getComputedStyle(
        panel.querySelector('.bb-split-button-action') as Element
      ).backgroundColor,
      arrow: getComputedStyle(
        panel.querySelector('.bb-split-button-arrow') as Element
      ).backgroundColor
    }))
  );

  const plain = fills[0];
  const onAction = fills[1];
  const onArrow = fills[2];

  expect(onAction?.action).not.toBe(plain?.action);
  expect(onAction?.arrow).toBe(plain?.arrow);

  expect(onArrow?.arrow).not.toBe(plain?.arrow);
  expect(onArrow?.action).toBe(plain?.action);
});
