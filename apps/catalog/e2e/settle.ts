/*
 * Waiting for a page to be READY, without waiting on the machine.
 *
 * Both of these were written inside one spec and are now wanted by two, which
 * is where this repository extracts (doc 01 §7, and the cross that reached four
 * copies before anybody noticed). They are also the two halves of doc 10 §11
 * applied to a wait rather than to an assertion: a wait may depend on a STATE
 * the page reaches, and may not depend on how fast or how loaded the machine
 * is.
 */
import { expect, type Page } from '@playwright/test';

/**
 * The page has produced a frame, with its fonts.
 *
 * ## What this replaces, and the measurement
 *
 * `page.waitForLoadState('networkidle')`, which the accessibility suite used
 * to reach for. It is the wrong instrument twice over.
 *
 * **It is unbounded.** "Idle" means 500ms with no request in flight, so a page
 * that never gets 500ms of silence waits until the test times out — and how
 * often a chunk arrives depends on how many other browsers are competing for
 * the machine. That is the `a11y timeout under load` this suite reported,
 * and doc 10 §11 is the rule it breaks: the assertion measured how loaded the
 * CPU was.
 *
 * **And it is 25 times more expensive than the thing that actually settles the
 * page.** Measured on three stories in the built catalog:
 *
 * | Story                        | networkidle | two frames |
 * | ---------------------------- | ----------- | ---------- |
 * | `Separator / Semantics`      | 574ms       | 21ms       |
 * | `DatePicker / States`        | 574ms       | 23ms       |
 * | `FileUpload / States`        | 547ms       | 17ms       |
 *
 * Across 480 stories that is minutes of the suite spent waiting for a silence
 * it did not need, and the 500ms floor is the definition of the wait rather
 * than anything about the page.
 *
 * ## Why TWO frames
 *
 * A `requestAnimationFrame` callback runs BEFORE the paint of the frame it
 * belongs to. Waiting for a second one is what guarantees the first frame was
 * painted — which is what the colour-contrast rule needs, because it samples
 * computed colours from real geometry and declines to run rather than guessing
 * when there is none. Silently, which is why the suite asserts that the rule
 * ran at all.
 */
export const painted = async (page: Page): Promise<void> => {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      })
  );
};

/**
 * Every image in the document has settled.
 *
 * `gotoStory` waits for the story to mount and `toHaveScreenshot` waits for
 * fonts, and neither waits for an image. An `<img>` that resolves to something
 * is one thing; an `<img>` that FAILS is the case that caught us, because
 * failing is what makes a component fall back — so a picture is either the
 * fallback or the browser's broken-image glyph depending on whether the error
 * had happened yet.
 *
 * Measured, on CI: `avatar-states` came back 225 pixels different from the
 * reference generated locally, stable across both of Playwright's retries, and
 * 225 pixels is about the size of that glyph. The baseline held the letters the
 * component falls back to; CI held the glyph. Nothing was wrong with either
 * machine.
 *
 * `complete` is true for a loaded image AND for a failed one, and a component
 * that swaps the image out on failure removes it from this list altogether —
 * all three of which are "settled". A lazily loaded image that is out of view
 * never completes, so a story that scrolls will time out here, and the message
 * will say which picture was not ready.
 */
export const imagesSettled = async (page: Page): Promise<void> => {
  await expect
    .poll(() =>
      page.evaluate(() => [...document.images].every(image => image.complete))
    )
    .toBe(true);
};
