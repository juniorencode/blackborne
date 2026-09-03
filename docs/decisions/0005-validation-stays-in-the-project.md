# 0005 · Validation stays in the project

**Date:** 2026-09-02 · **Status:** accepted

## Context

Two different things get called validation:

- **Input restriction** — what a field will not let you type. A numeric field
  rejecting letters, a phone number formatting as you type, an impossible date
  being untypeable, `min`/`max`, length limits.
- **Validation** — the judgement about whether a value is any good. Whether
  that phone number should exist, whether that date is valid for the operation,
  whether it conflicts with another field, whether it is already taken.

When the two are merged, business rules end up embedded in a component. That is
what turns a reusable field into a field that only works for one application.

## Decision

**The library restricts input and presents the error. The project decides
whether the value is valid, and writes the message.**

Fields expose "is invalid" and "error message" as inputs. Where those come from
is the consumer's business.

**No schema library is a dependency of this package.**

## Consequences

- The project uses whatever validation tool it likes, at whatever version, and
  can change it without the library caring.
- The library has to present errors correctly regardless of origin: associated
  with the field, announced when they appear, distinguishable without color
  (doc 06). That is the part it owns, and it owns it completely.
- **The library does not decide when an error is shown** — on blur, on submit,
  while typing — but it must permit all of them. The one thing it does fix: no
  error before the field has been touched.
- No form generator from a schema, ever (doc 07, §9). It would require exactly
  the dependency this decision refuses.

## Revisit when

Never for the dependency. If both projects converge on identical presentation
logic, that presentation logic may move in — but the judgement about validity
does not.
