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
complete, and **fifty-two components exist** — the ten simple fields and
controls, `Button` with `ButtonGroup`, `Slider`, the flat pieces around them
(`Alert`, `Avatar`, `Badge`, `Card`, `EmptyState`, `Progress`, `Separator`,
`Skeleton`, `Spinner`, `Steps`, `VisuallyHidden`), seven
layers (`Dialog`, `Drawer`, `ConfirmDialog`, `Tooltip`, `Popover`, `Preview`,
`Toast`), and the composition batch so far: `Accordion`, `Collapsible`, `Link`,
`Breadcrumbs`, `Pagination`, `CursorPagination`, `Menu`, `Select`, `Tabs` and
`SplitButton`. `ComboBox` is the thirty-seventh and the first of the batch
that follows; `Calendar` and `RangeCalendar` are the thirty-eighth and
thirty-ninth, and `DateField`, `DatePicker`, `TimeField` and
`DateRangePicker` are the date family.

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

**All seven have landed and the batch is finished.** `ComboBox`, the same
component holding **several** values as a discriminated union rather than a
flag, `useAsyncOptions` — a **hook**, because paging and waiting are logic and
P6's corollary forbids an assembly with a capability its pieces lack —
`Calendar` with its three chained views, `RangeCalendar` with the second
structural change in the library, and the four of the date family:
`DateField`, `DatePicker`, `TimeField` and `DateRangePicker`. Everything they
share is in `internal/Calendar` and `internal/Field`.

**The three rows that were only ever sequencing are next**, and the order is
in [the catalog](./docs/catalog-and-build-order.md) §3.3 with the reason:
`Avatar`, then the colour controls, then the file uploader. **All three have
landed and that batch is finished** — `Avatar`, `ColorSwatchField`,
`ColorPicker` and `FileUpload`. `Avatar` went first because it shares a wall
with the uploader that nothing else shares — a box holding an image that may
not arrive, with something in its place, which a thumbnail needs as much as a
face does — and the palette went second because it settles the colour boundary
with the least machinery around it
([decision 0024](./docs/decisions/0024-a-colour-crosses-as-a-string-and-the-format-is-declared.md)). Three
things were settled in writing before any of it: initials are not derived from
a name ([doc 05](./docs/foundations/05-languages-and-formatting.md) §4.2), a
colour crosses as a string in the format it arrived in, and the uploader does
not upload.

**And the uploader took one wave where the catalog planned two.** §3.3 split it
into "the zone and the list" and then "the restrictions and the errors", and
the second half turned out to be four props and no new machinery: `accept`
narrows what the dialog offers, and every error is text the PROJECT wrote,
because the component never sent anything and cannot know. What it did need was
an instrument — a drop built in the page delivers no file, measured, so the
check drives a real drag through the DevTools protocol
([doc 10](./docs/foundations/10-quality-and-verification.md) §11.1).

**And the original plan is finished.** `TimePicker` was the last row of it —
the choosing half of a time control, and where a minute step belongs — and it
landed as a `Select` with its rows GENERATED rather than as the columns in a
layer the catalog imagined. A step bounds the count, and a select already owns
the trigger, the panel, the list's width, the tick, the typeahead and the whole
keyboard: columns would have been a second mechanism for a job already done
(doc 01 §7). The row records both that correction and the one about
[doc 07](./docs/foundations/07-forms.md) §2.2a, whose third case was expected
there and did not arrive — a component that owns its own options can provide
rule 5's route itself, and this one does.

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

**And the sixth wave changed a foundation rather than working around it.**
Doc 07 §2.2 rule 5 says a field that opens a layer keeps the chevron and has no
clear button, and its reason is that clearing has a route costing no width — an
option that returns to no value, or the cross each value carries. A date field
has neither, and measured, its segments cannot even report being emptied:
clearing the month and the day leaves the reported value at the last complete
date and the year segment does not clear at all. Where the premise is false the
conclusion does not follow, so **[§2.2a](./docs/foundations/07-forms.md) is a
bounded exception with four conditions**, every one of them a browser check,
and the date family is the only thing in this library with two controls at one
edge.

**And the last wave gave doc 04 §5 its first caller in JavaScript.** That
section has always granted the viewport exception to components rendered in a
portal, and until now nothing needed it: `Dialog` answers its own question in
plain CSS, which is what a presentational change should do. A range calendar
inside a popover cannot — how many months it builds is a PROP of the base's
state, and a container query collapses inside a content-sized layer. So
`internal/useWindowFits` is the one door, the project's lint rule now names
`matchMedia` so reaching past it is an error, and the number lives in the
component with the reason beside it.

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

**F8 has no leftovers left**, and its last three each left something behind.

**`Progress`** unblocks the file uploader — a bar per file was the dependency,
not a nicety — and it found a trap for anything outside `Field` that hides a
label: the base's own `Label` is what takes the id the bar points
`aria-labelledby` at, so a plain span is wired to NOTHING and a hidden label
leaves the control nameless. The first version of the component did exactly
that.

**`Steps`** is the fourth caller of doc 04 §6's hook and the first that needed
no new rule, which is what three levels of the hierarchy sharing one mechanism
looks like when it is finished (§11.4).

**`ButtonGroup`** closed the phase, and what it found is a rule about every set
that sends a variant down a context (doc 02 §3.1.1): **the context crosses a
portal.** A layer opened from inside the group was inside the group — measured
with a probe in a popover's footer, which read `primary/sm` inside a row of
small primary buttons. Four of the five layers close the set at one call site
because they share the sheet. The exposure is the MEMBER TYPE rather than the
mechanism, which is why `RadioGroup` never met it: a radio inside a dialog
inside a radio group is not a thing, and a button inside a dialog inside a row
of buttons is ordinary.

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
now — a rule that a control must never hide a single thing. `Steps` is the
fourth caller and needed nothing new, which is §11.4.

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

| Command              | What it does                                                           |
| -------------------- | ---------------------------------------------------------------------- |
| `pnpm install`       | Install. Uses the committed lockfile; versions never drift             |
| `pnpm verify`        | The gate: format, lint, types, tests, and the package. Before every PR |
| `pnpm lint`          | ESLint, including this project's own rules                             |
| `pnpm lint:rules`    | Fires and silences each of those rules, in both directions             |
| `pnpm check:claims`  | The numbers the documents state as fact are still true                 |
| `pnpm typecheck`     | Types across the workspace                                             |
| `pnpm test`          | Vitest                                                                 |
| `pnpm verify:full`   | Everything above, plus the browser and accessibility checks            |
| `pnpm build:catalog` | The package and the catalog, which the browser checks are served from  |
| `pnpm format`        | Apply formatting                                                       |

Two levels, on purpose. `pnpm verify` is the fast gate and the same thing CI
runs first, so a green local run means a green first job. It builds the package
and checks it — doc 10 §3's `Package` layer, which prices itself at "Fast" and
measures about fifteen seconds — because nothing here consumed the built
artefact until that layer existed, and the first run found four components
published with no CSS and a type surface that was `any` under Node's own module
resolution. `pnpm verify:full`
adds the browser checks, which need Chromium and run as a separate CI job so
they never delay the fast one.

**The browser checks are served from the BUILT catalog, on port 6007** — not
from the dev server on 6006, which is for working on a story. The two ports are
kept apart deliberately: a dev server compiles each story on demand, which has
timed a story out three times under a full run, and a run that reuses whatever
server is up verifies whatever that server last compiled. `e2e/catalog.ts`
carries the reasoning. That is also what makes the suites safe to run in
parallel, and parallel is where the time went: measured when the behaviour
suite was 253 tests, 7.5 minutes became 2.7, and the accessibility suite — one
file, which file-level parallelism cannot touch — dropped from 13.1 minutes to
4.6 at 357 checks. **CI was worse than any of that**, because Playwright uses
one worker there by default until told otherwise. Those are measurements of a
moment and of a machine, so they are dated by the size of the suite rather than
restated: both have since grown, and what they argue is which lever applies to
which shape (doc 10 §12).

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

**And a version ships by pushing a tag, which is a bigger door than it looks.**
`main`'s protection guards what LANDS on main; publishing is triggered by a
tag, and a tag can be made from any commit on any branch. So `release.yml`
opens with a guard job that asks what protection cannot — the tagged commit is
an ancestor of `main`, the tag names the version `package.json` will actually
publish, that version is not already on npm, and the changelog has a section
for it. It then runs the full pull-request gate INCLUDING the browser,
accessibility and visual suites, which it did not until 2026-09-11
([doc 10](./docs/foundations/10-quality-and-verification.md) §10.1). The two
workflows are kept in step by `pnpm check:release`, which fails if the release
gate stops running anything the pull-request gate runs.

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
- **Do not ask the window anything outside `internal/useWindowFits`.** Doc 04
  §5 grants the viewport exception to components rendered in a portal and
  nothing else, and the lint rule names `matchMedia` for that reason — it used
  to be reachable without writing `window`, which let a component query the
  viewport and pass lint while doing the thing the rule is about.
- **Do not read a date field's first segment.** In a twelve-hour locale the
  base wraps the clock in bidi ISOLATE marks and renders them as
  zero-width LITERAL segments, so the first child of the row cannot be clicked
  and its colour is the punctuation's. Two checks were written against it
  before that was measured; `:not([data-type=literal])` is the selector.
- **Do not let a field's frame be a group when its control already is one.**
  Every field here draws the base's `Group` as its box, and a date field's
  control is a group of its own — the base's `DateInput` renders one so the row
  of spin buttons has a name to belong to. Measured in a browser: two nested
  groups carrying one name, which a reader says twice. `ControlFrame` takes a
  `role` for that, and `presentation` is the answer.
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
- **Do not let a set's context reach a layer.** A variant that belongs to the
  set travels by context (doc 02 §3.1.1), and a React context CROSSES A
  PORTAL — so a popover opened from inside a `ButtonGroup` rendered its footer
  in the group's own size and variant. Measured with a probe, which read
  `primary/sm` where a person would have seen small primary buttons in a
  dialog. `internal/buttonAppearance`'s `NoButtonSet` is what closes it, and
  the shared sheet is where four of the five layers do so at once.
- **Do not size a square element with a `w-*` token.** The theme has
  `--height-control-*` and NO `--width-control-*`, rightly, because a control's
  width is its contents — so `w-control-md` compiles to nothing and leaves a
  box with a height and no width. `aspect-square` against a height token is
  the way, and the way to check either is to grep the COMPILED stylesheet.
  Measured on `Avatar`, and it is the third utility in this repository found to
  produce no rule at all while looking right in the source.
- **Do not test RTL with a `dir` attribute alone.** Direction reaches CSS
  through the stylesheet and reaches JavaScript through the LOCALE, and a
  component using one of each can disagree with itself: measured on `Slider`,
  a `dir="rtl"` story with no locale drew the fill along the right of the rail
  and the handle at 30% from the left — a handle at the wrong end of its own
  fill, with nothing wrong in either half. Stories declare
  `ConfigProvider locale="ar-EG"`, and the check asserts the two AGREE rather
  than asserting each one ([doc 05](./docs/foundations/05-languages-and-formatting.md) §4.1).
- **Do not let a WAIT measure the machine either.** The rule above is usually
  read as being about assertions, and the cheapest way to break it is
  `waitForLoadState('networkidle')`: "idle" means 500ms of network silence, so
  it is a half-second floor on a page that painted in 21ms AND unbounded on a
  page that never gets 500ms of quiet. Measured, and it is what an
  accessibility check timing out under load turned out to be
  ([doc 10](./docs/foundations/10-quality-and-verification.md) §11.2). A wait
  belongs to a state the page reaches — an element attached, an image
  `complete`, a frame painted — and `e2e/settle` holds the two this catalog
  uses.
- **Do not guess at a flake you cannot reproduce.** Ship the assertion that
  will attribute the next occurrence instead. `Error: Axe is already running`
  survived a week of plausible theories, three of which were measured false;
  one line reading whether anything already held axe's run flag attributed it
  on the first run, at 11 of 480 stories under six workers. And the switch was
  not the obvious one: Storybook's accessibility addon runs axe after every
  story render, its default parameter is `test: 'todo'`, so removing our
  `test: 'error'` changed nothing — the lever is its `manual` global, and the
  panel now runs when a person asks it to (doc 10 §11.3).
- **Do not let a polled callback throw.** `expect.poll` is this repository's
  answer to half of the rule above, and it does **not** retry a callback that
  throws — measured: it propagates on the first call and never consults the
  timeout. So a poll reading `querySelector(...)!.something` has one attempt
  wearing a five-second budget, and `getComputedStyle(null)` throws. Return a
  sentinel for "not there yet"; the assertion will not match it and the poll
  ticks again (doc 10 §11.4).
- **Do not assert a number the BASE chose.** A check on a preview's 600ms open
  delay looked like it guarded this library's decision and guarded the
  dependency's default: measured in the pinned source, `PreviewTrigger` does
  `delay: props.delay ?? 600`, so deleting the prop left every assertion
  passing. The close delay in the same component is ours — 150 against a
  default of 200 — and that one is worth asserting. The test is whether
  changing OUR side of the number changes the reading (doc 10 §11.1).
- **Do not trust a poll to give a page the chance to be wrong.**
  `expect.poll` returns on the first read that satisfies it, so "the offset did
  not move" is satisfied by its own first read and the budget is never spent —
  three scroll-lock checks passed whether or not the wheel event arrived.
  Measured while fixing it: after `mouse.wheel` returns, a window-level counter
  still reads zero, so the arrival is asynchronous and has to be polled as a
  STATE. And the positive companion has to be in the SAME test: a select's
  Escape check asserted three things that were all true of a select which never
  opened, with the proof that it opens in a neighbouring test (doc 10 §11.1.1).
- **Do not explain a hover workaround with `useHover`.** Seven copies of a
  pointer helper said the base's `useHover` rejects a teleport. It does not —
  measured in `react-aria@3.52.0`, `triggerHoverStart` gates only on
  `isDisabled`, a touch pointer, an already-hovered state and containment, so a
  bare `hover()` does publish `data-hovered`. What rejects a teleport is the
  global interaction MODALITY, read by the consumers: a tooltip's trigger opens
  only while it is `'pointer'`, and it becomes `'pointer'` on a `pointermove`
  at the document — which fires AFTER the boundary events of the move that
  caused it. A single move cannot vouch for itself; the neutral move does. And
  a key press sets it back to `'keyboard'`, which is why the menu's neutral
  move is load-bearing after an `Enter`. `e2e/pointer.ts` is the one copy.
- **Do not read a failure before checking the machine.** One check failing
  repeatedly in the same place is the check or the code. SEVERAL different
  checks failing once each, none repeating, is the machine: measured, three
  consecutive full runs each dropped a different check with a different
  symptom, with 3.1GB free of 15.85 and 3.1GB of it held by nineteen orphaned
  node and browser processes. Stopped, at 5.48GB free, two runs of all 438
  passed. Reproduce in isolation first (doc 10 §11.5).
- **And do not stop at memory when the machine is the suspect.** The second
  time this diagnostic pointed at the machine there was 6.67GB free and no
  orphaned process, so the suspicion had nowhere to go. What closed it was an
  instrument on the one wait that had none: a story that never mounted turned
  out to be `net::ERR_NO_BUFFER_SPACE` in the page's console — the HOST out of
  socket buffers, with **1172 sockets in TIME_WAIT, 1117 of them to the
  preview server**, after about 2900 story loads in a session. Sockets
  accumulate ACROSS runs, are invisible to a memory check, and the remedy is
  `--workers=2` on that machine rather than a retry (doc 10 §11.5.1).
- **Do not extend the base's props with an `Omit`.** A new field's props are a
  `Pick`, which is hard rule 8 in the type system: an `Omit` publishes
  everything the base has except what is named, so the public surface grows
  whenever the base does and nobody decides. Measured — `validate` and
  `validationBehavior` reached exactly the ten `Omit`-shaped fields and none of
  the ones built from `Calendar` onward, which all use `Pick`.
- **Do not put a button inside a collection row.** Measured on a `ListBox` row
  in a combo box: the row is announced with the button's label glued into its
  own name, `Tab` from the input closes the list and lands on `body`, and the
  arrows move `aria-activedescendant` without focus ever leaving the input. A
  pointer presses it and closes the list on the way, which makes it a control
  only a pointer can reach (doc 06 §4 rule 5). `FileUpload` has a per-row
  retry because its rows are a plain `<ul>` where nothing is chosen — the test
  is whether the list is a COLLECTION, not whether it is a list.
- **Do not import a stylesheet from TypeScript.** A component's CSS reaches a
  consumer through one hand-written `@import` in `src/styles/index.css`, which
  is the only file the Tailwind CLI compiles — `@source` scans `.ts` and `.tsx`
  for class NAMES and follows no import. `import './X.css'` also compiles,
  which is the trap: Vite's library build extracts those rules into a file
  beside the bundle and strips the import, so they are published, named by no
  `exports` condition and imported by nothing. Measured — three stylesheets had
  gone that way and `ButtonGroup`, `Steps`, `ColorPicker` and
  `ColorSwatchField` would have been published unstyled. Nothing here caught
  it; that no consumer received it is only because the rewrite is unreleased.
- **Do not put a relative import in a published `.d.ts`.** `tsc` keeps every
  specifier as written and this package compiles with
  `moduleResolution: bundler`, so `dist/index.d.ts` re-exported 110
  extensionless paths that `node16` and `nodenext` cannot follow. It does not
  error, it DEGRADES: measured from a consumer with `skipLibCheck: true`,
  `ButtonProps` was `any` and a bogus prop passed. The package ships one
  rolled-up declaration file
  ([decision 0025](./docs/decisions/0025-the-package-ships-one-declaration-file.md)).
- **Do not snapshot a public API as TEXT.** The obvious guard against a
  surprise in the public surface is a committed copy of `dist/index.d.ts`, and
  it would not have caught the thing it is for: our declaration reads
  `interface TextFieldProps extends Omit<TextFieldProps$1, …>` whatever the
  base contains, so a base upgrade that adds a prop to four public types is a
  ZERO-character change to that file. Measured by patching the base and
  re-reading. `check:surface` builds the artefact from the type checker
  instead, marking every property `(own)` or `(base)`, and the same simulation
  reports `+aBaseGrewThis? (base)` on all four (doc 10 §3.1).
- **Do not hand-edit `primitives.css`.** It is generated, and it is the one
  source file eslint ignores BY NAME and prettier ignores BY NAME — so an edit
  there was invisible to every other check in the project. Measured: of its 192
  declarations exactly TWO were asserted anywhere, as `rgb()` strings in a
  browser check. `check:tokens` renders the file from the same module the
  writer uses and compares bytes; it names the first line that differs.
- **Do not conclude the package works because the catalog does.** The catalog
  renders components from SOURCE and imports exactly one thing from the built
  package, its stylesheet — so 196 baselines, 480 accessibility checks and 438
  browser checks all passed over both defects above. A claim about what a
  consumer receives is measured against `dist`, and `pnpm verify` now does
  that: publint, attw, every value in the type surface importing, and nothing
  in `dist` unreachable through `exports`.
- **Do not reference private projects** in code, examples or documentation. The
  library is public and its API is designed for strangers.

## When something is not covered

Say so. A missing rule is a missing line in a foundation document, and the fix
is to write that line — not to guess and move on. The foundations are changed
_before_ writing code that contradicts them, never afterwards to justify it.
