/*
 * A tooltip's geometry, and one open question from doc 06 answered.
 *
 * Twelve placements are checked by MEASUREMENT rather than by twelve
 * screenshots, and that is not a shortcut: only one tooltip can be open at a
 * time — the base keeps a global warmup timer that guarantees it — so twelve
 * pictures would be twelve pages, and a picture says "it is over there"
 * where a box comparison says "its start edge lines up with the trigger's".
 *
 * The unit suite covers the part that matters most, which is that a tooltip
 * DESCRIBES its trigger and does not name it. That is plain DOM.
 */
import { expect, test } from '@playwright/test';
import { travelTo } from './pointer';
import { gotoStory } from './story';

const PLACEMENTS = 'components-tooltip--placements';
const OVERVIEW = 'components-tooltip--overview';

/**
 * Hover a trigger and wait for the tooltip to arrive AND come to rest.
 *
 * THE MOUSE HAS TO TRAVEL, which is `travelTo` in `e2e/pointer.ts`. The
 * measurement was taken here — a single `hover()` opened nothing, while
 * `focus()`, `Tab`, and a neutral move followed by a stepped move all opened
 * it — and the EXPLANATION that lived here was wrong: the base's `useHover`
 * filters nothing about movement. The real gate is the global interaction
 * modality, read by `useTooltipTrigger` rather than by `useHover`, and that
 * file has the source lines.
 *
 * Two waits after the travel, and both are needed. The open delay is 600ms, so
 * the visibility check has to outlast it; and the tooltip scales in, so a box
 * measured while `data-entering` is still set is a box mid-animation — the
 * same trap the drawer's geometry checks record.
 */
const openOn = async (
  page: import('@playwright/test').Page,
  testId: string
) => {
  await travelTo(page, page.getByTestId(testId));

  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible({ timeout: 3000 });
  await expect(tooltip).not.toHaveAttribute('data-entering', /.*/);
  return tooltip;
};

const boxes = async (
  page: import('@playwright/test').Page,
  testId: string,
  tooltip: import('@playwright/test').Locator
) => {
  const trigger = await page.getByTestId(testId).boundingBox();
  const bubble = await tooltip.boundingBox();
  expect(trigger).not.toBeNull();
  expect(bubble).not.toBeNull();
  return { trigger: trigger!, bubble: bubble! };
};

/*
 * Four sides, measured on the axis they are named for. The alignments are
 * checked separately below, because "which side" and "how it lines up" fail
 * independently.
 */
const SIDES = [
  { placement: 'top', id: 'trigger-top' },
  { placement: 'bottom', id: 'trigger-bottom' },
  { placement: 'start', id: 'trigger-start' },
  { placement: 'end', id: 'trigger-end' }
] as const;

test.describe('which side it sits on', () => {
  for (const { placement, id } of SIDES) {
    test(`placement="${placement}"`, async ({ page }) => {
      await gotoStory(page, PLACEMENTS);
      const tooltip = await openOn(page, id);
      const { trigger, bubble } = await boxes(page, id, tooltip);

      /*
       * The story pads its grid generously so nothing is near a window edge —
       * the base repositions a tooltip that would not fit, and that is correct
       * behaviour which would make these assertions measure the flip instead of
       * the placement.
       */
      if (placement === 'top') {
        expect(bubble.y + bubble.height).toBeLessThanOrEqual(trigger.y + 1);
      } else if (placement === 'bottom') {
        expect(bubble.y).toBeGreaterThanOrEqual(trigger.y + trigger.height - 1);
      } else if (placement === 'start') {
        // LTR: the inline start is the left.
        expect(bubble.x + bubble.width).toBeLessThanOrEqual(trigger.x + 1);
      } else {
        expect(bubble.x).toBeGreaterThanOrEqual(trigger.x + trigger.width - 1);
      }
    });
  }
});

test.describe('how it lines up on the other axis', () => {
  test('`bottom start` aligns their start edges', async ({ page }) => {
    await gotoStory(page, PLACEMENTS);
    const tooltip = await openOn(page, 'trigger-bottom-start');
    const { trigger, bubble } = await boxes(
      page,
      'trigger-bottom-start',
      tooltip
    );

    /*
     * The assertion a screenshot cannot make. `bottom start` means the two
     * start edges line up, and it is the half of a placement that fails
     * silently: a tooltip centred under its trigger instead of aligned to it
     * looks perfectly reasonable.
     *
     * Within a pixel, because the base positions with fractional values.
     */
    expect(Math.abs(bubble.x - trigger.x)).toBeLessThanOrEqual(1);
  });

  test('`bottom end` aligns their end edges', async ({ page }) => {
    await gotoStory(page, PLACEMENTS);
    const tooltip = await openOn(page, 'trigger-bottom-end');
    const { trigger, bubble } = await boxes(
      page,
      'trigger-bottom-end',
      tooltip
    );

    expect(
      Math.abs(bubble.x + bubble.width - (trigger.x + trigger.width))
    ).toBeLessThanOrEqual(1);
  });

  test('and `bottom` centres it', async ({ page }) => {
    await gotoStory(page, PLACEMENTS);
    const tooltip = await openOn(page, 'trigger-bottom');
    const { trigger, bubble } = await boxes(page, 'trigger-bottom', tooltip);

    const triggerMid = trigger.x + trigger.width / 2;
    const bubbleMid = bubble.x + bubble.width / 2;
    expect(Math.abs(bubbleMid - triggerMid)).toBeLessThanOrEqual(1);
  });
});

test.describe('direction', () => {
  test('`end` is the other side in an RTL language', async ({ page }) => {
    /*
     * The check the logical vocabulary exists for. `placement="end"` is the
     * right in English and the LEFT in Arabic, and nothing in the component
     * says either word — the base derives it from the locale our provider
     * supplies.
     */
    await gotoStory(page, 'components-tooltip--direction');
    const tooltip = await openOn(page, 'trigger');
    const { trigger, bubble } = await boxes(page, 'trigger', tooltip);

    expect(bubble.x + bubble.width).toBeLessThanOrEqual(trigger.x + 1);
  });
});

test.describe('the arrow', () => {
  test('follows where the tooltip actually went, not where it was asked', async ({
    page
  }) => {
    /*
     * The base flips a tooltip that will not fit, so the arrow has to read the
     * REFLECTED placement. An arrow following the prop would point away from
     * the trigger — which is worse than no arrow at all, since the whole job of
     * the arrow is to say which of five icon buttons this belongs to.
     *
     * Asserted through the reflected attribute and the rotation it drives,
     * rather than by forcing a flip, because forcing one means putting a
     * trigger against a window edge and then measuring a layout the story was
     * not built for.
     */
    await gotoStory(page, PLACEMENTS);
    const tooltip = await openOn(page, 'trigger-bottom');

    // The attribute carries only the axis, which is all an arrow needs.
    await expect(tooltip).toHaveAttribute('data-placement', 'bottom');

    const rotation = await tooltip
      .locator('.bb-layer-arrow svg')
      .evaluate(node => getComputedStyle(node).transform);

    /*
     * A tooltip below its trigger has its arrow on top, pointing up — which is
     * the drawn shape rotated half a turn. `matrix(-1, 0, 0, -1, 0, 0)` is
     * 180deg; asserting the matrix rather than the degrees is what the computed
     * style actually gives.
     */
    expect(rotation).toBe('matrix(-1, 0, 0, -1, 0, 0)');
  });

  test('and points down when the tooltip is above', async ({ page }) => {
    await gotoStory(page, PLACEMENTS);
    const tooltip = await openOn(page, 'trigger-top');

    await expect(tooltip).toHaveAttribute('data-placement', 'top');
    const rotation = await tooltip
      .locator('.bb-layer-arrow svg')
      .evaluate(node => getComputedStyle(node).transform);

    // No rotation: the drawn shape already points down.
    expect(rotation === 'none' || rotation === 'matrix(1, 0, 0, 1, 0, 0)').toBe(
      true
    );
  });
});

test.describe('doc 06 and WCAG 1.4.13, which the report left open', () => {
  test('the pointer can travel into the tooltip without closing it', async ({
    page
  }) => {
    /*
     * WCAG 1.4.13 requires content shown on hover to be HOVERABLE: somebody
     * who needs to magnify the screen has to be able to move the pointer onto
     * it. Whether the base does that was written down as unmeasured when this
     * component was planned, and this is the measurement.
     *
     * The answer decides something real. If the pointer cannot reach it, then
     * nothing selectable or long belongs in a tooltip — which is the argument
     * for `Preview` existing as a separate component rather than a variant.
     */
    await gotoStory(page, OVERVIEW);
    const tooltip = await openOn(page, 'trigger');

    const bubble = await tooltip.boundingBox();
    expect(bubble).not.toBeNull();

    // Into the middle of the bubble, leaving the trigger behind.
    await page.mouse.move(
      bubble!.x + bubble!.width / 2,
      bubble!.y + bubble!.height / 2
    );

    /*
     * Given a close delay of 150ms, waiting 400ms is long enough for a tooltip
     * that was going to close to have gone.
     */
    await page.waitForTimeout(400);
    await expect(tooltip).toBeVisible();
  });

  test('and it goes when the pointer leaves both', async ({ page }) => {
    /*
     * The other half, and the one that makes the check above mean something: a
     * tooltip that never closed would also pass it.
     */
    await gotoStory(page, OVERVIEW);
    const tooltip = await openOn(page, 'trigger');

    await page.mouse.move(4, 600);
    await expect(tooltip).toBeHidden({ timeout: 2000 });
  });
});

test.describe('the delays', () => {
  test('the first tooltip waits, and its neighbour does not', async ({
    page
  }) => {
    /*
     * The base's global warmup timer, which is the whole reason a 600ms
     * opening delay is survivable (doc 09 §3.1). Asserted because the decision
     * rests on it: without the warmup, crossing a toolbar of six icon buttons
     * would cost 600ms six times over and nobody would wait.
     */
    await gotoStory(page, OVERVIEW);

    const first = page.getByRole('button', { name: 'Save' });
    const second = page.getByRole('button', { name: 'Duplicate' });
    const tooltip = page.getByRole('tooltip');

    await travelTo(page, first);

    /*
     * NOT YET, ASKED AS A STATE RATHER THAN AFTER A SLEEP. This was
     * `waitForTimeout(200)` then `toBeHidden()`, which is the one direction a
     * fixed sleep cannot be: `waitForTimeout` guarantees AT LEAST its number
     * and nothing about the maximum, so a process that stalled for 700ms
     * anywhere in that sleep woke up to an open tooltip and a red check.
     *
     * Two channels, because the panel and the name are wired separately and a
     * regression could take either: no tooltip in the tree, and no
     * `aria-describedby` on the trigger — which is what `Tooltip.test.tsx`
     * reads for the same claim in jsdom.
     *
     * It is honest to say what this does NOT fix. The margin is now the whole
     * 600ms rather than the 400ms the sleep left, but a machine slow enough to
     * spend 600ms between the travel and this read would still see an open
     * tooltip. Eliminating that needs a controllable clock, and Playwright's
     * `clock.install` does not pause on its own — measured in the pinned
     * playwright-core, only a `pauseAt` entry makes virtual time stop tracking
     * the real one. Wider margin, same class of dependence, one less sleep.
     */
    await expect(tooltip).toHaveCount(0);
    await expect(first).not.toHaveAttribute('aria-describedby', /.*/);

    await expect(tooltip).toBeVisible({ timeout: 3000 });

    await travelTo(page, second);
    /*
     * Immediately this time, and the sleep STAYS here because it is doing the
     * opposite job: it gives the tooltip 250ms to be wrongly closed, so a
     * longer wait makes the check stricter rather than flakier. 250ms is
     * comfortably inside the 600ms the first one took, so a tooltip visible
     * here can only have skipped the delay — which is the warmup the decision
     * rests on.
     */
    await page.waitForTimeout(250);
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Duplicate this invoice');
  });
});
