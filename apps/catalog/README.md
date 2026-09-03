# Visual catalog

The Storybook that shows every component in every state.

```sh
pnpm --filter catalog dev     # http://127.0.0.1:6006
pnpm --filter catalog test:e2e
```

It is not a nice-to-have. Several rules in the foundations can only be checked
here, and the stories are built around them:

| Story                | What it exists to check                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **States**           | Every state at once, including hover, pressed and focus — forced by setting the same DOM attributes React Aria sets, so they are visible without interaction and reachable by a screenshot tool |
| **Modes**            | Light and dark **side by side**, never by toggling (doc 03 §6)                                                                                                                                  |
| **Densities**        | That density moves heights and spacing, and no colour (doc 03 §3)                                                                                                                               |
| **Direction**        | LTR next to RTL                                                                                                                                                                                 |
| **Brand Override**   | That redefining the scale recomputes the semantic tokens (doc 03 §7)                                                                                                                            |
| **All Axes**         | Dark, compact, RTL and an alternate brand at once — where the three greys you thought were one show up                                                                                          |
| **Long Labels**      | Pseudo-localisation, the highest-return test in doc 05 §8                                                                                                                                       |
| **Narrow Container** | The 320px container from the entry gate                                                                                                                                                         |

**Every story sits in a resizable box — drag its corner.** Doc 04 §10 is
explicit that the real test is narrowing the _container_ with the window wide,
because that is the situation a consumer is in. Storybook's viewport tool
resizes the window, which is the wrong axis.

## It consumes the built package

The catalog imports `blackborne/styles.css` and the published exports, not the
source. So it validates the artifact that actually ships, and `pnpm --filter
blackborne build` has to run before changes appear. A catalog rendering
something consumers never receive would prove nothing.

## Browser checks

`e2e/` holds Playwright tests asserting computed colours across the three theme
axes. They exist because a CSS variable bug made dark mode and brand overrides
silently do nothing while every unit test passed — jsdom cannot resolve
variables, and cannot answer where focus goes either.

## Still missing

- **Visual regression.** The safety net that tells you which twelve components
  changed appearance after a token edit (doc 10 §6).
- **Automated accessibility in CI.** The a11y addon runs in the UI; wiring it
  into the browser job is not done.
