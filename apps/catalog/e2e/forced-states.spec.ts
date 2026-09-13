/*
 * EVERY FORCED STATE, IN BOTH MODES — because axe reads what is ON the page.
 *
 * Doc 10 §11.9. A state like hover or pressed is reachable only by pointing at
 * a thing, so the catalog forces the DOM attribute instead (`catalog/forceState`)
 * — and a forced-state story is therefore the ONLY place those states are ever
 * rendered. If such a story renders one mode, that state is unreachable in the
 * other by every automated layer this repository has: the accessibility suite
 * measures a rendered page, and the visual suite photographs one.
 *
 * That is not a hypothetical either. `Button`'s states story was light-only,
 * and a pressed primary button in dark mode was white text on the scale's
 * low-contrast TEXT step at **2.08:1** — under 501 stories, 480 axe runs and
 * 211 baselines, all green. The fix there was one story. This is the rule.
 *
 * ## What it asserts
 *
 * For every story FILE that forces a state, and for each KIND of state it
 * forces, that kind has to appear inside a light scope and inside a dark one
 * somewhere in that file's stories.
 *
 * Per kind rather than per file, because "this component shows something in
 * dark" is not the claim — `data-pressed` being visible in dark is. And
 * "inside a scope" rather than "the story contains a dark panel", because a
 * story can have a dark panel with every forced state in the light one, which
 * is the false pass this check exists to refuse.
 *
 * ## Why the candidate list comes from the SOURCE and the answer from the PAGE
 *
 * The source scan only has to be SOUND, not precise: a file that neither
 * mentions `Force` nor writes a state attribute itself cannot force one, so
 * skipping it cannot hide anything. Everything after that is asked of the
 * rendered page, which is the only thing that knows what a story actually
 * puts on screen.
 *
 * Scanning 184 stories out of 506 rather than all of them is what keeps this
 * cheap. The narrowing is by MECHANISM, never by story name — `--states` is a
 * convention, and a convention is not a guarantee.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG_INDEX } from './catalog';
import { gotoStory } from './story';

type StoryEntry = {
  id: string;
  name: string;
  title: string;
  type: string;
  importPath: string;
  exportName: string;
};

/**
 * The states `catalog/forceState` can force.
 *
 * Kept as a list here rather than imported, because this file is the CHECK and
 * the component is the thing checked — but it is asserted against the source
 * below rather than trusted, so the two cannot drift apart in silence.
 */
const FORCED = [
  'data-hovered',
  'data-pressed',
  'data-focused',
  'data-dragging',
  'data-focus-visible',
  'data-drop-target'
];

const SOURCE_ROOT = fileURLToPath(
  new URL('../../../packages/blackborne/src/', import.meta.url)
);

/** Every story file, as a path relative to the package source. */
const storyFiles = (): string[] =>
  readdirSync(SOURCE_ROOT, { recursive: true })
    /* The recursive paths carry the platform separator; measured on win32:
       `components\\Button\\Button.stories.tsx`. */
    .map(entry => String(entry).split('\\').join('/'))
    .filter(path => path.endsWith('.stories.tsx'));

/**
 * The files that could possibly force a state.
 *
 * Two routes, and both are searched: the `Force` component, and a story
 * writing one of the attributes itself. Three files do the second — a slider
 * being dragged, an uploader with something over it, a link — so searching for
 * `Force` alone would have skipped them.
 */
const filesThatForce = (): Set<string> => {
  const found = new Set<string>();
  for (const path of storyFiles()) {
    const source = readFileSync(join(SOURCE_ROOT, path), 'utf8');
    const usesHelper = /\bForce\b/.test(source);
    const writesOne = FORCED.some(attribute => source.includes(attribute));
    if (usesHelper || writesOne) found.add(path);
  }
  return found;
};

/*
 * THE LIST OF STATES IS CHECKED AGAINST THE COMPONENT, not assumed.
 *
 * `forceState.tsx` declares the union, and a state added there without a line
 * above would simply never be looked for — a silent narrowing of this whole
 * file, which is the shape doc 10 §11.1 is about. Read at collection time so
 * it fails before any browser starts.
 */
const forceSource = readFileSync(
  join(SOURCE_ROOT, 'catalog/forceState.tsx'),
  'utf8'
);
const declaredStates = [
  ...forceSource.matchAll(/^\s*\|\s*'(data-[a-z-]+)'/gm)
].map(match => match[1]!);

const stories: StoryEntry[] = await fetch(CATALOG_INDEX)
  .then(response => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<{ entries: Record<string, StoryEntry> }>;
  })
  .then(index =>
    Object.values(index.entries).filter(entry => entry.type === 'story')
  )
  .catch((cause: unknown) => {
    throw new Error(
      `the catalog index at ${CATALOG_INDEX} could not be read, so this suite ` +
        `has no story list at all: ` +
        `${cause instanceof Error ? cause.message : String(cause)}. ` +
        'Build and serve the catalog: `pnpm build:catalog`. This throws ' +
        'rather than returning an empty list, because an empty list is a ' +
        'suite of no checks that reports success.',
      { cause }
    );
  });

const candidates = filesThatForce();

/** Story ids grouped by the file they came from, for the files that force. */
const byFile = new Map<string, StoryEntry[]>();
for (const entry of stories) {
  const path = entry.importPath.split('/').slice(-3).join('/');
  const match = [...candidates].find(candidate => path.endsWith(candidate));
  if (match === undefined) continue;
  byFile.set(match, [...(byFile.get(match) ?? []), entry]);
}

/**
 * Every forced state on the page, with the mode it is being shown in.
 *
 * The mode is the NEAREST `data-bb-mode` ancestor, or light where there is
 * none — which is what the stylesheet does, since `:root` carries the light
 * mapping. Reading the attribute rather than a colour, because the question is
 * which scope the element is in, not what it ended up looking like.
 */
const forcedOn = (page: Page, attributes: string[]) =>
  page.evaluate(names => {
    const seen: Array<{ state: string; mode: string }> = [];
    for (const name of names) {
      for (const element of Array.from(
        document.querySelectorAll(`[${name}]`)
      )) {
        const scope = element.closest('[data-bb-mode]');
        seen.push({
          state: name,
          mode: scope?.getAttribute('data-bb-mode') ?? 'light'
        });
      }
    }
    return seen;
  }, attributes);

test('the list of forcible states still matches the component', () => {
  expect(declaredStates.length).toBeGreaterThan(0);
  expect([...declaredStates].sort()).toEqual([...FORCED].sort());
});

test('every file that forces a state is a file the catalog serves stories from', () => {
  expect(candidates.size).toBeGreaterThan(0);
  expect([...candidates].filter(path => !byFile.has(path))).toEqual([]);
});

for (const [path, entries] of byFile) {
  const component = path.split('/').at(-1)!.replace('.stories.tsx', '');

  test(`states: ${component}`, async ({ page }) => {
    /** Which modes each kind of forced state was seen in, across the file. */
    const modes = new Map<string, Set<string>>();

    for (const entry of entries) {
      await gotoStory(page, entry.id);
      for (const { state, mode } of await forcedOn(page, FORCED)) {
        modes.set(state, (modes.get(state) ?? new Set()).add(mode));
      }
    }

    /*
     * A file in the candidate list that turns out to force nothing is not a
     * failure — the scan is deliberately over-broad, and `Force` appears in an
     * import that a story may no longer use. It is worth saying so rather than
     * passing silently, so the next person can narrow the list on purpose.
     */
    test.skip(
      modes.size === 0,
      `${component} mentions the mechanism but renders no forced state`
    );

    const oneSided = [...modes]
      .filter(([, seen]) => !(seen.has('light') && seen.has('dark')))
      .map(([state, seen]) => `${state} only in ${[...seen].join(' and ')}`);

    expect(
      oneSided,
      `${component} forces these in one mode only, so nothing measures them in the other ` +
        `(doc 10 §11.9):\n  ${oneSided.join('\n  ')}`
    ).toEqual([]);
  });
}
