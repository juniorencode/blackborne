# Decisions

One file per decision, named `NNNN-short-title.md`, dated, append-only.

A decision is recorded here when it closes a question that would otherwise be
re-argued. Each file states the context, the decision, the consequences that
follow from it, and when it is worth revisiting.

A decision is superseded by a later one, never edited in place — the point of
the folder is that you can see what was believed when.

| #                                                                               | Decision                                                                 | In one line                                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [0001](./0001-toolchain-versions.md)                                            | TypeScript stays on 5.9, ESLint moves to 10                              | The lint that enforces the foundations does not support TypeScript 7 yet                     |
| [0002](./0002-headless-base.md)                                                 | React Aria Components as the headless base                               | Interaction patterns are inherited, not rewritten                                            |
| [0003](./0003-compiled-prefixed-css.md)                                         | CSS ships compiled and prefixed                                          | Tailwind is internal; consumers override variables, not classes                              |
| [0004](./0004-versioned-package-distribution.md)                                | Distribution as a versioned package                                      | No copy-paste templates; every need surfaces as a request                                    |
| [0005](./0005-validation-stays-in-the-project.md)                               | Validation stays in the project                                          | The library restricts input and presents errors; no schema dependency                        |
| [0006](./0006-no-container-query-polyfill.md)                                   | No container query polyfill                                              | Narrow-first queries degrade gracefully; a project can add one globally                      |
| [0007](./0007-prop-names-follow-the-base.md)                                    | Prop names follow the headless base                                      | `isDisabled` and `onPress`, not `disabled` and `onClick`                                     |
| [0008](./0008-the-rule-of-two-splits.md)                                        | The rule of two splits                                                   | Components are chosen; props still need a real case                                          |
| [0009](./0009-a-switch-has-no-error-state.md)                                   | A switch has no error state                                              | Immediate action, so nothing to validate later; that is a Checkbox                           |
| [0010](./0010-the-card-declares-the-container.md)                               | The Card declares the container                                          | Something had to be first, or the container-query level stayed inert                         |
| [0011](./0011-the-stepper-is-opt-in.md)                                         | The stepper is opt-in                                                    | The arrows already step the value; the buttons only cost trailing space                      |
| [0012](./0012-growing-is-a-prop-not-a-public-hook.md)                           | Growing is a prop, not a public hook                                     | P6 asks for logic testable without rendering, and a measurement is not                       |
| [0013](./0013-the-portal-container-arrives-with-the-configuration.md)           | The portal container arrives with the configuration                      | One provider, because the toast region reads nothing else                                    |
| [0014](./0014-cursor-pagination-is-its-own-component.md)                        | Cursor pagination is its own component, not a mode                       | Two pagers that share no prop; one of them cannot know a total                               |
| [0015](./0015-a-stepper-is-two-components.md)                                   | A stepper is two components, and one of them is the project's            | One reports, the other is pressed; skipping is validation                                    |
| [0016](./0016-a-link-is-a-component.md)                                         | A link is a component, and navigation arrives with the configuration     | `Link` navigates, `Button` acts; the router the consumer cannot reach                        |
| [0017](./0017-a-field-says-what-the-base-does-not-announce.md)                  | A field says what the base does not announce                             | A select's trigger carries no `aria-required`, so the word goes in the label                 |
| [0018](./0018-a-tab-declares-its-own-panel.md)                                  | A tab declares its own panel, and the narrow structure is not a tab list | One declaration cannot drift from itself; a select claims no tab roles                       |
| [0019](./0019-a-breadcrumb-declares-its-address.md)                             | A breadcrumb declares its address                                        | The same step has to be a link in the row and a row in the menu                              |
| [0020](./0020-a-date-crosses-the-boundary-as-a-string.md)                       | A date crosses the boundary as a string                                  | The base's calendar objects stay inside; `2026-09-09` is the public value                    |
| [0021](./0021-a-combo-box-extends-the-bases-filter.md)                          | A combo box extends the base's filter, so its options are declarations   | A filter that cannot be seen from inside the collection is not a filter                      |
| [0022](./0022-several-values-are-a-union-and-the-chips-are-not-tags.md)         | Several values are a union, and the chips are not tags                   | One context per collection: a tag inside a combo box resolves the wrong one                  |
| [0023](./0023-today-comes-from-the-configured-zone.md)                          | Today comes from the configured zone, or is not marked at all            | The base's `data-today` is the browser's answer to the consumer's question                   |
| [0024](./0024-a-colour-crosses-as-a-string-and-the-format-is-declared.md)       | A colour crosses as a string, and the format is declared                 | More than one correct way to write one value, so the format cannot be guessed                |
| [0025](./0025-the-package-ships-one-declaration-file.md)                        | The package ships one declaration file                                   | 110 extensionless re-exports made every published type `any` under nodenext                  |
| [0027](./0027-the-library-hands-over-the-shape-the-project-performs-the-act.md) | The library hands over the shape; the project performs the act           | Export, print and the address bar had no answer in any document, and four rules only pointed |
| [0026](./0026-the-package-ships-what-a-consumer-can-read.md)                    | The package ships what a consumer can read                               | A map is not how you buy back the names minification took; 398.8 kB to 165.4                 |
