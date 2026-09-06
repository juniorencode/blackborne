import { forwardRef } from 'react';
import {
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps
} from 'react-aria-components';
import { CONTROL_BOX, CONTROL_TEXT, Field } from '../../internal/Field';
import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/mergeRefs';
import { useNormalizedField } from '../../internal/useNormalizedField';
import type { Normalizer } from '../../normalize';

/*
 * The one thing that makes a text area different from a text field: its height
 * does NOT come from the control-height tokens.
 *
 * Those exist so a field, a select and a button of the same size line up in a
 * row (doc 03 §9). A text area is not in that row — it is a block, and forcing
 * it to a control height would make it a one-line input with the wrong element.
 * Its height comes from a row count instead.
 */

const CONTROL = cx(
  CONTROL_BOX,
  CONTROL_TEXT,
  // A block, so it has vertical padding of its own and a fixed type size:
  // it is not part of the row the control heights line up in.
  'bb:py-2 bb:text-md'
);

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
export interface TextAreaProps extends Omit<
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
  /**
   * Visible rows before scrolling. Defaults to 3.
   *
   * A starting height, not a limit: the field scrolls past it. Growing with
   * the content is a capability rather than a default, so it is a hook when
   * someone needs it, not a prop here (P6).
   */
  rows?: number;
  placeholder?: string;
  /**
   * Rewrite the value as it is typed. Composed from `normalize` and the
   * transformations beside it, so the order is the thing you read
   * (doc 07 §2.1).
   *
   * Worth a second thought here more than on a single-line field: a text area
   * holds a note somebody wrote, and folding accents or forcing case on prose
   * is a defect. It earns its place on the values that happen to be long —
   * a pasted block of codes, a list of references.
   */
  normalize?: Normalizer;
  className?: string;
}

/**
 * A multi-line text field: label, control, description and error, related to
 * each other.
 *
 * Everything the single-line field guarantees applies here too — the library
 * restricts input and presents errors, and the project decides whether a value
 * is valid and when to say so.
 *
 * **Resizing is left to the browser**, vertically only. A person given a small
 * box for a long note will want it bigger, and taking that away to keep a
 * layout tidy trades their problem for ours. Horizontal resizing is disabled
 * because it can push a field out of its container.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    {
      label,
      description,
      errorMessage,
      isLabelHidden = false,
      isLoading = false,
      isSaving = false,
      rows = 3,
      placeholder,
      normalize,
      className,
      ...ariaProps
    },
    ref
  ) {
    const normalized = useNormalizedField<HTMLTextAreaElement>({
      normalize,
      value: ariaProps.value,
      defaultValue: ariaProps.defaultValue,
      onChange: ariaProps.onChange
    });

    return (
      <AriaTextField
        // `aria` rather than the base's `native`: native validation pops the
        // browser's own bubble, which the library cannot style, translate or
        // time. Presenting the error is our job (doc 07 §1).
        validationBehavior="aria"
        className={cx('bb:w-full', className)}
        {...ariaProps}
        /* After ariaProps, so a normalized value wins. Empty without one. */
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
          <AriaTextArea
            ref={mergeRefs(ref, normalized.ref)}
            rows={rows}
            className={cx(CONTROL, 'bb-textarea')}
            {...(placeholder === undefined ? {} : { placeholder })}
          />
        </Field>
      </AriaTextField>
    );
  }
);
