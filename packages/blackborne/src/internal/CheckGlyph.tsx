/*
 * INTERNAL. The tick the library draws on anything that is chosen.
 *
 * ## Why the PATH is shared and the component is not
 *
 * `CrossGlyph` is a component because every caller draws a cross the same way:
 * one svg, one shape. A tick is not like that. A checkbox's tick is one of TWO
 * paths inside a single svg — the other is the indeterminate dash — and which
 * one shows is decided by a CSS precedence rule that needs them to be siblings
 * (`Checkbox.css` records what went wrong when it was tried with utilities).
 * Extracting a component would mean either breaking that mechanism or leaving
 * the checkbox out of the share, which is the copy this file exists to
 * prevent.
 *
 * So the geometry is the shared thing. One string, two renderings: the
 * checkbox keeps its two-path svg and takes `CHECK_PATH` for one of them, and
 * anything that draws a tick on its own uses the component below.
 *
 * The lesson `CrossGlyph` recorded still applies — the marks inside this
 * library's own controls have to be ONE shape, because two ticks at different
 * stroke weights in one screen read as two different kinds of chosen. What is
 * new is that sharing a component is not always the way to get there.
 */

/** The tick, in a 16-unit box. Shared so it cannot drift between callers. */
export const CHECK_PATH = 'M3.5 8.5l3 3 6-7';

/**
 * The indeterminate dash, in the same box, and it joined this file at its
 * SECOND caller rather than in advance (§8's rule).
 *
 * It lived as a literal inside `Checkbox` while the checkbox was the only
 * thing that could be partly chosen. A table's heading box is the second, and
 * it means the same thing — some of these, not all — so it has to be the same
 * shape. The cross reached four copies at four stroke weights before anybody
 * noticed, which is what these constants exist to prevent.
 */
export const DASH_PATH = 'M4 8h8';

export interface CheckGlyphProps {
  /**
   * The size, as a class. Defaults to the `mark` token every other mark in the
   * library uses, which follows density.
   */
  className?: string;
}

/**
 * A tick on its own — a chosen option in a list, or a table row, where there is
 * no second path to switch with.
 */
export function CheckGlyph({
  className = 'bb:h-mark bb:w-mark'
}: CheckGlyphProps): React.ReactNode {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={CHECK_PATH}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The dash on its own, for a caller that decides between the two in
 * JavaScript rather than through the CSS precedence `Checkbox` needs.
 *
 * A table's selection box knows which mark it wants from a render prop, so
 * there is no precedence to arbitrate and no reason for both paths to be in
 * the DOM at once.
 */
export function DashGlyph({
  className = 'bb:h-mark bb:w-mark'
}: CheckGlyphProps): React.ReactNode {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={DASH_PATH}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
