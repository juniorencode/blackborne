import { Time, parseTime } from '@internationalized/date';
import { isDev } from './isDev';

/*
 * INTERNAL. The boundary between a time this library publishes and a time the
 * base understands — `isoDate`'s sibling, and separate from it for the reason
 * the two are separate at the boundary: decision 0020 settles a day as
 * `2026-09-09` and a time as `14:30`, and nothing in this library holds both
 * in one value yet.
 *
 * `14:30` and not `2:30 PM`, which is the whole point of the decision: the
 * value is the twenty-four hour clock whatever the locale displays. Whether
 * somebody SEES `2:30 PM` is `hourCycle`, and that comes from the locale
 * rather than from the value (doc 05 §3).
 */

/**
 * A time, or nothing.
 *
 * `undefined` for a string that is not one, because a component that throws
 * over a malformed prop takes a screen down for a developer's typo. It says so
 * in development and renders as though nothing had been given, which is the
 * state a consumer can see and fix — the same contract `parseDay` has, and
 * deliberately the same words in the warning.
 */
export function parseClock(iso: string | null | undefined): Time | undefined {
  if (iso === null || iso === undefined || iso === '') return undefined;

  try {
    return parseTime(iso);
  } catch {
    if (isDev())
      console.warn(
        `blackborne: "${iso}" is not a time this library can read. A time is ` +
          'written `14:30`, with seconds if there are any — decision 0020. ' +
          'The field renders empty.'
      );
    return undefined;
  }
}

/**
 * A time, as the string it crosses back as.
 *
 * **Trimmed to the minute when the seconds are zero**, which is a decision
 * rather than a formatting detail: `toString()` on a `Time` always writes
 * `14:30:00`, so a field asked for hours and minutes would report three
 * fields' worth of precision it never offered. A consumer comparing what they
 * passed in with what came back would find two different strings for the same
 * time.
 *
 * Seconds survive when there are any, because then they are part of the answer.
 */
export function formatClock(time: Time | null | undefined): string | null {
  if (time === null || time === undefined) return null;

  const hour = String(time.hour).padStart(2, '0');
  const minute = String(time.minute).padStart(2, '0');
  if (time.second === 0 && time.millisecond === 0) return `${hour}:${minute}`;

  const second = String(time.second).padStart(2, '0');
  return `${hour}:${minute}:${second}`;
}
