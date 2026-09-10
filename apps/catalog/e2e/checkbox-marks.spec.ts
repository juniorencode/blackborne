/*
 * Exactly one mark, in every combination.
 *
 * This exists because of a reported bug: a checkbox that was both
 * indeterminate and selected drew the tick on top of the dash. The cause was
 * relying on utility order to resolve a conflict — two utilities of equal
 * specificity, whose winner is decided by whatever order the generator emits,
 * not by the order they are written in the component.
 *
 * Which is why this is a browser test and not a unit test: the question is
 * "what did the browser actually paint", and jsdom applies no stylesheet.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const STORY = 'components-checkbox--marks';

const CASES = [
  { id: 'mark-none', check: false, dash: false },
  { id: 'mark-selected', check: true, dash: false },
  { id: 'mark-indeterminate', check: false, dash: true },
  // The reported bug. A mixed state is mixed regardless of the underlying
  // value, so indeterminate wins and the tick stays hidden.
  { id: 'mark-both', check: false, dash: true }
] as const;

/**
 * The computed `display` of both marks.
 *
 * Not Playwright's toBeVisible: that requires a non-empty bounding box, and
 * the dash is a horizontal stroke whose geometric box is zero pixels tall. It
 * reported the dash as hidden while the browser was painting it perfectly.
 *
 * The rule under test is which mark is DISPLAYED, so that is what is asserted.
 */
const displays = async (page: import('@playwright/test').Page, id: string) =>
  page.getByTestId(id).evaluate(row => ({
    tick: getComputedStyle(row.querySelector('.bb-checkbox-check')!).display,
    dash: getComputedStyle(row.querySelector('.bb-checkbox-dash')!).display
  }));

test.beforeEach(async ({ page }) => {
  await gotoStory(page, STORY);
});

/**
 * Everything the answer depends on, for when the answer is wrong.
 *
 * `mark-selected` failed once inside a full run and passed nine times out of
 * nine in isolation, so there is no reproduction to work from — and a check
 * that fails without evidence is a check that gets rerun until it passes,
 * which is how a real intermittent bug becomes folklore. `story.ts` was given
 * the same treatment when its wait started timing out: an eliminated
 * hypothesis is worth more than a guess, and neither is worth anything without
 * a measurement.
 *
 * The state attributes are the input to the rule under test, and the
 * stylesheet count says whether the sheet that carries the rule had arrived.
 */
const evidence = async (page: import('@playwright/test').Page, id: string) =>
  page.getByTestId(id).evaluate(row => {
    const control = row.querySelector('[data-rac]');
    return {
      attributes: Object.fromEntries(
        [...(control?.attributes ?? [])]
          .filter(attribute => attribute.name.startsWith('data-'))
          .map(attribute => [attribute.name, attribute.value])
      ),
      sheets: document.styleSheets.length,
      layerThree: [...document.styleSheets].some(sheet => {
        try {
          return [...sheet.cssRules].some(rule =>
            rule.cssText.includes('bb-checkbox-dash')
          );
        } catch {
          return false;
        }
      })
    };
  });

for (const { id, check, dash } of CASES) {
  test(`${id}: tick ${check ? 'shown' : 'hidden'}, dash ${dash ? 'shown' : 'hidden'}`, async ({
    page
  }) => {
    const marks = await displays(page, id);
    const context = JSON.stringify(await evidence(page, id));

    expect(marks.tick, context).toBe(check ? 'block' : 'none');
    expect(marks.dash, context).toBe(dash ? 'block' : 'none');
  });
}

test('the two marks are never shown at once', async ({ page }) => {
  for (const { id } of CASES) {
    const marks = await displays(page, id);
    const both = marks.tick !== 'none' && marks.dash !== 'none';
    // The reported bug, stated as an invariant rather than as one case.
    expect(both, `${id} shows both marks`).toBe(false);
  }
});

/*
 * Indeterminate in the pattern it exists for.
 *
 * The static rows above hold their state on purpose, which makes them look
 * unresponsive — that is what prompted the question "is this a bug?". It is
 * not: the component is controlled and does what it is told. These tests
 * assert the other half, which the static rows cannot show: that when the
 * consumer stops saying "indeterminate", the component stops drawing it.
 */
test.describe('select all', () => {
  const PARENT = 'All notifications';

  test.beforeEach(async ({ page }) => {
    await gotoStory(page, 'components-checkbox--select-all-pattern');
  });

  /*
   * Click the LABEL, not the input.
   *
   * The base renders a visually hidden input inside a label, so the input has
   * no hit target of its own — clicking it is not what a person does and
   * Playwright rightly refuses. The label is the control as far as anyone
   * using it is concerned.
   */
  const toggle = (page: import('@playwright/test').Page, text: string) =>
    page.locator('label').filter({ hasText: text }).first().click();

  const marks = (page: import('@playwright/test').Page) =>
    page.getByRole('checkbox', { name: PARENT }).evaluate(input => {
      /*
       * NOTHING IN HERE MAY THROW, and that is a property of the poll below
       * rather than caution for its own sake. Measured: `expect.poll` does NOT
       * retry a callback that throws — it propagates on the FIRST call, so a
       * timeout of five seconds is worth nothing to a callback that
       * dereferences something the render has not produced yet.
       *
       * `getComputedStyle(null)` throws, and both marks are read through a
       * `querySelector` that can answer null. Returning "missing" instead
       * turns a mark that is not there yet into another poll rather than into
       * a failed test. No failure here has been attributed to it — this is a
       * weakness removed, not a cause fixed.
       */
      const row = input.closest('label')?.parentElement ?? null;
      const displayOf = (selector: string) => {
        const found = row?.querySelector(selector);
        return found === null || found === undefined
          ? 'missing'
          : getComputedStyle(found).display;
      };

      return {
        tick: displayOf('.bb-checkbox-check'),
        dash: displayOf('.bb-checkbox-dash')
      };
    });

  /* Polled, because the marks change after a state update rather than with it. */
  const expectMarks = async (
    page: import('@playwright/test').Page,
    expected: { tick: string; dash: string }
  ) => {
    await expect.poll(() => marks(page)).toEqual(expected);
  };

  test('some but not all shows the dash', async ({ page }) => {
    // Email starts on, so the parent is partly selected from the first render.
    await expectMarks(page, { tick: 'none', dash: 'block' });
  });

  test('selecting every child turns the dash into a tick', async ({ page }) => {
    await toggle(page, 'SMS');
    await toggle(page, 'Push');

    // The consumer stopped saying "indeterminate", so the component stopped
    // drawing it. That is the half a held row cannot demonstrate.
    await expectMarks(page, { tick: 'block', dash: 'none' });
  });

  test('clearing every child leaves no mark at all', async ({ page }) => {
    await toggle(page, 'Email');
    await expectMarks(page, { tick: 'none', dash: 'none' });
  });

  test('pressing the parent while mixed selects everything', async ({
    page
  }) => {
    await toggle(page, PARENT);

    for (const name of ['Email', 'SMS', 'Push']) {
      await expect(page.getByRole('checkbox', { name })).toBeChecked();
    }
    await expectMarks(page, { tick: 'block', dash: 'none' });
  });
});
