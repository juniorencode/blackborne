# 10 · Quality and verification

> A document with no automated check behind it gets broken. Always.
> This one defines what is verified, when, and with what numbers.

**Status:** adopted · **Date:** 2026-09-02
**Depends on:** all the previous ones. This is the document that enforces them.

---

## 1. The principle

The previous documents are full of rules. Experience says a written rule is
respected for a few weeks and then yields to the first deadline.

> What is not checked automatically is not followed.

So the job of this document is not to ask for discipline, but to **turn the
rules into checks**. Every rule in documents 03 to 09 should have its automated
form here, or an explicit manual checkbox if it cannot have one.

## 2. The project's own rules, as lint

The highest-return item in this whole document, and the one almost nobody does.
It costs an afternoon to write.

| Rule                                                           | Where it comes from |
| -------------------------------------------------------------- | ------------------- |
| No literal color and no primitive token inside a component     | Doc 03              |
| No physical measurement (`left`/`right`); always `start`/`end` | Docs 03 and 05      |
| No literal string, **accessibility labels included**           | Doc 05              |
| No viewport breakpoint outside components in a portal          | Doc 04              |
| No import reaching into another component's internal path      | Doc 01              |
| No access to `document`, `localStorage` or globals             | Doc 01, P3          |
| No generic element with a click handler acting as a button     | Doc 06              |

From there on, breaking a document stops being a matter of memory.

## 3. The verification layers

| Layer                       | What it checks                                                                                                    | Cost                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Format and lint**         | Code style and the project's own rules from section 2                                                             | Seconds                 |
| **Types**                   | That the public surface is properly typed                                                                         | Seconds                 |
| **Logic**                   | Hooks and pure functions, **rendering nothing** (P6)                                                              | Fast                    |
| **Behavior**                | The component from the perspective of someone using it, and never how fast the machine ran it (§11)               | Medium                  |
| **Re-render**               | That typing in one field does not re-render its neighbours                                                        | Medium                  |
| **Automated accessibility** | Contrast, missing labels, malformed ARIA. **Running**: axe against every story in the catalog                     | Medium                  |
| **Visual regression**       | What changed in appearance, and where. **Running**: 19 captures, generated in Docker so the tolerance can be zero | Slow                    |
| **Package**                 | Types resolve, exports are correct, no side effects                                                               | Fast                    |
| **Server**                  | That everything prerenders without mismatches                                                                     | Free: the site gives it |
| **Manual**                  | Keyboard always; screen reader on the complex ones                                                                | Minutes                 |

## 4. What is tested and what is not

**Yes:**

- Observable behavior: what the person using it sees and can do
- The logic of the hooks, in isolation
- The keyboard
- That state survives structural changes (doc 04)
- The three states: empty, loading, error

**No:**

- **Styles, by asserting class names.** Checking that an element has a certain
  class does not prove it looks right, and it turns any refactor into a sea of
  false failures. Visual regression handles that.
- **The headless base.** It is already tested by the people who maintain it.
  Test what you add on top.
- **Internal details.** A test that breaks when you reorganise code without
  changing behavior is a test that should not exist.

## 5. Re-renders

This deserves its own section because in a library the consumer **cannot fix
it**: they inherit it.

The check is a test, not a manual inspection:

> Mount a form with twenty fields, type in one, and check that **only that
> one** re-rendered.

It applies to the three places where it matters: form fields, the table, and
lists. Devtools are for diagnosing once you already suspect something; the test
is so it never happens again.

Note: the React compiler memoises a good part of this automatically, but **it
does not fix a badly designed provider**. If a context value changes on every
render, it still propagates. Design matters just as much.

## 6. Visual regression

The safety net most missed in an interface library. It lets you change a token
and know within a minute **which components changed appearance**,
instead of opening them one by one.

It is the only thing that makes touching tokens safe once there are thirty
components — and it was adopted at ten, because approving ten baselines is an
afternoon and approving thirty is not.

Demonstrated rather than asserted: changing `--bb-radius-md` from 6px to 10px
failed **13 of 19** captures and left 6 untouched. That is the report this
section is asking for.

**The habit that decides whether it is worth having** is the fourth bullet
below. Updating a baseline is one command and will always be the fastest way to
turn a red check green; a baseline updated without looking automates the act of
not noticing. The workflow is in
[contributing/visual-regression.md](../contributing/visual-regression.md).

So it does not produce constant false positives:

- Animations disabled during capture
- Dates, identifiers and sample data fixed, never random — **and a date read from the clock is not fixed** (SS6.1)
- Fonts loaded before capturing
- An appearance change is **approved** explicitly; never ignored wholesale

Combinations captured: light and dark, LTR and RTL, normal and compact density.
Not all of them on every component — the full set only on the page that gathers
them all.

### 6.1 A baseline may not depend on the clock

**Added 2026-09-09**, after a reference that had been generated hours earlier
failed in CI.

The bullet above has always asked for fixed dates, and it was read as being
about SAMPLE data: pin the invoice date, pin the identifiers. A component that
knows what day it is today reads the clock instead, and no amount of pinned
props fixes that.

**The measurement.** A calendar marks today from the zone the provider gives it
(§3.1 of doc 05, and decision 0023). Three of its baselines pin the ninth of
September as the chosen day, and one of them configures `Africa/Cairo`. Asked
at three instants, with everything else identical:

| Instant                | Day marked in Cairo |
| ---------------------- | ------------------- |
| `2026-09-09T12:00:00Z` | the 9th             |
| `2026-09-09T22:00:00Z` | the 10th            |
| `2026-11-20T12:00:00Z` | **none**            |

The middle row is what failed CI: 104 pixels, one cell's ring moving one place
along. It is the harmless face of this.

**The third row is the one that matters.** In a month that does not contain
today, nothing is marked at all — so the same reference would stop
photographing the ring entirely, and it would do it without failing. Three
weeks after the ring was added, the baseline that exists to guard it would be
guarding an empty space, green forever. That is §11's rule with the sign
flipped: a check whose RESULT depends on the machine goes red for no reason, and
a picture whose CONTENT depends on the clock goes green for no reason. The
second is worse, and this repository has now paid for both in one week.

**So the clock is fixed for the capture**, once, in the harness rather than per
story: `page.clock.setFixedTime` at midday UTC, which is the instant at which
every zone from UTC-12 to UTC+11 is on the same calendar day. It fixes
`Date.now()` and `new Date()` and leaves every timer running, so nothing else
about the page changes. Per-component would be a trap paid five more times -
`RangeCalendar`, `DateField`, `DatePicker`, `TimeField` and `DateRangePicker`
are all coming and all read the clock.

**And it is not only the pictures.** Three of the calendar's browser checks
needed today to be on the month they were looking at, and one of those needed
it to be the chosen day exactly — measured against the 5th of October, all
three fail on a count. They were written on the ninth of September and were due
to start failing on the tenth, which would have arrived looking exactly like
the flake §11 has just finished removing. The third of them is the one worth
knowing about: it asserts that NOTHING is marked when no zone is configured,
and counts the base's own mark to prove the story is showing a calendar at
all. A check can be dated without mentioning today, so the clock is fixed for
the whole file rather than for the checks that look dated.

**And a fixed clock is not a substitute for choosing what is in the picture.**
The same three baselines all pinned the ninth as the chosen day, on a day when
today WAS the ninth, so every calendar in every reference showed one cell
carrying both marks — and the ring has two colours, one for each case. Only one
of them was ever on film. Fixing the instant makes a baseline reproducible; it
does not make it complete, and the states baseline now chooses a day that is
not today so both rings appear at once.

## 7. Budgets with numbers

A budget without a number is not a budget: when you exceed it, you do not find
out.

| What                              | Fixed as                                          |
| --------------------------------- | ------------------------------------------------- |
| Package weight                    | A number, published in the README                 |
| CSS weight                        | A number (doc 03, the single-file decision)       |
| Renders per keystroke in a form   | A number                                          |
| Duration of the full verification | A number: if it grows, people stop waiting for it |

They are revisited when exceeded, with data. They are not ignored and not
raised silently.

## 8. The two levels

If everything runs before every change, it ends up switched off.

| Before committing    | Full verification                       |
| -------------------- | --------------------------------------- |
| Format               | Everything on the left                  |
| Lint of what changed | Types, all tests, accessibility         |
|                      | Visual regression, package, server      |
|                      | Budgets, documentation examples compile |
| Seconds              | Minutes                                 |

## 9. Deprecation

How something is retired, decided before it is needed:

1. It is marked deprecated, with the alternative named in the notice itself.
2. It is announced in the changelog, with the migration.
3. It keeps working for at least one minor version.
4. It is removed in the next major version.

Without this policy, when the moment comes you will not dare remove anything,
and the library will only grow.

## 11. A check must not measure the machine

**Added 2026-09-09**, after a check failed in CI while nothing was broken.

Section 1's whole argument is that an unchecked rule is an unfollowed rule, so
a check that fails at random is worse than a missing one: it teaches everybody
to re-run the job, and a suite people re-run until it is green is a suite that
no longer says anything. `retries: 0` in the Playwright configuration is the
other half of the same position — a failure must not be shruggable — and it is
only honest if a failure means the component is wrong.

> A check asserts what the component does. If its result also depends on how
> fast the machine ran it, it is measuring the machine.

**The measurement that produced this rule.** A browser check proved that a
collapsible panel TRAVELS between its two heights rather than jumping, by
sampling the height on every animation frame and requiring more than one frame
strictly between the endpoints. In CI, on two workers, it saw
`[0,0,0,0,12.59,144,144,144]`: one intermediate frame for a 160ms transition,
because the frame rate under load is not something a test controls. The panel
was animating perfectly.

**And the fix is not a wider tolerance.** Lowering the bar to "at least one
frame" makes the same check fail less often, which is the shape of change that
turns a real failure into a coincidence. What the check wanted was a claim
about the animation, so it should ask the animation:

- `transitionrun` hands over the moment the transition is created. A listener
  added before the click receives it whatever the frame rate does.
- `element.getAnimations()` at that moment holds a `CSSTransition` whose
  `transitionProperty` is the property in question — measured: exactly one,
  `height`, `duration: 160`.
- Pausing it and writing `currentTime` reads the curve at exact fractions of
  the transition rather than wherever the frames happened to land — measured:
  `0 → 54.58 → 110.88 → 136.97 → 144` at 0, 25, 50, 75 and 100 per cent.

That is a stronger claim than the flaky one it replaces, which is the test of
whether a de-flaked check has been fixed or merely quietened: five points on the
curve, in order, against "some frames were seen".

**How to tell the two apart before CI does it for you.** A check depends on the
machine when its assertion counts something the machine produces — frames,
elapsed milliseconds, how many times a callback ran, the order two independent
timers fired. It depends on the component when it asserts a state the component
is in, a value it published, or an object it created. Both look like ordinary
assertions on the page; only one of them is still true on a machine with a
loaded CPU.

Three that are already right, for contrast: the transition's DURATION is
asserted against the token rather than timed with a clock, the panel is waited
on through the base's own end-of-animation signal rather than a sleep, and the
step a container query resolves to is read from CSS rather than compared
against a measured width (doc 04 §6.2).

**This does not license a slow check to be deleted.** The machine-dependent
suite in this repository is the visual one, and its answer is the opposite
direction: generate every reference in the same container so the tolerance can
stay at zero (§6). Removing the dependence is the fix in both cases; agreeing
to ignore it is not.

## 10. Definition of green

A version is not published if any of these fails:

- [ ] Format, lint and the project's own rules
- [ ] Types, with no gaps in the public surface
- [ ] All tests, re-render tests included
- [ ] Automated accessibility
- [ ] Visual regression reviewed and approved
- [ ] Package verification: types resolve and exports are correct
- [ ] The documentation examples compile
- [ ] Budgets within their numbers
- [ ] The page with every component together, reviewed by eye
- [ ] Changelog up to date, with migrations if anything broke

The second-to-last is the only manual one on the list, and the one that finds
the most.
