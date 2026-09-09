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

export interface CheckGlyphProps {
  /**
   * The size, as a class. Defaults to the `mark` token every other mark in the
   * library uses, which follows density.
   */
  className?: string;
}

/**
 * A tick on its own — a chosen option in a list, where there is no second path
 * to switch with.
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
