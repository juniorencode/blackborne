/*
 * Visual regression.
 *
 * What it is for, precisely: changing a token and knowing within a minute
 * WHICH components changed appearance, instead of opening them one at a time.
 * Doc 10 §6 calls it the only thing that makes touching tokens safe once there
 * are thirty components — and it was adopted early, at ten, because approving
 * ten baselines is an afternoon and approving thirty is not.
 *
 * It does not detect that something is wrong. It detects that something
 * CHANGED, and a person decides whether the change was intended. That decision
 * is the whole value: updating baselines without looking gives you the cost
 * and none of the benefit.
 *
 * ---
 *
 * Not every story is captured. Sixty screenshots would be slow, and most would
 * be near-duplicates that fail together and teach nothing. What is captured:
 *
 *   - one per component showing EVERY state, which is where a token change
 *     surfaces
 *   - the pages that put components together, which doc 09 §10 calls the check
 *     that finds the most
 *   - the three theme axes, on the composite pages rather than on every
 *     component (doc 10 §6)
 *
 * Doc 10 §6's four conditions are met in playwright.config.ts: animations
 * disabled, fixed viewport and scale, caret hidden, and every change approved
 * explicitly. Sample data is fixed by construction — the stories contain no
 * dates, ids or random values.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

/*
 * Refuse to run anywhere but linux.
 *
 * The references exist for linux alone, on purpose — they are generated in the
 * container so that a capture taken on a laptop is byte-identical to one taken
 * in CI, which is what lets the tolerance stay at zero. The platform is part
 * of the reference filename, so running this suite on Windows or macOS finds
 * nothing to compare against, fails, and writes a fresh set of references
 * named for that platform. They look entirely plausible. Committing them by
 * accident gives the repository two sets of baselines that can never agree.
 *
 * A refusal that says where to go is better than a red run that leaves
 * nineteen files behind.
 */
test.beforeAll(() => {
  if (process.platform !== 'linux') {
    throw new Error(
      `The visual baselines exist for linux only, and this is ${process.platform}. ` +
        'Run `pnpm visual` from the repository root: it runs this same suite ' +
        'inside the container the references were generated in. Running it ' +
        'here would write a second set that CI can never match.'
    );
  }
});

/**
 * One screenshot of a whole story.
 *
 * Fonts are awaited before capturing: text measured before its font loads is
 * laid out differently, and that is the classic source of a screenshot that
 * differs from itself (doc 10 §6).
 */
const capture = async (
  page: import('@playwright/test').Page,
  id: string,
  name: string
) => {
  // gotoStory, not page.goto: it waits for the story to MOUNT. Without that
  // this line can photograph an empty page, and --update-snapshots has nothing
  // to match against, so the empty page becomes the committed reference. See
  // the note on gotoStory.
  await gotoStory(page, id);

  // The story root, not the viewport: a full-page shot would include the
  // scrollbar, which differs between platforms even inside one container.
  await expect(page.locator('body')).toHaveScreenshot(`${name}.png`);
};

/*
 * Every state of every component. These are the baselines a token change
 * lands on: alter --bb-border and this is the set that tells you where.
 */
const STATES: Array<[string, string]> = [
  ['components-button--states', 'button-states'],
  ['components-textfield--states', 'textfield-states'],
  ['components-textarea--states', 'textarea-states'],
  ['components-numberfield--states', 'numberfield-states'],
  ['components-checkbox--states', 'checkbox-states'],
  ['components-radiogroup--states', 'radiogroup-states'],
  ['components-switch--states', 'switch-states'],
  ['components-checkbox--marks', 'checkbox-marks'],
  ['components-badge--tones', 'badge-tones'],
  ['components-badge--states', 'badge-states'],
  ['components-alert--together', 'alert-together'],
  ['components-emptystate--the-two-states', 'emptystate-two-states'],
  ['components-separator--orientations', 'separator-orientations'],
  ['components-skeleton--variants', 'skeleton-variants'],
  ['components-card--containers', 'card-containers'],
  /*
   * A component with nothing to look at still earns a baseline, and this is
   * the one that earns it most: the story is two rulers that must stay the
   * same width. If the hiding ever stops working, the picture changes — which
   * is the only way a sighted reviewer would ever notice.
   */
  [
    'components-visuallyhidden--takes-no-space',
    'visuallyhidden-takes-no-space'
  ],
  ['components-searchfield--states', 'searchfield-states'],
  ['components-checkboxgroup--states', 'checkboxgroup-states'],
  /*
   * The trailing edge, which doc 07 §2.2 settles and which no other baseline
   * would catch: the clear button present, absent because the field is empty,
   * and absent because the field is busy. Three states of the same pixels,
   * decided by rules that live in three different places.
   */
  ['components-searchfield--the-trailing-edge', 'searchfield-trailing-edge'],
  /*
   * Two components people pick the wrong one of. The same reason the catalog
   * already puts Switch beside Checkbox — doc 09 §10.
   */
  [
    'components-checkboxgroup--against-radio-group',
    'checkboxgroup-vs-radiogroup'
  ],
  /*
   * Decision 0011 in one picture: the same fields with the stepper off, on,
   * and overruled by a busy state. What to look at is the width of usable
   * box, because that is the argument the decision makes.
   */
  ['components-numberfield--the-stepper', 'numberfield-stepper'],
  /*
   * Affixes and alignment, on both fields that take them. The Arabic panel is
   * the one that earns its place: `end` is the left-hand side there, and a
   * physical value would have been invisible in English.
   */
  ['components-textfield--affixes-and-alignment', 'textfield-affixes'],
  ['components-numberfield--affixes-and-alignment', 'numberfield-affixes'],
  /*
   * The counter, including the panel where the same limit is written in two
   * languages — the one place a field writes a number of its own.
   */
  ['components-textfield--character-count', 'textfield-counter'],
  ['components-textarea--character-count', 'textarea-counter'],
  /*
   * The clear button, and the panel that matters: four states where it has
   * nothing to offer and still holds its width. If the room ever stops being
   * reserved, those four boxes get wider than the ones beside them.
   */
  ['components-textfield--clearing', 'textfield-clearing'],
  ['components-tagsinput--states', 'tagsinput-states'],
  ['components-passwordfield--states', 'passwordfield-states'],
  /*
   * The three stories that photograph a rule rather than a component.
   *
   * A pasted block split into values; the reveal toggle surviving a busy state
   * where every other edge control yields (doc 07 §2.2 rule 2); and a text
   * area grown to its content beside a fixed one with the same words in it.
   */
  ['components-tagsinput--pasting-a-block', 'tagsinput-pasting'],
  [
    'components-passwordfield--the-trailing-edge',
    'passwordfield-trailing-edge'
  ],
  ['components-textarea--growing', 'textarea-growing'],
  ['components-radiogroup--card-states', 'radiogroup-card-states'],
  /*
   * The card variant beside the plain one, which is the only way to see
   * whether the two read as one component (doc 09 §10) — and the numeric
   * cross, where the third panel is rule 4 refusing two controls at one edge.
   */
  ['components-radiogroup--cards', 'radiogroup-cards'],
  ['components-numberfield--clearing', 'numberfield-clearing']
];

for (const [id, name] of STATES) {
  test(`states: ${name}`, async ({ page }) => {
    await capture(page, id, name);
  });
}

/*
 * The composite pages. Doc 09 §10: "component by component everything looks
 * correct; together is where the three greys you thought were one show up."
 * These are the highest-value baselines in the file.
 */
const TOGETHER: Array<[string, string]> = [
  ['components-checkbox--in-a-form', 'form-light-normal'],
  ['components-checkbox--in-a-form-dark-compact', 'form-dark-compact'],
  ['components-numberfield--aligns-with-others', 'alignment-across-controls'],
  ['components-textfield--aligns-with-button', 'alignment-field-and-button']
];

for (const [id, name] of TOGETHER) {
  test(`together: ${name}`, async ({ page }) => {
    await capture(page, id, name);
  });
}

/*
 * The theme axes. Captured on stories that already show two scopes side by
 * side, so one screenshot covers both halves of an axis — and a difference
 * between them is visible in the image itself, not only in the diff.
 */
const AXES: Array<[string, string]> = [
  ['components-button--modes', 'axis-modes'],
  ['components-button--densities', 'axis-densities'],
  ['components-button--direction', 'axis-direction'],
  ['components-button--brand-override', 'axis-brand'],
  ['components-button--all-axes', 'axis-all-at-once'],
  ['components-numberfield--locales', 'axis-locales'],
  ['components-switch--direction', 'axis-switch-direction']
];

for (const [id, name] of AXES) {
  test(`axis: ${name}`, async ({ page }) => {
    await capture(page, id, name);
  });
}
