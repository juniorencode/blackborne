# Decisions

One file per decision, named `NNNN-short-title.md`, dated, append-only.

A decision is recorded here when it closes a question that would otherwise be
re-argued. Each file states the context, the decision, the consequences that
follow from it, and when it is worth revisiting.

A decision is superseded by a later one, never edited in place — the point of
the folder is that you can see what was believed when.

| #                                                                     | Decision                                                             | In one line                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [0001](./0001-toolchain-versions.md)                                  | TypeScript stays on 5.9, ESLint moves to 10                          | The lint that enforces the foundations does not support TypeScript 7 yet     |
| [0002](./0002-headless-base.md)                                       | React Aria Components as the headless base                           | Interaction patterns are inherited, not rewritten                            |
| [0003](./0003-compiled-prefixed-css.md)                               | CSS ships compiled and prefixed                                      | Tailwind is internal; consumers override variables, not classes              |
| [0004](./0004-versioned-package-distribution.md)                      | Distribution as a versioned package                                  | No copy-paste templates; every need surfaces as a request                    |
| [0005](./0005-validation-stays-in-the-project.md)                     | Validation stays in the project                                      | The library restricts input and presents errors; no schema dependency        |
| [0006](./0006-no-container-query-polyfill.md)                         | No container query polyfill                                          | Narrow-first queries degrade gracefully; a project can add one globally      |
| [0007](./0007-prop-names-follow-the-base.md)                          | Prop names follow the headless base                                  | `isDisabled` and `onPress`, not `disabled` and `onClick`                     |
| [0008](./0008-the-rule-of-two-splits.md)                              | The rule of two splits                                               | Components are chosen; props still need a real case                          |
| [0009](./0009-a-switch-has-no-error-state.md)                         | A switch has no error state                                          | Immediate action, so nothing to validate later; that is a Checkbox           |
| [0010](./0010-the-card-declares-the-container.md)                     | The Card declares the container                                      | Something had to be first, or the container-query level stayed inert         |
| [0011](./0011-the-stepper-is-opt-in.md)                               | The stepper is opt-in                                                | The arrows already step the value; the buttons only cost trailing space      |
| [0012](./0012-growing-is-a-prop-not-a-public-hook.md)                 | Growing is a prop, not a public hook                                 | P6 asks for logic testable without rendering, and a measurement is not       |
| [0013](./0013-the-portal-container-arrives-with-the-configuration.md) | The portal container arrives with the configuration                  | One provider, because the toast region reads nothing else                    |
| [0014](./0014-cursor-pagination-is-its-own-component.md)              | Cursor pagination is its own component, not a mode                   | Two pagers that share no prop; one of them cannot know a total               |
| [0015](./0015-a-stepper-is-two-components.md)                         | A stepper is two components, and one of them is the project's        | One reports, the other is pressed; skipping is validation                    |
| [0016](./0016-a-link-is-a-component.md)                               | A link is a component, and navigation arrives with the configuration | `Link` navigates, `Button` acts; the router the consumer cannot reach        |
| [0017](./0017-a-field-says-what-the-base-does-not-announce.md)        | A field says what the base does not announce                         | A select's trigger carries no `aria-required`, so the word goes in the label |
