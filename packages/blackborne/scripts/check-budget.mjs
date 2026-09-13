/*
 * THE WEIGHT BUDGETS, ASSERTED. Doc 10 §7 opens with "a budget without a
 * number is not a budget: when you exceed it, you do not find out", and the
 * numbers have been published in this package's README since `0.2.0` with
 * nothing reading them. So the sentence stayed true WITH the numbers in place:
 * measured on 2026-09-10, `dist/styles.css` was 66,544 bytes against a
 * published ceiling of 60 kB and nobody found out.
 *
 * ## The ceilings live in the README and are read from it
 *
 * Not copied into this file, and not into a JSON beside it. Doc 10 §7 says the
 * number is "published in the README", and a second copy anywhere is the thing
 * this repository keeps being bitten by — a number in prose with no owner
 * (§11.6). So the README's table is the source and this parses it. A row that
 * cannot be found or cannot be parsed fails loudly, naming the row, which is
 * the only failure mode worth having here.
 *
 * ## What is NOT in here, deliberately
 *
 * The duration rows. A check that fails when a suite takes too long is a check
 * on how loaded the machine was, which is doc 10 §11's whole subject — and
 * this repository has already paid for it three times. Durations are recorded
 * with the date and the machine instead, and read by a person.
 */
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const HERE = resolve(import.meta.dirname, '..');
const README = readFileSync(join(HERE, 'README.md'), 'utf8');

const kB = bytes => `${(bytes / 1000).toFixed(1)} kB`;

/**
 * The ceiling for one row of the README's weight table.
 *
 * Returns the raw and gzip limits in bytes, either of which may be absent —
 * `structural` is a real answer for the JavaScript bundle and is written down
 * as a decision rather than as a number (see the README for why).
 */
const ceiling = label => {
  /* The first cell is the name, with or without backticks around it. */
  const row = README.split('\n').find(
    line =>
      line.startsWith('|') &&
      line.split('|')[1]?.trim().replaceAll('`', '') === label
  );
  if (!row) {
    throw new Error(
      `no row for ${label} in packages/blackborne/README.md's weight table; the ceilings are read from there and nothing else`
    );
  }
  const cell = row.split('|').at(-2).trim();
  if (cell.startsWith('structural')) return { structural: true };

  const raw = cell.match(/([\d.]+)\s*kB raw/);
  const gzip = cell.match(/([\d.]+)\s*kB gzip/);
  const only = cell.match(/^([\d.]+)\s*kB$/);
  if (!raw && !gzip && !only) {
    throw new Error(
      `could not read a ceiling from the ${label} row: "${cell}"`
    );
  }
  return {
    raw: raw
      ? Number(raw[1]) * 1000
      : only
        ? Number(only[1]) * 1000
        : undefined,
    gzip: gzip ? Number(gzip[1]) * 1000 : undefined
  };
};

const problems = [];

const weigh = (label, bytes) => {
  const limit = ceiling(label);
  const gzipped = gzipSync(bytes, { level: 9 }).length;

  if (limit.structural) {
    process.stdout.write(
      `  ${label.padEnd(19)} ${kB(bytes.length).padStart(9)} · ${kB(gzipped).padStart(8)} gzip   (structural, no ceiling)\n`
    );
    return;
  }

  const over = [];
  if (limit.raw !== undefined && bytes.length > limit.raw) {
    over.push(
      `raw ${kB(bytes.length)} over ${kB(limit.raw)} by ${kB(bytes.length - limit.raw)}`
    );
  }
  if (limit.gzip !== undefined && gzipped > limit.gzip) {
    over.push(
      `gzip ${kB(gzipped)} over ${kB(limit.gzip)} by ${kB(gzipped - limit.gzip)}`
    );
  }
  if (over.length) problems.push(`${label}: ${over.join(', ')}`);

  process.stdout.write(
    `  ${label.padEnd(19)} ${kB(bytes.length).padStart(9)} · ${kB(gzipped).padStart(8)} gzip   ${over.length ? 'OVER' : 'within'}\n`
  );
};

weigh('dist/index.js', readFileSync(join(HERE, 'dist/index.js')));
weigh('dist/styles.css', readFileSync(join(HERE, 'dist/styles.css')));
weigh('dist/palette.css', readFileSync(join(HERE, 'dist/palette.css')));

/*
 * The tarball is what a consumer actually downloads, so it is measured as one
 * rather than added up from its parts: `files: ["dist"]` decides the contents
 * and npm compresses them.
 *
 * Spawned as one command string rather than as a command plus arguments,
 * because `shell: true` is what makes `npm` findable on Windows and node
 * deprecates passing an argument array alongside it.
 */
const cache = join(HERE, 'node_modules/.cache');
mkdirSync(cache, { recursive: true });
const tarball = spawnSync(`npm pack --json --pack-destination "${cache}"`, {
  cwd: HERE,
  encoding: 'utf8',
  shell: true
});

if (tarball.status !== 0) {
  problems.push(`npm pack failed:\n${tarball.stderr}`);
} else {
  const packed = JSON.parse(tarball.stdout)[0];
  const file = join(cache, packed.filename);
  const size = statSync(file).size;
  rmSync(file, { force: true });

  const limit = ceiling('Published tarball');
  const over = limit.raw !== undefined && size > limit.raw;
  if (over) {
    problems.push(
      `the published tarball is ${kB(size)} over ${kB(limit.raw)} by ${kB(size - limit.raw)}`
    );
  }
  process.stdout.write(
    `  ${'Published tarball'.padEnd(19)} ${kB(size).padStart(9)}${' '.repeat(19)}${over ? 'OVER' : 'within'}\n`
  );
}

if (problems.length) {
  process.stderr.write(
    `\nA published budget is exceeded:\n\n  ${problems.join('\n  ')}\n\n` +
      'Doc 10 §7: revisit it with data, in the README, or bring the weight back. Not silently raised.\n'
  );
  process.exit(1);
}
