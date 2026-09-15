import { cx } from '../cx';

/**
 * The four kinds of message the library can carry. `Alert` re-exports this as
 * `AlertTone`; a component that needs only some of them narrows the union
 * rather than inventing its own words (doc 02 §3.1).
 */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

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
/*
 * SPLIT INTO A SHAPE AND A MARK on 2026-09-14, and the split is what lets one
 * set of paths be drawn two ways.
 *
 * Outline: the shape is stroked and the mark is stroked, both in
 * `currentColor` — which is `Alert`, unchanged, and the reason the mark's
 * paint is a variable that FALLS BACK to `currentColor` rather than a second
 * colour passed in. Nobody sets the variable there, so nothing about that
 * component's drawing moved; all four of its baselines came out identical,
 * which is the proof this was a refactor and not a redesign wearing one.
 *
 * Filled: the shape becomes a solid disc — or a solid triangle — and the mark
 * is drawn in the colour paired with it. That is `Toast`, where a notice sits
 * on a neutral surface and the tone is carried by a badge rather than by the
 * whole card.
 *
 * The shape stays per tone in both. Doc 06 §3 asks that the silhouette carry
 * the tone in greyscale, and a warning's triangle is the one that does most of
 * that work — turning it into a fourth disc would leave "!" against "×" as the
 * whole difference between a caution and a failure.
 */
const SHAPE: Record<Tone, string> = {
  /*
   * NEUTRAL HAS NO SHAPE, and that is the honest drawing rather than a gap.
   *
   * Every other tone's silhouette says which outcome this is, because doc 06
   * §3 forbids colour being the only channel. Neutral is the absence of an
   * outcome — "here is a line of text" — so there is nothing for a silhouette
   * to carry, and a disc invented to fill the slot would be a fifth shape
   * meaning nothing, competing with four that mean something.
   *
   * The callers render no badge at all for it. An empty string keeps the map
   * total, so adding a tone still fails to compile until every map has it.
   */
  neutral: '',
  info: 'M8 1.75 A6.25 6.25 0 1 1 8 14.25 A6.25 6.25 0 1 1 8 1.75 Z',
  success: 'M8 1.75 A6.25 6.25 0 1 1 8 14.25 A6.25 6.25 0 1 1 8 1.75 Z',
  warning: 'M8 2.2 L14.6 13.4 L1.4 13.4 Z',
  danger: 'M8 1.75 A6.25 6.25 0 1 1 8 14.25 A6.25 6.25 0 1 1 8 1.75 Z'
} satisfies Record<Tone, string>;

/*
 * `--bb-tone-mark` with a fallback, so an unset variable is exactly today's
 * drawing rather than a missing one.
 */
const MARK: Record<Tone, React.ReactNode> = {
  neutral: null,
  info: (
    <>
      <circle
        cx="8"
        cy="4.9"
        r="0.9"
        fill="var(--bb-tone-mark, currentColor)"
        stroke="none"
      />
      <path d="M8 7.4 L8 11.4" stroke="var(--bb-tone-mark, currentColor)" />
    </>
  ),
  success: (
    <path
      d="M5.1 8.2 L7.1 10.2 L10.9 6"
      strokeLinejoin="round"
      stroke="var(--bb-tone-mark, currentColor)"
    />
  ),
  warning: (
    <>
      <path d="M8 6.6 L8 9.9" stroke="var(--bb-tone-mark, currentColor)" />
      <circle
        cx="8"
        cy="11.7"
        r="0.9"
        fill="var(--bb-tone-mark, currentColor)"
        stroke="none"
      />
    </>
  ),
  danger: (
    <path
      d="M5.8 5.8 L10.2 10.2 M10.2 5.8 L5.8 10.2"
      stroke="var(--bb-tone-mark, currentColor)"
    />
  )
} satisfies Record<Tone, React.ReactNode>;

export interface ToneGlyphProps {
  tone: Tone;
  /**
   * Draw the shape as a solid rather than as an outline, with the mark in
   * `--bb-tone-mark`.
   *
   * The caller sets that variable alongside the colour it pairs with —
   * `TONE_SOLID` beside this file is the one map that does both, for doc 03
   * §4.0's reason: a background and the thing drawn on it are taken together
   * or not at all.
   */
  isFilled?: boolean;
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
  isFilled = false,
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
      <path
        d={SHAPE[tone]}
        {...(isFilled
          ? { fill: 'currentColor', stroke: 'none' }
          : { strokeLinejoin: 'round' as const })}
      />
      {MARK[tone]}
    </svg>
  );
}
