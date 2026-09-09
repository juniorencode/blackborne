/*
 * A trail, and the three things about it that a stylesheet decides.
 *
 * 1. WHICH SEPARATORS EXIST. Every step draws one and the first one's is
 *    dropped by a rule keyed on `:first-child` — chosen over counting in
 *    JavaScript because CSS re-evaluates on its own when a consumer renders the
 *    first step conditionally. jsdom applies no stylesheet, so the count is
 *    only measurable here.
 * 2. WHICH WAY THEY POINT. This is the first directional icon the library
 *    draws, so it is the first one doc 02 §11.4's rule bites on: the glyph
 *    points down and is turned a quarter turn along the reading direction,
 *    which means the opposite quarter turn in Arabic.
 * 3. WHAT HAPPENS WHEN IT DOES NOT FIT, which is now two things. Below the
 *    medium step the middle FOLDS into a "…" that opens a menu of addresses,
 *    and a trail with no middle to fold still wraps. Both need a container
 *    with a width, so both are here; the pure decision about which steps
 *    survive is in `readCrumbs.test.ts`, where it needs no browser at all.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

type Page = import('@playwright/test').Page;

const OVERVIEW = 'components-breadcrumbs--overview';
const LENGTHS = 'components-breadcrumbs--lengths';
const DIRECTION = 'components-breadcrumbs--direction';
const STRUCTURES = 'components-breadcrumbs--structures';
const WRAPPING = 'components-breadcrumbs--wrapping';

/** The scoped panels the axis stories are built from. */
const scope = (page: Page, label: string) =>
  page.locator(`.catalog-panel:has(.catalog-label:text-is("${label}"))`);

test('every step but the first has a separator before it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const separators = page.locator('.bb-breadcrumb-separator');
  await expect(separators).toHaveCount(3);

  /*
   * Three in the DOM, two on the screen. Both halves matter: the count in the
   * markup says every step draws one, and the visibility says the rule that
   * drops the first one is in effect. A check on either alone passes on a
   * component with no separators at all.
   */
  const shown = await separators.evaluateAll(nodes =>
    nodes.map(node => getComputedStyle(node).display !== 'none')
  );
  expect(shown).toEqual([false, true, true]);
});

test('the separator points along the reading direction, both ways', async ({
  page
}) => {
  await gotoStory(page, DIRECTION);

  const rotationIn = async (label: string) =>
    scope(page, label)
      .locator('.bb-breadcrumb-separator')
      .nth(1)
      .evaluate(node => getComputedStyle(node).rotate);

  /*
   * The glyph is drawn pointing down. A quarter turn anti-clockwise points it
   * along a left-to-right line; the same turn clockwise points it along a
   * right-to-left one. Asserting both is what makes this a check rather than a
   * restatement — one of the two would pass on an icon that never turns.
   */
  expect(await rotationIn('LTR')).toBe('-90deg');
  expect(await rotationIn('RTL · العربية')).toBe('90deg');
});

test('and it is drawn, not merely positioned', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const separator = page.locator('.bb-breadcrumb-separator').nth(1);
  const box = await separator.boundingBox();
  expect(box).not.toBeNull();

  /*
   * A computed style is not paint (doc 08 §9). The glyph is a stroke inside a
   * 14px box, so the centre of the box is not on the ink — the middle of the
   * chevron's own stroke is, one third of the way along after the quarter
   * turn. Hit-tested rather than assumed, because a clipped or transparent
   * icon has a perfect box and nothing on the screen.
   */
  const painted = await page.evaluate(
    ({ x, y }) => {
      const hit = document.elementFromPoint(x, y);
      return hit?.closest('.bb-breadcrumb-separator') !== null;
    },
    { x: box!.x + box!.width / 3, y: box!.y + box!.height / 2 }
  );
  expect(painted).toBe(true);
});

test('the last step is the page you are on, and is not a stop', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const current = page.getByText('Invoices', { exact: true });
  await expect(current).toHaveAttribute('aria-current', 'page');

  // Two links, and the current step is not one of them.
  await expect(page.getByRole('link')).toHaveCount(2);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Customers' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Astilleros del Sur' })
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(current).not.toBeFocused();
});

test('a trail of one is the page you are on and nothing else', async ({
  page
}) => {
  await gotoStory(page, LENGTHS);

  const first = page.locator('.bb-breadcrumbs').first();
  await expect(first.locator('.bb-breadcrumb')).toHaveCount(1);
  await expect(first.getByRole('link')).toHaveCount(0);
  await expect(first.getByText('Customers')).toHaveAttribute(
    'aria-current',
    'page'
  );

  // And its one separator is the one that is dropped.
  const display = await first
    .locator('.bb-breadcrumb-separator')
    .evaluate(node => getComputedStyle(node).display);
  expect(display).toBe('none');
});

test('a trail too long for its container wraps instead of overflowing', async ({
  page
}) => {
  await gotoStory(page, WRAPPING);

  const trail = page.locator('.bb-breadcrumbs');
  const seen = await trail.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    lines: new Set(
      [...element.querySelectorAll('li')].map(step =>
        Math.round(step.getBoundingClientRect().y)
      )
    ).size
  }));

  expect(seen.scrollWidth).toBeLessThanOrEqual(seen.clientWidth + 1);
  // More than one row of steps, which is what wrapping means. A trail that
  // clipped or overflowed would report one.
  expect(seen.lines).toBeGreaterThan(1);
});

test('the trail is named, and the separator is not part of the name', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const list = page.locator('.bb-breadcrumbs');
  const label = await list.getAttribute('aria-label');
  expect(label).not.toBeNull();
  expect(label).not.toBe('');

  /*
   * The glyphs are `aria-hidden`, so the accessible tree holds three items and
   * not six. Asserted through the roles rather than the attribute, because the
   * attribute is what we wrote and this is what a reader gets.
   */
  await expect(list.getByRole('listitem')).toHaveCount(3);
});

/* ------------------------------------------------------------------ *
 * The collapse: the third caller of doc 04 §6's hook.
 * ------------------------------------------------------------------ */

test('the structure follows the container, not the window', async ({
  page
}) => {
  await gotoStory(page, STRUCTURES);

  /*
   * P4's question asked of the thing that answers it: three trails side by
   * side in ONE 1280px window, and two of them have folded their middle. A
   * viewport breakpoint could not produce this page at all.
   *
   * The step is read back from the list, beside the structure it produced, so
   * a failure says which half went wrong.
   */
  const structures = await page.locator('.catalog-panel').evaluateAll(nodes =>
    nodes.map(node => ({
      root: Math.round(
        node.querySelector('.bb-breadcrumbs-root')?.getBoundingClientRect()
          .width ?? -1
      ),
      step: getComputedStyle(node.querySelector('.bb-breadcrumbs') as Element)
        .getPropertyValue('--bb-step')
        .trim(),
      steps: node.querySelectorAll('.bb-breadcrumb').length,
      more: node.querySelectorAll('.bb-breadcrumbs-more').length
    }))
  );

  expect(structures).toEqual([
    { root: 320, step: 'base', steps: 3, more: 1 },
    { root: 440, step: 'narrow', steps: 3, more: 1 },
    { root: 560, step: 'medium', steps: 5, more: 0 }
  ]);
});

test('the folded trail keeps the way home and where you are', async ({
  page
}) => {
  await gotoStory(page, STRUCTURES);

  const folded = page.locator('.catalog-panel').first();

  await expect(folded.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(folded.getByText('INV-4821')).toHaveAttribute(
    'aria-current',
    'page'
  );
  // And the three in between are not in the row.
  await expect(folded.getByText('Customers')).toHaveCount(0);
});

test('the "…" opens a menu of addresses, and they are anchors', async ({
  page
}) => {
  /*
   * The console is read here, which is the guard the select wave earned: the
   * base says what it thinks of a collection in a development warning, and
   * nothing reads it by default. A folded step with no address is a row with
   * neither an action nor an address, so if the base objected to one this is
   * where it would say so.
   */
  const complaints: string[] = [];
  page.on('console', message => {
    const text = message.text();
    if (text.includes('react-aria') || text.includes('MenuItem')) {
      complaints.push(`${message.type()}: ${text}`);
    }
  });

  await gotoStory(page, STRUCTURES);

  await page.locator('.bb-breadcrumbs-more').first().click();

  const rows = page.getByRole('menuitem');
  await expect(rows).toHaveCount(3);

  /*
   * ANCHORS, and this is the check that earned `MenuItem` an `href`. A row
   * that navigated by calling a function would look and behave identically
   * until somebody middle-clicked it, and then it would do nothing at all —
   * with nothing in the console. Doc 02 §7.1, inside a menu.
   */
  const tags = await rows.evaluateAll(nodes =>
    nodes.map(node => ({
      tag: node.tagName,
      href: node.getAttribute('href')
    }))
  );
  expect(tags[0]).toEqual({ tag: 'A', href: '#customers' });
  expect(tags[1]?.tag).toBe('A');
  expect(tags[2]?.tag).toBe('A');

  expect(complaints, complaints.join(' | ')).toEqual([]);
});

test('and the keyboard reaches it, uses it, and comes back', async ({
  page
}) => {
  await gotoStory(page, STRUCTURES);

  const more = page.locator('.bb-breadcrumbs-more').first();
  await more.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('menu')).toBeVisible();

  /*
   * Opening it with a key focuses the first row already — the base's own
   * behaviour, asserted rather than assumed because the first draft of this
   * check pressed an arrow first and then looked for focus on the row it had
   * just moved off.
   */
  const rows = page.getByRole('menuitem');
  await expect(rows.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(rows.nth(1)).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(more).toBeFocused();
});

test('the current step survives the trail folding under it', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);
  await page.setViewportSize({ width: 1280, height: 900 });

  /*
   * Doc 04 §6 rule 4 asks that state survive a structural change. A trail
   * holds no selection, so what has to survive is the marking — and the risk
   * is real rather than theoretical: the base marks the LAST step of its own
   * collection, and folding changes what that collection contains.
   */
  const current = page.getByText('Invoices', { exact: true });
  await expect(current).toHaveAttribute('aria-current', 'page');

  await page.setViewportSize({ width: 360, height: 900 });
  await expect(current).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('listitem')).toHaveCount(3);
});

test('a folded step with no page is present and cannot be pressed', async ({
  page
}) => {
  await gotoStory(page, 'components-breadcrumbs--a-step-with-no-page');

  // The second panel is the folded one, and "Archived" is inside its menu.
  await page.locator('.bb-breadcrumbs-more').first().click();

  const archived = page.getByRole('menuitem', { name: 'Archived' });
  await expect(archived).toHaveAttribute('aria-disabled', 'true');
  await expect(archived).not.toHaveAttribute('href', /.*/);

  /*
   * And it looks unavailable rather than merely being unavailable: the row is
   * dimmed, which is the only channel a disabled row has. Compared against a
   * row that is a link, so the check cannot pass on a menu where everything
   * is the same colour.
   */
  const colours = await page
    .getByRole('menuitem')
    .evaluateAll(nodes => nodes.map(node => getComputedStyle(node).color));
  expect(new Set(colours).size).toBeGreaterThan(1);
});

test('in RTL the folded trail reads from the right', async ({ page }) => {
  await gotoStory(page, DIRECTION);

  const folded = scope(page, 'RTL · folded · 320px');
  const boxes = await folded
    .locator('.bb-breadcrumb')
    .evaluateAll(nodes =>
      nodes.map(node => Math.round(node.getBoundingClientRect().x))
    );

  expect(boxes).toHaveLength(3);
  // The first step written is the furthest to the right, and the "…" is in the
  // middle of the three either way.
  expect(boxes[0]).toBeGreaterThan(boxes[1] ?? 0);
  expect(boxes[1]).toBeGreaterThan(boxes[2] ?? 0);
});

test('a menu row is not underlined, though it is an anchor', async ({
  page
}) => {
  await gotoStory(page, STRUCTURES);
  await page.locator('.bb-breadcrumbs-more').first().click();

  /*
   * The package ships no reset, so an `<a href>` arrives carrying the
   * browser's own underline — and until this wave no menu row was ever an
   * anchor. The same class of trap as a form control not inheriting
   * `font-size`, and invisible to every other check here.
   */
  const decoration = await page
    .getByRole('menuitem')
    .first()
    .evaluate(node => getComputedStyle(node).textDecorationLine);
  expect(decoration).toBe('none');
});
