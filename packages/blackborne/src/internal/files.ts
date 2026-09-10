import { isFileDropItem, type DropItem } from 'react-aria-components';

/*
 * INTERNAL. The two pieces of logic a file field needs, both testable without
 * rendering anything (P7).
 *
 * Neither of them uploads. Hard rule 6 allows this library no request at all,
 * so a file field receives files and reports them; who sends them, where, and
 * what to do when it fails belongs to the project. That is the arrangement
 * `useToasts` has, and it was written down in the catalog's §3.3 before any of
 * this existed.
 */

/**
 * The files out of a drop, in the order they were dropped.
 *
 * A drop is not a `FileList`: the base hands over a list of items, each of
 * which is a file, a directory or a piece of text, and a file's contents
 * arrive through a call that returns a promise. So this is asynchronous, and
 * everything that is not a file is dropped on the floor — a folder dragged
 * onto an upload field is a folder, and this library does not walk one.
 *
 * Written as a function over the items rather than inside a handler, because
 * the shape of a `DropEvent` is the one thing about drag and drop that can be
 * checked without a pointer.
 */
export async function filesFromDrop(
  items: readonly DropItem[]
): Promise<File[]> {
  /*
   * `isFileDropItem` IS THE BASE'S OWN GUARD, re-exported by
   * `react-aria-components` alongside `isTextDropItem` and
   * `isDirectoryDropItem`. Used rather than comparing `item.kind` to a string:
   * the predicate narrows the type as well as answering the question, and it
   * is the base's contract rather than our reading of it.
   */
  const files = await Promise.all(
    items.map(async item => (isFileDropItem(item) ? item.getFile() : null))
  );

  return files.filter((one): one is File => one !== null);
}

/*
 * A SIZE IN THE UNITS AN OPERATING SYSTEM SHOWS.
 *
 * Two decisions in here, and both are the boring answer on purpose.
 *
 * **Powers of a thousand, not of 1024.** `Intl` knows `kilobyte`,
 * `megabyte` and `gigabyte` and has a localised name for each; it has no
 * kibibyte. Windows, macOS and every file manager a person has used show
 * megabytes computed either way and call them MB, so matching `Intl` costs a
 * few percent of accuracy and buys the platform's own words in every language.
 *
 * **One decimal place, and none for bytes.** "1.4 MB" is what a person reads;
 * "1.44 MB" is precision nobody asked for, and "1447 bytes" is not a decimal
 * question at all.
 */
const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

/**
 * A file's size, formatted in the locale it will be read in.
 *
 * Doc 05 §3: a number a person reads goes through the platform's own
 * formatter, with the locale received rather than detected. `Intl` supplies
 * both the unit's name and the way the number is written — "1,4 MB" in
 * Spanish, "1.4 MB" in English — and neither is a string this library owns.
 */
export function formatBytes(bytes: number, locale: string): string {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;

  let step = 0;
  let value = safe;
  while (value >= 1000 && step < UNITS.length - 1) {
    value /= 1000;
    step += 1;
  }

  const digits = step === 0 ? 0 : 1;

  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: UNITS[step],
    unitDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  }).format(value);
}
