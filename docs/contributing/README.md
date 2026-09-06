# Contributing docs

How to _work on_ the library. Repository-level workflow lives in
[../../CONTRIBUTING.md](../../CONTRIBUTING.md); this folder holds the detailed
recipes.

| Document                                       | What it covers                                                                                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [new-component.md](./new-component.md)         | The full recipe for adding a component: whether it belongs at all, how to design it as a suite, the thirteen-checkbox entry gate, and how to actually check each box |
| [visual-regression.md](./visual-regression.md) | How the appearance checks work, why they run in Docker, and the one habit that decides whether they are worth having                                                 |
| [commits-and-prs.md](./commits-and-prs.md)     | Commit format, pull request format, and the branching model                                                                                                          |

## Working with an AI agent

Two files are written for agents and are worth reading yourself, because they
are the shortest statement of the rules that exists:

- [`../../CLAUDE.md`](../../CLAUDE.md) — repository-wide: layout, commands, the
  eight hard rules, and the traps specific to this project
- [`../../packages/blackborne/CLAUDE.md`](../../packages/blackborne/CLAUDE.md) —
  library source: token layers, theme axes, fields, exports, what to test

They are deliberately short. They point at these documents rather than
restating them, so there is only ever one place a rule can be wrong.
