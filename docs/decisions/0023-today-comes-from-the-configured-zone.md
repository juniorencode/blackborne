# 0023 · Today comes from the configured zone, or is not marked at all

**Date:** 2026-09-09 · **Status:** accepted

## Context

A calendar marks today. Every calendar does, and it is the one mark on the
grid that is not about the value: it says where you are, so a month somebody
navigated to three years back still has a reference point.

Which day is today depends on a time zone, and
[doc 05](../foundations/05-languages-and-formatting.md) §3.1 is unambiguous
about whose: **the library never uses the browser's**, because the browser's
zone belongs to the machine of whoever is looking rather than to the context of
the data. The configuration carries one, and its own documentation says what
undefined means — "the consumer has not said, and any component that needs one
must ask for it rather than guess."

Then the base marks today by itself. Measured in `useCalendarState`: the
calendar's state derives a zone from the VALUE when the value carries one — a
`ZonedDateTime` — and from `Intl.DateTimeFormat().resolvedOptions().timeZone`
otherwise, which is the browser's. A `Calendar`'s value is a day and carries no
zone, so the second branch is the one that runs, and every cell gets a
`data-today` attribute computed from it.

So the attribute is right there, it is the obvious hook to style, and it is the
machine's answer to a question the library says only the consumer can answer.

## Decision

**Today is marked from the zone the provider supplies, and `data-today` is
never styled.**

With a zone configured, the component computes `today(timeZone)` and marks the
matching cell itself. With none, **nothing is marked** and it says so in
development:

> Calendar: no time zone is configured, so today is not marked.

## Reasoning

**The alternative is the bug doc 05 §3.1 exists to prevent**, arriving through
a mark rather than through a formatter. Two people opening the same screen from
two countries would see today on different days, and one of them would be
wrong about the only fixed point on the grid — silently, because a highlighted
cell looks equally correct wherever it lands.

**Not marking is a real answer rather than a shrug.** A calendar with no
reference point still works: it shows a month, it takes a press, and the value
it holds is marked. What it does not do is assert something nobody told it. And
the warning makes the fix one line — `timeZone` on the provider — where a wrong
mark makes nothing at all.

**It cannot throw**, because P3's test is that a lone component with no
provider renders correctly. So the third layer of doc 06's verification is
where this lands: a development warning, which is the same shape a missing
dictionary key has.

**And `data-today` staying unstyled has to be written down**, because it is not
a gap that looks like one — it is an attribute in the DOM with a plausible name
that a later change would reach for. The component's tests assert both halves:
that the base's mark is present, and that ours is absent when no zone is
configured.

## Consequences

- **A calendar needs the provider to be useful**, in a library whose principle
  is that defaults work (P3). The default still renders; what it cannot do is
  point at a day. That is the honest reading of doc 05 §3.1 rather than a
  softening of P3.
- **Two zones are in play and they answer different questions.** Which day it
  is TODAY needs the real zone. Formatting a month's name does not — a day has
  no zone at all, so the headings format against UTC, which is what keeps the
  ninth from printing as the eighth.
- **`@internationalized/date` becomes a declared dependency**, pinned to the
  version the base resolves and moving with it, because `today()` and
  `parseDate()` live there and `react-aria-components` re-exports neither. It
  was already in the tree; what changes is that the version is ours to control.
  The project's own lint rule stopped restricting it, with the reason recorded
  beside the rule.
- The same question arrives again for every component of this family — a range
  calendar, a date field, a picker — and the answer is this one. `today` is
  read once, in the component that draws a grid.

## Revisit when

- The base's calendar state accepts a time zone. Then `data-today` becomes
  correct by construction and this becomes a mark said twice.
- A screen needs two calendars in two zones at once. The provider is nestable,
  so that works today; what it would change is the assumption that one screen
  has one today.
