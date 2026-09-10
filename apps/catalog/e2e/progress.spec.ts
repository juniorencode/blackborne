/*
 * A determinate bar, and the four things about it that only a browser answers.
 *
 * THE FILL IS THE WIDTH THE VALUE SAYS, which is the one claim a bar makes and
 * the one nothing else can check: the width arrives at runtime, so it is an
 * inline style rather than a class and no assertion about class names touches
 * it. THE FILL CAN BE TOLD APART FROM ITS TRACK, which is doc 03 §5 rule 2's
 * 3:1 for a graphical element and which axe does not measure — a box is not
 * text. A BAR WITH NOTHING ABOVE IT sits flush, which is a gap that no unit
 * test can see. And THE TRANSITION IS THE TOKEN's, which is what makes reduced
 * motion free.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-progress--overview';
const STATES = 'components-progress--states';
const LINE = 'components-progress--a-line-under-something';
const SIZES = 'components-progress--sizes';
const TOGETHER = 'components-progress--together';

/** The floor for a graphical element that carries information (doc 03 §5). */
const GRAPHICAL_FLOOR = 3;

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

test('the fill is as wide as the value says, at every value', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const measured = await page.locator('.bb-progress').evaluateAll(bars =>
    bars.map(bar => {
      const track = bar.querySelector('.bb-progress-track')!;
      const fill = bar.querySelector('.bb-progress-fill')!;
      return {
        value: Number(
          bar
            .querySelector('[role=progressbar]')
            ?.getAttribute('aria-valuenow') ??
            bar.getAttribute('aria-valuenow') ??
            -1
        ),
        track: track.getBoundingClientRect().width,
        fill: fill.getBoundingClientRect().width
      };
    })
  );

  expect(measured).toHaveLength(5);

  /*
   * THE ONE CLAIM A BAR MAKES. The width is an inline percentage, so nothing
   * about a class name proves it and only the box does. A tolerance of one
   * pixel, because a percentage of a fractional width rounds.
   */
  for (const bar of measured) {
    const expected = (bar.value / 100) * bar.track;
    expect(
      Math.abs(bar.fill - expected),
      `${bar.value}% of ${bar.track} should be ${expected}, measured ${bar.fill}`
    ).toBeLessThan(1);
  }

  /* And the two ends are the ends: nothing at 0, the whole track at 100. */
  expect(measured[0]!.fill).toBe(0);
  expect(measured.at(-1)!.fill).toBeCloseTo(measured.at(-1)!.track, 0);
});

test('the fill can be told apart from its track, in both modes', async ({
  page
}) => {
  await gotoStory(page, TOGETHER);

  const pairs = await page.locator('.bb-progress').evaluateAll(bars =>
    bars.map(bar => ({
      fill: getComputedStyle(bar.querySelector('.bb-progress-fill')!)
        .backgroundColor,
      track: getComputedStyle(bar.querySelector('.bb-progress-track')!)
        .backgroundColor
    }))
  );

  expect(pairs.length).toBeGreaterThan(2);

  /*
   * DOC 03 §5 RULE 2, and nothing automated covers it: axe checks the contrast
   * of TEXT, and a filled box is not text. A bar whose fill and track are two
   * similar greys says nothing at all, and it says nothing in exactly the mode
   * nobody was looking at — which is why both are in the story and both are
   * measured.
   */
  for (const pair of pairs) {
    const ratio = await contrast(page, pair.fill, pair.track);
    expect(
      ratio,
      `${pair.fill} on ${pair.track} is ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(GRAPHICAL_FLOOR);
  }
});

test('a bar with nothing above it sits flush', async ({ page }) => {
  await gotoStory(page, LINE);

  const seen = await page.locator('.bb-progress').evaluate(bar => {
    const label = bar.querySelector('.bb-progress-label')!;
    const track = bar.querySelector('.bb-progress-track')!;
    return {
      gap: getComputedStyle(bar).rowGap,
      labelWidth: label.getBoundingClientRect().width,
      barHeight: Math.round(bar.getBoundingClientRect().height),
      trackHeight: Math.round(track.getBoundingClientRect().height)
    };
  });

  /*
   * The label is STILL THERE — `sr-only`, because the name is the one thing
   * doc 06 §2 does not forgive losing — so the header is never `:empty` and
   * `empty:hidden` would match nothing. The gap is what has to go, and the
   * first version of this component used `empty:hidden` and would have shipped
   * a stray few pixels that no assertion looks for.
   */
  expect(seen.labelWidth).toBeLessThan(2);
  expect(seen.gap).toBe('0px');
  expect(seen.barHeight).toBe(seen.trackHeight);
});

test('a bar that shows its label reserves the row for it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const seen = await page.locator('.bb-progress').evaluate(bar => ({
    gap: getComputedStyle(bar).rowGap,
    barHeight: Math.round(bar.getBoundingClientRect().height),
    trackHeight: Math.round(
      bar.querySelector('.bb-progress-track')!.getBoundingClientRect().height
    )
  }));

  /* The other half of the check above: with a header there IS a gap. */
  expect(seen.gap).not.toBe('0px');
  expect(seen.barHeight).toBeGreaterThan(seen.trackHeight);
});

test('the two thicknesses differ, and the fill fills them', async ({
  page
}) => {
  await gotoStory(page, SIZES);

  const heights = await page.locator('.bb-progress-track').evaluateAll(tracks =>
    tracks.map(track => {
      const fill = track.querySelector('.bb-progress-fill')!;
      return {
        track: Math.round(track.getBoundingClientRect().height),
        fill: Math.round(fill.getBoundingClientRect().height)
      };
    })
  );

  expect(heights).toHaveLength(2);
  expect(heights[0]!.track).toBeLessThan(heights[1]!.track);
  for (const one of heights) expect(one.fill).toBe(one.track);
});

test('the fill moves with the duration token, not with a number', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const declared = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.transitionDuration = 'var(--bb-duration-normal)';
    document.body.append(probe);
    const read = getComputedStyle(probe).transitionDuration;
    probe.remove();
    return read;
  });

  const used = await page
    .locator('.bb-progress-fill')
    .evaluate(fill => getComputedStyle(fill).transitionDuration);

  /*
   * The token and not a literal, which is what makes reduced motion free: the
   * tokens collapse every duration to zero under the preference, so a bar that
   * hard-coded 200ms would keep animating for somebody who asked it not to.
   */
  expect(used).toBe(declared);
});

test('with reduced motion asked for, the fill does not travel', async ({
  browser
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await gotoStory(page, OVERVIEW);

  const used = await page
    .locator('.bb-progress-fill')
    .evaluate(fill => getComputedStyle(fill).transitionDuration);

  /* Doc 09 §2: removed, not softened. */
  expect(used).toBe('0s');
  await context.close();
});

test('nothing overflows its container', async ({ page }) => {
  await gotoStory(page, STATES);

  const overflow = await page.locator('.catalog-stack').evaluate(stack => {
    const bounds = stack.getBoundingClientRect();
    return [...stack.querySelectorAll('*')]
      .map(child => child.getBoundingClientRect())
      .filter(box => box.width > 0)
      .map(box => Math.round((box.right - bounds.right) * 100) / 100)
      .filter(over => over > 0.5);
  });

  expect(overflow).toEqual([]);
});
