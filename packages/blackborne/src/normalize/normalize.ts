/*
 * Normalization: what a field silently REWRITES as you type.
 *
 * Doc 07 §2 names three things that get confused with each other. This is the
 * middle one — restriction refuses a keystroke, normalization accepts it and
 * changes it, validation judges the result and belongs to the project.
 *
 * ## Why these are functions and not props on a field
 *
 * The ORDER is the whole thing. `upperCase` then `foldAccents` is not the same
 * as `foldAccents` then `upperCase`, and a set of booleans has no order: either
 * the component fixes one, and the consumer cannot change the thing they most
 * need to, or it exposes one and they were never booleans (doc 07 §2.1).
 *
 * Composed, the order is the thing you read.
 *
 * ## What the library is actually contributing
 *
 * Not these functions. They are a few lines each and anybody could write them
 * in their own `onChange`.
 *
 * What is hard, and what the field does with the result, is that rewriting a
 * value while somebody types MOVES THE CARET: force upper case and the cursor
 * jumps to the end mid-word. That is doc 09 §7 — nothing moves under the
 * cursor — happening on every keystroke, and it is the reason the field takes
 * a `normalize` prop rather than leaving this to the consumer.
 */

/**
 * A transformation from one value to another. Total, synchronous and pure:
 * given the same input it returns the same output and touches nothing else.
 */
export type Normalizer = (value: string) => string;

/**
 * Compose transformations, applied left to right.
 *
 * ```ts
 * const plate = normalize(foldAccents, upperCase, allowOnly(/[A-Z0-9]/));
 * ```
 *
 * Read as a sentence in the order it happens, which is the point: the same
 * three steps in another order produce another value.
 *
 * With no arguments it returns the value unchanged, so a conditional pipeline
 * does not need a special case at the call site.
 */
export function normalize(...steps: Normalizer[]): Normalizer {
  return value => steps.reduce((current, step) => step(current), value);
}

/** Lower case, in the invariant locale. */
export const lowerCase: Normalizer = value => value.toLowerCase();

/**
 * Upper case, in the invariant locale.
 *
 * Deliberately NOT `toLocaleUpperCase`. A locale-aware upper case is right for
 * text a person reads and wrong for the values this is used on — codes,
 * usernames, registration plates — where the same input must produce the same
 * output whoever is typing it. In Turkish, `i` upper-cases to `İ`, so a
 * locale-aware version would store a different code depending on the browser's
 * language, and the record would not match itself.
 */
export const upperCase: Normalizer = value => value.toUpperCase();

/**
 * Remove every whitespace character, anywhere in the value.
 *
 * For codes and identifiers, where a space is always an accident — pasted from
 * a spreadsheet, or typed while reading a number aloud in groups.
 */
export const stripSpaces: Normalizer = value => value.replace(/\s+/gu, '');

/** Remove leading and trailing whitespace, keeping what is inside. */
export const trimEdges: Normalizer = value => value.replace(/^\s+|\s+$/gu, '');

/**
 * Fold accents away: `José` becomes `Jose`, `Müller` becomes `Muller`.
 *
 * **Do not use this on a name.** Somebody's name is spelled the way they spell
 * it, and a field that quietly corrects it is a defect however convenient the
 * search index finds it. It exists for the values where the accent is noise:
 * codes, plates, slugs.
 *
 * The limit worth knowing: it decomposes and drops combining marks, which
 * covers the accented Latin letters. Characters that are not a base letter
 * plus a mark — `ß`, `ø`, `đ` — have nothing to decompose and pass through
 * unchanged. Handling those means a substitution table per language, which is
 * a policy and belongs to the project.
 */
export const foldAccents: Normalizer = value =>
  value.normalize('NFD').replace(/\p{M}+/gu, '');

/**
 * Keep only the characters that match, dropping everything else.
 *
 * An allow list, and never a deny list of "dangerous characters". A deny list
 * is wrong in the direction that costs: everything nobody thought of is
 * permitted, and it has to be extended every time somebody finds a new one.
 * An allow list fails closed.
 *
 * It is also not a security measure and must not be treated as one. Whatever
 * consumes the value — a query, a template, a shell — escapes it there. This
 * keeps a field tidy; it does not make anything safe.
 *
 * ```ts
 * allowOnly(/[A-Z0-9-]/)
 * ```
 *
 * The pattern matches ONE character at a time. A global flag is not needed and
 * is ignored: the value is tested character by character, so a pattern with
 * `g` cannot carry `lastIndex` state between calls — which is the trap that
 * makes a shared regular expression return different answers on alternate
 * calls.
 */
export function allowOnly(pattern: RegExp): Normalizer {
  const test = new RegExp(pattern.source, pattern.flags.replace(/[gy]/gu, ''));
  return value => [...value].filter(character => test.test(character)).join('');
}

/**
 * Where the caret should go after `run` rewrote the value.
 *
 * The trick, and the reason this is not a table of special cases per
 * transformation: normalize the part of the ORIGINAL value that was before the
 * caret, and the length of that is the new position. It needs to know nothing
 * about what the transformation did — it works for dropping characters, for
 * case changes, and for anything else that treats the value left to right.
 *
 * The one shape it gets wrong is a transformation that depends on the END of
 * the value, `trimEdges` being the example: the prefix has no trailing space
 * to trim, so mid-word edits are correct and a caret sitting in trailing
 * whitespace lands one place early. That is the trade for having no table.
 */
export function caretAfter(
  value: string,
  caret: number,
  run: Normalizer
): number {
  return run(value.slice(0, caret)).length;
}
