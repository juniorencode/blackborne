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

## Fields

The unit of composition is **label + control + description + error**, always
together and always related to each other — that relation is what makes an
error perceivable to someone who cannot see it.

The core of every field is **controlled**: a value and a change callback,
working with no form library present. Adapters for form libraries live behind a
separate entry point and are optional.

The library restricts input and presents errors. It does not decide whether a
value is valid, and it does not write the message.

## Text and formatting

Every user-facing string comes from the dictionary, with English always present
as the fallback. A missing key returns English and warns in development — never
an empty string, which is a silent failure that blanks half an interface with
no error in the console.

Dates, numbers, currency, sorting and plurals are formatted through the
platform's locale APIs. The time zone is **received, never taken from the
browser** — the browser's zone is the viewer's machine, not the data's context.

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
