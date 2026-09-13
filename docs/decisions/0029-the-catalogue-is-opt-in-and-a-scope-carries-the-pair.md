# 0029 — The catalogue is opt-in, and a scope carries the pair

**Status:** accepted · **Date:** 2026-09-13

## Context

[Decision 0028](./0028-the-palette-is-ours-and-what-it-guarantees.md) made the
palette ours: twenty-five families, twelve steps, two modes, as data in this
repository. Six of them fill the library's six roles and the other nineteen
were not shipped at all.

That leaves the brand axis where it has always been. Doc 03 §7 level 1 says a
project overrides the brand scale — which means **writing twenty-four values
with the step roles §1.1 describes**, by hand, per mode. It is real work, and
the level's own history is of it being done badly: five hand-written copies of
one override in this repository's own catalog had drifted apart, three of them
missing steps, and every missing step fell back to the library's brand while
looking deliberate.

What a project usually wants is smaller than that. Its brand is red, or violet,
or teal, and it wants the accent to be that.

## Decision

**The whole palette ships as a second stylesheet, and importing it is opt in.**

```
import 'blackborne/styles.css';
import 'blackborne/palette.css';   /* in this order */
```

```
<div data-bb-accent="red">    everything accent-coloured is red
<div data-bb-base="stone">    the greys are warm
```

**Two attributes, not one.** `data-bb-accent` replaces the brand family from
the eighteen accents; `data-bb-base` replaces the greys from the seven bases.
They are independent and compose.

**It is a second file because everything shipped is paid for by everyone.** The
one stylesheet is 77 kB against an 80 kB raw ceiling and 11.8 kB against a
13 kB gzip one; the catalogue is 36 kB raw and 5.4 kB gzip on its own. A
project that never changes its accent should not carry eighteen it never uses,
so `styles.css` keeps the six families it is built from and this carries the
rest, with a weight ceiling of its own in the README.

**It is not a fourth axis.** It is the brand axis with the scales written for
you: the same mechanism doc 03 §3 describes, the same one the catalog's own
alternative brand has used by hand since the first component.

**The tone families do not follow the accent**, which is 0028's rule and is now
something a person can see: `Foundations/Palette` has a story whose whole
subject is the four tone badges being identical in every scope.

## And a scope carries the pair, which is most of the work

Doc 03 §4.0 has said since it was written that a background declares the text
that goes on it, and gives the reason in as many words: "when the brand theme
is a light color — yellow, lime, amber — the text on top has to be dark".

`--bb-accent-on` was the literal `#fff`. Correct for one brand, and the
semantic layer's own comment predicted the rest: "if the brand is overridden to
a lighter colour, --bb-accent-on has to change with it".

Eighteen accents is where that stops being hypothetical. White on each family's
solid step, measured:

| under 4.5:1 |      |        |      |
| ----------- | ---- | ------ | ---- |
| amber       | 3.12 | orange | 3.50 |
| cyan        | 3.68 | sky    | 4.07 |
| emerald     | 3.78 | teal   | 3.72 |
| green       | 3.28 | yellow | 2.89 |
| lime        | 3.08 |        |      |

**So a scope whose solid is a light colour declares its own text**, and which
one is a measurement rather than a judgement: whichever of white and the
family's own darkest step reads better on the solid. Step 9 is mode-invariant
by construction, so that is one choice per family rather than one per mode.

**And the interaction steps follow from the same choice.** A pair has to hold
in every state the background has, so hover and press move AWAY from the text's
lightness:

|                  | light     | dark      |
| ---------------- | --------- | --------- |
| white text       | 9, 10, 11 | 9, 8, 7   |
| the family's own | 9, 8, 7   | 9, 10, 11 |

With both in place, every one of the eighteen clears 4.5:1 at rest, hovered and
pressed, in both modes, with the exceptions named below.

## What this fixed in the default, which was not a catalogue problem

The dark half of the first row is the shipped brand's, and it was wrong. A
pressed primary button in dark mode was white on `#87b5ff` — **2.08:1** — and
hovered was 4.35:1, because `--bb-accent-active` was step 11 and a dark scale
runs dark-to-light, so step 11 there is the scale's low-contrast **text** step
being used as a **fill**.

Nothing had seen it. The catalog's states story is light-only, so a pressed
primary button in dark mode had never been photographed or measured, and axe
reads what is on a page. Down instead of up gives 5.14, 6.31, 9.31, and it
reads correctly as well — a button that recedes as it is pushed. **No baseline
moved**: all 211 came out identical.

A link takes the same treatment where it needs it. `--bb-link` is the solid
step in light, and against the page nine families are under 4.5:1 — amber 3.04,
yellow 2.82, sky 3.96 — so those scopes declare step 11, the scale's text step,
instead.

## What a consumer may rely on, and what they may not

**Guaranteed.** Every accent in the catalogue clears 4.5:1 between
`--bb-accent-on` and each of `--bb-accent`, `--bb-accent-hover` and
`--bb-accent-active`, in both modes, and `e2e/palette.spec.ts` measures it.
A base scope moves the greys and leaves the accent alone. The four tone
families follow neither.

**Not guaranteed, and named rather than smoothed over.** Four accents have a
mid-tone solid that cannot carry a run of text at 4.5:1 either way — **cyan
4.48, emerald 4.31, sky 4.07, teal 4.39** in light, and sky in dark. They clear
the 3:1 a graphical element needs and AA-large, and a project choosing one
either accepts that or sets `--bb-accent-on` itself. Two more sit within 3:1 of
the page, which is what a focus ring is measured against: **yellow in light at
2.82** and **indigo in dark at 2.88**.

**And whether a given accent and base read well together is still the project's
question**, unchanged from 0028. The library does not refuse a combination and
does not warn about one.

## The mode goes outermost

The scope belongs on the element carrying `data-bb-mode`, or inside it with no
other mode in between. Doc 03 §3.2 has the rule, the defect that produced it —
a nested scope losing the whole dark mapping — and the two arrangements that
are undefined because a descendant selector cannot ask which mode ancestor is
nearest.

## Consequences

**`semantic.css`'s dark block gained three selectors**, and that is a fix rather
than a feature: a theme scope nested inside a dark element had been re-declaring
the light mapping since the token layer was written, collapsing
`--bb-surface-raised` onto the page and making `--bb-surface-sunken` lighter
than it. The catalog never showed it because its panels put both attributes on
one element.

**The catalogue is generated and byte-compared**, by the same pair of scripts
`primitives.css` already used — `pnpm tokens` writes, `pnpm check:tokens`
renders and compares. Both files are ignored by eslint and prettier by name,
so that comparison is the only thing standing between a hand edit and `dist`.

**The story reads the families out of the CSSOM** rather than listing them.
A second list is a second place to forget, which is exactly how the five
drifted copies above happened; walking the stylesheet means adding a family to
`scripts/palette.mjs` is the whole change.

**And one thing was found and deliberately not fixed.** In light mode the
default brand's steps 10 and 11 differ by 2 of 255 in a single channel, so a
pressed primary button is indistinguishable from a hovered one. That is the
palette's data rather than the mapping — the same ladder is 15 to 50 apart in
most families — and changing it is a palette decision with its own baselines.
It is a row in the catalog's §7.
