import { defineConfig } from '@playwright/test';
import { CATALOG_URL } from './e2e/catalog';

/*
 * Doc 10's layer table puts a browser under "visual regression, slow". Two
 * findings moved it forward: the layer spike showed jsdom cannot answer where
 * focus goes, and the token cascade bug showed it cannot answer what colour an
 * element ended up. Both are core guarantees, so a real browser is not the
 * slow optional layer — it is the only instrument for a whole class of rule.
 */
export default defineConfig({
  testDir: './e2e',
  // A failing colour or pixel assertion must not be shrugged off as flakiness.
  retries: 0,
  /*
   * A COMMITTED `.only` MUST NOT PASS. Playwright's default is `false`, and
   * `.only` focuses the whole RUN rather than its own file: one left behind
   * would take the `checks` project from 438 tests to 1 and report green. That
   * is the silent-green class this repository keeps paying for, and it is one
   * line to close. Measured: zero `.only`, `.skip` and `.fixme` in `e2e/`
   * today, so this changes nothing and prevents one thing.
   *
   * On CI only, deliberately. A person narrowing a run with `.only` while they
   * work is using the tool correctly; the mistake is committing it.
   */
  forbidOnly: !!process.env.CI,
  /*
   * WORK IS HANDED OUT PER FILE, and that is left alone here on purpose —
   * splitting a file's tests across workers is switched on for exactly one
   * project below.
   *
   * The reason is measured, and the two suites have opposite shapes.
   *
   * The behaviour checks are spread across many files, so handing out whole
   * files already uses every worker. Measured when the suite was 253 tests in
   * 28 files: 7.5 minutes serial against 2.7 with six workers. Splitting the
   * files' tests as well bought nothing on top of that — 2.7 either way — and
   * one three-worker run dropped three checks, so it stays off where it has
   * nothing to offer.
   *
   * The accessibility suite is ONE file, which file-level parallelism cannot
   * touch at all. Measured at 357 checks: splitting it took 13.1 minutes to
   * 4.6.
   *
   * THE SHAPES ARE THE ARGUMENT, not the counts, which is why the counts here
   * are dated by the size of the suite rather than restated. Both have grown —
   * 438 tests in 45 files and 484 checks in one, on 2026-09-11 — and neither
   * growth changes which lever applies to which. Doc 10 §12.
   *
   * So: file-level for everything, test-level for the one file that is a suite
   * in its own right.
   */
  /*
   * Half the cores, which is Playwright's own local default made explicit —
   * because **in CI its default is one**, and that is where the whole cost is
   * paid. Every number below was measured locally with six workers; before
   * this line existed, CI ran all of it in a single worker, so the pipeline was
   * slower than any of these measurements even at its best.
   *
   * What it is worth:
   *
   *   behaviour     · 253 tests, 28 files · 7.5m serial → 2.7m
   *   accessibility · 357 checks, 1 file  · 13.1m       → 4.6m
   *
   * Half rather than all, because each worker is a browser and the machine
   * still has a server and an operating system to run. Where the curve turns
   * is a property of the MACHINE rather than of this suite, and there is a
   * measurement for that too: on the same repository with 2.4GB free, thirty
   * checks took 2m10s at one worker, 1m10s at two, and 1m17s at six — six was
   * slower than two and dropped a check. The same six workers on the same
   * machine an hour later, with memory back, produced the 4.6m above.
   *
   * So: a fraction here, and `--workers=N` on the command line when a
   * particular machine disagrees. A number baked in would be wrong on both of
   * those machines and they are the same one.
   *
   * CI IS THE EXCEPTION AND IS NOW WRITTEN DOWN. `'50%'` resolved against a
   * GitHub-hosted runner is 2, because that runner has four cores, and every
   * figure above was measured on a twelve-core laptop where the same fraction
   * is 6. Read from a real run on 2026-09-11: `Running 438 tests using 2
   * workers`, then `480 tests using 2 workers`. Two is what CI has been
   * running and passing at; writing it makes it a decision instead of an
   * arithmetic coincidence, and the next person to change it sees a number
   * somebody chose.
   *
   * ## WHEN A MACHINE DISAGREES, THIS IS WHAT IT LOOKS LIKE
   *
   * Attributed on 2026-09-11, by the diagnostic added to `e2e/story.ts` in the
   * same change, on its first real occurrence:
   *
   *     the story "components-splitbutton--sizes" never mounted:
   *     {"rootChildren":0,"bodyClass":"(none)","errorText":""};
   *     the page said: console: Failed to load resource:
   *     net::ERR_NO_BUFFER_SPACE
   *
   * Not a slow machine and not a story that throws: the HOST ran out of socket
   * buffers, so Chromium could not fetch the story's chunk. Measured
   * immediately afterwards on that machine: 1172 sockets in TIME_WAIT, 1117 of
   * them to port 6007, after roughly 2900 story loads in one session. Each
   * test takes a fresh context and reconnects, so the total churn is the same
   * at any worker count — what the count changes is the PEAK, which is what
   * runs out.
   *
   * The record, all on the same laptop and the same build: six workers dropped
   * a check in two runs of two, four dropped one in the second of two runs, and
   * two passed 480 of 480. The honest reading is that the number is not the
   * finding — the socket pressure is — so the remedy is `--workers=2` on the
   * machine showing it, and NOT a retry: doc 10 §11 is explicit that a retry
   * turns a real failure into a coincidence, and this failure is real, it just
   * belongs to the host rather than to the library.
   */
  workers: process.env.CI ? 2 : '50%',

  /*
   * A REPORT WITH THE PICTURES IN IT, ON CI, AND THE REASON IS A FAILURE
   * NOBODY COULD READ.
   *
   * The workflow has uploaded `playwright-report/` on failure since the visual
   * suite existed, with a comment saying the diff images are the whole point
   * of a visual failure — "a report that says '13 differ' without showing them
   * is unactionable". Measured: **that directory was never created.** No
   * reporter was configured, so Playwright used its default, which is `list`
   * locally and `dot` on CI, and neither writes a report. The step uploaded
   * nothing for seven months of retention.
   *
   * It cost exactly what the comment predicted. `avatar-states` failed CI at
   * 289 pixels on a branch that changed no pixel, and the artefact that would
   * have said WHY did not exist. **This one's cause is not known and is
   * deliberately not guessed at** (§11.3).
   *
   * It is the second time that baseline has failed only on CI. On the FIRST —
   * 225 pixels — the cause was guessed wrong before the diff was opened:
   * assumed to be a broken-image glyph, and it turned out to be antialiasing
   * on every circular border. That is the whole argument for shipping the
   * pictures, and the sentence is split in two here because the single
   * sentence it replaces read as though the wrong guess belonged to the 289.
   *
   * `dot` stays for the console, because 480 lines of `✓` is what the log
   * looked like before it and the failures were the only thing anyone read.
   */
  reporter: process.env.CI
    ? [['dot'], ['html', { open: 'never' }]]
    : [['list']],

  /*
   * Playwright's own default, written down because the workflow now uploads
   * this path by name. `test-results/` is where the raw `-actual.png` and
   * `-diff.png` land side by side, which is one download and no HTML to
   * navigate; the html report embeds the same files, and having both is the
   * difference between reading a failure and re-running it to get a different
   * one.
   */
  outputDir: 'test-results',

  use: {
    baseURL: CATALOG_URL,
    /*
     * A fixed viewport, because a screenshot taken at a different size is a
     * different screenshot. Wide enough for the side-by-side stories.
     */
    viewport: { width: 1280, height: 900 },
    // Fixed too: a different scale factor rasterises text differently.
    deviceScaleFactor: 1,
    /*
     * THE THIRD OF DOC 10 §11'S THREE MACHINE VARIABLES, and the only one
     * still unpinned. §11 names speed, clock and configuration: the clock is
     * fixed by `e2e/clock` for the suites that need it, and the browser's TIME
     * ZONE was whatever the runner happened to be set to — a value no check
     * sets and no check can see. The calendar's own baseline has already
     * failed CI on a time zone once.
     *
     * UTC rather than a real place, because a place is a second fact to
     * remember. Nothing here should read it at all: doc 05 §3.1 says this
     * library never detects the zone, it receives one
     * ([decision 0023](../../docs/decisions/0023-today-comes-from-the-configured-zone.md)),
     * so pinning it is also a TEST of that claim — if a baseline moves when
     * the browser's zone changes, something is reading the browser's zone.
     *
     * Measured on the way in: all 196 baselines came back byte-identical in
     * the container with this line in place, which is that claim holding.
     */
    timezoneId: 'UTC'
  },

  expect: {
    toHaveScreenshot: {
      /*
       * ZERO tolerance, on purpose, and it takes BOTH of these.
       *
       * A pixel budget absorbs the difference between two machines AND real
       * one-pixel drift, and drift is exactly what this is for. The platform
       * problem is solved by generating every reference in the same container
       * (see the docker: scripts), not by agreeing to ignore differences.
       *
       * maxDiffPixelRatio alone does NOT do that, and for a long time this
       * file claimed it did. It bounds HOW MANY pixels may differ; `threshold`
       * bounds HOW MUCH one pixel may differ before it counts as differing at
       * all, and its default is 0.2 — a fifth of the colour space, per pixel,
       * silently allowed. Zero of an over-counted thing is still zero.
       *
       * Measured, with the default in place: moving a switch track from grey
       * step 3 to step 2 changed roughly 1760 pixels of a 271,360 pixel
       * capture, by nine units per channel, and the suite reported it as
       * identical. That is precisely the change this exists to catch, and it
       * is exactly the size of change small enough to slip under a per-pixel
       * threshold — large colour moves still failed, which is what made the
       * gap look like it was not there.
       */
      threshold: 0,
      maxDiffPixelRatio: 0,
      /*
       * Animations frozen at their end state, per doc 10 §6: an animation
       * mid-flight is a different picture every run. The tokens already
       * collapse durations to zero under reduced motion, and this covers
       * anything that slips through.
       */
      animations: 'disabled',
      // The caret blinks. A blinking caret is a screenshot that differs from
      // itself.
      caret: 'hide',
      scale: 'css'
    }
  },

  /*
   * References live beside the spec that takes them, with the platform in the
   * name. Only linux exists — generated in the container — and a name that
   * says so is what makes an accidental win32 reference obvious in review
   * rather than mysterious in CI.
   */
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{platform}{ext}',

  /*
   * Two projects, so that running "everything" cannot mean running the visual
   * suite by accident.
   *
   * The references are linux-only by design — generated in the container, so
   * that a screenshot taken here is byte-identical to one taken in CI, which
   * is what lets the tolerance stay at zero. But {platform} is part of the
   * path, so on Windows the suite looks for -win32 references, finds none,
   * fails, AND WRITES nineteen of them into the repository. They look
   * plausible, they carry a sensible name, and a stray `git add .` turns them
   * into a second set of baselines that CI can never agree with.
   *
   * testIgnore alone does not work: measured, it hides the file even when the
   * file is named on the command line, which would break the container run
   * too. Splitting into projects is what lets one command mean "everything
   * except the screenshots" and another mean "only the screenshots".
   */
  projects: [
    {
      name: 'checks',
      /*
       * THE ACCESSIBILITY SUITE IS IGNORED HERE, and that one line was worth
       * twelve minutes of every CI run.
       *
       * It used to live in this project, so `test:e2e` — which runs `checks`
       * and `narrow` — executed all 349 of its story checks, and then the next
       * CI step ran the identical suite again by name. Twelve minutes, twice,
       * for one set of results. A project of its own is what makes "run the
       * behaviour checks" and "run axe over every story" two different things
       * rather than one thing and a superset of it.
       */
      testIgnore: [
        '**/visual.spec.ts',
        '**/*.narrow.spec.ts',
        '**/accessibility.spec.ts'
      ]
    },
    {
      name: 'a11y',
      testMatch: ['**/accessibility.spec.ts'],
      /*
       * The one place tests inside a file are split across workers. It
       * generates one check per story from Storybook's own index — 484 of
       * them on 2026-09-11, and it was 357 when this was measured — and each
       * one loads a page and runs axe over it, sharing nothing with its
       * neighbours. Serial, that was 13.1 minutes; split, 4.6.
       */
      fullyParallel: true
    },
    { name: 'visual', testMatch: ['**/visual.spec.ts'] },
    /*
     * A third project, because this is the first batch of components whose
     * behaviour depends on the size of the WINDOW.
     *
     * Doc 04 §5 grants portalled components the one legitimate viewport
     * exception — their real container is the window — and `Dialog` uses it to
     * become full-screen when there is no room to be inset. None of that can
     * be checked at the fixed 1280×900 above, and widening the check by
     * resizing inside a test would fight the fixed viewport that every
     * screenshot depends on.
     *
     * 360×640 is a real small window rather than a device: doc 04 §4 forbids
     * naming these after hardware, and what matters is only that it is below
     * the threshold the CSS uses and above nothing.
     *
     * **Assertions only, no screenshots.** A screenshot here would need its own
     * baseline set, and `snapshotPathTemplate` carries the platform but not the
     * project — two projects photographing the same name would overwrite each
     * other's reference. Bounding boxes and computed styles need no baseline
     * and say more precisely what is being claimed.
     */
    {
      name: 'narrow',
      testMatch: ['**/*.narrow.spec.ts'],
      use: { viewport: { width: 360, height: 640 } }
    }
  ],

  /*
   * THE BUILT CATALOG, SERVED STATICALLY, and not the dev server.
   *
   * `storybook dev` compiles a story the first time it is asked for. Under a
   * full run that is a measurable hazard rather than a theoretical one: three
   * times in one evening a story spent the whole 30s test budget waiting for
   * its stylesheet while the server compiled it, each time in a full run and
   * never in isolation (`story.ts` records all three). A built directory has
   * nothing left to compile, so the wait it was timing out on cannot happen —
   * and parallel workers become safe, which is what makes the setting above
   * worth having.
   *
   * The build itself costs about ten seconds. It is not part of this command
   * on purpose: `verify:full` and CI build once, and a person iterating on one
   * spec builds once and re-runs against the server this reuses. Naming the
   * build here would pay it again on every invocation, and making it
   * conditional on the output being present would reintroduce exactly the
   * stale-artefact trap the separate port exists to close (see `e2e/catalog`).
   */
  webServer: {
    command: 'pnpm preview',
    url: CATALOG_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    stdout: 'ignore'
  }
});
