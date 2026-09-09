import { forwardRef } from 'react';
import { Button } from '../Button';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { cx } from '../../internal/cx';
import { useMessage } from '../../config';

/*
 * Two buttons, and no container query: there is nothing here to change shape
 * into. Doc 04 §11 records it as N0 along with the other three components of
 * its batch that need nothing at all — the interesting half of that list is
 * what is not on it.
 *
 * `role="group"` rather than a `<nav>` landmark, for the reason its sibling
 * records at length: a pager at each end of a table is normal, and two
 * landmarks with the same role and name are indistinguishable — axe reports
 * `landmark-unique` and it is right to. A group says "these two belong
 * together" and claims no region, so any number of them can coexist.
 */
const ROOT = cx(
  'bb-cursor-pagination',
  'bb:box-border bb:flex bb:items-center bb:gap-(--bb-space-1)',
  'bb:font-sans'
);

/** The chevrons turn with the reading direction (doc 02 §11.4). */
const PREVIOUS = cx('bb:h-mark bb:w-mark bb:rotate-90 bb:rtl:-rotate-90');
const NEXT = cx('bb:h-mark bb:w-mark bb:-rotate-90 bb:rtl:rotate-90');

export interface CursorPaginationProps {
  /**
   * Whether there is anything before this page.
   *
   * **Received, never deduced.** P2: the component does not know where the
   * rows came from, and a cursor pager cannot work it out — that is the whole
   * difference from `Pagination`, which is given a total and computes
   * everything from it ([decision 0014](../../../../../docs/decisions/0014-cursor-pagination-is-its-own-component.md)).
   */
  hasPrevious: boolean;
  /** Whether there is anything after it. Received for the same reason. */
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /**
   * Whether a page is on its way. Both buttons go unavailable while it is.
   *
   * **And nothing here announces it**, which is deliberate. Doc 06 §3 asks
   * that an asynchronous change be announced by whoever CAUSED it — "a
   * component that merely appears cannot know whether it has been on screen
   * since load" — and what changes is the listing, not the pager. Doc 09 §6
   * puts the feedback in the same place: loading does not blank the screen, it
   * keeps the previous rows dimmed or behind an indicator.
   *
   * So a pager that also announced would be the second voice for one event,
   * and the one with less to say.
   */
  isPending?: boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Previous and next, for a listing whose length nobody knows.
 *
 * ```tsx
 * <CursorPagination
 *   hasPrevious={cursor.before !== null}
 *   hasNext={cursor.after !== null}
 *   onPrevious={loadPrevious}
 *   onNext={loadNext}
 * />
 * ```
 *
 * ## Why this is not a mode on `Pagination`
 *
 * [Decision 0014](../../../../../docs/decisions/0014-cursor-pagination-is-its-own-component.md),
 * and the short version is that the two share no prop. Offset pagination is
 * given a total and a current page, and everything else follows — the window,
 * the first and the last, where the gap goes. This is given two booleans.
 *
 * One of them **cannot know the total, ever**: the number does not exist on
 * its side of the network, so no version of this component can compute it.
 * Two different questions that happen to be answered by two buttons in the
 * same corner.
 *
 * A single component taking both would accept a total *and* a pair of
 * booleans, which is the state that cannot exist — the impossible combination
 * doc 02 §3 rejects a boolean per variant for.
 */
export const CursorPagination = forwardRef<
  HTMLDivElement,
  CursorPaginationProps
>(function CursorPagination(
  {
    hasPrevious,
    hasNext,
    onPrevious,
    onNext,
    isPending = false,
    className,
    style
  },
  ref
) {
  const label = useMessage('pagination');
  const previousLabel = useMessage('previousPage');
  const nextLabel = useMessage('nextPage');

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cx(ROOT, className)}
      {...(style === undefined ? {} : { style })}
    >
      <Button
        variant="secondary"
        size="sm"
        aria-label={previousLabel}
        isDisabled={!hasPrevious || isPending}
        onPress={onPrevious}
      >
        <ChevronGlyph className={PREVIOUS} />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        aria-label={nextLabel}
        isDisabled={!hasNext || isPending}
        onPress={onNext}
      >
        <ChevronGlyph className={NEXT} />
      </Button>
    </div>
  );
});
