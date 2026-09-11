/*
 * THE TAG SAYS WHAT IT PUBLISHES, AND IT COMES FROM MAIN.
 *
 * `release.yml` triggers on any tag matching `v*`, and a git tag can be made
 * from any commit on any branch by anyone who can push one. Three things were
 * therefore true of this repository and are the reason this file exists.
 *
 * **Nobody checked the tag was on main.** `main` is protected — no direct
 * pushes, and CI must pass — and every bit of that is bypassed by tagging a
 * branch that was never merged. The protection guards what lands on main; it
 * does not guard what gets published, because publishing is triggered by a tag
 * rather than by a merge.
 *
 * **Nobody checked the tag matched the version.** npm publishes what
 * `package.json` says, not what the tag says. So tagging `v0.3.0` while the
 * package reads `0.2.0` republishes `0.2.0` — or fails at the registry after
 * everything else has run — and leaves a tag in the history that names a
 * version nobody released.
 *
 * **And `pnpm publish` runs with `--no-git-checks`**, which switches off the
 * two guards pnpm has of its own: that the branch is the publishing branch and
 * that the tree is clean. The flag is not wrong — a tag build is a detached
 * HEAD, so pnpm's branch check cannot pass and the publish would never run —
 * but it means those guarantees have to come from somewhere, and until now
 * they came from nowhere.
 *
 * ## What it is not
 *
 * A substitute for reading the changelog. It asserts that the section exists,
 * carries a date and holds something; whether what it holds is TRUE is doc 10
 * §10's last item and belongs to a person.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PACKAGE = 'packages/blackborne/package.json';

/** A tag from the command line, or the one GitHub is building. */
const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;

if (!tag) {
  process.stderr.write(
    '\nNo tag given. Pass one — `node scripts/check-tag.mjs v0.2.0` — or run\n' +
      'this where GITHUB_REF_NAME is set, which on a tag push is the tag.\n'
  );
  process.exit(1);
}

const failures = [];

/**
 * git, with a failure that is a value rather than an exception.
 *
 * `stdio` names all three streams on purpose. Left to itself `execFileSync`
 * passes the child's stderr through to the terminal, so a probe that is
 * SUPPOSED to fail — "does this ref exist?" — printed git's own `fatal:` above
 * this script's report, which reads as a crash rather than as an answer.
 */
const git = (...args) => {
  try {
    return {
      ok: true,
      out: execFileSync('git', args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim()
    };
  } catch (error) {
    return {
      ok: false,
      out: String(error.stderr ?? error.message)
        .trim()
        .split('\n')[0]
    };
  }
};

/* ───────────────────────────── the tag's shape ──────────────────────────── */

const semver = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+(?:\.[0-9A-Za-z.]+)*)?)$/.exec(
  tag
);

if (!semver) {
  process.stderr.write(
    `\n\`${tag}\` is not a version tag. The release workflow triggers on \`v*\`, so a\n` +
      'tag such as `v2-experiment` starts a publish. The form is `v` followed by\n' +
      'major.minor.patch, optionally with a prerelease: v0.2.0, v0.2.0-rc.1.\n'
  );
  process.exit(1);
}

const version = semver[1];

/* ──────────────────── the tag and the package agree ─────────────────────── */

const pkg = JSON.parse(readFileSync(PACKAGE, 'utf8'));

if (pkg.version !== version) {
  failures.push(
    `the tag says ${version} and ${PACKAGE} says ${pkg.version}. npm publishes what the package says, so this tag would put ${pkg.version} on the registry under a name that claims otherwise.`
  );
}

/* ─────────────────────────── and it is on main ──────────────────────────── */

const commit = git('rev-parse', `${tag}^{commit}`);

if (!commit.ok) {
  failures.push(
    `\`${tag}\` does not resolve to a commit here: ${commit.out}. Fetch the tag before running this.`
  );
} else {
  /*
   * `origin/main` first, then `main`. A CI checkout of a tag has no branches
   * at all unless something fetched them, and a local clone may have either —
   * so both are tried and NEITHER existing is a failure rather than a pass.
   * That distinction is the whole point: "not an ancestor" and "I could not
   * find main" produce the same falsy answer from git and mean opposite
   * things.
   */
  const main = ['origin/main', 'main'].find(
    ref => git('rev-parse', '--verify', `${ref}^{commit}`).ok
  );

  if (!main) {
    failures.push(
      'neither `origin/main` nor `main` exists here, so whether this tag is on main cannot be answered. On CI the checkout needs `fetch-depth: 0` and an explicit `git fetch origin main`; a shallow checkout of a tag carries no branch at all.'
    );
  } else if (!git('merge-base', '--is-ancestor', commit.out, main).ok) {
    failures.push(
      `${commit.out.slice(0, 12)} is not an ancestor of ${main}, so this tag points at work that never went through a pull request. \`main\` is protected and CI must pass to land there — tagging a branch directly walks around all of it.`
    );
  }
}

/* ────────────────────────────── the changelog ───────────────────────────── */

const changelog = readFileSync('CHANGELOG.md', 'utf8');
const heading = new RegExp(
  `^## \\[${version.replace(/\./g, '\\.')}\\] - (\\d{4}-\\d{2}-\\d{2})$`,
  'm'
);
const found = heading.exec(changelog);

if (!found) {
  failures.push(
    `CHANGELOG.md has no \`## [${version}] - YYYY-MM-DD\` section. Doc 10 §10 asks for the changelog to be up to date with migrations for anything that broke, and at release time that means the Unreleased section has become this version's.`
  );
} else {
  const body = changelog
    .slice(found.index + found[0].length)
    .split(/^## /m)[0]
    .trim();
  if (body.length === 0) {
    failures.push(
      `CHANGELOG.md's \`[${version}]\` section is empty. A version with nothing written under it is a version nobody can read the diff of.`
    );
  }
  if (
    !new RegExp(`^\\[${version.replace(/\./g, '\\.')}\\]: `, 'm').test(
      changelog
    )
  ) {
    failures.push(
      `CHANGELOG.md has no \`[${version}]: …\` link at the bottom, so the heading is not a link to anything. Keep a Changelog's format, and the previous versions all have one.`
    );
  }
}

const unreleased = changelog.split('## [Unreleased]')[1]?.split(/^## /m)[0];

if (unreleased === undefined) {
  failures.push(
    'CHANGELOG.md has no `## [Unreleased]` section at all. It is the placeholder the next change is written into, and Keep a Changelog keeps it even when empty.'
  );
} else if (/^[-*] /m.test(unreleased)) {
  failures.push(
    `CHANGELOG.md still has entries under \`[Unreleased]\`. Those changes are in the commit being published, so they ship as part of ${version} while the changelog says they are unreleased — which is the one thing a changelog is for.`
  );
}

/* ─────────────────── and the version is not already out ─────────────────── */

/*
 * Failing here in two seconds rather than at the registry after everything
 * else has run. npm refuses to overwrite a published version, so this changes
 * no outcome — it changes WHEN the outcome arrives and what it says, which for
 * a thirteen-minute pipeline is most of the value.
 *
 * An unreachable registry is a failure rather than a skip: the publish at the
 * end of this pipeline needs the same registry, so there is nothing to gain by
 * pressing on.
 */
/*
 * The registry over HTTP rather than through `npm view`. Measured: spawning
 * `npm` fails with ENOENT on Windows, where the executable is `npm.cmd`, so a
 * check meant to run on CI and on a laptop reported "could not ask npm" on
 * every laptop in the project. `fetch` has no such question, and the
 * abbreviated metadata document is a fraction of the full one.
 *
 * 404 is not an error here: it is a package with nothing published, which is
 * the one answer that means go ahead.
 */
try {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`,
    { headers: { accept: 'application/vnd.npm.install-v1+json' } }
  );
  if (response.status === 404) {
    /* Nothing published under this name. The body is cancelled rather than
       left unread: an undrained response holds its socket in the keepalive
       pool, and a held socket is what made `process.exit` abort below. */
    await response.body?.cancel();
  } else {
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`the registry answered ${String(response.status)}`);
    }
    const published = Object.keys((await response.json()).versions ?? {});
    if (published.includes(version)) {
      failures.push(
        `${pkg.name}@${version} is already on npm. A published version is immutable, so this pipeline would run for thirteen minutes and then be refused by the registry.`
      );
    }
  }
} catch (error) {
  failures.push(
    `could not ask npm what ${pkg.name} has published: ${String(error instanceof Error ? error.message : error)}. The publish at the end of this pipeline needs the same registry, so there is nothing to gain by pressing on.`
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

/*
 * `exitCode` rather than `exit()`, and it is not a style preference. Measured
 * on Windows: calling `process.exit` while the registry's keepalive socket is
 * still open ABORTS the process —
 * `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` — and the shell
 * then reports **127** rather than 1. A check that fails for the right reason
 * and reports the wrong code is a check whose failures cannot be read, and 127
 * conventionally means the command was not found.
 */
if (failures.length) {
  process.stderr.write(
    `\n${tag} is not ready to publish:\n\n  ${failures.join('\n\n  ')}\n\n` +
      'A published version cannot be taken back — `npm unpublish` is refused\n' +
      'after 72 hours and leaves the version number burned either way. This is\n' +
      'the last check before that becomes permanent.\n'
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `  ${tag} publishes ${pkg.name}@${version}, from a commit on main, with a changelog section and nothing already on npm\n`
  );
}
