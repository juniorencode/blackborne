import { forwardRef } from 'react';
import {
  CheckboxGroup as AriaCheckboxGroup,
  FieldError,
  Label,
  Text,
  type CheckboxGroupProps as AriaCheckboxGroupProps
} from 'react-aria-components';
import { cx } from '../../internal/cx';
import type { ValidationProps } from '../../internal/validationProps';

/*
 * The sibling of RadioGroup, and deliberately built the same way: the group
 * owns the label, the description and the error, and the options sit inside
 * it. Doc 09 §8 is about keys, but the reason generalises — two groups that
 * looked alike and laid themselves out differently would cost the credibility
 * of both.
 *
 * What it is NOT is a mode on Checkbox. A `mode="group"` prop would change
 * what every other prop on that component means, which is the monolith
 * non-goal 4 rules out.
 *
 * The option is the existing Checkbox, unchanged. The base passes the group
 * state through context, so a Checkbox inside this picks up
 * `useCheckboxGroupItem` instead of `useCheckbox` on its own, and with it the
 * group's disabled, read-only and required state and the group's description
 * and error ids on its own `aria-describedby`. Nothing is wired by hand here.
 *
 * Where that wiring lands is NOT where RadioGroup puts it, and the difference
 * is the base being right rather than inconsistent. A radiogroup is a widget
 * role, so `aria-invalid` and `aria-required` belong on the group element; a
 * checkbox group is `role="group"`, which supports neither, so both land on
 * every option instead and the group carries only the data attributes. Both
 * halves are asserted in the tests, because a silent change here is exactly
 * the kind an upgrade makes.
 */

/*
 * Orientation is OURS here, and it is the one place this component cannot copy
 * RadioGroup line for line.
 *
 * The base's RadioGroup takes `orientation` because a radiogroup is one
 * composite tab stop and the arrow keys need to know which axis they run
 * along; it puts `aria-orientation` on the element. The base's CheckboxGroup
 * takes no such prop, because it renders a plain `role="group"` whose options
 * are independent tab stops — there is no arrow navigation to orient.
 *
 * So this is layout only, and no ARIA attribute is invented to match: an
 * orientation announced for a set with no directional navigation is noise, and
 * adding an attribute the base declines to add is what doc 06 §2 warns
 * against. The prop, its values and the flex rules below are identical to
 * RadioGroup's on purpose.
 */
const ORIENTATION = {
  vertical: 'bb:flex-col bb:gap-1',
  horizontal: 'bb:flex-row bb:flex-wrap bb:gap-x-5 bb:gap-y-1'
} as const;

export interface CheckboxGroupProps extends Omit<
  AriaCheckboxGroupProps,
  'children' | 'className' | 'style' | ValidationProps
> {
  /** The group's label. Always present, even when visually hidden. */
  label: React.ReactNode;
  /** The options. Use `Checkbox`, each with its own `value`. */
  children: React.ReactNode;
  /** Persistent help text for the group. An error accompanies it. */
  description?: React.ReactNode;
  /** Shown while `isInvalid`. The project decides there is an error. */
  errorMessage?: React.ReactNode;
  /** Lays the options out in a row or a column. Layout only — see above. */
  orientation?: 'vertical' | 'horizontal';
  /** Hide the group label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  className?: string;
}

/**
 * Several related checkboxes under one label, holding an array of values.
 *
 * Each option is its own tab stop and `Space` toggles it, which is the
 * difference from `RadioGroup` that matters at the keyboard: a radio set is
 * one stop the arrows move inside, because exactly one answer is possible. Any
 * number of these can be on at once, so there is nothing to move between.
 *
 * `orientation="horizontal"` wraps rather than overflowing, so a narrow
 * container survives without a query (doc 04 §3).
 *
 * **The library presents the error; it does not decide there is one.**
 */
export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  function CheckboxGroup(
    {
      label,
      children,
      description,
      errorMessage,
      orientation = 'vertical',
      isLabelHidden = false,
      className,
      ...ariaProps
    },
    ref
  ) {
    return (
      <AriaCheckboxGroup
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
              : 'bb:text-md bb:font-strong bb:text-text',
            'bb:w-fit'
          )}
        >
          {label}
          {ariaProps.isRequired ? (
            /*
             * Decoration only. The announcement comes from the options, where
             * the base marks every input required — natively, or with
             * `aria-required` under `validationBehavior="aria"`. Reading the
             * asterisk aloud as well would say it twice.
             */
            <span aria-hidden="true" className="bb:text-danger-text bb:ms-1">
              *
            </span>
          ) : null}
        </Label>

        <div className={cx('bb:flex', ORIENTATION[orientation])}>
          {children}
        </div>

        {description ? (
          <Text slot="description" className="bb:text-xs bb:text-text-muted">
            {description}
          </Text>
        ) : null}

        <FieldError className="bb:text-xs bb:text-danger-text">
          {errorMessage}
        </FieldError>
      </AriaCheckboxGroup>
    );
  }
);
