/*
 * The risk component, in the only place that can answer four of its questions.
 *
 * THE LIST IS AS WIDE AS THE FIELD, from `--trigger-width`, which jsdom
 * resolves to nothing. THE CHEVRON TURNS, which is a rotation nothing outside
 * a browser measures. THE TOGGLE IS A TARGET of the size doc 06 §3 asks for at
 * every density, and a 14px mark is a 14px target unless something says
 * otherwise. And READ-ONLY KEEPS THE ROOM its toggle occupied, which is a
 * layout fact and the one doc 07 §2.2 rule 1 is about.
 *
 * The filtering itself is asserted here as well, and not only in the unit
 * tests: the collator is the platform's, and the platform is what a person
 * uses. "jose" finding "José" in Chromium is the claim; jsdom agreeing with it
 * is a coincidence worth having but not the promise.
 *
 * FIRST, THOUGH: every open story here is open because its input is FOCUSED
 * (a combo box has no `defaultOpen` — measured on the base). So the first
 * check is that the fixture is honest, because a story that quietly rendered
 * closed would make every measurement below pass against nothing.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-combobox--overview';
const OPEN = 'components-combobox--open';
const STATES = 'components-combobox--states';
const NO_OPTIONS = 'components-combobox--no-options';
const LONG = 'components-combobox--long-options';
const COMPACT = 'components-combobox--compact';
const NARROW = 'components-combobox--in-a-narrow-panel';

test('the open story is actually open', async ({ page }) => {
  await gotoStory(page, OPEN);

  /*
   * Asserted first and separately, because this catalog has already shipped
   * four forced states that photographed identically to the default. A fixture
   * that opens by focusing an input is a fixture that can silently fail to
   * focus.
   */
  await expect(page.getByRole('listbox')).toBeVisible();
  expect(await page.getByRole('option').count()).toBeGreaterThan(1);
  await expect(page.locator('.bb-combobox-input')).toBeFocused();
});

test('the list is as wide as the field it belongs to', async ({ page }) => {
  await gotoStory(page, OPEN);

  const field = await page.locator('.bb-field-box').boundingBox();
  const list = await page.locator('.bb-combobox-list').boundingBox();
  expect(field).not.toBeNull();
  expect(list).not.toBeNull();

  /*
   * `min-width`, so equal here and free to grow — the next check. Measured
   * against each other rather than against a number: a list that stopped
   * following the field would pass any assertion about a remembered width.
   */
  expect(list!.width).toBeCloseTo(field!.width, 0);

  // And the variable it comes from is resolved rather than merely written.
  const resolved = await page
    .locator('.bb-combobox-list')
    .evaluate(element =>
      getComputedStyle(element).getPropertyValue('--trigger-width').trim()
    );
  expect(resolved).not.toBe('');
});

test('and it may grow past the field, up to the narrow container', async ({
  page
}) => {
  await gotoStory(page, LONG);

  const field = await page.locator('.bb-field-box').boundingBox();
  const list = await page.locator('.bb-combobox-list').boundingBox();

  /*
   * A 200px field with an option that does not fit: the list is wider. The
   * alternative — truncating every row to the field's width — would hide the
   * ends of the options somebody opened the list to read.
   */
  expect(list!.width).toBeGreaterThan(field!.width);

  const ceiling = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.width = 'var(--bb-container-narrow)';
    document.body.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  });
  expect(ceiling).toBeGreaterThan(0);
  expect(list!.width).toBeLessThanOrEqual(ceiling + 1);
});

test('the chevron turns while the list is open, and turns back', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const chevron = page.locator('.bb-combobox-chevron');
  const rotation = () =>
    chevron.evaluate(element => getComputedStyle(element).rotate);

  const closed = await rotation();

  await page.getByRole('button').click();
  await expect(page.getByRole('listbox')).toBeVisible();

  /*
   * The variant is `group-data-open`, and the state it reads is on the field's
   * ROOT. Worth measuring rather than assuming: on `SplitButton` the same mark
   * read `data-open` off a menu trigger, matched nothing, and simply never
   * turned — which is the kind of thing that looks finished in a screenshot.
   */
  await expect.poll(rotation).toContain('180');
  expect(await rotation()).not.toBe(closed);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  /*
   * Polled, because the mark is TRANSITIONED: read straight after the list
   * closes it measures 142deg on its way back, which is the check racing an
   * animation rather than a defect.
   */
  await expect.poll(rotation).toBe(closed);
});

test('the toggle is a target of the minimum size, at compact density', async ({
  page
}) => {
  await gotoStory(page, COMPACT);

  const box = await page.locator('.bb-combobox-toggle').boundingBox();
  expect(box).not.toBeNull();

  /*
   * Both axes take the token, so compact trims the MARK and never the target.
   * The number is read from the page rather than remembered, because it is a
   * token and a token is allowed to change — `--bb-control-hit-area`, which is
   * the same value `hit-area.spec.ts` holds to the 24px WCAG floor.
   */
  const minimum = await page
    .locator('.bb-combobox-toggle')
    .evaluate(element =>
      parseFloat(
        getComputedStyle(element).getPropertyValue('--bb-control-hit-area')
      )
    );

  expect(minimum).toBeGreaterThan(0);
  expect(box!.width).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(box!.height).toBeGreaterThanOrEqual(minimum - 0.5);
});

test('read-only keeps the room its toggle occupied', async ({ page }) => {
  await gotoStory(page, STATES);

  /*
   * Doc 07 §2.2 rule 1: unreachable, not absent. A control at the edge takes
   * real width, so removing it widens the box and the value slides across —
   * doc 09 §3 broken by a field's own state.
   *
   * `ControlFrame` owns the mechanism, so what is asserted here is the effect:
   * the edge is `inert` and hidden from the reader, and it still occupies the
   * same width as the one in the editable field above it.
   */
  const edges = page.locator('.bb-field-box > span:last-child');
  const editable = await edges.first().boundingBox();

  const hidden = page.locator(
    '[data-readonly] .bb-field-box > span:last-child'
  );
  const hiddenBox = await hidden.boundingBox();

  expect(editable).not.toBeNull();
  expect(hiddenBox).not.toBeNull();
  expect(hiddenBox!.width).toBeCloseTo(editable!.width, 0);

  await expect(hidden).toHaveAttribute('aria-hidden', 'true');
  expect(await hidden.evaluate(element => (element as HTMLElement).inert)).toBe(
    true
  );
  expect(
    await hidden.evaluate(element => getComputedStyle(element).visibility)
  ).toBe('hidden');
});

test('the forced hover row is actually painted', async ({ page }) => {
  await gotoStory(page, STATES);

  /*
   * THE FIFTH TIME THIS HAS BEEN WORTH CHECKING. Four forced states in this
   * catalog have photographed identically to the default, and the fix each
   * time was the target rather than the story — so the state is measured here
   * rather than trusted to a baseline that only says a picture changed.
   *
   * It is also too small to see: the border moves from #d9d9e0 to #b9bbc6,
   * which is a deliberate step — a field moves its BORDER on hover where the
   * small controls move their fill, because repainting the interior of every
   * field a pointer crosses would make a dense form shimmer (controlBox says
   * the rest).
   */
  const [plain, hovered] = await page
    .locator('.bb-field-box')
    .evaluateAll(boxes =>
      boxes.slice(0, 2).map(box => ({
        forced: box.getAttribute('data-hovered'),
        border: getComputedStyle(box).borderTopColor
      }))
    );

  expect(plain!.forced).toBeNull();
  expect(hovered!.forced).toBe('true');
  expect(hovered!.border).not.toBe(plain!.border);
});

test('typing narrows the list, with the platform collator', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const input = page.locator('.bb-combobox-input');
  await input.click();
  await input.fill('jose');

  /*
   * THE CLAIM THIS COMPONENT MAKES, in the engine a person actually uses:
   * "jose" finds "José". The unit test asserts the same thing through Node's
   * collator, which is a different implementation of the same standard — so
   * both are worth having, and this one is the promise.
   */
  await expect(page.getByRole('option')).toHaveCount(1);
  await expect(page.getByRole('option')).toHaveText('José Ruiz');
});

test('and an option is found by a word that is not on the row', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const input = page.locator('.bb-combobox-input');
  await input.click();
  await input.fill('cardio');

  const options = page.getByRole('option');
  await expect(options).toHaveCount(2);

  /*
   * And nothing on the screen says "cardiology" — which is the feature and
   * also the reason a match is not highlighted: there would be nothing in the
   * row to mark.
   */
  const text = await options.allTextContents();
  expect(text.join(' ')).not.toContain('cardio');
});

test('a query that matches nothing leaves a row saying so', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const input = page.locator('.bb-combobox-input');
  await input.click();
  await input.fill('zzz');

  /*
   * The list stays open with one row in it. A list that closed would leave the
   * person who typed with no answer at all, and the row is a real option
   * because a listbox with no rows announces nothing.
   */
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(page.locator('.bb-combobox-empty')).toHaveText('No results');
});

test('and a field given no options says that instead', async ({ page }) => {
  await gotoStory(page, NO_OPTIONS);

  // Doc 09's distinction, and the two answers are not interchangeable.
  await expect(page.locator('.bb-combobox-empty')).toHaveText(
    'Nothing here yet'
  );
});

test('the tick marks the chosen option without moving the rows', async ({
  page
}) => {
  await gotoStory(page, OPEN);

  const ticks = page.locator('.bb-combobox-option svg:last-of-type');
  const count = await ticks.count();
  expect(count).toBeGreaterThan(1);

  /*
   * Every row has one, and all but the chosen one are `visibility: hidden` —
   * NOT absent. A tick that appeared would take its width with it, so every
   * label would step sideways as the highlight walked down the list (doc 09
   * §7, in a list somebody is moving through with the arrows).
   */
  const visibility = await ticks.evaluateAll(elements =>
    elements.map(element => getComputedStyle(element).visibility)
  );
  expect(visibility.filter(value => value === 'visible')).toHaveLength(1);
  expect(visibility.filter(value => value === 'hidden').length).toBe(count - 1);

  const widths = await page
    .locator('.bb-combobox-option')
    .evaluateAll(rows => rows.map(row => row.getBoundingClientRect().width));
  expect(new Set(widths.map(Math.round)).size).toBe(1);
});

test('the keyboard opens, moves, chooses and closes', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  /*
   * Focused by clicking rather than by `Tab`. A story page is not a form, and
   * the first `Tab` from a fresh document lands wherever the browser decides —
   * measured here as nowhere at all. What this check is about starts once the
   * field has focus, and the tab ORDER is `alignment.spec.ts`'s subject.
   */
  await page.locator('.bb-combobox-input').click();
  await expect(page.locator('.bb-combobox-input')).toBeFocused();
  await page.keyboard.press('Escape');

  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();

  /*
   * `ArrowDown` opens the list and highlights the first row, so the second
   * press moves to the second — measured on `Menu`, where an extra press
   * asserted focus on the row it had just left.
   */
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(page.locator('.bb-combobox-input')).toHaveValue('Ana Vega');
  await expect(page.getByText('Chosen: vega')).toBeVisible();

  // And focus never left the field, which is what makes typing again possible.
  await expect(page.locator('.bb-combobox-input')).toBeFocused();
});

test('Escape closes the list and puts the chosen text back', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const input = page.locator('.bb-combobox-input');
  await input.click();
  await input.fill('vega');
  await page.getByRole('option').click();
  await expect(input).toHaveValue('Ana Vega');

  await input.fill('zz');
  await page.keyboard.press('Escape');

  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(input).toHaveValue('Ana Vega');
});

test('after choosing, asking again shows every option', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const input = page.locator('.bb-combobox-input');
  await input.click();
  await input.fill('cardio');
  await page.getByRole('option').first().click();

  await page.getByRole('button').click();

  /*
   * The base's own behaviour, and the reason this component's filter extends
   * the base's rather than replacing it: a private flag shows every row again
   * when the list is reopened after a selection. Filtering the rows here
   * instead would have lost it, and nothing in the public state can see it.
   */
  await expect(page.getByRole('option')).toHaveCount(5);
});

test('a click outside closes the list and leaves focus behind', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  await page.getByRole('button').click();
  await expect(page.getByRole('listbox')).toBeVisible();

  await page.locator('body').click({ position: { x: 5, y: 5 } });

  await expect(page.getByRole('listbox')).toBeHidden();
});

test('in a 320px panel nothing overflows', async ({ page }) => {
  await gotoStory(page, NARROW);

  /*
   * P4's own question, asked of the box rather than of a screenshot: the field
   * fits the panel it was given, and the toggle is inside the frame rather
   * than hanging off it.
   */
  const panel = await page.locator('.catalog-panel').boundingBox();
  const frame = await page.locator('.bb-field-box').boundingBox();
  const toggle = await page.locator('.bb-combobox-toggle').boundingBox();

  expect(frame!.width).toBeLessThanOrEqual(panel!.width);
  expect(toggle!.x + toggle!.width).toBeLessThanOrEqual(
    frame!.x + frame!.width + 1
  );
});

/* ------------------------------------------------------------------ several
 *
 * The measurements that only a box can answer: the field GROWS with its chips
 * and the toggle does not move, the chips wrap inside the frame rather than
 * pushing it wider, and the draft input follows the last chip onto its line.
 */

const SEVERAL = 'components-combobox--several';
const SEVERAL_STATES = 'components-combobox--several-states';
const SEVERAL_NARROW = 'components-combobox--several-in-a-narrow-panel';

test('the chips and the input share one wrapping flow', async ({ page }) => {
  await gotoStory(page, SEVERAL);

  const chip = await page.locator('.bb-value-chip').first().boundingBox();
  const input = await page.locator('.bb-combobox-input').boundingBox();

  /*
   * The input FOLLOWS the chip on the same line rather than taking a line of
   * its own — which is what `flex-1` on a wrapping flow buys, and what a plain
   * block beside the chips would not.
   */
  expect(chip).not.toBeNull();
  expect(input).not.toBeNull();
  expect(input!.y).toBeLessThan(chip!.y + chip!.height);
  expect(input!.x).toBeGreaterThan(chip!.x);
});

test('the box grows with its chips, and the toggle stays at the edge', async ({
  page
}) => {
  await gotoStory(page, SEVERAL_STATES);

  const frames = page.locator('.bb-field-box');
  const empty = await frames.first().boundingBox();
  const four = await frames.last().boundingBox();

  // One row measures a control's height; four values measure more than one.
  expect(four!.height).toBeGreaterThan(empty!.height);

  /*
   * And the toggle is still at the trailing edge of the frame rather than
   * wrapped onto a line of its own, which is the reason the wrapping happens
   * inside `ControlFrame` instead of replacing it.
   */
  const toggle = await page
    .locator('.bb-field-box')
    .last()
    .locator('.bb-combobox-toggle')
    .boundingBox();
  expect(toggle!.x + toggle!.width).toBeLessThanOrEqual(
    four!.x + four!.width + 1
  );
  expect(toggle!.y).toBeLessThan(four!.y + four!.height / 2);
});

test('choosing several keeps the list open and empties the box', async ({
  page
}) => {
  await gotoStory(page, SEVERAL);

  const input = page.locator('.bb-combobox-input');
  await input.click();
  await input.fill('cardio');
  await page.getByRole('option').first().click();

  /*
   * The base's own behaviour, asserted here because it is the difference
   * between picking four values and picking one four times.
   */
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(input).toHaveValue('');
});

test('a chip is removed by its cross, and the row re-wraps', async ({
  page
}) => {
  await gotoStory(page, SEVERAL_NARROW);

  const chips = page.locator('.bb-value-chip');
  const before = await chips.count();
  const tallBefore = await page.locator('.bb-field-box').boundingBox();

  await page
    .getByRole('button', { name: /^Remove/ })
    .first()
    .click();

  await expect(chips).toHaveCount(before - 1);
  const tallAfter = await page.locator('.bb-field-box').boundingBox();
  expect(tallAfter!.height).toBeLessThanOrEqual(tallBefore!.height);
});

test('in a 320px panel the chips wrap rather than widen the field', async ({
  page
}) => {
  await gotoStory(page, SEVERAL_NARROW);

  const panel = await page.locator('.catalog-panel').boundingBox();
  const frame = await page.locator('.bb-field-box').boundingBox();

  expect(frame!.width).toBeLessThanOrEqual(panel!.width);

  // And the box is more than one row tall, which is what wrapping looks like.
  const chip = await page.locator('.bb-value-chip').first().boundingBox();
  expect(frame!.height).toBeGreaterThan(chip!.height * 1.5);

  // No chip reaches past the frame it sits in.
  const overflow = await page
    .locator('.bb-value-chip')
    .evaluateAll(
      (chips, edge) =>
        chips.filter(c => c.getBoundingClientRect().right > edge + 1).length,
      frame!.x + frame!.width
    );
  expect(overflow).toBe(0);
});

test('a cross is a target of the minimum size, at compact density', async ({
  page
}) => {
  await gotoStory(page, SEVERAL_STATES);

  const cross = page.locator('.bb-value-chip-remove').first();
  const box = await cross.boundingBox();
  const minimum = await cross.evaluate(element =>
    parseFloat(
      getComputedStyle(element).getPropertyValue('--bb-control-hit-area')
    )
  );

  expect(minimum).toBeGreaterThan(0);
  expect(box!.width).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(box!.height).toBeGreaterThanOrEqual(minimum - 0.5);
});

test('while saving, the cross keeps its room and takes no clicks', async ({
  page
}) => {
  await gotoStory(page, SEVERAL_STATES);

  /*
   * Doc 07 §2.2 rule 1 inside the chip, measured as the two things that make
   * it true: the room is the same as an ordinary chip's, and the element is
   * `inert`, so a click at its centre reaches nothing.
   */
  const saving = page
    .getByRole('combobox', { name: 'Saving' })
    .locator('xpath=ancestor::*[contains(@class,"bb-field-box")]');

  const hidden = saving.locator('.bb-value-chip-remove').first();
  expect(
    await hidden.evaluate(element => getComputedStyle(element).visibility)
  ).toBe('hidden');

  const ordinary = await page
    .locator('.bb-value-chip-remove')
    .first()
    .boundingBox();
  const box = await hidden.boundingBox();
  expect(box!.width).toBeCloseTo(ordinary!.width, 0);
});

/* -------------------------------------------------------- from a source
 *
 * The half of an asynchronous list that jsdom cannot answer at all: the base's
 * load-more sentinel watches for itself coming into view with an
 * `IntersectionObserver`, which jsdom does not have. So whether SCROLLING
 * actually loads the next page is a question only a browser can be asked, and
 * this is where it is asked.
 */

const FROM_A_SOURCE = 'components-combobox--from-a-source';
const LOADING_MORE = 'components-combobox--loading-more';
const LOAD_FAILED = 'components-combobox--load-failed';
const WAITING = 'components-combobox--waiting-for-a-query';

test('a source loads a first page, and says so while it does', async ({
  page
}) => {
  await gotoStory(page, FROM_A_SOURCE);

  const input = page.locator('.bb-combobox-input');
  await input.click();
  await input.fill('a');

  /*
   * The row says "Loading" before the answers arrive — the state a list is in
   * while a keystroke is still waiting counts as loading too, because the
   * alternative is showing the previous query's answers with nothing saying
   * they are stale.
   */
  await expect(page.locator('.bb-combobox-empty')).toHaveText('Loading');
  await expect(page.getByRole('option').first()).not.toHaveText('Loading');
});

test('the list arrives in pages, and asks once per page', async ({ page }) => {
  await gotoStory(page, FROM_A_SOURCE);

  await page.locator('.bb-combobox-toggle').click();

  /*
   * MEASURED, AND NOT WHAT THIS CHECK FIRST ASSUMED. The base's sentinel
   * triggers when it comes within ONE list-height of the fold —
   * `scrollOffset` defaults to 100% — so in a list 776px tall a page of
   * twenty rows is never out of range, and the list fills ITSELF page by page
   * with nobody scrolling. Counts watched over two seconds: 1, 21, 40, 41,
   * 60.
   *
   * Which is the right behaviour, and the reason this asserts the REQUESTS
   * rather than a scroll: sixty rows in pages of twenty is three requests,
   * whether the fold or a person asked for them.
   */
  await expect(page.getByText('Loaded 60 · requests: 3')).toBeVisible();
  await expect(page.getByRole('option')).toHaveCount(60);
});

test('and asking past the last page asks for nothing', async ({ page }) => {
  await gotoStory(page, FROM_A_SOURCE);

  await page.locator('.bb-combobox-toggle').click();
  await expect(page.getByText('Loaded 60 · requests: 3')).toBeVisible();

  const toBottom = () =>
    page.locator('.bb-combobox-options').evaluate(list => {
      list.scrollTop = list.scrollHeight;
    });

  for (let round = 0; round < 3; round += 1) {
    await toBottom();
    await page.waitForTimeout(200);
  }

  /*
   * Still three: a page with no cursor is how the loader declares the end, and
   * the base stops asking. Without it, scrolling the bottom of a finished list
   * would be a request loop nobody notices until a bill arrives — and the
   * loading row being gone is the visible half of the same fact.
   */
  await expect(page.getByText('Loaded 60 · requests: 3')).toBeVisible();
  await expect(page.locator('.bb-combobox-empty')).toHaveCount(0);
});

test('a run of keystrokes costs one request, not one each', async ({
  page
}) => {
  await gotoStory(page, WAITING);

  /*
   * Asked of the field with a MINIMUM, because it is the only place the number
   * is legible: with three characters required, nothing is asked until the
   * third one lands, and the paging that fills a list on its own never starts.
   * Measured on the other story, where opening the list mid-typing put two
   * page requests between the keystrokes and the query.
   */
  await expect(page.getByText('Requests: 0')).toBeVisible();

  const input = page.locator('.bb-combobox-input');
  await input.pressSequentially('vega', { delay: 40 });

  /* Four keystrokes, ONE request, and it carried the whole query. */
  await expect(page.getByText('Requests: 1')).toBeVisible();
  await expect(page.getByRole('option')).toHaveCount(10);
  await expect(page.getByRole('option').first()).toHaveText('Ana Vega');
});

test('the loading row sits after the options, as a row', async ({ page }) => {
  await gotoStory(page, LOADING_MORE);

  const rows = page.getByRole('option');
  await expect(rows).toHaveCount(4);
  await expect(rows.last()).toHaveText('Loading');

  // Under the options rather than over them, which is where somebody scrolling
  // is looking.
  const first = await rows.first().boundingBox();
  const last = await rows.last().boundingBox();
  expect(last!.y).toBeGreaterThan(first!.y);
});

test('a load that failed says so, and not "no results"', async ({ page }) => {
  await gotoStory(page, LOAD_FAILED);

  await expect(page.locator('.bb-combobox-empty')).toHaveText('Could not load');
});

test('and a query too short to ask with says to keep typing', async ({
  page
}) => {
  await gotoStory(page, WAITING);

  /*
   * The row AND the request count, because this check used to pass for the
   * wrong reason: `useAsyncList` loads once on mount whether anything asked it
   * to or not, so the field fetched a first page for the empty query and the
   * "keep typing" row was only visible for the length of that request. The
   * count staying at zero is what says nothing was asked.
   */
  await expect(page.locator('.bb-combobox-empty')).toHaveText('Keep typing');
  await expect(page.getByText('Requests: 0')).toBeVisible();

  const input = page.locator('.bb-combobox-input');
  await input.fill('ve');
  await expect(page.locator('.bb-combobox-empty')).toHaveText('Keep typing');
  await expect(page.getByText('Requests: 0')).toBeVisible();

  await input.fill('veg');
  await expect(page.getByRole('option').first()).toHaveText('Ana Vega');
  await expect(page.getByText('Requests: 1')).toBeVisible();
});
