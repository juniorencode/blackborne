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

| Command          | What it does                               |
| ---------------- | ------------------------------------------ |
| `pnpm verify`    | The full gate: format, lint, types, tests  |
| `pnpm lint`      | ESLint, including this project's own rules |
| `pnpm typecheck` | Types across the workspace                 |
| `pnpm test`      | Unit and behavior tests                    |
| `pnpm format`    | Apply formatting                           |

Run `pnpm verify` before opening a pull request. CI runs the same thing, so a
green local run means a green CI run.

## Branches and commits

- `main` is always releasable. Work happens on short-lived branches off `main`
  and lands through a pull request.
- Branch names: `feature/…`, `fix/…`, `docs/…`, `chore/…`.
- Commit subjects follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Releases are tagged `vX.Y.Z` and published **from CI**, never from a laptop.

## Adding a component

The full recipe lives in `docs/contributing/new-component.md`, which is being
written (phase F4). The rules it will formalise already apply:

1. A component enters only when **two real consumers** ask for it. Not "while
   we're at it".
2. It must pass the twelve-checkbox entry gate from the principles document.
   Eleven out of twelve does not enter.
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
request that cannot name two real consumers will be kept open as a signal, not
rejected — the rule of two is counted with data, not from memory.
