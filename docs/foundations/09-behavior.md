# 09 · Behavior and interaction

> The other documents define how components look and what they guarantee. This
> one defines **how they feel**.
> It is what makes thirty components read as a system rather than a collection
> that happens to share colors.

**Status:** adopted · **Date:** 2026-09-07
**Depends on:** [01 · Principles](./01-principles.md) ·
[03 · Tokens](./03-tokens-and-theme.md) ·
[06 · Accessibility](./06-accessibility.md) · [07 · Forms](./07-forms.md)

---

## 1. The principle

The library is built for applications someone uses **eight hours a day**,
repeating the same action hundreds of times. That inverts several intuitions of
interface design:

> What impresses the first time usually annoys on the fiftieth.

From that comes the criterion governing this whole document: **the interface
that does not call attention to itself is the one people like**. Nothing
competes with the content, nothing celebrates, nothing makes itself noticed
without reason.

## 2. Motion: minimal and functional

**Decision: an animation exists only if it communicates something.** Where a
panel came from, what was expanded, what just moved. Everything else does not
exist.

Forbidden: staggered entrances, bounces, decorative appearances, page
transitions, any effect whose purpose is to be pleasing.

|                     |                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------- |
| Duration            | 150–200 ms for interface transitions                                                |
| Easing              | Fast out on appearing, gentle in on disappearing                                    |
| Reduced motion      | With the preference active, **nothing** animates. It is not softened: it is removed |
| A looping indicator | ~700-1300 ms per cycle, and symmetric easing                                        |

The last row is a different budget from the first, and conflating the two is
how a loading indicator ends up flickering. 150-200 ms is what a change that
happens **once** may cost; a cycle that repeats for as long as a request lasts
is judged by whether it still reads as calm at the fiftieth repetition. The
library's easing is deliberately asymmetric, which is right for something
arriving and lopsided on a loop that returns to where it started.

The justification, in case anyone asks for it: a 400 ms transition is elegant
the first time and is forty seconds lost across a hundred repetitions.

### 2.1 A layer does not animate out

**Rule: something that renders in a portal animates IN and never OUT.** A
dialog, a drawer, a popover, a menu, a toast being dismissed.

It is not a taste preference; it was measured, and an exit animation costs a
keypress. The headless base keeps a layer **mounted** while it animates away,
and a mounted layer is still the innermost one — so it goes on consuming
`Escape`. With a dialog open inside a dialog, closing the inner one and
pressing `Escape` again did nothing: the second press reached a panel that was
already invisible and on its way out.

Measured with two dialogs and a varying gap between the presses: the second was
dropped at 0 ms, 16 ms and 50 ms, and landed at 150 ms — against a 100 ms exit.
Focus was not the cause, since at 50 ms it had already returned to the outer
dialog. What proved it was emulating `prefers-reduced-motion`, where the
duration tokens collapse to zero: with no exit animation, both presses landed
every time.

**And that is what makes it a defect rather than a trade.** The interaction
worked for somebody who asks for less motion and failed for everybody else. §8
below says one exception in one component destroys trust in the other
twenty-nine, and a rule that holds only for some readers is worse than that —
it is a rule nobody can predict.

The entry is kept, because it communicates: where the panel came from, and that
the page behind it is out of reach. The exit communicates nothing, since the
person watching it is the one who just asked for it.

## 3. Timing and perception

| Situation                | Rule                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Response under ~300 ms   | **Show no loading indicator.** Appearing and vanishing produces a flicker, and reads worse than showing nothing |
| Between 300 ms and 1 s   | A discreet indicator, in the place where it is happening                                                        |
| More than 1 s            | Indicate it is still going; if possible, how much is left                                                       |
| A layer opening on hover | ~600 ms to open, ~150 ms to close — and the two are **not** the same number (§3.1)                              |
| Any interaction          | A visible response **immediately**, even if only the pressed state                                              |

The last point is the most important: silence makes people click twice. And
clicking twice in a management application usually means duplicating a record.

**Reserve the space before you have the content.** Nothing should shift when
the data arrives, and least of all under the cursor.

**The one movement that is allowed is the one the person caused.** A text area
growing as somebody types into it is feedback, not a surprise: they are the
reason it moved, they are looking at the place it moved, and the alternative is
a scrollbar hiding what they just wrote. The rule is about content ARRIVING and
displacing what somebody was aiming at — a list settling, an image loading, an
error appearing — and it holds absolutely there.

The test is not "did it move" but **"was the person who moved it the person
looking at it"**. Written down because the rule as it stood forbade a feature it
was never about.

### 3.1 The two hover delays, and why they differ

A layer that opens on hover — a tooltip, a preview — needs a delay, or crossing
a toolbar of six icon buttons fires six panels at somebody who was on their way
somewhere else. And it needs a **different, much shorter** delay to close, or
moving between two adjacent buttons leaves the first panel hanging over the
second.

The two numbers are one decision for the whole library and **not a prop**.
Per-layer delays are the knob that makes two screens in the same application
feel like two applications, and there is no screen where 600 ms is right and
650 ms is wrong.

**Why 600 ms and not the base's 1500 ms.** The headless base ships 1500 ms to
open and 500 ms to close, and both are tuned for a different kind of product.
In a management application somebody is scanning a dense toolbar, and a second
and a half is long enough that they have concluded there is no tooltip and moved
on. 600 ms is past the accidental crossing and inside the deliberate pause.

**What makes a long first delay survivable at all is worth knowing**, because it
is easy to read the base's number as careless: it keeps a global warmup timer,
so once **any** hover layer has opened, moving to a neighbour opens
**immediately**. The delay is paid once per approach to a group of controls, not
once per control. That is behaviour to keep, and it is the reason the closing
number matters more than the opening one.

**And the closing number is not what lets the pointer reach the panel**, which
is what it looks like it is for. Measured in the base while building `Preview`:
a hover layer whose content can be reached is kept open by a **safe-area
polygon** covering the trigger, the panel, and the region between them — so the
pointer can travel diagonally from a word in a sentence to a card below and to
the side of it, and the layer stays open however long that takes. The base's
own comment says it works "even when closeDelay is 0".

So the 150 ms closes a layer nobody is travelling towards. It is for the case
§3.1 opens with — moving between two adjacent controls, where the first panel
must not hang over the second — and not for the journey into the panel. Those
are two different jobs that a single number appears to be doing, and reading
them as one is how a close delay ends up tuned to the size of a gap.

**A tooltip has no such polygon and does not need one.** Nothing in it can be
reached, so there is no journey: WCAG 1.4.13 requires that a pointer moving
into it does not dismiss it, which the base honours, and that is as far as it
goes ([doc 06](./06-accessibility.md) §4). The polygon exists for the layer
whose content is the point.

## 4. Communicating the outcome

- **What goes well and was expected, in silence.** Confirming every routine
  action turns notifications into noise and then nobody reads them.
- **What has consequences is communicated.**
- **Errors are shown where the problem happened**, not only in a general
  notice. If a field fails, it shows on that field; the global notice is a
  complement, never the only channel.
- Messages say **what happened and what to do**. No codes, no apologies, no
  jokes.

### 4.1 How long a notice stays, and when it does not leave

A notice that removes itself is a timing decision, and like the hover delays in
§3.1 it is **one decision for the library and not a prop**. Unlike them it has
an exception, and the exception is the important half.

| The notice                    | How long       |
| ----------------------------- | -------------- |
| Ordinary — what happened      | **6 seconds**  |
| Carrying an action, like undo | **10 seconds** |
| `danger`                      | **it stays**   |

**Six seconds** is long enough to notice something appear, look at it and read
a line, and short enough that a sequence of saves does not build a wall. It is
not adjustable per notice for the reason §3.1 gives: per-instance timings are
what make two screens in the same application feel like two applications.

**Ten for a notice with an action**, because the action is the point. Undo is
the preferred half of §5's pair, and a window that closes before somebody has
decided to use it hands them the discouraged half by accident. Four extra
seconds is the difference between noticing and acting.

**A `danger` notice does not leave on its own, ever.** Something has gone
wrong, the person may not have been looking, and a message that removes itself
leaves them with a broken state and no explanation — which is the one outcome
§4 exists to prevent. It goes when it is dismissed, and not before.

**What makes a timed dismissal honest**, and this is a requirement rather than
decoration: the remaining time is **visible**, and it **pauses**. A countdown
somebody can see is a countdown they can beat; hovering or focusing the region
stops every timer in it, which the headless base does on its own. Together
those are the standard mitigation for WCAG 2.2.1 — content that disappears on a
timer needs a way to keep it, and "put the pointer on it" is a way that needs no
instructions.

The numbers live beside the hover delays, in one module, for the same reason
they do.

## 5. Destructive actions

1. **Confirm or undo, never both.**
2. **Prefer undo** whenever it is technically possible. It is less friction
   and, under repetitive use, safer: a confirmation repeated a hundred times is
   answered automatically and stops protecting anything.
3. **Confirm only when there is no way back.**
4. The button names **the action** — "Delete", "Discard" — never "OK".
5. In a confirmation dialog, the destructive action is **not** the option
   focused by default.
6. **While the action is in flight, nothing closes.** Not `Escape`, not a click
   outside, not the cancelling button. You cannot dismiss something that is
   already happening, and half-closing it leaves the work running with nothing
   listening (§7).
7. **A failure leaves the confirmation open.** The error happened there, so it
   is shown there (§4) — closing instead leaves somebody looking at a listing
   with no idea whether the thing went through.

### 5.1 The asynchronous half, and why the default is to stay

Rules 6 and 7 are about a destructive action that takes time, which in a
management application is most of them. They are written here rather than in a
component because the same shape returns everywhere a promise is awaited on
somebody's behalf.

**Rule 7 is a default and not a policy**, and that is what makes it safe. A
consumer who would rather the layer closed regardless catches their own error —
catching makes the promise fulfil, and it closes. So the library's choice is
the one that cannot lose information, and the other one is one line away.

The reverse default cannot be recovered from: once the layer has gone there is
nowhere left to put the message, and the component would have to invent a
second channel to say what happened. That asymmetry is the whole argument.

**The exception rule 6 carves out of §8.** §8 says `Escape` means the same
thing across the whole library and that one exception costs the other
twenty-nine their credibility. Rule 6 looks like that exception and is not: it
applies only while a component is holding a promise **it was given**, so it
knows exactly when the key is unsafe and for exactly how long. A component that
merely contains a form knows none of that, which is why `Dialog` does not have
this and `ConfirmDialog` does.

### 5.2 Rule 5 outside a dialog: a menu's first row

**Date:** 2026-09-09, with `SplitButton`.

Rule 5 says the destructive action is not the option focused by default, and it
was written about a confirmation dialog, where the library controls which
button takes focus. A menu is the same rule in a place the library does not
control: **opening a menu with a key focuses its first row** — measured while
`Menu` was built — so a destructive command sitting first is one press from
running, and nothing about it looks dangerous on the way.

The consumer writes the rows, so this cannot be enforced by construction. What
a component can do is say so, and `SplitButton` does: a `danger` row in first
position is one development warning, naming the reason and the fix (put it
last, behind a separator).

Two consequences worth having written down rather than rediscovered:

- **A `danger` variant of a split button does not exist.** A destructive action
  with more destructive actions behind it is this rule squared, and rule 2
  prefers undo to a control that makes destruction the default gesture.
- **This is a rule about ORDER, not about colour.** A destructive command still
  says what it does — "Discard the changes" — and is still red, because doc 06
  §3 forbids colour as the only channel. Moving it down the list changes
  neither.

## 6. Empty, loading and error

All three are part of the component. They are not the consumer's
responsibility and not an optional extra.

And a distinction almost nobody makes, which comes up daily in management
applications:

| State                        | What it says                                            |
| ---------------------------- | ------------------------------------------------------- |
| **There is no data yet**     | What this is and how to start                           |
| **The filter found nothing** | What was searched for, and an offer to clear the filter |

They are two different states with two different messages. Confusing them —
showing "no customers" when there are in fact a thousand but the filter missed
— is one of the most common experience bugs there is.

**Loading must not erase what was already there:** show the previous content
dimmed or with an indicator over it, not a blank screen. Emptying and refilling
makes the application feel slower than it is.

## 7. Preserving work

In a management application there is always something half-finished. The
library must never lose work:

- What was typed survives a save failure
- Nothing moves under the cursor when data arrives
- Closing by accident does not discard without warning
- On reloading data, scroll position and selection are kept
- On changing structure because of width (doc 04), state survives

## 8. Keyboard

In these applications people work with the keyboard: someone entering a hundred
records a day does not touch the mouse. This is user experience, not only
accessibility.

The keys mean **the same thing across the whole library**:

| Key      | Always means                                       |
| -------- | -------------------------------------------------- |
| `Enter`  | Confirms the primary action of the current context |
| `Escape` | Closes or cancels the current level, one at a time |
| `Tab`    | Moves to the next control                          |
| Arrows   | Move **within** a control that has several options |
| `Space`  | Toggles state: checkboxes, switches                |

One exception in one component destroys trust in the other twenty-nine.

## 9. Default strings

The messages the library ships are part of the experience, not filler:

- Buttons name the action, not the generic one
- Errors speak in human language and say what to do
- Empty states orient, they do not merely inform
- No jargon, no apologies, no humor

## 10. Verification

- [ ] No animation that does not communicate something; with reduced motion,
      none at all
- [ ] No loading indicators flickering on fast responses
- [ ] Every interaction responds immediately
- [ ] Nothing shifts when the data arrives
- [ ] Errors appear in the place where the problem happened
- [ ] Destructive actions name the action and are not focused by default
- [ ] "No data" and "no results" are different messages
- [ ] Loading does not empty what was already visible
- [ ] The keyboard means the same as in the rest of the library
- [ ] The page with every component together reads as one system

The last box is the one that finds the most. Component by component everything
looks right; together, the three greys you thought were one and the four
different radii show up.
