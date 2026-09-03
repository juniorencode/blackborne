# Adding a component

The full recipe. Read it before writing anything — most of the cost of a
component is decided before the first line.

> **Note on the file layout.** The exact file layout is settled with the first
> component, together with [02 · API conventions](../foundations/README.md),
> which is written after the React Aria spike. Everything else on this page is
> already decided and applies now.

This page is the operational summary. The reasoning behind every rule lives in
the [foundations](../foundations/README.md); when the two disagree, the
foundation wins and this page needs fixing.

## 1. Does it belong here at all?

Three questions, in order. A "no" ends it.

**Do two real consumers need it?** Not "would find it useful" — need it, today,
in code that exists. With one consumer you do not generalise, you just move
code to a place where it is harder to change. Asking early is still worth
doing: the request stays open as a signal until a second one appears.

**Does its name mention a business domain?** If the component only makes sense
inside one industry or one application, it belongs to that application.

**Does it break a non-goal?** The library provides no routing, no application
shell, no whole screens, no business validation, no charts and no icon set.
These are settled and are not reopened per component.

## 2. Design it as a suite, not as a component

Anything with logic splits into three:

| Piece                            | What it holds                                              |
| -------------------------------- | ---------------------------------------------------------- |
| **Hooks**                        | The state and the logic. Tested without rendering anything |
| **Presentational pieces**        | The parts that paint, and delegate everything else         |
| **A thin assembly** _(optional)_ | The ready-to-use composition, for the common case          |

The rule that makes this real: **the assembly may not have a single capability
the pieces lack.** If something can only be achieved by passing a prop to the
assembly, the model is wrong and that capability belongs in a hook.

The test: can you rebuild the assembly from the public pieces, losing nothing?

This is what prevents the component that grows to a thousand lines by
accumulating props. When you feel the urge to add a boolean prop for one
project's case, that is the signal — the capability wants to be a hook.

## 3. Build it

Start from the headless base. React Aria gives you roles and ARIA attributes,
keyboard navigation, focus management, screen reader announcements, and layer
placement. Do not reimplement any of it. If a pattern is not covered, search
first; building it by hand is the last resort and needs a written reason.

While building, the things that are always forgotten:

- **Every state.** Default, hover, focus, active, disabled, loading, error,
  empty. For a field, also: read-only, and saving. Read-only and disabled are
  not the same thing and must not look the same.
- **Empty is two states.** "There is no data yet" tells the person how to
  start. "The filter matched nothing" tells them what was searched and offers
  to clear it. Showing the first when the second is true is one of the most
  common experience bugs there is.
- **Loading does not blank the screen.** Keep the previous content, dimmed or
  behind an indicator. Emptying and refilling makes an application feel slower
  than it is.
- **Under ~300ms, show no spinner at all.** Appearing and vanishing reads worse
  than nothing.
- **Reserve the space before the content arrives.** Nothing may shift when data
  lands, least of all under the cursor.

## 4. The entry gate

From [01 · Principles](../foundations/01-principles.md), §5.

Twelve checkboxes. **All twelve, or it does not enter** — eleven out of twelve
stays in the project that asked for it until it is twelve.

- [ ] Two real consumers ask for it
- [ ] Its name mentions no business domain
- [ ] It does not need to know where its data comes from
- [ ] It works with no provider around it
- [ ] It works in a 320px container
- [ ] Its logic lives in hooks or pure functions, tested without rendering
- [ ] If it is an assembly, it can be rebuilt from the public pieces with
      nothing lost
- [ ] It works in light and dark, and with an overridden brand theme
- [ ] It works in LTR and RTL
- [ ] It survives a language change: text, date and number formats, and labels
      30% longer
- [ ] It is keyboard navigable, with visible focus
- [ ] Every state is in the visual catalog
- [ ] It contains no literal user-facing string outside the dictionary

## 5. How to actually check those

Most of them are cheap if you know where to look.

| Check                         | How                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 320px container               | Resize the container in the catalog — **not** the window. A narrow container inside a wide window is the real situation                                                              |
| RTL                           | Switch the catalog to an RTL language. Directional icons flip; numbers and codes do not                                                                                              |
| Longer labels                 | Pseudo-localisation: lengthen every string ~40%. The highest-value test on this list — it finds layout breaks in minutes that otherwise surface the day someone translates to German |
| Keyboard                      | Traverse the whole component without touching the mouse. Two minutes, and it finds nearly everything serious                                                                         |
| Color is not the only channel | Look at it in greyscale. Required, invalid, selected and active must still be distinguishable                                                                                        |
| Focus visible                 | On every surface, including the accent one                                                                                                                                           |
| Screen reader                 | Only for complex interaction: dialogs, menus, comboboxes, date pickers, tables with selection, and alerts                                                                            |

## 6. Keyboard means the same thing everywhere

These are fixed across the whole library. One component breaking the pattern
destroys trust in the other twenty-nine.

| Key      | Always means                                       |
| -------- | -------------------------------------------------- |
| `Enter`  | Confirms the primary action of the current context |
| `Escape` | Closes or cancels the current level, one at a time |
| `Tab`    | Moves to the next control                          |
| Arrows   | Move **within** a control that has several options |
| `Space`  | Toggles: checkboxes, switches                      |

## 7. Before opening the pull request

```sh
pnpm verify
```

Then fill in the pull request template, including the twelve checkboxes. Update
`CHANGELOG.md`. If anything about the public API changed, update the docs in
the same pull request — documentation that lags by one pull request never
catches up.

## Signals you got it wrong

Worth re-reading the principles when any of these appear:

- The component passes ~500 lines
- It accumulates more than ~15 props
- A new capability arrived as a prop on an existing component instead of a hook
- Boolean props appear for one project's specific case (`isCompact`,
  `hideHeaderOnMobile`)
- A consumer has to wrap the library to use it, or patches its CSS from outside
- There are two ways to do the same thing in the library
- A fixed width or height exists so one particular label fits
