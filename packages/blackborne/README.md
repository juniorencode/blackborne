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

### Fields accept the input attributes you already know

The prop names above are the ones that changed. The ordinary HTML input
attributes did not: every text-based field forwards them to the `<input>` it
renders, so they work without a wrapper and without a library-specific name.

```tsx
<TextField
  label="Username"
  maxLength={32}
  minLength={3}
  pattern="[a-z0-9_]+"
  inputMode="text"
  autoComplete="username"
/>
```

`maxLength`, `minLength`, `pattern`, `inputMode`, `autoComplete`, `name`,
`type` and the rest of the input attributes reach the control. This is written
down because it is the kind of thing people ask for as a feature request: they
are already here, and a prop nobody knows exists is as useless as one that is
missing.

Two of them are worth a note:

- **`maxLength` restricts; `minLength` does not.** A browser stops the
  thirty-third character, so a maximum is enforced. A minimum cannot be — you
  cannot stop somebody typing too few — so it sets the attribute and nothing
  more. Deciding a short value is invalid is the project's, like every other
  judgement about whether a value is any good.
- **`autoComplete` is left at the browser's default, which is on.** Turning it
  off by default would break password managers and address autofill, and that
  is not the library's call to make for your screen. Pass `"off"` where you
  want it off.

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
because when you exceed it you do not find out.

**These ceilings are read by `pnpm --filter blackborne check:budget`**, from
this table and from nowhere else, and it fails with the delta. That is new, and
it arrived the way the sentence above predicts: the numbers were published here
at `0.2.0` with nothing reading them, and on 2026-09-10 `dist/styles.css` was
66.5 kB against a 60 kB ceiling. Nobody found out.

| What              | Ceiling                |
| ----------------- | ---------------------- |
| `dist/index.js`   | structural — see below |
| `dist/styles.css` | 80 kB raw / 12 kB gzip |
| Published tarball | 220 kB                 |

**There is no "now" column any more**, on purpose. It said 38.2 kB while the
file was 66.5 kB, because a number written in prose has nobody to keep it true
— which is the failure doc 10 §11.6 is about, and it was the least reliable
thing on this page. The current figures are printed by the check; a snapshot
with the date on it is below.

Measured on 2026-09-11, at fifty-one components: `dist/index.js` 304.1 kB
(85.0 kB gzip), `dist/styles.css` 68.0 kB (10.8 kB gzip), published tarball
165.4 kB.

**The tarball ceiling came down from 450 kB to 220 kB on the day it was
written**, because the package stopped shipping a minified bundle and the
967 kB source map that existed to undo it — two thirds of the download, for a
file whose only job was to give back the names the line above had taken away
([decision 0026](../../docs/decisions/0026-the-package-ships-what-a-consumer-can-read.md)).
The tarball went from 398.8 kB to 165.4 kB, and an identifier in a stack trace
went from `cs` to `useConfig`. A ceiling with 285 kB of slack in it is not a
ceiling.

**The CSS raw ceiling was raised from 60 kB to 80 kB, with the data doc 10 §7
asks for.** 60 kB was set when the library had eight components and 26.3 kB of
CSS. There are fifty-one now, and the growth is real work rather than waste.
The gzip half was NOT raised and is the one that binds: 10.8 kB against 12 kB,
which is what actually crosses the wire, and it has 1.2 kB left in it.

**The JavaScript budget is deliberately structural rather than a number.**
While the component count is still growing, any total figure is a guess that
gets raised every time one lands, which is a budget in name only. The commitment that actually
holds is: **importing one component pulls in that component and nothing else.**
Every module is side-effect free apart from the stylesheet, and no dependency
is bundled — `react` and `react-aria-components` stay external so your
bundler deduplicates them.

It is also **not minified**, which is why its raw figure is larger than a
bundle-size habit expects. A library is an input to your bundler and your
bundler minifies your application; doing it twice saves your users nothing and
costs them every name in a stack trace.

The CSS number is a real ceiling, and the shape of its growth is the thing
worth watching rather than the total: most of it is the token layer, a fixed
cost paid once. Seven components landing at once moved it by 12 kB raw and
under 2 kB gzipped, because the scales are restricted and only what components
actually use is emitted.

The weight ceilings sit above the current figures with room for the components
still to come, and tight enough that a doubling shows up. They grow with the
component count, so they will be revisited; the point of writing them down is
that the revision happens with data rather than by nobody noticing.

Budgets are revised when exceeded, with data. They are not ignored and not
raised quietly.

### Duration, recorded rather than asserted

Doc 10 §8 warns that a check which runs everything before every change ends up
switched off, so the fast gate and the slow one are kept apart: `pnpm verify`
runs before every commit and the browser layers run in their own CI job.

The durations are **not** in the table above and `check:budget` does not read
them, which is deliberate. A check that fails when a suite takes too long is a
check on how loaded the machine was — doc 10 §11's whole subject, and something
this repository has already paid for three times. So they carry a date and the
machine instead, and a person reads them:

| Layer                             | 2026-09-11, GitHub `ubuntu-latest`, 2 workers |
| --------------------------------- | --------------------------------------------- |
| `pnpm verify`, the whole fast job | 1 m 49 s, of which `pnpm verify` is 1 m 36 s  |
| Behaviour checks, 438             | 3 m 18 s                                      |
| Automated accessibility, 480      | 5 m 23 s                                      |
| Visual regression, 196            | 2 m 17 s                                      |
| The browser job, end to end       | 11 m 52 s                                     |

Read from the workflow log rather than estimated, and the worker count is part
of the measurement rather than a detail: Playwright resolves `workers: '50%'`
against the runner, which is four cores there and twelve on the laptop every
earlier figure in this repository was taken on.

## Support

Open source published in good faith and used in production by its authors.
Reports and proposals are welcome, with no commitment to timelines or to
acceptance.

## License

[MIT](https://github.com/juniorencode/blackborne/blob/main/LICENSE)
