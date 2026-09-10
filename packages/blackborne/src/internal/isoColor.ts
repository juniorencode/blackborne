import { parseColor, type Color } from 'react-aria-components';
import { isDev } from './isDev';

/*
 * INTERNAL. The boundary between a colour this library publishes and a colour
 * the base understands — `isoDate` and `isoTime`'s third sibling, and separate
 * from them because the answer is genuinely different:
 * [decision 0024](../../../../docs/decisions/0024-a-colour-crosses-as-a-string-and-the-format-is-declared.md)
 * settles that a colour crosses as a string AND that its format is declared
 * rather than guessed, because a colour has more than one correct way to write
 * one value and a date has one.
 *
 * `parseColor` is re-exported by `react-aria-components`, so nothing here
 * reaches past a public entry point and no dependency is added.
 *
 * The formatting half arrived with the full picker, which is the component that
 * needs it: a closed palette reports the string it was GIVEN, so it needs a
 * comparison, and a value dragged out of a two-dimensional area was never one
 * of the inputs.
 */

/**
 * A colour, or nothing.
 *
 * `undefined` for a string that is not one, because a component that throws
 * over a malformed prop takes a screen down for a developer's typo. It says so
 * in development and renders as though nothing had been given — the same
 * contract `parseDay` and `parseClock` have, and deliberately the same words.
 *
 * The base's own `parseColor` throws: measured, `Error: Invalid color value:
 * nope`.
 */
export function parseSwatch(
  value: string | null | undefined
): Color | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  try {
    return parseColor(value);
  } catch {
    if (isDev())
      /*
       * WORDED WITHOUT AN EXAMPLE, and that is the project's own rule against
       * literal colours doing its job rather than getting in the way: its
       * pattern matches a hex string and the opening bracket of `rgb` or
       * `hsl`, so a message that spelled out three examples would trip it
       * three times. Naming the notations reads as well and needs no
       * exemption.
       */
      console.warn(
        `blackborne: "${value}" is not a colour this library can read. A ` +
          'colour is written as a hex string, or in the CSS rgb or hsl ' +
          'notation — decision 0024. The field renders empty.'
      );
    return undefined;
  }
}

/*
 * NOTHING CHOSEN, AS A COLOUR, because the base's controlled prop cannot say
 * it: `value?: string | Color`, and passing `undefined` makes the picker
 * UNCONTROLLED — a different component with a different bug. Fully transparent
 * is what the base itself uses for the same purpose, read in its source:
 * `props.color || '#0000'` in its swatch item and `value || '#fff0'` in
 * `useColorSwatch`.
 *
 * The project's rule against literal colours is right, and this is the one
 * exception in the library: it is not a colour anything is painted with, it is
 * the ABSENCE of one crossing an API that has no way to express absence. One
 * line, one place, with the reason attached — rather than a relaxation of the
 * rule, which would also excuse the next real violation.
 */
// eslint-disable-next-line no-restricted-syntax -- see the note above
export const NO_COLOUR = parseColor('rgba(0, 0, 0, 0)');

/**
 * The one form two ways of writing the same colour agree on.
 *
 * `hexa` and not `hex`: eight digits carry the alpha, and `hex` drops it
 * silently — measured, `#3e63dd80` comes back `#3E63DD`. So a comparison in
 * `hex` would call a half-transparent blue equal to an opaque one.
 *
 * It is also **the base's own key** for a swatch in a picker, read in its
 * source: `ColorSwatchPickerItem` sets `id: color.toString('hexa')`. Using the
 * same expression is what lets a chosen colour be matched back to the exact
 * string a consumer declared, which is decision 0024's exception and the
 * reason a palette needs no format at all.
 */
export function sameColour(one: Color, other: Color): boolean {
  return one.toString('hexa') === other.toString('hexa');
}

/**
 * The formats a colour may be reported in. A closed set (doc 02 §3).
 *
 * Six and not the base's full list: `hsb` is left out because nothing outside
 * a colour picker's own internals speaks it, and a value nobody can paste into
 * CSS is not a value a project wants stored.
 */
export type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

/**
 * Whether a format would throw the alpha away.
 *
 * Measured, and it is decision 0024's fourth finding: `#3e63dd80` reported as
 * `hex` comes back `#3E63DD`, with no error anywhere. So a picker that offers
 * transparency and a format that cannot carry it is a misconfiguration worth
 * saying out loud rather than a shape to forbid — a project may legitimately
 * want the opaque value.
 */
export function losesAlpha(color: Color, format: ColorFormat): boolean {
  const opaque = format === 'hex' || format === 'rgb' || format === 'hsl';
  return opaque && color.getChannelValue('alpha') < 1;
}

/**
 * A colour, as the string it crosses back as.
 *
 * Straight through to the base's own serialiser, which is the point: what this
 * function adds is that the format is a DECLARED one rather than
 * `toString()`'s default — measured, that default turns `#3e63dd` into
 * `rgba(62, 99, 221, 1)`, and after a drag in a saturation-and-brightness area
 * the colour's space is `hsb`, so the default would report `hsb(...)` to a
 * project that only ever wanted hex.
 */
export function formatColour(color: Color, format: ColorFormat): string {
  return color.toString(format);
}
