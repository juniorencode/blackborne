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
       * ONE NARROW EXEMPTION: a story with no text AXE WILL MEASURE.
       *
       * The obvious version of this — no text at all — is what a skeleton
       * needs: placeholder shapes and nothing else, so the rule has no work
       * rather than going missing. It was the whole exemption until a story
       * turned up with text that axe declines to measure, which is a different
       * thing and had to be measured to be believed.
       *
       * **axe does not check the contrast of Arabic text**, and the reason is
       * mechanical. Its `color-contrast` rule ignores anything it takes for an
       * icon-font ligature, and it decides that by rendering the text to a
       * canvas and comparing the width of the whole string against the sum of
       * its characters measured one at a time:
       *
       *     sizeDifference = 1 - actualWidth / expectedWidth   // >= 0.15: icon
       *
       * Arabic is a cursive script: its letters join, so a string is far
       * narrower than its characters measured in isolation. Measured at 30px
       * `system-ui`, the trigger of the story that found this is 241.9px wide
       * against an expected 314.5 — a difference of **0.231**, and another
       * Arabic string in the same story gives 0.267. The same sentence in Latin
       * gives exactly **0**. So every Arabic string in this catalog is
       * classified as an icon and skipped, and `Components/Preview / RTL` was
       * simply the first story whose ONLY visible text was Arabic.
       *
       * The consequence is written down in doc 06 §5, because it is a hole in
       * this layer of verification rather than a quirk of one story: **no
       * Arabic text in this catalog has ever had its contrast checked.** What
       * makes that survivable is that contrast is a property of the colour
       * PAIR and not of the script, and every pair also appears in Latin text
       * somewhere. What it forbids is translating a story to make a contrast
       * finding go away.
       *
       * So the exemption asks AXE'S OWN classifier rather than reimplementing
       * that heuristic — `axe.commons.text.isIconLigature`, reached the
       * documented way through `axe.setup()` and the virtual tree. If axe ever
       * stops declining Arabic, this exemption stops applying by itself and the
       * coverage arrives with no change here.
       *
       * A different exemption was added once and then removed, and the reason
       * is worth keeping: several modal layers open at once make each other
       * `inert`, and axe skips inert subtrees, so a story showing two dialogs
       * side by side had no measurable text and would have needed excusing.
       * That was the wrong fix — the STORY was wrong. A layer is now shown one
       * at a time, so nothing needs excusing there and this guard stays strict.
       *
       * What `inert` does cost is narrower and is recorded at the walk below:
       * ONE open layer is enough to make the page behind it inert, so the walk
       * counts only the text axe would actually reach. That is not a second
       * exemption — it is this counter agreeing with axe about what there was
       * to measure.
       */
      const text = await page.evaluate(() => {
        const axe = (
          window as unknown as {
            axe?: {
              setup?: (node?: Node) => unknown;
              teardown?: () => void;
              utils: { getNodeFromTree: (node: Node) => unknown };
              commons: {
                text: { isIconLigature: (v: unknown) => boolean };
                dom: {
                  isVisibleOnScreen: (v: unknown) => boolean;
                  isVisibleToScreenReaders: (v: unknown) => boolean;
                };
              };
            };
          }
        ).axe;

        const root = document.querySelector('#storybook-root');
        const declined: string[] = [];
        if (root === null) return { total: 0, measurable: 0, declined };

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
          if ((n.nodeValue ?? '').trim() !== '') nodes.push(n as Text);
        }
        if (nodes.length === 0 || axe === undefined) {
          return { total: nodes.length, measurable: nodes.length, declined };
        }

        /*
         * `axe.setup` builds the virtual tree that `axe.commons` needs; the run
         * that produced `results` has already torn its own down.
         */
        axe.setup?.(document);
        let total = 0;
        let measurable = 0;
        for (const node of nodes) {
          let isIcon: boolean;
          try {
            /*
             * TEXT AXE WILL NOT LOOK AT IS NOT COUNTED AT ALL, and that has to
             * be said out loud because the obvious walk over text nodes gets it
             * wrong in two different ways.
             *
             * The exemption this feeds used to be `innerText.trim() === ''`,
             * and `innerText` respects visibility — so a story whose only text
             * sat inside a `VisuallyHidden` was exempt for the right reason.
             * A raw tree walk sees that text, would have counted it as
             * measurable, and would have started failing a story axe never
             * looked at. Measured on the way in: no story in the catalog is in
             * that state today, which is exactly when a trap is cheap to close.
             *
             * The second way is INERT, and it took an open select in Arabic to
             * find. While a modal layer is open the base marks everything
             * outside it `inert` — measured: `.catalog-layer-stage` and the
             * fixture's own `.catalog-label`, so the trigger, its label and the
             * page behind are all inside an inert subtree — and axe's contrast
             * rule does not look inside one. The proof is that story: a Latin,
             * painted, non-ligature `<p>` sat in it and the rule still reported
             * `inapplicable`. So in EVERY open-layer story the only text axe
             * measures is the layer's own, and a counter that reads the whole
             * page claims coverage that does not exist.
             *
             * Both predicates are axe's OWN helpers rather than a
             * reimplementation, and a node has to pass both: painted, and not
             * excluded from the tree. `isVisibleOnScreen` is what the contrast
             * rule itself calls, and `isVisibleToScreenReaders` is what returns
             * false for the inert subtree above.
             */
            const virtual = axe.utils.getNodeFromTree(node);
            if (virtual === undefined || virtual === null) {
              total++;
              measurable++;
              continue;
            }
            const parent = axe.utils.getNodeFromTree(
              node.parentElement as Node
            );
            if (
              parent !== undefined &&
              parent !== null &&
              (!axe.commons.dom.isVisibleOnScreen(parent) ||
                !axe.commons.dom.isVisibleToScreenReaders(parent))
            ) {
              continue;
            }
            isIcon = axe.commons.text.isIconLigature(virtual);
          } catch {
            /*
             * A classifier that cannot be reached counts as measurable, so the
             * guard errs towards firing rather than towards excusing.
             */
            total++;
            measurable++;
            continue;
          }
          total++;
          if (isIcon) declined.push((node.nodeValue ?? '').trim().slice(0, 24));
          else measurable++;
        }
        axe.teardown?.();

        return { total, measurable, declined };
      });

      const hasMeasurableText = text.measurable > 0;

      /*
       * When this guard fires, it says what axe DID return.
       *
       * It has fired three times on stories that pass in isolation —
       * `EmptyState / Narrow Container`, `Alert / All Axes`, and on
       * 2026-09-09 `Toast / Light`, in a wave that touched none of them.
       * Roughly one story-check in seven hundred, a different story each time,
       * and it has never recurred on a re-run. Two hypotheses are eliminated:
       * it is not the stylesheet arriving late (the wait for a resolved token
       * predates it) and it is not the first paint (`gotoStory` now waits for a
       * rendered frame, and it recurred with that in place).
       *
       * AND A THIRD OCCURRENCE TAUGHT SOMETHING ABOUT THE INSTRUMENT RATHER
       * THAN THE FAULT: the evidence below reached nobody, because the run
       * used Playwright's `line` reporter and its progress output overwrites
       * itself with carriage returns, so the failure body was gone from the
       * log by the time anybody read it. A full-suite run that might catch
       * this needs `--reporter=list`. A guard that carries evidence into a
       * reporter that discards it is a guard that carries none.
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
        contrastChecked || !hasMeasurableText,
        [
          'the colour-contrast rule did not run; the suite is reporting less than it claims.',
          `axe ran ${ran.rules} rules in total.`,
          `incomplete: ${ran.incomplete}.`,
          `color-contrast reported inapplicable: ${ran.inapplicable}.`,
          `text nodes: ${text.total}, of which axe will measure ${text.measurable}.`,
          text.declined.length === 0
            ? 'axe declined none of them as icon ligatures.'
            : `axe declined these as icon ligatures: ${text.declined.join(' | ')}.`,
          'Compare the rule count against a healthy story of the same component:',
          'one rule fewer means this rule alone was skipped, and more missing than',
          'that means axe was cut short, which is a load problem.'
        ].join(' ')
      ).toBe(true);

      expect(failures, failures.join('\n\n')).toEqual([]);
    });
  }
});
