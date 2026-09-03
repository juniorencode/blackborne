# Commits and pull requests

One format, applied consistently. The point is not ceremony: it is that
`git log` stays readable a year from now, and that the changelog can be written
from it.

## Commit format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

A closed list. If none fits, the commit is probably two commits.

| Type       | When                               |
| ---------- | ---------------------------------- |
| `feat`     | A new capability in the library    |
| `fix`      | A defect fix                       |
| `docs`     | Documentation only                 |
| `refactor` | Behavior does not change           |
| `perf`     | Performance                        |
| `test`     | Tests only                         |
| `build`    | Bundling, package configuration    |
| `ci`       | Workflows                          |
| `chore`    | Maintenance, dependencies, tooling |
| `revert`   | Reverts an earlier commit          |

There is deliberately no `style` type. Prettier runs in CI, so a
formatting-only commit should not exist.

### Scope

The component in kebab-case (`button`, `field`, `combo-box`), or the area
(`tokens`, `theme`, `i18n`, `a11y`, `catalog`, `docs`, `ci`, `deps`).

Optional, but expected whenever the change is localised.

### Subject

- Imperative present: `add`, not `added` or `adds`
- Lowercase start, no trailing period
- The whole first line stays under 72 characters

### Body

Optional for a trivial change, required when the reason is not obvious. Says
**what** and **why**, never how — the diff already says how. Wrapped at 72
characters.

### Footer

Only two things belong here:

```
BREAKING CHANGE: <what breaks, and how to migrate>
Closes #12
```

**Nothing else.** In particular, commits never carry a `Co-Authored-By`
trailer.

### The rule that keeps it coherent

**One logical change per commit.** If the subject needs an "and", it is two
commits.

## Pull requests

### Title

A Conventional Commit, in exactly the format above.

This is not decoration. Merges are squashed, and GitHub uses the pull request
title as the commit subject on `main` — so every commit on `main` ends up
conventional without anyone having to remember.

### Description

Fill in the template in `.github/PULL_REQUEST_TEMPLATE.md`. It is short on
purpose:

| Section               | What goes in it                                                              |
| --------------------- | ---------------------------------------------------------------------------- |
| **What this changes** | One or two sentences. What and why, not how                                  |
| **Why now**           | The real need behind it. For a new component or prop: name the two consumers |
| **Checks**            | `pnpm verify` green, docs updated, changelog updated                         |
| **Entry gate**        | Only for a new component: the twelve checkboxes, all of them                 |

A pull request that cannot fill in "Why now" is usually a pull request that
should not be opened yet.

## Branches

`main` is the only permanent branch and it is always releasable. Everything
else is short-lived, branches from `main`, returns through a pull request, and
is deleted after merging.

Naming: `feature/…`, `fix/…`, `docs/…`, `chore/…`.

There is no `develop`, no `release/*` and no `hotfix/*`. An urgent fix is just
a `fix/` branch off `main`, because `main` **is** what is published.

Releases are tags, `vX.Y.Z`, and pushing one is what triggers publication from
CI. Nothing is ever published from a laptop.
