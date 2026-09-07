import { useState } from 'react';

/*
 * INTERNAL. Hold a field's value when the field needs to know it.
 *
 * Every feature that reads the value runs into the same wall: it is trivial
 * when a consumer controls the field and impossible when they do not, because
 * the base keeps its own state and a component with no `value` prop cannot see
 * it. Three features have hit it now — normalization rewriting the value, a
 * counter measuring its length, a cross asking whether there is anything to
 * clear — and the fourth was a numeric field, which is what forced this out
 * into a generic: its value is a number and its emptiness is `NaN`, so the
 * string-shaped version could not serve it.
 *
 * Holding nothing when nobody asks is the part that matters. These components
 * have shipped, and a field using none of this must behave exactly as it did
 * before any of it existed.
 */

interface Options<T> {
  /** Own the value. False leaves the field exactly as its consumer wrote it. */
  isTracked: boolean;
  value: T | undefined;
  defaultValue: T | undefined;
  /**
   * What "nothing" is for this type: `''` for text, `NaN` for a number.
   *
   * It has to be passed rather than inferred because it is what the field is
   * seeded with. Left undefined, the base would see no `value` prop, decide it
   * is uncontrolled and keep its own state — and the tracking would report an
   * empty field forever while the person typed into it.
   */
  empty: T;
  onChange: ((value: T) => void) | undefined;
}

interface Owned<T> {
  /** The value now, or `undefined` when nobody asked for it to be held. */
  current: T | undefined;
  /** Spread onto the base's field. Empty when nobody asked. */
  props: { value?: T; onChange?: (value: T) => void };
  /** Set it from the component — what a clear button presses. */
  set: (value: T) => void;
}

export function useOwnedValue<T>({
  isTracked,
  value,
  defaultValue,
  empty,
  onChange
}: Options<T>): Owned<T> {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? empty);
  const current = value ?? uncontrolled;

  const set = (next: T): void => {
    // A controlled field's value stays its owner's to decide; all we do is
    // report what it would become (doc 02 §8).
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  return {
    current: isTracked ? current : undefined,
    props: isTracked ? { value: current, onChange: set } : {},
    set
  };
}
