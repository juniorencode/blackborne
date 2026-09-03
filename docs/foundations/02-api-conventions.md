# 02 · API conventions

> How the public surface is shaped: what props are called, how variants are
> expressed, what is composed and what is a prop.
> Written after a day with the headless base, not before — these are the rules
> that only building can decide.

**Status:** adopted · **Date:** 2026-09-03
**Depends on:** [01 · Principles](./01-principles.md), in particular P6 and
non-goal 10 · [03 · Tokens and theme](./03-tokens-and-theme.md) §4.4

---

## 1. Follow the base's naming

**Decision: prop names follow React Aria Components, not HTML.**

So: `isDisabled`, `isRequired`, `isInvalid`, `isReadOnly`, `isSelected`. And
`onPress`, not `onClick`.

This is a real divergence from what a newcomer expects, and it is worth being
honest about the cost: `disabled` is what HTML uses and what most of the
ecosystem uses. We pay some initial surprise, and we pay it back by documenting
it prominently in the getting-started guide.

Two reasons make it the right trade anyway.

**The mechanical one.** Optional props are forwarded to the base **by rest
spread** (§2). Renaming them breaks the spread, and every component would need
a hand-written translation layer — across thirty-one components, each with the
type friction described below, for no benefit.

**The substantive one.** `onPress` is not a stylistic quirk. It handles mouse,
touch, pen and keyboard uniformly, which is exactly what
[doc 04](./04-responsive.md) §8 requires: nothing may depend only on the mouse.
Using `onClick` would mean reimplementing that, badly.

Consistency inside the library matters more than partial resemblance to HTML.
Half-matching is worse than either choice made cleanly.

## 2. Forward optional props by spread, never by name

The repository sets `exactOptionalPropertyTypes`. That makes this a **type
error**:

```tsx
// Wrong: our value is `boolean | undefined`, the base's prop is `boolean?`
<TextField isInvalid={isInvalid} />
```

And this correct:

```tsx
function Field({ label, description, ...textFieldProps }: FieldProps) {
  return (
    <TextField className="field" {...textFieldProps}>
```

The rest object preserves optionality; naming the prop does not.

**Consequence for how components are written:** a wrapper derives its props
from the base's and passes them through as one object. It does not enumerate
them. When a single optional value genuinely has to be passed by name, the form
is a conditional spread:

```tsx
<Input {...(placeholder === undefined ? {} : { placeholder })} />
```

That is friction, and it is the reason §1 chose not to rename anything. Keep it
rare.

## 3. Variants are props; structure is composition

**Appearance is a prop. Structure is composition.** That is the whole rule.

- `variant` and `size` are props, drawn from a **closed set** of named options.
- A field is composed: label + control + description + error.

Two things this forbids:

**No boolean per variant.** `isPrimary`, `isDanger`, `isGhost` allow impossible
combinations and grow without limit. One `variant` prop cannot be in two states
at once.

**No variant expressed by composition.** A danger button is not a different
component and not a wrapper. It is `variant="danger"`.

Variants resolve through **one typed map per component**, in a single place, as
[doc 03](./03-tokens-and-theme.md) §4.4 already requires. No class conditionals
scattered through the file.

## 4. Style against DOM state attributes

React Aria exposes component state as attributes on the DOM: `[data-focused]`,
`[data-focus-visible]`, `[data-hovered]`, `[data-pressed]`, `[data-invalid]`,
`[data-disabled]`, `[data-readonly]`, `[data-selected]`.

**Styling targets those attributes. Never a conditional class string built in
JavaScript.**

This was the main hypothesis tested in the spike, and it held: every state
needed — including focus-visible as distinct from focus, and pressed as distinct
from hovered — was reachable from CSS alone.

Why it matters beyond taste: state lives in the DOM, where CSS can see it and
where a debugger can show it. Class strings computed in render are invisible in
the inspector and impossible to style from outside.

If a state ever turns out not to be reachable this way, that is a finding worth
writing down, not a licence to add a class conditional.

## 5. Render props stay hidden; state comes out as hooks

React Aria's render-prop pattern is how it hands internal state to children:

```tsx
<Dialog>{({ close }) => /* ... */}</Dialog>
```

**Decision: render props are not part of our public API.**

But hiding them has a cost that must be paid, not ignored. That `close` is a
real need: a consumer will want their own button inside a dialog that closes
it. If render props are hidden and nothing replaces them, that need has no
route.

**What replaces them: hooks.** A component that has internal state worth
reaching exposes it through a named hook, usable from anywhere inside that
component's subtree — `useDialog()` returning `{ close }`, and so on.

This is not a workaround. It is P6 applied literally: a capability is a hook,
never one more prop and never a render prop. It also keeps the JSX readable,
which is the reason the decision came up at all.

## 6. `className` on the root, nothing on the internals

Non-goal 10 forbids escape hatches. It does not forbid layout.

- **Accepted:** `className` and `style` on the **outermost element** of a
  component. A consumer legitimately needs to place a component in their
  layout — margin, width, grid position.
- **Never:** any prop that reaches an internal node. No `classNames={{ input:
…, label: … }}`, no `inputProps`, no slot-targeting objects.

The line is exactly the one non-goal 10 draws: outside is the consumer's,
inside is ours. A consumer who needs to change something inside gets a named
prop or gets composition — never a hole.

## 7. No polymorphism

**No `as` prop, and no `asChild`.** A component renders the element it renders.

The reason is not purity: polymorphic components have types that are hard to
read and hard to keep correct, they let a consumer swap a semantic element for
a wrong one, and they are a route around the accessibility guarantees in
[doc 06](./06-accessibility.md). Where a different element is genuinely needed
— a link that looks like a button — that is a named component, decided
deliberately.

## 8. Controlled, with an uncontrolled shortcut

Every value-bearing component works controlled: a value prop and a change
callback. That is the core, and it is what makes a field testable without a
form ([doc 07](./07-forms.md) §3).

`defaultValue` exists for the uncontrolled case, because a quick trial should
not require wiring state. It is a convenience, not the primary mode.

## 9. Refs

Every component forwards a ref to its outermost element. Nothing exposes refs
to internal nodes — same line as §6.

## 10. What is public

The export map is deliberately narrow. What is not exported does not exist, and
opening an export later is easy while closing one is not.

Public: components, their prop types, the hooks from §5, and the semantic
tokens from [doc 03](./03-tokens-and-theme.md) §4.5.

Not public: anything named for internals, every primitive token, and every
context or state object the base exposes that we have not deliberately chosen
to re-export.

**A prop name is API.** Renaming one is a breaking change, exactly like
renaming a token.

## 11. Verification

- [ ] Prop names match the base: `isDisabled`, `isRequired`, `isInvalid`,
      `isReadOnly`, `onPress`
- [ ] Optional props are forwarded by spread, not enumerated by name
- [ ] Variants are a closed `variant`/`size` prop resolved through one typed
      map, with no boolean-per-variant
- [ ] Every visual state is styled from a DOM state attribute, with no class
      conditional in render
- [ ] No render prop in the public API; internal state that consumers need is
      exposed as a hook
- [ ] `className` is accepted on the root only; nothing targets an internal
      node
- [ ] No `as` and no `asChild`
- [ ] The component works controlled, and `defaultValue` works uncontrolled
- [ ] The ref reaches the outermost element and nothing else
- [ ] Nothing is exported that was not deliberately chosen
