# 0019 · A breadcrumb declares its address

**Date:** 2026-09-09 · **Status:** accepted

## Context

`Breadcrumbs` shipped composed: a step held whatever it should be, and the
component did not need to know which. A `Link` for a level you can return to,
plain text for a grouping with no page of its own, and the last step marked as
the current page. The component's own documentation said so in as many words,
and for one structure it was right.

The collapse is what makes it insufficient. Below the medium step a trail keeps
the two steps that matter and folds everything between them into a "…" that
opens a menu — so the **same step** has to be able to appear as a link in the
row or as a row in the menu. A `Link` handed in as children can only ever be
the first of those.

The alternative was to read the address out of the element the consumer wrote:
find the `Link` among a step's children and take its `href`. It works, and it
works until somebody wraps their link in a component of their own — and then it
finds nothing, silently, in the one structure a narrow window produces.

## Decision

**A step declares a label and, if it has one, an address.**

```tsx
<Breadcrumb href="/customers">Customers</Breadcrumb>
<Breadcrumb>Astilleros del Sur</Breadcrumb>
```

`Breadcrumbs` decides what each becomes: a `Link` in the row, a row in the
menu, plain text for a step with no address, and the current page for the last
one. `Breadcrumb` renders nothing on its own — it is read, like a `Tab`
([decision 0018](./0018-a-tab-declares-its-own-panel.md)).

## Reasoning

**Nothing is lost.** A step goes somewhere and where it goes is an address:
that is why the catalog rejected `onAction` on a trail, months before this. So
the only shapes a step ever had were a link, text for a grouping, and the
current page — and all three are this. What a consumer stops doing is importing
`Link` to write a trail.

**The declaration is the only shape both structures can be derived from.** The
row needs the label and the address; the menu needs the same two. One
declaration cannot drift from itself, and reading somebody else's element for
half of it is a silent failure waiting for a wrapper.

**It is the second case of one pattern rather than a second pattern.** Decision
0018 established it for `Tab` a week earlier, and the walk that reads the
children is now shared by both. The constraint is shared too: a component of
your own that returns a `Breadcrumb` is not one, and the trail counts what it
could not use and says so in development.

**The `href` on a menu row is the same rule one level down.** A folded step
becomes a `MenuItem` with an address rather than a command, because doc 02
§7.1's test — is there an address? — does not stop applying inside a menu. A
row that navigated by calling a function could not be middle-clicked,
ctrl-clicked or copied, and none of that would fail loudly. The catalog had
been holding `href` on a `MenuItem` as "pending a case" and named this exact
case; it arrives with it.

## Consequences

- **This is a breaking change**, and the changelog carries the migration:
  `<Breadcrumb><Link href="/x">X</Link></Breadcrumb>` becomes
  `<Breadcrumb href="/x">X</Breadcrumb>`.
- **The root element changed too.** A trail is sized by its contents, and
  inline-size containment computes a width as though an element had none (doc
  04 §4.3) — so the query container is a new wrapper and the ref is a `div`
  holding the `<ol>` rather than the `<ol>`.
- **Two rules stop the collapse making things worse**, and both are in the pure
  function rather than in a render:
  - The "…" never hides one step. Folding a single step replaces something you
    can read with something you have to open. `Pagination` reached the same
    rule from the other direction — a gap never hides one page — so the library
    now applies one rule twice instead of two rules that happen to agree.
  - The two ends are never folded: the first is the way home, the last is where
    you are. Neither is a candidate for hiding, whatever the width.
- **A folded step with no address arrives in the menu dimmed.** It was text in
  the row and folding it cannot turn it into somewhere to go. That earned
  `MenuItem` a third shape whose `isDisabled` is required rather than optional,
  so a row with nothing to do and no sign of it cannot be written.
- **A menu row that is an anchor needed `no-underline`.** The package ships no
  reset, so an `<a href>` arrives carrying the browser's own decoration, and
  until this wave no row in a menu was ever an anchor. The same class of trap
  as a form control not inheriting `font-size`.
- **The open panel is not photographed.** A menu this component opens cannot be
  held open for a screenshot, and a prop to do it would exist for the catalog
  and nothing else. Its appearance is `Menu`'s baselines; its behaviour is a
  browser check.
- Doc 06 §5 gains the second half of its breadcrumb question: whether the "…"
  reads as part of the trail or as something beside it.

## Revisit when

A screen needs a trail whose steps are not addresses — which would be an
argument with the `onAction` rejection rather than with this — or the base
grows a collection that survives its list being unmounted, which is what made
the split shape unusable in the first place.
