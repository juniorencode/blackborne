# 0010 · The Card declares the container

**Date:** 2026-09-06 · **Status:** accepted

## Context

[Doc 04](../foundations/04-responsive.md) is built on one decision: a component
adapts to **its container**, never to the window. Level N2 of its hierarchy —
the container query — is how that is meant to happen, and the container scale
is already defined in the theme (`--container-narrow`, `--container-medium`,
`--container-wide`).

None of it can be used yet, because a container query asks the nearest ancestor
that has **declared itself a query container**, and no component in the library
declares one. The mechanism is fully specified, fully tokenised, and inert.

Somebody has to be first. `Card` is the obvious candidate: it is, literally, a
region with a width of its own, which is the thing a container is.

## Decision

**`Card` sets `container-type: inline-size`.** Its contents can query its
width, and every component placed inside a Card gets a real container without
the consumer configuring anything.

The container is unnamed. A named container would only be queried by whoever
knows the name, which is safer against accidental matches and worse at the one
job this is for: making N2 work by default for whatever is dropped inside.

## Reasoning

**It is the only way N2 stops being theory.** An entire foundation rests on
container-over-viewport, and until something declares a container, every
component that wants to adapt depends on the _consumer_ having declared one —
which the library cannot guarantee and should not require.

**Failure is benign.** Doc 04 §4.1 requires queries to be written narrow-first,
so a query that does not match leaves the component in its narrow layout, which
is usable at any width. The cost of being wrong here is a lost optimisation,
not a broken screen. That asymmetry is what makes this safe to do before a real
consumer exists.

**The main cost points the same way the rules already do.** Inline-size
containment means the Card no longer sizes itself to its content in the inline
axis: it takes the width its parent gives it. That is a behaviour change, and
it is also what doc 04 §3 already asks for — "nothing has a fixed width, use
max-width". A Card that shrink-wrapped its content was already swimming against
that rule.

## Consequences

Two follow automatically, in every Card, including in projects that never write
a container query:

1. **The Card does not shrink-wrap.** Placed in a flex row expecting it to be
   as wide as its text, it will not be. This produces no error — it looks
   wrong, which is the harder kind to trace, and is the reason it is written
   here.
2. **It becomes the containing block for absolutely and fixed positioned
   descendants.** Our own layers are unaffected: they render in a portal
   ([doc 08](../foundations/08-layers-and-focus.md)). A consumer's own
   `position: fixed` element inside a Card is affected — it will position
   against the Card rather than against the window.

And one that is the point of the exercise:

3. **Container queries inside a Card work with no setup.** This is the first
   component in the library whose N2 behaviour can be verified at all.

**It is verified in a browser.** jsdom implements neither containment nor
container queries, so a unit test cannot tell whether this is in effect —
the same reason the visual harness exists
([doc 10](../foundations/10-quality-and-verification.md)).

## Revisit when

A consumer reports the shrink-wrap or the containing-block consequence as a
real problem in a real screen. The fallback is not to remove it: it is to name
the container, which keeps N2 working for anything that asks for the Card by
name while narrowing what matches by accident.
