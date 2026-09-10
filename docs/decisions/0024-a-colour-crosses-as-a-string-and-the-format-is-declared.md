# 0024 · A colour crosses as a string, and the format is declared

**Date:** 2026-09-10 · **Status:** accepted

## Context

[The catalog](../catalog-and-build-order.md) §3.3 has three colour components
coming: a closed palette, a full picker with an area and sliders, and possibly
a field for typing one. All three rest on the base's colour layer, which speaks
a `Color` object from `@react-stately/color` — parsed by `parseColor`, reported
by `onChange`, and carrying a colour space, four channels and an alpha.

So the question [decision 0020](./0020-a-date-crosses-the-boundary-as-a-string.md)
answered for dates arrives again for colours, and it has to be answered before
any of the three exists:

```tsx
<ColorPicker value={parseColor('#3e63dd')} />   // the base's object
<ColorPicker value="#3e63dd" />                 // a string
```

Decision 0020 settles the first half by precedent: **the base's own types stay
out of a consumer's signatures**, so a colour crosses as a string. What is new
here is the second half, and it is new because a colour has something a date
does not — **more than one correct way to write the same value.**

## What was measured

`parseColor` and `Color.toString` in the version installed (the base's
`react-stately` 3.50.0), with the results written out because every one of them
shapes the decision:

| Input                | `toString()`                       | `toString('hex')` | `toString('rgb')`  |
| -------------------- | ---------------------------------- | ----------------- | ------------------ |
| `#3e63dd`            | `rgba(62, 99, 221, 1)`             | `#3E63DD`         | `rgb(62, 99, 221)` |
| `rgb(62, 99, 221)`   | `rgba(62, 99, 221, 1)`             | `#3E63DD`         | `rgb(62, 99, 221)` |
| `hsl(226, 70%, 55%)` | `hsla(226, 70%, 55%, 1)`           | `#3C61DD`         | `rgb(60, 97, 221)` |
| `#3e63dd80`          | `rgba(62, 99, 221, 0.5019607843…)` | `#3E63DD`         | `rgb(62, 99, 221)` |

Five things follow from that table.

1. **`toString()` with no argument is not the input format.** A consumer who
   writes `#3e63dd` and reads back `rgba(62, 99, 221, 1)` has a different
   string in their database from the one they put in.
2. **The colour space does not distinguish hex from rgb.**
   `getColorSpace()` answers `rgb` for both, so "report it the way it arrived"
   cannot be implemented by asking the value what it is.
3. **`toString('hex')` uppercases.** `#3e63dd` comes back `#3E63DD`, so even
   naming the format does not round-trip an author's string exactly.
4. **`hex` silently drops the alpha.** `#3e63dd80` becomes `#3E63DD`, which is
   data loss with no error anywhere. `hexa` keeps it.
5. **An 8-digit hex does not convert to a round alpha.** `80` becomes
   `0.5019607843137255`, so an rgba round-trip of a hex value is long and ugly
   rather than wrong.

And one more, about failure: **`parseColor` throws** on a value it cannot read
(`Error: Invalid color value: nope`).

## Decision

**A colour crosses as a string, and the format is declared rather than
guessed.**

1. **In:** any string `parseColor` reads — hex, 8-digit hex, `rgb()`, `rgba()`,
   `hsl()`, `hsla()`, `hsb()`.
2. **Out:** a string in the format the component was told to report, from a
   closed set: `hex | hexa | rgb | rgba | hsl | hsla`.
3. **The default is `hex`**, because a colour stored by a management
   application is a hex string in a database far more often than anything else,
   and because it is the shortest thing a person recognises.
4. **A format that cannot carry the value warns in development.** Reporting a
   colour with alpha as `hex` loses it, and measurement 4 above is why that
   cannot be left to the reader of a table.
5. **A value it cannot read renders as though nothing were given**, and says so
   in development. The same contract `parseDay` and `parseClock` have, and
   deliberately the same words: a component that throws over a malformed prop
   takes a screen down for a developer's typo.

### The exception, and it is the cheap half

**A component whose answer is one of its own inputs reports that input
verbatim**, and needs no format at all.

A closed palette is the case: the consumer declares `['#3e63dd', '#e5484d']`
and the value can only ever be one of those two strings. The base keys each
swatch by `color.toString('hexa')` — read in its source — so the chosen colour
can be matched back to the declared string exactly, and a consumer gets back
the string they wrote, in their case, in their format.

So `ColorSwatchField` has no `format` prop. `ColorPicker` will, because a value
dragged out of a two-dimensional area was never one of its inputs.

## Consequences

- **Two components, two behaviours, and that is honest rather than
  inconsistent.** One can be exact because the answer is one of the inputs; the
  other cannot. Documented on both.
- **A palette is data, so it is a prop.** `colors: readonly string[]` rather
  than children — the same reading `useAsyncOptions` and the catalogue fields
  got, where what looked like composition turned out to be a list. It is also
  what makes the verbatim report above possible at all: children would have to
  be READ to know what was declared, which is the constraint
  [decision 0018](./0018-a-tab-declares-its-own-panel.md) records.
- **The swatch names come from the base's dictionary, not ours.** `useColorSwatch`
  names each swatch with `color.getColorName(locale)` — "dark blue" in English,
  localised by the platform — and adds an `aria-roledescription` of "color
  swatch" from `@react-aria/color`'s own strings. Doc 05 §2.3's list of strings
  our dictionary cannot reach grows by two, and neither is worth reimplementing:
  naming ten thousand colours in every language is not a job for a component
  library.
- **`@react-stately/color` is not a new dependency.** `parseColor` is
  re-exported by `react-aria-components`, which is already declared and pinned,
  so nothing is added to the tree and nothing reaches past a public entry point
  (the project's own lint rule).

## Alternatives

**Report the input format by inspecting the value.** Measurement 2 kills it:
hex and rgb are the same colour space, so the value does not know how it was
written. A component would have to remember the string it was given, which
works only while it is controlled and fails the moment a consumer stops passing
one.

**Always report `toString()`.** Lossless and consistent — and it turns
`#3e63dd` into `rgba(62, 99, 221, 1)` for every consumer who only ever wanted
hex, which is most of them.

**Cross as the base's `Color`.** Rejected by 0020's own argument, and worse
here: `Color` is an interface with methods, so a consumer storing one would be
storing something they cannot serialise.
