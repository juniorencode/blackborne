# Contributing

Thanks for taking the time. This document covers how to work in this
repository. What to build and why is in [`docs/`](./docs/README.md), which is
the source of truth.

## Setup

Requires Node 20+ and pnpm 9+.

```sh
pnpm install
pnpm verify
```

## Layout

```
packages/blackborne/   the published package
apps/catalog/          the visual catalog (Storybook)
docs/                  foundations, dated decisions, guides
```

## Commands

| Command                     | What it does                                              |
| --------------------------- | --------------------------------------------------------- |
| `pnpm verify`               | The full gate: format, lint, types, tests                 |
| `pnpm lint`                 | ESLint, including this project's own rules                |
| `pnpm typecheck`            | Types across the workspace                                |
| `pnpm test`                 | Unit and behavior tests                                   |
| `pnpm verify:full`          | Everything above, plus browser checks against the catalog |
| `pnpm --filter catalog dev` | The visual catalog, on port 6006                          |
| `pnpm format`               | Apply formatting                                          |

Run `pnpm verify` before opening a pull request.

Two levels, on purpose. `pnpm verify` is the fast gate and the same thing CI
runs first, so a green local run means a green first job. `pnpm verify:full`
adds the browser checks, which need Chromium and run as a separate CI job so
they never delay the fast one.

A browser is not optional pedantry: jsdom does not implement real tab order,
so it cannot say where focus goes, and it does not resolve CSS variables, so
it cannot say what colour an element ended up. A token bug that made dark
mode do nothing at all passed every unit test.

**After touching `pnpm-workspace.yaml`, `.npmrc` or anything about
dependencies, run `pnpm verify:clean`.** It removes every `node_modules` and
installs the way CI does. A local `pnpm install` reuses what is already
there, so a setting left in a pending state warns locally and fails only on
a clean install — which is how a branch that was green everywhere broke CI.

## Branches and commits

The full format is in
[`docs/contributing/commits-and-prs.md`](./docs/contributing/commits-and-prs.md).
The short version:

- `main` is the only permanent branch and is always releasable. Work happens on
  short-lived branches off `main` and lands through a pull request. There is no
  `develop`, no `release/*` and no `hotfix/*`.
- Branch names: `feature/…`, `fix/…`, `docs/…`, `chore/…`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/),
  and carry no `Co-Authored-By` trailer.
- Pull request titles are Conventional Commits too: merges are squashed, so the
  title becomes the commit on `main`.
- Releases are tagged `vX.Y.Z` and published **from CI**, never from a laptop.

## Adding a component

Read
[`docs/contributing/new-component.md`](./docs/contributing/new-component.md)
first. The short version:

1. Which components exist is a deliberate decision — check the catalog first.
   A new **prop or variant** on an existing one is the stricter case: name the
   real place that needs it today, not one you can imagine.
2. It must pass the thirteen-checkbox entry gate in
   [`docs/foundations/01-principles.md`](./docs/foundations/01-principles.md).
   Twelve out of thirteen does not enter.
3. Anything with logic goes in a hook or a pure function, tested without
   rendering. Components paint and delegate.

## The rules that lint enforces

These are not style preferences. They come from the foundations and a pull
request that breaks one does not merge:

- No literal colors and no primitive tokens inside a component — semantic
  tokens only.
- No physical directions (`left`/`right`) — always `start`/`end`.
- No literal user-facing strings, **including accessibility labels**.
- No viewport breakpoints outside components rendered in a portal.
- No imports reaching into another component's internal path.
- No access to `document`, `localStorage` or globals.
- No generic element with a click handler acting as a button.

## Reporting

Bugs and component requests go through the issue templates. A component
request is a proposal, not a vote. The most useful field on the form is what
you do today instead: it usually reveals whether something is a new component
or a missing prop on one that exists.
