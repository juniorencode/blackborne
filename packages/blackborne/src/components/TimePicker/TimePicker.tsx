import { forwardRef, useMemo } from 'react';
import { CalendarDateTime, DateFormatter, Time } from '@internationalized/date';
import {
  Select,
  SelectItem,
  type SelectProps,
  type SelectSize
} from '../Select';
import { useConfig, useMessage } from '../../config';
import { clockSteps, formatClock, parseClock } from '../../internal/isoTime';
import { useDevWarning } from '../../internal/useDevWarning';

/** The row that means no time, which is also what `null` is called. */
const NONE = '__bb-no-time';

export type TimePickerSize = SelectSize;

export interface TimePickerProps extends Pick<
  SelectProps,
  | 'isDisabled'
  | 'isRequired'
  | 'isInvalid'
  | 'autoFocus'
  | 'name'
  | 'placeholder'
  /*
   * The layer's own state, forwarded because `Select` has it and one control
   * behaving differently costs the credibility of the rest (doc 09 §8). It is
   * also what lets the open list be photographed — a prop that exists for the
   * catalog alone would not be worth having, and this one does not.
   */
  | 'isOpen'
  | 'defaultOpen'
  | 'onOpenChange'
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
  /** Height and type size. Aligns with a field of the same size. */
  size?: TimePickerSize;
  /** The time, as `14:30` (decision 0020). */
  value?: string | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: string;
  /** Called with `14:30`, or `null` when the no-time row is chosen. */
  onChange?: (value: string | null) => void;
  /**
   * The gap between one row and the next, in minutes. **Defaults to 15.**
   *
   * This is the prop the whole component exists for. A segmented `TimeField`
   * cannot honour a step — the restriction has no expression between the first
   * keystroke and the second, which is a **Never** in the catalog — and a list
   * can, because every reachable value is a row.
   */
  step?: number;
  /** The earliest row, as `09:00`. Inclusive. */
  minValue?: string;
  /** The latest row, as `18:00`. Inclusive, when the step reaches it. */
  maxValue?: string;
  /**
   * Applied to the field's outermost element, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/**
 * A time chosen from a list, on a step.
 *
 * ```tsx
 * <TimePicker
 *   label="Opens at"
 *   value={opens}
 *   onChange={setOpens}
 *   step={15}
 *   minValue="06:00"
 *   maxValue="22:00"
 * />
 * ```
 *
 * ## Two components share one name, and this is the choosing half
 *
 * `TimeField` types and this chooses, which is
 * [decision 0015](../../../../docs/decisions/0015-a-stepper-is-two-components.md)'s
 * shape rather than a new argument. **There are no segments here on purpose.**
 * A field somebody can type into cannot honour a step, so a picker with both
 * would offer `:00`, `:15`, `:30` and `:45` in its list and accept `14:37`
 * from the keyboard — a restriction that holds in one half of the control and
 * not the other, which is worse than not having it.
 *
 * So: an arbitrary time is a `TimeField`. A time from a set is this.
 *
 * ## It is a `Select` with the rows generated
 *
 * Not columns in a layer, which is what the catalog predicted, and the row now
 * records why. A `Select` already has the trigger, the popover, the list width,
 * the tick, the typeahead, the required state and the whole keyboard; the only
 * thing this component adds is which rows exist and what a row is called. An
 * assembly may not have a capability its pieces lack (P6's corollary), and
 * this one has exactly `Select`'s.
 *
 * **The rows are `clockSteps`, a pure function**, tested without rendering:
 * given a step and two bounds it is a list. At the default step that is 96
 * rows, which the base's popover caps and scrolls on its own.
 *
 * ## Emptying is a row rather than a cross
 *
 * Doc 07 §2.2 rule 5 sends a field that opens a layer to the chevron alone,
 * and its reason is that clearing has a route costing no width — "an option
 * that returns to no value". This component OWNS its options, so it provides
 * exactly that route: while the field is not required, the first row means no
 * time.
 *
 * Which is why this is not §2.2a's third case, as the catalog expected. That
 * exception exists because a date field's segments cannot report being emptied
 * — measured — and nothing here is unobservable: choosing the first row puts
 * the placeholder back where the value was.
 */
export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(
  function TimePicker(
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
      step = 15,
      minValue,
      maxValue,
      className,
      ...selectProps
    },
    ref
  ) {
    const { locale } = useConfig();
    const noTime = useMessage('noTime');

    const chosen = parseClock(value);
    const initial = parseClock(defaultValue);

    const rows = useMemo(() => {
      const from = parseClock(minValue);
      const to = parseClock(maxValue);
      const found = clockSteps({
        stepMinutes: step,
        ...(from === undefined ? {} : { from }),
        ...(to === undefined ? {} : { to })
      });

      /*
       * THE VALUE IS ADDED WHEN THE STEP DOES NOT REACH IT.
       *
       * A picker configured for quarter hours and handed `14:37` from a server
       * would otherwise have no row to select, and the trigger would show the
       * placeholder — a field holding a value and showing none, which is the
       * one thing a field may not do. So the value joins the list, in order,
       * and the development warning below says the configuration disagrees
       * with the data.
       */
      const held = chosen ?? initial;
      if (held === undefined) return found;

      const iso = formatClock(held);
      if (found.some(one => formatClock(one) === iso)) return found;

      const at = held.hour * 60 + held.minute;
      const before = found.filter(one => one.hour * 60 + one.minute < at);
      return [...before, held, ...found.slice(before.length)];
    }, [step, minValue, maxValue, chosen, initial]);

    useDevWarning(
      rows.length > 288,
      `TimePicker: a step of ${step} minute(s) makes ${rows.length} rows, ` +
        'which is a document rather than a list. The step is what keeps a ' +
        'picker usable; an arbitrary time is a TimeField.'
    );

    const held = chosen ?? initial;
    useDevWarning(
      held !== undefined &&
        (held.hour * 60 + held.minute) % Math.max(1, Math.floor(step)) !== 0,
      `TimePicker: the value ${formatClock(held ?? null) ?? ''} is not on a ` +
        `${step}-minute step, so it has been added to the list as a row of ` +
        'its own. Either the step or the data is wrong.'
    );

    /*
     * THE ROW'S WORDS COME FROM THE LOCALE, AND THE ZONE IS UTC.
     *
     * A time of day has no zone — the same argument the calendar's month
     * headings use — so formatting it against UTC is what keeps `14:15` from
     * printing as `09:15` for somebody in Lima. The date the formatter is
     * handed is arbitrary and invisible, because the only fields asked for are
     * the hour and the minute.
     *
     * And this is why the VALUE is not the label: `en-US` and `es-PE` both
     * show a twelve-hour clock and disagree about how to write the marker —
     * `PM` against `p. m.` — while `ja-JP` shows twenty-four hours and no
     * marker at all. Measured, on `TimeField`, and it is decision 0020's
     * argument made visible.
     */
    const say = useMemo(() => {
      const formatter = new DateFormatter(locale, {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC'
      });
      return (time: Time) =>
        formatter.format(
          new CalendarDateTime(2026, 1, 1, time.hour, time.minute).toDate('UTC')
        );
    }, [locale]);

    const selected = formatClock(chosen ?? null);
    const initialKey = formatClock(initial ?? null);

    return (
      <Select
        ref={ref}
        label={label}
        {...(description === undefined ? {} : { description })}
        {...(errorMessage === undefined ? {} : { errorMessage })}
        isLabelHidden={isLabelHidden}
        isLoading={isLoading}
        isSaving={isSaving}
        size={size}
        {...(className === undefined ? {} : { className })}
        {...selectProps}
        /*
         * `null` rather than the sentinel, because the sentinel is a row's id
         * and not a value: a controlled field holding nothing has no row
         * selected, which is what puts the placeholder back.
         */
        {...(value === undefined ? {} : { selectedKey: selected })}
        {...(initialKey === null ? {} : { defaultSelectedKey: initialKey })}
        {...(onChange === undefined
          ? {}
          : {
              onSelectionChange: (key: string | null) => {
                onChange(key === null || key === NONE ? null : key);
              }
            })}
      >
        {/*
         * The no-time row, and only while the field is optional. It is rule
         * 5's "option that returns to no value", provided by the component
         * because the component owns the list.
         */}
        {(selectProps.isRequired ?? false) ? null : (
          <SelectItem id={NONE}>{noTime}</SelectItem>
        )}
        {rows.map(time => {
          const iso = formatClock(time) ?? '';
          return (
            <SelectItem key={iso} id={iso}>
              {say(time)}
            </SelectItem>
          );
        })}
      </Select>
    );
  }
);
