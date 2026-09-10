import type { CalendarDate } from '@internationalized/date';

/*
 * WHAT CAN BE REACHED, as pure functions — and they exist because of an
 * asymmetry in the base that nothing documents.
 *
 * Measured. The base's year picker CLAMPS to the calendar's limits: with a
 * range of 2020 to 2030 it hands over eleven years rather than its twelve, and
 * with a range inside one year it hands over one. The month picker does not
 * clamp at all — with a range of June to November it still hands over all
 * twelve months, each carrying a date inside it.
 *
 * So a calendar showing a month view has to decide for itself which of those
 * twelve can be pressed, or it offers somebody a month with nothing in it. The
 * same question is asked of the arrows, which step a year in the month view
 * and twelve in the year view, and must stop where the limits do.
 *
 * ## Why a month is not tested by its own date
 *
 * The obvious test is to compare the item's date against the limits, and it is
 * wrong at both ends. The base hands over the same DAY OF MONTH as the focused
 * date — the ninth, for a calendar focused on the ninth — so a maximum of
 * `2026-12-05` would rule December out even though its first five days are
 * selectable, and a minimum of `2026-06-20` would rule June out with ten days
 * left in it.
 *
 * A period is reachable when its SPAN overlaps the limits. That is two lines
 * of arithmetic and two off-by-a-month bugs waiting for whoever writes it
 * inline.
 */

/**
 * Whether a period holds at least one day the calendar would accept.
 *
 * Both limits are optional and either may be absent, which is the ordinary
 * case: a calendar with no limits reaches everything.
 */
export function isSpanWithinLimits(
  first: CalendarDate,
  last: CalendarDate,
  min: CalendarDate | undefined,
  max: CalendarDate | undefined
): boolean {
  if (min !== undefined && last.compare(min) < 0) return false;
  if (max !== undefined && first.compare(max) > 0) return false;
  return true;
}

/** The first day of the month a date is in. */
const firstOfMonth = (date: CalendarDate): CalendarDate => date.set({ day: 1 });

/** The last day of the month a date is in, whatever the calendar system says. */
const lastOfMonth = (date: CalendarDate): CalendarDate =>
  date.set({ day: date.calendar.getDaysInMonth(date) });

/** Whether any day of this month can be chosen. */
export function isMonthWithinLimits(
  date: CalendarDate,
  min: CalendarDate | undefined,
  max: CalendarDate | undefined
): boolean {
  return isSpanWithinLimits(firstOfMonth(date), lastOfMonth(date), min, max);
}

/**
 * Whether any day of this year can be chosen.
 *
 * The number of months is READ from the calendar rather than assumed to be
 * twelve: `Intl` reaches eighteen calendar systems and some of them have
 * thirteen months, so a year built out of a hard-coded twelve would quietly
 * lose one in Hebrew.
 */
export function isYearWithinLimits(
  date: CalendarDate,
  min: CalendarDate | undefined,
  max: CalendarDate | undefined
): boolean {
  const january = date.set({ month: 1, day: 1 });
  const december = january.set({
    month: date.calendar.getMonthsInYear(january)
  });

  return isSpanWithinLimits(january, lastOfMonth(december), min, max);
}
