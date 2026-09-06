import { forwardRef } from 'react';
import { cx } from '../../internal/cx';

/*
 * Notes on the parts that are not obvious:
 *
 * - `bb:@container` is the component's reason for existing, compiled to
 *   `container-type: inline-size`. The container is UNNAMED on purpose
 *   (decision 0010): a name is only queried by whoever knows it, which is
 *   safer against an accidental match and worse at the one job this has —
 *   making doc 04's level N2 work by default for whatever is dropped inside.
 * - `bb:p-(--bb-space-5)` reads the density token, so compact tightens the
 *   card without the component knowing density exists (doc 03 §3). That step
 *   holds the same value as --bb-field-gap at both densities, which is why it
 *   was chosen over its neighbours: a card wrapping a form then has exactly as
 *   much air inside its edge as there is between the fields, and one rhythm
 *   instead of two is the difference between a form that looks composed and
 *   one that looks almost right.
 * - box-border, because the package ships no reset (doc 03 §5, rule 8). With a
 *   border and padding on the same element, content-box makes a declared width
 *   measure wider than it was asked for.
 *
 * THE SURFACE IS `surface`, NOT `surface-raised`, and the two are easy to swap
 * by mistake. Doc 03 §4 names them: surface is "panel or card base",
 * surface-raised is "menu, popover, dialog" — the things that float above the
 * page, which in this library means the things that render in a portal
 * (doc 08). A Card sits in the flow and is above nothing. Taking the raised
 * surface would also leave the token literally named for this component unused
 * by it, which is how a vocabulary stops meaning anything.
 *
 * The cost, written down because it is real: on a page painted with
 * --bb-surface the card is the same colour as its ground, and the border is
 * the only thing separating them. That is why the border is not decoration.
 *
 * A BORDER, NOT A SHADOW, for that separation. Three reasons, in order of
 * weight. Doc 03 §5 rule 5: a shadow is barely visible on a dark ground, so a
 * shadow-only card is flat in dark mode and needs a second mechanism per mode
 * — the thing the token layer exists to remove. Doc 03 §4.6b: one border
 * colour carries almost the whole interface, and grouping content is the
 * ordinary case for it, not an exception. Doc 09 §1: a shadow claims
 * elevation, and thirty cards each claiming to float is a screen that hums at
 * somebody who has been looking at it since nine in the morning.
 */
const BASE = cx(
  'bb:box-border',
  'bb:@container',
  /*
   * radius-lg is the step doc 03 §4.3 assigns to cards and panels, and it sits
   * far enough from the controls' radius-md that a nested corner reads as
   * deliberate rather than as a near-miss.
   */
  'bb:rounded-lg bb:border bb:border-solid bb:border-border',
  /*
   * The rule of pairs (doc 03 §4.0): a background never appears without the
   * text colour that belongs to it. That pair is --bb-surface-on, which holds
   * the same value as --bb-text; `text-text` is the utility the theme
   * generates, and it is what the catalog's own panels already use.
   */
  'bb:bg-surface bb:text-text',
  'bb:p-(--bb-space-5)'
);

export interface CardProps {
  children?: React.ReactNode;
  /**
   * Applied to the outermost element, for placement in the consumer's layout —
   * margin, width, grid position. A Card has no internal node for anything to
   * reach, and never will (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A surface that groups related content, and the library's first query
 * container.
 *
 * It declares `container-type: inline-size` (decision 0010), so anything
 * placed inside can ask how wide the Card is. That is what makes level N2 of
 * doc 04 usable with no configuration at all: the container scale —
 * `--container-narrow`, `--container-medium`, `--container-wide` — is defined
 * in the theme and inert until something declares a container, and until now
 * nothing did.
 *
 * Two side effects come with it, in every Card, including in a project that
 * never writes a container query. They are written here because neither raises
 * an error — they only look wrong, which is the harder kind to trace:
 *
 * 1. **A Card does not shrink-wrap.** Inline-size containment makes its
 *    intrinsic inline size zero, so it takes the width its parent gives it
 *    rather than the width of its content. Put one in a flex row expecting it
 *    to be as wide as its text and it will not be. This is also what doc 04 §3
 *    already asks of every component — max-width, never width — so a
 *    shrink-wrapping Card was swimming against the rule anyway.
 * 2. **It becomes the containing block for absolutely and fixed positioned
 *    descendants.** The library's own layers are unaffected: they render in a
 *    portal (doc 08). A consumer's own `position: fixed` element inside a Card
 *    positions against the Card, not against the window.
 *
 * Failure in the other direction is benign, which is what made this safe to do
 * before a real consumer exists: doc 04 §4.1 requires queries to be written
 * narrow-first, so one that does not match leaves the content in its narrow
 * layout, which is usable at any width. The cost of being wrong is a lost
 * optimisation, not a broken screen.
 *
 * No `padding` prop, no `variant`, and no header or footer pieces. Nothing
 * needs one today (P5), and every one of them is far easier to open later than
 * to close.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, style },
  ref
) {
  return (
    <div ref={ref} className={cx(BASE, className)} style={style}>
      {children}
    </div>
  );
});
