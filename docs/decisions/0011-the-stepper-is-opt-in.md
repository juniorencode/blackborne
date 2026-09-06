# 0011 · A numeric field has no stepper unless it is asked for

**Date:** 2026-09-06 · **Status:** accepted

## Context

`NumberField` shipped with its `+`/`−` buttons always present. That is the
convention almost everywhere, and it is the wrong default for the application
this library is for.

The buttons are not the way anybody enters a number. Someone typing a hundred
records a day types the number; the keyboard arrows already step it, and that
comes from the base rather than from the buttons. What the buttons do reliably
is take about 40px from the trailing edge of every numeric field on the screen,
in a form that is trying to be dense.

They are genuinely right in one place — a small bounded quantity, where two
clicks beat selecting a value and typing over it — and that place is not most
places.

## Decision

**The stepper is opt-in.** A `NumberField` renders no buttons by default and
gains them when asked.

This is a **breaking change** to a published component: a consumer on `0.2.0`
who relied on the buttons loses them on upgrade. That is permitted in the `0.x`
series and it is listed in the changelog with its migration, which is one prop.

## Reasoning

**Nothing is lost by removing them.** The field keeps `role="spinbutton"`, the
up and down arrows keep stepping by `step`, Page Up and Page Down keep making
larger jumps, and the value keeps being announced. The buttons are a second
route to a capability that already has one — unlike, say, a password reveal
toggle, whose removal takes the capability with it
([doc 07](../foundations/07-forms.md) §2.2, point 2).

**The default is what most screens get.** A default that is wrong for the
common case is paid for by every consumer who does not know there is a prop; a
default that is wrong for the rare case is paid for by the one who needs it,
once, deliberately.

**And the trailing edge is contested.** Doc 07 §2.2 counts six things that want
that space and settles that at most one library-owned control may hold it. A
stepper that is always there wins that space by default in every numeric field,
including the ones that would rather have a clear button or a unit suffix.

## Consequences

- A numeric field and a text field of the same size now have the same usable
  width, which they did not before. The catalog's alignment check compares
  heights; this is the same family of drift on the other axis.
- The prop is a boolean, and by [doc 02](../foundations/02-api-conventions.md)
  §1 a boolean here is named `is…`. It turns something **on**, so a positive
  name is correct rather than an `isStepperHidden` that has to be read twice.
- The catalog carries a story with the stepper shown and hidden side by side,
  because "the buttons are gone" is the kind of change a consumer reads as a
  regression until they see it was chosen.

## Revisit when

A screen appears where the stepper is the primary way people enter the value —
a quantity in a cart-like row, a rating. That is an argument for the prop being
used, not for the default changing back.
