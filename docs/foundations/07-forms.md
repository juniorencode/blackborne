# 07 · Forms

> Defines where the library ends and the project begins, on the most delicate
> subject in a management application.
> The rule that sums it up: the library **restricts input and presents the
> error**; the project **decides whether the value is valid**.

**Status:** adopted · **Date:** 2026-09-02
**Depends on:** [01 · Principles](./01-principles.md) P2 and P6 ·
[05 · Languages](./05-languages-and-formatting.md) ·
[06 · Accessibility](./06-accessibility.md)

---

## 1. The division

| Library                                                      | Project                                                |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| That a numeric field rejects letters                         | Whether the number is acceptable to the business       |
| Formatting a phone number as it is typed                     | Whether that phone number should exist                 |
| Preventing an impossible date from being typed               | Whether that date is valid for the operation           |
| Length, minimum and maximum limits                           | Cross-field rules, uniqueness, server queries          |
| **Presenting** the error with correct accessibility          | **Deciding** there is an error and writing the message |
| States: empty, editing, invalid, disabled, read-only, saving | When each one is entered                               |

Direct consequence: **no schema library is a dependency of this package.**
Fields expose "is invalid" and "error message"; where those come from is the
consumer's business. The project uses whatever validation tool it likes.

## 2. Three things that get called the same

The usual confusion, and each deserves a distinct name:

- **Input restriction** — what the field will not let you type. It is widget
  behavior, it happens while you type, and it belongs to the library.
- **Normalization** — what the field silently _rewrites_ as you type: forcing
  upper case, stripping spaces, folding accents away. Also the library's, also
  while typing, and **not the same thing as restriction**: restriction refuses
  a keystroke, normalization accepts it and changes it.
- **Validation** — the judgement about whether the value is any good. It
  happens on blur or on submit, it depends on the business, and it belongs to
  the project.

When they are mixed, the pattern to avoid appears: business rules embedded in a
component. That is what turns a reusable field into a field that only works for
one application.

### 2.1 Normalization is a pure function, never a set of props

It was two categories here until a fourth component needed the same five
transformations. That is the signal P6 describes: **a capability is a hook, not
one more prop.**

Three reasons it cannot be props, in order of how much they cost:

1. **The order is the whole thing.** Upper case then strip accents is not the
   same as strip accents then upper case. Five booleans have no order — either
   the component fixes one, and the consumer cannot change what they most need
   to change, or it exposes one, and they were never booleans.
2. **Four components need it.** TextField, TextArea, a tags input and a numeric
   field. Five props each is twenty props for one idea.
3. **It is testable without rendering**, which is a box on the entry gate that
   otherwise gets ticked on faith.

**What it must not do:** decide a value is wrong. Folding `José` to `Jose` in a
name field is a defect, not a feature, and the component cannot know which
field it is in — so the consumer composes the pipeline and owns that call. The
library ships the transformations and the order, not the policy.

**A field holding SEVERAL values normalizes at commit, not while typing.**
"As you type" has no meaning when what is being typed is a draft that becomes
one of many values — and following it literally breaks the field outright: a
pipeline of `allowOnly(/[A-Z0-9]/)` eats the comma, so nothing can ever be
committed. So each value goes through the pipeline as it is accepted, and the
consolation is that the caret problem below does not arise at all.

**And the part that only a browser can answer:** rewriting a value while
somebody types **moves the caret**. Force upper case and the cursor jumps to
the end mid-word, which is doc 09 §7 — nothing moves under the cursor —
happening on every keystroke. jsdom does not implement selection, so a unit
test cannot see it.

### 2.2 The end of a field is contested space

**Date:** 2026-09-09. Six things were counted here, and the seventh was sitting
in plain sight: the chevron of a field that opens a layer. It never competed,
because a `Select`'s whole trigger is the button that opens the list — so the
mark inside it costs no hit area and takes nobody's turn. A `ComboBox` is where
the counting starts, with a text input people type into, a button that shows
the whole list, and this edge asked for a clear button as well.

Seven different things want to sit at the trailing edge of a control, and until
they were counted, each was decided by whoever added it:

| What                    | Whose it is                      |
| ----------------------- | -------------------------------- |
| A suffix affix (`.com`) | The consumer's                   |
| The clear button        | The field's                      |
| The busy indicator      | The field's                      |
| The stepper (`±`)       | The numeric field's              |
| The reveal toggle       | The password field               |
| An invalid marker       | The field's                      |
| The disclosure chevron  | The field's, if it opens a layer |

They cannot all be present, and the resolution is not "make room for all
seven". It is an order of precedence, decided once here:

1. **Busy wins outright — but the space stays.** While a field is waiting or
   saving, the clear button and the stepper stop being reachable: hidden from
   the reader, unfocusable, unclickable. Offering to clear a value that is
   mid-flight is offering an action the field cannot honour, and doc 06 §4
   point 7 is explicit that a control which cannot act is worse than one that
   is absent.

   What must NOT happen is the space closing up behind it. A control at the
   edge occupies real width, so removing it widens the box and the value slides
   across — doc 09 §3, nothing moves when data arrives, broken by the field's
   own busy state. The same applies to a clear button that appears with the
   first character typed: reserve its room from the start, or every field grows
   a twitch.

   So the rule is **unreachable, not absent**. That was written as "not
   rendered at all" and it was wrong in a way only building it showed: the two
   phrases describe the same thing to a reader and different things to a
   layout.

2. **The reveal toggle never yields**, because without it a password field
   loses a capability rather than an affordance.

   Which has a consequence the rule did not anticipate: the busy indicator is
   drawn at that same edge, so it lands on the glyph. The field clears the
   indicator's lane while busy and the toggle moves inward for the duration.
   The value does not move — it is aligned from the other end and the box only
   narrows — and the alternative was a spinner painted across the one control
   that is meant to stay usable.

   A **disabled** field is different from a busy one, and the toggle is
   disabled with it. Read-only means "read this", so revealing is that state's
   own affordance; disabled means "this does not apply", so nothing inside it
   acts. Disabled rather than removed, so nothing shifts and the reason is
   visible in the field around it.

   Nothing re-masks on its own — not on blur, not on submit, not on a timer.
   When a secret should stop being visible is a policy, and policy is the
   project's.

3. **A suffix affix and a control never share the edge.** An affix is text the
   consumer wrote; a button is a target. Putting them side by side halves the
   target, and doc 06 §3's minimum hit area is not negotiable at compact
   density. A field with both keeps the control and moves the affix ahead of
   it.
4. **At most one library-owned control at a time.** A field showing a stepper
   does not also show a clear button: the arrows already reach every value
   including the empty one.

   **Amended 2026-09-10**, and the amendment is the clause that was doing the
   work all along: _the arrows already reach the empty one_. The rule is not
   about tidiness, it is that a second control is redundant — so where a
   field's value has **no other route to empty**, the second control is not
   redundant and the rule does not apply. §2.2a has the case that found it and
   what it has to prove before it is allowed.

5. **A field that opens a layer keeps the chevron and has no clear button.**

   The chevron wins for the reason
   [decision 0011](../decisions/0011-the-stepper-is-opt-in.md) gave the numeric
   stepper: a keyboard opens the list with `ArrowDown`, and a pointer has
   nothing else. A field that filters its own options and shows no way to see
   all of them is a field hiding what it holds.

   Clearing, meanwhile, has routes that cost no width at all — an option that
   returns to no value, declared the way every other option is, and in a field
   holding several values the remove button each value already carries.

   **What is not available is the usual answer**, which is to swap the chevron
   for a cross while the pointer is over the control. Something that appears
   only on hover is not there on a touch screen and is never there for a
   keyboard — measured on `Tooltip`, where the same fact is why nothing
   interactive may live inside one. The two cannot take turns, so one of them
   wins permanently, and it is the one with no alternative route.

   **Left open: emptying a whole set in one gesture.** A field holding several
   values can be emptied one value at a time and not all at once, and this rule
   does not answer that. It is not settled by putting the button back either,
   because the width it wants is the width the values are using. It is measured
   where it appears rather than decided here.

   **Date:** 2026-09-09. The first field of that shape now exists, and what it
   found narrows the question rather than answering it: every value carries its
   own cross, so what is missing is the one gesture and not the ability. It
   also found a second rule this section did not have — while such a field's
   list is OPEN, the base hides everything outside it from a reader, so a cross
   that stayed in the tab order would be a control somebody could reach and
   never be told about. It goes out of reach and stays visible, which is rule 1
   again with the other half of the pair moving.

   **Date:** 2026-09-10 — **and this rule now has an exception, in §2.2a.** The
   sentence it rests on is "clearing has routes that cost no width at all", and
   a date field has none of them: there is no option that returns to no value,
   no per-value cross, and — measured — no way for the field to report that
   somebody emptied it. Where the premise is false the conclusion does not
   follow, so the answer is an exception with its own conditions rather than a
   rule quietly bent.

And one exception to the reservation, for a field whose box **wraps**: it
reserves the indicator's lane in every state rather than only while busy. 36px
appearing at the end of a wrapping row can push a value onto a new line, which
changes the height of the field while somebody waits — a worse shift than the
one reserving the lane was meant to prevent. It was written for the field that
holds several values typed one at a time, and it covers, unchanged, the combo
box that holds several the same way.

The rule behind all five: **the trailing edge belongs to at most one thing, and
the field decides which** — with the one exception §2.2a states and bounds. A
field that lets a CONSUMER stack them is a different matter and still forbidden:
that is a field whose hit areas depend on how it was configured, which is not
something anyone can test.

### 2.2a The one field that keeps two controls

**Date:** 2026-09-10. Written when the date family arrived, and written here
rather than in the component, because an exception that lives in the code is a
rule nobody else will find.

> A field that opens a layer **and** whose value has no other route to empty
> keeps both the chevron and a clear button.

**Why the general rule does not cover it.** Rule 5 sends a field that opens a
layer to the chevron alone, and its reason is explicit: clearing has routes
that cost no width — an option that returns to no value, or the cross each
value carries in a field holding several. A `Select` has the first. A `ComboBox`
holding several values has the second. **A date field has neither**, and it has
something worse: measured on the base's segments, in jsdom and then in a
browser, clearing the month and the day leaves the reported value at the last
complete date and the year segment does not clear at all. So a person can blank
what they see and the field will neither hold nothing nor say so, and a project
cannot offer its own clear because nothing tells it the value changed.

That is doc 09 §3 with no way out from the consumer's side: an interaction with
no response, in the one direction a date field is asked for most often on a
filter row.

**What the exception costs, stated rather than waved past.** Two
library-owned controls at one edge, which rule 4 forbids and which the closing
rule of §2.2 forbids again. Rule 4 is amended above for the reason its own
wording gives; this is the case that made the wording matter.

**What it has to prove.** An exception with no conditions is a rule with a hole
in it, so these are conditions and each of them is a check rather than an
intention:

1. **Both targets clear the minimum hit area, at every density.** Doc 06 §3 is
   not negotiable and two controls at one edge is exactly where it gets bent.
   Measured in a browser, at compact as well as normal.
2. **The cross is unreachable, not absent, when it has nothing to offer** —
   empty, disabled, read-only, busy. Rule 1, unchanged, and the room stays so
   the value does not slide.
3. **The chevron never yields TO THE CROSS.** It is still the control with no
   alternative route, so where the cross appears the chevron stays and where
   the cross goes unreachable the chevron does not follow it. Rule 1 is
   untouched and applies to both: while the field is busy or read-only neither
   is reachable, because neither can act.
4. **The field reports the clearing.** The whole justification is that emptying
   is otherwise unobservable, so the button that does it calls back — which
   makes it the only route by which a date field's value becomes nothing.

**What this does not open.** It is not a licence for two controls wherever they
seem convenient. The test is the premise: a field whose value can already be
emptied by a route that costs no width keeps one control, and every field in
this library except the date family is in that group.

## 3. The core is controlled

Every field works with a value and a change callback, depending on no form
library. Reasons:

1. It is the lowest common denominator: any integration can be built on top of
   a controlled field.
2. It can be tested without assembling a form.
3. It imposes neither a dependency nor a version on the consumer.

**Adapters** for form libraries live behind a separate entry point in the
package, are optional, and are dependencies of the consumer, not of the library
(non-goal 9). Each one binds the package to a third-party library and a
version, so it waits for a project that actually uses that library (P5): before
that,
each project wires its fields however it likes, which with a controlled field
is trivial.

## 4. The field as a unit

The unit of composition is not the bare control: it is the set **label +
control + description + error**. Always together, always related to each other,
because that relationship is what makes the error perceivable to someone who
cannot see it (doc 06).

Rules:

- The label always exists. It may be visually hidden, but it exists.
- Placeholder text inside the field is **not** a label.
- The help description is persistent; it is not replaced by the error, it
  accompanies it.
- The error is announced when it appears, not merely painted.
- The invalid state is communicated beyond color: an icon, text, or both.
- The required-field indicator is conveyed to the reader too, not only with a
  visual asterisk.
- **An error appearing does not move what is below it.**

### 4.1 The space the error occupies — open

The last rule above is the one the field does not meet today, and it is written
here rather than quietly left out.

[Doc 09](./09-behavior.md) §3 is unconditional: nothing shifts when data
arrives, least of all under the cursor. A validation message that appears on
blur and pushes the next field down breaks it every time, and in a form of
twelve fields it moves eleven of them.

What is not decided is the mechanism, and both candidates cost something real:

| Mechanism                                  | What it costs                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Always reserve one message line            | Vertical space in every form, including the ones with no errors — against the density this library is for |
| The form layout reserves it, not the field | Correct, and it does not exist yet: it belongs to the structural pieces in §7                             |

**It is not settled by adding a boolean to the field.** A per-field switch is
the loose boolean [doc 01](./01-principles.md) §7 names as a warning sign, and
it puts the decision in the wrong place: whether a form reserves message space
is a property of the form, uniform across it, not of each field independently.
Set field by field, one omission is enough to leave a row misaligned.

So it waits for the structural pieces, and until then the shift is a known
limitation of the field — the kind [doc 06](./06-accessibility.md) §7 requires
to be written down rather than shipped in silence.

## 5. When the error is shown

This is the project's decision, but the library must **permit** every moment
without favouring any, because there is no universal answer:

- on leaving the field
- on submit
- while typing, but only to stop showing an error already corrected

What the library does fix: **an error is never shown while typing for the first
time** in a field that has not been touched yet. Blaming someone for not having
finished typing is hostile, and it is the most criticised behavior in forms.

## 6. Field states

Eight, and all of them must exist in the visual catalog:

`empty` · `with value` · `focused` · `invalid` · `disabled` · `read-only` ·
`loading` (waiting for data, e.g. a list of options) · `saving` (submitting)

Two that are almost always forgotten and worth pointing out:

- **Disabled and read-only are not the same.** Read-only shows a value that can
  be read, selected and copied; disabled indicates that it does not apply right
  now. They look different and they behave differently.
- **Disabling without explaining why is a forbidden pattern** (doc 06, point
  7). If the reason matters, an active control that explains the situation is
  better.

**A field may genuinely lack one of these, and read-only is the one that goes
missing.** `Select` has seven: the base's select has no read-only mode, and
that is a decision rather than an omission — a select is either offered or it
is not. Read-only means a value you can read, select and copy, which is a
property of text in a box; on a control whose value is a choice, "you may not
change this" and "this is switched off" have the same appearance and the same
behaviour, and painting two states that cannot be told apart is worse than
having one.

So the requirement is every state the component HAS, and a missing one is not a
gap to be filled quietly: the reason goes in the component, and the state goes
on the catalog's rejected list where somebody proposing it will find it. The
same shape as a switch having no error state
([decision 0009](../decisions/0009-a-switch-has-no-error-state.md)).

## 7. Composing a form

The library provides structural pieces — groups, sections, rows of fields, an
actions area — and **no whole screens** (non-goal 3). There is no "create form"
and no form generator from a schema.

Layout follows doc 04: one column to several according to the **container**,
never according to the window. A form in a side panel stays in one column
however enormous the screen is.

On the actions area: the order of the buttons and their position are the
project's decision; the library does not impose where "Save" goes.

## 8. Long forms and complex sets

Here P6 applies with full force: anything with logic goes in testable hooks,
not in components.

Anticipated cases, each as its own hook and not as a prop on a component:

| Need                                               | Form                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| Repeatable field lists (add, remove, reorder rows) | Collection hook + presentational pieces                                          |
| Warning on leaving with unsaved changes            | A hook that reports whether there are changes; the project assembles the warning |
| Focusing the first field with an error on submit   | Focus coordination hook                                                          |
| Derived calculations between fields                | The project's: it is business logic (P1)                                         |

The last one is the boundary: if the calculation depends on business rules, it
does not enter.

## 9. What the library does not do

1. It does not validate business rules and does not write messages.
2. It does not submit anything: it knows no servers and no requests (P2).
3. It does not generate forms from a schema.
4. It does not decide when an error is shown.
5. It does not save drafts and does not remember state between sessions (P3).
6. It does not require any form or validation library.

## 10. Arriving at a field

What happens to the text already in a field when someone tabs into it. It
sounds like a detail and it is not: in an application where someone enters a
hundred records a day, this is the difference between typing over a value and
having to clear it first.

| Field                          | Arriving with a value           |
| ------------------------------ | ------------------------------- |
| Single-line, including numeric | **The whole value is selected** |
| Multi-line                     | **The caret goes to the start** |
| Any field, empty               | The caret goes to the start     |

The split is by _how the field is used_, not by how it looks. A single-line
value is nearly always replaced — you tab to `12` to make it `40` — so
arriving with it selected means one keystroke does the job. A long note is
edited, and arriving with three paragraphs selected means one keystroke
destroys them.

This is written down because it diverged without anyone noticing, and it
diverged precisely because it was not written down. The behaviour comes from
the headless base and is correct; the risk is that a minor upgrade changes it
silently, in a way no unit test would catch — a test environment without a
layout engine does not implement selection on focus.

**It is enforced in a browser** and belongs to the same family of guarantees as
doc 09 §8: a key means the same thing everywhere, and one exception costs the
credibility of the other twenty-nine components.

Note what this rule does NOT cover: which field receives focus first when a
form opens. Nothing is autofocused without the person having asked
([doc 06](./06-accessibility.md) §4, point 8).

## 11. Verification

- [ ] A field works on its own, with no form and no library around it
- [ ] All eight states are in the visual catalog
- [ ] Label, description and error are related to the control, and the error is
      announced
- [ ] The invalid state is distinguishable in greyscale
- [ ] Disabled and read-only look and behave differently
- [ ] No error appears before the field has been touched
- [ ] An error appearing does not displace what is below it (§4.1 — open)
- [ ] Normalization is a pure function with its own tests, and the caret does
      not move while typing (§2.1 — checked in a browser)
- [ ] At most one library-owned control sits at the trailing edge, and busy
      removes it — a field that opens a layer keeps the chevron and offers no
      clear button (§2.2). **Unless its value has no other route to empty**,
      which is the one exception and carries four checks of its own (§2.2a):
      both targets clear the hit area at every density, the cross is
      unreachable rather than absent when it has nothing to offer, the chevron
      never yields, and the clearing is reported
- [ ] Number, date and currency formatting respects the locale; the time zone
      is the one received, not the browser's (doc 05)
- [ ] Complete keyboard traversal, with focus visible in every state
- [ ] The logic of the complex pieces lives in hooks with tests that render
      nothing
- [ ] In a 320px container the form is still usable
- [ ] Vertical spacing uses exactly two values: inside the field and between
      fields (doc 03, §4.6c)
- [ ] Arriving by keyboard does the right thing for the kind of field: a
      single-line value is selected, a multi-line one is not (§10)
