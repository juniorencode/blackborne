import { forwardRef } from 'react';
import {
  Input,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps
} from 'react-aria-components';
import { CONTROL_BOX, CONTROL_TEXT, Field } from '../../internal/Field';
import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/mergeRefs';
import { useNormalizedField } from '../../internal/useNormalizedField';
import type { Normalizer } from '../../normalize';

export type TextFieldSize = 'sm' | 'md' | 'lg';

/*
 * Heights come from the same tokens as Button, which is what makes a field, a
 * select and a button of the same size line up in a row — a required check in
 * doc 03 §9, and one of the details that most gives away a system that is not
 * one.
 */
const SIZE: Record<TextFieldSize, string> = {
  sm: 'bb:h-control-sm bb:text-xs',
  md: 'bb:h-control-md bb:text-md',
  lg: 'bb:h-control-lg bb:text-lg'
} satisfies Record<TextFieldSize, string>;

const INPUT = cx(CONTROL_BOX, CONTROL_TEXT);

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
  'children' | 'className' | 'style'
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
      normalize,
      className,
      ...ariaProps
    },
    ref
  ) {
    const normalized = useNormalizedField<HTMLInputElement>({
      normalize,
      value: ariaProps.value,
      defaultValue: ariaProps.defaultValue,
      onChange: ariaProps.onChange
    });

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
        >
          <Input
            ref={mergeRefs(ref, normalized.ref)}
            className={cx(
              INPUT,
              SIZE[size],
              (isLoading || isSaving) && 'bb:pe-9'
            )}
            {...(placeholder === undefined ? {} : { placeholder })}
          />
        </Field>
      </AriaTextField>
    );
  }
);
