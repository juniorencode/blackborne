import { forwardRef, useLayoutEffect, useRef } from 'react';
import {
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps
} from 'react-aria-components';
import {
  ALIGN,
  CONTROL_BOX,
  CONTROL_TEXT,
  CharacterCounter,
  Field,
  useFieldValue,
  type ControlAlign
} from '../../internal/Field';
import { cx } from '../../internal/cx';
import { useDevWarning } from '../../internal/useDevWarning';
import { mergeRefs } from '../../internal/mergeRefs';
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
 * Growing to fit the content, and everything about it that is harder than it
 * looks.
 *
 * THE PURE-CSS ROUTE WAS THE FIRST CHOICE AND DOES NOT CARRY YET.
 * `field-sizing: content` is this entire hook in one declaration: no
 * measurement, no forced layout, and it answers a pasted block or a value
 * replaced from outside for free, because the browser is the thing doing the
 * sizing. It reached baseline support in June 2026, three months before this
 * was written.
 *
 * Decision 0006 is the precedent for a support gap, and it does not stretch
 * over this one. Its argument is that support in self-updating browsers "has
 * been settled for years", and that where it is missing what is lost is "an
 * optimal layout, not functionality". The first half is not true of a
 * three-month-old baseline. The second is worse here rather than better: a
 * management application is exactly where a locked corporate browser is
 * normal, and on one of those `isGrowable` would be a prop that silently does
 * nothing at all — not a degraded layout, an absent capability.
 *
 * Shipping both was considered and rejected. Two mechanisms for one behaviour
 * is doc 01 §7 by name, and the browser checks run on Chromium, where the CSS
 * route always wins — so the fallback would be the one path in the library
 * that nothing ever exercises. When the baseline is old enough this becomes
 * three declarations of CSS and the hook is deleted, not kept beside them.
 *
 * THE MEASUREMENT, AND THE TRADE THAT WAS CHOSEN.
 * A textarea's content height is `scrollHeight`, and it only reports the
 * content while the element is SHORTER than it — so the height has to come off
 * before the read. That is the classic reset-read-set, and the read is a
 * forced synchronous layout: it cannot be served from the last frame, because
 * the write above it invalidated that frame.
 *
 * What is bought for it is that there is one of them per change rather than
 * two. Everything after the first read comes out of the same recomputed
 * layout, and the ceiling — which depends on the type, not on what was typed —
 * is measured once and reused until the type moves.
 *
 * The alternative was arithmetic: read `getComputedStyle`, work the line
 * height out, multiply by `maxRows`. It saves nothing measurable and it
 * reimplements how a textarea decides its own intrinsic height, which browsers
 * do not fully agree about. Asking the element how tall it is with `maxRows`
 * rows is exact by construction in all of them.
 *
 * IT ANSWERS THE VALUE, NOT THE TYPING.
 * Keyed on the value in a layout effect, so a controlled value replaced from
 * outside, a reset to empty and a pasted block are the same event as a
 * keystroke. None of those three is a key press, and a handler hung off typing
 * would miss all three. It is also why growing turns the shared value tracking
 * on: a field whose value nobody is holding does not re-render when it
 * changes, and an effect that never runs measures nothing.
 *
 * AND THE LAYOUT SHIFT, WHICH DOC 09 §3 FORBIDS.
 * Read literally, that rule says this feature may not exist: a box that grows
 * moves everything under it. The exception is who caused it. §3's subject is
 * content ARRIVING — "nothing should shift when the data arrives, and least of
 * all under the cursor" — and what must not move under the cursor is what the
 * person is aiming at. Here they are typing INTO the box that grows, at a
 * caret the growth follows. The box opening up to hold their own sentence is
 * the immediate response the last row of §3 asks for, not a surprise.
 *
 * The limit is what keeps that true. Past it the growth stops being feedback
 * and becomes a page-length field pushing the rest of the form out of view,
 * which is the shift the rule is actually about.
 *
 * WHAT ONLY A BROWSER CAN CHECK: all of it. jsdom has no layout engine, so
 * `scrollHeight` and `offsetHeight` are both zero there and not one line of
 * this can be asserted.
 *
 * KNOWN LIMITATION, written down rather than shipped in silence (doc 06 §7):
 * the height answers the value, and only the value. Narrow the container and
 * the text re-wraps onto more lines with no value change, so the box keeps the
 * height it had and scrolls until the next keystroke corrects it; the same
 * gap, from the other direction, leaves a field that was hidden and shown
 * again at its floor until something is typed. Both want the element's own
 * size observed, which nothing in this library does yet and no document has
 * settled — so they are reported rather than invented, and neither loses work
 * or leaves a field unusable.
 */

interface Growth {
  isEnabled: boolean;
  /** The floor, in rows. */
  rows: number;
  /** The ceiling, in rows. Already clamped to at least `rows`. */
  maxRows: number;
  /** What the field holds. `undefined` when nobody is tracking it. */
  value: string | undefined;
}

function useGrowToContent({
  isEnabled,
  rows,
  maxRows,
  value
}: Growth): React.RefCallback<HTMLTextAreaElement> {
  const element = useRef<HTMLTextAreaElement | null>(null);
  /*
   * The ceiling in pixels, and the resting height it was measured against.
   *
   * The resting height is `rows` rows of the type actually in use, which makes
   * it a fingerprint of that type: if a web font lands after mount and every
   * line gets taller, the resting height moves and the ceiling is measured
   * again on the next change. Without that it would be a stale pixel count
   * describing a font nobody is looking at any more.
   */
  const ceiling = useRef<{
    resting: number;
    maxRows: number;
    height: number;
  } | null>(null);

  useLayoutEffect(() => {
    const node = element.current;
    if (node === null) return;

    /*
     * Turning it off leaves nothing behind, which is the half of "off by
     * default" that a default value does not cover on its own.
     */
    if (!isEnabled) {
      node.style.removeProperty('block-size');
      return;
    }

    // Off before the read, or `scrollHeight` reports the height the element
    // already has instead of the content it is holding.
    node.style.removeProperty('block-size');

    const resting = node.offsetHeight;

    /*
     * Nothing has been laid out: a collapsed panel, a tab that is not showing.
     * A measured height here would be a zero, and the field would come back
     * invisible — so it keeps the browser's own sizing and measures when it is
     * next rendered for real.
     */
    if (resting === 0) return;

    /*
     * `clientHeight` is the padding box and `offsetHeight` the border box, so
     * the difference is the border, and it has to be added back:
     * `scrollHeight` counts padding and not border, while the box is
     * `border-box`. Those are the two pixels that otherwise leave a field
     * permanently scrolled by a hair, with nothing past the end to scroll to.
     */
    const border = resting - node.clientHeight;

    if (
      ceiling.current?.resting !== resting ||
      ceiling.current.maxRows !== maxRows
    ) {
      /*
       * Measured in rows, because rows is the unit the limit is expressed in:
       * ask the element how tall it is with `maxRows` of them, then put the
       * attribute back. Nothing paints in between — a layout effect runs
       * before the frame — and React never sees a difference, because what it
       * wrote is what is left behind.
       */
      node.rows = maxRows;
      ceiling.current = { resting, maxRows, height: node.offsetHeight };
      node.rows = rows;
    }

    node.style.setProperty(
      'block-size',
      `${Math.min(node.scrollHeight + border, ceiling.current.height)}px`
    );
  }, [isEnabled, rows, maxRows, value]);

  return node => void (element.current = node);
}

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
   * On its own it is the whole height: the field stays this tall and scrolls
   * past it.
   *
   * With `isGrowable` it stops being the height and becomes the **floor** —
   * where the field rests when it is empty, and the size it never comes back
   * below however little is left in it. It is not the point at which growing
   * starts, because there is nothing below it to grow from.
   */
  rows?: number;
  /**
   * Let the height follow what has been typed, up to `maxRows`, instead of
   * staying at `rows` with a scrollbar.
   *
   * Off by default, and it changes nothing for a field that does not ask for
   * it. `rows` becomes the floor and `maxRows` the ceiling; between them the
   * height answers the value, and past the ceiling the field scrolls exactly
   * as it does without this.
   *
   * It takes the browser's resize grip away, and that is not a loss. The grip
   * is there because a small box for a long note is somebody's problem, and
   * that is the problem this solves. Keeping both would mean a drag that works
   * until the next keystroke silently undoes it.
   */
  isGrowable?: boolean;
  /**
   * How far `isGrowable` may grow, in rows. Defaults to twice `rows`.
   *
   * **There is no unbounded setting, deliberately.** A long note in a box with
   * no ceiling becomes a page-length field that pushes everything under it out
   * of view, which is the problem and not the feature — so a limit is not
   * something a consumer can decline, only move.
   *
   * In rows because `rows` is already the resting height, so the ceiling reads
   * against the floor in the same unit rather than in pixels nobody can place.
   * Twice `rows` as the default for two reasons: it needs no constant of its
   * own, and it cannot land below the floor whatever `rows` is set to.
   *
   * Does nothing without `isGrowable`, and says so in development.
   */
  maxRows?: number;
  placeholder?: string;
  /**
   * Where the value sits in its box. No affixes here, unlike the single-line
   * fields: a `@` before a block of text has nothing to attach itself to, and
   * the trailing corner belongs to the browser's own resize grip.
   */
  align?: ControlAlign;
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
  /**
   * Show how much of `maxLength` has been used.
   *
   * `maxLength` is a silent restriction: past the limit the browser drops the
   * keystroke and says nothing, which is the clearest case there is of an
   * interaction with no response (doc 09 §3). It needs a `maxLength` to count
   * against, and warns in development without one.
   *
   * The counter is not announced on every keystroke — a number changing under
   * a screen reader would turn typing into a drum roll. Reaching the limit is
   * announced once, because that is the moment something stops working.
   */
  isCounterVisible?: boolean;
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
 *
 * `isGrowable` is the other answer to the same need, and the two do not share
 * a field: where the height follows the content there is no grip, because a
 * drag would be undone by the next keystroke.
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
      isGrowable = false,
      maxRows,
      placeholder,
      align = 'start',
      normalize,
      isCounterVisible = false,
      className,
      ...ariaProps
    },
    ref
  ) {
    const normalized = useFieldValue<HTMLTextAreaElement>({
      normalize,
      /*
       * Growing needs the value for the same reason the counter does, and gets
       * it the same way. The height answers the value, so something has to
       * re-render when the value changes — and a field nobody holds the value
       * for does not (see `useFieldValue`, which is explicit that a field
       * asking for none of this behaves exactly as it did before).
       */
      isTracked: isCounterVisible || isGrowable,
      value: ariaProps.value,
      defaultValue: ariaProps.defaultValue,
      onChange: ariaProps.onChange
    });

    /*
     * A counter with nothing to count against is a number and a slash. Loud in
     * development, silent in production (doc 05 §2.2, rule 3 sets the
     * precedent for warning rather than guessing).
     */
    useDevWarning(
      isCounterVisible && ariaProps.maxLength === undefined,
      'isCounterVisible needs a maxLength to count against.'
    );

    /* Same shape of mistake as the counter without a `maxLength`: a number
       that reads as configuration and changes nothing. */
    useDevWarning(
      maxRows !== undefined && !isGrowable,
      'maxRows does nothing without isGrowable.'
    );

    useDevWarning(
      maxRows !== undefined && maxRows < rows,
      'maxRows is below rows, which is a height the field already has. Using rows.'
    );

    /*
     * The floor wins over a ceiling below it. `rows` is a height the field has
     * whether or not it grows, so a smaller `maxRows` is not a limit but a
     * contradiction, and clamping is the only reading that leaves a usable
     * field.
     */
    const ceiling = Math.max(maxRows ?? rows * 2, rows);

    const growth = useGrowToContent({
      isEnabled: isGrowable,
      rows,
      maxRows: ceiling,
      value: normalized.value
    });

    const counter =
      isCounterVisible && ariaProps.maxLength !== undefined ? (
        <CharacterCounter
          length={(normalized.value ?? '').length}
          max={ariaProps.maxLength}
        />
      ) : undefined;

    return (
      <AriaTextField
        // `aria` rather than the base's `native`: native validation pops the
        // browser's own bubble, which the library cannot style, translate or
        // time. Presenting the error is our job (doc 07 §1).
        validationBehavior="aria"
        className={cx('bb:group bb:w-full', className)}
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
          {...(counter === undefined ? {} : { counter })}
        >
          <AriaTextArea
            ref={mergeRefs(ref, normalized.ref, growth)}
            rows={rows}
            className={cx(
              CONTROL,
              ALIGN[align],
              'bb-textarea',
              /* Two declarations in TextArea.css that would otherwise fight a
                 measured height, taken back only where one is written. */
              isGrowable && 'bb-textarea-growable'
            )}
            {...(placeholder === undefined ? {} : { placeholder })}
          />
        </Field>
      </AriaTextField>
    );
  }
);
