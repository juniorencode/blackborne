/**
 * One entry in the row of page numbers: a page you can go to, or a gap where
 * some were left out.
 */
export type PageSlot =
  { readonly kind: 'page'; readonly page: number } | { readonly kind: 'gap' };

/*
 * The whole of this component's logic, as a pure function.
 *
 * P6 and the entry gate: "its logic lives in hooks or pure functions, with
 * their own tests that render nothing". A pagination is the cleanest case of
 * that rule in the library so far — everything it decides is which numbers to
 * show, and none of that needs a DOM, a browser or a render.
 *
 * Neither the base nor react-aria covers pagination, so this is the "search
 * first, build by hand as a last resort" case of non-goal 6 — and the written
 * justification it asks for is short: what would be reimplemented is not
 * accessibility machinery but arithmetic. The pattern is a navigation
 * containing a list of controls with the current one marked, and there is no
 * focus management, no collection and no keyboard behaviour beyond what a
 * button already has.
 */

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), high);

/**
 * Which page numbers to show, given how many will fit.
 *
 * The first and the last page are always present, because they are the two a
 * person actually aims for — "back to the beginning" and "how far does this
 * go". Everything else is a window around the current page, with a gap
 * standing in for what was left out.
 *
 * `slots` counts PAGE NUMBERS, not entries: a gap is extra. Counting the other
 * way makes the row's width depend on whether a gap happens to be needed,
 * which is the same number of buttons jumping between two widths as somebody
 * pages through.
 *
 * @param page  the current page, from 1
 * @param pages how many there are
 * @param slots how many numbers there is room for, at least 5
 */
export function pageWindow(
  page: number,
  pages: number,
  slots: number
): readonly PageSlot[] {
  if (pages < 1) return [];

  // Truncated, all three of them. The fraction case is not defensive
  // programming: `pages` leaked into the arithmetic below and came back out as
  // a page number of 12.9, which the test written for the other two caught.
  const total = Math.trunc(pages);

  /*
   * Five is the floor: the first, the last, the current one and a gap either
   * side. Below that the gaps outnumber the numbers and the row stops meaning
   * anything — which is the case doc 04 §11 answers by dropping the numbers
   * altogether rather than by shrinking them further.
   */
  const room = Math.max(5, Math.trunc(slots));
  const current = clamp(Math.trunc(page), 1, total);

  if (total <= room) {
    return Array.from({ length: total }, (_, index) => ({
      kind: 'page' as const,
      page: index + 1
    }));
  }

  // The window between the first and the last, which are always drawn.
  const inner = room - 2;
  const half = Math.floor((inner - 1) / 2);
  const end = clamp(current + (inner - 1 - half), 1 + inner, total - 1);
  const start = end - inner + 1;

  const slotsOut: PageSlot[] = [{ kind: 'page', page: 1 }];

  /*
   * A gap that hides exactly one page is worse than the page. "1 … 3 4 5"
   * costs the same width as "1 2 3 4 5" and tells you less, so the gap only
   * appears when it is standing in for two or more.
   */
  if (start === 3) slotsOut.push({ kind: 'page', page: 2 });
  else if (start > 3) slotsOut.push({ kind: 'gap' });

  for (let n = start; n <= end; n += 1)
    slotsOut.push({ kind: 'page', page: n });

  if (end === total - 2) slotsOut.push({ kind: 'page', page: total - 1 });
  else if (end < total - 2) slotsOut.push({ kind: 'gap' });

  slotsOut.push({ kind: 'page', page: total });
  return slotsOut;
}
