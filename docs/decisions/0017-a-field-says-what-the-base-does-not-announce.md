# 0017 · A field says what the base does not announce

**Date:** 2026-09-08 · **Status:** accepted

## Context

Every field in this library is built on the shared `Field` structure, and
`Field` draws a required field's asterisk with `aria-hidden` on it. The comment
beside that line gives the reason: the state is already announced, because the
base sets `aria-required` on the control. An asterisk is decoration over an
attribute.

That is true of an input. `Select` is the first field where it is not, and it
was found by asking rather than by assuming — the check reads what the DOM
actually carries:

- The button a person operates has **no `aria-required`**. Measured.
- The base does render a hidden native `<select>` for form submission, and puts
  `required` on it. Nothing announces that: it is hidden from the accessibility
  tree, it exists for a form, and with no `name` it is not even submitted.
- The label is **not a `<label>`**. The base gives a select's label context
  `elementType: 'span'`, because a `<label>` cannot label a button. The name
  reaches the control through `aria-labelledby`.

So on a select the asterisk was the only channel, and an asterisk announces
nothing. A required field looked required and was required to nobody using a
screen reader.

## Decision

**The component with the gap fills it, in the channel it has.** `Select`
composes a visually hidden word — `required`, from the dictionary — into the
label it hands to `Field`, so the accessible name becomes "Currency required".

Not a new prop on `Field`, and not an `aria-required` written onto the button.

## Reasoning

**`Field` cannot know.** It receives a label, a description and an error; it
does not know which of the base's containers is above it, and therefore cannot
know whether that container publishes the attribute. A prop asking the caller
to say so would put the knowledge in the right place and the mechanism in the
wrong one — every future field would have to remember to set it, and forgetting
would be silent, which is the failure this whole class of bug already has.

**Writing the attribute ourselves does not work.** `aria-required` is not in
the base's DOM-prop allow-list for that button — measured on `Breadcrumbs`,
where `aria-current` was dropped the same way, which is why the current step is
a `<span>` there. An attribute that is silently discarded is worse than none:
it reads as done.

**The label is where a name comes from.** The base points the control's
`aria-labelledby` at it, so anything inside it is part of the name. That makes
the word arrive at the same moment the field's name does, which is when
somebody needs it — rather than as a second announcement they may never reach.

**The two channels stay one message.** The asterisk is the visible channel and
stays `aria-hidden`; the word is the announced one and is `VisuallyHidden`. Both
say the same thing once, which is doc 06 §3's rule that colour — or in this
case, a symbol — is never the only channel.

**And it goes through the dictionary**, because it is text a person reads even
though nobody sees it. Doc 05, and the repository's third hard rule.

## Consequences

- `Select` reads one dictionary key, `required`. English is the fallback, as
  ever.
- The word is inside the name rather than beside it, so it is announced as part
  of "Currency required". Whether that reads as a state or as part of the
  field's name is a question a measurement cannot settle, and it is on doc 06
  §5's screen-reader list with the rest.
- **`ComboBox` is next in this level and has to be asked the same question**,
  not told the same answer. The base's combo box has a real text input, which
  is exactly the case where `aria-required` does arrive — so the honest
  expectation is that it needs none of this, and the way to find out is the
  test `Select` now has: assert what the trigger carries, not what the field
  structure assumes.
- The same shape applies to any state the base declines to publish on the
  element a person operates. The rule is the one in doc 06 §2: the component
  that has the gap fills it, with the reason written beside it.
- `Field`'s comment about `aria-required` is now true only of the fields with an
  input, and says so.

## Revisit when

The base puts `aria-required` on a select's button, or offers a documented way
to reach it. Then this composition becomes a second announcement of the same
state, and the word comes back out.
