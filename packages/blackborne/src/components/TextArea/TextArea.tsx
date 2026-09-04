import { forwardRef } from 'react';
import {
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps
} from 'react-aria-components';
import { Field } from '../../internal/Field';
import { cx } from '../../internal/cx';

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
  'bb:box-border bb:w-full bb:min-w-0',
  'bb:px-(--bb-control-padding-x) bb:py-2',
  'bb:rounded-md bb:border bb:border-solid bb:border-border',
  'bb:bg-surface-control bb:text-surface-control-on',
  'bb:font-sans bb:text-md bb:leading-normal',
  'bb:outline-hidden',
  'bb:transition-[border-color,box-shadow,background-color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  // The placeholder uses the SECONDARY text colour, not a fourth lighter grey
  // (doc 03 §4.7): raise the value, do not lower the placeholder.
  'bb:placeholder:text-text-muted',
  'bb:data-focused:border-border-focus',
  'bb:data-focused:shadow-[0_0_0_2px_var(--bb-focus-ring-offset),0_0_0_4px_var(--bb-focus-ring)]',
  'bb:data-invalid:border-danger',
  'bb:data-readonly:bg-surface-sunken',
  'bb:data-disabled:bg-surface-disabled bb:data-disabled:text-text-disabled',
  'bb:data-disabled:cursor-not-allowed'
);

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
      className,
      ...ariaProps
    },
    ref
  ) {
    return (
      <AriaTextField
        // `aria` rather than the base's `native`: native validation pops the
        // browser's own bubble, which the library cannot style, translate or
        // time. Presenting the error is our job (doc 07 §1).
        validationBehavior="aria"
        className={cx('bb:w-full', className)}
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
          <AriaTextArea
            ref={ref}
            rows={rows}
            className={cx(CONTROL, 'bb-textarea')}
            {...(placeholder === undefined ? {} : { placeholder })}
          />
        </Field>
      </AriaTextField>
    );
  }
);
