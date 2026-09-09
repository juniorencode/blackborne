import { useEffect, useState } from 'react';

/**
 * Which step of the container scale an element's own container is at.
 *
 * `base` is narrower than every step of the scale; the rest are the scale's
 * own names (doc 04 §4). One vocabulary for both halves of the hierarchy —
 * these are the words the CSS variants use, so a component that is N2 in one
 * place and N3 in another does not end up with two ways of saying "narrow".
 */
export type ContainerStep = 'base' | 'narrow' | 'medium' | 'wide';

/*
 * INTERNAL, and doc 04 §6's "one single hook for the whole library" — the
 * level of the responsive hierarchy that had never run. Everything adaptive
 * built before this is CSS or the one viewport exception.
 *
 * Not exported. [Decision 0012](../../../../docs/decisions/0012-growing-is-a-prop-not-a-public-hook.md)
 * is the precedent: P6 asks that logic be testable without rendering, not that
 * every hook be public. A public one would let a consumer decide our
 * components' structure from outside, and non-goal 10 leaves no hole of that
 * shape.
 *
 * ## THE THRESHOLDS ARE NOT IN HERE, and that is the design
 *
 * Doc 04 §6.1 predicted this hook would resolve `--bb-container-narrow` from
 * the element and compare it against a measured width, which would have made
 * the JavaScript thresholds honour a consumer's redefinition where a container
 * query cannot. It does not, because it does not have to: **CSS can answer the
 * question directly.**
 *
 * The caller declares a query container and gives the element it observes four
 * classes generated from the scale — Tailwind's own container variants, so no
 * number is written anywhere in this library:
 *
 *   bb:[--bb-step:base]  bb:@narrow:[--bb-step:narrow]
 *   bb:@medium:[--bb-step:medium]  bb:@wide:[--bb-step:wide]
 *
 * This hook reads the resolved value. Three things follow, and all three are
 * better than the plan:
 *
 * - **One set of thresholds**, in CSS, where §4.0 establishes they are baked
 *   and unavoidable. The alternative had two — a CSS copy and a JavaScript
 *   copy — which is doc 01 §7's two ways to do one thing, in the one place
 *   where they must agree exactly.
 * - **No unit conversion.** A token resolves to `24rem`, and turning that into
 *   pixels needs the root font size, which means reading the document — the
 *   thing P3 keeps this library out of.
 * - **Failure stays harmless.** With no container query support the value is
 *   never reassigned and the answer is `base` forever, which is §4.1's
 *   narrow-first rule arriving on its own.
 *
 * The prediction is withdrawn in the document rather than deleted, and the
 * asymmetry §4.0 records does not reverse: it disappears, because there is
 * only one mechanism left to be asymmetric about.
 *
 * ## The first paint is always the narrowest structure
 *
 * A `ResizeObserver` reports after layout, so the first render has nothing to
 * read. Rule 3 forbids painting one structure and swapping it, and §4.1
 * establishes that the narrow layout is the one that is safe at any width — so
 * the two combine into something mechanical rather than a judgement call:
 * start at `base`, widen once measured. A component that paints its wide
 * structure first and corrects itself is the jump rule 3 names.
 */
export function useContainerStep(
  ref: React.RefObject<Element | null>
): ContainerStep {
  const [step, setStep] = useState<ContainerStep>('base');

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    /*
     * Read from the element's own computed style, which is where the container
     * query has already put the answer. `getPropertyValue` on a custom
     * property returns the specified text — `narrow`, not a length — which is
     * exactly what is wanted here.
     */
    const read = () => {
      const value = getComputedStyle(element)
        .getPropertyValue('--bb-step')
        .trim();
      setStep(
        value === 'narrow' || value === 'medium' || value === 'wide'
          ? value
          : 'base'
      );
    };

    /*
     * WHERE THERE IS NO OBSERVER, THE ANSWER STAYS `base`.
     *
     * jsdom implements neither `ResizeObserver` nor container queries, and a
     * server renders no layout at all — so both get the narrowest structure,
     * which §4.1 establishes is the one that is safe at any width. The unit
     * tests of anything built on this hook therefore see its FLOOR and nothing
     * else, and that is not a gap to be patched with a fake: it is the same
     * answer a first paint gives, and the wider structures are measured in a
     * browser where they exist.
     */
    if (typeof ResizeObserver === 'undefined') return;

    /*
     * `ResizeObserver` and not a viewport listener: P4, and the whole reason
     * this hook exists. It is also JavaScript observing the DOM, which
     * decision 0006 declined to ship as a polyfill — the difference is scope
     * rather than principle: one observer inside one component that asked for
     * it, against a global one standing behind every query on the page.
     *
     * It fires once on observation, so the correct step arrives in the first
     * frame — after the first paint, which is the point above.
     */
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return step;
}

/**
 * The classes an observed element needs, so the four steps are declared in one
 * place instead of once per component.
 *
 * Not a `cx()` call: this is a fragment meant to be composed into a
 * component's own class list.
 */
export const CONTAINER_STEPS =
  'bb:[--bb-step:base] bb:@narrow:[--bb-step:narrow] bb:@medium:[--bb-step:medium] bb:@wide:[--bb-step:wide]';
