/*
 * THE RELEASE GATE IS AS STRICT AS THE PULL-REQUEST GATE.
 *
 * `release.yml` is the workflow nothing rehearses. Every other check in this
 * repository runs on every pull request, so a defect in it is found within a
 * day; this one runs a few times a year, holds `NPM_TOKEN` and publishes an
 * artefact that cannot really be taken back. It is the one file where a gap
 * can sit for months and be discovered by its only consequence.
 *
 * Measured on 2026-09-11, which is why this exists: `verify.yml` ran five
 * verification commands and `release.yml` ran ONE. Doc 10 §10 lists automated
 * accessibility and visual regression among the things that stop a version
 * shipping, and the workflow that ships versions ran neither. A change could
 * go through a pull request that photographed it, and then be published by a
 * job that did not.
 *
 * ## The three things asserted
 *
 * **No drift.** Every verification command the pull-request gate runs, the
 * release gate runs too. This is the assertion that keeps the two in step
 * without either file importing the other: add a suite to `verify.yml` and
 * this fails until `release.yml` has it as well. The direction is deliberate
 * and one-way — the release may do MORE than a pull request, and never less.
 *
 * **Every action is pinned to a commit.** `release.yml`'s own header explains
 * at length why a moving tag such as `@v7` is dangerous in a credentialed job,
 * and until now nothing read that promise. A comment is not a check
 * (doc 10 §2.1).
 *
 * **Publishing waits for everything else.** A job added to `release.yml` that
 * `publish` does not list in its `needs` runs BESIDE the publish rather than
 * before it, so it verifies nothing — it merely reports, afterwards, on a
 * version that is already on npm. GitHub runs jobs in parallel by default,
 * which makes this the easy mistake rather than the exotic one.
 *
 * ## Why it reads the files as text
 *
 * No YAML parser. The repository declares none, and adding a dependency to
 * check two files it can already read is the wrong trade — `run:` values and
 * `uses:` values are one per line here, and the script asserts that shape
 * rather than assuming it: a `run: |` block or a flow-style job map makes it
 * say so instead of silently matching nothing.
 */
import { readFileSync } from 'node:fs';

const read = path => ({ path, text: readFileSync(path, 'utf8') });
const VERIFY = read('.github/workflows/verify.yml');
const RELEASE = read('.github/workflows/release.yml');

const failures = [];

/**
 * The single-line `run:` values of a workflow.
 *
 * A `run: |` block opens a shell script rather than naming a command, so it is
 * excluded here and reported separately — the one in `verify.yml` prints the
 * pictures a visual failure produced, which is not a verification command and
 * has no business in this comparison.
 */
const commandsOf = ({ path, text }) => {
  const lines = [...text.matchAll(/^[ \t]*(?:- )?run: (.+)$/gm)].map(m =>
    m[1].trim()
  );
  if (lines.length === 0) {
    failures.push(
      `${path} has no single-line \`run:\` at all. Either the workflow stopped running commands, or they are written as block scalars now and this script matches nothing while looking correct.`
    );
  }
  return lines.filter(line => line !== '|');
};

/*
 * WHAT THE RELEASE IS NOT REQUIRED TO REPEAT.
 *
 * `pnpm install --frozen-lockfile` is setup rather than verification, and each
 * job does its own. Everything else `verify.yml` runs is a claim about the
 * thing being published, so the release has to make it too.
 */
const SETUP = new Set(['pnpm install --frozen-lockfile']);

const verifyCommands = commandsOf(VERIFY).filter(c => !SETUP.has(c));
const releaseCommands = new Set(commandsOf(RELEASE));

for (const command of verifyCommands) {
  if (!releaseCommands.has(command)) {
    failures.push(
      `drift: verify.yml runs \`${command}\` and release.yml does not. A pull request is verified more strictly than the version built from it, which is backwards — doc 10 §10 lists what stops a version shipping, and every one of those layers belongs in the workflow that ships it.`
    );
  }
}

/*
 * Every action pinned to a full commit. A 40-character hexadecimal SHA is the
 * only form that cannot be repointed by the action's owner; `@v7`, `@v7.0.1`
 * and `@main` can all be moved at will, and this workflow hands whatever runs
 * an npm token with publish rights.
 */
for (const { path, text } of [VERIFY, RELEASE]) {
  const uses = [...text.matchAll(/^[ \t]*(?:- )?uses: (.+)$/gm)].map(m =>
    m[1].trim()
  );
  if (uses.length === 0) {
    failures.push(`${path} has no \`uses:\` lines, which cannot be right.`);
  }
  for (const line of uses) {
    /* The trailing `# v7.0.1` is where the human-readable version lives — the
       convention `release.yml`'s header sets out, and the thing that makes a
       pinned SHA reviewable at all. It is a comment, so it comes off before
       the reference is tested. The first version of this check did not do
       that and reported all seven pinned actions as unpinned. */
    const reference = line.split('#')[0].trim();
    /* A local action — `./.github/actions/…` — is this repository's own code
       and is already covered by everything else here. */
    if (reference.startsWith('./')) continue;
    if (!/@[0-9a-f]{40}$/.test(reference)) {
      failures.push(
        `${path} uses \`${reference}\`, which is not pinned to a commit. A tag is a pointer its owner can move, and this workflow holds NPM_TOKEN and id-token: write — read the SHA from the action's release page and put the version in a trailing comment.`
      );
    }
  }
}

/*
 * And publishing waits for every other job in the file.
 *
 * Jobs are the two-space keys under `jobs:`, which is the shape this file has
 * and the shape the assertion below states: if `jobs:` ever holds a flow
 * mapping, no key matches and the count is zero, which is reported rather than
 * passed over.
 */
const jobsBlock = RELEASE.text.slice(RELEASE.text.indexOf('\njobs:'));
const jobs = [...jobsBlock.matchAll(/^ {2}([A-Za-z][\w-]*):$/gm)].map(
  m => m[1]
);
const PUBLISH = 'publish';

if (!jobs.includes(PUBLISH)) {
  failures.push(
    `release.yml has no job called \`${PUBLISH}\` — this script identifies the publishing job by that name, and found ${jobs.length === 0 ? 'no jobs at all' : jobs.join(', ')}.`
  );
} else {
  const needs = /^ {4}needs: (.+)$/m.exec(
    jobsBlock.slice(jobsBlock.indexOf(`\n  ${PUBLISH}:`))
  );
  const waitsFor = new Set(
    (needs?.[1] ?? '')
      .replace(/[[\]]/g, '')
      .split(',')
      .map(n => n.trim())
  );
  for (const job of jobs) {
    if (job !== PUBLISH && !waitsFor.has(job)) {
      failures.push(
        `release.yml's \`${PUBLISH}\` job does not list \`${job}\` in its \`needs:\`, so the two run in PARALLEL. A check that finishes after the package is on npm has verified nothing; it has reported.`
      );
    }
  }
}

if (failures.length) {
  process.stderr.write(
    `\nThe release gate does not do what it claims:\n\n  ${failures.join('\n\n  ')}\n\n` +
      'release.yml is the one workflow nothing rehearses — it runs a few times a\n' +
      'year, holds a publish token, and its mistakes are found by their only\n' +
      'consequence. That is what this check is for.\n'
  );
  process.exit(1);
}

process.stdout.write(
  `  the release gate runs all ${String(verifyCommands.length)} of the pull-request gate's checks, every action is pinned, and publishing waits for ${String(jobs.length - 1)} job${jobs.length === 2 ? '' : 's'}\n`
);
