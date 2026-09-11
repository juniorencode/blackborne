# 0027 — The library hands over the shape; the project performs the act

**Status:** accepted · **Date:** 2026-09-11

## Context

The table suite was read against a real one: a hand-written data table from a
management product, around twenty thousand lines, with the features its users
had asked for over several years. The point of reading it was to decide what to
carry across.

Three of its features had **no answer anywhere in these documents**. Exporting
the visible rows to a spreadsheet or a PDF. Printing. Putting the search, the
filters and the page into the address bar so a screen can be shared as a link.

Four written rules point at the same answer for all three — P2 (no request and
no URL), P3 (no writing to `document`, which a client-side download is),
non-goal 1 (no routing) and non-goal 3 (no whole screens) — and **pointing is
not saying.** CLAUDE.md is explicit about what that gap means: "a missing rule
is a missing line in a foundation document, and the fix is to write that line —
not to guess and move on."

Worth being precise about why these three in particular were unanswered.
Non-goal 4 lists what a data table gets as first-class functionality — "search,
configurable filters, sorting by column, column reordering and pinning, row
dragging, a relative-index column and pagination" — and every one of those is a
thing the table **is**. Export, print and a shareable URL are things somebody
**does with** the table. That is a different kind of noun, and the list had
never had to name it.

## Decision

**The library hands over the shape. The project performs the act.**

Where a capability needs the library to know what the data is arranged like,
the library supplies that arrangement as state, through a hook. Where it needs
something to leave the process — a file written, a page printed, an address
changed, a request sent — the library supplies nothing and the project does it.

Applied to the three that raised it:

| Capability  | The shape, which is ours                                                         | The act, which is not                            |
| ----------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| Export      | the visible columns, in the order the person arranged them, with a text accessor | building the file, and handing it to the browser |
| Print       | nothing is hidden by our own horizontal scroll when the page is printed          | the print stylesheet and the page it lives on    |
| URL / query | every piece of state is controlled — a value and a callback                      | reading and writing the address                  |

The line is not "hard things are the project's". Two of the three are easy. It
is that the library is a set of pieces with no environment of its own: it does
not know whether there is a file system, a printer, a router, or a server, and
a component that assumes one of them is a component that fails in the projects
where there is not.

## What it costs

**The consumer writes the export.** Roughly: take the columns the hook reports,
read each row through the accessor it gives, hand the result to whatever writes
spreadsheets. That is theirs to keep working.

It buys two things that are easy to undervalue. The first is weight: the
product this was read from pulls `jspdf`, `jspdf-autotable` and `xlsx` for its
exports — around 1.5 MB of dependency — and doc 10 §7's budgets would not
survive shipping that to every consumer of a UI library, including the ones who
never export anything.

The second matters more. **What the table shows and what gets exported have to
be one decision**, and this shape makes it one by construction: both read the
same column state, so a hidden column cannot come back in the file. The product
this was read from got that right deliberately and it is the single best idea
in its export path.

One measured caution comes with it, and it is worth repeating wherever the
accessor is documented: that product downgrades date columns to text on the way
out, because the flattener would otherwise re-read them in the browser's own
time zone. That is doc 05 §3.1's bug arriving through the export instead of
through the formatter, and the text accessor is where it is prevented.

## Evidence rather than taste

The alternative was tried in the product this was read from, and its export is
**not** in the shared component: it is per-module hooks, one per screen, built
on the file libraries and handed to the table as one more toolbar button. The
shared component supplies exactly what this decision says it should — which
columns are visible, in which order — and nothing else.

So the boundary this draws is not a restriction invented here. It is where a
real product's boundary already fell, under no pressure from these documents,
when the same problem was solved by people who could have put the export
anywhere they liked.

## How it is held

Doc 01 §4.1 carries the rule. Three rows in the catalog's §7 carry the
individual answers, so the question does not have to be re-derived from four
principles each time somebody asks for a download button.

What would reopen it: a capability where the SHAPE cannot be handed over
without the act — where the library would have to perform the act to know the
arrangement at all. Nothing in the table suite is shaped like that, and if
something is, the table it appears in is the evidence.
