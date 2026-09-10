import { useContext, type ContextType, type ReactElement } from 'react';
import {
  Button as AriaButton,
  CalendarMonthPicker,
  CalendarStateContext,
  CalendarYearPicker,
  RangeCalendarStateContext
} from 'react-aria-components';
import type { CalendarDate } from '@internationalized/date';
import { ChevronGlyph } from '../ChevronGlyph';
import { cx } from '../cx';
import { isMonthWithinLimits, isYearWithinLimits } from './limits';
import {
  ARROW_BACK,
  ARROW_ON,
  HEADER,
  NO_CONTEXT,
  PERIOD,
  PERIOD_CURRENT,
  PERIODS,
  STEP,
  TITLE,
  VISIBLE_YEARS,
  type View
} from './classes';

/**
 * The three formatters a calendar's furniture needs.
 *
 * Built by the component, because the locale arrives on the configuration and
 * a memo belongs where the locale is read.
 */
export interface PeriodFormatters {
  month: (date: CalendarDate) => string;
  year: (date: CalendarDate) => string;
  monthName: (date: CalendarDate) => string;
  years: (first: CalendarDate, last: CalendarDate) => string;
}

/**
 * Whichever of the two states is above, or `null` outside both.
 *
 * Derived from the base's own contexts rather than imported: the state types
 * live in `react-stately`, which is not a dependency of ours and which the
 * project's lint rule keeps out on purpose — reaching past the base's public
 * entry point turns a minor upgrade into a breaking one.
 */
type EitherCalendarState =
  | ContextType<typeof CalendarStateContext>
  | ContextType<typeof RangeCalendarStateContext>;

/*
 * WHICHEVER CALENDAR IS ABOVE THIS, and it is not a convenience.
 *
 * A `Calendar` publishes `CalendarStateContext`. A `RangeCalendar` publishes
 * `RangeCalendarStateContext` and NOT the other one — measured in the base's
 * source, and the fourth context collision this batch has produced. A shared
 * header that read only the first would find `null` inside a range calendar
 * and quietly render no title and two dead arrows.
 *
 * `??` rather than a prop saying which one, because this is exactly what the
 * base's own `CalendarGrid`, `CalendarHeading`, `CalendarMonthPicker` and
 * `CalendarYearPicker` do: `calendarState || rangeCalendarState`. Following
 * the base rather than inventing a second convention is decision 0007's
 * argument applied to a context instead of a prop name.
 */
export const useEitherCalendar = (): EitherCalendarState => {
  const single = useContext(CalendarStateContext);
  const range = useContext(RangeCalendarStateContext);
  return single ?? range;
};

/**
 * The row above the grid, and the two views it chains into.
 *
 * The two arrows in the DAY view are the base's own `previous` and `next`
 * slots, which step the visible range and disable themselves at the limits. In
 * the other two views nothing in the base steps a year, so those arrows move
 * the focused date directly — and they take the limits from `limits.ts` rather
 * than from the base, which does not know those views exist.
 */
export const CalendarChrome = ({
  view,
  onView,
  min,
  max,
  formatters,
  daysTitle
}: {
  view: View;
  onView: (view: View) => void;
  min: CalendarDate | undefined;
  max: CalendarDate | undefined;
  formatters: PeriodFormatters;
  /*
   * THE ONE THING THE TWO CALENDARS DO NOT SHARE, so it arrives rather than
   * being computed here: one month says "September 2026" and two say
   * "September – October 2026", and the second is a range formatted by the
   * platform rather than two titles glued together (doc 05 §2.2 rule 5).
   */
  daysTitle: string;
}): ReactElement => {
  const state = useEitherCalendar();
  const focused = state?.focusedDate;

  const step = (years: number): void => {
    if (state === null || state === undefined || focused === undefined) return;
    state.setFocusedDate(focused.add({ years }));
  };

  const title =
    view === 'days'
      ? daysTitle
      : focused === undefined
        ? ''
        : view === 'months'
          ? formatters.year(focused)
          : formatters.years(
              focused.add({ years: -Math.floor(VISIBLE_YEARS / 2) }),
              focused.add({ years: Math.ceil(VISIBLE_YEARS / 2) - 1 })
            );

  /* The days view has the base's own arrows; the others are stepped here. */
  const yearsPerStep = view === 'months' ? 1 : VISIBLE_YEARS;
  const canStep = (direction: -1 | 1): boolean => {
    if (focused === undefined) return false;
    const target = focused.add({ years: direction * yearsPerStep });
    return view === 'months'
      ? isYearWithinLimits(target, min, max)
      : isYearWithinLimits(target, min, max) ||
          isYearWithinLimits(
            target.add({ years: direction * (VISIBLE_YEARS - 1) }),
            min,
            max
          );
  };

  return (
    <div className={HEADER}>
      {view === 'days' ? (
        <AriaButton slot="previous" className={STEP}>
          <ChevronGlyph className={ARROW_BACK} />
        </AriaButton>
      ) : (
        <AriaButton
          slot={NO_CONTEXT}
          className={STEP}
          isDisabled={!canStep(-1)}
          onPress={() => step(-yearsPerStep)}
        >
          <ChevronGlyph className={ARROW_BACK} />
        </AriaButton>
      )}

      <AriaButton
        /*
         * No ambient button context — see the note on `NO_CONTEXT`.
         */
        slot={NO_CONTEXT}
        className={TITLE}
        /*
         * The year view is the top of the chain, so its heading changes
         * nothing rather than wrapping around to the days: a control that
         * cycles has no state a person can predict, and doc 06 §4 point 7
         * would rather it did not act at all.
         */
        isDisabled={view === 'years'}
        onPress={() => onView(view === 'days' ? 'months' : 'years')}
      >
        {title}
      </AriaButton>

      {view === 'days' ? (
        <AriaButton slot="next" className={STEP}>
          <ChevronGlyph className={ARROW_ON} />
        </AriaButton>
      ) : (
        <AriaButton
          slot={NO_CONTEXT}
          className={STEP}
          isDisabled={!canStep(1)}
          onPress={() => step(yearsPerStep)}
        >
          <ChevronGlyph className={ARROW_ON} />
        </AriaButton>
      )}
    </div>
  );
};

/**
 * The months of a year, and the years around one.
 *
 * Rendered by the caller only when the view is one of those two, so the day
 * grid is not built behind them.
 */
export const PeriodView = ({
  view,
  onView,
  min,
  max,
  formatters
}: {
  view: Exclude<View, 'days'>;
  onView: (view: View) => void;
  min: CalendarDate | undefined;
  max: CalendarDate | undefined;
  formatters: PeriodFormatters;
}): ReactElement =>
  view === 'months' ? (
    <CalendarMonthPicker>
      {({ items, value: current, onChange: pick }) => (
        <div className={PERIODS}>
          {items.map(item => (
            <AriaButton
              key={item.id}
              slot={NO_CONTEXT}
              className={cx(PERIOD, item.id === current && PERIOD_CURRENT)}
              /*
               * The base hands over every month whatever the limits say —
               * measured — so this is where a month with nothing in it is
               * switched off.
               */
              isDisabled={!isMonthWithinLimits(item.date, min, max)}
              onPress={() => {
                pick(item.id);
                onView('days');
              }}
            >
              {formatters.monthName(item.date)}
            </AriaButton>
          ))}
        </div>
      )}
    </CalendarMonthPicker>
  ) : (
    <CalendarYearPicker visibleYears={VISIBLE_YEARS}>
      {({ items, value: current, onChange: pick }) => (
        <div className={PERIODS}>
          {items.map(item => (
            <AriaButton
              key={item.id}
              slot={NO_CONTEXT}
              className={cx(PERIOD, item.id === current && PERIOD_CURRENT)}
              onPress={() => {
                pick(item.id);
                onView('months');
              }}
            >
              {item.formatted}
            </AriaButton>
          ))}
        </div>
      )}
    </CalendarYearPicker>
  );
