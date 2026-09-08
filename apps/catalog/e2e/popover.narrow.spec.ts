/*
 * A popover in a window narrower than the panel's own maximum.
 *
 * The maximum is `--container-medium`, which is 30rem — 480px, wider than the
 * 360px this project runs at. So this file asks the question the rest of the
 * suite cannot: does a popover that is allowed to be wider than the window
 * stay inside it, and does it do so without a viewport query of ours?
 *
 * A popover claims doc 04 §5's viewport exception only through the base: the
 * base measures the room and writes a ceiling, and the panel's own CSS says
 * nothing about a window. If that is really enough, nothing here needs a rule.
 * If it is not, this is where it shows.
 *
 * No screenshots, for the reason `dialog.narrow.spec.ts` records:
 * `snapshotPathTemplate` carries the platform but not the project, so two
 * projects photographing one name would overwrite each other's reference.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const settled = async (page: import('@playwright/test').Page) => {
  const panel = page.locator('.bb-popover');
  await expect(panel).toBeVisible();
  await expect(panel).not.toHaveAttribute('data-entering', /.*/);
  return panel;
};

test('the panel stays inside a window narrower than its maximum', async ({
  page
}) => {
  await gotoStory(page, 'components-popover--long-text');
  const panel = await settled(page);

  const box = (await panel.boundingBox())!;
  const viewport = page.viewportSize()!;

  /*
   * Both edges, because they fail independently: a panel anchored near the
   * inline end overflows on the right, and one the base has shifted back
   * inward can overflow on the left instead.
   */
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);

  /*
   * And it is genuinely narrower than the maximum here, so the assertion above
   * is about the window rather than about a panel that happened to be small.
   * Without this the check would pass on a 100px panel and prove nothing.
   */
  const ceiling = await panel.evaluate(node => {
    const probe = document.createElement('div');
    probe.style.width = 'var(--bb-container-medium)';
    node.append(probe);
    const resolved = probe.getBoundingClientRect().width;
    probe.remove();
    return resolved;
  });
  expect(ceiling).toBeGreaterThan(viewport.width);
  expect(box.width).toBeLessThan(ceiling);
  // Not collapsed either: the failure this whole component was debugged for.
  expect(box.width).toBeGreaterThan(200);
});

test('and the content scrolls rather than the panel overflowing the window', async ({
  page
}) => {
  /*
   * The block axis of the same question. 640px of window, twelve fields, and a
   * ceiling this component never declares — the base writes it from the room
   * between the trigger and the window's edge.
   */
  await gotoStory(page, 'components-popover--scrolling');
  const panel = await settled(page);

  const box = (await panel.boundingBox())!;
  const viewport = page.viewportSize()!;

  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

  const sheet = panel.getByRole('dialog');
  const metrics = await sheet.evaluate(node => ({
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight
  }));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
});

test('the header and footer are still reachable at this size', async ({
  page
}) => {
  /*
   * The pinned pieces are what a small window puts under pressure: a header
   * and a footer that are `sticky` inside the scroller keep their place, and
   * one that had become a row of a grid would be pushed off instead.
   *
   * Asserted by pressing a key rather than by reading a style, because the
   * failure this guards against — the scroll container not being the focused
   * element — is invisible to everything that does not.
   */
  await gotoStory(page, 'components-popover--scrolling');
  const panel = await settled(page);
  const sheet = panel.getByRole('dialog');

  const heading = panel.getByRole('heading');
  const before = (await heading.boundingBox())!.y;

  await sheet.focus();
  await page.keyboard.press('End');
  await expect
    .poll(async () => sheet.evaluate(node => node.scrollTop))
    .toBeGreaterThan(0);

  const after = (await heading.boundingBox())!.y;
  expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
});
