import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countStories } from './stories.mjs';

/*
 * THE BUILT CATALOG IS CURRENT, ASSERTED BEFORE ANYTHING IS SERVED FROM IT.
 *
 * ## The failure this exists for
 *
 * The browser, accessibility and visual suites are served from
 * `apps/catalog/storybook-static` — a BUILT artefact, deliberately, because a
 * dev server compiles each story on demand and a run that reuses whatever
 * server is up verifies whatever that server last compiled (`e2e/catalog.ts`
 * has the reasoning). `pnpm verify:full` builds it first and so does CI, in a
 * step of its own.
 *
 * Nothing stopped a suite being run on its own. On 2026-09-12 an accessibility
 * run reported **497 checks green**; CI ran 501 and failed three of them on a
 * critical `aria-required-children`. Rebuilt locally, all three reproduced on
 * the first try.
 *
 * WHY THAT BUILD WAS STALE WAS NEVER ISOLATED, and the first explanation —
 * that `pnpm visual` builds inside Docker and leaves the local build alone —
 * is withdrawn. Measured afterwards: a Docker visual run rewrites both
 * `index.json` and `index.html` on the host, so it does refresh it. The
 * evidence that had seemed to show otherwise was one file's modification time,
 * read once.
 *
 * So this is doc 10 §11.3 rather than a fix: where a cause will not reproduce,
 * ship the instrument that attributes the next occurrence instead of guessing
 * a third time. The tell was there and nobody was reading it — the count
 * disagreed with CI's — so this reads it.
 *
 * ## Why two signals rather than one
 *
 * **The stories**, because that is the number that actually disagreed, and it
 * is content rather than a clock: `storybook-static/index.json` names every
 * story the build produced, and `scripts/stories.mjs` counts what the source
 * declares. One counter, two readers — the module exists so that the thing
 * detecting a disagreement is not itself two answers.
 *
 * **And the mtimes**, because the count alone is blind to the commoner case:
 * the same stories with changed code. Every CSS fix in the table suite would
 * have passed a count check while the catalog served the previous paint.
 *
 * The second signal is deliberately conservative and it is worth knowing why
 * rather than being surprised by it. A modification time is not content: `git
 * checkout`, `git stash pop` and restoring a file all rewrite one, so this
 * asks for a rebuild after a branch switch even when the files come back
 * identical. That is the right way round. A rebuild nobody needed costs about
 * fifty seconds; a suite that reports green against the wrong artefact costs a
 * failure on CI and an afternoon finding out why — which is the bill this was
 * written from.
 *
 * ## Why not simply build every time
 *
 * Because a suite is run dozens of times in an afternoon and a catalog build
 * is about fifty seconds, and because CI already builds in a step of its own —
 * so a build inside the script would be a second one, three times per run. A
 * guard costs milliseconds and says what to do; `pnpm verify:full` remains the
 * command that builds first.
 */

/* Resolved from this file rather than from the working directory, because the
   three scripts that call it run inside `apps/catalog`. */
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const at = (...parts) => join(ROOT, ...parts);

const INDEX = at('apps/catalog', 'storybook-static', 'index.json');

/* What a catalog build reads. The package's compiled stylesheet is the only
   thing the catalog imports from `dist`, and it is produced from this same
   source tree, so watching the source covers it. */
const INPUTS = [at('packages/blackborne/src'), at('apps/catalog/.storybook')];

const REBUILD = 'pnpm build:catalog';

/** The newest file under a tree, as a path and a time. */
const newestIn = root => {
  let newest = { path: root, at: 0 };
  const walk = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        walk(path);
      } else {
        const at = statSync(path).mtimeMs;
        if (at > newest.at) newest = { path, at };
      }
    }
  };
  walk(root);
  return newest;
};

const ago = ms => {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return 'less than a minute';
  if (minutes === 1) return 'a minute';
  if (minutes < 120) return `${String(minutes)} minutes`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? 'an hour' : `${String(hours)} hours`;
};

const problems = [];

let built;
try {
  built = JSON.parse(readFileSync(INDEX, 'utf8'));
} catch {
  problems.push(
    `there is no built catalog at ${INDEX.slice(ROOT.length)}.\n` +
      `  The suites are served from it rather than from a dev server, so there is nothing to serve.`
  );
}

if (built) {
  const builtStories = Object.values(built.entries ?? {}).filter(
    entry => entry.type === 'story'
  ).length;
  const declared = countStories(at('packages/blackborne/src'));

  if (builtStories !== declared) {
    problems.push(
      `the built catalog holds ${String(builtStories)} stories and the source declares ${String(declared)}.\n` +
        `  A suite run against it would check ${String(builtStories)} of them and report green, which is\n` +
        `  exactly how three critical accessibility failures reached CI once already.`
    );
  }

  const builtAt = statSync(INDEX).mtimeMs;
  for (const root of INPUTS) {
    const newest = newestIn(root);
    if (newest.at > builtAt) {
      problems.push(
        `${newest.path.slice(ROOT.length)} changed after the catalog was built, ${ago(newest.at - builtAt)} later.\n` +
          `  The suites would be reading the paint and the markup from before that change.`
      );
    }
  }
}

if (problems.length > 0) {
  process.stderr.write(
    `\nThe built catalog is not what the suites should be reading:\n\n  ${problems.join('\n\n  ')}\n\n` +
      `Run \`${REBUILD}\`, or \`pnpm verify:full\`, which builds first.\n`
  );
  process.exitCode = 1;
} else {
  process.stdout.write(`  the built catalog is current\n`);
}
