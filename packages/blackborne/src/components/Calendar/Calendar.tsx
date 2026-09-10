import { forwardRef } from 'react';
import {
  Calendar as AriaCalendar,
  type CalendarProps as AriaCalendarProps,
  type DateValue
} from 'react-aria-components';
import type { CalendarDate } from '@internationalized/date';
import { ROOT, SingleBody, TODAY_ON_ACCENT } from '../../internal/Calendar';
import { cx } from '../../internal/cx';
import { formatDay, parseDay } from '../../internal/isoDate';

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
 * A calendar that must not be changed is not a calendar: it is a formatted
 * date. `isDisabled` is the other thing — "this control is switched off" — and
 * it is worth knowing exactly what it does, because the first version of this
 * comment got it wrong: **a disabled calendar marks no selection at all.**
 * Measured, controlled and uncontrolled, single and range: the base drops
 * `data-selected` from every cell, so 0 of 35 are marked where an ordinary
 * calendar marks 1 or 8. Read-only is the state that keeps the value on
 * screen, and read-only is the one that cannot be told apart from editable.
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
 * of those can be pressed is arithmetic of ours —
 * `internal/Calendar/limits` has it, and the two cases that make it a
 * function rather than a comparison.
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
    const min = parseDay(minValue);
    const max = parseDay(maxValue);
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
        <SingleBody
          min={min}
          max={max}
          todayClass={TODAY_ON_ACCENT}
          component="Calendar"
        />
      </AriaCalendar>
    );
  }
);
