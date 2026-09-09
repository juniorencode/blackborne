/*
 * A section that folds, and the four things about it that only exist in a
 * browser.
 *
 * 1. A CLOSED PANEL MEASURES EXACTLY ZERO. Under `box-sizing: border-box` a
 *    declared height is floored at padding plus border, so a padded panel
 *    rests two dozen pixels tall when it is meant to be shut — a strip of
 *    nothing under every collapsed header. The padding lives on the content
 *    inside for that reason, and this is what holds it there.
 * 2. THE HEIGHT ANIMATES, and the mechanism is not ours: the base publishes
 *    `--disclosure-panel-height` on the panel and our CSS transitions it. If a
 *    future version renames that variable the declaration becomes invalid,
 *    `height` falls back to `auto`, and the section simply stops animating with
 *    nothing in the console. Only the transition itself would notice — caught
 *    on `transitionrun`, paused, and then read at exact fractions of its own
 *    duration rather than sampled frame by frame, which is doc 10 §11.
 * 3. REDUCED MOTION REMOVES IT. Doc 09 §2 is emphatic that the preference is
 *    not softened, it is removed, and nothing in this repository had ever
 *    checked that in a browser. This file is the first.
 * 4. A CLOSED PANEL IS OUT OF THE TAB ORDER while its content stays in the
 *    page. That pair is the whole trade `hidden="until-found"` makes, and half
 *    of it is doc 06 §4 rule 5 — hiding something from the reader that is
 *    still focusable.
 *
 * Not here, on purpose: the heading level, the string keys and the accessible
 * name. Those hold in jsdom and are asserted in the unit tests, where they
 * cost milliseconds.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

type Page = import('@playwright/test').Page;
type Locator = import('@playwright/test').Locator;

const OVERVIEW = 'components-accordion--overview';
const STATES = 'components-accordion--states';
const DIRECTION = 'components-accordion--direction';
const DENSITIES = 'components-accordion--densities';
const NARROW = 'components-accordion--narrow-container';
const LONG = 'components-accordion--long-text';
const FILTERS = 'components-collapsible--overview';

/** The scoped panels the axis stories are built from. */
const scope = (page: Page, label: string) =>
  page.locator(`.catalog-panel:has(.catalog-label:text-is("${label}"))`);

const heightOf = async (target: Locator): Promise<number> => {
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  return box!.height;
};

/**
 * Resolve a duration token the way the browser sees it, in milliseconds.
 *
 * Read from a FIXED probe rather than from an element inside the story. A
 * probe appended into a flex row becomes a flex item and gets shrunk, which is
 * how a token check once measured 254px for a 384px value (doc 08 §9). A
 * duration cannot be squeezed, but the habit is cheaper than the exception.
 */
const durationToken = (page: Page, name: string) =>
  page.evaluate(token => {
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.transitionDuration = `var(${token})`;
    document.body.append(probe);
    const read = getComputedStyle(probe).transitionDuration;
    probe.remove();
    return read;
  }, name);

/**
 * Wait for a panel to stop moving, using the base's own end-of-animation
 * signals rather than a sleep.
 *
 * Opening ends when the base switches `--disclosure-panel-height` to `auto`,
 * which it does once `getAnimations()` resolves — the same promise whose other
 * branch applies `hidden` on the way closed. So these two waits are the two
 * ends of the mechanism, and a renamed variable hangs here instead of handing
 * back a plausible number.
 *
 * Written after four checks in this file measured a panel mid-flight: one
 * reported **4.34px** for a section that settles at 49. The animation this
 * file exists to prove is what made its neighbours flaky, which is the same
 * shape of mistake as a probe that becomes a flex item (doc 08 §9).
 */
const atRest = async (panel: Locator, state: 'open' | 'closed') => {
  if (state === 'closed') {
    await expect(panel).toHaveAttribute('hidden', 'until-found');
    return;
  }
  await expect
    .poll(() =>
      panel.evaluate(element =>
        element.style.getPropertyValue('--disclosure-panel-height')
      )
    )
    .toBe('auto');
};

/**
 * Move focus to the first thing inside the story.
 *
 * The catalog's own decorator wraps every story in a resizable region with
 * `tabIndex={0}`, on purpose: a scroll region only a mouse can reach is a
 * WCAG 2.1.1 failure even in a catalog. So the first `Tab` of any story lands
 * on the fixture and not on the component.
 *
 * Measured rather than assumed — four presses from a fresh page give
 * catalog-resizable, the header, body, catalog-resizable — and the fixture is
 * asserted rather than skipped past, so a change to the decorator fails here
 * loudly instead of quietly eating a different stop.
 */
const tabIntoStory = async (page: Page) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('.catalog-resizable')).toBeFocused();
  await page.keyboard.press('Tab');
};

const asMs = (value: string): number =>
  value.trim().endsWith('ms')
    ? Number.parseFloat(value)
    : Number.parseFloat(value) * 1000;

test('a closed panel is exactly zero tall, and an open one is not', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const closed = page
    .locator('.bb-accordion')
    .first()
    .locator('.bb-collapsible-panel');
  const open = page
    .locator('.bb-accordion')
    .last()
    .locator('.bb-collapsible-panel')
    .first();

  // Five closed sections in the first group, and every one of them flat.
  await expect(closed).toHaveCount(5);
  for (const panel of await closed.all()) {
    expect(await heightOf(panel)).toBe(0);
  }

  /*
   * The floor that stops this passing on nothing. A check that only asserts
   * "closed is 0" is satisfied by a component that renders no panel at all,
   * and by one whose panel is 0 in both states — which is what a padded panel
   * would look like if the padding moved back onto it and the content
   * disappeared with it.
   */
  expect(await heightOf(open)).toBeGreaterThan(20);
});

/**
 * The fractions of the transition the curve is read at.
 *
 * Four points rather than two, because two endpoints are what a JUMP also
 * produces: the claim is that the height passes through the values in between,
 * and the middle two are the "in between".
 *
 * **And none of them is 1**, which is not tidiness — measured: writing
 * `currentTime = duration` on a paused transition REMOVES it. The list goes
 * from one animation to none, there is nothing left to play, and the promise
 * the base is waiting on rejects instead of resolving, so a panel seeked to
 * its own end never switches back to `auto` and never resizes with its content
 * again. The end of the curve is read from the panel at rest instead.
 */
const CURVE = [0, 0.25, 0.5, 0.75];

/**
 * How much slower than real time the animation clock runs for this one check.
 *
 * A fiftieth, which turns a 160ms transition into eight seconds of wall clock
 * without changing a single thing about the component: the transition still
 * declares the duration its token says, and the check asserts that below.
 */
const SLOW = 0.02;

test('the panel travels between the two heights instead of jumping', async ({
  page
}) => {
  /*
   * THE CLOCK IS SLOWED, AND THE COMPONENT IS NOT TOUCHED.
   *
   * This check has now been wrong twice in the same direction, which is why
   * the reasoning is here in full — doc 10 §11 is the rule it produced.
   *
   * Version one sampled the panel's height on every animation frame and
   * required more than one frame strictly between the endpoints. That asserts
   * the MACHINE's frame rate: in CI, on two workers, it saw
   * [0,0,0,0,12.59,144,144,144] — one intermediate frame for a 160ms
   * transition — and failed while the panel was animating perfectly.
   *
   * Version two caught the transition on `transitionrun` and paused it, which
   * is the right instrument and still not enough on its own: the event is
   * delivered on the main thread, so under a full parallel run it can arrive
   * after the 160ms transition has already finished and been removed.
   * Measured — it arrives 16.7ms late on an idle machine, and the full suite
   * failed it with nothing paused at all.
   *
   * So the fix is not a wider tolerance and not a longer poll: it is to stop
   * competing with the transition. `Animation.setPlaybackRate` over the
   * DevTools protocol slows the document's animation clock, so the same
   * lateness costs a fiftieth of the animation — measured: `currentTime` at
   * the event drops from 16.7ms to 0.334ms. Nothing about the component
   * changes, which is the whole point of doing it here rather than overriding
   * the duration token: the transition still reports 160ms, and that is
   * asserted rather than assumed.
   *
   * Chromium-only, like the suite. A second browser would need its own way in.
   */
  const clock = await page.context().newCDPSession(page);
  await clock.send('Animation.enable');
  await clock.send('Animation.setPlaybackRate', { playbackRate: SLOW });

  await gotoStory(page, FILTERS);

  const panel = page.locator('.bb-collapsible-panel');
  const trigger = page.locator('.bb-collapsible-trigger');

  /*
   * `transitionrun` fires when the transition is CREATED, so a listener added
   * before the click receives it whatever the frame rate does, and pausing the
   * animation inside the handler freezes it where nothing can finish it. From
   * there `currentTime` reads the curve at exact fractions of the transition
   * instead of wherever the frames happened to land.
   */
  await page.evaluate(() => {
    const target = document.querySelector('.bb-collapsible-panel');
    if (target === null) throw new Error('no panel to catch');

    target.addEventListener('transitionrun', event => {
      if ((event as TransitionEvent).propertyName !== 'height') return;
      for (const animation of target.getAnimations()) animation.pause();
    });
  });

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  /*
   * The one thing this waits for, and the failure the whole check exists to
   * catch. The height is animated by transitioning the base's own
   * `--disclosure-panel-height`; if a future version renames that variable the
   * declaration becomes invalid, `height` falls back to `auto`, and a length
   * cannot transition to `auto` — so no `height` transition is ever created,
   * nothing is paused here, and this poll is what says so. Verified by
   * renaming it: 1 becomes 0.
   */
  await expect
    .poll(() =>
      panel.evaluate(
        element =>
          element
            .getAnimations()
            .filter(animation => animation.playState === 'paused').length
      )
    )
    .toBe(1);

  const curve = await panel.evaluate((element, fractions) => {
    const animation = element.getAnimations()[0];
    if (animation === undefined) throw new Error('nothing paused');
    const duration = Number(animation.effect?.getTiming().duration ?? 0);

    return {
      duration,
      heights: fractions.map(fraction => {
        animation.currentTime = duration * fraction;
        return element.getBoundingClientRect().height;
      })
    };
  }, CURVE);

  /*
   * THE INSTRUMENT DID NOT DISTURB THE MEASUREMENT, which is the one thing a
   * slowed clock has to prove about itself: the transition still declares the
   * duration the token says, and only wall-clock time was stretched. The check
   * below this one owns the duration; this line owns the technique.
   */
  expect(curve.duration).toBe(
    asMs(await durationToken(page, '--bb-duration-normal'))
  );

  /*
   * Released at real speed from where the curve left it, so it runs out on its
   * own in a fraction of a second. That is the other half of the mechanism
   * rather than a tidy-up: the base resolves its `getAnimations()` promise,
   * switches the variable to `auto`, and the panel comes to rest.
   */
  await clock.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await panel.evaluate(element => {
    for (const animation of element.getAnimations()) animation.play();
  });
  await atRest(panel, 'open');

  const heights = curve.heights;
  const settled = await heightOf(panel);
  const shown = `${JSON.stringify(heights)} over ${curve.duration}ms, resting at ${settled}`;

  /* A real distance to travel, so "in between" means something. */
  expect(heights.at(0)).toBe(0);
  expect(settled, shown).toBeGreaterThan(20);

  /*
   * THE POINT OF THE WHOLE CHECK: every fraction is taller than the one before
   * it and none of them has arrived yet, so the height passes through the
   * values between its two ends rather than switching from one to the other. A
   * jump satisfies the two lines above and fails here on the first step.
   */
  for (const [index, height] of heights.entries()) {
    expect(height, `${CURVE[index]!} of ${shown}`).toBeLessThan(settled);
    if (index > 0)
      expect(
        height,
        `not monotonic at ${CURVE[index]!} of ${shown}`
      ).toBeGreaterThan(heights[index - 1]!);
  }

  // Halfway is genuinely halfway rather than either end, whatever the easing
  // does to it — named separately because it is the sentence in the title.
  const middle = heights[2]!;
  expect(middle, shown).toBeGreaterThan(0);
  expect(middle, shown).toBeLessThan(settled);
});

test('the transition is bounded by the duration token', async ({ page }) => {
  await gotoStory(page, FILTERS);

  const declared = asMs(await durationToken(page, '--bb-duration-normal'));
  const used = await page
    .locator('.bb-collapsible-panel')
    .evaluate(element => getComputedStyle(element).transitionDuration);

  expect(declared).toBeGreaterThan(0);
  expect(asMs(used)).toBe(declared);
});

/*
 * Doc 09 §2: "With the preference active, NOTHING animates. It is not
 * softened: it is removed." The durations collapse to 0ms at the token, one
 * rule at the foot of semantic.css, and every component inherits it by naming
 * the token instead of a number. This is the first check in the repository
 * that the inheritance actually reaches a component.
 */
test.describe('with reduced motion asked for', () => {
  /*
   * Through `contextOptions` and not as a top-level option: in Playwright
   * 1.62 `reducedMotion` is a browser-context setting, and the top-level
   * spelling type-checks nowhere. The config sets no context options of its
   * own, so nothing is being replaced here.
   */
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('the section opens with no journey at all', async ({ page }) => {
    await gotoStory(page, FILTERS);

    const panel = page.locator('.bb-collapsible-panel');
    const used = await panel.evaluate(
      element => getComputedStyle(element).transitionDuration
    );
    expect(asMs(used)).toBe(0);

    // And the chevron, which is a second transition on a second property.
    const chevron = await page
      .locator('.bb-collapsible-chevron')
      .evaluate(element => getComputedStyle(element).transitionDuration);
    expect(asMs(chevron)).toBe(0);

    await page.locator('.bb-collapsible-trigger').click();
    await atRest(panel, 'open');
    expect(await heightOf(panel)).toBeGreaterThan(20);
  });
});

test('the chevron turns over, and only when open', async ({ page }) => {
  await gotoStory(page, STATES);

  const closed = page
    .locator('.bb-accordion')
    .first()
    .locator('.bb-collapsible-chevron')
    .first();
  const open = page
    .locator('.bb-accordion')
    .last()
    .locator('.bb-collapsible-chevron')
    .first();

  const rotation = (target: Locator) =>
    target.evaluate(element => getComputedStyle(element).rotate);

  expect(await rotation(closed)).toBe('none');
  expect(await rotation(open)).toBe('180deg');
});

test('the header can be reached and worked with the keyboard alone', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const first = page.locator('.bb-collapsible-trigger').first();
  const panel = page.locator('.bb-collapsible-panel').first();

  await tabIntoStory(page);
  await expect(first).toBeFocused();

  // Doc 09 §8: Enter confirms the action of the current context, Space
  // toggles. On a header they mean the same thing, and both have to work.
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await atRest(panel, 'open');
  expect(await heightOf(panel)).toBeGreaterThan(20);

  await page.keyboard.press(' ');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await atRest(panel, 'closed');
  expect(await heightOf(panel)).toBe(0);
});

test('the ring is drawn on the header when focus arrives', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const first = page.locator('.bb-collapsible-trigger').first();
  await tabIntoStory(page);
  await expect(first).toBeFocused();

  const shadow = await first.evaluate(
    element => getComputedStyle(element).boxShadow
  );
  expect(shadow).not.toBe('none');

  /*
   * And it is not cut off. The halo spreads 4px outside the button's border
   * box, and the button sits 1px inside the section's — so a section that
   * hid its overflow would clip three quarters of the ring. Measured here
   * rather than assumed, because `overflow-hidden` on a box like this is the
   * kind of class somebody adds while tidying.
   */
  const overflow = await page
    .locator('.bb-collapsible')
    .first()
    .evaluate(element => getComputedStyle(element).overflow);
  expect(overflow).toBe('visible');
});

/*
 * The whole trade `hidden="until-found"` makes, both halves of it.
 *
 * The first version of this check asked whether the button inside was focused
 * and failed with "element(s) not found" — which turned out to be the stronger
 * result. `getByRole` reads the accessibility tree, and a panel hidden this
 * way is not in it at all: not a disabled button, no button. So the content is
 * in the page for a browser's find-in-page and gone for every other purpose,
 * which is both sides of doc 06 §4 rule 5 rather than the one that usually
 * gets checked.
 */
test('a closed section is out of the accessibility tree and out of the tab order', async ({
  page
}) => {
  await gotoStory(page, FILTERS);

  const panel = page.locator('.bb-collapsible-panel');
  const trigger = page.locator('.bb-collapsible-trigger');
  const apply = page.getByRole('button', { name: 'Apply' });

  // In the page, with its text, which is what find-in-page needs.
  await expect(page.locator('.bb-collapsible-content')).toContainText('Apply');
  await expect(panel).toHaveAttribute('hidden', 'until-found');

  // And absent from the tree a screen reader walks.
  await expect(apply).toHaveCount(0);

  // The header is the only stop the whole section has.
  await tabIntoStory(page);
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Tab');
  const escaped = await page.evaluate(
    () =>
      document
        .querySelector('.bb-collapsible-panel')
        ?.contains(document.activeElement) === false
  );
  expect(escaped).toBe(true);

  // Open it, and everything inside is reachable in one press.
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await atRest(panel, 'open');
  await expect(apply).toHaveCount(1);

  await trigger.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox')).toBeFocused();
});

test('one section at a time closes the one that was open', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const triggers = page.locator('.bb-collapsible-trigger');
  const panels = page.locator('.bb-collapsible-panel');

  await triggers.nth(0).click();
  await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'true');
  await atRest(panels.nth(0), 'open');
  expect(await heightOf(panels.nth(0))).toBeGreaterThan(20);

  await triggers.nth(1).click();
  await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'true');
  await atRest(panels.nth(0), 'closed');
  await atRest(panels.nth(1), 'open');
  expect(await heightOf(panels.nth(0))).toBe(0);
  expect(await heightOf(panels.nth(1))).toBeGreaterThan(20);
});

test('the chevron swaps edges in RTL and does not turn round', async ({
  page
}) => {
  await gotoStory(page, DIRECTION);

  const sides = async (label: string) => {
    const box = scope(page, label);
    const chevron = await box
      .locator('.bb-collapsible-chevron')
      .first()
      .boundingBox();
    const title = await box
      .locator('.bb-collapsible-trigger')
      .first()
      .locator('span')
      .first()
      .boundingBox();
    expect(chevron).not.toBeNull();
    expect(title).not.toBeNull();
    return { chevron: chevron!, title: title! };
  };

  const ltr = await sides('LTR');
  const rtl = await sides('RTL · العربية');

  expect(ltr.chevron.x).toBeGreaterThan(ltr.title.x);
  expect(rtl.chevron.x).toBeLessThan(rtl.title.x);

  /*
   * And the glyph itself is untouched. A chevron pointing down is symmetric
   * under RTL — down is down in Arabic — so anything that mirrored it would
   * be a bug that looks like thoroughness (doc 05 §4).
   */
  const open = scope(page, 'RTL · العربية')
    .locator('.bb-collapsible-chevron')
    .first();
  expect(await open.evaluate(el => getComputedStyle(el).rotate)).toBe('180deg');
  expect(await open.evaluate(el => getComputedStyle(el).scale)).toBe('none');
  expect(await open.evaluate(el => getComputedStyle(el).transform)).toBe(
    'none'
  );
});

test('the header clears the minimum target at compact density', async ({
  page
}) => {
  await gotoStory(page, DENSITIES);

  // 24px, the WCAG minimum and the floor semantic.css commits to. A header is
  // a wide row so this has plenty of room — which is why it is one assertion
  // and not a file.
  const compact = await scope(page, 'Compact')
    .locator('.bb-collapsible-trigger')
    .first()
    .boundingBox();
  expect(compact).not.toBeNull();
  expect(compact!.height).toBeGreaterThanOrEqual(24);
});

for (const [id, name] of [
  [NARROW, 'a 320px slot'],
  [LONG, 'a title far longer than the box']
] as const) {
  test(`nothing overflows sideways in ${name}`, async ({ page }) => {
    await gotoStory(page, id);

    const overflowing = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          '.bb-collapsible, .bb-collapsible *'
        )
      ]
        .filter(element => element.scrollWidth > element.clientWidth + 1)
        .map(element => ({
          className: element.className,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth
        }))
    );
    expect(overflowing).toEqual([]);

    /*
     * DELIBERATELY NOT ASSERTED: that the document does not scroll sideways.
     *
     * It does, by 10px, on every story in the catalog — measured on
     * `Badge / Narrow container` and `Button / States`, both of which predate
     * this component: 1290 against a 1280 viewport. The resizable decorator is
     * `content-box` with `width: 100%` plus padding and a border, so the
     * overflow is the fixture's own box.
     *
     * Doc 04 §7's rule — "the consumer's page never scrolls horizontally
     * because of a library component" — is about the component, and the
     * measurement above is the one that says anything about it. A document
     * assertion here would fail for a reason nothing in the library can fix,
     * which is the kind of check that gets deleted rather than fixed.
     */
  });
}

test('a long title wraps and the chevron keeps its size', async ({ page }) => {
  await gotoStory(page, LONG);

  const trigger = page.locator('.bb-collapsible-trigger').first();
  const chevron = trigger.locator('.bb-collapsible-chevron');

  const [row, mark, short] = await Promise.all([
    trigger.boundingBox(),
    chevron.boundingBox(),
    page.locator('.bb-collapsible-trigger').last().boundingBox()
  ]);
  expect(row).not.toBeNull();
  expect(mark).not.toBeNull();
  expect(short).not.toBeNull();

  // The long header is taller than the short one beside it: it wrapped rather
  // than pushing the chevron out of the box (doc 05 §5).
  expect(row!.height).toBeGreaterThan(short!.height);
  // And the mark did not stretch or shrink to make room.
  expect(mark!.width).toBeCloseTo(mark!.height, 0);
  expect(mark!.width).toBeGreaterThan(8);
});
