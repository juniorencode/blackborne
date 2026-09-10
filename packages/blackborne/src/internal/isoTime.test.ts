/*
 * The boundary a time crosses, tested with nothing rendered — P6, and the one
 * decision in here that is not a pass-through.
 */
import { Time } from '@internationalized/date';
import { expect, test, vi } from 'vitest';
import { formatClock, parseClock } from './isoTime';

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
