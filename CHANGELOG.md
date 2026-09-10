# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the library is in the `0.x` series the public API may break between
minor versions. Every break is listed here with its migration.

## [Unreleased]

### Added

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
