# Working inside the package

Rules that apply to the library source specifically. The repository-wide rules
are in [../../CLAUDE.md](../../CLAUDE.md); this file does not repeat them.

## What ships from here

One package: ESM, TypeScript types, and a single compiled CSS file. React and
React DOM are the only peer dependencies.

Tailwind is used **inside** and is an implementation detail. Consumers get
compiled, prefixed CSS and are never required to install or configure Tailwind.
The prefix is `bb`, on every class and every variable, so nothing collides with
the consumer's own Tailwind.

## Tokens: three layers, and only one is yours

| Layer          | What it is                              | Who may use it                          |
| -------------- | --------------------------------------- | --------------------------------------- |
| 1 · Primitives | Raw scales. Values with no meaning      | Layer 2 only. **Never a component**     |
| 2 · Semantic   | The role: what this color is _for_      | Every component. This is the vocabulary |
| 3 · Component  | A local exception, derived from layer 2 | One component                           |

A component that reads a primitive or writes a literal color is a defect. The
reason is mechanical: if components use primitives, changing theme means
touching components; if they use semantic tokens, changing theme means changing
variables.

**Name by role, never by color.** `--border`, not `--secondary-300`.
`--accent`, not `--blue-600`. If you must open the palette to know whether a
token is the right one, the name is wrong.

**Every background declares the text color that goes on it, and they are used
together.** There is no standalone "text on accent" token — there is a pair.
This is what keeps contrast correct when the brand theme is a light color like
amber or lime, without anyone having to remember.

Before adding a token, check that an equivalent does not already exist. Three
near-identical greys is how the system decays.

## Three theme axes

Mode (light/dark), brand color, and density. Independent, combinable and
nestable. All three are implemented the same way: **redefining variables on a
container**. None of them is ever implemented with per-component conditional
classes.

Density moves spacing, control heights and row heights. It does **not** move
any color, and it does not move the base text size — compact trims air, not
legibility.

Dark mode is not an inversion. Each semantic token is defined separately per
mode; a dark theme derived by calculation is recognisable on sight.

## The package ships no reset, and that has a consequence

Tailwind's preflight is deliberately excluded: a library may not overwrite the
styles of the application that installs it. The cost is that browser defaults
apply to our elements too, and one of them bites.

**Every element with a height, a width or a border needs `bb:box-border`.**
Without it the default is `content-box`, so a control declared 40px tall
measures 42, and two controls of the same nominal size stop lining up. It is
invisible until a form looks subtly wrong and someone starts nudging margins,
which hides the symptom and keeps the cause.

This is caught rather than merely written down: the catalog asserts in a real
browser that a field and a button of the same size have exactly the same
height. Adding a component that forgets `box-border` fails that check.

**A form control does not inherit `font-size`.** Browsers set a font on
`input`, `textarea` and `select`, and with no reset to undo it, a type size
that sits on a WRAPPER reaches the box and never the value. Measured: a numeric
field whose size class lived on its group rendered its value at the browser's
13.3px while every other field used the 14px token, in the same form, at the
same nominal size — for as long as the component had existed. So a field's size
map has two halves: the height goes on the frame, the type goes on the control.

**`border-solid` on its own is a 3px border.** The style utility sets
`border-style` on all four sides and nothing here sets a width, so the three
sides without one keep the browser's initial `medium`. Measured on an
accordion's panel divider: `border-t border-solid` drew 1px on top and **3px**
on the other three, a box round every open panel and 2px wider than the section
holding it. The per-side utilities need no help — Tailwind emits
`border-top-style: var(--tw-border-style)` with that variable registered at
`solid` — so `border-t` alone carries the width and the style. Pairing
`border-solid` with the all-sides `border` is harmless, which is why every
other component does it and nothing had found this.

**A block of text renders as a `div`, not a `p`.** Same cause: with no reset, a
`<p>` arrives carrying the browser's own block margins, which fight the gap the
component already decided. Headings are a separate question and the answer is
also no — heading hierarchy belongs to the project (doc 06 §2), and a component
cannot know what level it landed at. Emphasis comes from weight and colour.

## Components

- Style against the DOM state attributes React Aria exposes, not against
  conditional class strings built in JavaScript.
- Variants live in **one typed map per component**, not in conditionals spread
  through the file.
- No escape hatches: no prop that injects classes into arbitrary internal
  nodes, no override that depends on internal DOM structure. If a consumer
  needs something, they get a named prop or composition.
- Nothing has a fixed width. Use max-width. Nothing is sized to fit one
  particular label in one particular language.
- **A shared button inside a base component must declare its slot.** Several of
  the base's components publish NAMED button slots — a numeric field's
  `increment`/`decrement`, a tag's `remove` — and a slotless `Button` inside one
  **throws**: "A slot prop is required." So a button written once and reused
  needs a `slot` prop it can set, or `null` to fill none of them. Measured
  twice, in two different components, before it was written down.
- **Icons arrive as children**, and the component sizes and colours them from
  the slot — one standard size, `currentColor`, no `iconStart` prop and no
  `icon="save"` string. A named slot is only for a place the consumer could not
  have reached by ordering children. Doc 02 §11.
- Empty, loading and error are part of the component, not the consumer's
  problem. "No data yet" and "the filter matched nothing" are two different
  states with two different messages.
- **`Link` navigates; `Button` acts** — including `Button variant="link"`. The
  test is whether there is an address. An anchor is what a browser can
  middle-click, ctrl-click, offer to copy and list among a page's links, and
  none of that is reachable from a `<button>` however it is dressed. Doc 02
  §7.1, and the two must keep looking different: accent and underlined at rest
  is a link, ordinary text until pointed at is a button.
- **A structural change asks CSS which step applies and reads the answer.**
  `internal/useContainerStep` is doc 04 §6's one hook, and it resolves no
  token: the caller declares a query container and carries four classes that
  set `--bb-step` per step, generated from the scale by the same variants a
  component would use at N2, and the hook reads the resolved value on resize.
  One set of thresholds, no unit conversion, no reading the document — and
  where there is no observer or no layout, the answer stays at the narrowest
  step, which is what a first paint renders anyway. Doc 04 §6.2.
- **`@container` goes with a declared width.** Doc 04 §4.3's law: inline-size
  containment computes a width as though the element had no contents, so a
  component sized BY its contents collapses. A `<nav>` in normal flow does not
  care; the same nav in a flex row is shrink-to-fit, which is how every
  popover in the catalog came to be 2px wide. `Pagination` pairs the two.
- **The library's first directional icon is a breadcrumb separator**, and it
  is where doc 02 §11.4 bites: the chevron is drawn pointing down and turned a
  quarter turn along the reading direction — anti-clockwise in a left-to-right
  language, clockwise in a right-to-left one, through the `rtl:` variant and
  never a physical `left`. It is also why a consumer cannot pass their own: the
  library may not flip an icon it did not draw, so a chevron arriving from
  outside would point the wrong way in Arabic, silently.
- **A separator belongs to the step that FOLLOWS it**, dropped on the first by
  a rule keyed on `:first-child`. Chosen over counting in JavaScript because
  CSS re-evaluates on its own when a consumer renders the first step
  conditionally — which is the failure the accordion's joined-list layout was
  rejected for.
- **A focus ring on a run of text is an outline, not a border.** A border
  widens an inline box and moves the words after it every time focus lands.
  Doc 06 §3.1 has the rule and the table; the browser check measures the text
  not moving.
- **How a link navigates arrives on the provider**, like the portal container
  and for the same reason: the base's router provider is an export of OUR
  dependency, so a consumer cannot reach it. With nothing passed, a link is an
  anchor and loads the page — correct with no provider, and a restart in a
  single-page application. The base checks `target`, `download` and every
  modifier before handing a press over, so a `navigate` that only pushes onto
  a history stack is complete (decision 0016).
- **A group and its member can be one component.** `Accordion` and
  `Collapsible` are the accordion pattern and the disclosure pattern, and the
  only difference in the markup is the heading — so a section alone renders
  none and a section in a group renders one at the level the group was given
  (doc 06 §2.1). The level travels by context, never exported, which is doc 02
  §3.1.1's rule for a property that belongs to the SET.
- **A collection item's children must be PLAIN TEXT, or the typeahead dies
  quietly.** The base derives an item's `textValue` from its children, and
  anything that is not a string — a render function, an element — derives
  nothing: typing a letter in the list then moves the highlight nowhere. It says
  so in a development warning, which is worth nothing if nothing reads the
  console, and that is how a select's tick drawn from a render prop shipped a
  dead typeahead through a green suite. Two halves to the fix: render the mark
  unconditionally and hide it with a `data-selected` variant (which the row
  needed anyway, so it does not move as the selection walks), and pass
  `textValue` through where the children are a string. `select.spec.ts` has the
  one check in this repository that reads the console.
- **A list that matches its trigger's width spells the base's variable.** A
  popover publishes `--trigger-width`, and `Select`'s list declares
  `min-w-(--trigger-width)` with the narrow container as a ceiling — `min`, so a
  long option grows the list rather than truncating every row. It is the same
  coupling a disclosure's height animation has, with the same failure: rename it
  upstream and the declaration is merely invalid, the list falls back to its
  content width, and nothing appears in the console. The browser check measures
  the list against the field rather than against a remembered number.
- **A height animation is the base's, not ours.** `useDisclosure` publishes
  `--disclosure-panel-height` on the panel, sets it in pixels, switches it to
  `auto` when the animations finish, and on the way closed waits for
  `getAnimations()` on THAT element before hiding it. So the whole animation is
  a CSS transition on `height` — no `interpolate-size`, no grid trick, no
  observer. Two consequences: the transition has to be on the panel itself or
  the base sees no animation and hides the content mid-flight, and the panel
  may carry **no padding**, because a border-box height is floored at padding
  plus border and a closed panel would rest two dozen pixels tall.

## Fields

The unit of composition is **label + control + description + error**, always
together and always related to each other — that relation is what makes an
error perceivable to someone who cannot see it.

The core of every field is **controlled**: a value and a change callback,
working with no form library present. Adapters for form libraries live behind a
separate entry point and are optional.

The library restricts input and presents errors. It does not decide whether a
value is valid, and it does not write the message.

**Not every field publishes a group context, so a frame may have to be TOLD.**
`ControlFrame` reads `isInvalid` and `isDisabled` from the base's group context,
which a `TextField` publishes and a **`Select` does not** — measured. Passed
implicitly it silently does nothing, and the box looks ordinary while the field
is invalid or switched off. Check it on any new composed field: the frame is the
element a person sees the edge of, and it has to carry the state the field is
in.

**And a select's required state is announced by nothing the base gives the
trigger.** `Field` hides the asterisk from a reader on the grounds that the base
sets `aria-required` — true of an input, and measured false of a select: the
base puts `required` on the hidden native control it renders for a form, and the
button a person operates carries none of it. The base's select label is not a
`<label>` either, because a `<label>` cannot label a button — the name arrives
by `aria-labelledby`. So `Select` composes a visually hidden word into its own
label, where the name comes from: the asterisk stays the visible channel, the
word is the announced one, and nothing is said twice. The component with the gap
is the component that fills it (doc 06 §2), and the gap is on doc 06 §5's list
for the screen-reader pass.

## Text and formatting

Every user-facing string comes from the dictionary, with English always present
as the fallback. A missing key returns English and warns in development — never
an empty string, which is a silent failure that blanks half an interface with
no error in the console.

Dates, numbers, currency, sorting and plurals are formatted through the
platform's locale APIs. The time zone is **received, never taken from the
browser** — the browser's zone is the viewer's machine, not the data's context.

## Layers

Everything that renders in a portal. Four things were measured while building
`Dialog` and every one of them will apply to the next layer.

- **The element that scrolls must be the element the base focuses.** A browser
  scrolls the nearest scrollable **ancestor** of what has focus, and the base
  focuses the element carrying `role="dialog"`. So the obvious three-row grid,
  with the middle row scrolling, puts the scroll container out of every key's
  reach — the arrows look for a scrollable ancestor, find the clipped panel and
  the locked page, and move nothing. Put the scroll on the focused element and
  make the header and footer `sticky` inside it.
- **A percentage max-height cannot bound a child of a max-height parent.**
  `max-height: 100%` resolves against the parent's HEIGHT, and a panel with only
  a `max-block-size` has no definite height, so the percentage computes to
  `none`. Measured: 1658px of content inside a panel capped at 876px, the inner
  element not scrollable at all, and the panel silently clipping the rest. Use
  flex — `flex flex-col` on the panel, `min-h-0` on the child — so the child is
  bounded by layout instead of by a percentage.
- **No exit animation.** The base keeps a layer mounted while it animates away,
  and a mounted layer still consumes `Escape`, so an inner layer closing eats
  the press meant for the outer one. Doc 09 §2.1.
- **`container-type: inline-size` does NOT contain a fixed-position child.** It
  computes `contain: none`. Only `contain: layout` or a transform does. This
  was written down wrongly in decision 0010 and is corrected there.
- **A layer-3 rule does not COMBINE with a utility — it replaces it.** These
  files are unlayered so they outrank utilities, which is the point, and it
  cuts both ways: a `max-h-*` class on an element whose layer-3 rule also
  declares `max-block-size` is simply ignored. Measured: a bottom drawer asked
  for 30rem and rendered the window's full 900px. Where two constraints have to
  hold together, the CSS composes them itself — `min()` of a variable the
  component feeds and the window — rather than hoping the cascade will.
- **A layer that moves cannot be measured the moment it is visible.** A drawer
  slides, so between appearing and coming to rest it is partly off its edge: a
  480px panel against the right of a 1280px window reported its far side at
  1520 mid-flight. Wait for the base to drop `data-entering`.
- **A layer declares a query container only if it declares a width.**
  `container-type: inline-size` computes an element's inline size as though it
  had no contents, so a panel sized BY its contents collapses to its borders.
  The shared panel used to carry it, which was fine for the two layers with
  declared widths and made every popover **2px wide** — an anchored popover is
  absolutely positioned with `width: auto`. `Dialog` and `Drawer` declare it
  themselves now, next to their sizes. Doc 04 §4.3, and it is decision 0010's
  consequence 1 arriving.
- **The shared `ModalSheet` is what contains a layer's focus**, not the layer.
  It renders `role="dialog"`, and `useDialog` switches containment on in the
  enclosing `Overlay` from the inside — so a popover contains focus even though
  the base's own request for it is off. The layer that must NOT contain focus
  cannot use the sheet as it is. Doc 08 §4.
  Measured again on `Preview`, in a browser: with the sheet nested, `Tab` past
  the last thing in the card kept focus inside it. That is the check to run
  before reaching for the sheet in a layer that closes itself.
- **An ANCHORED layer wraps the panel; it is not the panel.** The base
  positions the element it is given and an `OverlayArrow` is positioned against
  that element and OUTSIDE it, while the panel clips its children — so the
  arrow and the painted panel cannot be the same box. `Popover`'s arrow shipped
  invisible for exactly this reason, and loosening the clip is worse: it lets
  the sticky header's corners out too. `ANCHORED` in `internal/Layer` is the
  wrapper, and it paints nothing.
- **The element handed to `portalContainer` may hold no layout of its own.** A
  layer portalled into it is a CHILD of it and the base's overlay wrapper is
  `position: static`, so it takes part in that element's layout. The catalog's
  own fixture centred with `place-items: center` on the same element, and an
  open tooltip therefore became a grid item: measured, the trigger moved from
  y = 441 to y = 239 when it opened. Fourteen baselines had been generated
  from the shifted layout and three unrelated checks were intermittently
  failing because the base positions against a box that then moved. Doc 08 §9.
- **A computed style is not paint.** The arrow above had the right box, the
  right rotation and `visibility: visible`, and nothing on the screen. Use
  `document.elementFromPoint` on anything drawn: clipped content is not
  hit-tested. Doc 08 §9.
- **A menu's panel is a dialog containing a menu, and that is the base's
  decision.** Measured: `Popover` gives itself `role="dialog"` unless it is
  told `isNonModal`, so a menu is announced inside a dialog with the same name
  — and the lever that removes the role removes the underlay and the scroll
  lock with it, which would let an outside click both close the menu and press
  what is under it. Left alone, asserted in `menu.spec.ts`, and on doc 06 §5's
  screen-reader list.
- **Danger-coloured TEXT is `--bb-danger-text`, never `--bb-danger`.** The
  solid step is for a fill whose pair carries the text. Reaching for it as text
  passes in light mode by coincidence — there the solid and the text step are
  the same — and fails in dark, where the solid drops two steps. axe caught it
  on a destructive menu command, which is the third pairing that check has
  found; the token's own comment predicted it in as many words.
- **A notice is the one layer whose state the CONSUMER holds.** `useToasts()`
  makes the queue; the library keeps none, because P3 allows it none. The base's
  queue class is deliberately kept out of a consumer's types — a rename inside
  our files costs them nothing, a change to a class in their own signatures
  costs them a migration, and the base still marks its toast components
  `UNSTABLE_`. Doc 08 §7.1.
- **A toast is an `Alert` that floats**, on the same four tone surfaces from
  `internal/ToneGlyph`. Built on the neutral raised surface first, and the first
  three-tone screenshot settled it: a failure looked exactly like a success
  apart from a 16px glyph.

## Hiding something without losing it

`visibility: hidden` and `opacity: 0` both keep an element's box, and they are
not interchangeable: **`visibility` also removes it from the accessibility
tree.**

Measured, on a pending `Button`. The label is hidden so the button keeps its
width, and the first version used `invisible` — an aria snapshot then read
`button "Cancel"` followed by `button` with no name at all, so somebody who had
just pressed Delete was left focused on a nameless control. `opacity-0` hides
it and keeps it named.

The rule: hide with `opacity` when the thing being hidden is the element's
NAME or its text, and with `visibility` only when it should genuinely leave the
tree — in which case `inert` and `aria-hidden` say so more clearly, which is
what a field's unreachable clear button does.

And the way to tell: query **by role and name**. `getByRole('button')` passes
either way; `getByRole('button', { name: 'Delete' })` is what fails.

**And there is a third way, which the base uses and which is worth knowing
because it looks like a bug the first time you meet it.** A collapsed
disclosure panel is hidden with `hidden="until-found"`, so its content stays in
the DOM — a browser's find-in-page opens the section to show a match — and is
gone from everything else. Measured while writing the accordion's checks: a
button inside a closed panel is not a disabled button in the accessibility
tree, it is **absent**, so `getByRole` fails with "element(s) not found" rather
than reporting something unfocusable. Both halves of doc 06 §4 rule 5 hold at
once, which is unusual: normally one has to be chosen.

And a note about looking at any of it: the catalog imports the **compiled**
stylesheet, so a change to a layer's CSS is invisible until
`pnpm build:css` runs, and a long-lived dev server serves whatever it started
with. Build, restart, then look (doc 08 §9).

## Dependencies

Two, both **pinned exactly, with no caret**, and they move together:
`react-aria-components` and `react-aria`.

`react-aria` is there for one thing — `UNSAFE_PortalProvider`, which
`react-aria-components` does not re-export
([decision 0013](../../docs/decisions/0013-the-portal-container-arrives-with-the-configuration.md)).
The pin is not a style choice: `react-aria-components` 1.21.0 depends on
`react-aria` at exactly `3.52.0`, so **a bump of one must move the other in the
same commit.** Two copies in the tree do not share the portal context, and the
symptom is a layer mounting in the wrong place with no error anywhere.

And after touching this file's dependencies, `pnpm verify:clean` — a local
`pnpm install` reuses what is already in `node_modules`, so a half-applied
change passes here and fails on CI's clean install.

## Exports

Expose the minimum. Opening a token or an export later is easy; closing one is
not. A public token is part of the API, and renaming it is a breaking change.

The exception worth knowing: **stacking order values must be public.** The
consumer has their own fixed header and side panel to coordinate with yours. If
those are closed, their only way out is to fight your CSS.

## Tests

Logic is tested without rendering. Behavior is tested from the perspective of
someone using the component. Styles are **not** tested by asserting class
names — that proves nothing about appearance and turns every refactor into a
wall of false failures. Visual regression covers appearance.

Do not test React Aria. Test what is built on top of it.
