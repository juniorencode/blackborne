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
- **A set whose pieces land in different places is DECLARED, and the
  declaration is read rather than rendered.** The tabs pattern puts every title
  in one container and every panel outside it, so a `Tab` holding both cannot
  render itself: `Tabs` reads its children and splits them. The base's own
  shape — a `Tab` for the label, a `TabPanel` for the body, matched by id —
  repeats every id twice and, measured, leaves a panel carrying
  `aria-labelledby="undefined-tab-b"` the moment the list stops being rendered,
  which is what a structural change does. Decision 0018.
  Two things come with it. The reader is a **pure function** (`readTabs`), so
  what a structure contains is testable without either structure existing. And
  it has a constraint every collection API has: a component of your own that
  returns a `Tab` is not one — the element in the tree is yours and nothing
  about it says tab. The shareable form is a value (`const tabs = <>…</>`) or an
  array from `.map()`. It caught the component's own stories first, so `Tabs`
  counts what it could not use and says so in one development warning.
  **`Breadcrumbs` is the second case** (decision 0019): a step declares a label
  and an address, because the same step has to be a link in the row or a row in
  the menu the trail folds into. The walk both of them use is
  `internal/readDeclarations`, extracted at two callers rather than four, and
  its own file says why that rule does not apply to a walk with one correct
  behaviour.
- **A menu's trigger gets `aria-expanded`, and no `data-open`.** Measured on
  `SplitButton`, whose arrow turns over while the menu is open: the open state
  belongs to the POPOVER, which is portalled somewhere else entirely, so a
  `group-data-open` variant on the trigger matches nothing and the mark simply
  never turns. `bb:group` on the trigger plus `bb:group-aria-expanded:` on the
  mark is the pair that works. `Select` is the component that misleads here —
  its root is a real element that does carry `data-open`, because a select is
  not a trigger with a portal, it is a field with one.
- **Two adjacent buttons make a 2px seam unless one is pulled back.** Both
  carry a border, so a split control needs `-ms-px` on the second half or the
  line down its middle is twice every other border in the library. And which
  corners are round is decided by the COMPILED stylesheet, not by the order of
  classes in the attribute: `rounded-e-none` beats the shorthand `rounded-md`
  because Tailwind emits it later, which is worth knowing before assuming a
  `className` passed to `Button` can override anything it likes.
- **A row of a collection that is an ANCHOR needs `no-underline`.** The package
  ships no reset, so an `<a href>` arrives carrying the browser's own
  decoration. It went unnoticed until a menu row grew an `href` — every row
  before that was a div, which never had a decoration to remove — and the
  symptom is a row with the right colour, the right box and a blue underline
  nobody drew. The same class of trap as a control not inheriting `font-size`,
  and the same lesson: with no preflight, an element the library has not styled
  before arrives with the browser's own opinion of it.
- **An observed element must also CHANGE SIZE with the container**, which is
  the half of the rule below that the range calendar added. A calendar is
  sized by its contents, so its box is `fit-content` — measured at 408px in a
  640px container and 408px in a 320px one. It outlives both structures
  perfectly, never resizes, and the `ResizeObserver` therefore never fires: the
  step is read on mount and never again. A structural component that
  shrink-wraps is two elements, a full-width frame that is observed and a
  `w-fit` body inside it. Doc 04 §11.3.
- **An observed element must outlive every structure it chooses between.** The
  step comes from `useContainerStep`, and the element it observes cannot be the
  control that changes: that control unmounts, the observer is left watching a
  detached node, a detached node reports a width of zero, zero picks the narrow
  structure, and the next control detaches in turn — a component flickering
  between two structures at one width, forever. `Tabs` observes a header box
  that holds whichever control applies. Doc 04 §11.1, and the browser check
  that proves it watches one width for half a second.
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

**A COLOUR THAT MIGHT BE TRANSPARENT NEEDS SOMETHING BEHIND IT.** A
half-transparent blue on a white surface is a paler blue, and nothing in the
picture says which — measured on `ColorPicker`'s first transparency baseline,
where the alpha slider read as a gradient from white to blue and the trigger's
swatch read as a lighter blue than the value it held.
`internal/checkerboard` is the pattern, and the important half is WHERE it
goes: the base writes the colour inline, and a `background-image` on the same
element paints OVER its background colour rather than behind it. So it is
always one element further out, with the coloured element on top — which works
precisely because the colour is transparent where the pattern needs to show.
`ColorSwatchField` took it too, since a declared palette may carry an alpha.

**A `group-*` VARIANT ONLY MATCHES A DESCENDANT, AND THIS IS THE THIRD SHAPE OF
THAT TRAP.** `SplitButton` had it with the group on the root; `DatePicker` had
it on the wrong element; `ColorPicker` put the chevron in the FRAME's trailing
slot, which is a SIBLING of the trigger that carries `aria-expanded`. The
variant matched nothing and the mark sat still — measured, `rotate` was `none`
before and after opening. The mark belongs inside the trigger, which is also
where `Select` keeps its own, and where the whole box opens the layer rather
than a mark beside it.

**A CONTROL THAT CANNOT EXPRESS THE VALUE IS NOT OFFERED.** The base's colour
FIELD speaks six digits of hex and nothing else — read in
`useColorFieldState`: it formats with `toString('hex')` and parses by building
`#RRGGBB` from a clamped integer. So a picker offering transparency would show
an opaque colour in that field and, worse, typing in it would REPORT one: the
alpha is replaced rather than preserved. `ColorPicker` drops the field when
`hasAlpha` is on, and the area, the hue and the transparency slider are all
still keyboard-operable without it.

**TWO OPEN POPOVERS IN ONE STORY CANNOT BOTH BE TOUCHED.** A popover is modal:
the base lays a full-window underlay over the page while it is open, so a story
showing two side by side — one per theme mode — has the second one's underlay
over the first one's panel. Measured:
`<div class="catalog-pair"> intercepts pointer events`. A picture of two open
layers is fine; an interaction check needs a story with one.

**AND `LayerPage` IS THE THEME SCOPE AS WELL AS THE PORTAL CONTAINER**, which
is the whole reason it exists and is easy to half-use. A `data-bb-mode` on a
panel dresses everything inside it, and a layer is portalled to the body, which
is outside — so this component's first dark baseline showed a LIGHT panel of
gradients floating over a dark card. A `minHeight` on the story is not the same
fix: it gets the layer into the picture and leaves it in the wrong theme.

**A BASE COLLECTION FORWARDS FOUR ARIA ATTRIBUTES AND DROPS THE REST.**
Measured on `ColorSwatchPicker`, which passes its props through
`filterDOMProps(props, { labelable: true })`: `aria-label`, `aria-labelledby`,
`aria-describedby` and `aria-details` arrive, and everything else is discarded
silently. `aria-invalid` was written, typed, rendered and simply not there —
TypeScript accepted it because the props extend `GlobalDOMAttributes`, and the
filter is a run-time decision the types know nothing about.

So a palette says it is invalid through its MESSAGE, referenced by
`aria-describedby`, which the filter does pass. Doc 06 §3 asks that a state not
depend on colour alone and the message is text, so the arrangement is honest
rather than a defeat — but check the filter before planning an attribute onto
anything else built on one of the base's collections.

**TWO MARKS ON ONE ELEMENT ARE TWO MECHANISMS, and doc 06 §3.1 already said
which.** `ColorSwatchField` needs to say both "this colour is chosen" and
"the keyboard is here", and nothing may be drawn INSIDE a swatch — a mark on a
colour the library has never seen is white on pale half the time, measured on a
calendar at 1.12:1. The first version drew both as an offset outline and took
the focus colour from `--bb-focus-ring`, which is the accent: **the same
colour**, so a focused swatch was indistinguishable from a chosen one.

§3.1 has the answer and it predates the component: a BOX rings with a border in
the ring colour plus a halo, and the offset outline belongs to a run of text.
Two mechanisms, so they compose — one swatch can carry both and show both. The
chosen outline is `--bb-text`, which is the calendar's rule again: a ring is
the text colour of whatever it SITS on, and this one sits on the field's
surface rather than on the swatch.

**AND `outline-hidden` KILLS AN OUTLINE YOU MEANT TO KEEP.** It sets
`outline-style: none`, so it beat the `outline-2` beside it and the chosen ring
never drew at all — the baseline showed three identical swatches on a row
labelled "Chosen". It was also unnecessary: a declared transparent outline is a
real outline with a width, a style and a colour, and an author rule beats the
browser's own `:focus-visible` ring. One declaration suppresses the default and
carries the state; two cancel.

**A PICTURE HAS TO WAIT FOR ITS IMAGES, and this is the fourth time a check
has measured the machine rather than the component.** `gotoStory` waits for a
story to mount and `toHaveScreenshot` waits for fonts; neither waits for an
`<img>`. `Avatar` is the first component in this library to render one, and its
baseline came back **225 pixels different on CI** — stable across both of
Playwright's retries, so not a flake, and reproducible locally once the
capture's timing changed.

The content was identical either way: the difference was antialiasing on the
circular borders, which is what a page rasterised at two different moments
gives. `capture()` now polls until every `<img>` in the document is `complete`
— loaded, failed, or removed by a component that swapped it out, all three of
which are settled — and it is where the uploader's thumbnails will need the
same wait.

Two smaller things came with it. **A failure in a story is a data uri that
cannot decode, not a url that 404s**: what a static server answers for an
unknown path is not this library's business, and a fallback page returning 200
makes the browser fail on the decode instead, later and by a different amount
on a different machine. And **a diff is worth opening before theorising**: the
225 pixels were assumed to be the browser's broken-image glyph, which is about
that size, and the artefact showed rings round every circle instead.

**A SLOT SIZES WHAT ARRIVES IN IT, and a slot that forgets renders nothing.**
Doc 02 §11 says an icon arrives as children and the component sizes and colours
it — `Badge` has `[&>svg]:size-4` for exactly this. `Avatar`'s fallback slot
did not, and the first baseline showed a silhouette passed in as an svg as an
EMPTY CIRCLE: an svg with a `viewBox` and no width or height has no intrinsic
size to fall back on. Sized in `em` here rather than with a token, so one rule
covers all three sizes — the type size is what changes between them, and the
glyph follows the letters it replaces.

**`w-control-*` DOES NOT EXIST, AND A SQUARE ELEMENT TAKES ITS WIDTH FROM
`aspect-square`.** The theme declares `--height-control-*` and no width
counterpart, which is right: a control's width is its contents. So a circle
sized `h-control-md w-control-md` had a height and no width, and nothing in the
source looked wrong — the third utility in this package found to compile to
nothing (`size-box` and `min-w-hit` are the other two, and the theme's own
comment records the second). Grep the compiled stylesheet; it is the only place
that answers.

**THE STATE IS WHICH URL FAILED, NOT A BOOLEAN.** An avatar whose image does
not arrive falls back to its children, and the obvious `hasFailed` flag has to
be reset when `src` changes — an effect that runs after a paint, so swapping
one person for another shows the new picture as broken for a frame, or never
tries it at all. Remembering the url that failed makes the comparison the state
itself: a new url has not failed, so it is attempted. Asserted by a rerender in
the unit tests.

**AND AN EMPTY `alt` IS NOT A USER-FACING STRING.** The project's own rule
against literal labels flagged `alt=""` on the first `<img>` this library ever
rendered. The rule now exempts an empty value, with the reason in
`eslint.rules.js`: an empty `alt` is the declaration that there is nothing to
read — the standard way to say a picture is decorative because something else
already names it. There is no dictionary key for "no text", and taking it as a
prop would let a consumer put a second copy of the name inside an element that
already carries one.

**AND AN ARIA SNAPSHOT CORRECTED A CLAIM THIS COMPONENT WAS WRITTEN WITH.**
`Avatar` puts the name on the box as `role="img"` rather than on the picture,
because initials cannot name themselves — "CR" is what the screen says and not
what the person is called. The comment claimed the rest followed: `img` is
marked "children presentational" in the ARIA specification, so the letters
inside should not be announced. `locator.ariaSnapshot()` reads
`- img "Ana Vega": AV`, with the text still in the node — so the tool does not
settle it, the check asserts only the half that is settled, and the question is
on doc 06 §5's list for a person with a screen reader. Worth knowing that the
snapshot exists at all: `page.accessibility` is gone from this version of
Playwright and this is what replaced it.

**A COMPONENT CAN BE ANOTHER ONE WITH ITS DATA GENERATED, and that is not a
lesser component.** `TimePicker` is a `Select` whose rows come from a pure
function: the trigger, the panel, the list's width, the tick, the typeahead,
the required state and the whole keyboard are already built and already
measured, and what the wrapper adds is which rows exist and what a row is
called. Columns in a layer — which the catalog predicted — would have been a
second mechanism for a job already done (doc 01 §7), with a custom trigger, a
custom keyboard between columns and a value assembled by hand.

The test it has to pass is P6's corollary: an assembly may not have a
capability its pieces lack. This one has exactly `Select`'s, and the two
places it could have failed are worth knowing. **A row's children must stay
plain text**, or the typeahead dies quietly — so the row says a formatted time
and nothing else, which also means typing follows the locale: `2` in English,
`14` in Japanese. And **the value is not the label**: the row reads `2:00 p. m.`
in `es-PE` and `14:00` in `ja-JP` for one value of `14:00`, which is decision
0020's argument arriving as a list.

**AND A COMPONENT THAT OWNS ITS OPTIONS OWNS RULE 5'S ROUTE.** Doc 07 §2.2 rule
5 sends a field that opens a layer to the chevron alone, on the grounds that
emptying has a route costing no width — "an option that returns to no value".
Every other field with a list is handed its options by a consumer, so that
route is one the library can only hope exists. A picker that GENERATES its rows
can put the row in itself, and `TimePicker` does while it is not required. It
is therefore not §2.2a's third case, which the catalog expected it to be.

**A TIME OF DAY HAS NO ZONE, so its rows format against UTC** — the same
argument the calendar's month headings use, and the same trap avoided:
formatting `14:15` through a real zone would print `09:15` for somebody in
Lima. The date handed to the formatter is arbitrary and invisible, because the
only fields asked for are the hour and the minute.

**A PHANTOM TICK WAS SITTING IN EVERY SELECT'S TRIGGER**, found by building on
it. `SelectValue` renders the selected row's own children — all of them — so
the trigger contained a copy of the row's tick glyph. The tick is
`visibility: hidden` on purpose, so a row does not move as the selection walks;
the consequence in the trigger was 16px of invisible width inside an element
that truncates, which showed the ellipsis early for no reason anybody could
see. It is `display: none` in there now, through a parent-scoped variant on the
tick itself — and no baseline moved, because the box was invisible.

**AND AN OPEN LAYER NEEDS `LayerPage` TO BE PHOTOGRAPHED AT ALL.** The visual
suite screenshots `body`, whose box does not include an absolutely positioned
child — so the first baseline of a picker with its list open came out as a
trigger and the top two rows, clipped where the body ended. `catalog/layerPage`
is also the portal container, so the layer lands inside the element being
captured. Every open-list story in this catalog already used it; a new one that
does not gets a picture that looks plausible and shows a third of the thing.

**A `dir` ATTRIBUTE IS NOT A LOCALE, and a component that uses both mechanisms
can disagree with itself.** A slider draws two things against one rail: the
fill's offset is `inset-inline-start`, which the stylesheet mirrors on its own,
and the handle's is a computed `left` percentage the base mirrors only when the
LOCALE says right-to-left. Measured on a story with `dir="rtl"` and no locale:
at 30 out of 100 the fill occupied the right 30% of the rail and the handle sat
at 30% from the LEFT — a handle at the wrong end of its own fill, with nothing
wrong in either half.

Two things to carry: an RTL story for anything whose JavaScript positions
something declares `ConfigProvider locale="ar-EG"` rather than a `dir` div, and
the check asserts that the two AGREE. "The fill starts at the right" and "the
handle is at 30%" are both true in the broken case; "the handle is at the
leading edge of the fill" is the invariant. Doc 05 §4.1.

**A DISABLED CONTROL STILL HAS TO SAY WHAT IT HOLDS.** The slider's disabled
fill was `surface-disabled`, which against the rail measures **1.08:1 in light
and 1.00:1 in dark — the same colour, exactly** — so a disabled slider showed
no value at all. Found by opening the first baseline, which is the fourth
defect that layer has caught in this family and the same one `Calendar` shipped
a false claim about.

The token is `--bb-text-disabled` (2.90:1 and 3.43:1 against the rail), chosen
for what it NAMES rather than for a number: doc 03 §5 rule 2's 3:1 floor is for
a graphical element carrying information, WCAG exempts an inactive control from
it, and the token that clears the floor comfortably — `text-muted` at 5.22:1 —
would draw a disabled fill with more contrast than the accent has when it is
live.

**`size-*` IS NOT `h-* w-*`, AND IT COMPILES TO NOTHING HERE.** Tailwind
resolves `size-*` from its own `--size-*` namespace, and this theme declares
`--height-box` and `--width-box`. So `size-box` produced no rule at all and the
slider's knob collapsed to its border, looking like a styling accident rather
than a missing utility. The theme's own comment records the same trap for
`min-w-hit`; the way to check either is to grep the COMPILED stylesheet, which
is where `.bb\:h-box` either exists or does not.

**`justify-between` PUTS A SINGLE ITEM AT THE START.** A hidden label is
`sr-only`, which is out of flow — so a row of label-and-number with the label
hidden has one item in it, and the number moved to the leading edge. Measured
at x = 0 against x = 305 on every other row of the same story. `ms-auto` on the
number is the fix, and `Progress` has the same row and took it too, before any
story of its own could find it.

**THE BASE'S SLIDER FILL TAKES THE FULL HEIGHT OF ITS CONTAINING BLOCK**, which
is why the rail is a separate element from the target. Read in its source and
confirmed: the fill's default style is
`position: absolute; inset-inline-start: X%; width: Y%; height: 100%`. The
track has to clear the minimum hit area (28px, 24px at compact), so a fill
placed directly in it would be 28px tall. A rail inside the target, with the
fill inside the rail, gives an 8px bar — `Progress`'s own thickness — in a
target nobody has to aim at.

And the thumb needs `top-1/2` FROM US: the base sets `left` and
`transform: translate(-50%, -50%)` and no vertical position at all, so without
it the transform pulls the handle half its height above the rail. The base's
own documented CSS does the same thing, which is how it was found.

**AND ITS HANDLE OVERHANGS THE COMPONENT'S BOX BY HALF THE TARGET.** 14px at
the maximum, measured and pinned by a check rather than fixed: the handle's
CENTRE marks the value, which is what a slider means. Insetting the rail by
14px at each end would keep everything inside the box and cost 9% of a 320px
panel, and stop the rail lining up with a `Progress` bar above it. What it
means for a consumer is that a slider inside a box with `overflow: hidden` and
no padding loses half its handle at the extremes.

**AND `internal/mergeRefs` ALREADY EXISTED, TWICE OVER.** `RangeCalendar` and
`Steps` each wrote their own two-ref merger while forwarding a ref to an
element they also observe — the same eleven lines, three callers away from the
shared one that four other components import. Found while looking for something
else, which is how the cross reached four copies with four geometries. Check
`internal` before writing a helper: it is a short directory and reading it
takes less time than writing the function.

**A SET'S CONTEXT CROSSES A PORTAL, so every layer that can hold a member
closes it.** `ButtonGroup` sends its size and variant down a context, which is
doc 02 §3.1.1's rule for a variant belonging to the set — and a React context
does not stop at a portal. Measured with a probe in a popover's footer: it read
`primary/sm` inside a row of small primary buttons, so a person opening that
layer would have seen a footer of small primary buttons in a dialog.
`internal/buttonAppearance` exports `NoButtonSet`, and four of the five layers
close the set at ONE call site because they share `ModalSheet`; `Preview` says
it itself, being the one layer that cannot use the sheet (doc 08 §4).

The part worth carrying forward is why this arrives now. The exposure is not
the context, it is **what the members are**: a radio inside a dialog inside a
radio group is not a thing anybody writes, and a button inside a dialog inside
a row of buttons is ordinary. So the rule belongs to any set whose member type
also appears inside layers — today buttons, tomorrow whatever the table suite
puts in a row.

**And a set with two things to send is two contexts, each carrying a
primitive.** That is the same section's last constraint, and it was tempting to
break it: one object with `{ variant, size }` is one provider instead of two.
It also needs memoising and puts an identity in the tree for somebody to reason
about, which is exactly what the constraint is for. `RadioGroup` set the shape
with one primitive; this is the same shape twice.

**A COLOUR RECIPE USED TWICE IS A VARIABLE, NOT A CLASS WRITTEN TWICE.** Two
adjacent buttons both carry a border, so joining them means pulling the second
back a pixel and letting one border do the work of two — enough for
`secondary`, whose border differs from its fill, and not enough for a variant
whose border IS its fill. A row of primary buttons pulled together is one
accent blob. `SplitButton` has drawn a divider for that since it shipped, and
`ButtonGroup` needs the same line on an unknown number of children from a
stylesheet, so the two declarations are different and the colour is the same.
`internal/seam` publishes `--bb-seam` on whichever root declares the set and
both read it; Tailwind cannot see a class name built at run time, which is why
that file is a map of literal strings rather than a function. Extracting it
changed no pixels: all seven of `SplitButton`'s baselines came out identical.

Two details in it are measured. `secondary` publishes the ORDINARY border
colour rather than nothing, so every caller reads the variable unconditionally
— an invalid `var()` in `border-inline-start-color` computes to `currentColor`,
so a missing variable would put the label's colour down the middle of the row
and look deliberate. And a `color-mix` reports back in the mixing space:
`oklab(0.999994 0.0000455678 0.0000200868 / 0.25)`, which is why the browser
check compares the three colours to each other instead of parsing any of them.

**A FOCUS RING NEEDS SOMEWHERE TO BE ON TOP.** The ring is a 1px border plus a
4px halo drawn as a box-shadow, and in a joined row the buttons overlap by a
pixel. Every `Button` is already `position: relative` — the pending spinner
needs somewhere to centre — so with no z-index the later sibling paints over
the halo and the ring of anything but the last button is cut in half down its
trailing edge. Nothing in the DOM is wrong when that happens, a box-shadow is
not hit-tested, and no computed value says who painted over whom: the check
asserts `z-index: 1` on the focused child and the BASELINE is what shows the
ring. Focus only — raising on hover as well would shift the seam by a pixel
whenever a pointer crossed the row.

**A position is a fact about the LIST, so CSS counts it.** `Steps` numbers its
steps with a counter rather than a prop or an index: a `number` prop lets a
consumer write 1, 2, 2, 4 and a component cannot help them, and an index
computed in JavaScript means reading the children — which `Tabs` and
`Breadcrumbs` do only because their pieces land in different places (decision
0018), and which brings that constraint with it. CSS re-evaluates on its own, so
a step rendered conditionally still numbers 1, 2, 3. `Breadcrumbs` chose CSS
over counting for the same reason.

**And `sr-only` is not `display: none`, which is the whole difference in a
narrow structure.** `Steps` hides its titles below the `medium` step, and the
first version used `display: none` — which takes them out of the accessibility
tree and leaves a list of four items with no names at 320px. The rule that looks
like it forbids the alternative is doc 06 §4 rule 5, and it does not apply:
nothing in `Steps` is focusable, so there is no control to reach. Doc 04 rule 4
is the one that does — what the component knows must survive the structure
changing.

**A hidden label is still a label, and it has to be the BASE's.** Anything
outside `Field` that offers `isLabelHidden` has to render the base's own
`Label` and hide it with `bb:sr-only`, never leave it out: the base publishes a
label context that `Label` consumes to take an id, and the control points
`aria-labelledby` at that id. A plain `<span>` is wired to nothing, so hiding it
leaves the control with no accessible name at all — which `Progress` shipped in
its first draft and which only a query BY NAME catches, since `getByRole` passes
either way.

**And `empty:hidden` cannot hide a row that holds an `sr-only` child.** The
child is still a child, so `:empty` never matches; what has to go is the GAP
above the thing below it. `Progress` collapses its own `gap` when both the label
and the number are hidden, which is the difference between a bar that sits
against what it belongs to and one that floats a few pixels under it.

**A runtime percentage is the one inline style in this library.** Tailwind
generates the classes it can see, and a width that arrives as a number at run
time is not one of them. Doc 03's rule is about colour and spacing coming from
tokens; a fraction of a measured width is neither, and `Progress`'s fill is the
only place it appears.

**A DROP BUILT IN THE PAGE DELIVERS NO FILE**, which is the check for a file
field passing while proving nothing. `new DataTransfer()` with a `File` added
to it looks perfect from JavaScript — `types: ['Files']`, `files.length: 1`,
`items[0].kind: 'file'` — and `webkitGetAsEntry()` answers **null**, because
Chromium gives a filesystem entry only to an item that came from a real drag.
The base reads a drop with `readFromDataTransfer`, which calls that method
wherever it exists and skips the item when it is null: every drag event fires,
`data-drop-target` appears, `onDrop` runs, and the list is empty. The real drag
is `Input.dispatchDragEvent` over a DevTools session with paths on disk, and
`file-upload.spec.ts` has it with the measurement
([doc 10](../../docs/foundations/10-quality-and-verification.md) §11.1).

**AND `filterDOMProps` WITH `global: true` PASSES FEWER ARIA ATTRIBUTES THAN
WITH `labelable: true`.** Read in the function: the labelable set is
`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`, and
`global` covers `dir`, `lang`, `hidden`, `inert`, `translate` plus the pointer
and animation events — two disjoint sets, and the option that sounds more
permissive is the one that drops a description. The base's `DropZone` passes
`{ global: true }` and then `delete DOMProps.id`, so an `aria-describedby`
handed to it never reaches the DOM at all. `FileUpload` hangs its description
off the "Choose files" button, which is ours and is where a keyboard lands
anyway. Same function as `ColorSwatchField`'s trap, opposite subset: check
which options object a base component uses before planning an attribute onto
it.

**A DROP ZONE'S NAME IS THE BASE'S WORD PLUS OURS.** Its labelling goes on a
visually hidden button INSIDE the zone rather than on the element — the zone's
own div carries no aria attributes at all — as `aria-label="DropZone"` plus an
`aria-labelledby` referencing itself and then whatever we passed. Measured:
"DropZone Attachments", the same shape as `ComboBox`'s "Show suggestions
Doctor", and left alone for the same reason. That hidden button is also **why a
drop target passes this library's entry gate**: dragging cannot be done from a
keyboard and never will be, so the base wires the clipboard to it and a person
tabs in and pastes. It is the first stop in the field, ahead of the button that
opens the dialog.

**And a disabled drop zone has no handlers at all**, which is stronger than
looking switched off. `useDrop` returns `{ dropProps: {} }` before it returns
anything else, so the zone cannot light up and cannot receive a file — a target
that highlighted and then refused the drop would be worse than one that never
responded.

## Fields

The unit of composition is **label + control + description + error**, always
together and always related to each other — that relation is what makes an
error perceivable to someone who cannot see it.

The core of every field is **controlled**: a value and a change callback,
working with no form library present. Adapters for form libraries live behind a
separate entry point and are optional.

The library restricts input and presents errors. It does not decide whether a
value is valid, and it does not write the message.

**A FIELD'S PROPS ARE A `Pick`, NOT AN `Omit`** — and the ten that are an
`Omit` are why `validate` shipped in this library's public API without anybody
choosing it. An `Omit` is a blacklist: it publishes everything the base has
except what is named, so the surface grows whenever the base does. A `Pick` is
a whitelist, which is hard rule 8 in the type system: props are earned.

Measured while removing it — `validate` reached exactly the ten `Omit`-shaped
fields (`TextField`, `TextArea`, `NumberField`, `SearchField`,
`PasswordField`, `TagsInput`, `Checkbox`, `CheckboxGroup`, `RadioGroup`,
`Select`) and none of the components built from `Calendar` onward, which all
use `Pick`. `internal/validationProps` names the pair it refuses,
`validate` and `validationBehavior`, with the reason; converting the ten to
`Pick` is a row in the catalog's §7 rather than something to do in passing.

The second one is the expensive half and the reason this is not pedantry:
`validationBehavior: 'native'` hands the whole presentation of an error to the
BROWSER — its bubble, its wording, its language — where doc 05 says every
string a person reads comes from the dictionary. A prop nobody chose was
offering a second way for an error to reach a person.

**A BUTTON INSIDE A COLLECTION ROW IS UNREACHABLE, and it renames the row.**
Measured on a `ListBox` row in a combo box's popover, which is where the
question keeps arising — a list whose load failed wants a "Retry":

- The row is announced as `option "A row with a button Retry"`. The button's
  label is glued into the option's own name.
- `Tab` from the input CLOSES the list and lands on `body`. There is no
  keyboard route in.
- The arrows move `aria-activedescendant` only. Focus never leaves the input,
  so the button is never focused.
- A pointer does press it, and the press closes the list on the way. A control
  only a pointer can reach is doc 06 §4 rule 5.

The base's `renderEmptyState` is wrapped in a `role=option` too, so the
"nothing found" row is no different. `FileUpload` ships a per-row retry for
exactly the reason this cannot: its rows are a plain `<ul>` where nothing is
chosen, so a button in one is just a button. **The test is whether the list is
a COLLECTION**, not whether it is a list.

**Not every field publishes a group context, so a frame may have to be TOLD.**
`ControlFrame` reads `isInvalid` and `isDisabled` from the base's group context,
which a `TextField` publishes and a **`Select` does not** — measured. Passed
implicitly it silently does nothing, and the box looks ordinary while the field
is invalid or switched off. Check it on any new composed field: the frame is the
element a person sees the edge of, and it has to carry the state the field is
in.

**TWO CONTROLS AT ONE EDGE, once, and only for the date family.** Doc 07
§2.2a is the exception and it carries four conditions, all four of them browser
checks rather than intentions: both targets clear the minimum hit area at every
density (measured: 28 against a floor of 28, and 24 against 24 at compact), the
cross is unreachable rather than absent when it has nothing to offer, the
chevron never yields to it, and the clearing is REPORTED.

That last one is the whole justification. Measured on the base's segments, in
jsdom and then in a browser: clearing the month and the day leaves the reported
value at the last complete date, and the year segment does not clear at all. So
emptying a date field is otherwise unobservable — a person blanks what they see
and neither the field nor the project knows. Rule 5's premise is that clearing
has a route costing no width, and a date has none of them.

**And the cross needs `slot={null}`.** A `DatePicker` publishes an unslotted
`ButtonContext` carrying the toggle's own props, so without it the cross wears
the toggle's id, name and press handler — and pressing it opens the calendar
instead of emptying the field. Which leaves the toggle as the only button in
the row that names no slot, so it is the one the context reaches: an
arrangement that works because there are exactly two.

**A field's frame may not be a group when its control already is one.** The box
every field draws is the base's `Group`, and the base's `DateInput` renders a
group of its own so the row of spin buttons has a name to belong to — two
nested groups with one name, which a reader says twice. `ControlFrame` takes a
`role` and the date fields pass `presentation`.

**The trailing edge holds one thing, and a field that opens a layer holds the
chevron.** Seven things want that edge and doc 07 §2.2 orders them; the rule
that arrives with the searchable fields is the last one. A `ComboBox`, a
picker, anything with a list behind it keeps its chevron and offers **no clear
button** — a keyboard opens the list with `ArrowDown` and a pointer has nothing
else, while emptying has routes that cost no width: an option that returns to
no value, and the remove button each value carries in a field holding several.
Do not reach for the usual trick of swapping the chevron for a cross on hover:
something that appears only on hover is not there for touch and never there for
a keyboard.

**ONE CONTEXT PER COLLECTION, and two components inside one field will fight
over it.** Measured twice on `ComboBox`, and this is the trap to know before
composing anything inside a field that has a collection of its own:

- **A `TagGroup` inside a `ComboBox` does not work.** The combo box publishes
  its own `ListStateContext` for its options, and `useTag` reads that context
  to find its collection — so a chip inside one resolves the wrong collection.
  With a dynamic `items` list it exhausts the heap; with static children it
  throws from `useGridListItem`. The chips are spans instead (decision 0022).
- **And a `Button` inside a `ComboBox` takes the toggle's props.** The combo
  box publishes one `ButtonContext`, so every `Button` in the subtree wears the
  toggle's id, name and ref — three buttons on one field, and the toggle's own
  name ruined by the last chip's. `slot={null}` means "take no context at all",
  which is read in the base's `useSlottedContext` and is the fix.

The general shape: when a base component publishes a context for its own
child, every descendant of that type consumes it. Check what a field publishes
before putting another of the base's collections inside it.

**A collection is built in a render pass you cannot see from.** Measured on
`ComboBox`: the base renders a list's children again, on its own, to build the
collection — and that pass is detached from the surrounding context, so a
component reading a state context inside it gets `null`. The symptom is a
filter that computes the right answer and a list that ignores it. Anything that
has to know what the collection is being asked for cannot ask from inside it;
`ComboBox` hands the base a filter instead of filtering the rows
(decision 0021), and the table suite will meet the same wall.

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

**A field that loads its options needs `IntersectionObserver` in a test.**
The base's load-more sentinel watches for itself coming into view, and jsdom
has none — measured, the render throws `IntersectionObserver is not defined`.
So a unit test that renders a `ComboBox` with a `source` has to stub it (there
is one in `ComboBox.test.tsx` to copy), and whether SCROLLING actually loads
the next page is a question only a browser can be asked.

Two more things about that sentinel, both measured and neither obvious. It
triggers when it comes within ONE list-height of the fold — `scrollOffset`
defaults to 100% — so **a list fills itself page by page while there is room**,
with nobody scrolling; a check that waits for a scroll to prove paging proves
nothing. And `loadMore` past the last page calls nothing at all, because a page
with no cursor is how the loader declares the end.

**A locale-sensitive search is the base's collator, not `includes`.** `useFilter({ sensitivity: 'base' })` is what the base's own combo box builds —
read in its source — and it is what "jose" finding "José" rests on. A filter of
ours passes that same `contains` in rather than writing one, so a consumer who
declares no keywords gets exactly the behaviour the base would have given them.

**Two calendars share one internal, and the shared half is where the traps
are.** `internal/Calendar` holds the classes, the month grid, the furniture
above it and the two chained views; `Calendar` and `RangeCalendar` are the
value, the paint on a selection and how many months. Three things about it are
measured rather than tidy.

- **The shared furniture reads EITHER state.** A `Calendar` publishes
  `CalendarStateContext` and a `RangeCalendar` publishes
  `RangeCalendarStateContext` and not the other one, so a header reading only
  the first renders no title and two dead arrows inside a range. `??` between
  them, which is exactly what the base's own `CalendarGrid`, `CalendarHeading`
  and the two period pickers do.
- **`data-selected` does not mean the same thing in both.** In a single
  calendar it is the solid accent fill; in a range it is every day of the band,
  with the two ends carrying `data-selection-start`/`-end` on top. So anything
  keyed on it belongs to the component rather than to the shared class —
  today's ring is drawn white on the accent and dark on the band, and a shared
  rule painted it white on both at 1.12:1.
- **An end is only an end while it is also selected.** The base marks
  `data-selection-start` on the copy of a day in the neighbouring month and on
  a disabled calendar, both times WITHOUT `data-selected` — so a fill keyed on
  the end mark alone painted a second start pill in the next grid, and turned a
  disabled range into two disconnected days. Stack both variants.

**A ring that carries information is not a border.** Today's ring measured
1.86:1 against the light surface in `--bb-border-strong` and 3.01:1 against the
dark one — a hard rule broken on one side and scraped on the other (doc 03 §5
rule 2 asks 3:1 of a graphical element), and it is the only thing marking
today. The rule that came out of it is the one the selected case already
followed: **the ring is the text colour of whatever it sits on** —
`--bb-text-muted` on the surface, the accent pair's own text colour inside a
chosen day. Two things generalise: a ring is measured against what it SITS on
rather than against the page, and nothing automated will catch any of it,
because axe checks the contrast of text and a box shadow is not text.

**Today is the provider's day, and the base's `data-today` is not it.** Every
calendar cell carries that attribute, computed from the value's zone when the
value has one and from the BROWSER's otherwise — read in `useCalendarState`.
Doc 05 §3.1 says the browser's zone belongs to the machine of whoever is
looking, so a calendar marks today from the configured zone, and with none it
marks nothing and says so in development (decision 0023). Two zones are in
play and they answer different questions: which day it is TODAY needs the real
one, and formatting a month's name needs none at all — a day has no zone, so
the headings format against UTC.

**A RANGE picker's two halves take NAMED SLOTS**, and this is the shared-button
rule arriving on a second kind of element. The base publishes a slotted field
context — measured: `{ slots: { start: startFieldProps, end: endFieldProps } }`
— so the shared segment row has to say which half it is. Without that both rows
take the same props and a range is one date typed twice.

**And it is the one component allowed to ask the window a question.** Doc 04 §5
reserves the viewport exception for what renders in a portal, and a range
calendar inside a popover cannot read a container at all: inline-size
containment computes a width as though the element had no contents, so the
query collapses inside a content-sized layer. The count is a PROP of the base's
state rather than a paint, so CSS cannot answer it either — and
`visibleDuration` has to be passed explicitly, because the picker's
`calendarProps` carry the value, the limits and the unavailable days and
nothing about how many months are visible. `internal/useWindowFits` is the one
door; the lint rule names `matchMedia` so reaching past it is an error.

**A picker holds the calendar's BODY, not the public `Calendar`.** The base
names the DIALOG round the layer, with an `aria-labelledby` pointing at the
toggle and the field's label — measured, its `calendarProps` carry no
`aria-label` at all — so a public `Calendar` inside one would say the field's
name a second time. `internal/Calendar`'s `SingleBody` is everything inside an
`AriaCalendar` and nothing about the element, which is what lets the picker own
the element and the label. Given no label the base names the grid by its month,
which is better than silence and different from the dialog's name.

**A twelve-hour locale renders invisible segments.** The base wraps the clock
in bidi ISOLATE marks (U+2066 and U+2069) and renders them as zero-width
`literal` segments, so the FIRST child of a time field's row cannot be clicked
and its colour is the punctuation's rather than the value's. Two browser checks
were written against it before that was measured — one timed out and one found
read-only and disabled identical. Select segments with
`:not([data-type=literal])`.

**A time is `14:30`, and the reason is a measurement.** `en-US` and `es-PE`
BOTH show a twelve-hour clock, and they disagree about how to write the
marker: `PM` against `p. m.`, spacing and full stops included. `ja-JP` shows
twenty-four hours and has no marker at all. Two locales agreeing on the clock
and disagreeing on the writing is why a formatted time may not be the value —
and `formatClock` trims the seconds when there are none, so a field asked for
minutes does not report precision it never offered.

**A date crosses the public boundary as an ISO string**, not as one of the
base's calendar objects — `2026-09-09`, `14:30`,
`2026-09-09T14:30:00-05:00[America/Lima]` — and is parsed inside with
`parseDate`, `parseTime` or `parseAbsolute` against the zone the provider gave
(decision 0020). The same narrowing `Select` does to `Key`, for the same
reason. A JavaScript `Date` is not the alternative: it is a timestamp, so
`new Date('2026-09-09')` is the 8th of September in Lima and the 9th in Tokyo,
which is the bug the rule above exists to prevent arriving through the value
instead of the formatter.

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

Three, all **pinned exactly, with no caret**, and they move together:
`react-aria-components`, `react-aria` and `@internationalized/date`.

`react-aria` is there for one thing — `UNSAFE_PortalProvider`, which
`react-aria-components` does not re-export
([decision 0013](../../docs/decisions/0013-the-portal-container-arrives-with-the-configuration.md)).
The pin is not a style choice: `react-aria-components` 1.21.0 depends on
`react-aria` at exactly `3.52.0`, so **a bump of one must move the other in the
same commit.** Two copies in the tree do not share the portal context, and the
symptom is a layer mounting in the wrong place with no error anywhere.

`@internationalized/date` arrived with `Calendar`, for the same shape of
reason. Dates cross this library's boundary as ISO strings
([decision 0020](../../docs/decisions/0020-a-date-crosses-the-boundary-as-a-string.md)),
so something has to parse them into the objects the base's calendar
understands, and `react-aria-components` re-exports none of that. It was
already in the tree as the base's own dependency, so declaring it adds no
weight for a consumer — what it adds is a version we control rather than one we
inherit, which is what the pin is for.

**It is also no longer restricted by the project's own lint rule**, and that
change is in `eslint.rules.js` with its reason: the rule forbids reaching past
the base's public entry point, and a declared dependency is not reaching past
anything. The `@react-aria/*` and `@react-stately/*` packages still are.

And after touching this file's dependencies, `pnpm verify:clean` — a local
`pnpm install` reuses what is already in `node_modules`, so a half-applied
change passes here and fails on CI's clean install.

## The published package, and the two ways it was broken

Nothing in this repository consumed the built package until 2026-09-11. The
catalog depends on it and imports exactly one thing from it, a stylesheet;
every other layer — the unit tests, the browser checks, the accessibility
checks, the baselines — reads the SOURCE. Doc 10 §3 named a `Package` layer
from the start and it was the one row of that table with nothing behind it.
`pnpm verify` runs it now, and it found both of these within a minute.

**A stylesheet reaches a consumer through `src/styles/index.css` and no other
way.** The Tailwind CLI compiles that file and nothing else: `@source` scans
`.ts` and `.tsx` for class NAMES and follows no import. A JavaScript
`import './X.css'` compiles too, and that is the trap — Vite's library build
extracts the rules into a file beside the bundle and strips the import from
`index.js`, so they are compiled, published, named by no `exports` condition
and imported by nothing. Three stylesheets went that way, and `ButtonGroup`,
`Steps`, `ColorPicker` and `ColorSwatchField` would have been published with no
CSS at all. Lint refuses the import; `src/styles/stylesheet.test.ts` asserts the
list is complete. Both are verified in both directions.

**A published `.d.ts` may not contain a relative import.** `tsc` keeps every
specifier as the source wrote it, and this package compiles with
`moduleResolution: bundler`, where `from './components/Button'` is legal — so
`dist/index.d.ts` re-exported 110 extensionless paths that ECMAScript
resolution cannot follow. The failure DEGRADES rather than erroring: with
`skipLibCheck: true`, a consumer on `nodenext` got `ButtonProps` as `any` and a
bogus prop passed silently. The package ships one rolled-up declaration file
now ([decision 0025](../../docs/decisions/0025-the-package-ships-one-declaration-file.md)),
verified by comparing the surface across the change — 191 exported names
before, 191 after.

The shape both share is worth more than either: **the catalog renders from
source, so it cannot see a defect in the artefact.** A claim about what a
consumer receives has to be measured against `dist`.

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
