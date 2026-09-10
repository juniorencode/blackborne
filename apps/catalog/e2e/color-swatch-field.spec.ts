/*
 * A colour chosen from a closed palette, and what only a browser answers.
 *
 * THE ARROWS MOVE IN TWO DIMENSIONS, and they have to agree with a layout this
 * component chose: the base navigates a grid by the swatches' RECTANGLES and
 * the swatches are laid out by a wrapping flex row, so "the one below" is a
 * geometric answer that jsdom has no geometry for. THE TWO MARKS, which are
 * two mechanisms on purpose — and the check for them is what found that the
 * first version drew both in the same colour. THE TARGET, at both densities.
 * And WHERE THE PALETTE WRAPS, which is the reason there is no column count.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-colorswatchfield--overview';
const STATES = 'components-colorswatchfield--states';
const RINGS = 'components-colorswatchfield--rings';
const WRAPPING = 'components-colorswatchfield--wrapping';
const RTL = 'components-colorswatchfield--direction';
const COMPACT = 'components-colorswatchfield--compact';

/** The swatches of the first palette on the page, with their boxes. */
const swatches = (page: import('@playwright/test').Page) =>
  page
    .locator('.bb-color-swatch-field-palette')
    .first()
    .evaluate(palette =>
      [...palette.querySelectorAll('.bb-color-swatch')].map(one => {
        const box = one.getBoundingClientRect();
        const styles = getComputedStyle(one);
        return {
          key: one.getAttribute('data-key'),
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
          outline: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
          selected: one.getAttribute('aria-selected') === 'true'
        };
      })
    );

test('the string that crosses back is the one the palette declared', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const readout = page.locator('.catalog-label').last();
  await expect(readout).toHaveText('Nothing chosen');

  await page.locator('.bb-color-swatch').first().click();

  /*
   * DECISION 0024'S EXCEPTION, END TO END AND IN A REAL BROWSER. The palette
   * declares `#3e63dd`; the base reports a `Color` object, and `toString()` on
   * it would have given `rgba(62, 99, 221, 1)` — measured, and the whole table
   * in that decision. What a consumer gets is their own string, in their own
   * case and their own notation, because the answer was one of the inputs.
   */
  await expect(readout).toHaveText('Value: #3e63dd');
});

test('a swatch is square and clears the minimum target', async ({ page }) => {
  await gotoStory(page, STATES);

  const found = await swatches(page);

  /*
   * A SWATCH IS ITS OWN TARGET rather than a decoration beside one, so it is
   * the hit area itself: 28px, and 24px at compact, which the check below
   * measures. `w-hit` does not exist in the theme — the trap `Avatar` paid for
   * — so the width comes from `aspect-square`, and this is where a box with a
   * height and no width would have shown up.
   */
  expect(found.length).toBeGreaterThan(2);
  for (const one of found) {
    expect(one.height).toBeGreaterThanOrEqual(28);
    expect(one.width).toBe(one.height);
  }
});

test('and compact trims it without going under the floor', async ({ page }) => {
  await gotoStory(page, COMPACT);

  const perDensity = await page.locator('.catalog-panel').evaluateAll(panels =>
    panels.map(panel => {
      const box = panel
        .querySelector('.bb-color-swatch')!
        .getBoundingClientRect();
      return {
        density: panel.getAttribute('data-bb-density'),
        size: Math.round(box.height)
      };
    })
  );

  /* 24px is the minimum at every density, and compact is where it is tested. */
  expect(perDensity[0]?.size).toBe(28);
  expect(perDensity[1]?.size).toBe(24);
});

test('the chosen swatch is ringed from outside, and the colour is untouched', async ({
  page
}) => {
  await gotoStory(page, RINGS);

  const found = await swatches(page);
  const chosen = found.filter(one => one.selected);

  expect(chosen).toHaveLength(1);

  /*
   * NOTHING IS DRAWN INSIDE A SWATCH, EVER. The colour is the consumer's, and
   * a mark on top of it would be white on pale half the time — measured on a
   * calendar at 1.12:1, which is the defect this design exists to avoid. So
   * the chosen mark is an OUTLINE at an offset, and the swatch's own box is
   * unchanged by being chosen.
   */
  expect(chosen[0]?.outlineWidth).toBe('2px');
  expect(chosen[0]?.outline).not.toBe('rgba(0, 0, 0, 0)');

  const others = found.filter(one => !one.selected);
  for (const one of others) {
    expect(one.outline).toBe('rgba(0, 0, 0, 0)');
    /* And the geometry is identical either way, so nothing moves. */
    expect(one.width).toBe(chosen[0]?.width);
  }

  /*
   * AND THE OUTLINE IS OUTSIDE THE BOX, which is what `outline-offset` means
   * and what keeps the swatch's colour nowhere near it: an outline takes no
   * room in layout, so a chosen swatch sits exactly where an unchosen one
   * would.
   */
  const offset = await page
    .locator('.bb-color-swatch[aria-selected=true]')
    .first()
    .evaluate(one => getComputedStyle(one).outlineOffset);

  expect(offset).toBe('2px');
});

test('and the two marks are two mechanisms, so they compose', async ({
  page
}) => {
  await gotoStory(page, RINGS);

  const rows = await page
    .locator('.bb-color-swatch-field')
    .evaluateAll(fields =>
      fields.slice(0, 3).map(field => {
        const marked = [...field.querySelectorAll('.bb-color-swatch')].map(
          one => {
            const styles = getComputedStyle(one);
            return {
              selected: one.getAttribute('aria-selected') === 'true',
              focused: one.hasAttribute('data-focus-visible'),
              outline: styles.outlineColor,
              border: styles.borderTopColor,
              halo: styles.boxShadow
            };
          }
        );
        return {
          label: field.querySelector('span')?.textContent,
          rest: marked.find(one => !one.selected && !one.focused),
          marked: marked.filter(one => one.selected || one.focused)
        };
      })
    );

  const [chosenOnly, focusedOnly, both] = rows;

  /*
   * THE DEFECT THIS REPLACED. Both marks were an offset outline, and the focus
   * one took `--bb-focus-ring` — which is the accent, the same colour — so a
   * focused swatch was indistinguishable from a chosen one and the check that
   * found it was this one asking for two different colours.
   *
   * Doc 06 §3.1 has the answer and it was there all along: a BOX rings with a
   * border in the ring colour plus a halo, and the offset outline belongs to a
   * run of text. Two mechanisms, so they compose instead of overwriting each
   * other.
   */
  const chosen = chosenOnly?.marked[0];
  expect(chosen?.outline).not.toBe('rgba(0, 0, 0, 0)');
  expect(chosen?.border).toBe(chosenOnly?.rest?.border);
  expect(chosen?.halo).toBe(chosenOnly?.rest?.halo);

  const focused = focusedOnly?.marked[0];
  expect(focused?.outline).toBe('rgba(0, 0, 0, 0)');
  expect(focused?.border).not.toBe(focusedOnly?.rest?.border);
  expect(focused?.halo).not.toBe(focusedOnly?.rest?.halo);

  /*
   * AND ONE SWATCH CARRYING BOTH shows both, which is the point of them being
   * different mechanisms: the outline says which colour is chosen and the
   * border says where the keyboard is.
   */
  const together = both?.marked.find(one => one.focused && one.selected);
  expect(together?.outline).toBe(chosen?.outline);
  expect(together?.border).toBe(focused?.border);
  expect(together?.halo).toBe(focused?.halo);
});

test('the arrows move by what is drawn, not by index', async ({ page }) => {
  await gotoStory(page, WRAPPING);

  /*
   * THE NARROW PALETTE, because the wide one does not wrap at all: eight
   * swatches of 28px with 4px between them are 252px, which fits in 320px.
   * The first version of this check read the wide one and asked it for two
   * rows.
   */
  const palette = page.locator('.bb-color-swatch-field-palette').nth(1);
  await palette.locator('.bb-color-swatch').first().click();

  const positions = await palette.evaluate(one =>
    [...one.querySelectorAll('.bb-color-swatch')].map(swatch => {
      const box = swatch.getBoundingClientRect();
      return { x: Math.round(box.x), y: Math.round(box.y) };
    })
  );
  const rows = new Set(positions.map(one => one.y));

  /*
   * THE CHECK THIS COMPONENT'S LAYOUT NEEDS. The base's `layout="grid"`
   * navigates by the swatches' RECTANGLES, and the swatches are laid out by a
   * wrapping flex row that this component chose — so "the one below" is a
   * geometric answer, and the two mechanisms have to agree. A palette that
   * wrapped visually while the arrows walked a single line would be two
   * different lists.
   */
  expect(rows.size).toBeGreaterThan(1);

  await page.keyboard.press('ArrowDown');

  const after = await page.evaluate(() => {
    const active = document.activeElement;
    const box = active?.getBoundingClientRect();
    return {
      key: active?.getAttribute('data-key'),
      x: Math.round(box?.x ?? 0),
      y: Math.round(box?.y ?? 0)
    };
  });

  /* Down means down: the same column, one drawn row lower. */
  expect(after.y).toBeGreaterThan(positions[0]!.y);
  expect(Math.abs(after.x - positions[0]!.x)).toBeLessThan(4);
});

test('the palette wraps rather than overflowing', async ({ page }) => {
  await gotoStory(page, WRAPPING);

  const perWidth = await page
    .locator('.bb-color-swatch-field-palette')
    .evaluateAll(palettes =>
      palettes.map(palette => {
        const rows = new Set(
          [...palette.querySelectorAll('.bb-color-swatch')].map(one =>
            Math.round(one.getBoundingClientRect().y)
          )
        );
        return {
          rows: rows.size,
          overflow: palette.scrollWidth - palette.clientWidth
        };
      })
    );

  /*
   * NO COLUMN COUNT ANYWHERE, which is the reason this is N0: however many fit
   * is the answer, so a narrower container gets more rows rather than a
   * scrollbar or a clipped palette. A declared number of columns is a number a
   * narrower container makes wrong.
   */
  expect(perWidth).toHaveLength(2);
  expect(perWidth[1]!.rows).toBeGreaterThan(perWidth[0]!.rows);
  for (const one of perWidth) expect(one.overflow).toBe(0);
});

test('the colour is painted, and the swatch is what a pointer hits', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const swatch = page.locator('.bb-color-swatch').first();
  const box = (await swatch.boundingBox())!;

  const seen = await page.evaluate(
    ([x, y]) => {
      const at = document.elementFromPoint(x!, y!);
      return {
        painted: at === null ? null : getComputedStyle(at).backgroundColor,
        isSwatch: at?.closest('.bb-color-swatch') !== null
      };
    },
    [box.x + box.width / 2, box.y + box.height / 2] as const
  );

  /*
   * A COMPUTED STYLE IS NOT PAINT, and the colour here is written inline by
   * the base rather than by a class — so this is the assertion that the value
   * reached the screen at all, taken at the middle of the swatch where a
   * pointer would land.
   */
  expect(seen.isSwatch).toBe(true);
  expect(seen.painted).toBe('rgb(62, 99, 221)');
});

test('every swatch is named, by the platform', async ({ page }) => {
  await gotoStory(page, STATES);

  const named = await page
    .locator('.bb-color-swatch-field-palette')
    .first()
    .ariaSnapshot();

  /*
   * READ FROM THE TREE. The names are the platform's own colour vocabulary,
   * localised by the base rather than by this library's dictionary (doc 05
   * §2.3) — so what is asserted is that every option HAS a name and that the
   * role description is there, not what the words are. A check that spelled
   * them out would be asserting a browser's colour names.
   */
  expect(named).toContain('listbox');
  const options = named.split('\n').filter(line => line.includes('- option'));

  expect(options).toHaveLength(3);
  for (const line of options) expect(line).toMatch(/- option "[^"]+"/);
});

test('in Arabic the palette reads from the right', async ({ page }) => {
  await gotoStory(page, RTL);

  const found = await swatches(page);

  /*
   * A wrapping flex row flips on its own — nothing here is a physical
   * direction. The first declared colour is the rightmost one.
   */
  expect(found[0]!.x).toBeGreaterThan(found.at(-1)!.x);
});

test('a disabled palette cannot be chosen from', async ({ page }) => {
  await gotoStory(page, STATES);

  const disabled = page.locator('.bb-color-swatch-field').nth(4);
  const swatch = disabled.locator('.bb-color-swatch').nth(2);

  const before = await disabled
    .locator('.bb-color-swatch[aria-selected=true]')
    .getAttribute('data-key');

  await swatch.click({ force: true });

  expect(
    await disabled
      .locator('.bb-color-swatch[aria-selected=true]')
      .getAttribute('data-key')
  ).toBe(before);
});
