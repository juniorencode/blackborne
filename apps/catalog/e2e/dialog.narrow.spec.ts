/*
 * The one legitimate viewport exception, measured in a window small enough for
 * it to apply.
 *
 * Doc 04 §5: a component rendered in a portal may query the window, because
 * the window IS its container. `Dialog` uses that to fill a window it cannot
 * be inset from. Nothing in the rest of the suite can see it — every other
 * spec runs at the fixed 1280×900 the screenshots depend on — so this file
 * runs in the `narrow` project at 360×640.
 *
 * No screenshots here, deliberately: `snapshotPathTemplate` carries the
 * platform but not the project, so two projects photographing one name would
 * overwrite each other's reference. Boxes and computed styles need no baseline
 * and state the claim more precisely anyway.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-dialog--overview';

test('the panel fills a narrow window', async ({ page }) => {
  await gotoStory(page, OVERVIEW);
  await page.getByTestId('open').click();

  const panel = page.getByRole('dialog');
  await expect(panel).toBeVisible();

  const box = await page.locator('.bb-dialog-panel').boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();

  /*
   * Exactly the window's width, not approximately. The whole point of the rule
   * is that there is no inset left, so a stray margin would show up here as a
   * few pixels — which is the size of mistake this exists to catch.
   */
  expect(box?.width).toBe(viewport?.width);
  expect(box?.x).toBe(0);
});

test('and drops the radius, border and shadow with it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);
  await page.getByTestId('open').click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const paint = await page.locator('.bb-dialog-panel').evaluate(node => {
    const style = getComputedStyle(node);
    return {
      radius: style.borderTopLeftRadius,
      border: style.borderTopWidth,
      shadow: style.boxShadow
    };
  });

  /*
   * A radius, a border and a shadow are all how a panel says it is sitting on
   * something else. Against the window's own edge there is nothing to be
   * distinct from, and a rounded corner there is the corner of the screen —
   * which is not ours to round (doc 03 §4.3).
   */
  expect(paint.radius).toBe('0px');
  expect(paint.border).toBe('0px');
  expect(paint.shadow).toBe('none');
});

test('the scrim keeps no inset, so nothing shows around the panel', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);
  await page.getByTestId('open').click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const padding = await page
    .locator('.bb-dialog-scrim')
    .evaluate(node => getComputedStyle(node).paddingTop);

  // If this drifts back to the token, a strip of scrim reappears around a
  // panel that is supposed to be the whole window.
  expect(padding).toBe('0px');
});

test('the actions stay reachable: the footer is inside the window', async ({
  page
}) => {
  await gotoStory(page, 'components-dialog--scrolling');

  const panel = page.getByRole('dialog').first();
  await expect(panel).toBeVisible();

  /*
   * The reason the panel is measured against the VISUAL viewport rather than
   * `100dvh`. This is the check that a full-height dialog does not put its
   * buttons off the bottom of the window — the failure an on-screen keyboard
   * produces, and which `--visual-viewport-height` is what avoids.
   *
   * The keyboard itself cannot be raised in a headless browser, so what is
   * asserted is the property that survives it: the footer's bottom edge is
   * within the window, with the panel scrolled to the end.
   */
  await panel.evaluate(node => {
    node.scrollTop = node.scrollHeight;
  });

  const footer = page.locator('.bb-dialog-panel footer').first();
  await expect(footer).toBeVisible();
  const viewport = page.viewportSize();

  /*
   * Polled rather than sampled once, and that is the claim rather than a
   * workaround: the panel's ceiling comes from a variable the base writes from
   * `useViewportSize`, so there is a first paint before it is measured. The
   * property being asserted is that the footer is inside the window once the
   * layout has settled — not that it is inside it in every intermediate frame.
   *
   * Sampling once passed six runs out of six in isolation and failed once
   * inside the full suite, which is the shape of a race and not of a defect.
   * `retries` is deliberately zero in this repository, so a check that can
   * report either answer for the same input has to be tightened rather than
   * re-run.
   */
  await expect
    .poll(
      async () => {
        const box = await footer.boundingBox();
        return box === null ? Infinity : Math.ceil(box.y + box.height);
      },
      { timeout: 2000 }
    )
    .toBeLessThanOrEqual(viewport!.height);
});

test('a long title wraps rather than pushing the close button out', async ({
  page
}) => {
  await gotoStory(page, 'components-dialog--long-title');

  const panel = page.locator('.bb-dialog-panel').first();
  await expect(panel).toBeVisible();

  const panelBox = await panel.boundingBox();
  const closeBox = await panel
    .getByRole('button', { name: 'Close' })
    .boundingBox();

  expect(panelBox).not.toBeNull();
  expect(closeBox).not.toBeNull();

  /*
   * Doc 05 §5: no width is sized so one particular label fits, and a short
   * string is the dangerous one — a title that is one word in English is
   * twelve characters in German. The cross has to stay inside the panel with
   * the title wrapping around it, not be pushed off the edge.
   */
  expect(closeBox!.x + closeBox!.width).toBeLessThanOrEqual(
    panelBox!.x + panelBox!.width
  );
  expect(closeBox!.x).toBeGreaterThanOrEqual(panelBox!.x);
});
