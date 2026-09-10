import type { ReactElement } from 'react';
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell
} from 'react-aria-components';
import type { CalendarDate, DateDuration } from '@internationalized/date';
import { cx } from '../cx';
import { isSameDay } from '../isoDate';
import { DAY, GRID, TODAY, WEEKDAY } from './classes';

/**
 * One month of days, and the marks on it.
 *
 * `data-today` is the base's and it is DELIBERATELY NOT STYLED — see `zone`,
 * which both calendars take today from, and decision 0023 for why the
 * browser's answer is not usable here.
 *
 * **The cells are edge to edge**, measured: the day is a `div` filling its
 * `td` and the gap between two of them is exactly 0, on a table that collapses
 * its borders. Which is what lets a range paint a continuous band across a
 * week rather than a row of separate blocks, and it is worth writing down
 * because a `gap` added here later would break a component that does not
 * mention gaps anywhere.
 */
export const MonthGrid = ({
  todayHere,
  offset,
  dayClass,
  todayClass
}: {
  todayHere: CalendarDate | undefined;
  /**
   * How far into the visible range this grid starts. A second month is
   * `{ months: 1 }`; the base adds it to `visibleRange.start` itself.
   */
  offset?: DateDuration;
  /** What a range paints on top of a day, if anything. */
  dayClass?: string;
  /**
   * What today's ring becomes on the fills this calendar paints.
   *
   * The caller's, not this file's: the ring is the text colour of whatever is
   * behind it, and only the component painting the fill knows what that is.
   * `classes.ts` has the measurement that forced the split.
   */
  todayClass?: string;
}): ReactElement => (
  <CalendarGrid className={GRID} {...(offset === undefined ? {} : { offset })}>
    <CalendarGridHeader>
      {day => (
        <CalendarHeaderCell className={WEEKDAY}>{day}</CalendarHeaderCell>
      )}
    </CalendarGridHeader>
    <CalendarGridBody>
      {date => (
        <CalendarCell
          date={date}
          className={cx(
            DAY,
            dayClass,
            isSameDay(date, todayHere) && cx(TODAY, todayClass)
          )}
        />
      )}
    </CalendarGridBody>
  </CalendarGrid>
);
