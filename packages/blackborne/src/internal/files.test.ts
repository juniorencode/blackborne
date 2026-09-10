/*
 * The two pieces of logic a file field needs, tested with nothing rendered —
 * which is the whole reason they are here rather than inside a handler.
 */
import { expect, test } from 'vitest';
import type { DropItem } from 'react-aria-components';
import { filesFromDrop, formatBytes } from './files';

const file = (name: string) => new File(['x'], name, { type: 'text/plain' });

/** A dropped file, shaped the way the base hands one over. */
const dropped = (name: string): DropItem =>
  ({
    kind: 'file',
    type: 'text/plain',
    name,
    getFile: async () => file(name),
    getText: async () => ''
  }) as unknown as DropItem;

/** Anything that is not a file, which a drop can also carry. */
const other = (kind: 'text' | 'directory'): DropItem =>
  ({ kind }) as unknown as DropItem;

test('a drop gives up its files, in the order they arrived', async () => {
  const found = await filesFromDrop([
    dropped('one.txt'),
    dropped('two.txt'),
    dropped('three.txt')
  ]);

  expect(found.map(one => one.name)).toEqual([
    'one.txt',
    'two.txt',
    'three.txt'
  ]);
});

test('and everything that is not a file is left on the floor', async () => {
  /*
   * A DROP IS NOT A `FileList`. The base hands over items, and an item can be
   * text or a DIRECTORY — a folder dragged onto an upload field is a folder,
   * and this library does not walk one. Dropping it silently is the honest
   * answer: the alternative is a component that recurses into a file system.
   */
  const found = await filesFromDrop([
    other('text'),
    dropped('one.txt'),
    other('directory')
  ]);

  expect(found).toHaveLength(1);
  expect(found[0]?.name).toBe('one.txt');
});

test('an empty drop is an empty list rather than a failure', async () => {
  expect(await filesFromDrop([])).toEqual([]);
});

test('a size is written in the units an operating system shows', () => {
  expect(formatBytes(512, 'en-US')).toBe('512 byte');
  expect(formatBytes(2400, 'en-US')).toBe('2.4 kB');
  expect(formatBytes(1_440_000, 'en-US')).toBe('1.4 MB');
  expect(formatBytes(3_200_000_000, 'en-US')).toBe('3.2 GB');
});

test('and in the locale it will be read in', () => {
  /*
   * Doc 05 §3: the number and the unit's name are both the platform's, in the
   * locale received. Spanish writes the decimal with a comma and keeps the
   * unit's symbol, which is exactly the kind of thing a hand-rolled formatter
   * gets wrong for eleven locales and right for one.
   */
  expect(formatBytes(1_440_000, 'es-PE')).toBe('1.4 MB');
  expect(formatBytes(1_440_000, 'de-DE')).toBe('1,4 MB');
  expect(formatBytes(2400, 'de-DE')).toBe('2,4 kB');
});

test('nothing sensible formats as no bytes rather than as NaN', () => {
  /*
   * A file whose size is unknown is a row a consumer may still want to show,
   * so this cannot throw or print `NaN kB`. Zero is the honest answer.
   */
  expect(formatBytes(Number.NaN, 'en-US')).toBe('0 byte');
  expect(formatBytes(-1, 'en-US')).toBe('0 byte');
  expect(formatBytes(0, 'en-US')).toBe('0 byte');
});

test('the biggest unit stops rather than running out', () => {
  /* Petabytes are not on the scale, so a very large file is many terabytes. */
  expect(formatBytes(5_000_000_000_000_000, 'en-US')).toBe('5,000 TB');
});
