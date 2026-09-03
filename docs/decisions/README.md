# Decisions

One file per decision, named `NNNN-short-title.md`, dated, append-only.

A decision is recorded here when it closes a question that would otherwise be
re-argued. Each file states the context, the decision, the consequences that
follow from it, and when it is worth revisiting.

A decision is superseded by a later one, never edited in place — the point of
the folder is that you can see what was believed when.

| #                                                 | Decision                                    | In one line                                                              |
| ------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| [0001](./0001-toolchain-versions.md)              | TypeScript stays on 5.9, ESLint moves to 10 | The lint that enforces the foundations does not support TypeScript 7 yet |
| [0002](./0002-headless-base.md)                   | React Aria Components as the headless base  | Interaction patterns are inherited, not rewritten                        |
| [0003](./0003-compiled-prefixed-css.md)           | CSS ships compiled and prefixed             | Tailwind is internal; consumers override variables, not classes          |
| [0004](./0004-versioned-package-distribution.md)  | Distribution as a versioned package         | No copy-paste templates; every need surfaces as a request                |
| [0005](./0005-validation-stays-in-the-project.md) | Validation stays in the project             | The library restricts input and presents errors; no schema dependency    |
| [0006](./0006-no-container-query-polyfill.md)     | No container query polyfill                 | Narrow-first queries degrade gracefully; a project can add one globally  |
