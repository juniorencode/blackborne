# 02 · API conventions

> How the public surface is shaped: what props are called, how variants are
> expressed, what is composed and what is a prop.
> Written after a day with the headless base, not before — these are the rules
> that only building can decide.

**Status:** adopted · **Date:** 2026-09-07
**Depends on:** [01 · Principles](./01-principles.md), in particular P6 and
non-goal 10 · [03 · Tokens and theme](./03-tokens-and-theme.md) §4.4 ·
[05 · Languages](./05-languages-and-formatting.md) §4 ·
[06 · Accessibility](./06-accessibility.md) §3

> **§11 was added on 2026-09-06.** The icon convention was a planned but unwritten
> piece of the catalog's level 0: its parts existed in documents 03, 05 and 06
> and the one thing none of them settled — how an icon reaches a component —
> was blocking four components at once. Nothing above it changed.

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

### 3.1 One vocabulary for `size`

**`sm | md | lg`, everywhere, and a component uses the subset it needs.**

Not every `size` means a control height — `Spinner` is measured against the
type scale and is not a control at all — so the words are deliberately about
relative size and nothing more. A component with two steps uses `sm` and `md`
and stops there.

The rule exists because the alternative arrived on its own: a component was
written with `'default' | 'compact'`, each name defensible in isolation, and
the library ended up with two vocabularies for one idea — the "two different
ways to do the same thing" of [doc 01](./01-principles.md) §7.

**`compact` in particular is taken.** It is a value of the density axis
(doc 03 §3), which the application sets on a container and which composes with
`size` rather than replacing it. A `size="compact"` that has nothing to do with
compact density is a collision that costs somebody an afternoon.

### 3.1.1 A group's appearance reaches its options through context

Some variants belong to a **set** rather than to a component: a radio group of
selectable cards is cards all the way down, and a group with two cards and one
bare circle is not a thing anyone wants. But the options are elements the
consumer writes as children, so the variant has to travel.

**It travels by context, and the context is never exported.** §10 already puts
contexts on the not-public list, and exporting this one would be non-goal 10's
escape hatch arriving by another route — a consumer reaching past the group to
dress one option differently.

Two alternatives, and why neither works:

- **A render prop** is excluded by §5, and its replacement — a hook — is for
  state a consumer needs to READ. This travels the other way, from us to our
  own children, so there is nothing for a hook to expose.
- **The variant repeated on every option** types the mixed set as legal, which
  is the impossible combination §3 rejects booleans for. It also puts one value
  in five places, so the group's appearance becomes whatever the fifth child
  says.

Two constraints come with it. The context carries **appearance only** —
behaviour and accessibility wiring already come down the base's own context,
and a second channel for the same thing is [doc 01](./01-principles.md) §7. And
the value stays a primitive, so there is no object identity to memoise and no
way for a consumer to be surprised by a re-render.

### 3.2 One vocabulary for `align`

**`start | center | end`, and it means the text inside the control.**

Never `left` and `right`. That is doc 03 §5 rule 4 and half of the RTL support
— a field aligned `right` in an Arabic form is aligned to the wrong edge, and
lint catches the class but not a prop value, so the prop has to be named
correctly in the first place.

Worth being explicit about what it is not, because the two get conflated: this
aligns the **value inside its box**, not the label against the control and not
the field inside the form. Where the label sits is a property of the form and
arrives with the structural pieces of [doc 07](./07-forms.md) §7.

### 3.3 One vocabulary for `placement`, and it is exactly twelve

Where a floating layer sits against the thing that opened it — a tooltip, a
popover, a menu, a select's list. One closed set, shared by every one of them,
so that "below, aligned to the start" is spelled the same way everywhere.

**Twelve values: four sides, three alignments each.**

|            | centred  | aligned to start | aligned to end |
| ---------- | -------- | ---------------- | -------------- |
| **above**  | `top`    | `top start`      | `top end`      |
| **below**  | `bottom` | `bottom start`   | `bottom end`   |
| **before** | `start`  | `start top`      | `start bottom` |
| **after**  | `end`    | `end top`        | `end bottom`   |

The number is not a coincidence and it is worth knowing where it comes from.
The base's own union has **twenty-four** names: these twelve, and twelve
physical duplicates — `bottom left`, `bottom right`, `left`, `left top`,
`right bottom` and the rest. The physical half is not extra capability. It says
the same thing as the logical half in an LTR interface and the **wrong** thing
in an RTL one, which is the whole of doc 03 §5 rule 4 and §3.2 above.

So the twelve are not a subset we picked for tidiness: they are the complete
set of positions, and the other twelve are the same positions named in a way
that breaks in Arabic. **A public prop never accepts a physical value**, and
because a prop value is not a class, lint cannot catch this one — the type has
to be right in the first place.

Two consequences to know before styling anything against it:

- **The reflected attribute is coarser than the prop.** The base writes
  `data-placement` on the layer, and it carries only the **axis** — `top`,
  `bottom`, `left`, `right`. So CSS can orient an arrow, and it cannot tell
  `bottom start` from `bottom end`. Anything that needs the alignment has to
  read the prop.
- **The physical names in that attribute are the base's, not ours.** Reading
  `[data-placement="left"]` in a stylesheet is fine and unavoidable; putting
  `left` in a prop, a token or a class is not.

`offset` is deliberately **not** part of this. The distance between a layer and
its trigger is spacing, it comes from a token, and it is one value for the whole
library — the point of having a system is that every tooltip sits the same
distance from the thing it describes. A consumer passing `offset={13}` is a
literal, and [doc 03](./03-tokens-and-theme.md) §5 rule 1 admits none.

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

**And `className` sets what the component does not set — it does not overrule
what it does.** A component's own utility and a consumer's have the same
specificity, so the winner is whichever the generator emitted last, which is
not something either of us chose. Measured: `.bb\:h-[1lh]` lands after
`.bb\:h-10` in the compiled sheet, so a consumer sizing a component through
`className` silently got nothing.

That is not a gap in what §6 grants — margin, width, grid position are exactly
the properties components leave alone, and there `className` is reliable. It is
a limit on what may be _promised_: a component that needs to be overridable in
a property it sets itself says so with a named prop, or accepts `style`, which
has no argument to lose.

## 7. No polymorphism

**No `as` prop, and no `asChild`.** A component renders the element it renders.

The reason is not purity: polymorphic components have types that are hard to
read and hard to keep correct, they let a consumer swap a semantic element for
a wrong one, and they are a route around the accessibility guarantees in
[doc 06](./06-accessibility.md). Where a different element is genuinely needed
— a link that looks like a button — that is a named component, decided
deliberately.

### 7.1 The first time that escape was used

**Date:** 2026-09-08. For a long time nothing used it. A link in this library
was `Button variant="link"`, which is the same shape from the other side: a
button that looks like a link. It was enough for what it was for — an action
that should not shout, in an empty state or beside a field.

**`Breadcrumbs` is what made it insufficient**, and not for a reason about
appearance. A breadcrumb trail is the thing people open in another tab. A
`<button>` cannot be middle-clicked, offers no "copy link address", ignores
ctrl-click and cmd-click, and does not appear in the list a screen reader
builds of the links on a page. None of that is styling. It is what the element
is for.

So `Link` exists, and the two are not two ways to do one thing:

> **`Link` navigates. `Button` acts** — including `Button variant="link"`.

The test is whether there is an address. If the thing has one, an anchor is the
right element and everything a browser does with links comes free. If pressing
it runs a function, it is a button whatever it is wearing.

**And this is where a prop would have been the expensive answer.** The
alternative was an `href` on `Breadcrumb`, on `Tab` and on a pagination page —
three components acquiring anchor semantics, each with its own version of what
happens when the address is missing. P5's asymmetry, out loud: one component
too many sits apart, and one prop too many lives in three places forever. The
navigation half of the decision is in
[decision 0016](../decisions/0016-a-link-is-a-component.md).

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

## 11. Icons

The library **distributes no icons and depends on no icon set** (catalog §7:
an icon pack is a permanent "never"). Icons are received. What this section
settles is how they are received, because that part had been decided in
fragments across four documents and never in one place.

### 11.1 An icon arrives as a child, not as a prop

**Decision: `<Button><SaveIcon />Save</Button>`, never `<Button icon={…} />`.**

This is §3 applied without an exception: appearance is a prop, structure is
composition. An icon is content sitting beside other content, so it composes.

The alternative is worth naming because it is the one most libraries pick, and
it looks tidier at first. `iconStart` and `iconEnd` would be **two props on
every component that can show an icon** — button, badge, menu item, alert,
empty state, and each one after them. That is P5's accumulation, arriving
component by component instead of all at once, and each pair is a prop that
takes a major version to remove.

**The exception, and its test.** A named prop is correct when the component
owns a slot the consumer cannot express through children — `EmptyState`'s
illustration sits above the title, not in the flow of a sentence, and no
ordering of children puts it there. The test: _could the consumer have placed
it themselves by ordering children?_ If yes, it is a child. If no, it is a
named slot, and the slot is named for its role — `icon`, `illustration` — not
for its position.

### 11.2 Size and colour come from the slot

The consumer passes no size and no colour.

|            | Where it comes from                                                           |
| ---------- | ----------------------------------------------------------------------------- |
| **Size**   | The component sizes the SVG from CSS, at the one standard size (doc 03 §4.6d) |
| **Colour** | `currentColor`, inherited from the text colour of the slot                    |

Both are guarantees, not requests. The size is set in CSS on the SVG inside the
slot, and CSS beats the `width` and `height` attributes an icon library writes,
so an icon set that defaults to 24px still comes out at ours without the
consumer configuring anything.

Colour has one condition the library cannot enforce: **the icon must be drawn
with `currentColor`.** Every mainstream icon set already is. One that hard-codes
a colour will ignore the theme — it will not follow dark mode, and it will not
follow an overridden brand. That is the consumer's to fix, and it is written
here so the failure is recognisable when it happens.

The consequence people are surprised by: an icon inside `variant="primary"`
comes out in the accent-on colour without anyone asking, because the button
already set the text colour and the icon inherits it. That is the whole point —
one icon used in six contexts is correct in all six.

### 11.3 Accessibility: the name goes on the control

Doc 06 §3 requires decorative icons to be hidden from the reader and meaningful
ones to have a name. Split by who can know which is which:

**An icon beside a label is decorative.** The label already says what the
control does; a second announcement is noise. The consumer marks it
`aria-hidden`, which every icon set accepts as a pass-through. The library
cannot do it for them: the icon is a child, and wrapping arbitrary children to
add an attribute is exactly the internal-node reach §6 forbids.

**In a named slot, the library hides it**, because there the wrapper is already
ours and no reach is involved. The condition that makes this safe is that a
component with an illustration slot has text that is always present — a title
with a dictionary fallback — so the illustration can never be the only carrier
of meaning. A slot without that guarantee does not get to be silent.

**An icon that is the entire content of a control is not decorative — and its
name still does not go on the icon.** It goes on the control, as `aria-label`.
A button whose only child is an icon and which carries no label has no name,
and that is the single most common accessibility defect in a component library.

The reason the name belongs on the control rather than on the icon: the icon is
the consumer's, while the accessible name is a user-facing string, and doc 05
keeps those in the dictionary or in a prop. An `aria-label` **is** a label
somebody reads, even though nobody sees it.

### 11.4 The library does not flip a received icon

Doc 05 §4 says directional icons flip in RTL and real-world objects do not.
Only the meaning decides which, and the meaning is not visible from an
arbitrary SVG.

**So: the library flips the icons it draws itself — a select's chevron, a
pagination arrow — and never flips one it received.** A consumer with a
directional icon flips it in their own layer.

This is a smaller rule than it looks. Almost every directional icon in a
management interface belongs to a component that draws its own.

### 11.5 What is never accepted

- **An icon named by string.** `icon="save"` requires a registry that maps
  names to drawings, and a registry is an icon set arriving through the back
  door. Icons are values, passed as elements.
- **A required icon library.** No component's types name one, and nothing
  breaks if a project uses a different set, two sets, or hand-written SVGs.
- **An icon as the only carrier of meaning.** Doc 06 §3 again: state is never
  communicated by one channel, and an icon on its own is one channel.

## 12. Verification

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
- [ ] A `size` is `sm | md | lg` and an `align` is `start | center | end`,
      never `left`/`right` and never a second vocabulary
- [ ] A `placement` is one of the twelve logical values, and no public prop
      accepts a physical one — the base offers twenty-four names and half of
      them are wrong in RTL (§3.3)
- [ ] The distance between a layer and its trigger is not a prop
- [ ] Icons arrive as children, or as a named slot the consumer could not have
      placed themselves — never as `iconStart`/`iconEnd` and never by name
- [ ] An icon's size and colour come from the slot, so the consumer passes
      neither
- [ ] A control whose only content is an icon carries its name on the control
