import { forwardRef } from 'react';
import {
  Button as AriaButton,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Popover as AriaPopover,
  Select as AriaSelect,
  SelectValue,
  type Key,
  type ListBoxItemProps as AriaListBoxItemProps,
  type SelectProps as AriaSelectProps
} from 'react-aria-components';
import {
  CONTROL_INSIDE,
  CONTROL_TEXT,
  ControlFrame,
  Field
} from '../../internal/Field';
import { VisuallyHidden } from '../VisuallyHidden';
import { useMessage } from '../../config';
import { CheckGlyph } from '../../internal/CheckGlyph';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { ANCHORED, LAYER_OFFSET, PANEL } from '../../internal/Layer';
import { cx } from '../../internal/cx';

export type SelectSize = 'sm' | 'md' | 'lg';

/*
 * The same heights and type sizes as every other field and as `Button`, which
 * is what makes a select, a text field and a button of the same size line up
 * in one row — a required check in doc 03 §9, and one of the details that most
 * gives away a system that is not one.
 */
const SIZE: Record<SelectSize, { frame: string; text: string }> = {
  sm: { frame: 'bb:h-control-sm', text: 'bb:text-xs' },
  md: { frame: 'bb:h-control-md', text: 'bb:text-md' },
  lg: { frame: 'bb:h-control-lg', text: 'bb:text-lg' }
} satisfies Record<SelectSize, { frame: string; text: string }>;

/*
 * The control is a BUTTON filling the frame, so the box the frame draws is the
 * field's box and the press target is the whole of it.
 *
 * `CONTROL_INSIDE` is the same class a text field's input takes: it fills the
 * row and takes the horizontal padding, so the value starts where a typed
 * value would. Nothing here draws a border or a background — the frame does,
 * which is what keeps one definition of a field's box (doc 03 §4.4).
 */
const TRIGGER = cx(
  'bb-select-trigger',
  CONTROL_INSIDE,
  CONTROL_TEXT,
  'bb:flex bb:items-center bb:justify-between bb:gap-x-(--bb-space-2)',
  'bb:cursor-pointer bb:text-start bb:outline-hidden'
);

/*
 * The value, or the placeholder when there is none.
 *
 * `data-placeholder` is the base's, and the muted colour is doc 03 §4.7's
 * second text level: a placeholder is not the value, and the difference has to
 * be visible without being a second colour nobody can name.
 */
const VALUE = cx(
  'bb-select-value',
  'bb:min-w-0 bb:truncate',
  'bb:data-placeholder:text-text-muted'
);

/*
 * The mark, turning over when the list is open.
 *
 * `group-data-open` reads the state off the select's root, which is the group.
 * Down and up rather than along the inline axis, so nothing about it is
 * directional and RTL needs no rule (doc 05 §4).
 */
const CHEVRON = cx(
  'bb-select-chevron',
  'bb:h-mark bb:w-mark bb:flex-none bb:text-text-muted',
  'bb:transition-[rotate] bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-data-open:rotate-180',
  'bb:group-data-disabled:text-text-disabled'
);

/*
 * The list, and the one thing that makes this different from every other
 * anchored layer in the library: IT IS AS WIDE AS THE FIELD.
 *
 * The base publishes the trigger's width on the popover as `--trigger-width`,
 * and this is the case the catalog recorded as pending one — a popover that
 * matches its trigger. A list narrower than the field it belongs to reads as a
 * different control, and one wider covers what is beside it.
 *
 * `min-w` rather than `w`, so a long option can still make the list wider than
 * the field rather than truncating every row. The maximum is the narrow
 * container, as a menu's is.
 *
 * The variable is the base's, spelled its way — the same coupling a
 * disclosure's height animation has. If it were renamed the declaration
 * becomes invalid and the list falls back to its content width, with nothing
 * in the console; the browser check measures the two widths against each
 * other for that reason.
 */
const LIST_WRAPPER = cx(
  'bb-select-list',
  ANCHORED,
  'bb:z-(--bb-layer-popover)',
  'bb:min-w-(--trigger-width) bb:max-w-narrow'
);

const LIST_PANEL = cx(
  PANEL,
  'bb:min-h-0',
  'bb:border bb:rounded-lg',
  'bb:p-(--bb-space-1)'
);

const LIST = cx(
  'bb-select-options',
  'bb:box-border bb:flex bb:min-h-0 bb:flex-col',
  'bb:overflow-y-auto bb:outline-hidden',
  'bb:font-sans bb:text-md bb:leading-normal'
);

/*
 * An option.
 *
 * `data-focused` and not `data-hovered`, for the reason a menu's command
 * records: a list has ONE highlight and the base moves it on hover as well as
 * on a key, so styling hover separately would put two marks on the screen for
 * one position.
 *
 * The chosen option is marked by a tick AND by weight, never by the highlight
 * alone: the highlight says where you are and the tick says what is chosen,
 * and in a list you have just opened those are two different rows.
 */
const OPTION = cx(
  'bb-select-option',
  // The group the tick reads its state from, which is the item and not the
  // field: the root is a group too and never carries `data-selected`.
  'bb:group',
  'bb:box-border bb:flex bb:min-h-hit bb:items-center',
  'bb:justify-between bb:gap-x-(--bb-space-3)',
  'bb:px-(--bb-space-3) bb:py-(--bb-space-2)',
  'bb:rounded-md bb:cursor-pointer bb:select-none bb:outline-hidden',
  'bb:text-text',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-focused:bg-surface-hover',
  'bb:data-pressed:bg-surface-active',
  'bb:data-selected:font-strong',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

/*
 * The tick. ALWAYS RENDERED, and hidden until the option is the chosen one.
 *
 * Two reasons, and the second one is the whole reason this file was rewritten.
 *
 * The row does not move. A tick that appears and goes takes its width with it,
 * so every label would shift sideways as the selection walked down the list —
 * doc 09 §7's "nothing moves under the cursor", in a list somebody is moving
 * through with the arrows.
 *
 * And the collection needs plain text. The first version drew the tick from a
 * render function, which made the item's children a function rather than a
 * string — so the base could derive no `textValue`, and **the typeahead
 * silently stopped working**: typing `e` in a currency list moved nothing.
 * Measured, and the base had said so all along in a development warning that
 * nothing in this repository was reading.
 *
 * `visibility` rather than a conditional, which is also doc 02 §4: style
 * against the DOM state attributes the base exposes, never against a class
 * string built in JavaScript. The glyph is `aria-hidden` either way, so
 * leaving the accessibility tree is no loss (the package guide's note on
 * hiding).
 */
const TICK = cx(
  'bb-select-tick',
  'bb:h-mark bb:w-mark bb:flex-none bb:text-accent',
  'bb:invisible bb:group-data-selected:visible',
  /*
   * AND GONE ENTIRELY INSIDE THE TRIGGER, which is a phantom box found while
   * building `TimePicker`.
   *
   * `SelectValue` renders the selected row's own children — all of them — so
   * the trigger contains a copy of this glyph. `visibility: hidden` keeps a
   * box, deliberately, so the row does not move as the selection walks: the
   * consequence is 16px of invisible width inside `.bb-select-value`, which is
   * `truncate`, so a long value shows its ellipsis 16px early for no reason
   * anybody could see.
   *
   * `display: none` is right in the TRIGGER for the same reason `visibility`
   * is right in the row: there is nothing in the trigger for it to keep a
   * place for.
   */
  'bb:[.bb-select-value_&]:hidden'
);

export interface SelectProps extends Omit<
  AriaSelectProps<Record<string, never>>,
  | 'children'
  | 'className'
  | 'style'
  | 'selectedKey'
  | 'defaultSelectedKey'
  | 'onSelectionChange'
> {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /** The options: `SelectItem` elements. */
  children: React.ReactNode;
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`. The project decides there is an error and writes it. */
  errorMessage?: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /**
   * Waiting for the options themselves, which is the case this field has and
   * a text field does not: a list that arrives from somewhere.
   */
  isLoading?: boolean;
  /** The value is being submitted. */
  isSaving?: boolean;
  /** Height and type size. Aligns with a `Button` of the same size. */
  size?: SelectSize;
  /**
   * Which option is chosen, by its `id`.
   *
   * A string rather than the base's `string | number`, which is the narrower
   * promise doc 08 §7.1 asks for: the base's own types stay out of a
   * consumer's signatures.
   */
  selectedKey?: string | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultSelectedKey?: string;
  /**
   * Called with the chosen option's `id`, or `null`.
   *
   * `null` is not defensive: a select whose `selectedKey` is set back to
   * nothing reports that, and a consumer holding the value in their own state
   * has to be able to see it happen. It is the same shape as `selectedKey`
   * itself, which is what makes the pair round-trip.
   */
  onSelectionChange?: (key: string | null) => void;
  /**
   * Applied to the field's outermost element, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/**
 * Choosing one of a short list.
 *
 * ```tsx
 * <Select label="Currency" defaultSelectedKey="PEN" onSelectionChange={set}>
 *   <SelectItem id="PEN">Peruvian sol</SelectItem>
 *   <SelectItem id="USD">US dollar</SelectItem>
 * </Select>
 * ```
 *
 * The first **composed field**: the field structure every other field is built
 * from, with a layer hanging off it. Which means it inherits both halves of the
 * library at once — the label, description and error relationships from one,
 * and the placement, the dismissal and the focus return from the other.
 *
 * ## The list is as wide as the field
 *
 * The only anchored layer here that is. A list narrower than the field it
 * belongs to reads as a different control; the base publishes the trigger's
 * width and this is the case the catalog had recorded as pending one.
 *
 * ## What it is not
 *
 * **Not a `ComboBox`.** There is no typing and no filtering: for a list long
 * enough to need either, that is a different component, and building a worse
 * one here is the "two different ways" of doc 01 §7. The keyboard's typeahead
 * jumps to an option by its first letters, which is what a select gives
 * instead.
 *
 * **Not multiple choice.** Choosing several of a set is a `CheckboxGroup`, or
 * a `ComboBox` when the set is long — and a select that could do both would
 * announce itself differently in each mode.
 *
 * **And it has no read-only state**, because the base's select has none: a
 * select is either offered or it is not. Doc 07 §6's read-only row belongs to
 * the fields you can type in, where the difference between "you may not change
 * this" and "this is switched off" is visible in the value.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  function Select(
    {
      label,
      children,
      description,
      errorMessage,
      isLabelHidden = false,
      isLoading = false,
      isSaving = false,
      size = 'md',
      onSelectionChange,
      className,
      ...ariaProps
    },
    ref
  ) {
    const busy = isLoading || isSaving;
    const isRequired = ariaProps.isRequired ?? false;
    const requiredWord = useMessage('required');

    /*
     * THE REQUIRED STATE HAS TO BE SAID OUT LOUD HERE, and this is the one
     * place in the library that does it.
     *
     * `Field` marks a required label with an asterisk and hides it from the
     * reader, on the grounds that the base sets `aria-required` — true of an
     * input, and measured false of a select: the base puts `required` on the
     * hidden native control it renders for the form, and the button a person
     * actually operates carries nothing. So the asterisk would have been the
     * only channel, and an asterisk announces nothing.
     *
     * The word goes inside the LABEL, which is what the base points the
     * control's `aria-labelledby` at — so it becomes part of the accessible
     * name: "Currency required". Visually hidden, so the asterisk stays the
     * visible channel and nothing is said twice.
     *
     * Not passed to `Field` as a new prop, because `Field` cannot know which
     * of its containers publishes the attribute. The component with the gap is
     * the component that fills it, with the reason beside it (doc 06 §2) —
     * decision 0017, which also records why writing `aria-required` here would
     * not have worked: the base's DOM-prop allow-list drops it.
     */
    const named = isRequired ? (
      <>
        {label}
        <VisuallyHidden> {requiredWord}</VisuallyHidden>
      </>
    ) : (
      label
    );

    return (
      <AriaSelect
        /*
         * `validationBehavior="aria"` for the reason every other field in this
         * library sets it: the browser's own bubble is not styleable, not
         * translatable through the dictionary, and appears where the browser
         * decides. The library presents the error itself (doc 07 §1).
         */
        validationBehavior="aria"
        className={cx('bb:group bb:w-full', className)}
        {...ariaProps}
        {...(onSelectionChange === undefined
          ? {}
          : {
              /*
               * The base hands back `string | number`; ours promises a string,
               * and every id that can enter came in as one. Mapped rather than
               * cast, for the reason `Accordion` records: a cast proves it once
               * and then hopes.
               */
              onSelectionChange: (key: Key | null) => {
                onSelectionChange(key === null ? null : String(key));
              }
            })}
      >
        <Field
          label={named}
          {...(description === undefined ? {} : { description })}
          {...(errorMessage === undefined ? {} : { errorMessage })}
          isRequired={isRequired}
          isLabelHidden={isLabelHidden}
          isLoading={isLoading}
          isSaving={isSaving}
        >
          <ControlFrame
            className={cx(SIZE[size].frame, busy && 'bb:pe-9')}
            /*
             * Passed rather than inherited, and measured: the base's
             * `TextField` publishes a group context that a frame reads these
             * from, and its `Select` does not. Without them the box would look
             * ordinary while the field was invalid or switched off.
             */
            {...(ariaProps.isInvalid === undefined
              ? {}
              : { isInvalid: ariaProps.isInvalid })}
            {...(ariaProps.isDisabled === undefined
              ? {}
              : { isDisabled: ariaProps.isDisabled })}
          >
            <AriaButton ref={ref} className={cx(TRIGGER, SIZE[size].text)}>
              <SelectValue className={VALUE} />
              <ChevronGlyph className={CHEVRON} />
            </AriaButton>
          </ControlFrame>
        </Field>
        <AriaPopover className={LIST_WRAPPER} offset={LAYER_OFFSET}>
          <div className={LIST_PANEL}>
            <AriaListBox className={LIST}>{children}</AriaListBox>
          </div>
        </AriaPopover>
      </AriaSelect>
    );
  }
);

export interface SelectItemProps extends Pick<
  AriaListBoxItemProps,
  'isDisabled' | 'textValue'
> {
  /**
   * Its identity, and what `selectedKey` names. A string, so nothing about the
   * base's key type reaches a consumer.
   */
  id: string;
  /** What it says. */
  children: React.ReactNode;
  /** Applied to the row. Nothing reaches an internal node (doc 02 §6). */
  className?: string;
}

/**
 * One option in a `Select`. Only useful inside one.
 *
 * The chosen option shows a tick, and the tick is the point: the highlight
 * says where you are in the list and the tick says what is chosen, and the
 * moment you open a list those are two different rows.
 */
export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  function SelectItem({ children, className, ...itemProps }, ref) {
    return (
      <AriaListBoxItem
        ref={ref}
        className={cx(OPTION, className)}
        /*
         * The searchable text, derived where it can be. The base needs one to
         * make the typeahead work and warns in development when an item's
         * children are not plain text — which anything wrapped in an element
         * is. So a string is passed through here, and a consumer whose option
         * is richer than a string says what it says with `textValue`.
         */
        {...(typeof children === 'string' ? { textValue: children } : {})}
        {...itemProps}
      >
        <span className="bb:min-w-0 bb:truncate">{children}</span>
        <CheckGlyph className={TICK} />
      </AriaListBoxItem>
    );
  }
);
