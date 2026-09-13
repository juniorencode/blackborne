/*
 * THE NUMBERS THE DOCUMENTS STATE AS FACT ARE STILL TRUE.
 *
 * Measured on 2026-09-11, which is why this exists:
 *
 *   doc 10 §3's table          "19 captures"    · really 197
 *   visual-regression.md       "Nineteen captures, not all sixty stories"
 *                                               · really 197 and 484
 *   playwright.config.ts       "253 tests across 28 files"  · really 438, 45
 *   playwright.config.ts       "357 checks in ONE file"     · really 484
 *   CLAUDE.md                  "357 checks in a single file"
 *
 * Every one of those was true when it was written. Nothing rewrote them as the
 * suites grew, because nothing read them — the same shape as the lint rules
 * before §2.1 and the release gate before §10.1, arriving a third time in the
 * documentation itself.
 *
 * ## The distinction this script is built on
 *
 * **Most numbers in this repository are MEASUREMENTS, and they are correct
 * forever.** "11 of 480 stories carried the flag", "all 196 baselines came
 * back byte-identical", "20 of the 196 baselines were taken outside the
 * guards" — each belongs to an event, and updating it to today's figure would
 * falsify the record rather than repair it. A sweep that rewrote every `480`
 * to `484` would have damaged nine true sentences to fix four false ones.
 *
 * **A few are CLAIMS about the present**, and those are the ones that rot in
 * silence. They are what this file holds. Doc 10 §12 has the rule: a number
 * describing the current state is registered here or it is written as a dated
 * measurement instead.
 *
 * ## Why a registry rather than a pattern
 *
 * Because no pattern can tell tense. `/(\d+) stories/` matches nine
 * historical sentences and two live ones, and a check that demands history be
 * rewritten is worse than no check. So each claim names its file and RENDERS
 * the sentence it expects from the measured number: if the measurement moves,
 * the rendered sentence is absent and the failure says exactly what to write.
 *
 * ## What it cannot catch
 *
 * A claim nobody registered. There is no way to find every numeric assertion
 * in English prose, and pretending otherwise would be the "silent green" this
 * repository keeps paying for. What this does is make the registered ones
 * impossible to break quietly, and give the next one somewhere to go.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { countStories } from './stories.mjs';
import { join } from 'node:path';

const read = path => readFileSync(path, 'utf8');

/* ─────────────────────────── what is measured ───────────────────────────── */

/**
 * The registered captures, counted out of the visual suite's own registries.
 *
 * Not `playwright test --list`, which is exact and costs 3.3 seconds and a
 * Playwright install — this runs in the fast gate. The parse is checked
 * against that authority rather than trusted: five arrays, summed, and the
 * total agreed with Playwright's 197 exactly when it was written.
 *
 * The array NAMES are asserted too. A sixth registry added to the file without
 * a line here would be invisible — the count would simply be too low and still
 * look like a number — so a `for (const … of X)` naming an array this function
 * does not know about is a failure rather than a silent undercount.
 */
const REGISTRIES = ['STATES', 'TOGETHER', 'AXES', 'AFTER_PRESS', 'ON_HOVER'];
const VISUAL = 'apps/catalog/e2e/visual.spec.ts';

const countCaptures = () => {
  const source = read(VISUAL);
  const problems = [];

  /* Every array the file actually loops over, so a new one cannot be missed. */
  const looped = new Set(
    [...source.matchAll(/^for \(const \[[^\]]*\] of ([A-Z_]+)\) \{$/gm)].map(
      m => m[1]
    )
  );
  for (const name of looped) {
    if (!REGISTRIES.includes(name)) {
      problems.push(
        `${VISUAL} loops over a registry called ${name}, which scripts/check-claims.mjs does not count. Add it to REGISTRIES, or the capture total is quietly short.`
      );
    }
  }
  for (const name of REGISTRIES) {
    if (!looped.has(name)) {
      problems.push(
        `scripts/check-claims.mjs counts a registry called ${name} and ${VISUAL} no longer loops over it.`
      );
    }
  }

  let total = 0;
  for (const name of REGISTRIES) {
    const at = source.indexOf(`const ${name}`);
    if (at === -1) continue;
    /* The `= [` and not the first `[`, which belongs to the tuple in
       `Array<[string, string]>` — measured, and it made every count zero. */
    const open = source.indexOf('= [', at) + 2;
    let index = open;
    let depth = 0;
    for (; index < source.length; index++) {
      if (source[index] === '[') depth++;
      else if (source[index] === ']' && --depth === 0) break;
    }
    /*
     * A STORY ID, not a component id. The pattern was `/'components-/g`, and
     * the first story registered from outside that namespace —
     * `foundations-palette--accents` — was counted as zero. Five captures
     * missing out of 216, with the total still looking like a number, which is
     * the exact failure the note above this function describes and is why the
     * registry names are asserted. The shape every id has is the double dash
     * between the title and the story.
     */
    total += (
      source.slice(open, index).match(/'[a-z][a-z0-9-]*--[a-z0-9-]+'/g) ?? []
    ).length;
  }
  return { total, problems };
};

/**
 * The components, counted as the story files — one per component.
 *
 * NOT the directories, and the difference is a real component rather than an
 * off-by-one. `Accordion` and `Collapsible` are the accordion pattern and the
 * disclosure pattern, they share one folder because the only difference in the
 * markup is the heading, and both are public. So the directories are 51 and
 * the components are 52, which is the number CLAUDE.md's own list spells out.
 *
 * Cross-checked against the built catalog: 52 `.stories.tsx` files, and 52
 * distinct story titles in `storybook-static/index.json`. The two agree
 * because `components.test.ts` already requires every component to have a
 * story, which is what makes this countable at all.
 *
 * A first attempt counted `readdirSync(components)` without filtering to
 * directories, got 52 by including `components.test.ts`, and agreed with the
 * guide for the wrong reason.
 */
const countComponents = () => {
  let total = 0;
  const walk = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.stories.tsx')) total++;
    }
  };
  walk('packages/blackborne/src/components');
  return total;
};

/**
 * A small number in words, because this repository writes prose.
 *
 * Bounded on purpose, and the bound FAILS rather than falls back: past 99
 * there is a real decision about how to spell it, and a check that guessed
 * would put a sentence nobody chose into the project's own guide.
 */
const TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety'
];
const UNITS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen'
];

const inWords = n => {
  if (n < 20) return UNITS[n];
  if (n > 99) {
    throw new Error(
      `scripts/check-claims.mjs spells numbers up to 99 and was asked for ${String(n)}. Decide how that reads in prose and extend inWords, rather than letting a check invent the sentence.`
    );
  }
  const unit = n % 10;
  return unit === 0
    ? TENS[Math.floor(n / 10)]
    : `${TENS[Math.floor(n / 10)]}-${UNITS[unit]}`;
};

/* ──────────────────────── what the documents claim ──────────────────────── */

const { total: captures, problems } = countCaptures();
const stories = countStories();
const components = countComponents();

const failures = [...problems];

/**
 * Each claim renders the sentence it expects from the measurement.
 *
 * `what` is what the reader is being told, and it appears in the failure so
 * the message explains the claim rather than only the string.
 */
const CLAIMS = [
  {
    file: 'docs/foundations/10-quality-and-verification.md',
    what: 'the visual row of §3’s layers table',
    says: () => `**Running**: ${String(captures)} captures`
  },
  {
    file: 'docs/contributing/visual-regression.md',
    what: 'what the suite photographs, and what it deliberately does not',
    says: () =>
      `${String(captures)} captures, not all ${String(stories)} stories`
  },
  {
    file: 'CLAUDE.md',
    what: 'how many components the guide says exist',
    says: () => `**${inWords(components)} components exist**`
  }
];

for (const claim of CLAIMS) {
  const expected = claim.says();
  if (!read(claim.file).includes(expected)) {
    failures.push(
      `${claim.file} no longer says "${expected}" — ${claim.what}. Either the measurement moved and the sentence needs that number, or the sentence was rewritten and this registry needs the new wording.`
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */

if (failures.length) {
  process.stderr.write(
    `\nA document states a number that is no longer true:\n\n  ${failures.join('\n\n  ')}\n\n` +
      'Measured just now:\n' +
      `  captures   ${String(captures)}\n` +
      `  stories    ${String(stories)}\n` +
      `  components ${String(components)}\n\n` +
      'Only CLAIMS ABOUT THE PRESENT belong here. A number attached to an event\n' +
      '— "11 of 480 stories carried the flag" — is a measurement and is correct\n' +
      'forever; updating one falsifies the record. Doc 10 §12.\n'
  );
  process.exit(1);
}

process.stdout.write(
  `  ${String(CLAIMS.length)} documented claims still hold: ${String(captures)} captures, ${String(stories)} stories, ${String(components)} components\n`
);
