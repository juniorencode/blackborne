# 0015 · A stepper is two components, and one of them is the project's

**Date:** 2026-09-08 · **Status:** accepted

## Context

A `Stepper` was proposed with pending, active, completed, disabled and error
states, both orientations, a compact form, a title, a description and an icon
per step, controlled and uncontrolled operation, permission to skip steps or
not, a narrow form showing only the indicators, and the tabs ARIA pattern
underneath it all.

Every item on that list is reasonable. The list as a whole describes two
components.

## Decision

**It is not built as one component.**

- The half that **reports** becomes `Steps`: pending, active, completed, error,
  with the current step marked, navigating nothing. It goes in level 1 beside
  `Progress`.
- The half that **navigates** is `Tabs` with disabled tabs, which already
  exists and needs nothing added to it.
- **Permission to skip is not the library's**, in either half.

## Reasoning

**Two components share the word.** An indicator reports where somebody is in a
process something else is driving. A wizard navigator is a control they
operate. One is read; the other is pressed.

**Built as one, its semantics become a prop.** It would need two ARIA patterns
and a flag choosing between them, and doc 06 §2 ends on exactly this: a
component may add the layout and may not add the ARIA.

**The tabs pattern is wrong for the reporting half.** Tabs announce "tab 3 of
5" and imply that the arrow keys move freely between them. An indicator has
nothing to select. And a step nobody may reach yet would have to be a disabled
tab, which is doc 06 §4 rule 7 — a control switched off with no way to know
why. A list with the current step marked says the true thing and promises
nothing it cannot do.

**Permission to skip is validation.** Whether step 3 may be opened is whether
steps 1 and 2 are complete, and that is non-goal 5 and
[decision 0005](./0005-validation-stays-in-the-project.md). The library cannot
know it. The consumer disables the steps that are out of reach, with a prop
that exists already.

**And the name is taken.** In this library "stepper" already means the
increment and decrement buttons of a numeric field: the dictionary calls them
that, the catalog calls them that, and
[decision 0011](./0011-the-stepper-is-opt-in.md) is titled after them. Doc 02
§3.1 set the precedent when `compact` collided with the density axis — a word
that means two things costs somebody an afternoon, once, at the worst possible
moment.

## Consequences

- `Steps` enters level 1 with no dependencies. It and `Progress` answer the
  same question — how far along — with different amounts of detail, so
  whichever is built second reads the first, or the library ends up with two
  vocabularies for one idea.
- Its states reuse what exists: the tone glyphs and the tone surfaces that
  `Alert` and `Toast` already share, so a step in error looks like every other
  error in the library rather than like a new one.
- `compact` is not one of its sizes. Doc 02 §3.1: `sm | md | lg`, and compact
  belongs to the density axis.
- A wizard is buildable by a consumer today out of `Tabs`, and that is not a
  workaround. The rules of the flow are theirs, and they are the only ones who
  know them.
- The narrow form — indicators only, scrolling — is a structural change, so it
  waits for the hook in doc 04 §6 like the rest of its batch.

## Revisit when

A screen needs an indicator and a navigator wired together so tightly that
keeping them apart duplicates state. Even then the answer is more likely a
shared hook than a merged component (P6), and the question to ask first is
whose state it is.
