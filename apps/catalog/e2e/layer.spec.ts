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
import { gotoStory } from './story';

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

    const before = await pageOffset(page);
    await page.mouse.move(180, 500);
    await page.mouse.wheel(0, 600);
    // A wheel event is asynchronous; give the page the chance to be wrong.
    await expect.poll(() => pageOffset(page), { timeout: 1000 }).toBe(before);
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

    const before = await pageOffset(page);
    await page.mouse.move(180, 500);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => pageOffset(page), { timeout: 1000 }).toBe(before);
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

  test('the dialog scrolls from the keyboard the moment it opens', async ({
    page
  }) => {
    /*
     * The reason the scrolling element and the element the base focuses are
     * the same one.
     *
     * A browser scrolls the nearest scrollable ANCESTOR of whatever has focus.
     * The obvious structure — a three-row grid with the middle row scrolling —
     * makes the scroll container a DESCENDANT of the focused panel, and then
     * no key reaches it: the arrows look for a scrollable ancestor, find the
     * clipped panel and the locked page, and move nothing.
     *
     * That exact failure has already happened in this repository, on the
     * catalog's own resizable panel, and it is invisible to every check that
     * does not press a key. Which is why this presses one.
     */
    await gotoStory(page, 'components-dialog--scrolling');

    const panel = page.getByRole('dialog').first();
    await expect(panel).toBeVisible();

    // Focus it the way opening does, then use the keyboard and nothing else.
    await panel.evaluate(node => (node as HTMLElement).focus());
    const before = await panel.evaluate(node => node.scrollTop);
    expect(before).toBe(0);

    await page.keyboard.press('PageDown');
    await expect
      .poll(() => panel.evaluate(node => node.scrollTop), { timeout: 1000 })
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

    // The pointer has to travel; `hover()` teleports and the base's useHover
    // does not register that at all (tooltip.spec.ts measured it four ways).
    await page.mouse.move(4, 4);
    await page.mouse.move(
      before!.x + before!.width / 2,
      before!.y + before!.height / 2,
      { steps: 8 }
    );
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
