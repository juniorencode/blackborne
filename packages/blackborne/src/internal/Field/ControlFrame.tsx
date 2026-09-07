import { Group } from 'react-aria-components';
import { cx } from '../cx';
import { CONTROL_BOX } from './controlBox';

/*
 * INTERNAL. The frame a field's control sits in, when something else has to
 * sit in there with it.
 *
 * A text field's input used to BE the box. That works until an affix arrives:
 * a `@` before the value or a `.com` after it has to be inside the border and
 * in the flow, because its width depends on its text and no amount of reserved
 * padding can be computed from CSS. So the box moves out to a wrapper and the
 * control becomes one item in a row — which is the shape NumberField has had
 * since it was built, for the same reason with different contents.
 *
 * Measured before relying on it: a `Group` inside the base's TextField reports
 * `data-invalid`, `data-hovered`, `data-focus-within` and `data-disabled`.
 * `data-readonly` comes from the field root, which is what `bb-field-box`
 * reads. So the frame styles from state the base publishes rather than from
 * anything computed in render (doc 02 §4).
 */

export interface ControlFrameProps {
  /**
   * Before the value. `@`, a currency symbol, an icon.
   *
   * **Hidden from assistive technology**, per doc 02 §11.3: the field's label
   * is always present, so the affix can never be the only carrier of meaning —
   * and announcing "Weight kg 12 kg" is noise. The consequence is the rule that
   * matters: a unit that a person NEEDS in order to answer belongs in the
   * label or the description, not only here.
   */
  prefix?: React.ReactNode;
  /** After the value. Same rules as `prefix`. */
  suffix?: React.ReactNode;
  /**
   * A control the FIELD owns, at the leading edge — a stepper's `−`.
   *
   * Separate from `prefix` because the two are not the same kind of thing and
   * doc 07 §2.2 rule 3 says so: an affix is text the consumer wrote, a control
   * is a target. They may not share an edge, because sharing one halves the
   * target, and the minimum hit area is not negotiable at compact density.
   */
  leading?: React.ReactNode;
  /** A control the field owns at the trailing edge — a stepper's `+`, a cross. */
  trailing?: React.ReactNode;
  /**
   * Make the edge controls unreachable while keeping the room they occupy.
   *
   * Doc 07 §2.2 rule 1, and the frame owns the mechanism so no field can get
   * it wrong: hidden from the reader, unfocusable, unclickable — and still
   * taking up its width, because closing the gap widens the box and slides
   * the value across. A clear button that appears with the first character
   * typed does the same thing in reverse.
   *
   * The CONDITION belongs to the field: busy for a stepper, busy or empty for
   * a cross. The frame only knows how to make one disappear without moving
   * anything.
   */
  isLeadingHidden?: boolean;
  isTrailingHidden?: boolean;
  /** The control itself. */
  children: React.ReactNode;
  className?: string;
}

const AFFIX = cx(
  'bb:flex bb:flex-none bb:items-center',
  /*
   * Muted, because an affix is orientation and not content: `@` is part of the
   * shape of an email address, not part of the address. Doc 03 §4.7's second
   * level, which is what secondary text is for.
   */
  'bb:text-text-muted',
  /*
   * Not selectable and not a click target. Dragging across a field to select
   * its value should not pick up a `.com` that is not in the value, and a
   * click near the edge should reach the control rather than stopping on a
   * decoration.
   */
  'bb:select-none bb:pointer-events-none'
);

/**
 * Unreachable in every sense that matters, and still the same width.
 *
 * `inert` rather than a class, because `visibility: hidden` is invisible to a
 * test environment with no stylesheet: the control would keep answering to
 * `getByRole` and a check asserting it is gone would pass for the wrong
 * reason. `inert` takes it out of focus order and hit testing, `aria-hidden`
 * out of the accessibility tree, and the class out of sight.
 */
function edge(content: React.ReactNode, isHidden: boolean): React.ReactNode {
  if (content === undefined) return null;
  return (
    <span
      className={cx(
        'bb:flex bb:flex-none bb:items-stretch',
        isHidden && 'bb:invisible'
      )}
      {...(isHidden ? { inert: true, 'aria-hidden': true } : {})}
    >
      {content}
    </span>
  );
}

export function ControlFrame({
  prefix,
  suffix,
  leading,
  trailing,
  isLeadingHidden = false,
  isTrailingHidden = false,
  children,
  className
}: ControlFrameProps): React.ReactNode {
  /*
   * The order is doc 07 §2.2 rule 3 made literal: the affix sits AHEAD of the
   * control that shares its side, so a unit reads next to the value it belongs
   * to and the button keeps a full target at the edge.
   */
  return (
    <Group className={cx(CONTROL_BOX, 'bb:flex bb:items-stretch', className)}>
      {edge(leading, isLeadingHidden)}
      {prefix === undefined ? null : (
        <span
          aria-hidden="true"
          className={cx(AFFIX, 'bb:ps-(--bb-control-padding-x)')}
        >
          {prefix}
        </span>
      )}
      {children}
      {suffix === undefined ? null : (
        <span
          aria-hidden="true"
          className={cx(AFFIX, 'bb:pe-(--bb-control-padding-x)')}
        >
          {suffix}
        </span>
      )}
      {edge(trailing, isTrailingHidden)}
    </Group>
  );
}
