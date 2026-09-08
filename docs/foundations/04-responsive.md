# 04 · Responsive and adaptability

> Defines how a component behaves when the available space changes.
> This is the document that prevents the problem which motivated the library:
> four different strategies coexisting because nobody decided which was right.

**Status:** adopted · **Date:** 2026-09-02
**Depends on:** [01 · Principles](./01-principles.md) P4 ·
[03 · Tokens and theme](./03-tokens-and-theme.md)

---

## 1. The problem it solves

Inside an application, a component always lives in the same slot of the layout.
There, "the window is wide" and "my container is wide" coincide almost always,
and using viewport breakpoints works by accident.

In a library that coincidence disappears. The same component may sit in a 320px
side panel inside a 1920px screen. A viewport breakpoint then **lies**: the
component believes it has room and it does not.

There is a second, quieter effect: when no single strategy is chosen, all of
them end up in use. Viewport breakpoints in some components, container queries
in others, hand-written thresholds in JavaScript that do not agree with each
other, and improvised resize observers. Each works in its own place, none
composes with the others, and nobody dares touch them. This document exists so
that does not happen: it is decided once, here.

## 2. The decision hierarchy

Four levels, cheapest to most expensive. **Always start at level 0, and never
move up a level without justifying it in writing.**

| Level                    | Tool                                                                    | When                                                                                               |
| ------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **N0 · Nothing**         | Fluid by default                                                        | The majority case. Most components do not need adaptability: they need to stay out of the way      |
| **N1 · Intrinsic CSS**   | Automatic wrapping, grids that reflow on their own, minimums that yield | When it is enough for things to rearrange themselves. No queries of any kind                       |
| **N2 · Container query** | The component reacts to its own width                                   | When the layout has to change: two columns to one, hiding what is incidental                       |
| **N3 · JavaScript**      | One single shared hook                                                  | Only when the **structure** changes, not the styling: a different component tree has to be mounted |

The mistake to avoid is jumping to N2 or N3 out of habit. A component written
well at N0 works in any slot without a single query.

## 3. Fluid by default (N0)

Concrete rules, applying to every component:

- **Nothing has a fixed width.** Use max-width, never width.
- Flexible containers let their children shrink below their content; otherwise
  a long string bursts the box silently.
- No height or width is sized so one particular label fits (this connects to
  text expansion across languages).
- Long text is truncated or wrapped explicitly; never trust that it will fit.
- Spacing comes from tokens (doc 03), not from loose values.

A component that follows this works in a 320px container without a single query
having been written.

## 4. The container scale

The names are **relative to the container**, not to devices. A 400px container
is not "a phone": it is a narrow container inside what may be an enormous
screen.

Naming things `mobile`, `tablet` or `desktop` is forbidden: it drags in false
assumptions about the device, the pointer type and the window size.

The scale is **short** (three or four steps). Every additional step multiplies
the test matrix, so they are justified one at a time.

### 4.0 How injectable it actually is

This section used to say the scale was injectable — "a project can redefine the
thresholds the same way it redefines tokens" — and that was **half true and
never checked**. It is stated precisely here instead.

Measured in the compiled stylesheet: the scale was declared inside
`@theme inline`, which substitutes a value into each utility and emits no
variable, so `--bb-container-narrow` appeared nowhere at all. A consumer
redefining it changed nothing. The claim had been false since the token layer
was written, and nothing had read the scale hard enough to notice.

It is now declared outside that block, and the two halves behave differently:

- **What reads the scale as a length is injectable.** `bb:max-w-narrow`
  compiles to `max-width: var(--bb-container-narrow)`, so redefining the token
  moves it — at runtime, in one scope, like any other token.
- **A query threshold is not, and cannot be.** A container query's condition may
  not contain `var()`, so the number is baked into
  `@container (width >= 24rem)` by the generator. This is a CSS limit and not a
  decision; there is no version of this library where that value is
  overridable.

So redefining `--bb-container-narrow` moves every width measured against it and
leaves the breakpoints where they were. That asymmetry is worth knowing before
relying on either half, and it is the reason this is written out rather than
summarised as "injectable".

### 4.1 Narrow to wide, always

Container queries are written **starting from the narrow layout** and widening
from there. Never the other way round.

This is not a stylistic preference: it is what makes failure harmless. If for
any reason a query does not apply, the component stays in its narrow version,
which is usable at any width. Written the other way round, the same failure
leaves a wide layout crammed into a narrow slot, which does break.

### 4.2 No polyfill

**Decision: the library ships no container query polyfill.** Reasons:

1. Support in self-updating browsers has been settled for years, and the
   consumers are management applications with professional users, not public
   websites on old devices.
2. A polyfill is JavaScript observing the DOM at runtime, with a cost and with
   known limitations on dynamic content. Including it imposes it on every
   project, including the ones that do not need it.
3. With rule 4.1 and N0 done properly, missing support degrades gracefully: an
   optimal layout is lost, not functionality.

If a particular project needed to support an old browser, **that project loads
the polyfill**: it is global, installed once in the application, and works the
same. There is no reason for it to travel inside the package.

### 4.3 Who declares the container

A container query asks the nearest ancestor that has **declared itself a query
container**. If nothing has, nothing matches — and by rule 4.1 the component
simply stays narrow, which is why the failure is harmless rather than broken.

But it also means the scale above is inert until something declares one.
**`Card` does** ([decision 0010](../decisions/0010-the-card-declares-the-container.md)),
which is what makes N2 usable by default for anything placed inside one. The
decision records the two side effects that come with it, because they apply to
every Card whether or not a query is ever written.

A consumer can declare containers of their own, anywhere, and the library's
components will query them correctly. What the library does not do is require
it.

**And there is a limit on who MAY declare one, which is mechanical rather than
stylistic:**

> A component declares a container only if it declares a width.

`container-type: inline-size` applies inline-axis size containment, which means
the element's inline size is computed as though it had no contents. An element
whose width is declared — a Card filling its parent, a dialog at
`--container-medium`, a drawer at `w-full` plus a maximum — does not care. An
element **sized by its contents** collapses to its borders.

This is not a new discovery. It is
[decision 0010](../decisions/0010-the-card-declares-the-container.md)'s
consequence 1, "the Card does not shrink-wrap", which also predicted how it
would be met: "this produces no error — it looks wrong, which is the harder
kind to trace". It was met on 2026-09-08, on the shared layer panel, and the
prediction was accurate to the word: an anchored popover is absolutely
positioned with `width: auto`, so its width is shrink-to-fit, and with
containment on that element every popover in the catalog rendered **2px wide**
and 343px tall — one character per line — with nothing in any console.

Two things follow, and both are the reason this is written in a foundation
rather than in a component.

- **There is no third state to reach for.** `width: max-content` does not
  rescue a contained element, because containment is what makes `max-content`
  zero. The choice is binary: sized by content, or a query container.
- **A ceiling is not a measurement of a width.** Two browser checks written to
  guard the panel's width passed throughout — "no wider than the medium
  container" is satisfied by 2px. Both now assert a floor as well
  ([doc 10](./10-quality-and-verification.md) on checks that are green while
  checking nothing).

## 5. The one legitimate viewport exception

There is one, and it deserves to be written down because it is not arbitrary:
**components rendered in a portal** — dialog, drawer, menu, popover. Their real
container _is_ the window, so querying the window is not cheating: it is
correct.

The typical, permitted example: a dialog that becomes full-screen, or behaves
like a bottom sheet, in a narrow window. Available height counts too, deciding
whether a dropdown opens upward or downward — though the headless base normally
handles that already.

Outside portals, no other exception is accepted without being written down in
the component itself, with the reason.

## 6. Structural changes (N3)

These count as structural, and only then is JavaScript permitted:

- a table that becomes a list of cards when narrow
- tabs that become a select when narrow
- a toolbar that collapses into a menu

Rules for these cases:

1. **One single hook** for the whole library. Never hand-written thresholds
   inside a component; never two implementations.
2. **The scale is the one from section 4**, injectable, not literal numbers.
3. **No visual jump on first render.** The component must decide its structure
   before painting, or paint something neutral; never show one structure and
   swap it 50 ms later.
4. **State survives the structural change.** If the person had three rows
   selected and the table becomes cards, they stay selected. This is tested
   explicitly: it is what breaks most often.

## 7. Overflow is solved by whoever causes it

- The component that produces wide content (table, code block, diagram)
  **encloses its own horizontal scrolling**.
- The consumer's page **never** scrolls horizontally because of a library
  component.
- Every scrollable container is reachable by keyboard, and does not trap the
  page's scroll.
- When content is hidden by overflow, it is indicated visually. Invisible
  scrolling is lost content.

## 8. Pointer and touch: a different axis

Container size says nothing about how the person interacts. A wide container
may be on a touch screen.

- Nothing depends **only** on hover. Everything that opens on hover has to open
  on press and by keyboard too.
- The minimum hit area is respected at every density, compact included.
- Pointer capability is queried as such, never inferred from width.

## 9. What is not responsive

- **Density is not** (doc 03). A narrow container does not compact itself:
  density is a preference, not a consequence of space. They are different axes
  and they are tested in combination.
- **Zoom is not.** The interface must work at 200% zoom and with the browser's
  font size increased. Practical consequence: measurements tied to text go in
  relative units, not fixed pixels. This is accessibility, and it is the first
  thing that breaks when someone fixes heights in pixels.

## 10. Verification

The main test is **not** narrowing the window. It is narrowing the
**container** with the window wide — which is the real situation of a consumer.

- [ ] The component looks correct in containers of ~320, ~480, ~768 and
      ~1024px, with the window at 1920
- [ ] No physical measurement (left/right) — checked in RTL
- [ ] At 200% zoom nothing overlaps or is cut off
- [ ] At compact density the hit area is still sufficient
- [ ] If it changes structure: state is preserved across the threshold, and
      there is no jump on first render
- [ ] If it overflows: the scrolling is inside the component and reachable by
      keyboard
- [ ] Nothing depends exclusively on hover

The visual catalog must allow **resizing the container** of each component.
Without that, half of these boxes cannot be checked and the document becomes
decorative.

## 11. Open list

Which components need N3 (a structural change). Completed as they are built;
today it is a forecast, not a commitment:

| Component         | Expected change                                                                  |
| ----------------- | -------------------------------------------------------------------------------- |
| Data table        | Rows to cards in a narrow container                                              |
| Tabs              | To a select when they do not fit                                                 |
| Dialog            | To full-screen or a bottom sheet in a narrow window (the exception in section 5) |
| Toolbar / actions | Collapse into a menu                                                             |
| Pagination        | Reduce to previous/next                                                          |

Everything else is solved at N0, N1 or N2 barring proof to the contrary.
