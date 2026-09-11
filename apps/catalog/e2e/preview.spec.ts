/*
 * A preview's geometry, and the three things that make it a different
 * component from `Tooltip` rather than a bigger one.
 *
 * All three are invisible to jsdom, and two of them are the reason this
 * component may not use the shared sheet (doc 08 §4):
 *
 *   1. The POINTER can travel from the trigger into the card and use what is
 *      in it. A tooltip's pointer can enter it too — WCAG 1.4.13, measured on
 *      that component — but there is nothing in there to reach.
 *   2. The KEYBOARD can get in, with `Tab`, and out again past the last thing.
 *      That is what containment would have broken, and containment is what a
 *      nested dialog would have switched on.
 *   3. The PAGE BEHIND stays usable. The exact opposite of `Popover`, measured
 *      the same way, and the reason those are two components.
 */
import { expect, test } from '@playwright/test';
import { travelTo } from './pointer';
import { gotoStory } from './story';

const PLACEMENTS = 'components-preview--placements';
const OVERVIEW = 'components-preview--overview';

type Page = import('@playwright/test').Page;
type Locator = import('@playwright/test').Locator;

/*
 * `travelTo` is imported rather than copied, and the sentence that used to sit
 * here is the reason: it argued that "the duplication is six lines that never
 * have to agree with each other". They did not agree. Seven copies carried one
 * explanation and it was wrong about which part of the base rejects a
 * teleport, so the thing that never had to agree was the FACT — `e2e/pointer.ts`
 * has the corrected one. The journey matters more here than anywhere else: a
 * preview's trigger and its card are separated by a safe area, so the
 * intermediate positions are load-bearing rather than decorative.
 */

/** Hover a trigger and wait for the card to arrive AND come to rest. */
const openOn = async (page: Page, testId: string): Promise<Locator> => {
  await travelTo(page, page.getByTestId(testId));

  const card = page.locator('.bb-preview');
  // Longer than the 600ms open delay, which the base pays before the first
  // card of an approach (doc 09 §3.1).
  await expect(card).toBeVisible({ timeout: 3000 });
  await expect(card).not.toHaveAttribute('data-entering', /.*/);
  return card;
};

const boxes = async (page: Page, testId: string, card: Locator) => {
  const trigger = await page.getByTestId(testId).boundingBox();
  const box = await card.boundingBox();
  expect(trigger).not.toBeNull();
  expect(box).not.toBeNull();
  return { trigger: trigger!, card: box! };
};

/* ------------------------------------------------------------------ *
 * The pointer, and the journey into the card.
 * ------------------------------------------------------------------ */

test.describe('the pointer', () => {
  test('can travel into the card and press what is in it', async ({ page }) => {
    /*
     * THE ASSERTION THIS COMPONENT EXISTS FOR. A tooltip cannot hold a link,
     * not because the pointer cannot reach it but because the keyboard cannot;
     * a preview can hold one, and this is the pointer half of proving it.
     *
     * The journey is deliberately awkward — down and sideways, in steps, with
     * the last leg landing on the link rather than on the card's edge. The base
     * keeps a safe-area polygon over the trigger, the panel and the space
     * between them, so a diagonal crossing is exactly the case it exists for.
     */
    await gotoStory(page, 'components-preview--interactive');
    const card = await openOn(page, 'trigger');

    const link = card.getByRole('button', { name: 'Open statement' });
    const target = (await link.boundingBox())!;
    const from = (await page.getByTestId('trigger').boundingBox())!;

    // A diagonal, in steps, so it is movement and not a jump.
    await page.mouse.move(from.x + from.width / 2, from.y + from.height, {
      steps: 4
    });
    await page.mouse.move(
      target.x + target.width / 2,
      target.y + target.height / 2,
      { steps: 12 }
    );

    // Still open after the journey, and after longer than the close delay.
    await page.waitForTimeout(400);
    await expect(card).toBeVisible();

    await link.evaluate(node =>
      node.addEventListener('click', () => {
        (window as unknown as { pressed?: boolean }).pressed = true;
      })
    );
    await page.mouse.down();
    await page.mouse.up();

    const pressed = await page.evaluate(
      () => (window as unknown as { pressed?: boolean }).pressed === true
    );
    expect(pressed).toBe(true);
  });

  test('and it closes when the pointer leaves both', async ({ page }) => {
    await gotoStory(page, OVERVIEW);
    const card = await openOn(page, 'trigger');

    // Far away, in one movement, which leaves the safe area at once.
    await page.mouse.move(1200, 40, { steps: 8 });
    await expect(card).toHaveCount(0, { timeout: 2000 });
  });
});

/* ------------------------------------------------------------------ *
 * The keyboard, which is the half a tooltip cannot have.
 * ------------------------------------------------------------------ */

test.describe('the keyboard', () => {
  test('Tab moves focus INTO the card, and out again past the last thing', async ({
    page
  }) => {
    /*
     * The claim doc 08 §4 turns on. Focus goes in, moves through, and LEAVES —
     * the last part is what focus containment would have broken, and a nested
     * `role="dialog"` would have switched containment on from the inside.
     *
     * So this is the check that would fail if somebody reached for the shared
     * sheet to get a header and a title for free.
     */
    await gotoStory(page, 'components-preview--interactive');

    await page.getByTestId('trigger').focus();
    const card = page.locator('.bb-preview');
    await expect(card).toBeVisible({ timeout: 3000 });
    await expect(card).not.toHaveAttribute('data-entering', /.*/);

    const inside = () =>
      card.evaluate(node => node.contains(document.activeElement));

    expect(await inside()).toBe(false);

    await page.keyboard.press('Tab');
    expect(await inside()).toBe(true);

    await page.keyboard.press('Tab');
    expect(await inside()).toBe(true);

    /*
     * And out. Two focusables in the card, so the third press leaves — and the
     * card goes with it, because the base closes what focus has left.
     */
    await page.keyboard.press('Tab');
    expect(await inside()).toBe(false);
    await expect(card).toHaveCount(0, { timeout: 2000 });
  });

  test('focus opens it after a delay, not immediately', async ({ page }) => {
    /*
     * ORDER, NOT ELAPSED TIME. The base opens a preview on keyboard focus only
     * after a warmup delay — its own comment says why: tabbing quickly through
     * a page would otherwise open cards and add their tab stops on the way
     * past.
     *
     * This used to start a `Date.now()` stopwatch and assert
     * `300 < waited < 2000`, under a comment admitting the band was widened so
     * it would not become "a check on how fast the machine is". Doc 10 §11
     * names elapsed milliseconds outright, and widening is the fix it forbids.
     * The span was one-sided as well: every term in it — two protocol round
     * trips, React's commit, the visibility poll noticing — only ever ADDED to
     * the reading, so the ceiling failed on a slow machine and the floor
     * passed on one.
     *
     * AND THE NUMBER WAS NOT OURS TO ASSERT HERE. Measured in the pinned base:
     * `react-aria-components`, `private/PreviewTrigger.mjs`, `delay:
     * props.delay ?? 600` — the default is the same 600 the component passes,
     * so deleting `delay={HOVER_OPEN_DELAY}` would leave every assertion above
     * still passing. A check that cannot tell our decision from the base's
     * default is measuring the base (§11.1). The CLOSE delay is the one that
     * is ours — 150 against the base's 200 — and it is asserted where it can
     * be seen.
     *
     * What is left is the claim in the title, which is a sequence of states.
     * If the delay were removed the card would be there on the first read and
     * stay there, so the first assertion fails rather than passing vacuously.
     */
    await gotoStory(page, OVERVIEW);
    const trigger = page.getByTestId('trigger');
    const card = page.locator('.bb-preview');

    await trigger.focus();
    await expect(card).toHaveCount(0);
    await expect(trigger).not.toHaveAttribute('aria-describedby', /.*/);

    await expect(card).toBeVisible({ timeout: 3000 });
  });

  test('Escape closes it', async ({ page }) => {
    await gotoStory(page, OVERVIEW);
    await page.getByTestId('trigger').focus();
    const card = page.locator('.bb-preview');
    await expect(card).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);

    // And focus is still on the trigger, so the keyboard has not been dropped
    // somewhere else by a layer closing.
    await expect(page.getByTestId('trigger')).toBeFocused();
  });
});

/* ------------------------------------------------------------------ *
 * The page behind: the opposite of Popover, measured the same way.
 * ------------------------------------------------------------------ */

test.describe('the page behind', () => {
  test('there is no underlay, and the page is still usable', async ({
    page
  }) => {
    /*
     * `Popover`'s equivalent check asserts that a click on the page is
     * SWALLOWED. This is the same measurement with the opposite expectation,
     * and having both is what makes either mean anything.
     */
    await gotoStory(page, OVERVIEW);
    await openOn(page, 'trigger');

    await expect(page.getByTestId('underlay')).toHaveCount(0);

    const behind = page.getByTestId('behind');
    await behind.evaluate(node =>
      node.addEventListener('click', () => {
        (window as unknown as { pressed?: boolean }).pressed = true;
      })
    );
    await travelTo(page, behind);
    await page.mouse.down();
    await page.mouse.up();

    expect(
      await page.evaluate(
        () => (window as unknown as { pressed?: boolean }).pressed === true
      )
    ).toBe(true);
  });

  test('and the page can still scroll', async ({ page }) => {
    await gotoStory(page, OVERVIEW);

    const overflow = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).overflow);

    const before = await overflow();
    await openOn(page, 'trigger');
    expect(await overflow()).toBe(before);
    expect(await overflow()).not.toBe('hidden');
  });
});

/* ------------------------------------------------------------------ *
 * Geometry.
 * ------------------------------------------------------------------ */

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
      const card = await openOn(page, id);
      const box = await boxes(page, id, card);

      if (placement === 'top') {
        expect(box.card.y + box.card.height).toBeLessThanOrEqual(
          box.trigger.y + 1
        );
      } else if (placement === 'bottom') {
        expect(box.card.y).toBeGreaterThanOrEqual(
          box.trigger.y + box.trigger.height - 1
        );
      } else if (placement === 'start') {
        // LTR: the inline start is the left.
        expect(box.card.x + box.card.width).toBeLessThanOrEqual(
          box.trigger.x + 1
        );
      } else {
        expect(box.card.x).toBeGreaterThanOrEqual(
          box.trigger.x + box.trigger.width - 1
        );
      }
    });
  }
});

test.describe('how it lines up on the other axis', () => {
  test('`bottom start` aligns their start edges', async ({ page }) => {
    // The default this component ships, and the half of a placement that fails
    // silently: a card centred under its trigger looks perfectly reasonable.
    await gotoStory(page, PLACEMENTS);
    const card = await openOn(page, 'trigger-bottom-start');
    const box = await boxes(page, 'trigger-bottom-start', card);

    expect(Math.abs(box.card.x - box.trigger.x)).toBeLessThanOrEqual(1);
  });

  test('the gap from the trigger is the layer offset', async ({ page }) => {
    await gotoStory(page, PLACEMENTS);
    const card = await openOn(page, 'trigger-bottom');
    const box = await boxes(page, 'trigger-bottom', card);

    const gap = box.card.y - (box.trigger.y + box.trigger.height);
    expect(gap).toBeGreaterThanOrEqual(7);
    expect(gap).toBeLessThanOrEqual(9);
  });
});

test.describe('direction', () => {
  test('the card aligns to the inline start, which is the right in Arabic', async ({
    page
  }) => {
    await gotoStory(page, 'components-preview--direction');
    const card = await openOn(page, 'trigger');
    const box = await boxes(page, 'trigger', card);

    expect(
      Math.abs(
        box.card.x + box.card.width - (box.trigger.x + box.trigger.width)
      )
    ).toBeLessThanOrEqual(1);
  });
});

test.describe('the arrow', () => {
  test('follows where the card actually went, not where it was asked', async ({
    page
  }) => {
    /*
     * The shared arrow's third caller. Checked here as well as on the other two
     * because the rule keys on `[data-placement]` on ANY ancestor, so "it works
     * for whichever component is first in the stylesheet" is a real way for
     * this to be broken.
     */
    await gotoStory(page, PLACEMENTS);
    const card = await openOn(page, 'trigger-bottom');

    await expect(card).toHaveAttribute('data-placement', 'bottom');

    const rotation = await card
      .locator('.bb-layer-arrow svg')
      .evaluate(node => getComputedStyle(node).transform);

    // A card below its trigger has its arrow on top, pointing up: the drawn
    // shape rotated half a turn.
    expect(rotation).toBe('matrix(-1, 0, 0, -1, 0, 0)');
  });

  test('and it is actually PAINTED, not merely positioned', async ({
    page
  }) => {
    /*
     * THE CHECK THAT WAS MISSING, and it is missing from nowhere else in this
     * repository by accident.
     *
     * `Popover`'s arrow shipped invisible. Its box was in the right place, its
     * `visibility` was `visible`, its rotation was correct, and the rotation
     * check above passed — because a transform is a computed style and says
     * nothing about whether anything reached the screen. The panel clipped it:
     * an arrow is positioned OUTSIDE the panel by design, and the panel's
     * `overflow` erased it. The screenshot that should have shown it had been
     * accepted as a reference with no arrow in it.
     *
     * `document.elementFromPoint` is what tells the difference. Clipped content
     * is not hit-tested, so a point in the middle of a clipped arrow resolves
     * to whatever is behind the panel; a painted one resolves to the arrow's
     * own path. Measured in both states before this was written.
     */
    await gotoStory(page, PLACEMENTS);
    const layer = await openOn(page, 'trigger-bottom');

    const hit = await layer.evaluate(node => {
      const arrow = node.querySelector('.bb-layer-arrow');
      if (!arrow) return 'no arrow element at all';
      const box = arrow.getBoundingClientRect();
      const at = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2
      );
      return at === null ? 'nothing' : at.tagName.toLowerCase();
    });

    // The drawn triangle is a `path` inside the arrow's `svg`.
    expect(hit).toBe('path');
  });
});

test.describe('the card', () => {
  test('stops at the narrow container, and is not collapsed', async ({
    page
  }) => {
    await gotoStory(page, 'components-preview--long-text');
    const card = await openOn(page, 'trigger');
    const width = (await card.boundingBox())!.width;

    /*
     * The ceiling is tied to the TOKEN rather than to a number, and RESOLVED in
     * the browser rather than parsed — `--bb-container-narrow` is `24rem`, and
     * `parseFloat` of that is 24.
     *
     * What is NOT asserted is that the card REACHES the ceiling. That depends
     * on how wide the story's longest unbroken line renders, which depends on
     * the platform's fonts: the equivalent `Popover` check was written that way
     * and failed on CI at 473.125px against a Windows host's 480. Doc 08 §9.
     */
    const ceiling = await card.evaluate(node => {
      const probe = document.createElement('div');
      probe.style.width = 'var(--bb-container-narrow)';
      node.append(probe);
      const resolved = probe.getBoundingClientRect().width;
      probe.remove();
      return resolved;
    });

    expect(ceiling).toBeGreaterThan(0);
    expect(width).toBeLessThanOrEqual(ceiling + 1);
    // The floor, which scales with the font on both sides and so survives any
    // face. `Popover` shipped 2px wide with only a ceiling asserted.
    const trigger = (await page.getByTestId('trigger').boundingBox())!.width;
    expect(width).toBeGreaterThan(trigger);
  });

  test('is not a heading, and names the panel', async ({ page }) => {
    /*
     * Both halves of the title decision, in the place that can see the
     * accessible NAME rather than the attribute that produces it.
     */
    await gotoStory(page, 'components-preview--long-text');
    const card = await openOn(page, 'trigger');

    await expect(card).toHaveAttribute('role', 'dialog');
    await expect(card.getByRole('heading')).toHaveCount(0);
    await expect(
      page.getByRole('dialog', {
        name: 'Astilleros del Sur, Sociedad Anónima Cerrada'
      })
    ).toBeVisible();
  });
});
