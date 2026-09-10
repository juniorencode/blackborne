/*
 * The boundary a colour crosses, tested with nothing rendered — and every one
 * of these is a line of decision 0024's own table, kept as a test so the
 * decision cannot quietly stop being true when the base is upgraded.
 */
import { parseColor } from 'react-aria-components';
import { expect, test, vi } from 'vitest';
import { parseSwatch, sameColour } from './isoColor';

test('a colour is read from any of the spellings', () => {
  expect(parseSwatch('#3e63dd')?.toString('hex')).toBe('#3E63DD');
  expect(parseSwatch('rgb(62, 99, 221)')?.toString('hex')).toBe('#3E63DD');
  expect(parseSwatch('hsl(226, 70%, 55%)')?.getColorSpace()).toBe('hsl');
});

test('nothing reads as nothing, without a warning', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  expect(parseSwatch(undefined)).toBeUndefined();
  expect(parseSwatch(null)).toBeUndefined();
  expect(parseSwatch('')).toBeUndefined();
  expect(warn).not.toHaveBeenCalled();

  warn.mockRestore();
});

test('and something that is not a colour warns rather than throwing', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  /*
   * The base's own `parseColor` THROWS — `Error: Invalid color value: nope` —
   * and a component that throws over a malformed prop takes a screen down for
   * a developer's typo. Same contract as `parseDay` and `parseClock`.
   */
  expect(() => parseColor('nope')).toThrow();
  expect(parseSwatch('nope')).toBeUndefined();
  expect(warn.mock.calls.join(' ')).toContain('is not a colour');

  warn.mockRestore();
});

test('two spellings of one colour are the same colour', () => {
  /*
   * The comparison is what lets a chosen swatch be matched back to the string
   * a consumer declared. `#3e63dd` and `rgb(62, 99, 221)` are one colour
   * written two ways, and a consumer holding either should see the same swatch
   * chosen.
   */
  expect(
    sameColour(parseColor('#3e63dd'), parseColor('rgb(62, 99, 221)'))
  ).toBe(true);
  expect(
    sameColour(parseColor('#3e63dd'), parseColor('rgba(62, 99, 221, 1)'))
  ).toBe(true);
});

test('and the alpha is part of which colour it is', () => {
  /*
   * WHY THE COMPARISON IS `hexa` AND NOT `hex`. Measured: `hex` drops the
   * alpha, so `#3e63dd80` comes back `#3E63DD` — which would make a
   * half-transparent blue equal to an opaque one, and a palette holding both
   * would light up the wrong swatch.
   */
  expect(parseColor('#3e63dd80').toString('hex')).toBe('#3E63DD');
  expect(sameColour(parseColor('#3e63dd80'), parseColor('#3e63dd'))).toBe(
    false
  );
});

test('a different colour is a different colour', () => {
  expect(sameColour(parseColor('#3e63dd'), parseColor('#e5484d'))).toBe(false);
});
