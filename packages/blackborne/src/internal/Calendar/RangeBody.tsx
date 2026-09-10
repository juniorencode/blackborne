import { useState, type ReactElement } from 'react';
import type { CalendarDate } from '@internationalized/date';
import { CalendarChrome, PeriodView, useEitherCalendar } from './Chrome';
import { MonthGrid } from './MonthGrid';
import { useDayFormatters, useTodayHere } from './zone';
import { cx } from '../cx';
import { BODY, type View } from './classes';

/*
 * ONE MONTH OR TWO, THEIR HEADER AND THE TWO VIEWS ABOVE THEM — everything
 * inside an `AriaRangeCalendar` and nothing about the element.
 *
 * `SingleBody`'s sibling, split for the same reason and a second one. The
 * first: a public `RangeCalendar` owns its element (it requires a label and
 * maps ISO strings) and a `DateRangePicker` owns a different one (the base
 * hands it value and limits through a context, and the NAME belongs to the
 * dialog).
 *
 * The second is the interesting one, and the catalog predicted it. **How many
 * months is not the same question in the two callers.** A `RangeCalendar` on a
 * page reads its own container, through doc 04 §6's hook. A range calendar
 * inside a POPOVER cannot: inline-size containment computes an element's width
 * as though it had no contents, so a declared container inside a
 * content-sized layer collapses to its borders (§4.3) — which is why doc 04
 * §5 reserves the viewport exception for exactly what renders in a portal. So
 * the count ARRIVES here rather than being decided here, and each caller
 * answers the question it is actually able to.
 */
export const RangeBody = ({
  months,
  min,
  max,
  component
}: {
  /** How many months to show. The caller's answer, for the reason above. */
  months: 1 | 2;
  min?: CalendarDate | undefined;
  max?: CalendarDate | undefined;
  /** Whose name goes in the "no time zone" warning. */
  component: string;
}): ReactElement => {
  const [view, setView] = useState<View>('days');
  const formatters = useDayFormatters();
  const todayHere = useTodayHere(component);

  return (
    <div className={BODY}>
      <Title view={view} onView={setView} min={min} max={max} />

      {view === 'days' ? (
        <div className={MONTHS}>
          <MonthGrid
            todayHere={todayHere}
            dayClass={RANGE}
            todayClass={TODAY_ON_RANGE}
          />
          {months === 2 ? (
            <MonthGrid
              todayHere={todayHere}
              offset={{ months: 1 }}
              dayClass={RANGE}
              todayClass={TODAY_ON_RANGE}
            />
          ) : null}
        </div>
      ) : (
        <PeriodView
          view={view}
          onView={setView}
          min={min}
          max={max}
          formatters={formatters}
        />
      )}
    </div>
  );
};

/*
 * THE MONTHS SIT IN A ROW, and the row is what the container step chooses the
 * contents of rather than the shape of.
 */
const MONTHS = cx(
  'bb-range-calendar-months',
  'bb:box-border bb:flex bb:flex-row bb:gap-(--bb-space-4)'
);

/*
 * A RANGE, PAINTED AS ONE SHAPE.
 *
 * Three states rather than two, and they are three different sentences: the
 * two ends are the days somebody chose, everything between them is the range
 * they cover, and a day outside is untouched.
 *
 * The band is `--bb-accent-subtle` WITH `--bb-accent-subtle-on`, because doc
 * 03 §4.0 has no standalone "text on a soft accent" — there is a pair, and
 * using half of one is how contrast breaks when a consumer overrides the
 * brand. The ends are the solid pair, which is the same fill a single chosen
 * day gets, so one component's selection reads the same in both calendars.
 *
 * The corners are LOGICAL — `rounded-s` and `rounded-e` — so a range in Arabic
 * rounds the end a reader arrives at first without this file knowing which
 * side that is. And the middle is square on purpose: the cells are edge to
 * edge (measured, see `MonthGrid`), so square middles make one continuous
 * band where rounded ones would make a row of separate blocks.
 */

/*
 * TODAY'S RING, ON THE TWO FILLS A RANGE PAINTS.
 *
 * Three backgrounds, three colours, one rule: the ring is the text colour of
 * whatever is behind it. The shared class has already drawn it in
 * `--bb-text-muted` for a day on the page surface; these two are the band and
 * the ends.
 *
 * The middle one is the reason this exists. `data-selected` covers every day of
 * the band, so a rule written for the accent fill painted the ring white on a
 * pale blue band — measured at 1.12:1, which is not a ring, it is nothing. Doc
 * 03 §5 rule 2 asks 3:1 of a graphical element and this one is the only mark
 * for today.
 */
const TODAY_ON_RANGE = cx(
  'bb:data-selected:shadow-[inset_0_0_0_1px_var(--bb-accent-subtle-on)]',
  'bb:data-selected:data-selection-start:shadow-[inset_0_0_0_1px_var(--bb-accent-on)]',
  'bb:data-selected:data-selection-end:shadow-[inset_0_0_0_1px_var(--bb-accent-on)]'
);

const RANGE = cx(
  'bb-range-calendar-day',
  'bb:data-selected:rounded-none',
  'bb:data-selected:bg-accent-subtle',
  'bb:data-selected:text-(color:--bb-accent-subtle-on)',
  /*
   * AN END IS ONLY AN END WHILE IT IS ALSO SELECTED, and both variants are
   * stacked for that reason rather than for specificity.
   *
   * Measured, and it produced two defects from one cause. The base marks
   * `data-selection-start` and `data-selection-end` on cells that carry no
   * `data-selected` at all:
   *
   * - **On the copy of a day in the neighbouring month.** Two months side by
   *   side overlap by a week, so the range's start appeared as a solid pill in
   *   September's grid AND again in October's outside-month row — two starts on
   *   screen for one range, and the second one disconnected from any band.
   * - **On a disabled calendar**, where the band goes and the two ends stay:
   *   0 cells selected, 2 still marked as ends, so a stay read as two separate
   *   days chosen. A different value from the one being held.
   *
   * Requiring both makes the fill follow the selection, which is what it was
   * always meant to mean. The first baseline is what found it.
   */
  'bb:data-selected:data-selection-start:rounded-s-md',
  'bb:data-selected:data-selection-start:bg-accent',
  'bb:data-selected:data-selection-start:text-(color:--bb-accent-on)',
  'bb:data-selected:data-selection-end:rounded-e-md',
  'bb:data-selected:data-selection-end:bg-accent',
  'bb:data-selected:data-selection-end:text-(color:--bb-accent-on)'
);

/**
 * The header, and the one title the shared furniture cannot build.
 *
 * The visible range is read from the base's state, so this has to sit inside
 * the calendar — and it is `formatRange` rather than two headings glued
 * together, which collapses a shared year on its own: "September – October
 * 2026" for two months and "September 2026" for one, in the locale's own
 * order (doc 05 §2.2 rule 5).
 */
const Title = ({
  view,
  onView,
  min,
  max
}: {
  view: View;
  onView: (view: View) => void;
  min: CalendarDate | undefined;
  max: CalendarDate | undefined;
}) => {
  const formatters = useDayFormatters();
  const visible = useEitherCalendar()?.visibleRange;

  return (
    <CalendarChrome
      view={view}
      onView={onView}
      min={min}
      max={max}
      formatters={formatters}
      daysTitle={
        visible === undefined
          ? ''
          : formatters.monthRange(visible.start, visible.end)
      }
    />
  );
};
