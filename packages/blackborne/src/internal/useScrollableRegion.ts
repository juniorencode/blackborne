import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * INTERNAL. A scroll container the keyboard can reach, and only while it has
 * somewhere to go.
 *
 * ## Why this exists
 *
 * A browser scrolls the nearest scrollable ANCESTOR of whatever has focus. A
 * layer's scroll used to be on the element the base focuses for exactly that
 * reason — the arrows worked from the moment it opened, with nothing to wire.
 * Moving the scroll inward, so the bar spans the body rather than the whole
 * panel, makes the scroll container a DESCENDANT of the focused element, and
 * no key reaches it: the arrows look for a scrollable ancestor, find the
 * clipped panel and then the locked page, and move nothing at all.
 *
 * The standard answer is the one WCAG 2.1.1 asks for and axe's
 * `scrollable-region-focusable` rule checks: a region that scrolls is a tab
 * stop, so somebody arriving by keyboard can land on it and use the arrows.
 *
 * ## Why it is CONDITIONAL, which is the whole of the work here
 *
 * `tabIndex={0}` written flat would put a tab stop in front of the content of
 * every layer in the library, including the ones with three lines in them — a
 * stop that lands on nothing, does nothing, and has to be tabbed past. The
 * rule it satisfies only applies while the region actually scrolls, so this
 * asks that question and answers it.
 *
 * ## What it observes, and what it cannot
 *
 * Two things change the answer, and they need different instruments. The
 * element's own box changes with the window and with its container, which is
 * a `ResizeObserver`. Its CONTENT changes when the consumer renders something
 * else, which the observer cannot see at all — a taller child inside a fixed
 * scroller leaves the scroller's box exactly where it was. So the measurement
 * also runs in a layout effect on every render, which is when new content has
 * landed and before the paint that would show it.
 */
export function useScrollableRegion<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  /** `0` while there is something to scroll, and absent otherwise. */
  tabIndex: 0 | undefined;
} {
  const ref = useRef<T>(null);
  const [scrolls, setScrolls] = useState(false);

  const measure = useCallback(() => {
    const node = ref.current;
    if (node === null) return;
    /*
     * A pixel of slack. A scroller whose content is a sub-pixel taller than
     * its box is not scrollable in any way a person can use, and rounding
     * puts elements there routinely — a tab stop that scrolls by 0.4px is
     * the dead stop this hook exists to avoid, wearing a measurement.
     */
    setScrolls(node.scrollHeight - node.clientHeight > 1);
  }, []);

  useEffect(() => {
    measure();
    const node = ref.current;
    if (node === null) return;

    /*
     * WHERE THERE IS NO OBSERVER, THE MEASUREMENT ABOVE IS THE WHOLE ANSWER.
     *
     * jsdom implements no `ResizeObserver` and gives every element a zero
     * box, so the reading is "nothing to scroll" and the region is not a tab
     * stop — which is the correct answer for a layout that does not exist,
     * and the same one a first paint gives before anything has been measured.
     * `useContainerStep` takes the identical line for the identical reason.
     *
     * Without this guard it is not a degraded answer, it is a THROW: eleven
     * of `Dialog`'s thirteen unit tests, fifteen of `Drawer`'s sixteen and
     * one of `ButtonGroup`'s went red on `ResizeObserver is not defined` the
     * moment this hook was wired in. The package guide records the same trap
     * for `IntersectionObserver`, one component earlier.
     */
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  });

  return { ref, tabIndex: scrolls ? 0 : undefined };
}
