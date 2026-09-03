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

The scale is **short** (three or four steps) and **injectable**: a project can
redefine the thresholds the same way it redefines tokens. Every additional step
multiplies the test matrix, so they are justified one at a time.

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
