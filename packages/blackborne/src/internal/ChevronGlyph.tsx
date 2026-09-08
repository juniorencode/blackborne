/*
 * INTERNAL. The chevron the library draws on anything that opens.
 *
 * WHY IT IS SHARED BEFORE IT HAS A SECOND CALLER, which is the opposite of how
 * `CrossGlyph` arrived. That one was extracted after four copies already
 * existed, and what forced it was a fifth being written with a different path
 * and a lighter stroke — a drift that would have shipped, in a repository where
 * the marks inside its own controls are meant to be one shape.
 *
 * The bill for that lesson is paid here instead. Six things in and around this
 * batch want this exact shape: a section that folds, a select, a menu's
 * submenu marker, a pagination arrow, a breadcrumb separator and a split
 * button. The first of them is what this file was written for, and the other
 * five are why it is a file rather than nine lines inside one component.
 *
 * IT ONLY EVER POINTS DOWN, and rotation belongs to the caller, in CSS. Two
 * reasons, and the second is the one that matters:
 *
 *   1. One shape stays one shape. Four variants of a chevron are four things
 *      that have to agree about stroke weight and optical centre.
 *   2. Only the caller knows whether the direction is directional. Doc 05 §4
 *      flips navigation arrows in RTL and leaves other icons alone, and this
 *      file cannot tell a disclosure's chevron — symmetric under RTL, because
 *      down is down in every language — from a pagination arrow, which must
 *      turn round. A `direction` prop here would be this file guessing.
 *
 * Doc 02 §11.4 is what permits any of it: the icons the library DRAWS for its
 * own controls are a different thing from the ones it receives from a
 * consumer. A consumer never passes this one and never replaces it.
 *
 * The horizontal extents are deliberately the cross's — 4.5 to 11.5 in a 16
 * unit box, the same stroke and the same round caps. A chevron and a cross
 * appear within a few pixels of each other on a screen often enough that two
 * different bounding boxes would read as two different weights of mark.
 */

export interface ChevronGlyphProps {
  /**
   * The size, as a class. Defaults to the same `mark` token `CrossGlyph` uses,
   * which follows density: the marks in a compact row are smaller along with
   * everything else in it.
   */
  className?: string;
}

export function ChevronGlyph({
  className = 'bb:h-mark bb:w-mark'
}: ChevronGlyphProps): React.ReactNode {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 6.25 8 9.75 11.5 6.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
