# 0020 · A date crosses the boundary as a string

**Date:** 2026-09-09 · **Status:** accepted

## Context

The batch that follows composition builds a calendar, a date field, a date
picker, a range picker and a time field. Every one of them rests on the base's
date layer, which speaks the objects of `@internationalized/date`:
`CalendarDate` for a day with no time in it, `CalendarDateTime`, `ZonedDateTime`
for an instant somewhere, and `Time`. That package is already in the tree at
3.12.4, as a dependency of the base rather than one of ours.

So there is one question to answer before any of those components exist, and it
is answered once for all five: what does a consumer write?

```tsx
<DatePicker value={parseDate('2026-09-09')} />   // the base's object
<DatePicker value="2026-09-09" />                // a string
```

It has to be decided first because it is not a prop, it is the shape of the
value — and a value shape cannot be changed later without breaking every screen
that stores one.

## Decision

**An ISO 8601 string, in and out, on every component of the family.** Three
shapes, one per kind of value:

| Kind                     | What crosses                              |
| ------------------------ | ----------------------------------------- |
| A day                    | `2026-09-09`                              |
| A time                   | `14:30`, with seconds if asked for        |
| An instant with its zone | `2026-09-09T14:30:00-05:00[America/Lima]` |

The zone is named in full, because that is the form `parseZonedDateTime` reads
and writes — an offset alone does not say which zone, and two zones share an
offset for half of every year.

A range is two of them — `{ start, end }` — and `null` is the empty value, as
it is everywhere else in this library.

The conversion happens **inside**, with `parseDate`, `parseTime`,
`parseDateTime` and `parseAbsolute`, the last of which takes the time zone the
provider supplies. The base's objects live between the parse and the render and
never appear in a signature a consumer reads.

## Reasoning

**The precedent is already in the library, one level down.** `Select` publishes
`selectedKey?: string | null` where the base has `Key`, which is
`string | number`. The same narrowing, for the same reason: the base's type is
wider than anything a screen needs, and a consumer should not have to learn it
to set a value.

**A base type in a public signature is a thing the catalog has refused twice.**
`routerOptions` and `useHref` are pending a case because `RouterOptions` is an
interface consumers augment by declaration merging, so exposing it means
documenting that mechanism; `parseColor` is pending for the same reason. A date
object is the same shape of debt, except larger — it would land in five
components at once and in every handler they call.

**A JavaScript `Date` is not the alternative, and this is the measurement that
settles it.** A `Date` is a timestamp, so there is no such thing in it as a day
without a time, and a day given to one acquires a zone it never had:

```
new Date('2026-09-09')  →  2026-09-09T00:00:00.000Z
  displayed in Lima     →  Tuesday, 8 September 2026
  displayed in Tokyo    →  Wednesday, 9 September 2026
```

One value, two different days, decided by where the person looking happens to
be. That is the bug [doc 05](../foundations/05-languages-and-formatting.md)
§3.1 exists to prevent, arriving through the value rather than through a
formatter.

**A string is a value rather than a type from somewhere else.** It survives
JSON, a query string, a form post, a database column and the boundary between
two languages — which is where the dates of a management application actually
come from and go to. Nothing has to be constructed before a component can be
rendered, which is also what keeps the entry gate's "works with no provider
around it" honest for this family.

## Consequences

- Every component of the family takes `value?: string | null` and calls
  `onChange` with the same, plus `minValue` and `maxValue` as strings.
- **An invalid string is a developer's mistake, not a user's**, so it warns in
  development and the field renders empty. It does not throw: a component that
  crashes a screen over a malformed prop is worse than one that shows nothing
  and says why in the console.
- **The time zone becomes load-bearing.** An instant is read and written
  against the zone the provider supplies, never the browser's, and a component
  of this family with no provider around it uses the default the provider
  declares rather than asking the machine.
- **`isDateUnavailable` receives a string**, and that is the one consequence
  worth watching. It is the callback that answers "no weekends", "not while the
  office is closed" — and a consumer answering it from a string either reaches
  for `new Date`, which is the trap measured above, or installs
  `@internationalized/date` themselves. The library exports the predicates it
  needs internally; if consumers end up importing the base's date package to
  answer this one callback, then the dependency has crossed the boundary anyway
  and this decision is the thing that was wrong.
- **Which calendar system a returned value carries is not asserted here.**
  `parseDate` yields a Gregorian date, the base displays in the locale's
  calendar, and 18 calendars are reachable through `Intl` today. What comes
  back out of a Buddhist or Islamic locale is measured in the wave that builds
  `Calendar`, not predicted in this file.

## Revisit when

- Consumers import `@internationalized/date` to answer `isDateUnavailable`, or
  to do arithmetic the string form made awkward. That is the signal this
  decision moved a cost rather than removing one.
- A screen needs two different time zones at once — an appointment made in a
  branch's zone, shown in the customer's — because that is the case a single
  received zone cannot express, and the answer is not a wider value type but a
  second declared zone.
