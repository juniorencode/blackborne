/*
 * The table, in a browser, for the five things jsdom cannot answer.
 *
 * Where the heading row is after the body scrolls. Whether the component
 * encloses its own horizontal scrolling without the page scrolling with it
 * (doc 04 §7). Whether the focus ring is a real outline or an
 * `outline-hidden` that cancelled it. What a screen reader is given for a row.
 * And whether the sort mark turns rather than appearing, which is a layout
 * question the unit tests are forbidden from asking with a class assertion.
 *
 * Deliberately absent: anything that tests the base. The grid keyboard, the
 * sort descriptor and the announcement come from `react-aria-components`.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-table--overview';
const SORTABLE = 'components-table--sortable';
const TOO_WIDE = 'components-table--too-wide';
const SCROLLS_DOWN = 'components-table--scrolls-down';
const ABSENCES = 'components-table--absences';
const PINNED = 'components-table--pinned';

test('the heading row stays put while the body scrolls', async ({ page }) => {
  await gotoStory(page, SCROLLS_DOWN);

  const heading = page.getByRole('columnheader', { name: /Number/ }).first();
  /*
   * THE COMPONENT'S OWN SCROLLER, and that is the finding rather than a
   * selector detail. `overflow-x: auto` makes it a scroll container in both
   * axes, so a height-constrained table is constrained on this element. The
   * first version of this check scrolled a WRAPPER with its own `overflow-y`,
   * which scrolled the wrapper and left the heading stuck to a scroller that
   * had not moved — and read as sticky being broken.
   */
  const scroller = page.locator('.bb-table-scroller');

  const before = await heading.boundingBox();
  expect(before?.y).toBeGreaterThan(0);

  /*
   * Scrolled as a STATE rather than waited for: the assertion below is what
   * says the scroll happened, so a scroll that never lands fails here rather
   * than making the sticky check pass for nothing (doc 10 §11.1.1).
   */
  const moved = await scroller.evaluate(element => {
    element.scrollTop = 400;
    return element.scrollTop;
  });
  expect(moved).toBeGreaterThan(100);

  const after = await heading.boundingBox();
  expect(
    Math.abs((before?.y ?? 0) - (after?.y ?? 0)),
    'the heading row moved with the body, so it is not sticky against the scroller'
  ).toBeLessThan(2);
});

test('a table too wide for its container scrolls itself, and the page does not', async ({
  page
}) => {
  await gotoStory(page, TOO_WIDE);

  const scroller = page.locator('.bb-table-scroller');

  const enclosed = await scroller.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
  }));
  expect(
    enclosed.scrollWidth,
    'this story exists to overflow; if it fits, it is measuring nothing'
  ).toBeGreaterThan(enclosed.clientWidth + 8);

  /*
   * Doc 04 §7's promise is that the consumer's page never scrolls sideways
   * BECAUSE OF US, and the first version of this asserted it on the document.
   * That was measuring the fixture: the catalog's own `.catalog-resizable`
   * decorator is 1274px inside a 1280px viewport at a 16px offset, so the
   * document overflows by 10px on every story in the suite and has nothing to
   * do with this component (doc 10 §11).
   *
   * What is ours is that the overflow is ENCLOSED: the scroller is no wider
   * than the element it was given, whatever its content does.
   */
  const enclosure = await scroller.evaluate(element => {
    const parent = element.parentElement;
    return {
      own: element.getBoundingClientRect().width,
      given: parent?.getBoundingClientRect().width ?? 0
    };
  });
  expect(
    enclosure.own,
    'the table widened the element it was given, so the page around it scrolls'
  ).toBeLessThanOrEqual(enclosure.given + 1);
});

test('and the keyboard reaches what the overflow hides', async ({ page }) => {
  await gotoStory(page, TOO_WIDE);

  const scroller = page.locator('.bb-table-scroller');
  expect(await scroller.evaluate(element => element.scrollLeft)).toBe(0);

  await page
    .getByRole('columnheader', { name: /Number/ })
    .first()
    .click();
  for (let step = 0; step < 5; step++) await page.keyboard.press('ArrowRight');

  /* A STATE, polled: the scroll follows focus asynchronously. */
  await expect
    .poll(() => scroller.evaluate(element => element.scrollLeft))
    .toBeGreaterThan(0);
});

test('the focus ring is a real outline and not a cancelled one', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  await page
    .getByRole('columnheader', { name: /Number/ })
    .first()
    .click();
  await page.keyboard.press('ArrowDown');

  const ring = await page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return null;
    const style = getComputedStyle(active);
    return {
      tag: active.tagName,
      width: style.outlineWidth,
      style: style.outlineStyle
    };
  });

  /*
   * `outline-hidden` sets `outline-style: none` and beats an `outline-2`
   * beside it — measured on `ColorSwatchField`, where three swatches on a row
   * labelled "Chosen" drew no ring at all. This is the assertion that would
   * have caught it.
   */
  expect(ring?.style, 'the outline was cancelled rather than drawn').not.toBe(
    'none'
  );
  expect(Number.parseFloat(ring?.width ?? '0')).toBeGreaterThan(0);
});

test('a row is named by the column that identifies it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const row = page.getByRole('row').nth(1);
  const named = await row.evaluate(element =>
    (element.getAttribute('aria-labelledby') ?? '').trim()
  );

  /*
   * NON-EMPTY, which is the whole finding. The base renders
   * `aria-labelledby=""` on a row with no row header rather than omitting the
   * attribute, so a check for the attribute's presence is satisfied by the
   * broken case. Measured in wave 0 and refined in wave 1.
   */
  expect(
    named,
    'the row carries an empty aria-labelledby, so it has no name'
  ).not.toBe('');

  const snapshot = await row.ariaSnapshot();
  expect(snapshot).toContain('F001-000412');
});

test('the sort mark turns rather than appearing', async ({ page }) => {
  await gotoStory(page, SORTABLE);

  const mark = page
    .getByRole('columnheader', { name: /Customer/ })
    .locator('.bb-table-sort');

  /*
   * The box is there before anything is sorted, which is the point: a mark
   * that appears widens the heading and shifts the whole row the first time
   * anybody sorts. So its WIDTH is asserted while it is invisible.
   */
  const resting = await mark.boundingBox();
  expect(resting?.width ?? 0).toBeGreaterThan(0);
  expect(
    Number.parseFloat(
      await mark.evaluate(element => getComputedStyle(element).opacity)
    )
  ).toBeLessThan(0.5);

  await page.getByRole('columnheader', { name: /Customer/ }).click();

  await expect
    .poll(() =>
      mark.evaluate(element =>
        Number.parseFloat(getComputedStyle(element).opacity)
      )
    )
    .toBeGreaterThan(0.5);

  const sorted = await mark.boundingBox();
  expect(
    Math.abs((resting?.width ?? 0) - (sorted?.width ?? 0)),
    'the heading changed width when it became the sorted one'
  ).toBeLessThan(1);
});

test('the three absences fill the table rather than sitting beside it', async ({
  page
}) => {
  await gotoStory(page, ABSENCES);

  for (const text of [
    'Nothing here yet',
    'No invoices match',
    'The request timed out before the invoices arrived.'
  ]) {
    const absence = page.getByText(text, { exact: false }).first();
    await expect(absence).toBeVisible();

    const inside = await absence.evaluate(element => {
      const cell = element.closest('td, th');
      const table = element.closest('table');
      if (!cell || !table) return null;
      return {
        cellWidth: cell.getBoundingClientRect().width,
        tableWidth: table.getBoundingClientRect().width
      };
    });

    expect(inside, `"${text}" is not inside a table cell`).not.toBeNull();
    expect(
      inside?.cellWidth ?? 0,
      `"${text}" does not span the table, so the columns show through it`
    ).toBeGreaterThan((inside?.tableWidth ?? 0) - 4);
  }

  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});

/*
 * THE TWO THINGS WAVE 0 MEASURED IN THE ABSTRACT, asserted on the component
 * that now depends on them. That wave built a page by hand to answer a CSS
 * question; this is the same question asked of the real thing.
 */
test('a resizable table still fills its container', async ({ page }) => {
  await gotoStory(page, 'components-table--resizing');

  const measured = await page.locator('.bb-table-scroller').evaluate(el => ({
    /*
     * THE CONTENT BOX, and the change from `getBoundingClientRect().width - 2`
     * is a tightening rather than a loosening. `min-width: 100%` resolves
     * against the scroller's content box, so that is what the table has to
     * match; the old threshold subtracted an approximation of the scroller's
     * own border and then demanded STRICTLY more, which only ever passed
     * because the rows carried a three-pixel border nobody had declared. Fix
     * that accident and a table filling its container exactly is a failure —
     * which is what happened, and what the number below is calibrated on now.
     */
    container: el.clientWidth,
    table: (el.querySelector('table') as HTMLElement).getBoundingClientRect()
      .width,
    inline: el.querySelector('table')?.getAttribute('style') ?? ''
  }));

  /* The inline style the base merges in is what makes this worth asserting:
     without `min-width: 100%` the table shrink-wraps and leaves the container
     part-empty, and no class beats an inline `width`. */
  expect(measured.inline).toContain('min-content');
  expect(
    measured.table,
    'the table shrink-wrapped inside its container instead of filling it'
  ).toBeGreaterThanOrEqual(measured.container);
});

test('and the grip is visible, reachable, and moves the column', async ({
  page
}) => {
  await gotoStory(page, 'components-table--resizing');

  /*
   * THE GRIP HAS A BOX, which is the defect this check exists for. The base's
   * resizer is a visually hidden `input[type=range]` — 1×1, clipped — and the
   * handle a person sees is ours. The first version of it asked for
   * `inset-block-0`, which is a CSS property name rather than a Tailwind
   * utility, so it compiled to nothing and the grip came out 12 pixels wide
   * and ZERO tall: present in the DOM, reachable by keyboard, and invisible.
   */
  const grip = page
    .locator('.bb-table-scroller th div[class*="absolute"]')
    .first();
  const box = await grip.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(4);
  expect(
    box?.height ?? 0,
    'the grip has no height, so nobody can see or grab it'
  ).toBeGreaterThan(8);

  /*
   * And it is not a control only a pointer can reach, which doc 06 §4 rule 5
   * forbids outright. Whether the ARROWS then resize is the base's business
   * and is not asserted here — this repository does not test React Aria.
   */
  const slider = page.getByRole('slider').first();
  await expect(slider).toHaveCount(1);
  expect(await slider.getAttribute('tabindex')).not.toBe('-1');
  expect(await slider.getAttribute('aria-valuetext')).toMatch(/pixel/i);

  /*
   * HOW the keyboard reaches it is the base's, through the grid's own
   * navigation, and measured here rather than assumed: a direct `.focus()` on
   * the input lands on the ROW instead, because the table manages focus and
   * `keyboardNavigationBehavior` decides how a control inside a cell is
   * reached. Asserting the arrows then resize would be testing React Aria,
   * which this repository does not do.
   */

  /* And a drag moves the column, with its neighbours closing up. */
  const widths = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.bb-table-scroller th')].map(cell =>
        Math.round(cell.getBoundingClientRect().width)
      )
    );
  const before = await widths();

  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) / 2 + 80,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
    { steps: 10 }
  );
  await page.mouse.up();

  const after = await widths();
  expect(after[0] ?? 0).toBeGreaterThan(before[0] ?? 0);
  expect(
    after.reduce((sum, width) => sum + width, 0),
    'the table changed width instead of redistributing inside it'
  ).toBeCloseTo(
    before.reduce((sum, width) => sum + width, 0),
    -1
  );
});

/*
 * THE FOLD, which only a browser can answer: the step comes from a container
 * query, and jsdom has neither those nor a `ResizeObserver`. The unit tests
 * assert the pure half — a step and a count decide — and this asserts that the
 * step is the right one.
 */
test('a row folds its actions when the room runs out, and not before', async ({
  page
}) => {
  await gotoStory(page, 'components-table--actions');

  const panels = page.locator('.bb-table-scroller');
  await expect(panels).toHaveCount(3);

  /* Wide enough: every action is its own button, named by what it does. */
  const roomy = panels.nth(0);
  await expect(
    roomy.getByRole('button', { name: 'Edit' }).first()
  ).toBeVisible();
  await expect(roomy.locator('tbody button')).toHaveCount(6);

  /* Narrow: one trigger per row, named by the ROW rather than by "More" —
     forty rows of buttons all called the same thing is a list of forty
     identical things. */
  const tight = panels.nth(1);
  await expect(tight.locator('tbody button')).toHaveCount(2);
  await expect(
    tight.getByRole('button', { name: /Invoice F001-000412/ })
  ).toBeVisible();

  /*
   * AND ONE ACTION NEVER FOLDS, at the same width. Doc 04 §11.2: hiding a
   * single thing replaces something you can read with something you have to
   * open. This panel is the control that makes the one above it mean
   * something — without it, "there is one button" is true of both.
   */
  const single = panels.nth(2);
  await expect(single.locator('tbody button')).toHaveCount(2);
  await expect(
    single.getByRole('button', { name: 'Edit' }).first()
  ).toBeVisible();
});

test('and the folded menu still offers every action', async ({ page }) => {
  await gotoStory(page, 'components-table--actions');

  const tight = page.locator('.bb-table-scroller').nth(1);
  await tight.getByRole('button', { name: /Invoice F001-000412/ }).click();

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem')).toHaveCount(3);
  await expect(menu.getByRole('menuitem', { name: /Delete/ })).toBeVisible();
});

/* ─────────────────────── the column that stays put ──────────────────────── */

/*
 * WHAT ONLY A BROWSER ANSWERS HERE. Whether a sticky cell is actually held
 * while its neighbours pass beneath it, whether it is OPAQUE to them, whether
 * the corner where two sticky axes cross is on top of both, and whether the
 * overflow indication survives being covered by the column that now sits on
 * it. None of that exists in jsdom, which has no layout, no sticky positioning
 * and no scroll.
 *
 * Not tested here: that `position: sticky` works. That is the engine.
 */

test('the pinned column is held while the rest pass beneath it', async ({
  page
}) => {
  await gotoStory(page, PINNED);

  const scroller = page.locator('.bb-table-scroller').first();
  const before = await scroller.evaluate(el => {
    const pinned = el.querySelector('tbody tr td:last-child')!;
    const first = el.querySelector('tbody tr td')!;
    return {
      pinnedEnd: Math.round(
        el.getBoundingClientRect().right - pinned.getBoundingClientRect().right
      ),
      firstLeft: Math.round(first.getBoundingClientRect().left)
    };
  });

  await scroller.evaluate(el => {
    el.scrollLeft = 60;
  });

  const after = await scroller.evaluate(el => {
    const pinned = el.querySelector('tbody tr td:last-child')!;
    const first = el.querySelector('tbody tr td')!;
    return {
      pinnedEnd: Math.round(
        el.getBoundingClientRect().right - pinned.getBoundingClientRect().right
      ),
      firstLeft: Math.round(first.getBoundingClientRect().left),
      scrolled: Math.round(el.scrollLeft)
    };
  });

  /*
   * BOTH HALVES IN ONE TEST, which is doc 10 §11.1.1's rule. "The pinned cell
   * did not move" is true of a table that never scrolled, so the companion
   * assertion — an ordinary cell DID move, by the amount asked for — has to be
   * beside it rather than in a neighbouring test.
   */
  expect(after.scrolled).toBe(60);
  expect(before.firstLeft - after.firstLeft).toBe(60);
  expect(after.pinnedEnd).toBe(before.pinnedEnd);
});

test('and it is opaque and on top, so nothing passes through it', async ({
  page
}) => {
  await gotoStory(page, PINNED);

  const scroller = page.locator('.bb-table-scroller').first();
  await scroller.evaluate(el => {
    el.scrollLeft = 60;
  });

  /*
   * TWO MECHANISMS, because each one passes on the defect the other catches,
   * and that was measured rather than assumed while exercising this check.
   *
   * `elementFromPoint` answers about STACKING. A sticky cell is positioned, so
   * it wins the hit test whether or not it has a background — the check read
   * `true` with the background forced to `transparent`, which is the exact
   * defect it was written for. On its own it would have been a check passing
   * for the wrong reason.
   *
   * The alpha answers about PAINT, and it is read as a used value rather than
   * as a declaration: a background whose `var()` resolved to nothing computes
   * to `rgba(0, 0, 0, 0)` and is caught here too. The first version of this
   * component had no background at all and looked pinned — measured in pixels,
   * it carried 173 of another column's inked pixels against 199 of its own.
   */
  const read = await scroller.evaluate(el => {
    const pinned = el.querySelector('tbody tr td:last-child')!;
    const box = pinned.getBoundingClientRect();
    const at = document.elementFromPoint(
      box.left + 3,
      box.top + box.height / 2
    );
    const colour = getComputedStyle(pinned).backgroundColor;
    const alpha = /rgba?\(([^)]*)\)/.exec(colour)?.[1]?.split(',')[3];
    return {
      onTop: at === pinned || pinned.contains(at),
      colour,
      alpha: alpha === undefined ? 1 : Number(alpha.trim())
    };
  });

  expect(read.onTop, 'the pinned cell is not the thing on top').toBe(true);
  expect(read.alpha, `the pinned cell is see-through: ${read.colour}`).toBe(1);
});

test('the corner where the two sticky axes cross is above both', async ({
  page
}) => {
  await gotoStory(page, PINNED);

  const held = await page
    .locator('.bb-table-scroller')
    .first()
    .evaluate(el => {
      el.style.maxHeight = '150px';
      el.scrollLeft = 60;
      el.scrollTop = 120;
      const corner = el.querySelector('thead tr > *:last-child')!;
      const box = corner.getBoundingClientRect();
      const own = el.getBoundingClientRect();
      const at = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2
      );
      return {
        fromTop: Math.round(box.top - own.top),
        fromEnd: Math.round(own.right - box.right),
        isTheCorner: at === corner || corner.contains(at)
      };
    });

  /*
   * One element, two axes. The heading is already sticky in the block axis and
   * the pinned column in the inline one, so the cell where they meet is stuck
   * in both — and it has to be painted OVER the heading beside it and the
   * pinned cells beneath it, which is a z-index the stylesheet states rather
   * than leaves to source order.
   */
  expect(held.fromTop).toBeLessThanOrEqual(2);
  expect(held.fromEnd).toBeLessThanOrEqual(2);
  expect(held.isTheCorner).toBe(true);
});

test('the overflow indication moves inward by the pinned column', async ({
  page
}) => {
  await gotoStory(page, PINNED);

  const read = await page
    .locator('.bb-table-scroller')
    .first()
    .evaluate(el => {
      const pinned = el.querySelector('thead tr > *:last-child')!;
      return {
        published: el.style.getPropertyValue('--bb-table-pin'),
        measured: `${String(Math.round(pinned.getBoundingClientRect().width))}px`,
        positions: getComputedStyle(el).backgroundPosition
      };
    });

  /*
   * OUR SIDE OF THE NUMBER, which is doc 10 §11.1's test: change what this
   * library decides and the reading changes. The width is published by us and
   * the four layers are ours; that `background-attachment` covers and uncovers
   * them is the engine's and is not asserted.
   *
   * A pinned column that published nothing would leave the pair at the edge,
   * underneath itself, and doc 04 §7's indication would be gone with nothing
   * in the console — so the assertion is that the published number IS the
   * column's width rather than merely present.
   */
  expect(read.published).toBe(read.measured);
  expect(read.published).not.toBe('0px');
  expect(read.positions.split(', ')).toEqual([
    '0px 0px',
    `calc(100% - ${read.measured}) 0px`,
    '0px 0px',
    `calc(100% - ${read.measured}) 0px`
  ]);
});

test('a chosen row keeps its colour across the pinned cell', async ({
  page
}) => {
  await gotoStory(page, PINNED);

  /*
   * The row publishes its colour and the pinned cell stacks it over an opaque
   * base, so the two cannot drift. Asserted as an OUTCOME — the same resolved
   * colour in both places — rather than by reading the variable, because a
   * variable that resolved to nothing would still be equal to itself.
   */
  const colours = await page
    .locator('.bb-table-scroller')
    .nth(1)
    .evaluate(el => {
      const row = el.querySelector('tbody tr[data-selected]')!;
      const pinned = row.querySelector('td:last-child')!;
      return {
        row: getComputedStyle(row).backgroundColor,
        cell: getComputedStyle(pinned).backgroundImage,
        plain: getComputedStyle(
          el.querySelector('tbody tr:not([data-selected]) td:last-child')!
        ).backgroundImage
      };
    });

  expect(colours.row).not.toBe('rgba(0, 0, 0, 0)');
  expect(colours.cell).toContain(colours.row);
  expect(colours.cell).not.toBe(colours.plain);
});
