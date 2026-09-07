import { forwardRef } from 'react';
import {
  Input,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps
} from 'react-aria-components';
import {
  CONTROL_INSIDE,
  CONTROL_TEXT,
  ClearButton,
  ControlFrame,
  Field,
  useFieldValue
} from '../../internal/Field';
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
interface SizeClasses {
  /** The height, on the frame — it is the frame that draws the box. */
  frame: string;
  /** The type size, on the CONTROL: an input inherits no font. */
  text: string;
}

const SIZE: Record<SearchFieldSize, SizeClasses> = {
  sm: { frame: 'bb:h-control-sm', text: 'bb:text-xs' },
  md: { frame: 'bb:h-control-md', text: 'bb:text-md' },
  lg: { frame: 'bb:h-control-lg', text: 'bb:text-lg' }
} satisfies Record<SearchFieldSize, SizeClasses>;

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
  /*
   * No box and no reserved trailing padding, both of which this component used
   * to carry. The frame draws the box and the cross is a flow sibling inside
   * it, so there is nothing to reserve: the button IS the space.
   */
  CONTROL_INSIDE,
  CONTROL_TEXT
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
    const busy = isLoading || isSaving;

    /*
     * The value, so the four conditions that make the cross useless can be
     * computed here rather than half of them in CSS. They used to be: empty,
     * disabled and read-only were classes reading the base's own attributes,
     * and busy was a branch in the render. One behaviour, two mechanisms —
     * and only one of them visible to a test with no stylesheet.
     */
    const tracked = useFieldValue<HTMLInputElement>({
      normalize: undefined,
      isTracked: true,
      value: ariaProps.value,
      defaultValue: ariaProps.defaultValue,
      onChange: ariaProps.onChange
    });

    const hasNothingToClear =
      busy ||
      (tracked.value ?? '') === '' ||
      (ariaProps.isDisabled ?? false) ||
      (ariaProps.isReadOnly ?? false);

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
        {...tracked.props}
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
            trailing={<ClearButton />}
            /*
             * Doc 07 §2.2 rule 1: unreachable, not absent. The cross holds its
             * width in every state, so a search field does not widen on the
             * first character typed and narrow again when the listing starts
             * loading — which is what following the state used to cost, twice
             * per search (doc 09 §3).
             *
             * No `onPress`: inside a search field the base's own context gives
             * this button its behaviour, and a handler here would clear twice.
             */
            isTrailingHidden={hasNothingToClear}
            className={SIZE[size].frame}
          >
            <Input
              ref={ref}
              className={cx(INPUT, SIZE[size].text)}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
          </ControlFrame>
        </Field>
      </AriaSearchField>
    );
  }
);
