import { forwardRef, useContext, useMemo, useState } from 'react';
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarMonthPicker,
  CalendarStateContext,
  CalendarYearPicker,
  type CalendarProps as AriaCalendarProps,
  type DateValue
} from 'react-aria-components';
import {
  DateFormatter,
  today,
  type CalendarDate
} from '@internationalized/date';
import { useConfig } from '../../config';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { cx } from '../../internal/cx';
import { formatDay, isSameDay, parseDay } from '../../internal/isoDate';
import { useDevWarning } from '../../internal/useDevWarning';
import { isMonthWithinLimits, isYearWithinLimits } from './limits';

/** Which of the three chained views is showing. */
type View = 'days' | 'months' | 'years';

/*
 * "TAKE NO BUTTON CONTEXT", and this is the third component to need it.
 *
 * A `Calendar` publishes a SLOTTED `ButtonContext` — `previous` and `next` —
 * so every `Button` inside one must name a slot or the base throws "a slot
 * prop is required". Which is the loud version of the collision a `ComboBox`
 * has: there the context carries no slots, so a button inside one silently
 * wears the toggle's id and name instead (decision 0022).
 *
 * Both are the same rule seen from two sides: when a base component publishes
 * a context for its own child, every descendant of that type consumes it. An
 * explicit `null` slot takes none, which is read in the base's
 * `useSlottedContext`.
 *
 * Named rather than written inline five times, because five `slot={null}`
 * attributes with no comment is a thing somebody deletes.
 */
const NO_CONTEXT = null;

/** How many years a year view holds. Three rows of four, like the months. */
const VISIBLE_YEARS = 12;

/*
 * A MONTH IS A BLOCK, not a control, so nothing here is sized from the control
 * heights — a calendar is the one thing in this library whose size comes from
 * its contents rather than from the row it sits in.
 *
 * The width is the seven columns plus the gaps, and it is deliberately not a
 * fixed number: a cell is as wide as the minimum target, and seven of those
 * plus the padding is what a month measures. Which means compact density makes
 * a smaller calendar rather than a cramped one.
 */
const ROOT = cx(
  'bb-calendar',
  'bb:box-border bb:inline-flex bb:flex-col bb:gap-(--bb-space-2)',
  'bb:font-sans bb:text-md bb:leading-normal bb:text-text',
  'bb:data-disabled:text-text-disabled'
);

/* The row above the grid: back, the heading that changes the view, forward. */
const HEADER = cx(
  'bb-calendar-header',
  'bb:box-border bb:flex bb:items-center bb:justify-between',
  'bb:gap-(--bb-space-1)'
);

/*
 * The two arrows and the heading are all buttons, and they take the same shape
 * as an edge control rather than a `Button`: a calendar's own furniture is not
 * a call to action, and three primary buttons over a grid of numbers would
 * make the numbers the quiet part.
 */
const STEP = cx(
  'bb-calendar-step',
  'bb:box-border bb:flex bb:min-h-hit bb:min-w-hit bb:flex-none',
  'bb:items-center bb:justify-center bb:rounded-md',
  'bb:cursor-pointer bb:border-0 bb:bg-transparent bb:text-text-muted',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover bb:data-hovered:text-text',
  'bb:data-pressed:bg-surface-active',
  'bb:outline-hidden',
  'bb:data-focus-visible:bg-surface-hover bb:data-focus-visible:text-text',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

/* The heading, which is also the way into the next view up. */
const TITLE = cx(
  'bb-calendar-title',
  'bb:box-border bb:flex bb:min-h-hit bb:flex-1 bb:items-center',
  'bb:justify-center bb:gap-(--bb-space-1) bb:rounded-md',
  'bb:cursor-pointer bb:border-0 bb:bg-transparent',
  'bb:font-strong bb:text-text',
  'bb:transition-[background-color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover',
  'bb:data-pressed:bg-surface-active',
  'bb:outline-hidden',
  'bb:data-focus-visible:bg-surface-hover',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

const GRID = cx('bb-calendar-grid', 'bb:box-border bb:border-collapse');

/*
 * A weekday name, and it is `text-xs` and muted for the reason doc 03 §4.6a
 * gives: hierarchy comes from colour and weight, and a header that competed
 * with the numbers would turn a month into a table of two equal things.
 */
const WEEKDAY = cx(
  'bb-calendar-weekday',
  'bb:box-border bb:pb-(--bb-space-1)',
  'bb:text-xs bb:font-normal bb:text-text-muted'
);

/*
 * A DAY.
 *
 * `min-h-hit`/`min-w-hit` rather than a chosen size: doc 06 §3 asks for the
 * minimum target at every density, and a calendar is the densest grid of
 * targets this library has. Compact trims the number, never the cell.
 *
 * The selected day is the ACCENT PAIR taken together, and the ring is inside
 * the cell rather than around it — a 2px ring on a 28px cell in a grid with
 * 2px gaps would overlap its neighbours.
 */
const DAY = cx(
  'bb-calendar-day',
  'bb:box-border bb:flex bb:min-h-hit bb:min-w-hit',
  'bb:items-center bb:justify-center bb:rounded-md',
  'bb:cursor-pointer bb:select-none bb:outline-hidden',
  'bb:tabular-nums',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover',
  'bb:data-pressed:bg-surface-active',
  'bb:data-selected:bg-accent bb:data-selected:text-(color:--bb-accent-on)',
  'bb:data-focus-visible:border bb:data-focus-visible:border-solid',
  'bb:data-focus-visible:border-focus-ring',
  'bb:data-focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  /*
   * Unavailable is NOT disabled, and they look different because they are:
   * disabled is outside the calendar's range and unavailable is inside it and
   * taken. A struck-through number says "this day exists and you cannot have
   * it"; a dimmed one says "this day is not in the range you are choosing
   * from".
   */
  'bb:data-unavailable:line-through',
  'bb:data-unavailable:text-text-muted bb:data-unavailable:cursor-not-allowed',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled',
  /*
   * A day from the month either side. Present rather than blank, because a
   * grid with holes in it is harder to read than one with quiet edges — and
   * the base makes them unselectable already.
   */
  'bb:data-outside-month:text-text-disabled',
  'bb:data-outside-month:pointer-events-none'
);

/*
 * TODAY, and it is a ring rather than a fill — the fill belongs to the
 * selected day, and a day can be both.
 *
 * An inset shadow rather than a border, so it takes NO LAYOUT: a border would
 * make today's cell a pixel larger than the other thirty, and a grid with one
 * column a pixel out is a grid nobody can align.
 *
 * ## THE RING IS THE TEXT COLOUR OF WHATEVER IT SITS ON
 *
 * One rule with two answers, and both of them arrived from a baseline rather
 * than from an assertion.
 *
 * On the accent it is the pair's own text colour. A grey ring inside an accent
 * fill is a grey ring nobody can see, so the claim above — that a day can be
 * both — was true of the markup and false of the picture. Same technique as
 * the split button's divider, and it follows a brand override for free.
 *
 * On the surface it is `--bb-text-muted`, and NOT `--bb-border-strong`, which
 * is what it was until the picture showed the ordinary ring for the first
 * time. Measured against the resolved surface in both modes:
 *
 *     border-strong    1.86:1 light   3.01:1 dark
 *     text-muted       5.79:1 light   9.06:1 dark
 *
 * Doc 03 §5 rule 2 asks 3:1 of a graphical element, and today's ring is the
 * only thing marking today — so 1.86 is a hard rule broken in light mode and
 * scraped through in dark, which is the mode asymmetry that document warns
 * about in as many words. A border token is for a boundary you are not meant
 * to read; this ring carries the information.
 */
const TODAY = cx(
  'bb-calendar-today',
  'bb:shadow-[inset_0_0_0_1px_var(--bb-text-muted)]',
  'bb:data-selected:shadow-[inset_0_0_0_1px_var(--bb-accent-on)]',
  'bb:font-strong'
);

/* A month or a year in the two views above the days. */
const PERIOD = cx(
  'bb-calendar-period',
  'bb:box-border bb:flex bb:min-h-hit bb:items-center bb:justify-center',
  'bb:rounded-md bb:px-(--bb-space-2) bb:py-(--bb-space-1)',
  'bb:cursor-pointer bb:border-0 bb:bg-transparent bb:text-text',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover',
  'bb:data-pressed:bg-surface-active',
  'bb:outline-hidden',
  'bb:data-focus-visible:border bb:data-focus-visible:border-solid',
  'bb:data-focus-visible:border-focus-ring',
  'bb:data-focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

const PERIOD_CURRENT = cx(
  'bb:bg-accent bb:text-(color:--bb-accent-on)',
  'bb:font-strong'
);

const PERIODS = cx(
  'bb-calendar-periods',
  'bb:box-border bb:grid bb:grid-cols-4 bb:gap-(--bb-space-1)'
);

/** The chevron in an arrow, which flips with the direction on its own. */
const ARROW_BACK = cx('bb:h-mark bb:w-mark bb:rotate-90 bb:rtl:-rotate-90');
const ARROW_ON = cx('bb:h-mark bb:w-mark bb:-rotate-90 bb:rtl:rotate-90');

/*
 * NO `isReadOnly`, and the first baseline is what settled it.
 *
 * The base has one, and a read-only calendar photographed IDENTICALLY to an
 * ordinary one — which is the argument the catalog already accepted about a
 * read-only `Select`, arriving on a grid: on a control whose value is a
 * choice, "you may not change this" and "this is switched off" have the same
 * appearance, and painting two states nobody can tell apart is worse than
 * having one. Worse here, in fact, because a calendar that looks pressable and
 * is not is doc 06 §4 point 7 exactly.
 *
 * A calendar that must not be changed is `isDisabled` — visibly switched off,
 * with its chosen day still legible — or it is not a calendar at all but a
 * formatted date.
 */
export interface CalendarProps extends Pick<
  AriaCalendarProps<DateValue>,
  'isDisabled' | 'isInvalid' | 'firstDayOfWeek' | 'autoFocus'
> {
  /**
   * The calendar's own name, which the base announces with the month.
   *
   * Not visible: the heading says which month is showing, and what the
   * calendar is FOR is the label — "Appointment", "Invoice date". A grid of
   * numbers with no name is a grid of numbers.
   */
  label: string;
  /** The chosen day, as `2026-09-09` (decision 0020). */
  value?: string | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: string;
  /**
   * Called with the day that was chosen.
   *
   * Never with `null`: a calendar cannot be un-pressed, so nothing about
   * choosing a day can report the absence of one. A consumer who needs to
   * clear the value sets it themselves.
   */
  onChange?: (value: string) => void;
  /** The earliest day that can be chosen, as `2026-09-09`. */
  minValue?: string;
  /** The latest day that can be chosen. */
  maxValue?: string;
  /**
   * Which days inside the range cannot be chosen — a Sunday, a holiday, an
   * hour that is already booked.
   *
   * A function rather than a list, because the reason a day is taken is the
   * consumer's and a year of holidays is not a prop. It receives the day as
   * `2026-09-09`, which keeps the base's date objects out of a signature
   * (decision 0020) — and the cost of that is written down in the same place:
   * a consumer answering it needs their own arithmetic.
   */
  isDateUnavailable?: (date: string) => boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/**
 * The header, which is a component of its own because it reads the base's
 * state: which month is focused, and where the focus can go.
 *
 * The two arrows in the DAY view are the base's own `previous` and `next`
 * slots, which step a month and disable themselves at the limits. In the other
 * two views nothing in the base steps a year, so those arrows move the focused
 * date directly — and they take the limits from `limits.ts` rather than from
 * the base, which does not know those views exist.
 */
const Header = ({
  view,
  onView,
  min,
  max,
  formatMonth,
  formatYear,
  formatYears
}: {
  view: View;
  onView: (view: View) => void;
  min: CalendarDate | undefined;
  max: CalendarDate | undefined;
  formatMonth: (date: CalendarDate) => string;
  formatYear: (date: CalendarDate) => string;
  formatYears: (first: CalendarDate, last: CalendarDate) => string;
}) => {
  const state = useContext(CalendarStateContext);
  const focused = state?.focusedDate;

  const step = (years: number): void => {
    if (state === null || focused === undefined) return;
    state.setFocusedDate(focused.add({ years }));
  };

  const title =
    focused === undefined
      ? ''
      : view === 'days'
        ? formatMonth(focused)
        : view === 'months'
          ? formatYear(focused)
          : formatYears(
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
 * A month, and the marks on it.
 *
 * `data-today` is the base's and it is DELIBERATELY NOT STYLED. The base
 * computes today from the value's zone when the value carries one and from the
 * BROWSER's zone otherwise — read in `useCalendarState` — and doc 05 §3.1 is
 * unambiguous that the browser's zone belongs to the machine of whoever is
 * looking rather than to the data. So today is marked from the zone the
 * provider supplies, and with no zone configured nothing is marked: the
 * component says so in development rather than guessing which day it is.
 */
const Days = ({ todayHere }: { todayHere: CalendarDate | undefined }) => (
  <CalendarGrid className={GRID}>
    <CalendarGridHeader>
      {day => (
        <CalendarHeaderCell className={WEEKDAY}>{day}</CalendarHeaderCell>
      )}
    </CalendarGridHeader>
    <CalendarGridBody>
      {date => (
        <CalendarCell
          date={date}
          className={cx(DAY, isSameDay(date, todayHere) && TODAY)}
        />
      )}
    </CalendarGridBody>
  </CalendarGrid>
);

/**
 * A month of days, with the two views above it.
 *
 * ```tsx
 * <Calendar label="Appointment" value={day} onChange={setDay} />
 * ```
 *
 * The content of a date picker and a component in its own right: a scheduling
 * screen shows a month inline, and the picker that opens one is built out of
 * this rather than beside it.
 *
 * ## Three views, chained
 *
 * The heading is a button. From the days it opens the months, and from the
 * months the years — twelve at a time, three rows of four. Choosing a month
 * comes back to its days; choosing a year comes back to its months. Which
 * means reaching March 1994 is three presses rather than three hundred and
 * eighty arrow keys.
 *
 * **The limits hold in all three.** The base disables the days outside them
 * and clamps the years for us; it hands over every month regardless, so which
 * of those can be pressed is arithmetic of ours — `limits.ts` has it, and the
 * two cases that make it a function rather than a comparison.
 *
 * ## Today is the provider's day, not the browser's
 *
 * The base marks a `data-today` computed from the browser's zone, and this
 * component does not style it. Doc 05 §3.1: the browser's zone belongs to the
 * machine of whoever is looking. With a zone configured, today is marked from
 * it; with none, nothing is marked and development says why.
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(
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
    const { locale, timeZone } = useConfig();
    const [view, setView] = useState<View>('days');

    const min = parseDay(minValue);
    const max = parseDay(maxValue);

    /*
     * TODAY, from the zone the provider supplies. With none, nothing is marked
     * — and the warning is the "must ask for it rather than guess" the
     * configuration's own documentation asks of any component that needs a
     * zone.
     */
    useDevWarning(
      timeZone === undefined,
      'Calendar: no time zone is configured, so today is not marked. The ' +
        "browser's zone belongs to the machine of whoever is looking rather " +
        'than to the data (doc 05 §3.1), so this component will not guess ' +
        'it. Set `timeZone` on ConfigProvider.'
    );
    const todayHere = timeZone === undefined ? undefined : today(timeZone);

    /*
     * The three formatters, and all three render a DAY rather than an instant.
     *
     * `timeZone: 'UTC'` is not a zone the calendar is in — a day has no zone
     * at all, and formatting it against UTC is what keeps the ninth from
     * printing as the eighth somewhere. Which day it is TODAY is the only
     * question that needs the real zone, and it is answered above.
     */
    const formatters = useMemo(() => {
      const month = new DateFormatter(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      });
      const year = new DateFormatter(locale, {
        year: 'numeric',
        timeZone: 'UTC'
      });
      const monthName = new DateFormatter(locale, {
        month: 'long',
        timeZone: 'UTC'
      });

      return {
        month: (date: CalendarDate) => month.format(date.toDate('UTC')),
        year: (date: CalendarDate) => year.format(date.toDate('UTC')),
        monthName: (date: CalendarDate) => monthName.format(date.toDate('UTC')),
        /*
         * A RANGE FORMATTED BY THE PLATFORM, rather than two numbers and a
         * dash. Doc 05 §2.2 rule 5 forbids building a sentence out of
         * fragments, and "2020 – 2031" is exactly the fragment-gluing that
         * comes out backwards in some locales. `formatRange` is the tool that
         * exists for it.
         */
        years: (first: CalendarDate, last: CalendarDate) =>
          year.formatRange(first.toDate('UTC'), last.toDate('UTC'))
      };
    }, [locale]);

    const chosen = parseDay(value);
    const initial = parseDay(defaultValue);

    return (
      <AriaCalendar
        ref={ref}
        aria-label={label}
        className={cx(ROOT, className)}
        {...ariaProps}
        {...(value === undefined ? {} : { value: chosen ?? null })}
        {...(initial === undefined ? {} : { defaultValue: initial })}
        {...(min === undefined ? {} : { minValue: min })}
        {...(max === undefined ? {} : { maxValue: max })}
        {...(isDateUnavailable === undefined
          ? {}
          : {
              /*
               * The base asks about a date object; ours asks about a string.
               * Mapped rather than passed through, which is the cost decision
               * 0020 wrote down: the boundary is a string, so somebody has to
               * cross it, and it is this line rather than every consumer.
               */
              isDateUnavailable: (date: DateValue) =>
                isDateUnavailable(date.toString())
            })}
        {...(onChange === undefined
          ? {}
          : {
              onChange: (next: DateValue) => {
                const day = formatDay(next as CalendarDate);
                if (day !== null) onChange(day);
              }
            })}
      >
        <Header
          view={view}
          onView={setView}
          min={min}
          max={max}
          formatMonth={formatters.month}
          formatYear={formatters.year}
          formatYears={formatters.years}
        />

        {view === 'days' ? <Days todayHere={todayHere} /> : null}

        {view === 'months' ? (
          <CalendarMonthPicker>
            {({ items, value: current, onChange: pick }) => (
              <div className={PERIODS}>
                {items.map(item => (
                  <AriaButton
                    key={item.id}
                    slot={NO_CONTEXT}
                    className={cx(
                      PERIOD,
                      item.id === current && PERIOD_CURRENT
                    )}
                    /*
                     * The base hands over every month whatever the limits say
                     * — measured — so this is where a month with nothing in it
                     * is switched off.
                     */
                    isDisabled={!isMonthWithinLimits(item.date, min, max)}
                    onPress={() => {
                      pick(item.id);
                      setView('days');
                    }}
                  >
                    {formatters.monthName(item.date)}
                  </AriaButton>
                ))}
              </div>
            )}
          </CalendarMonthPicker>
        ) : null}

        {view === 'years' ? (
          <CalendarYearPicker visibleYears={VISIBLE_YEARS}>
            {({ items, value: current, onChange: pick }) => (
              <div className={PERIODS}>
                {items.map(item => (
                  <AriaButton
                    key={item.id}
                    slot={NO_CONTEXT}
                    className={cx(
                      PERIOD,
                      item.id === current && PERIOD_CURRENT
                    )}
                    onPress={() => {
                      pick(item.id);
                      setView('months');
                    }}
                  >
                    {item.formatted}
                  </AriaButton>
                ))}
              </div>
            )}
          </CalendarYearPicker>
        ) : null}
      </AriaCalendar>
    );
  }
);
