import { forwardRef } from 'react';
import {
  Button,
  Input,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps
} from 'react-aria-components';
import { CONTROL_BOX, CONTROL_TEXT, Field } from '../../internal/Field';
import { useMessage } from '../../config';
import { cx } from '../../internal/cx';

export type SearchFieldSize = 'sm' | 'md' | 'lg';

/*
 * WHY THIS IS A COMPONENT AND NOT A TEXTFIELD WITH A CLEAR BUTTON.
 *
 * Worth answering in the file, because it is the first thing anyone asks and
 * the obvious answer is wrong. It is not the clear button: TextField is
 * getting one too, and a component that exists for a button is exactly the
 * "two different ways to do the same thing" doc 01 §7 lists as a warning sign.
 *
 * It is the ROLE and the KEYBOARD, and neither of those can be a prop.
 *
 * 1. The control is a `searchbox`, not a `textbox`. That is what a screen
 *    reader announces, and a role is not a decoration switched on from
 *    outside — it is what the control is. `type` is omitted from the props
 *    below for the same reason: a search field switched to `text` is a
 *    TextField and should be one.
 *
 * 2. Escape cancels the query. Doc 09 §8 fixes what Escape means across the
 *    whole library — cancel the current level, one at a time — and on a
 *    filtered listing the current level IS the query. A TextField may not
 *    take Escape: inside a dialog that key belongs to the dialog, and a field
 *    that swallowed it would be the one exception that costs the other
 *    twenty-nine their credibility. The base already draws the line in the
 *    right place, which is the reason to wrap it rather than build one: it
 *    clears on Escape only when there is something to clear, and lets the key
 *    through to the dialog when there is not.
 *
 * 3. `onClear` and `onSubmit` are not `onChange`. Emptying a text field is a
 *    value becoming ""; clearing a search is a listing dropping its filter,
 *    which the screen around it has to react to — and it arrives from two
 *    routes, the button and Escape, as one callback. `onSubmit` is a query
 *    confirmed with no form present at all.
 *
 * No prop on TextField delivers any of the three. This is a different control
 * that happens to be drawn like a field, not a variant of one.
 */

/*
 * Heights come from the same tokens as Button and TextField, which is what
 * makes a field, a select and a button of the same size line up in a row
 * (doc 03 §9).
 */
const SIZE: Record<SearchFieldSize, string> = {
  sm: 'bb:h-control-sm bb:text-xs',
  md: 'bb:h-control-md bb:text-md',
  lg: 'bb:h-control-lg bb:text-lg'
} satisfies Record<SearchFieldSize, string>;

/*
 * The control's appearance is TextField's, class for class, down to the
 * border moving on hover where the small controls move their fill. Two
 * sibling fields that differ gratuitously is drift, and these two are meant
 * to be indistinguishable until one is asked to do something the other
 * cannot.
 *
 * It is repeated rather than shared because nothing in src/internal owns a
 * field's input styling yet, and an abstraction drawn from the second case is
 * usually the wrong one. The third field is when it earns a home.
 */
const INPUT = cx(
  CONTROL_BOX,
  CONTROL_TEXT,
  /*
   * The trailing padding, so the value never runs under whatever is sitting
   * at that edge. Same mechanism and same 36px as TextField reserves for its
   * busy indicator — one measurement for the contested edge, not two.
   *
   * Unconditional here, where TextField makes it conditional, and that is the
   * one deliberate divergence: on this field the trailing edge is occupied in
   * almost every state — the clear button as soon as there is a value, the
   * indicator whenever a search is in flight. Following the state would
   * resize the text box on the first keystroke and again when the listing
   * starts loading, which is doc 09 §3 broken twice. The space is reserved
   * before the content arrives instead.
   */
  'bb:pe-9'
);

const CLEAR = cx(
  'bb:absolute',
  /*
   * The inset is written from the tokens, not as a number.
   *
   * The target is centred on a 14px mark, so the button reaches
   * (hit - mark) / 2 further towards the border than the mark does. Subtract
   * that from the padding the text gets on the other side and the mark ends
   * the same distance from its border as the value starts from its own.
   *
   * A fixed number is right at one density and wrong at the other: compact
   * moves the three tokens by different amounts — 12/28/14 becomes 8/24/11 —
   * so the correct inset is 5px in one and 1.5px in the other. Expressing the
   * relationship rather than trusting two numbers to agree is the same
   * argument .bb-inline-control-box already had with itself.
   */
  'bb:end-[calc(var(--bb-control-padding-x)_-_var(--bb-control-hit-area)/2_+_var(--bb-control-box-mark)/2)]',
  'bb:box-border bb:flex bb:items-center bb:justify-center',
  /*
   * The target, and the part of a component like this that is usually wrong.
   *
   * A cross drawn at 14px is a 14px target unless something says otherwise,
   * and doc 06 §3 wants the minimum at EVERY density, compact included. Both
   * axes take the hit-area token, so compact trims the mark and never the
   * target — 28px normal, 24px compact, with the mark going 14px to 11px
   * underneath it.
   *
   * The two axes were not symmetric until this component asked for both.
   * `min-h-hit` worked off `--height-hit` and always had; `min-w-hit` compiled
   * to NOTHING, because Tailwind resolves a min-width utility from its own
   * namespace rather than from `--width-*` — so the class looked right in the
   * source and left a 14px target behind. Found by grepping the generated
   * sheet, which is the only place a utility that does not exist shows up.
   */
  'bb:min-h-hit bb:min-w-hit',
  // Round because it floats over the input rather than sitting flush inside
  // its frame, so there is no edge for the nested-radius rule to match.
  'bb:rounded-full',
  'bb:bg-transparent bb:text-text-muted',
  // The transparent border reserves the focus ring's edge at rest, so nothing
  // shifts when it appears. It is the library's single ring (doc 06 §3).
  'bb:border bb:border-solid bb:border-transparent',
  'bb:cursor-pointer bb:outline-hidden',
  'bb:transition-[background-color,border-color,box-shadow,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover bb:data-hovered:text-text',
  'bb:data-pressed:bg-surface-active',
  'bb:data-focused:border-focus-ring bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  /*
   * The three states in which the button is present but has nothing to offer,
   * keyed off the attributes the base already puts on the root rather than a
   * class computed in render (doc 02 §4).
   *
   * Empty: there is no value to clear. Disabled and read-only: the value is
   * not the person's to change, and the base disables the button in both —
   * doc 06 §4 point 7 says a control that cannot act is worse than one that
   * is absent, which is the same clause that removes it while busy below.
   *
   * The busy case is NOT here, and deliberately: it is `isLoading`/`isSaving`
   * on our own props, not a state the base publishes to the DOM, and doc 07
   * §2.2 says not rendered at all rather than not painted.
   */
  'bb:group-data-empty:hidden',
  'bb:group-data-disabled:hidden',
  'bb:group-data-readonly:hidden'
);

/*
 * `type` is omitted along with the render-prop trio. Everything else the base
 * accepts is forwarded by the spread and needs nothing here: `onSubmit`,
 * `onClear`, `enterKeyHint`, `name`, `autoComplete`, `maxLength` and the rest
 * of what an `<input>` takes are already props of this component (doc 02 §2).
 */
export interface SearchFieldProps extends Omit<
  AriaSearchFieldProps,
  'children' | 'className' | 'style' | 'type'
> {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`. The project decides there is an error and writes it. */
  errorMessage?: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /** Waiting for data the field needs — the results it is filtering. */
  isLoading?: boolean;
  /** The value is being submitted. */
  isSaving?: boolean;
  /** Height and type size. Aligns with a Button or TextField of the same size. */
  size?: SearchFieldSize;
  placeholder?: string;
  className?: string;
}

/**
 * A field for filtering a listing: label, control, description and error,
 * related to each other, plus a query that can be cancelled.
 *
 * It is a `searchbox` rather than a `textbox`, Escape empties it, and clearing
 * it — from the button or from the key — reports through `onClear`. Those
 * three are why this is not a TextField with a cross on the end; the reasoning
 * is written out at the top of this file, because someone always asks.
 *
 * **It filters nothing.** The value and what happens to the listing are the
 * consumer's (P2): the field restricts and presents, and the project decides
 * what a query means. `onSubmit` fires on Enter with no form present, for the
 * case where searching is a request rather than a filter.
 *
 * **While the field is loading or saving the clear button is not rendered at
 * all** (doc 07 §2.2). Offering to clear a value that is mid-flight offers an
 * action the field cannot honour, and the trailing edge belongs to one thing
 * at a time.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      label,
      description,
      errorMessage,
      isLabelHidden = false,
      isLoading = false,
      isSaving = false,
      size = 'md',
      placeholder,
      className,
      ...ariaProps
    },
    ref
  ) {
    const clearLabel = useMessage('clear');
    const busy = isLoading || isSaving;

    return (
      <AriaSearchField
        /*
         * `aria` rather than the base's default `native`: native validation
         * pops the browser's own bubble, which the library cannot style,
         * cannot translate and cannot time. Presenting the error is our job,
         * and the project owns when it happens.
         */
        validationBehavior="aria"
        // `group` so the clear button can read the base's own state
        // attributes from the root it puts them on.
        className={cx('bb:group bb:w-full', className)}
        {...ariaProps}
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
          <Input
            ref={ref}
            className={cx(INPUT, SIZE[size])}
            {...(placeholder === undefined ? {} : { placeholder })}
          />
          {/*
           * Doc 07 §2.2, rule 1, taken literally: busy wins outright and the
           * clear button is not rendered, not merely hidden. Field puts the
           * indicator at this exact spot, absolutely positioned, and two
           * things over the same pixels is how a hit area ends up depending
           * on which state a field happens to be in.
           */}
          {busy ? null : (
            <Button
              className={CLEAR}
              /*
               * The name comes from our dictionary, replacing the base's own
               * localised "Clear search". Two dictionaries in one interface
               * is one too many: a project that translates `clear` would see
               * its word on every other cross in the library and not on this
               * one. Ours wins because the base merges its context props
               * underneath the element's — verified against the installed
               * source, not assumed.
               *
               * An `aria-label` and not visually hidden text, which is the
               * opposite of NumberField's steppers: there the base points
               * aria-labelledby at the field's label and labelledby beats
               * label, so a name given here would be dropped. There is no
               * labelledby on this button, so doc 02 §11.3 applies plainly —
               * the name of an icon-only control goes on the control.
               */
              aria-label={clearLabel}
            >
              {/*
               * Drawn rather than received: doc 02 §11.4 lets the library
               * draw and size the icons belonging to its own controls. The
               * same cross and the same mark size Badge's remove button uses,
               * so the marks inside small controls are one size and follow
               * density together.
               */}
              <svg
                viewBox="0 0 16 16"
                className="bb:h-mark bb:w-mark"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          )}
        </Field>
      </AriaSearchField>
    );
  }
);
