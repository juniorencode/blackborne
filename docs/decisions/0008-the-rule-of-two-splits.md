# 0008 · The rule of two splits: components are chosen, props are earned

**Date:** 2026-09-03 · **Status:** accepted
**Amends:** [01 · Principles](../foundations/01-principles.md), P5

## Context

P5 read: a component does not enter until **two** consumers ask for it, a prop
is not generalised until **two** consumers need it, and a variant is never
added just in case.

It was written on the assumption that two reference applications would be
developed alongside the library and act as design pressure. That has not
happened yet. The library has no consumers.

The result is a rule that cannot be satisfied, and one that has therefore been
waived twice in a row. `Button` and `TextField` both entered under the
"bottleneck" exception the build order sanctions. A third and fourth waiver
were already visible on the roadmap.

A rule waived every time is the worst of the three available states. It is not
enforcement, and it is not absence — it is friction that produces a paragraph
of justification in every pull request while changing no decision.

## What the rule was actually protecting

Worth separating, because the rule was taking credit for work it does not do.

**Not quality.** Accessibility, RTL, languages, dark mode, the 320px container,
every state in the catalog — the other eleven boxes of the entry gate — do not
depend on it. Nor do the other five principles, which carry almost all of the
architectural weight.

**Scope, and specifically the cost of being wrong.** And there the two halves
of the rule are not symmetric at all:

|                        | Cost of a mistake                                                               |
| ---------------------- | ------------------------------------------------------------------------------- |
| One component too many | Low. It sits apart, nobody imports it, it is deprecated and gone                |
| One prop too many      | High. It lives on a component people do use, and removing it is a major version |

Every warning sign in §7 of the principles — five hundred lines, fifteen props,
loose booleans, "since we're already here" — is about props. Not one is about
how many components exist.

## Decision

**The rule splits along that asymmetry.**

- **Which components exist is a decision, not a demand.** The catalog is chosen
  deliberately. A component still passes every other gate; nothing about
  quality relaxes.
- **A new prop, variant or entry point on an existing component still needs a
  real case.** One is enough — the bar drops from two to one — but it has to be
  a place that actually needs it today, not a situation someone can imagine.

## Consequences

- The entry gate keeps all its boxes; the first one changes from a question
  about consumers to a question about the catalog.
- While counting them for this change, the gate turned out to hold **thirteen**
  boxes, not the twelve every document claimed. The error came from the private
  notes the foundations were written from and was carried over faithfully.
  Corrected everywhere.
- The component request template stops asking people to name two consumers and
  starts asking what they do today instead, which was always the field that
  revealed whether something was a new component or a missing prop.
- The deferrals in the catalog that rested on "no demand yet" are re-examined:
  some were really deferred for a different reason, and those reasons are now
  stated directly.
- The protection that mattered is kept where it mattered. The thousand-line
  component is still prevented, because it is built one speculative prop at a
  time and that route is still closed.

## Revisit when

Two real consumer applications exist and are using the library. At that point
the original rule becomes satisfiable, and the question of whether the
component half is worth restoring can be asked with evidence rather than
intention.
