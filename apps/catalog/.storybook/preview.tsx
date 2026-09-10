import type { Decorator, Preview } from '@storybook/react-vite';
import { a11yParameter } from '../e2e/a11yRules';

/*
 * The stylesheet is the BUILT artifact; the components are the source.
 *
 * Worth stating precisely, because the split is deliberate and an earlier
 * version of this comment overstated it:
 *
 *   - `blackborne/styles.css` resolves through the workspace link to
 *     dist/styles.css, so the catalog renders against the compiled, prefixed
 *     CSS a consumer actually receives. That is where prefixing, the token
 *     layers and the absence of a global reset live, and none of it can be
 *     verified against source.
 *   - The components come from source, because the stories sit beside them and
 *     import them by relative path. That buys fast reloading while building.
 *
 * The consequence to remember: after changing anything under styles/, run
 * `pnpm --filter blackborne build` or the catalog keeps showing the old CSS.
 */
import 'blackborne/styles.css';
import './catalog.css';

/*
 * A RESIZABLE CONTAINER, not a resizable window.
 *
 * Doc 04 §10 is explicit that the real test is narrowing the container with
 * the window wide, because that is the situation a consumer is in: the same
 * component in a 320px side panel inside a 1920px screen. Storybook's viewport
 * tool resizes the iframe, which is the window — the wrong axis.
 *
 * So every story sits in a box with `resize: horizontal`. Drag its bottom-right
 * corner. Without this, half the responsive checklist cannot be checked at all
 * and the document becomes decorative.
 */
const resizableContainer: Decorator = Story => (
  /*
   * tabIndex, because `overflow: auto` makes this a scroll container and a
   * region only a mouse can scroll is a real WCAG 2.1.1 failure — even in a
   * catalog. It stays invisible until something inside actually overflows.
   *
   * Found by the automated pass on the first story with nothing focusable in
   * it: until then every story happened to contain a control, which gave the
   * region keyboard access by accident.
   *
   * Fixed here rather than silenced in the rule list, because that list is
   * rule-wide: excluding scrollable-region-focusable to quiet the catalog
   * would also excuse the first real scroll container the library ships.
   *
   * The lint rule below disagrees with axe here, and axe is the one measuring
   * the actual page: the rule's heuristic is "only interactive elements take
   * tabindex", which is right in general and wrong for a scroll container,
   * where focusability IS the keyboard affordance. Disabled on this line
   * rather than relaxed in eslint.config.js, so the exception stays one line
   * with its reason attached instead of becoming a repo-wide allowance that
   * also covers the library.
   */
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
  <div className="catalog-resizable" tabIndex={0}>
    <Story />
  </div>
);

const preview: Preview = {
  decorators: [resizableContainer],
  /*
   * THE ACCESSIBILITY PANEL RUNS WHEN A PERSON ASKS IT TO, and that one word
   * is the fix for a failure this suite reported once and nearly wrote off as
   * a flake.
   *
   * Read in the addon's own `afterEach`: it runs axe in the preview after
   * EVERY story render, and the three things that stop it are
   * `parameters.a11y.disable`, `parameters.a11y.test === 'off'` and this
   * global. Its default parameter is `test: 'todo'`, so removing our own
   * `test: 'error'` changed nothing at all — measured, and that is the step
   * that would have looked like the fix.
   *
   * What went wrong with it on: `AxeBuilder` injects a second axe engine over
   * `globalThis.axe` and calls `runPartial` on it, and if the addon's run has
   * not finished, that call lands on an engine mid-run and throws "Axe is
   * already running". Measured with an assertion added to the suite for
   * exactly this purpose — **11 of 480 stories** carried the flag before
   * injection under six workers, on each of two runs, and none at all in
   * isolation. With this line: three full runs of 480, clean. One run in
   * between showed a single failure on one story whose message was not
   * captured, so the assertion stays in the suite rather than coming out with
   * the cause — if there is a second path to it, the next occurrence names it
   * instead of looking like weather.
   *
   * `manual` rather than `test: 'off'` because it is the honest word: there IS
   * automated accessibility here, and it is `accessibility.spec.ts` walking
   * all 480 stories in the built catalog with the rule set below. This is the
   * PANEL, for a person with a story open, and it is a global so anyone can
   * turn it back on from the toolbar for one session.
   */
  initialGlobals: { a11y: { manual: true } },
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    /*
     * THE SAME RULE SET THE BUILD USES, from `e2e/a11yRules`. The panel and
     * `accessibility.spec.ts` are two things running axe over one catalog, and
     * they used to disagree about six rules: this addon disables exactly one
     * of its own (`region`) where the suite disables seven, all of them about
     * a PAGE that a story mounted at a root does not have.
     *
     */
    a11y: a11yParameter,
    options: {
      storySort: {
        order: ['Overview', 'Components', ['Button']]
      }
    }
  }
};

export default preview;
