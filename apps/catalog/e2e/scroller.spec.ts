/*
 * THE SCROLLBAR OF A LIST THIS LIBRARY OWNS, WHICH NO PICTURE CAN SHOW.
 *
 * `internal/scrollbar.css` names two properties on `.bb-scroller`, and the
 * reason it names them is measured rather than decorative: dark mode is an
 * ATTRIBUTE in this library, so `color-scheme` computes to `normal` and a
 * browser paints its LIGHT scrollbar inside a dark panel.
 *
 * ## Why this is a computed-style check and not a baseline
 *
 * The obvious instrument is a photograph of a list with forty options in it,
 * and there are four of those. They do not show the bar. Measured in the
 * container this catalog photographs in: the scroller's `offsetWidth` and
 * `clientWidth` are both 268, so the bar takes no layout space at all — it is
 * an OVERLAY scrollbar, which paints while a pointer is over it or a gesture
 * is in flight and is absent at rest. Scrolling it from script and shooting
 * 50ms later showed nothing either.
 *
 * So the pictures guard the panel, the height and the rows, and this file
 * guards the bar. Which is doc 10 §11.10 arriving the usual way: the rule was
 * written, the baseline looked like the check, and what would actually have
 * gone red if the two declarations were deleted was nothing.
 *
 * ## What it asserts
 *
 * That the list OVERFLOWS — a scroller with nothing to scroll would pass every
 * other line here while proving nothing — and then the two resolved values, in
 * both modes, against the token the stylesheet names rather than against a
 * remembered colour.
 *
 * And it was verified in the direction that matters: pointed at `--bb-border`
 * instead of `--bb-border-strong` — one step away on the same scale, in the
 * same family — all four go red. A comparison that cannot tell two neighbours
 * apart would have passed whatever the stylesheet said.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

/** The four stories with a list long enough to overflow, two per component. */
const LONG = [
  ['a Select in light', 'components-select--long-list'],
  ['a Select in dark', 'components-select--long-list-dark'],
  ['a ComboBox in light', 'components-combobox--long-list'],
  ['a ComboBox in dark', 'components-combobox--long-list-dark']
] as const;

for (const [what, story] of LONG) {
  test(`the list of ${what} scrolls, and its bar is ours`, async ({ page }) => {
    await gotoStory(page, story);

    const scroller = page.locator('.bb-scroller');
    await expect(scroller).toHaveCount(1);

    const measured = await scroller.evaluate((el: HTMLElement) => {
      /*
       * THE EXPECTED VALUE IS BUILT BY THE BROWSER, not parsed out of the
       * actual one. A first version split `scrollbarColor` on a space to get
       * the thumb, which an `oklch()` value is full of — `oklch(0.793` is not
       * a colour, so the probe inherited its text colour and the check
       * reported a near-white thumb in dark mode that nothing had declared.
       *
       * So a sibling is given the declaration this stylesheet is supposed to
       * make, in the same place, and the two computed strings are compared to
       * each other. One serialisation, no parsing, and the token is named once
       * on each side rather than copied as a colour.
       */
      const probe = document.createElement('div');
      probe.style.scrollbarColor = 'var(--bb-border-strong) transparent';
      el.append(probe);
      const expected = getComputedStyle(probe).scrollbarColor;
      probe.remove();

      const own = getComputedStyle(el);

      return {
        overflows: el.scrollHeight > el.clientHeight,
        scrollbarWidth: own.scrollbarWidth,
        scrollbarColor: own.scrollbarColor,
        expected
      };
    });

    expect(measured.overflows).toBe(true);
    expect(measured.scrollbarWidth).toBe('thin');

    /* The thumb is `--bb-border-strong` and the track is nothing. */
    expect(measured.scrollbarColor).toBe(measured.expected);
    expect(measured.scrollbarColor).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  });
}
