/*
 * INTERNAL. The cross the library draws on anything that removes or closes.
 *
 * WHY IT IS SHARED, when it is nine lines of SVG that would be easy to copy.
 *
 * It was copied, four times: a badge's remove button, a tag's, a field's clear
 * button and a layer's close cross. Three of the four were byte-identical and
 * the fourth differed only in its size class, so nothing had drifted yet —
 * which is the moment to stop, not the moment to relax. `ToneGlyph` records the
 * same argument from the other side: the marks inside this library's own
 * controls have to be ONE shape, because two crosses at different stroke
 * weights in one screen read as two different kinds of button.
 *
 * A fifth caller is what forced it. A notice's close button would have been the
 * fifth copy, and the version written before this file existed used a different
 * path and a lighter stroke — a drift that would have shipped, and that no
 * check in this repository looks for.
 *
 * Doc 02 §11.4 is what permits any of it: the icons the library DRAWS for its
 * own controls are separate from the ones it receives from a consumer. A
 * consumer never passes this one and never replaces it.
 */

export interface CrossGlyphProps {
  /**
   * The size, as a class, because the callers genuinely differ: a field's mark
   * and a badge's use the `mark` token, and a layer's close cross is bigger
   * because it sits alone in a header rather than beside text.
   */
  className?: string;
}

export function CrossGlyph({
  className = 'bb:h-mark bb:w-mark'
}: CrossGlyphProps): React.ReactNode {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
