/*
 * Decision 0010: the Card declares the query container, which is what makes
 * level N2 of doc 04 usable at all. Before it, the container scale was defined
 * in the theme and nothing in the library declared a container, so every
 * container query in every component would have matched nothing.
 *
 * None of that is checkable outside a browser. jsdom implements neither
 * containment nor container queries, so the unit tests deliberately assert
 * none of it — and asserting a class name instead would prove only that a
 * string was written, which is what doc 10 warns against.
 *
 * So this file measures the effect rather than the declaration: the same Card,
 * with the same children, in two slots of different widths. If the container
 * is not in effect the two are identical, and identical is the failure.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

/**
 * Find every element the browser actually treats as a query container, and
 * report the column count its content resolved to.
 *
 * Asking the browser which elements are containers — rather than looking for
 * ours by class — is what gives this teeth. Remove `container-type` and the
 * list comes back empty, and the first expectation fails loudly instead of
 * quietly measuring nothing.
 */
const containers = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const roots = document.querySelectorAll<HTMLElement>('#storybook-root *');
    return [...roots]
      .filter(el => getComputedStyle(el).containerType === 'inline-size')
      .map(el => {
        const content = el.querySelector<HTMLElement>(':scope > *');
        return {
          width: Math.round(el.getBoundingClientRect().width),
          columns:
            content === null
              ? 0
              : getComputedStyle(content).gridTemplateColumns.split(' ').length
        };
      });
  });

test('a Card is a query container, and its content answers to its width', async ({
  page
}) => {
  await gotoStory(page, 'components-card--containers');

  const found = await containers(page);

  // Two Cards on the story, and the browser must agree both are containers.
  expect(found).toHaveLength(2);

  const [narrow, wide] = found;
  expect(narrow?.width).toBeLessThan(wide?.width ?? 0);

  // The whole point: same markup, same children, different layout — decided
  // by the Card's own width and not by the window's.
  expect(narrow?.columns).toBe(1);
  expect(wide?.columns).toBe(3);
});

test('the query is answered by the container, not by the viewport', async ({
  page
}) => {
  await gotoStory(page, 'components-card--containers');

  /*
   * The distinction the whole of doc 04 rests on, made falsifiable.
   *
   * Both Cards sit in one window, so a viewport query would give them the same
   * answer. Shrinking the window far below the wide Card's threshold changes
   * the viewport and must change nothing here — the narrow slot stays one
   * column, the wide slot stays three, because neither ever asked the window.
   *
   * The slots are fixed widths, so the page scrolls rather than reflowing.
   */
  const before = await containers(page);
  await page.setViewportSize({ width: 400, height: 800 });
  const after = await containers(page);

  expect(after.map(entry => entry.columns)).toEqual(
    before.map(entry => entry.columns)
  );
});

test('all three container steps are distinct', async ({ page }) => {
  await gotoStory(page, 'components-card--container-steps');

  const found = await containers(page);
  expect(found).toHaveLength(3);

  const columns = found.map(entry => entry.columns);

  /*
   * A scale, not three arbitrary numbers — the same shape of check the control
   * heights get in alignment.spec.ts. Two thresholds that resolved to the same
   * layout would mean one of them is not doing anything, which is a scale with
   * a dead step in it.
   */
  expect(columns).toEqual([1, 2, 3]);
});
