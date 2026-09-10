import { forwardRef } from 'react';
import {
  DateField as AriaDateField,
  type DateFieldProps as AriaDateFieldProps,
  type DateValue
} from 'react-aria-components';
import type { CalendarDate } from '@internationalized/date';
import {
  ClearDate,
  ControlFrame,
  DateSegments,
  Field,
  type ControlAlign
} from '../../internal/Field';
import { cx } from '../../internal/cx';
import { formatDay, parseDay } from '../../internal/isoDate';

export type DateFieldSize = 'sm' | 'md' | 'lg';

/*
 * The same heights and type sizes as every other field, which is what makes a
 * date field, a text field and a button of the same size line up in one row
 * (doc 03 §9).
 */
const SIZE: Record<DateFieldSize, string> = {
  sm: 'bb:h-control-sm',
  md: 'bb:h-control-md',
  lg: 'bb:h-control-lg'
};

export interface DateFieldProps extends Pick<
  AriaDateFieldProps<DateValue>,
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
  size?: DateFieldSize;
  /** The day, as `2026-09-09` (decision 0020). */
  value?: string | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: string;
  /**
   * Called with the day, once the segments make one.
   *
   * **EMPTYING THE FIELD IS NOT OBSERVABLE**, which is measured rather than
   * assumed and is worth knowing before building on it: clearing the month and
   * the day leaves the reported value at the last complete date, and the year
   * segment does not clear at all. So `null` follows the base's own type
   * rather than a path this component was seen to take — a consumer cannot
   * rely on the field to say it was emptied, and one that needs to know reads
   * the segments' own state or offers its own way to clear.
   */
  onChange?: (value: string | null) => void;
  /** The earliest day that can be typed, as `2026-09-09`. */
  minValue?: string;
  /** The latest day that can be typed. */
  maxValue?: string;
  /**
   * Which days are taken. Receives the day as `2026-09-09`.
   *
   * A typed date that is unavailable makes the field invalid rather than
   * refusing the keystroke: doc 07 §2's line between restricting input and
   * judging a value. The segments already refuse the 31st of February, which
   * is a different thing — that is not a date.
   */
  isDateUnavailable?: (date: string) => boolean;
  /**
   * Where the value sits in its box. `start | center | end`, never
   * `left`/`right` (doc 02 §3.2).
   */
  align?: ControlAlign;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout (doc 02 §6).
   */
  className?: string;
}

/**
 * A date typed rather than pointed at.
 *
 * ```tsx
 * <DateField label="Invoice date" value={day} onChange={setDay} />
 * ```
 *
 * ## Why this exists beside a picker
 *
 * It is the picker's own input, so it is built either way — and a dense form
 * often wants nothing more than this. Typing `09092026` is faster than three
 * presses and a hunt through a grid for anybody who knows the date they want,
 * which on an invoice screen is everybody.
 *
 * ## The segments are the keyboard route
 *
 * Day, month and year are separate targets: the arrows step one, `Tab` moves
 * between them, typing fills the one that has focus and moves on. An
 * impossible date cannot be written — the 31st of February refuses the second
 * digit rather than accepting it and complaining later — which is doc 07 §2's
 * restriction rather than validation.
 *
 * **Their order and their separators come from the locale**, never from this
 * library: month first in `en-US`, day first in `es-PE`, year first in
 * `ja-JP`. Nothing here formats a date by hand.
 *
 * ## Its value is a string
 *
 * `2026-09-09` in and out (decision 0020), with `null` when the field is
 * emptied — which a calendar never reports, because a day cannot be
 * un-pressed. A half-typed date reports nothing at all: the base holds the
 * segments until they make a date.
 */
export const DateField = forwardRef<HTMLDivElement, DateFieldProps>(
  function DateField(
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
      align,
      className,
      ...ariaProps
    },
    ref
  ) {
    const min = parseDay(minValue);
    const max = parseDay(maxValue);
    const chosen = parseDay(value);
    const initial = parseDay(defaultValue);
    const busy = isLoading || isSaving;

    /*
     * WHETHER THERE IS ANYTHING TO CLEAR, and it is deliberately not read from
     * the base's state: an uncontrolled field's value lives there, but a
     * controlled one's lives in the prop, and the cross has to appear in both.
     * `undefined` means uncontrolled, so the field starts with whatever
     * `defaultValue` gave it and the base tells the cross nothing it does not
     * already know — the button clears the state either way, and a controlled
     * consumer hears about it through `onChange`.
     */
    const hasValue =
      value === undefined ? initial !== undefined : chosen !== undefined;

    return (
      <AriaDateField
        ref={ref}
        /*
         * `validationBehavior="aria"` for the reason every field in this
         * library sets it: the browser's own bubble is not styleable, not
         * translatable through the dictionary, and appears where the browser
         * decides. The library presents the error itself (doc 07 §1).
         */
        validationBehavior="aria"
        className={cx('bb:group bb:w-full', className)}
        {...ariaProps}
        {...(value === undefined ? {} : { value: chosen ?? null })}
        {...(initial === undefined ? {} : { defaultValue: initial })}
        {...(min === undefined ? {} : { minValue: min })}
        {...(max === undefined ? {} : { maxValue: max })}
        {...(isDateUnavailable === undefined
          ? {}
          : {
              isDateUnavailable: (date: DateValue) =>
                isDateUnavailable(date.toString())
            })}
        {...(onChange === undefined
          ? {}
          : {
              onChange: (next: DateValue | null) => {
                onChange(formatDay(next as CalendarDate | null));
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
             * NOT A GROUP, because the control inside it already is one: the
             * base's `DateInput` renders a group so the row of segments has a
             * name to belong to. Two nested groups with one name is what a
             * reader would hear twice.
             */
            role="presentation"
            className={SIZE[size]}
            {...(align === undefined ? {} : { align })}
            /*
             * A CROSS, and it is doc 07 §2.2a's exception rather than the
             * ordinary clear button: emptying a date field is otherwise
             * unobservable, so this is the one route by which its value
             * becomes nothing. A `DateField` opens no layer, so it is the
             * only control at this edge — the exception is what lets the
             * PICKER keep it beside a chevron.
             */
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
      </AriaDateField>
    );
  }
);
