/*
 * The project's own lint rules.
 *
 * Doc 10 §2 is blunt about why these exist: "what is not checked
 * automatically is not followed". A written rule survives a few weeks and
 * then yields to the first deadline. These turn the foundations into errors.
 *
 * Written with character classes rather than shorthand escapes on purpose:
 * the selectors are strings that pass through several layers of quoting, and
 * a silently mangled backslash produces a rule that matches nothing while
 * looking correct.
 *
 * They apply to shipped source only. Stories and tests relax them, because
 * they are not published and their literal strings are the point.
 */

const HEX = 'Literal[value=/#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]/]';
const FUNC_COLOR = 'Literal[value=/(rgb|rgba|hsl|hsla|oklch|lab|lch)[(]/]';
const PRIMITIVE = 'Literal[value=/--bb-x-/]';

/*
 * THE DOCUMENT THROUGH AN ELEMENT WE ALREADY HOLD, which is the route a ref
 * makes free: `ref.current.ownerDocument` never writes the word `document`,
 * and `defaultView` is the same door to the window.
 *
 * Two selectors, because the computed form is a Literal rather than a property
 * name. Measured: the dot form also catches the optional-chained
 * `el?.ownerDocument`, since ESTree keeps that node a MemberExpression.
 */
const OWNER_ROUTE =
  'MemberExpression[property.name=/^(ownerDocument|defaultView)$/]';
const OWNER_ROUTE_COMPUTED =
  'MemberExpression[computed=true] > Literal[value=/^(ownerDocument|defaultView)$/]';

const PHYSICAL_CLASS =
  'Literal[value=/[: ](pl|pr|ml|mr|left|right|inset-l|inset-r)-/]';
const PHYSICAL_EDGE = 'Literal[value=/[: ](border|rounded)-[lr]([-: ]|$)/]';
const PHYSICAL_ALIGN = 'Literal[value=/[: ](text|float|clear)-(left|right)/]';
const PHYSICAL_STYLE =
  'Property[key.name=/^(left|right|marginLeft|marginRight|paddingLeft|paddingRight|borderLeft|borderRight|borderLeftWidth|borderRightWidth|borderLeftColor|borderRightColor|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius)$/]';

/*
 * A PROPS TYPE IS A WHITELIST, which is doc 01 §3's P5 read through the type
 * system.
 *
 * `Omit` is a blacklist: a props type extending the base with one publishes
 * everything the base has EXCEPT what is named, so the base's next release
 * adds props to this library's public API and nobody decides. Measured while
 * removing `validate`: the pair reached exactly the ten `Omit`-shaped fields
 * and none of the components built from `Calendar` onward, which all use
 * `Pick`.
 *
 * Probed against this repository's own parser before landing, rather than
 * reasoned about: it matches `Omit` anywhere in an `extends` list, and not a
 * `Pick`, not a type alias, and not a return annotation — `ComboBox`'s
 * `forwardable` returns `Omit<T, OwnValueProp>` and is untouched. It contains
 * no backslash, so the mangling this file's header warns about cannot apply.
 *
 * ## The eighteen that predate it are exempted BY NAME, and the two obvious
 * ## alternatives were both tried and both fail
 *
 * A per-LINE `eslint-disable-line` does not survive the formatter: measured,
 * prettier moves a trailing comment off `export interface X extends Omit<` onto
 * the next line, which disables the wrong line and leaves the rule firing plus
 * an unused-directive warning. And `eslint-disable-next-line` cannot go above
 * the declaration, because twelve of the eighteen carry a JSDoc block there and
 * a comment between the two breaks the association.
 *
 * A per-FILE `ignores` list exempts the whole file, and `RadioGroup.tsx`
 * already holds TWO of these, so a nineteenth added there would pass silently.
 *
 * By name, a nineteenth props type fires wherever it is written, including in
 * one of these eighteen files. The list lives here rather than in eighteen
 * places, and it may only shrink: converting one to `Pick` means deleting its
 * name, and leaving the name behind costs nothing but reads as a claim that is
 * no longer true.
 *
 * Verified in both directions before landing: eighteen reported with the list
 * empty, zero with it full, and a nineteenth interface named anything else
 * reported inside `RadioGroup.tsx` itself.
 */
const OMIT_PREDATES_P5 = [
  'ButtonProps',
  'CheckboxGroupProps',
  'CheckboxProps',
  'ComboBoxSharedProps',
  'ConfirmDialogProps',
  'DialogProps',
  'DrawerProps',
  'NumberFieldProps',
  'PasswordFieldProps',
  'RadioGroupProps',
  'RadioProps',
  'SearchFieldProps',
  'SelectProps',
  'SeparatorProps',
  'SwitchProps',
  'TagsInputProps',
  'TextAreaProps',
  'TextFieldProps'
];

const OMIT_HERITAGE =
  `TSInterfaceDeclaration:not([id.name=/^(${OMIT_PREDATES_P5.join('|')})$/])` +
  ' > TSInterfaceHeritage[expression.name="Omit"]';

const VIEWPORT_CLASS = 'Literal[value=/[: ](sm|md|lg|xl|2xl):/]';
const VIEWPORT_MEDIA = 'Literal[value=/@media[^)]*(min-width|max-width)/]';

/*
 * The label attributes, EXCEPT an empty one.
 *
 * `:not([value=''])` was added with `Avatar`, the first component in the
 * library to render an `<img>`. An empty `alt` is not text a person reads — it
 * is the declaration that there is nothing to read, and the standard way to
 * say an image is decorative because something else already names it. There is
 * no dictionary key for "no text", and taking it as a prop would let a
 * consumer put a second copy of the name on a picture inside an element that
 * already carries one.
 *
 * The rule still catches every non-empty literal, which is the case it exists
 * for.
 */
const LITERAL_LABEL =
  "JSXAttribute[name.name=/^(aria-label|aria-description|aria-placeholder|aria-roledescription|aria-valuetext|title|placeholder|alt)$/] > Literal:not([value=''])";
const LITERAL_TEXT = 'JSXText[value=/[A-Za-z][A-Za-z][A-Za-z]/]';

const msg = {
  color:
    'No literal colours in a component. Use a semantic token (doc 03 §5, rule 1). Values live in the token layer and nowhere else.',
  primitive:
    'No layer-1 primitives in a component. --bb-x-* is private; use a semantic token (doc 03 §4.5).',
  physical:
    'No physical directions. Use start/end, never left/right — this is half of RTL support (doc 03 §5, rule 4).',
  viewport:
    'No viewport breakpoints. A component adapts to its own container, not the window (P4, doc 04 §2). The only exception is a component rendered in a portal, which declares its own media query in CSS with the reason written next to it.',
  text: 'No literal user-facing strings, accessibility labels included. Take it from the dictionary or as a prop (doc 05 §2.2, rule 1). A label nobody sees is still text a person reads.',
  network:
    'The library makes no requests and knows no URL (P2, doc 01 §3). Data arrives as a prop and an effect arrives as a function — `useAsyncOptions` is the shape: it calls a loader it was handed, and a test hands it an array.',
  alias:
    'That is the window under another name (P3, P4). All five resolve to it, which is why banning `window` alone was not a rule. The one exception is `internal/useWindowFits`, for a component rendered in a portal (doc 04 §5).',
  omit: 'A props type is a whitelist: `Pick` the base props this component publishes, never `Omit` the ones it does not (P5, doc 01 §3). An `Omit` lets a base upgrade widen this library’s public API with nobody deciding — measured, `validate` and `validationBehavior` reached exactly the ten `Omit`-shaped fields and nothing built from `Calendar` onward. The eighteen that predate this rule are exempted one line at a time; a new one is not.',
  owner:
    'No reaching the document through an element (P3). A portal container is RECEIVED, through `ConfigProvider`, beside the locale and the time zone (doc 08 §8) — holding a ref is not a licence to take one.'
};

export const restrictedSyntax = [
  { selector: HEX, message: msg.color },
  { selector: FUNC_COLOR, message: msg.color },
  { selector: PRIMITIVE, message: msg.primitive },
  { selector: PHYSICAL_CLASS, message: msg.physical },
  { selector: PHYSICAL_EDGE, message: msg.physical },
  { selector: PHYSICAL_ALIGN, message: msg.physical },
  { selector: PHYSICAL_STYLE, message: msg.physical },
  { selector: VIEWPORT_CLASS, message: msg.viewport },
  { selector: VIEWPORT_MEDIA, message: msg.viewport },
  { selector: LITERAL_LABEL, message: msg.text },
  { selector: LITERAL_TEXT, message: msg.text },
  { selector: OMIT_HERITAGE, message: msg.omit },
  { selector: OWNER_ROUTE, message: msg.owner },
  { selector: OWNER_ROUTE_COMPUTED, message: msg.owner }
];

/*
 * ADDED 2026-09-11, AND P2 IS THE OLDEST RULE HERE WITH NO CHECK AT ALL.
 *
 * Doc 10 §2's table carries a row for P3's globals and none for the network,
 * while doc 01 §3's P2 is unambiguous: no component makes requests or knows a
 * URL. `location` was banned — the URL half — and the request half was on
 * trust for the whole life of the library.
 *
 * All five are zero in shipped source, and the only occurrences anywhere are
 * COMMENTS in `useAsyncOptions`, including the example showing a CONSUMER
 * calling `fetch` inside the loader. That is the shape: the hook calls a
 * function it was handed, and a test hands it an array.
 *
 * One honest limit: `Request` in a TYPE position is silent, measured — a type
 * annotation is not routed through the global scope's references. Listing it
 * guards the constructor and nothing else.
 */
const NETWORK_GLOBALS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'Request'
];

/*
 * THE WINDOW UNDER THE NAMES THAT DO NOT CONTAIN "window".
 *
 * `no-restricted-globals` matches an UNSHADOWED identifier and nothing more,
 * so banning `window` and `matchMedia` left four aliases and `globalThis` wide
 * open. Measured against the config as it stood: a shipped file holding
 * `globalThis.document`, `self.matchMedia`, `top`, `parent`, `frames` and
 * `globalThis.localStorage.setItem` produced ZERO errors.
 *
 * `self`, `top` and `parent` are plausible local names, and that costs nothing
 * — shadowing is precisely what this rule ignores. Measured: the
 * `const parent = useContext(...)` in `ConfigProvider` is silent, a `top:` key
 * in a style object is silent, and `bb:self-stretch` is a string.
 */
const WINDOW_ALIASES = ['globalThis', 'self', 'top', 'parent', 'frames'];

export const restrictedGlobals = [
  {
    name: 'document',
    message:
      'The library never touches the document (P3). A portal container is received, never assumed (doc 08 §8).'
  },
  {
    name: 'window',
    message:
      'The library never reads the window (P3, P4). What it needs — mode, locale, time zone, container width — is received or measured through the shared hook.'
  },
  /*
   * ADDED 2026-09-10, and the rule got stricter rather than looser.
   *
   * `matchMedia` was reachable without writing `window`, so a component could
   * query the viewport and pass this rule while doing the thing the rule is
   * about. Naming it closes that, and doc 04 §5's one legitimate exception — a
   * component rendered in a PORTAL, whose real container is the window — gets
   * a single door instead of a hole: `src/internal/useWindowFits.ts`, allowed
   * by name in the config, with the whole argument in the file.
   *
   * `DateRangePicker` is why it exists, and it is not a preference: a range
   * calendar inside a popover has to build one month or two, and the count is
   * a PROP of the base's state rather than a paint. Inline-size containment
   * computes an element's width as though it had no contents, so the container
   * query the inline calendar uses collapses inside a content-sized layer
   * (§4.3). CSS cannot answer it and the container cannot either.
   */
  {
    name: 'matchMedia',
    message:
      'A viewport query belongs only to a component rendered in a portal (doc 04 §5), and it goes through `internal/useWindowFits` — the one place allowed to ask, with the reason written in it.'
  },
  {
    name: 'localStorage',
    message:
      'The library persists nothing (P3). State enters through props or the config provider.'
  },
  {
    name: 'sessionStorage',
    message:
      'The library persists nothing (P3). State enters through props or the config provider.'
  },
  {
    name: 'navigator',
    message:
      'The library does not detect the environment (P3). Locale, direction and pointer capability are received or queried in CSS.'
  },
  {
    name: 'location',
    message: 'The library knows no URLs (P2).'
  },
  ...NETWORK_GLOBALS.map(name => ({ name, message: msg.network })),
  ...WINDOW_ALIASES.map(name => ({ name, message: msg.alias }))
];

export const restrictedImports = {
  patterns: [
    {
      // Reaching past a component index, in its two relative forms.
      //
      // Deliberately NOT written with a capital-letter character class.
      // Minimatch is case-insensitive on Windows, so such a pattern also
      // caught "../internal/isDev" here and would not have caught it on
      // Linux. A lint rule that behaves differently per operating system is
      // worse than no rule: it passes locally and fails in CI, or the
      // reverse. The shared directories are exempted by name instead, which
      // is unambiguous everywhere.
      //
      // Line comments on purpose: a glob containing a star followed by a
      // slash closes a block comment early, which is exactly how this file
      // was broken a moment ago.
      // Reaching past a component index, in its relative forms.
      //
      // Arrived at empirically, against a probe file, because minimatch
      // does not behave the way the patterns read:
      //
      //   - a star matches the literal ".." segment, so a three-part
      //     pattern also catches every "../../something" path
      //   - matching is case-insensitive on Windows, so a capital-letter
      //     character class caught lowercase directories here and would
      //     not have on Linux. A rule that differs per operating system is
      //     worse than no rule: it passes locally and fails in CI
      //
      // Verified in both directions: three real violations caught, zero
      // false positives across the package.
      //
      // Line comments on purpose — a glob with a star before a slash closes
      // a block comment early, which broke this file once already.
      group: [
        '../*/*',
        '!../internal/**',
        '!../config/**',
        '!../../**',
        '../../components/*/*',
        '../../internal/*/*'
      ],
      message:
        "No importing another component's internal path (doc 01). Import from its index, or move the shared piece to src/internal."
    },
    {
      // `@internationalized/date` is NOT in this group any more, and the
      // change is deliberate rather than a leak.
      //
      // It was a transitive dependency when this rule was written, so
      // importing it WAS reaching past a public entry point. It is a declared
      // dependency now, pinned to the version the base resolves and moving
      // with it — the same arrangement react-aria itself has (decision 0013),
      // and for the same kind of reason: decision 0020 puts dates across the
      // public boundary as ISO strings, and something has to parse them.
      //
      // The rest of the group stands. `@internationalized/number` and the
      // `@react-aria/*` and `@react-stately/*` packages are still internals
      // of the base, and nothing here declares them.
      group: [
        '@react-aria/*',
        '@react-stately/*',
        '@internationalized/message',
        '@internationalized/number',
        '@internationalized/string'
      ],
      message:
        'Import from react-aria-components, not from its internals. Reaching past the public entry point is how a minor upgrade becomes a breaking one.'
    },
    {
      // A STYLESHEET HAS ONE DOOR, and this rule exists because it had two.
      //
      // `docs/contributing/new-component.md` §0 says a component's CSS file
      // "is also imported by hand in src/styles/index.css, one line per
      // component, so the list stays visible". That list is what the Tailwind
      // CLI compiles into `dist/styles.css`, and it is the only thing it
      // reads: `@source` scans .ts and .tsx for class NAMES and follows no
      // import.
      //
      // A JavaScript `import './X.css'` is a second door. Vite's library
      // build accepts it, extracts the rules into a separate file next to the
      // bundle, and strips the import from `index.js` — so the rules exist,
      // in a file the package's `exports` map does not name and nothing
      // imports. Measured before this rule landed: three components had gone
      // through that door, and `dist/styles.css` shipped with zero
      // occurrences of `bb-button-group`, zero of `bb-checkerboard` and none
      // of the `bb-step` rules. Four components would have been published
      // unstyled — ButtonGroup, Steps, ColorPicker and ColorSwatchField.
      //
      // No consumer ever received it, and that is luck rather than a guard:
      // the rewrite has not been released, so npm still holds `0.1.1` and the
      // old codebase. It would have gone out with the first release of this
      // one.
      //
      // Nothing here could have caught it, and the catalog is why: it
      // loads the BUILT stylesheet for the tokens but renders components from
      // source, so Storybook's own Vite processed those three imports and
      // injected them. Every baseline, every axe check and every browser
      // check looked at a page that was styled correctly. That is the
      // measurement behind doc 10 §3's Package row, and behind this rule.
      //
      // Verified in both directions: three real violations caught with the
      // imports in place, zero once they moved to index.css.
      group: ['**/*.css'],
      message:
        'No importing a stylesheet from TypeScript. Add one @import line to src/styles/index.css instead — that file is the only thing the CSS build reads, and a JS import produces rules that are compiled, published and unreachable (new-component.md §0).'
    }
  ]
};
