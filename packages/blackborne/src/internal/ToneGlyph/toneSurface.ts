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
/**
 * INTERNAL. The tone's SOLID, paired with what is drawn on it.
 *
 * The foreground it pairs with is `--bb-tone-mark`, declared once in
 * `semantic.css` rather than named per tone here — and that is a deliberate
 * step around doc 03 §4.0's pairing, with the measurement in the token's own
 * note. The short version: `--bb-X-on` is chosen so TEXT clears 4.5:1, which
 * for amber forces a dark brown, and a badge following it came out as three
 * white glyphs and one brown one. A mark in a badge is a graphical element
 * held to 3:1, and all four clear it.
 *
 * One reader today, `Toast`'s badge. It lives here rather than there because
 * it is the same decision as `TONE_SURFACE`, and splitting a pairing rule
 * across two files is how a pair stops being one.
 */
export const TONE_SOLID: Record<Tone, string> = {
  /*
   * The border colour, for the one tone with no solid of its own: neutral is
   * the absence of a state, so it takes the grey every other edge in the
   * library is drawn in rather than a fifth family invented for it.
   */
  neutral: 'bb:text-border-strong',
  info: 'bb:text-info',
  success: 'bb:text-success',
  warning: 'bb:text-warning',
  danger: 'bb:text-danger'
} satisfies Record<Tone, string>;

export const TONE_SURFACE: Record<Tone, string> = {
  neutral: 'bb:bg-surface-sunken bb:text-text',
  info: 'bb:bg-info-subtle bb:text-info-subtle-on',
  success: 'bb:bg-success-subtle bb:text-success-subtle-on',
  warning: 'bb:bg-warning-subtle bb:text-warning-subtle-on',
  danger: 'bb:bg-danger-subtle bb:text-danger-subtle-on'
} satisfies Record<Tone, string>;
