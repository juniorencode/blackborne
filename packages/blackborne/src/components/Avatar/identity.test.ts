/*
 * The one piece of an avatar that is logic rather than paint, and hard rule 7
 * is why it has a file of its own: a pure function is tested without rendering
 * anything.
 *
 * What is worth asserting here is a PROPERTY rather than a value. The specific
 * index "Ana Vega" lands on is an implementation detail of djb2 and changing
 * the hash would be allowed to move it; that the same name always lands on the
 * same one is the whole reason the function exists, and breaking it would be
 * invisible in every screenshot this catalog takes — six colours that shuffle
 * still photograph as six colours.
 */
import { describe, expect, it } from 'vitest';
import { IDENTITY_COLOURS, identityIndex } from './identity';

describe('identityIndex', () => {
  it('gives the same name the same colour, every time', () => {
    const name = 'Ana Vega';
    const first = identityIndex(name);

    for (let again = 0; again < 5; again++) {
      expect(identityIndex(name)).toBe(first);
    }
  });

  it('stays inside the palette', () => {
    const names = [
      'Ana Vega',
      'Bruno Paredes',
      'Carla Ruiz',
      'Diego Salas',
      'Elena Moro',
      'Farid Nazzal',
      '一郎',
      'Ω',
      '7'
    ];

    for (const name of names) {
      const at = identityIndex(name);
      expect(Number.isInteger(at)).toBe(true);
      expect(at).toBeGreaterThanOrEqual(0);
      expect(at).toBeLessThan(IDENTITY_COLOURS);
    }
  });

  /*
   * THE ASSERTION THE OTHERS CANNOT MAKE. A function returning 0 for
   * everything passes both tests above — it is perfectly stable and perfectly
   * in range — and would paint an entire directory one colour. This is the
   * only check that would go red for it.
   *
   * Forty names rather than six: six is enough for a run of bad luck to leave
   * a colour unused and turn a real property into a flaky assertion, and the
   * input is fixed rather than generated, so this is a fact about these names
   * and this hash rather than a die roll.
   */
  it('spreads names across all six', () => {
    const names = Array.from({ length: 40 }, (_, at) => `Person ${String(at)}`);
    const used = new Set(names.map(identityIndex));

    expect(used.size).toBe(IDENTITY_COLOURS);
  });

  it('reads one person out of two spellings', () => {
    const canonical = identityIndex('Carlos Ramos');

    expect(identityIndex('carlos ramos')).toBe(canonical);
    expect(identityIndex('CARLOS RAMOS')).toBe(canonical);
    expect(identityIndex('  Carlos Ramos  ')).toBe(canonical);
    expect(identityIndex('\tCarlos Ramos\n')).toBe(canonical);
  });

  /*
   * AND THERE IS NO TEST THAT ACCENTS ARE NOT STRIPPED, which was written and
   * then deleted rather than made to pass.
   *
   * The function deliberately does not fold José onto Jose — doc 05 is clear
   * that they are different strings and this library does not decide they are
   * the same person — and the obvious assertion is that the two get different
   * colours. Measured: they both get **4**. Six buckets means any two names
   * collide one time in six, so that assertion was never about the
   * normalisation; the only way to make it green is to hunt for a pair that
   * happens not to collide, which asserts the coincidence rather than the
   * rule. The distinction exists in the hash's INPUT and is not observable in
   * its output, so it stays documented where it is decided.
   */

  it('answers for an empty name rather than throwing', () => {
    expect(identityIndex('')).toBe(identityIndex('   '));
    expect(identityIndex('')).toBeLessThan(IDENTITY_COLOURS);
  });
});
