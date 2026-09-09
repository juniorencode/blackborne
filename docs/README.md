# Documentation

This folder is the **source of truth** for the project. If a discussion about
what to build is not settled by a document here, that document is missing a
line — fix the document, then write the code.

## How it is organised

| Folder          | What lives there                                                       | How often it changes                              |
| --------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| `foundations/`  | Permanent rules: what the library is, how it looks, what it guarantees | Rarely, and never to justify code already written |
| `decisions/`    | Dated records of a single decision and why it was taken                | Append-only                                       |
| `guides/`       | How to use the library                                                 | With the API                                      |
| `contributing/` | How to work on the library                                             | With the tooling                                  |

Foundations and the component catalog are kept apart on purpose: the catalog is
a living list that changes weekly, and mixing them would make the foundations
look less stable than they are.

## Start here

| If you want to…                                      | Read                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Understand what this library is and is not           | [foundations/01-principles.md](./foundations/01-principles.md)                                        |
| Add a component                                      | [contributing/new-component.md](./contributing/new-component.md)                                      |
| Open a pull request                                  | [contributing/commits-and-prs.md](./contributing/commits-and-prs.md)                                  |
| Know which components are planned, and in what order | [catalog-and-build-order.md](./catalog-and-build-order.md)                                            |
| Work with an AI agent                                | [../CLAUDE.md](../CLAUDE.md) and [../packages/blackborne/CLAUDE.md](../packages/blackborne/CLAUDE.md) |
| Know why a past choice was made                      | [decisions/](./decisions/README.md)                                                                   |

## Foundations

The full index, with what each one settles, is in
[foundations/README.md](./foundations/README.md).

| #   | Document                                                                 | Status  |
| --- | ------------------------------------------------------------------------ | ------- |
| 01  | [Principles and non-goals](./foundations/01-principles.md)               | Adopted |
| 02  | [API conventions](./foundations/02-api-conventions.md)                   | Adopted |
| 03  | [Tokens and theme](./foundations/03-tokens-and-theme.md)                 | Adopted |
| 04  | [Responsive and adaptability](./foundations/04-responsive.md)            | Adopted |
| 05  | [Languages and formatting](./foundations/05-languages-and-formatting.md) | Adopted |
| 06  | [Accessibility](./foundations/06-accessibility.md)                       | Adopted |
| 07  | [Forms](./foundations/07-forms.md)                                       | Adopted |
| 08  | [Layers and focus](./foundations/08-layers-and-focus.md)                 | Adopted |
| 09  | [Behavior and interaction](./foundations/09-behavior.md)                 | Adopted |
| 10  | [Quality and verification](./foundations/10-quality-and-verification.md) | Adopted |

Documents 02 and 08 were written last on purpose: they describe the things only
building can decide, and writing them from imagination would have produced
rules the first real component contradicted. Both mark what was verified in a
browser and what was not — 08 §6 leaves one check openly pending rather than
claiming it.

## Where the project stands

The library is being rewritten from scratch. Phases, in order:

| Phase | What                                                                               | State    |
| ----- | ---------------------------------------------------------------------------------- | -------- |
| F1    | Close the past: tag, prune branches, empty the repo, deprecate on npm              | Done     |
| F2    | Skeleton: workspace, root files, CI, templates                                     | Done     |
| F3    | Documentation for AI agents                                                        | Done     |
| F4    | Foundations, written in English                                                    | Done     |
| F5    | One day with React Aria — decided documents 02 and 08                              | Done     |
| F6    | Full pipeline with the first component (`Button`)                                  | Done     |
| F7    | The fields, and the browser checks that verify them                                | Done     |
| F8    | The rest of level 0 and level 1: the pieces with no dependencies                   | Two left |
| F9    | The layer base, and everything that depends on a portal                            | Two left |
| F10   | Composition: the pieces that arrange other pieces, and the first structural change | Now      |

Which components exist and in what order is not a phase question: it lives in
[catalog-and-build-order.md](./catalog-and-build-order.md), which is the list
that changes weekly. The phases above only say which part of the architecture
is being proved.

**F8 is deliberately left open**, not finished and not abandoned: `Progress` and
`ButtonGroup` are the two pieces of level 1 still pending, and neither blocks
anything. F9 went ahead of them because the layer base is a bottleneck that more
than twenty components wait on, which is criterion 1 of the catalog's own
ordering. Recorded here rather than marked Done, because a phase table that
rounds up is a phase table nobody believes.

**F9 is left open for the same reason**, and by the same criterion. The layer
base and seven layers landed, and `Menu` and `Select` landed in the middle of
F10 rather than here, by dependency: three of its features were waiting on
exactly those two (catalog §3.1). What is left of F9 is `SplitButton`, which
was waiting on `Menu` and is now unblocked.

**What F10 proves** is the one level of doc 04 that had never run: N3, a
structural change in JavaScript. Everything before it was N0, N1, N2 or the one
viewport exception. The contract was written in doc 04 §6.1 before the hook
existed, with the prediction it would be measured against — and the prediction
was **wrong**: the hook resolves no token, it reads a step CSS publishes. §6.2
has the measurement and §6.1 keeps the withdrawn text struck through, because a
prediction that is quietly deleted afterwards teaches nobody anything.

Nothing from the `0.1.1` codebase is carried over. It stays available under the
`v0.1.1` git tag.
