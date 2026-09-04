import { forwardRef, useId } from 'react';
import {
  Switch as AriaSwitch,
  type SwitchProps as AriaSwitchProps
} from 'react-aria-components';
import { FieldMessages, describedBy } from '../../internal/Field';
import { cx } from '../../internal/cx';

/*
 * A switch is NOT a checkbox with different styling, and the difference is
 * behavioural rather than visual.
 *
 * A checkbox carries a value that forms part of something being submitted. A
 * switch takes effect the moment it is flipped — it is an action, and the
 * result is already saved by the time you look away.
 *
 * That is why this component has no error state and no `isRequired`, even
 * though the base accepts both (verified: aria-invalid and aria-required do
 * reach the input). Excluding them is our decision, and the reasoning is:
 *
 *   - "Required" means nothing for something already in a settled state. Every
 *     switch always has a value.
 *   - An invalid switch is a contradiction. If flipping it can fail, the
 *     failure belongs where the failure happened — doc 09 §4 — and the switch
 *     should return to its previous position, not sit there wearing a red
 *     border. If a value genuinely needs validating before submission, that is
 *     a Checkbox.
 *
 * A switch that can fail is a Checkbox wearing the wrong shape.
 */

const TRACK = cx(
  'bb:box-border bb:relative bb:flex bb:h-5 bb:w-9 bb:flex-none bb:items-center',
  'bb:rounded-full bb:border bb:border-solid bb:border-border',
  'bb:bg-surface-sunken',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-data-selected:border-accent bb:group-data-selected:bg-accent',
  'bb:group-data-focus-visible:shadow-[0_0_0_2px_var(--bb-focus-ring-offset),0_0_0_4px_var(--bb-focus-ring)]',
  'bb:group-data-disabled:border-border bb:group-data-disabled:bg-surface-disabled'
);

const LABEL = cx(
  'bb:group bb:box-border bb:flex bb:items-center bb:gap-x-3',
  // The hit area stays above the minimum at every density (doc 06 §3).
  'bb:min-h-6 bb:w-fit bb:py-0.5',
  'bb:font-sans bb:text-md bb:text-text bb:leading-normal',
  'bb:cursor-pointer bb:select-none',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

export interface SwitchProps extends Omit<
  AriaSwitchProps,
  'children' | 'className' | 'style' | 'isRequired' | 'isInvalid'
> {
  /** The label, beside the track. Always present. */
  children: React.ReactNode;
  /**
   * Persistent help text below.
   *
   * Worth using here more than elsewhere: a switch takes effect immediately,
   * so saying what will happen belongs next to it rather than in a
   * confirmation nobody asked for.
   */
  description?: React.ReactNode;
  className?: string;
}

/**
 * An immediate on/off control.
 *
 * Use it when flipping it *is* the action — a preference, a feature being
 * turned on. For a value submitted with a form, that is a `Checkbox`.
 *
 * Announced as a switch rather than a checkbox, so assistive technology says
 * "on" and "off" instead of "checked". `Space` toggles it, which is what the
 * key means everywhere in the library (doc 09 §8).
 *
 * It has no error state on purpose — see the note in the source.
 */
export const Switch = forwardRef<HTMLLabelElement, SwitchProps>(function Switch(
  { children, description, className, ...rest },
  ref
) {
  /*
   * Stripped at RUNTIME, not just in the type.
   *
   * Omitting them from the interface stops TypeScript, and stops nothing else:
   * a JavaScript consumer, or anyone spreading a props object they built
   * elsewhere, reaches the base all the same — and the base does accept both,
   * so aria-invalid would appear on a control that has no invalid state. A
   * boundary that only exists in the type system is not a boundary.
   */
  const ariaProps = { ...rest } as Record<string, unknown>;
  delete ariaProps['isInvalid'];
  delete ariaProps['isRequired'];

  const id = useId();
  const descriptionId = `${id}-description`;

  const hasDescription = description !== undefined && description !== null;

  /*
   * Same gap as a lone checkbox: the base renders no description for a switch
   * and would not reference one anyway, so the association is supplied here.
   * A description nothing points at does not exist for a screen reader.
   */
  const describedByValue = describedBy({
    hasDescription,
    hasError: false,
    descriptionId,
    errorId: `${id}-error`
  });

  return (
    <div
      className={cx(
        'bb:flex bb:flex-col bb:gap-(--bb-field-gap-inner)',
        className
      )}
    >
      <AriaSwitch
        ref={ref}
        className={LABEL}
        {...(describedByValue === undefined
          ? {}
          : { 'aria-describedby': describedByValue })}
        {...ariaProps}
      >
        <span className={TRACK} aria-hidden="true">
          <span className="bb-switch-thumb" />
        </span>
        <span>{children}</span>
      </AriaSwitch>

      <FieldMessages
        {...(hasDescription ? { description } : {})}
        descriptionId={descriptionId}
        errorId={`${id}-error`}
      />
    </div>
  );
});
