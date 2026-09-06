/*
 * Visual regression.
 *
 * What it is for, precisely: changing a token and knowing within a minute
 * WHICH components changed appearance, instead of opening them one at a time.
 * Doc 10 §6 calls it the only thing that makes touching tokens safe once there
 * are thirty components — and it is adopted now, at ten, because approving ten
 * baselines is an afternoon and approving thirty is not.
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
 *   - the three theme axes, on the composite pages rather than on all ten
 *     components (doc 10 §6)
 *
 * Doc 10 §6's four conditions are met in playwright.config.ts: animations
 * disabled, fixed viewport and scale, caret hidden, and every change approved
 * explicitly. Sample data is fixed by construction — the stories contain no
 * dates, ids or random values.
 */
import { expect, test } from '@playwright/test';

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

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
  await page.goto(story(id));
  await page.evaluate(() => document.fonts.ready);
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
  ['components-checkbox--marks', 'checkbox-marks']
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
