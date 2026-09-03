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

## Support

Open source published in good faith and used in production by its authors.
Reports and proposals are welcome, with no commitment to timelines or to
acceptance.

## License

[MIT](./LICENSE)
