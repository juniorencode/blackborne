# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the library is in the `0.x` series the public API may break between
minor versions. Every break is listed here with its migration.

## [Unreleased]

### Added

- **Every colour changed.** The palette is this library's own now, not
  `@radix-ui/colors` — which is gone from the dependency tree — and it ships in
  `oklch`, so a screen that can show more than sRGB shows the colour that was
  chosen. The six roles are unchanged; `brand` is `blue` where it was `indigo`,
  which is a choice of default rather than a rename.

  **Two pairings moved with it**: `--bb-danger-on` and `--bb-info-on` are white
  in dark mode, because the new solids are darker than the old ones and
  near-black on them measured 3.86:1 and 3.67:1 against a floor of 4.5. The
  rule was already written — a background declares the text that goes on it —
  and had been applied by MODE rather than by the background.

  What a consumer may rely on, and what they may not, is
  [decision 0028](./docs/decisions/0028-the-palette-is-ours-and-what-it-guarantees.md).

- **`usePaging`** — which page of a listing, how big a page is, and the one
  rule nobody writes by hand.

  **The rule**: when the page size changes, the page is re-anchored on the
  first row that was visible. 200 results at ten a page, on page 7, switching
  to fifty — keeping the page puts you on rows 301 to 350 of 200, past the end,
  looking at nothing; anchoring gives page 2, which still holds row 61.

  **One value, not two numbers.** `{ page, size }` through one triple, because
  re-anchoring moves both at once and two callbacks would report a state that
  cannot exist.

  **The page it publishes is one that exists**, and the correction never writes
  back. A total that shrinks under a stored page shows the last page there is,
  and clearing the filter returns the person to where they were. A page past
  the end is not merely empty: measured on this library's own pager, nothing
  carries `aria-current="page"` and the previous button stays live.

  It sits beside `Pagination` rather than with the table, because there is no
  table in it — its first three members are `Pagination`'s three props, by name
  and by type.

- **A `Table` becomes a list of cards in a narrow container**, and it needs no
  new prop, no new component and no JavaScript at all.

  **The DOM does not change.** Measured at both widths: the same roles, the same
  rows and cells, the same selection, the same keyboard — the base writes its
  ARIA roles explicitly, so a `td` that stops laying out as a table cell is
  still a `gridcell`. Doc 04 §6 listed this as its own first example of a
  STRUCTURAL change; §6.3 now records that it is not one, with the measurement.

  **Each field carries its column's name**, read from that column's own
  collection node rather than written a second time — one declaration, three
  readers. The card's TITLE carries none, because a row is named by that cell
  and a label inside it renamed the row.

  **The heading band is emptied rather than hidden**: the select-all and any
  sortable column stay, and a table that neither sorts nor selects loses the
  band entirely. `display: none` rather than `sr-only`, which is the inverse of
  the rule `Steps` left behind — a column header can be focused, so a clipped
  one is focus nobody can see.

- **`pinnedEdge="end"` on `Table`** — the trailing column stays put while the
  rest scroll under it, so what can be done to a row is still reachable at the
  far end of a wide one.

  **Named by the EDGE rather than by a column**, which is what keeps one fact
  in one place: `:last-child` already knows where the trailing edge is, so a
  cell is never told that its column is pinned, and hiding the last column pins
  whichever one becomes last. `inset-inline-end`, so the pinned edge is the
  trailing one in Arabic too — measured, the column moves to the opposite side
  and the overflow shadow moves with it.

  **The pinned cell is opaque and still wears its row's colour.** A transparent
  one carried 173 pixels of another column's text inside it, measured; the row
  publishes `--bb-row-bg` and both it and the cell read it, so a chosen row
  stays chosen across the column that is holding still.

  **The overflow indication moves inward by the pinned column's width**, so it
  becomes a shadow that column casts rather than one it covers — 53 levels held
  against 10 at the end of the scroll, where the unshifted edge measures 45
  against 10. A width crosses from JavaScript and nothing else does; the
  covering and uncovering is still `background-attachment`.

- **`RowActions` and `RowAction`** — what can be done to a row, shown as
  buttons where there is room and folded into a menu where there is not.

  **A button inside a cell is allowed here and is forbidden in a `ListBox`**,
  and the difference is measured rather than assumed: a table row with a button
  in it is named exactly `"Ana"`, where a listbox row came back announced as
  `option "A row with a button Retry"`. A grid offers a keyboard route and a
  listbox does not.

  **An action is DECLARED rather than rendered** — decision 0018's shape, third
  caller — because it lands in one of two places depending on the room, and a
  component that rendered itself could not be both. What could not be read is
  counted and said once, exactly as `Tabs` does.

  **One action never folds** (doc 04 §11.2, fourth caller, no new argument),
  and the rest scale with the count. The thresholds are CSS's; this only
  decides how many are too many for a given step.

- **A visual failure now says which of two things it is.** A baseline drifted
  once by 39 pixels and refused to do it again: five captures of one page load,
  five separate loads, five runs of that capture alone in the container and two
  full runs of all 207 are all byte-identical, and a deliberately cold Docker
  engine rendered it correctly too. Five theories, five measured false.

  So the answer is §11.3's rather than a guess. When a reference does not
  match, `shoot()` takes two more raw captures and compares them: **rendered
  differently twice** means something in the story is still moving, and
  **rendered identically twice** means the story is fine and the reference came
  from a different rasterisation. The two need different fixes. Both branches
  were exercised before it landed.

  It also records the fact that kills a whole class of theories:
  `toHaveScreenshot` re-captures until it matches, so a visual failure is never
  a screenshot taken mid-render — it is a stable wrong render. Three of the
  five theories were about timing and none of them could have been true.

- **`useTableColumns`** — which columns a table shows, in what order, and a
  route back. A hook because P6 puts logic in hooks: an order, a restore and
  two refusals, none of which needs a DOM, and all of it tested without
  mounting anything.

  **It remembers nothing.** P3 allows it nothing, so the arrangement is two
  lists of ids the project stores wherever it stores things — controlled or
  uncontrolled, reported either way. That also repairs a defect measured in the
  product this suite was read against, where preferences fell back to a
  per-path local key whenever a provider was not mounted, so in tests and half
  the screens they never reached the server at all.

  **Two refusals, both measured.** A locked column cannot be hidden or moved,
  because it is the one carrying `isRowHeader` and a table without it leaves
  every row named by nothing. And the last visible column cannot go — the
  product read against prevented that in a dialog and had no route back, since
  its restore was unreachable.

  **And `columns` is the export shape.** Doc 01 §4.1: the library hands over
  the visible columns in the person's order and the project performs the act.
  The column's own type parameter is the project's, so the accessor an export
  needs already travels with it.

  There is deliberately no column `type`. The product read against has thirteen
  and four of them render nothing at all, silently; a kind that decides the
  renderer, the skeleton and the width is the prop that grows forever.

- **Rows can be chosen, one at a time or several** — wave 2 of the table
  suite. The base owns the state and the whole keyboard: shift-click and
  shift-arrow ranges, `Mod+A`, long press on touch, the indeterminate
  select-all and its name in 34 locales. Three things are ours.

  **The column itself**, because the base renders none — it reports the mode
  through `useTableOptions()` and leaves both halves to the consumer, where one
  written without the other throws and neither written ships a selectable table
  with no way to select anything.

  **The `'all'` sentinel never reaches a consumer.** `selectAll()` stores the
  literal string, so a signature typed against a list of ids would receive a
  string the first time anybody pressed the heading box. It is expanded into
  the rows that are there, disabled ones excluded.

  **And the count is announced**, which the base does not do: it says a row's
  own state as focus moves through it and never the total, so in the product
  this suite was read against the count changed in silence. The region says
  nothing when nothing is chosen, because "0 selected" on every clear is noise.

  One row or several is a **discriminated union** rather than a boolean
  (decision 0022): the branches share every prop but one and disagree only
  about how many answers are allowed.

- **`Table`, `TableHeader`, `Column`, `TableBody`, `Row` and `Cell`** — wave 1
  of the table suite the catalog's §3.4 lays out. The grid roles, the whole
  keyboard including typeahead, sorting with `aria-sort` and its announcement
  in 34 locales, and the semantics of a row header are the base's. What is new
  is the skin and the three things the base leaves undone.

  **Its own horizontal scrolling, with the overflow indicated.** Doc 04 §7: the
  component that produces wide content encloses its own scrolling and the
  consumer's page never scrolls sideways because of it, and content hidden by
  overflow is indicated — because invisible scrolling is lost content. The
  indication is four background layers and no JavaScript: two painted in the
  surface colour that scroll WITH the content and cover the shadow on whichever
  edge you are looking at, and two shadows fixed to the box.

  **The three absences a listing with no rows can be in**, which are the
  component's and not the consumer's: nothing yet, nothing matched (doc 09 §6
  keeps those apart and only the project can tell them apart), and **an error
  with a retry**. The product this suite was read against showed the same
  screen for a failed load and an empty result, with no way to try again — the
  most expensive gap in it. An error outranks loading here, because a request
  that failed is not still in flight.

  **And one invariant that is ours rather than inherited.** A table with no
  column marked `isRowHeader` neither throws nor warns, every row loses its
  accessible name, and the base renders an EMPTY `aria-labelledby` rather than
  none — so nothing else would tell you, and once selection arrives each row's
  checkbox will be named by an id that resolves to nothing. One development
  warning, and it has to be OBSERVED rather than checked once: the base fills
  the table in a pass that does not re-render this component, so at the moment
  a plain effect runs, `innerHTML` is the empty string.

  No selection, no column management and no row actions yet. Those are waves 2
  to 4, and a story that pretended otherwise would photograph something that
  does not exist.

- **Wave 0 of the table suite: three measurements and no component.** The
  catalog's §3.4 said three questions had to be answered before the API rather
  than during it. They were, in a browser and in jsdom, with throwaway probes
  and nothing left behind — a standing test asserting the base's behaviour
  would break the rule about not testing React Aria. Seven findings came back
  from three questions, and one of them corrects §3.4 itself. The waves are
  written there too, along with the three capabilities the base offers that are
  deliberately **not** waves.

- **The ground the table suite stands on, written before any of it is built.**
  The catalog carried one row for a whole suite, which is exactly where a suite
  goes wrong — non-goal 4 is explicit that the functionality is first-class and
  that what is forbidden is _how_. [The catalog](./docs/catalog-and-build-order.md)
  §3.4 now carries the piece list, the three hooks, the assembly's test, and
  three measurements that come before the API rather than after. It was read
  against a real hand-written data table from a management product: 145
  capabilities inventoried, then checked against these documents and against
  what the headless base already provides.

- **Doc 01 §4.1 and [decision 0027](./docs/decisions/0027-the-library-hands-over-the-shape-the-project-performs-the-act.md):
  the library hands over the shape, the project performs the act.** Exporting a
  table to a file, printing, and putting the search and filters in the address
  bar had no answer in any document. Four rules pointed at the same answer —
  P2, P3, non-goal 1 and non-goal 3 — and pointing is not saying. The
  distinction is not difficulty: it is that the library has no environment of
  its own, and a component assuming a file system, a printer or a router breaks
  in the projects that have none. Three §7 rows carry the individual answers so
  they are not re-derived each time somebody asks for a download button.

- **The numbers the documents state as fact are checked.** Five of them had
  not been true for months: doc 10 §3's table said 19 captures against 197,
  `visual-regression.md` said "nineteen captures, not all sixty stories"
  against 197 and 484, and `playwright.config.ts` and `CLAUDE.md` described
  suites of 253 and 357 that are now 438 and 484. Each was true when written,
  and nothing rewrote them because nothing read them — §1's argument arriving
  in the documentation.

- **The release workflow runs the checklist it is supposed to.** Doc 10 §10
  lists ten things that stop a version shipping and `release.yml` ran
  `pnpm verify` and nothing else — so automated accessibility and visual
  regression, the two layers this project spends the most on, were enforced on
  every pull request and on nothing that published. It now runs the whole
  browser job, in the same container, before the publish step it gates.

- **A tag guard, because publishing is triggered by a tag rather than by a
  merge.** `main` is protected and all of that is walked around by tagging a
  branch that was never merged. `scripts/check-tag.mjs` runs first and in
  seconds: the tagged commit is an ancestor of `main`, the tag names the
  version `package.json` will actually publish — npm publishes the package's
  number, not the tag's — that version is not already on the registry, and the
  changelog has a dated section for it with `[Unreleased]` emptied into it.

- **And the release gate is itself checked**, because it is the one workflow
  nothing rehearses. `pnpm check:release` asserts that it runs every command
  the pull-request gate runs, that every action is pinned to a commit rather
  than a movable tag, and that the publishing job waits for every other job —
  the silent one, since GitHub runs jobs in parallel by default and a check
  that finishes after the package is on npm has reported rather than verified.

- **The project's own lint rules are tested, in both directions.** Doc 10 §2
  calls them the highest-return item in the whole document and they are how
  nine written rules stop being a matter of memory — and until now **not one of
  the thirty-four had a standing check**. Several were verified by hand on the
  day they landed, but a verification that happened once is a verification
  nobody can repeat. `pnpm lint:rules` fires and silences every rule against an
  inline fixture, reading them from the RESOLVED config so the rule and its
  `files` wiring are tested together — a perfect selector attached to the wrong
  glob protects nothing, and that is invisible to a test importing the rule
  objects. Doc 10 §2.1.

- **And the eighteen shapes it cannot catch are recorded rather than closed.**
  Measured with a throwaway probe against the real config: thirty-five
  candidates linted, twenty silent, two of those twenty not holes at all. Six
  of the eighteen are one cause — nine selectors anchor on `Literal[value=…]`
  and not one of the fourteen names `TemplateLiteral`, so a backtick defeats
  them all at once. None has a live exposure today, which is what makes them
  worth writing down instead of fixing.

- **A greyscale picture that can actually show the rule.** Doc 06 §3 names
  greyscale as the check for colour being the only channel, and the library had
  exactly one such baseline: `confirm-greyscale`, rendering a SINGLE tone of a
  component that can never carry a success one. A rule about telling tones
  apart cannot be checked against one tone. `alert-greyscale` is the whole set
  twice — four tones in colour beside the same four with the hue filtered out —
  and it demonstrates the rule rather than asserting it: with the colour gone,
  the glyphs still say which is which.

- **A picture for `Spinner`**, which had none because it had no story. It
  photographs `InheritsItsColour` rather than `Sizes`: the three sizes are
  geometry against the type scale, and what only a picture shows is
  `color: currentColor` doing its job — the same element beside body text,
  beside muted text, inside a filled button where the surrounding colour is the
  button's foreground, and in dark.

  The rotation is not in it and cannot be: `animations: 'disabled'` CANCELS an
  infinite animation rather than finishing it, so the arc is photographed where
  it starts.

### Changed

- **The page-size selector row was re-asked, and half of it changed.** It was
  answered before the table suite existed, and its own sentence handed the
  listing to that suite. The control stays composed — its whole body would be a
  `Select` with four options, and the noun belongs to the project, where doc 05
  sends every word a person reads to the dictionary. What changed is one level
  down: the number is state the suite's paging hook holds, along with the rule
  nobody writes by hand. 200 results at 10 a page, on page 7, switching to 50 —
  keep the page and you land past the end looking at nothing; anchor on the
  first row that was visible and the person is still looking at what they were
  looking at.

- **Three `Link` checks stopped asserting that Chromium opens a tab.** They
  failed six times on CI across five weeks and never once locally, and the
  sixth failure was fully instrumented: the press reached the anchor with the
  right address, the modifier reached the DOM, `defaultPrevented` was false,
  and the document had not moved — so every fault that could have been ours
  was ruled out and the browser simply declined. Whether a user agent opens a
  background tab for a modified press is its own convention, which doc 10 §11
  calls measuring the machine. The replacement is narrower rather than weaker
  and covers every regression that would be ours; verified by making `Link`
  cancel every press and watching all three go red. The `target="_blank"`
  check keeps its tab assertion, because there the new browsing context is
  declared in the markup rather than conjured by a modifier.

- **A number in a document is now checked, dated, or dropped** — doc 10 §12.
  The distinction the rule rests on is that MOST numbers here are measurements
  attached to an event and are correct forever: rewriting "11 of 480 stories
  carried the flag" to today's figure falsifies the record rather than
  repairing it. Measured, a blanket sweep would have damaged nine true
  sentences to fix four false ones. Only claims about the PRESENT are
  registered; where the number carried nothing it was removed instead, and
  where it cannot be measured cheaply it is dated by the size of the thing
  measured rather than restated.

- **The parallelism timings say which machine they came from.** They were
  measured locally, and the same commit on CI reads behaviour 3.3m,
  accessibility 5.4m, visual 2.3m — the two parallel suites slower and the
  single-worker one faster, because a runner has fewer cores. Nobody reading
  the local numbers would have predicted the direction of either.

### Removed

- **`split-button-variants`**, a strict subset of `split-button-states`.
  Verified before deleting: it renders primary beside secondary in a row, and
  the "Default" scope of the states picture renders the same two, the component
  defaulting to `primary`.

### Fixed

- **Every sortable `Table` described itself as "sorted by column&nbsp;&nbsp;in
  ascending order"** — with no column in it. The base builds that description
  from a column node's `textValue` and derives that from string children only,
  and this component always hands the base a render function so the sort mark
  can be drawn beside the heading. `Column` derives the value from its own
  string child now, and a sortable column whose heading is not plain text says
  so in development rather than announcing nothing.

- **Every row separator in every `Table` was three pixels**, and every heading
  carried a vertical separator nobody had designed. `border-b border-solid`
  gives the style utility all four sides, and with no preflight the three with
  no declared width keep the browser's initial `medium` — the package guide's
  accordion trap, in the one other place in this library a per-side border was
  written without an all-sides width. Found while reading a pinned column's 1px
  divider against it.

- **`bb:font-medium` produced no rule at all**, in the first component to ask
  for it. The theme names weights by ROLE — `normal` and `strong`, no numeric
  scale — so a column heading asking for a numeric weight got nothing. It is
  the fourth utility in this repository found to compile to nothing while
  looking right, after `w-control-md`, `size-box` and `min-w-hit`, and it was
  found the only way any of them can be: by grepping the compiled stylesheet.

### Fixed

- **The visual suite said a time picker "earns two" with three entries below
  it.** Corrected to three, and the third turned out to be the load-bearing
  one: `time-picker-states` is the only one photographing the FIELD, and a time
  picker is a field carrying the states doc 07 §6 lists — where a select's own
  states picture is taken on different furniture.

- **A story labelled a panel "inside a filled button" and showed an outlined
  one.** `Button` defaults to `secondary`, not `primary`. Nothing could catch
  it — the types were right, axe was green, 438 browser checks passed — and it
  was found by opening the generated baseline, which is the one manual item
  doc 10 §10 names.

### Added

- **The public API surface is a reviewed diff**, and it is read from the type
  checker rather than from the declaration text — which is the whole finding.

  A committed copy of `dist/index.d.ts`, or an api-extractor report, would not
  have caught the thing this exists for. Our declaration reads
  `interface TextFieldProps extends Omit<TextFieldProps$1, …>` whatever the
  base contains, so a base release that adds a prop to four of this library's
  public types is a **zero-character** change to that file. Measured by
  patching the base's own declarations and re-reading ours.

  `check:surface` builds the artefact from the checker instead: every exported
  name, and every property of every exported type including inherited ones,
  each marked `(own)` or `(base)`. The same simulation now reports
  `+aBaseGrewThis? (base)` on `TextFieldProps`, `TextAreaProps`,
  `PasswordFieldProps` and `TagsInputProps` — which is exactly how `validate`
  and `validationBehavior` arrived in ten public APIs with nobody deciding.

  191 exported names, 195 blocks, 74 kB. The property TYPES are deliberately
  left out: including them doubles the artefact to the size of the declaration
  file, and the interesting half is the names.

- **`primitives.css` is checked against its generator.** It is the bottom of
  the token stack — every semantic token resolves into a `--bb-x-*` declared
  there — and it was the one source file eslint ignores by name AND prettier
  ignores by name AND no test read. Measured: of its 192 declarations, exactly
  **two** were asserted anywhere, as `rgb()` strings in a browser check.

  It compares rendered bytes rather than running `pnpm tokens && git diff`,
  because that form writes a source file as a side effect of checking it and
  needs a git working tree. The generator was split so the check imports the
  same function the writer uses: a check that reimplements what it checks
  agrees with itself forever.

### Fixed

- **The generator counted 193 private tokens where 192 are declared.** Its
  pattern was `/--bb-x-/g`, which also matched the prose in its own header —
  "the `x` marks layer 1". A number in output that nobody can trust is doc 10
  §11.6 at the smallest possible scale. Anchored to declaration lines now.

### Added

- **Four architectural guards that did not exist**, each verified in both
  directions, and two of them red on arrival.

  **A props type is a whitelist.** `Omit` publishes everything the base has
  except what is named, so the base's next release widens this library's public
  API with nobody deciding — measured, `validate` and `validationBehavior`
  reached exactly the ten `Omit`-shaped fields and none of the components built
  from `Calendar` onward. The rule had no home in the foundations: it lived only
  in the catalog's §7 with the status "Pending a decision". [Doc 01](./docs/foundations/01-principles.md)
  §3's P5 now carries it, and it covers every public props type rather than
  only a field's — eighteen exist today and eight of them are not fields.

  Those eighteen are exempted **by name**, which is not the obvious design and
  the two obvious ones were measured first: prettier moves a trailing
  `eslint-disable-line` onto the next line, and `eslint-disable-next-line`
  cannot go above the declaration because twelve of the eighteen carry a JSDoc
  block there. A per-file list was rejected too — `RadioGroup.tsx` holds two,
  so a nineteenth added there would pass silently. Verified: eighteen reported
  with the list empty, zero with it full, and a nineteenth interface fires
  inside `RadioGroup.tsx` itself.

  **No request, and no window under an alias.** P2 — no network — was the
  oldest rule in the project with no automated form at all: `location` was
  banned and `fetch` was on trust. And P3's globals were reachable under five
  names that do not contain the word: measured, a shipped file holding
  `globalThis.document`, `self.matchMedia`, `top`, `parent` and `frames`
  produced **zero** errors. The document is reachable through an element too,
  so `ownerDocument` and `defaultView` are selectors now. Zero false positives
  across 343 files, and the one-file exception for `useWindowFits` stopped
  being a blanket `'off'` — it was widening with every name added to the list.

  **Every component has a story and a test.** It failed on arrival, naming
  `Spinner` — the one component in the library with no axe check and no
  picture, because both suites take their population from the catalog. The
  population is compared against `src/index.ts` in both directions, so an
  empty scan cannot pass.

  **No component stylesheet reaches past layer 2.** ESLint reads no CSS in this
  repository — every block is scoped to `.ts`, `.tsx`, `.js` and `.mjs` — so
  across seventeen stylesheets the primitive rule, the four physical-direction
  rules and the two viewport rules were inert. It failed on arrival too, naming
  `Switch.css`, which held `var(--bb-x-gray-7)`.

- **`--bb-surface-knob`**, a layer-2 token for the moving part of a control at
  rest, defined separately in each mode as doc 03 §6 requires. It carries the
  measurement that chose step 7 — the thumb began as the surface colour on a
  sunken track at 1.03:1, invisible on the one element whose position is the
  whole state of the control — and it changes no pixel: the primitive it
  replaces is mode-aware and resolves to the same colour in both.

- **A catalog for `Spinner`**, five stories. Three of the four claims that
  component makes are invisible to a unit test, including the one nothing
  checked at all: under reduced motion the arc stops rotating and becomes a
  complete ring, which is a `d:` path swapped by a media query.

### Fixed

- **Two comments that described something else.** `Spinner.css` said its
  duration came from a token "so the reduced-motion rule reaches it" — it is a
  literal `700ms`, correctly, because doc 09 §2 budgets a looping indicator
  separately, and the rule reaches it by switching the animation off. That
  sentence was describing `Dialog.css`. And `preview.spec.ts`'s claim about the
  600 ms delay was corrected in the previous wave for the same reason: a
  sentence about the wrong thing reads as true until somebody measures it.

### Changed

- **Nine checks that could not fail, or could fail for the machine's sake.**
  A sweep of every check in `apps/catalog/e2e` whose expected result is
  "nothing happened", every fixed sleep used as an upper bound, and every
  polled callback that could throw. Three of the nine turned out to be
  described wrongly rather than written wrongly, and those corrections are the
  valuable part.

  **A poll cannot give a page the chance to be wrong.** Three scroll-lock
  checks sent a wheel event and polled that the page offset had not moved, each
  under a comment saying the budget gave the page a thousand milliseconds to
  prove otherwise. `expect.poll` returns on the first read that satisfies it,
  so the assertion was satisfied by its own first read and passed whether or
  not the event ever arrived. They now poll a window-level counter, which is a
  state — and measured while writing it, the count still reads zero when
  `mouse.wheel` returns, so the arrival really is asynchronous
  ([doc 10 §11.1.1](./docs/foundations/10-quality-and-verification.md)).

  **A number the base chose is not a decision a check can see.** The preview's
  `Date.now()` stopwatch asserted `300 < waited < 2000` around a 600ms delay,
  under a comment admitting the band was widened so it would not measure the
  machine. It was worse than that: `PreviewTrigger` defaults `delay` to 600
  itself, so deleting the prop would have left every assertion passing. The
  test now asserts the order of two states and no duration.

  **`useHover` does not reject a teleport.** Seven copies of a pointer helper
  said it does. Measured in the pinned base, `triggerHoverStart` gates only on
  `isDisabled`, a touch pointer, an already-hovered state and containment — so
  a bare `hover()` publishes `data-hovered`. The real gate is the global
  interaction modality, read by the CONSUMERS, and it becomes `'pointer'` on a
  `pointermove` at the document, which fires after the boundary events of the
  move that caused it. A single move cannot vouch for itself. The seven copies
  are now `e2e/pointer.ts`, with the corrected mechanism and two consequences
  none of them stated: a key press sets the modality back, which is why the
  menu's neutral move is load-bearing after an `Enter`; and one bare `hover()`
  the audit wanted converted was correct as written, because its assertion
  rides on `data-hovered` itself.

  The rest: a read-only field's hover check gained the ordinary field beside it
  and now asks the ANIMATION rather than reading a colour at t≈0 of a 100ms
  transition — measured, the colour read alone sees the old value either way; a
  select's Escape check gained two witnesses, because all three of its
  assertions were true of a select that never opened; `switch-direction`'s
  polled callback returns `NaN` instead of dereferencing two `querySelector`
  results, and `NaN` rather than `0` because `0` is where an off thumb sits; and
  one tooltip sleep became a state, with the margin it does not close written
  down rather than implied.

- **The accessibility suite can no longer report success without running.**
  Its story list ended in `.catch(() => [])`, and the path from there to a
  green run is not obvious: the file is imported once for collection and once
  per worker, so a fetch that failed during COLLECTION produced a suite of
  exactly one test — the reachability guard — which re-fetched successfully
  inside its worker, read every story and passed. `1 passed`, exit zero, with
  479 checks never generated. Verified by pointing the index at a 404: it used
  to say `1 passed` and now fails naming the URL and the cause.

  The guard it carried was `stories.length > 10`, which has a passing region
  four hundred wide. It is replaced by a comparison against the story files on
  disk, by NAME rather than by count, so a stale `storybook-static` is named
  rather than silently under-covered. Verified in both directions by adding a
  story the index did not know about.

  And the clock is pinned for that suite, which had none: fifty of its stories
  are the date family, and from October nothing in the catalog would have
  rendered a today-marked cell with nothing failing.

- **Twenty of the 196 baselines were taken outside the determinism guards.**
  `pinClock` and `imagesSettled` lived inside one of three shutters, so the
  hover and press groups reached `gotoStory` themselves. None of those twenty
  renders a date or holds an image, so none of them was wrong — a guard that
  one shutter in three goes through is the kind nobody can see is missing. The
  clock is now fixed for the whole file and both guards live in one `shoot`
  helper that all three paths go through. Measured: all 196 references came
  back byte-identical in the container.

  The press group also gained an attribution on its failure path: a notice
  carries its own six-second life while `toHaveScreenshot` retries a mismatch,
  so a diff can be a dismissal rather than a change, and now it says which.

- **`settle.ts` recorded an eliminated guess as the cause of a CI failure.**
  Its docstring said the 225-pixel `avatar-states` diff was the browser's
  broken-image mark. The artefact had said otherwise — the content was
  identical either way and the difference was antialiasing on every circular
  border — and the mistake arrived with an extraction rather than with the
  finding: the commit that wrote the wait wrote the right account, and the
  commit that moved the wait promoted the eliminated hypothesis to the cause.
  The guess stays, labelled as one. `avatar.spec.ts` now asserts the fallback's
  presence as well as the image's absence, because `imagesSettled` cannot prove
  the swap: `complete` is already true when `onError` runs.

### Changed

- **A story that never mounts now says why, and the first occurrence named a
  cause this repository had never seen.** `gotoStory` waits for the story to
  attach, and when that ran out the message was Playwright's own — "waiting for
  locator('#storybook-root > \*')" — which is the symptom in every case and the
  cause in none. The wait for the stylesheet immediately below it had carried a
  full diagnostic since its third occurrence; this one had nothing.

  Within an hour of being written it fired on `SplitButton / Sizes` and
  reported `net::ERR_NO_BUFFER_SPACE` from the page's console: the **host** had
  run out of socket buffers, so the browser could not fetch the story's chunk.
  Measured immediately afterwards: 1172 sockets in TIME_WAIT, 1117 of them to
  the preview server, after roughly 2900 story loads in one session. Memory was
  fine — 6.67 GB free, no orphaned processes — which is why §11.5's diagnostic
  had pointed at the machine and then had nowhere to go
  ([doc 10 §11.5.1](./docs/foundations/10-quality-and-verification.md)).

  The wait is bounded at 20 seconds, and that is a budget split rather than a
  speed limit: unbounded it consumes the whole 30-second test timeout,
  Playwright closes the context, and the diagnostic cannot read the page at
  all — which is exactly how the stylesheet wait's third occurrence reported
  nothing.

- **The CI worker count is written down instead of computed.**
  `workers: '50%'` resolves to 2 on a four-core GitHub runner and to 6 on the
  twelve-core laptop every other figure in that file was measured on. Read from
  a real run: `Running 438 tests using 2 workers`. Local stays a fraction, with
  the record beside it — six workers dropped a check in two runs of two, four
  in the second of two, two passed 480 of 480 — and `--workers=2` is the remedy
  on a machine that shows it. Not a retry: doc 10 §11 is explicit that a retry
  turns a real failure into a coincidence, and this failure is real, it just
  belongs to the host.

- **The browser's time zone is pinned to UTC.** It was the third of doc 10
  §11's three machine variables and the only one still unset — a value no check
  chose and no check could see, on a suite whose calendar baseline has already
  failed CI on a time zone once. It doubles as a test of decision 0023: this
  library never reads the browser's zone, so pinning it must change nothing,
  and all 196 baselines came back byte-identical in the container.

- **A committed `.only` can no longer pass.** `forbidOnly` is on for CI.
  Playwright's default is `false` and `.only` focuses the whole run rather than
  its own file, so one left behind would take the `checks` project from 438
  tests to 1 and report green. Measured: zero `.only`, `.skip` and `.fixme` in
  `e2e/` today, so it changes nothing and prevents one thing.

- **`cancel-in-progress` applies to pull requests only.** The group is keyed on
  the ref, so for a push it is the whole of `main`: merging a second pull
  request inside the browser job's twelve minutes would have cancelled the
  first commit's verification with nothing to re-run it, leaving a commit on
  main with no verdict and no record saying so. Measured before changing it: of
  71 push-to-main runs, 0 were cancelled — prevention rather than a fix.

- **Both jobs have a `timeout-minutes`.** The default is six hours. Measured on
  2026-09-11, the fast job is 1 m 49 s and the browser job 11 m 52 s; the
  bounds are 15 and 45, generous on purpose, because a bound on a hang is not a
  budget on a duration (doc 10 §11).

- **A failure now proves it has pictures before uploading them.** Doc 10 §11.6
  is about this exact step, which uploaded nothing for months under a comment
  explaining why it mattered. A step before the upload asserts
  `playwright-report/index.html` exists and is not empty, and prints every PNG
  the run produced — a log line survives a broken upload, an expired artefact
  and the retention window, and is the only copy of the evidence that does.

- **Every GitHub Action is pinned to a commit**, with the version in a trailing
  comment, in both workflows. A major tag is a pointer its owner can repoint,
  and `release.yml` runs three of them holding `NPM_TOKEN` and `id-token:
write` — while CLAUDE.md promises "versions never drift" about everything
  else in the repository. The bump also clears the Node 20 deprecation warning
  all four were carrying, and `pnpm/action-setup` v6 is the first release that
  declares support for pnpm v11, which is the version this repository pins.

### Changed

- **The package is published unminified and with no source map**, which takes
  the tarball from 398.8 kB to 165.4 kB and an identifier in a stack trace from
  `cs` to `useConfig`. Two thirds of the old download was `dist/index.js.map` —
  967 kB raw — and its whole job was to undo the minification on the line
  above it.

  All three shapes were measured, because the obvious cut is not the one taken:
  minified without a map is the SMALLEST of the three at 113.4 kB, and the only
  one that cannot be debugged at all. The 52 kB between that and this is what
  names cost
  ([decision 0026](./docs/decisions/0026-the-package-ships-what-a-consumer-can-read.md)).

  A library is an input to somebody else's bundler and that bundler minifies
  the application, so doing it here saves the end user nothing. `react-aria`
  and `react-aria-components` publish the same shape; measured in
  `node_modules` rather than assumed. The cost is that the intermediate file
  doubles, 304.1 kB instead of 155.7 kB, which is a real runtime cost only to a
  consumer who ships unminified.

  `check:package` no longer allows a `.map` beside the file it belongs to, so
  turning `sourcemap` back on fails the build naming the file rather than
  passing as a sibling. The README's tarball ceiling came down from 450 kB to
  220 kB in the same change: it had been written a day earlier against the
  398.8 kB measurement, and a ceiling with 285 kB of slack is not a ceiling.

### Fixed

- **Four components were built with no CSS at all.** `dist/styles.css` — the only
  stylesheet the package publishes — contained none of the rules for
  `ButtonGroup`, `Steps`, `ColorPicker` or `ColorSwatchField`. Measured before
  the fix: zero occurrences of `bb-button-group`, zero of `bb-checkerboard`,
  and none of the `bb-step` rules. A joined row of buttons kept its individual
  corners and seams, a step list lost its numbers and connectors, and a colour
  swatch lost the checkerboard behind a transparent value.

  The cause is that a stylesheet had two doors. `src/styles/index.css` names
  every one by hand and the Tailwind CLI compiles that file and nothing else —
  `@source` scans `.ts` and `.tsx` for class names and follows no import. Three
  stylesheets arrived instead through a JavaScript `import './X.css'`, which
  Vite's library build extracts into a file beside the bundle and strips from
  `index.js`: the rules were compiled into `dist/blackborne.css`, inside
  `files: ["dist"]`, named by no export condition and imported by nothing.

  Nothing here caught it because **the catalog loads the built stylesheet for
  its tokens and renders components from source**, so Storybook's own Vite
  processed those imports and injected them. 196 baselines, 480 accessibility
  checks and 438 browser checks all looked at a correctly styled page.

  No consumer received it: the rewrite has not been released, so npm still
  holds `0.1.1` and the old codebase. It would have gone out with the first
  release of this one.

  A `no-restricted-imports` pattern now refuses a `.css` import in shipped
  source (verified in both directions: three violations caught, zero once they
  moved), and `src/styles/stylesheet.test.ts` asserts the list in `index.css`
  is complete against the filesystem in both directions.

- **Every published type was `any` under Node's own module resolution.**
  `dist/index.d.ts` re-exported 110 extensionless relative paths, which `node16`
  and `nodenext` cannot follow. Measured from a consumer: with
  `skipLibCheck: true`, the common default, `ButtonProps` resolved to `any` and
  a bogus prop passed without an error; with `skipLibCheck: false`, 110 × TS2834
  reported inside our own file. Only `moduleResolution: bundler` ever worked.

  The package now ships **one** self-contained declaration file, rolled up from
  the emitted tree, so there is no relative import for a resolver to follow
  ([decision 0025](./docs/decisions/0025-the-package-ships-one-declaration-file.md)).
  The public surface was verified identical across the change: 191 exported
  names before, 191 after, none missing and none added.

  `dist` now holds only what the `exports` map names, which also ends a smaller
  problem — `tsc` never prunes, and two declarations for deleted modules were
  on disk and being published.

### Added

- **Doc 10 §3's `Package` layer, which had never existed.** `pnpm verify` now
  builds the package and runs `publint`, `@arethetypeswrong/cli`, an assertion
  that every value in the type surface imports at run time, and an assertion
  that nothing in `dist` is unreachable through the `exports` map. It found
  both defects above within a minute of its first run, and neither was visible
  to any other layer: nothing in this repository consumed the built package.

  It reaches the release workflow for free, because that workflow runs
  `pnpm verify` before publishing — so a tarball with a broken export map, an
  unresolvable type or a missing stylesheet can no longer be pushed to npm.

- **The weight budgets are asserted.** Doc 10 §7 opens with "a budget without a
  number is not a budget: when you exceed it, you do not find out", and the
  numbers had been published in the package README since `0.2.0` with nothing
  reading them — so on 2026-09-10 `dist/styles.css` was 66.5 kB against a
  published 60 kB ceiling and nobody found out. `check:budget` reads the
  ceilings **from that README table** rather than keeping a second copy, and
  fails with the delta.

  The CSS raw ceiling is revised to 80 kB with the data doc 10 §7 asks for: 60
  kB was set at eight components, and there are fifty-one. The gzip half is not
  raised and is the one that binds — 10.8 kB against 12 kB.

### Removed

- **`validate` and `validationBehavior`, on the ten fields that had them.**
  **Breaking**, and it removes props nobody chose: they arrived with the base's
  own props, because every one of those fields extends them with an `Omit`.
  Measured before removing — ten fields published both, and nothing in this
  repository used either.

  [Decision 0005](./docs/decisions/0005-validation-stays-in-the-project.md)
  settled this library's answer to "is this value valid" before any of these
  fields existed: the project decides and passes `isInvalid` with a message it
  wrote. `validate` is a second answer to the same question, and one question
  gets one mechanism.

  `validationBehavior` is the more expensive half and the reason this is not
  tidying. It chooses between the base reporting a message to us and the
  **browser** doing it natively — its own bubble, its own wording, its own
  language — where doc 05 says every string a person reads comes from the
  dictionary. Supporting `validate` honestly would have meant documenting and
  testing both presentations of an error.

  **Migration**, and it is one line, because the field is already controlled:

  ```tsx
  // before
  <TextField label="Email" validate={validateEmail} />;

  // after
  const problem = validateEmail(value);

  <TextField
    label="Email"
    value={value}
    onChange={setValue}
    isInvalid={problem !== null}
    {...(problem === null ? {} : { errorMessage: problem })}
  />;
  ```

  `internal/validationProps` names the pair once and the ten fields refuse it,
  with a type-level test on all ten: `@ts-expect-error` fails the build if
  either prop comes back, which is the only place a claim about a surface can
  be made. Verified by putting one back and watching the build break.

  **The refusal is in the type**, which is what the public API is. Each field
  spreads the props it does not use onto the base, so a consumer who casts past
  the type still reaches `validate` at run time — the same way `Progress`
  refuses an indeterminate mode. Stripping the pair would mean destructuring
  two names the type no longer has, in ten components, to prevent something
  that was never documented.

  `ComboBox` had refused both by hand since it shipped, for a reason worth
  keeping: its `Validation<…<M>>` argument carries the selection mode, so
  forwarding `validate` pinned that component's generic and the plural branch
  would not compile. The other nine forwarded it in silence, because nothing
  about them refused to build — which is why the count took a measurement
  rather than a compiler. `Radio` and `Switch` never had it: the base puts
  validation on the group, and a switch has none.

  **And the shape underneath is the actual cause, which is now a row of its
  own.** `Omit` is a blacklist, so a field extending the base with one
  publishes whatever the base adds next, with nobody deciding — hard rule 8
  read backwards. Every component built from `Calendar` onward uses `Pick`, and
  `validate` reached exactly the ten `Omit`-shaped fields and none of the
  others. Converting them is bigger than this and waits.

### Changed

- **The README's "now" column is gone.** It said `dist/styles.css` was 38.2 kB
  while the file was 66.5 kB. A number written in prose has nobody to keep it
  true (doc 10 §11.6); the current figures are printed by the check, and the
  snapshot that remains carries its date. The duration rows moved to a table of
  their own, recorded rather than asserted — a check that fails when a suite
  takes too long is a check on how loaded the machine was (doc 10 §11) — and
  they now hold the first real CI measurements this repository has had.

- **A visual failure on CI now ships the pictures.** The workflow has uploaded
  `playwright-report/` on failure since the visual suite existed, under a
  comment saying the diff images are the whole point of a visual failure.
  **That directory was never created**: no reporter was configured, so
  Playwright used its default — `list` locally, `dot` on CI — and neither
  writes a report. The step uploaded nothing, and an upload of a missing path
  warns rather than fails, so it looked finished.

  The config asks for the html reporter on CI now, keeping `dot` for the
  console, and the workflow uploads the raw `test-results/` alongside it — the
  `-actual.png` and `-diff.png` side by side, one download and no HTML to
  navigate. Verified by running under `CI=1` and opening what came out.

  It cost what the comment predicted: `avatar-states` failed at 289 pixels on a
  branch that changed no pixel, and the artefact that would have said why did
  not exist. Doc 10 §11.6 has the rule — verify the artefact, not the step.

- **A middle click clicks the LINK, not a point where the link used to be.**
  It was the only one of the four tab checks reading `boundingBox()` and then
  clicking that coordinate, and it is the one that failed on CI: anything that
  reflows between the two reads leaves the click on the page background, which
  opens no tab, raises no error, and spends fifteen seconds polling for
  something that was never going to arrive. `locator.click({ button: 'middle' })`
  re-resolves the element and waits for it to receive events at click time,
  which the ctrl-click beside it has always done.

  And because none of those four checks has ever reproduced locally, the
  helper now says what it FOUND when no tab appears — how many pages the
  context holds, and each one's `url()` beside its own `location.href`. Those
  separate the three outcomes that need different fixes: the browser opened
  nothing, the click was taken as an ordinary navigation, or Playwright lost
  the target. `Expected: 2, Received: 1` separates none of them.

- **A polled callback no longer throws where the render has not caught up.**
  Measured, and it is a property of the instrument rather than of one check:
  `expect.poll` does **not** retry a callback that throws — it propagates on
  the first call and never consults its timeout. So a callback reading
  `getComputedStyle(querySelector(...)!)` has one attempt wearing a
  five-second budget. `checkbox-marks` was the one call site that provably
  could, and it now returns a sentinel the assertion will not match, which is
  a retry. No failure has been attributed to it; this is a weakness removed
  rather than a cause fixed (doc 10 §11.4).

- **There is one accessibility engine in a story page, and the panel runs when
  a person asks it to.** The suite failed once with
  `Error: Axe is already running`, on one story, and never again — the kind of
  thing a repository writes off. It was not weather.

  Storybook's accessibility addon runs axe in the preview after **every** story
  render, and `AxeBuilder` injects a second engine over `globalThis.axe` and
  calls into it. If the addon's run has not finished, that call lands on an
  engine mid-run. Measured with an assertion added to the suite for exactly
  this purpose: **11 of 480 stories** carried the flag before injection under
  six workers, and none at all in isolation, which is why it looked like a
  flake.

  The switch is not the obvious one. The addon's default parameter is
  `test: 'todo'`, so removing our own `a11y: { test: 'error' }` changed nothing
  — measured, 11 of 480 again, and that is the step that would have looked like
  the fix. What stops it is the addon's `manual` global. Three full runs since:
  clean.

  Nothing is lost: `test` configures Storybook's own test runner, which this
  repository does not have. `accessibility.spec.ts` walks all 480 stories in
  the built catalog and fails the build, and the panel is still a keypress
  away with the same rules — which it did not have before, since it disabled
  one rule of its own where the suite disables seven. Both now read
  `e2e/a11yRules`.

  The assertion stays in the suite rather than coming out with the cause, so a
  second path to it names itself (doc 10 §11.3).

- **The accessibility suite no longer waits for the network to go quiet.** It
  used `waitForLoadState('networkidle')`, which is a 500ms floor on a page that
  painted in 21ms and unbounded on a page that never gets 500ms of silence —
  and how often a chunk arrives is a property of how many browsers are
  competing for the machine, which doc 10 §11 says a check may not depend on.
  It is what an `a11y timeout under load` turned out to be.

  Two `requestAnimationFrame` callbacks are what the colour-contrast rule
  actually needs, and they cost 21ms against 574. The suite is 3.8 minutes
  instead of 4.3, and the guarantee is stronger rather than weaker: it already
  asserts on every story that the contrast rule RAN, so a wait too short to
  settle the page fails 480 times instead of passing quietly.

  That wait and the image poll `Avatar` earned now live in `e2e/settle`, shared
  by the accessibility suite and the visual one. All 196 baselines came out
  byte-identical, which is the proof the extraction changed nothing.

### Added

- **`FileUpload`** — a field for choosing files, with a row per file.

  ```tsx
  <FileUpload
    label="Attachments"
    files={files}
    onSelect={send}
    onRemove={forget}
    accept={['image/*', '.pdf']}
  />
  ```

  **It does not upload**, which is the thing everybody expects it to do and the
  one thing it may not: hard rule 6 allows this library no request at all. So
  it receives files and reports them, and the project sends them, measures the
  progress and decides what a failure means — feeding all of that back through
  `files`. The same division `Toast` has, where `useToasts` makes the queue and
  the consumer owns it, and it was settled in writing before the component
  existed.

  A `FileUploadItem` is what a project knows about a file rather than what a
  `File` knows about itself: an id, a name, a size, how far it has got, and why
  it failed. A row shows the name, the size formatted through `Intl` in the
  received locale, a `Progress` bar **named after the file** while it is going,
  the reason it failed, and the two controls those states earn — a cross named
  after the file it removes, and a retry that appears on a row that failed and
  only where `onRetry` can service it.

  **Three routes in, and the base supplies all three.** A pointer drops onto
  the zone; the file dialog opens from the button inside it; and a keyboard
  reaches the zone and pastes — the base renders a visually hidden button in
  there and wires the clipboard to it, which is what lets a drop target pass
  this library's entry gate at all. Its dashed border is the only one in the
  library, and it means "an area, not a control".

  What it found is an instrument rather than a defect. **A drop built in the
  page delivers no file**: `new DataTransfer()` with a `File` added to it
  reports `types: ['Files']` and `files.length: 1`, and
  `items[0].webkitGetAsEntry()` answers null — Chromium gives a filesystem
  entry only to an item from a real drag, and the base skips an item that has
  none. Every drag event fires, the zone lights up, `onDrop` runs, and the list
  is empty. The check drives a real drag through the DevTools protocol with
  paths on disk instead (doc 10 §11.1), and the folder case drops a folder
  **and** a file so that "nothing was added" cannot pass for a drop that never
  arrived.

  Two smaller measurements came with it. The base's drop zone passes
  `filterDOMProps(props, { global: true })`, which forwards **fewer** aria
  attributes than `{ labelable: true }` does — the two sets are disjoint — so
  an `aria-describedby` handed to the zone never reaches the DOM and the
  description hangs off the "Choose files" button instead. And the zone's name
  comes out as "DropZone Attachments", the base's own word glued to ours
  through element references; left alone, for the reason `ComboBox`'s "Show
  suggestions Doctor" was left alone, and on doc 06 §5's list for the
  screen-reader pass.

- **`ColorPicker`** — a colour chosen from a gradient.

  ```tsx
  <ColorPicker label="Brand colour" value={colour} onChange={setColour} />
  ```

  The other half of the pair: **for a colour nobody has decided yet** — a
  brand, a theme, a chart series somebody is tuning. `ColorSwatchField` is for
  one chosen from a set the project already owns, which is the more common case
  in a management application by some distance.

  **Four ways in, and the base wires all of them**: the area for saturation and
  brightness, a slider for hue, another for transparency when it is offered,
  and a field for typing a hex somebody already knows. Every one is
  keyboard-operable — the area is two range inputs, one per axis — which is the
  thing that usually makes a colour picker fail this library's entry gate.

  **The format is declared** (decision 0024), and this is the component that
  prop exists for. After a drag in the area the colour's own space is `hsb`, so
  `toString()` would report `hsb(226, 72%, 87%)` to a project that wanted hex.
  Two development warnings come with it: offering transparency with a format
  that cannot carry it, and a value that already has transparency arriving into
  one.

  **It always holds a colour**, and there is no clear button. That is the
  base's shape rather than an omission — measured: `useColorPickerState` falls
  back to `#000000` and its setter refuses null, because a two-dimensional area
  always points somewhere. Where "no colour" is a real state it belongs to
  something beside this field.

  Four things it found, three of them defects of my own:

  - **A colour that might be transparent needs a checkerboard behind it.**
    Without one, a half-transparent blue is just a paler blue. `internal/checkerboard`
    is the pattern, and it goes on a WRAPPER: the base writes the colour
    inline, and a background image on the same element paints over its colour
    rather than behind it.
  - **A `group-*` variant only matches a descendant**, and this was the third
    shape of that trap here. The chevron sat in the frame's trailing slot — a
    sibling of the trigger that carries `aria-expanded` — so it never turned.
  - **A control that cannot express the value is not offered.** The base's hex
    field speaks six digits and nothing else, so with transparency on it would
    show an opaque colour and typing in it would report one. It is dropped
    there.
  - **`LayerPage` is the theme scope as well as the portal container.** The
    first dark baseline showed a light panel of gradients over a dark card,
    because a layer is portalled to the body and the theme was on a panel.

- **`ColorSwatchField`** — a colour chosen from a closed palette.

  ```tsx
  <ColorSwatchField
    label="Label colour"
    colors={['#3e63dd', '#e5484d', '#30a46c']}
    value={colour}
    onChange={setColour}
  />
  ```

  A management application asking for a colour usually means "one of ours" — a
  label on a task, a colour for a calendar — and the answer is a set the
  project already owns. Where a colour genuinely is arbitrary, that is
  `ColorPicker` and it is a different component.

  **The value is the string you wrote.**
  [Decision 0024](docs/decisions/0024-a-colour-crosses-as-a-string-and-the-format-is-declared.md),
  written before the component: a colour crosses as a string, and the format is
  declared rather than guessed — because `toString()` turns `#3e63dd` into
  `rgba(62, 99, 221, 1)`, `toString('hex')` uppercases it, and `hex` silently
  drops the alpha. That decision's exception is this component: since the
  answer can only be one of `colors`, it reports that exact string, in the same
  case and the same notation. So there is no `format` prop here; the picker
  will have one, because a value dragged out of an area was never one of its
  inputs.

  **The palette is a prop, not children**, because a palette is data — and it
  is what makes the exact report possible at all.

  **Every swatch is named by the platform**: "dark vibrant blue", localised,
  with a role description of "color swatch", both from the base's own strings
  rather than from this library's dictionary. Doc 05 §2.3's list grows by two,
  and naming ten thousand colours in every language is not a job for a
  component library.

  **Nothing is drawn inside a swatch, ever.** A mark on a colour the library
  has never seen is white on pale half the time — measured on a calendar at
  1.12:1 — so both marks a swatch can carry are outside it, in the two
  mechanisms doc 06 §3.1 names: an offset outline for chosen, the border and
  halo for focus. They compose, so one swatch can carry both.

  Three things it found:

  - **A base collection forwards four aria attributes and drops the rest.**
    `aria-invalid` was written, typed and simply not rendered:
    `filterDOMProps(props, { labelable: true })` passes `aria-label`,
    `aria-labelledby`, `aria-describedby` and `aria-details` and discards
    everything else. So the error reaches a reader through the description,
    which is asserted rather than assumed.
  - **Two marks in one mechanism are one mark.** The first version drew chosen
    and focused as the same offset outline, and took the focus colour from
    `--bb-focus-ring` — the accent, the same colour. A focused swatch looked
    chosen.
  - **`outline-hidden` kills an outline you meant to keep**, and the first
    baseline showed three identical swatches on a row labelled "Chosen".

- **`Avatar`** — a picture of somebody, with something in its place when there
  is none.

  ```tsx
  <Avatar name="Carlos Ramos" src={photo}>
    CR
  </Avatar>
  ```

  **It does not make the initials.** Turning "Carlos Ramos" into "CR" looks
  like string handling and is a transformation of a person's NAME, which fails
  in more languages than it works in: a Japanese name has no space to split on,
  Arabic is read the other way so the first letter is not the first character,
  and "de la Cruz" yields "D" from any rule short enough to write. Doc 05 §4.2
  is the new line, written before the component. The fallback arrives as
  children the way an icon does; the full name arrives as a prop.

  **Named or decorative, and never neither.** `name` is required and
  `isDecorative` decides whether it is announced — the arrangement `Spinner`
  has, because an avatar beside the name it belongs to would otherwise have a
  reader hear it twice in one breath. An unnamed picture of a person does not
  compile, which a `@ts-expect-error` asserts.

  **The name is on the box, not on the picture.** An `<img alt>` names itself
  perfectly well and initials cannot, so `role="img"` with an `aria-label`
  carries it either way — measured with an aria snapshot, which also corrected
  the claim that followed: `img` is marked "children presentational" in the
  ARIA specification, and the snapshot still shows the letters in the node. So
  whether a reader says them is on doc 06 §5's list rather than asserted.

  **Sized off the control heights**, which is what keeps a row of avatar,
  button and field aligned and makes compact density free. Its width comes from
  `aspect-square`: there is no `--width-control-*` in the theme, rightly, and
  the first version's `w-control-md` compiled to nothing.

  Two more things it does rather than fail quietly: a picture that does not
  arrive falls back to the children, and the state is WHICH url failed rather
  than a boolean — so swapping one person for another tries the new picture
  instead of assuming it is broken too.

  It is not a loading state (that is `<Skeleton variant="circle" />`) and not a
  group: a row of overlapping faces with "+3" at the end is a second component,
  because the number is a count of children and "+{n}" is a string with a
  placeholder in it.

- **`TimePicker`** — a time chosen from a list, on a step.

  ```tsx
  <TimePicker
    label="Opens at"
    value={opens}
    onChange={setOpens}
    step={15}
    minValue="06:00"
    maxValue="22:00"
  />
  ```

  **The choosing half of a time control**, and `TimeField` is the typing half —
  decision 0015's shape rather than a new argument. **There are no segments in
  here on purpose.** A field somebody can type into cannot honour a step: the
  restriction has no expression between the first keystroke and the second,
  which is why a minute step on a segmented field is a **Never** in the
  catalog. A picker offering quarter hours in its list and accepting `14:37`
  from the keyboard would hold the rule in one half and break it in the other.

  So an arbitrary time is a `TimeField`, and a time from a set is this.

  **It is a `Select` with its rows generated**, not the columns in a layer the
  catalog predicted — and the row now records why. A step bounds the count (96
  rows at a quarter of an hour), and a select already owns the trigger, the
  panel, the list's width, the tick, the typeahead, the required state and the
  whole keyboard. Columns would have been a second mechanism for a job already
  done. The rows themselves are `clockSteps`, a pure function tested without
  rendering anything.

  **Emptying is a row rather than a cross.** Doc 07 §2.2 rule 5 sends a field
  that opens a layer to the chevron alone, because emptying has a route costing
  no width — "an option that returns to no value". This component owns its
  options, so it provides that row itself while the field is not required. It is
  therefore NOT §2.2a's third case, which the catalog expected; that section now
  records the tightened test.

  **The words come from the locale and the value does not.** One value, `14:00`,
  reads `2:00 PM` in `en-US`, `2:00 p. m.` in `es-PE` and `14:00` in `ja-JP` —
  two of those locales are both twelve-hour and disagree about how to write the
  marker. Rows are formatted against UTC, because a time of day has no zone.

  Two things it does rather than fail quietly: a value the step cannot reach
  gets a row of its own, because a field holding a value may not show none —
  and it says in development that either the step or the data is wrong. And a
  step that makes more than 288 rows says so too, being a document rather than
  a list.

- **`Slider`** — one value on a range, dragged or typed with the arrow keys.

  ```tsx
  <Slider
    label="Sample rate"
    value={rate}
    onChangeEnd={setRate}
    maxValue={1}
    step={0.01}
    formatOptions={{ style: 'percent' }}
  />
  ```

  **For a value where the approximate is the point** — a threshold, a weight,
  an opacity. It shows the whole range at once, which is what makes it worth
  the width. Where an exact figure matters it is a `NumberField`: a slider
  cannot be typed into, and its precision is a step somebody else chose.

  **It reads `Progress`'s row and `Progress`'s rail**, down to the token: the
  same `label` and `isLabelHidden`, the number at the trailing end with
  `isValueHidden` to drop it, and a well in `surface-sunken` with the accent
  filling it. The two are the same object read two ways. The one difference is
  that the fill has no transition — a bar is told about a value that changed
  somewhere else, and this one is being dragged, so easing it would put the
  fill behind the pointer.

  **Two callbacks and they are not the same.** `onChange` fires on every step
  of a drag, which is what a preview wants; `onChangeEnd` fires once, where the
  value came to rest, which is what anything that costs something has to use.

  **One value.** A two-ended range is reachable — the base takes an array — and
  it is not here, because nothing needs it today. When it arrives it is a
  discriminated union the way `ComboBox` holds several values, not an `isRange`
  flag; the catalog has that as a row rather than left to memory.

  **And no `errorMessage`.** A value is clamped to its range and snapped to its
  step, so there is no way to hold one that is wrong. A rule about acceptable
  values is a rule about `minValue` and `maxValue`.

  Three things it found:

  - **A `dir` attribute is not a locale.** The fill's offset is a logical CSS
    property the stylesheet mirrors on its own; the handle's is a percentage
    the base mirrors only when the LOCALE is right-to-left. Measured on a story
    with `dir="rtl"` and no locale: at 30 out of 100 the fill occupied the
    right 30% of the rail and the handle sat at 30% from the LEFT. Doc 05 has
    it as §4.1, and the check asserts the two AGREE rather than asserting each
    one — both halves are true in the broken case.
  - **A disabled slider showed no value at all.** The disabled fill was
    `surface-disabled`, which against the rail measures 1.08:1 in light and
    1.00:1 in dark — the same colour exactly. Found by opening the first
    baseline. It is `text-disabled` now, at 2.90:1 and 3.43:1.
  - **`justify-between` puts a single item at the start**, so a hidden label
    moved the number to the leading edge — measured at x = 0 against x = 305 on
    every other row.

- **`ButtonGroup`** — a row of buttons joined into one control.

  ```tsx
  <ButtonGroup variant="primary" size="sm">
    <Button onPress={previous}>Previous</Button>
    <Button onPress={next}>Next</Button>
  </ButtonGroup>
  ```

  For actions of one kind, where the adjacency is the point. A row of unrelated
  actions is a row of buttons with a gap, which is layout and belongs to the
  consumer: joining them says they are alternatives, and saying that when it is
  false is worse than saying nothing.

  **It is not a segmented control.** A joined row that expresses a CHOICE — one
  of the three is on, and pressing another moves it — is a field with a value
  and has to announce itself as one. That is a different component and it is
  not built.

  **`size` and `variant` travel by context**, which is doc 02 §3.1.1's rule for
  a variant belonging to the set. A member's own prop still wins, so a row of
  secondaries with one primary in it is written the obvious way — the group's
  appearance is a default, not a rule. And a consumer's own component that
  renders a `Button` takes it too, which cloning the children could never have
  managed.

  **Three of the six variants**, and the other three are refused rather than
  forgotten. `ghost` and `link` carry no border and no fill, so there is
  nothing for the seam to be made of and joining them would do nothing at all;
  `danger` is out for `SplitButton`'s reason, a set of adjacent destructive
  actions that look identical being one misclick from the wrong one.

  **No role and no name.** Five buttons in a row are five buttons, every one
  already named; a `role="group"` would add something to announce and nothing
  to do with it. Whether a row that LOOKS like one control and announces as
  several costs anything is on doc 06 §5's list for the screen-reader pass.

  Three things it found, and all three are recorded rather than quietly fixed:

  - **A set's context crosses a portal.** A popover opened from inside the
    group rendered its footer in the group's own size and variant — measured
    with a probe, which read `primary/sm` where a person would have seen small
    primary buttons in a dialog. Every layer that can hold a button now closes
    the set around its content, which is one call site for four of them because
    they share the sheet. Doc 02 §3.1.1 has the rule, and why it arrives with
    buttons rather than with `RadioGroup`.
  - **A focus ring needs somewhere to be on top.** The ring is a border plus a
    4px halo drawn as a box-shadow and the buttons overlap by a pixel, so with
    no z-index the later sibling paints over the halo and the ring of anything
    but the last button is cut in half. Nothing in the DOM is wrong, a
    box-shadow is not hit-tested, and the baseline is what shows it.
  - **The catalog predicted the wrong thing about it**, which its row now says.
    This was to be "the first component to propagate through context"; it is
    the third, after `RadioGroup` and `Accordion`.

- **`Steps`** — where something is in a process, step by step.

  ```tsx
  <Steps label="Onboarding">
    <Step status="completed">Details</Step>
    <Step status="active" description="Two documents">
      Documents
    </Step>
    <Step status="error">Review</Step>
    <Step>Signature</Step>
  </Steps>
  ```

  Four statuses — `pending`, `active`, `completed`, `error` — and no
  `disabled`: a step nobody may reach yet is pending, and switched off with no
  way to know why is doc 06 §4 rule 7. Whether step 3 may be opened is
  validation, and validation is the project's.

  **Nothing in it can be pressed**, which is decision 0015 rather than an
  omission. A stepper is two components and only one of them is here; the half
  that navigates is `Tabs` with disabled tabs, and it already exists. A list
  with the current step marked says the true thing and promises nothing — a row
  of tabs would announce "tab 3 of 5" and imply the arrow keys move between
  them. It takes `Progress`'s vocabulary for the rest, the same `label` and
  `isLabelHidden`, because the two answer one question with different amounts
  of detail.

  **The numbers come from a CSS counter.** A `number` prop lets a consumer
  write 1, 2, 2, 4 and a component cannot help them; an index computed in
  JavaScript means reading the children, which is the constraint decision 0018
  brings with it and which `Tabs` and `Breadcrumbs` accept only because their
  pieces land in different places. A counter re-evaluates on its own, so a step
  rendered conditionally still numbers 1, 2, 3 — the same argument that gave
  the breadcrumb separator to the step after it rather than to a loop.

  **Below `medium` the titles go and the indicators stay**, through doc 04
  §6's one hook and its one scale. That row's forecast in §11 read "to the
  indicators alone, scrolling", and the second half turned out not to be
  needed: four indicators and three 24px lines fit inside 320px with room to
  spare, so a scroll container would have been a mechanism with no job.
  Recorded rather than quietly dropped (§11.4).

  **And the hidden titles are `sr-only`, not `display: none`.** The first
  version used the second, which takes them out of the accessibility tree — a
  list of four items with no names in it at 320px. Nothing in `Steps` is
  focusable, so out of sight costs a reader nothing and out of the tree costs
  them everything.

  **Three things the first baseline found**, which is the layer that catches
  what an assertion cannot. The connectors were `flex-1` and came out 110px,
  28px and 85px in one row — nothing wrong with any of them and the row read as
  an accident, so the line has a fixed length and the leftover goes to the
  titles. The four indicators are separated by shape before hue, which doc 06
  §3 requires and no automated layer checks, because axe measures the contrast
  of text and a filled circle is not text. And the two tone states reuse
  `Alert`'s and `Toast`'s surfaces, so a step in error looks like every other
  error in the library.

- **`Progress`** — how much of something is done.

  ```tsx
  <Progress label="Uploading" value={43} />
  ```

  Doc 09 §3 asks that past a second you show how much is left, and `Spinner`
  stops at a second. This is that gap, and it is the dependency a file uploader
  was waiting on rather than a nicety: a file shows progress per file.

  **Determinate, and only determinate.** The base has an indeterminate mode and
  this does not, because `Spinner` is the indeterminate indicator and two
  components for one job is doc 01 §7 — a bar that pulses says exactly what a
  spinner says, with more furniture and a shape that implies a measurement
  nobody has. The absence is asserted with a `@ts-expect-error`, so adding the
  prop fails the build rather than passing quietly.

  **The number is the point rather than decoration.** A bar alone answers "is
  it moving"; the number answers "how long", which is what somebody watching a
  seven-file upload is actually asking. `tabular-nums` so it does not shift the
  text beside it on every tick, and `valueLabel` for when the unit matters more
  than the percentage — "3 of 7 files", with the announced text following the
  visible one.

  It does not decide when to appear, the same division `Spinner` has: doc 09 §3
  says nothing under about 300ms, and whoever owns the timing owns that call.

- **`TimeField`** and **`DateRangePicker`** — the two that close the date
  family, and the batch with it.

  ```tsx
  <TimeField label="Opens at" value={time} onChange={setTime} />
  <DateRangePicker label="Stay" value={stay} onChange={setStay} />
  ```

  A time crosses as `14:30` and a range as two ISO days (decision 0020).
  `TimeField` is the same segments a date has, asking for hours and minutes —
  the list-shaped half of a time control is a `TimePicker`, and a minute step
  of 15 belongs there rather than in a field nobody can stop mid-keystroke.

  **The measurement that settled why a time is not a formatted string.**
  `en-US` and `es-PE` both show a twelve-hour clock, and they disagree about
  how to write the marker: `PM` against `p. m.`, spacing and full stops
  included. `ja-JP` shows twenty-four hours and no marker at all. Two locales
  agreeing on the clock and disagreeing on the writing is the argument, and it
  replaced a guess in this component's own documentation that said `es-PE` was
  a twenty-four hour locale.

  `DateRangePicker` is one control with two fields and a synchronised pair of
  calendars. Its two halves take **named slots** from the base, or a range is
  one date typed twice. Presets are declared rather than shipped, and a maximum
  number of nights is not a prop: it is `isDateUnavailable`, whose second
  argument is the day the range was started from — a limit that moves with the
  anchor, which no number could express.

- **Doc 04 §5 has its first caller in JavaScript.**

  That section has always granted the one viewport exception to components
  rendered in a portal, and nothing had needed it: `Dialog` answers its own
  question in plain CSS, which is what a presentational change should do. A
  range calendar inside a popover cannot. How many months it builds is a **prop
  of the base's state** — paging and the range's arithmetic are computed from
  the visible duration — and a container query collapses inside a
  content-sized layer, because inline-size containment computes a width as
  though the element had no contents.

  So it reads the window, through one door and with three bounds: it happens in
  `internal/useWindowFits` and nowhere else, the threshold lives in the
  component with the reason beside it rather than borrowing the container scale
  (`Dialog.css`'s sentence: that scale "describes how wide a CONTAINER is, not
  when a window has run out of room"), and the first answer is always the
  narrow one because `matchMedia` is read in an effect.

  **The project's own lint rule got stricter on the way.** `matchMedia` was
  reachable without writing `window`, so a component could query the viewport
  and pass lint while doing exactly what the rule is about. It is named now,
  with the one allowed file scoped in the config.

- **`DateField`** and **`DatePicker`** — a date typed, and a date typed or
  pointed at.

  ```tsx
  <DateField label="Invoice date" value={day} onChange={setDay} />
  <DatePicker label="Appointment" value={day} onChange={setDay} />
  ```

  Both cross the boundary as `2026-09-09` (decision 0020). The field is the
  base's segments — day, month and year as separate targets, the arrows
  stepping one, typing filling it and advancing — and **their order and their
  separators are the locale's**: month first in `en-US`, day first in `es-PE`,
  year first in `ja-JP` with a different mark between them. Nothing here
  formats a date by hand.

  The picker adds the layer and composes rather than reimplements: the segments
  are the same internal, and the calendar in the layer is the shared body
  `Calendar` is built from. Two routes to one value, and neither is a fallback —
  somebody who knows the date types it and never opens the layer.

  **What the segments restrict, and what they do not.** Measured: there is no
  month 13, and the 31st of February can be shown and is never reported. So the
  pieces restrict what is typed into each of them and leave the combination to
  the value, which puts doc 07 §2's line somewhere more interesting than
  expected — an impossible date is a state the field can be in and a value it
  never emits.

- **Doc 07 §2.2 has an exception now, and the date family is the only thing
  under it.**

  Rule 5 sends a field that opens a layer to the chevron alone, and its reason
  is explicit: clearing has routes that cost no width — an option that returns
  to no value, or the cross each value carries in a field holding several. A
  `Select` has the first. A `ComboBox` holding several has the second. **A date
  field has neither**, and measured, it has something worse: clearing the month
  and the day leaves the reported value at the last complete date, and the year
  segment does not clear at all. A person blanks what they see and the field
  neither holds nothing nor says so.

  So the premise is false and the conclusion does not follow.
  [§2.2a](docs/foundations/07-forms.md) admits both controls at one edge, with
  four conditions and a browser check for each: both targets clear the minimum
  hit area at every density (28 against a floor of 28, and 24 against 24 at
  compact), the cross is unreachable rather than absent when it has nothing to
  offer, the chevron never yields to it, and **the clearing is reported** —
  which makes that button the one route by which a date field's value becomes
  nothing. Rule 4 is amended for the reason its own wording always gave: the
  rule is that a second control is redundant, so where it is not redundant the
  rule does not apply.

- **`RangeCalendar`** — two months, and the range across them.

  ```tsx
  <RangeCalendar label="Stay" value={stay} onChange={setStay} />
  ```

  A range crosses the boundary as two ISO days, `{ start, end }`, for decision
  0020's reason. `isDateUnavailable` gets a second argument — the day the range
  was started from, or `null` before it is — which is the base's own signature
  and what makes "no more than fourteen nights" expressible at all.

  **How many months is the container's answer**, through doc 04 §6's one hook:
  two from the `medium` step up, one below. The boundary is measured rather
  than picked — two months of grid are 408px and the scale's `narrow` step is
  384 — and it is the same boundary `Tabs` and the folded breadcrumb trail
  already use, which is §4's point about one scale rather than three. With
  nothing declaring a query container anywhere it shows one month, which is
  §4.1's narrow-first rule rather than a failure.

  **The arrows step one month whatever the structure**, which is a decision and
  not the base's default: `pageBehavior` advances by the whole visible duration
  unless told otherwise, so the same press would move one month in a panel and
  two in a page. A control whose meaning changes with the width is what rule 4
  is about.

  **The range is one shape.** The two ends are the solid accent pair, the days
  between them are `--bb-accent-subtle` with its own paired text colour, and
  the middle is square while the ends are rounded on their logical outside — so
  a stay in Arabic rounds the end a reader arrives at first without the
  component knowing which side that is. It works because the cells are edge to
  edge, measured at a gap of exactly 0, which is now written down where a
  `gap` would otherwise be added later.

  **The half of `Calendar` it shares is now `internal/Calendar`** — the classes,
  the month grid, the furniture above it and the two chained views — extracted
  at the second caller, with `Calendar`'s three existing baselines coming out
  byte-identical as the proof that the move changed nothing.

- **Three defects, all found by generating a baseline and opening it**, and one
  of them was in `Calendar` rather than in the new component.

  **A calendar in a flex container stretched to 1248px**, with cells 178 wide
  and 28 tall — a month as five flat rows of pills. A flex item's display is
  blockified, so the `inline-flex` the root asks for quietly became `flex` and
  the element took the cross size of the line. None of the three existing
  baselines could see it, because all three sit in a `block` parent, and the
  story that showed it was not photographed. `w-fit` is the fix: a declared
  width holds whichever display value it is blockified to. This is decision
  0010's consequence 1 and the popover's 2px arriving a third time.

  **The range's start painted twice.** Two months side by side overlap by a
  week, and the base marks `data-selection-start` on the copy of the day in the
  neighbouring grid — with no `data-selected` on it — so a range beginning on
  the 27th of September showed a solid pill in September AND another in
  October's outside-month row, the second one attached to no band. The same
  cause turned a **disabled** range into two disconnected days: disabled drops
  `data-selected` from every cell and keeps the two end marks. A fill now
  requires both attributes.

  **And today's ring went white on the band**, at 1.12:1. The rule is that the
  ring is the text colour of whatever is behind it, and the implementation
  keyed on `data-selected` — which means the solid accent fill in one calendar
  and a pale band in the other. Three backgrounds, three colours, and a browser
  check that measures each ring against what it actually sits on rather than
  against the page: 5.21:1 on the accent, 11.80:1 on the band in light mode,
  7.34:1 in dark, 5.79:1 on the surface.

- **`Calendar`** — a month of days, with the two views above it.

  ```tsx
  <Calendar label="Appointment" value={day} onChange={setDay} />
  ```

  The content of the date picker that will open one, and a component in its own
  right: a scheduling screen shows a month inline.

  **Three views, chained.** The heading is a button: from the days it opens the
  months, and from the months the years, twelve at a time. Choosing a month
  comes back to its days and choosing a year to its months — so reaching March
  1994 is three presses rather than three hundred and eighty arrow keys. The
  year view's heading is a range formatted by the platform rather than two
  numbers and a dash (doc 05 §2.2 rule 5).

  **The limits hold in all three**, and one of them is ours: measured, the
  base's year picker clamps to the calendar's range and its month picker hands
  over every month regardless, so which months can be pressed is arithmetic in
  `limits.ts` — and a month is judged by its SPAN, not by the day the base
  hands over, or a maximum of the fifth of December would rule December out
  with five days left in it.

  **Today comes from the configured zone, or is not marked at all**
  ([decision 0023](docs/decisions/0023-today-comes-from-the-configured-zone.md)).
  The base marks a `data-today` of its own, computed from the browser's zone
  unless the value carries one, and this component deliberately does not style
  it: the browser's zone belongs to the machine of whoever is looking rather
  than to the data (doc 05 §3.1). With no zone configured nothing is marked and
  development says why.

  **A day's four appearances are four different things**: chosen is the accent
  pair, today is a ring that takes no layout, unavailable is struck through —
  "this day exists and you cannot have it" — and disabled is dimmed, "this day
  is not in the range you are choosing from".

  **There is no read-only calendar.** The base has one and it photographed
  identically to an ordinary one, which is the argument already accepted for a
  read-only `Select` arriving on a grid: two states nobody can tell apart are
  worse than one.

  **And disabled is not the substitute this entry first named**, which the
  range calendar's own tests turned up: measured on both calendars, controlled
  and uncontrolled, a disabled calendar marks NO selection — the base drops
  `data-selected` from every cell, 0 of 35 against the 1 or 8 an ordinary one
  marks. So a calendar that must not be changed is a formatted date, and what
  a read-only appearance ought to look like stays on the catalog's open list.

  Its cells are sized from the minimum hit area rather than from a chosen
  number, so compact density makes a smaller calendar rather than a cramped
  one — and `isDateUnavailable` receives `2026-09-09`, which is decision 0020's
  cost paid where it was written down.

- **`useAsyncOptions`** — options that arrive from somewhere, paged and
  debounced, for a `ComboBox`.

  ```tsx
  const doctors = useAsyncOptions<Doctor>({
    minQueryLength: 2,
    load: async ({ query, cursor, signal }) => {
      const page = await search(query, cursor, signal);
      return { items: page.rows, cursor: page.next };
    }
  });

  <ComboBox label="Doctor" source={doctors} onSelectionChange={setDoctor}>
    {doctors.items.map(doctor => (
      <ComboBoxItem key={doctor.id} id={doctor.id}>
        {doctor.name}
      </ComboBoxItem>
    ))}
  </ComboBox>;
  ```

  **A hook and not a second component.** The request was an "async combo box"
  beside the ordinary one; paging, waiting and the states an empty list can be
  in are all logic, and P6's corollary forbids an assembly with a capability
  its pieces lack. So the logic is a hook, the field is the field it already
  was, and the two meet at one prop — the shape `useToasts` established.

  **It brings no network.** `load` is a function that returns a promise; a test
  hands it an array. The **page size is nobody's prop** either: the loader
  closes over it, which is the same answer the page-size selector got one level
  up.

  **What it adds to the base is the waiting.** A run of keystrokes costs one
  request rather than one each, and a minimum query length keeps a catalogue of
  two hundred thousand rows from being asked for its first page before anybody
  has typed. A pending keystroke counts as loading, because the alternative is
  a list showing the previous query's answers with nothing saying they are
  stale.

  **An empty list now says which kind of empty it is, five ways**: nothing
  asked for yet, the asking failed, the answer is on its way, a query came back
  empty, or there was never anything to come back. "Could not load" is not "no
  results" — blaming the query for a server's silence is the wrong answer to
  the wrong person — and the failed row is text, with a `retry` on the hook for
  a control of your own.

  **A field with a source does not filter what it is given.** The query went to
  the loader and these came back, so `keywords` have nothing to do: searching
  by something a row does not show is a `WHERE` clause rather than a prop.

  Three things were measured that shaped it, and all three are the kind that
  look fine until they are looked at. The base's load-more sentinel triggers
  within one list-height of the fold, so **a list fills itself page by page
  while there is room** — a check that waits for a scroll to prove paging
  proves nothing. `loadMore` past the last page asks for nothing, because a
  page with no cursor is how the end is declared. And `useAsyncList` loads once
  on mount whether anything asked it to or not, which is why a minimum query
  length is enforced inside the loader — **a browser check of ours was reading
  "keep typing" during a request rather than because nothing had been asked.**

  One note for tests: a field with a source renders the base's sentinel, which
  needs `IntersectionObserver`. jsdom has none, so a unit test rendering one
  has to stub it; there is a stub in the component's own tests to copy.

- **A `ComboBox` can hold several values**, each as a chip inside the field.

  ```tsx
  <ComboBox
    label="Doctors"
    selectionMode="multiple"
    selectedKeys={team}
    onSelectionChange={setTeam}
  >
    <ComboBoxItem id="7" keywords={['cardiology']}>
      Dr. Ruiz
    </ComboBoxItem>
    <ComboBoxItem id="9" keywords={['paediatrics']}>
      Dr. Vega
    </ComboBoxItem>
  </ComboBox>
  ```

  **The props are a union, not a flag.** One value or several changes the SHAPE
  of the value, so `selectedKey`/`selectedKeys` are two branches typed by
  `selectionMode` — the wrong pairing does not compile. Both branches are
  exported (`ComboBoxOneProps`, `ComboBoxSeveralProps`), because props typed as
  a union cannot be spread and then added to, and a consumer writing a wrapper
  needs to name one.

  **Choosing one leaves the list open and empties the box**, so the next is one
  press away — the base's behaviour, kept. The field's box GROWS with its
  chips, and the toggle stays at the trailing edge rather than dropping onto a
  line of its own: the wrapping happens inside the frame instead of replacing
  it.

  **Each chip's cross is named by what it removes** — "Remove Ana Vega",
  composed from element references rather than a glued string — and read-only
  and disabled keep the chips while taking the crosses away, because a value
  you cannot see is not read-only, it is gone.

  Two measurements shaped all of it
  ([decision 0022](docs/decisions/0022-several-values-are-a-union-and-the-chips-are-not-tags.md)).
  **A `TagGroup` inside a `ComboBox` does not work**: the combo box publishes
  its own `ListStateContext` for its options, so a tag inside it resolves the
  wrong collection — the heap runs out with a dynamic list and it throws with a
  static one. **And every `Button` inside one wears the toggle's props**, so
  three buttons on one field all carried the toggle's id and name until the
  crosses were told to take no context at all. What that costs is the arrow-key
  walk along the chips; what it does not cost is the announcement, which the
  base still supplies through the field's own description.

  Two more things came out of it. The chip is now shared with `TagsInput` as an
  internal piece — its two visual baselines are byte-identical after the move,
  which is what says the appearance did not drift. And the base's `validate` is
  no longer forwarded by this component: it is a form-validation hook, and this
  library's answer to validation is that the project decides
  ([decision 0005](docs/decisions/0005-validation-stays-in-the-project.md)).
  The other fields still forward it, which is now a row in the catalog rather
  than a thing nobody had noticed.

- **`ComboBox`** — typing to find one of a long list, and the first component
  of the batch after composition.

  ```tsx
  <ComboBox label="Doctor" onSelectionChange={setDoctor}>
    <ComboBoxItem id="7" keywords={['cardiology']}>
      Dr. Ruiz
    </ComboBoxItem>
    <ComboBoxItem id="9" keywords={['paediatrics']}>
      Dr. Vega
    </ComboBoxItem>
  </ComboBox>
  ```

  **`keywords` is what it exists for.** An option can be found by words it does
  not display — a doctor by a speciality, a customer by a tax number — and they
  are searched exactly as the visible text is, with the platform's collator, so
  "jose" finds "José" and "manana" finds "Mañana". They are not shown and not
  announced: a keyword is a way in, not a second label.

  **An option is a declaration**, like a `Tab` and a `Breadcrumb`:
  `ComboBoxItem` renders nothing and the field reads it. Which means a
  component of your own that returns options cannot be seen — share a value,
  not a component — and the field says so in development rather than rendering
  less than it was given.

  **The trailing edge holds the toggle and no clear button**
  ([doc 07](docs/foundations/07-forms.md) §2.2 rule 5). A keyboard opens the
  list with `ArrowDown` and a pointer has nothing else, while emptying the
  field has routes that cost no width.

  **An empty list says which kind of empty it is** — still arriving, none to
  arrive, or a query that found none of them. Doc 09 asks for that distinction
  by name, and telling somebody "no results" about a list that was never given
  any options blames their query for somebody else's empty prop.

  All eight of doc 07 §6's states, which is one more than `Select` has: you can
  type in this one, so read-only means something.

  **Two things were measured that changed the design.**
  [Decision 0021](docs/decisions/0021-a-combo-box-extends-the-bases-filter.md)
  has both. The keywords cannot live in the row's `textValue` — they filter
  correctly and are not announced, but the base writes that text into the input
  when the option is chosen, so choosing "Dr. Ruiz" left the field reading
  "Ruiz cardiology dermatology". And the component cannot filter the rows
  itself, which was the plan: the base builds its collection in a render pass
  detached from the surrounding context, so a filter written there sees no
  query and keeps every option. The filter extends the base's instead.

  It also answers the question
  [decision 0017](docs/decisions/0017-a-field-says-what-the-base-does-not-announce.md)
  left open: with `validationBehavior="aria"`, which every field here sets, a
  combo box's input carries `aria-required` — so unlike `Select` it composes no
  word into its label. Under the base's default validation behaviour it would
  be the native attribute instead, and the browser's own bubble with it.

- **`SplitButton`** — one action, with the near alternatives behind an arrow.
  The last component that was waiting for `Menu`, and the one that closes the
  layer batch.

  ```tsx
  <SplitButton label="Save" onPress={save}>
    <MenuItem onAction={saveAndNew}>Save and add another</MenuItem>
    <MenuItem onAction={saveAsDraft}>Save as a draft</MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger" onAction={discard}>
      Discard the changes
    </MenuItem>
  </SplitButton>
  ```

  **It is two buttons, not one**, and a screen reader hears exactly that:
  "Save" and "More actions", both named, neither pretending to be the other.
  Hover and focus land on one half at a time, because pressing them does
  different things.

  **Two variants**, and the reason is the seam. A `secondary` split button
  turns its two borders into one 1px line; a `primary` one has a border the
  colour of its own fill, so it draws a divider mixed from the pair's text
  colour — which follows a brand override for free. A `ghost` or `link` split
  button would be two invisible halves that only exist on hover, and a `danger`
  one is the shape doc 09 §5 argues against.

  **`isPending` switches the arrow off as well.** The menu holds alternatives
  to the action that is already running, and starting a second one mid-flight
  is the state doc 09 §7 is about — the same argument that disables
  `ConfirmDialog`'s cancelling button.

  And **the destructive command does not go first**: opening the menu with a
  key focuses its first row, so a destructive one there is a press away. Doc 09
  §5.2 now carries that as a rule of its own, and the component warns in
  development instead of trusting it to be remembered.

- **A breadcrumb trail folds its middle into a menu when the container is
  narrow**, which is the third caller of doc 04 §6's hook and the last of the
  three features that were waiting for `Menu` and `Select`.

  Below the medium step the trail keeps the two steps that matter — the way
  home and where you are — and everything between them moves into a "…" that
  opens a **menu of addresses**. Above it, nothing folds; and a trail with no
  middle to fold still wraps, because a query counts pixels and cannot know
  whether your words fit.

  Two rules stop the collapse making things worse, and both are in a pure
  function rather than in a render:

  - **The "…" never hides one step.** Folding a single step replaces something
    you can read with something you have to open. `Pagination` reached the same
    rule from the other direction, where a gap never hides one page.
  - **The two ends are never folded**, whatever the width.

  A folded step with no address arrives in the menu dimmed rather than as
  somewhere to go, which is what it already was in the row.

- **`href` on a `MenuItem`** — a row that goes somewhere rather than doing
  something, and the case that earned it is the trail above.

  ```tsx
  <MenuItem href="/customers/4821">Astilleros del Sur</MenuItem>
  ```

  Typed as a union: a row takes `onAction` or `href`, never both, so the wrong
  shape is a type error where it is written instead of a decision taken at
  runtime by whichever branch happens to run first. Doc 02 §7.1's rule — `Link`
  navigates, `Button` acts — does not stop applying inside a menu, and a row
  that navigated by calling a function could not be middle-clicked, ctrl-clicked
  or copied, with none of that failing loudly.

  A third shape comes with it, for the folded step that has no page: a row that
  names a level and cannot be pressed, whose `isDisabled` is **required**, so a
  row with nothing to do and no sign of it cannot be written.

- **`Tabs` and `Tab`** — one thing at a time, out of several, and the component
  [doc 04](./docs/foundations/04-responsive.md) §6 was written for.

  ```tsx
  <Tabs label="Invoice" defaultSelectedKey="lines">
    <Tab id="lines" title="Lines">
      …
    </Tab>
    <Tab id="tax" title="Tax">
      …
    </Tab>
  </Tabs>
  ```

  **Below the medium step there is no room for a row of labels, so the row
  becomes a `Select`** — the second caller of the library's one
  structural-change hook, and the first component whose STRUCTURE depends on
  its own width rather than its layout. The tab you were on stays the tab you
  are on across the change, which doc 04 §6 rule 4 asks for by name and calls
  the thing that breaks most often.

  It is a select, not a tab list in disguise: no tab roles, no tabpanel, and
  the arrow keys belong to the select. A tabpanel announced where no tablist is
  reachable would be semantics nobody can act on.

  **A tab and its panel are one declaration.** `<Tab id title>` carries its
  content as children, and `Tabs` splits them — the titles become the row, the
  open one's children become the panel. The base's split shape repeats every id
  and, measured, leaves a panel labelled by an element that no longer exists
  the moment its list stops being rendered, which is exactly what a structural
  change does ([decision
  0018](./docs/decisions/0018-a-tab-declares-its-own-panel.md)).

  A `Tab` is therefore **read rather than rendered**, with the constraint every
  collection API has: a component of your own that returns a `Tab` is not one.
  Share them as a value — `const tabs = <>…</>` — or build them with `.map()`.
  Anything else is counted and reported in one development warning.

  **The row also wraps**, because a container query counts pixels and cannot
  know whether your words fit: six long titles in a wide container become two
  rows rather than a row with its end cut off.

  A title can carry a count or an icon beside the word, with `textValue` for
  the searchable text. No `orientation`, no `size`, no `href` on a tab, no
  scrolling row, and no way to choose which step becomes a select — the
  threshold belongs to the scale (doc 04 §4.0).

- **`Select` and `SelectItem`** — choosing one of a short list, and the first
  **composed field**: the field structure with a layer hanging off it, so it
  inherits both halves of the library at once.

  ```tsx
  <Select
    label="Currency"
    selectedKey={currency}
    onSelectionChange={setCurrency}
    description="Every invoice is issued in this currency."
  >
    <SelectItem id="PEN">Peruvian sol</SelectItem>
    <SelectItem id="USD">US dollar</SelectItem>
  </Select>
  ```

  **The list is as wide as the field**, which nothing else anchored in this
  library is: a list narrower than the field it belongs to reads as a different
  control. It may grow WIDER — up to the narrow container, where it wraps —
  because the alternative is truncating every row to the field's width and
  hiding the ends of the very options somebody opened the list to read.

  The chosen option is marked by **a tick as well as weight**, never by the
  highlight alone. The moment a list opens the two are the same row; the moment
  an arrow moves, they are not, and a selection shown only by the highlight
  would vanish at that point.

  `selectedKey`, `defaultSelectedKey` and `onSelectionChange` are `string`
  rather than the base's `string | number`, and the callback reports `null` —
  the same shape as the value, so a controlled pair round-trips.

  **A required select says so out loud**, and it is the one component here that
  composes a word into its own label. Measured: the base does not put
  `aria-required` on the button a person operates, so the asterisk `Field` draws
  would have been the only channel — and an asterisk announces nothing.

  No typing and no filtering (that is `ComboBox`, and it is next), no multiple
  choice, no sections, and no read-only state — the base's select has none, and
  a select is either offered or it is not.

- **`Menu`, `MenuItem` and `MenuSeparator`** — a short list of commands,
  opened by a control. The middle of the composition batch, and what three
  deferred features were waiting for.

  ```tsx
  <Menu trigger={<Button>Actions</Button>}>
    <MenuItem onAction={send}>Send</MenuItem>
    <MenuItem onAction={duplicate}>Duplicate</MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger" onAction={remove}>
      Delete
    </MenuItem>
  </Menu>
  ```

  **No `label` prop**, and that is measured rather than assumed: the base points
  the menu's name at the trigger, so a menu opened by a button called "Actions"
  is the Actions menu. A label prop would be a second name for one thing.

  Everything a menu is for is the base's and none of it is written here — the
  arrow keys, the typeahead, the single highlight that follows a pointer as
  well as a key, `Escape` closing without running anything, and focus returning
  to the trigger. All of it is checked in a browser, because jsdom implements no
  real tab order.

  `tone="danger"` for a destructive command, which is red **and** says what it
  does — colour is never the only channel (doc 06 §3).

  No sections, no submenus, no selection and no arrow. And `href` on a command
  is one wave away rather than hypothetical: a collapsed breadcrumb trail is a
  menu of addresses.

- **`Pagination` and `CursorPagination`** — two pagers, and the first
  component in the library whose STRUCTURE depends on its width.

  ```tsx
  <Pagination page={page} pages={12} onPageChange={setPage} />

  <CursorPagination
    hasPrevious={cursor.before !== null}
    hasNext={cursor.after !== null}
    onPrevious={loadPrevious}
    onNext={loadNext}
  />
  ```

  **Two components, not a mode** (decision 0014): offset pagination is given a
  total and computes everything from it, and cursor pagination is given two
  booleans and cannot know a total, ever — the number does not exist on its
  side of the network.

  **The row changes shape with its container**, which is level N3 of doc 04 and
  the level that had never run: no numbers below the narrow step, five at it,
  seven from medium up. Three of the same component at three widths inside one
  1280px window is the check, because that is P4's own question. The first
  paint is always the narrowest of the three.

  The page you are on is **text, not a control** — the decision `Breadcrumbs`
  made about its last step — so `Tab` walks only the pages you can reach. Page
  numbers are formatted for the locale, which in `ar-EG` means Arabic-Indic
  digits, and the figures are tabular so the row does not change width as
  somebody pages through it.

  `pageWindow` is exported with them: the whole of the offset pager's logic as
  a pure function (P6), tested over every page of every size from one to
  thirty.

  Four new dictionary keys — `pagination`, `previousPage`, `nextPage` and
  `page`. The last is the first key in the library with a placeholder in it,
  which doc 05 §2.2 rule 5 permits as simple value substitution.

- **`Breadcrumbs` and `Breadcrumb`** — where you are, and the way back.

  ```tsx
  <Breadcrumbs>
    <Breadcrumb>
      <Link href="/customers">Customers</Link>
    </Breadcrumb>
    <Breadcrumb>Astilleros del Sur</Breadcrumb>
  </Breadcrumbs>
  ```

  **The last step is text and the ones before it are links.** A link goes
  somewhere, and the page you are on is not somewhere to go — it is marked as
  the current page instead. A step is composed rather than configured, so it
  holds whatever it should: a `Link` for a level you can return to, plain text
  for a grouping with no page of its own.

  **The separator is the library's first directional icon.** The chevron is
  drawn pointing down and turned a quarter turn along the reading direction —
  the other quarter in Arabic. That is also why it is not configurable: doc 02
  §11.4 forbids flipping an icon the library did not draw, so a chevron passed
  in would point the wrong way in a right-to-left language with nothing to say
  so.

  No separator prop, no first-step prop, no `onAction` and no `isDisabled`. And
  no `<nav>` around it: the base labels the list already, and a landmark named
  the same thing says the word twice in one breath — recorded as pending a
  decision rather than closed, because it is a question about what a reader
  hears.

  A trail too long for its container **wraps**. Folding the middle into a "…"
  that opens a menu waits for `Menu`, because a "…" that opens nothing is lost
  content (doc 04 §7).

- **`Link`** — text that navigates, and the first use of the escape doc 02 §7
  has always left open: where a different element is genuinely needed, that is
  a named component.

  ```tsx
  <Link href="/customers/4821">Astilleros del Sur</Link>
  ```

  > **`Link` navigates. `Button` acts** — including `Button variant="link"`.

  The test is whether there is an address. `Breadcrumbs` is what made the old
  answer insufficient, and not for a reason about appearance: a breadcrumb
  trail is the thing people open in another tab, and a `<button>` cannot be
  middle-clicked, offers no "copy link address", ignores ctrl-click, and does
  not appear in the list of links a screen reader builds. All four are now
  checked in a browser, twice with a second tab.

  **The two must not look alike, so a check keeps them apart.** A link is
  accent-coloured and underlined at rest; `Button variant="link"` is ordinary
  text until you point at it, on purpose, "so it does not compete with a real
  link". A browser test measures both in one story and asserts their colours
  differ and only one is underlined.

  **`href` is required** and there is no `isDisabled`. Read in the installed
  source: with an anchor the base adds `aria-disabled` and nothing else — the
  address stays, the element stays in the tab order, and the browser still
  follows it — so the prop would promise something the component cannot
  deliver.

- **`navigate` on `ConfigProvider`** — how a link navigates, for every link
  beneath it.

  ```tsx
  <ConfigProvider navigate={href => router.push(href)}>
  ```

  It is here rather than on the component because a consumer **cannot** supply
  it themselves: the base's router provider is an export of the library's own
  dependency, not theirs. Without it every link is a full page load, which in a
  single-page application is the worst kind of wrong default because it looks
  like it works. The portal container is on this provider for the same reason
  (decisions 0013 and 0016).

  Nothing to write for modifiers: the base checks `target`, `download` and
  ctrl, meta, alt and shift before handing a press over, so a ctrl-click still
  opens a new tab and a middle-click never reaches JavaScript. The function is
  held by a ref, so an inline arrow does not rebuild the base's router context
  on every render.

- **`Accordion` and `Collapsible`** — sections that fold. Two exports and one
  component, because they are two ARIA patterns with the same markup: a group
  of them is the accordion pattern, one of them alone is the disclosure
  pattern, and the only difference is the heading.

  ```tsx
  <Collapsible title="Filters">…</Collapsible>

  <Accordion headingLevel={3}>
    <Collapsible id="billing" title="Billing details">…</Collapsible>
    <Collapsible id="tax" title="Tax codes">…</Collapsible>
  </Accordion>
  ```

  **`headingLevel` is required on the group**, and that is the interesting
  prop. The accordion pattern needs each header to be a heading, nothing
  supplies the level, and a wrong one is invisible — nothing warns, nothing
  looks wrong, and the only symptom is an outline that reads wrongly to
  somebody moving through the page by its headings. Being told costs one
  number. A lone `Collapsible` renders no heading and takes no level, because
  its pattern asks for none. Doc 06 §2.1, which this component is the reason
  for.

  **A closed panel stays in the page.** The base hides it with
  `hidden="until-found"`, so a browser's find-in-page opens the section to show
  a match — and it is out of the tab order and absent from the accessibility
  tree while closed. Both halves at once, which is unusual. The cost is that a
  closed section still renders, so mount anything expensive yourself from
  `onExpandedChange`.

  **The height animates**, and the mechanism is the base's: it publishes the
  panel's height as a variable and waits for the animations on that element
  before hiding it, so the whole thing is one CSS transition. Removed entirely
  under `prefers-reduced-motion`, which is now checked in a browser for the
  first time in this repository.

  One at a time by default, `allowsMultipleExpanded` for the other way,
  controlled or not, and the title is a node so a count or an icon is composed
  rather than passed. No `role="region"` on the panel, no actions slot in the
  header, and no `count` or `icon` props.

- One chevron, in `src/internal`, drawn before it has more than one caller —
  the opposite of how the cross arrived, which was extracted after four copies
  and a fifth about to ship with a different stroke. It points down and only
  down: rotation is the caller's, because only the caller knows whether the
  direction is directional.

- **`Toast`** — a notice about something that happened, in the corner of the
  window. It ships as **two pieces**, and that is the design rather than a
  detail:

  ```tsx
  const toasts = useToasts(); // the queue, which YOU own
  <ToastRegion queue={toasts} />; // one region, near the root
  toasts.add({ tone: 'success', title: 'Invoice sent' });
  ```

  **The library holds no queue.** P3 forbids it any global state, and a
  notification queue is exactly what a library of this kind usually keeps at
  module level because the base's examples do. `useToasts()` makes one and hands
  it over; the base's own queue class never appears in a consumer's types, which
  is what doc 08 §7.1 required before this component could be built at all.

  **`danger` does not go away on its own, ever.** The other two timings are six
  seconds, and ten when there is an action to take — one decision for the
  library, from the notice itself, never a prop (doc 09 §4.1). And the bar along
  the bottom edge is the time left: it is a requirement rather than decoration,
  because a countdown somebody can see is a countdown they can beat, and putting
  the pointer on the stack stops every timer in it.

  **An `action` is the point of this component existing now.** Doc 09 §5 prefers
  undo over confirmation wherever it is possible, and a `ConfirmDialog` with no
  `Toast` beside it shipped the discouraged half of that pair with nowhere for
  the preferred half to live. Taking the action closes the notice first: one
  that has been acted on is describing something no longer true.

  **A notice looks like an `Alert` that floats**, on the same four tone
  surfaces. It was built on the neutral raised surface first and the first
  three-tone screenshot settled it — a failure looked exactly like a success
  apart from a 16px glyph.

  Three at a time, newest first, and nothing is dropped: measured, a waiting
  notice does not spend its clock while it is hidden, so it arrives with its
  full time rather than aging out unseen. Doc 08 §7.2 records that, and the
  fact that §7 had described the mechanism backwards.

  No corner, no polite mode, no timeout, no `maxVisibleToasts`, and no way to
  read the queue.

- `useToasts`, `ToastRegion`, and the types `ToastMessage`, `ToastQueue` and
  `ToastTone`.

- **`Preview`** — a card about the thing under the pointer: a customer's terms
  behind their name, a user's role behind their avatar, an invoice's status
  behind its number.

  **It is the layer whose content can be REACHED**, which is the whole reason it
  exists beside `Tooltip`. The pointer travels into it over a safe-area polygon
  the base keeps over the trigger, the card and the space between them — so a
  diagonal journey at any speed does not close it. `Tab` on the trigger moves
  focus into the card, tabbing past the last thing in it leaves, and `Escape`
  closes it. A tooltip has none of that and cannot: it is not focusable and it
  closes when its trigger blurs.

  It opens on hover, on keyboard focus, and on **long press** on a touch
  device, where the base contributes the one user-facing string this component
  needs — "Long press to open preview" — in the reader's own language.

  **`title` is required, and that was measured rather than assumed.** The base
  gives a preview's panel `role="dialog"` even though the panel is non-modal,
  and names it with nothing at all: accessible name `null`. So the title names
  it. It is deliberately **not a heading** — doc 06 §2 leaves the level to the
  project, and the machinery that would supply one is a nested dialog this
  component may not render.

  It renders no dialog of its own for a reason doc 08 §4 predicted before the
  component existed and a browser then confirmed: the shared `ModalSheet` would
  switch focus containment on from the inside, trapping the keyboard in a card
  that has no close button. With the sheet nested, `Tab` past the last thing in
  the card kept focus inside it.

  **The page behind is left alone** — no underlay, no scroll lock, still in the
  accessibility tree. The exact opposite of `Popover`, measured the same way,
  and the reason those are two components rather than one prop.

  No delay props, no arrow prop, no `className`: the delays are the library's
  (doc 09 §3.1), the arrow is always there as on `Tooltip`, and the base
  positions the card at a width that is its content's up to
  `--container-narrow`.

- `ANCHORED`, internally: the wrapper an anchored layer puts around the panel.

- **`Popover`** — a panel anchored to the control that opened it: a filter
  form, a set of details, a short list.

  **It is a modal layer with no visible scrim**, which is the thing most worth
  knowing about it and was not what this library expected. Measured on the
  base: while a popover is open the page behind it is covered by a full-window
  underlay, cannot be scrolled, and is hidden from the accessibility tree — and
  focus is contained in the panel. Doc 08 §4 said the opposite of that last
  part and is corrected there, with the two mechanisms that produce it.

  Practically: a click outside dismisses the panel and does **not** press the
  button under it. That is measured, and it is what makes the default safe.

  **`isDismissable` defaults to `true`**, which is the decision doc 08 §5.1
  held open until this component existed. Turn it off for a panel holding
  something that must not be lost. `Escape` and the close button work either
  way — nothing in this library lets a layer swallow `Escape`.

  **`title` is required**, because the panel is a `dialog`: one with no
  accessible name is announced as "dialog", which says that something happened
  and not what. `footer` is where a filter panel's Apply button goes, pinned
  while the content scrolls, and `useDialog` closes the layer from it.

  `placement` takes the twelve logical values and defaults to `bottom start`.
  `hasArrow` defaults to **`false`** — the opposite of `Tooltip`, where a small
  bubble among five icon buttons has to say which one it belongs to. No `size`
  and no width: the panel is as wide as its content up to `--container-medium`,
  and its height is the room the base measured between the trigger and the edge
  of the window.

- `Placement`, `PLACEMENTS` and the shared arrow are now used by two components
  rather than one. No API change.

- **`Tooltip`** — a short description of a control, on hover and on focus.

  **It is a description, not a name**, and that is the thing most worth knowing
  about it. The base wires it through `aria-describedby`, so it does not name
  the control it points at: an icon-only button still needs its own
  `aria-label`, or it is announced as "button" with a description attached to
  nothing. Asserted twice in the tests, because it is invisible in a screenshot
  and in a hover.

  **`placement` takes the twelve logical values** and is the first reader of
  the shared `Placement` type ([doc 02](docs/foundations/02-api-conventions.md)
  §3.3). The base offers twenty-four names; the other twelve are the same
  positions spelled physically, and wrong in Arabic.

  The trigger is `children` and the words are `content`, which composes the two
  parts here rather than asking a consumer to — `Field`'s precedent, and it
  makes a tooltip with no trigger, two tooltips on one trigger, and the two in
  the wrong order all impossible. **The trigger must be focusable**, and that
  is not papered over: measured, a bare `<span>` receives none of the base's
  handling, and wrapping one in something focusable would be a decision about
  somebody's keyboard taken quietly.

  No `offset`, no `containerPadding`, no `shouldFlip`, no delay props and no
  `className` — the first component in the library with nothing for `className`
  to do, since the base positions it and its size is its content up to a
  maximum. The delays are fixed at ~600ms and ~150ms for the whole library
  (doc 09 §3.1).

- `Placement`, exported: it is a prop type, so it is public (doc 02 §10).

- **`ConfirmDialog`** — a question with two answers, above the page. Doc 09 §5
  governs almost all of it, and the parts that are not configurable are not
  oversights.

  **`role="alertdialog"`**, which is why this is a component and not three
  props on `Dialog`: a screen reader announces it as requiring a response, and
  the base then points `aria-describedby` at the content on its own, so the
  consequence is read with the question instead of waiting to be found.

  **Focus lands on Cancel** (doc 09 §5.5). This is the library's first and only
  `autoFocus`, which doc 08 §4 permits with a written reason — and the reason is
  checked rather than described: a browser test presses the space bar at a
  freshly opened confirmation and asserts that nothing was deleted.

  **`confirmLabel` is required and there is no default.** Doc 09 §5.4 wants the
  button to name the action, and a default would have been shipped as "Confirm"
  by everyone. "Cancel" comes from the dictionary, because it is the one word
  nobody customises.

  **Three tones, not four.** `success` is not one: you confirm only when there
  is no way back, so there is nothing to be pleased about yet. And three tones
  map to **two** button appearances, because the catalog already ruled that
  colour on a button says what pressing it costs and only two costs are worth
  colouring. `warning` confirms in danger too — discarding what somebody typed
  is destructive even when nothing is deleted.

  **A promise it is given, it waits for.** While in flight the confirming
  button is pending, cancelling is disabled, and neither `Escape` nor a click
  outside closes anything. On fulfilment it closes; **on rejection it stays
  open**, so the consumer can say what went wrong where it went wrong (doc 09
  §4). That is a default and not a policy: catching your own error makes the
  promise fulfil, and the dialog closes. The reverse default cannot be
  recovered from — once the layer has gone there is nowhere to put the message.
  Doc 09 §5 gains rules 6 and 7 and a §5.1 for that, because the shape returns
  everywhere a promise is awaited on somebody's behalf.

  There is no close cross and no `isDismissable`: both would be a third and a
  fourth way to say no, beside a button that says it in words.

- `cancel` in the dictionary.

- **`Drawer`** — a modal panel anchored to an edge of the window: a detail view
  beside a listing, a filter panel, a bottom sheet.

  **Four sides, and `start`/`end` flip with the writing direction.** A
  `side="start"` drawer is on the left in English and on the right in Arabic,
  with its border and its slide flipping too. `top` and `bottom` are literal,
  deliberately: doc 05 §4 is about direction and not about writing mode, and
  this library supports RTL rather than vertical text.

  **One meaning for `size`: how thick, on whichever axis the side chose.** The
  numbers are the container scale, the same three a dialog's widths come from,
  so a form inside resolves its own container queries against exactly the value
  the drawer was sized by.

  **It needs no narrow-window rule**, where a dialog has one. The thickness is
  a maximum, so a drawer thicker than its window fills the window instead of
  overflowing it. One less rule and one less number to choose.

  It is a separate component rather than a `variant` on `Dialog`, for the reason
  the catalog already used to reject a multiple-value `NumberField`: a `side`
  means nothing on a centred dialog, and `size` would measure a different axis
  depending on `side`. `useDialog()` works inside it — a drawer is a dialog in
  the sense that matters, so a footer button closes it the same way.

  The slide is the most justified animation in the library, and the one place
  logical CSS runs out: there is no logical `translate`, so its direction is
  read from the locale rather than from a physical prop. Doc 05 §4 records that
  gap now.

- **`Dialog`**, and with it the layer base — the second of the two bottlenecks
  in the build order. A titled panel above the page, with the page behind it
  out of reach.

  **Controlled, with no trigger component.** `isOpen` and `onOpenChange`, so a
  dialog can be opened from a row action, a menu item or a route rather than
  from a wrapper around a button. Focus still returns to whatever was focused
  when it opened, because the base restores it unconditionally rather than by
  knowing about a trigger — asserted against a decoy control, so "focus went
  back to the page" does not pass for "focus went back to the trigger".

  **It becomes full-screen in a narrow window automatically, not by a prop.** A
  dialog that does not fit has one correct rendering, and a prop would let a
  screen ship broken at 360px. The threshold is in `rem`, so a page at 200%
  zoom crosses it too.

  **The element that scrolls is the element the base focuses**, which is not a
  detail: a browser scrolls the nearest scrollable _ancestor_ of what has focus,
  so the obvious three-row grid — with the middle row scrolling — puts the
  scroll container out of every key's reach. The header and footer are sticky
  inside it instead.

  Sizes come from the container scale, so a form inside a `sm` dialog resolves
  its own container queries against exactly the width the dialog was sized by.

- **`useDialog()`**, returning `{ close, isOpen }`. This is the hook
  [doc 02](docs/foundations/02-api-conventions.md) §5 promises by name: render
  props are not part of this API, and a consumer's own footer button needs some
  route to `close`. Harmless with no dialog above it, so a footer shared between
  a page and a dialog does not have to know which one it landed in.

- **`portalContainer` on `ConfigProvider`** — where every layer mounts, the
  toast region included. Received rather than assumed
  ([doc 08](docs/foundations/08-layers-and-focus.md) §8, decision 0013). Omit it
  and the base's `document.body` stands, so a lone `Dialog` still works with no
  provider around it.

- `variant="card"` on `RadioGroup`: each option becomes a card you press
  anywhere on. The variant belongs to the group and reaches the options through
  a private context, which is now a written convention
  ([doc 02](docs/foundations/02-api-conventions.md) §3.1.1) since it is the
  library's first.

  The card moves **both** its border and its fill, and they say different
  things: the border answers a pointer arriving — the field's rule, earned
  twice over on the largest surface in the library that answers one — and the
  fill answers a press, following `Button`, because the shimmer argument does
  not reach something deliberate and momentary. The circle stays in both
  variants and keeps its own hover, which is the clearest statement that the
  whole card is the target.

  First component to read `--bb-surface-selected` and its pair. They had been
  defined since the token layer and never rendered; measured now, and axe
  reports no contrast violation on them, brand override included.

- `isClearable` on `NumberField`. Emptying a numeric field means `NaN`, not
  zero — zero is a number somebody chose, and `NaN` is what the base reports
  when the last digit is deleted. It is refused together with
  `isStepperVisible`: doc 07 §2.2 rule 4 gives that edge to one library-owned
  control, the stepper wins, and development says so rather than guessing
  quietly.

- `TagsInput`. Values typed one at a time or pasted as a block and split on
  Enter, comma, semicolon or pipe, each one through the normalizer. Backspace
  in an empty box removes the last tag.

  Built on `TagGroup` rather than `TokenField`, and the difference is not
  cosmetic: `TokenField`'s value is a segment model of tokens interleaved with
  free text — a rich-text surface for a composer — and it publishes no error
  slot, so doc 07 §4's label-control-description-error unit could not be
  assembled on it without hand-wiring the association (non-goal 6). `TagGroup`
  brings the part that matters: arrow navigation that follows the writing
  direction, Delete on a focused tag, and a live region announcing additions.

  Duplicates are refused, compared after normalizing, and **`onDuplicate` says
  so** — refusing in silence is the other half of the mistake, and the message
  is text about the user's own data, which doc 07 §1 puts with the project.

- `PasswordField`, with a reveal toggle whose accessible name changes with its
  state. It works while read-only — a value you may need to check — and it is
  the one control that does not yield the trailing edge to a busy state, because
  removing it removes a capability rather than an affordance (doc 07 §2.2 rule
  2). It does **not** score the password: that is a policy, so the project
  passes a judgement and the library presents it.
- `showPassword` and `hidePassword` in the dictionary. Two keys and not one: a
  button called "Toggle visibility" says what it is and never what it will do.
- `isGrowable` and `maxRows` on `TextArea`: the box follows its content, from
  `rows` as a floor to `maxRows` as a ceiling, then scrolls
  ([decision 0012](docs/decisions/0012-growing-is-a-prop-not-a-public-hook.md)).
  The limit is not optional — unbounded growth turns a long note into a
  page-length box — and it is expressed in rows because that is the unit the
  floor is already in.

- `isClearable` on `TextField`: a cross that empties the field and hands focus
  back to it.

  It holds its width in every state, including the four where it has nothing to
  offer — empty, disabled, read-only, busy. A cross that arrived with the first
  character typed would narrow the box on that keystroke and widen it again on
  the delete, which is doc 09 §3 broken twice per edit. So turning it on costs
  the room whether or not there is a value, and that is why it is a prop rather
  than something every field does.

  Unreachable is literal: the wrapper is `inert` and `aria-hidden`, so the
  button leaves focus order and the accessibility tree rather than being
  painted over.

- `isCounterVisible` on `TextField` and `TextArea`, showing how much of
  `maxLength` has been used.

  It exists because `maxLength` is a **silent** restriction: past the limit the
  browser drops the keystroke and says nothing, which is the clearest case
  there is of an interaction with no response (doc 09 §3).

  Three things about it are deliberate. It is **not announced while counting** —
  a number changing under a screen reader would turn typing into a drum roll,
  and the count is derived from a value the reader already has. **Reaching the
  limit is announced once**, because that is the moment something stops
  working. And at the limit the count turns from muted to ordinary text rather
  than to the danger colour: being full is not being wrong, and deciding a
  value is invalid stays the project's.

  The number goes through the locale, like every other number the library
  writes — `2.000` in German, `2,000` in English.

- `characterLimitReached` in the dictionary.

- `prefix` and `suffix` on `TextField` and `NumberField`: `@`, `.com`, a unit,
  a currency symbol. They sit inside the border and in the flow, which is why
  they are slots and not padding — `.com` is four characters wide and `@` is
  one, and no reserved space can be computed from CSS.

  **They are hidden from assistive technology** (doc 02 §11.3), and that
  carries a rule: a unit somebody needs in order to answer belongs in the label
  or the description, not only in the affix.

- `align` on `TextField`, `TextArea` and `NumberField`: `start | center | end`,
  never `left`/`right`. `end` is the one worth knowing about on a numeric
  field — numbers in a column compare by magnitude at a glance only when their
  last digits line up.

- **Normalization**, as pure functions you compose: `normalize`, `lowerCase`,
  `upperCase`, `stripSpaces`, `trimEdges`, `foldAccents` and `allowOnly`, plus
  a `normalize` prop on `TextField` and `TextArea`. Doc 07 §2 is careful that
  this is a third thing, not part of restriction: it accepts a keystroke and
  rewrites it, where restriction refuses one and validation judges the result.

  It composes rather than being a set of booleans because the order is the
  whole thing — `upperCase` then `allowOnly(/[A-Z]/)` keeps every letter, and
  the same two the other way round throws the lower-case ones away.

  What the library is actually contributing is not the transformations, which
  are a few lines each. It is the caret: rewriting a value while somebody types
  sends the cursor to the end mid-word, which is doc 09 §7 broken once per
  keystroke. Asserted in a browser, because jsdom implements no selection.

- `SearchField`. Probably the most used control on a listing screen, and the
  library did not have one. What makes it a component rather than a `TextField`
  with a clear button is not the button: it is `role="searchbox"`, Escape
  cancelling the query — and passing Escape through to a surrounding dialog
  when there is nothing to clear — and `onClear`/`onSubmit` being a listing
  dropping its filter rather than a value becoming empty.
- `CheckboxGroup`, a component and not a mode on `Checkbox`. The existing
  `Checkbox` works inside it unchanged: the base publishes its group state
  through context, so an option inherits the group's disabled, read-only,
  required and invalid state on its own.
- `--min-width-hit`, and `bb:min-w-hit` with it.

- Seven pieces, filling out the levels that depend on nothing: `Separator`,
  `Skeleton`, `VisuallyHidden`, `Badge`, `Card`, `EmptyState` and `Alert`.
- `Alert`, an inline message where the thing happened. `Toast` is deferred
  because the base's API is still unstable, which left the library with no way
  to show a section- or page-level message at all — and doc 09 §4 is explicit
  that a global notice is a complement, never the only channel. It draws its
  own status glyph per tone, so the state survives greyscale: verified in a
  browser against a `grayscale(1)` copy, not assumed.
- `Badge`, solid and soft, in six tones. The first component to read the
  `--bb-success`, `--bb-warning` and `--bb-info` families — they had existed
  since the token layer landed and nothing had ever rendered them. Its remove
  button clears the minimum target at every density, which is asserted in a
  browser rather than eyeballed: a cross drawn at 12px inside a chip is where
  that rule is broken everywhere.
- `Card`, which **declares the query container**
  ([decision 0010](docs/decisions/0010-the-card-declares-the-container.md)).
  The container scale had been defined since the token layer and nothing in
  the library declared a container, so every container query would have matched
  nothing — level N2 of doc 04 existed on paper and could not be used. Two
  consequences come with it, in every Card: it no longer shrink-wraps its
  content, and it becomes the containing block for absolutely and fixed
  positioned descendants.
- `EmptyState`, which distinguishes "there is nothing yet" from "the filter
  matched nothing" — doc 09 §6 calls confusing them one of the most common
  experience bugs there is. Titles fall back to the dictionary per variant.
- `Skeleton`, in text, circle and rectangle. Under reduced motion the pulse is
  removed rather than slowed. Its fill is derived from `--bb-surface-sunken`
  rather than taken from it: measured, the role token alone reaches only
  1.07:1 against the page in dark, where the placeholder stops being visible.
- `Separator`, semantic by default and decorative on request. A vertical one is
  visible in an ordinary flex row without the consumer setting a height, which
  is the trap this component usually ships with.
- `VisuallyHidden`. The base ships one, but it is out of a consumer's reach —
  `react-aria-components` is this package's own dependency, not a peer — and
  hand-rolling it is the classic silent accessibility bug.
- The icon convention, which was a planned but unwritten piece of the catalog
  ([doc 02](docs/foundations/02-api-conventions.md) §11): icons arrive as
  children, their size and colour come from the slot, and there is no
  `iconStart` prop and no `icon="save"` string.
- `remove`, `emptyStateNoData` and `emptyStateNoResults` in the dictionary.
- `--color-surface-on` and the other four surface `-on` utilities, plus
  `--width-hit`. Doc 03 says a background and its text colour are used as a
  pair, and only one of the five pairs was reachable from a utility — so a
  component needing the other four read the variable by hand, which is the same
  value spelled a second way.

- A `link` variant on `Button`, for an action that has to weigh almost
  nothing: "forgot your password", a secondary action in a table row. No
  background and no border, but the same horizontal padding as every other
  variant, so it lines up with the buttons beside it in an actions row. Its
  focus indicator is an underline rather than the ring — the one place in the
  library where the ring is replaced instead of drawn.
- `--bb-link` and `--bb-link-active`. Accent used AS TEXT is a different role
  from the accent FILL, and the two were sharing a token: measured, the fill
  step gives 5.08:1 in light and 3.62:1 in dark, where 4.5:1 is required.
- Density tokens for the small controls — `--bb-control-box`,
  `--bb-control-box-mark`, `--bb-control-switch-height`,
  `--bb-control-switch-width` and `--bb-control-hit-area`. Checkbox, radio and
  switch were a fixed size, so compact density differed from normal by nothing
  at all.
- `--bb-focus-ring-halo-strength`, the opacity of the ring's halo, restated
  per mode. A translucent colour loses more of itself over a dark surface than
  over a light one.
- `--bb-border-control`, the border of a small control as distinct from a
  field or a panel. The same border colour does not read the same on 20px as
  on 300px.

- `TextArea`, for multi-line text. Its height comes from a row count rather
  than the control-height tokens, and it resizes vertically only.
- `NumberField`, formatted and parsed in the active locale — separators, and
  the digits themselves in some scripts. Currency comes from the config
  provider or a prop; the library never invents one.
- Two dictionary entries, `increment` and `decrement`, for the stepper
  buttons. The base composes them with the field label, so it announces
  "Increase Quantity" rather than a bare "Increase".

- `RadioGroup` and `Radio`: a set of mutually exclusive options, with a label
  for the group and one per option. The whole group is a single tab stop and
  the arrow keys move within it.
- `Switch`, for a setting that applies the moment it is flipped. It carries no
  error state and no `isRequired` on purpose — if a value needs validating
  before submission, that is a `Checkbox`.

- `Checkbox`, with an optional description and error beneath it. The base
  renders those two for a lone checkbox but does not reference them from the
  input, so the association is supplied here — a description nothing points
  at does not exist for a screen reader.

- `TextField`, the first field: label, control, description and error related
  to each other, with all eight states from the forms foundation. The library
  presents the error; deciding there is one, and writing it, stays with your
  project.
- `ConfigProvider`, carrying language, dictionary, time zone and currency.
  Nothing is detected and nothing is remembered — your application resolves
  these and passes them in. It works with no provider around it, in English
  and LTR.
- `Spinner`, with an accessible name from the dictionary. Under reduced
  motion it becomes a static ring rather than freezing part-way round.

- `Button`, the first component of the rewrite. Five variants, three sizes,
  and every state styled from React Aria's DOM state attributes.
- The token layer: layer-1 primitives baked from Radix Colors (a development
  dependency that never ships), layer-2 semantic tokens, and the three theme
  axes — mode, brand colour and density — each set by an attribute on a
  container.
- `blackborne/styles.css`: one compiled stylesheet, every class and variable
  carrying the `bb` prefix. **No global reset**, so it cannot overwrite a
  consumer's own styles, and no font is imposed.
- Two ways to theme, and they differ. Overriding a **semantic** token
  (`--bb-accent`) works anywhere, because it holds a value. Overriding the
  **brand scale** (`--bb-x-brand-9`) requires `data-bb-theme` on the same
  element — a CSS `var()` resolves where it is declared, so without the
  attribute the override silently does nothing. Documented in the package
  README and in foundation 03 §3.1.
- Public stacking tokens `--bb-layer-overlay`, `--bb-layer-popover` and
  `--bb-layer-toast`, with wide gaps so a consumer can place their own layers
  between them.

### Changed

- **A `ColorSwatchField`'s swatches sit on a checkerboard too.** A declared
  palette may carry an alpha — `#3e63dd80` is a legitimate entry — and on the
  surface alone it reads as a paler blue rather than a transparent one. Found
  while building `ColorPicker`, where the same problem is unavoidable rather
  than occasional, so the pattern lives in `internal/checkerboard` and both
  components read it.

- **`SplitButton`'s divider is now the shared seam.** It has drawn a line down
  its own middle since it shipped, mixed from the pair's text colour, because a
  primary split button's border is the same colour as its fill. `ButtonGroup`
  needs that line on an unknown number of children, so the recipe moved to
  `internal/seam` and both components read `--bb-seam` from the root. No
  appearance changed: all seven of the component's baselines came out
  identical.

- **`ButtonVariant` and `ButtonSize` are declared in one place and re-exported
  by `Button`.** Three files need the vocabulary now, and the project's own
  lint rule is what moved it: a piece shared between components belongs in
  `src/internal`. **Nothing about the public API changed** — both types are
  still imported from the library root and mean exactly what they did.

- **`@internationalized/date` is now a declared dependency**, pinned to
  `3.12.4` — the version `react-aria-components` resolves — and moving with the
  other two.

  It was already in the tree as the base's own dependency, so a consumer's
  install does not grow. What changes is that the version is ours to control
  rather than inherited, which is the arrangement `react-aria` already has
  ([decision 0013](docs/decisions/0013-the-portal-container-arrives-with-the-configuration.md)).

  The reason is decision 0020: dates cross this library's boundary as ISO
  strings, so something has to parse them into the objects the base's calendar
  understands, and `react-aria-components` re-exports none of that.

  **One of the project's own lint rules was corrected rather than worked
  around.** It forbade importing `@internationalized/*` on the grounds that
  reaching past the base's public entry point turns a minor upgrade into a
  breaking one — which was true while the package was transitive and is not
  true of a declared dependency. The rule's reasoning now says so, and
  `@react-aria/*`, `@react-stately/*` and the other `@internationalized/*`
  packages are still restricted.

- **Two rules were written before the components that need them**, which is the
  order this project keeps: a foundation changes first, never afterwards to
  justify code that already exists. Nothing in the package changed.

  **A field that opens a layer keeps its chevron and offers no clear button**
  ([doc 07](docs/foundations/07-forms.md) §2.2, rule 5). Six things were
  counted at a field's trailing edge and the seventh had been in plain sight —
  a `Select`'s chevron never competed, because its whole trigger is the button
  that opens the list. A combo box is where the counting starts, and it wants
  that edge for a chevron, a clear button and a busy indicator at once. The
  chevron wins for the reason the numeric stepper exists at all: a keyboard
  opens the list with `ArrowDown` and a pointer has nothing else. What is not
  available is the usual answer, swapping the chevron for a cross on hover —
  something that appears only on hover is not there for touch and never there
  for a keyboard.

  **A date crosses the boundary as an ISO string**
  ([decision 0020](docs/decisions/0020-a-date-crosses-the-boundary-as-a-string.md)),
  so the date family that follows takes `value="2026-09-09"` rather than the
  base's `CalendarDate`. The same narrowing `Select` already does to the base's
  `Key`. A JavaScript `Date` was measured and rejected: it is a timestamp, so
  `new Date('2026-09-09')` displays as the 8th of September in Lima and the 9th
  in Tokyo — one value, two days, decided by where the person looking happens
  to be.

- **The browser checks take a third of the time**, and nothing about what they
  check has changed. Three findings, in order of what they were worth:

  **The accessibility suite was running twice.** It lived in the `checks`
  project, so the behaviour step executed all 357 of its story checks, and the
  next step ran the same suite again by name. It is its own project now, and
  `test:a11y` names it.

  **Playwright uses one worker when `CI` is set**, so the pipeline serialised
  everything even where the local machine did not — the numbers CI actually
  paid were the serial ones. `workers` is explicit now, and tests inside a file
  are split for the one suite shaped like that: 357 checks in a single file
  that file-level parallelism cannot touch. Measured: 13.1 minutes to 4.6, and
  the behaviour checks 7.5 to 2.7.

  **And the checks are served from the built catalog**, on a port of their own,
  rather than from the dev server. A dev server compiles a story the first time
  it is asked for, which has timed a story out three times here under load —
  and a built directory is what makes running the suites in parallel safe
  rather than a way to produce more of those timeouts. It costs ten seconds to
  build. All 149 visual baselines are byte-identical against it, which was the
  one thing that had to be true before this could land.

- **Breaking — a `Breadcrumb` declares its address instead of holding a `Link`**
  ([decision 0019](docs/decisions/0019-a-breadcrumb-declares-its-address.md)).

  ```diff
  - <Breadcrumb>
  -   <Link href="/customers">Customers</Link>
  - </Breadcrumb>
  + <Breadcrumb href="/customers">Customers</Breadcrumb>
  ```

  A step with no `href` is still text — a grouping with no page of its own, and
  the last step, which is marked as the current page for you. What a consumer
  stops doing is importing `Link` to write a trail.

  The reason is the collapse: the same step has to be able to appear as a link
  in the row or as a row in the menu, and a `Link` handed in as children can
  only be the first of those. Reading the address out of somebody else's element
  was tried on paper and rejected — it works until they wrap their link in a
  component of their own, and then it finds nothing, silently, in the structure
  a narrow window produces.

  **And the root element changed with it.** A trail is sized by its contents,
  and inline-size containment computes a width as though an element had none
  (doc 04 §4.3) — so the query container is a new wrapper, and a `ref` now
  lands on a `div` holding the `<ol>` rather than on the `<ol>`. `className`
  and `style` still reach the outermost element, as everywhere else.

- **A menu row that is an anchor is no longer underlined.** The package ships
  no reset, so an `<a href>` arrives carrying the browser's own decoration —
  and until this wave no row in a menu was ever an anchor. The same class of
  trap as a form control not inheriting `font-size`, and invisible to every
  check that existed: the row had the right colour, the right box and a blue
  underline nobody had drawn.

- **A forced state in the catalog waits for its element, and no longer settles
  for another one.** Two faults in one helper, both found by the first
  component whose structure arrives after the first paint.

  It ran once, in a layout effect. `Tabs` paints its narrow structure first — a
  `ResizeObserver` reports after layout, so there is nothing to measure before
  painting — so the row of tabs did not exist yet and the three states
  photographed identically to the default. It now waits for the element and
  stops watching the moment it arrives.

  And a named target had a fallback chain behind it, so a selector matching
  nothing quietly marked the outermost React Aria element instead. That hid the
  first fault completely, and it is the exact failure this helper exists to
  prevent, produced by the helper itself. A given target is now the only
  candidate.

- **The contrast guard counts only the text axe would actually reach.** It
  walked every visible text node and asked axe whether each was a ligature,
  which was right as far as it went and claimed coverage of a page axe never
  looks at: while a modal layer is open the base marks everything outside it
  `inert`, and the contrast rule does not enter an inert subtree. Measured on
  an open select in Arabic — a Latin, painted, non-ligature line sat on the
  page behind and the rule still reported `inapplicable`.

  Which also kills the fix that suggested itself, and doc 06 §5.1 had already
  forbidden it in writing: adding a Latin sentence beside the Arabic makes a
  guard pass without measuring anything. The node now has to be painted **and**
  in the accessibility tree, both asked of axe's own helpers, and doc 06 §5.2
  records what is therefore never checked automatically — the scrim, the page
  behind it, and a trigger's appearance while its layer is open.

  Verified in the direction that matters: with the rule removed on purpose, the
  two Latin select stories fail and the Arabic one is excused. A guard that can
  only pass is not a guard.

- **One tick, from one geometry, and a field frame can be told its state.**
  Two internal extractions with no public API change and no baseline moved,
  both made before the component that needed them existed.

  The tick is shared as a PATH rather than as a component, which is the part
  worth writing down: a checkbox's tick is one of two paths in a single svg —
  the other is the indeterminate dash — and which one shows is a CSS precedence
  rule that needs them to be siblings. Sharing a component would have meant
  breaking that or leaving the checkbox out of the share, so the string is the
  shared thing and there are two renderings of it.

  And `ControlFrame` now accepts `isInvalid` and `isDisabled` explicitly,
  because the base's `TextField` publishes a group context the frame reads them
  from and its `Select` does not. Without them the box would look ordinary
  while the field was invalid — the class of defect that looks right.

- **The catalog's layer fixture lays nothing out, and there is one of it.** It
  had been copied seven times, and three of the copies centred their content
  on the same element they handed to `portalContainer` — so an open layer
  became a grid item and moved its own trigger 202px. No public API changed;
  fourteen baselines did, because they had been taken through the shifted
  layout. Doc 08 §9 carries the rule.

- **A forced state in the catalog can name the node it belongs to.** The helper
  marked the outermost React Aria element, which for a section is the
  disclosure and not its header — so hover, press and focus went somewhere with
  no such states, and three "states" photographed identically to the default.
  That is the exact failure the helper exists to prevent, arriving one level
  further in.

- **One cross, drawn once, and one tone-surface map.** A badge's remove button,
  a tag's, a field's clear button and a layer's close cross each held their own
  copy of the same SVG; `Alert`'s four tone surfaces were about to acquire a
  second copy in `Toast`. Both are now shared from `src/internal`. No public
  API changes and no visual baseline moved — verified in the container both
  times, before the component that forced each extraction existed.

- **A spinner on a pending `Button`, and it keeps its size.** `isPending` had a
  progress cursor and 30% less opacity — a state that was in the API and barely
  on the screen, with the component's own note saying a spinner would be better
  and the `Spinner` piece did not exist yet. It does, and `ConfirmDialog` is the
  first thing to hold a button pending on a promise the library owns, so doc 09
  §3's "past a second, indicate it is still going" finally has a case.

  The content is hidden rather than removed so nothing beside the button moves.
  **With `opacity` and not `visibility`**, which is a bug that was found and
  fixed on the way: `visibility: hidden` removes an element from the
  accessibility tree, so the pending button lost its name — an aria snapshot
  read `button "Cancel"` and then `button` with nothing at all.

- **`react-aria` is now a direct dependency**, pinned at exactly `3.52.0`. It
  was already in your tree — `react-aria-components` depends on it at that
  same exact version — so nothing new installs and no version can drift. It is
  declared for one thing: `UNSAFE_PortalProvider`, which
  `react-aria-components` does not re-export and which is the only route that
  reaches every layer, the toast region included
  ([decision 0013](docs/decisions/0013-the-portal-container-arrives-with-the-configuration.md)).

- `Toast` stops being deferred, and the reversal is on the record rather than
  quietly dropped ([doc 08](docs/foundations/08-layers-and-focus.md) §7.1). The
  `UNSTABLE_` prefix is still there in 1.21.0, and measured, it is on the base's
  six **component** exports and nowhere else — the hooks and the queue class
  underneath are unprefixed. What was marked unstable is the assembly, which is
  the layer a wrapper replaces. The reason to stop waiting is not the version:
  doc 09 §5 prefers **undo** over confirmation, and a `ConfirmDialog` with no
  `Toast` beside it leaves the preferred half of that pair nowhere to live.

- `SearchField`'s clear button moved from an absolutely positioned overlay into
  the field's frame, and its unconditional trailing padding went with it. There
  is now **one** mechanism for the contested trailing edge across every field,
  which is what doc 07 §2.2 exists to guarantee — and the four conditions that
  make a cross useless are computed in one place instead of three of them in
  CSS and the fourth in a render branch.
- A numeric field keeps its stepper's room while loading or saving. It used to
  render nothing there, which closed the gap and slid the value 28px across —
  the field's own busy state breaking doc 09 §3.
- Doc 07 §2.2 rule 1 now says **unreachable, not absent**. It said "not
  rendered at all", which describes the same thing to a reader and a different
  thing to a layout. Corrected by building it.

- **Breaking — `NumberField` no longer shows its stepper buttons by default**
  ([decision 0011](docs/decisions/0011-the-stepper-is-opt-in.md)). Pass
  `isStepperVisible` where pressing is genuinely how the value is entered.

  Nothing is lost without them: the arrow keys still step by `step`, Page Up
  and Page Down still make larger jumps, the value is still announced, and the
  control is still a `spinbutton`. All of that is the base's, not the buttons'.
  What the buttons cost is the trailing edge of every numeric field on a form
  trying to be dense — measured on the catalog's own story, 28px on the
  trailing side and 56px across both.

  ```diff
  - <NumberField label="Quantity" />
  + <NumberField label="Quantity" isStepperVisible />
  ```

  A default that is wrong for the common case is paid for by everyone who does
  not know there is a prop; a default that is wrong for the rare case is paid
  for once, deliberately, by whoever needs it.

- `--width-hit` is gone, one week after it was added, and `--min-width-hit`
  replaces it. The comment introducing it claimed it made `bb:min-w-hit`
  writable and that was simply false — Tailwind resolves a min-width utility
  from its own namespace, so the class compiled to nothing while looking
  correct in the source, leaving a 14px target where 24px was required. Nothing
  consumed `--width-hit`, so this breaks nobody; it is listed because a public
  token disappearing is API either way.

- `size` is `sm | md | lg` across the whole library, and a component uses the
  subset it needs ([doc 02](docs/foundations/02-api-conventions.md) §3.1). The
  rule is written down because the alternative had already arrived: a second
  vocabulary, defensible on its own, for an idea that already had one. And
  `compact` is taken — it is a value of the density axis, which composes with
  `size` rather than replacing it.

- **Every control now answers the pointer.** Checkbox, radio and switch styled
  neither hover nor pressed — measured, both states were pixel-identical to
  rest — so a control gave no sign it was a target until you had already
  clicked it. They now move their FILL, matching what `Button` already did:
  the grey ramp while unselected, the accent ramp once selected, one step
  further when pressed. The whole label triggers it rather than the box alone,
  because the label is the hit area and feedback confined to twenty pixels
  would teach people the text is not pressable when it is.

- **Fields move their border instead, and the difference is deliberate.** A
  field is a large surface the pointer crosses constantly in a dense form, and
  repainting its interior each time would make the form shimmer. Same reasoning
  already accepted for `--bb-border-control`: the size of a thing changes what
  reads correctly on it.

- The switch track rests on `--bb-surface-control` rather than
  `--bb-surface-sunken`, so all three small controls share one resting
  surface. Nobody chose the difference; it accumulated.

- **The visual language settles on the Radix scales** — slate for greys,
  indigo for the brand — with radii, control heights, density spacing and a
  single focus ring tuned in the semantic layer. No component holds a value of
  its own. Fields trade a permanent heavy border for a fill, and the focus
  ring becomes a coloured border plus a halo mixed from the ring colour at the
  point of use, so an invalid field rings in danger and a branded one in the
  brand without either carrying a second rule that can drift.

- **Three tokens are now restated per mode rather than shared**, each with the
  measurement that forced it recorded beside it: `--bb-border`, `--bb-link`
  and `--bb-accent-subtle-on`. The Radix light and dark scales run in opposite
  directions, so one role — "as light as legibility allows" — lands on a
  different step in each mode.

- **`--bb-accent-subtle-on` moves from step 11 to step 12 in light.** The
  subtle family is one text colour over three backgrounds, and the pairing has
  to hold on the darkest of them: pressed measured 4.46:1 against the 4.5:1 it
  needs. Invisible until the pressed state became something the catalog could
  actually render.

- **Contrast fixes across the state colours**, found by automated
  accessibility. A filled danger button measured 3.91:1 against a 4.5:1
  requirement, and error text 3.91:1. Radix step 9 is designed for graphical
  elements, not text; the solids now use step 11 in light mode, and dark mode
  pairs step 9 with dark text — no step of the dark scales reaches 4.5:1
  against white. New `--bb-*-text` tokens for state colours used as text.

- The library is being rewritten from scratch. Nothing from `0.1.1` is carried
  over: no component, prop name, DOM structure or test id. The rewrite will
  ship as `0.2.0`.
- Repository restructured as a pnpm workspace: the package lives in
  `packages/blackborne`, the visual catalog in `apps/catalog`.

### Fixed

- **A `Select`'s trigger no longer carries a phantom tick.** `SelectValue`
  renders the selected row's own children — all of them — so the trigger
  contained a copy of the row's tick glyph. The tick is `visibility: hidden` on
  purpose, so a row does not move as the selection walks; in the trigger the
  consequence was 16px of invisible width inside an element that truncates,
  which showed a long value's ellipsis early for no reason anybody could see.
  It is `display: none` in there now. **No appearance changed** — the box was
  invisible, and every baseline came out identical. Found while building
  `TimePicker` on top of it.

- **`Progress` keeps its number at the trailing end when the label is hidden.**
  The row is `justify-between`, a hidden label is `sr-only` and therefore out
  of flow, and `justify-between` puts a SINGLE item at the start — so a bar
  with `isLabelHidden` and a visible number drew the number at the leading
  edge. Found on `Slider`, which shares the row and has a story that does
  exactly that, and fixed in both. No existing baseline moved: no story of
  `Progress`'s own hides the label while showing the number.

- **A hidden label left the control nameless, in the first draft of
  `Progress`.** It rendered a plain `<span>` and left it out when hidden, on
  the reasoning that the name reached the bar anyway. It does not: the base
  publishes a label context that its own `Label` consumes to take an id, and
  the bar points `aria-labelledby` at that id. A span is wired to nothing.

  Caught by querying BY NAME rather than by role, which is the only way it
  fails when it is wrong — `getByRole('progressbar')` passes either way. The
  fix is the base's `Label` always rendered and hidden with `bb:sr-only`, and
  the trap is in the package guide because anything outside `Field` that offers
  `isLabelHidden` will meet it.

  A second thing came with it: **`empty:hidden` cannot hide a row that holds an
  `sr-only` child.** The child is still a child, so `:empty` never matches, and
  what has to go is the gap above the track — otherwise a bar meant to be a
  plain line under a filename sits a few pixels below it, which no assertion
  looks for.

- **The record for what was asked of `Select` is corrected**, and it corrects
  something said out loud rather than something in the code. Those features
  were not accepted-and-unbuilt: every one was assessed and ruled **Never**,
  with a reason each — typing to filter is `ComboBox`, multiple choice is a
  `CheckboxGroup`, an `options` array is composition, and a read-only select is
  a select that is either offered or not.

  The one row that was open predicted its own case: "a long searchable list is
  where grouping is asked for, so `ComboBox` probably arrives with it".
  `ComboBox` arrived — with a long list, per-option keywords and a source that
  pages — and asked for no grouping, nor did either picker. The forecast is
  struck through rather than replaced, because one that was wrong is worth more
  on the page than one quietly corrected.

- **A new tab is found by asking the context, not by waiting for an event** —
  the third instrument these four checks have had, and the second time CI
  failed them for a reason that had nothing to do with the component.

  The history, all of it measured with two workers and never with one:
  `waitForEvent('page')` plus `page.url()` read the address before the
  navigation committed; `waitForURL` then never resolved at all, because a
  navigation that commits before Playwright attaches to the new target emits no
  navigation event for it; and now `waitForEvent('page')` itself timed out —
  thirty seconds, no page event, for a ctrl-click on a run of 348 checks. The
  middle click in the same file passed, and eighteen local runs at four workers
  reproduced nothing.

  One thing is under all three: **an event is a moment, and Playwright's
  bookkeeping for a new target is racing the browser.** So the checks ask for a
  STATE instead. `context.pages()` is what the context holds, and a tab that
  exists is in it whether or not an event was observed at the right instant —
  doc 10 §11, and the same move that fixed the accordion's frame counting, a
  chevron's rotation and a segment read mid-transition.

  A longer timeout was never the answer and is not the answer now: the second
  failure was permanent rather than slow, and a check that needs thirty seconds
  of a loaded runner to be right is a check nobody trusts by its tenth failure.

  **Verified by mutation, because the failure does not reproduce here.**
  Dropping the anchor's address makes no tab open and the poll says so —
  "Expected: 2, Received: 1" rather than a timeout, which also names what
  happened instead of leaving a stack trace. 24 runs of the four checks at four
  workers, and the full 348, green.

- **A twelve-hour locale renders invisible segments, and two checks were
  written against one.** The base wraps the clock in bidi ISOLATE marks
  (U+2066 and U+2069) and renders them as zero-width `literal` segments, so the
  FIRST child of a time field's row cannot be clicked and its colour is the
  punctuation's rather than the value's. One check timed out on it and another
  found read-only and disabled identical — both of them measuring an element
  nobody can see. `:not([data-type=literal])` is the selector, and the finding
  is in the package guide because every date and time component has that row.

- **A range picker's calendar was told nothing about how many months it had.**
  Found while wiring the layer: the picker's `calendarProps` carry the value,
  the limits, the unavailable days and the first day of the week, and nothing
  about the visible duration — so the grids and the base's state would have
  disagreed, with paging stepping the wrong distance. Passed explicitly, and
  written down in both guides.

- **Three things the date family found, two of them in the field structure
  every other component shares.**

  **A field's frame was a group inside a group.** The box every field draws is
  the base's `Group`, and a date field's control is a group of its own — the
  base's `DateInput` renders one so the row of spin buttons has a name to
  belong to. Measured in a browser: two nested groups carrying the same name,
  which a reader says twice. `ControlFrame` takes a `role` now and the date
  fields pass `presentation`; nothing about the box changes, because the state
  the frame styles from is render props rather than the role.

  **The clear button had no name a check could find.** `EDGE_BUTTON` is shared
  with the steppers and the reveal toggle, so the cross carried no `bb-` class
  of its own — and §2.2a's first condition is a measurement of its hit area
  beside another control's, which needs something to select. It is
  `bb-field-clear`.

  **And the picker's chevron never turned.** `bb:group` was on the root and the
  `aria-expanded` is on the toggle, so the variant matched nothing — the same
  trap the package guide already recorded from `SplitButton`, arriving on the
  next component with a portalled layer. Measured after the fix: `none` shut,
  `180deg` open.

- **Today's ring was below the contrast floor**, and finding it took three
  steps that are worth keeping in order, because each one was only reachable
  from the one before.

  **A baseline failed CI on a clock.** The calendar's RTL reference configures
  Cairo, and a calendar works out today for itself from the zone it is given
  (decision 0023) — so the picture marks the 9th at midday UTC and the 10th at
  22:00. 104 pixels, on a branch that had changed nothing. The harmless face of
  it.

  **The face that matters does not fail at all.** Photographed from a month
  that does not contain today, nothing is marked, so the reference would have
  stopped guarding the ring and gone on passing — three weeks after the ring
  was added, and it was added because the first baseline showed it vanishing
  under the chosen day's fill. Three of the calendar's browser checks were
  dated the same way: measured against the 5th of October they fail on a count,
  which is to say they were written on the ninth of September and were due to
  start failing on the tenth. The clock is now fixed for the capture and for
  that file, at midday UTC from one shared module, so a picture and the check
  beside it cannot disagree about what day it is
  ([doc 10](docs/foundations/10-quality-and-verification.md) §6.1).

  **And fixing the clock is not the same as choosing what is in the picture.**
  All three calendar baselines pinned the ninth as the chosen day, on a day
  when today WAS the ninth — so every calendar in every reference showed one
  cell carrying both marks, and the ring has two colours, one per case. Only
  one of them had ever been photographed. The states baseline now holds a
  calendar whose chosen day is not today.

  **Which is how the defect became visible.** The ordinary ring was
  `--bb-border-strong`, measured against the resolved surface:

  |                      | light      | dark   |
  | -------------------- | ---------- | ------ |
  | `--bb-border-strong` | **1.86:1** | 3.01:1 |
  | `--bb-text-muted`    | 5.79:1     | 9.06:1 |

  Doc 03 §5 rule 2 asks 3:1 of a graphical element, and this ring is the only
  thing marking today — so a hard rule broken in light mode and scraped through
  in dark, which is exactly the mode asymmetry that rule already warns about. A
  border token is for a boundary you are not meant to read; this one carries
  the information.

  So the rule the selected case already followed is now the whole rule: **the
  ring is drawn in the text colour of whatever it sits on** — `--bb-text-muted`
  on the surface, the accent pair's own text colour inside a chosen day. Doc 03
  gains the measurement as a third bullet under that rule.

  **Nothing automated was ever going to catch it.** axe checks the contrast of
  text and a box shadow is not text, so the calendar now computes the ratio
  itself, in both modes, against what each ring actually sits on — measured
  while writing it: comparing the ring inside an accent fill against
  `--bb-surface` gives 1.03:1 and means nothing. It also asserts that both
  cases are on screen, so a story that stopped showing one would fail rather
  than quietly narrow the check. Verified by reverting the token: 1.86:1, named
  in the failure.

- **A browser check was measuring the machine rather than the component**, and
  it failed CI on a pull request whose only fault was being built on a busy
  runner.

  It proved that a collapsible panel TRAVELS between its two heights instead of
  jumping, by pushing the height on every animation frame and requiring more
  than one frame strictly between the endpoints. In CI, on two workers, it saw:

  ```
  [0,0,0,0,12.59,144,144,144]   one intermediate frame, for a 160ms transition
  ```

  The panel was animating perfectly. The frame rate under load is not something
  a test controls, so the number being asserted was the runner's.

  **Two attempts, because the first fix was still a race.** Catching the
  transition on `transitionrun` and pausing it is the right instrument — the
  event is delivered whatever the frame rate does — and it is not enough on
  its own: it arrives on the main thread, measured 16.7ms late on an idle
  machine, and under a full parallel run it can arrive after a 160ms transition
  has finished and been removed. The full suite failed it with nothing paused
  at all.

  **What works is to stop competing with the transition.**
  `Animation.setPlaybackRate` over the DevTools protocol slows the document's
  animation clock, so the same lateness costs a fiftieth of the animation — measured: `currentTime` at the event drops from 16.7ms to 0.334ms. Nothing
  about the component changes, which is why it is done there rather than by
  overriding the duration token: the transition still reports the 160ms its
  token declares, and the check asserts that, because an instrument has to
  prove it did not disturb the measurement.

  The check is also stronger than the one it replaces. It reads the curve at
  exact fractions of the transition — `0 → 54.58 → 110.88 → 136.97` at 0,
  25, 50 and 75 per cent — and requires each to be taller than the last and
  none to have arrived. A jump satisfies the endpoints and fails on the first
  step. Verified by mutation: renaming the base's `--disclosure-panel-height`
  leaves `height` at `auto`, no transition is ever created, and the check says
  so. 12 runs with eight workers and the full 284 behaviour checks, green.

  One thing found on the way, and it is in the check's own comment because it
  is a trap for anything driving a transition: writing
  `currentTime = duration` on a paused CSS transition **removes** it. There is
  then nothing left to play, the promise the base is waiting on rejects rather
  than resolves, and the panel never switches back to `auto` or resizes with
  its content again.

  [Doc 10](docs/foundations/10-quality-and-verification.md) gains a §11 for the
  rule, since this is the second check in the repository to be green or red for
  a reason that had nothing to do with the component: a check asserts what the
  component does, and if its result also depends on how fast the machine ran
  it, it is measuring the machine. Widening the tolerance is not the fix — a
  check that fails at random teaches everybody to re-run the job.

- **Three of the browser checks could time out while the browser had done
  exactly the right thing.** The new-tab checks on `Link` — middle click,
  ctrl-click, `target` of its own — waited for the opened tab's url with
  `page.waitForURL`, and that wait can never finish:

  ```
  page.url()               → about:blank    (readyState complete, nothing pending)
  location.href inside it  → http://127.0.0.1:6007/customers/4821
  ```

  When the new tab's navigation commits before Playwright attaches to it, no
  navigation event arrives for that page and `page.url()` stays at
  `about:blank` permanently. So the failure was not a slow load: a longer
  timeout would have made the suite slower and still red. It needed two workers
  to show up — twelve local runs with one worker never produced it, and CI
  produced it once in a pull request that changed no code at all.

  The checks now ask the document where it is, with `waitForFunction`, which is
  also the question they were always about: where did the browser take this
  tab. Verified by mutation — pointed at an address the link does not have,
  the check fails and prints both values, which is the diagnostic that was
  missing while this was being found.

- **The library no longer warns about strings that are not missing.** With no
  `ConfigProvider` above them, components warned once per string drawn —
  measured at thirteen warnings from a single mounted field — because the
  default dictionary was empty and every lookup counted as a gap. Doc 05 §2.2
  asks that a MISSING KEY warn; a missing provider is not a missing key, it is
  the configuration that is supposed to work. A dictionary you supply still
  reports its gaps.

- **The catalog's contrast guard fired on a story it should have excused**, and
  finding out why turned up a hole in the automated accessibility layer.

  axe does not check the contrast of Arabic text. Its `color-contrast` rule
  skips anything it takes for an icon-font ligature, and it decides that by
  comparing the rendered width of a string against the sum of its characters
  measured one at a time — 15% or more means icon. Arabic is cursive, so its
  letters join and every string crosses that threshold: measured at 30px
  `system-ui`, 241.9px against an expected 314.5, a difference of 0.231. The
  same sentence in Latin gives 0.

  So the guard's exemption widens from "no text" to "no text axe will measure",
  and it asks **axe's own classifier** rather than reimplementing the
  heuristic. Verified with the rule disabled on purpose: a Latin story still
  fails, and the failure now names how many text nodes axe would measure.

  Doc 06 gains a §5.1 for the consequence, which is not about one story: no
  Arabic text in this catalog has ever had its contrast checked. What makes it
  survivable is that contrast is a property of the colour pair rather than the
  script, and every pair also appears in Latin text. What it forbids is
  translating a story, or padding one with Latin, to make the guard pass.

- **`Popover`'s arrow was invisible**, and its screenshot recorded the absence
  as correct.

  An `OverlayArrow` is positioned against the element the base positions and
  OUTSIDE it, and the panel clips its children — a sticky header's square
  background would otherwise paint over the rounded corners. So the arrow was
  erased: box in the right place, `visibility: visible`, correct rotation
  matrix, and nothing on the screen.

  Fixed by structure rather than by loosening the clip, which was tried and is
  worse — `overflow: clip` with a clip margin lets the arrow out and lets the
  header's corners out with it, 51 pixels on `dialog-light`, one cluster at
  each corner. An anchored layer now WRAPS the panel: the wrapper is what the
  base positions, the arrow is its child, and the panel inside it still clips
  exactly as before. `Dialog` and `Drawer` are untouched.

  **One committed baseline changes**, `popover-arrow`, because it recorded the
  defect. Every other one is byte-identical. Doc 08 §9 gains the general form:
  a computed style is not paint, and a baseline accepts whatever is there.

- **A layer panel no longer declares a query container**, which had made every
  `Popover` render **2px wide** — its two borders — with nothing in any
  console.

  `container-type: inline-size` computes an element's inline size as though it
  had no contents. That is harmless on a panel whose width is declared, and
  fatal on one sized BY its contents, which an anchored popover is. `Dialog`
  and `Drawer` declare the container themselves now, beside the widths that
  make it safe, so **container queries inside a dialog or a drawer are
  unchanged**. Inside a popover they never worked and now cannot be asked for:
  the content is what decided the width. Doc 04 §4.3 has the rule and decision
  0010 the cost it was predicted from, five weeks before it was paid.

- **The container scale was not injectable, though doc 04 said it was.** It was
  declared inside `@theme inline`, which substitutes the value into each utility
  and emits no variable — measured, `--bb-container-narrow` appeared nowhere in
  the compiled stylesheet, so redefining it changed nothing. It is now declared
  outside that block, and `bb:max-w-narrow` compiles to
  `max-width: var(--bb-container-narrow)`.

  **Half of it still cannot be injected, and that is a CSS limit rather than a
  choice:** a container query's condition may not contain `var()`, so the
  generator bakes the number into `@container (width >= 24rem)`. Redefining the
  token moves every width measured against the scale and leaves the query
  thresholds where they were. Doc 04 §4.0 states that asymmetry instead of
  promising both.

- **`--bb-surface-raised` was elevation pointing the wrong way in light mode.**
  It is the token named for menus, popovers and dialogs, defined since the token
  layer and never rendered until now. Measured against the page: 0.9486 relative
  luminance against 0.9741, so the "raised" surface was **darker** than what it
  floats above, at 1.03:1 — imperceptible, and imperceptibly backwards. It is
  now the page's own step in light, with the shadow carrying the elevation, and
  stays two steps lighter in dark where a shadow is not visible. No component
  read it before, so nothing changed appearance.

- **A layer's exit animation swallowed `Escape`.** One was written for `Dialog`
  and removed: the base keeps a layer mounted while it animates away, and a
  mounted layer still consumes the key — so closing a dialog inside a dialog and
  pressing `Escape` again did nothing. Measured with a varying gap between the
  presses: dropped at 0ms, 16ms and 50ms, landing at 150ms, against a 100ms
  exit. What proved it was emulating `prefers-reduced-motion`, where the
  durations collapse to zero and both presses landed every time — so the
  interaction worked for somebody who asks for less motion and failed for
  everybody else. Now a rule:
  [doc 09](docs/foundations/09-behavior.md) §2.1, a layer animates in and never
  out.

- **Decision 0010 claimed a consequence that does not exist.** It said a Card's
  `container-type: inline-size` makes it a containing block for absolutely and
  fixed positioned descendants. Measured in Chromium: it computes
  `contain: none` and contains neither. A consumer's `position: fixed` element
  inside a Card still positions against the window. The decision stands; its
  list of costs is one shorter than it said.

- `TextArea` carried `min-block-size: fit-content`, which made its height
  limit unenforceable: a CSS minimum outranks every maximum, so content taller
  than the ceiling stretched the box to fit all of it. The page-length field
  the limit exists to prevent, with a limit set. Also removed the drag grip on
  a growing field, where a dragged height is overwritten by the next keystroke
  — a grip that appears to work and then undoes itself.

- **A numeric field's value was never at the right type size.** Its size class
  went on the group that wraps the input, and an `<input>` does not inherit
  `font-size` — browsers set a font on form controls and this package ships no
  reset to undo it. So the value rendered at the browser's 13.3px while every
  other field used the token, in the same form, at the same nominal size.

  It had been that way since the component was built. The alignment check
  compares heights and they matched perfectly; the tabular-figures check
  compares digit widths and they were still equal. Neither looks at type size,
  and now one does.

- **A read-only field never looked different from an editable one**, in any
  field, since the first one shipped. The class was `data-readonly:` on the
  control, and a read-only input gets the native `readonly` attribute and no
  data attribute at all — the state lives on the field's root. The rule was
  written, the class was written, and nothing connected them.

  Read-only now drops the box: the page's own background and no visible edge,
  so the value reads as text rather than as something you can type into. A
  shape channel rather than another grey, and deliberately — measured, in dark
  mode `--bb-surface-control`, `--bb-surface-sunken` and `--bb-surface-disabled`
  are the same value, so any fill-based answer would have worked in light and
  silently done nothing in dark.

  Four baselines move. The check that would have caught it — comparing computed
  colours, which is the only instrument that can — now exists.

- `NumberField` drew its stepper buttons while loading or saving, so the busy
  indicator was painted on top of the `+` button — two things in one place, and
  the one you could press did nothing useful. Doc 07 §2.2 gives the trailing
  edge to the busy state outright, and the field now honours it whatever
  `isStepperVisible` says. Found by another component implementing the same
  clause.

- Two catalog checks that were passing without checking anything. The forced
  hover, pressed and focus states never reached the DOM — the base renders its
  own state attributes on the same element and wins — so every `*-states`
  baseline had been approving six identical controls labelled as six different
  states. And the alternate brand fixture was incomplete in all five of its
  copies; a step left out falls back to the library's own indigo, so the
  stories proving the brand axis works were proving the opposite.

- The visual-regression runner no longer replaces the host's `node_modules`
  with an installation built inside the container.

### Removed

- `isSteppersHidden` on `NumberField`. It is the default now, so the migration
  is to delete the prop.

- The entire `0.1.1` codebase. It stays available under the `v0.1.1` git tag.
- `react-router-dom` as a peer dependency. The library provides no routing
  (non-goal 1).
- `react-icons` as a dependency. Icons are received, never distributed.

## [0.1.1] - 2025-02-20

Last release of the original library. Deprecated on npm; superseded by the
rewrite.

[Unreleased]: https://github.com/juniorencode/blackborne/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/juniorencode/blackborne/releases/tag/v0.1.1
