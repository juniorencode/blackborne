# Blackborne

A UI component library for React, built for **management applications**:
internal dashboards, CRUD screens, dense forms, and listings with filters and
data tables.

It is not a general-purpose UI kit. Content sites, e-commerce and marketing
pages are explicitly out of scope and do not influence any decision.

> **Status: rewriting.** Blackborne is being rewritten from scratch and is not
> usable yet. `0.1.1` is deprecated on npm and its code stays available under
> the `v0.1.1` tag. The rewrite will ship as `0.2.0`.

## What makes it different

- **Accessibility is inherited, not bolted on.** Built on React Aria
  Components; WCAG 2.2 AA is an entry condition, not an aspiration.
- **Themed by CSS variables.** Three independent axes — mode, brand color and
  density — each set by redefining variables on a container. Nestable.
- **RTL from day one.** No physical `left`/`right` anywhere; enforced by lint.
- **Container-driven, not viewport-driven.** A component adapts to the width of
  its own container, so it works in a 320px side panel on a 1920px screen.
- **You don't have to use Tailwind.** CSS ships compiled and prefixed. Tailwind
  is an internal implementation detail.
- **State lives in hooks.** Complex sets (tables, dense forms) ship as hooks +
  presentational pieces + a thin optional assembly — never as one component
  that does everything through accumulated props.

## Repository layout

```
packages/blackborne/   the published package
apps/catalog/          the visual catalog (Storybook)
docs/                  foundations, dated decisions, guides
```

## Getting started (contributors)

```sh
pnpm install
pnpm verify
```

`pnpm verify` runs the full gate: formatting, lint, types and tests.

## Documentation

`docs/` is the source of truth. Start at [docs/README.md](./docs/README.md).

The two worth reading before writing any code:

- [Adding a component](./docs/contributing/new-component.md) — whether it
  belongs in the library at all, how to design it as a suite, and the
  twelve-checkbox gate it has to pass.
- [Commits and pull requests](./docs/contributing/commits-and-prs.md) — the
  format, and the branching model.

The ten foundation documents are being written (phase F4);
[docs/README.md](./docs/README.md) tracks what exists and what does not.

If you work with an AI agent in this repository, [CLAUDE.md](./CLAUDE.md) maps
it: layout, commands, the hard rules, and the traps specific to this project.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and pull requests are welcome.

Note the support expectation up front: this is open source published in good
faith and used in production by its authors. Reports and proposals are
accepted, with no commitment to timelines or to acceptance.

## License

[MIT](./LICENSE) © Carlos Junior Ramos Vásquez
