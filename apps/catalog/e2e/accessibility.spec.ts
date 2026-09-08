/*
 * Automated accessibility, run against every story in the catalog.
 *
 * Doc 06 §5 is deliberately modest about what this layer is worth: it catches
 * "a small fraction — contrast, missing labels, malformed ARIA. It does not
 * detect whether the order is logical or whether the keyboard works." It is a
 * cheap filter, not a guarantee, and the keyboard test done by hand still has
 * the better cost-benefit ratio of the two.
 *
 * But it is cheap and it never gets tired, and the things it does catch are
 * things nobody notices by looking: a contrast ratio that drifted below 4.5:1
 * when a token moved, an aria-describedby pointing at an id that no longer
 * exists.
 *
 * The story list comes from Storybook's own index, so a new story is covered
 * the moment it exists rather than when someone remembers to add it here.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

type StoryEntry = { id: string; name: string; title: string; type: string };

/*
 * The story list is read at COLLECTION time, from Storybook's own index, so a
 * new story is covered the moment it exists rather than when someone
 * remembers to add it here.
 *
 * Read synchronously because Playwright needs the test names before the
 * suite runs. The catalog has to be up — which the webServer config
 * guarantees.
 */
const INDEX_URL = 'http://127.0.0.1:6006/index.json';

const stories: StoryEntry[] = await fetch(INDEX_URL)
  .then(
    response =>
      response.json() as Promise<{ entries: Record<string, StoryEntry> }>
  )
  .then(index =>
    Object.values(index.entries).filter(entry => entry.type === 'story')
  )
  .catch(() => []);

/*
 * One test per story rather than one loop over all of them.
 *
 * A single test walking sixty stories exceeded the timeout, and worse: a
 * failure would name the test rather than the story that failed. Per-story
 * tests report exactly what broke.
 */
test.describe('automated accessibility', () => {
  test('the catalog is reachable and has stories', () => {
    expect(
      stories.length,
      `no stories found at ${INDEX_URL}; is the catalog running?`
    ).toBeGreaterThan(10);
  });

  for (const entry of stories) {
    test(`${entry.title} / ${entry.name}`, async ({ page }) => {
      await gotoStory(page, entry.id);
      await page.evaluate(() => document.fonts.ready);

      /*
       * Wait for the page to settle before analysing.
       *
       * The colour-contrast rule needs a laid-out, painted page: it samples
       * computed colours from real geometry, and on a page still settling it
       * declines to run rather than guessing — silently. Without this wait
       * the suite reported every story passing while contrast was never
       * checked at all.
       *
       * The failure mode of an automated check is usually silence, not a
       * false alarm, which is why the assertion below exists.
       */
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        /*
         * EVERY rule runs, and the ones that do not apply are excluded by
         * name below.
         *
         * The first version of this filtered by WCAG tags, which read as the
         * careful choice and was the opposite. `color-contrast` does not
         * carry those tags, so filtering by them silently dropped the single
         * most valuable check in the set — and it was dropped quietly, which
         * is worse than not having it: the suite reported 62 passing stories
         * while a field error message sat at 3.91:1 against a 4.5:1
         * requirement.
         *
         * Found by breaking the contrast on purpose and watching the suite
         * stay green. A check that cannot fail is not a check.
         */
        .disableRules([
          /*
           * Page-structure rules. Every story is a fragment mounted at the
           * root, so there is no page for it to structure. Landmarks and
           * heading hierarchy belong to the consuming application (doc 06 §2,
           * third column) — asserting them here would measure the catalog
           * rather than the library.
           */
          'region',
          'page-has-heading-one',
          'landmark-one-main',
          'html-has-lang',
          'html-lang-valid',
          'document-title',
          /*
           * The catalog's own iframe wrapper, not something the library
           * renders.
           */
          'meta-viewport'
        ])
        .analyze();

      /*
       * Reported as a list rather than a count, with the selector of each
       * offending node: "3 violations" sends someone hunting, and the
       * selector puts them on the element.
       */
      const failures = results.violations.map(violation => {
        const where = violation.nodes
          .slice(0, 3)
          .map(node => node.target.join(' '))
          .join(', ');
        return [
          `${violation.id} (${violation.impact}): ${violation.help}`,
          `    at: ${where}`
        ].join('\n');
      });

      /*
       * The suite must be able to fail. Contrast is the most valuable rule in
       * the set and the easiest to lose silently — it was lost twice while
       * this file was written, once to a tag filter and once to a missing
       * wait, and both times the suite went green rather than red.
       *
       * Asserting that the rule RAN is what turns either mistake into a red
       * test instead of a quiet one that checks less than it claims.
       */
      const contrastChecked = [
        ...results.passes,
        ...results.violations,
        ...results.incomplete
      ].some(result => result.id === 'color-contrast');

      /*
       * One narrow exemption: a story with no text at all. A skeleton is
       * placeholder shapes and nothing else, so the contrast rule has nothing
       * to measure and reports neither a pass nor a violation — which is not
       * the rule going missing, it is the rule having no work.
       *
       * Checked rather than listed by name, so it applies to the next text-free
       * component too and cannot quietly cover a story that HAS text and lost
       * the rule anyway.
       *
       * A second exemption was added here and then removed, and the reason is
       * worth keeping: several modal layers open at once make each other
       * `inert`, and axe skips inert subtrees, so a story showing two dialogs
       * side by side has no measurable text and would need excusing. The
       * exemption was the wrong fix — the STORY was wrong. A layer is now
       * photographed one at a time, so nothing needs excusing and this guard
       * stays strict.
       */
      const hasText = await page.evaluate(
        () =>
          (
            document.querySelector('#storybook-root') as HTMLElement | null
          )?.innerText.trim().length !== 0
      );

      /*
       * When this guard fires, it says what axe DID return.
       *
       * It has fired twice on stories that pass in isolation — once on
       * `EmptyState / Narrow Container`, once on `Alert / All Axes`, roughly
       * one story-check in seven hundred, a different story each time. Two
       * hypotheses are eliminated: it is not the stylesheet arriving late (the
       * wait for a resolved token predates it) and it is not the first paint
       * (`gotoStory` now waits for a rendered frame, and it recurred with that
       * in place).
       *
       * So the next occurrence needs to carry evidence rather than a bare
       * "did not run". How many rules axe ran at all separates "axe was cut
       * short" from "this rule was skipped", and those have different fixes.
       */
      const ran = {
        rules: new Set(
          [...results.passes, ...results.violations, ...results.incomplete].map(
            r => r.id
          )
        ).size,
        incomplete: results.incomplete.map(r => r.id).join(', ') || 'none',
        inapplicable: results.inapplicable.some(r => r.id === 'color-contrast')
      };

      expect(
        contrastChecked || !hasText,
        [
          'the colour-contrast rule did not run; the suite is reporting less than it claims.',
          `axe ran ${ran.rules} rules in total.`,
          `incomplete: ${ran.incomplete}.`,
          `color-contrast reported inapplicable: ${ran.inapplicable}.`,
          'A low rule count means axe was cut short, which is a load problem.',
          'A high count with contrast inapplicable means the page genuinely had',
          'nothing to measure, which is a story problem.'
        ].join(' ')
      ).toBe(true);

      expect(failures, failures.join('\n\n')).toEqual([]);
    });
  }
});
