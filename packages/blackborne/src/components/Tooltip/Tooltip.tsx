import { Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';
import {
  LayerArrow,
  HOVER_CLOSE_DELAY,
  HOVER_OPEN_DELAY,
  LAYER_OFFSET,
  type Placement
} from '../../internal/Layer';
import { cx } from '../../internal/cx';

/*
 * The bubble.
 *
 * The same surface as every other floating thing in the library —
 * `surface-raised`, a border and a shadow — rather than the inverted dark chip
 * the convention would suggest. Two reasons, in order of weight: there is one
 * elevation story and a tooltip is not an exception to it, and an inverse
 * surface would be a new token pair defined for one component, which doc 03
 * §4.4 restricts the vocabulary precisely to avoid.
 *
 * `rounded-md`, the control radius, because a tooltip is always pointing at a
 * control and two neighbouring corners at different radii is what doc 03 §4.3
 * is about.
 *
 * `text-sm`: this is secondary text about something else, not content.
 *
 * `max-w-narrow` and no way to widen it. A tooltip that spans the window is a
 * paragraph, and a paragraph belongs in the page — the catalog's note that a
 * tooltip is never the only route to information is the same rule from the
 * other side. Doc 05 §5 also forbids sizing anything to fit one label, which
 * is why this is a maximum rather than a width.
 */
const BUBBLE = cx(
  'bb-tooltip',
  // box-border because the package ships no reset: without it the padding
  // would be added to the maximum width rather than fitting inside it.
  'bb:box-border bb:max-w-narrow',
  'bb:z-(--bb-layer-popover)',
  'bb:bg-surface-raised bb:text-surface-raised-on',
  'bb:border bb:border-border bb:rounded-md bb:shadow-md',
  'bb:px-(--bb-space-3) bb:py-(--bb-space-2)',
  'bb:font-sans bb:text-sm bb:leading-normal',
  // A long unbroken token — a reference code, a path — must wrap rather than
  // burst the maximum width.
  'bb:[overflow-wrap:break-word]'
);

export interface TooltipProps {
  /**
   * What the tooltip says. A node, not only a string, so a unit or a keyboard
   * shortcut can be marked up.
   *
   * **Nothing interactive**, and the reason is narrower than it first looks.
   *
   * A pointer CAN travel into a tooltip without it closing — measured, because
   * WCAG 1.4.13 requires exactly that of content shown on hover and it was
   * written down as unknown when this component was planned. So the mouse is
   * not the problem.
   *
   * The keyboard is. A tooltip is not focusable and the base closes it when the
   * trigger loses focus, so there is no way to `Tab` into it: anything
   * interactive in here exists for a pointer and for nobody else. And on a
   * touch device it does not appear at all, because there is no hover.
   *
   * Interactive content is a `Popover`. Content on hover that somebody may want
   * to read at length, or select, is a `Preview`.
   */
  content: React.ReactNode;
  /**
   * The control it describes, and it **must be focusable**.
   *
   * A tooltip opens on hover *and on focus*, and focus is the only route
   * somebody using a keyboard has. A non-focusable trigger — a bare `<span>` of
   * truncated text — produces a tooltip that exists for a mouse and for nobody
   * else, which is the failure the catalog's "never the only route to
   * information" note is about.
   *
   * So this takes a `Button`, a `Link`, or anything else that participates in
   * focus. It is not wrapped in something focusable on your behalf: making
   * static text a tab stop is a decision about someone's keyboard, and it is
   * not this component's to make quietly.
   */
  children: React.ReactNode;
  /**
   * Where it sits, from the twelve logical positions (doc 02 §3.3). Defaults
   * to `top`.
   *
   * The base repositions a tooltip that would not fit, so this is a preference
   * rather than a guarantee — and the arrow follows where it actually went
   * rather than where it was asked to go.
   */
  placement?: Placement;
  /**
   * Turn it off without unmounting it, for a control whose tooltip only applies
   * some of the time — a truncated cell that is not truncated at this width, a
   * disabled button whose reason has gone.
   */
  isDisabled?: boolean;
}

/**
 * A short description of a control, on hover and on focus.
 *
 * ## It is a description, not a name
 *
 * This is the thing most worth knowing, and the mistake is very common. The
 * base wires a tooltip through `aria-describedby`, so it does **not** name the
 * control it points at. A button with only an icon still needs its own
 * accessible name:
 *
 * ```tsx
 * <Tooltip content="Save and close">
 *   <Button aria-label="Save">
 *     <SaveIcon />
 *   </Button>
 * </Tooltip>
 * ```
 *
 * Without that `aria-label` the button is announced as "button" and the
 * tooltip is read as its description — a description of nothing. Doc 02 §11.3
 * says it in the general case: the name of an icon-only control goes on the
 * control.
 *
 * ## It is never the only route to information
 *
 * A tooltip cannot be reached by touch, because there is no hover. Anything
 * somebody NEEDS in order to act belongs on the screen — in a label, a
 * description, or the empty state. A tooltip is for what is useful and
 * optional: the full text of something truncated, a keyboard shortcut, the
 * unabbreviated form of a column heading.
 *
 * ## What it deliberately does not take
 *
 * No `offset`, no `containerPadding` and no `shouldFlip`: the distance from a
 * trigger is spacing, it comes from a token, and it is one value for the whole
 * library (doc 02 §3.3). No delay props either — doc 09 §3.1 fixes both for the
 * library, because per-layer delays are what make two screens feel like two
 * applications.
 *
 * No `className` or `style`, which is the first component in the library with
 * nothing for them to do: a tooltip has no place in a consumer's layout, since
 * the base positions it, and its size is its content up to a maximum.
 *
 * And no way to open it only on hover. That value does not exist in the base
 * either, which is worth knowing: the one configuration that would make a
 * tooltip keyboard-inaccessible cannot be expressed.
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  isDisabled
}: TooltipProps): React.ReactNode {
  return (
    /*
     * The trigger and the bubble are composed HERE rather than by the consumer,
     * which is a departure from the base's shape and follows `Field`'s
     * precedent: a fixed, small set of parts is props, not composition (doc 02
     * §3). It also makes three mistakes impossible — a tooltip with no trigger,
     * two tooltips on one trigger, and the two in the wrong order.
     *
     * `TooltipTrigger` renders no DOM of its own; it supplies the hover and
     * focus handling to the child through context, which is why the child has
     * to be something that participates in focus.
     */
    <TooltipTrigger
      delay={HOVER_OPEN_DELAY}
      closeDelay={HOVER_CLOSE_DELAY}
      {...(isDisabled === undefined ? {} : { isDisabled })}
    >
      {children}
      <AriaTooltip
        className={BUBBLE}
        placement={placement}
        /*
         * The base defaults a tooltip to 0, which puts the bubble on top of
         * the trigger with the arrow hidden underneath it. Measured — the
         * first baseline showed a rounded box resting on a button and no
         * arrow at all.
         */
        offset={LAYER_OFFSET}
      >
        <LayerArrow />
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
