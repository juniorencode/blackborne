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
 * The sheet: the element that carries `role="dialog"`, and the one that
 * SCROLLS. Those two being the same element is not incidental.
 *
 * The base moves focus to this element when the layer opens (doc 08 §4), and a
 * browser scrolls the nearest scrollable ANCESTOR of whatever has focus. So
 * with the scroll here, the arrow keys and `PageDown` work from the moment it
 * appears. Put the scroll on an inner body element instead — the obvious
 * three-row grid — and the scroll container becomes a DESCENDANT of the
 * focused element, which no key reaches: the arrows would look for a
 * scrollable ancestor, find the clipped panel, then the locked page, and move
 * nothing at all.
 *
 * That failure has already happened once in this repository, on the catalog's
 * own resizable panel, and it is invisible to every check that does not press
 * a key.
 */
export const SHEET = cx(
  'bb:box-border bb:flex bb:flex-col',
  /*
   * `min-h-0` and not `max-h-full`. A flex item's automatic minimum size is
   * its content, so without this it refuses to shrink and overflows the panel
   * however low the panel's ceiling is — the same failure from the other
   * direction. `overflow-y-auto` then has something to do.
   */
  'bb:min-h-0 bb:overflow-y-auto',
  // The scrim is not the page: a wheel gesture reaching the bottom of the
  // layer must not start scrolling whatever is behind it (doc 09 §7).
  'bb:overscroll-contain',
  // The focus ring belongs on interactive things. This element is focused
  // programmatically on open, as a container, and ringing the whole panel
  // says "you are here" about something nobody chose to focus.
  'bb:outline-none'
);

/*
 * Header, body and footer.
 *
 * The header and footer are `sticky` INSIDE the scroll container rather than
 * siblings outside it, which follows from the decision above: one scrolling
 * element means they travel with the content and pin themselves.
 *
 * They carry the panel's own background because nothing paints over a sticky
 * element — content scrolls behind it, and a transparent header would show the
 * body sliding underneath the title.
 */
export const HEADER = cx(
  'bb:sticky bb:top-0 bb:z-1',
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

export const BODY = cx('bb:box-border bb:p-(--bb-space-5)');

export const FOOTER = cx(
  'bb:sticky bb:bottom-0 bb:z-1',
  'bb:box-border bb:flex bb:flex-wrap bb:items-center bb:justify-end',
  'bb:gap-(--bb-space-3)',
  'bb:bg-surface-raised',
  'bb:border-t bb:border-border',
  'bb:p-(--bb-space-5)'
);
