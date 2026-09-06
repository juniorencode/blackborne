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

## What is captured, and what is not

Nineteen captures, not all sixty stories. Sixty would be slow and most would be
near-duplicates that fail together and teach nothing.

| Group        | What                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **States**   | One per component, showing every state. These are what a token change lands on                                                       |
| **Together** | The form, and the alignment rows. Doc 09 §10 calls this the check that finds the most                                                |
| **Axes**     | Modes, densities, direction, brand override, all three at once, and locales — on composite stories rather than on all ten components |

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
