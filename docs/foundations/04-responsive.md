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

**Date:** 2026-09-10 — **and this section had no caller in JavaScript until
now.** `Dialog` answers its viewport question in plain CSS, which is what a
presentational change should do. `DateRangePicker` cannot: how many months its
calendar builds is a PROP of the base's state, because paging and the range's
arithmetic are computed from the visible duration, and CSS cannot set a prop.
Hiding the second month would leave the state believing in a month nobody can
see.

So it reads the window, and three things bound that:

- **One door.** `internal/useWindowFits` is the only place allowed to ask, and
  the project's own lint rule now names `matchMedia` so that reaching for it
  elsewhere is an error rather than an oversight. The rule got STRICTER on the
  way — `matchMedia` was previously reachable without writing `window`, so a
  component could query the viewport and pass lint while doing exactly what the
  rule is about.
- **The number is the component's, not the scale's.** `Dialog.css` settled the
  wording and it is repeated in `DateRangePicker`: the container scale
  "describes how wide a CONTAINER is, not when a window has run out of room."
  Tying them together would make one unchangeable without the other.
- **The first answer is the narrow one.** `matchMedia` is read in an effect,
  so a server and a first paint both get one month — §4.1's rule arriving
  through the same door `useContainerStep` uses.

And it is the exception's own justification made concrete: a range calendar
inside a popover CANNOT read a container, because inline-size containment
computes an element's width as though it had no contents and the layer is
sized by what is in it (§4.3). The catalog predicted this component would be
the exception before either half of it existed.

## 6. Structural changes (N3)

These count as structural, and only then is JavaScript permitted:

- a table that becomes a list of cards when narrow — **and this one turned out
  not to be; see [§6.3](#63-the-example-this-section-was-written-around-is-not-one)**
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

### 6.1 The contract of that hook, written before it exists

**Date:** 2026-09-08. The hook does not exist. `Tabs`, `Pagination` and `Steps`
all want it, and it is written down first because a shared hook designed while
its first caller is being written becomes that caller's hook with a shared
name.

**It measures the element, not the window.** P4, and the only mechanism that
does that is observing the component's own root. That is JavaScript watching
the DOM, which [decision 0006](../decisions/0006-no-container-query-polyfill.md)
declined to ship — and the difference is scope, not principle: one observer
inside one component that asked for it, against a global observer standing
behind every query on the page whether it is needed or not.

**Its vocabulary is the CSS one.** It answers with the same step names the
container variants use, so a component that is N2 in one place and N3 in
another does not end up with two ways of saying "narrow". This is §4's scale
and doc 02 §3.1's rule about one vocabulary, applied to the JavaScript half.

**Before the first measurement the answer is the narrowest step.** An observer
reports after layout, so the first render has nothing to measure — and rule 3
forbids painting one structure and swapping it. §4.1 already establishes that
the narrow layout is the one that is safe at any width, so the two rules
combine into something mechanical rather than a judgement call: paint narrow,
widen when measured. A component that paints its wide structure first and
corrects itself is precisely the jump rule 3 names.

**State lives above the structure, not inside it.** Rule 4 is not met by
remembering to lift state; it is met by the structure holding none. Concretely,
for the first caller: a tab list cannot own the selected tab, because the tab
list is the thing that disappears. So a component that changes structure is
internally controlled, with doc 02 §8's uncontrolled shortcut over the top.

**And it is internal.** [Decision 0012](../decisions/0012-growing-is-a-prop-not-a-public-hook.md)
is the precedent: P6 asks that logic be testable without rendering, not that
every hook be exported. A public one would let a consumer decide our
components' structure from outside, and non-goal 10 leaves no hole of that
shape.

#### The prediction about injectability

§4.0 measured that a query threshold cannot honour a redefined token, because a
container query's condition may not contain `var()`. **The JavaScript half has
no such limit**, since a hook can resolve the token from the very element it is
already measuring.

Recorded before the hook exists, so that it counts:

- ~~**Predicted:** resolving `--bb-container-narrow` from the observed element
  will work, and will make the JavaScript thresholds follow a consumer's
  redefinition. The result is the mirror image of §4.0's asymmetry — there the
  widths follow the token and the breakpoints cannot; here both would.~~
- ~~**Not predicted, and to be measured:** what it costs, and what happens
  when the token resolves to an empty string because the stylesheet has not
  arrived yet. If either goes badly the fallback is §4's literal, with the
  reason written here.~~

The prediction is kept whichever way it turns out. Doc 08 §6.1 is the
precedent, and the reason is the same: a prediction recorded after the
measurement is worth nothing.

**Withdrawn on 2026-09-08. The hook does not resolve the token at all.** See
§6.2.

### 6.2 What the hook turned out to be

**Date:** 2026-09-08, with `Pagination`, the first component in the library
whose structure depends on its width.

§6.1 assumed the hook would measure a width in JavaScript and compare it
against a threshold, and asked only whether the threshold could be injectable.
Both halves of that were wrong, because the question has a better answer:
**CSS can say which step applies, and JavaScript can read the answer.**

The caller declares a query container and gives the element it observes four
classes, generated from the scale by the same variants a component would use
at N2:

```
bb:[--bb-step:base]            bb:@narrow:[--bb-step:narrow]
bb:@medium:[--bb-step:medium]  bb:@wide:[--bb-step:wide]
```

The hook reads the resolved value of `--bb-step` and re-reads it when a
`ResizeObserver` says the element changed size. Three things follow, and all
three are better than the plan:

- **There is one set of thresholds, and it is the CSS one.** The alternative
  had two — a CSS copy and a JavaScript copy — which is doc 01 §7's two ways
  to do one thing, in the one place where they must agree exactly or a
  component's layout and its structure disagree at one width.
- **No unit conversion, and no reading the document.** A token resolves to
  `24rem`, and turning that into pixels needs the root font size. P3 keeps
  this library out of the document, and this removes the reason to go there.
- **Failure stays harmless.** Where there is no container query support, or no
  `ResizeObserver`, or no layout at all — a server, and jsdom — the value is
  never reassigned and the answer is `base` forever. That is §4.1 arriving on
  its own rather than being remembered.

So §4.0's asymmetry does not reverse: **it disappears**, because there is only
one mechanism left to be asymmetric about. A consumer redefining
`--bb-container-narrow` still moves every width measured against it and still
leaves every threshold where it was — in the queries, and now in the
structural decisions those queries drive.

**And the floor is checkable in jsdom**, which is the part worth having. The
answer there is `base`, which is exactly what a real browser's first paint
renders — so "start narrow, widen once measured" is asserted in unit tests
that cost milliseconds, and only what happens after that first frame needs a
browser.

### 6.3 The example this section was written around is not one

**Date:** 2026-09-12. §6's list of structural changes opens with "a table that
becomes a list of cards when narrow", and the table suite's wave 5 is that
example being built. It needs no JavaScript, no hook and no threshold outside
the scale — it is **N2**.

The section is not withdrawn. Tabs that become a select and a toolbar that
collapses into a menu are still structural, and for a reason this case turns
out to isolate: in both of them the control that disappears **owns something**
— which tab is chosen, which commands the menu holds — so the two structures
cannot share one tree. A table's rows do not. The collection, the roles, the
selection and the keyboard belong to the table, and the row is only how they
are laid out.

**Measured on the component**, with `display` changed on the table, the rows
and the cells and nothing else touched:

|           | as a table                                   | as cards     |
| --------- | -------------------------------------------- | ------------ |
| roles     | `grid` / `row` / `rowheader`                 | identical    |
| counted   | 5 rows, 20 cells                             | identical    |
| selection | chosen                                       | still chosen |
| keyboard  | ArrowRight, ArrowDown, ArrowUp walk the grid | identical    |

The base writes its ARIA roles explicitly rather than leaning on the tag, so a
`td` that stops laying out as a table cell is still a `gridcell`. That is what
makes the whole change presentational.

**So rule 4 is met differently, and better.** §6.1 says state survives a
structural change by living above the structure; here it survives because there
is no second structure for it to fall out of. The test §6 asks for — three rows
chosen, the table becomes cards, they stay chosen — cannot fail by
construction. It is still written, because what makes it true is a property of
this implementation and the next one might not have it.

**And rule 3 is met for free.** There is no first-paint jump to avoid, because
CSS resolves before the first paint and no measurement is waited on. The
narrow-first ordering §4.1 asks for is the class list's own default: the card
values are the defaults and the table values are what the query restores, so a
stylesheet arriving before any layout already describes the structure that is
safe at any width.

#### What the test is, for the next case

Not "does it look different" — both levels do. The question is **whether the
two layouts can share one tree**. If the thing that disappears holds state,
holds focus, or is the only route to a capability, it is N3 and the hook
applies. If it is the same nodes in a different arrangement, it is N2 and
JavaScript has nothing to decide.

One caution that came with it, because it is the cost of staying at N2. A
container query cannot name its threshold with a token — §4.0 — so a
stylesheet that gates on one has to spell the number, which is the copy that
can disagree with the scale. The gate therefore belongs in a utility on an
element inside the container, publishing what the declarations read. Two
consequences follow and both were paid for: the element that declares the
container cannot be gated by it, so anything painted on the scroller itself
stays at every width; and a custom property inherits DOWNWARD only, so the gate
has to sit above everything it switches.

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

Which components need N3 (a structural change). Completed as they are built,
which is why one row below is a correction and not a forecast:

| Component         | Expected change                                                 | State                |
| ----------------- | --------------------------------------------------------------- | -------------------- |
| Data table        | Rows to cards in a narrow container                             | Forecast             |
| Tabs              | To a select when they do not fit                                | **Done** · §11.1     |
| Dialog            | To full-screen in a narrow window                               | **Done, and not N3** |
| Toolbar / actions | Collapse into a menu                                            | Forecast             |
| Pagination        | Fewer page slots as the width falls, previous/next as the floor | **Done** · §6.2      |
| Breadcrumbs       | The middle collapses into a menu                                | **Done** · §11.2     |
| Steps             | To the indicators alone, scrolling                              | **Done** · §11.4     |
| RangeCalendar     | Two months where there is room, one where there is not          | **Done** · §11.3     |

**Dialog turned out not to need JavaScript.** It is a media query and the §5
exception: same threshold, same outcome, no different tree to mount. Worth
leaving in the table with that written on it, because the row is what the
prediction looked like before the component existed and §2's warning is exactly
about reaching for N3 out of habit.

**Pagination's row is corrected rather than kept.** It read "reduce to
previous/next", which is one point on the axis rather than the axis: the number
of page slots comes from the available width, and previous/next is where that
count bottoms out. Both halves of the original row survive — the floor is still
the floor — and neither is a literal number in a component (rule 2).

### 11.1 What Tabs turned out to need

**Two structures, and the boundary is a step rather than a measurement.** A
select below `medium`, a row of tabs from it up. The row is what the catalog
predicted; the boundary is the part that had to be decided, because "when they
do not fit" is not a question a container query can answer — CSS counts pixels
and cannot know whether these particular words fit.

So the component answers a narrower question honestly: below the medium step
there is no room for several labels side by side, whatever they say. The
alternative was measuring the row's own scroll width in JavaScript, which is a
second set of thresholds inside a component, and §6 rule 1 forbids exactly
that.

**Which leaves a gap, and it is filled at N1: the row wraps.** Eight long
titles in a wide container still overflow, and §7 is blunt about what overflow
costs — so wrapping is the floor underneath the structural change, needing no
measurement and holding at any width. A component at N3 does not stop needing
N1.

**And the element the step is read from has to outlive both structures.** Read
it from the control that changes and the observer is left watching a detached
node; a detached node reports a width of zero, which chooses the narrow
structure, which detaches the next control. A component flickering between two
structures at one width, forever. `Tabs` observes a header box that holds
whichever control applies, and the browser check watches one width for half a
second to prove it settles. This is the trap to hand to the next N3 component:
it is not obvious, and damping it is not a fix.

Rule 4 held, and by construction rather than by care — the selected tab is kept
above the choice of structure, so the structure cannot lose it. It is asserted
anyway, because the rule says this is what breaks most often: the check resizes
the window across the boundary and back.

### 11.2 What the collapsed trail turned out to need

**The forecast was right, which is worth recording because two other rows were
not.** "The middle collapses into a menu" is what got built, at the same
boundary `Tabs` uses — folded below `medium`, whole from it up — and taking the
same boundary rather than choosing a second one is the point: both components
are a line of labels whose length nobody can predict, and one scale with one
boundary is what stops two of them disagreeing about "narrow" at the width
where it matters.

What the row did not say is the two rules that stop a collapse making things
worse, and both live in a pure function rather than in a render:

- **The "…" never hides one step.** Folding a single step replaces something
  you can read with something you have to open. `Pagination` reached this rule
  from the other direction — a gap never hides one page — so it is now one rule
  applied twice rather than two that happen to agree.
- **The two ends are never folded.** The first is the way home and the last is
  where you are, which are the two reasons a trail is on the screen at all.

**And it wraps as well**, which makes this the third component to need both
levels at once: below the boundary the middle folds, and a trail with no middle
to fold — two long steps — still has to go somewhere at 320px. A component at
N3 does not stop needing N1, and by now that is a pattern rather than an
observation.

The state question is different here, and was worth checking for a reason that
is not obvious. A trail holds no selection, so what has to survive the change
is the MARKING of the current step — and that is not free: the base marks the
last step of its own collection, and folding changes what the collection
contains. Measured across the boundary and back.

**And it is the row that got built.** Three structures rather than four: no
numbers below the narrow step, five at it, seven from medium up. `wide` is
deliberately not a fourth behaviour — seven numbers and two ends fit
comfortably from medium onward, and a nine-number row would be a step nobody
asked for on a scale §4 keeps deliberately short. The check that matters is
three of the same component at three widths inside one 1280px window, which is
P4's own question asked of the thing that decides.

### 11.3 What the range calendar turned out to need

**The other half of §11.1's rule, and it cost an afternoon.** That section
hands the next component a trap: the element the step is read from must OUTLIVE
both structures, or the observer ends up watching a detached node. True, and
not sufficient.

> The observed element must also CHANGE SIZE with the container.

A calendar is sized by its own contents — that is what a month is — so its box
is `fit-content`, and `fit-content` cannot go below its own min-content.
Measured: a two-month range calendar is **408px wide in a 640px container and
408px wide in a 320px one**. The element satisfies §11.1 perfectly, never
resizes, and the `ResizeObserver` therefore never fires: the step is read once
on mount and never again, so the structure simply does not change. Nothing
errors, nothing warns, and the component looks like it ignores its container.

**So a structural component that is sized by its contents is two elements.** A
full-width frame carries the container-step classes and is what gets observed;
the body inside it is sized by its contents, with `items-start` to stop the
frame stretching it. The frame paints nothing, and the picture is identical.

That generalises past this component: anything at N3 whose natural width is its
content's — a toolbar collapsing into a menu, a row of steps — needs the same
arrangement. The rule to carry forward is that **the observed element must
track the container, not the content.**

**Two months from `medium`, and the boundary is measured rather than chosen.**
Two months of grid measure 408px; the scale's `narrow` step is 384px, so two
months do not fit there, and `medium` at 480px is the first step with room.
`Tabs` and the folded trail use the same boundary for reasons of their own,
which is §4's point about one scale rather than three.

**The arrows step ONE month, whatever the structure.** The base's default is to
advance by the whole visible duration, which would mean the same press moving
one month in a panel and two in a page. A control whose meaning changes with
the width is what rule 4 is about, read forward instead of backward: the state
has to survive the change, and so does the behaviour.

Rule 4 itself held, and it is asserted across the boundary and back: the eight
days of a chosen range are the same eight at 640px, at 320px, and at 640px
again.

### 11.4 What the steps row turned out to need

**The forecast was half right, which is the interesting half.** The row read
"to the indicators alone, scrolling". The indicators alone is exactly what
landed; the scrolling was never needed — measured, four indicators and three
24px connectors occupy well under 320px, so there is nothing to scroll and a
scroll container would have been a mechanism with no job. Recorded rather than
quietly dropped, because a forecast that predicted a fallback nobody needed is
worth as much as one that was wrong outright.

**The fourth caller of the hook, and it needed nothing new.** That is the point
worth making after §11.1 and §11.3 each added a rule: the observed element is
the root, which is `w-full` and therefore tracks the container (§11.3's
addition), it outlives both structures (§11.1's), and the answer travels DOWN
to the steps through a data attribute and a selector rather than a second
context. Three levels of the hierarchy and one hook, which is what §6 asked
for.

**And the thing it got wrong first was not responsive at all.** The narrow
structure hid the titles with `display: none`, which takes them out of the
accessibility tree — a list of four items with no names in it at 320px. Rule 4
is what applies: what a component knows must survive the structure changing,
and a name is the most basic thing it knows. Nothing in `Steps` is focusable,
so `sr-only` costs a reader nothing and `display: none` costs them everything.

**And a joined row is N0 because it CANNOT be anything else.** `ButtonGroup`
pulls its buttons together so that one border does the work of two, and a row
that wrapped would show squared corners in mid-air where the joint used to be.
There is no structure for it to change into and no threshold to pick: what
survives a container too narrow for its actions is the toolbar that collapses
into a menu, which is its own row in the table above. Recorded here because
"joins a row of things" looks like an N3 candidate and is the opposite of one.

Everything else is solved at N0, N1 or N2 barring proof to the contrary. Six
components examined in the batch that produced the rows above need nothing at
all: `Accordion`, `Collapsible`, `Link` and `CursorPagination` are all N0, and
the two anchored layers in the middle of that batch are N1 — a `Menu`'s panel
and a `Select`'s list are sized by their contents between a floor and a
ceiling, with no threshold anywhere. The select's floor is the interesting one,
because it is the width of its own trigger rather than a number: a list
narrower than the field it belongs to reads as a different control, and one
that truncated every row to the field's width would hide the ends of the very
options somebody opened it to read. Recorded because the interesting half of
this list is what is not on it.
