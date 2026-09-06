import { forwardRef } from 'react';
import { cx } from '../../internal/cx';

export interface VisuallyHiddenProps {
  children?: React.ReactNode;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node, because there is no internal
   * node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Content that assistive technology reads and nobody sees.
 *
 * ## Why it is here at all
 *
 * The headless base ships one, and a consumer cannot reach it:
 * `react-aria-components` is this package's own dependency and not a peer
 * dependency, so it is not part of the contract a consumer installs. Under a
 * strict package manager the import does not resolve at all, and under a
 * hoisting one it resolves to whichever copy happened to be hoisted — a
 * version this library chose and may change in a patch release. Neither is an
 * API, so the piece is re-exposed here where its version is ours to keep.
 *
 * The alternative is that every consumer writes the CSS themselves, and that
 * is where this stops being a convenience. Hiding content is the one
 * accessibility mistake that leaves no trace: `display: none` and
 * `visibility: hidden` paint exactly the same nothing as the correct
 * technique, and also delete the content from the accessibility tree. The
 * screen looks right in both cases, and the failure surfaces only when a
 * reader announces a control with no name.
 *
 * What is correct is the clip technique — a 1px box, clipped, out of flow, the
 * node still rendered. It arrives through `bb:sr-only`, which is the same
 * utility the library's own internals already hide labels and live regions
 * with (`Field`, `NumberField`). One implementation of the technique, reached
 * two ways, rather than two implementations that can drift apart.
 *
 * ## What it is not for
 *
 * **A field's label.** Every field takes `isLabelHidden`, which hides the
 * label and keeps the association the base wired between it and the control
 * (doc 07 §4). Wrapping a label in this instead hides it and loses that.
 *
 * ## The limitation, written down rather than discovered (doc 06 §7)
 *
 * The content stays focusable. That is not a bug to fix — it is the same
 * property that keeps it in the accessibility tree, and the two cannot be
 * separated. But it means a button or a link placed inside becomes a tab stop
 * whose focus nobody can see, which is the one rule doc 06 §3 calls the most
 * broken of all. Put text in here, not controls. A control that must be
 * hidden until it is focused — a skip link — has to reveal itself on focus,
 * and this component never reveals anything.
 *
 * It renders a `<span>` and takes no element type: doc 02 §7 rules out `as`
 * and `asChild`. A span is phrasing content, so the one place it may not go is
 * directly inside a parent that accepts none — between the rows of a `<table>`
 * or the options of a `<select>`. There it goes in the cell, not around it.
 */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden({ children, className, ...rest }, ref) {
    /*
     * `...rest` rather than `style={style}`: with exactOptionalPropertyTypes,
     * forwarding an optional prop by name is a type error where the rest
     * object preserves optionality (doc 02 §2). One prop today, and the form
     * is the one the rest of the library uses.
     */
    return (
      <span ref={ref} className={cx('bb:sr-only', className)} {...rest}>
        {children}
      </span>
    );
  }
);
