/*
 * The first component in the library whose STRUCTURE depends on its width, and
 * the first check of doc 04's level N3 — which until now had never run.
 *
 * Nothing here exists in jsdom: it implements neither container queries nor
 * `ResizeObserver`, so the hook that decides the shape answers `base` there
 * and the unit tests see the floor. That is not a hole, and it is worth saying
 * why: **the floor is exactly what the first paint renders.** A
 * `ResizeObserver` reports after layout, so the jsdom tests and the first
 * frame of a real browser are the same picture, and doc 04 §6.1's "start
 * narrow, widen once measured" is asserted in the cheapest place it can be.
 *
 * What can only be asserted here is everything after that first frame.
 */
import { expect, test, type Page as Browser } from '@playwright/test';
import { gotoStory } from './story';

type Page = import('@playwright/test').Page;

const OVERVIEW = 'components-pagination--overview';
const STEPS = 'components-pagination--steps';
const POSITIONS = 'components-pagination--positions';
const DIRECTION = 'components-pagination--direction';
const MANY = 'components-pagination--many-pages';
const CURSOR_TOGETHER = 'components-cursorpagination--together';

/** The scoped panels the fixed-width stories are built from. */
const scope = (page: Page, label: string) =>
  page.locator(`.catalog-panel:has(.catalog-label:text-is("${label}"))`);

/** The numbers on screen, as text, in order. */
const numbersIn = async (root: ReturnType<Page['locator']>) =>
  root.locator('.bb-pagination-list li:not([aria-hidden])').allInnerTexts();

/*
 * THE CHECK THIS WHOLE LEVEL EXISTS FOR.
 *
 * Three of the same component, three widths, one window — so the answer cannot
 * have come from the viewport. P4 in one assertion: "does it work in a 320px
 * side panel inside a 1920px screen", asked of the thing that decides.
 */
test('the row is decided by its container and not by the window', async ({
  page
}) => {
  await gotoStory(page, STEPS);

  const floor = await numbersIn(scope(page, '320px · the floor'));
  const narrow = await numbersIn(scope(page, '440px · narrow, five numbers'));
  const medium = await numbersIn(scope(page, '560px · medium, seven numbers'));

  // The two ends are always there; everything else is the row of numbers.
  expect(floor).toHaveLength(2);
  expect(narrow).toHaveLength(2 + 5);
  expect(medium).toHaveLength(2 + 7);

  // And the widths that produced them are all inside one 1280px viewport.
  const width = await page.evaluate(() => window.innerWidth);
  expect(width).toBeGreaterThan(560);
});

test('the numbers arrive and go as the container is resized, with no reload', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const list = page.locator('.bb-pagination-list');
  const pages = list.locator('li:not([aria-hidden])');
  const frame = page.locator('.catalog-resizable');

  // Wide to start with: the catalog's frame is the full viewport.
  await expect(pages).toHaveCount(2 + 7);

  await frame.evaluate(element => {
    (element as HTMLElement).style.width = '320px';
  });
  await expect(pages).toHaveCount(2);

  await frame.evaluate(element => {
    (element as HTMLElement).style.width = '440px';
  });
  await expect(pages).toHaveCount(2 + 5);

  /*
   * And back, because a structural change has to survive going the other way.
   * Doc 04 §6 rule 4 asks that state survive the change; the state here is the
   * page, and it is the consumer's — so what is asserted is that the row
   * returns to what it was rather than to something new.
   */
  await frame.evaluate(element => {
    (element as HTMLElement).style.width = '100%';
  });
  await expect(pages).toHaveCount(2 + 7);
});

test('the page you are on is marked, and is not a stop', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const current = page.locator('[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText('1');

  /*
   * Not a button, which is the decision `Breadcrumbs` made about its last
   * step: the page you are on is not somewhere to go. Measured through the
   * accessibility tree rather than the tag, because that is what decides
   * whether `Tab` stops there.
   */
  const role = await current.evaluate(element => element.tagName);
  expect(role).toBe('SPAN');

  const buttons = await page.getByRole('button').count();
  const numbers = await page
    .locator('.bb-pagination-list li:not([aria-hidden])')
    .count();
  // Every item is a button except the current page.
  expect(buttons).toBe(numbers - 1);
});

test('pressing a number moves the row, and the ends stop at the ends', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const previous = page.getByRole('button', { name: 'Previous page' });
  const next = page.getByRole('button', { name: 'Next page' });

  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await page.getByRole('button', { name: 'Page 3' }).click();
  await expect(page.locator('[aria-current="page"]')).toHaveText('3');
  await expect(previous).toBeEnabled();

  // To the last page, where the other end gives out.
  await page.getByRole('button', { name: 'Page 12' }).click();
  await expect(page.locator('[aria-current="page"]')).toHaveText('12');
  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();
});

test('a gap is not something a reader is told about', async ({ page }) => {
  await gotoStory(page, POSITIONS);

  const row = scope(page, 'page 6 of 12');
  // Seven numbers, two gaps, two ends on screen…
  await expect(row.locator('.bb-pagination-list > li')).toHaveCount(11);
  // …and nine things in the tree, because the gaps are not in it.
  await expect(row.getByRole('listitem')).toHaveCount(9);
});

/*
 * Two rules meeting, and neither is visible in a unit test: the chevrons are
 * directional icons the library draws itself (doc 02 §11.4), and a page number
 * is a number formatted for the locale (doc 05 §3).
 */
test('in Arabic the chevrons turn round and the digits change', async ({
  page
}) => {
  await gotoStory(page, DIRECTION);

  const rotationIn = async (label: string, name: 'Previous' | 'Next') =>
    scope(page, label)
      .locator(
        `.bb-pagination-list li:${name === 'Previous' ? 'first' : 'last'}-child svg`
      )
      .evaluate(node => getComputedStyle(node).rotate);

  expect(await rotationIn('LTR · en-GB', 'Previous')).toBe('90deg');
  expect(await rotationIn('RTL · ar-EG', 'Previous')).toBe('-90deg');
  expect(await rotationIn('LTR · en-GB', 'Next')).toBe('-90deg');
  expect(await rotationIn('RTL · ar-EG', 'Next')).toBe('90deg');

  /*
   * `ar-EG` numbers with Arabic-Indic digits, so the current page reads ٦ and
   * not 6. A row of Latin digits here is the tell that a number was
   * concatenated into a string rather than formatted.
   */
  const arabic = await scope(page, 'RTL · ar-EG')
    .locator('[aria-current="page"]')
    .innerText();
  expect(arabic).toBe('٦');
  expect(arabic).not.toBe('6');

  const latin = await scope(page, 'LTR · en-GB')
    .locator('[aria-current="page"]')
    .innerText();
  expect(latin).toBe('6');
});

/*
 * Doc 03 §4.2. A proportional 1 is narrower than a proportional 8, so a row
 * whose numbers change would change width as somebody paged through it — and
 * the thing that moves is the button under their cursor (doc 09 §7).
 */
test('the row is the same width whatever the digits are', async ({ page }) => {
  await gotoStory(page, MANY);

  const widthOf = async (label: string) => {
    const box = await scope(page, label)
      .locator('.bb-pagination')
      .boundingBox();
    expect(box).not.toBeNull();
    return box!.width;
  };

  const wide = await widthOf('page 501 of 999');
  const narrow = await widthOf('page 112 of 999');
  expect(wide).toBeCloseTo(narrow, 1);

  // And the figures really are tabular, not merely equal by luck of the glyphs.
  const variant = await page
    .locator('.bb-pagination')
    .first()
    .evaluate(element => getComputedStyle(element).fontVariantNumeric);
  expect(variant).toContain('tabular-nums');
});

test('nothing overflows sideways at the floor', async ({ page }) => {
  await gotoStory(page, STEPS);

  const overflowing = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '.bb-pagination, .bb-pagination *'
      )
    ]
      .filter(element => element.scrollWidth > element.clientWidth + 1)
      .map(element => element.className)
  );
  expect(overflowing).toEqual([]);
});

test('a cursor pager turns its chevrons round too', async ({ page }) => {
  await gotoStory(page, CURSOR_TOGETHER);

  const rotationIn = async (label: string) =>
    scope(page, label)
      .locator('.bb-cursor-pagination svg')
      .first()
      .evaluate(node => getComputedStyle(node).rotate);

  expect(await rotationIn('Light')).toBe('90deg');
  expect(await rotationIn('RTL · العربية')).toBe('-90deg');
});

/* ──────────── the rule, driven through the pieces that compose it ────────── */

/*
 * WHAT ONLY A BROWSER ANSWERS HERE. `usePaging`'s own tests render nothing and
 * assert the arithmetic; what they cannot say is that the three values it
 * returns ARE what `Pagination` wants, that a real press walks the pages, and
 * that the rule holds when a person performs it rather than when a test calls
 * it.
 *
 * This is also the wave's deliverable. The catalog planned a thin assembly and
 * set its own test — P6's corollary, applied literally: can it be rebuilt from
 * the public pieces, losing nothing? The story this drives is that rebuild, so
 * the check is what keeps it honest.
 */

const PAGED = 'components-table--paged';

const nextPage = (page: Browser) =>
  page
    .getByRole('list', { name: /Pagination/i })
    .getByRole('button')
    .last()
    .click();

test('a bigger page still holds the row a person was looking at', async ({
  page
}) => {
  await gotoStory(page, PAGED);

  const keys = () =>
    page
      .locator('.bb-table-scroller tbody tr')
      .evaluateAll(rows => rows.map(row => row.getAttribute('data-key')));

  /*
   * Walked rather than set, because the rule is about where a PERSON is. Six
   * presses from page 1 at ten a page is page 7, whose first row is index 60.
   */
  for (let i = 0; i < 6; i += 1) await nextPage(page);
  const before = await keys();

  await page.getByRole('button', { name: /invoices a page/i }).click();
  await page.getByRole('option', { name: '50 invoices a page' }).click();

  const after = await keys();

  /*
   * THE ASSERTION IS THAT THE ROW IS STILL THERE, and getting it right took two
   * goes. The first version asserted the row was still FIRST, which is more
   * than the rule promises — the anchor names the page that HOLDS the row, and
   * it only comes out first when the old offset happens to divide by the new
   * size. It passed anyway, because the fixture was twenty-five a page, where
   * 150 does divide by 50.
   *
   * Worse, that fixture could not fail: at twenty-five, re-anchoring and a
   * plain clamp both land on page 4. Ten a page is the size at which they
   * differ — the rule gives page 2, holding rows 51 to 100; a clamp gives page
   * 4, holding 151 to 200, and the row is gone.
   */
  expect(before.length, 'the walk never left the first page').toBe(10);
  expect(after.length).toBe(50);
  expect(after, 'the row that was on screen is not on the new page').toContain(
    before[0]
  );
});

test('and the pager always marks a page that exists', async ({ page }) => {
  await gotoStory(page, PAGED);

  const marked = () => page.locator('[aria-current="page"]').count();

  for (let i = 0; i < 6; i += 1) await nextPage(page);
  expect(await marked()).toBe(1);

  await page.getByRole('button', { name: /invoices a page/i }).click();
  await page.getByRole('option', { name: '50 invoices a page' }).click();

  /*
   * A PAGE PAST THE END IS NOT MERELY EMPTY, which is why the hook publishes a
   * page rather than storing one. Measured on this library's own pager:
   * handed page 7 of 3, `pageWindow` returns the slots 1, 2, 3 — none equal to
   * 7 — so the render's `slot.page === page` never matches and nothing carries
   * `aria-current="page"`, while `atStart` stays false so previous is live and
   * reports 6. A row of unmarked numbers over an empty table.
   */
  expect(await marked()).toBe(1);
});

test('narrowing the results moves nobody past the end, and widening them returns', async ({
  page
}) => {
  await gotoStory(page, PAGED);

  for (let i = 0; i < 6; i += 1) await nextPage(page);
  const label = () => page.locator('.catalog-label').first().textContent();
  const far = await label();

  await page.getByRole('button', { name: /Narrow to 12 results/i }).click();
  const narrowed = await label();

  await page.getByRole('button', { name: /Clear the filter/i }).click();
  const back = await label();

  expect(far).toContain('page 7 of 20');
  /* The last page that exists, rather than an empty one. */
  expect(narrowed).toContain('page 2 of 2');
  /*
   * AND THE INTENT SURVIVED. Only possible because the correction is made on
   * the way out rather than written back — a repair that reported itself would
   * have overwritten the stored page, and in a controlled project its address
   * bar with it.
   */
  expect(back).toContain('page 7 of 20');
});
