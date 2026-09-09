# 0021 · A combo box extends the base's filter, so its options are declarations

**Date:** 2026-09-09 · **Status:** accepted

## Context

`ComboBox` exists for one feature a `Select` cannot have: an option findable by
words it does not display. A doctor by a speciality, a customer by a tax
number, a country by its dialling code. The catalog has called it the risk
component of its level since the level was drawn.

The base filters a combo box's list itself, and it filters well — read in its
installed source, `useFilter({ sensitivity: 'base' })`, so "jose" finds "José"
and "manana" finds "Mañana" through the platform's collator rather than through
anybody's regular expression.

What it cannot do is look at the OPTION. Its filter is
`(textValue, inputValue) => boolean`: the row's text and what was typed, and
nothing else. So a word that is not in the label has nowhere to live, and the
question is where to put it.

## Decision

**The filtering stays the base's, and this component tells it what each row's
text stands for.** `optionMatcher` builds the filter from the declared options;
the base calls it for every row on every keystroke, as it always did.

Which makes an option a **declaration**, like a `Tab`
([decision 0018](./0018-a-tab-declares-its-own-panel.md)) and a `Breadcrumb`
([decision 0019](./0019-a-breadcrumb-declares-its-address.md)):

```tsx
<ComboBox label="Doctor">
  <ComboBoxItem id="7" keywords={['cardiology']}>
    Dr. Ruiz
  </ComboBoxItem>
</ComboBox>
```

`ComboBoxItem` renders nothing. `ComboBox` reads it, builds the filter, and
renders the row.

## Reasoning

Two other designs were tried first, and both are dead for reasons that were
measured rather than argued.

**The extra words cannot live in `textValue`.** They filter correctly there,
and — measured — `textValue` is not announced: the row's accessible name stays
what the row says. But the base writes `textValue` into the input when the
option is chosen, so choosing "Dr. Ruiz" left the field reading "Ruiz
cardiology dermatology". The keywords have to stay out of the collection.

**And the component cannot filter the rows itself**, which was the obvious
answer and the one the catalog predicted. The base builds its collection from
the list's children in a render pass of its own, and **that pass is detached
from the surrounding context**: a component reading `ComboBoxStateContext`
inside it sees `null`, computes an empty query, and keeps every option. The
visible list showed all three options while the component's own render had
correctly narrowed them to one — measured with a probe printing both, because
from the outside it looked like the filter simply did not work.

That is the finding worth keeping: **a filter that cannot be seen from inside
the collection is not a filter.**

**What extending the base buys is everything that did not have to be
reproduced.** Filtering the rows here would have moved four other behaviours
into this component, and one of them cannot be moved at all: after an option is
chosen the base shows EVERY option again when the list is reopened — measured,
three declared, one chosen, reopened, three shown — and it does that with a
private `showAllItems` flag no part of the public state exposes. Reproducing it
from outside would have meant owning the input's value, the selection and the
reopening, and guessing at the one thing that separates "the text was typed"
from "the text was written by the base".

## Consequences

- **Two options with the same text share their keywords**, because the base
  offers only that text to look a row up by. A real limitation and a small one:
  two rows that read identically are indistinguishable to the person reading
  them too.
- **A component of your own that returns options cannot be seen** — the
  constraint every declaration in this library carries, and the one that cost
  `Tabs` a story that rendered nothing. The field counts what it could not read
  and warns in development.
- **An option with no text and no keywords warns too.** It can never match, so
  it is present until somebody types and gone from then on — the same silent
  disappearance a missing `textValue` produced in `Select`'s typeahead, in the
  component where typing is the whole point.
- **The query is trimmed**, which is the one deliberate difference from the
  base's own filter: `contains('Alpha', 'al ')` is false, so a trailing space
  would empty a list that matched a moment ago.
- **`matchOptions` is not exported.** It is pure and it is the logic, which is
  the shape `pageWindow` was published as — but P5 asks which screen needs it
  today, and the one that will is the consumer filtering on a server, who
  arrives with the asynchronous hook.
- Decision 0017's open question is answered on the way past: measured, with
  `validationBehavior="aria"` the input carries `aria-required="true"`, so this
  field composes no word into its label. The answer depends on the validation
  behaviour, which that record did not anticipate — under the base's default it
  is the native `required` attribute instead, and the browser's own bubble
  comes with it.

## Revisit when

- The base's filter gains the item, or its collection pass stops being detached
  from context. Either one makes filtering here possible, and the second is the
  more likely of the two.
- A screen needs two options with the same text and different keywords. That is
  the limitation above arriving as a real complaint, and the answer would be a
  filter keyed by id — which means the base offering one.
