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
 * Scanning the files that force rather than all 506 stories is what keeps this
 * cheap, and stopping as soon as every kind is covered is what keeps it quick:
 * 184 page loads and 1.2 minutes became a fraction of that. The narrowing is by
 * MECHANISM, never by story name — `--states` is a convention, and a
 * convention is not a guarantee — and the early exit is bounded by the SOURCE
 * rather than by what has been seen, which is the note on `settled` below.
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
const filesThatForce = (): Map<string, string[]> => {
  const found = new Map<string, string[]>();
  for (const path of storyFiles()) {
    const source = readFileSync(join(SOURCE_ROOT, path), 'utf8');
    const usesHelper = /\bForce\b/.test(source);
    const named = FORCED.filter(attribute => source.includes(attribute));
    if (!usesHelper && named.length === 0) continue;
    /*
     * WHICH KINDS THE FILE COULD FORCE, and it is deliberately over-broad: a
     * file that mentions `data-pressed` in a comment is credited with it. The
     * only thing this set is used for is knowing when there is nothing left to
     * look for, so too MANY kinds costs a few more page loads and too FEW
     * would stop the visit early and narrow the check. Over-broad is the safe
     * direction and it is the one taken.
     *
     * A file that uses the helper without naming a state is credited with all
     * of them, for the same reason.
     */
    found.set(path, named.length > 0 ? named : [...FORCED]);
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
  const match = [...candidates.keys()].find(candidate =>
    path.endsWith(candidate)
  );
  if (match === undefined) continue;
  byFile.set(match, [...(byFile.get(match) ?? []), entry]);
}

/**
 * Every state the CATALOG forced on this page, with the mode it is shown in.
 *
 * ## Why it reads a marker and not the attribute
 *
 * "Which elements carry `data-focused`" is a different question from "which
 * states did a story force", and the gap between them is not academic: a combo
 * box in an open-list story carries `data-focused` because it genuinely has
 * focus. Measured — that made this check fail once and pass the next time on
 * the same commit, because whether the page has focus at all varies between
 * runs under parallel workers. A state the browser arrived at by itself is not
 * a state a story is responsible for showing in both modes.
 *
 * So `catalog/forceState` marks its own wrapper with
 * `data-catalog-forced="<state>"`, and that is what is counted.
 *
 * ## And the attribute still has to be there
 *
 * The marker alone would say a state is covered even if `Force` never managed
 * to apply it — which is that component's own documented failure, and the
 * reason it exists at all. So a marker counts only when the attribute it names
 * is actually present inside it.
 *
 * The mode is the NEAREST `data-bb-mode` ancestor, or light where there is
 * none, which is what the stylesheet does since `:root` carries the light
 * mapping.
 */
const forcedOn = (page: Page) =>
  page.evaluate(() => {
    const seen: Array<{ state: string; mode: string }> = [];
    for (const marker of Array.from(
      document.querySelectorAll('[data-catalog-forced]')
    )) {
      const state = marker.getAttribute('data-catalog-forced');
      if (state === null) continue;
      if (marker.querySelector(`[${state}]`) === null) continue;
      const scope = marker.closest('[data-bb-mode]');
      seen.push({
        state,
        mode: scope?.getAttribute('data-bb-mode') ?? 'light'
      });
    }
    return seen;
  });

test('the list of forcible states still matches the component', () => {
  expect(declaredStates.length).toBeGreaterThan(0);
  expect([...declaredStates].sort()).toEqual([...FORCED].sort());
});

test('every file that forces a state is a file the catalog serves stories from', () => {
  expect(candidates.size).toBeGreaterThan(0);
  expect([...candidates.keys()].filter(path => !byFile.has(path))).toEqual([]);
});

for (const [path, entries] of byFile) {
  const component = path.split('/').at(-1)!.replace('.stories.tsx', '');

  test(`states: ${component}`, async ({ page }) => {
    /** Which modes each kind of forced state was seen in, across the file. */
    const modes = new Map<string, Set<string>>();
    const expected = candidates.get(path) ?? [...FORCED];

    /*
     * IT STOPS WHEN THERE IS NOTHING LEFT TO LOOK FOR, and the bound is what
     * makes that safe rather than a narrowing.
     *
     * The claim is per file and per KIND: each kind the file could force has
     * to turn up in a light scope and in a dark one. So once every kind the
     * SOURCE names has been seen in both, no further story can change the
     * answer, and visiting the rest is 160-odd page loads spent to re-confirm
     * what is already settled. Measured before this existed: 184 stories,
     * 1.2 minutes.
     *
     * The bound comes from the source rather than from what has been seen so
     * far, and that is the whole difference. Stopping when "everything seen so
     * far is covered" would stop after the first story every time — a kind
     * that only appears later would never be looked for, and the check would
     * report green over a gap it never visited. That is the silent-narrowing
     * shape doc 10 §11.1 is about, and the source set is deliberately
     * over-broad so that the error, if there is one, is more page loads rather
     * than fewer.
     */
    const settled = () =>
      /*
       * Every kind the source names AND every kind actually seen. The second
       * half is what stops an early exit from narrowing the check: a state
       * that turns up without the source naming it would otherwise let this
       * stop while that state is still one-sided.
       */
      [...expected, ...modes.keys()].every(
        kind => (modes.get(kind)?.size ?? 0) === 2
      );

    let visited = 0;
    for (const entry of entries) {
      if (settled()) break;
      visited += 1;
      await gotoStory(page, entry.id);
      for (const { state, mode } of await forcedOn(page)) {
        modes.set(state, (modes.get(state) ?? new Set()).add(mode));
      }
    }

    /*
     * SAID OUT LOUD, because an early exit that nobody can see is how a check
     * quietly comes to cover less than its name claims. The annotation shows
     * in the report and in `--reporter=list`.
     */
    test.info().annotations.push({
      type: 'visited',
      description: `${visited} of ${entries.length} stories; ${
        settled()
          ? 'stopped once every kind was covered'
          : 'visited all of them'
      }`
    });

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
