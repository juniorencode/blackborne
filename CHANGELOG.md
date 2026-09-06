# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the library is in the `0.x` series the public API may break between
minor versions. Every break is listed here with its migration.

## [Unreleased]

### Added

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
