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

| #   | Document                                                                 | Status                               |
| --- | ------------------------------------------------------------------------ | ------------------------------------ |
| 01  | [Principles and non-goals](./foundations/01-principles.md)               | Adopted                              |
| 02  | API conventions                                                          | Pending — needs the React Aria spike |
| 03  | [Tokens and theme](./foundations/03-tokens-and-theme.md)                 | Adopted                              |
| 04  | [Responsive and adaptability](./foundations/04-responsive.md)            | Adopted                              |
| 05  | [Languages and formatting](./foundations/05-languages-and-formatting.md) | Adopted                              |
| 06  | [Accessibility](./foundations/06-accessibility.md)                       | Adopted                              |
| 07  | [Forms](./foundations/07-forms.md)                                       | Adopted                              |
| 08  | Layers and focus                                                         | Pending — needs the React Aria spike |
| 09  | [Behavior and interaction](./foundations/09-behavior.md)                 | Adopted                              |
| 10  | [Quality and verification](./foundations/10-quality-and-verification.md) | Adopted                              |

Documents 02 and 08 are not late: they describe things that can only be decided
by building, and writing them from imagination would produce rules the first
real component contradicts.

## Where the project stands

The library is being rewritten from scratch. Phases, in order:

| Phase | What                                                                  | State   |
| ----- | --------------------------------------------------------------------- | ------- |
| F1    | Close the past: tag, prune branches, empty the repo, deprecate on npm | Done    |
| F2    | Skeleton: workspace, root files, CI, templates                        | Done    |
| F3    | Documentation for AI agents                                           | Done    |
| F4    | Foundations, written in English                                       | Done    |
| F5    | One day with React Aria — decides documents 02 and 08                 | Pending |
| F6    | Full pipeline with the first component (`Button`)                     | Pending |

Nothing from the `0.1.1` codebase is carried over. It stays available under the
`v0.1.1` git tag.
