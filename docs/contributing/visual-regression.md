# Visual regression

Every capture is a saved picture of a component. On each pull request they are
taken again and compared pixel for pixel; a difference fails the check and
shows you both images side by side.

**It does not detect that something is wrong. It detects that something
changed** — and a person decides whether the change was intended. That
decision is the entire value of the thing.

## What it is for

Not catching new bugs. This:

> Change a token, and know within a minute **which components changed
> appearance**, instead of opening them one at a time.

Demonstrated rather than claimed. Changing `--bb-radius-md` from 6px to 10px
failed **13 of 19** baselines and left 6 untouched. Before, touching that token
meant guessing at the consequences.

Doc 10 §6 calls it the only thing that makes changing tokens safe once there
are thirty components. It was adopted at ten deliberately: approving ten
baselines is an afternoon, and approving thirty is not.

## Running it

```sh
pnpm visual          # compare against the baselines
pnpm visual:update   # accept the current appearance as correct
```

Both run inside the same Docker container CI uses, so a capture taken on your
machine is byte-identical to one taken in CI. Docker has to be running.

## Why Docker, and why the tolerance is zero

A screenshot taken on Windows and one taken on Linux are not identical: fonts
rasterise differently, and a one or two pixel difference appears that is not a
change to anything. Three ways out:

| Approach                                | Cost                                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Tolerate a pixel budget                 | A budget big enough to absorb the platform difference is big enough to absorb real one-pixel drift — which is what this exists to catch |
| One baseline per platform               | Twice the files, twice the approvals, and they drift apart                                                                              |
| **Make every machine the same machine** | An image to pull, and Docker as a prerequisite                                                                                          |

The third is chosen, which is what lets `maxDiffPixelRatio` stay at **0**.

## The part that decides whether this is worth having

`pnpm visual:update` is one command, and it will always be the fastest way to
make a red check green.

**Look at the diff before you run it.** Doc 10 §6 requires that an appearance
change be approved explicitly and never ignored wholesale, and this is where
that applies. A baseline updated without looking gives you the cost of the
whole system and none of the benefit — you have automated the act of not
noticing.

When a check fails, the report is in `apps/catalog/playwright-report/`, or as
an artifact on the failed CI run. It shows the old image, the new one, and the
difference highlighted.

### An update run can rewrite a baseline nobody asked it about

Measured on 2026-09-08, while adding six baselines for a new component. The
comparison run before it reported **94 passed, 6 missing** — the six new ones —
so nothing existing had moved. The update run then rewrote a seventh:
`tooltip-rtl`, from 9888 bytes to 7469.

Looking at the two images said why. The committed one has the tooltip open
beside its trigger; the rewritten one has no tooltip at all and the button 200px
lower. The capture waits for the layer to be visible before it shoots, so the
tooltip was there — and then was not, on that one run.

Two things follow:

- **`git status` after an update run is part of looking at the diff.** A file
  you did not expect to change is the signal, and the byte size is enough to
  spot it.
- It is the same trap `gotoStory` was written for, one step along:
  `toHaveScreenshot` retries until it matches, so a comparison run quietly
  retries a bad frame away — and an update run has nothing to match against,
  so the bad frame becomes the reference. The mounting half of that is guarded;
  the hover half is not, and this note is what stands in for the guard until
  something better exists.

**Filtering an update run** is how the seventh file stayed out of the commit:

```sh
bash apps/catalog/docker-visual.sh --update-snapshots -g "accordion|collapsible"
```

The arguments reach Playwright inside the container. They used to reach it
unquoted, which meant a filter containing a vertical bar arrived as a pipe and
the run died with `EPIPE` from a process writing into nothing.

## What is captured, and what is not

Nineteen captures, not all sixty stories. Sixty would be slow and most would be
near-duplicates that fail together and teach nothing.

| Group        | What                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **States**   | One per component, showing every state. These are what a token change lands on                                                    |
| **Together** | The form, and the alignment rows. Doc 09 §10 calls this the check that finds the most                                             |
| **Axes**     | Modes, densities, direction, brand override, all three at once, and locales — on composite stories rather than on every component |

## When a component is added

1. Add a **States** story covering every state, as the other components have.
2. Add a line to `STATES` in `apps/catalog/e2e/visual.spec.ts`.
3. Run `pnpm visual:update` and **look at the new baseline** before committing
   it. It is the only time you will see it as an image rather than as a diff.

## Determinism

Doc 10 §6 lists four conditions for avoiding constant false positives. All four
hold:

- **Animations disabled** during capture, in `playwright.config.ts`
- **Fixed sample data** — by construction, since no story contains a date, an
  id or a random value
- **Fonts loaded** before capturing, awaited explicitly
- **Every change approved explicitly**, which is the workflow above

Two more, learned here: a fixed viewport and device scale factor, because a
capture at another size is a different capture, and the caret hidden, because a
blinking caret is a screenshot that differs from itself.
