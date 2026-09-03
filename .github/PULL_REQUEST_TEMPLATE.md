## What this changes

<!-- One or two sentences. What and why, not how. -->

## Why now

<!-- What real need drove this. For a new component or prop: name the two
     consumers (rule of two). "While we were at it" is not a reason. -->

---

## Checks

- [ ] `pnpm verify` passes locally
- [ ] Docs updated if this changes behavior or the public API
- [ ] `CHANGELOG.md` updated, with a migration note if anything breaks

## Entry gate

Only for a **new component**. All twelve, or it does not enter — eleven out of
twelve stays in the project that asked for it.

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
- [ ] Every state is in the visual catalog: default, hover, focus, active,
      disabled, loading, error, empty
- [ ] It contains no literal user-facing string outside the dictionary
