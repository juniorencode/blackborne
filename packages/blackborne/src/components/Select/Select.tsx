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
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { ANCHORED, LAYER_OFFSET, PANEL } from '../../internal/Layer';
import { cx } from '../../internal/cx';
import type { ValidationProps } from '../../internal/validationProps';

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
  'bb:cursor-pointer bb:text-start bb:outline-hidden',
  /*
   * The package ships no reset, so a `<button>` arrives with the browser's own
   * 1px of vertical padding. It cost nothing while the trigger held only text;
   * it made the chevron's square 40 inside a 42 frame the moment that square
   * started stretching to the trigger's content box.
   */
  'bb:py-0'
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
 * The square the chevron sits in.
 *
 * It is NOT a button — the whole trigger opens the list, and a button inside a
 * button is not a thing — but it occupies the same square as the edge controls
 * every other field puts there: a cross, a reveal toggle, a combo box's
 * chevron. Without it the mark floated one control-padding in from the edge
 * and a select in a column of fields had its mark in a different place from
 * all of them.
 *
 * The negative margin cancels the trigger's own trailing padding so the square
 * reaches the frame, which is what the others do by being in the edge slot.
 * Logical, so it mirrors with the direction.
 */
const CHEVRON_BOX = cx(
  'bb:flex bb:items-center bb:justify-center',
  'bb:aspect-square bb:flex-none bb:self-stretch',
  'bb:-me-(--bb-control-padding-x)'
);

/*
 * THE RING STAYS WHILE THE LIST IS OPEN.
 *
 * A select moves focus INTO the layer when it opens, so the frame loses
 * `data-focus-within` and went back to its resting edge the moment the list
 * appeared — the one moment the field is most obviously the thing being used.
 * A combo box does not have this problem because its input keeps focus.
 *
 * `data-open` is on the select's ROOT, which is the group — the same state the
 * chevron turns on. And the hovered pair is stacked for the reason the frame's
 * own focus rules are: two single variants setting one property are decided by
 * emission order, so a pointer resting on an open select would take the edge
 * back again.
 */
const OPEN_RING = cx(
  'bb:group-data-open:border-focus-ring',
  'bb:data-hovered:group-data-open:border-focus-ring',
  'bb:group-data-open:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]'
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
  /*
   * NO SHADOW. `PANEL` brings `shadow-lg`, which is right for a dialog or a
   * drawer floating over a page — and a select's list is not floating over the
   * page so much as hanging off the field, a few pixels below it.
   *
   * What holds it up instead is the border it already draws plus the raised
   * fill: measured in light, the panel is #f7f9fb against a white page with a
   * 1px edge, which is the same way the field above it is held. In dark the
   * surface does the lifting anyway — doc 03 §5 rule 5, a shadow is barely
   * visible on a dark ground — so nothing is lost there at all.
   */
  'bb:shadow-none',

  /*
   * Step 2, and it was step 1. At 2px the rows were nearly touching the
   * panel's own border — enough to keep them off it and not enough to read as
   * a margin, so the list looked like it had overflowed its box.
   */
  'bb:p-(--bb-space-2)'
);

const LIST = cx(
  'bb-select-options',
  'bb:box-border bb:flex bb:min-h-0 bb:flex-col',
  'bb-scroller',
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
 * The chosen option is marked by a BAND and by weight, never by the highlight
 * alone: the highlight says where you are and the band says what is chosen,
 * and in a list you have just opened those are two different rows. It was a
 * tick at the trailing edge until 2026-09-13 — see the note on the band
 * below.
 */
const OPTION = cx(
  'bb-select-option',
  // The group a descendant reads `data-selected` from, which is the item and
  // not the field: the root is a group too and never carries it.
  'bb:group',
  'bb:box-border bb:flex bb:min-h-hit bb:items-center',
  'bb:justify-between bb:gap-x-(--bb-space-3)',
  'bb:px-(--bb-space-3) bb:py-(--bb-space-2)',
  'bb:rounded-md bb:cursor-pointer bb:select-none bb:outline-hidden',
  'bb:text-text',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  /*
   * `surface-raised-hover`, not `surface-hover`.
   *
   * These rows sit on a RAISED panel and not on the page, and `surface-hover`
   * is chosen against the page — on a near-white panel it landed two steps
   * away and read as a slab. The token that belongs to this ground is the one
   * to use, and naming it is what made the second half visible: in dark it is
   * still DARKER than the panel it sits on, where the same idea on the page
   * goes lighter. That direction is an open decision, recorded in
   * `semantic.css` rather than guessed at here.
   */
  'bb:data-focused:bg-surface-raised-hover',
  'bb:data-pressed:bg-surface-active',
  /*
   * THE CHOSEN ROW IS A SOFT ACCENT BAND, and it holds that band under the
   * highlight rather than yielding to it.
   *
   * It used to be a tick at the trailing edge. The band says the same thing
   * without a glyph, and `surface-selected` is the token already carrying it
   * elsewhere — a tint of the brand rather than the brand, so it sits close to
   * the panel instead of shouting over it, and it follows a consumer's own
   * scale for free.
   *
   * The stacked pairs are the point: a list has ONE highlight and the base
   * moves it on hover as well as on a key, so without them pointing at the
   * chosen row would repaint it grey and it would stop looking chosen at the
   * exact moment somebody reached for it. Two attributes outrank one, so this
   * does not depend on the order Tailwind emits them.
   *
   * WEIGHT IS THE SECOND CHANNEL and it is load-bearing now rather than
   * decorative: with the tick gone, weight is what survives greyscale and what
   * separates "chosen" from "where the keyboard is" (doc 06 §3).
   */
  /*
   * THE BAND ONLY. The row keeps `--bb-text`, so a chosen option reads in the
   * page's own ink — black in light, white in dark — rather than in the brand.
   *
   * This paints a background WITHOUT using its `-on` companion, which is doc
   * 03 §4.0's rule of pairs stepped around, so the numbers are here instead of
   * an assumption: measured, `--bb-text` on this band is 13.4:1 in light and
   * 12.3:1 in dark. The pair exists for a band that has to carry text of its
   * own; this one is a tint of the page under the page's own text.
   */
  'bb:data-selected:bg-surface-selected',
  'bb:data-selected:font-strong',
  'bb:data-selected:data-focused:bg-surface-selected',
  'bb:data-selected:data-pressed:bg-surface-selected',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

export interface SelectProps extends Omit<
  AriaSelectProps<Record<string, never>>,
  | 'children'
  | 'className'
  | 'style'
  | 'selectedKey'
  | 'defaultSelectedKey'
  | 'onSelectionChange'
  | ValidationProps
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
  /**
   * A decorative mark at the START of the field.
   *
   * Doc 07 §2.2b and decision 0031. It arrives as a node you wrote — the
   * library ships no icons and resolves no names — and the slot gives it its
   * size and its colour.
   *
   * **Hidden from assistive technology**, because the label is always there
   * and a mark can never be the only carrier of meaning. Something a person
   * NEEDS in order to answer belongs in the label or the description.
   *
   * There is no trailing counterpart: that edge belongs to the field.
   */
  icon?: React.ReactNode;
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
      icon,
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
            {...(icon === undefined ? {} : { icon })}
            className={cx(SIZE[size].frame, OPEN_RING, busy && 'bb:pe-9')}
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
              <span className={CHEVRON_BOX}>
                <ChevronGlyph className={CHEVRON} />
              </span>
            </AriaButton>
          </ControlFrame>
        </Field>
        <AriaPopover
          className={LIST_WRAPPER}
          offset={LAYER_OFFSET}
          /*
           * NOT MODAL, so the page keeps its scrollbar while the list is open.
           *
           * A popover is modal by default: the base gives it `role="dialog"`
           * and an underlay, and the underlay brings a scroll lock. On a page
           * that scrolls, that lock takes the scrollbar away and the whole
           * layout jumps sideways by its width — for the time it takes to
           * choose a status.
           *
           * THE LIBRARY ALREADY SHIPPED BOTH BEHAVIOURS AND NOBODY HAD
           * NOTICED. Read in the installed base: its own `ComboBox` passes
           * `isNonModal: true` to this same component, and `Select` and `Menu`
           * pass nothing. So two fields with a list, side by side, treated the
           * page differently — and the difference was the base's default
           * rather than a decision of ours.
           *
           * The cost is real and is accepted rather than overlooked: with no
           * underlay, a click outside closes the list AND reaches what is
           * under it. That is exactly what a `ComboBox` has always done here,
           * which is what makes it acceptable — this is the two components
           * agreeing, not a new risk.
           *
           * `Menu` stays modal for now. A click that closes a menu and also
           * fires an action underneath is a different size of mistake from one
           * that closes a list of options.
           */
          isNonModal
        >
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
 * The chosen option carries a soft band of the brand, and the band is the
 * point: the highlight says where you are in the list and the band says what
 * is chosen, and the moment you open a list those are two different rows.
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
      </AriaListBoxItem>
    );
  }
);
