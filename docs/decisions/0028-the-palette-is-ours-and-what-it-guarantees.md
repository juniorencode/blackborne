# 0028 — The palette is ours, and what it guarantees

**Status:** accepted · **Date:** 2026-09-12

## Context

Every colour in this library came from `@radix-ui/colors`. Six families of
twelve steps, mapped by `scripts/primitives.mjs` into layer 1, with the package
kept as a development dependency so nothing of it reached a consumer.

That worked and it constrained two things. **A project could only have the
brands Radix has**, because a brand override is a redefinition of the `brand`
family's steps and there was nothing to redefine them from. And the choice of
hues was somebody else's: the accent was `indigo` because Radix had an indigo,
not because a listing wanted one.

A palette was built beside this repository to replace it — twelve steps, two
modes, twenty-five families, the ladder measured rather than sampled — and this
records what happened when it landed, and what a consumer may now rely on.

## Decision

**The palette is data in this repository**, at `scripts/palette.mjs`, and
`primitives.mjs` reads it. `@radix-ui/colors` is gone from the dependency tree
entirely.

**It is published in `oklch`.** A screen that can show more than sRGB shows the
colour that was chosen; one that cannot clips it itself, to the same value a hex
would have named. Every colour is carried twice — `oklch` and the clipped hex —
and the second is not redundant: **a contrast is measured against the clipped
value**, because that is what an ordinary screen paints. Measuring the ideal one
reports ratios nobody ever sees.

**The six roles are unchanged**: `gray`, `brand`, `danger`, `warning`,
`success`, `info`. What changed is which family fills them, and one of those is
a real choice rather than a rename: **`brand` is `blue`** where it was `indigo`,
and those are separate families in this palette.

**The four tone families do not follow the accent.** A project whose accent is
red still marks an error in `danger`. Two reds beside each other is avoided by
not choosing red, and that is the project's call.

**Whether a given accent and base read well together is the project's
question too.** The palette's own study measured the combinations; this library
does not refuse one, and does not warn about one.

## What a consumer may rely on

This is the half that matters later, because a palette shipped is a palette
somebody builds on.

**Guaranteed.** The twelve step ROLES — a background at 1-2, a component
surface at 3, a border at 6-8, the solid at 9, text at 11-12 — and that step 9
is the same value in both modes. Those are what a redefinition has to satisfy,
and they are what every semantic token is written against.

**Not guaranteed.** The exact value of any step. A family may be re-tuned, and a
project that hard-codes `oklch(54.6% 0.22 259.8)` rather than reading
`--bb-accent` has copied a number this library did not promise to keep.

**And layer 1 stays private.** `--bb-x-*` is not API; a consumer redefines the
SEMANTIC tokens, or redefines a family's steps inside a scope of their own, the
way the catalog's own alternative brand does.

## Consequences

**Two pairings had to move, and the measurement is why.** In dark mode the text
on a solid fill was the darkest gray for every family, and the new solids are
darker than Radix's were:

| pairing                    | white    | near-black |
| -------------------------- | -------- | ---------- |
| `danger` `#e30024`         | **4.89** | 3.86       |
| `brand` / `info` `#0065ed` | **5.14** | 3.67       |
| `success` `#00a449`        | 3.28     | **5.76**   |
| `warning` `#cb8200`        | 3.12     | **6.05**   |

So `--bb-danger-on` and `--bb-info-on` are white in dark mode now. The rule
underneath was already written — every background declares the text that goes
on it — and was being applied by MODE rather than by the background. `Badge`
had noticed half of it: "amber's solid step is a LIGHT colour, so
`--bb-warning-on` is dark".

**Every text pairing the stylesheet declares was measured**, in both modes, and
one is under 4.5:1: `surface-disabled` at 3.13 and 3.44. That is an inactive
control, which WCAG exempts by name and axe does not flag. Whether the old
palette measured the same there was not checked, and is not claimed.

**A computed colour is no longer `rgb(...)`.** Chrome serialises `oklch` back as
`oklch`, so four specs that parsed `/rgba?\(([^)]+)\)/` — the cross in four
copies again — stopped working, two of them silently, by falling back to black
and reporting a confident ratio against a colour nobody painted. `e2e/colour`
replaces all four: it paints the colour on a canvas and reads the bytes, which
costs no colour-space arithmetic, takes anything the browser can paint
including a `color-mix`, and returns the clipped value this decision says to
measure.

**And the three pinned constants in `theme-axes.spec.ts` did their job.** They
exist so a token remap arrives as a named failure rather than as a difference
somebody might not notice in a picture. They failed, they were re-pinned, and
they now compare a painted colour rather than a string — because comparing the
spelling would fail on any correct remap from here on.
