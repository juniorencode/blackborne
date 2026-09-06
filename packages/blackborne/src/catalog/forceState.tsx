import { useLayoutEffect, useRef } from 'react';

/**
 * The DOM state attributes React Aria puts on a control, forced on so that a
 * state normally reachable only by pointing at the thing is visible in the
 * catalog and can be photographed.
 */
export type ForcedState = 'data-hovered' | 'data-pressed' | 'data-focused';

/**
 * Force one of those states for the catalog.
 *
 * ## Why this is a component and not a prop
 *
 * The obvious way is to pass the attribute as a prop:
 *
 * ```tsx
 * <Button {...{ 'data-hovered': true }}>hover</Button>
 * ```
 *
 * That is what the catalog did, and IT NEVER WORKED — not for focus, not for
 * hover, not for pressed. React Aria renders its own `data-hovered={isHovered
 * || undefined}` on the same element, and it wins, so the attribute never
 * reached the DOM. Measured: the three "states" were byte-identical to the
 * default one. Every `*-states` screenshot approved that for as long as it
 * existed, because a baseline only proves a picture has not changed — never
 * that it was right to begin with.
 *
 * Setting the attribute on the node after render works because React only
 * removes attributes it set itself, and React Aria sets these to `undefined`
 * while the state is off, which is not a DOM write.
 *
 * `display: contents` on the wrapper so it takes part in no layout: the row
 * around it must measure exactly as it would without this.
 */
export function Force({
  state,
  children
}: {
  state: ForcedState;
  children: React.ReactNode;
}): React.ReactElement {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    /*
     * [data-rac], not firstElementChild.
     *
     * They are the same node for a Button, and they are NOT for anything built
     * on a field: Checkbox, Switch and Radio render our own wrapper div on the
     * outside, and the state attributes belong on the React Aria root inside
     * it — the element that also carries bb:group, which is what the ring is
     * keyed off. Marking the wrapper put the attribute in the DOM, where it
     * matched no selector at all.
     *
     * React Aria stamps [data-rac] on that root, and querySelector returns
     * tree order, so the outermost one is the one we want.
     */
    const element =
      ref.current?.querySelector('[data-rac]') ??
      ref.current?.firstElementChild;
    if (!element) return;
    element.setAttribute(state, 'true');
    return () => element.removeAttribute(state);
  }, [state]);

  return (
    <span ref={ref} style={{ display: 'contents' }}>
      {children}
    </span>
  );
}
