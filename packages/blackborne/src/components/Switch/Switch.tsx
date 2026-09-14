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
  'bb:box-border bb:relative bb:flex bb:h-switch bb:w-switch bb:flex-none bb:items-center',
  /* The field's edge at rest, the small-control one on hover — see the note
     in Checkbox.tsx, which carries the measurement. */
  'bb:rounded-full bb:border bb:border-solid bb:border-border',
  /* The SAME step the field's box moves to on hover, not the small-control
     one — a checkbox and the text field beside it answer a pointer with the
     same colour or they read as two libraries. In light the small-control
     token is an alias of the resting one, so the old rule did nothing there
     at all. */
  'bb:group-data-hovered:border-border-strong',
  /* surface-sunken, with the other two — see the note in Checkbox.tsx. */
  'bb:bg-surface-sunken',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-data-selected:border-accent bb:group-data-selected:bg-accent',
  /*
   * Pointer feedback. Doc 09 §3 asks for a visible response to every
   * interaction, and this control had none: measured, hover and pressed were
   * pixel-identical to rest.
   *
   * The FILL moves and the border does not, because Button already answered
   * this question — secondary hovers by moving bg-surface-hover and leaves
   * its border alone — and doc 09 §8 is blunt that one component behaving
   * differently costs the credibility of all of them.
   *
   * TWO rules, not one. A filled control hovering back to grey would read as
   * a different component, so once it is filled it moves along the ACCENT
   * ramp instead. The stacked variant carries higher specificity than either
   * single one, so which wins is not decided by source order — this file has
   * already lost that argument once.
   *
   * The whole label triggers it, not just the box: the label IS the hit area,
   * and feedback that fired only over twenty pixels would teach people the
   * text is not pressable when it is.
   */
  /* The fill does not move on hover — see the note in Checkbox.tsx. */
  'bb:group-data-pressed:bg-surface-active',
  'bb:group-data-selected:group-data-hovered:border-accent-hover',
  'bb:group-data-selected:group-data-pressed:border-accent-active bb:group-data-selected:group-data-pressed:bg-accent-active',
  'bb:group-data-focused:border-focus-ring bb:group-data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  /* The resting edge, not the hover one: a switched-off control may not be
     LOUDER than a live one, which it became when rest moved down a step. */
  'bb:group-data-disabled:border-border bb:group-data-disabled:bg-surface-disabled'
);

const LABEL = cx(
  'bb:group bb:box-border bb:flex bb:items-center bb:gap-x-3',
  // The hit area stays above the minimum at every density (doc 06 §3).
  'bb:min-h-hit bb:w-fit bb:py-0.5',
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
        /* No gap: nothing sits above the control here, so the messages hug
             it. `Field` carries the rule. */
        'bb:flex bb:flex-col',
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
