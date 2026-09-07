import { useLayoutEffect, useRef, useState } from 'react';
import { caretAfter, type Normalizer } from '../../normalize';

/*
 * INTERNAL. What a field knows about its own value.
 *
 * Two callers, and they want the same awkward thing for different reasons.
 * Normalization has to own the value in order to rewrite it; a character
 * counter has to know its length. Both are trivial when a field is controlled
 * and neither works when it is not — the base keeps its own state, and a
 * component with no `value` prop cannot see it.
 *
 * So one hook holds the value when either asks, and holds nothing when neither
 * does: a field using none of this behaves exactly as it did before any of it
 * existed, which matters because these components have shipped.
 *
 * ---
 *
 * The half of normalization that is not a pure function.
 *
 * The transformations in `src/normalize` are a few lines each and anyone could
 * write them in their own `onChange`. This is the part they could not: keeping
 * the caret where the person put it.
 *
 * Rewriting a value while somebody types moves the cursor. Force upper case
 * and it jumps to the end mid-word — doc 09 §7, "nothing moves under the
 * cursor", broken on every keystroke. That is the whole reason a field takes a
 * `normalize` prop instead of the consumer doing it themselves (doc 07 §2.1).
 *
 * Two things it has to do, and the second is the one that is easy to miss:
 *
 * 1. Put the caret back, at the position `caretAfter` works out from the
 *    original value rather than from a table of special cases per
 *    transformation.
 * 2. Own the value while normalizing. Passing a normalized value to `onChange`
 *    is enough for a controlled field, and does NOTHING for an uncontrolled
 *    one: the base keeps its own state, so the input would keep showing what
 *    was typed and the normalization would be invisible. So when `normalize`
 *    is present the field holds the value, controlled or not.
 *
 * When `normalize` is absent this returns nothing at all and the field behaves
 * exactly as it did before it existed. That matters: these fields have
 * shipped, and a new prop may not change what happens to anyone not using it.
 */

interface Options {
  normalize: Normalizer | undefined;
  /** Own the value even with no normalizer — for a counter that needs its length. */
  isTracked?: boolean;
  value: string | undefined;
  defaultValue: string | undefined;
  onChange: ((value: string) => void) | undefined;
}

interface Result<E> {
  /** Spread onto the base's field. Empty when nobody asked for anything. */
  props: { value?: string; onChange?: (value: string) => void };
  /** Merged onto the input, so the caret can be put back after a rewrite. */
  ref: React.RefCallback<E>;
  /** The current value, when it is being held. `undefined` when it is not. */
  value: string | undefined;
}

export function useFieldValue<
  E extends HTMLInputElement | HTMLTextAreaElement
>({
  normalize,
  isTracked = false,
  value,
  defaultValue,
  onChange
}: Options): Result<E> {
  const element = useRef<E | null>(null);
  const caret = useRef<number | null>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
  /*
   * Only here to guarantee a render, and it earns its place.
   *
   * A recorded caret is applied by the layout effect below, and an effect only
   * runs if something rendered. Normalization produces the case where nothing
   * does: type a space into `AB` and the value normalizes back to `AB`, which
   * is the state React already holds, so React bails out of the re-render.
   *
   * Two things then go wrong, and the second is the one that bites. The
   * correction never happens — and worse, the recorded position survives into
   * the NEXT keystroke, where it is applied to a value it has nothing to do
   * with. Measured before this existed: typing "ab 12" produced "AB21".
   */
  const [, forceRender] = useState(0);

  /*
   * After React has written the new value into the DOM and before the browser
   * paints, which is what makes the correction invisible. In an effect rather
   * than a layout effect the caret would sit at the end for one frame — and
   * one frame per keystroke is a cursor that visibly stutters.
   */
  useLayoutEffect(() => {
    const position = caret.current;
    caret.current = null;
    if (position === null || element.current === null) return;
    element.current.setSelectionRange(position, position);
  });

  const current = value ?? uncontrolled;

  if (normalize === undefined) {
    /*
     * Nothing to rewrite, so nothing to correct and no caret to restore. The
     * value is still reported when somebody asked to track it, which is the
     * counter's whole need — and the field is left controlled or uncontrolled
     * exactly as its consumer wrote it.
     */
    return {
      props: isTracked ? { value: current, onChange: handleTracked } : {},
      ref: node => void (element.current = node),
      value: isTracked ? current : undefined
    };
  }

  return {
    value: normalize(current),
    props: {
      value: normalize(current),
      onChange: typed => {
        const next = normalize(typed);

        /*
         * Cleared first, every time. A position recorded for one keystroke and
         * not consumed must never reach the next one, and the whole reason it
         * might not be consumed is the render React declines to do.
         */
        caret.current = null;

        /*
         * Recorded only when the value actually changed. Fighting the browser
         * for the caret on every keystroke would break the ordinary case,
         * including somebody clicking into the middle and typing nothing.
         */
        if (next !== typed) {
          const position = element.current?.selectionStart ?? null;
          if (position !== null) {
            caret.current = caretAfter(typed, position, normalize);
            forceRender(count => count + 1);
          }
        }

        if (value === undefined) setUncontrolled(next);
        onChange?.(next);
      }
    },
    ref: node => void (element.current = node)
  };

  function handleTracked(typed: string): void {
    if (value === undefined) setUncontrolled(typed);
    onChange?.(typed);
  }
}
