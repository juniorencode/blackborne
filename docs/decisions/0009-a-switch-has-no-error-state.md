# 0009 · A switch has no error state, and cannot be required

**Date:** 2026-09-04 · **Status:** accepted

## Context

A switch and a checkbox look interchangeable. Both are a small control with a
label, both hold a boolean, and most libraries treat the switch as a checkbox
with different styling.

The base does not force the question either way: `isInvalid` and `isRequired`
are accepted on its `Switch` and do reach the input as `aria-invalid` and
`aria-required` — verified while building. So excluding them is a decision, not
a limitation.

## Decision

**`Switch` accepts neither `isInvalid` nor `isRequired`.**

They are omitted from the type _and_ stripped at runtime. The type alone is not
a boundary: a JavaScript consumer, or anyone spreading a props object built
elsewhere, reaches the base regardless.

## Reasoning

The difference between the two controls is not visual, it is _when the value
takes effect_.

|              | Switch                   | Checkbox                   |
| ------------ | ------------------------ | -------------------------- |
| Applies      | The moment it is flipped | When the form is submitted |
| Announced as | on / off                 | checked / unchecked        |

From that, both exclusions follow:

- **Required means nothing.** Every switch always has a value. There is no
  state in which one is unanswered, so there is nothing to require.
- **Invalid is a contradiction.** There is no later moment at which a switch
  can be found wanting — it already took effect. If flipping it _can_ fail,
  then the failure belongs where the failure happened
  ([doc 09](../foundations/09-behavior.md) §4) and the switch returns to its
  previous position. Leaving it flipped with a red border tells the person the
  setting is on when it is not.

**The test for which control to use:** if there is a Save button, it is a
checkbox.

## Consequences

- A value that needs validating before submission is a `Checkbox`. That is not
  a workaround; it is the component that matches the behaviour.
- The catalog carries a story comparing the two side by side, because choosing
  the wrong one is the most common mistake with this pair and no amount of
  documentation prevents it as well as seeing them together.
- A test asserts the absence, with the reasoning written next to it. Someone
  will reasonably want to reverse this, and the test is where they will meet
  the argument.

## Revisit when

A real case appears where a switch must be validated before some later
submission — and check first whether it is actually a checkbox. If it is a
switch whose _action_ can fail, that is error presentation at the point of
failure, not an invalid state on the control.
