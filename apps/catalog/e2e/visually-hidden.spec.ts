/*
 * `VisuallyHidden` is the one component whose entire contract is invisible,
 * and jsdom can say nothing about it: it resolves no stylesheet and does no
 * layout, so in a unit test the class is an inert string. A test there can
 * assert that the component rendered — never that it hid anything.
 *
 * Which makes this file the only real check the component has.
 *
 * The failure being guarded against is not "it is visible". It is subtler and
 * much more common: a hiding technique that clips the content but leaves it
 * IN FLOW. Nothing appears on screen, everything looks correct, and every
 * element after it has moved — by a pixel, or by one flex gap per hidden
 * label. That is invisible in a screenshot of the component alone and shows up
 * as a toolbar that is mysteriously too wide.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

/** The story places identical rulers around each case. */
const RULER = '.catalog-row > span:not(.catalog-label)';

test('hidden text adds nothing to the width of its row', async ({ page }) => {
  await gotoStory(page, 'components-visuallyhidden--takes-no-space');

  const rulers = page.locator(RULER);
  await expect(rulers).toHaveCount(3);

  const width = async (index: number) =>
    (await rulers.nth(index).boundingBox())?.width ?? 0;

  const [empty, hidden, visible] = [
    await width(0),
    await width(1),
    await width(2)
  ];

  // Exactly, not approximately. Out of flow means zero contribution, and
  // "within a pixel" is precisely the tolerance that lets a 1px in-flow clip
  // through — which is the bug this exists to catch.
  expect(hidden).toBe(empty);

  /*
   * And the teeth. Without this the first assertion also passes when the
   * component renders nothing at all, or when the story stops putting anything
   * between the blocks. The third row is the same ruler around the same
   * sentence, unhidden: if hiding did not matter, all three would be equal.
   */
  expect(visible).toBeGreaterThan(empty);
});

test('hidden text is still in the accessibility tree', async ({ page }) => {
  await gotoStory(page, 'components-visuallyhidden--takes-no-space');

  const state = await page
    .locator(RULER)
    .nth(1)
    .evaluate(ruler => {
      /*
       * The one with text, not the first span: the ruler's own marks are
       * spans too, and they are deliberately empty.
       */
      const element = [...ruler.querySelectorAll('span')].find(
        span => (span.textContent ?? '').trim().length > 0
      );
      if (element === undefined) return null;
      const style = getComputedStyle(element);
      return {
        text: element.textContent,
        display: style.display,
        visibility: style.visibility,
        ariaHidden: element.getAttribute('aria-hidden'),
        hidden: element.hasAttribute('hidden'),
        inert: element.hasAttribute('inert')
      };
    });

  expect(state).not.toBeNull();
  expect(state?.text?.length ?? 0).toBeGreaterThan(0);

  /*
   * The four ways to hide something that also remove it from the tree. Any of
   * them makes the component silently useless: the text is gone for the people
   * it was written for, and nobody sighted can tell.
   */
  expect(state?.display).not.toBe('none');
  expect(state?.visibility).not.toBe('hidden');
  expect(state?.ariaHidden).toBeNull();
  expect(state?.hidden).toBe(false);
  expect(state?.inert).toBe(false);
});
