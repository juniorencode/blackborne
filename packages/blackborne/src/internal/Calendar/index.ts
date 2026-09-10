/*
 * The shared half of a calendar, behind one entry point.
 *
 * `internal/Layer` is the precedent and the project's own lint rule is what
 * enforces it: a component imports a shared internal from its index, never by
 * reaching into a file inside it (doc 01). Which is worth having here for the
 * usual reason — the split between `classes`, `Chrome`, `limits` and `zone` is
 * ours to rearrange as long as nothing outside names those files.
 */
export {
  CalendarChrome,
  PeriodView,
  useEitherCalendar,
  type PeriodFormatters
} from './Chrome';
export {
  BODY,
  DAY,
  FRAME,
  GRID,
  ROOT,
  TODAY,
  WEEKDAY,
  type View
} from './classes';
export { MonthGrid } from './MonthGrid';
export {
  isMonthWithinLimits,
  isSpanWithinLimits,
  isYearWithinLimits
} from './limits';
export { useDayFormatters, useTodayHere } from './zone';
