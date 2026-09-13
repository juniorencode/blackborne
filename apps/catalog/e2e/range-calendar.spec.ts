/*
 * A range calendar, and the four things about it that only a browser answers.
 *
 * HOW MANY MONTHS IS THE CONTAINER'S ANSWER, which is doc 04 §6's one hook and
 * cannot be asked in jsdom at all — there is no ResizeObserver and no
 * container query, so the unit tests see the narrow structure and nothing
 * else. THE BAND IS ONE SHAPE OR IT IS SEVEN, which is a question about
 * adjacent boxes. TODAY'S RING SITS ON THREE DIFFERENT FILLS, and each one is
 * a contrast ratio nothing automated measures. And THE SELECTION SURVIVES THE
 * STRUCTURE CHANGING, which doc 04 rule 4 says is what breaks most often.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pinClock } from './clock';
import { contrast } from './colour';
import { gotoStory } from './story';

/*
 * Doc 03 §5 rule 2: a graphical element carrying information needs 3:1. The
 * ring is the only thing marking today, so it carries information.
 */
const RING_FLOOR = 3;

const OVERVIEW = 'components-rangecalendar--overview';
const STRUCTURES = 'components-rangecalendar--structures';
const STATES = 'components-rangecalendar--states';
const ONE_DAY = 'components-rangecalendar--one-day';
const LIMITS = 'components-rangecalendar--limits';
/* `--direction`, not `--rtl`: a story's id comes from its EXPORT name. */
const RTL = 'components-rangecalendar--direction';
const TOGETHER = 'components-rangecalendar--together';

/*
 * EVERY CHECK HERE IS DATED, so every one of them fixes the clock — a range
 * calendar works out today for itself from the configured zone, and a check
 * that needs today on the month it is looking at expires overnight. Doc 10
 * §6.1, and `e2e/clock` has the instant.
 */
test.beforeEach(async ({ page }) => {
  await pinClock(page);
});

/** What the calendar is showing, read from the page. */
const shape = (page: Page) =>
  page
    .locator('.bb-calendar')
    .first()
    .evaluate(root => ({
      step: getComputedStyle(root).getPropertyValue('--bb-step').trim(),
      months: root.querySelectorAll('.bb-calendar-grid').length,
      title: root.querySelector('.bb-calendar-title')?.textContent ?? '',
      chosen: [...root.querySelectorAll('[data-selected]')].map(cell =>
        (cell as HTMLElement).innerText.trim()
      )
    }));

test('the container decides how many months, at the scale own boundary', async ({
  page
}) => {
  await gotoStory(page, STRUCTURES);

  const calendars = page.locator('.bb-calendar');
  await expect(calendars).toHaveCount(2);

  const seen = await calendars.evaluateAll(roots =>
    roots.map(root => ({
      step: getComputedStyle(root).getPropertyValue('--bb-step').trim(),
      months: root.querySelectorAll('.bb-calendar-grid').length
    }))
  );

  /*
   * Two of the same component at two widths inside ONE window, which is P4's
   * question asked of the thing that decides. A viewport-driven answer would
   * give both of them the same number.
   */
  expect(seen).toEqual([
    { step: 'base', months: 1 },
    { step: 'medium', months: 2 }
  ]);
});

test('the structure changes with the container, and the range survives it', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const resize = async (width: number) => {
    await page.evaluate(next => {
      const room = document.querySelector('.catalog-panel') as HTMLElement;
      room.style.width = `${next}px`;
    }, width);
    await expect
      .poll(() =>
        page
          .locator('.bb-calendar')
          .first()
          .evaluate(root => root.querySelectorAll('.bb-calendar-grid').length)
      )
      .toBe(width < 480 ? 1 : 2);
  };

  const wide = await shape(page);
  expect(wide.months).toBe(2);
  expect(wide.chosen).toHaveLength(8);

  await resize(320);
  const narrow = await shape(page);

  await resize(640);
  const back = await shape(page);

  /*
   * RULE 4: the state survives the change. The eight days are the same eight
   * in all three, and the check crosses the boundary and comes BACK, because
   * a structure that loses the value on the way out looks fine on the way in.
   */
  expect(narrow.months).toBe(1);
  expect(narrow.chosen).toEqual(wide.chosen);
  expect(back.months).toBe(2);
  expect(back.chosen).toEqual(wide.chosen);

  /* And the title says what is showing rather than what it was. */
  expect(wide.title).toContain('October');
  expect(narrow.title).not.toContain('October');
});

test('the band across a week is one continuous shape', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const runs = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.bb-calendar-day')].filter(
      cell => cell.hasAttribute('data-selected')
    );

    /* Adjacent pairs on the same row, and the space between them. */
    const gaps: number[] = [];
    for (let i = 1; i < cells.length; i += 1) {
      const before = cells[i - 1]!.getBoundingClientRect();
      const after = cells[i]!.getBoundingClientRect();
      if (Math.abs(before.y - after.y) > 1) continue;
      gaps.push(Math.round((after.x - (before.x + before.width)) * 100) / 100);
    }
    return gaps;
  });

  expect(runs.length).toBeGreaterThan(3);
  /*
   * ZERO, not "small". A gap of a pixel between two days of one range reads
   * as a row of blocks rather than as a stay, and the cells being edge to
   * edge is the whole reason the middle of the band can be square.
   */
  for (const gap of runs) expect(gap).toBe(0);
});

test('the two ends are the solid fill and the middle is the soft one', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const paint = await page.evaluate(() => {
    const read = (cell: Element) => {
      const s = getComputedStyle(cell);
      return { bg: s.backgroundColor, colour: s.color, radius: s.borderRadius };
    };
    const cells = [...document.querySelectorAll('.bb-calendar-day')].filter(
      cell => cell.hasAttribute('data-selected')
    );
    return {
      start: read(cells[0]!),
      middle: read(cells[3]!),
      end: read(cells.at(-1)!)
    };
  });

  /* The ends share one fill and the middle is a different one. */
  expect(paint.start.bg).toBe(paint.end.bg);
  expect(paint.middle.bg).not.toBe(paint.start.bg);

  /*
   * And the corners make one shape: rounded on the outside of each end,
   * square everywhere in between. Read as computed values rather than as
   * classes, because which of two variants wins is decided by the compiled
   * stylesheet rather than by the order they were written in.
   */
  expect(paint.middle.radius).toBe('0px');
  expect(paint.start.radius).not.toBe('0px');
  expect(paint.end.radius).not.toBe('0px');
  expect(paint.start.radius).not.toBe(paint.end.radius);
});

test('the range paints once, not twice, where the two months overlap', async ({
  page
}) => {
  await gotoStory(page, STATES);

  /*
   * TWO MONTHS SIDE BY SIDE OVERLAP BY A WEEK, and the base marks
   * `data-selection-start` on the copy of the day in the neighbouring grid —
   * with no `data-selected` on it. So a range starting on the 27th of
   * September was painted as a solid pill in September's grid AND again in
   * October's outside-month row: two starts on screen for one range, the
   * second one attached to no band at all.
   *
   * Found by looking at the first baseline. The fill now requires BOTH
   * attributes, and this is the check that says the copy paints nothing.
   */
  const copies = await page.evaluate(() => {
    const root = document.querySelectorAll('.bb-calendar')[0]!;
    return [...root.querySelectorAll('.bb-calendar-day')]
      .filter(
        cell =>
          cell.hasAttribute('data-outside-month') &&
          (cell.hasAttribute('data-selection-start') ||
            cell.hasAttribute('data-selection-end'))
      )
      .map(cell => getComputedStyle(cell).backgroundColor);
  });

  /*
   * The floor under the assertion: a story that stopped crossing a month
   * boundary would leave nothing to check, and this check would pass on air.
   */
  expect(
    copies.length,
    'the story must hold a range that crosses a month boundary'
  ).toBeGreaterThan(0);
  for (const fill of copies) expect(fill).toBe('rgba(0, 0, 0, 0)');
});

test('a disabled range shows no ends without its band', async ({ page }) => {
  await gotoStory(page, STATES);

  /*
   * THE SAME CAUSE FROM THE OTHER SIDE. A disabled calendar drops
   * `data-selected` from every cell and KEEPS the two end marks — measured: 0
   * selected, 2 ends — so before the fill required both, a disabled stay
   * rendered as two disconnected pills. Which is not a dimmed version of the
   * value: it is a different value, two separate days rather than a range.
   *
   * A disabled calendar shows no selection at all, which is what a disabled
   * single calendar does too, and why the catalog's row about read-only had to
   * be corrected: disabled is not a way to display a value.
   */
  const disabled = page.locator('.bb-calendar[data-disabled]');
  await expect(disabled).toHaveCount(1);

  const fills = await disabled.evaluate(root =>
    [...root.querySelectorAll('.bb-calendar-day')]
      .filter(
        cell =>
          cell.hasAttribute('data-selection-start') ||
          cell.hasAttribute('data-selection-end') ||
          cell.hasAttribute('data-selected')
      )
      .map(cell => ({
        selected: cell.hasAttribute('data-selected'),
        bg: getComputedStyle(cell).backgroundColor
      }))
  );

  expect(fills.length, 'the base still marks the ends').toBeGreaterThan(0);
  for (const cell of fills) {
    expect(cell.selected).toBe(false);
    expect(cell.bg).toBe('rgba(0, 0, 0, 0)');
  }
});

test('a one-day range is a single shape rather than two halves', async ({
  page
}) => {
  await gotoStory(page, ONE_DAY);

  const only = page.locator('.bb-calendar-day[data-selected]');
  await expect(only).toHaveCount(1);

  const paint = await only.evaluate(cell => {
    const s = getComputedStyle(cell);
    return { radius: s.borderRadius, bg: s.backgroundColor };
  });

  /* Both logical corners land on the same cell, so it is round all over. */
  const corners = new Set(paint.radius.split(' '));
  expect(corners.size).toBe(1);
  expect([...corners][0]).not.toBe('0px');
});

test("today's ring clears the floor on all three of its backgrounds", async ({
  page
}) => {
  const seen: Array<{ where: string; ring: string; behind: string }> = [];

  for (const story of [OVERVIEW, ONE_DAY, STATES, TOGETHER]) {
    await gotoStory(page, story);
    seen.push(
      ...(await page.evaluate(() => {
        const out: Array<{ where: string; ring: string; behind: string }> = [];
        for (const cell of document.querySelectorAll('.bb-calendar-today')) {
          const s = getComputedStyle(cell);
          const ring = /[a-z]+\([^)]+\)(?=[^,]*inset)/.exec(s.boxShadow);
          if (ring === null) throw new Error(`no ring in: ${s.boxShadow}`);

          /*
           * What the ring actually sits on: the cell's own fill where it
           * paints one, and the resolved surface where it does not. Not the
           * page — measured, the ring inside an accent fill compared against
           * `--bb-surface` reads 1.03:1 and means nothing.
           */
          let behind = s.backgroundColor;
          if (behind === 'rgba(0, 0, 0, 0)' || behind === 'transparent') {
            const probe = document.createElement('div');
            probe.style.backgroundColor = 'var(--bb-surface)';
            cell.append(probe);
            behind = getComputedStyle(probe).backgroundColor;
            probe.remove();
          }

          out.push({
            where:
              cell.hasAttribute('data-selection-start') ||
              cell.hasAttribute('data-selection-end')
                ? 'an end'
                : cell.hasAttribute('data-selected')
                  ? 'the band'
                  : 'the surface',
            ring: ring[0],
            behind
          });
        }
        return out;
      }))
    );
  }

  /*
   * ALL THREE BACKGROUNDS ON SCREEN, asserted before the ratios. The band is
   * the one that was wrong — `data-selected` covers every day of a range, so
   * a rule written for the solid accent painted the ring white on pale blue at
   * 1.12:1 — and a story that stopped showing it would leave this check
   * measuring only the two that were always right.
   */
  for (const where of ['an end', 'the band', 'the surface'])
    expect(
      seen.filter(one => one.where === where).length,
      `no ring measured on ${where}`
    ).toBeGreaterThan(0);

  for (const one of seen) {
    const ratio = await contrast(page, one.ring, one.behind);
    expect(
      ratio,
      `${one.where}: ${one.ring} on ${one.behind} is ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(RING_FLOOR);
  }
});

test('an arrow steps one month, whichever structure is showing', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const forward = page.locator('.bb-calendar-step').last();
  const titles: string[] = [(await shape(page)).title];
  await forward.click();
  titles.push((await shape(page)).title);
  await forward.click();
  titles.push((await shape(page)).title);

  /*
   * `pageBehavior` defaults to advancing by the WHOLE visible duration, which
   * would move two months here and one in a narrow panel: the same press
   * meaning two different things depending on the width. So it is set to
   * single, and this is the check that says so — September–October becomes
   * October–November rather than November–December.
   */
  expect(titles[1]).toContain('October');
  expect(titles[1]).toContain('November');
  expect(titles[2]).toContain('November');
  expect(titles[2]).toContain('December');
});

test('the limits switch off the months and years with nothing in them', async ({
  page
}) => {
  await gotoStory(page, LIMITS);

  const title = page.locator('.bb-calendar-title');
  await title.click();

  const months = page.locator('.bb-calendar-period');
  await expect(months).toHaveCount(12);

  /* September and October only, so ten of the twelve are off. */
  const off = await months.evaluateAll(
    items => items.filter(item => item.hasAttribute('data-disabled')).length
  );
  expect(off).toBe(10);
});

test('in Arabic the months read from the right and the range follows', async ({
  page
}) => {
  await gotoStory(page, RTL);

  const grids = page.locator('.bb-calendar-grid');
  await expect(grids).toHaveCount(2);

  const boxes = await grids.evaluateAll(list =>
    list.map(grid => Math.round(grid.getBoundingClientRect().x))
  );
  /* The first month is to the RIGHT of the second one. */
  expect(boxes[0]!).toBeGreaterThan(boxes[1]!);

  /*
   * And the range's corners follow the direction on their own, because they
   * are logical: the start is rounded on the side a reader arrives at first,
   * which in Arabic is the right.
   */
  const radii = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.bb-calendar-day')].filter(
      cell => cell.hasAttribute('data-selection-start')
    );
    return getComputedStyle(cells[0]!).borderRadius;
  });
  /* `8px 0 0 8px` in a left-to-right calendar; the other way round here. */
  expect(radii).toBe('0px 8px 8px 0px');
});

test('a day cell clears the minimum target, at both densities', async ({
  page
}) => {
  await gotoStory(page, TOGETHER);

  const measured = await page.locator('.bb-calendar-day').evaluateAll(days =>
    days.map(day => {
      const box = day.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        floor: Number.parseFloat(
          getComputedStyle(day).getPropertyValue('--bb-control-hit-area')
        )
      };
    })
  );

  expect(measured.length).toBeGreaterThan(100);
  for (const cell of measured) {
    expect(cell.floor).toBeGreaterThan(0);
    expect(cell.width).toBeGreaterThanOrEqual(cell.floor - 0.5);
    expect(cell.height).toBeGreaterThanOrEqual(cell.floor - 0.5);
  }
});

test('nothing overflows sideways in a 320px container', async ({ page }) => {
  await gotoStory(page, STRUCTURES);

  const narrow = page.locator('.catalog-panel').first();
  const overflow = await narrow.evaluate(panel => {
    const bounds = panel.getBoundingClientRect();
    return [...panel.querySelectorAll('*')]
      .map(child => child.getBoundingClientRect())
      .filter(box => box.width > 0)
      .map(box => Math.round((box.right - bounds.right) * 100) / 100)
      .filter(over => over > 0.5);
  });

  expect(overflow, `${overflow.length} elements past the edge`).toEqual([]);
});

test('the keyboard walks the grid and sets both ends', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  /* Into the story, past the catalog's own resizable fixture. */
  await page.keyboard.press('Tab');
  await expect(page.locator('.catalog-resizable')).toBeFocused();

  const focused = () =>
    page.evaluate(() => document.activeElement?.textContent ?? '');

  /* Onto the grid, which the base focuses on the range's own start. */
  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press('Tab');
    const where = await page.evaluate(() =>
      document.activeElement?.className.includes('bb-calendar-day')
    );
    if (where === true) break;
  }

  const from = await focused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const to = await focused();
  await page.keyboard.press('Enter');

  expect(from).not.toBe(to);

  const chosen = (await shape(page)).chosen;
  expect(chosen[0]).toBe(from);
  expect(chosen.at(-1)).toBe(to);
});
