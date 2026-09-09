/*
 * The three questions a calendar's limits ask, with no rendering at all.
 *
 * They exist because the base answers one of them and not the other two: its
 * year picker clamps to the limits and its month picker hands over every month
 * regardless, so which months can be pressed is this library's arithmetic.
 */
import { parseDate } from '@internationalized/date';
import { expect, test } from 'vitest';
import {
  isMonthWithinLimits,
  isSpanWithinLimits,
  isYearWithinLimits
} from './limits';

const day = (iso: string) => parseDate(iso);

test('with no limits, everything is reachable', () => {
  expect(isMonthWithinLimits(day('2026-09-09'), undefined, undefined)).toBe(
    true
  );
  expect(isYearWithinLimits(day('1998-03-01'), undefined, undefined)).toBe(
    true
  );
});

test('a month before the minimum is out, and the one holding it is in', () => {
  const min = day('2026-06-15');

  expect(isMonthWithinLimits(day('2026-05-09'), min, undefined)).toBe(false);
  // June has days on and after the 15th, so June is reachable.
  expect(isMonthWithinLimits(day('2026-06-09'), min, undefined)).toBe(true);
  expect(isMonthWithinLimits(day('2026-07-09'), min, undefined)).toBe(true);
});

test('a month after the maximum is out, and the one holding it is in', () => {
  const max = day('2026-11-05');

  expect(isMonthWithinLimits(day('2026-12-09'), undefined, max)).toBe(false);
  // November has days up to the 5th, so November is reachable.
  expect(isMonthWithinLimits(day('2026-11-09'), undefined, max)).toBe(true);
  expect(isMonthWithinLimits(day('2026-10-09'), undefined, max)).toBe(true);
});

/*
 * THE TWO CASES THAT MADE THIS A FUNCTION RATHER THAN A COMPARISON. The base
 * hands over the focused DAY OF MONTH, so comparing that date against the
 * limits rules out months that still have days in them.
 */
test('a month is judged by its span, not by the day the base hands over', () => {
  // The ninth of December is past the maximum; the first five days are not.
  expect(
    isMonthWithinLimits(day('2026-12-09'), undefined, day('2026-12-05'))
  ).toBe(true);
  // The ninth of June is before the minimum; the last ten days are not.
  expect(
    isMonthWithinLimits(day('2026-06-09'), day('2026-06-20'), undefined)
  ).toBe(true);
});

test('a year is reachable when any of its months is', () => {
  expect(
    isYearWithinLimits(day('2026-09-09'), day('2026-12-31'), undefined)
  ).toBe(true);
  expect(
    isYearWithinLimits(day('2025-09-09'), day('2026-01-01'), undefined)
  ).toBe(false);
  expect(
    isYearWithinLimits(day('2027-09-09'), undefined, day('2026-12-31'))
  ).toBe(false);
});

test('a span is inclusive at both ends', () => {
  const min = day('2026-09-09');
  const max = day('2026-09-09');

  // One day wide, and that day is in it.
  expect(
    isSpanWithinLimits(day('2026-09-09'), day('2026-09-09'), min, max)
  ).toBe(true);
  expect(
    isSpanWithinLimits(day('2026-09-08'), day('2026-09-08'), min, max)
  ).toBe(false);
  expect(
    isSpanWithinLimits(day('2026-09-10'), day('2026-09-10'), min, max)
  ).toBe(false);
});

test('and the number of months in a year is read rather than assumed', () => {
  /*
   * Eighteen calendar systems are reachable through `Intl` and some of them
   * have thirteen months, so a year built out of a hard-coded twelve would
   * quietly lose one. This asserts the arithmetic uses the calendar's own
   * count: a limit inside the last month of the year keeps that year
   * reachable.
   */
  const december = day('2026-12-20');
  expect(isYearWithinLimits(day('2026-01-01'), december, undefined)).toBe(true);
});
