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
| No request, and no window under an alias                       | Doc 01, P2 and P3   |
| No props type extending the base with `Omit`                   | Doc 01, P5          |
| No generic element with a click handler acting as a button     | Doc 06              |

From there on, breaking a document stops being a matter of memory.

**Two of those rows arrived on 2026-09-11, and the gap they close is the same
one twice: a rule the documents state and no check reads.** P2 — no requests —
was the oldest rule in the project with no automated form at all; `location`
was banned and `fetch` was on trust. And P3's globals were reachable under five
aliases that do not contain the word: measured, a shipped file holding
`globalThis.document`, `self.matchMedia`, `top`, `parent` and `frames`
produced zero errors.

**The rules themselves are now tested.** Twenty-one of them are regexes and
globs inside strings, and `eslint.rules.js`'s own header warns that a mangled
one matches nothing while looking correct — yet only two recorded being
verified in both directions. See §2.1.

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
| **Package**                 | Types resolve, exports are correct, no side effects, and the public surface is a reviewed diff                    | Fast                    |
| **Server**                  | That everything prerenders without mismatches                                                                     | Free: the site gives it |
| **Manual**                  | Keyboard always; screen reader on the complex ones                                                                | Minutes                 |

### 3.1 The public surface is read structurally, not textually

**Added 2026-09-11.** The `Package` row's newest half is worth its own note,
because the obvious implementation of it does not work.

`validate` and `validationBehavior` reached ten public props types and were
documented nowhere. They did not arrive in a diff: each of those types extends
the base's props with an `Omit`, which is a blacklist, so the base already had
them and the day the field was written its declaration read the same either
way.

So a snapshot of the declaration TEXT — an api-extractor report, or a
normalised `dist/index.d.ts` — cannot see it. Measured, by patching the base's
own declarations and re-reading: our file still says
`interface TextFieldProps extends Omit<TextFieldProps$1, …>`, character for
character, while **four** of this library's public types gained a prop.

The artefact is therefore built from the type CHECKER: every exported name,
and every property of every exported type including the inherited ones, each
marked `(own)` or `(base)`. The same simulation against it reports

    type TextFieldProps
      +aBaseGrewThis? (base)

on all four, which is the sentence the guard exists to produce: the base grew,
and nobody decided.

What it deliberately leaves out is each property's TYPE. That doubles the
artefact to the size of the declaration file, and the interesting half is the
names — so `tone?: AlertTone` widening to `tone?: string` is invisible here and
belongs to review.

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

**And "the machine" is not only its speed.** Added 2026-09-10, after a UNIT
test failed on CI having passed everywhere else. It asserted that the day a
calendar marks as today also carries the base's own `data-today` — with the
comment "the one the base agrees is today in this environment", which is the
defect written down in the test itself. Ours comes from the configured zone and
the base's from the machine's, so the two coincide only while the runner is
configured like the developer. Measured at the instant CI failed,
`2026-09-10T00:35:00Z`, with a calendar configured in Lima:

| Runner's zone  | Our mark | The base's mark | The assertion |
| -------------- | -------- | --------------- | ------------- |
| `America/Lima` | the 9th  | the 9th         | passes        |
| `UTC`          | the 9th  | the 10th        | **fails**     |

The component was right in both. So the list of things a check may not depend
on is the machine's SPEED, its CLOCK (§6.1) and its CONFIGURATION — its zone,
its locale, its font stack. All three have the same shape: a value the test did
not set and cannot see.

**The replacement is stronger, again.** Rather than comparing our mark against
the base's, it fixes one instant and renders twice: at 03:00 UTC it is still
the eighth in Lima and already the ninth in Tokyo, so two zones give two
different marked days from one clock. That is the claim the component exists to
make, and the assertion it replaces could not state it at all. Verified by
running the calendar's tests under four zones from UTC−11 to UTC+14.

One practical note, because it is the trap underneath the fix: fake only
`Date`. Faking the timers to answer a question about a calendar hands React's
scheduler a clock nobody advances, and the symptom is a suite that hangs rather
than fails.

**This does not license a slow check to be deleted.** The machine-dependent
suite in this repository is the visual one, and its answer is the opposite
direction: generate every reference in the same container so the tolerance can
stay at zero (§6). Removing the dependence is the fix in both cases; agreeing
to ignore it is not.

### 11.1 And an instrument may not fake the thing it measures

**Added 2026-09-10**, from the other head of the same beast. A check that fails
at random teaches people to re-run the job; a check that PASSES without
exercising anything teaches nobody anything at all, and it does it quietly.

> A check that builds its own input has to be checked against the real one, or
> it is measuring its own scaffolding.

**The measurement.** A file field's whole reason to exist is the drop, and
jsdom implements no data transfer at all, so the drop is a browser's question.
The recipe everybody copies builds the transfer in the page:

```js
const dt = new DataTransfer();
dt.items.add(new File(['x'], 'dropped.txt', { type: 'text/plain' }));
await zone.dispatchEvent('drop', { dataTransfer: dt });
```

Measured in this catalog, that transfer is perfect from JavaScript —
`types: ['Files']`, `files.length: 1`, `items[0].kind: 'file'` — and
`items[0].webkitGetAsEntry()` returns **null**, because Chromium attaches a
filesystem entry only to an item that came from a real drag. React Aria reads a
drop through `readFromDataTransfer`, which calls that method wherever it exists
and skips the item when it answers null. So every drag event fires, the drop
target lights up, the drop handler runs — **and the list of files is empty.**

The first version of the check asserted the events and read as a check of the
drop. It would have gone on passing with the filtering deleted, the handler
rewritten, or the whole payload thrown away.

**The fix is a real drag, not a lower bar.** `Input.dispatchDragEvent` over a
DevTools session takes file PATHS and lets the browser build the transfer
itself, entries included — one row, named after the file on disk. It is
Chromium-only, and that suite is Chromium-only.

**And the one-of-each shape is worth stealing.** "A folder is left on the
floor" cannot be checked by dropping a folder: an empty list is also what a
drop that never arrived gives, so the check passes whether the library filtered
the folder out or the browser refused the drag. Dropping a folder AND a file
says both halves — the drop demonstrably arrived, and exactly the file survived
it. Where a check's expected result is "nothing happened", something has to
happen beside it.

**How to tell before it costs you.** Ask what would still make the check fail.
If the answer is "nothing in the component", the check is measuring the
harness. §11's version of that question is about the machine; this one is about
the input, and both are answered the same way: by naming a thing the component
does, and asserting that.

**And "nothing in the component" includes a number the BASE chose.** Added
2026-09-11: a check asserted that a preview opens after roughly the 600ms this
library sets, under a comment saying the delay was "in effect through
`timing.ts` rather than the base's default". Measured in the pinned source, the
base's default is 600 — `delay: props.delay ?? 600` — so deleting the prop
would have left every assertion passing. A component that passes a dependency
its own default is not making a decision the check can see. The close delay in
the same component IS ours, 150 against a default of 200, and that one can be
asserted; the test is not whether a number is written down, it is whether
changing our side of it changes the reading.

### 11.1.1 Two ways a negative passes, and neither is the tolerance

**Added 2026-09-11**, from a sweep of every check in this repository whose
expected result is "nothing happened". Nine sites were examined and the two
failure shapes turned out to be different, which matters because one of them
looks like it was already handled.

**A poll cannot give a page the chance to be wrong.** Three checks sent a wheel
event at a page with its scroll locked and asserted the offset had not moved,
each under a comment saying the polling budget gave the page a thousand
milliseconds to prove otherwise. `expect.poll` returns on the first read that
SATISFIES its expectation — so "the offset is what it was" was satisfied by its
own first read, none of the budget was ever spent, and the check passed whether
or not the event arrived at all. This is not §11.4's throwing callback; it is
the same function's other edge, and the polled form reads as though it were
more careful than a single read rather than identical to one.

The fix is to poll a state that only the real event produces. A counter on the
window, read through a poll, is honest because the count rises once and stays
risen. And measured while writing it: after `mouse.wheel` returned, the count
was still **zero** — the event is asynchronous, which the old comment said and
the old code did not use.

**And a companion has to be in the SAME test.** A select's Escape check
asserted three things afterwards — no list, focus on the trigger, nothing
chosen — and all three are equally true of a select that never opened, which is
the state its story starts in. A neighbouring test proved the list opens, forty
lines away. That is not the pair §11.1 asks for: the pair has to run in the
test that needs it, because what is being established is that THIS run did the
thing.

**The cheapest way to tell.** Take the check's own end state and ask whether it
describes the story before the test touched it. If it does, every assertion in
it is decoration until something proves otherwise.

### 11.2 A WAIT is a check, and it can measure the machine too

**Added 2026-09-10.** §11 and §11.1 are both about assertions. The same rule
reaches the line above them, and this suite broke it in the most ordinary way
there is: `page.waitForLoadState('networkidle')`.

"Idle" means **500ms with no request in flight**, which makes the wait two
things at once. It is a floor — it cannot cost less than half a second, however
ready the page was — and it is UNBOUNDED, because a page that never gets 500ms
of quiet waits until the test times out. How often a chunk arrives depends on
how many other browsers are competing for the machine, which is exactly the
value §11 says a check may not depend on. The reported symptom was an
accessibility check timing out on one story under load and passing in
isolation.

What the wait was actually for is one painted frame: the colour-contrast rule
samples computed colours from real geometry and declines to run rather than
guessing when there is none. Two `requestAnimationFrame` callbacks guarantee
that — the first runs before the paint it belongs to, so the second is the
proof the frame happened. Measured on three stories of the built catalog:

| Story                   | `networkidle` | two frames |
| ----------------------- | ------------- | ---------- |
| `Separator / Semantics` | 574ms         | 21ms       |
| `DatePicker / States`   | 574ms         | 23ms       |
| `FileUpload / States`   | 547ms         | 17ms       |

Twenty-five times cheaper, bounded, and it asserts the state the rule needs
rather than a property of the network. Across 480 stories the suite went from
4.3 minutes to 3.8 with six workers, and the guarantee got stronger rather than
weaker: the suite already asserts that the contrast rule RAN, on every story,
so a wait too short to settle the page fails 480 times rather than passing
silently.

The generalisation is short. **A wait belongs to a state the page reaches** —
an element attached, an attribute set, an image `complete`, a frame painted.
A wait for a quantity the machine produces — silence on the network, elapsed
milliseconds, a number of frames — is the same defect as an assertion on one,
and it is easier to miss because a wait looks like plumbing rather than like a
claim.

### 11.3 A flake you cannot reproduce gets instrumentation, not a guess

**Added 2026-09-10**, and it is the rule that actually found the cause of the
one above's neighbour.

The accessibility suite failed once, on one story, with
`Error: Axe is already running`. Not reproducible: the story passed in
isolation every time, and a week of reasoning produced a plausible cause that
turned out to be wrong. Three separate measurements said the leading theory was
false — there ARE two axe-core engines in every story page, Storybook's
accessibility addon puts one there and `AxeBuilder` injects a second that
replaces `globalThis.axe`, and hooking the assignment counted **zero** runs
from the page in the seconds after it loaded.

> Where a flake cannot be reproduced, the deliverable is the assertion that
> will attribute the next occurrence. A fix for a cause you have not measured
> is a guess with a commit message.

So the suite gained one line before its own analysis: read whether anything is
already running axe, and fail naming the other engine. It attributed the cause
on the first run — **11 of 480 stories** under six workers, none in isolation.

Two things about the cause are worth carrying, because both are traps rather
than trivia.

**The addon runs axe after every story render**, in its own `afterEach`, and
the switch is not the one it looks like. Read in its source, four conditions
have to hold for it to run, and its default parameter is `test: 'todo'` — so
removing our `a11y: { test: 'error' }` changed nothing at all, measured: 11 of
480 again. That is the step that would have looked like the fix, and shipping
it would have left the flake in place with a commit claiming otherwise. The
lever that works is the addon's own `manual` global, and the wording is honest:
there IS automated accessibility here, and it is this suite.

**And the hook that finds it is a FLAG, not a call.** The wrapper on
`axe.run` measured nothing because the addon resolves its engine through a
module import rather than through the global, so the call never passed the
window object. `axe._running` is a state, and reading a state is what worked —
the same distinction §11 draws between a moment and a state, arriving in the
instrumentation rather than in the assertion.

### 11.4 `expect.poll` does not retry a callback that throws

**Added 2026-09-10.** This repository reaches for `expect.poll` thirty-one
times, because §11 keeps sending it there: a state that is polled is the
answer to almost every "assert a moment" defect in this suite. So it is worth
knowing exactly what it retries.

> Measured: a callback that throws is **propagated on the first call**. The
> timeout is not consulted, and the poll does not tick again.

```
POLL AND THROW: it propagated: not yet after 1 call(s)
```

That makes the shape of the callback part of the check. `page.evaluate` and
`locator.evaluate` are safe as the OUTER call — a locator waits for its
element — but the code inside runs against whatever the DOM held at that
instant, and `getComputedStyle(null)` throws. A poll whose callback reads
`querySelector(...)!.something` is a poll with a five-second timeout and one
attempt.

The rule: **a polled callback returns a value for every state, including
"not there yet".** A sentinel the assertion will not match is a retry; an
exception is a failed test.

### 11.5 And when several DIFFERENT checks fail, suspect the machine

**Added 2026-09-10**, from an afternoon that looked like a broken branch.

Three consecutive full runs of the behaviour suite, at two workers, each
dropped exactly one check — and a different one each time, with a different
symptom: fifteen seconds of polling for a tab that never opened, a poll on two
computed styles, and a story that never mounted inside thirty seconds. Every
one of them passed in isolation, immediately.

The cause was not in any of the three. **3.1GB free of 15.85**, with 3.1GB
still held by nineteen node and browser processes left behind by earlier runs.
With those stopped and 5.48GB free, two consecutive runs of all 438 passed.

So memory belongs on §11's list beside speed, the clock and the
configuration — it is a form of speed, and the Playwright configuration in
this repository already carries the measurement that six workers on a machine
with 2.4GB free were slower than two AND dropped a check.

The part worth carrying is the DIAGNOSTIC, because it is cheap and it is the
opposite of what a failure invites you to do:

- One check failing repeatedly, in the same place, is the check or the code.
- Several different checks failing once each, none of them repeating, is the
  machine. Reproduce in isolation before reading a single line of the failure.

The habit that follows: after a long session of full runs, look at what is
still resident before believing a new failure. Nineteen orphaned browsers is
not an exotic state — it is what an interrupted run leaves.

### 11.5.1 And the machine has a resource nobody counts: sockets

**Added 2026-09-11**, and it is the first time this repository has NAMED one of
these rather than inferring it.

§11.5's diagnostic worked exactly as written — a different check each run, none
repeating, every one passing in isolation — so the machine was the suspect.
Memory was fine this time: 6.67GB free of 15.85, with no orphaned processes.
The suspicion had nowhere to go.

What closed it was §11.3 applied to the one wait that had no instrument. The
accessibility suite fails through `gotoStory`, whose first step waits for the
story to mount; when that ran out, the message was Playwright's own — "waiting
for locator('#storybook-root > \*')" — which is the symptom in every case and
the cause in none. One diagnostic later, on its first real occurrence:

    the story "components-splitbutton--sizes" never mounted:
    {"rootChildren":0,"bodyClass":"(none)","errorText":""};
    the page said: console: Failed to load resource: net::ERR_NO_BUFFER_SPACE

The HOST had run out of socket buffers, so the browser could not fetch the
story's own chunk. Measured immediately afterwards: **1172 sockets in
TIME_WAIT, 1117 of them to the preview server's port**, after roughly 2900
story loads in one session.

Three things are worth carrying:

1. **A resource can be exhausted without being visible.** Memory and CPU are
   the two anybody checks. Sockets in TIME_WAIT are invisible to both, they
   accumulate across runs rather than within one, and on Windows they surface
   as a failed fetch rather than as anything named "out of".
2. **The worker count is not the finding.** Each test takes a fresh context and
   reconnects, so the total churn is identical at any count; what the count
   changes is the PEAK, which is what runs out. The record on one laptop: six
   workers dropped a check in two runs of two, four dropped one in the second
   of two, and two passed 480 of 480 — a curve, not a threshold.
3. **Two waits sat side by side and only one had an instrument.** The wait for
   the stylesheet below it had been given a full diagnostic after three
   occurrences; the wait for the mount above it had none, and it is the one
   that kept failing. When a helper is instrumented, instrument all of its
   waits — the next mystery will choose the one that was skipped.

### 11.6 An artefact nobody can open is a failure nobody can read

**Added 2026-09-10**, and it is §11.3's rule turned on the pipeline rather than
on a check.

The workflow has uploaded `playwright-report/` on failure since the visual
suite existed, under a comment that says exactly the right thing — "the diff
images are the whole point of a visual failure: a report that says '13 differ'
without showing them is unactionable". **The directory was never created.** No
reporter was configured, so Playwright used its default, which is `list`
locally and `dot` on CI, and neither writes a report. The step uploaded nothing
and said nothing, because an upload of a missing path is a warning rather than
an error.

It cost what the comment predicted, in the one place a diff matters most: a
baseline failed CI at 289 pixels on a branch that changed no pixel, and the
artefact that would have said why did not exist. That failure has no cause on
record and §11.3 is why it was left that way.

It was the second failure of that same baseline. On the **first** — 225
pixels — the cause was guessed wrong before the diff was opened: assumed to be
a broken-image glyph, and it was antialiasing on every circular border. The two
events are separated here on purpose, because one sentence carrying both read
as though the wrong guess had been made about the 289 — and a document about
losing evidence should not be the one misplacing it.

Two things generalise beyond Playwright:

- **A comment describing an intention is not the intention working.** This one
  read as though somebody had checked, which is why nobody did for months. The
  same sentence with a measurement in it — "verified: the report has
  `index.html`" — would have been either true or obviously stale.
- **Verify the artefact, not the step.** A green upload step means the action
  ran, not that anything is in it. The check is to open what it produced once,
  by hand, which took one command.

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
