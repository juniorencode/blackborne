/*
 * A calendar is the densest grid of targets in this library, and almost
 * everything interesting about it is a measurement.
 *
 * TODAY'S RING TAKES NO LAYOUT, which is why it is an inset shadow rather than
 * a border: a border would make today's cell a pixel larger than the other
 * thirty. A CELL CLEARS THE MINIMUM TARGET at compact density, which doc 06 §3
 * asks for at every density and which no unit test can see. THE THREE VIEWS
 * ARE THREE GRIDS, and their column counts are CSS. And the arrows SWAP ENDS in
 * Arabic, which is the half of RTL support that only a real direction shows.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pinClock } from './clock';
import { gotoStory } from './story';

const OVERVIEW = 'components-calendar--overview';
const STATES = 'components-calendar--states';
const LIMITS = 'components-calendar--limits';
const NO_ZONE = 'components-calendar--with-no-zone';
/*
 * `--direction` rather than `--rtl`: a story's id comes from its EXPORT name,
 * not from the `name` it is displayed under. This catalog has already paid for
 * that once, with multi-word component titles.
 */
const RTL = 'components-calendar--direction';
const NARROW = 'components-calendar--in-a-narrow-panel';
const TOGETHER = 'components-calendar--together';

/*
 * EVERY CHECK IN THIS FILE IS DATED, so every one of them fixes the clock.
 *
 * A calendar works out today for itself, from the zone the provider gives it
 * (decision 0023), and THREE of the checks below need today to be ON the month
 * they are looking at — one of those needs it to be the chosen day exactly.
 * Measured against the 5th of October all three fail on the count, which is to
 * say they were written on the ninth of September and were due to start
 * failing on the tenth.
 *
 * Not narrowed to the two that need it. This is the file about a component
 * whose whole subject is what day it is, and a reader should not have to work
 * out which of its checks are reproducible. `e2e/clock` has the instant and
 * the reasoning; doc 10 §6.1 has the rule.
 */
test.beforeEach(async ({ page }) => {
  await pinClock(page);
});

test('a day cell clears the minimum target, at both densities', async ({
  page
}) => {
  await gotoStory(page, TOGETHER);

  /*
   * The number is read from the page rather than remembered, because it is a
   * token: `--bb-control-hit-area`, which `hit-area.spec.ts` holds to the 24px
   * WCAG floor. Compact trims the number inside the cell, never the cell.
   */
  const cells = page.locator('.bb-calendar-day');
  const measured = await cells.evaluateAll(days =>
    days.map(day => {
      const box = day.getBoundingClientRect();
      const floor = parseFloat(
        getComputedStyle(day).getPropertyValue('--bb-control-hit-area')
      );
      return { width: box.width, height: box.height, floor };
    })
  );

  expect(measured.length).toBeGreaterThan(60);
  for (const cell of measured) {
    expect(cell.floor).toBeGreaterThan(0);
    expect(cell.width).toBeGreaterThanOrEqual(cell.floor - 0.5);
    expect(cell.height).toBeGreaterThanOrEqual(cell.floor - 0.5);
  }
});

test("today's ring takes no layout at all", async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const today = page.locator('.bb-calendar-today');
  await expect(today).toHaveCount(1);

  /*
   * THE CLAIM THE INSET SHADOW EXISTS FOR. A border on today's cell would make
   * it a pixel wider than every other cell in the grid, and a grid where one
   * column is a pixel out is a grid nobody can align.
   */
  const box = await today.boundingBox();
  const neighbours = await page
    .locator('.bb-calendar-day')
    .evaluateAll(days =>
      days
        .filter(day => !day.className.includes('bb-calendar-today'))
        .map(day => day.getBoundingClientRect().width)
    );

  expect(new Set(neighbours.map(Math.round)).size).toBe(1);
  expect(box!.width).toBeCloseTo(neighbours[0]!, 0);

  // And it IS painted, which is the other half of the same check.
  const shadow = await today.evaluate(
    element => getComputedStyle(element).boxShadow
  );
  expect(shadow).not.toBe('none');
});

test("and today's ring changes colour when that day is chosen too", async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  /*
   * THE FIRST BASELINE IS WHAT FOUND THIS. A grey ring inside an accent fill
   * is a grey ring nobody can see, so the claim that a day can be both today
   * and chosen was true of the markup and false of the picture. On the accent
   * the ring is drawn in the pair's own text colour.
   */
  const cell = page.locator('.bb-calendar-today[data-selected]');
  await expect(cell).toHaveCount(1);

  const seen = await cell.evaluate(element => {
    const styles = getComputedStyle(element);
    return {
      shadow: styles.boxShadow,
      text: styles.color,
      strong: styles.getPropertyValue('--bb-border-strong').trim()
    };
  });

  // The ring is the text colour of the pair, not the ordinary border colour.
  expect(seen.shadow).toContain(seen.text);
  expect(seen.strong).not.toBe('');
  expect(seen.shadow).not.toContain(seen.strong);
});

test('the chosen day is the accent pair, taken together', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const chosen = page.locator('.bb-calendar-day[data-selected]');
  await expect(chosen).toHaveCount(1);

  const painted = await chosen.evaluate(element => {
    const styles = getComputedStyle(element);
    return { background: styles.backgroundColor, colour: styles.color };
  });

  /*
   * Both halves, because half a pair is the bug: an accent fill with the
   * default text colour on it is the "two tokens pointing at the same step"
   * failure doc 03 §4.0 is about.
   */
  expect(painted.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(painted.colour).not.toBe(painted.background);
});

test('the heading walks up the three views and back down', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const title = page.locator('.bb-calendar-title');
  await expect(title).toHaveText('September 2026');
  /*
   * Thirty-five: five weeks of seven, which is what September 2026 fills with
   * a Sunday-first week. The days either side are PRESENT rather than blank —
   * a grid with holes in it is harder to read than one with quiet edges, and
   * the base makes them unselectable already.
   */
  await expect(page.locator('.bb-calendar-day')).toHaveCount(35);

  await title.click();

  /*
   * Twelve months in four columns — the grid is CSS, so the column count is a
   * measurement rather than an assertion about markup.
   */
  const months = page.locator('.bb-calendar-period');
  await expect(months).toHaveCount(12);
  await expect(title).toHaveText('2026');
  const columns = await page
    .locator('.bb-calendar-periods')
    .evaluate(
      grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length
    );
  expect(columns).toBe(4);

  await title.click();
  await expect(page.locator('.bb-calendar-period')).toHaveCount(12);
  // A range, formatted by the platform rather than glued out of two numbers.
  await expect(title).toHaveText(/2020.+2031/);

  await page.locator('.bb-calendar-period', { hasText: '2028' }).click();
  await expect(title).toHaveText('2028');

  await page.locator('.bb-calendar-period').first().click();
  await expect(title).toHaveText(/2028/);
  await expect(page.locator('.bb-calendar-day').first()).toBeVisible();
});

test('a month with nothing in it cannot be pressed', async ({ page }) => {
  await gotoStory(page, LIMITS);

  const calendar = page.locator('.bb-calendar').first();
  await calendar.locator('.bb-calendar-title').click();

  const reachable = await calendar
    .locator('.bb-calendar-period')
    .evaluateAll(months =>
      months
        .filter(month => !(month as HTMLButtonElement).disabled)
        .map(month => month.textContent)
    );

  /*
   * June to November, and this is the component's own arithmetic rather than
   * the base's: measured, the base's month picker hands over every month
   * whatever the limits say, and only its year picker clamps.
   */
  expect(reachable).toEqual([
    'June',
    'July',
    'August',
    'September',
    'October',
    'November'
  ]);
});

/*
 * THE RING'S CONTRAST, which no automated layer covers.
 *
 * axe checks the contrast of TEXT. Today's ring is a box shadow, so nothing in
 * the accessibility suite has ever looked at it — and it is the only thing
 * marking today, which makes it a graphical element carrying information and
 * puts doc 03 §5 rule 2's 3:1 on it.
 *
 * It was drawn in `--bb-border-strong` until the states baseline showed the
 * ordinary ring for the first time: 1.86:1 in light mode and 3.01:1 in dark, so
 * a hard rule broken on one side and scraped through on the other. Both modes
 * are asserted rather than one, because that asymmetry is doc 03's own warning
 * and a light-only check would have passed on the dark half.
 *
 * ## Against what the ring actually sits on
 *
 * Not against the page. A day can be today AND chosen, and then the ring is
 * inside an accent fill — which is why it changes colour at all. Measured
 * while writing this: comparing that ring against `--bb-surface` gives 1.03:1
 * and means nothing, because white on white is not what anybody is looking
 * at. So the background is the CELL's own where it paints one, and the
 * resolved surface where it does not.
 *
 * Two stories, for the same reason: every calendar in `Together` has today on
 * the chosen day, so on its own it would never measure the ordinary ring —
 * the one that was wrong.
 */
const RING_FLOOR = 3;

/** WCAG relative luminance, and the ratio between two resolved colours. */
const contrast = (page: Page, one: string, other: string) =>
  page.evaluate(
    ([a, b]) => {
      const parse = (value: string): number[] => {
        const found = /rgba?\(([^)]+)\)/.exec(value);
        if (found === null) throw new Error(`not a colour: ${value}`);
        return found[1]!.split(',').map(part => Number.parseFloat(part));
      };
      const luminance = (colour: string) => {
        const [r, g, b] = parse(colour);
        const channel = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return (
          0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!)
        );
      };
      const [x, y] = [luminance(a!), luminance(b!)];
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    },
    [one, other]
  );

/** Every marked cell in the story, with the colour it is drawn against. */
const ringsIn = (page: Page) =>
  page.locator('.bb-calendar').evaluateAll(scopes =>
    scopes.map(scope => {
      const cell = scope.querySelector('.bb-calendar-today');
      if (cell === null) throw new Error('no day marked as today');

      const shadow = getComputedStyle(cell).boxShadow;
      const ring = /rgba?\([^)]+\)(?=[^,]*inset)/.exec(shadow);
      if (ring === null) throw new Error(`no inset ring in: ${shadow}`);

      /*
       * The cell's own fill when it has one. Otherwise the surface, resolved
       * by PAINTING it inside the same scope rather than walked up the tree:
       * a mode is a redefinition of variables on a container (doc 03 §3), so
       * the answer depends on where it is asked, and nothing between the cell
       * and the page paints a background of its own.
       */
      const own = getComputedStyle(cell).backgroundColor;
      let behind = own;
      if (own === 'rgba(0, 0, 0, 0)' || own === 'transparent') {
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--bb-surface)';
        scope.append(probe);
        behind = getComputedStyle(probe).backgroundColor;
        probe.remove();
      }

      return {
        ring: ring[0],
        behind,
        chosen: cell.hasAttribute('data-selected')
      };
    })
  );

test("today's ring clears the floor for a graphical element", async ({
  page
}) => {
  const seen: Array<{ ring: string; behind: string; chosen: boolean }> = [];

  for (const story of [STATES, TOGETHER]) {
    await gotoStory(page, story);
    seen.push(...(await ringsIn(page)));
  }

  /*
   * Both cases on film, which is the floor under the assertions rather than a
   * count for its own sake: a story that stopped marking today, or one where
   * every calendar happened to have today chosen, would leave one of the two
   * rings unmeasured and this suite would not notice.
   */
  expect(seen.filter(one => one.chosen).length).toBeGreaterThan(0);
  expect(seen.filter(one => !one.chosen).length).toBeGreaterThan(0);

  for (const one of seen) {
    const ratio = await contrast(page, one.ring, one.behind);
    expect(
      ratio,
      `${one.ring} on ${one.behind} is ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(RING_FLOOR);
  }
});

test('an unavailable day is struck through, and a disabled one is not', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const unavailable = page
    .locator('.bb-calendar-day[data-unavailable]')
    .first();
  const line = await unavailable.evaluate(
    element => getComputedStyle(element).textDecorationLine
  );
  expect(line).toContain('line-through');

  /*
   * Disabled is dimmed instead, and the difference is the point: struck
   * through says "this day exists and you cannot have it", dimmed says "this
   * day is not in the range you are choosing from".
   */
  await gotoStory(page, LIMITS);
  const disabled = page.locator('.bb-calendar-day[data-disabled]').first();
  const disabledLine = await disabled.evaluate(
    element => getComputedStyle(element).textDecorationLine
  );
  expect(disabledLine).not.toContain('line-through');
});

test('with no zone configured, nothing is marked as today', async ({
  page
}) => {
  await gotoStory(page, NO_ZONE);

  /*
   * The base's own `data-today` is in the DOM and carries no styling of ours,
   * which is decision 0023 made visible: the browser's zone belongs to the
   * machine of whoever is looking rather than to the data.
   */
  await expect(page.locator('.bb-calendar-today')).toHaveCount(0);
  await expect(page.locator('.bb-calendar-day[data-today]')).toHaveCount(1);

  const shadow = await page
    .locator('.bb-calendar-day[data-today]')
    .evaluate(element => getComputedStyle(element).boxShadow);
  expect(shadow).toBe('none');
});

test('in Arabic the arrows swap ends and the chevrons turn with them', async ({
  page
}) => {
  await gotoStory(page, RTL);

  const [back, forward] = await page
    .locator('.bb-calendar-step')
    .evaluateAll(steps =>
      steps.map(step => ({
        x: step.getBoundingClientRect().x,
        rotate: getComputedStyle(step.firstElementChild as Element).rotate
      }))
    );

  /*
   * The first arrow in the DOM is "previous", and in Arabic it sits on the
   * RIGHT. Which is the half of RTL support no assertion about classes can
   * make: `rtl:-rotate-90` is a rule, and this is the rendered result of it.
   */
  expect(back!.x).toBeGreaterThan(forward!.x);
  expect(back!.rotate).not.toBe(forward!.rotate);
});

test('in a 320px panel nothing overflows', async ({ page }) => {
  await gotoStory(page, NARROW);

  const panel = await page.locator('.catalog-panel').boundingBox();
  const calendar = await page.locator('.bb-calendar').boundingBox();

  expect(calendar!.width).toBeLessThanOrEqual(panel!.width);

  const overflow = await page
    .locator('.bb-calendar-day')
    .evaluateAll(
      (days, edge) =>
        days.filter(day => day.getBoundingClientRect().right > edge + 1).length,
      panel!.x + panel!.width
    );
  expect(overflow).toBe(0);
});

test('the keyboard walks the grid a day at a time', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  await page.locator('.bb-calendar-day[data-selected]').click();
  await page.keyboard.press('ArrowRight');

  /*
   * The base's own keyboard, asserted once here because a calendar with a
   * broken grid keyboard is a calendar a keyboard cannot use at all — and
   * jsdom does not implement focus movement between grid cells.
   */
  await expect(page.locator('.bb-calendar-day:focus')).toHaveText('10');

  await page.keyboard.press('PageDown');
  await expect(page.locator('.bb-calendar-title')).toHaveText('October 2026');
});
