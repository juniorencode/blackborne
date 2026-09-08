import { cx } from '../cx';

/**
 * The four kinds of message the library can carry. `Alert` re-exports this as
 * `AlertTone`; a component that needs only some of them narrows the union
 * rather than inventing its own words (doc 02 §3.1).
 */
export type Tone = 'info' | 'success' | 'warning' | 'danger';

/*
 * INTERNAL. The glyph that carries a tone, drawn rather than received.
 *
 * WHY THE LIBRARY DRAWS ANYTHING AT ALL.
 *
 * Doc 06 §3 forbids colour as the only channel: in greyscale a warning and a
 * danger message must still be tellable apart, and the four soft backgrounds
 * are four near-identical greys once the hue is gone. Something else has to
 * carry the tone.
 *
 * It cannot be a received icon. Icons arrive as children and the library
 * distributes none (doc 02 §11), so depending on the consumer to pass one
 * would make the accessibility guarantee optional — and doc 02 §11.5 names an
 * icon as the only carrier of meaning as the thing never accepted.
 *
 * So the library draws its own. That is not an icon set arriving by the back
 * door: doc 02 §11.4 already separates icons the library DRAWS — a select's
 * chevron, a pagination arrow — from icons it RECEIVES, and this is the same
 * case Checkbox's tick and Spinner's arc are. Deliberately primitive: circles,
 * straight lines and one triangle, four shapes total, and nothing that would
 * ever be mistaken for a general-purpose icon.
 *
 * THE SILHOUETTES ARE WHAT DOES THE WORK, so they are chosen to differ before
 * the interior does: the warning is the only triangle, and the "i" and the "!"
 * are each other's inverse — dot above stem against stem above dot — so the
 * two most confusable tones read differently even at 16px in greyscale.
 *
 * WHY IT IS SHARED RATHER THAN COPIED. It was `Alert`'s, and `ConfirmDialog`
 * needs three of the four. Two copies of these paths is the one duplication
 * this library has already been burned by: five copies of the catalog's brand
 * fixture drifted until three of them were silently proving the opposite of
 * what they claimed. And the paths are not arbitrary shapes anyone would
 * re-derive the same way — the greyscale argument above is the reason each one
 * looks as it does, and it survives exactly as long as there is one of them.
 */
const GLYPH: Record<Tone, React.ReactNode> = {
  info: (
    <>
      <circle cx="8" cy="8" r="6.25" />
      <circle cx="8" cy="4.9" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8 7.4 L8 11.4" />
    </>
  ),
  success: (
    <>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5.1 8.2 L7.1 10.2 L10.9 6" strokeLinejoin="round" />
    </>
  ),
  warning: (
    <>
      <path d="M8 2.2 L14.6 13.4 L1.4 13.4 Z" strokeLinejoin="round" />
      <path d="M8 6.6 L8 9.9" />
      <circle cx="8" cy="11.7" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  danger: (
    <>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5.8 5.8 L10.2 10.2 M10.2 5.8 L5.8 10.2" />
    </>
  )
} satisfies Record<Tone, React.ReactNode>;

export interface ToneGlyphProps {
  tone: Tone;
  /**
   * Sizing and placement. The default is the library's one icon size on a
   * one-line-tall box, which centres the glyph against the FIRST line of the
   * text beside it rather than against the whole paragraph.
   */
  className?: string;
}

/**
 * INTERNAL. Draws the glyph for a tone, in `currentColor`, hidden from
 * assistive technology.
 *
 * Decorative on purpose: the message says what happened, and a glyph announced
 * as well would be one more thing to listen past (doc 06 §3).
 */
export function ToneGlyph({
  tone,
  className
}: ToneGlyphProps): React.ReactNode {
  return (
    <svg
      /*
       * Width is the library's one icon size (doc 03 §4.6d); HEIGHT is one line
       * box, so the glyph centres against the first line of the message rather
       * than against the whole paragraph. The viewBox does the centring itself
       * — preserveAspectRatio keeps the drawing 16×16 and places it mid-height
       * — so this stays correct at any density and any text size, with no
       * second number to keep in step. The same problem
       * .bb-inline-control-box solves for a checkbox, without needing a class.
       */
      className={cx('bb:w-4 bb:h-[1lh] bb:flex-none', className)}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {GLYPH[tone]}
    </svg>
  );
}
