/*
 * INTERNAL. How long a layer that opens on HOVER waits, in milliseconds.
 *
 * Doc 09 §3.1 fixes both numbers for the whole library, and they are constants
 * rather than props on purpose: per-layer delays are the knob that makes two
 * screens in the same application feel like two applications, and there is no
 * screen where 600ms is right and 650ms is wrong.
 *
 * They are JavaScript and not tokens because they are passed to the base as
 * numbers, never expressed in CSS. A token nothing can read would be a public
 * name with no meaning.
 *
 * WHY 600 AND NOT THE BASE'S 1500. The base ships 1500ms to open and 500ms to
 * close, tuned for a different kind of product. In a management application
 * somebody is scanning a dense toolbar, and a second and a half is long enough
 * that they have concluded there is no tooltip and moved on. 600ms is past the
 * accidental crossing and inside the deliberate pause.
 *
 * WHY THE CLOSING NUMBER IS THE SMALLER ONE, and why it matters more. Moving
 * between two adjacent buttons must not leave the first panel hanging over the
 * second. And a long opening delay is survivable in a way a long closing one is
 * not, because the base keeps a global warmup timer: once ANY hover layer has
 * opened, moving to a neighbour opens immediately. The opening delay is paid
 * once per approach to a group of controls, not once per control.
 */

/** The pause before a hover layer appears. Doc 09 §3.1. */
export const HOVER_OPEN_DELAY = 600;

/** The pause before it goes again. Deliberately much shorter. Doc 09 §3.1. */
export const HOVER_CLOSE_DELAY = 150;
