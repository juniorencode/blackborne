/*
 * A notice's timing, which is the whole of this component and none of which
 * jsdom can see.
 *
 * Three of the four guarantees doc 08 §7.1 says this library documents — and
 * therefore inherits the risk of, if the base changes them when its toast API
 * stabilises — are behaviour under a clock:
 *
 *   1. The timers PAUSE while the pointer is in the region or focus is inside
 *      it. Doc 09 §4.1 makes that half of what allows an automatic dismissal at
 *      all; the other half is the countdown being visible, which is here too.
 *   2. The overflow goes to a BACKLOG rather than evicting, and a waiting
 *      notice does not spend its time while hidden. The unit suite measures the
 *      order with a fake clock; what is here is the visible consequence.
 *   3. A notice sits ABOVE a modal layer and stays reachable while it is open.
 *
 * The fourth — the announcement being assertive — is a role, and the unit suite
 * asserts it. What no automated layer can check is whether a screen reader
 * actually interrupts, which is doc 06 §5's third column and still owed.
 */
import { expect, test } from '@playwright/test';
import { travelAway, travelTo } from './pointer';
import { gotoStory } from './story';

const OVERVIEW = 'components-toast--overview';

type Page = import('@playwright/test').Page;
type Locator = import('@playwright/test').Locator;

/** Press a trigger and wait for the notice to arrive AND come to rest. */
const sendFrom = async (page: Page, testId: string): Promise<Locator> => {
  await page.getByTestId(testId).click();

  const notice = page.locator('.bb-toast').first();
  await expect(notice).toBeVisible();
  await expect(notice).not.toHaveAttribute('data-entering', /.*/);
  return notice;
};

/** How far the countdown has run, as the fraction of the bar still left. */
const remaining = (notice: Locator) =>
  notice.locator('.bb-toast-countdown').evaluate(node => {
    const bar = node.getBoundingClientRect();
    const parent = (node.parentElement as HTMLElement).getBoundingClientRect();
    return bar.width / parent.width;
  });

/* ------------------------------------------------------------------ *
 * The countdown, and the pause that makes it fair.
 * ------------------------------------------------------------------ */

test.describe('the countdown', () => {
  test('runs down', async ({ page }) => {
    await gotoStory(page, OVERVIEW);
    const notice = await sendFrom(page, 'send');

    const atStart = await remaining(notice);
    await page.waitForTimeout(2000);
    const later = await remaining(notice);

    /*
     * Measured as a shrinking fraction rather than against a number of
     * milliseconds: this is a check on the bar being driven by the timeout, not
     * on how fast the machine is. A third of six seconds has gone, so it must
     * have moved, and it must not be finished.
     */
    expect(atStart).toBeGreaterThan(0.9);
    expect(later).toBeLessThan(atStart - 0.15);
    expect(later).toBeGreaterThan(0.1);
  });

  test('and STOPS while the pointer is on the stack', async ({ page }) => {
    /*
     * The assertion this file exists for. The base pauses every timer in the
     * region while the pointer is inside it, and the bar reads the same two
     * state attributes the timer does — so if the two ever disagreed, the bar
     * would keep moving while the notice stayed, or freeze while it left.
     */
    await gotoStory(page, OVERVIEW);
    const notice = await sendFrom(page, 'send');

    await travelTo(page, notice);

    const paused = await remaining(notice);
    await page.waitForTimeout(2000);
    const stillPaused = await remaining(notice);

    // Within a pixel's worth of the bar, which is what "did not move" is.
    expect(Math.abs(stillPaused - paused)).toBeLessThan(0.02);

    /*
     * And it is a pause rather than a cancellation: the notice is still there
     * after longer than its whole six seconds, and it resumes when the pointer
     * leaves.
     */
    await expect(notice).toBeVisible();
    await travelAway(page);
    await expect(notice).toHaveCount(0, { timeout: 8000 });
  });

  test('a danger notice has no countdown and does not leave', async ({
    page
  }) => {
    await gotoStory(page, OVERVIEW);
    const notice = await sendFrom(page, 'fail');

    /*
     * Doc 09 §4.1's exception, and the one that matters most: something has
     * gone wrong, the person may not have been looking, and a message that
     * removes itself leaves them with a broken state and no explanation.
     *
     * Eight seconds is past both of the library's timeouts.
     */
    await expect(notice.locator('.bb-toast-countdown')).toHaveCount(0);
    await page.waitForTimeout(8000);
    await expect(notice).toBeVisible();

    // It still goes when it is dismissed.
    await notice.getByRole('button', { name: 'Close' }).click();
    await expect(notice).toHaveCount(0);
  });

  test('one with an action runs for longer than one without', async ({
    page
  }) => {
    /*
     * The two numbers of doc 09 §4.1, compared against each other rather than
     * against the clock. Both bars start full and shrink at their own rate, so
     * after the same wait the ten-second one has more left than the six — and
     * that comparison holds whatever the machine is doing, which a pair of
     * absolute timings would not.
     */
    await gotoStory(page, OVERVIEW);

    await page.getByTestId('send').click();
    await page.getByTestId('delete').click();

    const notices = page.locator('.bb-toast');
    await expect(notices).toHaveCount(2);
    await expect(notices.first()).not.toHaveAttribute('data-entering', /.*/);

    // Newest first, so the one carrying Undo is on top.
    const withAction = notices.first();
    const withoutAction = notices.nth(1);
    await expect(
      withAction.getByRole('button', { name: 'Undo' })
    ).toBeVisible();

    await page.waitForTimeout(2500);

    const left = await remaining(withAction);
    const gone = await remaining(withoutAction);
    expect(left).toBeGreaterThan(gone + 0.1);
  });
});

/* ------------------------------------------------------------------ *
 * The stack.
 * ------------------------------------------------------------------ */

test.describe('the stack', () => {
  test('shows three of five, newest at the top, and the rest follow', async ({
    page
  }) => {
    await gotoStory(page, 'components-toast--overflow');
    await page.getByTestId('send').click();

    const notices = page.locator('.bb-toast');
    await expect(notices).toHaveCount(3);

    /*
     * The visible consequence of what the unit suite measures with a fake
     * clock. The two that waited appear as these expire, with their own full
     * time — so nothing was dropped and nothing expired unseen.
     */
    const first = await notices.first().innerText();
    expect(first).toContain('INV-4825');

    await expect(notices).toHaveCount(2, { timeout: 9000 });
    expect(await notices.first().innerText()).toContain('INV-4822');
  });

  test('the region is a landmark, and each notice can be focused', async ({
    page
  }) => {
    /*
     * The keyboard route in is landmark navigation rather than `Tab` (doc 08
     * §7), which no automated check can exercise — a screen reader's landmark
     * key is not a key press. What is checked is what it lands on: a region
     * with a name, holding notices that take focus.
     */
    await gotoStory(page, OVERVIEW);
    const notice = await sendFrom(page, 'send');

    const region = page.locator('.bb-toast-region');
    await expect(region).toHaveAttribute('role', 'region');
    const label = await region.getAttribute('aria-label');
    expect(label ?? '').not.toBe('');

    await notice.focus();
    await expect(notice).toBeFocused();
  });

  test('the region does not swallow clicks on the page behind it', async ({
    page
  }) => {
    /*
     * The region is a full-height column so the stack can grow upward, which
     * would put a strip of dead space down the side of every screen using it.
     * `pointer-events` is what stops that, and this is the check that it is on
     * the right two elements: none on the region, and back on each notice.
     */
    await gotoStory(page, OVERVIEW);
    const notice = await sendFrom(page, 'send');
    const box = (await notice.boundingBox())!;

    // A point in the region's column, above the stack.
    const hitAbove = await page.evaluate(
      ([x, y]) => {
        const at = document.elementFromPoint(x as number, y as number);
        return at?.closest('.bb-toast-region') === null;
      },
      [box.x + box.width / 2, box.y - 120]
    );
    expect(hitAbove).toBe(true);

    // And the notice itself is still hit-testable, or its buttons would be
    // unreachable by pointer.
    const hitNotice = await page.evaluate(
      ([x, y]) => {
        const at = document.elementFromPoint(x as number, y as number);
        return at?.closest('.bb-toast') !== null;
      },
      [box.x + box.width / 2, box.y + box.height / 2]
    );
    expect(hitNotice).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * Above a dialog, which doc 08 §1 verified for the layer base.
 * ------------------------------------------------------------------ */

test.describe('above a modal layer', () => {
  test('it appears over an open dialog and stays reachable', async ({
    page
  }) => {
    await gotoStory(page, 'components-toast--above-a-dialog');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.getByTestId('send').click();
    const notice = page.locator('.bb-toast').first();
    await expect(notice).toBeVisible();

    /*
     * Above, measured rather than assumed: the notice's own middle has to
     * resolve to the notice and not to the dialog's scrim. A stacking token
     * that had drifted below the overlay would leave a notice announced,
     * present, and unclickable.
     */
    const box = (await notice.boundingBox())!;
    const onTop = await page.evaluate(
      ([x, y]) => {
        const at = document.elementFromPoint(x as number, y as number);
        return at?.closest('.bb-toast') !== null;
      },
      [box.x + box.width / 2, box.y + box.height / 2]
    );
    expect(onTop).toBe(true);

    // And the dialog is still open: a notice is not a layer that closes one.
    await expect(dialog).toBeVisible();
  });

  test('and Escape closes the dialog, not the notice', async ({ page }) => {
    /*
     * The case doc 09 §2.1 banned exit animations for. A layer still mounted
     * while it animates away goes on consuming `Escape`, and a notice is the
     * one layer that can be on screen while a dialog is open — so this is the
     * exact arrangement that trap was found in.
     */
    await gotoStory(page, 'components-toast--above-a-dialog');
    await page.getByTestId('send').click();
    await expect(page.locator('.bb-toast').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.bb-toast').first()).toBeVisible();
  });
});

/* ------------------------------------------------------------------ *
 * The notice's own box.
 * ------------------------------------------------------------------ */

test.describe('the notice', () => {
  test('stops at the narrow container and is not collapsed', async ({
    page
  }) => {
    await gotoStory(page, 'components-toast--long-text');
    const notice = await sendFrom(page, 'send');
    const width = (await notice.boundingBox())!.width;

    /*
     * The ceiling is tied to the token and RESOLVED in the browser rather than
     * parsed, and what is NOT asserted is that it REACHES the ceiling — that
     * depends on how wide the text renders, which depends on the platform's
     * fonts. Doc 08 §9, learned on `Popover`.
     */
    const ceiling = await notice.evaluate(node => {
      const probe = document.createElement('div');
      probe.style.width = 'var(--bb-container-narrow)';
      /*
       * `position: fixed`, AND THAT IS NOT BELT AND BRACES.
       *
       * A notice is a flex ROW, so a plain block child becomes a flex item and
       * its width is the main size — `flex-shrink` then squeezes an explicit
       * 384px down to whatever is left. Measured: 254px, against a token that
       * resolves to 384. The same probe in `popover.spec.ts` is correct
       * because a panel is a flex COLUMN, where width is the cross size and an
       * explicit one is honoured.
       *
       * So the technique depends on the parent's flex direction, which is the
       * kind of thing that makes a measurement quietly wrong rather than
       * loudly broken. Taking the probe out of flow removes the dependency.
       */
      probe.style.position = 'fixed';
      node.append(probe);
      const resolved = probe.getBoundingClientRect().width;
      probe.remove();
      return resolved;
    });

    expect(ceiling).toBeGreaterThan(0);
    expect(width).toBeLessThanOrEqual(ceiling + 1);
    expect(width).toBeGreaterThan(150);
  });

  test('the countdown is painted, not merely positioned', async ({ page }) => {
    /*
     * `Popover`'s arrow shipped invisible with a correct box and a correct
     * computed style, so anything drawn in this library now gets hit-tested
     * (doc 08 §9). The countdown sits inside a notice that clips, at the very
     * edge of it, which is the same shape of risk.
     */
    await gotoStory(page, OVERVIEW);
    const notice = await sendFrom(page, 'send');

    const hit = await notice.evaluate(node => {
      const bar = node.querySelector('.bb-toast-countdown');
      if (!bar) return 'no countdown element';
      const box = bar.getBoundingClientRect();
      /*
       * The MIDDLE of the bar, not near its end. 4px in from the start hits
       * the page behind, and that is correct rather than a bug: the notice
       * clips its children to its own radius, so the bar's bottom corner is
       * cut away by the curve — which is the reason the clip is there.
       * Measured at four offsets before this line was settled.
       */
      const at = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2
      );
      return at === null ? 'nothing' : at.className.toString() || at.tagName;
    });
    expect(hit).toContain('bb-toast-countdown');
  });
});
