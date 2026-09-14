import { forwardRef, useId } from 'react';
import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as AriaCheckboxProps
} from 'react-aria-components';
import { FieldMessages, describedBy } from '../../internal/Field';
import { CHECK_PATH, DASH_PATH } from '../../internal/CheckGlyph';
import { cx } from '../../internal/cx';
import type { ValidationProps } from '../../internal/validationProps';

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
 * Sized from density tokens, not from a fixed value.
 *
 * It was fixed at first, on the reasoning that one icon size everywhere is
 * what keeps a system coherent (doc 03 §4.6d). That confused two things: a
 * single size across COMPONENTS is the rule, and a single size across
 * DENSITIES is not — doc 03 §3 puts control heights under density, and a
 * checkbox is a control. In a dense table it was the one thing on the row
 * that had not got the message.
 */
const BOX = cx(
  'bb-inline-control-box',
  'bb:box-border bb:flex bb:h-box bb:w-box bb:flex-none bb:items-center bb:justify-center',
  /*
   * The FIELD's edge at rest, and the small-control one on hover.
   *
   * These three used to rest on a token of their own, one step stronger,
   * chosen for the RATIO — and in dark that made a checkbox's edge brighter
   * than the box of the text field beside it, so a form read as two different
   * libraries. Resting on the same edge as a field is what makes a row of
   * mixed controls look like one thing; the field's hover step is what they
   * move to, where a field also moves its border.
   *
   * THE COST IS STATED RATHER THAN HIDDEN: at rest in dark this is 1.37:1
   * against the page, where the step it replaced measured 3.09:1, and doc 03
   * §5 rule 2 asks 3:1 of a graphical element. The old token had no readers
   * left and was removed; its measurement lives in the catalog's §7, with the
   * other rules this library knows it is not meeting.
   */
  'bb:rounded-sm bb:border bb:border-solid bb:border-border',
  /* The SAME step the field's box moves to on hover, not the small-control
     one — a checkbox and the text field beside it answer a pointer with the
     same colour or they read as two libraries. In light the small-control
     token is an alias of the resting one, so the old rule did nothing there
     at all. */
  'bb:group-data-hovered:border-border-strong',
  /*
   * surface-SUNKEN, and all three of these moved together.
   *
   * It was surface-control, the fill a text field uses, which at 1.06:1
   * against a white page is very nearly the page itself — so a 20px box read
   * as an outline with nothing in it. One step down is 1.14:1 and gives the
   * box a floor for its mark to sit on.
   *
   * IT CHANGES LIGHT ONLY, which is why it is this token and not a new one:
   * measured, surface-sunken and surface-control are the SAME value in dark
   * (#0c192c), so the dark side is untouched.
   *
   * This reverses a note that used to sit here saying the opposite — that the
   * switch had rested one step darker than the other two and was brought up to
   * match them. The direction was wrong rather than the instinct: three
   * controls agreeing is what mattered, and they agree here too.
   */
  'bb:bg-surface-sunken bb:text-accent-on',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  // Selected and indeterminate both read as "acted upon", so both fill.
  'bb:group-data-selected:border-accent bb:group-data-selected:bg-accent',
  'bb:group-data-indeterminate:border-accent bb:group-data-indeterminate:bg-accent',
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
  /*
   * THE FILL DOES NOT MOVE ON HOVER — the border does, which is what a text
   * field already does and what makes a row of mixed controls answer a pointer
   * the same way.
   *
   * It used to repaint the interior as well. On a 20px box that is the whole
   * control changing colour for a pointer merely passing over it, and in a
   * dense form the page shimmers as the cursor crosses it. Press still moves
   * the fill: a press is a decision, not a pointer passing through.
   */
  'bb:group-data-pressed:bg-surface-active',
  'bb:group-data-selected:group-data-hovered:border-accent-hover',
  'bb:group-data-selected:group-data-pressed:border-accent-active bb:group-data-selected:group-data-pressed:bg-accent-active',
  'bb:group-data-indeterminate:group-data-hovered:border-accent-hover',
  'bb:group-data-indeterminate:group-data-pressed:border-accent-active bb:group-data-indeterminate:group-data-pressed:bg-accent-active',
  // The ring lands on the box, because the real input is visually hidden. It
  // is the library's single focus ring, from a token, and only on keyboard
  // focus — a ring on mouse click is noise (doc 06 §3).
  'bb:group-data-focused:border-focus-ring bb:group-data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:group-data-invalid:border-border-invalid',
  'bb:group-data-invalid:[--bb-focus-ring:var(--bb-border-invalid)]',
  /* The resting edge, not the hover one: a switched-off control may not be
     LOUDER than a live one, which it became when rest moved down a step. */
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
  'bb:min-h-hit bb:w-fit bb:py-0.5',
  'bb:font-sans bb:text-md bb:text-text bb:leading-normal',
  'bb:cursor-pointer bb:select-none',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

export interface CheckboxProps extends Omit<
  AriaCheckboxProps,
  'children' | 'className' | 'style' | ValidationProps
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
          /* No gap: nothing sits above the control here, so the messages hug
             it. `Field` carries the rule. */
          'bb:flex bb:flex-col',
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
           *
           * The choice lives in Checkbox.css rather than in utilities, because
           * it is a precedence rule: indeterminate has to beat selected, and
           * two utilities of equal specificity are decided by generator output
           * order. See that file for what went wrong the first time.
           */}
          <span className={BOX} aria-hidden="true">
            <svg
              viewBox="0 0 16 16"
              className="bb:h-mark bb:w-mark"
              fill="none"
            >
              <path
                className="bb-checkbox-check"
                /*
                 * The shared geometry, so this tick and the one a chosen
                 * option draws in a list cannot drift apart. The PATH is
                 * shared rather than a component, because this one has to be
                 * a sibling of the dash for the precedence rule below to work
                 * — see internal/CheckGlyph.
                 */
                d={CHECK_PATH}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="bb-checkbox-dash"
                d={DASH_PATH}
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
