# 0014 · Cursor pagination is its own component, not a mode

**Date:** 2026-09-08 · **Status:** accepted

## Context

Two pagers were proposed in the same batch. One moves through a known number of
pages: first, last, a window of numbers, an ellipsis where the numbers stop.
The other has only previous and next, because the server sends a cursor and no
total.

The instinct is one component with a mode, and it is a strong instinct: they
sit in the same place on a screen, they look nearly identical, and one of them
looks like a reduced version of the other.

## Decision

**Two components.** `Pagination` receives a total; `CursorPagination` receives
whether anything lies to either side. Neither has a prop that switches it into
the other.

## Reasoning

**They share no prop.** Offset pagination is given a total and a current page,
and from those two numbers everything else follows — the window, the first and
last, where the ellipsis goes. Cursor pagination is given two booleans. The
intersection of the two APIs is whether a button is disabled.

**A union of the two accepts the impossible.** A single component would have to
take a total _or_ a pair of booleans, and a type that permits both permits a
call site that passes both — which is the state that cannot exist. Doc 02 §3
rejects a boolean per variant for exactly this reason: a component that cannot
be in two states at once must not be typed as though it could.

**A mode prop changes what the other props mean**, which is the worst kind of
prop there is. Reading a call site would mean holding the mode in your head to
know what the rest of the line does.

**One of them cannot know the total, ever.** This is the part that settles it.
A cursor pager is not a smaller offset pager missing a feature — the number
does not exist on its side of the network, and no version of the component can
compute it. Two different questions that happen to be answered by two buttons
in the same corner.

**And P5 says which mistake to prefer.** One component too many sits apart,
gets imported by nobody, and can be deprecated away. One prop too many lives on
something people use, and removing it costs a major version.

## Consequences

- Two components, two sets of stories, two sets of browser checks. What they
  genuinely share — the chevron, the disabled state at the ends, the
  announcement while a page is loading — is internal and extracted, the way the
  cross and the tone surfaces were.
- A consumer moving from one data model to the other changes a component name.
  That is a visible, greppable change rather than a prop nobody notices, and
  the type errors point at every call site.
- The name says the data model, which is unusual in this library and is the
  weakest part of this decision. It was accepted because what is on screen is
  two buttons and a count, and "two buttons" is not a name. P2 is not affected:
  the component still receives everything and knows nothing about where it came
  from.

## Revisit when

A screen shows both models at once and wants them pixel-identical. That is an
argument about shared internals, not about merging two components. Or a better
name than `CursorPagination` turns up, which is a rename and not a reversal.
