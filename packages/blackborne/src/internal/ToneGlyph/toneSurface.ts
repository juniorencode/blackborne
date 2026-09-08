import type { Tone } from './ToneGlyph';

/*
 * INTERNAL. The surface a tone is shown on: a background and the text colour
 * that goes on it, as ONE entry.
 *
 * One entry rather than two is doc 03 §4.0's pairing rule, and it is the whole
 * reason this is a map of strings rather than a pair of maps: a background and
 * its text colour are taken together, never from different families. That is
 * what keeps contrast correct when the brand theme is a light colour, with
 * nobody having to remember.
 *
 * WHY IT IS SHARED. It was `Alert`'s, and `Toast` needs the same four: a notice
 * says the same kinds of thing an alert says, in a different place. Two copies
 * of the pairing would be two chances to take a background from one family and
 * a foreground from another, which is exactly the mistake the rule exists to
 * prevent — and it would be invisible until somebody changed the brand.
 *
 * It sits beside `ToneGlyph` because they are two halves of one decision. Doc
 * 06 §3 forbids colour as the only channel, so a tone is carried by a
 * silhouette AND a surface; a component that took one without the other would
 * be relying on exactly the channel that rule rules out.
 */
export const TONE_SURFACE: Record<Tone, string> = {
  info: 'bb:bg-info-subtle bb:text-info-subtle-on',
  success: 'bb:bg-success-subtle bb:text-success-subtle-on',
  warning: 'bb:bg-warning-subtle bb:text-warning-subtle-on',
  danger: 'bb:bg-danger-subtle bb:text-danger-subtle-on'
} satisfies Record<Tone, string>;
