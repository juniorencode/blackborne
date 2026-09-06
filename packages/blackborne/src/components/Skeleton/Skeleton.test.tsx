import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Skeleton } from './Skeleton';

/*
 * What is NOT here, because jsdom cannot answer it — no layout, no resolved
 * custom properties, no animation:
 *
 *   - that a block of N lines occupies exactly N line boxes, which is the
 *     whole point of the margin arithmetic in Skeleton.css
 *   - that the last line of a multi-line block is drawn short, which is a
 *     :last-child:not(:only-child) rule and resolves to nothing here
 *   - that the fill is visible in both modes, which is the colour decision the
 *     component actually turns on
 *   - that the pulse stops under reduced motion
 *
 * Those belong to the catalog, in a real browser. Doc 10: a token bug that
 * made dark mode do nothing passed every unit test.
 */

/** The root of a text block, whatever the variant. */
function rootOf(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

test('it is hidden from assistive technology, in every variant', () => {
  /*
   * The rule with no prop to switch it off. Whoever owns the region announces
   * that it is loading; twenty skeleton lines each announcing would say
   * "loading" twenty times (doc 06 §3).
   */
  for (const variant of ['text', 'circle', 'rect'] as const) {
    const { container, unmount } = render(
      <Skeleton variant={variant} lines={3} />
    );
    expect(rootOf(container).getAttribute('aria-hidden')).toBe('true');
    unmount();
  }
});

test('it exposes nothing to announce', () => {
  const { container } = render(<Skeleton lines={4} />);
  // No role, no name, no live region anywhere in the tree: there is nothing
  // here for a reader to reach even if the hiding were undone.
  expect(
    container.querySelectorAll('[role], [aria-live], [aria-label]')
  ).toHaveLength(0);
});

test('a text skeleton is one line by default', () => {
  const { container } = render(<Skeleton />);
  // One bar stands in for a label or a value, and it is the common case.
  expect(rootOf(container).children).toHaveLength(1);
});

test('lines draws one bar per line', () => {
  const { container } = render(<Skeleton lines={5} />);
  expect(rootOf(container).children).toHaveLength(5);
});

test('a count below one, or a fractional one, still draws a line', () => {
  // A caller's mistake is not a state worth rendering, and throwing would take
  // down the screen this exists to hold open.
  for (const [lines, expected] of [
    [0, 1],
    [-3, 1],
    [2.7, 2],
    // NaN is the one that matters: Math.max(1, NaN) is NaN, and a block of no
    // lines is a placeholder occupying nothing.
    [Number.NaN, 1],
    [Number.POSITIVE_INFINITY, 1]
  ] as const) {
    const { container, unmount } = render(<Skeleton lines={lines} />);
    expect(rootOf(container).children).toHaveLength(expected);
    unmount();
  }
});

test('the shape variants are a single element, and ignore lines', () => {
  for (const variant of ['circle', 'rect'] as const) {
    const { container, unmount } = render(
      <Skeleton variant={variant} lines={6} />
    );
    expect(rootOf(container).children).toHaveLength(0);
    unmount();
  }
});

test('className reaches the root and nothing inside it', () => {
  // Doc 02 §6: the outermost element is the whole of the escape hatch, and it
  // is how a consumer gives a circle or a rectangle a size of its own.
  const { container } = render(<Skeleton lines={3} className="consumer" />);
  const root = rootOf(container);

  expect(root.classList.contains('consumer')).toBe(true);
  for (const line of root.children) {
    expect(line.classList.contains('consumer')).toBe(false);
  }
});
