# 0002 · React Aria Components as the headless base

**Date:** 2026-09-02 · **Status:** accepted

## Context

The library targets WCAG 2.2 AA as an entry condition, not an aspiration. The
expensive part of that is not contrast or labels: it is the interaction
patterns — dialogs, menus, comboboxes, date pickers, focus containment,
keyboard navigation, layer placement, and screen reader announcements.

Every one of those has been solved, repeatedly, by people who do it full time
and test against real assistive technology. Writing them again is how a
component library acquires accessibility bugs that nobody has the budget to
find.

## Decision

**Interaction patterns rest on React Aria Components.**

The library contributes the skin, a coherent API, and convenience hooks. It
does not reimplement roles, ARIA attributes, keyboard navigation, focus
management, announcements, or floating-layer placement.

If a pattern is not covered, the order is: search for it, then justify building
it in writing. Building by hand is the last resort.

## Consequences

- **Styling targets DOM state attributes**, not conditional class strings built
  in JavaScript. This is a real change of habit and it is the point: state
  lives in the DOM, where CSS can see it.
- Locale-aware formatting and keyboard behavior come largely from the base too,
  which is why doc 05 can delegate rather than reimplement.
- The base is **not tested** by this library's test suite. It is tested by the
  people who maintain it. We test what we add on top (doc 10, §4).
- Upgrading the base is a real event: it can change DOM structure, and
  therefore appearance. This is exactly what visual regression exists for.

## Revisit when

The base stops being maintained, or a pattern we need repeatedly turns out not
to be covered. Neither is a reason to fork; both are reasons to reassess.
