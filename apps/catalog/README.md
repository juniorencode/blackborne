# Visual catalog

The Storybook that shows every component in every state.

```sh
pnpm --filter catalog dev      # http://127.0.0.1:6006, for working on a story
pnpm build:catalog             # build the package and the catalog, ~10s
pnpm --filter catalog test:e2e # behaviour, against the BUILT catalog on 6007
pnpm --filter catalog test:a11y
```

**Two servers, two ports, on purpose.** 6006 is the dev server a person works
against. The checks are served from the static build on 6007, because a dev
server compiles a story the first time it is asked for — which has timed a
story out three times here under a full run — and because a built directory is
what makes running the suites in parallel safe. Keeping the ports apart is what
stops a run from silently verifying whatever server happened to be up:
`e2e/catalog.ts` has the whole argument.

So a check run needs `pnpm build:catalog` first. `pnpm verify:full` and CI do it
for you; iterating on one spec means building once and re-running, since the
preview server is reused.

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

## Built CSS, source components

The split is deliberate:

- **The stylesheet is the built artifact.** `blackborne/styles.css` resolves to
  `dist/styles.css`, so the catalog renders against the compiled, prefixed CSS
  a consumer receives. Prefixing, the token layers and the absence of a global
  reset only exist there — none of it can be checked against source.
- **The components are the source**, because the stories sit beside them and
  import them by relative path. That buys fast reloading while building.

So after changing anything under `src/styles/`, run `pnpm --filter blackborne
build` or the catalog keeps showing the old CSS. Storybook also caches its
transforms: if an export you just added appears to be missing, restart it.

## Browser checks

`e2e/` holds Playwright tests asserting computed colours across the three theme
axes. They exist because a CSS variable bug made dark mode and brand overrides
silently do nothing while every unit test passed — jsdom cannot resolve
variables, and cannot answer where focus goes either.

**If a full run drops one check and a re-run of that check passes, read the
machine before the diff.** That is doc 10 §11.5's diagnostic — one check
failing repeatedly is the code, several failing once each is the machine — and
§11.5.1 names the resource nobody counts. On 2026-09-11 the accessibility
suite dropped a different story in each of two runs at six workers, both
passing in isolation, with 6.67 GB of memory free and no orphaned process. The
diagnostic in `e2e/story.ts` reported `net::ERR_NO_BUFFER_SPACE`: the host was
out of socket buffers, with 1172 sockets in TIME_WAIT and 1117 of them to port
6007 after roughly 2900 story loads in one session.

So after a long session of full runs, the remedy is fewer concurrent browsers
on that machine:

```sh
pnpm --filter catalog exec playwright test --project=a11y --workers=2
```

Measured on the same laptop and the same build: six workers dropped a check in
two runs of two, four dropped one in the second of two, and two passed 480 of 480. **Not a retry** — doc 10 §11 is explicit that a retry turns a real failure
into a coincidence, and this failure is real. It just belongs to the host
rather than to the library.

## What runs where

| Job                                 | What it covers                                                      |
| ----------------------------------- | ------------------------------------------------------------------- |
| `pnpm --filter catalog test:e2e`    | The behaviour checks, plus axe against **every** story              |
| `pnpm --filter catalog test:visual` | Visual regression, in the container the baselines were generated in |

The accessibility pass takes its story list from Storybook's own index, so a
new story is covered the moment it exists rather than when somebody remembers
to add it. That is the property worth protecting: a check you have to opt into
is a check that quietly stops covering the newest thing.
