/*
 * What a drawer promises that a dialog does not: it comes from an EDGE, and
 * which edge depends on the writing direction.
 *
 * `layer.spec.ts` already covers what the two share — focus moving in and
 * returning, containment, Escape one level at a time, the scroll lock — and
 * those come from the same `ModalOverlay` and the same sheet, so they are not
 * repeated here. What is here is the geometry, which is the whole of the
 * difference, plus the one check doc 08 §6 has been holding open since it was
 * written.
 */
import { expect, test } from '@playwright/test';
import { painted } from './settle';
import { gotoStory } from './story';
import { watchWheels, wheelsSeen } from './wheel';

const SIDES = 'components-drawer--sides';
const OVER_A_DIALOG = 'components-drawer--over-a-dialog';

/**
 * The panel, once it has finished arriving.
 *
 * Waiting for it to be visible is not enough, and that is worth knowing: a
 * drawer SLIDES in, so between becoming visible and coming to rest it is
 * partly off the edge it came from. Measured mid-flight, a 480px panel at the
 * window's right edge reported its far side at 1520 in a 1280 window — halfway
 * through a 160ms entry.
 *
 * The base removes `data-entering` when the animation ends, so this is the
 * precise expression of what every geometric assertion below means: where the
 * panel IS, not where it was passing through. It is also the reason `Dialog`'s
 * geometry never needed this — a dialog fades and does not travel.
 */
const settled = async (page: import('@playwright/test').Page) => {
  const panel = page.locator('.bb-drawer-panel');
  await expect(panel).toBeVisible();
  await expect(panel).not.toHaveAttribute('data-entering', /.*/);
  return panel;
};

/** The panel's box, and the window's, in one measurement. */
const geometry = async (page: import('@playwright/test').Page) => {
  const box = await (await settled(page)).boundingBox();
  const viewport = page.viewportSize();
  expect(box, 'no drawer panel on the page').not.toBeNull();
  expect(viewport).not.toBeNull();
  return {
    x: Math.round(box!.x),
    y: Math.round(box!.y),
    width: Math.round(box!.width),
    height: Math.round(box!.height),
    windowWidth: viewport!.width,
    windowHeight: viewport!.height
  };
};

test.describe('which edge it comes from', () => {
  test('an inline drawer fills the height and takes one side', async ({
    page
  }) => {
    await gotoStory(page, SIDES);
    await page.getByTestId('open-end').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const g = await geometry(page);

    // Flush against the far edge, the full height, and thinner than the window.
    expect(g.y).toBe(0);
    expect(g.height).toBe(g.windowHeight);
    expect(g.width).toBeLessThan(g.windowWidth);
    expect(g.x + g.width).toBe(g.windowWidth);
  });

  test('and `start` is the other one', async ({ page }) => {
    await gotoStory(page, SIDES);
    await page.getByTestId('open-start').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const g = await geometry(page);
    expect(g.x).toBe(0);
    expect(g.height).toBe(g.windowHeight);
    expect(g.width).toBeLessThan(g.windowWidth);
  });

  test('a block drawer fills the width and takes the bottom', async ({
    page
  }) => {
    await gotoStory(page, SIDES);
    await page.getByTestId('open-bottom').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const g = await geometry(page);
    expect(g.x).toBe(0);
    expect(g.width).toBe(g.windowWidth);
    expect(g.height).toBeLessThan(g.windowHeight);
    expect(g.y + g.height).toBe(g.windowHeight);
  });

  test('and `top` is the other one', async ({ page }) => {
    await gotoStory(page, SIDES);
    await page.getByTestId('open-top').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const g = await geometry(page);
    expect(g.y).toBe(0);
    expect(g.width).toBe(g.windowWidth);
    expect(g.height).toBeLessThan(g.windowHeight);
  });
});

test.describe('direction', () => {
  test('`start` is the far side in an RTL language', async ({ page }) => {
    /*
     * The check this component exists to get right, and it is geometric rather
     * than a class name: the same `side="start"` has to be on the LEFT in
     * English and on the RIGHT in Arabic. Nothing in the component says either
     * word — the placement is a logical grid keyword — so this is the assertion
     * that the logic actually reaches the pixels.
     */
    await gotoStory(page, 'components-drawer--direction');
    await expect(page.getByRole('dialog')).toBeVisible();

    const g = await geometry(page);

    // Flush against the right-hand edge, which in Arabic is the inline start.
    expect(g.x + g.width).toBe(g.windowWidth);
    expect(g.x).toBeGreaterThan(0);
  });

  test('and the border is on the inner edge, which flips with it', async ({
    page
  }) => {
    await gotoStory(page, 'components-drawer--direction');
    await expect(page.getByRole('dialog')).toBeVisible();

    const border = await page.locator('.bb-drawer-panel').evaluate(node => {
      const s = getComputedStyle(node);
      return {
        left: s.borderLeftWidth,
        right: s.borderRightWidth,
        top: s.borderTopWidth,
        bottom: s.borderBottomWidth
      };
    });

    /*
     * A drawer is flush against three window edges, and a border on those sits
     * exactly at the edge of the screen — it reads as a rendering artefact
     * rather than a boundary. Only the free edge is drawn.
     *
     * In Arabic a `start` drawer is on the right, so its free edge is its LEFT
     * one. The component writes `border-s`, and this is the check that the
     * logical property resolved the way the layout did.
     */
    expect(border.left).not.toBe('0px');
    expect(border.right).toBe('0px');
    expect(border.top).toBe('0px');
    expect(border.bottom).toBe('0px');
  });

  test('the slide enters from the edge the panel is on', async ({ page }) => {
    /*
     * There is no logical `translate`: a percentage on the x axis is physical,
     * positive meaning right, in every direction. So the sign of the slide is
     * the one value in this component that cannot be logical, and it comes
     * from `dir` on the panel.
     *
     * Asserting the custom property rather than watching the animation, which
     * would be a race. A negative shift means "entered from the left"; a
     * positive one means from the right.
     */
    const shiftOf = async (id: string) => {
      await gotoStory(page, id);
      await expect(page.getByRole('dialog')).toBeVisible();
      return page
        .locator('.bb-drawer-panel')
        .evaluate(node =>
          getComputedStyle(node).getPropertyValue('--bb-drawer-shift').trim()
        );
    };

    // Arabic, side="start" — on the right, so it slides in from the right.
    expect(await shiftOf('components-drawer--direction')).toBe('100%');

    // English, side="end" — also on the right, and also from the right. The
    // two agree here for different reasons, which is the point of checking
    // both: the prop differs, the direction differs, the pixels match.
    await gotoStory(page, SIDES);
    await page.getByTestId('open-end').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(
      await page
        .locator('.bb-drawer-panel')
        .evaluate(node =>
          getComputedStyle(node).getPropertyValue('--bb-drawer-shift').trim()
        )
    ).toBe('100%');
  });

  test('and an LTR `start` drawer slides in from the other side', async ({
    page
  }) => {
    await gotoStory(page, SIDES);
    await page.getByTestId('open-start').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // The one that would be wrong if the sign came from the prop alone.
    expect(
      await page
        .locator('.bb-drawer-panel')
        .evaluate(node =>
          getComputedStyle(node).getPropertyValue('--bb-drawer-shift').trim()
        )
    ).toBe('-100%');
  });
});

test.describe('the thickness', () => {
  test('never exceeds the window, whichever axis it is on', async ({
    page
  }) => {
    /*
     * The reason a drawer needs no narrow-window exception where a dialog does:
     * the thickness is a maximum, so a drawer thicker than its window fills it
     * instead of overflowing. `lg` is 48rem — wider than the 360px the narrow
     * project runs at, and taller than nothing here, so this is the check that
     * the ceiling is the window and not the token.
     */
    await gotoStory(page, 'components-drawer--sizes');
    await page.getByTestId('open-lg').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const g = await geometry(page);
    expect(g.width).toBeLessThanOrEqual(g.windowWidth);
    expect(g.height).toBeLessThanOrEqual(g.windowHeight);
  });
});

test.describe('doc 08 §6, the case the document names', () => {
  test('a dialog open, a drawer opened and closed, and the page still does not scroll', async ({
    page
  }) => {
    /*
     * Written into doc 08 §6 when the document was adopted and left openly
     * unverified, with a prediction: the base keeps a module-level reference
     * count, so closing the inner layer should not lift the lock.
     *
     * It was tested with two dialogs when `Dialog` landed, because the
     * mechanism is the same `usePreventScroll`. This is the case the document
     * actually describes — two different components, two different mounts —
     * and it is the one that can still be wrong if either of them locks by a
     * route the other does not.
     */
    await gotoStory(page, OVER_A_DIALOG);

    await page.getByTestId('open-dialog').click();
    const dialog = page.getByRole('dialog', { name: 'Issue a credit note' });
    await expect(dialog).toBeVisible();

    await page.getByTestId('open-drawer').click();
    const drawer = page.getByRole('dialog', { name: 'Find a customer' });
    await expect(drawer).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    // The dialog underneath is still open, which is what makes the lock's
    // reference count matter at all.
    await expect(dialog).toBeVisible();

    await watchWheels(page);
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(180, 500);
    await page.mouse.wheel(0, 600);

    /*
     * ONE OF EACH (doc 10 §11.1). The wheel ARRIVING is the thing that has to
     * happen; the offset not moving is the claim. Polling the claim was
     * worthless twice over: `expect.poll` returns on the first read that
     * satisfies it, so this passed whether or not the event ever arrived and
     * spent none of its budget.
     *
     * A count is a STATE, so polling that is honest. `painted` after it puts a
     * scroll applied a frame late INSIDE the read below rather than after it.
     * The sibling test — the page scrolls again once every layer has closed —
     * is what proves a wheel moves this page at all, so it is not repeated.
     */
    await expect
      .poll(() => wheelsSeen(page), { timeout: 1000 })
      .toBeGreaterThan(0);
    await painted(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('and it scrolls again once both have closed', async ({ page }) => {
    /*
     * The half a lock bug hides behind: a count that never reaches zero leaves
     * the page frozen for good, which is a worse failure than the one above
     * and looks like nothing at all.
     */
    await gotoStory(page, OVER_A_DIALOG);

    await page.getByTestId('open-dialog').click();
    await page.getByTestId('open-drawer').click();

    const drawer = page.getByRole('dialog', { name: 'Find a customer' });
    const dialog = page.getByRole('dialog', { name: 'Issue a credit note' });

    /*
     * One press at a time, waiting for each. Two in the same frame are not
     * reliable — the second lands while the first close is still settling
     * (doc 09 §2.1 records why that window used to be much wider).
     */
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.mouse.move(180, 400);
    await page.mouse.wheel(0, 400);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
  });
});

test.describe('scrolling', () => {
  test('the drawer scrolls from the keyboard the moment it opens', async ({
    page
  }) => {
    /*
     * The same structural rule as `Dialog`, and worth asserting again on this
     * component rather than trusting the shared sheet: a browser scrolls the
     * nearest scrollable ANCESTOR of what has focus, and the base focuses the
     * element carrying `role="dialog"`. If the scroll ever moved to an inner
     * body element, no key would reach it and no screenshot would say so.
     */
    await gotoStory(page, 'components-drawer--scrolling');

    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();

    await panel.evaluate(node => (node as HTMLElement).focus());
    expect(await panel.evaluate(node => node.scrollTop)).toBe(0);

    await page.keyboard.press('PageDown');
    await expect
      .poll(() => panel.evaluate(node => node.scrollTop), { timeout: 1000 })
      .toBeGreaterThan(0);
  });
});
