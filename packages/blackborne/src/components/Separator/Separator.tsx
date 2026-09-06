import { forwardRef } from 'react';
import {
  Separator as AriaSeparator,
  type SeparatorProps as AriaSeparatorProps
} from 'react-aria-components';
import { cx } from '../../internal/cx';

export type SeparatorOrientation = 'horizontal' | 'vertical';

/*
 * Shared by both orientations. The line is a 1px box FILLED with the border
 * colour, not an element carrying a border.
 *
 * The reason is precedence, not taste. `border-0` has to be there — the
 * package ships no reset (doc 03 §5, rule 8), so the browser's own `<hr>` is
 * still an inset 1px border with half an em of margin on each side until it is
 * cleared. Putting the line back afterwards with a second border utility means
 * two rules of the same specificity, and the winner is whichever the generator
 * happened to emit last. That is the exact accident `Checkbox.css` exists to
 * record. A filled box has no second rule to lose to.
 *
 * `--bb-border` is the one border colour (doc 03 §4.6b): `border-strong` is
 * the exception that has to be justified, and a divider is the most ordinary
 * line in an interface.
 */
const BASE = cx(
  // Every element with a height, a width or a border, because there is no
  // reset to normalise box-sizing for us.
  'bb:box-border',
  'bb:m-0 bb:border-0',
  'bb:bg-border',
  // A 1px flex item is the first thing flex-shrink eats. Without this a
  // divider disappears exactly when the row it divides gets tight, which is
  // when it was doing the most work.
  'bb:shrink-0'
);

/*
 * One typed map, in one place (doc 03 §4.4).
 *
 * ## The vertical case, which does not work by itself
 *
 * A horizontal rule fills the width it is given and is done. A vertical one
 * has no height of its own: it is 1px wide and zero tall, so dropped into a
 * flex row it renders as literally nothing. Every library that leaves this to
 * the consumer produces the same bug report, and the usual answer — "set a
 * height" — is wrong twice: the consumer does not know the row's height, and
 * a fixed one stops matching the moment density or the content changes.
 *
 * Two declarations solve it without the consumer touching anything:
 *
 * - `self-stretch` makes it as tall as its flex or grid line. It is
 *   `align-self`, not `align-items`, so it works even when the row centres its
 *   children — which is the common case and the one where the naive version
 *   collapses, because a stretch that only happens by inheritance is cancelled
 *   by any `items-center` above it.
 * - `min-h-lh` is the floor for everywhere else: a block container, an empty
 *   row, a row whose only child is the separator. `1lh` is the inherited line
 *   height, so it tracks the text around it at any density and any type size
 *   rather than pinning a number that has to be maintained (the same
 *   reasoning as `.bb-inline-control-box` in utilities.css).
 *
 * Neither is a width or a height the consumer has to know about, which is the
 * point: `<Separator orientation="vertical" />` in a plain flex row is
 * visible, and stays visible when the row grows.
 */
const ORIENTATION: Record<SeparatorOrientation, string> = {
  horizontal: 'bb:h-px bb:w-full',
  vertical: 'bb:w-px bb:self-stretch bb:min-h-lh'
} satisfies Record<SeparatorOrientation, string>;

export interface SeparatorProps extends Omit<
  AriaSeparatorProps,
  'className' | 'style' | 'orientation' | 'elementType' | 'render' | 'slot'
> {
  /**
   * Which way the line runs. A horizontal one fills its container's width; a
   * vertical one fills the height of the row it sits in.
   */
  orientation?: SeparatorOrientation;
  /**
   * Take it out of the accessibility tree entirely.
   *
   * Semantic by default, because that is what the base does and diverging
   * from it silently is the thing doc 02 §1 is written to prevent. Turn it on
   * when the division is already carried by something a reader can perceive —
   * a heading, a list, a labelled group — and the line only repeats it.
   *
   * With this on, `aria-label` and the other labelling props have no effect:
   * nothing hidden from the reader can be named to it.
   */
  isDecorative?: boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6) — a separator has no
   * internals anyway.
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A line that divides content.
 *
 * Semantic by default: it is announced as a separator, and a vertical one
 * reports its orientation. Pass `isDecorative` for a line that only draws.
 *
 * ## Why the decorative case does not go through the base
 *
 * React Aria Components 1.21 filters what reaches the DOM, and `aria-hidden`
 * is not on the list it passes through — neither is `role`. So there is no
 * prop, on the base or on us, that turns its separator off for a reader: the
 * base has one behaviour and it is the semantic one.
 *
 * Rather than document that as a limitation, decorative renders a plain
 * `div`. That is the honest shape of it — an element with no semantics needs
 * none removed — and it is the same split `Spinner` already makes: named or
 * hidden, never neither (doc 06 §3). Everything else about the two is
 * identical, classes and forwarded props included, so they are the same line
 * on screen and differ only in the accessibility tree.
 */
export const Separator = forwardRef<HTMLElement, SeparatorProps>(
  function Separator(
    {
      orientation = 'horizontal',
      isDecorative = false,
      className,
      ...ariaProps
    },
    ref
  ) {
    /*
     * `...ariaProps` rather than naming each prop: with
     * exactOptionalPropertyTypes, forwarding an optional prop by name is a
     * type error, because ours is `T | undefined` and the base's is `T?`. The
     * rest object preserves optionality (doc 02 §2). `style` travels in it for
     * that reason, and reaches both branches identically.
     */
    const classes = cx(BASE, ORIENTATION[orientation], className);

    if (isDecorative) {
      return (
        <div
          /*
           * The cast is what one component rendering two different tags
           * costs. The ref is typed `HTMLElement` because the base's is —
           * it picks `hr` or `div` from the orientation, so it cannot promise
           * anything narrower either — and a ref to a supertype is not
           * assignable to a ref to a subtype. No narrowing removes that.
           */
          ref={ref as React.ForwardedRef<HTMLDivElement>}
          aria-hidden
          className={classes}
          {...ariaProps}
        />
      );
    }

    return (
      <AriaSeparator
        ref={ref}
        orientation={orientation}
        className={classes}
        {...ariaProps}
      />
    );
  }
);
