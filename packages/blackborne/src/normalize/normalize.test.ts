/*
 * These render nothing, which is the point.
 *
 * "Its logic lives in hooks or pure functions, with their own tests that render
 * nothing" is a box on the entry gate (doc 01 §5) and the one most often ticked
 * on faith. Normalization is the first piece of the library where the whole
 * capability is reachable this way.
 */
import { describe, expect, it } from 'vitest';
import {
  allowOnly,
  caretAfter,
  foldAccents,
  lowerCase,
  normalize,
  stripSpaces,
  trimEdges,
  upperCase
} from './normalize';

describe('the transformations', () => {
  it('folds accented Latin letters to their base', () => {
    expect(foldAccents('José Muñoz')).toBe('Jose Munoz');
    expect(foldAccents('Ångström')).toBe('Angstrom');
  });

  it('leaves alone what has no accent to remove', () => {
    // Not a base letter plus a mark, so there is nothing to decompose. The
    // doc comment says so; this is what makes that promise checkable.
    expect(foldAccents('Straße')).toBe('Straße');
    expect(foldAccents('Ørsted')).toBe('Ørsted');
  });

  it('upper cases the same way whoever is typing', () => {
    // Turkish is the case that breaks toLocaleUpperCase: there, `i` becomes
    // `İ`, and the same code typed on two machines would not match itself.
    expect(upperCase('istanbul')).toBe('ISTANBUL');
    expect(lowerCase('ISTANBUL')).toBe('istanbul');
  });

  it('strips every space, and trims only the edges', () => {
    expect(stripSpaces('  AB 12  CD ')).toBe('AB12CD');
    expect(trimEdges('  AB 12  CD ')).toBe('AB 12  CD');
    expect(stripSpaces('A\tB\nC')).toBe('ABC');
  });

  it('keeps only what the pattern allows', () => {
    expect(allowOnly(/[A-Z0-9]/)('AB-12/cd')).toBe('AB12');
    expect(allowOnly(/[a-z0-9-]/)('Hello, World-2')).toBe('elloorld-2');
  });

  it('does not carry regex state between calls', () => {
    /*
     * A global regular expression keeps `lastIndex` between calls to `test`,
     * so a shared one returns different answers on alternate characters. The
     * flag is stripped rather than trusted, and this is the check that says
     * so — it fails on every second character if the stripping is removed.
     */
    const digits = allowOnly(/[0-9]/g);
    expect(digits('12345')).toBe('12345');
    expect(digits('12345')).toBe('12345');
  });
});

describe('composition', () => {
  it('applies the steps left to right', () => {
    const run = normalize(foldAccents, upperCase, allowOnly(/[A-Z0-9]/));
    expect(run('  cód-123 ')).toBe('COD123');
  });

  it('is not the same in another order, which is why it composes', () => {
    /*
     * The argument doc 07 §2.1 makes, as a test. Allowing only A-Z BEFORE
     * upper casing throws away every lower-case letter; after, it keeps them.
     * A set of booleans cannot express the difference at all.
     */
    const foldThenAllow = normalize(upperCase, allowOnly(/[A-Z]/));
    const allowThenFold = normalize(allowOnly(/[A-Z]/), upperCase);
    expect(foldThenAllow('abcDEF')).toBe('ABCDEF');
    expect(allowThenFold('abcDEF')).toBe('DEF');
  });

  it('with no steps, changes nothing', () => {
    expect(normalize()('  José  ')).toBe('  José  ');
  });
});

describe('caretAfter', () => {
  const code = normalize(stripSpaces, upperCase);

  it('keeps the caret in the same place when nothing is removed before it', () => {
    // "ab|cd" -> "AB|CD": case changes one for one, so the position holds.
    expect(caretAfter('abcd', 2, code)).toBe(2);
  });

  it('moves the caret back by what was removed before it', () => {
    // "a b |c d" has two spaces before the caret, both dropped.
    expect(caretAfter('a b c d', 4, code)).toBe(2);
  });

  it('is unaffected by what happens after the caret', () => {
    const before = caretAfter('ab   ', 2, code);
    const after = caretAfter('ab    cdef', 2, code);
    expect(before).toBe(after);
  });

  it('lands one place early inside trailing whitespace, as documented', () => {
    /*
     * The one shape the prefix trick gets wrong, asserted rather than left as
     * a claim in a comment: the prefix "ab " has no TRAILING space from the
     * whole value's point of view, so trimEdges removes it and the caret
     * lands at 2 rather than 3.
     *
     * Written down as a test because the alternative is a table of special
     * cases per transformation, and this is the price of not having one.
     */
    expect(caretAfter('ab  ', 3, trimEdges)).toBe(2);
  });
});
