import { forwardRef, useRef } from 'react';
import {
  RangeCalendar as AriaRangeCalendar,
  type RangeCalendarProps as AriaRangeCalendarProps,
  type DateValue
} from 'react-aria-components';
import type { CalendarDate } from '@internationalized/date';
import { FRAME, RangeBody } from '../../internal/Calendar';
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
        <RangeBody
          months={months}
          min={min}
          max={max}
          component="RangeCalendar"
        />
      </AriaRangeCalendar>
    );
  }
);

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
