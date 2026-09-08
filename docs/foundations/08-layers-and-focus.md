# 08 · Layers and focus

> Everything that floats above the page — dialogs, popovers, menus, drawers,
> toasts — and where focus goes while they are open.
> One of the two bottlenecks of the build order: more than twenty components
> depend on this, and redesigning it later forces a change to everything.

**Status:** adopted · **Date:** 2026-09-07
**Depends on:** [01 · Principles](./01-principles.md) P3 ·
[03 · Tokens and theme](./03-tokens-and-theme.md) §4.5 ·
[04 · Responsive](./04-responsive.md) §5 ·
[06 · Accessibility](./06-accessibility.md) ·
[09 · Behavior](./09-behavior.md) §5 and §7

---

## 1. What was verified, and how

This document is written from a spike: a dialog with a select inside it and a
toast above it, exercised by keyboard in a real browser. What follows is marked
by how well it is known, because a rule believed on faith and a rule observed
are not the same thing.

| Behavior                                                                       | State                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `Escape` closes one level at a time, innermost first                           | **Verified** — in the browser and by an automated test |
| Focus moves into the layer on open, and is contained in a **modal** one        | **Verified** in the browser                            |
| Focus returns to the trigger on close                                          | **Verified** in the browser                            |
| A toast appears above a modal layer and is keyboard reachable while it is open | **Verified** in the browser                            |
| Page scroll is locked while a modal layer is open                              | **Verified** in the browser, at one level of nesting   |
| Scroll locking survives _nested_ modal layers                                  | **Verified** with `Dialog` and with `Drawer` — §6      |
| A popover blocks the page in three ways, and contains focus                    | **Verified** in the browser — §4                       |

Everything in that table now has an automated check behind it, in
`apps/catalog/e2e/layer.spec.ts`, rather than a memory of a spike. Two rows
gained something the spike could not give them: focus return is asserted
against a **decoy** control, so "focus went back to the page" does not pass for
"focus went back to the trigger"; and containment is asserted over twelve `Tab`
presses rather than one lap, because a trap that leaks on the second lap passes
the first.

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
- **While open**, focus is contained in a layer that **blocks the page**.
  Tabbing in a loop stays inside a dialog, a drawer or a popover. In a tooltip
  or a preview it does not, because those do not block anything — and trapping
  focus in one of them would be the bug
  ([doc 06](./06-accessibility.md) §4, point 10).

  **So containment is not configurable.** It follows from what the layer does,
  not from a prop. A `shouldTrapFocus` prop would let a consumer produce the
  case point 10 calls a bug, and there is no version of "trap the focus in this
  layer that blocks nothing" that is not better served by a dialog.

  ### The criterion above was corrected on 2026-09-08

  It used to read "**in a modal layer only**", with popovers and menus listed
  alongside tooltips as layers focus tabs out of, and it justified that with
  the base drawing the same line — "`Modal` asks for containment and `Popover`
  does not". **That was wrong twice, and it is worth keeping both halves
  visible because the second is the interesting one.**

  Wrong about the base, first. Measured in `react-aria-components` 1.21.0 and
  `react-aria` 3.52.0, with `Popover` built:

  ```js
  // Popover: containment is asked for when it renders as a dialog itself…
  shouldContainFocus: isDialog && props.trigger !== 'PreviewTrigger';
  // …and `isDialog` is turned OFF by a dialog already nested inside:
  setDialog(shouldBeDialog && !ref.current.querySelector('[role=dialog]'));

  // Overlay: but containment is an OR, and the second half is state that a
  // descendant switches on.
  contain: (props.shouldContainFocus || contain) && !isExiting;
  ```

  `useDialog` calls `useOverlayFocusContain()`, which calls `setContain(true)`
  on the enclosing `Overlay`. So **the shared `ModalSheet` is what contains the
  focus** in a Blackborne popover: the nested `role="dialog"` switches the
  popover's own request off, and the same nested dialog switches containment
  back on from the inside. Verified in a browser — `Tab` and `Shift+Tab`, eight
  presses each, never leaving the panel.

  That has a consequence for the layer being built next. The base excludes
  `PreviewTrigger` from containment by name, deliberately, and that exclusion
  is **defeated** by rendering `ModalSheet` inside a preview. A preview must
  therefore not use the shared sheet, or must not carry `role="dialog"`.
  Written down before `Preview` exists, so it is a prediction rather than a
  post-mortem.

  **Measured on 2026-09-08, and the prediction held.** With the shared sheet
  nested inside a `PreviewTrigger`'s popover, the panel loses `role="dialog"`
  to the sheet — the same swap `Popover` makes — and the sheet's `useDialog`
  then switches containment on in the enclosing `Overlay`, in a layer the base
  had deliberately excluded from it. A hover card with no close button that
  holds the keyboard is point 10 of
  [doc 06](./06-accessibility.md) §4 exactly.

  Two more things came out of the same measurement, and they shape the
  component rather than just forbidding a structure:

  - **A preview's panel is an UNNAMED dialog by default.** The base gives it
    `role="dialog"` even though it sets `isNonModal` — `shouldBeDialog` is true
    for a `PreviewTrigger` by name — and names it with nothing. Measured:
    `aria-labelledby` absent, `aria-label` absent, accessible name `null`. So a
    preview has to name its own panel, which is why its title is required and
    not decoration.
  - **The keyboard route in is the base's, and it is the difference from a
    tooltip.** `Tab` on the trigger moves focus to the first tabbable thing in
    the panel, `Escape` on the trigger closes it, and tabbing past the last one
    leaves — which is what containment would have broken. A tooltip has none of
    this and cannot: it is not focusable and it closes when the trigger blurs.

  And wrong as a rule, second, which is why the criterion changed rather than
  just the example. Measured on the same component: a popover renders a
  full-window underlay, locks the page scroll, and hides everything outside
  itself from the accessibility tree — all three keyed on nothing but
  `!isNonModal`, and none of them affected by `isDismissable`. A popover is a
  modal layer without a visible scrim. Focus that could tab out of it would
  land on a control that is `aria-hidden` and covered by an underlay that will
  not let it be clicked, which is worse than containment rather than better.

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

### 5.1 The case this rule did not cover — decided

The two halves above assume that "holds unsaved input" and "is modal" arrive
together, and there is one common shape where they do not: **a popover holding
a small form.** A filter panel with two fields and an Apply button is the
single most ordinary thing in a management application, and it lands on both
sides of the rule at once — it holds unsaved input, so it should not be
dismissed by a stray click, and it is a popover, so being forced to aim at a
close button is the failure the second half names.

Three ways out, none of them chosen yet:

1. **A popover never holds input**, and this shape is a dialog. Consistent, and
   it turns a lightweight interaction into a modal one.
2. **The Apply button is what makes it safe**: dismissing discards a filter
   nobody had applied yet, which is not the same loss as discarding a typed
   record. Plausible, and it depends on the popover's content in a way a
   component cannot inspect.
3. **The consumer says so**, which is a prop, and §5 exists precisely because
   this was decided rather than left as one.

**Decided on 2026-09-08, when `Popover` was built: option 3.** A popover is
dismissable by clicking outside **by default**, and a consumer may turn that
off with `isDismissable={false}`.

This section said there should be a real screen to decide it against by then,
and there was not one, so it was decided on principle. The three options above
are kept as they were written, because the reasoning that was available at the
time is the thing this document is for.

**Why the default is to dismiss.** A modal layer has a scrim, so clicking
outside it is clicking a dead area and a stray click there is genuinely an
accident. A popover does not block the page: clicking outside one is clicking
**deliberately at something else**. The person meant to reach the thing they
clicked, and a layer that stayed open while they used the page behind it would
be a panel hovering over content they are already editing.

**And why it is a prop rather than a rule.** A fourth option was considered and
not taken: that modality and dismissal are one decision — a layer that cannot
afford to lose work blocks the page, and a layer that does not block the page
closes when you use the page — which would have dissolved this section by
making `Popover` always dismissable and sending anything precious to a `Dialog`
or a `Drawer`. It was rejected because it turns a two-field filter into a modal
interaction, which is exactly the weight a popover exists to avoid.

**The cost, which is what §5 exists to make visible.** ~~The prop makes one odd
state reachable: a popover open and not dismissable, over a page that is still
fully interactive, so somebody can edit the thing behind it while it hovers.~~

**Corrected on 2026-09-08, the same day, by measuring the thing the paragraph
above assumed.** That state is not reachable, because the page behind an open
popover is not interactive. Measured in a browser, with `Popover` built: the
base renders an underlay at `position: fixed; inset: 0` over the whole window,
locks the page scroll, and hides everything outside the popover from the
accessibility tree — all three keyed on nothing but `!isNonModal`, and none of
them touched by `isDismissable`. §4 carries the numbers.

So the real cost of the prop is narrower, and it is the ordinary cost of a
modal layer rather than a new one: `isDismissable={false}` leaves `Escape` and
the close button as the only ways out, over a page that is already blocked —
which is exactly the shape of a `Dialog`. What the prop buys is that the panel
stays anchored and lightweight instead of becoming one.

**The reasoning behind the default is affected too, and it survives.** "A
popover does not block the page: clicking outside one is clicking deliberately
at something else" is half wrong — it does block the page — but the conclusion
holds for a better reason than the one it was argued from, and this one was
also measured: the underlay **swallows** the click. Clicking a button behind an
open popover dismisses the panel and does **not** press the button. So a stray
click costs a filter nobody had applied, and a deliberate click costs one
extra press rather than firing an action nobody aimed at.

A component still cannot inspect its own children to tell whether the content
is worth protecting, which is why this is a decision the consumer takes.

`Escape` and the close button work whatever this is set to. Nothing in this
library lets a layer swallow `Escape` except a component holding a promise it
was given ([doc 09](./09-behavior.md) §5.1).

## 6. Scroll locking, and the case that was not verified

While a modal layer is open, the page behind it does not scroll. Otherwise you
move the background while the layer stays put.

That works. What was **not verified** for most of this document's life was
nesting, and the failure mode is specific enough to name: open a dialog (scroll
locks), then open a drawer on top of it (locks again). When the drawer closes,
does the lock lift while the dialog is still open?

If the lock is not reference-counted, it does — and you are left with an open
dialog over a scrolling page. The spike had only one level of modal layer, so
this was never exercised.

**It was written here as a pending check rather than as a guarantee**, with the
check named in advance: open dialog, open drawer, close drawer, try to scroll
the page. It must not scroll. That is now done — §6.1 — and the paragraphs
below are kept as they were written, because the prediction being on the record
before the measurement is the only thing that made it a prediction.

**The prediction, on the record before the measurement.** Read in the base's
`usePreventScroll`: there is a module-level `preventScrollCount`, incremented
when a layer locks, decremented when it cleans up, and the restore runs only
when it reaches zero. It is reference-counted, so the nested case should hold.

That is a prediction and not the check, and the difference matters enough to
say why: reading the source says nothing about React's effect ordering, about
`StrictMode` invoking the lock twice, or about the mobile WebKit branch, which
is a separate code path in the same file. The value of writing it here is that
the prediction can be **wrong** — and a prediction written after the fact is
worth nothing, because it always agrees with what was found.

### 6.1 The prediction held, twice

**First with `Dialog`, ahead of time.** Two nested dialogs use the same
`usePreventScroll`, so the mechanism could be exercised as soon as there was one
layer: open a dialog, open a second, close the second, and the page still does
not scroll.

**Then with `Drawer`, which is the case this section actually describes.** A
dialog open, a drawer opened over it and closed, and the page still does not
scroll — two different components, two different mounts, and the one thing two
dialogs could not rule out is that each locks by a route the other does not.
Both hold.

Both halves are checked in each case, and the second is the one a lock bug hides
behind: a reference count that never reaches zero leaves the page
**permanently** frozen, which is a worse failure than the one above and looks
like nothing at all. So there is also a check that the page scrolls again once
every layer has closed.

**This section is no longer pending.** The row in §1's table says verified, and
what verified it is `apps/catalog/e2e/drawer.spec.ts` rather than a memory of
having tried it.

One thing found while checking it, and worth knowing before measuring any layer
that moves: **a drawer cannot be measured the moment it becomes visible.** It
slides, so between appearing and coming to rest it is partly off the edge it
came from — measured mid-flight, a 480px panel against the right edge of a
1280px window reported its far side at 1520. The base removes `data-entering`
when the entry ends, and that is the thing to wait for. A dialog never needed
this because it fades without travelling.

## 7. Toasts

Two findings, both consequential.

**The base's toast API is still unstable.** In `react-aria-components` 1.21.0
the toast exports carry an `UNSTABLE_` prefix — the only six unstable exports
out of two hundred and ninety-five. Counted again while writing §7.1, and both
numbers still hold.

**The queue is state, and it is not ours.** The base's toast queue is created
outside React, at module level. That is global state, and P3 forbids the
library from owning any.

The resolution is the same as everywhere else in this library: **the project
owns the queue and passes it in.** We provide the region and the presentation.
This is consistent with P2 and P3 rather than an exception to them, and it is
recorded now so that whoever builds `Toast` later does not reach for the
module-level default because it is what the base's examples show.

### 7.1 The deferral, and why it was lifted

**This section used to say `Toast` is deferred, on the API alone.** The
reasoning was that building a first-class component on exports the base marks
unstable buys a migration nobody scheduled, "and toasts are not a piece you
want to rewrite once consumers depend on their queue".

That premise turned out to be removable, and the amendment is recorded here
rather than quietly replacing it.

**Where the instability actually lives.** Measured in the installed tree: the
`UNSTABLE_` prefix is on the six **component** exports of
`react-aria-components` and nowhere else. The pieces underneath them are
exported without any prefix — `useToast` and `useToastRegion` from `react-aria`,
`useToastState`, `useToastQueue` and the `ToastQueue` class from
`react-stately`. What the base marks as unstable is the _assembly into
components_, which is precisely the layer a wrapper of ours replaces. The
behaviour is not experimental; the composition is.

**What removes the premise.** The one part we hand to a consumer is the queue,
and that is the one part a wrapper cannot shim — a rename inside our files
costs them nothing, a change to a class in their own type signatures costs them
a migration. So the queue is created by **a hook of ours**, and the base's class
never appears in a consumer's types. Ownership does not move: the consumer
holds what the hook returns, adds to it from wherever they can reach it, and
the library still owns no queue. Only the constructor moves.

**The reason it is not deferred any longer is not the version number.** It is
[doc 09](./09-behavior.md) §5: confirm or undo, never both, and **prefer undo**
whenever it is technically possible, because a confirmation repeated a hundred
times is answered automatically and stops protecting anything. A `ConfirmDialog`
with no `Toast` beside it ships the discouraged half of that pair and leaves the
preferred half with nowhere to live, which nudges every consumer toward the
thing this library's own foundation tells them to avoid. That is a coherence
problem, and it does not improve by waiting.

**What is still not absorbable, stated plainly.** A rename the wrapper eats. What
it cannot eat is behaviour we document as a guarantee and the base changes when
it stabilises: the timer pausing on hover and on focus, the overflow going to a
backlog rather than evicting, the announcement being assertive with no polite
mode, and landmark navigation being the keyboard route in. If any of those move,
our documented behaviour moves with them. The library is on `0.x`, where
[non-goal 11](./01-principles.md) permits exactly that break — and it never gets
cheaper than it is now.

**`Toast` is therefore built last in the layer batch**, after every other layer
has landed. If the prefix goes away in the meantime the migration costs nothing,
and if the component turns out badly it blocks nothing, because nothing else
waits on it.

## 8. Portals

Layers render in a portal. Two consequences:

- **The container is received, not assumed.** It arrives through
  `ConfigProvider`, beside the locale, the dictionary and the time zone,
  because it is the same category as those: something the project tells the
  library rather than something the library reaches out and takes (P3). An
  application with its own stacking context needs it, and with nothing supplied
  the base's own default — `document.body` — stands, so a component still works
  with no provider around it.

  **It is one provider and not a prop per component**, and that is measured
  rather than preferred. `ToastRegion` has no container prop at all: it reads
  the portal context and nothing else, so a per-component route cannot reach
  the toast region even in principle. And the per-component prop the base does
  expose — `UNSTABLE_portalContainer` on `Modal`, `Popover` and `Tooltip` — is
  deprecated in 1.21.0 in favour of that same provider.

  The provider is called `UNSAFE_PortalProvider`, and the prefix is not the one
  that deferred the toasts: in this base's vocabulary `UNSTABLE_` marks an API
  subject to change while `UNSAFE_` marks one that is supported but easy to hurt
  yourself with — the prefix `UNSAFE_className` has carried for years in React
  Spectrum as stable API. The deprecation notice points at it, so it is the
  route the base recommends, not a back door.

- **DOM order stops matching visual order**, which is why the focus rules in §4
  are not optional niceties here — moving focus into the layer, returning it to
  the trigger, and containing it in the modal case are the only thing keeping
  keyboard traversal coherent ([doc 06](./06-accessibility.md) §3). A portalled
  layer sits at the end of the document, so without them `Tab` from the trigger
  goes to whatever follows it on the page and not into the thing that just
  opened.

Portalled components are also the one legitimate place to query the viewport
([doc 04](./04-responsive.md) §5): their real container _is_ the window.

## 9. A note on how this is tested

Findings about verification itself, all learned the hard way — the first two
while writing this document, the rest while building `Dialog` against it.

**Verify after a full reload, never after a hot reload.** The spike showed a
dialog closing on `Tab` that, after a full page reload, did not reproduce on
any variant. Hot module replacement leaves layer and focus state stale —
unsurprisingly, given the module-level queue in §7. A layer bug observed on a
hot-reloaded page is not a bug until it survives a reload.

**And a reload is not enough if the server is older than the code.** A
Storybook process left running from the previous day survived a merge, a branch
switch and a `pnpm verify:clean` that deleted and recreated every
`node_modules` underneath it. It went on serving a catalog from before any of
that, and the first symptom was an indexing error naming a story file that had
not existed when it started. Anything reviewed by eye in that window was
reviewed against yesterday's code.

The layer batch makes this worse than it sounds, because the catalog imports
the library's **compiled** stylesheet: a change to a component's CSS is invisible
until `pnpm --filter blackborne build:css` runs. Two of `Dialog`'s checks were
diagnosed twice over against a stylesheet that did not contain the fix.

So: for a layer, the sequence is build the CSS, restart the server, then look.
A long-lived dev server is the one instrument in this repository that reports
green while checking nothing, and it does it silently.

**jsdom cannot answer focus questions.** A reproduction of that same behavior
was written and every case passed, because jsdom does not implement real
browser tab order. It is a fine instrument for "does `Escape` close the right
thing" and a useless one for "where does `Tab` go". Focus and layer behavior
needs a real browser, which means [doc 10](./10-quality-and-verification.md)
needs one sooner than its layer table implies.

**A ceiling is not a measurement of a size.** `Popover` shipped its panel two
pixels wide — its two borders — and the two browser checks written to guard the
panel's width both passed, because both asserted only a maximum and 2px is
under any maximum. The cause was inline-size containment on an element sized by
its contents ([doc 04](./04-responsive.md) §4.3); the reason it survived
review is the shape of the assertion. A layer's box wants both ends asserted,
and the cheap floor is the trigger's own width: a panel narrower than the
control that opened it is broken whatever the cause.

It also had no baseline. A picture would have shown it in one glance, and there
was no picture — the popover stories were written in the same session as the
checks, so the two instruments that would have caught each other's blind spot
arrived together. A new layer gets its screenshots before its geometry is
believed.

**And an assertion may not depend on how wide a string renders**, which is the
mistake made while fixing the one above. The floor was added, and so was its
opposite: that the panel REACHES its ceiling. That reads like the other half of
the same guard and is a measurement of a font — a content-sized panel touches
its maximum only when the story's longest unbroken line is wider than it, and
how wide a line is depends on which face `--bb-font-sans` resolved to. It
passed at exactly 480px on a Windows host and failed on CI's Linux container at
473.125: same code, same viewport, same resolved token.

This is the whole reason the visual project runs in a container
([doc 10](./10-quality-and-verification.md)) and it applies to assertions as
well as to screenshots. `checks` runs on the developer's host and on Linux in
CI, so a claim about text metrics has two answers there. Either it moves to the
containerised project, or it is restated without the font in the middle: a
ceiling from the token, and a floor that scales with the font on both sides —
"wider than the control that opened it" survives any face.

**A drawn shape can be measured correctly and never reach the screen.**
`Popover`'s arrow shipped invisible. Its box was where it belonged, its
`visibility` computed to `visible`, its rotation matrix was right, and the
check that asserted that rotation passed — a computed style says what a browser
intends, not what it painted. The panel's `overflow` erased it, because an
arrow is positioned outside the panel and the panel clips.

Two instruments would each have caught it and neither was pointed at it. The
screenshot that exists to show the arrow was generated with
`--update-snapshots` in the same session the component was written, so it
recorded the absence as the reference — **a baseline accepts whatever is there,
including a defect, and it does it silently.** And the geometry check tested
the transform because the transform was the interesting part of the CSS.

What tells the difference is hit-testing: clipped content is not hit-tested, so
`document.elementFromPoint` at the middle of a clipped arrow resolves to
whatever is behind the panel, and at a painted one resolves to its own `path`.
Measured in both states, and now asserted in all three layers that draw one.

The general form, for the next drawn thing: **assert that a point inside it
resolves to it.** A box, a computed style and a committed picture can all agree
while nothing is on the screen.

## 10. Verification

- [ ] `Escape` closes the innermost layer only, one press at a time
- [ ] Focus moves into the layer on open and returns to the trigger on close
- [ ] Focus is contained in a modal layer and **is not** in a popover, a menu
      or a tooltip, and neither is configurable
- [ ] Nothing beyond the layer container is autofocused without a written
      reason
- [ ] A layer holding unsaved input is not dismissable by clicking outside; one
      holding none is
- [ ] No public prop takes a physical placement value
      ([doc 02](./02-api-conventions.md) §3.3)
- [ ] Page scroll is locked while a modal layer is open
- [x] **Nested case:** dialog open, drawer opened and closed, page still does
      not scroll — §6.1
- [ ] Stacking values come from the public tokens, with no literal z-index
      anywhere
- [ ] The mount container is supplied through `ConfigProvider` and reaches
      every layer, the toast region included; with none supplied the base's
      default stands and no component needs a provider
- [ ] Toasts are reachable by keyboard while a modal layer is open
- [ ] Any toast queue is owned by the consumer, not by the library — and the
      base's queue class appears nowhere in a consumer's types (§7.1)
- [ ] Behavior confirmed in a real browser, after a full reload
