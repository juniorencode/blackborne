# 08 · Layers and focus

> Everything that floats above the page — dialogs, popovers, menus, drawers,
> toasts — and where focus goes while they are open.
> One of the two bottlenecks of the build order: more than twenty components
> depend on this, and redesigning it later forces a change to everything.

**Status:** adopted · **Date:** 2026-09-03
**Depends on:** [01 · Principles](./01-principles.md) P3 ·
[03 · Tokens and theme](./03-tokens-and-theme.md) §4.5 ·
[04 · Responsive](./04-responsive.md) §5 ·
[06 · Accessibility](./06-accessibility.md) ·
[09 · Behavior](./09-behavior.md) §7

---

## 1. What was verified, and how

This document is written from a spike: a dialog with a select inside it and a
toast above it, exercised by keyboard in a real browser. What follows is marked
by how well it is known, because a rule believed on faith and a rule observed
are not the same thing.

| Behavior                                                                       | State                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `Escape` closes one level at a time, innermost first                           | **Verified** — in the browser and by an automated test |
| Focus moves into the layer on open and is contained while it is open           | **Verified** in the browser                            |
| Focus returns to the trigger on close                                          | **Verified** in the browser                            |
| A toast appears above a modal layer and is keyboard reachable while it is open | **Verified** in the browser                            |
| Page scroll is locked while a modal layer is open                              | **Verified** in the browser, at one level of nesting   |
| Scroll locking survives _nested_ modal layers                                  | **Not verified** — see §6                              |

## 2. The layers, and their tokens

**Stacking order values are public tokens.** This is decided in
[doc 03](./03-tokens-and-theme.md) §4.5 and the reason bears repeating: the
consumer has their own fixed header and side panel with their own stacking
values, and needs to coordinate them with ours. If ours are closed, their only
route is to fight our CSS from outside.

| Token                | Value | For                                |
| -------------------- | ----- | ---------------------------------- |
| `--bb-layer-overlay` | 100   | The scrim behind a modal layer     |
| `--bb-layer-popover` | 200   | Popovers, menus, selects, tooltips |
| `--bb-layer-toast`   | 300   | Toasts, above everything           |

The gaps are wide on purpose, so a consumer can place their own layers between
ours without renumbering anything.

Being public tokens, **these names are API**. Renaming one is a breaking
change, exactly like renaming a prop.

## 3. Escape closes one level at a time

With a select open inside a dialog, the first `Escape` closes the select and
leaves the dialog open. The second closes the dialog.

This is the behavior the headless base already implements, it is what
[doc 09](./09-behavior.md) §8 declares (`Escape` cancels _the current level, one
at a time_), and it is covered by an automated test rather than trusted.

The rule for anything new: a layer never closes a layer it did not open.

## 4. Focus

- **On open**, focus moves into the layer. The base puts it on the layer
  container itself rather than the first control, and the first `Tab` then
  reaches the first control. This is correct and is left alone.
- **While open**, focus is contained. Tabbing in a loop stays inside. In a
  modal layer this is intentional and required; anywhere else, trapping focus
  is a bug ([doc 06](./06-accessibility.md) §4, point 10).
- **On close**, focus returns to the element that opened the layer.
- **Nothing is autofocused** beyond the layer container itself. Focusing a
  specific control on open is a per-component decision that needs a reason
  ([doc 06](./06-accessibility.md) §4, point 8).

## 5. Dismissable is a decision, not a default

A modal layer can be closed by clicking outside it. Whether it should be is not
a technical question — three placements of that setting were tested and all
behave identically.

**The rule: a layer that holds unsaved input is not dismissable by clicking
outside.**

[Doc 09](./09-behavior.md) §7 requires that closing by accident never discards
without warning. A dialog containing a form, dismissed by a stray click, is
exactly that failure. Such a dialog closes through its own actions, or through
`Escape`, which is deliberate.

A layer holding no input — a menu, a popover showing detail, a select — is
dismissable, and should be. Being forced to aim at a close button to dismiss a
menu is the opposite failure.

## 6. Scroll locking, and the case that is not verified

While a modal layer is open, the page behind it does not scroll. Otherwise you
move the background while the layer stays put.

That works. What is **not verified** is nesting, and the failure mode is
specific enough to name: open a dialog (scroll locks), then open a drawer on
top of it (locks again). When the drawer closes, does the lock lift while the
dialog is still open?

If the lock is not reference-counted, it does — and you are left with an open
dialog over a scrolling page. The spike had only one level of modal layer, so
this was never exercised.

**Written here as a pending check, not as a guarantee.** It is verified when
`Drawer` is built, and the check is: open dialog, open drawer, close drawer,
try to scroll the page. It must not scroll.

## 7. Toasts

Two findings, both consequential.

**The base's toast API is still unstable.** In `react-aria-components` 1.21.0
the toast exports carry an `UNSTABLE_` prefix — the only six unstable exports
out of two hundred and ninety-five.

**Decision: `Toast` is deferred**, and on the API alone. Building a
first-class component on exports the base itself marks unstable buys a
migration nobody scheduled, and toasts are not a piece you want to rewrite once
consumers depend on their queue. Revisited when the prefix goes away.

**The queue is state, and it is not ours.** The base's toast queue is created
outside React, at module level. That is global state, and P3 forbids the
library from owning any.

The resolution is the same as everywhere else in this library: **the project
owns the queue and passes it in.** We provide the region and the presentation.
This is consistent with P2 and P3 rather than an exception to them, and it is
recorded now so that whoever builds `Toast` later does not reach for the
module-level default because it is what the base's examples show.

## 8. Portals

Layers render in a portal. Two consequences:

- **The container is the consumer's business.** A component accepts where to
  mount and does not assume `document.body`. An application with its own
  stacking context needs this, and the library must not reach for the document
  on its own (P3).
- **DOM order stops matching visual order**, which is why focus containment and
  focus return are not optional niceties here — they are the only thing keeping
  keyboard traversal coherent ([doc 06](./06-accessibility.md) §3).

Portalled components are also the one legitimate place to query the viewport
([doc 04](./04-responsive.md) §5): their real container _is_ the window.

## 9. A note on how this is tested

Two findings about verification itself, both learned the hard way while writing
this document.

**Verify after a full reload, never after a hot reload.** The spike showed a
dialog closing on `Tab` that, after a full page reload, did not reproduce on
any variant. Hot module replacement leaves layer and focus state stale —
unsurprisingly, given the module-level queue in §7. A layer bug observed on a
hot-reloaded page is not a bug until it survives a reload.

**jsdom cannot answer focus questions.** A reproduction of that same behavior
was written and every case passed, because jsdom does not implement real
browser tab order. It is a fine instrument for "does `Escape` close the right
thing" and a useless one for "where does `Tab` go". Focus and layer behavior
needs a real browser, which means [doc 10](./10-quality-and-verification.md)
needs one sooner than its layer table implies.

## 10. Verification

- [ ] `Escape` closes the innermost layer only, one press at a time
- [ ] Focus moves into the layer on open, is contained while open, and returns
      to the trigger on close
- [ ] Nothing beyond the layer container is autofocused without a written
      reason
- [ ] A layer holding unsaved input is not dismissable by clicking outside; one
      holding none is
- [ ] Page scroll is locked while a modal layer is open
- [ ] **Nested case:** dialog open, drawer opened and closed, page still does
      not scroll
- [ ] Stacking values come from the public tokens, with no literal z-index
      anywhere
- [ ] The mount container can be supplied by the consumer; `document.body` is
      never assumed
- [ ] Toasts are reachable by keyboard while a modal layer is open
- [ ] Any toast queue is owned by the consumer, not by the library
- [ ] Behavior confirmed in a real browser, after a full reload
