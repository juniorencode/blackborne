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

## 2. Two things that get called the same

The usual confusion, and it deserves distinct names:

- **Input restriction** — what the field will not let you type. It is widget
  behavior, it happens while you type, and it belongs to the library.
- **Validation** — the judgement about whether the value is any good. It
  happens on blur or on submit, it depends on the business, and it belongs to
  the project.

When they are mixed, the pattern to avoid appears: business rules embedded in a
component. That is what turns a reusable field into a field that only works for
one application.

## 3. The core is controlled

Every field works with a value and a change callback, depending on no form
library. Reasons:

1. It is the lowest common denominator: any integration can be built on top of
   a controlled field.
2. It can be tested without assembling a form.
3. It imposes neither a dependency nor a version on the consumer.

**Adapters** for form libraries live behind a separate entry point in the
package, are optional, and are dependencies of the consumer, not of the library
(non-goal 9). They are added when two projects ask for them (P5): before that,
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

## 10. Verification

- [ ] A field works on its own, with no form and no library around it
- [ ] All eight states are in the visual catalog
- [ ] Label, description and error are related to the control, and the error is
      announced
- [ ] The invalid state is distinguishable in greyscale
- [ ] Disabled and read-only look and behave differently
- [ ] No error appears before the field has been touched
- [ ] Number, date and currency formatting respects the locale; the time zone
      is the one received, not the browser's (doc 05)
- [ ] Complete keyboard traversal, with focus visible in every state
- [ ] The logic of the complex pieces lives in hooks with tests that render
      nothing
- [ ] In a 320px container the form is still usable
- [ ] Vertical spacing uses exactly two values: inside the field and between
      fields (doc 03, §4.6c)
