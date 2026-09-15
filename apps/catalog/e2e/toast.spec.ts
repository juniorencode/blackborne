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

/**
 * How far the countdown has left to run, as a fraction.
 *
 * IT READS THE RING, and it read the bar's width until 2026-09-14. The
 * countdown moved from a hairline along the bottom edge to a ring round the
 * close button, so the quantity moved with it: the arc is drawn by animating
 * `stroke-dashoffset` from the full circumference down to zero, which means
 * the offset IS the fraction remaining and needs no geometry of its own.
 *
 * The array is read rather than assumed for the same reason the old one
 * divided by its parent's width: a check that hard-codes 100.53 passes on a
 * ring of any size and fails to notice one of the wrong size.
 */
const remaining = (notice: Locator) =>
  notice.locator('.bb-toast-countdown circle:last-of-type').evaluate(node => {
    const style = getComputedStyle(node);
    const total = Number.parseFloat(style.strokeDasharray);
    const left = Number.parseFloat(style.strokeDashoffset);
    if (!Number.isFinite(total) || total === 0) return -1;
    return left / total;
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

  test('the countdown is inside the card, and does not swallow the press', async ({
    page
  }) => {
    /*
     * `Popover`'s arrow shipped invisible with a correct box and a correct
     * computed style, so anything drawn in this library gets checked against
     * something other than its own style (doc 08 §9).
     *
     * IT USED TO HIT-TEST THE MIDDLE OF THE BAR, and that stopped being the
     * right instrument when the bar became a ring on 2026-09-14. The ring is
     * `pointer-events-none` on purpose — the cross underneath is the target,
     * and a countdown that swallowed the press would be one you could not beat,
     * which is the opposite of doc 09 §4.1. So a hit test at its centre must
     * return the BUTTON, and that is now the assertion rather than the
     * obstacle.
     *
     * The clipping risk the old check carried is real and is measured
     * separately: the card clips to its radius, so a ring wider than the cell
     * it sits in would be cut. Geometry answers that, and it answers it for
     * every point at once rather than for the one that was sampled.
     */
    await gotoStory(page, OVERVIEW);
    const notice = await sendFrom(page, 'send');

    const measured = await notice.evaluate(node => {
      const ring = node.querySelector('.bb-toast-countdown');
      if (!ring) return null;
      const box = ring.getBoundingClientRect();
      const card = node.getBoundingClientRect();
      const at = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2
      );
      const arc = ring.querySelector('circle:last-of-type');
      return {
        /* What a press at the ring's centre actually reaches. */
        hit:
          at === null
            ? 'nothing'
            : (at.closest('button')?.getAttribute('aria-label') ?? at.tagName),
        /* Every edge inside the card that clips it. */
        inside:
          box.left >= card.left - 0.5 &&
          box.right <= card.right + 0.5 &&
          box.top >= card.top - 0.5 &&
          box.bottom <= card.bottom + 0.5,
        /*
         * A real path with a real length, AND a dash array that agrees with
         * it — which is the invariant rather than either number alone. The
         * array is written by hand in `Toast.css` as 2πr at r=16; if the
         * radius ever moves and that constant does not, the ring stops short
         * of closing or closes early, and nothing else in the suite would say
         * so.
         */
        length: arc instanceof SVGGeometryElement ? arc.getTotalLength() : 0,
        dashArray:
          arc === null
            ? 0
            : Number.parseFloat(getComputedStyle(arc).strokeDasharray),
        box: [Math.round(box.width), Math.round(box.height)]
      };
    });

    expect(measured).not.toBeNull();
    expect(measured?.hit).toBe('Close');
    expect(measured?.inside).toBe(true);
    /*
     * Chromium reports 100.0 for a circle whose exact circumference is 100.53
     * — it flattens the arc to compute a length — so the assertion is that the
     * two AGREE to within a unit rather than that either equals a constant.
     * Pinning the browser's own approximation would be asserting the engine.
     */
    expect(
      Math.abs((measured?.length ?? 0) - (measured?.dashArray ?? 0))
    ).toBeLessThan(1);
    expect(measured?.length ?? 0).toBeGreaterThan(50);
    expect(measured?.box).toEqual([28, 28]);
  });
});

/*
 * THE MARK IN A BADGE, AGAINST EVERY SOLID IT IS DRAWN ON.
 *
 * `--bb-tone-mark` is white on all four tones and in both modes, which steps
 * around doc 03 §4.0's pairing on purpose: `--bb-X-on` is chosen so TEXT
 * clears 4.5:1, and for amber that forces a dark brown — a badge obeying it
 * came out as three white glyphs and one brown one.
 *
 * A mark inside a badge is a graphical element, so doc 03 §5 rule 2 asks 3:1
 * of it rather than 4.5. All four clear that, and the WORST clears it by
 * 0.12 — which is the entire reason this check exists. A margin that thin is
 * not something to leave resting on a note in a stylesheet: the palette is
 * generated, and the day amber moves this goes red instead of the badge
 * quietly dropping under the floor.
 *
 * Measured with a canvas rather than by parsing, for the reason `theme-axes`
 * records: `oklch()` does not serialise to `rgb()`, and summing the digits of
 * one reads its lightness as a red channel.
 */
test('a badge mark clears the floor on every tone, in both modes', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const measured = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const luminance = (colour: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, 1, 1);
      const pixel = ctx.getImageData(0, 0, 1, 1).data;
      const channel = (value: number) => {
        const v = (value ?? 0) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return (
        0.2126 * channel(pixel[0] ?? 0) +
        0.7152 * channel(pixel[1] ?? 0) +
        0.0722 * channel(pixel[2] ?? 0)
      );
    };
    const ratio = (a: string, b: string) => {
      const x = luminance(a);
      const y = luminance(b);
      const [hi, lo] = x > y ? [x, y] : [y, x];
      return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
    };

    const rows: { where: string; ratio: number }[] = [];
    for (const mode of ['light', 'dark']) {
      const host = document.createElement('div');
      host.setAttribute('data-bb-mode', mode);
      document.body.append(host);
      const style = getComputedStyle(host);
      const mark = style.getPropertyValue('--bb-tone-mark').trim();
      /* `neutral` has no solid and draws no badge, so it is not in this list. */
      for (const tone of ['info', 'success', 'warning', 'danger']) {
        const solid = style.getPropertyValue(`--bb-${tone}`).trim();
        rows.push({ where: `${mode}/${tone}`, ratio: ratio(mark, solid) });
      }
      host.remove();
    }
    return rows;
  });

  expect(measured).toHaveLength(8);

  const under = measured.filter(row => row.ratio < 3);
  expect(
    under,
    `a badge mark below doc 03 §5 rule 2's 3:1 floor:\n  ${under
      .map(row => `${row.where} at ${row.ratio}:1`)
      .join('\n  ')}`
  ).toEqual([]);
});

/*
 * WHERE EACH OF THE EIGHT PLACEMENTS PUTS THE STACK.
 *
 * The catalog photographs ONE of them. Eight baselines of one small card in
 * eight corners would be eight chances to approve a picture nobody looked at,
 * and the question here is geometry rather than appearance — which is what a
 * check answers better than a screenshot.
 *
 * Measured against the WINDOW rather than against remembered coordinates, so
 * the assertions survive a different viewport: a region at the start hugs the
 * left edge in a left-to-right page, one at the end hugs the right, and a
 * centred one is centred to within a pixel.
 *
 * And it walks eight STORIES rather than eight regions on one page. The first
 * version of the fixture put all eight in one story and axe refused it:
 * `landmark-unique`, because a region is a landmark and eight of them share
 * one role and one name. The component's own props say a page has one region;
 * a fixture that breaks that to save a screenshot teaches the wrong thing.
 */
const PLACED: [
  string,
  'start' | 'centre' | 'end',
  'top' | 'middle' | 'bottom'
][] = [
  ['placed-top-start', 'start', 'top'],
  ['placed-top', 'centre', 'top'],
  ['placed-top-end', 'end', 'top'],
  ['placed-middle-start', 'start', 'middle'],
  ['placed-middle-end', 'end', 'middle'],
  ['placed-bottom-start', 'start', 'bottom'],
  ['placed-bottom', 'centre', 'bottom'],
  ['placed-bottom-end', 'end', 'bottom']
];

for (const [story, inline, block] of PLACED) {
  test(`a region placed ${story.replace('placed-', '').replace('-', ' ')} lands there`, async ({
    page
  }) => {
    await gotoStory(page, `components-toast--${story}`);

    const notice = page.locator('.bb-toast').first();
    await expect(notice).toBeVisible();

    const measured = await page.locator('.bb-toast-region').evaluate(node => {
      const box = node.getBoundingClientRect();
      return {
        left: Math.round(box.left),
        right: Math.round(box.right),
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        centreX: Math.round(box.left + box.width / 2),
        width: Math.round(box.width),
        viewport: {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight
        }
      };
    });

    const { viewport } = measured;

    if (inline === 'start') expect(measured.left).toBe(0);
    if (inline === 'end') expect(measured.right).toBe(viewport.width);
    if (inline === 'centre') {
      expect(
        Math.abs(measured.centreX - viewport.width / 2)
      ).toBeLessThanOrEqual(1);
      /* And not by being full width, which would centre anything. */
      expect(measured.width).toBeLessThan(viewport.width);
    }

    if (block === 'top') expect(measured.top).toBe(0);
    if (block === 'bottom') expect(measured.bottom).toBe(viewport.height);
    if (block === 'middle') {
      const centreY = (measured.top + measured.bottom) / 2;
      expect(Math.abs(centreY - viewport.height / 2)).toBeLessThanOrEqual(1);
    }
  });
}
