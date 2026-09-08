/*
 * A link, and the four things it can do that a button dressed as one cannot.
 *
 * This is the component whose whole justification lives in a browser. Doc 02
 * §7.1 argues it from what an anchor gets for free — middle-click, ctrl-click,
 * "copy link address", the list of links a screen reader builds — and jsdom
 * has no new tab to open, so none of that can be asserted where the rest of
 * the library's behaviour is. The unit tests cover the element and the router
 * wiring; everything below needs a real browser and, twice, a second tab.
 *
 * The fifth thing is not about anchors at all: THE TEXT MUST NOT MOVE WHEN
 * FOCUS LANDS. That is why this is the first component in the library whose
 * focus ring is an outline rather than a border and a halo, and a decision
 * like that is worth exactly as much as the check under it.
 */
import { expect, test } from '@playwright/test';
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
 * Move the pointer onto something, as movement rather than a teleport.
 *
 * `locator.hover()` teleports and the base's `useHover` does not register that
 * at all — measured four ways while building `Tooltip`, and copied here rather
 * than shared because a spec is a document.
 */
/**
 * Wait for a tab that has just been opened to actually be somewhere.
 *
 * `waitForEvent('page')` resolves when the page OBJECT exists, which is before
 * its first navigation has committed — so reading the url straight after gives
 * `about:blank`. Measured the hard way: the three new-tab checks passed on
 * their own and failed inside the full suite, which is a check measuring a
 * moment instead of a state.
 */
const openedAt = async (
  opened: import('@playwright/test').Page,
  expected: RegExp
) => {
  await opened.waitForURL(expected);
  return opened.url();
};

const travelTo = async (page: Page, name: string) => {
  const box = await page.getByRole('link', { name }).boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(4, 4);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2, {
    steps: 8
  });
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

test('a middle click opens another tab', async ({ page }) => {
  await gotoStory(page, AGAINST_A_BUTTON);

  const box = await page
    .getByRole('link', { name: 'Astilleros del Sur' })
    .boundingBox();
  expect(box).not.toBeNull();

  const [opened] = await Promise.all([
    page.context().waitForEvent('page'),
    page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, {
      button: 'middle'
    })
  ]);

  expect(await openedAt(opened, /\/customers\/4821/)).toContain(
    '/customers/4821'
  );
  // And the page it came from stayed where it was, which is the other half of
  // what a middle click means.
  expect(page.url()).not.toContain('/customers/4821');
  await opened.close();
});

test('a ctrl-click opens another tab', async ({ page }) => {
  await gotoStory(page, AGAINST_A_BUTTON);

  const link = page.getByRole('link', { name: 'Astilleros del Sur' });
  const [opened] = await Promise.all([
    page.context().waitForEvent('page'),
    link.click({ modifiers: ['ControlOrMeta'] })
  ]);

  expect(await openedAt(opened, /\/customers\/4821/)).toContain(
    '/customers/4821'
  );
  expect(page.url()).not.toContain('/customers/4821');
  await opened.close();
});

test('a target of its own opens another tab', async ({ page }) => {
  await gotoStory(page, ELSEWHERE);

  const [opened] = await Promise.all([
    page.context().waitForEvent('page'),
    page.getByRole('link', { name: 'Open in another tab' }).click()
  ]);

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
test('and a ctrl-click still opens a tab, router or no router', async ({
  page
}) => {
  await gotoStory(page, ROUTER);

  const link = page.getByRole('link', { name: 'Astilleros del Sur' });
  const [opened] = await Promise.all([
    page.context().waitForEvent('page'),
    link.click({ modifiers: ['ControlOrMeta'] })
  ]);

  expect(await openedAt(opened, /\/customers\/4821/)).toContain(
    '/customers/4821'
  );
  // The router was not asked, because the person did not ask the application.
  await expect(page.getByText('The router has not been asked')).toBeVisible();
  await opened.close();
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
  await travelTo(page, 'the terms of the agreement');
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
