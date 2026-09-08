# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the library is in the `0.x` series the public API may break between
minor versions. Every break is listed here with its migration.

## [Unreleased]

### Added

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
