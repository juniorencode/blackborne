import { forwardRef, useContext, useId, useMemo } from 'react';
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  ComboBoxStateContext,
  ComboBoxValue,
  Input,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxLoadMoreItem,
  Popover as AriaPopover,
  useFilter,
  type ComboBoxProps as AriaComboBoxProps,
  type Key
} from 'react-aria-components';
import {
  CHIP,
  ChipRemove,
  CONTROL_INSIDE,
  CONTROL_TEXT,
  ControlFrame,
  EDGE_BUTTON,
  Field,
  useOwnedValue
} from '../../internal/Field';
import { useMessage } from '../../config';
import { CheckGlyph } from '../../internal/CheckGlyph';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { ANCHORED, LAYER_OFFSET, PANEL } from '../../internal/Layer';
import { cx } from '../../internal/cx';
import { readDeclarations } from '../../internal/readDeclarations';
import { useDevWarning } from '../../internal/useDevWarning';
import { optionMatcher, type OptionTerms } from './optionMatcher';
import type { AsyncOptions } from './useAsyncOptions';

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
 * The same heights again, as a MINIMUM, for the field that holds several.
 *
 * `min-h` rather than `h` is the whole difference: the box grows with its
 * chips. With one row the minimum decides, so it still measures exactly the
 * control height and still lines up in a row with a button (doc 03 §9); with
 * three rows the content decides.
 *
 * The type size goes on the FRAME here as well as on the input, and both read
 * this one entry so they cannot drift: a chip is a `div` and inherits
 * `font-size`, while an `<input>` does not — browsers set a font on form
 * controls and this package ships no reset to undo it.
 */
const GROWS: Record<ComboBoxSize, { frame: string; text: string }> = {
  sm: { frame: 'bb:h-auto bb:min-h-control-sm', text: 'bb:text-xs' },
  md: { frame: 'bb:h-auto bb:min-h-control-md', text: 'bb:text-md' },
  lg: { frame: 'bb:h-auto bb:min-h-control-lg', text: 'bb:text-lg' }
} satisfies Record<ComboBoxSize, { frame: string; text: string }>;

/*
 * The one wrapping flow the chips and the draft input share, inside the frame.
 *
 * The vertical padding is `--bb-space-1` for the reason `TagsInput` records:
 * at every size and both densities `hit + 2 + 2` stays under the control
 * height, so a box with one row of chips is exactly as tall as a field.
 */
const WRAPPING_FLOW = cx(
  'bb-combobox-values',
  'bb:box-border bb:flex bb:min-w-0 bb:flex-1 bb:flex-wrap bb:items-center',
  'bb:gap-x-(--bb-space-2) bb:gap-y-(--bb-space-1)',
  'bb:py-(--bb-space-1)'
);

/*
 * The draft input, when it shares its line with chips.
 *
 * It keeps `CONTROL_INSIDE`'s `flex-1`, which is what makes it follow the last
 * chip rather than taking a line of its own, and it gives up the control's
 * inline padding — the flow above owns that, because the chips sit inside it
 * too. `self-stretch`, so the click target is the whole row rather than the
 * 21px the text happens to occupy.
 */
const DRAFT = cx('bb:px-0 bb:self-stretch');

/*
 * The empty list of chosen keys, as one frozen value.
 *
 * A new `[]` on every render would be a new dependency on every render, and
 * `useOwnedValue` seeds its own state from this: a fresh array would reseed
 * nothing but would make every memo downstream of it useless.
 */
/* Keeps every row, for a list the loader already filtered. */
const KEEP_EVERYTHING = (): boolean => true;

const NO_KEYS: readonly string[] = Object.freeze([]);

/*
 * The two ids a chip needs, so its cross can be named by pointing at itself
 * and at the value beside it. By POSITION rather than by key: an id is one
 * space-separated token in `aria-labelledby`, and an option's id is a string
 * the consumer chose — one with a space in it would silently name the wrong
 * thing.
 */
const textId = (scope: string, index: number): string =>
  `${scope}-value-${index}`;
const crossId = (scope: string, index: number): string =>
  `${scope}-remove-${index}`;

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

/*
 * THE VALUE PROPS ARE OURS, and the base's are all omitted below — including
 * the ones it still accepts.
 *
 * Measured in the installed types: `selectedKey`, `defaultSelectedKey` and
 * `onSelectionChange` are **`@deprecated`** on the base's combo box, replaced
 * by `value`, `defaultValue` and `onChange` from its shared `ValueBase`. They
 * still work for one value — the first wave shipped on them — and they are not
 * called at all when several are allowed, which is how the deprecation was
 * found rather than read.
 *
 * So this component maps onto the CURRENT base props internally and keeps the
 * vocabulary `Select` already publishes. Decision 0007 says prop names follow
 * the base, and here the base has two spellings for one thing and deprecates
 * one of them in one component and not the other: following it literally would
 * mean a select with a `selectedKey` beside a combo box with a `value`, for no
 * reason a consumer could ever guess.
 */
interface ComboBoxSharedProps extends Omit<
  AriaComboBoxProps<Record<string, never>>,
  | 'children'
  | 'className'
  | 'style'
  | 'items'
  | 'defaultItems'
  | 'defaultFilter'
  | 'allowsEmptyCollection'
  | 'allowsCustomValue'
  | 'selectionMode'
  | 'inputValue'
  | 'defaultInputValue'
  | 'onInputChange'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'selectedKey'
  | 'defaultSelectedKey'
  | 'onSelectionChange'
  | 'formValue'
  | 'validationBehavior'
  /*
   * `validate` goes too, and it is the one omission here that is about
   * doctrine rather than about types.
   *
   * It is the base's hook for driving form validation, and this library's
   * answer to validation is [decision 0005](../../../../../docs/decisions/0005-validation-stays-in-the-project.md):
   * the project decides a value is wrong and passes `isInvalid` with a message,
   * and the library presents it. A callback whose argument is
   * `ComboBoxValidationValue` would also put a base interface in a public
   * signature, which the catalog has refused twice.
   *
   * The type system is what made it visible: `Validation<…<M>>` carries the
   * selection mode, so forwarding it pinned this component's generic to one
   * value and the plural branch would not compile. **The other fields forward
   * it**, silently and without meaning to, and that inconsistency is now a row
   * in catalog §7 rather than a thing this file fixed on its way past.
   */
  | 'validate'
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
   * Where the options come from, when they come from somewhere.
   *
   * Made by `useAsyncOptions`, and handed over whole — the shape `Toast`
   * established, where a hook makes the queue and the component renders it.
   * The consumer still renders the options themselves, because an option is a
   * declaration and only they know what a row should say.
   *
   * **A field with a source does not filter what it is given.** The query went
   * to the loader and these came back, so filtering again here would be
   * answering the same question twice with less information — and `keywords`
   * on an option have nothing to do, because searching by something a row does
   * not show is a `WHERE` clause rather than a prop.
   */
  source?: ComboBoxSource;
  /**
   * Applied to the field's outermost element, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/** One of the options, which is what a combo box does unless told otherwise. */
export interface ComboBoxOneProps extends ComboBoxSharedProps {
  selectionMode?: 'single';
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
  /*
   * The plural pair, declared as impossible rather than merely absent.
   *
   * `?: never` is what makes the union DISCRIMINATE for a caller who spreads:
   * with the props simply missing from this branch, `{...props}` plus one
   * singular prop matches neither member and the error names the wrong thing.
   * Declared this way, the wrong pairing fails on the branch it belongs to and
   * the message says which prop does not belong. Found by the component's own
   * stories, which spread their args.
   */
  selectedKeys?: never;
  defaultSelectedKeys?: never;
}

/** Several of them, each shown as a chip inside the field. */
export interface ComboBoxSeveralProps extends ComboBoxSharedProps {
  selectionMode: 'multiple';
  /** Which options are chosen, by their `id`, in the order they were chosen. */
  selectedKeys?: readonly string[];
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultSelectedKeys?: readonly string[];
  /** Called with every chosen `id`. Empty when the last one is removed. */
  onSelectionChange?: (keys: string[]) => void;
  /** The singular pair, declared as impossible — see the branch above. */
  selectedKey?: never;
  defaultSelectedKey?: never;
}

/**
 * One value or several, and the two are a UNION rather than a boolean.
 *
 * The value changes shape with the mode — one id or a list of them — so a
 * single prop set would have to accept both and mean one, which is the
 * impossible combination doc 02 §3 rejects booleans for. Typed as a union, the
 * wrong pairing is an error where it is written rather than a surprise at
 * runtime: `selectedKeys` on a field that holds one does not compile.
 *
 * The precedent is `MenuItem`, which holds three shapes the same way. What is
 * NOT the precedent is [decision 0014](../../../../../docs/decisions/0014-cursor-pagination-is-its-own-component.md),
 * which split the two paginations into two components — those share no prop
 * and disagree about what a page even is, where these two share every prop but
 * one and agree about everything except how many answers are allowed.
 */
export type ComboBoxProps = ComboBoxOneProps | ComboBoxSeveralProps;

/*
 * The props this component owns rather than forwards.
 *
 * They are removed by name instead of being destructured into variables
 * nobody reads: the value pair is read through the narrowed props (which is
 * what keeps the two callback signatures apart without a cast), and forwarding
 * `onSelectionChange` would be worse than untidy — it is the base's own
 * deprecated callback, so the consumer's handler would be called twice for one
 * choice.
 */
const OWN_VALUE_PROPS = [
  'selectedKey',
  'defaultSelectedKey',
  'selectedKeys',
  'defaultSelectedKeys',
  'onSelectionChange'
] as const;

type OwnValueProp = (typeof OWN_VALUE_PROPS)[number];

/** Everything the base takes, which is everything this component does not. */
function forwardable<T extends object>(props: T): Omit<T, OwnValueProp> {
  const rest = { ...props };
  for (const name of OWN_VALUE_PROPS)
    delete (rest as Record<string, unknown>)[name];
  return rest;
}

/**
 * What a field reads out of an asynchronous source.
 *
 * `items` is deliberately not in it: the consumer renders those, and a field
 * that also read them would be two things deciding what a row says. Declared
 * as its own type so the source's element type stays out of the field's props
 * — a combo box does not care what a doctor is.
 */
export type ComboBoxSource = Pick<
  AsyncOptions<unknown>,
  | 'isLoading'
  | 'isLoadingMore'
  | 'error'
  | 'isWaitingForQuery'
  | 'query'
  | 'onQueryChange'
  | 'loadMore'
>;

/** What an option is searched by, and nothing about how it is drawn. */
const termsOf = (option: ComboBoxItemProps): OptionTerms => ({
  label:
    option.textValue ??
    (typeof option.children === 'string' ? option.children : ''),
  terms: option.keywords ?? []
});

/**
 * The chosen values, drawn.
 *
 * A component of its own for the same reason `Options` was one in the wave
 * before this: it has to read the base's state, and the state is provided
 * INSIDE the combo box element. What it needs is whether the list is open —
 * because while it is, the base hides everything outside it from a reader, and
 * a cross that is still tabbable would be a control nobody is told about.
 *
 * With no state at all — which happens in the render pass the base builds its
 * collection in — the answer is "closed", which is what a first paint shows.
 */
const Chips = ({
  scope,
  chosen,
  labelOf,
  isRemovable,
  canRemove,
  removeLabel,
  onRemove
}: {
  scope: string;
  chosen: readonly string[];
  labelOf: (key: string) => string;
  isRemovable: boolean;
  canRemove: boolean;
  removeLabel: string;
  onRemove: (key: string) => void;
}) => {
  const state = useContext(ComboBoxStateContext);
  const isOpen = state?.isOpen ?? false;

  return (
    <>
      {chosen.map((key, index) => (
        <span key={key} className={CHIP}>
          {/* `truncate` and `min-w-0`, so one very long value ends in an
              ellipsis instead of forcing the box wider than its container
              (P4: 320px is a real width). */}
          <span id={textId(scope, index)} className="bb:min-w-0 bb:truncate">
            {labelOf(key)}
          </span>
          {isRemovable ? (
            <ChipRemove
              /*
               * No ambient button context. A combo box publishes one for its
               * toggle and every `Button` inside it takes it — see
               * `ChipRemove`, where the measurement is.
               */
              slot={null}
              id={crossId(scope, index)}
              canRemove={canRemove}
              isReachable={!isOpen}
              removeLabel={removeLabel}
              onPress={() => onRemove(key)}
              /*
               * "Remove" and then the value, composed the way the base
               * composes it inside a `Tag`: two element references, in the
               * order the document has them. Not a template string — doc 05
               * §2.2 rule 5 is about exactly that, and a sentence built from
               * fragments comes out backwards in some languages.
               *
               * The index rather than the key, because an id is a
               * space-separated token here and an option's id is a string the
               * consumer chose.
               */
              labelledBy={`${crossId(scope, index)} ${textId(scope, index)}`}
            />
          ) : null}
        </span>
      ))}
    </>
  );
};

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
  function ComboBox(props, ref) {
    const {
      label,
      children,
      description,
      errorMessage,
      isLabelHidden = false,
      placeholder,
      isLoading = false,
      isSaving = false,
      size = 'md',
      className,
      source,
      selectionMode = 'single'
    } = props;

    const ids = useId();
    /* What is in the box, when anything is holding it. */
    const query = source?.query ?? '';
    const several = selectionMode === 'multiple';

    /*
     * The callback, narrowed once. It reports one id in one mode and a list of
     * them in the other, so read off the union it is a function that can only
     * be called with an argument satisfying both — which is nothing. Narrowing
     * on `props.selectionMode` is what separates them, and it is why the mode
     * is read from `props` here rather than from the boolean above.
     */
    const reportSeveral =
      props.selectionMode === 'multiple' ? props.onSelectionChange : undefined;
    const reportOne =
      props.selectionMode === 'multiple' ? undefined : props.onSelectionChange;
    const busy = isLoading || isSaving;
    const noResults = useMessage('emptyStateNoResults');
    const noOptions = useMessage('emptyStateNoData');
    const loading = useMessage('loading');
    const keepTyping = useMessage('keepTyping');
    const loadFailed = useMessage('loadFailed');
    const removeLabel = useMessage('remove');

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
    const emptyMessage = source
      ? /*
         * FIVE ANSWERS ONCE THE OPTIONS COME FROM SOMEWHERE, and the order is
         * the order the questions are asked in. Nothing has been asked for
         * yet; the asking failed; the answer is on its way; a query came back
         * empty; or there was never anything to come back.
         *
         * The last two are doc 09's distinction again, and with a source the
         * difference is whether anything was typed — "no results" for a query
         * that found none, "nothing here yet" for a catalogue that is empty.
         */
        source.isWaitingForQuery
        ? keepTyping
        : source.error !== undefined
          ? loadFailed
          : source.isLoading
            ? loading
            : query.trim() === ''
              ? noOptions
              : noResults
      : isLoading
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

    /*
     * THE CHOSEN VALUES, HELD HERE WHEN THERE ARE SEVERAL — which is the fifth
     * feature to hit the wall `useOwnedValue` was written for, and the note in
     * that file describes this one exactly: a field that has to DRAW its value
     * cannot read it out of the base when nobody controls it.
     *
     * The chips are that drawing. With one value there is nothing to hold — the
     * base writes the chosen option's text into the input and the field shows
     * it — and this stays switched off, so a combo box holding one behaves
     * exactly as it did before this existed.
     */
    const owned = useOwnedValue<readonly string[]>({
      isTracked: several,
      value: several ? props.selectedKeys : undefined,
      defaultValue: several ? props.defaultSelectedKeys : undefined,
      empty: NO_KEYS,
      onChange: several ? keys => reportSeveral?.([...keys]) : undefined
    });

    const chosen = owned.current ?? NO_KEYS;

    /*
     * What each chip says. An id with no option behind it keeps its own id as
     * the label rather than vanishing: the value exists — the base is holding
     * it — and a chip that is not drawn is a value nobody can remove. It
     * happens legitimately while the options are still arriving, so it warns
     * about nothing.
     */
    const labelOf = (key: string): string => {
      const option = found.find(item => item.id === key);
      if (option === undefined) return key;
      const { label: text } = termsOf(option);
      return text === '' ? key : text;
    };

    const removeOne = (key: string): void => {
      owned.set(chosen.filter(held => held !== key));
    };

    /*
     * The chips can act on removal unless the field says otherwise, and while
     * it is busy the cross stays put and goes out of reach (doc 07 §2.2
     * rule 1).
     */
    const isRemovable =
      !(props.isReadOnly ?? false) && !(props.isDisabled ?? false);

    const control = several ? (
      /*
       * THE CHIPS AND THE INPUT IN ONE WRAPPING FLOW, inside the frame rather
       * than instead of it.
       *
       * `TagsInput` could not use `ControlFrame` at all — it has no edge
       * control, and the frame lays a control out as one item in a row that
       * does not wrap. This field has the toggle at its trailing edge (doc 07
       * §2.2 rule 5), so the frame is exactly right: the wrapping happens
       * INSIDE it, and the toggle stays put at the edge instead of dropping
       * onto a line of its own when the chips fill the row.
       *
       * ## Why these are not `Tag`s
       *
       * They were, for an afternoon. **A `TagGroup` inside a `ComboBox` does
       * not work**, and the reason is the same context collision the wave
       * before this one met from the other side: the combo box publishes its
       * own `ListStateContext` for its options, and `useTag` reads that
       * context to find its collection — so a chip inside one resolves the
       * wrong collection. With a dynamic `items` list it exhausts the heap;
       * with static children it throws from `useGridListItem`, reading a row
       * that is not there.
       *
       * What that costs is real and worth naming: no arrow-key walk along the
       * chips, and no `Delete` on a focused one. What replaces it is plainer
       * and complete — each cross is a button in the tab order, named by
       * element references rather than by a glued string.
       *
       * What it does NOT cost is the announcement, which was the part that
       * looked lost. `ComboBoxValue` is what the base points the input's
       * `aria-describedby` at (measured), so a reader arriving at the field
       * hears the chosen values from the base's own text. The chips are the
       * visual channel of the same value, which is doc 06 §3's "never colour
       * alone" arriving in a shape nobody expects.
       */
      <div className={WRAPPING_FLOW}>
        <ComboBoxValue className="bb:sr-only" />
        <Chips
          scope={ids}
          chosen={chosen}
          labelOf={labelOf}
          isRemovable={isRemovable}
          canRemove={!busy}
          removeLabel={removeLabel}
          onRemove={removeOne}
        />
        <Input
          ref={ref}
          className={cx(INPUT, DRAFT, SIZE[size].text)}
          {...(placeholder === undefined ? {} : { placeholder })}
        />
      </div>
    ) : (
      <Input
        ref={ref}
        className={cx(INPUT, SIZE[size].text)}
        {...(placeholder === undefined ? {} : { placeholder })}
      />
    );

    const body = (
      <>
        <Field
          label={label}
          {...(description === undefined ? {} : { description })}
          {...(errorMessage === undefined ? {} : { errorMessage })}
          isRequired={props.isRequired ?? false}
          isLabelHidden={isLabelHidden}
          isLoading={isLoading}
          isSaving={isSaving}
        >
          <ControlFrame
            className={cx(
              several ? GROWS[size].frame : SIZE[size].frame,
              several && GROWS[size].text
            )}
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
            isTrailingHidden={busy || (props.isReadOnly ?? false)}
          >
            {control}
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
              {source === undefined ? null : (
                /*
                 * THE END OF THE LIST, asking for one more page.
                 *
                 * The base's own sentinel: it watches for itself coming into
                 * view and calls `onLoadMore`, which is how a list loads while
                 * somebody scrolls rather than when they press something.
                 *
                 * Two things measured about it. **`loadMore` past the last
                 * page calls nothing** — the loader returning no cursor is how
                 * the base learns there is an end — so reaching the bottom of
                 * a finished list is quiet. And **it needs
                 * `IntersectionObserver`**, which jsdom does not have: a unit
                 * test rendering a field with a source has to stub it, and
                 * whether the scroll actually loads is a question for a
                 * browser (`e2e/combobox.spec.ts` asks it).
                 */
                <ListBoxLoadMoreItem
                  className={EMPTY}
                  isLoading={source.isLoadingMore}
                  onLoadMore={source.loadMore}
                >
                  {loading}
                </ListBoxLoadMoreItem>
              )}
            </AriaListBox>
          </div>
        </AriaPopover>
      </>
    );

    /*
     * TWO ELEMENTS RATHER THAN ONE, and the duplication is one line each.
     *
     * The base's combo box is generic over its selection mode, and the value
     * props change type with it — so a props object built by branching and
     * then spread loses the inference that makes the pair type-safe. Written
     * out twice, each branch checks: `value` is a list in one and a key or
     * `null` in the other, and neither can be handed the wrong shape.
     *
     * `value` and `onChange` rather than `selectedKey` and
     * `onSelectionChange`: measured, the second pair is `@deprecated` on the
     * base and is not called at all when several values are allowed.
     */
    const shared = {
      /*
       * `aria` rather than the base's default `native`, as every field here
       * does: the browser's own bubble is not styleable, not translatable and
       * not ours to time (doc 07 §1). It is also what puts `aria-required` on
       * the input rather than the native attribute — measured both ways, and
       * the reason this field composes no word into its label.
       */
      validationBehavior: 'aria' as const,
      /*
       * The base does the filtering; this only tells it what each row's text
       * stands for. Everything that depends on the base filtering keeps
       * working because none of it moved: the value in the input, the
       * selection, and the reopening that shows every option again.
       */
      /*
       * Ours extends the base's filter for a local list, and is switched off
       * entirely for a loaded one: the server already answered the query, and
       * filtering the answer would hide rows it deliberately returned.
       */
      defaultFilter: source ? KEEP_EVERYTHING : matcher,
      /* A list that found nothing says so, rather than closing. */
      allowsEmptyCollection: true,
      className: cx('bb:group bb:w-full', className),
      /*
       * The query lives in the source when there is one, so the field's text
       * is controlled by it: every keystroke is reported, the hook waits, and
       * the loader is asked once. Without a source nothing here changes and
       * the base keeps its own text, which is what makes a local list behave
       * exactly as it did before any of this existed.
       */
      ...(source === undefined
        ? {}
        : { inputValue: source.query, onInputChange: source.onQueryChange })
    };

    if (props.selectionMode === 'multiple') {
      return (
        <AriaComboBox
          {...forwardable(props)}
          /*
           * After the spread, not before it: the consumer's own
           * `selectionMode` travels in that spread and would overwrite it,
           * and the literal is what tells the base's generic which shape the
           * value has.
           */
          selectionMode="multiple"
          {...shared}
          value={chosen}
          onChange={keys => owned.set(keys.map(String))}
        >
          {body}
        </AriaComboBox>
      );
    }

    return (
      <AriaComboBox
        {...forwardable(props)}
        {...shared}
        {...(props.selectedKey === undefined
          ? {}
          : { value: props.selectedKey })}
        {...(props.defaultSelectedKey === undefined
          ? {}
          : { defaultValue: props.defaultSelectedKey })}
        {...(reportOne === undefined
          ? {}
          : {
              /*
               * The base hands back `string | number`; ours promises a string,
               * and every id that can enter came in as one. Mapped rather than
               * cast, for the reason `Accordion` records: a cast proves it
               * once and then hopes.
               */
              onChange: (key: Key | null) => {
                reportOne(key === null ? null : String(key));
              }
            })}
      >
        {body}
      </AriaComboBox>
    );
  }
);
