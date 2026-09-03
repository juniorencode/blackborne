# Working in this repository

Guidance for AI agents. Read this before touching anything.

## What this is

Blackborne is a React UI component library for **management applications**:
internal dashboards, CRUD screens, dense forms, listings with filters and data
tables. It is published to npm and consumed by independent projects.

It is **being rewritten from scratch**. Nothing from the previous `0.1.1`
codebase is carried over — not a component, a prop name, a DOM structure or a
test id. The old code is available under the `v0.1.1` tag, but it is not a
reference: it is the thing being replaced. Do not read it for guidance and do
not copy from it.

## Where things are

```
packages/blackborne/   the published package
apps/catalog/          the visual catalog (Storybook) — arrives in phase F6
docs/                  the source of truth
.github/               CI, issue and pull request templates
```

**`docs/` is the source of truth — not the code, and not this file.** If this
file and a document under `docs/foundations/` disagree, the foundation wins and
this file is out of date. Fix this file.

## Where the project stands

`docs/README.md` carries the phase table and is kept current. Check it before
assuming anything exists.

At the time of writing: the skeleton is up, **all ten foundations are written**,
and **no component exists yet**. The first one, `Button`, arrives with the build
pipeline.

So the rules are settled and you should follow them rather than invent. Two
things to keep in mind anyway:

- **Some rules are marked as not yet verified.** Document 08 §6 leaves scroll
  locking across nested layers openly pending. Where a document says something
  is unverified, treat it as unverified — do not quietly promote it.
- **The file layout of a component is still open.** It is settled with the
  first component. If you need it before then, ask.

## Commands

| Command            | What it does                                                   |
| ------------------ | -------------------------------------------------------------- |
| `pnpm install`     | Install. Uses the committed lockfile; versions never drift     |
| `pnpm verify`      | The full gate: format, lint, types, tests. Run before every PR |
| `pnpm lint`        | ESLint, including this project's own rules                     |
| `pnpm typecheck`   | Types across the workspace                                     |
| `pnpm test`        | Vitest                                                         |
| `pnpm verify:full` | Everything above, plus the browser checks against the catalog  |
| `pnpm format`      | Apply formatting                                               |

Two levels, on purpose. `pnpm verify` is the fast gate and the same thing CI
runs first, so a green local run means a green first job. `pnpm verify:full`
adds the browser checks, which need Chromium and run as a separate CI job so
they never delay the fast one.

A browser is not optional pedantry: jsdom does not implement real tab order, so
it cannot say where focus goes, and it does not resolve CSS variables, so it
cannot say what colour an element ended up. A token bug that made dark mode do
nothing at all passed every unit test.

**After touching `pnpm-workspace.yaml`, `.npmrc` or anything about
dependencies, run `pnpm verify:clean`.** It removes every `node_modules` and
installs the way CI does. A local `pnpm install` reuses what is already
there, so a setting left in a pending state warns locally and fails only on
a clean install — which is how a branch that was green everywhere broke CI.

## Hard rules

These come from the foundations in [`docs/foundations/`](./docs/foundations/README.md),
which now hold the full reasoning. They are not style preferences, and a change
that breaks one does not merge.

1. **Semantic tokens only.** No literal colors, no primitive tokens inside a
   component. A component that references `--blue-600` is a defect, not a
   preference.
2. **No physical directions.** Always `start`/`end`, never `left`/`right`. RTL
   is supported from day one and this is half of that support.
3. **No literal user-facing strings** — including `aria-label` and every other
   accessibility label. An accessibility label is text a person reads, even
   though it is not seen.
4. **No viewport breakpoints** outside components rendered in a portal. A
   component adapts to its own container, because the same component can sit in
   a 320px panel inside a 1920px screen.
5. **No global state.** The library never writes to `document`, `localStorage`
   or a singleton, and never detects the user's language, theme or time zone.
   It receives them.
6. **No network.** No component makes a request or knows a URL. Data arrives by
   prop; effects are functions passed in.
7. **Logic lives in hooks or pure functions**, testable without rendering.
   Components paint and delegate. A new capability is a new hook, never one
   more prop on an existing component.
8. **Two consumers, or it does not enter.** A component, a prop or a variant
   needs two real consumers asking for it. "While we're at it" is the reason
   things rot.

Six of these are meant to be enforced by lint rules that do not exist yet; they
are written in phase F6, against real code. Until then they hold by reading.

## How work lands

`main` is protected: no direct pushes, no force pushes, and CI must pass.

1. Branch from `main`: `feature/…`, `fix/…`, `docs/…`, `chore/…`
2. Run `pnpm verify`
3. Push the branch and open a pull request
4. Merge is by squash, so the PR title becomes the commit on `main`

Commit and PR format is defined in
[`docs/contributing/commits-and-prs.md`](./docs/contributing/commits-and-prs.md).
Two things to internalise: commits are Conventional Commits, and **commit
messages never carry a `Co-Authored-By` trailer**.

## Traps specific to this repository

Things that look like improvements and are not:

- **Do not upgrade TypeScript past 5.x.** TypeScript 7 exists, but
  `typescript-eslint` does not support it, and type-aware lint is what enforces
  the rules above. See `docs/decisions/0001-toolchain-versions.md`. Every
  version number would go up and the project would get worse.
- **Do not add a routing, icon or form library.** The library provides no
  routing, distributes no icons, and forces no form library. These were
  removed on purpose.
- **Do not add a schema validation dependency.** The library restricts input
  and presents errors. Deciding whether a value is valid belongs to the
  consuming project.
- **Do not build a component that does everything through props.** Complex sets
  (tables, dense forms) ship as hooks + presentational pieces + a thin optional
  assembly. An assembly may not have a capability its pieces lack.
- **Do not rename props to match HTML.** The library uses `isDisabled` and
  `onPress`, following the headless base. This looks like a bug to fix and is
  not: see `docs/decisions/0007-prop-names-follow-the-base.md`.
- **Do not reimplement accessibility or a solved engine.** Dialogs, menus,
  focus and keyboard come from React Aria. Table state, drag and drop, rich
  text and phone formatting come from existing libraries. Building one by hand
  is the last resort and needs a written justification.
- **Do not reference private projects** in code, examples or documentation. The
  library is public and its API is designed for strangers.

## When something is not covered

Say so. A missing rule is a missing line in a foundation document, and the fix
is to write that line — not to guess and move on. The foundations are changed
_before_ writing code that contradicts them, never afterwards to justify it.
