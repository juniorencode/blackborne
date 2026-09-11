import { forwardRef, useRef } from 'react';
import {
  Input,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps
} from 'react-aria-components';
import {
  ALIGN,
  CONTROL_INSIDE,
  CONTROL_TEXT,
  ControlFrame,
  CharacterCounter,
  ClearButton,
  Field,
  useFieldValue,
  type ControlAlign
} from '../../internal/Field';
import { cx } from '../../internal/cx';
import type { ValidationProps } from '../../internal/validationProps';
import { useDevWarning } from '../../internal/useDevWarning';
import { mergeRefs } from '../../internal/mergeRefs';
import type { Normalizer } from '../../normalize';

export type TextFieldSize = 'sm' | 'md' | 'lg';

/*
 * Heights come from the same tokens as Button, which is what makes a field, a
 * select and a button of the same size line up in a row — a required check in
 * doc 03 §9, and one of the details that most gives away a system that is not
 * one.
 */
interface SizeClasses {
  /** The height, on the frame — it is the frame that draws the box. */
  frame: string;
  /** The type size, on the CONTROL: an input inherits no font. */
  text: string;
}

const SIZE: Record<TextFieldSize, SizeClasses> = {
  sm: { frame: 'bb:h-control-sm', text: 'bb:text-xs' },
  md: { frame: 'bb:h-control-md', text: 'bb:text-md' },
  lg: { frame: 'bb:h-control-lg', text: 'bb:text-lg' }
} satisfies Record<TextFieldSize, SizeClasses>;

/*
 * The control no longer draws the box — ControlFrame does, so an affix can sit
 * inside the border and in the flow beside the value. What is left here is the
 * value's own typography and the fact that it fills the row.
 */
const INPUT = cx(CONTROL_INSIDE, CONTROL_TEXT);

/*
 * The `Omit` is the whole prop list, and it is worth knowing what that
 * includes: everything the base accepts, which is everything an `<input>`
 * accepts. `maxLength`, `minLength`, `pattern`, `inputMode`, `autoComplete`,
 * `name` and `type` are already here and already forwarded by the spread —
 * there is nothing to add for them, and adding a named prop would break the
 * spread for no gain (doc 02 §2).
 *
 * `maxLength` restricts and `minLength` cannot: a browser stops the
 * thirty-third character, but nothing can stop somebody typing too few, so a
 * minimum sets the attribute and the judgement stays the project's
 * (doc 07 §1).
 */
export interface TextFieldProps extends Omit<
  AriaTextFieldProps,
  'children' | 'className' | 'style' | ValidationProps
> {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`. The project decides there is an error and writes it. */
  errorMessage?: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /** Waiting for data the field needs. */
  isLoading?: boolean;
  /** The value is being submitted. */
  isSaving?: boolean;
  /** Height and type size. Aligns with a Button of the same size. */
  size?: TextFieldSize;
  placeholder?: string;
  /**
   * Before the value, inside the box: `@`, a currency symbol, an icon.
   *
   * Hidden from assistive technology (doc 02 §11.3), which carries a rule with
   * it: a unit somebody NEEDS in order to answer belongs in the label or the
   * description, not only here.
   */
  prefix?: React.ReactNode;
  /** After the value, inside the box: `.com`, a unit. Same rules as `prefix`. */
  suffix?: React.ReactNode;
  /**
   * Where the value sits in its box. `start | center | end`, never
   * `left`/`right` — a field aligned to the right in an Arabic form is aligned
   * to the wrong edge (doc 02 §3.2).
   */
  align?: ControlAlign;
  /**
   * Rewrite the value as it is typed: upper case, stripped spaces, folded
   * accents. Compose it from `normalize` and the transformations beside it.
   *
   * ```tsx
   * <TextField label="Plate" normalize={normalize(upperCase, stripSpaces)} />
   * ```
   *
   * This is not validation and it is not restriction (doc 07 §2): it accepts
   * the keystroke and changes it, rather than refusing it or judging the
   * result. Deciding a value is wrong stays the project's.
   *
   * **Do not fold accents in a name.** Somebody's name is spelled the way they
   * spell it, and only you know which field this is.
   *
   * What the field contributes over doing this in your own `onChange` is the
   * caret: rewriting a value while somebody types moves the cursor to the end
   * mid-word, and this puts it back.
   */
  normalize?: Normalizer;
  /**
   * Show how much of `maxLength` has been used.
   *
   * `maxLength` is a silent restriction: past the limit the browser drops the
   * keystroke and says nothing, which is the clearest case there is of an
   * interaction with no response (doc 09 §3). It needs a `maxLength` to count
   * against, and warns in development without one.
   *
   * The counter is not announced on every keystroke — a number changing under
   * a screen reader would turn typing into a drum roll. Reaching the limit is
   * announced once, because that is the moment something stops working.
   */
  isCounterVisible?: boolean;
  /**
   * Show a cross that empties the field.
   *
   * It holds its width in every state, including the ones where it has nothing
   * to offer — empty, disabled, read-only, busy. Doc 07 §2.2 rule 1: a control
   * that appears with the first character typed makes the box narrower on that
   * keystroke and wider again when it is deleted, which is doc 09 §3 broken
   * twice per edit.
   *
   * So turning this on costs the room whether or not there is a value. That is
   * the trade, and it is why it is a prop rather than something every field
   * does.
   */
  isClearable?: boolean;
  className?: string;
}

/**
 * A single-line text field: label, control, description and error, related to
 * each other.
 *
 * The unit of composition is the whole set, not the bare input. That relation
 * is what makes an error perceivable to someone who cannot see it — a red
 * message that exists only visually does not exist for them (doc 07 §4).
 *
 * **The library restricts input and presents the error. It does not decide
 * whether the value is valid.** Pass `isInvalid` and `errorMessage` from
 * whatever validates in your project; no schema library is a dependency here.
 *
 * It does not decide *when* an error appears either — on blur, on submit, or
 * while correcting one already shown are all permitted. The one thing it will
 * not do is show an error while someone is typing into a field for the first
 * time (doc 07 §5).
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      description,
      errorMessage,
      isLabelHidden = false,
      isLoading = false,
      isSaving = false,
      size = 'md',
      placeholder,
      prefix,
      suffix,
      align = 'start',
      normalize,
      isCounterVisible = false,
      isClearable = false,
      className,
      ...ariaProps
    },
    ref
  ) {
    const control = useRef<HTMLInputElement | null>(null);
    const normalized = useFieldValue<HTMLInputElement>({
      normalize,
      // Either feature needs the value: one to count it, one to know
      // whether there is anything to clear.
      isTracked: isCounterVisible || isClearable,
      value: ariaProps.value,
      defaultValue: ariaProps.defaultValue,
      onChange: ariaProps.onChange
    });

    const busy = isLoading || isSaving;
    const hasNothingToClear =
      busy ||
      (normalized.value ?? '') === '' ||
      (ariaProps.isDisabled ?? false) ||
      (ariaProps.isReadOnly ?? false);

    const clear = (): void => {
      normalized.props.onChange?.('');
      /*
       * And put the cursor back in the field. Clearing is the start of typing
       * something else, and leaving focus on a button that has just made
       * itself unreachable would strand it — focus has to land somewhere
       * predictable (doc 06 §3).
       */
      control.current?.focus();
    };

    /*
     * A counter with nothing to count against is a number and a slash. Loud in
     * development, silent in production (doc 05 §2.2, rule 3 sets the
     * precedent for warning rather than guessing).
     */
    useDevWarning(
      isCounterVisible && ariaProps.maxLength === undefined,
      'isCounterVisible needs a maxLength to count against.'
    );

    const counter =
      isCounterVisible && ariaProps.maxLength !== undefined ? (
        <CharacterCounter
          length={(normalized.value ?? '').length}
          max={ariaProps.maxLength}
        />
      ) : undefined;

    return (
      <AriaTextField
        /*
         * `aria` rather than the base's default `native`: native validation
         * pops the browser's own bubble, which the library cannot style, cannot
         * translate and cannot time. Presenting the error is our job, and the
         * project owns when it happens.
         */
        validationBehavior="aria"
        className={cx('bb:group bb:w-full', className)}
        {...ariaProps}
        /*
         * After ariaProps, so the normalized value wins when there is one.
         * With no `normalize` the hook returns an empty object and this spread
         * changes nothing — a field that does not use the prop behaves exactly
         * as it did before the prop existed.
         */
        {...normalized.props}
      >
        <Field
          label={label}
          {...(description === undefined ? {} : { description })}
          {...(errorMessage === undefined ? {} : { errorMessage })}
          isRequired={ariaProps.isRequired ?? false}
          isLabelHidden={isLabelHidden}
          isLoading={isLoading}
          isSaving={isSaving}
          {...(counter === undefined ? {} : { counter })}
        >
          <ControlFrame
            {...(prefix === undefined ? {} : { prefix })}
            {...(suffix === undefined ? {} : { suffix })}
            /*
             * The room for the busy indicator goes on the FRAME, not on the
             * control. Field draws that indicator over the trailing edge, and
             * reserving the space here moves a suffix out from under it as
             * well — where reserving it on the input alone would leave the
             * affix and the spinner in the same place (doc 07 §2.2).
             */
            {...(isClearable
              ? { trailing: <ClearButton onPress={clear} /> }
              : {})}
            isTrailingHidden={hasNothingToClear}
            className={cx(SIZE[size].frame, busy && !isClearable && 'bb:pe-9')}
          >
            <Input
              ref={mergeRefs(ref, normalized.ref, control)}
              className={cx(INPUT, SIZE[size].text, ALIGN[align])}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
          </ControlFrame>
        </Field>
      </AriaTextField>
    );
  }
);
