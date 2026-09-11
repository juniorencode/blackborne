/*
 * A WHEEL THAT DEMONSTRABLY ARRIVED.
 *
 * Doc 10 §11.1: where a check's expected result is "nothing happened",
 * something has to happen beside it. Three checks in this directory send a
 * wheel at a page whose scroll is locked and assert the offset did not move,
 * and all three were written as `expect.poll(...).toBe(before)` under a
 * comment saying the budget gives the page a chance to be wrong.
 *
 * It does not. `expect.poll` returns on the first read that satisfies its
 * expectation, so "the offset is what it was" was satisfied by its own first
 * read, the 1000ms was never spent, and both halves were equally true of a
 * wheel that never arrived at all.
 *
 * So the arrival is counted. A count is a STATE, which is what doc 10 §11 says
 * a check may depend on — unlike a moment, which is what the offset read was.
 *
 * Capture, on the window: the first listener to see the event whatever it was
 * aimed at, so a panel that stops propagation cannot make this read zero.
 * Passive, so counting cannot change what the wheel does.
 *
 * ## Two measurements that shaped this, both taken 2026-09-11
 *
 * **The arrival is asynchronous**, so the count has to be polled rather than
 * read. Measured on the nested-dialog story: after `mouse.wheel` returned the
 * count was still 0, and it reached 1 only by the time a second wheel had been
 * sent. The comment this replaces said "a wheel event is asynchronous" and was
 * right about that — it just polled the offset instead of the arrival.
 *
 * **And the callers assert AT LEAST one, not exactly one.** How many `wheel`
 * events one `mouse.wheel` produces is a property of the browser, which is a
 * value no check here sets and none can see (doc 10 §11). What the checks need
 * is that the event arrived; the number is the harness's business.
 */
import type { Page } from '@playwright/test';

export const watchWheels = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const counted = window as unknown as { wheels: number };
    counted.wheels = 0;
    window.addEventListener(
      'wheel',
      () => {
        counted.wheels += 1;
      },
      { capture: true, passive: true }
    );
  });
};

/**
 * How many have arrived.
 *
 * Zero rather than a throw for "none yet": this is read inside a poll, and
 * doc 10 §11.4's measurement is that a polled callback which throws is
 * propagated on the first call and never retried.
 */
export const wheelsSeen = (page: Page): Promise<number> =>
  page.evaluate(() => (window as unknown as { wheels?: number }).wheels ?? 0);
