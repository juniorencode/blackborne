import { CalendarDate, parseDate } from '@internationalized/date';
import { isDev } from './isDev';

/*
 * INTERNAL. The boundary between a date this library publishes and a date the
 * base understands.
 *
 * Decision 0020
 * settled the shape: a day crosses as `2026-09-09` and is parsed here, so the
 * base's calendar objects live between this file and the render and never
 * appear in a consumer's signature. This is the file that makes that true, and
 * it exists at the first caller rather than the fourth for the reason
 * `readDeclarations` gives: a parse has ONE correct behaviour, and the risk of
 * two copies is not that the abstraction misfits but that a fix lands in one
 * of them.
 *
 * Four components are coming that need it — a calendar, a range calendar, a
 * date field and a picker — and every one of them has to agree about what a
 * malformed string does.
 */

/**
 * A day, or nothing.
 *
 * `undefined` for a string that is not one, because a component that throws
 * over a malformed prop takes a screen down for a developer's typo. It says so
 * in development instead and renders as though nothing had been given, which
 * is the state a consumer can see and fix.
 */
export function parseDay(
  iso: string | null | undefined
): CalendarDate | undefined {
  if (iso === null || iso === undefined || iso === '') return undefined;

  try {
    return parseDate(iso);
  } catch {
    if (isDev())
      console.warn(
        `blackborne: "${iso}" is not a date this library can read. A day is ` +
          'written `2026-09-09` — decision 0020. The field renders empty.'
      );
    return undefined;
  }
}

/**
 * A day, as the string it crosses back as.
 *
 * `toString()` on a `CalendarDate` is already ISO 8601, and it is wrapped here
 * so that every component reports a date through one function rather than four
 * calls that could each drift.
 */
export function formatDay(
  date: CalendarDate | null | undefined
): string | null {
  return date === null || date === undefined ? null : date.toString();
}

/**
 * Whether two days are the same day, in the same calendar system.
 *
 * `compare` rather than comparing the strings, because a Buddhist year and a
 * Gregorian one can name the same day with different numbers — and this
 * library claims to support the calendars the platform does.
 */
export function isSameDay(
  one: CalendarDate | undefined,
  other: CalendarDate | undefined
): boolean {
  return one !== undefined && other !== undefined && one.compare(other) === 0;
}
