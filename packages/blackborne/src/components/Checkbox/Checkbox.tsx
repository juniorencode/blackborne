import { forwardRef, useId } from 'react';
import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as AriaCheckboxProps
} from 'react-aria-components';
import { FieldMessages, describedBy } from '../../internal/Field';
import { cx } from '../../internal/cx';

/*
 * The layout that made Field's shape insufficient.
 *
 * A text field stacks: label above, control below. A checkbox does the
 * opposite — the control comes first and the label sits beside it, on the same
 * line, and the base's Checkbox IS the label element wrapping a visually
 * hidden input. There is no separate Label to place.
 *
 * That is why this does not use Field. It is not a variant of a stacked field;
 * it is a different arrangement that happens to share the messages beneath.
 */

/*
 * ONE SIZE, deliberately. Doc 03 §4.6d: one standard icon size aligned with
 * the text, used in almost everything, and a second only if justified. A
 * checkbox that scales with control heights would be the start of five sizes,
 * and nothing needs that yet.
 */
const BOX = cx(
  'bb:box-border bb:flex bb:size-4 bb:flex-none bb:items-center bb:justify-center',
  'bb:rounded-sm bb:border bb:border-solid bb:border-border',
  'bb:bg-surface-control bb:text-accent-on',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  // Selected and indeterminate both read as "acted upon", so both fill.
  'bb:group-data-selected:border-accent bb:group-data-selected:bg-accent',
  'bb:group-data-indeterminate:border-accent bb:group-data-indeterminate:bg-accent',
  // The ring lands on the box, because the real input is visually hidden. It
  // is the library's single focus ring, from a token, and only on keyboard
  // focus — a ring on mouse click is noise (doc 06 §3).
  'bb:group-data-focus-visible:shadow-[0_0_0_2px_var(--bb-focus-ring-offset),0_0_0_4px_var(--bb-focus-ring)]',
  'bb:group-data-invalid:border-danger',
  'bb:group-data-disabled:border-border bb:group-data-disabled:bg-surface-disabled'
);

const LABEL = cx(
  // gap-x, not gap: this is the horizontal space between the box and the
  // text. A plain `gap` would also apply between wrapped lines of a long
  // label, and would be indistinguishable from one of the two vertical form
  // gaps doc 03 §4.6c allows.
  'bb:group bb:box-border bb:flex bb:items-start bb:gap-x-2',
  // The hit area is the whole label, and it stays above the minimum at every
  // density, compact included (doc 06 §3). Compacting until this breaks is not
  // an option.
  'bb:min-h-6 bb:w-fit bb:py-0.5',
  'bb:font-sans bb:text-md bb:text-text bb:leading-normal',
  'bb:cursor-pointer bb:select-none',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

export interface CheckboxProps extends Omit<
  AriaCheckboxProps,
  'children' | 'className' | 'style'
> {
  /** The label, beside the box. Always present — a control with no label has no name. */
  children: React.ReactNode;
  /** Persistent help text, below. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown while `isInvalid`. The project decides there is an error and writes it. */
  errorMessage?: React.ReactNode;
  className?: string;
}

/**
 * A single checkbox: a box, a label beside it, and optionally a description and
 * an error beneath.
 *
 * Use it for a value that forms part of something being submitted. For an
 * immediate action that takes effect the moment it is flipped, that is a
 * different component — see the catalog.
 *
 * **The library presents the error; it does not decide there is one.** Pass
 * `isInvalid` and `errorMessage` from whatever validates in your project.
 */
export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(
  function Checkbox(
    { children, description, errorMessage, className, ...ariaProps },
    ref
  ) {
    /*
     * One id per field, two derived from it. The base wires description and
     * error for its own field containers but not for a lone checkbox — see
     * FieldMessages for what was verified and why this is filled in here.
     */
    const id = useId();
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;

    const hasDescription = description !== undefined && description !== null;
    const hasError =
      (ariaProps.isInvalid ?? false) &&
      errorMessage !== undefined &&
      errorMessage !== null;

    const describedByValue = describedBy({
      hasDescription,
      hasError,
      descriptionId,
      errorId
    });

    return (
      <div
        className={cx(
          'bb:flex bb:flex-col bb:gap-(--bb-field-gap-inner)',
          className
        )}
      >
        <AriaCheckbox
          ref={ref}
          className={LABEL}
          {...(describedByValue === undefined
            ? {}
            : { 'aria-describedby': describedByValue })}
          {...ariaProps}
        >
          {/*
           * Both marks are always in the DOM and CSS decides which is visible,
           * from the state attributes the base puts on the label. No render
           * prop, and no class string computed in JavaScript (doc 02 §4).
           */}
          <span className={BOX} aria-hidden="true">
            <svg viewBox="0 0 16 16" className="bb:size-3" fill="none">
              <path
                className="bb:hidden bb:group-data-selected:block bb:group-data-indeterminate:hidden"
                d="M3.5 8.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="bb:hidden bb:group-data-indeterminate:block"
                d="M4 8h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span>{children}</span>
        </AriaCheckbox>

        <FieldMessages
          {...(hasDescription ? { description } : {})}
          {...(errorMessage === undefined ? {} : { errorMessage })}
          isInvalid={ariaProps.isInvalid ?? false}
          descriptionId={descriptionId}
          errorId={errorId}
        />
      </div>
    );
  }
);
