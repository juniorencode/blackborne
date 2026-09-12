/*
 * Which page of a listing, tested without rendering one.
 *
 * P6: logic lives in hooks, with tests that render nothing. There is no DOM in
 * this file and no component. The whole of this hook is arithmetic and one
 * rule, and both are answerable here — which is also the argument for it being
 * a hook at all.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { anchorPage, pageCount, usePaging, type Paging } from './usePaging';

afterEach(() => {
  vi.restoreAllMocks();
});

/* ─────────────────────────────── the two sums ───────────────────────────── */

test('a total divides into pages, and no rows is no pages', () => {
  expect(pageCount(200, 10)).toBe(20);
  expect(pageCount(201, 10)).toBe(21);
  /*
   * Zero rather than one, because `Pagination` renders nothing below one page
   * — read in its source — so an empty listing shows the table's own empty
   * state with no row of numbers under it.
   */
  expect(pageCount(0, 10)).toBe(0);
});

/*
 * THE RULE, AS ITS OWN ARITHMETIC. The catalog states it with this example:
 * 200 results at 10 a page, on page 7, switching to 50. Keep the page and you
 * are on rows 301 to 350 of 200, past the end, looking at nothing.
 */
test('a new size lands on the page holding the first row that was visible', () => {
  expect(anchorPage(7, 10, 50)).toBe(2);

  /* And in reverse it is 6 rather than 7: the first row now visible is 51. */
  expect(anchorPage(2, 50, 10)).toBe(6);

  /* The first page is the first page at any size. */
  expect(anchorPage(1, 10, 50)).toBe(1);
  expect(anchorPage(1, 50, 10)).toBe(1);
});

/* ──────────────────────────────── the hook ──────────────────────────────── */

test('it starts on the first page and reports what a request needs', () => {
  const { result } = renderHook(() => usePaging(200));

  expect(result.current.page).toBe(1);
  expect(result.current.size).toBe(25);
  expect(result.current.pages).toBe(8);
  expect(result.current.offset).toBe(0);
});

test('the offset is the page before it, not the page itself', () => {
  const { result } = renderHook(() =>
    usePaging(200, { defaultPaging: { page: 3, size: 10 } })
  );

  /* `page * size` is 30 and wrong; the third page of ten starts at row 21. */
  expect(result.current.offset).toBe(20);
});

test('changing the size re-anchors, and reports both halves at once', () => {
  const seen: Paging[] = [];
  const { result } = renderHook(() =>
    usePaging(200, {
      defaultPaging: { page: 7, size: 10 },
      onPagingChange: paging => seen.push(paging)
    })
  );

  act(() => {
    result.current.onSizeChange(50);
  });

  expect(result.current.page).toBe(2);
  expect(result.current.size).toBe(50);
  expect(result.current.offset).toBe(50);

  /*
   * ONE REPORT, NOT TWO. A controlled project storing the page and the size in
   * two states would hold `{ page: 7, size: 50 }` between two callbacks —
   * rows 301 to 350 of 200, the exact state the rule exists to prevent,
   * reintroduced at the boundary.
   */
  expect(seen).toEqual([{ page: 2, size: 50 }]);
});

test('a page past the end is brought back, without overwriting the intent', () => {
  const { rerender, result } = renderHook(
    ({ total }: { total: number }) =>
      usePaging(total, { defaultPaging: { page: 7, size: 10 } }),
    { initialProps: { total: 200 } }
  );

  expect(result.current.page).toBe(7);

  /* A filter narrows the results to thirty. */
  rerender({ total: 30 });
  expect(result.current.pages).toBe(3);
  expect(result.current.page).toBe(3);

  /*
   * AND THE INTENT SURVIVES. Clearing the filter puts the person back where
   * they were rather than on the last page they were pushed onto — which is
   * only possible because the correction happens on the way out rather than
   * being written back into the state.
   */
  rerender({ total: 200 });
  expect(result.current.page).toBe(7);
});

test('and the correction is silent, because nobody asked for it', () => {
  const onPagingChange = vi.fn();
  const { rerender } = renderHook(
    ({ total }: { total: number }) =>
      usePaging(total, {
        defaultPaging: { page: 7, size: 10 },
        onPagingChange
      }),
    { initialProps: { total: 200 } }
  );

  rerender({ total: 30 });

  /*
   * A callback firing on a render rather than on an act would rewrite a
   * controlled project's stored page — and its address bar — while somebody is
   * typing in a search box.
   */
  expect(onPagingChange).not.toHaveBeenCalled();
});

test('an empty listing has no pages at all', () => {
  const { result } = renderHook(() => usePaging(0));

  expect(result.current.pages).toBe(0);
  expect(result.current.page).toBe(1);
  expect(result.current.offset).toBe(0);
});

test('a page out of range is brought into it rather than refused', () => {
  const seen: Paging[] = [];
  const { result } = renderHook(() =>
    usePaging(30, {
      defaultPaging: { page: 1, size: 10 },
      onPagingChange: p => seen.push(p)
    })
  );

  act(() => {
    result.current.onPageChange(99);
  });
  expect(result.current.page).toBe(3);

  act(() => {
    result.current.onPageChange(-4);
  });
  expect(result.current.page).toBe(1);

  expect(seen).toEqual([
    { page: 3, size: 10 },
    { page: 1, size: 10 }
  ]);
});

test('and asking for the page you are on says nothing', () => {
  const onPagingChange = vi.fn();
  const { result } = renderHook(() =>
    usePaging(200, { defaultPaging: { page: 3, size: 10 }, onPagingChange })
  );

  act(() => {
    result.current.onPageChange(3);
  });

  expect(onPagingChange).not.toHaveBeenCalled();
});

test('controlled, it applies nothing and reports everything', () => {
  const onPagingChange = vi.fn();
  const { result } = renderHook(() =>
    usePaging(200, { paging: { page: 4, size: 10 }, onPagingChange })
  );

  act(() => {
    result.current.onPageChange(6);
  });

  /* The value did not move, because the project holds it. */
  expect(result.current.page).toBe(4);
  expect(onPagingChange).toHaveBeenCalledWith({ page: 6, size: 10 });
});

test('a size under one row is refused, and said once', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const onPagingChange = vi.fn();
  const { result } = renderHook(() =>
    usePaging(200, { defaultPaging: { page: 2, size: 10 }, onPagingChange })
  );

  act(() => {
    result.current.onSizeChange(0);
  });

  expect(result.current.size).toBe(10);
  expect(onPagingChange).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toContain('not a number of rows');
});

test('and a size that ARRIVES under one row falls back rather than dividing by it', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { result } = renderHook(() =>
    usePaging(200, { paging: { page: 1, size: 0 } })
  );

  /*
   * `Math.ceil(200 / 0)` is `Infinity` and `Math.ceil(200 / NaN)` is `NaN`,
   * and `NaN < 1` is false — so a pager handed either would pass its own
   * "render nothing" guard and try to build a window of that many pages.
   */
  expect(result.current.size).toBe(25);
  expect(Number.isFinite(result.current.pages)).toBe(true);
  expect(result.current.pages).toBe(8);
  expect(warn).toHaveBeenCalled();
});

test('and asking for the size you already have says nothing either', () => {
  const onPagingChange = vi.fn();
  const { result } = renderHook(() =>
    usePaging(200, { defaultPaging: { page: 3, size: 10 }, onPagingChange })
  );

  act(() => {
    result.current.onSizeChange(10);
  });

  /*
   * Written because exercising the others found it uncovered: deleting the
   * guard left every test green, and a controlled project would have been
   * handed a change it did not make on every render of a size menu.
   */
  expect(onPagingChange).not.toHaveBeenCalled();
  expect(result.current.page).toBe(3);
});
