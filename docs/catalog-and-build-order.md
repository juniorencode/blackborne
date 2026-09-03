# Catalog and build order

> Which components exist, in what order they are built, and what has been
> ruled out.
> **This is not a foundation.** Foundations are permanent rules; this is a
> living list that changes weekly. They are kept apart so the foundations do
> not look less stable than they are.

**Status:** forecast, not confirmed by real demand · **Date:** 2026-09-02

---

## 1. A warning about this list

The list below is a **forecast**, based on what nearly every management
application needs. It is not a commitment.

The definitive list is dictated by the first real screens of the two reference
consumers. Until those exist, the "asked for by" column is empty on purpose: it
is the reminder that the rule of two (P5) is applied with data, not from
memory.

## 2. How a component gets in

1. **Two** real consumers ask for it (P5)
2. It passes the **twelve checkboxes** of the entry gate
   ([doc 01](./foundations/01-principles.md))
3. It breaks no non-goal

Nothing enters "since we're already here".

## 3. How the order is decided

Three criteria, in strict priority:

**1. Technical dependency.** Overrides everything else. You cannot build a
select without having the field and the layers first.

**2. Real demand.** Within what criterion 1 permits, the order is dictated by
real screens, not by this list.

**3. Risk, once.** A difficult component is built **early**, even if nobody has
asked for it: if the composition model does not hold, it is far better to find
out with five components built than with twenty.

## 4. The two bottlenecks

**`Field` and the layer base.** More than twenty components depend on them, and
in practice they are irreversible: redesigning them later forces a change to
everything.

They deserve more care than anything else, and it is no coincidence that the
day of experiments with the headless base consists of exactly a dialog with a
dropdown inside and a field with a label, description and error. That day
validates both.

## 5. The catalog

### Level 0 · Base — nothing depends on anything

| Piece            | Notes                                                                                  | Status  | Asked for by |
| ---------------- | -------------------------------------------------------------------------------------- | ------- | ------------ |
| Tokens and theme | Not a component: it is the vocabulary ([doc 03](./foundations/03-tokens-and-theme.md)) | Pending | —            |
| `ConfigProvider` | Language, dictionary, time zone, theme. With defaults that work (P3)                   | Pending | —            |
| Icon convention  | Icons are not distributed: they are received. Only the convention                      | Pending | —            |
| `Spinner`        |                                                                                        | Pending | —            |
| `Skeleton`       |                                                                                        | Pending | —            |
| `Separator`      |                                                                                        | Pending | —            |

### Level 1 · Primitives

| Component    | Notes                                                                                                | Status  | Asked for by |
| ------------ | ---------------------------------------------------------------------------------------------------- | ------- | ------------ |
| `Button`     | The first of all: it validates the whole pipeline                                                    | Pending | —            |
| `Field`      | **Bottleneck.** Label + control + description + error, related ([doc 07](./foundations/07-forms.md)) | Pending | —            |
| `Badge`      |                                                                                                      | Pending | —            |
| `Card`       |                                                                                                      | Pending | —            |
| `EmptyState` | Must distinguish "no data" from "no results" ([doc 09](./foundations/09-behavior.md))                | Pending | —            |

### Level 2 · Simple fields — depend on `Field`

| Component     | Notes                                                         | Status  | Asked for by |
| ------------- | ------------------------------------------------------------- | ------- | ------------ |
| `TextField`   |                                                               | Pending | —            |
| `TextArea`    |                                                               | Pending | —            |
| `NumberField` | Locale-aware formatting; the base handles it                  | Pending | —            |
| `Checkbox`    |                                                               | Pending | —            |
| `RadioGroup`  |                                                               | Pending | —            |
| `Switch`      | Different from `Checkbox`: immediate action, not a form value | Pending | —            |

### Level 3 · Layers — depend on the portal and focus infrastructure

| Component  | Notes                                                                                | Status  | Asked for by |
| ---------- | ------------------------------------------------------------------------------------ | ------- | ------------ |
| Layer base | **Bottleneck.** Portal, focus, cascading dismissal, scroll locking (doc 08, pending) | Pending | —            |
| `Popover`  |                                                                                      | Pending | —            |
| `Dialog`   | The legitimate viewport exception ([doc 04](./foundations/04-responsive.md), §5)     | Pending | —            |
| `Drawer`   |                                                                                      | Pending | —            |
| `Tooltip`  | Never the only route to information ([doc 06](./foundations/06-accessibility.md))    | Pending | —            |
| `Menu`     |                                                                                      | Pending | —            |
| `Toast`    | Includes the queue and its management                                                | Pending | —            |

### Level 4 · Composed fields — `Field` + layers

| Component    | Notes                                                                                             | Status  | Asked for by |
| ------------ | ------------------------------------------------------------------------------------------------- | ------- | ------------ |
| `Select`     |                                                                                                   | Pending | —            |
| `ComboBox`   | **The risk component.** Built early, on purpose                                                   | Pending | —            |
| `DatePicker` | Locale, first day of the week, time zone ([doc 05](./foundations/05-languages-and-formatting.md)) | Pending | —            |

### Level 5 · Composition

| Component       | Notes                                                                                       | Status  | Asked for by |
| --------------- | ------------------------------------------------------------------------------------------- | ------- | ------------ |
| `Tabs`          | Structural change expected in a narrow container ([doc 04](./foundations/04-responsive.md)) | Pending | —            |
| `Breadcrumbs`   |                                                                                             | Pending | —            |
| `Pagination`    |                                                                                             | Pending | —            |
| `ConfirmDialog` | Confirm **or** undo, never both ([doc 09](./foundations/09-behavior.md))                    | Pending | —            |
| Table pieces    | Header, row, cell, sorting, selection **plus their hooks** (P6). Not a closed table         | Pending | —            |

**Forecast total: 31 pieces.**

## 6. The risk component

**`ComboBox`, built in the early phase**, even though no project has asked for
it yet.

Reason: it stresses the entire architecture in a single component — field,
layers, keyboard, filtering, locale, long lists — and it is small enough to
redo if it comes out wrong. If the composition model does not hold up to
`ComboBox`, it will not hold up to the table either, and it is far better to
know that then.

The table pieces come afterwards, with the architecture already validated.

## 7. Ruled out or deferred

The section that gains the most value over time: without it, every few months
someone proposes the same thing again.

| What                                                | Decision  | Reason                                                           |
| --------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| A closed data table                                 | **Never** | Non-goal 4. Pieces and hooks are offered instead                 |
| Application layout (shell, side navigation, header) | **Never** | Non-goal 1: it belongs to the project                            |
| Any domain component                                | **Never** | P1                                                               |
| A form generator from a schema                      | **Never** | Doc 07, §9                                                       |
| Charts                                              | **Never** | A different product category                                     |
| An icon pack                                        | **Never** | Icons are received; see level 0                                  |
| Rich text editor                                    | Deferred  | A specialised library. Only if two projects ask                  |
| File upload                                         | Deferred  | Until there is real demand                                       |
| Color picker                                        | Deferred  | Until there is real demand                                       |
| Phone field                                         | Deferred  | Requires a heavy dependency. The cost is assessed when asked for |
| Signature pad                                       | Deferred  | Too specific                                                     |
| `Avatar`, `Accordion`, `Progress`, `Slider`         | Deferred  | Likely, but no demand yet. The rule of two                       |

## 8. How this is maintained

- **Every finished component** updates its status here, not somewhere else.
- **Every request** is noted in "asked for by", even when it has not yet
  reached two.
- **Every rejection** goes in section 7 with its reason, even when it seems
  obvious at the time.
- This document is **not** moved into the foundations: it lives apart and
  changes often.
