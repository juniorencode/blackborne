# 0012 · Growing with the content is a prop, not a public hook

**Date:** 2026-09-07 · **Status:** accepted

## Context

`TextArea` shipped with a comment on its `rows` prop that argued against the
feature now being added:

> Growing with the content is a capability rather than a default, so it is a
> hook when someone needs it, not a prop here (P6).

That reading of P6 is the one the principle invites — a capability is a hook,
never one more prop — and following it here produces something worse than what
it forbids.

## Decision

**`isGrowable` is a prop on `TextArea`.** The logic lives in a hook, and that
hook is internal and not exported.

## Reasoning

**P6's own test fails.** The principle asks for logic in "hooks or pure
functions, testable without rendering". Growing to fit content is a
_measurement_: it reads `scrollHeight` off a real element in a real layout.
There is nothing to test without rendering, because there is nothing that
exists without a layout. A hook that can only be tested in a browser is not
what P6 is describing.

**A public hook would need the consumer to own the wiring.** They would attach
a ref, call the hook, and re-apply an inline height — for behaviour the
component is already in the best position to perform, on an element it already
owns. That is the shape non-goal 10 rejects from the other direction: it hands
the consumer the internals instead of the result.

**The prop is what P5 asks for.** It is off by default, it changes nothing for
anyone not using it, and it names one behaviour rather than opening a hole.

So the split is: the logic is a hook because logic belongs in one, and the hook
is private because its only correct caller is the component.

## Consequences

- The stale comment on `rows` is replaced. A written argument that the code now
  contradicts is worse than no comment, and this record is where the reversal
  is visible.
- `TextAreaProps` reaches fourteen named props, against the roughly fifteen
  [doc 01](../foundations/01-principles.md) §7 names as a signal. The next prop
  on this component should be argued for against that number, not added to it.
- Two limits are documented rather than solved, because both need a
  `ResizeObserver` and nothing in the library uses one: the height answers the
  value, so re-wrapping caused by a narrower container leaves the box short
  until the next change, and a field hidden and shown again returns to its
  floor. Neither loses work.

## Revisit when

`field-sizing: content` has been supported long enough to meet the bar
[decision 0006](./0006-no-container-query-polyfill.md) sets — support settled
for years, not months. Then the hook is **deleted** rather than kept beside the
CSS: two mechanisms for one behaviour is exactly what doc 01 §7 warns about,
and the browser checks run on Chromium, where the CSS route would always win
and the JavaScript one would become the only path in the library that nothing
ever exercises.
