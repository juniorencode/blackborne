import { forwardRef, useMemo } from 'react';
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  Input,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Popover as AriaPopover,
  useFilter,
  type ComboBoxProps as AriaComboBoxProps,
  type Key
} from 'react-aria-components';
import {
  CONTROL_INSIDE,
  CONTROL_TEXT,
  ControlFrame,
  EDGE_BUTTON,
  Field
} from '../../internal/Field';
import { useMessage } from '../../config';
import { CheckGlyph } from '../../internal/CheckGlyph';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { ANCHORED, LAYER_OFFSET, PANEL } from '../../internal/Layer';
import { cx } from '../../internal/cx';
import { readDeclarations } from '../../internal/readDeclarations';
import { useDevWarning } from '../../internal/useDevWarning';
import { optionMatcher, type OptionTerms } from './optionMatcher';

export type ComboBoxSize = 'sm' | 'md' | 'lg';

/* The same heights and type sizes as every other field (doc 03 §9). */
const SIZE: Record<ComboBoxSize, { frame: string; text: string }> = {
  sm: { frame: 'bb:h-control-sm', text: 'bb:text-xs' },
  md: { frame: 'bb:h-control-md', text: 'bb:text-md' },
  lg: { frame: 'bb:h-control-lg', text: 'bb:text-lg' }
} satisfies Record<ComboBoxSize, { frame: string; text: string }>;

/* The value is typed, so the control is an input filling the frame. */
const INPUT = cx('bb-combobox-input', CONTROL_INSIDE, CONTROL_TEXT);

/*
 * THE TOGGLE, and it is a button of its own — which is what made doc 07 §2.2
 * gain a seventh contender for a field's trailing edge.
 *
 * A select's chevron is a mark inside the one button that is the trigger, so
 * it costs no hit area and competes with nothing. Here the input is the
 * control and the toggle is a second target beside it, so rule 5 had to decide
 * which of the two things that want this edge gets it. The chevron does: a
 * keyboard opens the list with `ArrowDown` and a pointer has nothing else,
 * while emptying the field has routes that cost no width.
 *
 * It is not named here. The base names it from its own localised strings, and
 * the name is COMPOSED — measured, `aria-label="Show suggestions"` plus an
 * `aria-labelledby` pointing at itself and at the field's label, so a reader
 * hears "Show suggestions Doctor": which field's suggestions, said once. Doc
 * 05 §2.3 draws the line exactly there — an instruction about how a widget
 * works is the base's, and re-declaring it would be a second translation set
 * to maintain for nothing.
 */
const TOGGLE = cx('bb-combobox-toggle', EDGE_BUTTON, 'bb:me-(--bb-space-1)');

const CHEVRON = cx(
  'bb-combobox-chevron',
  'bb:h-mark bb:w-mark bb:flex-none',
  'bb:transition-[rotate] bb:duration-(--bb-duration-fast) bb:ease-standard',
  // The state is on the field's root, which is the group this reads through.
  'bb:group-data-open:rotate-180'
);

/*
 * The list, as wide as the field, for the reason `Select`'s is: a list
 * narrower than the field it belongs to reads as a different control, and one
 * wider covers what is beside it. `--trigger-width` is the base's, spelled its
 * way.
 */
const LIST_WRAPPER = cx(
  'bb-combobox-list',
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
  'bb-combobox-options',
  'bb:box-border bb:flex bb:min-h-0 bb:flex-col',
  'bb:overflow-y-auto bb:outline-hidden',
  'bb:font-sans bb:text-md bb:leading-normal'
);

/*
 * An option, and the tick that marks the chosen one.
 *
 * Identical to `Select`'s two lists, by intention rather than by accident: the
 * library extracts a shared style at the FOURTH copy and this is the second
 * (the reasoning is on `controlBox`). Both of Select's arguments hold here
 * unchanged — `data-focused` rather than `data-hovered`, because a list has
 * one highlight and the base moves it with the pointer as well as with a key;
 * and a tick that is always rendered and merely invisible, because a tick
 * appearing takes its width with it and every label below would step sideways
 * as the highlight walked down the list.
 */
const OPTION = cx(
  'bb-combobox-option',
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

const TICK = cx(
  'bb:h-mark bb:w-mark bb:flex-none bb:text-accent',
  'bb:invisible bb:group-data-selected:visible'
);

/* Nothing matched. A row, rather than a list that closes — see the component. */
const EMPTY = cx(
  'bb-combobox-empty',
  'bb:box-border bb:flex bb:min-h-hit bb:items-center',
  'bb:px-(--bb-space-3) bb:py-(--bb-space-2)',
  'bb:text-text-muted'
);

export interface ComboBoxItemProps {
  /**
   * Its identity, and what `selectedKey` names. A string, so nothing about the
   * base's key type reaches a consumer.
   */
  id: string;
  /** What the row says. */
  children: React.ReactNode;
  /**
   * Extra words this option can be found by, which do not appear in the row.
   *
   * A doctor found by a speciality, a customer by a tax number, a country by
   * its dialling code. They are searched exactly as the visible text is, with
   * the same collator, so an accent or a capital in either makes no
   * difference.
   *
   * **They are not shown and not announced.** The row says what it says; a
   * keyword is a way in, not a second label — which also means a person cannot
   * see why a row matched, and that is one of the reasons a match is not
   * highlighted (the catalog's §7 row has the rest of that argument).
   */
  keywords?: readonly string[];
  /**
   * What the row says, as text, when its children are not a string.
   *
   * The base keeps one for every row and derives it from text children; an
   * option whose children are an element has none, so it has nothing to be
   * searched by and disappears the moment somebody types. The field says so in
   * development rather than letting it happen quietly.
   */
  textValue?: string;
  /** Present, and not choosable. */
  isDisabled?: boolean;
  /** Applied to the row. Nothing reaches an internal node (doc 02 §6). */
  className?: string;
}

/**
 * One option in a `ComboBox`. Only useful inside one, and it renders nothing
 * on its own.
 *
 * It is a **declaration**, like a `Tab` and a `Breadcrumb`: `ComboBox` reads
 * these to learn what each option can be found by, and renders the rows
 * itself. Reading them is not a preference — the keywords have to reach the
 * filter somehow, and there is no way to hang them on a row the base will hand
 * back (decision 0021).
 *
 * The consequence is the one every declaration carries: **a component of your
 * own that returns one cannot be seen.** `<Doctors />` returning ten of these
 * is one element whose type is `Doctors`, and nothing about it says option.
 * Share a value, not a component — and the field warns in development when it
 * is handed something it could not read.
 */
export const ComboBoxItem: (props: ComboBoxItemProps) => React.ReactNode = () =>
  null;

export interface ComboBoxProps extends Omit<
  AriaComboBoxProps<Record<string, never>>,
  | 'children'
  | 'className'
  | 'style'
  | 'items'
  | 'defaultFilter'
  | 'allowsEmptyCollection'
  | 'allowsCustomValue'
  | 'selectionMode'
  | 'inputValue'
  | 'defaultInputValue'
  | 'onInputChange'
  | 'selectedKey'
  | 'defaultSelectedKey'
  | 'onSelectionChange'
  | 'formValue'
  | 'validationBehavior'
> {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /** The options: `ComboBoxItem` declarations. */
  children: React.ReactNode;
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`. The project decides there is an error and writes it. */
  errorMessage?: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /** A hint inside the empty control. Never a substitute for the label (doc 06 §3). */
  placeholder?: string;
  /** Waiting for the options themselves: a list that arrives from somewhere. */
  isLoading?: boolean;
  /** The value is being submitted. */
  isSaving?: boolean;
  /** Height and type size. Aligns with a `Button` of the same size. */
  size?: ComboBoxSize;
  /**
   * Which option is chosen, by its `id`.
   *
   * A string rather than the base's `string | number`: the base's own types
   * stay out of a consumer's signatures.
   */
  selectedKey?: string | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultSelectedKey?: string;
  /** Called with the chosen option's `id`, or `null`. */
  onSelectionChange?: (key: string | null) => void;
  /**
   * Applied to the field's outermost element, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/** What an option is searched by, and nothing about how it is drawn. */
const termsOf = (option: ComboBoxItemProps): OptionTerms => ({
  label:
    option.textValue ??
    (typeof option.children === 'string' ? option.children : ''),
  terms: option.keywords ?? []
});

/**
 * Typing to find one of a long list.
 *
 * ```tsx
 * <ComboBox label="Doctor" onSelectionChange={setDoctor}>
 *   <ComboBoxItem id="7" keywords={['cardiology']}>Dr. Ruiz</ComboBoxItem>
 *   <ComboBoxItem id="9" keywords={['paediatrics']}>Dr. Vega</ComboBoxItem>
 * </ComboBox>
 * ```
 *
 * **The risk component of its level**, built early on purpose: it is the field
 * structure, an anchored layer, a keyboard, a collection and a locale at once,
 * and if the composition model does not hold here it will not hold for a table
 * either (the catalog §6).
 *
 * ## What it does that a `Select` cannot
 *
 * **It narrows the list as you type**, through the platform's collator rather
 * than a regular expression, so "jose" finds "José" — measured, and with the
 * same options the base's own filter uses.
 *
 * **And an option can be found by words it does not show.** `keywords` is the
 * feature this component exists for. The base's filter sees a row's text and
 * never the row, so this component hands the base a filter that knows what
 * each text stands for; `optionMatcher` has the two designs that were measured
 * dead before that one, including the obvious one — filtering the rows here
 * and rendering the survivors, which the base's collection pass cannot see.
 *
 * ## What it does not have, and why
 *
 * **No clear button.** Doc 07 §2.2 rule 5: this field's trailing edge belongs
 * to the toggle, because a pointer has no other way to see the whole list,
 * while emptying the field has routes that cost no width — a declared option
 * that returns to no value, or selecting the text and deleting it.
 *
 * **No required word in the label.** `Select` composes one, because the base
 * puts nothing about it on the button a person operates. Measured here and the
 * answer is different: with `validationBehavior="aria"`, which every field in
 * this library sets, the input carries `aria-required="true"` — so the
 * asterisk is the visible channel and the attribute is the announced one,
 * which is what `Field` already assumes. Decision 0017 asked for this to be
 * measured rather than assumed, and the measurement is a test.
 *
 * **No custom value and no creating one.** Accepting text that is not an
 * option is a different promise about the value, and a row that creates one is
 * a row that is not an option; both wait for the screen that needs them.
 *
 * **One value only.** Several is the next wave, and it changes the shape of
 * the value rather than adding a flag.
 */
export const ComboBox = forwardRef<HTMLInputElement, ComboBoxProps>(
  function ComboBox(
    {
      label,
      children,
      description,
      errorMessage,
      isLabelHidden = false,
      placeholder,
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
    const noResults = useMessage('emptyStateNoResults');
    const noOptions = useMessage('emptyStateNoData');
    const loading = useMessage('loading');

    /*
     * The base's own collator, with the base's own options, so a consumer who
     * declares no keywords gets exactly the filtering the base would have
     * given them.
     */
    const { contains } = useFilter({ sensitivity: 'base' });

    const { found, strays } = readDeclarations<ComboBoxItemProps>(
      children,
      ComboBoxItem
    );

    useDevWarning(
      strays > 0,
      `ComboBox: ${strays} of its children are not ComboBoxItem elements and ` +
        'were ignored. An option is a declaration this component reads, so a ' +
        'component of your own that returns one cannot be seen — share a ' +
        'value rather than a component (decision 0021).'
    );

    /*
     * An option with neither text nor a keyword can never match, so it is
     * present until somebody types and gone from then on — the same silent
     * disappearance a missing `textValue` produced in `Select`'s typeahead, in
     * the component where typing is the whole point.
     */
    const unsearchable = found.filter(option => {
      const { label: text, terms } = termsOf(option);
      return text === '' && terms.length === 0;
    });
    useDevWarning(
      unsearchable.length > 0,
      `ComboBox: ${unsearchable.length} of its options have no text to ` +
        'search — their children are not a string and they carry neither ' +
        'textValue nor keywords, so they disappear as soon as anything is ' +
        'typed. Give them a textValue.'
    );

    /*
     * THREE ANSWERS, and doc 09 asks for exactly this distinction by name: an
     * empty list is not one state. The options are still arriving; there are
     * none to arrive; or there are plenty and the query found none of them.
     * Telling somebody "no results" about a list that was never given any
     * options blames their query for somebody else's empty prop.
     */
    const emptyMessage = isLoading
      ? loading
      : found.length === 0
        ? noOptions
        : noResults;

    const terms = found.map(termsOf);
    /*
     * Rebuilt when the options change and not on every keystroke. The
     * dependency is the CONTENT of the declarations rather than the array,
     * which is read fresh on each render and is therefore a new object every
     * time.
     */
    const fingerprint = JSON.stringify(terms);
    const matcher = useMemo(
      () => optionMatcher(terms, contains),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fingerprint, contains]
    );

    return (
      <AriaComboBox
        /*
         * `aria` rather than the base's default `native`, as every field here
         * does: the browser's own bubble is not styleable, not translatable
         * and not ours to time (doc 07 §1). It is also what puts
         * `aria-required` on the input rather than the native attribute —
         * measured both ways, and the reason this field composes no word into
         * its label.
         */
        validationBehavior="aria"
        /*
         * The base does the filtering; this only tells it what each row's text
         * stands for. Everything that depends on the base filtering keeps
         * working because none of it moved: the value in the input, the
         * selection, and the reopening that shows every option again.
         */
        defaultFilter={matcher}
        /* A list that found nothing says so, rather than closing. */
        allowsEmptyCollection
        className={cx('bb:group bb:w-full', className)}
        {...ariaProps}
        {...(onSelectionChange === undefined
          ? {}
          : {
              /*
               * The base hands back `string | number`; ours promises a string,
               * and every id that can enter came in as one. Mapped rather than
               * cast, for the reason `Accordion` records: a cast proves it
               * once and then hopes.
               */
              onSelectionChange: (key: Key | null) => {
                onSelectionChange(key === null ? null : String(key));
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
            className={SIZE[size].frame}
            trailing={
              <AriaButton className={TOGGLE}>
                <ChevronGlyph className={CHEVRON} />
              </AriaButton>
            }
            /*
             * Unreachable, and its room kept — doc 07 §2.2 rule 1. While the
             * options are still arriving there is no list to show, and a
             * control that cannot act is worse than one that is absent
             * (doc 06 §4 point 7); a read-only field is offered for reading,
             * so a toggle that will not open is the same empty promise.
             */
            isTrailingHidden={busy || (ariaProps.isReadOnly ?? false)}
          >
            <Input
              ref={ref}
              className={cx(INPUT, SIZE[size].text)}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
          </ControlFrame>
        </Field>
        <AriaPopover className={LIST_WRAPPER} offset={LAYER_OFFSET}>
          <div className={LIST_PANEL}>
            <AriaListBox
              className={LIST}
              /*
               * The base closes a list that filtered down to nothing, and
               * `allowsEmptyCollection` says not to. A list that vanishes
               * leaves the person who typed with no answer at all — where a
               * row saying so is the difference doc 09 draws between "there is
               * no data" and "your query found none", and doc 04 §7 asks that
               * hidden content be indicated rather than silently absent.
               */
              renderEmptyState={() => (
                <div className={EMPTY}>{emptyMessage}</div>
              )}
            >
              {found.map(option => (
                <AriaListBoxItem
                  key={option.id}
                  id={option.id}
                  className={cx(OPTION, option.className)}
                  {...(option.isDisabled === undefined
                    ? {}
                    : { isDisabled: option.isDisabled })}
                  /*
                   * The text the base keeps for this row: given, or derived
                   * when the children are a string. It is the key the filter
                   * looks an option up by AND the value the base writes into
                   * the input on selection — one string, read in both places.
                   */
                  {...(option.textValue !== undefined
                    ? { textValue: option.textValue }
                    : typeof option.children === 'string'
                      ? { textValue: option.children }
                      : {})}
                >
                  <span className="bb:min-w-0 bb:truncate">
                    {option.children}
                  </span>
                  <CheckGlyph className={TICK} />
                </AriaListBoxItem>
              ))}
            </AriaListBox>
          </div>
        </AriaPopover>
      </AriaComboBox>
    );
  }
);
