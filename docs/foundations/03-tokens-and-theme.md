# 03 · Tokens and theme

> Defines the library's visual vocabulary: how values are named, how they are
> grouped, and how a project overrides them.
> Every component hangs off this document. A token named badly today is dragged
> along for years.

**Status:** adopted · **Date:** 2026-09-02
**Still open:** the list of families published as themes. The concrete semantic
mapping was settled with the first component on screen, and is §4 plus
`src/styles/semantic.css`.
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
defined role**, not from a palette ordered only by lightness.

Until 2026-09-12 that system was Radix Colors, kept as a development dependency
so none of it reached a consumer. It is now this library's own palette —
`scripts/palette.mjs`, twelve steps with the same twelve roles, published in
`oklch` ([decision 0028](../decisions/0028-the-palette-is-ours-and-what-it-guarantees.md)).
The decision below did not change; what changed is that a project is no longer
limited to the families somebody else drew.

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

**The brand axis has a ready-made half.** `blackborne/palette.css` is an opt-in
second stylesheet carrying the whole palette — eighteen accents and seven bases
— as `[data-bb-accent]` and `[data-bb-base]` scopes, so a project whose brand
is red writes `data-bb-accent="red"` rather than building a twelve-step scale.
It is the same mechanism as the row above and not a fourth axis: the accent
scope redefines the brand family, the base scope redefines the greys, and the
four tone families follow neither ([decision 0029](../decisions/0029-the-catalogue-is-opt-in-and-a-scope-carries-the-pair.md)).

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
[data-bb-theme],
[data-bb-accent],
[data-bb-base] {
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

### 3.2 The mode goes outermost

§3.1's re-declaration has a second half that went unwritten until 2026-09-13,
and it cost a real defect: **the dark block has to match those scopes too.**

The mapping the light block declares is the whole mapping, so a scope that
re-declares it also re-declares the twenty-five tokens the dark block restates.
With the dark block matching only `[data-bb-mode='dark']`, a theme scope NESTED
inside a dark element put the light mapping back. Measured in a browser:

| token                 | dark  | inside a nested scope           |
| --------------------- | ----- | ------------------------------- |
| `--bb-surface-raised` | 25.4% | **17.9%** — level with the page |
| `--bb-surface-sunken` | 21.3% | **25.4%** — lighter than it     |
| `--bb-border`         | 31.1% | 34.7%                           |

Nothing had shown it, because the catalog's own panels put `data-bb-theme` and
`data-bb-mode` on the **same** element, where the dark block has always
matched. Nesting them is what a consumer does.

So the dark block carries the scopes as descendants as well:

```css
[data-bb-mode='dark'],
[data-bb-mode='dark'] [data-bb-theme],
[data-bb-mode='dark'] [data-bb-accent],
[data-bb-mode='dark'] [data-bb-base] {
  /* the twenty-five that genuinely differ */
}
```

**And that is a descendant selector, which answers the wrong question.** It
asks "is there a dark ancestor", where the question is "is the NEAREST mode
ancestor dark" — and no plain selector can ask that. `@scope` can, and is not
worth a token layer's compatibility floor. So the rule is one sentence:

> **The mode goes outermost.** Put a theme scope on the element carrying
> `data-bb-mode`, or inside it with no other mode in between.

Two arrangements are therefore **undefined**, both measured rather than
assumed, and both avoided by that sentence:

- `dark > light > accent` — the accent scope takes the dark mapping, because
  the dark rule matches through the light element.
- `accent > dark` — `primitives.css`'s own `[data-bb-mode='dark']` block
  redeclares the default brand family on the inner element, and a declaration
  beats an inherited value, so the accent is lost.

It is not enforced, because there is nothing to enforce it with: a stylesheet
cannot warn. It is documented, it is the arrangement every example uses, and
`e2e/palette.spec.ts` measures the supported ones.

## 4. Catalog of semantic tokens

The closed inventory. Adding a new one requires checking that no equivalent
already exists — three near-identical greys is how entropy begins.

**Surfaces**
`surface` (panel or card base) · `surface-control` **+ `surface-control-on`**
(the resting background of a control) · `surface-raised` (raised: menu, popover,
dialog) · `surface-sunken` (sunken: table header, background zones) ·
`surface-overlay` (the scrim behind a dialog) · `surface-hover` ·
`surface-active` · `surface-selected` · `surface-disabled` ·
`surface-knob` (the moving part of a control, at rest)

**`surface-knob` was added on 2026-09-11, and §5 rule 9's check is the reason
it is a token at all.** `Switch.css` held `var(--bb-x-gray-7)` — layer 1 inside
a component, which §1 forbids outright — and it survived because ESLint reads
no CSS in this repository: its blocks are scoped to `.ts` and `.tsx`, so
seventeen shipped stylesheets were outside every rule the project has. The
equivalent check found nothing: no layer-2 token resolves to step 7 in either
mode. Named for the role rather than for `Switch`, on `surface-overlay`'s
precedent, and it has one reader today.

**`surface-raised` deliberately equals `surface` in light mode**, and that is
the clearest example of §6.1's rule that a token may be restated when its role
genuinely differs between modes. In light, elevation is carried by the SHADOW,
so a floating panel takes the lightest surface there is and the shadow does the
lifting. In dark it cannot — §5 rule 5, a shadow is barely visible on a dark
ground — so the dark block restates it two steps up, which the dark scale makes
lighter than the page.

It was step 2 until `Dialog` became its first reader, and measured against the
page that was elevation pointing the wrong way: 0.9486 relative luminance
against the page's 0.9741, so the "raised" surface was **darker** than what it
floats above, at 1.03:1 — imperceptible, and imperceptibly backwards. A scrim
hides it, which is why a dialog would never have exposed it; a popover has no
scrim.

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

#### 4.0.1 The pair has to be a pair in the FILE, not only in the rule

The paragraph above was written in 2026-08 and was half true for a year.
`--bb-accent-on` was the literal `#fff`, which is correct for one brand: the
default is a dark blue. The decision did live in the theme; it just did not
depend on the brand.

Shipping eighteen accents is what made that visible. Measured, white text on
each family's solid step: **nine of the eighteen are under 4.5:1** — amber
3.12, cyan 3.68, emerald 3.78, green 3.28, lime 3.08, orange 3.50, sky 4.07,
teal 3.72, yellow 2.89 — which is this section's own sentence, unfixed, nine
times over.

**So a background whose colour a project can change declares its text as part
of the same scope**, and which text is a measurement rather than a judgement:
whichever of white and the family's own darkest step reads better on the
solid. It generalises past the colour itself, because a pair has to hold in
every state the background has:

> Hover and press move **away** from the text's lightness. Interacting spends
> no contrast.

Which in a role scale is: a white-text family walks 9, 10, 11 in light and
9, 8, 7 in dark; a dark-text family does the opposite. The second half of that
was the shipped default getting it wrong — a pressed primary button in dark
mode was white on step 11, which is the scale's low-contrast **text** step
being used as a **fill**, at 2.08:1. Nothing had seen it because the catalog's
states story is light-only.

**Two floors survive this and are named rather than smoothed over.** Four
accents have a mid-tone solid that cannot carry a run of text either way —
cyan 4.48, emerald 4.31, sky 4.07, teal 4.39 — and two have a solid within 3:1
of the page: yellow in light at 2.82, indigo in dark at 2.88. Those are
properties of the palette rather than of the mapping, and
[decision 0028](../decisions/0028-the-palette-is-ours-and-what-it-guarantees.md)
carries them under what is **not** guaranteed.

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

The two are VERTICAL, and a third arrived without being named: the gap
**between options laid out in a row** — a horizontal group of checkboxes or
radios. It is a larger step than the vertical one on purpose, because
neighbouring options in a row need more air to read as separate than stacked
ones do, and it is one value shared by every such group. Written down after two
components picked the same number by copying each other, which is how a
convention becomes a coincidence nobody can defend.

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

   Three things measurement taught, and none of them was obvious from reading
   the palette:

   - **Step 9 is not a text background.** It is designed for graphical
     elements, which need only 3:1. White on it measures 3.91:1 for red,
     3.16:1 for green, 3.26:1 for blue and 1.58:1 for amber — every one below
     the requirement. A filled button carrying a label is text. Step 11 clears
     it in light mode.
   - **Dark mode needs the other pairing entirely.** No step of the dark
     scales reaches 4.5:1 against white, because they are built to sit on a
     dark page rather than to carry white text. Against dark text the same
     step 9 clears it comfortably. So a filled state button is white-on-deep
     in light mode and dark-on-bright in dark mode — which is also why §6.1
     allows a token to be restated when its role genuinely differs.
   - **A border token is not a mark.** `--bb-border-strong` measures 1.86:1
     against the light surface and 3.01:1 against the dark one, which is
     correct for what it is for: the boundary of a control you are not meant
     to read, on an element identified by its label and its fill. Reaching for
     it to CARRY information fails this rule on the light side and scrapes
     through on the dark, which is the asymmetry the bullet above describes
     arriving from the other direction. Measured on a calendar, where the ring
     around today is the only thing marking today — a graphical element under
     any reading, so 3:1 applies, and the ring is drawn in the text colour of
     whatever it sits on instead: `--bb-text-muted` on the surface at 5.79:1
     and 9.06:1, the accent pair's own text colour inside a selected day.

     Two things generalise from it. **A ring is measured against what it sits
     on**, not against the page: the same ring inside an accent fill compared
     against `--bb-surface` reads 1.03:1 and means nothing. And **nothing
     automated was ever going to catch this** — axe checks the contrast of
     text, and a box shadow is not text, which is why the calendar now carries
     a browser check that computes the ratio itself in both modes
     ([doc 10](./10-quality-and-verification.md) §6.1 is the neighbouring
     lesson: it was a baseline nobody could have read that showed the ring at
     all).

   All of this was found by automated accessibility, not by review, and it had
   been in the catalog since the first component.

   **And the half automated accessibility CANNOT find now has a check of its
   own.** axe measures the contrast of text; a border, a box-shadow and a fill
   are not text, which is why every failure in the list above was found by a
   person opening a picture. Two files close it from opposite ends:

   - `e2e/contrast.spec.ts` measures the rule of pairs (§4.0) over every pair
     the stylesheet declares, in both modes, with the list DERIVED from the
     CSSOM rather than written down — `--bb-X-on` is by definition the text on
     `--bb-X`, plus whichever of `--bb-X-hover` and `--bb-X-active` exists. It
     needs no story, so a pair nothing paints yet is measured anyway. Two
     exemptions are named with their numbers and asserted in both directions,
     so one that stops being needed fails rather than rots.
   - `e2e/focus-ring.spec.ts` measures the one graphical element that is
     always the only channel for its state. It cannot be derived — which
     ground a ring lands on is a fact about each component — so it carries an
     explicit registry, and the last test reads a REAL focused control to
     check that the colours the registry models are the colours the browser
     computed.

   **A focus indication is measured at the boundary it has, and it has three.**
   Measured on a primary button: the 1px edge is `--bb-focus-ring` on
   `--bb-accent`, which are the SAME COLOUR — 1.00:1, an edge that does not
   exist — and the halo over the page reads 1.43:1 against that page. Neither
   is the answer. The halo against the button's own fill is 3.51:1, and a
   magnified photograph shows exactly that: a pale band whose visible boundary
   is the one with the blue. So the indication passes if it clears 3:1 at the
   edge against the fill, the halo against the fill, or the halo against the
   surrounding surface.

   **Two grounds do not clear it, both in dark mode**, and they are pinned as
   open defects rather than fixed: a primary button (and a selected checkbox,
   radio or switch) at **2.59:1**, and a hovered table row at **2.55:1**. The
   fix was searched for and is not a token: swept across the whole registry,
   `--bb-x-brand-10` and `-11` still leave the primary button under the floor,
   because that control's fill IS the accent and anything near enough to be
   "the brand" is near enough to disappear on it — and the one candidate that
   clears every row, `--bb-x-brand-12`, measures **1.00:1 against
   `--bb-x-gray-12`**, which would make a focused colour swatch
   indistinguishable from a chosen one. What works is a two-colour ring, a gap
   of the surrounding surface between the fill and the ring, and that changes
   the geometry of every focused control in the library.

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

Four levels, from least to most invasive. All of them consist of redefining
variables:

| Level | The project wants…                | What it overrides                                           |
| ----- | --------------------------------- | ----------------------------------------------------------- |
| 0     | A colour from the palette we ship | Nothing. It names a scope: `data-bb-accent`, `data-bb-base` |
| 1     | Its own brand colors              | The brand scale. The semantic tokens recompute on their own |
| 2     | To adjust specific details        | Whichever semantic tokens it cares about                    |
| 3     | A complete theme of its own       | The entire semantic map                                     |

**Level 0 is new, and it is the one most projects want.** Level 1 asks for a
twelve-step scale per mode — twenty-four values, with the step roles §1.1
describes — which is real work, and the level's own history is of people doing
it badly: five hand-written copies of one override in this repository's catalog
had drifted apart, three of them missing steps, and every missing step fell
back to the library's own brand while looking deliberate. `palette.css` ships
twenty-five families that already satisfy the contract, so a project whose
brand is close to one of them declares an attribute and is done
([decision 0029](../decisions/0029-the-catalogue-is-opt-in-and-a-scope-carries-the-pair.md)).

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
