import { forwardRef } from 'react';
import {
  Input,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps
} from 'react-aria-components';
import { Field } from '../../internal/Field';
import { cx } from '../../internal/cx';

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

const INPUT = cx(
  'bb:box-border bb:w-full bb:min-w-0',
  'bb:px-(--bb-control-padding-x)',
  'bb:rounded-md bb:border bb:border-solid bb:border-border',
  'bb:bg-surface-control bb:text-surface-control-on',
  'bb:font-sans bb:leading-normal',
  'bb:outline-hidden',
  'bb:transition-[border-color,box-shadow,background-color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  // The placeholder uses the SECONDARY text colour, not a fourth lighter grey.
  // Doc 03 §4.7: raise the value, do not lower the placeholder — a very faint
  // placeholder drops below minimum contrast and stops being readable.
  'bb:placeholder:text-text-muted',
  'bb:data-focused:border-border-focus',
  'bb:data-focused:shadow-[0_0_0_2px_var(--bb-focus-ring-offset),0_0_0_4px_var(--bb-focus-ring)]',
  'bb:data-invalid:border-danger',
  // Read-only and disabled deliberately look different. Read-only shows a
  // value you can read, select and copy; disabled says this does not apply
  // right now (doc 07 §6).
  'bb:data-readonly:bg-surface-sunken',
  'bb:data-disabled:bg-surface-disabled bb:data-disabled:text-text-disabled',
  'bb:data-disabled:cursor-not-allowed'
);

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
      className,
      ...ariaProps
    },
    ref
  ) {
    return (
      <AriaTextField
        /*
         * `aria` rather than the base's default `native`: native validation
         * pops the browser's own bubble, which the library cannot style, cannot
         * translate and cannot time. Presenting the error is our job, and the
         * project owns when it happens.
         */
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
          <Input
            ref={ref}
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
