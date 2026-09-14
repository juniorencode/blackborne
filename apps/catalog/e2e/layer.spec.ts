/*
 * The layer guarantees, in a real browser, because there is nowhere else they
 * can be checked.
 *
 * Doc 08 §9 says it plainly and it was learned the hard way: jsdom does not
 * implement real tab order, so a reproduction of a focus bug passed every case
 * in the unit suite while failing in a browser. Focus containment, focus
 * return, scroll locking and keyboard scrolling are all in that category —
 * they are the core of what a layer promises, and the unit tests can say
 * nothing about any of them.
 *
 * Doc 08 §10 is the checklist this file works through. Each test names the item
 * it covers, so a rule that loses its check is visible.
 */
import { expect, test } from '@playwright/test';
import { travelTo } from './pointer';
import { animationsSettled, painted } from './settle';
import { gotoStory } from './story';
import { watchWheels, wheelsSeen } from './wheel';

const OVERVIEW = 'components-dialog--overview';
const NESTED = 'components-dialog--nested';
const DISMISSABLE = 'components-dialog--dismissable';

/** The panel, which is also the element that scrolls and takes focus. */
const dialog = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog');

test.describe('focus', () => {
  test('moves into the layer on open, and lands on the layer itself', async ({
    page
  }) => {
    await gotoStory(page, OVERVIEW);
    await page.getByTestId('open').click();
    await expect(dialog(page)).toBeVisible();

    /*
     * Doc 08 §4: the base puts focus on the layer container rather than on the
     * first control, and the first Tab then reaches it. That is recorded as
     * correct and left alone, so this asserts the behaviour we chose not to
     * change — nothing beyond the container is autofocused.
     */
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el === null
        ? null
        : { role: el.getAttribute('role'), tag: el.tagName.toLowerCase() };
    });
    expect(focused?.role).toBe('dialog');
  });

  test('is contained: tabbing round the loop never leaves', async ({
    page
  }) => {
    await gotoStory(page, OVERVIEW);
    await page.getByTestId('open').click();
    await expect(dialog(page)).toBeVisible();

    /*
     * Twelve presses against three focusable controls — the cross, Cancel and
     * Save — so the loop is traversed several times over. One lap would pass
     * even if the trap leaked on the second.
     */
    const escaped: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const panel = document.querySelector('[role="dialog"]');
        const active = document.activeElement;
        return {
          contained:
            panel !== null && active !== null && panel.contains(active),
          name:
            active?.getAttribute('aria-label') ??
            active?.textContent?.trim().slice(0, 24) ??
            '(none)'
        };
      });
      if (!inside.contained) escaped.push(`press ${i + 1} -> ${inside.name}`);
    }

    expect(escaped, `focus left the dialog: ${escaped.join(', ')}`).toEqual([]);
  });

  test('returns to the control that opened it, with no trigger component', async ({
    page
  }) => {
    await gotoStory(page, OVERVIEW);

    const open = page.getByTestId('open');
    await open.click();
    await expect(dialog(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();

    /*
     * The part worth checking rather than assuming. This library exposes no
     * `DialogTrigger`: a dialog is controlled and is opened from wherever the
     * action lives (a row, a menu, a route). Focus return therefore cannot
     * come from a trigger knowing about the layer — it comes from the base
     * restoring whatever was focused when the layer opened.
     *
     * There is a decoy button after this one, so "focus went back to the page"
     * is not enough: it has to be THIS control.
     */
    await expect(open).toBeFocused();
  });
});

test.describe('escape', () => {
  test('closes the innermost layer only, one press at a time', async ({
    page
  }) => {
    await gotoStory(page, NESTED);

    await page.getByTestId('open-outer').click();
    await expect(
      page.getByRole('dialog', { name: 'The first dialog' })
    ).toBeVisible();

    await page.getByTestId('open-inner').click();
    const inner = page.getByRole('dialog', { name: 'The second dialog' });
    await expect(inner).toBeVisible();

    // One press: the second goes, the first stays. This is doc 08 §3 and doc
    // 09 §8's "cancels the current level, one at a time".
    await page.keyboard.press('Escape');
    await expect(inner).toBeHidden();
    await expect(
      page.getByRole('dialog', { name: 'The first dialog' })
    ).toBeVisible();

    // A second press takes the first.
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('dialog', { name: 'The first dialog' })
    ).toBeHidden();
  });
});

test.describe('dismissing by clicking outside', () => {
  test('a dialog is not dismissable by default', async ({ page }) => {
    await gotoStory(page, OVERVIEW);
    await page.getByTestId('open').click();
    await expect(dialog(page)).toBeVisible();

    /*
     * Doc 08 §5: a layer holding unsaved input is not dismissable, and since a
     * component cannot inspect what its children are, the safe case is the
     * default. Clicking the scrim — the top-left corner, which is well outside
     * the centred panel.
     */
    await page.mouse.click(8, 8);
    await expect(dialog(page)).toBeVisible();
  });

  test('and is when it holds nothing to lose', async ({ page }) => {
    await gotoStory(page, DISMISSABLE);
    await page.getByTestId('open').click();
    await expect(dialog(page)).toBeVisible();

    await page.mouse.click(8, 8);
    await expect(dialog(page)).toBeHidden();
  });
});

test.describe('scroll', () => {
  /** How far down the page is, which is what the lock is about. */
  const pageOffset = (page: import('@playwright/test').Page) =>
    page.evaluate(() => window.scrollY);

  test('the page behind does not scroll while a layer is open', async ({
    page
  }) => {
    await gotoStory(page, NESTED);

    await page.getByTestId('open-outer').click();
    await expect(dialog(page)).toBeVisible();

    await watchWheels(page);
    const before = await pageOffset(page);
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
    expect(await pageOffset(page)).toBe(before);
  });

  test('and the lock survives a nested layer closing', async ({ page }) => {
    /*
     * Doc 08 §6, which the document left openly unverified with a written
     * prediction: the base keeps a module-level reference count, so closing
     * an inner layer should NOT lift the lock while an outer one is open.
     *
     * The document says this check lands with `Drawer`. Two dialogs exercise
     * the same mechanism — the same `usePreventScroll` — so the prediction can
     * be tested here, and the drawer case remains as written.
     *
     * The failure this guards is specific and silent: an open dialog over a
     * page that scrolls underneath it.
     */
    await gotoStory(page, NESTED);

    await page.getByTestId('open-outer').click();
    await page.getByTestId('open-inner').click();
    await expect(
      page.getByRole('dialog', { name: 'The second dialog' })
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('dialog', { name: 'The second dialog' })
    ).toBeHidden();
    // The first is still open.
    await expect(
      page.getByRole('dialog', { name: 'The first dialog' })
    ).toBeVisible();

    await watchWheels(page);
    const before = await pageOffset(page);
    await page.mouse.move(180, 500);
    await page.mouse.wheel(0, 600);

    // The same one-of-each as above: the count proves the wheel arrived.
    await expect
      .poll(() => wheelsSeen(page), { timeout: 1000 })
      .toBeGreaterThan(0);
    await painted(page);
    expect(await pageOffset(page)).toBe(before);
  });

  test('the page scrolls again once every layer has closed', async ({
    page
  }) => {
    /*
     * The other half, and the one a lock bug hides behind: a reference count
     * that never reaches zero leaves the page permanently frozen, which is a
     * worse failure than the one above and looks like nothing at all.
     */
    await gotoStory(page, NESTED);

    const inner = page.getByRole('dialog', { name: 'The second dialog' });
    const outer = page.getByRole('dialog', { name: 'The first dialog' });

    await page.getByTestId('open-outer').click();
    await page.getByTestId('open-inner').click();
    await expect(inner).toBeVisible();

    /*
     * Waiting for each to close before pressing again, and that is not
     * politeness — it is measured. Two presses in the same frame are not
     * reliable: the second lands while the first close is still settling and
     * does nothing.
     *
     * An exit animation made that far worse and is the reason there is none:
     * the base keeps a layer mounted while it animates away, and a mounted
     * layer still consumes Escape, which widened the window from a frame to
     * the full 100ms of the animation. Doc 09 §2.1 records it. What is left is
     * a frame, and a person pressing twice does it by watching the first close
     * — which is what this does too.
     */
    await page.keyboard.press('Escape');
    await expect(inner).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(outer).toBeHidden();

    await page.mouse.move(180, 400);
    await page.mouse.wheel(0, 400);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
  });

  test('the keyboard reaches the scroll region, and how far away it is', async ({
    page
  }) => {
    /*
     * REWRITTEN 2026-09-14, AND THE OLD ASSERTION IS WORTH READING BEFORE
     * CHANGING THIS BACK.
     *
     * It used to say: focus the panel the way opening does, press `PageDown`,
     * the panel scrolls. That was true because the scrolling element and the
     * element the base focuses were the same one, and a browser scrolls the
     * nearest scrollable ANCESTOR of whatever has focus.
     *
     * The scroll moved to the body so the bar spans the content rather than
     * the whole panel (doc 08 §4.1), which makes the scroller a DESCENDANT of
     * the focused element — so the keys do nothing until something inside is
     * reached. The route is bought back with a tab stop on the region, which
     * is what WCAG 2.1.1 asks for, and the COST is the thing this check now
     * pins: it is no longer immediate.
     *
     * Measured rather than asserted loosely, because "reachable" is the kind
     * of claim that stays true while quietly getting worse. Two stops, in
     * order: the close button, then the region. If a third ever appears
     * between them this goes red, which is the point.
     */
    await gotoStory(page, 'components-dialog--scrolling');
    await painted(page);
    await animationsSettled(page);

    const panel = page.getByRole('dialog').first();
    await expect(panel).toBeVisible();

    /* The panel itself no longer scrolls, and that is half of the change. */
    expect(
      await panel.evaluate(node => node.scrollHeight - node.clientHeight <= 1)
    ).toBe(true);

    // Focus it the way opening does, then use the keyboard and nothing else.
    await panel.evaluate(node => (node as HTMLElement).focus());

    const stops: string[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      stops.push(
        await page.evaluate(() => {
          const el = document.activeElement;
          if (!(el instanceof HTMLElement)) return 'nothing';
          if (el.classList.contains('bb-layer-body')) return 'the region';
          return el.getAttribute('aria-label') ?? el.tagName;
        })
      );
      if (stops.at(-1) === 'the region') break;
    }
    expect(stops).toEqual(['Close', 'the region']);

    const body = page.locator('.bb-layer-body');
    expect(await body.evaluate(node => node.scrollTop)).toBe(0);

    await page.keyboard.press('PageDown');
    await expect
      .poll(() => body.evaluate(node => node.scrollTop), { timeout: 1000 })
      .toBeGreaterThan(0);
  });
});

test.describe('the portal', () => {
  test('the consumer supplies the container, and every layer honours it', async ({
    page
  }) => {
    /*
     * Doc 08 §8, and decision 0013: the container is received rather than
     * assumed, through `ConfigProvider`. Every themed story in the catalog
     * rests on it — a layer inherits `data-bb-mode` only because it is a DOM
     * descendant of the element carrying it — so this asserts the thing those
     * pictures depend on instead of trusting that they look right.
     *
     * The colour is measured too, and that is the point: a dialog that mounted
     * at the document would still LOOK like a dialog, in the wrong mode, and
     * only comparing it against the mode's own token says which one it took.
     */
    await gotoStory(page, 'components-dialog--dark');

    const measured = await page.evaluate(() => {
      const host = document.querySelector('.catalog-layer-page');
      const dialog = document.querySelector('[role="dialog"]');
      const panel = document.querySelector('.bb-dialog-panel');
      const resolve = (el: Element, token: string) =>
        getComputedStyle(el).getPropertyValue(token).trim();
      return {
        insideHost: host !== null && dialog !== null && host.contains(dialog),
        panelFill:
          panel === null ? '' : getComputedStyle(panel).backgroundColor,
        hostRaised: host === null ? '' : resolve(host, '--bb-surface-raised'),
        rootRaised: resolve(document.documentElement, '--bb-surface-raised')
      };
    });

    expect(measured.insideHost).toBe(true);
    /*
     * The dark mode's raised surface differs from the document's, so the two
     * tokens resolving differently is what proves the layer is inheriting from
     * the host and not from the page. If the portal container were ignored,
     * these would be equal and the panel would be painted in light mode.
     */
    expect(measured.hostRaised).not.toBe('');
    expect(measured.hostRaised).not.toBe(measured.rootRaised);
    expect(measured.panelFill).not.toBe('');
  });

  test('and with none supplied, a layer still mounts', async ({ page }) => {
    /*
     * The entry gate's "works with no provider around it". The overview story
     * wraps nothing, so the base's own default has to stand.
     */
    await gotoStory(page, OVERVIEW);
    await page.getByTestId('open').click();

    const parent = await page.evaluate(() => {
      const el = document.querySelector('[role="dialog"]');
      // Walk out to whatever the portal's root is.
      let node = el?.parentElement ?? null;
      while (node !== null && node.parentElement !== document.body) {
        node = node.parentElement;
      }
      return node?.parentElement?.tagName.toLowerCase() ?? null;
    });

    expect(parent).toBe('body');
  });

  /*
   * AND THE CONTAINER MUST LAY NOTHING OUT.
   *
   * A check on the fixture rather than on the library, which is unusual and is
   * the point: every baseline of an open layer is taken through this element,
   * so a bug in it is a bug in twenty pictures and in the checks that measure
   * against a trigger's position.
   *
   * There was one. The host is the portal container, so an open layer is a
   * CHILD of it — and three of the seven copies of this fixture centred their
   * content with `display: grid; place-items: center`, which made that child a
   * grid item. The base's overlay wrapper is `position: static`, so it takes
   * part in layout: two auto rows in a grid taller than its contents share the
   * free space, and opening a tooltip gave the trigger half the page instead
   * of all of it.
   *
   * Measured before the fix: y = 441 closed, y = 239 open. The trigger moved
   * 202px under the pointer that opened it — doc 09 §7's "nothing moves under
   * the cursor", broken by the catalog in the fixture for the components that
   * rule is most about. It also made three unrelated checks flaky, because the
   * base positions a layer against a box that then moved.
   */
  test('and a layer arriving in it moves nothing', async ({ page }) => {
    await gotoStory(page, 'components-tooltip--direction');

    const trigger = page.getByTestId('trigger');
    const before = await trigger.boundingBox();
    expect(before).not.toBeNull();

    // The pointer travels rather than teleporting, and `e2e/pointer.ts` carries
    // the measured reason. `before` stays because it is this test's actual
    // subject: the box as it was before the layer arrived.
    await travelTo(page, trigger);
    const tooltip = page.locator('[role=tooltip]');
    await expect(tooltip).toBeVisible({ timeout: 3000 });
    await expect(tooltip).not.toHaveAttribute('data-entering', /.*/);

    const after = await trigger.boundingBox();
    expect(after).not.toBeNull();
    expect(after!.y).toBeCloseTo(before!.y, 1);
    expect(after!.x).toBeCloseTo(before!.x, 1);

    /*
     * And the shape that makes it true, so a failure says WHY rather than
     * only that something moved: the host is a column whose stage claims the
     * leftover height, and the layer is an item of zero height after it.
     */
    const shape = await page.evaluate(() => {
      const host = document.querySelector('.catalog-layer-page');
      const stage = document.querySelector('.catalog-layer-stage');
      if (host === null || stage === null) return null;
      const last = host.lastElementChild;
      return {
        host: getComputedStyle(host).flexDirection,
        stageIsNotTheHost: stage !== host,
        layerHeight:
          last === null || last === stage
            ? -1
            : Math.round(last.getBoundingClientRect().height)
      };
    });

    expect(shape?.host).toBe('column');
    expect(shape?.stageIsNotTheHost).toBe(true);
    expect(shape?.layerHeight).toBe(0);
  });
});

test.describe('stacking', () => {
  test('comes from the public token, with no literal z-index', async ({
    page
  }) => {
    /*
     * Doc 08 §10 asks for this explicitly, and it is the kind of thing that
     * drifts the first time somebody needs a layer "just above" another. The
     * assertion is against the token's value rather than against the number,
     * so redefining the token moves the check with it.
     */
    await gotoStory(page, OVERVIEW);
    await page.getByTestId('open').click();
    await expect(dialog(page)).toBeVisible();

    const measured = await page.evaluate(() => {
      const scrim = document.querySelector('.bb-dialog-scrim');
      if (scrim === null) return null;
      return {
        applied: getComputedStyle(scrim).zIndex,
        token: getComputedStyle(document.documentElement)
          .getPropertyValue('--bb-layer-overlay')
          .trim()
      };
    });

    expect(measured).not.toBeNull();
    expect(measured?.token).not.toBe('');
    expect(measured?.applied).toBe(measured?.token);
  });
});

/*
 * THE SCROLL IS ON THE BODY, AND THE KEYBOARD STILL REACHES IT.
 *
 * Doc 08 §4.1: the scroll moved off the element the base focuses on
 * 2026-09-14, so the bar spans the content rather than the whole panel. The
 * reason that was not free is that a browser scrolls the nearest scrollable
 * ANCESTOR of whatever has focus — an inner scroller is a DESCENDANT of the
 * focused element, and no key reaches it.
 *
 * `internal/useScrollableRegion` buys the route back, and this is the check
 * that it is a route rather than an intention: it presses the key. Every
 * assertion here fails if the `tabIndex` is dropped, and the first one fails
 * if the scroll goes back on the sheet.
 */
test('a layer scrolls its body, not its panel, and a key still moves it', async ({
  page
}) => {
  await gotoStory(page, 'components-dialog--scrolling');
  await painted(page);
  await animationsSettled(page);

  const read = () =>
    page.evaluate(() => {
      const sheet = document.querySelector('[role="dialog"]');
      const body = sheet?.querySelector('.bb-layer-body');
      const header = sheet?.querySelector('header');
      const footer = sheet?.querySelector('footer');
      /* A sentinel rather than a throw: `expect.poll` does not retry a
         callback that throws, and neither does a reader used twice. */
      if (!(sheet instanceof HTMLElement) || !(body instanceof HTMLElement))
        return null;
      return {
        sheetOverflows: sheet.scrollHeight - sheet.clientHeight > 1,
        bodyOverflows: body.scrollHeight - body.clientHeight > 1,
        tabIndex: body.getAttribute('tabindex'),
        scrollTop: Math.round(body.scrollTop),
        headerTop: header
          ? Math.round(header.getBoundingClientRect().top)
          : null,
        footerBottom: footer
          ? Math.round(footer.getBoundingClientRect().bottom)
          : null
      };
    });

  const before = await read();
  expect(before).not.toBeNull();

  /*
   * THE PANEL DOES NOT SCROLL AND THE BODY DOES. Both halves, because either
   * alone is true of an arrangement nobody wants: a panel that scrolls with a
   * body that also does is two bars, and neither scrolling is a story with
   * nothing to scroll.
   */
  expect(before?.sheetOverflows).toBe(false);
  expect(before?.bodyOverflows).toBe(true);

  /* A tab stop, because it has somewhere to go. */
  expect(before?.tabIndex).toBe('0');
  expect(before?.scrollTop).toBe(0);

  await page.locator('.bb-layer-body').focus();
  await page.keyboard.press('PageDown');

  await expect
    .poll(async () => (await read())?.scrollTop ?? 0)
    .toBeGreaterThan(100);

  /*
   * And the two ends stayed where they were, which is the whole point of the
   * change: the header and the footer are siblings of the scroller now rather
   * than sticky inside it, so content moving under them must not move them.
   */
  const after = await read();
  expect(after?.headerTop).toBe(before?.headerTop);
  expect(after?.footerBottom).toBe(before?.footerBottom);
});
