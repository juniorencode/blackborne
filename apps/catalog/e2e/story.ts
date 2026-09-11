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
  /*
   * ANYTHING THE PAGE SAYS, COLLECTED BEFORE IT IS ASKED FOR.
   *
   * A story that throws while mounting never attaches a child to the root, so
   * the wait below times out and the failure reads as "waiting for
   * locator('#storybook-root > *')" — which is the symptom in every case and
   * the cause in none. The exception itself only exists in the page's console,
   * and by the time a diagnostic could ask for it the event is long gone.
   *
   * So it is recorded as it happens, and reported only if the wait fails.
   * Listeners on a per-test page go away with it.
   */
  const said: string[] = [];
  page.on('pageerror', error => said.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') said.push(`console: ${message.text()}`);
  });

  await page.goto(`/iframe.html?id=${id}&viewMode=story`);

  /*
   * WAIT FOR THE STORY TO MOUNT, BOUNDED, SO THE DIAGNOSTIC BELOW CAN RUN.
   *
   * Measured on 2026-09-11: this wait consumed the whole 30s test budget on
   * `Switch / Brand Override`, inside a full 480-check accessibility run at
   * six workers, and the same story passed in isolation. A second run dropped
   * `ColorSwatchField / Rings` instead. The same suite at two workers — which
   * is what CI uses — passed 480 of 480. Different check each time, none
   * repeating: doc 10 §11.5's signature for the machine rather than the code.
   *
   * The number is 20 seconds and it is not a speed limit, it is a budget
   * split. Unbounded, this wait takes the entire test timeout, Playwright
   * closes the context, and the `catch` cannot read the page any more — which
   * is exactly how the third occurrence of the stylesheet wait below reported
   * nothing at all. Ten seconds is what the diagnostic needs; a story that
   * genuinely takes twenty to mount is worth failing over, which is the same
   * argument that keeps the wait below at its own default.
   */
  try {
    await page
      .locator('#storybook-root > *')
      .first()
      .waitFor({ state: 'attached', timeout: 20_000 });
  } catch (cause) {
    const seen = await page
      .evaluate(() => ({
        url: location.href,
        readyState: document.readyState,
        /* -1 says the root itself is missing, which is a different fault from
           a root with no children: the first means this is not the catalog's
           iframe, the second means the story did not render. */
        rootChildren:
          document.querySelector('#storybook-root')?.children.length ?? -1,
        /* Storybook's own error display, which it puts on the body. */
        bodyClass: document.body.className || '(none)',
        errorText:
          document.querySelector('#error-message')?.textContent?.trim() ??
          '(none)',
        title: document.title,
        bodyChars: document.body.textContent?.trim().length ?? 0
      }))
      .catch(
        (closed: unknown) =>
          `unreadable: ${closed instanceof Error ? closed.message : String(closed)}`
      );

    throw new Error(
      `the story "${id}" never mounted: ${JSON.stringify(seen)}; ` +
        (said.length === 0
          ? 'the page logged no errors'
          : `the page said: ${said.join(' | ')}`),
      { cause }
    );
  }

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
  try {
    await page.waitForFunction(
      () =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--bb-surface')
          .trim() !== ''
    );
  } catch (cause) {
    /*
     * WHEN THIS WAIT RUNS OUT, SAY WHAT WAS THERE.
     *
     * Observed three times, always inside a full run and never in isolation:
     * this wait consumed the whole 30s test budget and the test was reported
     * as a failure of the assertion it never reached — `Popover / Placements`,
     * `Tooltip / Placements`, and on 2026-09-09 `RadioGroup / Card Direction`,
     * all three passing on an isolated re-run seconds later. The single worker
     * had spent the previous ten minutes on `accessibility.spec.ts` each time,
     * so a Storybook dev server compiling a heavy story on demand is the
     * obvious suspect.
     *
     * The third occurrence is also why the evidence below is now guarded: it
     * printed nothing at all. By the time the catch ran, the test had exceeded
     * its own timeout, Playwright had closed the context, and the diagnostic
     * `evaluate` failed with "Target page, context or browser has been closed"
     * — so the message that replaced the mystery was itself replaced by a
     * different mystery. An instrument that needs a live page to report on a
     * page that has died reports nothing.
     *
     * The timeout is deliberately NOT raised. A stylesheet that takes half a
     * minute to arrive is worth failing over, and raising the number would
     * turn the next occurrence into a slower version of the same mystery. What
     * is added is evidence: whether the story mounted, whether a stylesheet
     * element exists at all, and what the token actually read. The contrast
     * guard in `accessibility.spec.ts` was given the same treatment for the
     * same reason — an eliminated hypothesis is worth more than a guess, and
     * neither is worth anything without a measurement.
     */
    const seen = await page
      .evaluate(() => ({
        url: location.href,
        mounted:
          document.querySelector('#storybook-root')?.children.length ?? -1,
        sheets: document.styleSheets.length,
        links: [...document.querySelectorAll('link[rel=stylesheet]')].map(
          el => (el as HTMLLinkElement).href.split('/').pop() ?? '?'
        ),
        styleTags: document.querySelectorAll('style').length,
        surface: getComputedStyle(document.documentElement).getPropertyValue(
          '--bb-surface'
        ),
        bodyBackground: getComputedStyle(document.body).backgroundColor
      }))
      .catch(
        (closed: unknown) =>
          /*
           * The page may be gone — a test that has run out of time takes its
           * context with it — and then this diagnostic cannot run at all. Say
           * SO, rather than throwing the failure of the diagnostic in place of
           * the failure it was written to explain.
           */
          `unreadable: ${closed instanceof Error ? closed.message : String(closed)}`
      );
    throw new Error(
      `the library stylesheet never took effect for "${id}": ` +
        JSON.stringify(seen),
      { cause }
    );
  }

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
   * **This is a precondition made stricter, not a diagnosed fix**, and it did
   * not fix the thing it was hoped to.
   *
   * `Components/EmptyState / Narrow Container` failed axe's contrast guard once
   * in one of two full runs of identical code, and passed seven of seven in
   * isolation. This wait was added, with a note saying that if it recurred the
   * next person would know the paint was not the cause. **It recurred** — on
   * `Components/Alert / All Axes`, one full run later — so the paint was not
   * the cause, and neither was the stylesheet arriving late, which the waits
   * above already covered.
   *
   * The wait stays because it is correct on its own terms: axe measures
   * rendered geometry and colour, and a screenshot photographs a frame, so
   * both want the frame rather than the promises. What it is not is a
   * solution.
   *
   * Roughly one story-check in seven hundred, a different story each time.
   * `retries` is deliberately zero here, so this is a defect rather than
   * weather — and the guard in `accessibility.spec.ts` now prints what axe
   * returned when it fires, because the next occurrence has to carry evidence
   * instead of another eliminated hypothesis.
   */
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );
}
