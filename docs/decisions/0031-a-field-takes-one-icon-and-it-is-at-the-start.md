# 0031 · A field takes one icon, and it is at the start

**Date:** 2026-09-13
**Status:** accepted

## The question

Can a field carry an icon, and where?

It was asked while going through the fields one by one, and the honest answer
at the time was that only two of them could carry anything at all: `TextField`
and `NumberField` expose `prefix` and `suffix`, which are text affixes for a
unit or a symbol. Everything else had nothing.

## What made it not obvious

Three things already written said no, or nearly.

**Hard rule 9 says there is no `iconStart` prop.** Read literally it forbids
this outright.

**Doc 07 §2.2 gives a field's trailing edge to one thing at a time**, ordered
by precedence, and six of the seven fields already own that edge — a clear
cross, the stepper, the reveal toggle, a chevron. An icon there is an eighth
contender for a space that is already short.

**And the affix slot does not size what arrives in it.** Measured: an `<svg>`
carrying only a `viewBox` renders at **0×0** in a field's affix, because the
slot sets no dimensions and such an element has no intrinsic size. So even
where a slot existed, an icon put into it was invisible. That is the trap
`Avatar` is written up for, arriving a second time.

## The decision

**One `icon` prop, at the START, on the six fields whose box is a frame.**

`TextField`, `NumberField`, `SearchField`, `PasswordField`, `Select` and
`ComboBox`. It renders between any control the field owns at that edge and the
affix — `[control] [icon] [affix] [value]` — hidden from assistive technology,
sized and coloured by the slot.

### Why this is not what rule 9 forbids

Rule 9 is about two things: a library that ships an icon set and resolves a
string against it, and a pair of positional props where ordering children would
have done the job. Neither applies. The icon arrives as a node the consumer
wrote, and **a field has no children slot** — its child is its value. Doc 02
§11's own sentence covers it: a named slot is for a place the consumer could
not have reached by ordering children. Rule 9 now says so.

### Why there is no trailing icon

Because it would be a prop that appears and disappears with the configuration.
`SearchField`, `PasswordField`, `Select` and `ComboBox` own that edge
permanently; `TextField` and `NumberField` own it whenever a cross or a stepper
is asked for, and always while busy. A slot whose contents vanish when an
unrelated prop is set is worse than no slot.

### Why there is none on `TextArea`

That field's control **is** its box — `CONTROL_BOX` is on the `<textarea>`
element, where every other field draws it on a frame around the control. An
icon beside it means moving the box out to a wrapper, which is exactly the move
`ControlFrame` exists for, and the autosizing writes a measured height onto the
element that would stop being the box. `TextArea.css` already carries two
declarations that exist to stop something else fighting that measurement.

The cost is larger than the other six combined, and the case is weaker: where a
mark sits beside a block that grows is a decision nobody has needed to make.
Excluded, not deferred.

## What came with it

The affix slot sizes what arrives in it now. That was a defect independent of
this decision — a consumer passing an icon as a `prefix` got nothing on screen
and nothing in the console — and it is fixed in the same change.

## What this costs

A seventh contender at the leading edge if anything else ever wants to stand
there. Doc 07 §2.2b counts what is there now — the stepper and this — and
orders them, so the next one arrives at a table rather than at an argument.
