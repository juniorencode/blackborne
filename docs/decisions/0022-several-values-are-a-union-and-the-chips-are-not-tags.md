# 0022 · Several values are a union, and the chips are not tags

**Date:** 2026-09-09 · **Status:** accepted

## Context

A combo box over a long list is the control a management screen reaches for
when somebody has to pick several things: the doctors on a rota, the columns in
a report, the tags on a record. The base supports it —
`selectionMode: 'multiple'` — and the first wave deliberately left it out,
because holding several values changes the SHAPE of the value rather than
adding a behaviour.

Three questions had to be answered, and all three were answered by measuring
the base rather than by choosing.

## Decision

**The props are a discriminated union.** One value or several, with the value
pair named for what it holds:

```tsx
<ComboBox label="Doctor" selectedKey={id} onSelectionChange={setId}>…</ComboBox>

<ComboBox
  label="Doctors"
  selectionMode="multiple"
  selectedKeys={ids}
  onSelectionChange={setIds}
>…</ComboBox>
```

**The chips are not the base's tags.** Each is a span with a button, inside the
same wrapping flow as the input, inside `ControlFrame`.

**And the value crosses to the base through `value`/`onChange`**, not through
`selectedKey`/`onSelectionChange`.

## Reasoning

### A union, not a boolean

The value is one id or a list of them, so a single prop set would have to
accept both and mean one — the impossible combination doc 02 §3 rejects
booleans for. Typed as a union, the wrong pairing fails where it is written:
`selectedKeys` on a field that holds one does not compile.

The precedent is `MenuItem`, which holds three shapes the same way. What is
**not** the precedent is
[decision 0014](./0014-cursor-pagination-is-its-own-component.md), which split
the two paginations into two components: those share no prop and disagree about
what a page is, where these share every prop but one and agree about everything
except how many answers are allowed.

**The cost is real and worth writing down**, because the component's own
stories paid it first: props typed as a union cannot be spread and then added
to, since `{...props} defaultSelectedKey="x"` has to satisfy the plural branch
as well. The way out is to name a branch, so both are exported. The cross
members are declared as `?: never` for the same reason — with them merely
absent, the error names the wrong prop.

### The chips cannot be tags, and this is the measurement

`TagsInput` builds its chips out of the base's `TagGroup`, `TagList` and `Tag`,
and gets the hard half of the accessibility for free: an arrow-key delegate
built from the locale, and `Delete` and `Backspace` on the focused chip. The
obvious move was to share that.

**A `TagGroup` inside a `ComboBox` does not work at all.** The combo box
publishes its own `ListStateContext` for its options, and `useTag` reads that
context to find its collection — so a chip inside one resolves the wrong
collection. Measured twice, two symptoms: with a dynamic `items` list the run
exhausted the heap, and with static children it threw from `useGridListItem`,
destructuring a row that does not exist.

**And the crosses could not be plain `Button`s either**, for the same class of
reason one level down: a combo box publishes a `ButtonContext` for its toggle,
and every `Button` in its subtree consumes it. Measured: three buttons on one
field, all wearing the toggle's id and name and ref, with the toggle's own name
ruined by the last chip's. `slot={null}` is the base's documented way out —
read in `useSlottedContext`, an explicit `null` takes no context at all — and
it is what keeps a cross a cross.

So each chip is a span, each cross is a `Button` with no context, and what is
lost is the arrow-key walk and `Delete` on a chip. Every cross is in the tab
order instead, named by element references — its own "Remove" and the value
beside it, in document order, rather than a glued string (doc 05 §2.2 rule 5).

**What is NOT lost is the announcement**, which looked like the expensive part.
`ComboBoxValue` renders the chosen values as text and the base points the
input's `aria-describedby` at it — measured — so a reader arriving at the field
hears them, alongside the field's own description. The chips are the same value
seen rather than heard.

**One more thing axe found that no assertion of ours would have.** While the
list is open, the base hides everything outside it from a reader, chips
included — so a cross that stayed in the tab order would be a control somebody
could reach and never be told about. The crosses are `inert` while the list is
open, and still visible, because taking their room away would re-wrap the chips
under the person's cursor.

### `value` and `onChange`, because the other pair is deprecated

Read in the installed types: `selectedKey`, `defaultSelectedKey` and
`onSelectionChange` are **`@deprecated`** on the base's combo box, replaced by
`value`, `defaultValue` and `onChange`. They still work for one value — the
first wave shipped on them — and they are **not called at all** when several
are allowed, which is how the deprecation was found rather than read.

The public vocabulary stays ours. Decision 0007 says prop names follow the
base, and here the base has two spellings for one thing and deprecates one of
them in one component and not the other: following it literally would mean a
select with a `selectedKey` beside a combo box with a `value`, for no reason a
consumer could guess.

## Consequences

- **The box grows**, so its height is a minimum rather than a height, and the
  wrapping happens inside `ControlFrame` rather than replacing it — which is
  what keeps the toggle at the trailing edge instead of dropping it onto a line
  of its own. `TagsInput` could not use the frame at all, because it has no
  edge control; this field has one, so it can.
- **The chip is shared with `TagsInput`** as `internal/Field/ValueChip` — the
  appearance and the removal target, not the element, since one caller can use
  a `Tag` and the other cannot. `TagsInput`'s own note asked for the extraction
  at the third cross, and its two visual baselines are byte-identical after it.
- **A chosen id with no option behind it keeps its own id as its chip.** It
  happens legitimately while the options are still arriving, and a chip that is
  not drawn is a value nobody can remove.
- **The base's `validate` is no longer forwarded.** It is a form-validation
  hook, and this library's answer is
  [decision 0005](./0005-validation-stays-in-the-project.md) — the project
  decides and passes `isInvalid` with a message. The type system is what made
  it visible: its argument carries the selection mode, so forwarding it pinned
  the generic to one value. ~~**The other fields still forward it**, silently,
  and that inconsistency is a row in the catalog rather than something this
  wave fixed on its way past.~~
  **Settled on 2026-09-10: they no longer forward it.** Measured before
  removing — ten fields published `validate`, `validationBehavior` travelled
  with it, and nothing in this repository used either. `internal/validationProps`
  names the pair and the ten refuse it. What this decision could not see is the
  CAUSE: those ten extend the base with an `Omit`, which is a blacklist, so the
  surface grows whenever the base does; every field built from `Calendar`
  onward uses `Pick` and none of them had the problem.
- ~~Doc 07 §2.2 rule 5's open question — emptying a whole set in one gesture —
  stays open, and is now narrower: every value has its own cross, so what is
  missing is the one gesture rather than the ability.~~
  **Closed on 2026-09-10, and the narrowing above is what closed it.** If the
  ability is there and only the gesture is missing, then rule 5's premise holds
  — clearing has a route costing no width — and so does its conclusion. And
  the gesture belongs to the FORM rather than to the field: somebody asking to
  clear everything means the six fields in front of them, which only the
  project knows. Doc 07 §2.2 rule 5 has the reasoning and what would reopen
  it.

## Revisit when

- The base gives a `TagGroup` its own collection context, or a combo box stops
  publishing `ListStateContext` to its whole subtree. Either one makes the
  chips tags again, and the arrow-key walk comes back with them.
- A screen has enough chips that tabbing through their crosses is the
  complaint. That is the arrow-key walk being asked for by name, and what is
  above is what would have to change.
