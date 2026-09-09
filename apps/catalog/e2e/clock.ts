import type { Page } from '@playwright/test';

/*
 * THE ONE INSTANT THIS SUITE PRETENDS IT IS.
 *
 * Doc 10 §6.1 is the rule and this file is the mechanism, shared rather than
 * copied so that a picture and the check beside it can never disagree about
 * what day it is.
 *
 * ## Why anything needs this at all
 *
 * A component that knows what day it is today reads the clock, and no pinned
 * prop reaches that: a calendar is given a chosen day and works out today for
 * itself, from the zone the provider supplies (decision 0023). So every
 * assertion and every baseline about today was quietly dated.
 *
 * Both halves of that were measured, on the calendar, and they fail in
 * opposite directions:
 *
 * - **A baseline goes green for no reason.** The RTL reference configures
 *   Cairo, and it marks the 9th at midday UTC and the 10th at 22:00 — 104
 *   pixels, which is the failure CI reported. Worse is the version that does
 *   not fail: photographed from a month that does not contain today, nothing
 *   is marked at all, so the reference stops guarding the ring and goes on
 *   passing. Three weeks would have done it.
 * - **A check expires.** THREE of the calendar's checks require today to be IN
 *   the month on screen, and one of those needs it to be the chosen day
 *   exactly. Measured: pinned to the 5th of October all three fail on the
 *   count, which means they were written on the ninth of September and were
 *   due to start failing on the tenth — and would have looked exactly like the
 *   flake this repository has just finished removing.
 *
 *   Three rather than the two that were obvious, which is the argument for
 *   fixing the clock for the whole file: the third is the check that asserts
 *   NOTHING is marked without a zone, and it counts the base's own mark to
 *   prove the story is showing a calendar at all. A check can be dated without
 *   mentioning today.
 */
export const FIXED_INSTANT = new Date('2026-09-09T12:00:00Z');

/**
 * Fix the clock before a story is opened.
 *
 * **Midday UTC**, which is the instant every zone from UTC−12 to UTC+11 is on
 * the same calendar day — so a story configuring Lima and a story configuring
 * Cairo see one date rather than two consecutive ones. **The ninth of
 * September** because that is the day every calendar story pins as its chosen
 * value, which keeps the interesting case on film: today and the chosen day
 * landing on one cell is where the ring's colour was found to be wrong.
 *
 * `setFixedTime` rather than `install`: it fixes `Date.now()` and `new Date()`
 * and leaves every timer running, so transitions, countdowns and Storybook's
 * own scheduling behave exactly as they did. A frozen timer queue would be a
 * second variable in every check that used this.
 *
 * Call it BEFORE `gotoStory`. The story reads the clock while it mounts, and a
 * time fixed afterwards is a time the first render never saw.
 */
export async function pinClock(
  page: Page,
  instant: Date = FIXED_INSTANT
): Promise<void> {
  await page.clock.setFixedTime(instant);
}
