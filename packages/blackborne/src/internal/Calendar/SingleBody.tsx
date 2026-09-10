import { useState, type ReactElement } from 'react';
import type { CalendarDate } from '@internationalized/date';
import { CalendarChrome, PeriodView, useEitherCalendar } from './Chrome';
import { MonthGrid } from './MonthGrid';
import { useDayFormatters, useTodayHere } from './zone';
import { cx } from '../cx';
import type { View } from './classes';

/*
 * ONE MONTH, ITS HEADER AND THE TWO VIEWS ABOVE IT — everything inside an
 * `AriaCalendar` and nothing about the element itself.
 *
 * The split is what lets the two callers differ where they have to. A public
 * `Calendar` owns its element: it requires a label, sets `aria-label` from it,
 * and maps ISO strings onto the base's props. A `DatePicker` owns a different
 * element: the base hands it value, limits and unavailable days through a
 * context, and the NAME belongs to the dialog around it — measured, the
 * picker's `calendarProps` carry no `aria-label` at all and the dialog gets
 * `aria-labelledby` pointing at the toggle and the field's label. A calendar
 * inside a picker that named itself would say the field's name twice.
 *
 * Extracted rather than solved by making the public `label` optional, which
 * was the other way out: a grid of numbers with no name is a grid of numbers
 * (doc 06 §2), and a required prop that a component silently forgives is a
 * required prop in name only.
 */
export const SingleBody = ({
  min,
  max,
  todayClass,
  component
}: {
  min?: CalendarDate | undefined;
  max?: CalendarDate | undefined;
  /** What today's ring becomes on the fill this caller paints. */
  todayClass?: string;
  /** Whose name goes in the "no time zone" warning. */
  component: string;
}): ReactElement => {
  const [view, setView] = useState<View>('days');
  const formatters = useDayFormatters();
  const todayHere = useTodayHere(component);

  return (
    <>
      <Title view={view} onView={setView} min={min} max={max} />
      {view === 'days' ? (
        <MonthGrid
          todayHere={todayHere}
          {...(todayClass === undefined ? {} : { todayClass })}
        />
      ) : (
        <PeriodView
          view={view}
          onView={setView}
          min={min}
          max={max}
          formatters={formatters}
        />
      )}
    </>
  );
};

/**
 * The header, a component of its own for one reason: the days-view title is
 * built from the base's state, which only exists INSIDE the calendar.
 *
 * One month, so the title is the focused date's own month.
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
  const focused = useEitherCalendar()?.focusedDate;

  return (
    <CalendarChrome
      view={view}
      onView={onView}
      min={min}
      max={max}
      formatters={formatters}
      daysTitle={focused === undefined ? '' : formatters.month(focused)}
    />
  );
};

/*
 * TODAY'S RING, ON THE ONE FILL A SINGLE CALENDAR PAINTS.
 *
 * A chosen day is the solid accent pair, so on it the ring is the pair's own
 * text colour — a grey ring inside an accent fill is a grey ring nobody can
 * see, which the first calendar baseline is what found. Everywhere else the
 * shared `TODAY` has already drawn it in `--bb-text-muted`.
 *
 * Here rather than in the shared class because `data-selected` does not mean
 * the same thing in both calendars: measured, a range calendar puts it on
 * every day of its band, where white would be 1.12:1.
 */
export const TODAY_ON_ACCENT = cx(
  'bb:data-selected:shadow-[inset_0_0_0_1px_var(--bb-accent-on)]'
);
