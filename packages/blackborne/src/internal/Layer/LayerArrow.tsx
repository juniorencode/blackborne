import { OverlayArrow } from 'react-aria-components';

/*
 * INTERNAL. The little triangle that says which control a floating layer
 * belongs to.
 *
 * Shared by `Tooltip` and `Popover`, which need it identically: the same shape,
 * the same two colours, and the same rotation driven by the base's reflected
 * placement. Two copies of a drawn shape whose geometry has to agree with a
 * border is the duplication this library has been burned by before.
 *
 * The OPEN TOP EDGE is deliberate. A closed triangle stroked all round would
 * draw a line across the panel's own border where the two meet; leaving that
 * edge out lets the border run straight through, and the arrow reads as part of
 * the same shape rather than as a lozenge stuck to it.
 *
 * It points DOWN at rest, which is the `top` case — the layer is above its
 * trigger, so the arrow hangs off its lower edge. `arrow.css` rotates it from
 * `data-placement` on the layer, and that has to be the REFLECTED value rather
 * than the prop: the base flips a layer that would not fit, and an arrow
 * following the prop would then point away from what it describes, which is
 * worse than no arrow at all.
 */

export interface LayerArrowProps {
  /**
   * The surface the arrow is a piece of, as a CSS colour. Both layers use the
   * raised surface today; it is a parameter because the fill and the panel's
   * background have to be the same value, and passing it makes that a
   * requirement rather than a coincidence.
   */
  fill?: string;
  /** The panel's border colour, for the same reason. */
  stroke?: string;
}

export function LayerArrow({
  fill = 'var(--bb-surface-raised)',
  stroke = 'var(--bb-border)'
}: LayerArrowProps): React.ReactNode {
  return (
    <OverlayArrow className="bb-layer-arrow">
      {/*
       * Drawn, not received: doc 02 §11.4 separates the icons the library draws
       * for its own controls from the ones it receives.
       */}
      <svg width="10" height="5" viewBox="0 0 10 5" aria-hidden="true">
        <path d="M0 0 L5 5 L10 0" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    </OverlayArrow>
  );
}
