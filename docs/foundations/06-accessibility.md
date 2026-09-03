# 06 · Accessibility

> Accessibility is not added: it is inherited from the base and not broken on
> top of it.
> This document divides responsibility between the headless base, the library
> and the project, and defines what is verified before a component is done.

**Status:** adopted · **Date:** 2026-09-02
**Depends on:** [01 · Principles](./01-principles.md) ·
[03 · Tokens](./03-tokens-and-theme.md) ·
[04 · Responsive](./04-responsive.md) ·
[05 · Languages](./05-languages-and-formatting.md)

---

## 1. The level of commitment

**WCAG 2.2, level AA.** It is the level demanded in practice and the one that
can be sustained without turning every component into a negotiation. Level AAA
is not pursued generally; it is applied where it comes for free.

This level is not an aspiration: it is an entry condition. A component that
does not meet it is not published (the entry gate in doc 01).

### 1.1 A standard is met; a tool is used to verify

Two different things that must not be conflated:

|                              |                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| **What is met**              | The standard: correct semantic markup and accessibility attributes, per WCAG 2.2 AA          |
| **What it is verified with** | One concrete combination of screen reader and browser, chosen only as a measuring instrument |

The library **does not support specific products**. It is not programmed "for"
a screen reader, just as CSS is not written "for" a browser: the standard is
met and readers consume it. If the markup is correct, it works in all of them.

The real nuance is that they do not all announce identically, but the
differences are of verbosity, not usability: the serious failures — a button
with no name, an error that is not announced — show up in all of them equally.
That is why verifying with one combination yields practically all the
information.

**Verification combination:** NVDA with Chrome on Windows. Verified when a
component's behavior changes, not on every style change.

If a project has a requirement involving another reader — common in large
companies and public administration — nothing about the library changes: that
project adds that combination to **its** verification. It is their decision,
not the library's.

## 2. The division of responsibility

The most important part of the document. Confusing these three columns is what
makes accessibility nobody's job.

| Solved by the **headless base**            | Guaranteed by the **library**                  | Belongs to the **project**                     |
| ------------------------------------------ | ---------------------------------------------- | ---------------------------------------------- |
| Roles and ARIA attributes                  | That focus is **visible**                      | Heading hierarchy                              |
| Keyboard navigation for each pattern       | Sufficient contrast                            | Page structure and regions                     |
| Focus management and containment           | Minimum hit area                               | Overall logical order                          |
| Screen reader announcements                | Every label and every field-error relationship | Alt text for its own content                   |
| Collision and placement of floating layers | That state never depends on color alone        | Document language and title                    |
| Locale-aware formatting and keyboard       | Respecting reduced motion and zoom             | That its own components do not break the above |

**The first column is not reimplemented** (non-goal 6). If the base does not
cover a pattern, search first; building it by hand is the last resort and
requires a written justification.

And one sentence worth being clear about: the library **cannot** guarantee that
an application is accessible. It can guarantee that its pieces do not prevent
it.

## 3. What the library guarantees on top

This is where things fail in practice, because these are things the base cannot
decide for you.

**Visible focus.** The focus indicator is never removed without being replaced.
One single ring style for the whole library (doc 03), visible on any surface,
the accent surface included. It is the rule broken most often and the one that
shuts out the most people.

**A label on every control.** Visible or accessible, but always present.
Placeholder text inside the field **is not a label**: it disappears when you
type and many readers do not announce it.

**Field, description and error, related.** The error is associated with the
field and announced when it appears. A red message that exists only visually
does not exist for someone who cannot see it.

**Never color as the only channel.** Required, invalid, selected and active are
communicated with text, icon, shape or position as well. Checked by looking at
the interface in greyscale.

**Minimum hit area**, respected at every density, compact included (doc 04).
Compacting until this breaks is not an option.

**DOM order matching visual order.** If the layout reorders elements, keyboard
traversal becomes incoherent. This especially affects the structural changes in
doc 04.

**Focus return.** On closing a dialog or a menu, focus goes back where it was.
On deleting a row, it goes to a predictable destination, not to the top of the
page.

**Asynchronous messages announced.** Alerts, "loading", "3 results found": they
are announced through a live region. A silent change leaves a screen reader
user unaware anything happened.

**Icons.** Decorative ones are hidden from the reader; ones carrying meaning
have an accessible name. A button with only an icon always needs a name.

**Reduced motion and zoom.** Already covered in documents 03 and 04, verified
here.

## 4. Forbidden patterns

A short list with no exceptions. Any of these is grounds for rejection:

1. Removing the focus indicator without replacing it
2. A generic element with a click handler acting as a button — use the native
   element or the base's
3. Placeholder text inside the field as the only label
4. Tab order forced with positive values
5. Hiding something from the reader that is still focusable
6. Color as the only carrier of meaning
7. Disabling a control without any way to know why; if the reason matters, it
   is better to leave it focusable and explain the situation
8. Focusing something automatically on load without the person having asked
9. Text inside an image
10. Trapping focus without having decided to (in a dialog it is intentional and
    correct; anywhere else it is a bug)

## 5. Verification in three layers

With honesty about what each one detects:

| Layer                                                               | How much it covers                                                                                                                        | Cost                                                     |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Automated** — accessibility lint + analysis of the visual catalog | A small fraction: contrast, missing labels, malformed ARIA. It does not detect whether the order is logical or whether the keyboard works | Set up once                                              |
| **Keyboard, by hand**                                               | Most of what actually matters                                                                                                             | Two minutes per component                                |
| **Screen reader**                                                   | What neither of the other two sees: whether what is announced makes sense                                                                 | Slower; reserved for components with complex interaction |

**The automated layer is not the main one.** It is a cheap filter, not a
guarantee. The keyboard test has the best cost-benefit ratio in this whole
document: traversing the complete component without touching the mouse, in two
minutes, finds nearly everything serious.

Components that require a screen reader test, not just keyboard: dialog, menu,
combobox with search, date picker, table with selection and sorting, and
alerts.

## 6. Definition of done

- [ ] The whole component is reachable and operable **by keyboard alone**, in a
      logical traversal
- [ ] Focus is visible in every state and on every surface
- [ ] Every control has an accessible label; no field relies on its placeholder
      alone
- [ ] Errors are associated with their field and announced when they appear
- [ ] In greyscale everything is still understandable
- [ ] The hit area is respected at compact density too
- [ ] Focus returns to a predictable place on closing or deleting
- [ ] Asynchronous changes are announced
- [ ] Decorative icons are hidden from the reader; informative ones have a name
- [ ] At 200% zoom nothing overlaps
- [ ] With reduced motion nothing animates
- [ ] No pattern from section 4
- [ ] If it has complex interaction: tested with a screen reader

## 7. When something cannot be met

If a component cannot meet a point, it is not published silently with the gap:
it is documented in the component itself — what it does not meet, why, and what
the consumer must do to compensate. A known and written limitation is
manageable; an unknown one becomes a problem for the project that integrated
it.
