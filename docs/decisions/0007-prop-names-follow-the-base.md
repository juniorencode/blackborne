# 0007 · Prop names follow the headless base, not HTML

**Date:** 2026-09-03 · **Status:** accepted

## Context

React Aria Components names boolean props `isDisabled`, `isRequired`,
`isInvalid`, `isReadOnly`, `isSelected`, and its activation handler `onPress`.

HTML — and most of the ecosystem, including Radix, MUI and shadcn — uses
`disabled` and `onClick`. A newcomer to the library will expect those.

So the choice is between matching what people expect and matching what the
library is actually built on.

## Decision

**Prop names follow React Aria Components.**

`isDisabled`, `isRequired`, `isInvalid`, `isReadOnly`, `isSelected`, `onPress`.

## Consequences

- **New users are surprised once.** This is a genuine cost, and it is paid down
  by documenting it prominently in the getting-started guide rather than by
  pretending it does not exist.
- **Optional props can be forwarded by spread.** The repository sets
  `exactOptionalPropertyTypes`, which makes forwarding an optional prop _by
  name_ a type error — our value is `boolean | undefined` and the base's prop
  is `boolean?`. Spreading a rest object preserves optionality; renaming makes
  spreading impossible. Renaming would therefore mean a hand-written
  translation layer in every one of thirty-one components, each carrying that
  type friction, for no functional gain.
- **`onPress` is better, not merely consistent.** It handles mouse, touch, pen
  and keyboard uniformly. Doc 04 §8 requires that nothing depend only on the
  mouse; `onClick` would mean reimplementing that, worse.
- The library reads as one system. Half-matching HTML — `disabled` but
  `onPress`, or `isDisabled` but `onClick` — is worse than either choice made
  cleanly.

## Revisit when

The base changes its own conventions, or a second consumer reports the naming
as a real adoption obstacle rather than an initial surprise. Note that
revisiting means a major version: a prop name is API.
