/*
 * Doc 06 §3 lists a minimum hit area among the things the LIBRARY guarantees,
 * "respected at every density, compact included", and semantic.css states the
 * floor in a comment: 24px, the WCAG minimum, which compact may not go under.
 *
 * A comment is not a check. This is the first component with a control small
 * enough for the rule to bite — a cross inside a chip — and it is exactly
 * where the rule is broken everywhere else: the visible cross is drawn at
 * 12px, the target is the cross, and it passes review because it looks right.
 *
 * Two things are asserted, because either alone is hollow. That the token
 * never drops below the floor, and that a real control actually reaches it.
 * A perfect token nothing reads is the state Badge found the status colours
 * in.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

/** The WCAG 2.2 AA minimum, and the number semantic.css commits to. */
const FLOOR = 24;

const panel = (page: import('@playwright/test').Page, label: string) =>
  page.locator(`.catalog-panel:has(.catalog-label:text-is("${label}"))`);

for (const density of ['Normal', 'Compact']) {
  test(`a badge's remove button clears the minimum target at ${density.toLowerCase()} density`, async ({
    page
  }) => {
    await gotoStory(page, 'components-badge--densities');

    const scope = panel(page, density);
    const button = scope.getByRole('button').first();
    await expect(button).toBeVisible();

    const declared = await scope.evaluate(element =>
      Number.parseFloat(
        getComputedStyle(element).getPropertyValue('--bb-control-hit-area')
      )
    );

    // The floor holds at every density. Compact trims the mark, never the
    // target — which is the sentence in semantic.css this turns into a check.
    expect(declared).toBeGreaterThanOrEqual(FLOOR);

    const box = await button.boundingBox();
    expect(box).not.toBeNull();

    /*
     * Both axes. A target that is tall enough and narrow enough to miss is
     * still a target you miss, and a cross in a chip fails on width first —
     * the badge is wide, so the vertical looks fine while the horizontal is a
     * sliver.
     */
    expect(box?.width).toBeGreaterThanOrEqual(declared);
    expect(box?.height).toBeGreaterThanOrEqual(declared);
  });
}
