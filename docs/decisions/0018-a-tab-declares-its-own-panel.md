# 0018 · A tab declares its own panel, and the narrow structure is not a tab list

**Date:** 2026-09-08 · **Status:** accepted

## Context

`Tabs` is the component doc 04 §6 was written for: the first thing in the
library whose STRUCTURE depends on its width, rather than its layout. Below a
certain width there is no room for a row of labels, and the catalog has said
since the batch was planned what happens then — the row becomes a select.

That forces two questions the other components never had to answer, and both of
them are about the same thing: what a consumer writes, and what the narrow half
is allowed to claim about itself.

The base offers the conventional shape, which is also the ARIA pattern's shape:
a `Tab` for each label inside a `TabList`, and a `TabPanel` for each body,
matched by id. Measured against what this component has to do, it has two
problems:

- **The id is written twice**, so the two halves can drift apart, and nothing
  reports it when they do.
- **A panel outlives its tab list.** Rendering the list conditionally — which
  is exactly what a structural change does — leaves the panel with
  `aria-labelledby="undefined-tab-b"`: a name pointing at an element that does
  not exist. Measured in the base at 1.21.0, and invisible to every check we
  have, because the attribute is perfectly well formed.

## Decision

**1. A tab and its panel are one declaration.** `<Tab id title>` carries the
content as its children, and `Tabs` splits it: the titles become the tab list,
the selected one's children become the panel. `Tab` renders nothing on its own
and is read rather than rendered.

**2. The narrow structure is a select above content, and claims nothing else.**
No tablist, no tabpanel, no tab roles — the ARIA of the tabs pattern goes with
the row of tabs, and what replaces it is a labelled field with the content
under it.

## Reasoning

**On the first half.** One declaration cannot drift from itself, and it is the
only shape from which the narrow structure can be derived at all: a select
needs every title and the content of one of them, which the base's split shape
has in two different places under two different parents.

It also makes the state question trivial. Doc 04 §6 rule 4 — "state survives
the structural change, and this is what breaks most often" — holds by
construction rather than by care: the selected key is held above the choice of
structure, so the structure cannot lose it.

What it costs is the constraint every collection API has: a component of your
own that returns a `Tab` is not a `Tab`, because the element in the tree is
yours and nothing about it says tab. This was measured on the first draft of
the component's own stories, which shared their tabs through a component and
rendered nothing at all — so `Tabs` counts what it could not use and says so in
one development warning. The shareable form is a value, not a component:
`const invoice = <>…</>` works, and so does `{rows.map(row => <Tab … />)}`.

**On the second half.** Doc 06 §2's rule is that a component may add the layout
and may not add the ARIA, and doc 06 §2 already applies it twice — a
`CheckboxGroup` gets no `aria-orientation` because it has no arrow navigation,
and a `Steps` indicator gets no tab roles because it has nothing to select. A
tabpanel announced where no tablist is reachable is the same mistake: semantics
nobody can act on.

The alternative was tried on paper and rejected: keep the tab list rendered but
hidden, so the base's `TabPanel` keeps its relationship. It would have kept the
panel element stable, and it would have meant a screen reader announcing a tab
panel belonging to a tab list that a person cannot reach, with a select beside
it doing the actual work. Two controls for one state, one of them a decoration
for the accessibility tree.

## Consequences

- **Crossing the threshold remounts the panel's content.** The panel is a
  `TabPanel` in one structure and a plain container in the other, so a form
  halfway through being typed does not survive a resize past the boundary. The
  selected tab does. This is written in the component's own documentation
  rather than left to be discovered, and the answer for a consumer whose panels
  hold a form is the one P3 already gives: hold that state above the tabs.
- **The boundary is a step of the scale, not a measurement.** A select below
  `medium`, tabs from it up. It approximates "when they do not fit", because
  the honest version — measuring the row's own scroll width in JavaScript —
  puts a second set of thresholds inside a component, which doc 04 §6 rule 1
  forbids in as many words.
- **So the row also wraps**, which is the N1 half. CSS counts pixels and cannot
  know whether these particular words fit, so eight long titles in a wide
  container would still overflow, and doc 04 §7 is blunt about what overflow
  costs. Wrapping needs no measurement and holds at any width.
- **The element the step is read from has to outlive both structures.** Read it
  from the control and the observer is left watching a detached node, which
  reports a width of zero, which chooses the narrow structure, which detaches
  the next control — a component flickering between two structures at one
  width. `Tabs` observes a header box that holds whichever control applies, and
  a browser check watches one width for half a second to prove it settles.
- **`ComboBox` and the table pieces inherit the first half of this.** A
  declaration read by its parent is now the library's shape for a set whose
  pieces land in different places, and the warning that reports an unusable
  child is the part to copy.
- Doc 06 §5 gains the question this leaves open: whether a select above its
  content needs a stated relationship, or whether position is enough. A
  measurement cannot settle it.

## Revisit when

The base offers a collection that survives its list being unmounted, or a
screen turns up whose panels hold enough state that the remount is the thing
people notice. The second one is the more likely, and the row about keeping an
unselected panel mounted — "pending a case" in the catalog — is where it will
arrive.
