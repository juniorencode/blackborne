import { forwardRef } from 'react';
import {
  FieldError,
  Label,
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  Text,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps
} from 'react-aria-components';
import { cx } from '../../internal/cx';

/*
 * Two levels of label, which is what this component adds to the field model.
 *
 * A text field has one label. A checkbox has one label, beside the control. A
 * radio group has a label for the GROUP and a label for each option, and the
 * description and error hang off the group rather than off any single radio.
 *
 * The base handles all of that wiring, verified: the description and error are
 * referenced from the group AND from every radio, with aria-invalid and
 * aria-required on the group. Nothing needs supplying here — unlike a lone
 * checkbox, where the base leaves the association to the caller.
 */

const DOT = cx(
  'bb:box-border bb:flex bb:size-4 bb:flex-none bb:items-center bb:justify-center',
  'bb:rounded-full bb:border bb:border-solid bb:border-border',
  'bb:bg-surface-control',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-data-selected:border-accent bb:group-data-selected:bg-accent',
  // The library's single focus ring, on the dot, because the real input is
  // visually hidden. Keyboard focus only — a ring on mouse click is noise.
  'bb:group-data-focus-visible:shadow-[0_0_0_2px_var(--bb-focus-ring-offset),0_0_0_4px_var(--bb-focus-ring)]',
  'bb:group-data-invalid:border-danger',
  'bb:group-data-disabled:border-border bb:group-data-disabled:bg-surface-disabled'
);

const OPTION = cx(
  'bb:group bb:box-border bb:flex bb:items-start bb:gap-x-2',
  // The hit area is the whole option, above the minimum at every density
  // including compact (doc 06 §3).
  'bb:min-h-6 bb:w-fit bb:py-0.5',
  'bb:font-sans bb:text-md bb:text-text bb:leading-normal',
  'bb:cursor-pointer bb:select-none',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

export interface RadioProps extends Omit<
  AriaRadioProps,
  'children' | 'className' | 'style'
> {
  /** The option's own label. */
  children: React.ReactNode;
  className?: string;
}

/**
 * One option inside a `RadioGroup`.
 *
 * It only works inside one: a radio outside a group has nothing to be
 * exclusive with, and the base owns the arrow-key navigation that makes a set
 * of them behave as a single tab stop.
 */
export const Radio = forwardRef<HTMLLabelElement, RadioProps>(function Radio(
  { children, className, ...ariaProps },
  ref
) {
  return (
    <AriaRadio ref={ref} className={cx(OPTION, className)} {...ariaProps}>
      {/*
       * The inner dot is drawn by CSS from the state attribute rather than
       * conditionally rendered, so there is no class string computed in JS
       * (doc 02 §4).
       */}
      <span className={DOT} aria-hidden="true">
        <span className="bb-radio-dot" />
      </span>
      <span>{children}</span>
    </AriaRadio>
  );
});

export interface RadioGroupProps extends Omit<
  AriaRadioGroupProps,
  'children' | 'className' | 'style'
> {
  /** The group's label. Always present, even when visually hidden. */
  label: React.ReactNode;
  /** The options. Use `Radio`. */
  children: React.ReactNode;
  /** Persistent help text for the group. An error accompanies it. */
  description?: React.ReactNode;
  /** Shown while `isInvalid`. The project decides there is an error. */
  errorMessage?: React.ReactNode;
  /** Hide the group label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  className?: string;
}

/**
 * A set of mutually exclusive options.
 *
 * The whole group is one tab stop and the arrow keys move within it, which is
 * the keyboard convention the base implements and doc 09 §8 fixes across the
 * library: arrows move *inside* a control that has several options.
 *
 * `orientation="horizontal"` lays the options out in a row and also tells
 * assistive technology which arrow keys apply. It wraps rather than
 * overflowing, so a narrow container survives without a query (doc 04 §3).
 *
 * **The library presents the error; it does not decide there is one.**
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(
    {
      label,
      children,
      description,
      errorMessage,
      isLabelHidden = false,
      className,
      ...ariaProps
    },
    ref
  ) {
    const isHorizontal = ariaProps.orientation === 'horizontal';

    return (
      <AriaRadioGroup
        ref={ref}
        className={cx(
          'bb:flex bb:flex-col bb:gap-(--bb-field-gap-inner)',
          'bb:font-sans bb:text-md',
          className
        )}
        {...ariaProps}
      >
        <Label
          className={cx(
            isLabelHidden
              ? 'bb:sr-only'
              : 'bb:text-xs bb:font-strong bb:text-text',
            'bb:w-fit'
          )}
        >
          {label}
          {ariaProps.isRequired ? (
            /*
             * Decoration only — the announcement comes from the base's
             * aria-required on the group, so reading the asterisk aloud would
             * say it twice.
             */
            <span aria-hidden="true" className="bb:text-danger bb:ms-1">
              *
            </span>
          ) : null}
        </Label>

        <div
          className={cx(
            'bb:flex',
            isHorizontal
              ? 'bb:flex-row bb:flex-wrap bb:gap-x-5 bb:gap-y-1'
              : 'bb:flex-col bb:gap-1'
          )}
        >
          {children}
        </div>

        {description ? (
          <Text slot="description" className="bb:text-xs bb:text-text-muted">
            {description}
          </Text>
        ) : null}

        <FieldError className="bb:text-xs bb:text-danger">
          {errorMessage}
        </FieldError>
      </AriaRadioGroup>
    );
  }
);
