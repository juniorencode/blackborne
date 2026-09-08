/*
 * The window, tested without rendering anything — which is the point of it
 * being a pure function (P6, and the entry gate's sixth box).
 *
 * Every case here is a shape the row can take, written as the row reads on
 * screen so a failure is legible: `1 … 4 5 6 … 12`.
 *
 * Worth knowing while reading them: **`slots` counts numbers, not entries.**
 * Seven slots is seven numbers plus however many gaps it takes to join them,
 * so a full row is `1 … 4 5 6 7 8 … 12` and not `1 … 5 6 7 … 12`. Four
 * expectations here were written the other way first and the implementation
 * was right — the count property below is what settled which.
 */
import { describe, expect, test } from 'vitest';
import { pageWindow, type PageSlot } from './pageWindow';

/** The row as somebody would read it, for assertions that say what they mean. */
const row = (slots: readonly PageSlot[]): string =>
  slots.map(slot => (slot.kind === 'gap' ? '…' : String(slot.page))).join(' ');

describe('when everything fits', () => {
  test('every page is shown, with no gap', () => {
    expect(row(pageWindow(1, 5, 7))).toBe('1 2 3 4 5');
    expect(row(pageWindow(3, 7, 7))).toBe('1 2 3 4 5 6 7');
  });

  test('a single page is a row of one', () => {
    expect(row(pageWindow(1, 1, 7))).toBe('1');
  });

  test('no pages is no row at all', () => {
    expect(pageWindow(1, 0, 7)).toEqual([]);
  });
});

describe('when it does not fit', () => {
  test('the first and the last are always there', () => {
    for (const page of [1, 5, 6, 7, 12]) {
      const slots = pageWindow(page, 12, 7);
      expect(slots.at(0)).toEqual({ kind: 'page', page: 1 });
      expect(slots.at(-1)).toEqual({ kind: 'page', page: 12 });
    }
  });

  test('the window follows the current page', () => {
    expect(row(pageWindow(6, 12, 7))).toBe('1 … 4 5 6 7 8 … 12');
    expect(row(pageWindow(7, 12, 7))).toBe('1 … 5 6 7 8 9 … 12');
  });

  test('and stops at each end instead of running off it', () => {
    expect(row(pageWindow(1, 12, 7))).toBe('1 2 3 4 5 6 … 12');
    expect(row(pageWindow(12, 12, 7))).toBe('1 … 7 8 9 10 11 12');
  });

  /*
   * The row holds the same number of NUMBERS wherever the current page is.
   * Counting entries instead would make its width jump between two values as
   * somebody pages through, which is a row of buttons moving under the cursor
   * that just pressed one (doc 09 §7).
   */
  test('the count of numbers never changes', () => {
    for (const page of [1, 2, 3, 6, 9, 11, 12]) {
      const numbers = pageWindow(page, 12, 7).filter(
        slot => slot.kind === 'page'
      );
      expect(numbers, `page ${page}`).toHaveLength(7);
    }
  });

  /*
   * A gap standing in for one page costs the same width as the page and tells
   * you less.
   */
  test('a gap never hides a single page', () => {
    expect(row(pageWindow(4, 12, 7))).toBe('1 2 3 4 5 6 … 12');
    expect(row(pageWindow(9, 12, 7))).toBe('1 … 7 8 9 10 11 12');
    // And the same at the smallest room, where the window is one page wide.
    expect(row(pageWindow(3, 9, 5))).toBe('1 2 3 4 … 9');
  });
});

describe('the edges', () => {
  test('five numbers is the floor, however few are asked for', () => {
    const narrow = pageWindow(6, 12, 1);
    expect(narrow.filter(slot => slot.kind === 'page')).toHaveLength(5);
    expect(row(narrow)).toBe('1 … 5 6 7 … 12');
  });

  test('a page outside the range is pulled back into it', () => {
    expect(row(pageWindow(0, 12, 7))).toBe(row(pageWindow(1, 12, 7)));
    expect(row(pageWindow(99, 12, 7))).toBe(row(pageWindow(12, 12, 7)));
    expect(row(pageWindow(-3, 12, 7))).toBe(row(pageWindow(1, 12, 7)));
  });

  test('fractions are not pages', () => {
    expect(row(pageWindow(6.7, 12.9, 7.5))).toBe(row(pageWindow(6, 12, 7)));
  });

  /*
   * Whatever the shape, the numbers only ever go up and never repeat. Asserted
   * over every position of every size rather than at a few points, because the
   * failure this catches — a duplicate at a boundary, or a window that walks
   * backwards — is the kind that appears at one width and one page.
   */
  test('the numbers always ascend, at every size and every position', () => {
    for (let pages = 1; pages <= 30; pages += 1) {
      for (let page = 1; page <= pages; page += 1) {
        for (const slots of [5, 6, 7, 9]) {
          const numbers = pageWindow(page, pages, slots)
            .filter(slot => slot.kind === 'page')
            .map(slot => (slot.kind === 'page' ? slot.page : 0));

          const label = `${page}/${pages} in ${slots}`;
          expect(new Set(numbers).size, label).toBe(numbers.length);
          expect(
            [...numbers].sort((a, b) => a - b),
            label
          ).toEqual(numbers);
          expect(numbers.at(0), label).toBe(1);
          expect(numbers.at(-1), label).toBe(pages);
          expect(numbers, label).toContain(page);
        }
      }
    }
  });
});
