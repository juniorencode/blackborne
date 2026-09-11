/*
 * EVERY COMPONENT HAS A STORY AND A TEST, read off the filesystem rather than
 * off a list somebody maintains.
 *
 * A story is not documentation here, it is a WORK LIST. Two verification
 * layers take their population from the catalog rather than from an array: the
 * accessibility suite generates one axe check per story from Storybook's own
 * index, and the visual suite photographs stories by id. So a component with
 * no story is not merely undocumented — it is absent from the only layers that
 * can see contrast, focus order and a resolved colour, none of which jsdom
 * answers. `docs/contributing/new-component.md` §0 is the rule this turns into
 * an error.
 *
 * Measured on the way in, 2026-09-11: 51 directories, 51 with a test, 50 with
 * a story. `Spinner` was the one without — exported from `src/index.ts`, and
 * absent from all 479 stories in the built index.
 *
 * THE POPULATION COMES FROM TWO SOURCES AND IS COMPARED BOTH WAYS, which is
 * the difference between this and a loop that passes when it finds nothing. A
 * scan returning an empty list — the wrong working directory is enough —
 * iterates nothing and reports success. Cross-checked against `src/index.ts`,
 * an empty scan fails naming all fifty-one.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

/* The working directory, not `import.meta.url`: vitest rewrites that to a
   non-file URL under jsdom and `fileURLToPath` throws on it. Same anchor and
   same reason as `styles/stylesheet.test.ts`. */
const SRC = join(process.cwd(), 'src');
const COMPONENTS = join(SRC, 'components');

/**
 * The directories on disk.
 *
 * Directories ONLY, and that filter is load-bearing rather than tidy: this
 * file sits beside them, so counting every entry would make the guard one of
 * its own subjects.
 */
const onDisk = readdirSync(COMPONENTS, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

/** The ones the package publishes, from the only file that decides that. */
const published = [
  ...new Set(
    [
      ...readFileSync(join(SRC, 'index.ts'), 'utf8').matchAll(
        /from '\.\/components\/(\w+)'/g
      )
    ].map(match => {
      /* The capture is the whole point of the match, so an empty one is a
         broken pattern rather than a missing export. */
      const name = match[1];
      if (name === undefined) {
        throw new Error(`matched a component export with no name: ${match[0]}`);
      }
      return name;
    })
  )
].sort();

test('the component directories and the published surface are one set', () => {
  expect(
    {
      onDiskOnly: onDisk.filter(name => !published.includes(name)),
      publishedOnly: published.filter(name => !onDisk.includes(name))
    },
    'a directory under components/ that src/index.ts does not export is ' +
      'either unpublished work or a folder that is not a component; a name ' +
      'exported from src/index.ts with no directory is a broken specifier. ' +
      'Both halves also make an empty scan impossible to pass.'
  ).toEqual({ onDiskOnly: [], publishedOnly: [] });
});

test('every component has a story and a test', () => {
  /*
   * By SUFFIX and not by the folder's own name, because two measured shapes
   * break the obvious version and teach nothing. A group and its member share
   * one folder, so `Accordion/` holds `Collapsible.stories.tsx` beside its
   * own; and `Toast/` has NO `Toast.tsx` at all — it ships as `useToasts` plus
   * `ToastRegion`, because P3 says the library holds no queue.
   */
  const without = (suffix: string): string[] =>
    onDisk.filter(
      name =>
        !readdirSync(join(COMPONENTS, name)).some(file => file.endsWith(suffix))
    );

  expect(
    { noStory: without('.stories.tsx'), noTest: without('.test.tsx') },
    'the accessibility suite builds its list from Storybook’s own index, so a ' +
      'component with no story gets no axe check either, and the visual suite ' +
      'cannot photograph it. See docs/contributing/new-component.md §0.'
  ).toEqual({ noStory: [], noTest: [] });
});
