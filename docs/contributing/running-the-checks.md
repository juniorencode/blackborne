# Running the checks

Everything this repository can be asked, what each answer is worth, and the
order that reproduces CI. Written for a person at a terminal.

## The short version

```bash
pnpm install          # once, and after anything touches dependencies
pnpm verify           # before every pull request. Minutes, not seconds
```

That is the gate CI runs first, and a green local run means a green first job.
If you have changed anything a person can SEE — a component, a token, a
stylesheet — two more:

```bash
pnpm verify:full      # adds the browser and accessibility suites
pnpm visual           # adds the screenshots. Needs Docker running
```

**`pnpm verify:full` does not include the visual suite.** It is the one thing
on this page most likely to catch you out, and it is not an oversight: the
screenshots run inside Docker, and a command that silently required Docker
would fail for everyone who does not have it running. See
[the traps](#five-traps-that-will-cost-you-an-afternoon).

## Every command

### The gate

| Command              | What it is                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm verify`        | **The fast gate.** Nine checks, listed below. The same thing CI's first job runs                   |
| `pnpm verify:full`   | The gate, plus the built catalog, the behaviour suite and the accessibility suite. **No pictures** |
| `pnpm visual`        | The screenshots, in the Docker container the references were generated in                          |
| `pnpm visual:update` | The same, accepting what it sees as the new references. **Look at them first**                     |
| `pnpm verify:clean`  | Removes every `node_modules` and installs the way CI does, then the gate                           |

### What `pnpm verify` is made of

Nine commands, and each can be run on its own while you work:

| Command                                 | What it answers                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm format:check`                     | Prettier would change nothing. `pnpm format` applies it                                    |
| `pnpm lint`                             | ESLint, including this project's own rules — the hard rules in `CLAUDE.md` are errors here |
| `pnpm lint:rules`                       | Each of those custom rules still fires on what it forbids **and stays silent otherwise**   |
| `pnpm check:release`                    | The release workflow still runs everything the pull-request workflow runs                  |
| `pnpm check:claims`                     | The numbers the documents state as fact — capture counts, story counts — are still true    |
| `pnpm typecheck`                        | Types across both workspaces                                                               |
| `pnpm test`                             | Vitest: logic and behaviour, rendering in jsdom                                            |
| `pnpm --filter blackborne check:tokens` | `primitives.css` and `palette.css` still match the generator they are written by           |
| `pnpm verify:package`                   | Builds the package and checks what a consumer receives — see below                         |

`pnpm verify:package` is four of its own: the build, then `check:package`
(publint, are-the-types-wrong, every exported name importing, nothing in `dist`
unreachable), `check:budget` (the weight ceilings published in the package
README) and `check:surface` (the public API as a reviewable diff).

### The browser layers

Each refuses to start unless the built catalog is current — that is
`check:catalog`, and it exists because a suite once ran against a stale build
and reported 497 checks green where CI ran 501 and failed three.

| Command                           | What only it can answer                                                        |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm build:catalog`              | Builds the package **and** the catalog. Every command below needs this first   |
| `pnpm --filter catalog test:e2e`  | Behaviour: where focus went, what colour something ended up, what is on screen |
| `pnpm --filter catalog test:a11y` | axe against every story in the catalog                                         |
| `pnpm visual`                     | What changed in appearance, and where                                          |

How the screenshots work, why they run in Docker, and the one habit that
decides whether they are worth having are in
[visual-regression.md](./visual-regression.md).

A browser is not pedantry: jsdom does not implement real tab order, so it
cannot say where focus goes, and it does not resolve CSS variables, so it
cannot say what colour an element ended up. A token bug that made dark mode do
nothing at all passed every unit test.

### Looking at things

| Command                           | What it is                                                      |
| --------------------------------- | --------------------------------------------------------------- |
| `pnpm --filter catalog dev`       | Storybook on **6006**, for working on a story                   |
| `pnpm --filter blackborne tokens` | Regenerates `primitives.css` and `palette.css` from the palette |

**6006 is the dev server and 6007 is the built catalog the checks are served
from.** They are kept apart on purpose: a dev server compiles each story on
demand, which has timed a story out three times under a full run, and a run
that reuses whatever server is up verifies whatever that server last compiled.

## The order that reproduces CI

CI runs two things at once: the fast gate, and the browser work — which is
itself three parallel jobs now. In one terminal, that is:

```bash
pnpm install --frozen-lockfile
pnpm verify

pnpm build:catalog
pnpm --filter catalog test:e2e
pnpm --filter catalog test:a11y
pnpm visual
```

The last line is the one CI does differently: CI runs `test:visual` directly,
because it is already inside the container. You are not, so `pnpm visual` puts
you there.

## How long it takes

Doc 10 §12: a duration is a measurement of a machine, so it carries the
machine and the date or it says nothing.

**Measured 2026-09-13**, on Windows 11 with 12 cores and 17 GB, Docker
Desktop showing the container 4 of them:

|                           |                                                         |
| ------------------------- | ------------------------------------------------------- |
| `pnpm verify`             | **3m39s** — of which `pnpm test` is 1m38s for 878 tests |
| `pnpm build:catalog`      | 34s                                                     |
| behaviour, 487 checks     | 3m27s                                                   |
| accessibility, 507 checks | 4m38s                                                   |
| visual, 216 captures      | about 5m20s, one worker inside Docker                   |

**And the same things on CI**, from a run on the same day — `ubuntu-latest`
inside the Playwright container:

|                      |       |
| -------------------- | ----- |
| `pnpm verify`        | 2m14s |
| `pnpm build:catalog` | 12s   |
| behaviour            | 3m17s |
| accessibility        | 4m57s |
| visual               | 2m01s |

The two columns do not agree, and that is the point of printing both. A runner
has fewer cores than the machine the local figures came from, so the two
parallel suites are slower there and the single-worker one is faster — which no
amount of reading one column would have predicted.

## Five traps that will cost you an afternoon

**1. `pnpm verify:full` does not take screenshots.** It runs the gate, the
behaviour suite and the accessibility suite. The pictures are `pnpm visual`,
separately, and nothing will remind you.

**2. The browser suites refuse to run against a stale catalog.** If one stops
with a message about the build, run `pnpm build:catalog` and try again. It is
not being fussy: a suite that ran against an old build once reported 497 green
where CI ran 501 and failed three of them on a critical accessibility rule.

**3. The catalog imports the BUILT stylesheet.** Change anything under
`packages/blackborne/src/styles/` and the dev server keeps showing the old
colours until you rebuild and restart it. Build, restart, then look.

**4. The visual suite runs in Docker, and refuses to run anywhere else.** The
references are generated inside the container so that a capture on your machine
is comparable with one from CI, and the platform is part of the filename — so
running it directly on Windows or macOS would look for references that do not
exist. It stops with a message pointing here rather than writing a second set
nobody wants. Docker has to be running before `pnpm visual`.

**5. After touching dependencies, `pnpm verify:clean`.** A local
`pnpm install` reuses what is already in `node_modules`, so a setting left
half-applied warns locally and fails only on a clean install. That is how a
branch green everywhere broke CI.

## When something fails

**Read which LAYER failed first.** They answer different questions and a
failure in one rarely means what a failure in another would. The layers and
what each is worth are in
[doc 10 §3](../foundations/10-quality-and-verification.md).

**A visual failure ships pictures.** Locally they are under
`apps/catalog/test-results/`, as `-expected`, `-actual` and `-diff`. On CI they
are an artefact on the failed run. **Open the diff before theorising** — that
sentence is in this repository because 225 pixels were once assumed to be a
broken-image glyph and the artefact showed rings round every circle instead,
and because three separate theories about one baseline were settled in ten
minutes by opening it and counting the pixels.

**One check failing repeatedly in the same place is the check or the code.
Several different checks failing once each, none repeating, is the machine.**
That is doc 10 §11.5, and the machine has a resource nobody counts: sockets
accumulate in `TIME_WAIT` across runs, invisible to a memory check, until a
story cannot be fetched. Measured once at 1172 of them after about 2900 story
loads in one session. The remedy is fewer workers on that machine, or a pause —
not a retry and not a wider bar.

**And do not widen a check to make it pass.** A check that fails on one machine
and not another is measuring the machine rather than the component, and
lowering its bar turns a real failure into a coincidence. Where a dependence on
the machine genuinely cannot be removed, it is MEASURED and the bar is set to
it, with the numbers written down — which has happened exactly once, and took a
decision document to justify
([0030](../decisions/0030-the-pixel-bar-is-calibrated-rather-than-zero.md)).
