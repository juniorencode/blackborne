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

const PHYSICAL_CLASS =
  'Literal[value=/[: ](pl|pr|ml|mr|left|right|inset-l|inset-r)-/]';
const PHYSICAL_EDGE = 'Literal[value=/[: ](border|rounded)-[lr]([-: ]|$)/]';
const PHYSICAL_ALIGN = 'Literal[value=/[: ](text|float|clear)-(left|right)/]';
const PHYSICAL_STYLE =
  'Property[key.name=/^(left|right|marginLeft|marginRight|paddingLeft|paddingRight|borderLeft|borderRight|borderLeftWidth|borderRightWidth|borderLeftColor|borderRightColor|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius)$/]';

const VIEWPORT_CLASS = 'Literal[value=/[: ](sm|md|lg|xl|2xl):/]';
const VIEWPORT_MEDIA = 'Literal[value=/@media[^)]*(min-width|max-width)/]';

const LITERAL_LABEL =
  'JSXAttribute[name.name=/^(aria-label|aria-description|aria-placeholder|aria-roledescription|aria-valuetext|title|placeholder|alt)$/] > Literal';
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
  text: 'No literal user-facing strings, accessibility labels included. Take it from the dictionary or as a prop (doc 05 §2.2, rule 1). A label nobody sees is still text a person reads.'
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
  { selector: LITERAL_TEXT, message: msg.text }
];

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
  }
];

export const restrictedImports = {
  patterns: [
    {
      // Component folders are capitalised, which makes the pattern precise:
      // ../Card/Card reaches past Card's index, while ../../internal/cx is a
      // deliberately shared helper and must stay allowed.
      group: ['../[A-Z]*/*', '../../components/*/*'],
      message:
        "No importing another component's internal path (doc 01). Import from its index, or move the shared piece to src/internal."
    },
    {
      group: ['@react-aria/*', '@react-stately/*', '@internationalized/*'],
      message:
        'Import from react-aria-components, not from its internals. Reaching past the public entry point is how a minor upgrade becomes a breaking one.'
    }
  ]
};
