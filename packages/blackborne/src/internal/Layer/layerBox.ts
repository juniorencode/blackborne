import { cx } from '../cx';

/*
 * INTERNAL. The parts of a modal layer that are the same whatever edge it sits
 * on: `Dialog` centres its panel in the window, `Drawer` pushes it to an edge,
 * and everything between the scrim and the text is identical.
 *
 * WHY THIS EXISTS AT THE SECOND CALLER, when SearchField's note says an
 * abstraction drawn from the second case is usually the wrong one.
 *
 * That rule is about not knowing the SHAPE yet, and here the shape is not in
 * question: `Dialog` defined it a wave ago and `Drawer` needs it unchanged
 * except for where the panel lands. This is not an abstraction inferred from
 * two examples, it is a second caller of something that already exists in one
 * file — which is the case the rule does not cover.
 *
 * And the cost of copying it is known rather than hypothetical. Five copies of
 * the catalog's brand fixture drifted apart in this repository until three of
 * them were silently proving the opposite of what they claimed, and the
 * elevation story of the whole library runs through these six lines. Two
 * copies of a panel that must agree is the same bet at a smaller scale.
 *
 * What is deliberately NOT here: placement, size, radius and which edges carry
 * a border. Those are the things the two components differ in, and pushing
 * them in behind a `variant` would be the monolith of non-goal 4 arriving
 * through the back door.
 */

/**
 * The scrim: a fixed sheet over the window, and a grid so the panel can be
 * placed in it.
 *
 * `fixed inset-0` rather than anything measured — the overlay is portalled, so
 * the window is its container and this is the legitimate viewport case of
 * doc 04 §5.
 *
 * The stacking value is the public token. There is no literal z-index in this
 * library, and doc 08 §2 is why: a consumer has their own fixed header to
 * coordinate with, and if our numbers are closed their only route is to fight
 * our CSS from outside.
 *
 * A grid and not flex, because centring a panel that has hit its maximum
 * height is the case flex gets wrong. Each component adds its own placement.
 */
export const SCRIM = cx(
  'bb:fixed bb:inset-0 bb:z-(--bb-layer-overlay)',
  'bb:bg-surface-overlay',
  'bb:grid'
);

/**
 * The panel: the box that floats.
 *
 * `surface-raised` is the token doc 03 §4 names for exactly this — "menu,
 * popover, dialog". `Dialog` was its first reader and it was wrong on the way
 * in; the measurement is in semantic.css.
 *
 * **A column flex container, and that is what makes scrolling work at all.**
 * The height limit lives on this element, and the sheet inside has to be
 * bounded BY it. A percentage cannot do that: `max-height: 100%` resolves
 * against the parent's height, a panel with only a maximum has no definite
 * height, so the percentage computes to `none` and the sheet grows without
 * limit. Measured, with that mistake in place: 1658px of content in a panel
 * capped at 876px, the sheet reporting itself unscrollable, and this element
 * clipping the rest — a layer that silently hid two thirds of its content with
 * no way to reach it. Flex bounds the item instead of asking it to measure a
 * percentage.
 *
 * `overflow-hidden` here and `overflow-y-auto` on the sheet: this element
 * clips, so a sticky header cannot paint over a rounded corner and the
 * scrollbar stays inside the radius.
 *
 * **THE CLIP IS TIGHT, AND THAT IS WHY AN ANCHORED LAYER WRAPS THIS ELEMENT
 * RATHER THAN BEING IT.** An arrow is positioned outside the panel — that is
 * the whole job of an arrow — so anything clipped by this element cannot draw
 * one. Loosening the clip was tried and measured: `overflow: clip` with an 8px
 * clip margin does let the arrow paint, and it also lets the sticky header's
 * square background out past the rounded corners. 51 pixels changed on
 * `dialog-light`, in four clusters, one at each corner of the panel. The clip
 * has to stay exactly where it is, so the arrow goes outside instead — see
 * `ANCHORED` below.
 *
 * `box-border` because the package ships no reset — with a border and padding
 * on one element, content-box makes a declared width measure wider than it was
 * asked for.
 *
 * **`container-type` IS NOT HERE, and that is a measured law rather than a
 * preference.** It reads well — a layer is a region with a width of its own,
 * which is the thing a container is (decision 0010) — and it is only available
 * to a layer whose width is DECLARED:
 *
 * `container-type: inline-size` applies inline-axis size containment, which
 * means the element's inline size is computed as though it had no contents. A
 * panel whose width is declared (a dialog, a drawer) does not care. A panel
 * that is SIZED BY its contents — an anchored popover, which is absolutely
 * positioned with `width: auto` and therefore shrink-to-fit — collapses to its
 * borders. Measured, in a real browser, with this class on this element: every
 * popover story rendered a panel **2px wide** and 343px tall, one character
 * per line, while two of the checks written to guard its width passed. "No
 * wider than the medium container" is satisfied by 2px.
 *
 * The knowledge was one component away and did not travel: `Drawer` records
 * that this panel's "intrinsic inline size is zero", which is why its sizes
 * are `w-full` plus a maximum rather than a maximum alone. Same cause, one
 * wave earlier, and nothing generalised it. So it is written here, where the
 * next layer will read it:
 *
 *   **A layer declares a container only if it declares a width.**
 *
 * The two that do add the class themselves. There is no third state to build:
 * a content-sized panel cannot be a container even with `width: max-content`,
 * because containment is what makes `max-content` zero.
 *
 * What that costs a popover is bounded, and measured too: a contained
 * descendant contributes no width, but the sheet's header always contributes
 * the title, so a popover holding nothing but a `Card` is as wide as its name
 * rather than 2px.
 *
 * Not here either: the border WIDTH, the radius and the size. A dialog is
 * bordered and rounded on all four sides; a drawer is flush against three
 * window edges and only one of its edges is free.
 */
export const PANEL = cx(
  /*
   * A stable handle for the thing a person sees the edge of. A check about
   * where a layer LANDS has to measure the painted box: the element inside it
   * is a proxy that holds only while the padding between them does, and one
   * such check went red the day a menu's padding moved from the panel to its
   * rows — reporting a 2px misalignment of a panel that had not moved.
   */
  'bb-layer-panel',
  'bb:box-border',
  'bb:flex bb:flex-col',
  'bb:bg-surface-raised bb:text-surface-raised-on',
  'bb:border-border bb:shadow-lg',
  'bb:overflow-hidden',
  'bb:font-sans bb:text-md bb:leading-normal'
);

/**
 * The wrapper an ANCHORED layer puts around the panel: a popover, a preview,
 * and any later layer positioned against a control.
 *
 * `Dialog` and `Drawer` do not use it. They are placed in the scrim, they have
 * no arrow, and their panel is the outermost element they render.
 *
 * ## Why the outermost element of an anchored layer is not the panel
 *
 * The base positions the element it is given, publishes `data-placement` and
 * `data-entering` on it, and writes a `max-height` into its style from the room
 * between the trigger and the edge of the window. An `OverlayArrow` is
 * positioned against that same element — and OUTSIDE it, which is the whole job
 * of an arrow.
 *
 * The panel clips its children, and it has to: a sticky header's square
 * background would otherwise paint over the rounded corners. So the arrow and
 * the panel cannot be the same box. Measured, with the arrow inside the panel:
 * the arrow's box was in the right place, its `visibility` was `visible`, and
 * `document.elementFromPoint` at its centre returned the page behind the panel.
 * `Popover` shipped that way, and the screenshot that should have shown its
 * arrow was accepted as a reference with no arrow in it.
 *
 * Loosening the clip was measured too and is worse: `overflow: clip` with a
 * clip margin lets the arrow out and lets the header's corners out with it — 51
 * pixels on `dialog-light`, one cluster at each corner.
 *
 * So the arrow is a SIBLING of the panel inside this wrapper. Nothing here
 * paints: no background, no border, no radius, no shadow. Those belong to the
 * panel, in one place, still.
 *
 * `flex flex-col` plus `min-h-0` on the panel, and not a percentage — the
 * ceiling the base writes lands on this element, and `max-height: 100%` on a
 * child of an element with only a maximum computes to `none`. That is the trap
 * `PANEL` records, arriving one level higher up.
 *
 * The width is deliberately absent: an anchored layer is content-sized, and its
 * maximum is the component's own decision — narrow for a preview, medium for a
 * popover.
 */
export const ANCHORED = cx('bb:box-border bb:flex bb:flex-col');

/**
 * The sheet: the element that carries `role="dialog"`. It no longer scrolls —
 * the BODY does — and the swap is doc 08 §4.1, written before this line
 * changed.
 *
 * ## What it used to be, and why that was right at the time
 *
 * The base moves focus to this element when a layer opens, and a browser
 * scrolls the nearest scrollable ANCESTOR of whatever has focus. With the
 * scroll here, the arrows and `PageDown` worked from the moment it appeared,
 * with nothing to wire — and an inner scroller is a DESCENDANT of the focused
 * element, which no key reaches.
 *
 * ## What it costs to be here, which is what moved it
 *
 * The scrollbar belongs to the scroll container, so it spanned the whole
 * panel: a bar running the full height with a pinned header and a pinned
 * footer beside it, over content that occupies neither. The header and footer
 * were `sticky` INSIDE it for the same reason — they had to travel with the
 * content and pin themselves, which is machinery in aid of a bar in the wrong
 * place.
 *
 * ## And the keyboard is bought back rather than given up
 *
 * `internal/useScrollableRegion` makes the body a tab stop WHILE it has
 * somewhere to go, which is what WCAG 2.1.1 asks of a scrollable region and
 * what axe's `scrollable-region-focusable` rule checks. `layer.spec.ts`
 * presses the key rather than trusting any of this.
 */
export const SHEET = cx(
  'bb:box-border bb:flex bb:flex-col',
  /*
   * IT FILLS THE PANEL, and this is the half of "the footer sits at the
   * bottom" that the body's own `flex-auto` does not buy.
   *
   * Measured on a `Drawer`, which is the only layer with a panel taller than
   * its contents: the panel was 900px and the sheet 316, so the footer came to
   * rest at 316 with 584px of panel under it. The body growing inside the
   * sheet cannot help — it distributes the sheet's space, and the sheet had
   * taken none.
   *
   * `flex-auto` rather than `flex-1` for the reason the body gives: a basis of
   * zero would stop a content-sized layer contributing its own height, and a
   * `Dialog`'s panel IS content-sized. Where there is no spare room this grows
   * into nothing, which is why one line serves both.
   */
  'bb:flex-auto',
  /*
   * `min-h-0` and not `max-h-full`. A flex item's automatic minimum size is
   * its content, so without this it refuses to shrink and overflows the panel
   * however low the panel's ceiling is — the same failure from the other
   * direction. The body's `overflow-y-auto` then has something to do.
   */
  'bb:min-h-0',
  // The focus ring belongs on interactive things. This element is focused
  // programmatically on open, as a container, and ringing the whole panel
  // says "you are here" about something nobody chose to focus.
  'bb:outline-none'
);

/*
 * Header, body and footer — three rows of the sheet's column, with the middle
 * one scrolling.
 *
 * They were sticky inside one scroller until 2026-09-14 and are ordinary
 * siblings now. `flex-none` on the two ends is not decoration: a flex item's
 * default `flex-shrink` is 1, so a long body would have taken the difference
 * out of the header and the footer rather than out of itself — the same defect
 * this library found in every scrolling list a wave earlier, arriving in the
 * place where it would have squashed a title.
 *
 * They keep the panel's own background. It is no longer load-bearing — nothing
 * scrolls behind them now — and it costs nothing, while a transparent band
 * over a panel is one refactor away from showing whatever the panel is over.
 */
export const HEADER = cx(
  'bb:flex-none',
  'bb:box-border bb:flex bb:items-start bb:gap-(--bb-space-3)',
  'bb:bg-surface-raised',
  'bb:border-b bb:border-border',
  'bb:p-(--bb-space-5)'
);

export const TITLE = cx(
  /*
   * A heading, and the level is the base's: it puts `level: 2` on the title
   * slot's context. That is the right answer, and it is worth saying why,
   * because `Alert` deliberately does the opposite — an Alert sits IN the page
   * and cannot know what level it landed at (doc 06 §2), while a layer is a
   * boundary and the document outline restarts inside it.
   */
  'bb:m-0 bb:min-w-0 bb:flex-1',
  'bb:text-lg bb:font-strong bb:leading-tight',
  'bb:[overflow-wrap:break-word]'
);

export const BODY = cx(
  /*
   * A stable handle, like `bb-select-option` and the rest. The checks have to
   * find the scroll region to press a key at it, and every other class on this
   * element is a utility that could be shared with anything.
   */
  'bb-layer-body',
  'bb:box-border bb:p-(--bb-space-5)',
  /*
   * `flex-auto` rather than `flex-1`, and the difference is the whole
   * behaviour of a content-sized layer. `flex-1` is `flex: 1 1 0%` — a basis
   * of ZERO, so the body would contribute nothing to the panel's intrinsic
   * height and a dialog sized by its contents would collapse to its header and
   * footer. `flex-auto` is `flex: 1 1 auto`: it still contributes its content,
   * it still takes the leftover room, and it can still shrink.
   *
   * Taking the leftover room is also what pins a `Drawer`'s footer to the
   * bottom of a full-height panel, which used to be a question of its own.
   */
  'bb:flex-auto bb:min-h-0 bb:overflow-y-auto',
  // The scrim is not the page: a wheel gesture reaching the bottom of the
  // layer must not start scrolling whatever is behind it (doc 09 §7).
  'bb:overscroll-contain',
  /*
   * No ring on the region itself. It becomes a tab stop while it scrolls
   * (`internal/useScrollableRegion`), and a focused scroll container ringing
   * its whole box says "you are here" about a box rather than a control —
   * the same argument the sheet makes one level up. The scrollbar and the
   * content moving are what answer the key.
   */
  'bb:outline-none'
);

export const FOOTER = cx(
  'bb:flex-none',
  'bb:box-border bb:flex bb:flex-wrap bb:items-center bb:justify-end',
  'bb:gap-(--bb-space-3)',
  'bb:bg-surface-raised',
  'bb:border-t bb:border-border',
  /*
   * LESS AIR VERTICALLY, THE SAME HORIZONTALLY, and the asymmetry is the
   * point rather than an oversight.
   *
   * A footer is a bar of controls that are already 36px tall, so 16px above
   * and below made it the tallest band in the layer for the least content.
   * Twelve is the step below it.
   *
   * The INLINE padding stays at 16 because it is not this element's to
   * choose: the header and the body use the same step, so the way out on the
   * leading edge lines up with the title above it and with the first word of
   * the body. Trimming it here would leave three edges in a column that do
   * not agree, which is what §4.6's rhythm is about and is far more visible
   * than the height ever was.
   */
  'bb:px-(--bb-space-5) bb:py-(--bb-space-4)',
  /*
   * THE FIRST ACTION IS PUSHED TO THE LEADING EDGE, and only when it is not
   * the only one.
   *
   * A footer holds a way THROUGH and a way OUT, and they are not a pair of
   * equals to be grouped: the way out belongs at the opposite end, where
   * nobody reaches for it by accident on the way to the primary action. It
   * is the first child because it is already first in the reading order —
   * `ConfirmDialog` says why in as many words, and doc 09 §5.5 requires it.
   *
   * `:not(:last-child)` is load-bearing. A footer holding a single button
   * would otherwise fling it to the leading edge, which is where nothing
   * belongs on its own: a lone action is the primary one and stays with the
   * rest of its kind. Measured the obvious way — a `Popover` with one
   * "Done".
   *
   * The library imposes this on content a consumer passes, which is the
   * exception doc 02 §6 allows: a slot's LAYOUT is the component's, and only
   * what goes in it is the consumer's.
   */
  'bb:[&>*:first-child:not(:last-child)]:me-auto'
);
