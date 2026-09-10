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

There is a third case, and it was missing here until a component met it: **the
base is correct and simply has no mode for what is needed.** React Aria's
separator is right in every way except that it cannot be made decorative — its
prop filter drops `role` and `aria-hidden` by design, so no combination of
props produces a divider a screen reader ignores.

The answer is not to reimplement the pattern, and not to ship the wrong
semantics. It is to **diverge on that one branch and say so in the component**:
the semantic separator comes from the base, the decorative one does not. What
keeps this from being a slippery slope is that it is a branch and not a
replacement — the moment a divergence covers the main path, it is a
reimplementation and needs the written justification non-goal 6 asks for.

And its mirror image, which is the more tempting mistake: **the base leaving an
attribute out is usually a decision, not an omission.** Its `RadioGroup` takes
an `orientation` and sets `aria-orientation`; its `CheckboxGroup` takes no such
prop, and that is correct — a radio group is one composite tab stop whose arrow
keys need to know which axis they run along, and a group of checkboxes has no
such navigation. Laying one out in a row is fine; announcing an orientation
nobody can act on is inventing semantics.

So a component may add the layout and may not add the ARIA. Where a component
does fill a gap, the reason goes in the file — and where it declines to, that
reason goes there too, because the next person will see the asymmetry between
two sibling components and assume it is an oversight.

And one sentence worth being clear about: the library **cannot** guarantee that
an application is accessible. It can guarantee that its pieces do not prevent
it.

### 2.1 When the library renders a heading anyway

The third column puts heading hierarchy with the project, which is right: only
the page knows what level anything is at. It leaves a question that a component
eventually asks anyway — what happens when the pattern **requires** a heading.

Three cases, and which one applies is not a matter of taste:

**1. The base supplies the level. Take it, and choose nothing.** A dialog's
title is the base's `Heading` filling the title slot, and the base's own
context supplies level 2. Measured while `ModalSheet` was written: a
hand-written `<h2>` in the same place leaves the layer with no accessible name
at all, because the id `aria-labelledby` points at comes from the slot. So the
element is the base's and the level comes with it.

**2. The pattern requires no heading. Render none, and have no prop.** A
`Preview`'s title names the panel through `aria-labelledby` and is not a
heading; a guessed `<h2>` would put an entry in the page outline for something
that exists while a pointer rests on a word.

**3. The pattern requires one and nothing supplies it. It arrives from the
project, and it is required.** An accordion is this case: the accordion pattern
asks that each header be a heading, the base's disclosure supplies no level,
and the base's own `Heading` defaults to 3 — a default that is right often
enough to hide the times it is wrong.

**Required rather than defaulted, and that is the whole point of writing this
down.** A wrong heading level is invisible. Nothing warns, nothing looks wrong,
and the only symptom is an outline that reads wrongly to somebody moving
through a page by its headings — the same class of defect as a token that
resolved to nothing, found only by the person it fails. Being told costs one
number. Guessing costs a reader who cannot see the page.

**And it belongs to the group, not to each item.** One level for the whole
accordion is part of what makes it a group; a level per item would type as
legal a group whose headers sit at three different depths.

A lone collapsible section renders no heading and takes no level: the
disclosure pattern asks for none, so case 2 applies.

## 3. What the library guarantees on top

This is where things fail in practice, because these are things the base cannot
decide for you.

**Visible focus.** The focus indicator is never removed without being replaced.
One ring for the whole library (doc 03), visible on any surface, the accent
surface included. It is the rule broken most often and the one that shuts out
the most people. It has **two mechanisms**, and which one applies is not a
choice — see §3.1.

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

### 3.1 One ring, two mechanisms

**Date:** 2026-09-08. This section read "one single ring style for the whole
library" until a component arrived that could not use it, and the sentence is
now more precise rather than weaker: the ring is one design — the ring colour
from `--bb-focus-ring`, in the brand unless the control carries a colour of its
own — with two ways of painting it.

| The element                     | How it rings                                               |
| ------------------------------- | ---------------------------------------------------------- |
| A box: a control, a card, a row | A **border** in the ring colour, plus a halo mixed from it |
| A run of text: a link           | An **outline**, 2px, offset 2px                            |

**The reason is mechanical, not aesthetic.** A border on an inline element
widens its inline box, so the words after it move sideways when focus lands —
twice per press of `Tab`, in a paragraph. An outline paints outside the box and
takes no part in layout at all, and on a link that wraps it follows each
fragment rather than boxing their union, which is exactly why a browser's own
focus ring works that way.

Two consequences worth stating, because both are easy to get backwards:

- **A box does not use the outline.** The border reads as part of the control,
  which is what makes the ring look like it belongs to the thing rather than
  drawn around it — and every control in this library already has a border to
  recolour.
- **Neither mechanism may be replaced by "nothing plus something else".** The
  one existing exception is `Button variant="link"`, which switches the ring
  off and replaces it with an underline appearing on focus. That is permitted
  because something visible still changes, and it is the reason this rule says
  never REMOVED rather than never changed.

Verified in a browser both ways, because neither can be seen in jsdom: that
the ring is painted, and — on the inline one — that the text after the link
does not move by so much as a tenth of a pixel.

**DOM order matching visual order.** If the layout reorders elements, keyboard
traversal becomes incoherent. This especially affects the structural changes in
doc 04.

**Focus return.** On closing a dialog or a menu, focus goes back where it was.
On deleting a row, it goes to a predictable destination, not to the top of the
page.

**Asynchronous messages announced.** Alerts, "loading", "3 results found": they
are announced through a live region. A silent change leaves a screen reader
user unaware anything happened.

**And announced once, by whoever caused the change.** This is the half that
gets missed. A component that merely _appears_ cannot know whether it has been
on screen since load or has just replaced a table because a filter came back
empty, so it declares no live region — the thing that swapped the content does.
Twenty skeleton lines that each announced would say "loading" twenty times, and
an empty state that announced itself on every render would interrupt somebody
who was already reading it.

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

**And the questions that pass has to answer**, collected as they were found,
because "run a screen reader over it" is not a task anybody can act on and
these are:

| Component     | The question                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Toast`       | Whether an assertive announcement actually interrupts, which is the whole reason `role="alert"` is on the content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `Breadcrumbs` | Two, now. Whether the trail wants a landmark — the base labels the list, and a `<nav>` named the same thing says the word twice in one breath. And whether the "…" of a folded trail reads as a step of it or as something beside it: it is an item of the list, holding a button that opens a menu of the steps it hid                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `Menu`        | **Measured:** the base wraps a menu in a popover that takes `role="dialog"`, labelled by the same trigger — so the tree is a dialog containing a menu, with one name on both. Whether that reads as noise or as nothing is what a person hears                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `Pagination`  | Both pagers are labelled lists rather than landmarks, because two identical landmarks are indistinguishable (axe's `landmark-unique`). Whether the list label is enough                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `Accordion`   | Whether the headings read as an outline at the level the consumer gave                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `Tabs`        | Its narrow structure is a select above the content, with no stated relationship between the two — a tabpanel announced where no tablist is reachable would be semantics nobody can act on ([decision 0018](../decisions/0018-a-tab-declares-its-own-panel.md)). Whether position alone is enough, or whether the pair needs saying out loud, is what a person hears                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `Select`      | **Measured:** the base does not put `aria-required` on the button a person operates — it puts `required` on the hidden native control it renders for a form — so the component composes the word into the label instead, and the name becomes "Currency required". Whether that reads as the state it is, or as part of the field's name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ComboBox`    | **Two, both measured.** The toggle's name is composed by the base: `aria-label="Show suggestions"` plus an `aria-labelledby` pointing at itself and at the field's label, so a reader hears "Show suggestions Doctor". Whether that reads as one useful name or as two things glued together is what a person hears — and it is the base gluing them, through element references rather than string concatenation. And the empty list is a ROW with `role="option"`, saying "No results" or "Nothing here yet": whether an option that cannot be chosen reads as an answer or as a broken choice. **A third arrived with several values**: the chips are not a grid — a `TagGroup` inside a combo box resolves the wrong collection ([decision 0022](../decisions/0022-several-values-are-a-union-and-the-chips-are-not-tags.md)) — so what a reader gets is the base's own value text through the field's description, plus a cross per value named "Remove Ana Vega". Whether that is enough to know WHICH values are held, and how many, is what a person hears |
| `Steps`       | **Two, and the second is a structure.** The indicator is `aria-hidden`, so a tick announces nothing and the word joins the title as hidden text — a completed step reads "Details completed", which is one name rather than a name and a state, the same arrangement `Select`'s required word has. Whether a reader hears the status as a status is what a person hears. And below the `medium` step the titles are `sr-only` rather than gone (doc 04 §11.4), so what is on the screen is four circles and what is in the tree is four named items: whether a list whose names are all invisible reads as helpful or as a mismatch                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `ButtonGroup` | A joined row LOOKS like one control and announces as several buttons, which is deliberate: every one of them is already named, and a `role="group"` would add something to announce and nothing to do with it (the argument `SplitButton` and `Pagination` both settled). Whether the mismatch between the two channels costs anything — whether somebody hearing "button Day, button Week, button Month" builds the same picture a sighted person gets from one bordered strip — is what a person hears                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `Avatar`      | **Measured, and half-settled.** The full name is on the box as `role="img"` with an `aria-label`, so a fallback showing "CR" is named "Carlos Ramos" — that much an aria snapshot confirms. What it does not settle is whether the letters INSIDE are also read: the ARIA specification marks `img` as "children presentational", and the snapshot reads `- img "Ana Vega": AV`, with the text still in the node. So the question is whether a reader says the name, or the name and then two letters — and if it is the latter, the letters need `aria-hidden` and the reason will be worth writing down                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Each of these is a question a measurement cannot settle, and every one of them
was reached by taking a decision that could be defended in writing. That is the
point of the list: it is what the third layer is FOR, rather than a ritual to
perform on everything.

### 5.1 What the automated layer does not cover in Arabic

**The contrast check does not run on Arabic text.** Not as a bug in this
repository and not as a setting anybody chose — it is how axe decides what
text is:

> `color-contrast` skips anything it takes for an icon-font ligature, and it
> decides that by rendering the text to a canvas and comparing the width of the
> whole string against the sum of its characters measured one at a time. A
> difference of 15% or more, in pixels and in width, means icon.

Arabic is a cursive script. Its letters join, so a string is far narrower than
its characters measured in isolation, and it crosses that threshold every time.
Measured at 30px `system-ui`, in the browser the catalog runs in:

| Text                 | Sum of characters | The string | Difference |
| -------------------- | ----------------- | ---------- | ---------- |
| `أستيريوس ديل سور`   | 314.5px           | 241.9px    | **0.231**  |
| `كالاو`              | 75.1px            | 55.1px     | **0.267**  |
| `Astilleros del Sur` | 220.9px           | 220.9px    | 0          |

So **no Arabic text in this catalog has ever had its contrast checked**, and
the same applies to any other connected script the library is used with —
Persian, Urdu, and the Indic scripts to varying degrees.

**Why that is survivable**, and it is worth being precise rather than
reassuring: contrast is a property of the colour PAIR, not of the script. Every
pair the library ships is `--bb-x-on-y` against `--bb-x`, and every pair also
appears in Latin text somewhere in the catalog, where it IS measured. A ratio
that drifted below 4.5:1 would be caught there.

**What it forbids** is the shortcut it invites: an RTL story contributes no
contrast coverage, so translating a story — or adding Latin text beside the
Arabic to satisfy the check — makes the guard pass without measuring anything
it was not already measuring. The catalog's contrast guard therefore excuses a
story whose only text axe declines, **by asking axe's own classifier**, and
says so when it fires. If axe ever stops declining Arabic, the coverage arrives
with no change on this side.

This was found by the guard firing on `Components/Preview / RTL`, the first
story in the catalog whose only visible text was Arabic. Every earlier RTL
story happened to keep a Latin word — a button label, a number — and that word
is what the contrast rule had been measuring all along.

### 5.2 And it does not cover the page behind an open layer

The second bound on the same layer, found by the same guard firing a second
time — on `Components/Select / RTL`, and only because the first fix that
suggested itself was tried and measured.

**While a modal layer is open, axe measures the layer's text and nothing
else.** The base marks everything outside an open layer `inert`, and axe's
contrast rule does not look inside an inert subtree. Measured on that story:
the catalog fixture's own line — Latin, painted, and not a ligature by axe's
own classifier — sat in an inert subtree, and the rule still reported
`inapplicable`. So a Latin sentence on the page behind does not rescue the
check, which is exactly the shortcut §5.1 forbids, arriving as a fix that looks
principled.

What is therefore never measured automatically: the scrim, the page behind it,
and the trigger's own appearance while its layer is open. Those are visual
baselines, which is where they belong — a screenshot sees a dimmed page and a
contrast rule was never going to say whether the dimming was right.

The consequence for the catalog's guard is that it counts only the text axe
would actually reach — painted **and** not excluded from the tree, both asked
of axe's own helpers. A guard that walked the whole page would have claimed
coverage of an inert page behind, which is the failure mode this whole section
exists to name: a check reporting more than it did.

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
