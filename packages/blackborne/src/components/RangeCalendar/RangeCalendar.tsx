import { forwardRef, useRef, useState } from 'react';
import {
  RangeCalendar as AriaRangeCalendar,
  type RangeCalendarProps as AriaRangeCalendarProps,
  type DateValue
} from 'react-aria-components';
import type { CalendarDate } from '@internationalized/date';
import {
  BODY,
  CalendarChrome,
  FRAME,
  MonthGrid,
  PeriodView,
  useDayFormatters,
  useEitherCalendar,
  useTodayHere,
  type View
} from '../../internal/Calendar';
import { cx } from '../../internal/cx';
import {
  CONTAINER_STEPS,
  useContainerStep
} from '../../internal/useContainerStep';
import { formatDay, parseDay } from '../../internal/isoDate';

/** A range, at the public boundary: two ISO days (decision 0020). */
export interface DateRange {
  /** The first day of the range, as `2026-09-09`. */
  start: string;
  /** The last day, inclusive. */
  end: string;
}

/*
 * NO `isReadOnly`, for the reason `Calendar` has none: the base's read-only
 * calendar photographed identically to an ordinary one, and two states nobody
 * can tell apart are worse than one.
 *
 * And NOT because disabled would do instead — measured while building this,
 * and it corrected `Calendar`'s own comment: a disabled calendar of either
 * kind marks no selection whatsoever. The base drops `data-selected` from
 * every cell, controlled or uncontrolled, so 0 of 35 are marked where an
 * ordinary range marks 8. A range that must not be changed is a formatted
 * range of dates, and the catalog's open question about a read-only
 * appearance is where the other answer would come from.
 */
export interface RangeCalendarProps extends Pick<
  AriaRangeCalendarProps<DateValue>,
  'isDisabled' | 'isInvalid' | 'firstDayOfWeek' | 'autoFocus'
> {
  /**
   * The calendar's own name, which the base announces with the months.
   *
   * "Stay", "Reporting period" — what the range is FOR. The headings say
   * which months are showing.
   */
  label: string;
  /** The chosen range, or `null` for none. */
  value?: DateRange | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: DateRange;
  /**
   * Called with the range that was chosen, once both ends are set.
   *
   * Never with `null`, for `Calendar`'s reason: choosing cannot report the
   * absence of a choice. A consumer who needs to clear the range sets it.
   */
  onChange?: (value: DateRange) => void;
  /** The earliest day that can be chosen, as `2026-09-09`. */
  minValue?: string;
  /** The latest day that can be chosen. */
  maxValue?: string;
  /**
   * Which days cannot be chosen.
   *
   * The second argument is the day the range was started from, or `null`
   * before it is — which is the base's own signature and the thing that makes
   * a rule like "no more than fourteen nights" expressible at all. It arrives
   * as `2026-09-09` for the same reason the first does (decision 0020).
   *
   * A range may not span an unavailable day: the base's default, and the safe
   * one, since a booking that quietly included a closed day would be worse
   * than one the calendar refused to draw.
   */
  isDateUnavailable?: (date: string, from: string | null) => boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

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
 * Two months, and the range across them.
 *
 * ```tsx
 * <RangeCalendar label="Stay" value={stay} onChange={setStay} />
 * ```
 *
 * ## How many months is the container's answer
 *
 * Two from the `medium` step up, one below it, through doc 04 §6's one hook —
 * the same scale, the same boundary and the same mechanism `Tabs` and the
 * folded breadcrumb trail use. A range calendar is sized by its own contents,
 * so it may not declare the query container it reads (doc 04 §4.3); with
 * nothing declaring one it stays at one month, which is §4.1's narrow-first
 * rule arriving on its own rather than a failure.
 *
 * **The arrows step one month whatever the structure**, which is a decision
 * rather than the base's default. `pageBehavior` defaults to advancing by the
 * whole visible duration, so the same press would move one month in a panel
 * and two in a page — a control whose meaning changes with the width, which is
 * exactly what doc 04 rule 4 asks components not to do.
 */
export const RangeCalendar = forwardRef<HTMLDivElement, RangeCalendarProps>(
  function RangeCalendar(
    {
      label,
      value,
      defaultValue,
      onChange,
      minValue,
      maxValue,
      isDateUnavailable,
      className,
      ...ariaProps
    },
    ref
  ) {
    const [view, setView] = useState<View>('days');
    const formatters = useDayFormatters();
    const todayHere = useTodayHere('RangeCalendar');

    /*
     * OBSERVED ON THE FRAME, and both halves of that matter.
     *
     * Doc 04 §11.1's rule is that the observed element must OUTLIVE both
     * structures: watch the row of months and the observer ends up on a
     * detached node the moment the count changes. The frame is there whichever
     * view is showing.
     *
     * And the half this component added to the rule: it must also CHANGE SIZE
     * with the container. The calendar's own box is sized by its contents, so
     * it measures 408px in a 640px container and 408px in a 320px one —
     * measured — the observer never fires, and the structure never changes.
     * The frame is full width for that reason and paints nothing; `classes.ts`
     * has the whole story.
     */
    const root = useRef<HTMLDivElement>(null);
    const step = useContainerStep(root);
    const months = step === 'base' || step === 'narrow' ? 1 : 2;

    const min = parseDay(minValue);
    const max = parseDay(maxValue);
    const chosen = toAria(value);
    const initial = toAria(defaultValue);

    return (
      <AriaRangeCalendar
        ref={mergeRefs(ref, root)}
        aria-label={label}
        className={cx(FRAME, CONTAINER_STEPS, className)}
        visibleDuration={{ months }}
        pageBehavior="single"
        {...ariaProps}
        {...(value === undefined ? {} : { value: chosen })}
        {...(initial === null ? {} : { defaultValue: initial })}
        {...(min === undefined ? {} : { minValue: min })}
        {...(max === undefined ? {} : { maxValue: max })}
        {...(isDateUnavailable === undefined
          ? {}
          : {
              isDateUnavailable: (date: DateValue, from: CalendarDate | null) =>
                isDateUnavailable(date.toString(), formatDay(from))
            })}
        {...(onChange === undefined
          ? {}
          : {
              onChange: (next: { start: DateValue; end: DateValue }) => {
                const start = formatDay(next.start as CalendarDate);
                const end = formatDay(next.end as CalendarDate);
                if (start !== null && end !== null) onChange({ start, end });
              }
            })}
      >
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
      </AriaRangeCalendar>
    );
  }
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

/**
 * Our range, as the base's — or `null`.
 *
 * Both ends or neither: a half-parsed range would put the calendar in a state
 * a person cannot see the shape of, and `parseDay` has already said in
 * development which string it could not read.
 */
const toAria = (
  range: DateRange | null | undefined
): { start: CalendarDate; end: CalendarDate } | null => {
  if (range === null || range === undefined) return null;
  const start = parseDay(range.start);
  const end = parseDay(range.end);
  return start === undefined || end === undefined ? null : { start, end };
};

/** Two refs on one element, and neither of them optional here. */
const mergeRefs =
  (
    forwarded: React.ForwardedRef<HTMLDivElement>,
    own: React.RefObject<HTMLDivElement | null>
  ) =>
  (element: HTMLDivElement | null): void => {
    own.current = element;
    if (typeof forwarded === 'function') forwarded(element);
    else if (forwarded !== null) forwarded.current = element;
  };
