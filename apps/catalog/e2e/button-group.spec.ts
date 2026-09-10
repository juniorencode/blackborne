/*
 * A row of buttons joined into one control, and what only a browser answers.
 *
 * ONE SEAM AND NOT TWO, which is a pixel of overlap and is invisible to jsdom.
 * WHICH CORNERS ARE ROUND, in both reading directions, because the rules are
 * written in logical properties and a physical mistake there passes every
 * other check in the repository. THE APPEARANCE ACTUALLY ARRIVING, measured as
 * heights and colours rather than as class names. And THE SET STOPPING AT A
 * LAYER, which the unit tests assert through a context probe and which is
 * asserted here as the thing a person sees: a footer button that is not small.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const VARIANTS = 'components-buttongroup--variants';
const SIZES = 'components-buttongroup--sizes';
const STATES = 'components-buttongroup--states';
const RTL = 'components-buttongroup--direction';
const IN_A_LAYER = 'components-buttongroup--in-a-layer';
const COMPACT = 'components-buttongroup--compact';

test('two buttons that touch share one border', async ({ page }) => {
  await gotoStory(page, VARIANTS);

  const measured = await page
    .locator('.bb-button-group')
    .first()
    .evaluate(group => {
      const children = [...group.children];
      return children.slice(1).map((child, index) => {
        const before = children[index]!.getBoundingClientRect();
        const here = child.getBoundingClientRect();
        const styles = getComputedStyle(child);
        return {
          /* Negative means they overlap, which is the point. */
          gap: Math.round((here.x - (before.x + before.width)) * 100) / 100,
          border: styles.borderInlineStartWidth,
          startMargin: styles.marginInlineStart
        };
      });
    });

  expect(measured).toHaveLength(2);
  for (const one of measured) {
    /*
     * BOTH HALVES CARRY A BORDER, so without the pull-back the line down the
     * middle of a group is 2px where every other border in the library is 1px
     * — measured on `SplitButton` first, for the same reason and with the same
     * fix. The overlap is exactly the border's own width.
     */
    expect(one.border).toBe('1px');
    expect(one.startMargin).toBe('-1px');
    expect(one.gap).toBe(-1);
  }
});

test('the round corners are the outer ones, and they change ends in Arabic', async ({
  page
}) => {
  const corners = async (story: string) => {
    await gotoStory(page, story);
    return page
      .locator('.bb-button-group')
      .first()
      .evaluate(group => {
        const children = [...group.children];
        const read = (element: Element) => {
          const styles = getComputedStyle(element);
          return {
            /*
             * PHYSICAL properties read back deliberately. The rules are
             * written in logical ones — `border-start-start-radius` and its
             * three siblings — and reading the logical names back would agree
             * with itself in either direction, which is exactly the mistake
             * this is looking for. Physical is what a person sees.
             */
            topLeft: styles.borderTopLeftRadius,
            topRight: styles.borderTopRightRadius,
            bottomLeft: styles.borderBottomLeftRadius,
            bottomRight: styles.borderBottomRightRadius
          };
        };
        return {
          first: read(children[0]!),
          middle: read(children[1]!),
          last: read(children.at(-1)!)
        };
      });
  };

  const ltr = await corners(VARIANTS);

  /* Round on the outside of the row, square where the row continues. */
  expect(ltr.first.topLeft).not.toBe('0px');
  expect(ltr.first.bottomLeft).not.toBe('0px');
  expect(ltr.first.topRight).toBe('0px');
  expect(ltr.last.topRight).not.toBe('0px');
  expect(ltr.last.bottomRight).not.toBe('0px');
  expect(ltr.last.topLeft).toBe('0px');

  /* And nothing at all in the middle, which is where a row of two has no case. */
  expect(Object.values(ltr.middle)).toEqual(['0px', '0px', '0px', '0px']);

  const rtl = await corners(RTL);

  /*
   * AND THE WHOLE THING CHANGES HANDS. In Arabic the first step of the row is
   * the rightmost one, so its round corners are on the RIGHT — which is the
   * half a logical property gets right for free and a physical one gets wrong
   * silently, in the one language nobody testing in English would notice.
   */
  expect(rtl.first.topRight).not.toBe('0px');
  expect(rtl.first.bottomRight).not.toBe('0px');
  expect(rtl.first.topLeft).toBe('0px');
  expect(rtl.last.topLeft).not.toBe('0px');
  expect(rtl.last.topRight).toBe('0px');
});

test('in Arabic the first button is the rightmost one', async ({ page }) => {
  await gotoStory(page, RTL);

  const positions = await page
    .locator('.bb-button-group')
    .first()
    .evaluate(group =>
      [...group.children].map(child =>
        Math.round(child.getBoundingClientRect().x)
      )
    );

  expect(positions[0]!).toBeGreaterThan(positions.at(-1)!);
});

test('a group of one keeps all four corners', async ({ page }) => {
  await gotoStory(page, STATES);

  /*
   * WHY THE CORNERS ARE CLEARED AND THEN RESTORED, rather than squared per
   * position: with one child the same element is both ends of the row, so
   * `:first-child` and `:last-child` both match it and it keeps everything. A
   * rule that squared the trailing corners of "not the last one" would have
   * needed a special case here, and a group of one is what a consumer rendering
   * its actions conditionally ends up with.
   */
  const alone = await page
    .locator('.bb-button-group')
    .first()
    .evaluate(group => {
      const only = group.children[0]!;
      const styles = getComputedStyle(only);
      return {
        children: group.children.length,
        radii: [
          styles.borderTopLeftRadius,
          styles.borderTopRightRadius,
          styles.borderBottomLeftRadius,
          styles.borderBottomRightRadius
        ]
      };
    });

  expect(alone.children).toBe(1);
  for (const radius of alone.radii) expect(radius).not.toBe('0px');
});

test('the size is declared once and every button takes it', async ({
  page
}) => {
  await gotoStory(page, SIZES);

  const rows = await page.locator('.bb-button-group').evaluateAll(groups =>
    groups.map(group => ({
      heights: [...group.children].map(child =>
        Math.round(child.getBoundingClientRect().height)
      )
    }))
  );

  expect(rows).toHaveLength(3);

  /*
   * WITHIN a row every button is the same height, or the row has to be read
   * twice. ACROSS the rows the three heights are different, or the group is
   * not passing anything on — which is the failure a class-name assertion
   * would have missed, because the class would be present and resolve to
   * nothing.
   */
  const perRow = rows.map(row => {
    expect(new Set(row.heights).size).toBe(1);
    return row.heights[0]!;
  });

  expect(new Set(perRow).size).toBe(3);
  expect(perRow[0]!).toBeLessThan(perRow[1]!);
  expect(perRow[1]!).toBeLessThan(perRow[2]!);
});

test("a member's own appearance wins over the row's", async ({ page }) => {
  await gotoStory(page, STATES);

  const mixed = await page
    .locator('.bb-button-group')
    .nth(2)
    .evaluate(group =>
      [...group.children].map(child => ({
        text: child.textContent?.trim() ?? '',
        fill: getComputedStyle(child).backgroundColor
      }))
    );

  /*
   * A GROUP'S APPEARANCE IS A DEFAULT, NOT A RULE. The row is secondary and
   * the middle button asks for primary, so the fills either side of it have to
   * differ from it — a group that overrode its members would make "one primary
   * among secondaries" unwritable, which is the first thing anybody wants from
   * a row of actions.
   */
  expect(mixed).toHaveLength(3);
  expect(mixed[1]?.text).toBe('Publish');
  expect(mixed[1]?.fill).not.toBe(mixed[0]?.fill);
  expect(mixed[0]?.fill).toBe(mixed[2]?.fill);
});

test('a variant with no visible border gets a seam of its own', async ({
  page
}) => {
  await gotoStory(page, VARIANTS);

  const seams = await page.locator('.bb-button-group').evaluateAll(groups =>
    groups.slice(0, 3).map(group => {
      const second = group.children[1]!;
      const styles = getComputedStyle(second);
      return {
        variant: group.getAttribute('data-variant'),
        seam: styles.borderInlineStartColor,
        fill: styles.backgroundColor,
        text: styles.color
      };
    })
  );

  expect(seams.map(one => one.variant)).toEqual([
    'primary',
    'secondary',
    'subtle'
  ]);

  /*
   * THE WHOLE REASON `internal/seam` EXISTS. A primary button's border is the
   * same colour as its fill, so a row of them pulled together is one accent
   * blob with nothing saying where one ends and the next begins — measured on
   * `SplitButton`, which has drawn a line of its own since it shipped.
   *
   * So the seam has to differ from the fill on all three, and the variable has
   * to resolve to something: an invalid `var()` in
   * `border-inline-start-color` computes to `currentColor`, which would put
   * the TEXT colour down the middle of the row and look deliberate.
   */
  for (const one of seams) {
    expect(one.seam, `the ${one.variant} seam is its own fill`).not.toBe(
      one.fill
    );
    expect(one.seam).not.toBe('rgba(0, 0, 0, 0)');
    /*
     * AND NOT THE TEXT COLOUR, which is the specific failure the variable can
     * produce: an invalid `var()` in `border-inline-start-color` computes to
     * `currentColor`, so a mistyped or missing `--bb-seam` would put the
     * label's own colour down the middle of the row and look deliberate.
     *
     * Compared as values rather than parsed, because two of the three are
     * `color-mix` and Chrome reports those in the mixing space — measured:
     * `oklab(0.999994 0.0000455678 0.0000200868 / 0.25)`. Nothing here needs
     * the number, only that the three are different colours.
     */
    expect(one.seam).not.toBe(one.text);
  }
});

test('the focused button is the one on top', async ({ page }) => {
  await gotoStory(page, SIZES);

  const group = page.locator('.bb-button-group').first();
  await group.locator('button').first().focus();

  const stacking = await group.evaluate(root =>
    [...root.children].map(child => ({
      focused: child.hasAttribute('data-focused'),
      z: getComputedStyle(child).zIndex
    }))
  );

  /*
   * ASSERTING THE MECHANISM, because the thing itself cannot be read: the ring
   * is a border plus a 4px halo drawn as a box-shadow, the buttons overlap by
   * a pixel, and a box-shadow is not hit-tested and is not in any computed
   * value that says who painted over whom. Every button is already
   * `position: relative` for the pending spinner, so with no z-index the later
   * sibling wins and the ring of anything but the last button is cut in half.
   *
   * `button-group-focus` is the baseline that shows it. This is the half a
   * check can hold.
   */
  expect(stacking[0]?.focused).toBe(true);
  expect(stacking[0]?.z).toBe('1');
  expect(stacking[1]?.z).toBe('auto');
});

test('the row keeps its buttons the same height whatever they hold', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const rows = await page
    .locator('.bb-button-group')
    .evaluateAll(groups =>
      groups.map(group =>
        [...group.children].map(child =>
          Math.round(child.getBoundingClientRect().height)
        )
      )
    );

  /*
   * `items-stretch` on the row, and the reason is a pending button: its label
   * is hidden rather than removed and a spinner sits over it, so nothing in
   * this component's own markup would have made it taller — but a row that
   * relied on that would break the day one member holds two lines.
   */
  for (const heights of rows) expect(new Set(heights).size).toBe(1);
});

test('a layer opened from inside the row holds ordinary buttons', async ({
  page
}) => {
  await gotoStory(page, IN_A_LAYER);

  const row = page.locator('.bb-button-group');
  const small = await row
    .locator('button')
    .first()
    .evaluate(button => Math.round(button.getBoundingClientRect().height));

  await row.getByRole('button', { name: 'Filter' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const inside = await dialog
    .getByRole('button', { name: 'Apply' })
    .evaluate(button => Math.round(button.getBoundingClientRect().height));

  /*
   * A REACT CONTEXT CROSSES A PORTAL, so this popover is inside the group as
   * far as React is concerned — measured before the fix: a probe in the
   * footer read `primary/sm`. Every layer that can hold a button closes the
   * set around its content, which is one call site for four of them because
   * they share the sheet.
   *
   * Asserted as heights rather than as a context value, because a footer of
   * small primary buttons is what a person would have seen.
   */
  expect(inside).toBeGreaterThan(small);
});

test('compact density trims the row and not its type', async ({ page }) => {
  const measure = async (story: string) => {
    await gotoStory(page, story);
    return page
      .locator('.bb-button-group')
      .first()
      .evaluate(group => {
        const first = group.children[0]!;
        return {
          height: Math.round(first.getBoundingClientRect().height),
          type: getComputedStyle(first).fontSize
        };
      });
  };

  const normal = await measure(VARIANTS);
  const compact = await measure(COMPACT);

  /*
   * Doc 03's density axis trims air, not legibility. Both of these draw a
   * primary group at the DEFAULT size — which is why the comparison is not
   * against the sizes story, whose first row is `sm` and would have made this
   * pass for the wrong reason. The height has to fall and the type size has to
   * stay exactly where it was.
   */
  expect(compact.height).toBeLessThan(normal.height);
  expect(compact.type).toBe(normal.type);
});
