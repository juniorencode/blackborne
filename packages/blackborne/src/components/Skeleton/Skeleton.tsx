import { forwardRef } from 'react';
import { cx } from '../../internal/cx';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

/*
 * The variant map. ONE place, typed, per component (doc 02 §3, doc 03 §4.4).
 *
 * `satisfies Record<...>` is what makes it exhaustive: adding a variant to the
 * union without adding it here is a type error, so the two cannot drift.
 *
 * Every shape is one line box tall, because a line of text is the smallest
 * thing this stands in for and it keeps a skeleton dropped beside real text on
 * the same rhythm. None of them declares a width: doc 04 §3 leaves no room for
 * a width picked so one particular shape fits.
 */
const VARIANT: Record<SkeletonVariant, string> = {
  /*
   * The root of a text block paints nothing — the bars do, one per line. Flex
   * and not a plain block on purpose: the bars carry the leading as margins,
   * and flex items are the only ones whose margins do not collapse into each
   * other. Skeleton.css depends on that.
   */
  text: 'bb:flex bb:flex-col',
  /*
   * The one shape that cannot fill its container, and the shape itself forces
   * it: a circle is as wide as it is tall, so a disc filling a page-wide
   * column would be a metre across and would report a height nobody asked for.
   * The width therefore derives from the height — one source, so a consumer
   * resizing it from `className` moves both and it stays round.
   *
   * `inline-block` is what makes that work at all. A block box stretches to
   * its container and ignores the ratio, so this reads as a deliberate
   * exception rather than as the leftover default it would otherwise be.
   *
   * `flex-none` for the same reason Spinner.css carries `flex: none`: dropped
   * into a row beside a name and a figure — which is where an avatar
   * placeholder actually goes — a shrinkable item narrows before its
   * neighbours wrap, and a circle that has been narrowed is an ellipse.
   */
  circle:
    'bb:inline-block bb:flex-none bb:aspect-square bb:h-[1lh] bb:rounded-full',
  rect: 'bb:block bb:h-[1lh] bb:w-full bb:rounded-md'
} satisfies Record<SkeletonVariant, string>;

export interface SkeletonProps {
  /** The shape it holds space for. A closed set (doc 02 §3). */
  variant?: SkeletonVariant;
  /**
   * How many lines the `text` variant draws. Ignored by the other two, which
   * are a single shape.
   *
   * The last line of a block of several is drawn short — that is what makes it
   * read as a paragraph rather than as a stack of rows.
   */
  lines?: number;
  /**
   * Applied to the outermost element only, for placement — margin, width in a
   * grid, where it sits. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  /**
   * **This is the resize hatch, and `className` is not.**
   *
   * A placeholder is often sized from a measurement the consumer has and the
   * library cannot: the height of the row it is standing in for. But the
   * height the variants set is a utility, and so is a consumer's `bb:h-10` —
   * equal specificity, so the winner is whichever the generator emitted last,
   * which is ours. Measured: `.bb\:h-[1lh]` lands after `.bb\:h-10` in the
   * compiled sheet, so a `className` height silently does nothing.
   *
   * An inline style has no such argument to lose. It is also the honest shape
   * for this: the number comes from something the consumer measured, not from
   * a scale.
   *
   * The general form of the rule, which is not specific to this component:
   * `className` reliably sets properties the component does not, and cannot be
   * relied on to overrule one it does. That is what doc 02 §6 grants it —
   * margin, width, grid position — and nothing more.
   */
  style?: React.CSSProperties;
}

/**
 * A placeholder shape that holds the space content will occupy.
 *
 * **It never announces anything, and there is no prop to make it.** Whoever
 * owns the region says it is loading, once; a paragraph of twenty skeleton
 * lines that each announced would say "loading" twenty times, which is how a
 * screen reader user learns to leave a page (doc 06 §3). The root is
 * `aria-hidden` in every variant and nothing here is focusable, so this is not
 * the forbidden case of hiding something that can still be reached.
 *
 * **It is for the FIRST load only.** Doc 09 §6 is explicit that loading must
 * not erase what was already there: on a refetch the previous rows stay,
 * dimmed or behind an indicator, because emptying and refilling makes an
 * application feel slower than it is. Replacing a table that already has
 * content with skeletons is that mistake in its most visible form. The
 * component cannot tell which load it is in and so cannot stop it — hence this
 * paragraph.
 *
 * And it does not decide when to appear. Doc 09 §3: under about 300ms, show
 * nothing at all. Whoever owns the timing owns that call.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ variant = 'text', lines = 1, className, style }, ref) {
    if (variant === 'text') {
      /*
       * A fractional or negative count is a caller's mistake, not a state
       * worth rendering: one line is the floor. Silently, because a skeleton
       * that threw would take down the screen it was meant to be holding open.
       *
       * NaN and Infinity are checked and not merely clamped, because
       * Math.max(1, NaN) is NaN, and that renders a block of no lines at all —
       * a placeholder occupying nothing, which is the silent failure this
       * component exists to prevent. Infinity throws outright.
       */
      const count = Number.isFinite(lines) ? Math.max(1, Math.floor(lines)) : 1;

      return (
        <div
          ref={ref}
          aria-hidden
          className={cx(VARIANT.text, className)}
          style={style}
        >
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              className="bb-skeleton bb-skeleton-line bb:box-border bb:rounded-sm"
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        aria-hidden
        // box-border because this has a height, and the package ships no
        // global reset — without it the browser default is content-box and a
        // declared size measures larger than it says.
        className={cx('bb-skeleton bb:box-border', VARIANT[variant], className)}
        style={style}
      />
    );
  }
);
