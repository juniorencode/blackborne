import { defineConfig } from '@playwright/test';

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
  use: {
    baseURL: 'http://127.0.0.1:6006',
    /*
     * A fixed viewport, because a screenshot taken at a different size is a
     * different screenshot. Wide enough for the side-by-side stories.
     */
    viewport: { width: 1280, height: 900 },
    // Fixed too: a different scale factor rasterises text differently.
    deviceScaleFactor: 1
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
    { name: 'checks', testIgnore: ['**/visual.spec.ts'] },
    { name: 'visual', testMatch: ['**/visual.spec.ts'] }
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000
  }
});
