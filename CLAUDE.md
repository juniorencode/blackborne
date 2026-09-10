# Working in this repository

Guidance for AI agents. Read this before touching anything.

## What this is

Blackborne is a React UI component library for **management applications**:
internal dashboards, CRUD screens, dense forms, listings with filters and data
tables. It is published to npm and consumed by independent projects.

It is **being rewritten from scratch**. Nothing from the previous `0.1.1`
codebase is carried over — not a component, a prop name, a DOM structure or a
test id. The old code is available under the `v0.1.1` tag, but it is not a
reference: it is the thing being replaced. Do not read it for guidance and do
not copy from it.

## Where things are

```
packages/blackborne/   the published package
apps/catalog/          the visual catalog (Storybook), and the browser checks
docs/                  the source of truth
.github/               CI, issue and pull request templates
```

**`docs/` is the source of truth — not the code, and not this file.** If this
file and a document under `docs/foundations/` disagree, the foundation wins and
this file is out of date. Fix this file.

## Where the project stands

`docs/README.md` carries the phase table and is kept current. Check it before
assuming anything exists.

At the time of writing: all ten foundations are written, the pipeline is
complete, and **thirty-nine components exist** — the ten simple fields and
controls, `Button`, the flat pieces around them (`Alert`, `Badge`, `Card`,
`EmptyState`, `Separator`, `Skeleton`, `Spinner`, `VisuallyHidden`), seven
layers (`Dialog`, `Drawer`, `ConfirmDialog`, `Tooltip`, `Popover`, `Preview`,
`Toast`), and the composition batch so far: `Accordion`, `Collapsible`, `Link`,
`Breadcrumbs`, `Pagination`, `CursorPagination`, `Menu`, `Select`, `Tabs` and
`SplitButton`. `ComboBox` is the thirty-seventh and the first of the batch
that follows; `Calendar` and `RangeCalendar` are the thirty-eighth and
thirty-ninth.

**The layer batch is finished.** It landed in that order, with `Toast` last by
decision (doc 08 §7.1). `Menu` was deliberately not in it.

**The composition batch is finished**, and so is the layer batch it was waiting
on. It was split in two halves with `Menu` and `Select` in between — the plan
and the reason are in [the catalog](./docs/catalog-and-build-order.md) §3.1 —
and the first half, both middle components, `Tabs`, the collapsed breadcrumb
trail and `SplitButton` have all landed. The one
feature that did not is the page-size selector, and it is a **Never** rather
than a leftover — the question the catalog said to ask once `Select` existed
was asked, and how many rows to fetch belongs to the listing rather than to the
thing that moves between pages.

**The batch after composition is past its middle**, and it is SEVEN waves
rather than six — the shape is in
[the catalog](./docs/catalog-and-build-order.md) §3.2, which records the split
and why. Read that before starting one.

Five have landed: `ComboBox`, the same component holding **several** values as
a discriminated union rather than a flag, `useAsyncOptions` — a **hook**,
because paging and waiting are logic and P6's corollary forbids an assembly
with a capability its pieces lack — `Calendar`, with its three chained views,
and `RangeCalendar`, which shares all of that through `internal/Calendar` and
adds the second structural change in the library. What remains is `DateField`
with `DatePicker`, and `TimeField` with `DateRangePicker`. It spans three
levels, so the order is the dependency and not the level number.

**And the risk component paid for itself twice.** The catalog predicted that
per-option keywords would mean `ComboBox` filtered its own rows. It cannot: the
base builds its collection in a render pass **detached from the surrounding
context**, so a filter written there sees no query and keeps every option — the
list showed all three while the component's own render had narrowed them to one
([decision 0021](./docs/decisions/0021-a-combo-box-extends-the-bases-filter.md)).

Then holding SEVERAL values found the other half of the same wall: **a
`TagGroup` inside a `ComboBox` resolves the combo box's own list state** and
either exhausts the heap or throws, and every `Button` inside one wears the
toggle's props unless told to take no context
([decision 0022](./docs/decisions/0022-several-values-are-a-union-and-the-chips-are-not-tags.md)).
One context per collection, and the table suite is made of collections — which
is exactly what building the risk component early was for.

**And the third wave found a check of ours passing for the wrong reason**,
which is the failure mode this repository keeps paying for: a browser check
read "keep typing" while a request was in flight rather than because nothing
had been asked. `useAsyncList` loads once on mount whether anything told it to
or not, so a minimum query length has to be enforced inside the loader. The
check now asserts the request COUNT, which is a state rather than a moment.

**The fourth found three things by LOOKING at a baseline**, which is the layer
that catches what assertions cannot: a read-only calendar photographed
identically to an ordinary one — so there is no read-only calendar, for the
reason there is no read-only `Select` — today's ring vanished under the chosen
day's fill, making a claim in the code true of the markup and false of the
picture, and then the ring that replaced it turned out to be **below the
contrast floor** on the light side (1.86:1 where doc 03 §5 rule 2 asks 3:1).
That third one was only reachable because the reference had been made
reproducible first: every calendar in every baseline showed today ON the chosen
day, so the ordinary ring had never been photographed at all. Generate a
baseline, make it reproducible, and then open it.

**And the fifth wave was three defects deep in a picture nobody had taken.**
`RangeCalendar` shares the grid, the furniture and the chained views with
`Calendar` through `internal/Calendar` — extracted at the second caller, with
the three existing baselines coming out byte-identical as the proof. What it
added was found by generating a baseline and opening it: **a calendar in a flex
container stretched to 1248px** with cells 178 by 28, because a flex item's
display is blockified and `inline-flex` quietly became `flex`; **the range's
start painted twice**, once in each month, because the base marks
`data-selection-start` on the copy of a day in the neighbouring grid with no
`data-selected` on it; and **today's ring went white on a pale band** at
1.12:1, because `data-selected` means the accent fill in one calendar and a
soft band in the other.

It also corrected a sentence `Calendar` had already shipped. "A calendar that
must not be changed is disabled, with its chosen day still legible" is false —
measured on both calendars, controlled and uncontrolled: a disabled calendar
marks no selection at all. A value that must not be changed is a formatted
date.

**Two things were settled before it started**, in the wave that opened it:
[doc 07](./docs/foundations/07-forms.md) §2.2 gained a seventh contender for a
field's trailing edge — the disclosure chevron, which never competed while a
`Select` was the only field with one — and a date crosses the public boundary
as an ISO string rather than as the base's calendar object
([decision 0020](./docs/decisions/0020-a-date-crosses-the-boundary-as-a-string.md)).

The list that batch was read from proposed thirteen pieces, and §7 now carries
seventeen new rows saying what did not get in and why. Two of them are worth
knowing about before proposing anything: **the four catalogue fields are pure
functions rather than components**, because `Intl` already holds 418 time zones
and 162 currencies and names them in the locale received — and **an
asynchronous combo box is a hook**, because a component there would be an
assembly with a capability its pieces lack, which is the one thing P6's
corollary forbids outright.

`Progress` and `ButtonGroup` are still F8's two leftovers. `Progress` no longer
blocks nothing: a file uploader shows progress per file, so it goes first.

**Three things in it are settled and not open for reinvention:** a stepper is
two components and only one of them is ours (decision 0015), the two pagers do
not merge (decision 0014), and a link is a component, with navigation arriving
through the configuration the way the portal container does (decision 0016).

**N3 has now run, and the prediction beside it was wrong.** Doc 04 §6.1 wrote
the contract of the single structural-change hook before the hook existed, and
what landed with `Pagination` resolves no token: CSS publishes which step
applies through the same container variants a component would use at N2, and
`internal/useContainerStep` reads the resolved value on resize. §6.2 has the
measurement; §6.1 keeps its withdrawn text struck through. `Tabs` is the second caller
and the collapsed breadcrumb trail the third, and doc 04 §11.1 and §11.2 record
what they needed on top of the hook: a wrapping row for the widths a query
cannot judge, an observed element that outlives both structures, and — twice
now — a rule that a control must never hide a single thing. `Steps` calls the
same hook when it arrives, rather than inventing a second answer.

**The shared glyphs are drawn once**, in `src/internal` — the cross, the tone
marks, the chevron and the tick — and the tick is the one that is shared as a
PATH rather than as a component, because a checkbox's tick is one of two paths
in a single svg and cannot be a separate element. The cross reached four copies
with different geometry before anybody noticed, which is what all four exist to
prevent.

`Toast` is the one component that ships as **two pieces**: `useToasts()` makes
the queue, which the CONSUMER owns and keeps, and `ToastRegion` renders it. The
library holds no queue of its own, because P3 says it holds no global state —
and that is the shape to copy for anything else that looks like it needs a
singleton.

The shared parts of a layer live in `src/internal/Layer/`, and a new one takes
what applies to it: the scrim only if it dims the page, the panel and the sheet
if it has a header and a title, the twelve placements and the arrow if it is
anchored to a control. Two things it decides for itself are where the panel
lands and which of its edges is free.

**Three of those shared parts carry a decision, not just markup**, and all
three were measured: the panel declares a query container only where the width
is declared too; the sheet is what contains a layer's focus, so a layer that
must not contain it cannot use the sheet; and an anchored layer WRAPS the panel
rather than being it, because the panel clips and an arrow lives outside it.
The package guide has all three and doc 08 §4 has the second in full.

So the rules are settled and you should follow them rather than invent. Two
things to keep in mind anyway:

- **Some rules are openly open.** Document 08 §5.1 leaves it undecided whether
  a popover holding a small form may be dismissed by a click outside, and
  document 07 §4.1 leaves the space an error message occupies open. Where a
  document says something is unverified, treat it as unverified — do not
  quietly promote it. Document 08 §6's nested scroll lock used to be on this
  list and is now verified; the prediction written before the measurement is
  kept in §6.1, because a prediction recorded afterwards is worth nothing.
- **The file layout of a component is settled**, by `Button`, and written down
  in [`docs/contributing/new-component.md`](./docs/contributing/new-component.md) §0.

## Commands

| Command              | What it does                                                          |
| -------------------- | --------------------------------------------------------------------- |
| `pnpm install`       | Install. Uses the committed lockfile; versions never drift            |
| `pnpm verify`        | The full gate: format, lint, types, tests. Run before every PR        |
| `pnpm lint`          | ESLint, including this project's own rules                            |
| `pnpm typecheck`     | Types across the workspace                                            |
| `pnpm test`          | Vitest                                                                |
| `pnpm verify:full`   | Everything above, plus the browser and accessibility checks           |
| `pnpm build:catalog` | The package and the catalog, which the browser checks are served from |
| `pnpm format`        | Apply formatting                                                      |

Two levels, on purpose. `pnpm verify` is the fast gate and the same thing CI
runs first, so a green local run means a green first job. `pnpm verify:full`
adds the browser checks, which need Chromium and run as a separate CI job so
they never delay the fast one.

**The browser checks are served from the BUILT catalog, on port 6007** — not
from the dev server on 6006, which is for working on a story. The two ports are
kept apart deliberately: a dev server compiles each story on demand, which has
timed a story out three times under a full run, and a run that reuses whatever
server is up verifies whatever that server last compiled. `e2e/catalog.ts`
carries the reasoning. That is also what makes the suites safe to run in
parallel, and parallel is where the time went: 7.5 minutes of behaviour checks
became 2.7, and the accessibility suite — 357 checks in a single file, which
file-level parallelism cannot touch — dropped from 13.1 minutes to 4.6. **CI
was worse than any of that**, because Playwright uses one worker there by
default until told otherwise.

A browser is not optional pedantry: jsdom does not implement real tab order, so
it cannot say where focus goes, and it does not resolve CSS variables, so it
cannot say what colour an element ended up. A token bug that made dark mode do
nothing at all passed every unit test.

**After touching `pnpm-workspace.yaml`, `.npmrc` or anything about
dependencies, run `pnpm verify:clean`.** It removes every `node_modules` and
installs the way CI does. A local `pnpm install` reuses what is already
there, so a setting left in a pending state warns locally and fails only on
a clean install — which is how a branch that was green everywhere broke CI.

## Hard rules

These come from the foundations in [`docs/foundations/`](./docs/foundations/README.md),
which now hold the full reasoning. They are not style preferences, and a change
that breaks one does not merge.

1. **Semantic tokens only.** No literal colors, no primitive tokens inside a
   component. A component that references `--blue-600` is a defect, not a
   preference.
2. **No physical directions.** Always `start`/`end`, never `left`/`right`. RTL
   is supported from day one and this is half of that support.
3. **No literal user-facing strings** — including `aria-label` and every other
   accessibility label. An accessibility label is text a person reads, even
   though it is not seen.
4. **No viewport breakpoints** outside components rendered in a portal. A
   component adapts to its own container, because the same component can sit in
   a 320px panel inside a 1920px screen.
5. **No global state.** The library never writes to `document`, `localStorage`
   or a singleton, and never detects the user's language, theme or time zone.
   It receives them.
6. **No network.** No component makes a request or knows a URL. Data arrives by
   prop; effects are functions passed in.
7. **Logic lives in hooks or pure functions**, testable without rendering.
   Components paint and delegate. A new capability is a new hook, never one
   more prop on an existing component.
8. **Components are chosen; props are earned.** Which components exist is a
   deliberate decision — check the catalog. A new **prop or variant on an
   existing component** is different: it needs a real place that needs it
   today. "While we're at it" is the reason things rot, and it rots through
   props, never through the component count.
9. **Icons are received, never distributed.** They arrive as children, their
   size and colour come from the slot, and there is no `iconStart` prop and no
   `icon="save"` string. The convention is doc 02 §11.

Most of these are enforced by the project's own lint rules, in
`eslint.rules.js`, which run as part of `pnpm lint`. A rule you can argue with
in review is a rule that yields to the first deadline, so they are errors.

## How work lands

`main` is protected: no direct pushes, no force pushes, and CI must pass.

1. Branch from `main`: `feature/…`, `fix/…`, `docs/…`, `chore/…`
2. Run `pnpm verify`
3. Push the branch and open a pull request
4. Merge is by squash, so the PR title becomes the commit on `main`

Commit and PR format is defined in
[`docs/contributing/commits-and-prs.md`](./docs/contributing/commits-and-prs.md).
Two things to internalise: commits are Conventional Commits, and **commit
messages never carry a `Co-Authored-By` trailer**.

## Traps specific to this repository

Things that look like improvements and are not:

- **Do not upgrade TypeScript past 5.x.** TypeScript 7 exists, but
  `typescript-eslint` does not support it, and type-aware lint is what enforces
  the rules above. See `docs/decisions/0001-toolchain-versions.md`. Every
  version number would go up and the project would get worse.
- **Do not add a routing, icon or form library.** The library provides no
  routing, distributes no icons, and forces no form library. These were
  removed on purpose.
- **`react-aria` and `react-aria-components` are pinned exactly and move
  together.** `react-aria-components` depends on `react-aria` at an exact
  version, and we declare the same one directly for `UNSAFE_PortalProvider`
  (`docs/decisions/0013-…`). Bumping one alone puts two copies in the tree,
  which do not share the portal context — the symptom is a layer mounting in
  the wrong place, with nothing in the console.
- **Do not add a schema validation dependency.** The library restricts input
  and presents errors. Deciding whether a value is valid belongs to the
  consuming project.
- **Do not build a component that does everything through props.** Complex sets
  (tables, dense forms) ship as hooks + presentational pieces + a thin optional
  assembly. An assembly may not have a capability its pieces lack.
- **Do not rename props to match HTML.** The library uses `isDisabled` and
  `onPress`, following the headless base. This looks like a bug to fix and is
  not: see `docs/decisions/0007-prop-names-follow-the-base.md`.
- **Do not reimplement accessibility or a solved engine.** Dialogs, menus,
  focus and keyboard come from React Aria. Table state, drag and drop, rich
  text and phone formatting come from existing libraries. Building one by hand
  is the last resort and needs a written justification.
- **Do not style the base's `data-today`.** Every calendar cell carries one
  and it is the obvious hook. The base computes it from the browser's zone
  unless the value itself carries one, and doc 05 §3.1 is unambiguous about
  whose zone this library may use: today is marked from the configured zone or
  not at all
  ([decision 0023](./docs/decisions/0023-today-comes-from-the-configured-zone.md)).
- **Do not assume a component sized by its contents can be observed.**
  `useContainerStep` reads the step on resize, so an element whose own box does
  not change with the container never gets a callback — measured: a two-month
  range calendar is 408px wide in a 640px container AND in a 320px one, and the
  structure simply never changed. A structural component that shrink-wraps is a
  full-width frame plus a `w-fit` body
  ([doc 04](./docs/foundations/04-responsive.md) §11.3).
- **Do not put a date object in a public signature.** The base speaks
  `CalendarDate` and `ZonedDateTime`, and passing them straight through looks
  like the obvious thing to do. Dates cross as ISO strings — `2026-09-09` — and
  are parsed inside against the received time zone
  ([decision 0020](./docs/decisions/0020-a-date-crosses-the-boundary-as-a-string.md)).
  A JavaScript `Date` is not the alternative either: it is a timestamp, so
  `new Date('2026-09-09')` is the 8th in Lima and the 9th in Tokyo — measured,
  and the exact bug doc 05 §3.1 exists to prevent.
- **Do not let a picture or a check depend on the clock.** A component that
  knows what day it is today reads the clock, and no pinned prop reaches that:
  the calendar's own baseline failed CI on a time zone, and three of its
  browser checks were due to start failing the morning after they were
  written. `e2e/clock` fixes the instant for both, and
  [doc 10](./docs/foundations/10-quality-and-verification.md) §6.1 has the
  measurements — including the half that does not fail: photographed from a
  month with no today in it, a reference stops guarding what it was made for
  and goes on passing.
- **Do not widen a check to make it pass.** A check that fails on one machine
  and not another is measuring the machine rather than the component, and
  lowering its bar turns a real failure into a coincidence. The rule and the
  three measured examples are
  [doc 10](./docs/foundations/10-quality-and-verification.md) §11: counting
  animation frames asserts the frame rate, racing a 160ms transition asserts
  how loaded the CPU was, and comparing our today against the base own mark
  asserts the runner TIME ZONE. Speed, clock and configuration are the three,
  and they are all values the test did not set and cannot see.
- **Do not reference private projects** in code, examples or documentation. The
  library is public and its API is designed for strangers.

## When something is not covered

Say so. A missing rule is a missing line in a foundation document, and the fix
is to write that line — not to guess and move on. The foundations are changed
_before_ writing code that contradicts them, never afterwards to justify it.
