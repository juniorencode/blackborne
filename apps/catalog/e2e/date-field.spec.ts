/*
 * A date in segments, and the four things about it that only a browser
 * answers.
 *
 * THE ROW MUST NOT MOVE while a month is typed, which is a box question. THE
 * FOCUSED SEGMENT is where the next keystroke lands and there is no caret to
 * say so, so its mark is the only signal and its contrast is a ratio nothing
 * automated measures. THE TWO CONTROLS AT ONE EDGE are doc 07 §2.2a's first
 * condition, which is a measurement by construction. And THE ORDER OF THE
 * PIECES is the locale's, which jsdom can check but a picture is what proves.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pinClock } from './clock';
import { gotoStory } from './story';

const OVERVIEW = 'components-datefield--overview';
const STATES = 'components-datefield--states';
const LOCALES = 'components-datefield--in-every-locale';
const TOGETHER = 'components-datefield--together';
const RTL = 'components-datefield--direction';

/*
 * Dated, all of it: an empty date field renders the placeholder of a segment
 * and a filled one renders a value, and both are read against a month. Doc 10
 * §6.1, and `e2e/clock` has the instant.
 */
test.beforeEach(async ({ page }) => {
  await pinClock(page);
});

/** Every control at a field's edge, with the floor it has to clear. */
const targets = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll(nodes =>
    nodes.map(node => {
      const box = node.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        floor: Number.parseFloat(
          getComputedStyle(node).getPropertyValue('--bb-control-hit-area')
        )
      };
    })
  );

test('the row does not move while a date is typed', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const row = page.locator('.bb-date-segments');
  const width = () =>
    row.evaluate(node => Math.round(node.getBoundingClientRect().width));

  const filled = await width();
  await page.locator('.bb-date-segment').first().click();
  await page.keyboard.press('Backspace');
  const emptied = await width();
  await page.keyboard.type('1');
  const halfTyped = await width();

  /*
   * THE CLAIM: a segment showing `mm`, a segment showing `1` and a segment
   * showing `12` all occupy the same row. A row that shrank as the placeholder
   * gave way would slide the rest of the date sideways on the first keystroke
   * and back on a backspace — doc 09 §3 broken twice per edit, which is the
   * same failure a clear button appearing on the first character causes.
   */
  expect(emptied).toBe(filled);
  expect(halfTyped).toBe(filled);
});

test('the focused segment is filled, and legibly', async ({ page }) => {
  await gotoStory(page, OVERVIEW);
  await page.locator('.bb-date-segment').first().click();

  /*
   * WAITED FOR, NOT READ ONCE. The segment's fill and its text colour are
   * transitioned, so a single read catches them mid-flight: measured under a
   * full parallel run, `rgb(150, 152, 154)` on `rgba(62, 99, 221, 0.537)` at
   * 1.80:1 — a half-faded background and a half-faded colour, neither of which
   * the component ever settles at. In isolation the transition had finished
   * first, which is exactly the shape doc 10 §11 warns about: a check whose
   * result depends on how loaded the machine was.
   *
   * So it polls until the fill is OPAQUE and then reads both together. What is
   * asserted is the state the component comes to rest in, which is the claim.
   */
  const focused = page.locator('.bb-date-segment[data-focused]');
  await expect
    .poll(() =>
      focused.evaluate(node =>
        /*
         * `rgba(` and not a regex over the whole value: an opaque computed
         * colour serialises as `rgb(...)` and a translucent one as `rgba(...)`,
         * so the prefix IS the question. The first version of this poll used a
         * pattern that matched both and therefore never became true.
         */
        getComputedStyle(node).backgroundColor.startsWith('rgba(')
      )
    )
    .toBe(false);

  const seen = await focused.evaluate(node => {
    const styles = getComputedStyle(node);
    return { bg: styles.backgroundColor, colour: styles.color };
  });

  const ratio = await page.evaluate(
    ([a, b]) => {
      const parse = (value: string) =>
        (/rgba?\(([^)]+)\)/.exec(value)?.[1] ?? '0,0,0')
          .split(',')
          .map(part => Number.parseFloat(part));
      const luminance = (value: string) => {
        const [r, g, b2] = parse(value);
        const channel = (n: number) => {
          const s = n / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return (
          0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b2!)
        );
      };
      const [x, y] = [luminance(a!), luminance(b!)];
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    },
    [seen.colour, seen.bg]
  );

  /*
   * There is no caret in a date field — the segments are not editable text —
   * so the fill IS the answer to "where does typing go". It carries the value
   * on top of it, which makes it text: 4.5:1, not the 3:1 a mark would need.
   */
  expect(seen.bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(
    ratio,
    `${seen.colour} on ${seen.bg} is ${ratio.toFixed(2)}:1`
  ).toBeGreaterThanOrEqual(4.5);
});

test('a separator takes no highlight and no focus', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const literals = page.locator('.bb-date-segment[data-type=literal]');
  await expect(literals.first()).toBeVisible();

  /*
   * A `/` is a segment as far as the base is concerned, so styling every
   * segment alike puts a blue box round punctuation — and it is not focusable,
   * which is the base being right.
   */
  const seen = await literals.evaluateAll(nodes =>
    nodes.map(node => ({
      bg: getComputedStyle(node).backgroundColor,
      tabIndex: (node as HTMLElement).tabIndex
    }))
  );
  for (const one of seen) {
    expect(one.bg).toBe('rgba(0, 0, 0, 0)');
    expect(one.tabIndex).toBeLessThan(0);
  }
});

test('the order of the segments follows the locale', async ({ page }) => {
  await gotoStory(page, LOCALES);

  const orders = await page.locator('.bb-date-segments').evaluateAll(rows =>
    rows.map(row =>
      [...row.querySelectorAll('.bb-date-segment')]
        .map(segment => segment.getAttribute('data-type'))
        .filter(type => type !== 'literal')
        .join(' ')
    )
  );

  /* Month first, day first, year first — three locales, three orders. */
  expect(orders).toEqual([
    'month day year',
    'day month year',
    'year month day'
  ]);
});

test('the cross clears the field and reports it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const value = () => page.locator('.catalog-label').last().innerText();

  expect(await value()).toContain('2026-09-09');
  await page.locator('.bb-field-clear').click();

  /*
   * DOC 07 §2.2a'S FOURTH CONDITION, and the whole reason the exception
   * exists: emptying a date field is otherwise unobservable. Measured before
   * this button existed — clearing the month and the day left the reported
   * value at the last complete date, and the year segment did not clear at
   * all. So this is the one route by which the value becomes nothing, and the
   * check reads the value the story prints rather than the segments.
   */
  expect(await value()).toContain('Empty');
  const segments = await page
    .locator('.bb-date-segments')
    .evaluate(row => (row as HTMLElement).innerText.replace(/\s/g, ''));
  expect(segments).toBe('mm/dd/yyyy');
});

test('the cross keeps its room when it has nothing to offer', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const rows = await page.locator('.bb-field-clear').evaluateAll(nodes =>
    nodes.map(node => {
      const box = node.getBoundingClientRect();
      const slot = node.parentElement!;
      return {
        width: Math.round(box.width),
        reachable: !slot.hasAttribute('inert'),
        hidden: slot.getAttribute('aria-hidden') === 'true'
      };
    })
  );

  /*
   * RULE 1, unchanged by the exception: unreachable, not absent. The empty
   * field's cross is out of the tree and out of reach and still exactly as
   * wide, because a control appearing on the first keystroke moves the value
   * on that keystroke and back on the backspace.
   */
  const unreachable = rows.filter(row => !row.reachable);
  expect(unreachable.length).toBeGreaterThan(0);
  for (const row of rows) expect(row.width).toBeGreaterThan(0);
  for (const row of unreachable) expect(row.hidden).toBe(true);
});

test('a control at the edge clears the minimum target, at both densities', async ({
  page
}) => {
  await gotoStory(page, TOGETHER);

  const crosses = await targets(page, '.bb-field-clear');

  /*
   * DOC 07 §2.2a'S FIRST CONDITION. Two controls at one edge is exactly where
   * doc 06 §3's minimum gets bent, so the floor is read from the token rather
   * than remembered — and compact is in the story on purpose, because that is
   * the density where a 24px floor and a 28px control stop having room to
   * spare.
   */
  expect(crosses.length).toBeGreaterThan(2);
  for (const target of crosses) {
    expect(target.floor).toBeGreaterThan(0);
    expect(target.width).toBeGreaterThanOrEqual(target.floor - 0.5);
    expect(target.height).toBeGreaterThanOrEqual(target.floor - 0.5);
  }
});

test('a read-only field is not a disabled one', async ({ page }) => {
  await gotoStory(page, STATES);

  const panels = page.locator('.catalog-panel');
  const readOnly = panels.filter({ hasText: 'Read-only' });
  const disabled = panels.filter({ hasText: 'Disabled' });

  const colourOf = (panel: typeof readOnly) =>
    panel
      .locator('.bb-date-segment')
      .first()
      .evaluate(node => getComputedStyle(node).color);

  /*
   * Doc 07 §6: read-only means "read this", so the value stays at full
   * contrast and only the border goes. Disabled means "this does not apply".
   * They are different states and they may not look the same.
   */
  expect(await colourOf(readOnly)).not.toBe(await colourOf(disabled));
});

test('in Arabic the segments read from the right', async ({ page }) => {
  await gotoStory(page, RTL);

  const positions = await page
    .locator('.bb-date-segment:not([data-type=literal])')
    .evaluateAll(nodes =>
      nodes.map(node => Math.round(node.getBoundingClientRect().x))
    );

  /* The first segment in the DOM sits furthest right. */
  expect(positions[0]!).toBeGreaterThan(positions[positions.length - 1]!);
});

test('nothing overflows sideways in a 320px panel', async ({ page }) => {
  await gotoStory(page, STATES);

  const overflow = await page
    .locator('.catalog-panel')
    .first()
    .evaluate(panel => {
      const bounds = panel.getBoundingClientRect();
      return [...panel.querySelectorAll('*')]
        .map(child => child.getBoundingClientRect())
        .filter(box => box.width > 0)
        .map(box => Math.round((box.right - bounds.right) * 100) / 100)
        .filter(over => over > 0.5);
    });

  expect(overflow, `${overflow.length} elements past the edge`).toEqual([]);
});
