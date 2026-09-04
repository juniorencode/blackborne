# Catalog and build order

> Which components exist, in what order they are built, and what has been
> ruled out.
> **This is not a foundation.** Foundations are permanent rules; this is a
> living list that changes weekly. They are kept apart so the foundations do
> not look less stable than they are.

**Status:** a chosen list, not a queue · **Date:** 2026-09-03

---

## 1. A warning about this list

The list below is a **forecast**, based on what nearly every management
application needs. It is not a commitment, and it is not a queue that has to be
worked through in order.

Which of these get built, and in what order, is a deliberate decision
([decision 0008](./decisions/0008-the-rule-of-two-splits.md)). Real screens
change that decision when they exist — that is the point of having a consumer —
but their absence does not block it.

## 2. How a component gets in

1. It is a **component**, not a prop on one that already exists. If the need
   can be met by an existing component, that is the cheaper answer — and the
   prop it would take faces the stricter half of P5
2. It passes the **eleven checkboxes** of the entry gate
   ([doc 01](./foundations/01-principles.md)). Eleven of eleven, not ten
3. It breaks no non-goal

No component enters half-built. "Since we're already here" is still the reason
things rot — it just rots through props rather than through the catalog.

## 3. How the order is decided

Three criteria, in strict priority:

**1. Technical dependency.** Overrides everything else. You cannot build a
select without having the field and the layers first.

**2. Real demand, when it exists.** Within what criterion 1 permits, real
screens dictate the order over this list. With no consumer yet, that criterion
is quiet and the order falls to criteria 1 and 3 — which is why the bottlenecks
and the risky piece come first.

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

| Piece            | Notes                                                                                  | Status   |
| ---------------- | -------------------------------------------------------------------------------------- | -------- |
| Tokens and theme | Not a component: it is the vocabulary ([doc 03](./foundations/03-tokens-and-theme.md)) | Pending  |
| `ConfigProvider` | Language, dictionary, time zone, currency. Defaults that work (P3)                     | **Done** | Needed by every internal string               |
| Icon convention  | Icons are not distributed: they are received. Only the convention                      | Pending  |
| `Spinner`        | Accessible name from the dictionary; a static ring under reduced motion                | **Done** | Needed by the busy states of Button and Field |
| `Skeleton`       |                                                                                        | Pending  |
| `Separator`      |                                                                                        | Pending  |

### Level 1 · Primitives

| Component    | Notes                                                                                                                                                                                                     | Status   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `Button`     | The first of all: it validated the whole pipeline                                                                                                                                                         | **Done** |
| `Field`      | **Bottleneck.** Label + control + description + error, related ([doc 07](./foundations/07-forms.md)). Built, but **internal**: nothing needs it public yet, and an export is easier to open than to close | **Done** |
| `Badge`      |                                                                                                                                                                                                           | Pending  |
| `Card`       |                                                                                                                                                                                                           | Pending  |
| `EmptyState` | Must distinguish "no data" from "no results" ([doc 09](./foundations/09-behavior.md))                                                                                                                     | Pending  |

### Level 2 · Simple fields — depend on `Field`

| Component     | Notes                                                                                                                              | Status   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `TextField`   | The first field. All eight states from doc 07 §6                                                                                   | **Done** |
| `TextArea`    | Sized by rows, not by the control-height tokens: it is a block, not part of the row things align in                                | **Done** |
| `NumberField` | Locale formatting AND parsing from the base. The first component that leans on the config provider rather than the field structure | **Done** |
| `Checkbox`    | The layout that made the field structure insufficient: the label sits beside the control, not above it                             | **Done** |
| `RadioGroup`  | Two levels of label: one for the group, one per option. The base wires the description and error to both                           | **Done** |
| `Switch`      | Deliberately NOT a checkbox: immediate action, so no error state and no required (see decision 0009)                               | **Done** |

### Level 3 · Layers — depend on the portal and focus infrastructure

| Component  | Notes                                                                                                               | Status   |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| Layer base | **Bottleneck.** Portal, focus, cascading dismissal, scroll locking ([doc 08](./foundations/08-layers-and-focus.md)) | Pending  |
| `Popover`  |                                                                                                                     | Pending  |
| `Dialog`   | The legitimate viewport exception ([doc 04](./foundations/04-responsive.md), §5)                                    | Pending  |
| `Drawer`   |                                                                                                                     | Pending  |
| `Tooltip`  | Never the only route to information ([doc 06](./foundations/06-accessibility.md))                                   | Pending  |
| `Menu`     |                                                                                                                     | Pending  |
| `Toast`    | **Deferred** — the base's toast API is still unstable. See [doc 08](./foundations/08-layers-and-focus.md) §7        | Deferred |

### Level 4 · Composed fields — `Field` + layers

| Component    | Notes                                                                                             | Status  |
| ------------ | ------------------------------------------------------------------------------------------------- | ------- |
| `Select`     |                                                                                                   | Pending |
| `ComboBox`   | **The risk component.** Built early, on purpose                                                   | Pending |
| `DatePicker` | Locale, first day of the week, time zone ([doc 05](./foundations/05-languages-and-formatting.md)) | Pending |

### Level 5 · Composition

| Component       | Notes                                                                                       | Status  |
| --------------- | ------------------------------------------------------------------------------------------- | ------- |
| `Tabs`          | Structural change expected in a narrow container ([doc 04](./foundations/04-responsive.md)) | Pending |
| `Breadcrumbs`   |                                                                                             | Pending |
| `Pagination`    |                                                                                             | Pending |
| `ConfirmDialog` | Confirm **or** undo, never both ([doc 09](./foundations/09-behavior.md))                    | Pending |
| Table pieces    | Header, row, cell, sorting, selection **plus their hooks** (P6). Not a closed table         | Pending |

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

| What                                                | Decision  | Reason                                                                                                                            |
| --------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| A closed data table                                 | **Never** | Non-goal 4. Pieces and hooks are offered instead                                                                                  |
| Application layout (shell, side navigation, header) | **Never** | Non-goal 1: it belongs to the project                                                                                             |
| Any domain component                                | **Never** | P1                                                                                                                                |
| A form generator from a schema                      | **Never** | Doc 07, §9                                                                                                                        |
| Charts                                              | **Never** | A different product category                                                                                                      |
| An icon pack                                        | **Never** | Icons are received; see level 0                                                                                                   |
| Rich text editor                                    | Deferred  | A specialised library and a heavy dependency. The cost is weighed against a project that actually needs it                        |
| File upload                                         | Deferred  | Sequencing, not doctrine. It needs the layer base first                                                                           |
| Color picker                                        | Deferred  | Sequencing only. Nothing blocks it once the field types are done                                                                  |
| Phone field                                         | Deferred  | Requires a heavy dependency. The cost is assessed when asked for                                                                  |
| Signature pad                                       | Deferred  | Too specific                                                                                                                      |
| `Toast`                                             | Deferred  | The base's toast API is still `UNSTABLE_` in 1.21.0. Revisited on real demand ([doc 08](./foundations/08-layers-and-focus.md) §7) |
| `Avatar`, `Accordion`, `Progress`, `Slider`         | Deferred  | Sequencing only. Likely to be built; they are simply not next                                                                     |

## 8. How this is maintained

- **Every finished component** updates its status here, not somewhere else.
- **Every decision to build something** updates this list before the work
  starts, not after. The list is the record of what was chosen.
- **Every rejection** goes in section 7 with its reason, even when it seems
  obvious at the time.
- This document is **not** moved into the foundations: it lives apart and
  changes often.
