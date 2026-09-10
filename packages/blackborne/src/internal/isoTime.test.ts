/*
 * The boundary a time crosses, tested with nothing rendered — P6, and the one
 * decision in here that is not a pass-through.
 */
import { Time } from '@internationalized/date';
import { expect, test, vi } from 'vitest';
import { clockSteps, formatClock, parseClock } from './isoTime';

test('a time is read from the twenty-four hour clock', () => {
  expect(parseClock('14:30')?.hour).toBe(14);
  expect(parseClock('14:30')?.minute).toBe(30);
  expect(parseClock('09:05:30')?.second).toBe(30);
});

test('nothing is nothing, and a malformed time says so', () => {
  expect(parseClock(undefined)).toBeUndefined();
  expect(parseClock(null)).toBeUndefined();
  expect(parseClock('')).toBeUndefined();

  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  expect(parseClock('half past two')).toBeUndefined();
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('half past two'));
  warn.mockRestore();
});

test('the seconds are trimmed when there are none', () => {
  /*
   * THE ONE DECISION IN THIS FILE. `toString()` on a `Time` always writes
   * `14:30:00`, so a field asked for hours and minutes would report three
   * fields' worth of precision it never offered — and a consumer comparing
   * what they passed in against what came back would find two different
   * strings for the same time.
   */
  expect(formatClock(new Time(14, 30))).toBe('14:30');
  expect(formatClock(new Time(9, 5))).toBe('09:05');
  expect(formatClock(new Time(14, 30, 15))).toBe('14:30:15');
});

test('a round trip keeps the string it was given', () => {
  for (const iso of ['00:00', '09:05', '14:30', '23:59', '14:30:15'])
    expect(formatClock(parseClock(iso))).toBe(iso);
});

test('nothing formats to null', () => {
  expect(formatClock(undefined)).toBeNull();
  expect(formatClock(null)).toBeNull();
});

test('a step of fifteen minutes is ninety-six rows', () => {
  const found = clockSteps({ stepMinutes: 15 });

  /*
   * THE NUMBER THAT MAKES THE COMPONENT POSSIBLE. Every reachable value is a
   * row, which is what §7 of the catalog asked of the list-shaped picker — and
   * at this step there are few enough rows for that to be a list rather than a
   * document.
   */
  expect(found).toHaveLength(96);
  expect(formatClock(found[0]!)).toBe('00:00');
  expect(formatClock(found[1]!)).toBe('00:15');
  expect(formatClock(found.at(-1)!)).toBe('23:45');
});

test('both bounds are included', () => {
  const found = clockSteps({
    stepMinutes: 30,
    from: new Time(9),
    to: new Time(11)
  });

  expect(found.map(one => formatClock(one))).toEqual([
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00'
  ]);
});

test('a step that overshoots the end simply stops', () => {
  const found = clockSteps({
    stepMinutes: 45,
    from: new Time(9),
    to: new Time(10)
  });

  /*
   * 09:00 and 09:45, and not 10:30. The bound is a ceiling rather than a
   * target, so an end that is not on the step is not reachable — which is the
   * honest answer: a picker cannot offer a value its own step forbids.
   */
  expect(found.map(one => formatClock(one))).toEqual(['09:00', '09:45']);
});

test('it never runs past midnight, whatever the step', () => {
  /*
   * `Time` arithmetic WRAPS — 23:45 plus 30 minutes is 00:15, which is earlier
   * than where it started. A loop built on `Time` and bounded by a comparison
   * would never end. This counts minutes instead, so the bound is a number.
   */
  const found = clockSteps({ stepMinutes: 30, from: new Time(23) });

  expect(found.map(one => formatClock(one))).toEqual(['23:00', '23:30']);
});

test('a step below a minute is clamped rather than refused', () => {
  expect(
    clockSteps({ stepMinutes: 0, from: new Time(9), to: new Time(9, 3) }).map(
      one => formatClock(one)
    )
  ).toEqual(['09:00', '09:01', '09:02', '09:03']);
});

test('a single reachable value is a list of one', () => {
  const found = clockSteps({
    stepMinutes: 60,
    from: new Time(9),
    to: new Time(9, 30)
  });

  expect(found.map(one => formatClock(one))).toEqual(['09:00']);
});
