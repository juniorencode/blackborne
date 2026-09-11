/*
 * A link, and the four things it can do that a button dressed as one cannot.
 *
 * This is the component whose whole justification lives in a browser. Doc 02
 * §7.1 argues it from what an anchor gets for free — middle-click, ctrl-click,
 * "copy link address", the list of links a screen reader builds — and jsdom
 * has no new tab to open, so none of that can be asserted where the rest of
 * the library's behaviour is. The unit tests cover the element and the router
 * wiring; everything below needs a real browser, and once a second tab.
 *
 * ONCE, AND IT USED TO BE FOUR TIMES. Three of those asserted that Chromium
 * opens a background tab for a middle or modified press, which is a user-agent
 * convention rather than anything this component declares — and they failed
 * six times on CI without ever reproducing locally. `pressAsSeenByThePage`
 * replaced them with what the library actually owns. The one that remains is
 * `target="_blank"`, where the new browsing context is declared in the MARKUP
 * and the browser has no discretion to exercise; if that one ever fails the
 * same way, the same reasoning applies to it and the decision is written here
 * rather than left to be rediscovered.
 *
 * The fifth thing is not about anchors at all: THE TEXT MUST NOT MOVE WHEN
 * FOCUS LANDS. That is why this is the first component in the library whose
 * focus ring is an outline rather than a border and a halo, and a decision
 * like that is worth exactly as much as the check under it.
 */
import { expect, test } from '@playwright/test';
import { travelTo } from './pointer';
import { gotoStory } from './story';

/*
 * Everything here finds its links by ROLE, and that is not only style. A story
 * page contains four anchors of Storybook's own — hidden links to its docs,
 * inside the preview's error template — so a check that counted `a` elements
 * with a CSS selector would be counting those too. They are invisible, so the
 * accessibility tree does not have them, so `getByRole('link')` does not
 * either.
 */

type Page = import('@playwright/test').Page;

const OVERVIEW = 'components-link--overview';
const AGAINST_A_BUTTON = 'components-link--against-a-button';
const STATES = 'components-link--states';
const WRAPPING = 'components-link--wrapping';
const ELSEWHERE = 'components-link--elsewhere';
const ROUTER = 'components-link--with-a-router';

/**
 * Wait for a tab that has just been opened to actually be somewhere, and ASK
 * THE TAB rather than ask Playwright.
 *
 * ONE CALLER LEFT: the link that declares `target="_blank"`. The three that
 * pressed with a modifier no longer assert a tab at all — see
 * `pressAsSeenByThePage` for why, and for the measurement that settled it.
 *
 * `waitForEvent('page')` resolves when the page OBJECT exists, which is before
 * its first navigation has committed — so reading the url straight after gives
 * `about:blank`. That was measured first, and the fix for it was
 * `waitForURL`, which was not enough.
 *
 * **`page.url()` can stay at `about:blank` for good.** Measured on 2026-09-09,
 * after this timed out once in CI and twice in twelve local runs, both with
 * two workers and never with one:
 *
 * ```
 * page.url()               → about:blank    (readyState complete, nothing pending)
 * location.href inside it  → http://127.0.0.1:6007/customers/4821
 * ```
 *
 * The tab is exactly where it should be, and Playwright's bookkeeping never
 * learned it: when the navigation commits before the new target is attached,
 * no `framenavigated` arrives for it and `waitForURL` has nothing left to
 * match. So the failure is permanent rather than slow, which is why a longer
 * timeout would only have made the suite slower and still red.
 *
 * `waitForFunction` runs inside the document, is re-evaluated across the
 * navigation that destroys its execution context, and answers the question
 * this check is actually about: where did the browser take this tab.
 */
const openedAt = async (
  opened: import('@playwright/test').Page,
  expected: RegExp
) => {
  try {
    await opened.waitForFunction(
      pattern => new RegExp(pattern).test(window.location.href),
      expected.source,
      { timeout: 10_000 }
    );
  } catch (cause) {
    /*
     * Say what was there, and say it INSIDE the test's own budget: a
     * diagnostic that runs after the timeout finds a closed page and reports
     * nothing, which this repository has now paid for four times.
     */
    const inside = await opened
      .evaluate(() => window.location.href)
      .catch(() => 'unreachable');
    throw new Error(
      `the opened tab never reached ${expected}. page.url() says ` +
        `${opened.url()}; location.href inside it says ${inside}`,
      { cause }
    );
  }
  return opened.evaluate(() => window.location.href);
};

/**
 * Do something that opens a tab, and find the tab by asking the CONTEXT what
 * it holds rather than by waiting for an event.
 *
 * **This is the third instrument these four checks have had, and the second
 * failure was a different one from the first.** All of it measured, all of it
 * with two workers and never with one:
 *
 * 1. `waitForEvent('page')` then `page.url()` — read the address before the
 *    navigation committed, so it was `about:blank`.
 * 2. `waitForURL` — never resolved at all, because when the navigation
 *    commits before Playwright attaches to the new target no navigation event
 *    arrives for it. Fixed by asking the document (`openedAt`, below).
 * 3. And then `waitForEvent('page')` ITSELF timed out on CI, 2026-09-10: no
 *    page event within thirty seconds for a ctrl-click, on a run of 348
 *    checks. The middle click in the same file passed, and eighteen local runs
 *    with four workers reproduced nothing.
 * 4. And THIS instrument — polling the state — failed on CI the same day, on
 *    the middle click, 437 of 438 passing. That one had a cause in the check
 *    rather than in the instrument: it was the only one of the four clicking a
 *    coordinate read earlier instead of the element, so a reflow between the
 *    two reads left the click on the page background. Fixed at the call site;
 *    the note is on the test.
 *
 * One thing is under all three: **an event is a moment, and Playwright's
 * bookkeeping for a new target is racing the browser.** So this asks for a
 * STATE — `context.pages()` is what the context holds, and a tab that exists
 * is in it whether or not an event was observed at the right instant. Doc 10
 * §11 is the rule, and it is the same move that fixed the accordion's frame
 * counting, the chevron's rotation and a segment read mid-transition.
 *
 * A longer timeout was never the answer and is not the answer now: case 2 was
 * permanent rather than slow, and a check that needs thirty seconds of a
 * loaded runner to be right is a check nobody trusts by its tenth failure.
 *
 * And because none of the four has ever reproduced locally, this says what it
 * FOUND when the tab does not arrive — doc 10 §11.3, which is the rule that
 * "a flake you cannot reproduce gets instrumentation rather than a guess". A
 * count of one where two was expected names the symptom; the three outcomes it
 * could be need different fixes, and the message below separates them.
 */
type SeenClick = {
  target: string;
  ctrlKey: boolean;
  metaKey: boolean;
  defaultPrevented: boolean;
};

const tabOpenedBy = async (
  page: Page,
  act: () => Promise<void>
): Promise<import('@playwright/test').Page> => {
  const context = page.context();
  const before = context.pages().length;

  /*
   * WHAT THE PAGE ITSELF SAW, recorded before the act and reported only if no
   * tab arrives. Doc 10 §11.3 on the FIFTH failure of these four checks: each
   * round added an instrument, the next failure moved one step, and the step
   * this one reached was "the browser opened nothing" — a sentence that still
   * covers four different faults.
   *
   * CAPTURE PHASE, AND THAT IS MEASURED RATHER THAN CHOSEN. The first version
   * listened in the bubble phase at the document and recorded NOTHING on a
   * ctrl-click that demonstrably opened a tab: something stops propagation
   * before the event gets there. An instrument that reports an empty list for
   * the healthy case cannot tell you anything about the broken one (§11.1), so
   * it listens where the event provably arrives — window and document capture
   * both see it.
   *
   * And `defaultPrevented` is read LATE, because at capture time it is always
   * false: the handlers that would call it have not run yet. Verified with a
   * positive control on this same link — an ordinary click, where the base DOES
   * prevent the default and call the router, reads `false` at capture and
   * `true` afterwards; the ctrl-click reads `false` both times.
   *
   * Four outcomes, four different fixes:
   *   - no click at all        · the press never reached the element
   *   - ctrlKey false          · the modifier did not reach the page
   *   - defaultPrevented true  · something cancelled the browser's own job
   *   - all correct, no tab    · Chromium declined, which is Chromium's
   */
  await page.evaluate(() => {
    const seen: SeenClick[] = [];
    (window as unknown as { clicksSeen: SeenClick[] }).clicksSeen = seen;
    document.addEventListener(
      'click',
      event => {
        const target = event.target;
        const entry: SeenClick = {
          target:
            target instanceof Element
              ? `${target.tagName}${target instanceof HTMLAnchorElement ? `[href=${target.getAttribute('href') ?? ''}]` : ''}`
              : String(target),
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          defaultPrevented: false
        };
        seen.push(entry);
        setTimeout(() => {
          entry.defaultPrevented = event.defaultPrevented;
        }, 0);
      },
      true
    );
  });

  await act();

  try {
    await expect
      .poll(() => context.pages().length, { timeout: 15_000 })
      .toBe(before + 1);
  } catch (cause) {
    /*
     * AND SAY WHAT THE CONTEXT ACTUALLY HELD, which is doc 10 §11.3 arriving
     * on the fourth failure of these four checks: `Expected: 2, Received: 1`
     * names the symptom and nothing else, and this has never reproduced
     * locally — eighteen runs at four workers, twice at two.
     *
     * Three outcomes are possible when no tab appears and they need different
     * fixes, so the message separates them. The source page still on its
     * story with one page in the context means the browser opened nothing.
     * The source page somewhere ELSE means the click was taken as an ordinary
     * navigation rather than as a middle click. And a page whose `url()` is
     * blank while its own `location.href` is not is Playwright's bookkeeping
     * losing a target, which is the failure `openedAt` was written for and
     * would mean it happens one step earlier than we thought.
     */
    const held = await Promise.all(
      context.pages().map(async one => {
        const inside = await one
          .evaluate(() => window.location.href)
          .catch(() => 'unreachable');
        return `page.url()=${one.url()} location.href=${inside}`;
      })
    );

    const clicks = await page
      .evaluate(
        () =>
          (window as unknown as { clicksSeen?: SeenClick[] }).clicksSeen ?? []
      )
      .catch(() => 'unreadable' as const);

    throw new Error(
      `no tab appeared: the context holds ${String(context.pages().length)} ` +
        `page(s) where ${String(before + 1)} was expected — ${held.join(' | ')}` +
        ` — and the page saw ${JSON.stringify(clicks)}`,
      { cause }
    );
  }

  const opened = context.pages().at(-1);
  expect(
    opened,
    'the context gained a page but it cannot be read'
  ).toBeDefined();
  return opened!;
};

type Seen = {
  type: string;
  button: number;
  tag: string;
  href: string | null;
  ctrlKey: boolean;
  metaKey: boolean;
  defaultPrevented: boolean;
  settled: boolean;
};

/**
 * WHAT THE PAGE SAW OF A PRESS — which is the half of "a new tab opens" that
 * this library actually owns.
 *
 * The three checks below used to assert that a second page appeared in the
 * context. That assertion failed SIX times on CI and never once locally —
 * each failure adding an instrument, which is what the comments above record
 * as the fourth and the fifth — and on 2026-09-11 the sixth was attributed. The page had seen
 * `A[href=/customers/4821]`, `ctrlKey: true`, `defaultPrevented: false`, and
 * the source page had not moved: **every fault it could have been on our side
 * was ruled out, and Chromium simply did not open a tab.**
 *
 * That is doc 10 §11. Whether a user agent honours a modifier by opening a
 * background tab is the user agent's convention, not a property of this
 * component — it is not declared in the markup, the test sets nothing that
 * controls it, and it cannot be read back. Asserting it is asserting the
 * machine, and the only honest move once that is known is to stop.
 *
 * What replaces it is not weaker, it is NARROWER, and it covers every failure
 * that would be ours:
 *
 *   - the press landed on an anchor carrying the right address
 *   - the modifier reached the DOM
 *   - `defaultPrevented` is false, so nothing of ours cancelled the browser's
 *     own job — this is the one that would catch `handleLinkClick` deciding to
 *     client-navigate a modified press
 *   - the document did not move, so it was not taken as an ordinary press
 *
 * A regression in any of those still fails. What no longer fails is Chromium
 * having its own opinion.
 *
 * TWO EVENT TYPES, and that is measured rather than assumed: a middle button
 * fires `auxclick` and not `click`, so a recorder listening for `click` alone
 * reports an empty list for a perfectly healthy middle press — an instrument
 * that cannot see the good case cannot speak about the bad one (§11.1).
 *
 * CAPTURE PHASE, for the same reason it was before: a bubble-phase listener at
 * the document recorded NOTHING on a ctrl-click that demonstrably opened a
 * tab, because something stops propagation first.
 *
 * And `defaultPrevented` is read LATE, on a macrotask, because at capture time
 * it is always false — the handlers that would call it have not run yet.
 * Verified with a positive control on this same link: an ordinary press, where
 * the base DOES prevent the default and call the router, reads false at
 * capture and true afterwards, while the ctrl-click reads false both times.
 * `settled` is what says the late read has happened, and it is polled as a
 * STATE rather than waited for as a duration (§11.2).
 */
const pressAsSeenByThePage = async (
  page: Page,
  act: () => Promise<void>
): Promise<Seen[]> => {
  await page.evaluate(() => {
    const seen: Seen[] = [];
    (window as unknown as { pressesSeen: Seen[] }).pressesSeen = seen;
    for (const type of ['click', 'auxclick']) {
      document.addEventListener(
        type,
        event => {
          const mouse = event as MouseEvent;
          const target = mouse.target;
          const anchor = target instanceof Element ? target.closest('a') : null;
          const entry: Seen = {
            type: mouse.type,
            button: mouse.button,
            tag: target instanceof Element ? target.tagName : String(target),
            href: anchor?.getAttribute('href') ?? null,
            ctrlKey: mouse.ctrlKey,
            metaKey: mouse.metaKey,
            defaultPrevented: false,
            settled: false
          };
          seen.push(entry);
          setTimeout(() => {
            entry.defaultPrevented = mouse.defaultPrevented;
            entry.settled = true;
          }, 0);
        },
        true
      );
    }
  });

  await act();

  /* A positive assertion, so the poll spends its budget waiting for the press
     to arrive rather than being satisfied by its own first read (§11.1.1). */
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            (window as unknown as { pressesSeen?: Seen[] }).pressesSeen ?? []
          ).filter(one => one.settled).length
      )
    )
    .toBeGreaterThan(0);

  return page.evaluate(
    () => (window as unknown as { pressesSeen?: Seen[] }).pressesSeen ?? []
  );
};

test('it is an anchor, with an address the browser has resolved', async ({
  page
}) => {
  await gotoStory(page, AGAINST_A_BUTTON);

  const link = page.getByRole('link', { name: 'Astilleros del Sur' });
  const seen = await link.evaluate(element => ({
    tag: element.tagName,
    attribute: element.getAttribute('href'),
    resolved: (element as HTMLAnchorElement).href,
    origin: (element as HTMLAnchorElement).origin
  }));

  expect(seen.tag).toBe('A');
  expect(seen.attribute).toBe('/customers/4821');
  // The resolved property is what a browser offers to copy, and what it hands
  // to a new tab. A button has none of it.
  expect(seen.resolved).toContain('/customers/4821');
  expect(seen.origin).toBe(new URL(page.url()).origin);
});

test('a middle press reaches the anchor and nothing cancels it', async ({
  page
}) => {
  await gotoStory(page, AGAINST_A_BUTTON);

  /*
   * THE ELEMENT, NOT A REMEMBERED POINT, and this check was the only one of
   * the four that did it the other way — which is also the one that failed on
   * CI (2026-09-10, two workers, 437 of 438 passing).
   *
   * It used to read `boundingBox()` and then `page.mouse.click` at that
   * coordinate. Between the two reads anything that reflows moves the link out
   * from under the point, and a middle click on the page background opens
   * nothing at all: no error, no tab, and fifteen seconds of polling for
   * something that was never going to arrive. The coordinate is a value the
   * check remembered rather than a state it asserted, which is doc 10 §11's
   * rule one layer down from where that section usually applies.
   *
   * `locator.click` re-resolves the element and waits for it to be visible,
   * stable and receiving pointer events — AT CLICK TIME — and it takes
   * `button: 'middle'` like any other. The ctrl-click below it and the
   * `target` check have always done this.
   *
   * There is no hover to arrange here, which is the one reason this file
   * reaches for `page.mouse` elsewhere: `travelTo` moves the pointer in steps
   * because the base's `useHover` does not register a teleport.
   */
  const seen = await pressAsSeenByThePage(page, () =>
    page
      .getByRole('link', { name: 'Astilleros del Sur' })
      .click({ button: 'middle' })
  );

  expect(
    seen,
    'exactly one press should have reached the document'
  ).toHaveLength(1);
  expect(seen[0]?.type).toBe('auxclick');
  expect(seen[0]?.button).toBe(1);
  expect(seen[0]?.href).toBe('/customers/4821');
  expect(
    seen[0]?.defaultPrevented,
    'the browser was going to open a tab and something of ours cancelled it'
  ).toBe(false);

  /*
   * And the page it came from stayed where it was, which is the other half of
   * what a middle press means. Asserted as the story it is still showing
   * rather than as the address it does not have: `page.url()` is the value
   * measured to go stale above, and "does not contain" is satisfied by a stale
   * `about:blank` as happily as by the truth.
   */
  expect(await page.evaluate(() => window.location.href)).toContain(
    'id=components-link--against-a-button'
  );
});

test('a ctrl-press reaches the anchor and nothing cancels it', async ({
  page
}) => {
  await gotoStory(page, AGAINST_A_BUTTON);

  const link = page.getByRole('link', { name: 'Astilleros del Sur' });
  const seen = await pressAsSeenByThePage(page, () =>
    link.click({ modifiers: ['ControlOrMeta'] })
  );

  expect(seen).toHaveLength(1);
  expect(seen[0]?.href).toBe('/customers/4821');
  expect(
    seen[0]?.ctrlKey || seen[0]?.metaKey,
    'the modifier never reached the page, so nothing below means anything'
  ).toBe(true);
  expect(
    seen[0]?.defaultPrevented,
    'the browser was going to open a tab and something of ours cancelled it'
  ).toBe(false);

  expect(await page.evaluate(() => window.location.href)).toContain(
    'id=components-link--against-a-button'
  );
});

test('a target of its own opens another tab', async ({ page }) => {
  await gotoStory(page, ELSEWHERE);

  const opened = await tabOpenedBy(page, () =>
    page.getByRole('link', { name: 'Open in another tab' }).click()
  );

  expect(await openedAt(opened, /#a-tab/)).toContain('#a-tab');
  await opened.close();
});

test('with no router, a press is the browser following the link', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  await page.getByRole('link').click();

  await expect.poll(() => new URL(page.url()).hash).toBe('#the-terms');
});

/*
 * Decision 0016's second half, in a browser rather than in jsdom: the point is
 * that the document does NOT move, which is the thing a single-page
 * application needs and the thing an anchor does not do on its own.
 */
test('with a router, a press is handed over and the page stays', async ({
  page
}) => {
  await gotoStory(page, ROUTER);

  const before = page.url();
  await page.getByRole('link', { name: 'Astilleros del Sur' }).click();

  await expect(page.getByText('The router was asked for')).toContainText(
    '/customers/4821'
  );
  expect(page.url()).toBe(before);
});

/*
 * And the half a consumer would otherwise have to write themselves. The base
 * checks the modifiers before handing a press over, so a router that only
 * pushes onto a history stack is complete — and a person who asked for a new
 * tab still gets one.
 */
test('and a ctrl-press is not handed to the router', async ({ page }) => {
  await gotoStory(page, ROUTER);

  const link = page.getByRole('link', { name: 'Astilleros del Sur' });
  const seen = await pressAsSeenByThePage(page, () =>
    link.click({ modifiers: ['ControlOrMeta'] })
  );

  expect(seen).toHaveLength(1);
  expect(seen[0]?.href).toBe('/customers/4821');
  expect(seen[0]?.ctrlKey || seen[0]?.metaKey).toBe(true);

  /*
   * THE ASSERTION THIS CHECK EXISTS FOR, and the one the missing tab was only
   * ever a proxy for. With a router installed, an ordinary press is handed
   * over and the document stays; a MODIFIED press must not be, or the person
   * who asked their browser for a new tab gets a client-side navigation in the
   * one they were already looking at. Both halves are ours and both are read
   * here: nothing cancelled the default, and the router was never called.
   */
  expect(
    seen[0]?.defaultPrevented,
    'a modified press was handed to the router, so the browser never got it'
  ).toBe(false);
  await expect(page.getByText('The router has not been asked')).toBeVisible();
});

/*
 * THE CHECK THE OUTLINE EXISTS FOR.
 *
 * The library's ring everywhere else is a border in the ring colour plus a
 * halo. A border on a run of text widens its inline box, so every word after
 * it shifts sideways when focus lands — twice per tab, in a paragraph. An
 * outline paints outside the box and takes no part in layout.
 *
 * Measured on the text that follows the link, because that is where the shift
 * would show, and to the tenth of a pixel: a 2px border would move it 2px, and
 * a check with a tolerance of 2 would have missed exactly the thing it was
 * written for.
 */
test('focus draws a ring and moves nothing', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const after = page.getByText('which the customer accepted');
  const box = await after.boundingBox();
  expect(box).not.toBeNull();

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const link = page.getByRole('link');
  await expect(link).toBeFocused();

  const moved = await after.boundingBox();
  expect(moved).not.toBeNull();
  expect(moved!.x).toBeCloseTo(box!.x, 1);
  expect(moved!.y).toBeCloseTo(box!.y, 1);

  const ring = await link.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      width: style.outlineWidth,
      style: style.outlineStyle,
      color: style.outlineColor,
      offset: style.outlineOffset,
      shadow: style.boxShadow,
      token: getComputedStyle(document.documentElement)
        .getPropertyValue('--bb-focus-ring')
        .trim()
    };
  });

  expect(ring.width).toBe('2px');
  expect(ring.style).toBe('solid');
  expect(ring.offset).toBe('2px');
  // The library's one ring colour, resolved — not a colour of this component's
  // own choosing.
  expect(ring.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(ring.shadow).toBe('none');
  expect(ring.token).not.toBe('');
});

test('it is underlined before anything is pointed at it', async ({ page }) => {
  await gotoStory(page, STATES);

  const rest = page.getByRole('link').first();
  const decoration = await rest.evaluate(element => ({
    line: getComputedStyle(element).textDecorationLine,
    thickness: getComputedStyle(element).textDecorationThickness
  }));

  // Doc 06 §3: a link inside a paragraph has nothing but colour to
  // distinguish it, and colour is never the only channel.
  expect(decoration.line).toBe('underline');
  expect(decoration.thickness).toBe('1px');
});

test('the rule thickens and the colour deepens under the pointer', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const link = page.getByRole('link');
  const ink = () =>
    link.evaluate(element => ({
      thickness: getComputedStyle(element).textDecorationThickness,
      colour: getComputedStyle(element).color
    }));

  const before = await ink();
  const linked = page.getByRole('link', {
    name: 'the terms of the agreement'
  });
  await travelTo(page, linked);
  await expect(link).toHaveAttribute('data-hovered', 'true');
  const after = await ink();

  expect(before.thickness).toBe('1px');
  expect(after.thickness).toBe('2px');
  /*
   * Both channels move, which is doc 06 §3 applied to a state rather than to a
   * meaning. Measured, the colours are `#3e63dd` and `#3a5bc7` — a real step
   * and a small one, which is the argument for the thickness carrying it too.
   */
  expect(after.colour).not.toBe(before.colour);
});

/*
 * The two that must not look alike, measured against each other rather than
 * against a remembered value. `Button variant="link"` takes the ordinary text
 * colour at rest on purpose — its own file says "so it does not compete with a
 * real link" — and a change to either that made them agree would be a change
 * nobody could see in a screenshot of one of them.
 */
test('a link does not look like a button dressed as one', async ({ page }) => {
  await gotoStory(page, AGAINST_A_BUTTON);

  const link = page.getByRole('link', { name: 'Astilleros del Sur' });
  const button = page.getByRole('button', { name: 'Add another line' });

  const ink = async (target: typeof link) =>
    target.evaluate(element => ({
      color: getComputedStyle(element).color,
      decoration: getComputedStyle(element).textDecorationLine
    }));

  const a = await ink(link);
  const b = await ink(button);

  expect(a.decoration).toBe('underline');
  expect(b.decoration).toBe('none');
  expect(a.color).not.toBe(b.color);
});

test('a link that wraps stays one link across both lines', async ({ page }) => {
  await gotoStory(page, WRAPPING);

  const seen = await page.getByRole('link').evaluate(element => ({
    fragments: element.getClientRects().length,
    outline: getComputedStyle(element).outlineWidth
  }));

  // More than one fragment is the case the outline was chosen for: it follows
  // each of them, where a border would have been drawn round the union.
  expect(seen.fragments).toBeGreaterThan(1);
  expect(seen.outline).toBe('2px');
});

test('the keyboard follows a link', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link')).toBeFocused();

  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe('#the-terms');
});
