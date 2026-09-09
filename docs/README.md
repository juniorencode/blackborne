# Documentation

This folder is the **source of truth** for the project. If a discussion about
what to build is not settled by a document here, that document is missing a
line — fix the document, then write the code.

## How it is organised

| Folder          | What lives there                                                       | How often it changes                              |
| --------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| `foundations/`  | Permanent rules: what the library is, how it looks, what it guarantees | Rarely, and never to justify code already written |
| `decisions/`    | Dated records of a single decision and why it was taken                | Append-only                                       |
| `guides/`       | How to use the library                                                 | With the API                                      |
| `contributing/` | How to work on the library                                             | With the tooling                                  |

Foundations and the component catalog are kept apart on purpose: the catalog is
a living list that changes weekly, and mixing them would make the foundations
look less stable than they are.

## Start here

| If you want to…                                      | Read                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Understand what this library is and is not           | [foundations/01-principles.md](./foundations/01-principles.md)                                        |
| Add a component                                      | [contributing/new-component.md](./contributing/new-component.md)                                      |
| Open a pull request                                  | [contributing/commits-and-prs.md](./contributing/commits-and-prs.md)                                  |
| Know which components are planned, and in what order | [catalog-and-build-order.md](./catalog-and-build-order.md)                                            |
| Work with an AI agent                                | [../CLAUDE.md](../CLAUDE.md) and [../packages/blackborne/CLAUDE.md](../packages/blackborne/CLAUDE.md) |
| Know why a past choice was made                      | [decisions/](./decisions/README.md)                                                                   |

## Foundations

The full index, with what each one settles, is in
[foundations/README.md](./foundations/README.md).

| #   | Document                                                                 | Status  |
| --- | ------------------------------------------------------------------------ | ------- |
| 01  | [Principles and non-goals](./foundations/01-principles.md)               | Adopted |
| 02  | [API conventions](./foundations/02-api-conventions.md)                   | Adopted |
| 03  | [Tokens and theme](./foundations/03-tokens-and-theme.md)                 | Adopted |
| 04  | [Responsive and adaptability](./foundations/04-responsive.md)            | Adopted |
| 05  | [Languages and formatting](./foundations/05-languages-and-formatting.md) | Adopted |
| 06  | [Accessibility](./foundations/06-accessibility.md)                       | Adopted |
| 07  | [Forms](./foundations/07-forms.md)                                       | Adopted |
| 08  | [Layers and focus](./foundations/08-layers-and-focus.md)                 | Adopted |
| 09  | [Behavior and interaction](./foundations/09-behavior.md)                 | Adopted |
| 10  | [Quality and verification](./foundations/10-quality-and-verification.md) | Adopted |

Documents 02 and 08 were written last on purpose: they describe the things only
building can decide, and writing them from imagination would have produced
rules the first real component contradicted. Both mark what was verified in a
browser and what was not — 08 §6 leaves one check openly pending rather than
claiming it.

## Where the project stands

The library is being rewritten from scratch. Phases, in order:

| Phase | What                                                                               | State    |
| ----- | ---------------------------------------------------------------------------------- | -------- |
| F1    | Close the past: tag, prune branches, empty the repo, deprecate on npm              | Done     |
| F2    | Skeleton: workspace, root files, CI, templates                                     | Done     |
| F3    | Documentation for AI agents                                                        | Done     |
| F4    | Foundations, written in English                                                    | Done     |
| F5    | One day with React Aria — decided documents 02 and 08                              | Done     |
| F6    | Full pipeline with the first component (`Button`)                                  | Done     |
| F7    | The fields, and the browser checks that verify them                                | Done     |
| F8    | The rest of level 0 and level 1: the pieces with no dependencies                   | Two left |
| F9    | The layer base, and everything that depends on a portal                            | Done     |
| F10   | Composition: the pieces that arrange other pieces, and the first structural change | One left |
| F11   | Search, and the locale front nothing has proved yet                                | Half in  |

Which components exist and in what order is not a phase question: it lives in
[catalog-and-build-order.md](./catalog-and-build-order.md), which is the list
that changes weekly. The phases above only say which part of the architecture
is being proved.

**F8 is deliberately left open**, not finished and not abandoned: `Progress` and
`ButtonGroup` are the two pieces of level 1 still pending, and neither blocks
anything. F9 went ahead of them because the layer base is a bottleneck that more
than twenty components wait on, which is criterion 1 of the catalog's own
ordering. Recorded here rather than marked Done, because a phase table that
rounds up is a phase table nobody believes.

**F9 is closed.** The layer base and seven layers landed; `Menu` and `Select`
landed in the middle of F10 rather than here, by dependency, because three of
its features were waiting on exactly those two (catalog §3.1); and
`SplitButton`, which had been waiting on `Menu` since the batch began, landed
last. Nine layers and everything that depends on a portal.

**F10 has one thing left, and it is a batch rather than a leftover.** The
composition batch is finished — `Accordion`, `Collapsible`, `Link`,
`Breadcrumbs` with its collapse, both pagers, `Menu`, `Select`, `Tabs` and
`SplitButton` — and the page-size selector that was in the plan is now a
**Never**: the question the catalog said to ask once `Select` existed was
asked, and how many rows to fetch belongs to the listing. What remains under
this heading is the table pieces, which are hooks plus presentational parts and
their own piece of work, the same shape F8's two leftovers have.

**What F10 proves** is the one level of doc 04 that had never run: N3, a
structural change in JavaScript. Everything before it was N0, N1, N2 or the one
viewport exception. The contract was written in doc 04 §6.1 before the hook
existed, with the prediction it would be measured against — and the prediction
was **wrong**: the hook resolves no token, it reads a step CSS publishes. §6.2
has the measurement and §6.1 keeps the withdrawn text struck through, because a
prediction that is quietly deleted afterwards teaches nobody anything.

**F11 has begun, and it is the first phase about correctness rather than
structure.** Everything so far proved a mechanism: tokens, a portal, a
container query, a structural change in JavaScript. What none of it touched is
[doc 05](./foundations/05-languages-and-formatting.md)'s second front —
formatting — which that document calls the underestimated one: "translating
'Cancel' is trivial; having a date display in the correct order, with the
correct first day of the week, and sorted correctly, is not." A calendar, a
segmented date field and a time field are the first components whose
correctness depends on the locale, the calendar system and the received time
zone rather than on a measurement in pixels. `NumberField` leans on the
provider already, and it leans on one number.

The other half of the phase is the risk component, and **it has landed.**
`ComboBox` was the named risk since level 4 was drawn, on the grounds that it
stresses field, layer, keyboard, filtering, locale and long lists at once. The
composition model held. What did not hold was the plan for its filtering: the
catalog predicted that per-option keywords would mean the component filtered
its own rows, and that is impossible for a reason nothing here had met before —
the base builds its collection in a render pass detached from the surrounding
context, so a filter written there cannot see what was typed
([decision 0021](./decisions/0021-a-combo-box-extends-the-bases-filter.md)).
The filter extends the base's instead, and the prediction is kept beside the
measurement rather than quietly replaced.

**Four waves of seven have landed**: one value, several, options that arrive
from somewhere, and a calendar. (Seven rather than six: wave 4 was planned as
both calendars and `Calendar` filled it on its own — the catalog §3.2 records
the split and why.) The third is a **hook** rather than the second component
somebody proposed — `useAsyncOptions`, which is P6's corollary applied to a
request: paging, waiting and the states an empty list can be in are logic, and
an assembly may not have a capability its pieces lack.

**And the fourth is where the locale front starts being proved**, which is what
this phase is named for. A calendar's correctness is not a measurement in
pixels: it is which day is today, and that depends on a zone the library
refuses to guess ([decision 0023](./decisions/0023-today-comes-from-the-configured-zone.md)).
The base marks a today of its own from the browser's zone; this one marks the
provider's or marks nothing. `@internationalized/date` became a declared
dependency on the way, pinned like the other two, and one of the project's own
lint rules was corrected rather than worked around — it forbade the import
because the package was transitive, and it no longer is. The batch and its six waves are in
[catalog-and-build-order.md](./catalog-and-build-order.md) §3.2, with what was
deliberately left out of it.

Two lines were written before any of it, because a foundation is changed before
the code and never afterwards to justify it: a seventh contender for a field's
trailing edge (doc 07 §2.2 rule 5), and the shape of a date at the public
boundary ([decision 0020](./decisions/0020-a-date-crosses-the-boundary-as-a-string.md)).

Nothing from the `0.1.1` codebase is carried over. It stays available under the
`v0.1.1` git tag.
