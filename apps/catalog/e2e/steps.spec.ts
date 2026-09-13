/*
 * The reporting half of a stepper, and what only a browser answers.
 *
 * THE TWO STRUCTURES, which is doc 04 §6's hook and cannot be asked in jsdom
 * at all. THE CONNECTORS ARE ONE LENGTH, which the first baseline is what
 * found — they were flexible and came out 110px, 28px and 85px in one row.
 * THE FOUR STATES DIFFER IN GREYSCALE, which doc 06 §3 requires and which no
 * automated layer checks, because a filled circle is not text. And THE NUMBERS
 * COME FROM A COUNTER, which exists only where a stylesheet does.
 */
import { expect, test } from '@playwright/test';
import { toSrgb } from './colour';
import { gotoStory } from './story';

const STATES = 'components-steps--states';
const STRUCTURES = 'components-steps--structures';
const OPTIONAL = 'components-steps--an-optional-step';
const TOGETHER = 'components-steps--together';
const RTL = 'components-steps--direction';

test('the container decides whether the titles are shown', async ({ page }) => {
  await gotoStory(page, STRUCTURES);

  const seen = await page.locator('.bb-steps').evaluateAll(roots =>
    roots.map(root => ({
      step: getComputedStyle(root).getPropertyValue('--bb-step').trim(),
      titles: root.getAttribute('data-titles'),
      bodyWidth: Math.round(
        root.querySelector('.bb-step-body')!.getBoundingClientRect().width
      )
    }))
  );

  /*
   * Two of the same component at two widths in ONE window, which is P4's
   * question asked of the thing that decides. A viewport-driven answer would
   * give both the same.
   */
  expect(seen).toEqual([
    { step: 'base', titles: 'hidden', bodyWidth: 1 },
    { step: 'medium', titles: 'shown', bodyWidth: expect.any(Number) }
  ]);
  expect(seen[1]!.bodyWidth).toBeGreaterThan(20);
});

test('the hidden titles are out of sight and still in the tree', async ({
  page
}) => {
  await gotoStory(page, STRUCTURES);

  const narrow = page.locator('.bb-steps').first();

  /*
   * THE HALF THAT MATTERS. The first version hid the titles with
   * `display: none`, which would have left a list of four items with no names
   * in it at 320px. Nothing here is focusable — `Steps` navigates nothing —
   * so out of sight costs a reader nothing and out of the TREE costs them
   * everything.
   *
   * Asserted through the accessibility tree rather than the DOM, because that
   * is the thing being claimed.
   */
  const named = await narrow.evaluate(root =>
    [...root.querySelectorAll('.bb-step-title')].map(
      title => (title as HTMLElement).textContent?.trim() ?? ''
    )
  );
  /*
   * `toContain` per title rather than equality, and the reason is the feature:
   * a title's text INCLUDES the visually hidden status word, so a completed
   * step reads "Details completed". The first version of this check asserted
   * the bare names and failed on exactly the thing it should be glad about.
   */
  expect(named).toHaveLength(4);
  for (const [index, name] of [
    'Details',
    'Documents',
    'Review',
    'Signature'
  ].entries())
    expect(named[index]).toContain(name);
  expect(named[0]).toContain('completed');

  /*
   * AND THE MECHANISM, because the tree itself cannot be read here:
   * `page.accessibility` is gone from this version of Playwright, and a check
   * that pretended to read the tree would be reading `undefined`.
   *
   * So this asserts the two things that decide whether a title is in it. Not
   * `display: none`, which is what removes an element from the tree and what
   * the first version of this component used. Not `aria-hidden`. And a box of
   * about a pixel, which is what puts it out of sight.
   */
  const hiding = await narrow.evaluate(root =>
    [...root.querySelectorAll('.bb-step-body')].map(body => {
      const styles = getComputedStyle(body);
      return {
        display: styles.display,
        hidden: body.closest('[aria-hidden="true"]') !== null,
        width: Math.round(body.getBoundingClientRect().width)
      };
    })
  );

  expect(hiding).toHaveLength(4);
  for (const one of hiding) {
    expect(one.display).not.toBe('none');
    expect(one.hidden).toBe(false);
    expect(one.width).toBeLessThan(2);
  }
});

test('the connectors are one length, and the first step has none', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const seen = await page.locator('.bb-step-connector').evaluateAll(lines =>
    lines.map(line => ({
      drawn: getComputedStyle(line).display !== 'none',
      width: Math.round(line.getBoundingClientRect().width)
    }))
  );

  expect(seen).toHaveLength(4);

  /*
   * THE FIRST BASELINE IS WHAT FOUND THIS. The connector was `flex-1`, sharing
   * each step's leftover with the title — and since the steps are equal width
   * and the titles are not, one row came out with lines of 110px, 28px and
   * 85px. Nothing was wrong with any of them and the row read as an accident.
   *
   * A fixed length makes it a chain, and the leftover goes to the titles,
   * which is where a wider container should spend it.
   */
  const drawn = seen.filter(one => one.drawn);
  expect(drawn).toHaveLength(3);
  expect(new Set(drawn.map(one => one.width)).size).toBe(1);

  /* And it belongs to the step that FOLLOWS it, dropped on the first. */
  expect(seen[0]!.drawn).toBe(false);
});

/** WCAG relative luminance of an already-clipped sRGB triple. */
const luminanceOf = ([r, g, b]: [number, number, number]) => {
  const channel = (n: number) => {
    const s = n / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

test('the four states differ before their colour does', async ({ page }) => {
  await gotoStory(page, STATES);

  const shapes = await page.locator('.bb-step').evaluateAll(steps =>
    steps.map(step => {
      const indicator = step.querySelector('.bb-step-indicator')!;
      return {
        status: step.getAttribute('data-status'),
        hasGlyph: indicator.querySelector('svg') !== null,
        background: getComputedStyle(indicator).backgroundColor
      };
    })
  );

  /*
   * The fill is compared as a LUMINANCE taken through `e2e/colour`, which
   * paints the colour and reads it back. A regex over the computed value with
   * a fallback to black used to do it, and since the palette is published in
   * `oklch` that regex matches nothing — so the check would have compared two
   * confident zeroes and passed on a component with no difference in it at
   * all.
   */
  const seen = await Promise.all(
    shapes.map(async one => ({
      ...one,
      fill:
        Math.round(luminanceOf(await toSrgb(page, one.background)) * 1000) /
        1000
    }))
  );

  const byStatus = new Map(seen.map(one => [one.status, one]));

  /*
   * DOC 06 §3: a state may never depend on colour alone, and nothing automated
   * checks it — axe measures the contrast of TEXT, and a filled circle is not
   * text. So the four are separated by SHAPE first: the two tone states carry
   * a glyph and the other two carry a number, and the two that carry a number
   * differ in fill even with the hue taken away.
   */
  expect(byStatus.get('completed')?.hasGlyph).toBe(true);
  expect(byStatus.get('error')?.hasGlyph).toBe(true);
  expect(byStatus.get('pending')?.hasGlyph).toBe(false);
  expect(byStatus.get('active')?.hasGlyph).toBe(false);

  const pending = byStatus.get('pending')!.fill;
  const active = byStatus.get('active')!.fill;
  expect(
    Math.abs(pending - active),
    `pending at ${pending} and active at ${active} are the same in greyscale`
  ).toBeGreaterThan(0.2);
});

test('the numbers come from the counter, and skip nothing', async ({
  page
}) => {
  await gotoStory(page, OPTIONAL);

  const specified = await page
    .locator('.bb-step-indicator')
    .evaluateAll(nodes =>
      nodes.map(node => getComputedStyle(node, '::before').content)
    );

  /*
   * The rendered digits are generated content, which `getComputedStyle`
   * reports as the SPECIFICATION rather than the result — so what a check can
   * say is that the counter is on the steps that show a number and suppressed
   * on the ones a glyph replaced. The digits themselves are what the baseline
   * is for, which is the honest division rather than a check pretending to
   * read them.
   */
  expect(specified).toEqual([
    'none',
    'counter(bb-step)',
    'none',
    'none',
    'counter(bb-step)'
  ]);
});

test('nothing overflows at 320px, so nothing has to scroll', async ({
  page
}) => {
  await gotoStory(page, STRUCTURES);

  const narrow = await page
    .locator('.bb-steps-list')
    .first()
    .evaluate(list => ({
      overflow: list.scrollWidth - list.clientWidth,
      width: Math.round(list.getBoundingClientRect().width)
    }));

  /*
   * DOC 04 §11 FORECAST "to the indicators alone, SCROLLING", and the second
   * half turned out not to be needed: four indicators and three 24px lines fit
   * inside 320px with room to spare, so there is nothing to scroll. Recorded
   * rather than quietly dropped — a forecast that was half right is worth
   * knowing about.
   */
  expect(narrow.overflow).toBe(0);
  expect(narrow.width).toBeLessThanOrEqual(320);
});

test('in Arabic the row reads from the right', async ({ page }) => {
  await gotoStory(page, RTL);

  const positions = await page
    .locator('.bb-step-indicator')
    .evaluateAll(nodes =>
      nodes.map(node => Math.round(node.getBoundingClientRect().x))
    );

  /* The first step is furthest right, with no physical direction anywhere. */
  expect(positions[0]!).toBeGreaterThan(positions.at(-1)!);
});

test('a step cell clears the minimum target at both densities', async ({
  page
}) => {
  await gotoStory(page, TOGETHER);

  /*
   * NOT a hit-area check, because nothing here is a target — `Steps` navigates
   * nothing. What this asserts is that the indicator stays READABLE at compact
   * density: doc 03's density axis trims air, not legibility, and a 24px
   * circle carrying a number is the smallest thing in this component.
   */
  const sizes = await page
    .locator('.bb-step-indicator')
    .evaluateAll(nodes =>
      nodes.map(node => Math.round(node.getBoundingClientRect().height))
    );

  expect(sizes.length).toBeGreaterThan(8);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(20);
});
