# 0001 · TypeScript stays on 5.9, ESLint moves to 10

**Date:** 2026-09-02 · **Status:** accepted

## Context

Setting up the workspace, installing the latest of everything produced a
combination that does not actually work together:

- `typescript@7.0.2` is out, but `typescript-eslint@8.69.0` declares
  `typescript >=4.8.4 <6.1.0`. There is no release of `typescript-eslint` that
  supports TypeScript 7.
- `eslint@10.9.1` is out, and `eslint@9` is already marked deprecated and out
  of support. But `eslint-plugin-jsx-a11y@6.10.2` still declares
  `eslint ^3 || … || ^9`.

Document 10 makes lint the mechanism that enforces the foundations — no literal
colors, no physical directions, no literal strings. Type-aware lint that does
not run is not a small inconvenience; it removes the enforcement the whole
quality strategy rests on.

## Decision

**TypeScript is pinned to the 5.9 line.** Not because 7 is bad, but because the
lint toolchain does not support it yet. This is revisited when
`typescript-eslint` ships support, not before.

**ESLint moves to 10**, with a peer-dependency override telling pnpm that
`eslint-plugin-jsx-a11y` accepts it. Starting a new repository on an
out-of-support ESLint 9 is worse: no security fixes, and a migration owed
almost immediately.

The override was not taken on faith. A probe file violating `jsx-a11y/alt-text`,
`jsx-a11y/click-events-have-key-events`, `jsx-a11y/no-static-element-interactions`
and `react-hooks/rules-of-hooks` was linted under ESLint 10, and every rule
fired. The plugin works; only its declared range is stale.

## Consequences

- Do **not** upgrade TypeScript past 5.x while this decision stands. An upgrade
  that silently disables type-aware lint is a regression even though every
  version number goes up.
- The override lives in `pnpm-workspace.yaml`, not `package.json` — pnpm 11 no
  longer reads the `pnpm` field there. Remove it once the plugin declares `^10`.
- `pnpm peers check` should report no issues. If it starts reporting some, the
  toolchain has drifted and this decision needs revisiting.

## Revisit when

`typescript-eslint` supports TypeScript 7, or `eslint-plugin-jsx-a11y` widens
its peer range. Either event supersedes part of this decision.
