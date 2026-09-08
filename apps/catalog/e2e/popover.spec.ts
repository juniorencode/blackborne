/*
 * A popover's geometry, and the question the unit suite cannot ask: where the
 * keyboard goes.
 *
 * THE REASON THIS FILE MATTERS more than a geometry check. Doc 08 §4 had a
 * popover down as a layer that leaves the page alone — free tabbing, page still
 * usable behind it. The base does something else, measured in 1.21.0: it
 * renders a full-window underlay, locks the page scroll and hides everything
 * outside the popover from the accessibility tree, all three keyed on nothing
 * but `!isNonModal`. Focus containment is keyed elsewhere — on the popover
 * carrying `role="dialog"` itself, which it declines to do when a dialog is
 * already nested inside, which is exactly what the shared sheet renders.
 *
 * So the combination that arrives by default is: page blocked in three ways,
 * keyboard free to walk into it. jsdom cannot see that, because it has no tab
 * order at all. This file is where it is settled.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const PLACEMENTS = 'components-popover--placements';
const OVERVIEW = 'components-popover--overview';

type Page = import('@playwright/test').Page;
type Locator = import('@playwright/test').Locator;

/**
 * Press a trigger and wait for the panel to arrive AND come to rest.
 *
 * A popover opens on a press, so there is none of the pointer-travel business a
 * tooltip needs — but the wait for `data-entering` to go is the same trap: the
 * panel scales in from its trigger, so a box measured mid-animation is a box
 * 3% too small in the wrong place. Recorded on Drawer, which slides.
 */
const openOn = async (page: Page, testId: string): Promise<Locator> => {
  await page.getByTestId(testId).click();

  const panel = page.locator('.bb-popover');
  await expect(panel).toBeVisible();
  await expect(panel).not.toHaveAttribute('data-entering', /.*/);
  return panel;
};

const boxes = async (page: Page, testId: string, panel: Locator) => {
  const trigger = await page.getByTestId(testId).boundingBox();
  const box = await panel.boundingBox();
  expect(trigger).not.toBeNull();
  expect(box).not.toBeNull();
  return { trigger: trigger!, panel: box! };
};

/* ------------------------------------------------------------------ *
 * The keyboard, which is what this component had to be changed for.
 * ------------------------------------------------------------------ */

test.describe('the keyboard', () => {
  test('Tab does not leave the panel', async ({ page }) => {
    /*
     * THE ASSERTION THIS FILE EXISTS FOR.
     *
     * The panel holds three focusable things — a close button, two fields and a
     * checkbox — plus an Apply button in the footer. Tabbing more times than
     * that has to come back round to one of them rather than land on the page.
     *
     * Landing on the page is not a cosmetic failure: the page is aria-hidden
     * while this is open, so focus would be sitting on a control a screen
     * reader cannot see, over an underlay that will not let it be clicked.
     */
    await gotoStory(page, OVERVIEW);
    const panel = await openOn(page, 'trigger');

    const inside = async () =>
      panel.evaluate(node => node.contains(document.activeElement));

    expect(await inside()).toBe(true);

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const name = await page.evaluate(
        () =>
          document.activeElement?.textContent?.trim().slice(0, 40) ?? '(none)'
      );
      expect(
        await inside(),
        `after ${i + 1} Tab press(es) focus was on "${name}", outside the panel`
      ).toBe(true);
    }
  });

  test('Shift+Tab does not leave it either', async ({ page }) => {
    // The other direction fails independently: a scope that contains forward
    // motion and not backward is the ordinary way this is got wrong.
    await gotoStory(page, OVERVIEW);
    const panel = await openOn(page, 'trigger');

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(
        await panel.evaluate(node => node.contains(document.activeElement)),
        `after ${i + 1} Shift+Tab press(es) focus was outside the panel`
      ).toBe(true);
    }
  });

  test('Escape closes it and focus goes back to the trigger', async ({
    page
  }) => {
    await gotoStory(page, OVERVIEW);
    await openOn(page, 'trigger');

    await page.keyboard.press('Escape');
    await expect(page.locator('.bb-popover')).toHaveCount(0);

    /*
     * Restoring focus is the base's, and it is unconditional there — but it is
     * the half of a layer that a person notices, so it is measured rather than
     * trusted. Somebody who opened a panel from the keyboard and closed it has
     * to be back where they were, not at the top of the document.
     */
    await expect(page.getByTestId('trigger')).toBeFocused();
  });
});

/* ------------------------------------------------------------------ *
 * What the base does to the page behind, measured rather than described.
 * ------------------------------------------------------------------ */

test.describe('the page behind', () => {
  test('the underlay really covers the window', async ({ page }) => {
    await gotoStory(page, OVERVIEW);
    await openOn(page, 'trigger');

    const underlay = page.getByTestId('underlay');
    const box = await underlay.boundingBox();
    const window = page.viewportSize();
    expect(box).not.toBeNull();
    expect(window).not.toBeNull();

    // `position: fixed; inset: 0` is the base's own literal, and this is the
    // check that it resolves to the window rather than to some containing
    // block a parent introduced. Decision 0010 was wrong about exactly this.
    expect(box!.x).toBe(0);
    expect(box!.y).toBe(0);
    expect(box!.width).toBe(window!.width);
    expect(box!.height).toBe(window!.height);
  });

  test('a click outside closes it and does NOT press what was under it', async ({
    page
  }) => {
    /*
     * This is what makes doc 08 §5.1's decision safe, and it was not part of
     * the reasoning when the decision was taken — it was measured afterwards.
     *
     * "Clicking outside closes it" would be a poor default if the click also
     * went through to the button underneath: one press would dismiss the panel
     * AND export the ledger. The underlay swallows it, so the click means
     * exactly one thing.
     */
    await gotoStory(page, OVERVIEW);
    await openOn(page, 'trigger');

    const pressed = page.evaluate(() => {
      const target = document.querySelector('[data-testid="behind"]');
      return new Promise<boolean>(resolve => {
        target?.addEventListener('click', () => resolve(true), { once: true });
        setTimeout(() => resolve(false), 500);
      });
    });

    await page.getByTestId('behind').click({ force: true });

    expect(await pressed).toBe(false);
    await expect(page.locator('.bb-popover')).toHaveCount(0);
  });

  test('and with isDismissable off, the same click leaves it open', async ({
    page
  }) => {
    await gotoStory(page, 'components-popover--not-dismissable');
    const panel = page.locator('.bb-popover');
    await expect(panel).toBeVisible();
    await expect(panel).not.toHaveAttribute('data-entering', /.*/);

    await page.mouse.click(8, 8);
    await expect(panel).toBeVisible();

    // Still reachable, which is the point of the prop: nothing in the panel
    // was lost. And `Escape` still works, so it is not a trap.
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  });

  test('the page cannot scroll while it is open', async ({ page }) => {
    await gotoStory(page, OVERVIEW);

    const overflow = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).overflow);

    const before = await overflow();
    await openOn(page, 'trigger');
    expect(await overflow()).toBe('hidden');

    /*
     * And it comes back. The base counts rather than toggles, which doc 08 §6
     * verified for a drawer inside a dialog — a popover inside a dialog is the
     * third layer to use the same counter, and the unit suite measures that
     * nesting. What is checked here is the plain single-layer restore, because
     * a lock that is never released is the failure a person actually meets.
     */
    await page.keyboard.press('Escape');
    await expect(page.locator('.bb-popover')).toHaveCount(0);
    expect(await overflow()).toBe(before);
  });
});

/* ------------------------------------------------------------------ *
 * Geometry: the twelve placements, measured rather than photographed.
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
      const panel = await openOn(page, id);
      const box = await boxes(page, id, panel);

      /*
       * The story pads its grid generously so nothing is near a window edge —
       * the base repositions a panel that would not fit, which is correct
       * behaviour and would make these assertions measure the flip instead of
       * the placement.
       */
      if (placement === 'top') {
        expect(box.panel.y + box.panel.height).toBeLessThanOrEqual(
          box.trigger.y + 1
        );
      } else if (placement === 'bottom') {
        expect(box.panel.y).toBeGreaterThanOrEqual(
          box.trigger.y + box.trigger.height - 1
        );
      } else if (placement === 'start') {
        // LTR: the inline start is the left.
        expect(box.panel.x + box.panel.width).toBeLessThanOrEqual(
          box.trigger.x + 1
        );
      } else {
        expect(box.panel.x).toBeGreaterThanOrEqual(
          box.trigger.x + box.trigger.width - 1
        );
      }
    });
  }
});

test.describe('how it lines up on the other axis', () => {
  test('`bottom start` aligns their start edges', async ({ page }) => {
    /*
     * The assertion a screenshot cannot make, and the default this component
     * ships: `bottom start` means the two start edges line up. It is the half
     * of a placement that fails silently — a panel centred under its trigger
     * instead of aligned to it looks perfectly reasonable.
     */
    await gotoStory(page, PLACEMENTS);
    const panel = await openOn(page, 'trigger-bottom-start');
    const box = await boxes(page, 'trigger-bottom-start', panel);

    expect(Math.abs(box.panel.x - box.trigger.x)).toBeLessThanOrEqual(1);
  });

  test('`bottom end` aligns their end edges', async ({ page }) => {
    await gotoStory(page, PLACEMENTS);
    const panel = await openOn(page, 'trigger-bottom-end');
    const box = await boxes(page, 'trigger-bottom-end', panel);

    expect(
      Math.abs(
        box.panel.x + box.panel.width - (box.trigger.x + box.trigger.width)
      )
    ).toBeLessThanOrEqual(1);
  });

  test('and `bottom` centres it', async ({ page }) => {
    await gotoStory(page, PLACEMENTS);
    const panel = await openOn(page, 'trigger-bottom');
    const box = await boxes(page, 'trigger-bottom', panel);

    const triggerMid = box.trigger.x + box.trigger.width / 2;
    const panelMid = box.panel.x + box.panel.width / 2;
    expect(Math.abs(panelMid - triggerMid)).toBeLessThanOrEqual(1);
  });

  test('the gap from the trigger is the layer offset', async ({ page }) => {
    /*
     * `LAYER_OFFSET` is one value for the library, from spacing, and it is not
     * a prop (doc 02 §3.3). The base defaults it to 0, which put a tooltip's
     * bubble on top of its trigger and its arrow inside the panel — measured,
     * which is why the constant exists at all.
     */
    await gotoStory(page, PLACEMENTS);
    const panel = await openOn(page, 'trigger-bottom');
    const box = await boxes(page, 'trigger-bottom', panel);

    const gap = box.panel.y - (box.trigger.y + box.trigger.height);
    expect(gap).toBeGreaterThanOrEqual(7);
    expect(gap).toBeLessThanOrEqual(9);
  });
});

test.describe('direction', () => {
  test('the panel aligns to the inline start, which is the right in Arabic', async ({
    page
  }) => {
    /*
     * The check the logical vocabulary exists for. `bottom start` puts the
     * panel's left edge on the trigger's left in English, and its RIGHT edge on
     * the trigger's right in Arabic — and nothing in the component says either
     * word. The base derives it from the locale our provider supplies.
     */
    await gotoStory(page, 'components-popover--direction');
    const panel = page.locator('.bb-popover');
    await expect(panel).toBeVisible();
    await expect(panel).not.toHaveAttribute('data-entering', /.*/);
    const box = await boxes(page, 'trigger', panel);

    expect(
      Math.abs(
        box.panel.x + box.panel.width - (box.trigger.x + box.trigger.width)
      )
    ).toBeLessThanOrEqual(1);
  });
});

test.describe('the arrow', () => {
  test('follows where the panel actually went, not where it was asked', async ({
    page
  }) => {
    /*
     * The same shared arrow the tooltip uses, and the same reason it reads the
     * REFLECTED placement: the base flips a layer that will not fit, and an
     * arrow following the prop would point away from its trigger.
     *
     * Checked here as well as on Tooltip because the rule keys on
     * `[data-placement]` on ANY ancestor, so "it works for the component that
     * happens to be first in the stylesheet" is a real way for this to be
     * broken.
     */
    await gotoStory(page, PLACEMENTS);
    const panel = await openOn(page, 'trigger-bottom');

    await expect(panel).toHaveAttribute('data-placement', 'bottom');

    const rotation = await panel
      .locator('.bb-layer-arrow svg')
      .evaluate(node => getComputedStyle(node).transform);

    // A panel below its trigger has its arrow on top, pointing up: the drawn
    // shape rotated half a turn. `matrix(-1, 0, 0, -1, 0, 0)` is 180deg.
    expect(rotation).toBe('matrix(-1, 0, 0, -1, 0, 0)');
  });
});

/* ------------------------------------------------------------------ *
 * The panel's own box.
 * ------------------------------------------------------------------ */

test.describe('the panel', () => {
  test('stops at the medium container and is not wider than it needs', async ({
    page
  }) => {
    await gotoStory(page, 'components-popover--long-text');
    const panel = page.locator('.bb-popover');
    await expect(panel).toBeVisible();
    await expect(panel).not.toHaveAttribute('data-entering', /.*/);

    const width = (await panel.boundingBox())!.width;

    /*
     * The ceiling is tied to the TOKEN rather than to a number, so this says
     * "it stopped at the container scale" and not "it stopped at 480px" —
     * which is what makes the check survive a consumer changing the scale.
     * Doc 04 §4.0 records how much of that scale is actually injectable.
     *
     * And the token has to be RESOLVED rather than parsed: it is `30rem`, so
     * `parseFloat` of it is 30, and a first version of this check compared a
     * 480px panel against 31 and failed for the wrong reason. A length in a
     * variable is a string until a browser is asked what it means.
     */
    const ceiling = await panel.evaluate(node => {
      const probe = document.createElement('div');
      probe.style.width = 'var(--bb-container-medium)';
      node.append(probe);
      const resolved = probe.getBoundingClientRect().width;
      probe.remove();
      return { resolved, maxWidth: getComputedStyle(node).maxWidth };
    });

    expect(ceiling.resolved).toBeGreaterThan(0);
    expect(parseFloat(ceiling.maxWidth)).toBeCloseTo(ceiling.resolved, 0);
    expect(width).toBeLessThanOrEqual(ceiling.resolved + 1);

    /*
     * WHAT IS NOT ASSERTED HERE, and why. A first version also required the
     * panel to REACH the ceiling — "it really got there rather than stopping
     * short" — which looked like the teeth this check needed and was actually
     * a measurement of a font.
     *
     * The panel is the only one in the library sized BY its content, so it
     * touches its ceiling only when the story's longest unbroken line is wider
     * than 480px, and how wide a line is depends on which face
     * `--bb-font-sans` resolved to. Passed at exactly 480 on a Windows host
     * and failed on CI's Linux container at 473.125, same code, same viewport,
     * same resolved token.
     *
     * That is the whole reason the `visual` project runs in Docker: text
     * metrics are the platform's. `checks` does not — it runs on the host
     * locally and on Linux in CI — so **an assertion in this project may not
     * depend on how wide a string renders.** Either it belongs to the
     * containerised project, or it is stated without the font in the middle,
     * which is what the ceiling and the floor below do.
     */

    /*
     * AND A FLOOR, which is the half this check was missing.
     *
     * Written without one, it passed while the panel was 2px wide — the whole
     * component collapsed by inline-size containment, and the assertion that
     * existed to guard its width was satisfied by the collapse. A ceiling is
     * not a measurement of a width, it is a measurement of one end of it.
     *
     * The floor is the trigger's own width, which is the weakest true claim:
     * a panel narrower than the button that opened it is broken whatever the
     * cause, and this story's content is much wider than that.
     */
    const trigger = (await page.getByTestId('trigger').boundingBox())!.width;
    expect(width).toBeGreaterThan(trigger);
  });

  test('the content scrolls and the header and footer stay put', async ({
    page
  }) => {
    /*
     * The trap `Dialog` was built on: a percentage max-height cannot bound a
     * child of a max-height parent, and the failure is silent — the panel
     * clips two thirds of its content and reports itself unscrollable.
     *
     * A popover's ceiling comes from the base rather than from a token, so
     * this is a different path to the same property and worth its own check.
     */
    await gotoStory(page, 'components-popover--scrolling');
    const panel = page.locator('.bb-popover');
    await expect(panel).toBeVisible();
    await expect(panel).not.toHaveAttribute('data-entering', /.*/);

    const sheet = panel.getByRole('dialog');
    /*
     * The width is asserted here too, for the same reason the check above
     * gained a floor: `scrollHeight > clientHeight` is trivially true of a 2px
     * column of single characters, so this check also passed while the
     * component was collapsed. A scroll check on a panel of no width proves
     * nothing about scrolling.
     */
    expect((await panel.boundingBox())!.width).toBeGreaterThan(100);

    const metrics = await sheet.evaluate(node => ({
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight
    }));
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

    const titleBefore = (await panel.getByRole('heading').boundingBox())!.y;
    await sheet.evaluate(node => {
      node.scrollTop = node.scrollHeight;
    });
    const titleAfter = (await panel.getByRole('heading').boundingBox())!.y;

    // Sticky inside the scroller, not a row of a grid — because the element
    // that scrolls has to be the one the base focuses (doc 08, and the
    // package guide).
    expect(Math.abs(titleAfter - titleBefore)).toBeLessThanOrEqual(1);
  });
});
