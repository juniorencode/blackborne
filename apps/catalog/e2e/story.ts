import type { Page } from '@playwright/test';

/**
 * Open a story and wait until it has actually rendered.
 *
 * ## Why this exists rather than a bare page.goto
 *
 * `page.goto` resolves on the document's load event. Storybook mounts React
 * afterwards, so between those two moments the page is a blank 32px body with
 * the stylesheets not yet applied. Every spec in this directory used to race
 * that window, and the race produced BOTH kinds of wrong answer:
 *
 * - Silently passing. `toHaveScreenshot` retries until it matches, so a first
 *   shot of an empty page was quietly retried away — except under
 *   `--update-snapshots`, where there is nothing to match and the empty page
 *   became the committed reference.
 * - Loudly failing. axe run against a half-applied stylesheet reported a
 *   contrast violation on the catalog's own panel label. Measured immediately
 *   afterwards, with this wait in place, the same page reports zero
 *   violations on three consecutive runs.
 *
 * A check that can report either answer for the same input is not a check, so
 * the wait belongs in one place that every spec goes through.
 *
 * `#storybook-root > *` rather than the root itself: the root element exists
 * in the served HTML from the first byte, and only gains a child once the
 * story mounts.
 */
export async function gotoStory(page: Page, id: string): Promise<void> {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page
    .locator('#storybook-root > *')
    .first()
    .waitFor({ state: 'attached' });

  /*
   * And wait for the library's stylesheet to be IN EFFECT, which mounting does
   * not imply. Storybook's dev server injects CSS as a module, and under the
   * load of several parallel workers a story can render before its stylesheet
   * arrives. Every spec here assumes the opposite.
   *
   * Observed: axe reporting a serious contrast violation on the catalog's own
   * panel label, on a different story each run, while the same story in
   * isolation passed six times out of six.
   *
   * A resolved token is the cheapest proof the stylesheet landed, and it fails
   * loudly rather than silently if the styles never arrive at all.
   */
  await page.waitForFunction(
    () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--bb-surface')
        .trim() !== ''
  );

  await page.evaluate(() => document.fonts.ready);

  /*
   * And wait for a frame to have been PAINTED with all of that in place.
   *
   * Everything above proves that things have arrived — the story mounted, the
   * stylesheet resolved, the fonts loaded. None of it proves the browser has
   * laid out and painted with them. axe measures rendered geometry and
   * rendered colour, and a screenshot photographs a frame, so both want the
   * frame rather than the promises.
   *
   * Two ticks and not one: the first is scheduled before the pending layout,
   * the second runs after it.
   *
   * **This is a precondition made stricter, not a diagnosed fix, and the
   * difference is worth being honest about.** `Components/EmptyState / Narrow
   * Container` failed the contrast rule once, in one of two full runs of the
   * same code on the same machine — roughly one story-check in six hundred —
   * and passed seven times out of seven in isolation. The cause was not found.
   * What is known is that this suite has produced exactly this shape of
   * failure before, from exactly this cause: the notes above describe axe
   * reporting a contrast violation against a half-applied stylesheet, on a
   * different story each run. `retries` is deliberately zero here, so a check
   * that can report either answer for the same input is a defect rather than
   * weather — and if it recurs with this in place, the next person knows that
   * the paint was not it.
   */
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );
}
