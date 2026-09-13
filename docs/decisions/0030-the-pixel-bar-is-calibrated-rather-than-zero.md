# 0030 — The pixel bar is calibrated rather than zero

**Status:** accepted · **Date:** 2026-09-13

## Context

The visual suite compares a capture against a committed reference with **no
tolerance at all**: `threshold: 0` and `maxDiffPixelRatio: 0`. Both numbers had
a measurement behind them. Playwright's default `threshold` is 0.2 — a fifth of
the colour space per pixel, silently allowed — and with it in place, moving a
switch track from grey step 3 to step 2 changed roughly 1760 pixels of a
271,360 pixel capture by **nine units per channel**, and the suite reported the
two as identical.

Zero also rested on a claim this repository stated as fact in five places:
every reference is generated inside the same container the CI job uses, so a
capture taken on a laptop is **byte-identical** to one taken on CI.

`avatar-states` had been disagreeing with that claim for months — 225 pixels,
then 289, then 332 — and each time the answer was to treat it as the machine
and move on.

## What was measured

On 2026-09-13, against the actual capture a CI run produced and the reference
it was compared with:

|                                     |                                                                |
| ----------------------------------- | -------------------------------------------------------------- |
| pixels differing                    | **2046**                                                       |
| where they are                      | **every one on a curve** — the circular borders of the avatars |
| the largest difference in the image | **2 units of 255**                                             |
| pixels differing by 3 or more       | **none**                                                       |
| content, geometry, layout, text     | **identical**                                                  |

That is rounding in the antialiasing blend, not a different picture.

**It is not the core count.** Regenerated inside the container with one, two
and four visible CPUs, the file came out byte-identical all three times, and
identical to the committed reference. **It is not a Skia runtime-optimisation
flag either**: `--disable-skia-runtime-opts` changed nothing here. What is left
is the CPU underneath Skia, and this repository has one of those.

**And by this repository's own diagnostic it was never "the machine" in the
sense of bad luck.** Doc 10 §11.5: _one check failing repeatedly in the same
place is the check or the code; several different checks failing once each is
the machine._ The same baseline, in the same place, three times, is the first
of those.

## Where the bar actually sits

`threshold` is handed to pixelmatch, which compares a squared YIQ distance
against `35215 × threshold²`. So the smallest value that tolerates a given
difference is `sqrt(delta / 35215)` — a number that can be measured rather than
chosen:

|                                      | delta | needs a threshold of |
| ------------------------------------ | ----- | -------------------- |
| the CI disagreement, worst pixel     | 2.0   | **0.0076**           |
| a flat 3-unit change                 | 4.5   | 0.0114               |
| a flat 9-unit change — the one above | 40.9  | 0.0341               |

## Decision

**`threshold: 0.01`. `maxDiffPixelRatio` stays at zero.**

They are different knobs and only one of them was ever the right place to give
ground. `maxDiffPixelRatio` bounds HOW MANY pixels may differ, and a budget
large enough to absorb a machine is large enough to absorb a component — a real
change to a small element is a small number of pixels. `threshold` bounds HOW
MUCH one pixel may differ before it counts as differing at all.

0.01 sits in the gap above. It tolerates the rounding, **still fails a
three-unit change**, and still fails the nine-unit change that set the bar to
zero in the first place, with 3.4× of margin.

## Why this is a calibration and not a widening

Doc 10 §11 forbids widening a check to make it pass, by name, and this decision
has to answer that rather than step around it.

**A bar that reads to two units when the instrument only agrees with itself to
two units across machines is not stricter — it is miscalibrated.** A ruler
marked in tenths of a millimetre, on a tool accurate to two, does not measure
more finely; it reports noise as signal. The same section's own words describe
what was happening: _a check that fails on one machine and not another is
measuring the machine rather than the component._ This check was.

The remedy §11 prescribes is to stop measuring the machine rather than to lower
the bar. That was attempted first and failed: there is no flag that pins
another CPU's rounding, and the two candidates were measured to change nothing
here.

**And what the change stops catching is covered better elsewhere.** Colour
correctness is now asserted over the TOKENS — `e2e/contrast.spec.ts` measures
every declared pair in both modes and `e2e/theme-axes.spec.ts` pins three
constants — neither of which depends on a rasteriser at all. What this layer
uniquely sees is geometry, layout, and whether something appeared or vanished.
None of those is a two-unit difference.

## Consequences

**No baseline changed.** All 216 matched exactly before the change and match
exactly after it; a threshold only decides what counts as a difference, and
there were none.

**The byte-identical claim is corrected in five places** — `visual.spec.ts`,
`playwright.config.ts`, `docker-visual.sh`, doc 10 §6 and the contributing
guide. The container still matters: it fixes the fonts, the renderer version
and the platform suffix, and without it the differences are enormous rather
than two units. What it does not do is make two different CPUs round the same
way, and saying so was the part that was wrong.

**The calibration is against ONE observed disagreement.** A machine that rounds
by three brings this back. The instrument will say so in the same words it did
this time — doc 10 §11.8's two verdicts are what attributed it, and "the page
rendered IDENTICALLY twice" is what ruled out the component on the first run.

**And the artefact is what settled it.** The first Avatar incident ended with
_a diff is worth opening before theorising_ — the 225 pixels were assumed to be
a broken-image glyph and the artefact showed rings round every circle instead.
Three theories later, opening the diff again is what turned this into a
measurement: the picture showed the rings, and counting the pixels showed that
not one of them differed by more than two.
