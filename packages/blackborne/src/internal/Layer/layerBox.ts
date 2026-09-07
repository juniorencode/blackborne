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
 * `container-type: inline-size`, following the Card
 * (decision 0010). A layer is a region with a width of its own, which is the
 * thing a container is, so anything placed inside can ask how wide it is with
 * no configuration. Note what that decision does NOT give, since it was
 * corrected there: it makes this no kind of containing block, so a consumer's
 * `position: fixed` child still positions against the window.
 *
 * `box-border` because the package ships no reset — with a border and padding
 * on one element, content-box makes a declared width measure wider than it was
 * asked for.
 *
 * Not here: the border WIDTH, the radius and the size. A dialog is bordered
 * and rounded on all four sides; a drawer is flush against three window edges
 * and only one of its edges is free.
 */
export const PANEL = cx(
  'bb:box-border',
  'bb:flex bb:flex-col',
  'bb:bg-surface-raised bb:text-surface-raised-on',
  'bb:border-border bb:shadow-lg',
  'bb:overflow-hidden',
  'bb:font-sans bb:text-md bb:leading-normal',
  'bb:[container-type:inline-size]'
);

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
