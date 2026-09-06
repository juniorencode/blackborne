# Blackborne

A UI component library for React, built for **management applications**:
internal dashboards, CRUD screens, dense forms, and listings with filters and
data tables.

> **Status: early.** The library is being rewritten from scratch. `0.1.x` is
> deprecated. The API will break between minor versions until `1.0`.

## Install

```sh
pnpm add blackborne
```

`react` and `react-dom` (v19) are the only peer dependencies.

## Use

```tsx
import { Button } from 'blackborne';
import 'blackborne/styles.css';

export function Example() {
  return (
    <Button variant="primary" onPress={() => console.log('pressed')}>
      Save changes
    </Button>
  );
}
```

**Two things that surprise newcomers**, both deliberate: props are named
`isDisabled` rather than `disabled`, and the handler is `onPress` rather than
`onClick`. The library follows its headless base, React Aria, rather than HTML.
`onPress` is also the better handler — it covers mouse, touch, pen and keyboard
uniformly.

## Theming

Three independent axes, all set the same way: by putting attributes on a
container. They combine, and they nest.

```tsx
<div data-bb-mode="dark" data-bb-density="compact">
  {/* everything inside is dark and compact */}
</div>
```

| Attribute         | Values                        |
| ----------------- | ----------------------------- |
| `data-bb-mode`    | `light` (default), `dark`     |
| `data-bb-density` | `normal` (default), `compact` |

The library does **not** detect the system colour scheme, and does not
remember a choice. Your application decides and passes the resolved value.

Colours are CSS variables, so overriding is CSS. There are two levels, and
they differ in one important way.

**Overriding a semantic token works anywhere.** It holds a value, so plain
inheritance delivers it:

```css
:root {
  --bb-accent: #6d28d9;
  --bb-accent-on: #ffffff; /* always set the pair */
}
```

Every background token has a paired `-on` token for the text that goes on it.
Set them together — that is what keeps contrast correct when a brand colour is
light.

**Overriding the brand scale needs `data-bb-theme` on the same element.**
The scale is a set of primitives that the semantic tokens are computed from,
and a CSS `var()` resolves where it is declared, not where it is used. The
attribute is what tells the library to recompute the mapping in that scope:

```css
.my-brand {
  --bb-x-brand-3: #f3e8ff;
  --bb-x-brand-9: #7c3aed;
  --bb-x-brand-10: #6d28d9;
  --bb-x-brand-11: #5b21b6;
}
```

```tsx
<div className="my-brand" data-bb-theme="my-brand">
  …
</div>
```

Without the attribute the override silently does nothing — the semantic tokens
stay resolved against the default scale. If a brand override appears to have no
effect, that attribute is the first thing to check.

## RTL

Supported from the first release. Set `dir` on a container and the interface
flips; the library contains no physical `left`/`right` anywhere.

```tsx
<div dir="rtl">…</div>
```

## Tailwind

Not required. CSS ships compiled and prefixed, so Tailwind is an internal
implementation detail and cannot collide with yours.

## Size

Doc 10 is blunt about this: a budget without a number is not a budget,
because when you exceed it you do not find out. Measured at `0.2.0`, with
ten components:

| What                    | Now                   | Budget                 |
| ----------------------- | --------------------- | ---------------------- |
| `dist/index.js`         | 18.1 kB (3.9 kB gzip) | — see below            |
| `dist/styles.css`       | 26.3 kB (5.1 kB gzip) | 60 kB raw / 12 kB gzip |
| Published tarball       | 36.8 kB               | —                      |
| `pnpm verify`           | 46 s                  | 90 s                   |
| Browser checks          | 191 s                 | 300 s                  |
| Automated accessibility | 141 s                 | 240 s                  |
| Visual regression       | 90 s                  | 240 s                  |

**The JavaScript budget is deliberately structural rather than a number.** With
one component, any total figure would be a guess that gets raised every time a
component lands, which is a budget in name only. The commitment that actually
holds is: **importing one component pulls in that component and nothing else.**
Every module is side-effect free apart from the stylesheet, and no dependency
is bundled — `react` and `react-aria-components` stay external so your
bundler deduplicates them.

The CSS number is a real ceiling. Most of the current 18 kB is the token layer,
which is a fixed cost paid once; utilities grow slowly because the scales are
restricted and only what components use is emitted.

**Why the slow layers get their own numbers.** Doc 10 §8 warns that a check
which runs everything before every change ends up switched off, so the fast
gate and the slow one are budgeted separately. `pnpm verify` runs before every
commit and has to stay under a minute; the browser layers run in their own CI
job and are allowed minutes.

The ceilings sit at roughly one and a half times the current figures — room for
the components still to come, tight enough that a doubling shows up. All of
them grow with the component count, so they will be revisited; the point of
writing them down is that the revision happens with data rather than by nobody
noticing.

Budgets are revised when exceeded, with data. They are not ignored and not
raised quietly.

## Support

Open source published in good faith and used in production by its authors.
Reports and proposals are welcome, with no commitment to timelines or to
acceptance.

## License

[MIT](https://github.com/juniorencode/blackborne/blob/main/LICENSE)
