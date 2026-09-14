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
 * Nothing with an end is still moving.
 *
 * ## The failure this exists for
 *
 * A colour is a fact about a moment. `painted()` above guarantees a frame has
 * been painted, which is what the colour-contrast rule needs to run at all —
 * and it says nothing about WHICH frame. A layer that animates in is composited
 * against a scrim whose opacity is still climbing, so the colour behind a run
 * of text at frame two is not the colour behind it at rest.
 *
 * Measured on `Toast / Above a dialog`, at the exact instant `painted()`
 * returns: two animations running, 300ms each, at **33% progress**. axe then
 * reported `#6b7480 on #f5f7f9 = 4.4:1` against a floor of 4.5 — a failure
 * that could not be reproduced alone, in the same build, because a quiet
 * machine gets through the rest of the page after the animation has finished.
 *
 * It is also dated. The same window was 160ms until 2026-09-13, when doc 09
 * §2.0 split one duration band into two and a layer's entry went to 300 — so
 * the same instant went from 62% of the way through an animation to 33%, and a
 * latent race became a reachable one. Nothing about the wait was wrong before;
 * it was lucky.
 *
 * ## Why it is a state rather than a delay
 *
 * Doc 10 §11.2: a wait belongs to a state the page reaches. `getAnimations()`
 * IS that state, exactly and without a number.
 *
 * ## What it deliberately ignores
 *
 * An animation that repeats forever never settles, and two of them are on
 * purpose in this library — a spinner turning and a skeleton pulsing. Waiting
 * for those would be waiting for the heat death of the suite, so an infinite
 * iteration count is treated as settled. Every animation with an END has to
 * have reached it.
 *
 * On timeout it names what is still running, because "animations did not
 * settle" is the symptom in every case and the cause in none.
 */
export const animationsSettled = async (page: Page): Promise<void> => {
  const stillRunning = () =>
    page.evaluate(() =>
      document
        .getAnimations()
        .filter(animation => {
          const timing = animation.effect?.getComputedTiming();
          if (timing?.iterations === Infinity) return false;
          return animation.playState === 'running';
        })
        .map(animation => {
          const timing = animation.effect?.getComputedTiming();
          const target =
            animation.effect && 'target' in animation.effect
              ? ((animation.effect as { target: Element | null }).target
                  ?.className ?? '(no target)')
              : '(no effect)';
          return `${String(target).slice(0, 60)} · ${String(timing?.duration)}ms · ${Math.round((timing?.progress ?? 0) * 100)}%`;
        })
    );

  try {
    await page.waitForFunction(
      () =>
        document.getAnimations().every(animation => {
          const timing = animation.effect?.getComputedTiming();
          if (timing?.iterations === Infinity) return true;
          return animation.playState !== 'running';
        }),
      undefined,
      { timeout: 5000 }
    );
  } catch (cause) {
    throw new Error(
      `animations with an end were still running after 5s: ${(await stillRunning()).join(' | ')}`,
      { cause }
    );
  }
};

/**
 * Every image in the document has settled.
 *
 * `gotoStory` waits for the story to mount and `toHaveScreenshot` waits for
 * fonts, and neither waits for an `<img>`. `Avatar` is the first component in
 * this library to render one, and its baseline came back **225 pixels
 * different on CI** — stable across both of Playwright's retries, so not a
 * flake.
 *
 * ## The glyph was the GUESS, and it stays here as an eliminated one
 *
 * 225 pixels is about the size of the browser's broken-image mark, so the diff
 * was assumed to be the baseline holding the letters the component falls back
 * to and CI holding the mark. **The artefact said otherwise.** The content was
 * identical either way — the letters in both — and the difference was
 * antialiasing on every circular border, which is what one page rasterised at
 * two different moments gives.
 *
 * This docstring said the opposite until 2026-09-11, and the mistake arrived
 * with the extraction rather than with the finding: `ffa6e44` wrote the
 * antialiasing account and this wait together, and `f3947b2` moved the wait
 * here with the eliminated hypothesis promoted to the cause. A guess is worth
 * keeping when it is labelled as one; the area coincidence above is exactly
 * the reasoning the artefact refuted.
 *
 * The same baseline failed CI a SECOND time, at 289 pixels, with no artefact
 * to open at all — doc 10 §11.6 is the rule that came out of that, and that
 * one's cause is not known and is deliberately not guessed at.
 *
 * ## What this buys is a page that has stopped rasterising
 *
 * `complete` is the state that bounds the wait — true for a loaded image AND
 * for a failed one, and a component that swaps the image out on failure
 * removes it from this list altogether, all three of which are "settled". A
 * lazily loaded image out of view never completes, so a story that scrolls
 * times out here — and the failure NAMES the picture, which is why the poll
 * returns the list rather than a boolean (doc 10 §11.4: a value for every
 * state, never a throw).
 *
 * ## And it does not prove the swap
 *
 * `complete` goes true when the task that fires `load` or `error` is QUEUED,
 * so it is already true when `onError` runs, and React's re-render is a task
 * after that. The swap is asserted where the component publishes it, in
 * `avatar.spec.ts`: the letters present and no `img` beside them. A wait may
 * not be the only thing claiming something happened (§11.1).
 */
export const imagesSettled = async (page: Page): Promise<void> => {
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.images]
          .map(image =>
            image.complete
              ? null
              : `loading: ${image.currentSrc.slice(0, 60) || '(no src)'}`
          )
          .filter(state => state !== null)
      )
    )
    .toEqual([]);
};
