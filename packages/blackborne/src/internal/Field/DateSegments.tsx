import type { ReactElement } from 'react';
import { DateInput, DateSegment } from 'react-aria-components';
import { cx } from '../cx';
import { CONTROL_INSIDE, CONTROL_TEXT } from './controlBox';

/*
 * A DATE TYPED IN PIECES, and the row is shared by the two components that
 * hold one: a `DateField` and the field half of a `DatePicker`.
 *
 * Extracted at the second caller, which is this repository's rule — and here
 * both callers arrive in the same wave, so the alternative was two copies born
 * on the same afternoon.
 *
 * The pieces are the base's. What is worth knowing about them:
 *
 * - **A separator is a segment too.** `data-type="literal"` is the `/` or the
 *   `.` the locale puts between the numbers, and it is not focusable and takes
 *   no highlight. Styling every segment the same way puts a blue box round a
 *   slash.
 * - **The order and the separators come from the locale**, never from us. In
 *   `en-US` it is month, day, year; in `es-PE` day, month, year; in `ja-JP`
 *   year, month, day with a different mark between them. Doc 05 §3's front.
 */

/** The row of segments, filling the control the way an input does. */
const SEGMENTS = cx(
  'bb-date-segments',
  CONTROL_INSIDE,
  CONTROL_TEXT,
  'bb:flex bb:items-center bb:whitespace-nowrap',
  /*
   * No `outline-hidden` here and no ring either: the FRAME shows that the
   * field has focus, and the segment inside it shows where typing goes. Two
   * rings for one focus is doc 06 §3.1's noise.
   */
  'bb:outline-hidden'
);

/*
 * ONE SEGMENT.
 *
 * The focused one takes the accent PAIR — a fill plus the text colour declared
 * with it (doc 03 §4.0) — because it is where the next keystroke lands, and
 * that is not a thing to hint at. It is the only place in this library where a
 * fragment of a value is filled, and the reason is that a caret cannot do the
 * job: the segments are not editable text, so there is nothing for a caret to
 * sit in.
 *
 * `tabular-nums` so the digits are one width, and `text-center` so a
 * single-digit day sits where the two-digit one would rather than sliding
 * left.
 */
const SEGMENT = cx(
  'bb-date-segment',
  'bb:box-border bb:rounded-sm bb:px-(--bb-space-0-5)',
  'bb:text-center bb:tabular-nums bb:outline-hidden',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-focused:bg-accent bb:data-focused:text-(color:--bb-accent-on)',
  /*
   * The placeholder — `dd`, `mm`, `yyyy` — in the same muted colour every
   * other field's placeholder uses (doc 03 §4.7), so an empty date field reads
   * as empty rather than as filled with letters.
   */
  'bb:data-placeholder:text-text-muted',
  'bb:data-placeholder:data-focused:text-(color:--bb-accent-on)',
  'bb:data-disabled:text-text-disabled',
  /*
   * A literal is punctuation. No padding, no radius, no highlight, and it
   * never has focus — the base does not give it any.
   */
  'bb:data-[type=literal]:px-0 bb:data-[type=literal]:text-text-muted'
);

/**
 * The row of segments a date is typed into.
 *
 * Works inside a `DateField` and inside a `DatePicker` without being told
 * which: the base publishes the field's props through a context and
 * `DateInput` reads it either way.
 */
export const DateSegments = (): ReactElement => (
  <DateInput className={SEGMENTS}>
    {segment => <DateSegment segment={segment} className={SEGMENT} />}
  </DateInput>
);
