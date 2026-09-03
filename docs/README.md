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

## Foundations

Written in build order. Two of them (02 and 08) are deliberately written
_after_ the React Aria spike, because that spike is what decides their content.

| #   | Document                    | Status                               |
| --- | --------------------------- | ------------------------------------ |
| 01  | Principles and non-goals    | Pending                              |
| 02  | API conventions             | Pending — needs the React Aria spike |
| 03  | Tokens and theme            | Pending                              |
| 04  | Responsive and adaptability | Pending                              |
| 05  | Languages and formatting    | Pending                              |
| 06  | Accessibility               | Pending                              |
| 07  | Forms                       | Pending                              |
| 08  | Layers and focus            | Pending — needs the React Aria spike |
| 09  | Behavior and interaction    | Pending                              |
| 10  | Quality and verification    | Pending                              |

Start with 01. It is the first one written and the last one changed, and it
carries the twelve-checkbox gate every component must pass.

## Where the project stands

The library is being rewritten from scratch. Phases, in order:

| Phase | What                                                                  | State       |
| ----- | --------------------------------------------------------------------- | ----------- |
| F1    | Close the past: tag, prune branches, empty the repo, deprecate on npm | Done        |
| F2    | Skeleton: workspace, root files, CI, templates                        | In progress |
| F3    | Documentation for AI agents                                           | Pending     |
| F4    | Foundations, written in English                                       | Pending     |
| F5    | One day with React Aria — decides documents 02 and 08                 | Pending     |
| F6    | Full pipeline with the first component (`Button`)                     | Pending     |

Nothing from the `0.1.1` codebase is carried over. It stays available under the
`v0.1.1` git tag.
