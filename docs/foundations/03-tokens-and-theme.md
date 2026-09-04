# 03 · Tokens and theme

> Defines the library's visual vocabulary: how values are named, how they are
> grouped, and how a project overrides them.
> Every component hangs off this document. A token named badly today is dragged
> along for years.

**Status:** adopted · **Date:** 2026-09-02
**Still open:** the concrete semantic mapping (which step fills which role) and
the list of families published as themes. Both are settled during the tuning
pass, with the first component on screen.
**Depends on:** [01 · Principles](./01-principles.md), in particular P3 (zero
global state) and P4 (the container decides).

---

## 1. The three layers

| Layer              | What it is                                                                        | Who uses it                                  |
| ------------------ | --------------------------------------------------------------------------------- | -------------------------------------------- |
| **1 · Primitives** | The raw palette: numeric scales of greys, brand and state. Values with no meaning | Layer 2 only. **No component, ever**         |
| **2 · Semantic**   | The role: _what this color or measurement is for_, not _what value it has_        | Every component. It is their only vocabulary |
| **3 · Component**  | Local exceptions, when layer 2 does not reach. Always derived from layer 2        | A single component                           |

**The rule the whole document rests on:** a component that references a
primitive or writes a literal color is a defect, not a style preference. It is
watched by lint.

The reason is direct. If components use primitives, changing theme means
touching components. If they use semantic tokens, changing theme means changing
a handful of variables.

### 1.1 Where primitives come from: scales by role

**Decision: primitives come from a system of scales where every step has a
defined role** (of the kind Radix Colors provides), not from a palette ordered
only by lightness.

**The problem this avoids.** In an ordinary palette, steps are numbered by
lightness and nothing else. That means the same step does not do the same job
across colors: step 500 of a blue is perfectly legible on white, and step 500
of a yellow is not. If the brand theme is configurable and you apply the same
step to every family, **some of your themes fail contrast and nobody finds
out**.

The practical consequence is a different mapping per family: with seventeen
families and two modes, thirty-four mappings to maintain and verify. That is
not sustainable and it breaks on its own.

**What a role-based system solves:**

|                           |                                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One semantic mapping**  | The step that is "solid color" is that in every family, with equivalent contrast. Decided once, not once per family                                                    |
| **Light and dark paired** | Every scale has its dark counterpart with the same numbers and the same roles: the semantic mapping is **identical in both modes**. Only which scale is active changes |
| **Useful extras**         | Translucent versions of each scale — which handle states over variable backgrounds well — and tinted greys that harmonise with each accent                             |

**The roles, written down.** These are what "every step has a defined role"
actually means, and they are the same in both modes:

| Step  | Role                                      |
| ----- | ----------------------------------------- |
| 1–2   | Page and subtle backgrounds               |
| **3** | **The resting background of a component** |
| 4     | Hovered                                   |
| 5     | Pressed or selected                       |
| 6     | Subtle border                             |
| 7     | Normal border                             |
| 8     | Strong border, focus ring                 |
| 9     | Solid                                     |
| 10    | Solid, hovered                            |
| 11    | Low-contrast text                         |
| 12    | High-contrast text                        |

Worth reading once rather than guessing: mapping a control's background to
step 1 — a _page_ step — produces a button that in dark mode comes out darker
than the panel it sits on and reads as a hole punched in it. The scale has
step 3 for exactly this, which is why `surface-control` exists in §4.

**How it is consumed.** As a **development dependency**, never a production
one. The values are baked into the compiled CSS and the variables; whoever
installs the library does not know it exists and it does not appear in their
dependency tree.

**What remains our own work**, and is worth not forgetting:

1. **Text on the solid color.** This is the one real exception: depending on
   the family, the text on top of the solid step is light or dark. Light colors
   — yellows, ambers, limes and the like — need dark text. It is a short,
   documented list, but it has to be declared per family.
2. **The collision between theme and state.** If the brand theme is red, the
   accent and the danger color look alike. No palette solves this: it is solved
   by giving the state an additional signal — an icon, a shape, a subtle
   background — which the rule "never color as the only channel" already
   requires.
3. **How many themes ship.** Offering every family means verifying every
   family. A verified subset ships, and how to build your own is documented.

## 2. Named by role, never by color

| Wrong             | Right              | Why                                         |
| ----------------- | ------------------ | ------------------------------------------- |
| `--secondary-300` | `--border`         | 300 stops meaning anything in dark mode     |
| `--blue-600`      | `--accent`         | If the brand turns green, the name lies     |
| `--gray-50`       | `--surface-sunken` | Says where it is used, not what shade it is |
| `--red-500`       | `--danger`         | The meaning survives a redesign             |

If you have to open the palette to know whether a token is the right one, the
name is wrong.

## 3. The three theme axes

Independent, combinable and nestable. All three are implemented **the same
way**: by redefining variables on a container. None is implemented with
per-component special classes.

| Axis                           | What it redefines                                                | What it does not touch                          |
| ------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------- |
| **Mode** (light / dark)        | The semantic colors                                              | Spacing, typography, radii                      |
| **Brand color**                | The layer-1 brand scale; the semantic tokens derive on their own | Greys, states, spacing                          |
| **Density** (normal / compact) | The spacing scale, control heights and row heights               | **No color.** And not the base text size either |

Nestable means: the application in light mode at normal density, and one
particular table at compact density. No tricks — you open a container with the
variables redefined.

### 3.1 The scope rule, and why it is not optional

Redefining the variables on a container is only half of it. The other half is
easy to miss and makes the axes silently do nothing.

**A CSS `var()` is substituted at the element that DECLARES it, not at the
element that uses it.** If the semantic mapping is declared only on the root,
it resolves once against the light primitives and freezes. Swapping a primitive
further down the tree changes nothing, because the semantic token was already
resolved.

So the semantic mapping is **re-declared on every theme scope**:

```css
:root,
[data-bb-mode],
[data-bb-theme] {
  /* the whole semantic mapping */
}
```

Inside such an element the `var()` resolves again, against whatever primitives
that element carries. It is still **one mapping, written once** — the promise in
§1.1 survives; it just has to be attached to more than one selector.

Two consequences for the consumer, and they belong in the getting-started
guide because the failure is invisible:

- Overriding a **semantic** token works anywhere. It holds a value, so plain
  inheritance delivers it.
- Overriding a **primitive** — the brand scale, level 1 of §7 — requires
  `data-bb-theme` on the same element. Without it the override does nothing at
  all, with no error.

This was found with the first component on screen, by a brand override that
appeared to be ignored. It is written here so nobody rediscovers it.

## 4. Catalog of semantic tokens

The closed inventory. Adding a new one requires checking that no equivalent
already exists — three near-identical greys is how entropy begins.

**Surfaces**
`surface` (panel or card base) · `surface-control` **+ `surface-control-on`**
(the resting background of a control) · `surface-raised` (raised: menu, popover,
dialog) · `surface-sunken` (sunken: table header, background zones) ·
`surface-overlay` (the scrim behind a dialog) · `surface-hover` ·
`surface-active` · `surface-selected` · `surface-disabled`

**Content** — three levels, no more:
`text` (primary) · `text-muted` (secondary) · `text-disabled` · `link`

**Borders**
`border` (**the one used almost always**) · `border-strong` (emphasis,
exceptional) · `border-focus`

**Brand**
`accent` **+ `accent-on`** · `accent-hover` · `accent-active` ·
`accent-subtle` **+ `accent-subtle-on`** · `accent-subtle-hover` ·
`accent-subtle-active`

**States** — all four with the same structure, so they are interchangeable:
`danger` **+ `danger-on`** · `danger-subtle` **+ `danger-subtle-on`** · the
same for `warning`, `success` and `info`

### 4.0 The rule of pairs

**Every background color declares the text color that goes on it, and they are
always used together.** A background never exists without its pair, and a
background from one pair is never combined with the text from another.

This solves by construction the problem left open in 1.1: when the brand theme
is a light color — yellow, lime, amber — the text on top has to be dark. With
pairs, that decision lives in the theme and does not depend on anyone
remembering it in the component.

Practical consequence: **there is no standalone "text on accent" token.** There
is a pair.

**Focus**
`focus-ring` · `focus-ring-offset` — **one single ring for the whole
library**. This is what makes it read as a system rather than a collection.

**Spacing** _(moved by density)_
Scale `space-1` … `space-8` · `control-height-sm|md|lg` · `control-padding-x` ·
`row-height` · `field-gap`

**Typography**
`font-sans` · `font-mono` · sizes `text-xs` … `text-xl` · line heights ·
weights.
The base size does **not** depend on density: compact trims air, not
legibility.

**Shape and elevation**
`radius-sm|md|lg|full` · `shadow-sm|md|lg` (with their own values in dark mode,
not the same ones dimmed)

**Motion**
`duration-fast|normal` · easing curves. All of it must be cancelled when the
system asks for reduced motion.

### 4.1 Typography: the library imposes no font

**Decision: font tokens inherit from the project, with the system stack as the
fallback.** The library neither distributes nor imposes any typeface.

Reasons, in order of weight:

1. **RTL.** If a Latin font is imposed, the library breaks in Arabic.
   Inheriting is the only choice coherent with supporting RTL from day one.
2. The consumer is going to apply their brand: imposing a font guarantees their
   first line of configuration is removing it.
3. Zero network requests: no delay and no flash of unstyled text.
4. No licences to manage and no files to distribute.

The typography of the **documentation site** is a different matter: it is
identity, and it does get chosen. It has no bearing on this decision.

### 4.2 Tabular figures

Every number read in a column — numeric table cells, numeric fields, amounts,
quantities — uses **tabular figures**, so digits take the same width and
columns line up.

**Never in running text**, where proportional figures read better.

It is independent of whatever font the consumer uses, and it is one of the
details that most distinguishes a careful table from a careless one.

### 4.3 Starting values

These are tuned with the first component on screen, but the **structure** is
not negotiable: few values, used with discipline.

**Control heights** — three sizes across two densities:

| Size                 | Normal | Compact |
| -------------------- | ------ | ------- |
| Small                | 32     | 28      |
| **Medium (default)** | **40** | **32**  |
| Large                | 48     | 40      |

The minimum hit area is respected in all of them, with transparent padding if
necessary: a control may look shorter than its active zone measures.

**Radii** — three, plus the circle:

|               | Value | For                      |
| ------------- | ----- | ------------------------ |
| `radius-sm`   | 4     | Tags and small controls  |
| `radius-md`   | 6     | Buttons, fields, selects |
| `radius-lg`   | 8     | Cards and panels         |
| `radius-full` | —     | Avatars and indicators   |

**Interface text**: a base of 14, with 12 for secondary content. A short
scale — less hierarchy than seems necessary.

**The nested radius rule.** When a rounded element sits inside another, the
inner radius is **the outer one minus the gap between them**. With the same
radius on both, the curves are not concentric and the whole thing looks wrong
without anyone knowing why.

**Why this section exists.** The usual problem is not that values are too large
or too small: it is that they bear no relation to each other. Eight control
heights and six radii circulating through a library are not a design decision,
they are the absence of one — and the symptom is that nothing aligns and
everything looks slightly off without anyone being able to say where.

### 4.4 How they are applied: restrict where things got out of hand

**Principle: the system is not held together by discipline, it is held together
by making the wrong thing impossible to express.** If there is no way to write
a height outside the scale, nobody will write one — not because they remember
the rule, but because they cannot.

**Three layers, in this order:**

1. **Tokens** — the vocabulary (previous sections)
2. **Utilities generated from those tokens**, with the default scale trimmed
   where needed. Components still write ordinary utilities; what changes is
   that only the system's exist
3. **A variant map per component** that translates props to classes, in one
   place and typed. No class conditionals scattered through the file

**What is restricted and what is not.** This table is the delicate part:

| Restricted               | Left free                               |
| ------------------------ | --------------------------------------- |
| Control heights          | General spacing: padding, margins, gaps |
| Radii                    | Layout widths and heights               |
| Colors (always semantic) | Anything already used coherently        |

**Warning: over-restricting backfires.** A system that gets in the way every
day ends up switched off, and then there is no system at all. Restrict **only
what has actually got out of hand**, with evidence — not as a precaution.

**If a value outside the scale is genuinely needed:** if it serves a function
that repeats (a row height, a toolbar height), **it is already system and only
lacks a name**: give it one and declare it. If it really is a one-off, it goes
as a loose value inside that component, and that should be rare.

**No bespoke classes that wrap utilities.** They create a second vocabulary to
maintain, they break as soon as the fourth component needs a variation, and
they remove the transparency of seeing what a component does without leaving
the file. If a pattern repeats in more than three or four places, that is not a
class: it is **a component waiting to be extracted**.

**The two remaining escapes**, closed by lint (doc 10): hand-written arbitrary
values, and literal colors.

### 4.5 Public and private tokens

**A public token is part of the API.** Renaming it is a breaking change, just
like renaming a prop.

- **Public:** the semantic tokens a consumer legitimately overrides — those in
  the catalog in section 4.
- **Private:** primitives, internal derivations, and everything that exists
  only to build the above. With a naming convention that tells them apart at a
  glance.

Same logic as the export map: **expose the minimum**. Opening a token later is
easy; closing one is impossible.

**The case almost nobody anticipates: stacking layers.** The values for
dialogs, menus and alerts **must be public tokens**. The consumer has their own
application with their own layers — a fixed header, a side panel — and needs to
coordinate them with yours. If they are closed, their only way out is to force
priorities on top of your CSS. If they are exposed, it is solved in one line.

**General rule:** it is a CSS variable if it **changes at runtime** — by mode,
theme, density or consumer override. What never changes does not need to be
one: every unnecessary variable fattens the CSS and widens the public surface.

### 4.6 Rules of visual composition

Four rules of discipline. None costs implementation: they are decisions about
tokens and restraint.

**a) Hierarchy is made with color, not size.**
Almost all interface text is one size; secondary content is distinguished **by
being dimmer**, not smaller. Three levels of text color, one or two sizes — not
four sizes competing.

Effect: the interface looks smaller and calmer **without shrinking anything**,
because the size variation that pulls the eye disappears. It is the cheapest
fix for an interface that "looks big" without anyone knowing where.

**b) One border color.**
`border` is used in practically the whole interface. `border-strong` is an
exception that has to be justified. Several border greys circulating is one of
the things that most breaks the sense of a system, and one of the hardest to
spot by eye.

**c) Form spacing at two levels, not six.**
A **small gap inside the field** — between label, control and message — and a
**larger one between fields**. Two fixed values, decided once.

A long form with disciplined spacing reads as compact even though the controls
never changed size. It is the other half of the fix in (a).

**d) One standard icon size**, aligned with the text, used in almost
everything. A second size only if justified. Icons at five sizes is what
happens when every component picks its own, and it shows even when nobody can
explain why.

### 4.7 Three text levels, and why they are enough

`text` (what matters) · `text-muted` (secondary) · `text-disabled` (dimmed).
There is no fourth.

**The missing levels come from weight, not from more greys.** Bold and normal,
crossed with the three colors, give six degrees of emphasis. That is more than
enough for a management application.

**The one case that presses: the placeholder.**

An empty field and a filled one must be distinguishable. The temptation is a
fourth grey, lighter, just for the placeholder — and it is a known mistake: a
very faint placeholder drops below minimum contrast and stops being readable.

> **Rule: raise the value, do not lower the placeholder.**
> The placeholder uses `text-muted`; the typed value uses `text`. They are just
> as distinguishable, without breaking contrast and without one more token.

**When a fourth level gets added:** when **two real cases** appear that the
three do not cover. Never as a precaution.

The underlying reason: with five greys available, people end up building
hierarchy by stacking tones — which is exactly what rule (a) was trying to
avoid, arriving through another door. And where you find out whether three are
enough is on the page with every component together: if a fourth were needed,
it shows immediately.

## 5. Hard rules

1. A component consumes **only** layer 2, or its own layer 3. Never
   primitives, never literals.
2. Minimum AA contrast (4.5:1 for text, 3:1 for graphical elements), verified
   **in both modes and in every brand theme offered**. If a theme does not
   pass, the derived token is adjusted; the theme is not published.
3. The library does **not** write to `document`, does not write to
   `localStorage`, and does not detect the system preference on its own. It
   receives the mode already resolved. The project decides (P3).
4. Always logical properties: `start`/`end`, never `left`/`right`. This is half
   of RTL support.
5. In dark mode, elevation is communicated with a **lighter surface**, not with
   a shadow. Shadows are barely visible on a dark background; using them as the
   only signal leaves the interface flat.
6. The saturated colors of the light palette are **not** reused as-is in dark
   mode: they have to be desaturated. And no pure white text on pure black, or
   the reverse.
7. Every class and variable carries the library prefix, so nothing collides
   with the consumer's own Tailwind.
8. **No global reset ships with the package.** A library may not overwrite the
   styles of the application that installs it, so only the theme and utility
   layers are compiled in — never the base layer.

   The consequence is easy to miss and was found by building: browser defaults
   then apply to our own elements, and `box-sizing` defaults to
   `content-box`. A control declared 40px tall measures 42, and two controls
   of the same nominal size stop aligning. Every element with a height, width
   or border sets `box-border` explicitly. The alignment check in §9 is what
   catches a component that forgets.

9. No new token without checking that an equivalent does not exist.

## 6. Dark mode is not an inversion

Every semantic token is defined **separately** in each mode. It is not computed
by inverting lightness or applying a filter. A dark theme derived automatically
from the light one is recognisable at a glance, and it is what makes an
interface look second-rate in dark mode.

With the decision in 1.1, this work already comes done at the primitive layer:
the dark scales are designed as such, not inverted. What does not change is the
rule — **one mode is never derived from the other by calculation**; the scale
system simply saves you from maintaining two mappings.

### 6.1 How this squares with §1.1

Read quickly, §1.1 and this section look like they disagree: one says the
semantic mapping is _identical in both modes_, the other says every token is
defined _separately_ in each mode. Building the first component made the
distinction concrete, so it is worth stating plainly.

- **§1.1 is about families.** You do not need a different mapping per colour
  family, and you do not need a different mapping per mode either. The step
  that is "solid" is solid everywhere. That is the payoff of role-based
  scales, and it is what makes seventeen families tractable.
- **§6 is about derivation.** No mode is ever computed from the other. The
  dark values are designed, not inverted.

Where they meet: a token may be **restated** in the dark block when its role
genuinely differs, and that is not a second mapping. The real case is
elevation. Dark scales run dark-to-light, so "one step more raised" and "one
step more recessed" are not the same index in both modes — a raised surface has
to be restated. Three surface tokens need it; the rest of the mapping does not.

The test for whether a restatement is legitimate: it names a role that behaves
differently in the two modes. If it is only nudging a value because it looked
nicer, it is drift, and it belongs in the primitives or nowhere.

Practical consequence: the visual catalog must be able to show both modes
**side by side**, not by toggling.

## 7. The customization contract

Three levels, from least to most invasive. All of them consist of redefining
variables:

| Level | The project wants…          | What it overrides                                           |
| ----- | --------------------------- | ----------------------------------------------------------- |
| 1     | Its brand colors            | The brand scale. The semantic tokens recompute on their own |
| 2     | To adjust specific details  | Whichever semantic tokens it cares about                    |
| 3     | A complete theme of its own | The entire semantic map                                     |

What is **never** offered: overriding internal classes, or depending on DOM
structure (non-goal 10). If a project needs something no level covers, that is
a sign a token is missing, and it is discussed as such.

Scope: global or per region, and nestable across all three axes.

## 8. What is not a token

- Values used once in one specific component → they live in that component
- Application measurements (side navigation width, header height) → they belong
  to the project, not the library
- Anything whose name mentions a business concept (P1)

## 9. Verification

Before accepting a component or a theme:

- [ ] Zero literal colors and zero primitives in the component's code
- [ ] AA contrast in light and dark, and in every brand theme offered
- [ ] All three axes combined in the visual catalog (dark + alternate brand +
      compact at the same time)
- [ ] Density has altered no color and not the base text size
- [ ] One single focus ring style across the whole library
- [ ] No physical measurement appears in RTL
- [ ] With reduced motion enabled, nothing animates
- [ ] **A field, a select and a button of the same size align exactly in a row**
- [ ] There are no more control heights or radii than those declared in 4.3
- [ ] Numbers read in a column use tabular figures
- [ ] The library imposes no font
- [ ] No background is used without its paired text color (4.0)
- [ ] Text hierarchy is achieved with color and weight, not size
- [ ] There are exactly three text color levels, and the placeholder uses the
      secondary one
- [ ] One border color across the whole interface, barring a justified
      exception
- [ ] One icon size, barring a justified exception
- [ ] Forms have exactly two vertical gaps: inside the field and between fields
