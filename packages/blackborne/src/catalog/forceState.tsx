import { useLayoutEffect, useRef } from 'react';

/**
 * The DOM state attributes React Aria puts on a control, forced on so that a
 * state normally reachable only by pointing at the thing is visible in the
 * catalog and can be photographed.
 */
export type ForcedState =
  | 'data-hovered'
  | 'data-pressed'
  | 'data-focused'
  /*
   * `data-dragging` arrived with `Slider`, and it is the one state in this
   * union that CANNOT be reached by poking at the component: hover and press
   * happen under a pointer that is passing through, and dragging exists only
   * while one is held down and moving. So it is the state a baseline is the
   * only way to see.
   */
  | 'data-dragging'
  /*
   * And `data-focus-visible` arrived with `ColorSwatchField`, which is the
   * first component to paint something on it rather than on `data-focused`.
   * The reason is the ring's geometry: a swatch's chosen ring and its focus
   * ring are the same outline in two colours, so showing the focus one to a
   * pointer would make a click look like a second kind of selection.
   */
  | 'data-focus-visible'
  /*
   * And `data-drop-target` arrived with `FileUpload`, which is the second
   * state in this union that cannot be reached by poking at a component: it
   * exists only while something is being DRAGGED over a zone, before anything
   * has been released. A baseline is the only way to see it.
   */
  | 'data-drop-target';

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
  target,
  children
}: {
  state: ForcedState;
  /**
   * A selector for the node to mark, when it is not the outermost React Aria
   * one.
   *
   * Added by the first component with TWO of them nested: a `Collapsible` is a
   * disclosure whose header is a button, and hover, press and focus all belong
   * to the button. The outermost `[data-rac]` is the section, which has no
   * such states — so marking it put three attributes in the DOM that matched
   * no selector, and the three "states" photographed identically to the
   * default. That is the exact failure this helper was written for, arriving
   * from one level further in.
   *
   * It arrived a third time on a select, so the shape is worth naming: **for
   * anything built on `Field`, the target is `.bb-field-box`.** A field's
   * hover and focus appearance is on the frame that draws the box, never on
   * the control inside it — and a select's control is a button, which happily
   * accepts `data-focused` and paints nothing with it. Focus is the one state
   * that cannot be forced there at all, because the frame reads
   * `data-focus-within`: focus the control for real instead.
   */
  target?: string;
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
    const host = ref.current;
    if (host === null) return;

    let marked: Element | null = null;

    const apply = (): boolean => {
      /*
       * A GIVEN TARGET HAS NO FALLBACK, and that is a fix rather than a
       * simplification.
       *
       * The chain used to run `target ?? [data-rac] ?? firstElementChild` all
       * the way down, so a selector that matched nothing quietly marked the
       * outermost React Aria element instead — the wrong node, which is the
       * one failure this helper exists to prevent, produced by the helper
       * itself. It hid the case below completely: the target was absent for a
       * frame, the fallback succeeded, and nothing ever looked again.
       */
      const element =
        target === undefined
          ? (host.querySelector('[data-rac]') ?? host.firstElementChild)
          : host.querySelector(target);
      if (element === null || element === marked) return false;
      marked = element;
      element.setAttribute(state, 'true');
      return true;
    };

    const clear = () => {
      marked?.removeAttribute(state);
      marked = null;
    };

    if (apply()) return clear;

    /*
     * THE TARGET MAY NOT EXIST YET, and a layout effect is too early to know.
     *
     * Added by the first component whose structure is chosen after the first
     * paint: `Tabs` renders its narrow structure first — a `ResizeObserver`
     * reports after layout, so there is nothing to measure before painting —
     * and the row of tabs arrives a frame later. This effect had already run,
     * found no tab, and returned; the three "states" then photographed
     * identically to the default, which is the exact failure this helper was
     * written for, arriving a fourth time and from a new direction.
     *
     * So it waits. One observation, disconnected the moment the element turns
     * up, because a catalog fixture that keeps watching would re-mark the next
     * structure the moment somebody resized the frame.
     */
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(host, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clear();
    };
  }, [state, target]);

  return (
    <span ref={ref} style={{ display: 'contents' }}>
      {children}
    </span>
  );
}
