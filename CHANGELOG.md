# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the library is in the `0.x` series the public API may break between
minor versions. Every break is listed here with its migration.

## [Unreleased]

### Added

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
