# Tokens

Every design token the library publishes, what each one is for, and which
components read it. Extracted from `src/styles/` rather than written from
memory, so the "used by" columns are counts of real references.

The **roles** below are stable — that is what a token is. The **values** are
current as of 2026-09-13, after the pass that went through the fields one
by one, and they move when a design decision moves them.

## The three layers

```
primitives.css   --bb-x-gray-3, --bb-x-brand-9      generated · private
semantic.css     --bb-surface, --bb-accent          the public contract
component        Button.tsx, controlBox.ts          reads semantic only
```

A component that references a primitive is a defect, not a preference
(`CLAUDE.md`, hard rule 1). Primitives are not reachable from a utility either:
`index.css` clears Tailwind's colour namespace with `--color-*: initial`, so
there is no `bb:bg-blue-500` to write — the wrong thing does not exist rather
than being discouraged (doc 03 §4.4).

**100 semantic tokens.** 80 of them are appearance and live in the base block;
20 are size and spacing and live in the density block. 29 are restated in dark.

## How a token becomes a class

A token is **not** reachable by its own name. `index.css` maps it onto a
Tailwind theme key, and the utility is named after the **key**:

| declared                 | mapped to             | written as                         |
| ------------------------ | --------------------- | ---------------------------------- |
| `--bb-surface`           | `--color-surface`     | `bb:bg-surface`, `bb:text-surface` |
| `--bb-control-height-md` | `--height-control-md` | `bb:h-control-md`                  |
| `--bb-text-md`           | `--text-md`           | `bb:text-md`                       |

Tokens with no theme key are read directly — either `var(--bb-space-4)` in a
stylesheet, or Tailwind's arbitrary-value shorthand in a class:
`bb:gap-(--bb-space-3)`.

Two traps that have already cost time:

- **A square element cannot be sized with a `w-*` token.** The theme has
  `--height-control-*` and no `--width-control-*`, so `bb:w-control-md`
  compiles to nothing and leaves a box with a height and no width. Use
  `aspect-square` against the height.
- **`min-w-hit` does not resolve from `--height-hit`.** Tailwind reads a
  min-width utility from its own namespace, which is why `--min-width-hit`
  exists as a separate entry.

The way to settle either question is to grep the **compiled** stylesheet. Three
utilities in this repository have looked correct in the source and produced no
rule at all.

## The four axes

| axis      | attribute                             | what changes                                  |
| --------- | ------------------------------------- | --------------------------------------------- |
| Mode      | `data-bb-mode="light \| dark"`        | 29 colour tokens are restated                 |
| Density   | `data-bb-density="normal \| compact"` | all 20 size and spacing tokens                |
| Brand     | `data-bb-theme`                       | the `--bb-x-brand-*` scale beneath the accent |
| Catalogue | `data-bb-accent`, `data-bb-base`      | brand or grey scale, by name                  |

**The mode goes outermost.** These are descendant selectors, so they answer
"is there a dark ancestor", not "is the nearest mode ancestor dark" — a
question no plain selector can ask. A theme scope with a mode between it and
its own mode is undefined (doc 03 §3.2).

---

## Surfaces

A background and the text that sits on it are used as a pair, so most surfaces
publish both halves: `--bb-X` and `--bb-X-on` (doc 03 §4.0).

| token                       | class                      | what it is                                                                                                                   | used by |
| --------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- |
| `--bb-surface`              | `bg-surface`               | The page. Everything else is judged against it                                                                               | 10      |
| `--bb-surface-on`           | `text-surface-on`          | Text on the page                                                                                                             | 2       |
| `--bb-surface-raised`       | `bg-surface-raised`        | Anything that **floats**: dialog, drawer, popover, menu, tooltip, toast                                                      | 4       |
| `--bb-surface-raised-on`    | `text-surface-raised-on`   | Text inside a floating panel                                                                                                 | 2       |
| `--bb-surface-sunken`       | `bg-surface-sunken`        | A well: a progress track, a slider rail, a drop zone, a table header                                                         | 7       |
| `--bb-surface-sunken-on`    | `text-surface-sunken-on`   | Text on a well. **Nothing reads it** — it exists so the pair is complete                                                     | 0       |
| `--bb-surface-control`      | `bg-surface-control`       | The resting fill of a **control**: a field, a checkbox, a swatch. Says "this is writable"                                    | 8       |
| `--bb-surface-control-on`   | `text-surface-control-on`  | The value inside a control                                                                                                   | 4       |
| `--bb-surface-hover`        | `bg-surface-hover`         | Pointer over anything neutral                                                                                                | 14      |
| `--bb-surface-raised-hover` | `bg-surface-raised-hover`  | The same, for a row sitting on a floating panel — a menu command, a select option. In dark it lightens, as the page one does | 2       |
| `--bb-surface-active`       | `bg-surface-active`        | Held down. One step further than hover                                                                                       | 13      |
| `--bb-surface-selected`     | `bg-surface-selected`      | A chosen row or card — accent-tinted, not accent-filled                                                                      | 2       |
| `--bb-surface-selected-on`  | `text-surface-selected-on` | Text on a chosen row                                                                                                         | 2       |
| `--bb-surface-disabled`     | `bg-surface-disabled`      | A control that cannot be touched                                                                                             | 7       |
| `--bb-surface-disabled-on`  | `text-surface-disabled-on` | Text on one                                                                                                                  | 1       |
| `--bb-surface-knob`         | `var()`                    | The part of a control you **drag**: a slider handle, a switch thumb                                                          | 1       |
| `--bb-surface-overlay`      | `bg-surface-overlay`       | The scrim behind a modal. Black at 45% / 60%, so it does **not** follow the mode                                             | 1       |

**Elevation works differently per mode, and that is deliberate.** In light it
is the shadow that lifts a panel, so `raised` is near the page. In dark a
shadow is barely visible (doc 03 §5 rule 5), so the **surface** lifts it and
`raised` is a lighter step. One token, two mechanisms.

## Text

| token                | class                | what it is                                                     | used by |
| -------------------- | -------------------- | -------------------------------------------------------------- | ------- |
| `--bb-text`          | `text-text`          | Body text. The default ink                                     | 27      |
| `--bb-text-muted`    | `text-text-muted`    | Descriptions, help text, affixes, placeholders — one step down | 20      |
| `--bb-text-disabled` | `text-text-disabled` | The label of something that cannot be used                     | 15      |
| `--bb-link`          | `text-link`          | A link at rest                                                 | 2       |
| `--bb-link-active`   | `text-link-active`   | A link being pressed                                           | 2       |

## Borders and focus

| token                           | class                   | what it is                                                                                                                                                                 | used by |
| ------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `--bb-border`                   | `border-border`         | The ordinary edge: field frames, cards, separators, table lines                                                                                                            | 20      |
| `--bb-border-strong`            | `border-border-strong`  | Where an edge has to carry more: a table's outer rule, a drop zone                                                                                                         | 4       |
| `--bb-border-invalid`           | `border-border-invalid` | The edge of a field in error. **Not the same colour as the message under it** — an edge needs 3:1 and a message needs 4.5:1, and on a dark scale no single red clears both | 6       |
| `--bb-border-focus`             | `border-border-focus`   | A field's border while focused                                                                                                                                             | 1       |
| `--bb-focus-ring`               | `border-focus-ring`     | The ring itself. One ring for the whole library                                                                                                                            | 16      |
| `--bb-focus-ring-halo-strength` | `var()`                 | How opaque the 4px halo is — 24% light, 34% dark                                                                                                                           | 14      |

**A checkbox rests on the SAME edge as the field beside it.** There was a
stronger token for small controls — chosen for the ratio, because on a 20px box
the edge is the only thing identifying the control — and it was given up on
2026-09-13: a checkbox whose edge outshone the text field next to it made a
mixed form read as two libraries. The stronger step is the HOVER now, and what
that costs is a row in the catalog's §7, with the measurement.

**A ratio is a fact about a PAIR.** These are chosen against the page, so
either half moving means re-measuring — and nothing here will tell you, because
none of them has a check behind it (doc 10 §11.10). It is not hypothetical:
the page moved one step in dark and the focus ring fell under its floor on
three grounds that nobody had touched.

## Accent

The brand colour. A consumer redefines the `--bb-x-brand-*` scale and all eight
derive on their own.

| token                       | class                     | what it is                                                       | used by |
| --------------------------- | ------------------------- | ---------------------------------------------------------------- | ------- |
| `--bb-accent`               | `bg-accent`               | The filled accent: a primary button, a checked box, today's ring | 16      |
| `--bb-accent-on`            | `text-accent-on`          | Text **on** the accent fill                                      | 9       |
| `--bb-accent-hover`         | `bg-accent-hover`         | Pointer over a filled accent                                     | 4       |
| `--bb-accent-active`        | `bg-accent-active`        | A filled accent held down                                        | 4       |
| `--bb-accent-subtle`        | `bg-accent-subtle`        | Accent-tinted, not accent-filled: a soft badge, a selected day   | 4       |
| `--bb-accent-subtle-on`     | `text-accent-subtle-on`   | Text on that tint                                                | 4       |
| `--bb-accent-subtle-hover`  | `bg-accent-subtle-hover`  | Hover for the tint                                               | 1       |
| `--bb-accent-subtle-active` | `bg-accent-subtle-active` | Pressed, for the tint                                            | 1       |

**Hover and press move AWAY from the text's lightness.** In dark the scale runs
dark-to-light, so the same indices as light would walk a pressed button straight
into its own text colour — which is exactly what happened: white on a text step
at 2.08:1. Light hovers to step 10 and presses to 11; dark hovers to 8 and
presses to 7.

**If the brand is a light colour, `--bb-accent-on` must be set to a dark
value.** Nine of the nineteen catalogue accents are under 4.5:1 against white.

## Status

Four tones, each with the same four-or-five shape: a fill, its text, a tint,
the tint's text, and — for three of them — a text-only variant for a message.

| token group                  | class               | what it is                                            | used by |
| ---------------------------- | ------------------- | ----------------------------------------------------- | ------- |
| `--bb-danger`, `-on`         | `bg-danger`         | Destructive: a delete button, an invalid border       | 7 / 2   |
| `--bb-danger-text`           | `text-danger-text`  | An error **message**. Text on the page, not on a fill | 8       |
| `--bb-danger-subtle`, `-on`  | `bg-danger-subtle`  | A soft danger badge, a destructive menu row           | 3 / 3   |
| `--bb-warning`, `-on`        | `bg-warning`        | Caution                                               | 1 / 1   |
| `--bb-warning-text`          | `text-warning-text` | A caution message                                     | 1       |
| `--bb-warning-subtle`, `-on` | `bg-warning-subtle` | A soft warning badge, a tone glyph                    | 2 / 2   |
| `--bb-success`, `-on`        | `bg-success`        | Confirmation                                          | 1 / 1   |
| `--bb-success-text`          | `text-success-text` | A success message. **Nothing reads it yet**           | 0       |
| `--bb-success-subtle`, `-on` | `bg-success-subtle` | A soft success badge                                  | 2 / 2   |
| `--bb-info`, `-on`           | `bg-info`           | Neutral notice                                        | 2 / 1   |
| `--bb-info-text`             | `text-info-text`    | An informational message. **Nothing reads it yet**    | 0       |
| `--bb-info-subtle`, `-on`    | `bg-info-subtle`    | A soft info badge                                     | 2 / 2   |

The filled tones swap step between modes — light uses step 11 and dark uses
step 9 — because a dark scale runs the other way and the light step would be
too dark to read against a dark page.

## Radii

Four, and no more (doc 03 §4.3).

| token              | class          | value  | what uses it                                            | used by |
| ------------------ | -------------- | ------ | ------------------------------------------------------- | ------- |
| `--bb-radius-sm`   | `rounded-sm`   | 4px    | A checkbox, a badge, a table cell                       | 6       |
| `--bb-radius-md`   | `rounded-md`   | 8px    | The default: buttons, fields, menu rows                 | 20      |
| `--bb-radius-lg`   | `rounded-lg`   | 12px   | Anything that holds other things: cards, panels, layers | 14      |
| `--bb-radius-full` | `rounded-full` | 9999px | Avatars, pills, progress tracks, switch tracks          | 9       |

## Shadows

Own values per mode — heavier in dark, where they barely register.

| token            | class       | what uses it                     | used by |
| ---------------- | ----------- | -------------------------------- | ------- |
| `--bb-shadow-sm` | `shadow-sm` | A dragged part: the switch thumb | 1       |
| `--bb-shadow-md` | `shadow-md` | A tooltip                        | 1       |
| `--bb-shadow-lg` | `shadow-lg` | Layers and toasts                | 2       |

## Type

| token                 | class            | value             | what it is                                                             | used by |
| --------------------- | ---------------- | ----------------- | ---------------------------------------------------------------------- | ------- |
| `--bb-font-sans`      | `font-sans`      | `inherit`         | **No family is imposed.** It inherits from the project (doc 03 §4.1)   | 30      |
| `--bb-font-mono`      | `font-mono`      | system mono stack | For figures and codes. **Nothing reads it yet**                        | 0       |
| `--bb-text-xs`        | `text-xs`        | 12px              | Secondary: badges, captions, the small size step                       | 18      |
| `--bb-text-sm`        | `text-sm`        | 13px              | Dense rows: a table, a tooltip, a breadcrumb                           | 4       |
| `--bb-text-md`        | `text-md`        | 14px              | **The base size.** Everything unless it says otherwise                 | 30      |
| `--bb-text-lg`        | `text-lg`        | 16px              | The large size step, and a layer's title                               | 11      |
| `--bb-text-xl`        | `text-xl`        | 20px              | **Nothing reads it yet**                                               | 0       |
| `--bb-leading-tight`  | `leading-tight`  | 1.25              | One line that must not grow: a button, a badge                         | 7       |
| `--bb-leading-normal` | `leading-normal` | 1.5               | Anything that wraps                                                    | 20      |
| `--bb-weight-normal`  | `font-normal`    | 400               | Body                                                                   | 2       |
| `--bb-weight-strong`  | `font-strong`    | 500               | Labels, headings, the emphasis this library uses. **There is no bold** | 24      |

## Motion

| token                  | read as         | value                          | what it is                                    | used by |
| ---------------------- | --------------- | ------------------------------ | --------------------------------------------- | ------- |
| `--bb-duration-fast`   | `var()`         | 200ms                          | A state change: hover, press, focus           | 25      |
| `--bb-duration-normal` | `var()`         | 300ms                          | Something arriving or leaving: a layer, a bar | 5       |
| `--bb-ease`            | `ease-standard` | `cubic-bezier(0.2, 0, 0.3, 1)` | The one curve                                 | 28      |

**Reduced motion removes animation entirely rather than softening it** (doc 09
§2). Both durations drop to `0ms` under `prefers-reduced-motion`, declared once
in `semantic.css` so no component has to remember.

## Stacking

No theme key — read with `var()`. Three levels, and nothing between them.

| token                | value | what it is                                                       | used by |
| -------------------- | ----- | ---------------------------------------------------------------- | ------- |
| `--bb-layer-overlay` | 100   | The scrim                                                        | 1       |
| `--bb-layer-popover` | 200   | Anything anchored: menu, popover, select, combo box, date picker | 9       |
| `--bb-layer-toast`   | 300   | Above everything, because it announces                           | 1       |

---

## Spacing — moves with density

No theme key. Read as `var(--bb-space-4)` or `bb:gap-(--bb-space-4)`.

| token          | normal | compact | used by |
| -------------- | ------ | ------- | ------- |
| `--bb-space-1` | 2px    | 2px     | 14      |
| `--bb-space-2` | 4px    | 4px     | 19      |
| `--bb-space-3` | 8px    | 6px     | 14      |
| `--bb-space-4` | 12px   | 8px     | 12      |
| `--bb-space-5` | 16px   | 12px    | 4       |
| `--bb-space-6` | 24px   | 16px    | 3       |
| `--bb-space-7` | 32px   | 24px    | 1       |
| `--bb-space-8` | 48px   | 32px    | 1       |

The two smallest steps do **not** compress. Below about 4px a gap stops being
spacing and starts being a rendering artefact.

## Control sizes — moves with density

| token                        | class                    | normal | compact | what it is                                                                                                                              | used by |
| ---------------------------- | ------------------------ | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `--bb-control-height-sm`     | `h-control-sm`           | 36px   | 30px    | The small step                                                                                                                          | 15      |
| `--bb-control-height-md`     | `h-control-md`           | 44px   | 36px    | **The default.** A field, a select and a button are the same height, so a row of them aligns                                            | 14      |
| `--bb-control-height-lg`     | `h-control-lg`           | 52px   | 44px    | The large step                                                                                                                          | 14      |
| `--bb-control-box`           | `h-box`, `w-box`         | 20px   | 16px    | The square of a checkbox or radio                                                                                                       | 4       |
| `--bb-control-box-mark`      | `h-mark`, `w-mark`       | 14px   | 11px    | The glyph inside it — and every shared icon: the tick, the cross, the chevron                                                           | 18      |
| `--bb-control-switch-height` | `h-switch`               | 24px   | 20px    | The switch track                                                                                                                        | 1       |
| `--bb-control-switch-width`  | `w-switch`               | 44px   | 36px    | The switch track                                                                                                                        | 1       |
| `--bb-control-hit-area`      | `min-h-hit`, `min-w-hit` | 28px   | 24px    | The floor for anything pressable, on **both** axes (doc 06 §3)                                                                          | 17      |
| `--bb-control-padding-x`     | `var()`                  | 12px   | 8px     | The inset from a control's edge to its contents                                                                                         | 5       |
| `--bb-row-height`            | `h-row`                  | 44px   | 36px    | A listing row. **Nothing reads it yet**                                                                                                 | 0       |
| `--bb-field-gap-inner`       | `var()`                  | 6px    | 4px     | Inside one field: label to control, control to message                                                                                  | 9       |
| `--bb-field-gap`             | `var()`                  | 16px   | 12px    | **Between** fields. The library never applies it — a form's layout belongs to the project, so this is published for the consumer to use | 0       |

---

## What a consumer may override

Everything in `semantic.css`, and the brand scale beneath it.

```css
[data-bb-mode='light'] {
  --bb-x-brand-3: …;
  --bb-x-brand-9: …;
}
```

**Eight steps are read — 3, 4, 5, 8, 9, 10, 11 and 12 — and all eight must be
supplied.** There is no partial override: a step left out does not fall back to
the rest of their brand, it falls back to the library's own indigo, and the
result is one violet control with an indigo pressed state that nobody traces
back to a missing line. This catalog's own fixture drifted to six of the eight.

**A brand is a scale per mode, not a colour.** The light steps run light-to-dark
and the dark steps run the other way, so the same values in both scopes put a
dark brand on a dark page.

The alternative is `blackborne/palette.css` — an opt-in second stylesheet with
nineteen more families as `[data-bb-accent]` and `[data-bb-base]` scopes, so a
project whose brand is red names a colour instead of writing twenty-four values
([decision 0029](../decisions/0029-the-catalogue-is-opt-in-and-a-scope-carries-the-pair.md)).

## The seven nothing reads

Declared, published, and referenced by no component:

| token                                 | why it is here                                                         |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `--bb-surface-sunken-on`              | Pair completeness. Every surface publishes both halves                 |
| `--bb-success-text`, `--bb-info-text` | The shape `--bb-danger-text` established; no component has needed them |
| `--bb-font-mono`                      | For figures and codes                                                  |
| `--bb-text-xl`                        | The top of the type scale                                              |
| `--bb-row-height`                     | A listing row                                                          |
| `--bb-field-gap`                      | Applied by the **consumer**, not the library                           |

Only the last is load-bearing. The other six are a published surface nothing
exercises, which means nothing would notice if one of them were wrong.
