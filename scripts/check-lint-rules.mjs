/*
 * THE PROJECT'S OWN LINT RULES ARE TESTED, IN BOTH DIRECTIONS.
 *
 * `eslint.rules.js` is thirty-four rules: fourteen `no-restricted-syntax`
 * selectors, seventeen restricted globals and three restricted import groups.
 *
 * Seventeen of the thirty-four are a PATTERN inside a string — every one of
 * the fourteen selectors embeds a regular expression, and the three import
 * groups hold twelve globs between them — and that file's own header says why
 * this is dangerous: "a silently mangled backslash produces a rule that
 * matches nothing while looking correct." The other seventeen are plain
 * identifiers, which cannot be mangled and can still be wired to the wrong
 * files; both halves are checked here, and the wiring is the tier at the
 * bottom.
 *
 * Doc 10 §2 calls these the highest-return item in the whole document, and
 * they are how nine written rules stop being a matter of memory. Until this
 * script, **not one of them had a standing check**. Several were verified by
 * hand on the day they landed — three import groups say so in their comments,
 * and the thirteen added in the Omit and globals wave were probed against a
 * throwaway file — but a verification that happened once is a verification
 * nobody can repeat.
 *
 * ## Why the rules are read from the RESOLVED config
 *
 * Not imported from `eslint.rules.js`. `calculateConfigForFile` hands back the
 * rules as `eslint.config.js` actually attaches them to a shipped file, so this
 * tests the rule AND its wiring. A perfect selector attached to the wrong
 * `files` glob protects nothing, and that is invisible to a test that imports
 * the rule objects.
 *
 * ## Why the fixtures are inline text
 *
 * `lintText` takes a `filePath` that need not exist on disk, which is what
 * makes the wiring checkable: the same string is linted as `Button.tsx` and as
 * `Button.test.tsx`, and must be reported once and ignored once. A fixture
 * DIRECTORY cannot do that — it only ever has one path.
 *
 * ## Why every class fixture carries `bb:`
 *
 * `src/styles/index.css` imports Tailwind with `prefix(bb)`, so `bb:ml-1` is
 * the only spelling of that utility this library can use; a bare `ml-1`
 * compiles to nothing, the way `w-control-md` did. The four class selectors
 * all require `[: ]` before the class name, and the prefix's own colon is what
 * satisfies it — so a fixture of `ml-1` would assert a rule against a class
 * that cannot ship, and would report four defects that are not there.
 *
 * ## What this cannot catch
 *
 * The blind spots at the bottom of this file: shapes that are silent today and
 * are recorded rather than closed. Closing one is a rule change, which is a
 * decision rather than a chore.
 */
import { ESLint } from 'eslint';

const SHIPPED = 'packages/blackborne/src/components/Button/Button.tsx';
const A_TEST = 'packages/blackborne/src/components/Button/Button.test.tsx';
const A_STORY = 'packages/blackborne/src/components/Button/Button.stories.tsx';
const THE_ONE_DOOR = 'packages/blackborne/src/internal/useWindowFits.ts';

const eslint = new ESLint();

/**
 * The resolved config for a shipped file — and the assertion that there IS one.
 *
 * `calculateConfigForFile` returns `undefined` for a path nothing lints, so an
 * `ignores` entry that swallowed the package would kill this script on the
 * next line with `Cannot read properties of undefined (reading 'rules')` —
 * measured, by adding one. A stack trace naming a property is not a diagnosis:
 * doc 10 §11.3 asks for the sentence that attributes the next occurrence, and
 * the occurrence here is "nothing lints the library any more", which is a
 * catastrophe worth a sentence of its own.
 */
const configOf = async path => {
  const config = await eslint.calculateConfigForFile(path);
  if (!config) {
    throw new Error(
      `Nothing lints ${path}. It matches an \`ignores\` entry in eslint.config.js, so every rule below is unenforced there and the whole of this script would be checking rules that reach nothing.`
    );
  }
  return config;
};

const resolved = await configOf(SHIPPED);

/**
 * The rule's options as the config actually attaches them.
 *
 * A shape assertion rather than a cast: if the block carrying these rules is
 * renamed or re-scoped, this throws a sentence instead of silently testing an
 * empty list.
 */
const optionsOf = name => {
  const entry = resolved.rules[name];
  if (!Array.isArray(entry) || entry[0] !== 2 || entry.length < 2) {
    throw new Error(
      `${name} is not an error for shipped source — the config block moved.`
    );
  }
  return entry.slice(1);
};

const selectors = optionsOf('no-restricted-syntax');
const globals = optionsOf('no-restricted-globals');
const groups = optionsOf('no-restricted-imports')[0].patterns;

/*
 * One rule at a time, so a report is ATTRIBUTABLE. A fixture linted under all
 * thirty-four could be reported by a neighbour and read as proof of the one it
 * was written for — which is the same mistake as a check passing for the wrong
 * reason, at the level of the checks themselves.
 *
 * Untyped on purpose: `projectService` wants a file on disk and these fixtures
 * are text. No rule here needs type information.
 */
const base = {
  files: ['**/*.ts', '**/*.tsx'],
  languageOptions: {
    parser: resolved.languageOptions.parser,
    globals: resolved.languageOptions.globals,
    parserOptions: { ecmaFeatures: { jsx: true } }
  }
};

const cache = new Map();
const lintOne = async (rule, kind, code, filePath = SHIPPED) => {
  const key = `${kind}:${JSON.stringify(rule)}`;
  let instance = cache.get(key);
  if (!instance) {
    const rules =
      kind === 'syntax'
        ? { 'no-restricted-syntax': ['error', rule] }
        : kind === 'globals'
          ? { 'no-restricted-globals': ['error', rule] }
          : { 'no-restricted-imports': ['error', { patterns: [rule] }] };
    instance = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [{ ...base, rules }]
    });
    cache.set(key, instance);
  }
  const [result] = await instance.lintText(code, { filePath });
  return result.messages.length;
};

const failures = [];
const check = async (label, kind, rule, caught, ignored) => {
  const hits = await lintOne(rule, kind, caught);
  if (hits === 0) failures.push(`${label}: did not catch  ${caught.trim()}`);
  const quiet = await lintOne(rule, kind, ignored);
  if (quiet !== 0) failures.push(`${label}: fired on      ${ignored.trim()}`);
};

/* ─────────────────────────── the fourteen selectors ─────────────────────── */

const SYNTAX = [
  ['a literal colour', "const a = '#f0f0f0';", "const a = 'var(--bb-accent)';"],
  ['a colour function', "const a = 'rgb(1 2 3)';", "const a = 'currentColor';"],
  [
    'a layer-1 primitive',
    "const a = 'var(--bb-x-gray-7)';",
    "const a = 'var(--bb-surface-knob)';"
  ],
  [
    'a physical class',
    "const a = 'bb:flex bb:ml-1';",
    "const a = 'bb:flex bb:ms-1';"
  ],
  [
    'a physical edge',
    "const a = 'bb:rounded-l-md';",
    "const a = 'bb:rounded-s-md';"
  ],
  [
    'a physical alignment',
    "const a = 'bb:text-left';",
    "const a = 'bb:text-start';"
  ],
  [
    'a physical style property',
    'const s = { marginLeft: 4 };',
    'const s = { marginInlineStart: 4 };'
  ],
  [
    'a viewport variant',
    "const a = 'bb:md:hidden';",
    "const a = 'bb:@md:hidden';"
  ],
  [
    'a viewport media query',
    "const a = '@media (min-width: 40rem)';",
    "const a = '@container (width >= 40rem)';"
  ],
  [
    'a literal label',
    'const x = <img alt="A photograph" />;',
    'const x = <img alt="" />;'
  ],
  [
    'literal user-facing text',
    'const x = <p>Save the invoice</p>;',
    'const x = <p>{label}</p>;'
  ],
  [
    'an Omit-shaped props type',
    'interface NewThingProps extends Omit<Base, "x"> {}',
    'interface NewThingProps extends Pick<Base, "x"> {}'
  ],
  [
    'the document through an element',
    'const d = (el: HTMLElement) => el.ownerDocument;',
    'const d = (el: HTMLElement) => el.parentElement;'
  ],
  [
    'the document through a computed key',
    'const d = (el: HTMLElement) => el["defaultView"];',
    'const d = (el: HTMLElement) => el["id"];'
  ]
];

if (SYNTAX.length !== selectors.length) {
  failures.push(
    `there are ${String(selectors.length)} selectors and ${String(SYNTAX.length)} fixtures — a rule was added without one`
  );
}

for (const [index, selector] of selectors.entries()) {
  const fixture = SYNTAX[index];
  if (!fixture) continue;
  await check(
    `selector ${String(index)} · ${fixture[0]}`,
    'syntax',
    selector,
    fixture[1],
    fixture[2]
  );
}

/* ──────────────────────────── the seventeen globals ─────────────────────── */

/*
 * `no-restricted-globals` matches an UNSHADOWED identifier, so the silent
 * fixture is the same name declared locally. That is the property the rule
 * has and the reason `self`, `top` and `parent` cost nothing to ban.
 */
for (const rule of globals) {
  await check(
    `global · ${rule.name}`,
    'globals',
    rule,
    `const use = () => ${rule.name};`,
    `const use = (${rule.name}: number) => ${rule.name};`
  );
}

/* ───────────────────────────── the three groups ─────────────────────────── */

const IMPORTS = [
  [
    "import x from '../../components/Select/parts';",
    "import x from '../../internal/cx';"
  ],
  [
    "import { chain } from '@react-aria/utils';",
    "import { Button } from 'react-aria-components';"
  ],
  ["import './Button.css';", "import { cx } from '../../internal/cx';"]
];

if (IMPORTS.length !== groups.length) {
  failures.push(
    `there are ${String(groups.length)} import groups and ${String(IMPORTS.length)} fixtures`
  );
}

for (const [index, group] of groups.entries()) {
  const fixture = IMPORTS[index];
  if (!fixture) continue;
  await check(
    `import group ${String(index)}`,
    'imports',
    group,
    fixture[0],
    fixture[1]
  );
}

/* ──────────────────────────────── the wiring ────────────────────────────── */

/*
 * The rules exist AND reach the right files. A story and a test are exempt on
 * purpose — their literal strings and sample colours are the point — and
 * `useWindowFits` is the one door allowed to ask the window, which stopped
 * being a blanket off-switch when the globals list grew.
 *
 * ## Why this tier READS the config instead of linting
 *
 * The first version linted the same fixture as each of the three paths, which
 * is the obvious form and cost 8 of this script's 10 seconds: the real config
 * attaches `projectService`, so every `lintText` under it loads the package's
 * TypeScript program — measured at 5.3s for the first call, against 5ms for a
 * lint under the isolated config the tiers above use.
 *
 * It bought nothing those tiers do not already prove. Every one of the 34
 * rules is fired and silenced above; the only question left here is WHICH
 * FILES the config attaches them to, and a resolved severity answers that
 * exactly. What it gives up is the end-to-end path — a real config whose
 * parser somehow swallowed a report would pass this tier — and that is the
 * trade, written down rather than hidden.
 *
 * `isPathIgnored` is asserted alongside it because the two failures look
 * identical from here and are not: a rule can be absent because the block does
 * not cover this path, or because nothing lints the file at all. Measured, an
 * ignored path makes `calculateConfigForFile` return undefined, so the
 * distinction has to be drawn before the rules are read rather than after.
 */
const wiring = [
  [SHIPPED, 'error'],
  [A_TEST, 'exempt'],
  [A_STORY, 'exempt']
];

for (const [path, expected] of wiring) {
  if (await eslint.isPathIgnored(path)) {
    failures.push(
      `wiring: ${path} is IGNORED, so no rule in this file reaches it — which is not the same as being exempt from one`
    );
    continue;
  }
  const entry = (await configOf(path)).rules['no-restricted-syntax'];
  const severity = Array.isArray(entry) ? entry[0] : entry;
  const actual = severity === 2 ? 'error' : 'exempt';
  if (actual !== expected) {
    failures.push(
      `wiring: ${path} has no-restricted-syntax ${actual} and should be ${expected}`
    );
  }
}

/*
 * And the one door is narrow rather than open: it may ask the window, and it
 * may not fetch. This is the assertion that would have caught the exception
 * widening silently when five network globals were added to the list.
 */
const doorEntry = (await eslint.calculateConfigForFile(THE_ONE_DOOR)).rules[
  'no-restricted-globals'
];

/*
 * THE SEVERITY, and it is read SEPARATELY because the options cannot tell you.
 *
 * `'off'` is the regression this assertion exists for — the exception was a
 * blanket off-switch until the globals list grew — and measured, a resolved
 * config reports it as `[0, ...all seventeen]`: flat config keeps the earlier
 * block's options when the newer one supplies only a severity. So the list
 * comes back IDENTICAL to the strictest possible configuration while enforcing
 * nothing, and a check reading the names alone reports the exact opposite of
 * what is true. This one did, once, which is why it is written down here
 * rather than merely fixed (doc 10 §11.1).
 */
const severity = Array.isArray(doorEntry) ? doorEntry[0] : doorEntry;

/* The names the rule still BANS in that file — an allowance is an absence. */
const bannedThere = new Set(
  Array.isArray(doorEntry) ? doorEntry.slice(1).map(rule => rule.name) : []
);

if (severity !== 2) {
  failures.push(
    `wiring: ${THE_ONE_DOOR} has no-restricted-globals at severity ${JSON.stringify(severity)} — off, or a warning nothing fails on. Either way every name on the list is legal in that one file, and it is allowed the WINDOW (doc 04 §5) rather than everything.`
  );
} else {
  for (const name of ['window', 'matchMedia']) {
    if (bannedThere.has(name)) {
      failures.push(
        `wiring: ${THE_ONE_DOOR} is refused ${name}, and it is the one door doc 04 §5 grants the viewport question to`
      );
    }
  }
  for (const name of ['fetch', 'document', 'localStorage', 'globalThis']) {
    if (!bannedThere.has(name)) {
      failures.push(
        `wiring: ${THE_ONE_DOOR} is allowed ${name}, and its exception is doc 04 §5's viewport question rather than a licence`
      );
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */

if (failures.length) {
  process.stderr.write(
    `\nThe project's own lint rules do not do what they claim:\n\n  ${failures.join('\n  ')}\n\n` +
      'Each line is one rule and one fixture. A rule that "did not catch" its\n' +
      'fixture is matching nothing while looking correct, which is what\n' +
      'eslint.rules.js warns about in its own header.\n'
  );
  process.exit(1);
}

process.stdout.write(
  `  ${String(selectors.length + globals.length + groups.length)} lint rules, each verified in both directions, plus the wiring\n`
);

/*
 * ─────────────────────────── THE BLIND SPOTS ──────────────────────────────
 *
 * Eighteen shapes that a reader would expect these rules to catch and that are
 * SILENT today. Measured with a throwaway probe against the real config, not
 * reasoned about: thirty-five candidates linted, twenty silent, and two of
 * those twenty turned out not to be holes at all — `import x from '../Select'`
 * is what the rule's own message tells you to write, and
 * `require('./Button.css')` is caught by `@typescript-eslint/no-require-imports`
 * one rule over.
 *
 * They are recorded rather than closed. Closing one is a rule change, which is
 * a decision rather than a chore, and a rule that fires on a shape nobody
 * writes costs more than the hole it fills.
 *
 * NONE OF THE EIGHTEEN HAS A LIVE EXPOSURE, measured at the time of writing:
 * no class string in this package sits in a template literal (every backtick
 * that matched was a comment), there is no `bb:min-[` or `bb:max-[` anywhere,
 * no named CSS colour, and every literal `label=` hit was a JSDoc example.
 * That is what makes them worth recording instead of fixing: they are the
 * shape the next author might reach for, not a defect sitting in the tree.
 *
 * ## Six of them are ONE cause
 *
 * Nine selectors are anchored on `Literal[value=…]` and not one of the
 * fourteen names `TemplateLiteral`. So a backtick defeats them all at once:
 *
 *   `#f0f0f0`            a colour
 *   `bb:ml-1`            a physical class
 *   `bb:m${side}-1`      a physical class built by interpolation
 *   `var(--bb-x-${s}-7)` a layer-1 primitive built by interpolation
 *   `@media (min-width)` a viewport media query
 *
 * Two of those five cannot be closed by adding `TemplateLiteral` to the
 * selector at all — an interpolated class has no value to match until it runs.
 * Which is the argument for the OTHER instruments rather than for a bigger
 * regex: `src/styles/stylesheet.test.ts` reads the compiled CSS, and a class
 * assembled at run time is one Tailwind never saw either, so it compiles to
 * nothing and the baseline shows it.
 *
 * ## The rest, by family
 *
 * Colour       a named CSS colour — `'rebeccapurple'`
 *              a hex split across a concatenation — `'#f0' + 'f0f0'`
 *
 * Direction    `left`/`right` inside a plain CSS string — `'margin-left: 4px'`
 *              a computed style key — `{ ['margin' + 'Left']: 4 }`
 *              a hyphenated style key — `{ 'margin-left': 4 }`
 *
 * Viewport     an arbitrary variant — `'bb:min-[40rem]:hidden'`. This is the
 *              one worth watching: it is a spelling Tailwind supports, it
 *              reads as ordinary, and it does exactly what doc 04 forbids.
 *
 * Text         a literal held in a variable the JSX then reads
 *              a literal passed as an ordinary prop — `<Thing label="Save" />`
 *              a literal in a ternary — `{ok ? 'Yes' : 'No'}`
 *
 * Props type   an `Omit` in a type ALIAS rather than an interface
 *              `Exclude`, which does the same job on a union
 *
 * Globals      the document reached through an event — `(e: Event) => e.view`
 *
 * Imports      a deep base import through a dynamic specifier —
 *              `await import('@react-aria/utils')`
 *
 * ## What this file itself cannot tell you
 *
 * That a rule is the RIGHT rule. Every check here asks whether a rule does
 * what its author meant; whether that meaning serves the foundation it cites
 * is a question for the document, and the documents are where it is answered.
 */
