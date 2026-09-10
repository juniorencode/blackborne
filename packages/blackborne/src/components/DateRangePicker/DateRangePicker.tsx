import { forwardRef } from 'react';
import {
  Button as AriaButton,
  DateRangePicker as AriaDateRangePicker,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Popover as AriaPopover,
  RangeCalendar as AriaRangeCalendar,
  type DateRangePickerProps as AriaDateRangePickerProps,
  type DateValue
} from 'react-aria-components';
import type { CalendarDate } from '@internationalized/date';
import { FRAME, RangeBody } from '../../internal/Calendar';
import {
  ClearDate,
  ControlFrame,
  DateSegments,
  Field
} from '../../internal/Field';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { ANCHORED, LAYER_OFFSET, PANEL } from '../../internal/Layer';
import { cx } from '../../internal/cx';
import { formatDay, parseDay } from '../../internal/isoDate';
import { useWindowFits } from '../../internal/useWindowFits';
import type { DateRange } from '../RangeCalendar';

export type DateRangePickerSize = 'sm' | 'md' | 'lg';

const SIZE: Record<DateRangePickerSize, string> = {
  sm: 'bb:h-control-sm',
  md: 'bb:h-control-md',
  lg: 'bb:h-control-lg'
};

/*
 * WHEN THE WINDOW HAS ROOM FOR TWO MONTHS, and the number is measured rather
 * than chosen: two months of grid are 408px (measured on `RangeCalendar`) and
 * the layer adds its padding and border, so the panel wants about 430. At
 * `34rem` — 544px — a window has that plus room either side, which a layer
 * anchored under a field needs because it may not sit against the edge.
 *
 * In `rem` and not pixels, for `Dialog.css`'s reason: a page at 200% zoom
 * crosses this threshold and gets one month, which is the correct outcome and
 * what doc 04 §10's zoom check wants.
 *
 * Deliberately NOT `--bb-container-medium`. That scale says how wide a
 * container is; this says when a window has run out of room, and tying them
 * together would make one unchangeable without the other (doc 04 §5, and the
 * same sentence `Dialog` carries).
 */
const ROOM_FOR_TWO = '(min-width: 34rem)';

/*
 * The group is the field's own row, and the base needs it: a range picker
 * publishes a group context whose ref is what the popover anchors to. So the
 * layer opens against the whole field rather than against one of its two
 * halves.
 */
const GROUP = cx(
  'bb-date-range-picker-group',
  'bb:box-border bb:flex bb:min-w-0 bb:flex-1 bb:items-center',
  'bb:gap-(--bb-space-1) bb:outline-hidden'
);

/*
 * THE MARK BETWEEN THE TWO HALVES, and it is punctuation rather than text.
 *
 * `aria-hidden`, because the two fields are named `start` and `end` by the base
 * and a reader announcing a dash between them would be reading the furniture.
 * Doc 05's rule is about strings a person READS; this is the same category as
 * the `/` inside a date, which the locale supplies and nobody announces.
 *
 * What it is NOT is a locale-aware range separator. `formatRange` has one — a
 * tilde in Japanese, a dash in English — and it describes a formatted range
 * rather than the gap between two inputs. Left as a question for the
 * screen-reader pass rather than guessed at.
 */
const DASH = cx(
  'bb-date-range-picker-dash',
  'bb:flex-none bb:select-none bb:text-text-muted'
);

const TOGGLE = cx(
  'bb-date-range-picker-toggle',
  /* `bb:group` here and not on the root: the `aria-expanded` is the trigger's. */
  'bb:group',
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

const CHEVRON = cx(
  'bb:h-mark bb:w-mark bb:flex-none',
  'bb:transition-[rotate] bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-aria-expanded:rotate-180'
);

const LAYER = cx(
  'bb-date-range-picker-layer',
  ANCHORED,
  'bb:z-(--bb-layer-popover)'
);

const LAYER_PANEL = cx(
  PANEL,
  'bb:min-h-0',
  'bb:border bb:rounded-lg',
  'bb:p-(--bb-space-2)'
);

export interface DateRangePickerProps extends Pick<
  AriaDateRangePickerProps<DateValue>,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'autoFocus'
  | 'shouldCloseOnSelect'
  | 'firstDayOfWeek'
> {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`. The project decides there is an error. */
  errorMessage?: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /** Waiting for data the field needs. */
  isLoading?: boolean;
  /** The value is being submitted. */
  isSaving?: boolean;
  /** Height and type size. Aligns with a Button of the same size. */
  size?: DateRangePickerSize;
  /** The chosen range, two ISO days (decision 0020). */
  value?: DateRange | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: DateRange;
  /**
   * Called with the range, or with `null` when the cross empties it.
   *
   * `null` arrives from that button and from nothing else, which doc 07 §2.2a
   * is the rule for: clearing a segment reports nothing at all.
   */
  onChange?: (value: DateRange | null) => void;
  /** The earliest day that can be chosen, as `2026-09-09`. */
  minValue?: string;
  /** The latest day that can be chosen. */
  maxValue?: string;
  /**
   * Which days cannot be chosen. The second argument is the day the range was
   * started from, or `null` before it is.
   *
   * **This is also where a maximum length lives.** "No more than fourteen
   * nights" is not a prop: it is this function, which the consumer already has
   * and which can answer a question no number can — a maximum that depends on
   * the anchor, on the room, or on who is asking.
   */
  isDateUnavailable?: (date: string, from: string | null) => boolean;
  /** Applied to the outermost element only (doc 02 §6). */
  className?: string;
}

/**
 * One control, two fields, and a pair of synchronised calendars in a layer.
 *
 * ```tsx
 * <DateRangePicker label="Stay" value={stay} onChange={setStay} />
 * ```
 *
 * ## Two fields, and the base names them
 *
 * The row is two rows of segments — `start` and `end` — with a mark between
 * them. Both are typed the way a single date is, and the base publishes their
 * props under named slots, so the shared segment row has to say which of the
 * two it is (measured: the field context carries `{ slots: { start, end } }`).
 *
 * ## How many months is the WINDOW's answer here
 *
 * The one place in this library that asks a viewport question, and doc 04 §5
 * reserves the exception for exactly this: a component rendered in a portal,
 * whose real container is the window. A range calendar on a page reads its own
 * container instead — but inline-size containment computes an element's width
 * as though it had no contents, so a declared container inside a
 * content-sized layer collapses to its borders (§4.3). The catalog predicted
 * this component would be the exception before either half existed.
 *
 * ## Presets are declared, and a maximum is a function
 *
 * There is no `presets` prop and no `maxDays`. "Last 30 days" is a string in
 * somebody's language and a computation against the zone the provider gave,
 * and a maximum that cannot depend on the anchor is a maximum that does not
 * survive its first real requirement — `isDateUnavailable` receives the anchor
 * and answers both.
 */
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  function DateRangePicker(
    {
      label,
      description,
      errorMessage,
      isLabelHidden = false,
      isLoading = false,
      isSaving = false,
      size = 'md',
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
    const chosen = toAria(value);
    const initial = toAria(defaultValue);
    const busy = isLoading || isSaving;
    const hasValue = value === undefined ? initial !== null : chosen !== null;
    const months = useWindowFits(ROOM_FOR_TWO) ? 2 : 1;

    return (
      <AriaDateRangePicker
        ref={ref}
        validationBehavior="aria"
        className={cx('bb:group bb:w-full', className)}
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
              onChange: (next: { start: DateValue; end: DateValue } | null) => {
                if (next === null) {
                  onChange(null);
                  return;
                }
                const start = formatDay(next.start as CalendarDate);
                const end = formatDay(next.end as CalendarDate);
                if (start !== null && end !== null) onChange({ start, end });
              }
            })}
      >
        <Field
          label={label}
          {...(description === undefined ? {} : { description })}
          {...(errorMessage === undefined ? {} : { errorMessage })}
          isRequired={ariaProps.isRequired ?? false}
          isLabelHidden={isLabelHidden}
          isLoading={isLoading}
          isSaving={isSaving}
        >
          <ControlFrame
            /*
             * Not a group: each of the two segment rows is one already, so the
             * frame being a third would put a name round a name round a name.
             */
            role="presentation"
            className={SIZE[size]}
            /*
             * Two controls at one edge, doc 07 §2.2a, and the same order the
             * date picker uses: the cross first, the chevron outermost, because
             * the chevron is the control with no alternative route.
             */
            trailing={
              <>
                <ClearDate
                  hasValue={hasValue}
                  isDisabled={ariaProps.isDisabled ?? false}
                />
                <AriaButton className={TOGGLE}>
                  <ChevronGlyph className={CHEVRON} />
                </AriaButton>
              </>
            }
            isTrailingHidden={busy || (ariaProps.isReadOnly ?? false)}
          >
            <AriaGroup className={GROUP}>
              <DateSegments slot="start" />
              <span aria-hidden="true" className={DASH}>
                –
              </span>
              <DateSegments slot="end" />
            </AriaGroup>
          </ControlFrame>
        </Field>

        <AriaPopover className={LAYER} offset={LAYER_OFFSET}>
          <div className={LAYER_PANEL}>
            <AriaDialog className="bb:outline-hidden">
              {/*
               * The calendar's BODY inside our own element, for the reason the
               * date picker has: the base names the dialog with the field's
               * label, and a public `RangeCalendar` would say it a second time.
               * Value, limits and unavailable days arrive through the base's
               * context, so nothing is passed down twice.
               */}
              {/*
               * `visibleDuration` PASSED, and the context does not carry it —
               * measured: the picker's `calendarProps` hold the value, the
               * limits, the unavailable days and the first day of the week, and
               * nothing about how many months are visible. So the count has to
               * reach the base's state as well as the grids, or the state
               * believes in one month while two are drawn and paging steps the
               * wrong distance.
               */}
              <AriaRangeCalendar
                className={FRAME}
                visibleDuration={{ months }}
                pageBehavior="single"
              >
                <RangeBody
                  months={months}
                  min={min}
                  max={max}
                  component="DateRangePicker"
                />
              </AriaRangeCalendar>
            </AriaDialog>
          </div>
        </AriaPopover>
      </AriaDateRangePicker>
    );
  }
);

/**
 * Our range, as the base's — or `null`.
 *
 * Both ends or neither, which `RangeCalendar` settled: a half-parsed range
 * would put the control in a state a person cannot see the shape of, and
 * `parseDay` has already said which string it could not read.
 */
const toAria = (
  range: DateRange | null | undefined
): { start: CalendarDate; end: CalendarDate } | null => {
  if (range === null || range === undefined) return null;
  const start = parseDay(range.start);
  const end = parseDay(range.end);
  return start === undefined || end === undefined ? null : { start, end };
};
