import { useCallback, useState } from 'react';
import { isDev } from '../../internal/isDev';

/*
 * WHICH PAGE, AND HOW BIG A PAGE IS.
 *
 * ## Why this is a hook and not a prop on anything
 *
 * Hard rule 7: a new capability is a new hook. `Pagination` draws a row of
 * numbers and reports a press; it holds nothing, and it should not — decision
 * 0014 keeps it and `CursorPagination` apart precisely because each is a
 * PRESENTATION of a paging model rather than the model itself.
 *
 * What is left over is arithmetic, and three pieces of it are the kind a
 * project writes by hand and gets wrong:
 *
 * - `pages` is a COUNT OF PAGES and a row total is also a number, so handing
 *   the pager 200 where it wanted 20 renders two hundred buttons and nothing
 *   in the type system complains.
 * - `offset` is `(page - 1) * size`, which is off by one page the first time
 *   somebody writes `page * size`.
 * - and the rule below, which nobody writes at all.
 *
 * ## Why it does not live with the table
 *
 * The catalog's piece list put paging among the table suite's hooks, and there
 * is no table in it. It takes a total and returns numbers; a card grid, a list
 * of invoices and a table all page the same way. Sitting beside `Pagination`
 * is what says so, and §3.4's list is corrected rather than followed.
 *
 * ## What it refuses
 *
 * The request, the rows and the total: P2, and doc 01 §4.1 — the library hands
 * over the shape and the project performs the act. It never sees a row.
 *
 * The page-size CONTROL, and any list of sizes with it. That question was
 * asked twice and answered Never both times, on the noun: a control offering
 * "10 / 25 / 50" has to say ten WHAT, and "rows", "records", "results",
 * "patients" is the project's word. A component taking a label and rendering a
 * `Select` is the `Select`. What changed on the second asking is one level
 * down — the NUMBER is state, and it is here, with the rule that makes it
 * worth holding.
 *
 * Every string. The pager already speaks from the dictionary and
 * `CursorPagination` records who speaks when a page turns: the listing, not
 * the pager. A hook that announced would be a third voice for one event.
 */

/**
 * Where a listing is, as one value.
 *
 * ONE VALUE RATHER THAN TWO NUMBERS, and that is the rule below rather than
 * tidiness: re-anchoring changes the page and the size together, and two
 * callbacks would report a state that cannot exist. A controlled project
 * storing each in its own `useState` would hold `{ page: 7, size: 50 }`
 * between them — rows 301 to 350 of 200, which is the exact state the rule
 * exists to prevent, reintroduced at the callback boundary.
 */
export interface Paging {
  /** Which page, counting from 1. */
  page: number;
  /** How many rows a page holds. Also the request's limit. */
  size: number;
}

export interface UsePagingOptions {
  /** Controlled (doc 02 §8). */
  paging?: Paging;
  /**
   * Where an uncontrolled listing starts.
   *
   * @default { page: 1, size: 25 }
   */
  defaultPaging?: Paging;
  /**
   * Called with the whole new value, in both modes — the shape
   * `useTableColumns` set.
   *
   * Called by an ACT and never by a repair. A page that is past the end is
   * corrected on the way out rather than written back, because a callback
   * firing on a render would rewrite a project's stored page — and its address
   * bar — while somebody is typing in a search box.
   */
  onPagingChange?: (paging: Paging) => void;
}

/**
 * What a listing reads.
 *
 * The first three members are `Pagination`'s three props, by name and by type,
 * so composing the two is three attributes and no arithmetic.
 */
export interface Paged {
  /** Which page, from 1, and it is one that exists. */
  page: number;
  /** How many pages the total divides into. Zero when there are no rows. */
  pages: number;
  /** Go to a page. Out of range is brought into it; the same page is silent. */
  onPageChange: (page: number) => void;
  /** How many rows a page holds. The request's limit. */
  size: number;
  /** Change it, re-anchoring on the first row that was visible. */
  onSizeChange: (size: number) => void;
  /** `(page - 1) * size`. The request's offset, and a slice's start. */
  offset: number;
}

const DEFAULT: Paging = { page: 1, size: 25 };

/* ─────────────────────────── the two sums ────────────────────────────────── */

/**
 * How many pages a total divides into. Zero rows is zero pages, not one.
 *
 * `Pagination` renders nothing below one page, so an empty listing shows the
 * table's own empty state with no row of numbers under it — read in its source
 * rather than assumed: `if (pages < 1) return null`.
 */
export const pageCount = (total: number, size: number): number =>
  total <= 0 || size < 1 ? 0 : Math.ceil(total / size);

/**
 * Where a person lands when the page size changes.
 *
 * THE ANCHOR IS THE FIRST ROW OF THE PAGE, not the first row on the screen.
 * This has no DOM and cannot have one, and an anchor read off the screen would
 * make one act produce different pages for two people looking at the same
 * listing at different scroll positions.
 *
 * It is computed and discarded rather than stored. A remembered anchor springs
 * back later to a row the person has stopped looking at.
 */
export const anchorPage = (page: number, size: number, next: number): number =>
  Math.floor(((page - 1) * size) / next) + 1;

const clamp = (page: number, pages: number): number =>
  Math.min(Math.max(Math.trunc(page), 1), Math.max(1, pages));

/* ─────────────────────────────── the hook ───────────────────────────────── */

/**
 * Which page of a listing, and how big a page is.
 *
 * @example
 * const rows = usePaging(result.total);
 * // the request the PROJECT makes
 * useEffect(() => {
 *   load({ offset: rows.offset, limit: rows.size });
 * }, [rows.offset, rows.size]);
 *
 * <Pagination
 *   page={rows.page}
 *   pages={rows.pages}
 *   onPageChange={rows.onPageChange}
 * />
 */
export function usePaging(
  total: number,
  options: UsePagingOptions = {}
): Paged {
  const { paging, defaultPaging, onPagingChange } = options;

  const [own, setOwn] = useState<Paging>(defaultPaging ?? DEFAULT);
  const current = paging ?? own;

  const settle = useCallback(
    (next: Paging) => {
      if (paging === undefined) setOwn(next);
      onPagingChange?.(next);
    },
    [paging, onPagingChange]
  );

  /*
   * A SIZE UNDER ONE ROW IS NOT A SIZE, and it is refused here rather than
   * divided by. `Math.ceil(total / 0)` is `Infinity` and `Math.ceil(total /
   * NaN)` is `NaN`, and `NaN < 1` is false — so a pager handed it would pass
   * its own "render nothing" guard and try to build a window of NaN pages.
   */
  const size = current.size >= 1 ? Math.trunc(current.size) : DEFAULT.size;

  if (isDev() && !(current.size >= 1)) {
    console.warn(
      `blackborne: usePaging was given a page size of ${String(current.size)}, which is not a number of rows. Falling back to ${String(DEFAULT.size)}. A size of zero divides the total by nothing and reaches the pager as Infinity or NaN, which its own guard against an empty listing does not catch.`
    );
  }

  const pages = pageCount(total, size);

  /*
   * PUBLISHED, NOT STORED. The page that comes out is the intent brought into
   * range, so a total that shrinks under a stored page shows the last page
   * that exists instead of an empty one — and clearing the filter afterwards
   * returns the person to where they were, because the intent was never
   * overwritten.
   *
   * That correction is not the "clamp to the last page" the page-size rule
   * rejects. There the anchor row still exists and re-anchoring is available;
   * here it does not, and the alternative is a person past the end looking at
   * nothing. Measured on this library's own pager: handed page 7 of 3,
   * `pageWindow` returns the slots 1, 2, 3 — none of them equal to 7 — so the
   * render's `slot.page === page` never matches and NO number is marked
   * `aria-current="page"`, while `atStart` is false so the previous button is
   * live and reports page 6. A row of unmarked numbers over an empty table,
   * and four more empty tables to walk back through.
   */
  const page = clamp(current.page, pages);

  const onPageChange = useCallback(
    (next: number) => {
      const landed = clamp(next, pages);
      if (landed === page && size === current.size) return;
      settle({ page: landed, size });
    },
    [pages, page, size, current.size, settle]
  );

  const onSizeChange = useCallback(
    (next: number) => {
      if (!(next >= 1)) {
        if (isDev()) {
          console.warn(
            `blackborne: a page size of ${String(next)} is not a number of rows, so it was refused. Pass one or more.`
          );
        }
        return;
      }

      const whole = Math.trunc(next);
      if (whole === size) return;
      settle({ page: anchorPage(page, size, whole), size: whole });
    },
    [page, size, settle]
  );

  return {
    page,
    pages,
    onPageChange,
    size,
    onSizeChange,
    offset: (page - 1) * size
  };
}
