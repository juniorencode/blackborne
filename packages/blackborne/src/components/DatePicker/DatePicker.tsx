import { forwardRef } from 'react';
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  DatePicker as AriaDatePicker,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Popover as AriaPopover,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue
} from 'react-aria-components';
import type { CalendarDate } from '@internationalized/date';
import { BODY, SingleBody, TODAY_ON_ACCENT } from '../../internal/Calendar';
import {
  ClearDate,
  ControlFrame,
  DateSegments,
  Field,
  type ControlAlign
} from '../../internal/Field';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { ANCHORED, LAYER_OFFSET, PANEL } from '../../internal/Layer';
import { cx } from '../../internal/cx';
import { formatDay, parseDay } from '../../internal/isoDate';

export type DatePickerSize = 'sm' | 'md' | 'lg';

const SIZE: Record<DatePickerSize, string> = {
  sm: 'bb:h-control-sm',
  md: 'bb:h-control-md',
  lg: 'bb:h-control-lg'
};

/*
 * The group is the field's own row, and it exists because the base needs it:
 * `DatePicker` publishes a group context whose ref is what the popover anchors
 * to. So the layer opens against the whole field rather than against the
 * segments, which is the difference between a calendar under the box and a
 * calendar under the day.
 */
const GROUP = cx(
  'bb-date-picker-group',
  'bb:box-border bb:flex bb:min-w-0 bb:flex-1 bb:items-center',
  'bb:outline-hidden'
);

/*
 * THE TOGGLE, and it is doc 07 §2.2 rule 5 arriving where the rule was written
 * for: a field that opens a layer keeps the chevron and has NO clear button.
 * A keyboard opens the layer with the chevron or types the date; emptying is a
 * segment at a time, which costs no width at the edge.
 */
const TOGGLE = cx(
  'bb-date-picker-toggle',
  /*
   * `bb:group` HERE, not on the root, and the package guide already had this
   * one written down from `SplitButton`: the open state belongs to the
   * POPOVER, which is portalled somewhere else entirely, and what the trigger
   * carries is `aria-expanded`. A variant keyed on a group whose root has no
   * such attribute matches nothing, so the chevron simply never turns — which
   * is what the first screenshot of this component showed.
   */
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

/* Turns over while the layer is open, the way a select's does. */
const CHEVRON = cx(
  'bb:h-mark bb:w-mark bb:flex-none',
  'bb:transition-[rotate] bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-aria-expanded:rotate-180'
);

const LAYER = cx('bb-date-picker-layer', ANCHORED, 'bb:z-(--bb-layer-popover)');

const LAYER_PANEL = cx(
  PANEL,
  'bb:min-h-0',
  'bb:border bb:rounded-lg',
  'bb:p-(--bb-space-2)'
);

export interface DatePickerProps extends Pick<
  AriaDatePickerProps<DateValue>,
  | 'isDisabled'
  | 'isReadOnly'
  | 'isRequired'
  | 'isInvalid'
  | 'autoFocus'
  | 'name'
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
  size?: DatePickerSize;
  /** The day, as `2026-09-09` (decision 0020). */
  value?: string | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: string;
  /** Called with the day, or with `null` when the field is emptied. */
  onChange?: (value: string | null) => void;
  /** The earliest day that can be chosen, as `2026-09-09`. */
  minValue?: string;
  /** The latest day that can be chosen. */
  maxValue?: string;
  /** Which days are taken. Receives the day as `2026-09-09`. */
  isDateUnavailable?: (date: string) => boolean;
  /** Where the value sits in its box (doc 02 §3.2). */
  align?: ControlAlign;
  /** Applied to the outermost element only (doc 02 §6). */
  className?: string;
}

/**
 * A date typed or pointed at, with a calendar in a layer.
 *
 * ```tsx
 * <DatePicker label="Appointment" value={day} onChange={setDay} />
 * ```
 *
 * ## Two routes to one value, and neither is a fallback
 *
 * The field is a `DateField`'s segments: somebody who knows the date types it
 * and never opens the layer. The chevron opens a `Calendar` for somebody
 * choosing rather than recalling — a Tuesday three weeks out, the last day of
 * the quarter. Both write the same string.
 *
 * ## The trailing edge holds the chevron, and nothing else
 *
 * Doc 07 §2.2 rule 5, which the wave that opened this batch added for exactly
 * this component: a field that opens a layer keeps the chevron and offers no
 * clear button. Emptying it is a segment at a time, which costs no width at
 * the edge — and swapping the chevron for a cross on hover would put the only
 * route to the calendar behind a pointer.
 *
 * ## What it composes rather than reimplements
 *
 * The segments are the same internal a `DateField` renders and the layer holds
 * the same `Calendar` a page can render inline. The picker adds the wiring:
 * the base hands the calendar its value, its limits and its unavailable days
 * through a context, so nothing is passed down by hand and the two cannot
 * disagree.
 */
export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(
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
    const hasValue =
      value === undefined ? initial !== undefined : chosen !== undefined;

    return (
      <AriaDatePicker
        ref={ref}
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
             * TWO CONTROLS AT ONE EDGE, which doc 07 §2.2a admits for exactly
             * this field and nothing else. Rule 5 sends a field that opens a
             * layer to the chevron alone, and its reason is that clearing has
             * a route costing no width — an option that returns to no value,
             * or the cross each value carries. A date has neither, and
             * measured, its segments cannot even report being emptied. So the
             * premise is false here and the conclusion does not follow.
             *
             * The cross comes FIRST, before the chevron: the chevron is the
             * control with no alternative route, so it keeps the outermost
             * place where a thumb reaches it.
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
            /*
             * Unreachable with its room kept — doc 07 §2.2 rule 1, and the
             * same condition a combo box uses: while the field is busy there
             * is nothing to open, and a read-only field is offered for reading,
             * so a toggle that will not open is an empty promise (doc 06 §4
             * point 7).
             */
            isTrailingHidden={busy || (ariaProps.isReadOnly ?? false)}
          >
            <AriaGroup className={GROUP}>
              <DateSegments />
            </AriaGroup>
          </ControlFrame>
        </Field>

        <AriaPopover className={LAYER} offset={LAYER_OFFSET}>
          <div className={LAYER_PANEL}>
            {/*
             * A DIALOG ROUND THE CALENDAR, which is the base's own shape and
             * not ours to skip: `DatePicker` publishes the dialog's props, and
             * without something to consume them the layer opens unnamed.
             *
             * And `Calendar` with NO value of its own: the base hands the
             * calendar its value, its limits and its unavailable days through
             * a context, so passing them down by hand would give one component
             * two sources for one answer. The label is the same — the dialog
             * carries the name the field already has.
             */}
            <AriaDialog className="bb:outline-hidden">
              <AriaCalendar className={BODY}>
                <SingleBody
                  min={min}
                  max={max}
                  todayClass={TODAY_ON_ACCENT}
                  component="DatePicker"
                />
              </AriaCalendar>
            </AriaDialog>
          </div>
        </AriaPopover>
      </AriaDatePicker>
    );
  }
);
