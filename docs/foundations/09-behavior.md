# 09 · Behavior and interaction

> The other documents define how components look and what they guarantee. This
> one defines **how they feel**.
> It is what makes thirty components read as a system rather than a collection
> that happens to share colors.

**Status:** adopted · **Date:** 2026-09-02
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

|                |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| Duration       | 150–200 ms for interface transitions                                                |
| Easing         | Fast out on appearing, gentle in on disappearing                                    |
| Reduced motion | With the preference active, **nothing** animates. It is not softened: it is removed |

The justification, in case anyone asks for it: a 400 ms transition is elegant
the first time and is forty seconds lost across a hundred repetitions.

## 3. Timing and perception

| Situation              | Rule                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Response under ~300 ms | **Show no loading indicator.** Appearing and vanishing produces a flicker, and reads worse than showing nothing |
| Between 300 ms and 1 s | A discreet indicator, in the place where it is happening                                                        |
| More than 1 s          | Indicate it is still going; if possible, how much is left                                                       |
| Any interaction        | A visible response **immediately**, even if only the pressed state                                              |

The last point is the most important: silence makes people click twice. And
clicking twice in a management application usually means duplicating a record.

**Reserve the space before you have the content.** Nothing should shift when
the data arrives, and least of all under the cursor.

## 4. Communicating the outcome

- **What goes well and was expected, in silence.** Confirming every routine
  action turns notifications into noise and then nobody reads them.
- **What has consequences is communicated.**
- **Errors are shown where the problem happened**, not only in a general
  notice. If a field fails, it shows on that field; the global notice is a
  complement, never the only channel.
- Messages say **what happened and what to do**. No codes, no apologies, no
  jokes.

## 5. Destructive actions

1. **Confirm or undo, never both.**
2. **Prefer undo** whenever it is technically possible. It is less friction
   and, under repetitive use, safer: a confirmation repeated a hundred times is
   answered automatically and stops protecting anything.
3. **Confirm only when there is no way back.**
4. The button names **the action** — "Delete", "Discard" — never "OK".
5. In a confirmation dialog, the destructive action is **not** the option
   focused by default.

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
