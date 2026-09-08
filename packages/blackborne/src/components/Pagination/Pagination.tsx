import { forwardRef, useRef } from 'react';
import { Button } from '../Button';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { cx } from '../../internal/cx';
import {
  CONTAINER_STEPS,
  useContainerStep
} from '../../internal/useContainerStep';
import { useConfig, useMessage } from '../../config';
import { pageWindow } from './pageWindow';

/*
 * The row, and the library's first query container outside a `Card`.
 *
 * A `<div>` and not a `<nav>`, which is the third time this library has
 * declined a landmark and the first time a check insisted.
 *
 * A pagination is navigation and the pattern's own guidance wraps it in one —
 * so it did, until axe reported `landmark-unique` against a story showing
 * three of them. That is not a story problem: a pager at the top AND the
 * bottom of a table is the normal arrangement, and two landmarks with the same
 * role and the same name are indistinguishable to somebody moving between
 * them. The alternatives were a required label on every pager, or a default
 * that is wrong exactly when there are two — the silent kind.
 *
 * So it takes the shape `Breadcrumbs` already has: a **labelled list**, which
 * names the thing without claiming a region. Two of those on one page are
 * fine, and the buttons inside were always individually named.
 *
 * `w-full` beside `@container`, and the pairing is doc 04 §4.3's law rather
 * than a layout preference: inline-size containment computes an element's
 * width as though it had no contents, so an element sized BY its contents
 * collapses to its borders. A block in normal flow fills its parent and does
 * not care — but the same element dropped into a flex row is shrink-to-fit,
 * and that is exactly how every popover in the catalog came to be 2px wide.
 * The declared width is the insurance.
 *
 * `tabular-nums` because the numbers change under the cursor. Doc 03 §4.2: a
 * proportional 1 is narrower than a proportional 8, so a row of page buttons
 * would change width as somebody paged through it.
 */
const ROOT = cx(
  'bb-pagination',
  'bb:@container bb:box-border bb:w-full',
  'bb:font-sans bb:[font-variant-numeric:tabular-nums]'
);

/*
 * The list, which is also the element the step is read from — it is inside the
 * container, which the container itself cannot be (a container query asks an
 * ANCESTOR). No extra element: the list has to exist anyway.
 */
const LIST = cx(
  'bb-pagination-list',
  CONTAINER_STEPS,
  'bb:box-border bb:m-0 bb:flex bb:list-none bb:flex-wrap bb:items-center',
  'bb:justify-center bb:gap-(--bb-space-1) bb:p-0'
);

const ITEM = cx('bb:flex bb:items-center');

/*
 * The page you are on. Text, not a control, and the same decision
 * `Breadcrumbs` made: a link goes somewhere and the page you are on is not
 * somewhere to go. Two things follow, and the second is the reason it is
 * written here.
 *
 * `Tab` walks only the pages you can reach, which is one fewer stop that does
 * nothing.
 *
 * And `aria-current` lands on an element this file controls. Measured in the
 * installed source: the base's button filters its DOM props against an
 * allow-list of `aria-label`, `aria-labelledby`, `aria-describedby`,
 * `aria-details` and five global attributes — `aria-current` is in none of
 * them, so passing it to a `Button` puts it nowhere at all. A mark that
 * silently does not arrive is worse than one this element carries plainly.
 *
 * The box matches a small button's exactly, so nothing moves as the current
 * page walks along the row.
 */
const CURRENT = cx(
  'bb:box-border bb:inline-flex bb:h-control-sm bb:items-center',
  'bb:justify-center bb:px-(--bb-control-padding-x)',
  'bb:rounded-md bb:border bb:border-solid bb:border-accent',
  'bb:bg-accent bb:text-accent-on bb:text-xs bb:font-strong'
);

/*
 * The gap. Hidden from the reader, like the marks inside every other control
 * in the library: it stands in for numbers that are not there, and "horizontal
 * ellipsis" is not something anybody needs read to them.
 *
 * Sized to a button's height so the row's baseline does not move when a gap
 * appears or goes.
 */
const GAP = cx(
  'bb:box-border bb:inline-flex bb:h-control-sm bb:min-w-(--bb-space-6)',
  'bb:items-center bb:justify-center bb:text-xs bb:text-text-muted',
  'bb:select-none'
);

/** The two ends. The chevron turns with the reading direction (doc 02 §11.4). */
const PREVIOUS = cx('bb:h-mark bb:w-mark bb:rotate-90 bb:rtl:-rotate-90');
const NEXT = cx('bb:h-mark bb:w-mark bb:-rotate-90 bb:rtl:rotate-90');

/*
 * How many numbers each step of the scale has room for.
 *
 * Four steps, three structures, and that is deliberate: `wide` is not a fourth
 * behaviour. Seven numbers plus two ends fits comfortably from the medium step
 * up, and inventing a nine-number row for `wide` would be a step nobody asked
 * for on a scale doc 04 §4 keeps deliberately short.
 *
 * `base` — narrower than every step — has no row at all. Doc 04 §11: fewer
 * slots as the width falls, with previous and next as the floor.
 */
const SLOTS = {
  base: 0,
  narrow: 5,
  medium: 7,
  wide: 7
} as const;

export interface PaginationProps {
  /** Which page you are on, counting from 1. */
  page: number;
  /** How many there are. Zero renders nothing. */
  pages: number;
  /**
   * Called with the page to go to. Never called with the page you are already
   * on — the current page is not a control (see below).
   */
  onPageChange: (page: number) => void;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Moving through pages of results.
 *
 * ```tsx
 * <Pagination page={page} pages={12} onPageChange={setPage} />
 * ```
 *
 * **Controlled only.** Doc 02 §8 offers `defaultValue` as a convenience for a
 * quick trial, and there is nothing to try here: an uncontrolled pagination
 * would change its own number and leave the results where they were, which
 * looks broken rather than convenient. The page is the consumer's state
 * because fetching it is the consumer's job (P2).
 *
 * ## It changes shape with its container, not with the window
 *
 * This is the first component in the library to do that at all — level N3 of
 * doc 04's hierarchy, which had never run. The number of pages shown comes
 * from the width of the row's own container:
 *
 * | Its container            | What it shows                |
 * | ------------------------ | ---------------------------- |
 * | narrower than `narrow`   | previous and next, nothing else |
 * | `narrow`                 | five numbers                 |
 * | `medium` and wider       | seven numbers                |
 *
 * **The first paint is always the narrowest of those**, and widens once
 * measured — doc 04 §6.1, where a `ResizeObserver` reports after layout and
 * §4.1 establishes that the narrow layout is the one that is safe at any
 * width.
 *
 * At the floor there is no page number on screen and no count either. That is
 * what doc 04 §11 says the floor is, and the alternative — "3 / 12" — needs a
 * string with a number in it that the dictionary has no key for yet. It is
 * recorded in the catalog as pending a decision rather than quietly left out.
 *
 * ## The current page is text
 *
 * Not a disabled button and not a link: the page you are on is not somewhere
 * to go, which is the decision `Breadcrumbs` made about its last step. `Tab`
 * therefore walks only the pages you can reach.
 */
export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  function Pagination({ page, pages, onPageChange, className, style }, ref) {
    const list = useRef<HTMLUListElement>(null);
    const step = useContainerStep(list);
    const { locale } = useConfig();

    const label = useMessage('pagination');
    const previousLabel = useMessage('previousPage');
    const nextLabel = useMessage('nextPage');
    /*
     * Simple value substitution, which doc 05 §2.2 rule 5 permits and
     * distinguishes from building a sentence out of fragments: one whole
     * sentence with one number in it, so a translation can put the number
     * wherever its own grammar wants it.
     */
    const pageLabel = useMessage('page');

    /*
     * Formatted through the locale, because a page number is a number: doc 05
     * §3. It matters in more languages than it looks — Arabic-Indic digits are
     * the default numbering system for `ar-EG`, and a row of Latin digits in an
     * otherwise Arabic interface is the tell that something was concatenated
     * rather than formatted.
     */
    const format = (value: number) =>
      new Intl.NumberFormat(locale).format(value);

    if (pages < 1) return null;

    const slots = pageWindow(page, pages, SLOTS[step]);
    const atStart = page <= 1;
    const atEnd = page >= pages;

    return (
      <div
        ref={ref}
        className={cx(ROOT, className)}
        {...(style === undefined ? {} : { style })}
      >
        <ul ref={list} aria-label={label} className={LIST}>
          <li className={ITEM}>
            <Button
              variant="ghost"
              size="sm"
              aria-label={previousLabel}
              isDisabled={atStart}
              onPress={() => onPageChange(page - 1)}
            >
              <ChevronGlyph className={PREVIOUS} />
            </Button>
          </li>

          {/*
           * Nothing at the floor. `SLOTS.base` is zero, so the window is not
           * asked for a row it has no room to draw.
           */}
          {step === 'base'
            ? null
            : slots.map((slot, index) =>
                slot.kind === 'gap' ? (
                  <li
                    // The index is the identity: a gap has nothing else, and
                    // two gaps in one row are never adjacent.
                    key={`gap-${index}`}
                    className={ITEM}
                    aria-hidden="true"
                  >
                    <span className={GAP}>…</span>
                  </li>
                ) : slot.page === page ? (
                  <li key={slot.page} className={ITEM}>
                    <span aria-current="page" className={CURRENT}>
                      {format(slot.page)}
                    </span>
                  </li>
                ) : (
                  <li key={slot.page} className={ITEM}>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={pageLabel.replace(
                        '{page}',
                        format(slot.page)
                      )}
                      onPress={() => onPageChange(slot.page)}
                    >
                      {format(slot.page)}
                    </Button>
                  </li>
                )
              )}

          <li className={ITEM}>
            <Button
              variant="ghost"
              size="sm"
              aria-label={nextLabel}
              isDisabled={atEnd}
              onPress={() => onPageChange(page + 1)}
            >
              <ChevronGlyph className={NEXT} />
            </Button>
          </li>
        </ul>
      </div>
    );
  }
);
