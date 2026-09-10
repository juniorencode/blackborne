import { forwardRef } from 'react';
import {
  TimeField as AriaTimeField,
  type TimeFieldProps as AriaTimeFieldProps,
  type TimeValue
} from 'react-aria-components';
import type { Time } from '@internationalized/date';
import {
  ClearDate,
  ControlFrame,
  DateSegments,
  Field,
  type ControlAlign
} from '../../internal/Field';
import { cx } from '../../internal/cx';
import { formatClock, parseClock } from '../../internal/isoTime';

export type TimeFieldSize = 'sm' | 'md' | 'lg';

const SIZE: Record<TimeFieldSize, string> = {
  sm: 'bb:h-control-sm',
  md: 'bb:h-control-md',
  lg: 'bb:h-control-lg'
};

/**
 * How much of a time the field asks for.
 *
 * Not `hour`: a field whose only segment is an hour is a select with two dozen
 * options, and it would be the one granularity where typing is slower than
 * choosing. The base offers it; this does not, because doc 02 §8's rule about
 * props applies to the values a prop accepts as well.
 */
export type TimePrecision = 'minute' | 'second';

export interface TimeFieldProps extends Pick<
  AriaTimeFieldProps<TimeValue>,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'autoFocus'
  | 'name'
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
  size?: TimeFieldSize;
  /**
   * The time, as `14:30` — the twenty-four hour clock whatever the locale
   * displays (decision 0020).
   *
   * Whether somebody SEES `2:30 PM` is the locale's business and not the
   * value's: an `en-US` field shows a twelve-hour clock with an AM/PM segment
   * and reports `14:30` all the same.
   */
  value?: string | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: string;
  /**
   * Called with the time, once the segments make one.
   *
   * `null` arrives from the cross and from nothing else, for the reason doc 07
   * §2.2a records about the date family: clearing a segment does not report
   * anything, so the button that empties the field is the only route by which
   * its value becomes nothing.
   */
  onChange?: (value: string | null) => void;
  /** The earliest time that can be chosen, as `09:00`. */
  minValue?: string;
  /** The latest time, as `18:00`. */
  maxValue?: string;
  /** How much of a time to ask for. Minutes by default. */
  precision?: TimePrecision;
  /** Where the value sits in its box (doc 02 §3.2). */
  align?: ControlAlign;
  /** Applied to the outermost element only (doc 02 §6). */
  className?: string;
}

/**
 * A time typed in pieces.
 *
 * ```tsx
 * <TimeField label="Opens at" value={time} onChange={setTime} />
 * ```
 *
 * The same segments a `DateField` has, asking for hours and minutes — and it
 * is the half of a time control that is a FIELD. The list-shaped half is a
 * `TimePicker`, which is where a minute step of 15 belongs: a restriction
 * nobody can honour while somebody types two digits is not a restriction, it
 * is a value the field would have to correct afterwards.
 *
 * ## The clock a person sees is the locale's
 *
 * Measured, and the measurement is a better argument than the guess it
 * replaced. `en-US` and `es-PE` BOTH show twelve hours and a third segment,
 * and they do not agree on what that segment says — `PM` against `p. m.`,
 * punctuation and spacing included. `ja-JP` shows twenty-four hours and two
 * segments. The value is `14:30` in all three (decision 0020).
 *
 * Which is the whole reason the boundary is a string rather than a formatted
 * time: a formatted one would carry a locale into data, and two locales that
 * agree on the CLOCK still disagree on how to write it.
 *
 * ## Its trailing edge has a cross
 *
 * Doc 07 §2.2a, and it applies here for the same measured reason it applies to
 * a date: clearing a segment reports nothing, so without the button the field
 * cannot say it was emptied. A `TimeField` opens no layer, so the cross is the
 * only control at that edge — the exception is what lets the two PICKERS keep
 * it beside a chevron.
 */
export const TimeField = forwardRef<HTMLDivElement, TimeFieldProps>(
  function TimeField(
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
      precision = 'minute',
      align,
      className,
      ...ariaProps
    },
    ref
  ) {
    const min = parseClock(minValue);
    const max = parseClock(maxValue);
    const chosen = parseClock(value);
    const initial = parseClock(defaultValue);
    const busy = isLoading || isSaving;
    const hasValue =
      value === undefined ? initial !== undefined : chosen !== undefined;

    return (
      <AriaTimeField
        ref={ref}
        validationBehavior="aria"
        className={cx('bb:group bb:w-full', className)}
        granularity={precision}
        {...ariaProps}
        {...(value === undefined ? {} : { value: chosen ?? null })}
        {...(initial === undefined ? {} : { defaultValue: initial })}
        {...(min === undefined ? {} : { minValue: min })}
        {...(max === undefined ? {} : { maxValue: max })}
        {...(onChange === undefined
          ? {}
          : {
              onChange: (next: TimeValue | null) => {
                onChange(formatClock(next as Time | null));
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
             * NOT A GROUP, because the control inside it already is one — the
             * base's `DateInput` renders a group so the row of segments has a
             * name to belong to, and two nested groups with one name is what a
             * reader says twice.
             */
            role="presentation"
            className={SIZE[size]}
            {...(align === undefined ? {} : { align })}
            trailing={
              <ClearDate
                hasValue={hasValue}
                isDisabled={ariaProps.isDisabled ?? false}
              />
            }
            isTrailingHidden={busy || (ariaProps.isReadOnly ?? false)}
          >
            <DateSegments />
          </ControlFrame>
        </Field>
      </AriaTimeField>
    );
  }
);
