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

| Layer                       | What it checks                                             | Cost                    |
| --------------------------- | ---------------------------------------------------------- | ----------------------- |
| **Format and lint**         | Code style and the project's own rules from section 2      | Seconds                 |
| **Types**                   | That the public surface is properly typed                  | Seconds                 |
| **Logic**                   | Hooks and pure functions, **rendering nothing** (P6)       | Fast                    |
| **Behavior**                | The component from the perspective of someone using it     | Medium                  |
| **Re-render**               | That typing in one field does not re-render its neighbours | Medium                  |
| **Automated accessibility** | Contrast, missing labels, malformed ARIA                   | Medium                  |
| **Visual regression**       | What changed in appearance, and where                      | Slow                    |
| **Package**                 | Types resolve, exports are correct, no side effects        | Fast                    |
| **Server**                  | That everything prerenders without mismatches              | Free: the site gives it |
| **Manual**                  | Keyboard always; screen reader on the complex ones         | Minutes                 |

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
and know within a minute **which twelve components changed appearance**,
instead of opening them one by one.

It is the only thing that makes touching tokens safe once there are thirty
components.

So it does not produce constant false positives:

- Animations disabled during capture
- Dates, identifiers and sample data fixed, never random
- Fonts loaded before capturing
- An appearance change is **approved** explicitly; never ignored wholesale

Combinations captured: light and dark, LTR and RTL, normal and compact density.
Not all of them on every component — the full set only on the page that gathers
them all.

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
