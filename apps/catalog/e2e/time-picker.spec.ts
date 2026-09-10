/*
 * A time chosen from a list, and what only a browser answers.
 *
 * The trigger, the panel, the keyboard and the list's width are `Select`'s and
 * are measured in `select.spec.ts` — this component is that component with its
 * rows generated, which is the point. So what is here is what is NEW: the rows
 * themselves in a real Intl, the value that crosses the boundary while the
 * words on the screen change with the locale, and the typeahead landing on
 * what a row SAYS rather than on what it holds.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-timepicker--overview';
const OPENED = 'components-timepicker--opened';
const LOCALES = 'components-timepicker--in-every-locale';
const STATES = 'components-timepicker--states';
const RTL = 'components-timepicker--direction';

test('the rows are the step, and the bounds are on the list', async ({
  page
}) => {
  await gotoStory(page, OPENED);

  /*
   * SCOPED TO ONE LIST, because the story photographs two pickers side by side
   * and both of them are open — and a list is in a PORTAL, so neither set of
   * rows is a descendant of the panel that opened it. Reading `[role=option]`
   * off the page would have found sixteen rows in a story about eight.
   */
  const rows = await page
    .getByRole('listbox')
    .first()
    .evaluate(list =>
      [...list.querySelectorAll('[role=option]')].map(one => one.textContent)
    );

  /*
   * Half-hour steps from nine to twelve, both ends included, with the no-time
   * row first. Every reachable value is a row, which is what §7 of the catalog
   * asked of the list-shaped picker — and it is only possible because the step
   * bounds the count.
   */
  expect(rows).toEqual([
    'No time',
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM'
  ]);
});

test('the same value reads three ways and crosses as one', async ({ page }) => {
  await gotoStory(page, LOCALES);

  const perLocale = await page.locator('.catalog-panel').evaluateAll(panels =>
    panels.map(panel => ({
      locale: panel.querySelector('.catalog-label')?.textContent,
      value: panel.querySelector('.bb-select-value')?.textContent
    }))
  );

  /*
   * THE MEASUREMENT BEHIND DECISION 0020, in a real Intl rather than in jsdom.
   * `en-US` and `es-PE` are BOTH twelve-hour locales and they disagree about
   * how to write the marker — the spacing and the full stops included — while
   * `ja-JP` shows twenty-four hours and no marker at all. Three strings for one
   * value, which is why the value is `14:00` and not any of them.
   */
  expect(perLocale.map(one => one.locale)).toEqual([
    'English',
    'Spanish (Peru)',
    'Japanese'
  ]);
  expect(perLocale[0]?.value).toBe('2:00 PM');
  expect(perLocale[1]?.value).toBe('2:00 p. m.');
  expect(perLocale[2]?.value).toBe('14:00');

  /* And the three of them are three different strings, which is the argument. */
  expect(new Set(perLocale.map(one => one.value)).size).toBe(3);

  /*
   * READ FROM THE TRIGGERS, with the lists closed, and that is deliberate.
   * A second check walked the whole page for rows in three vocabularies at
   * once, and it went with the story: three open lists in one picture are
   * three PORTALLED lists that no panel contains, so the picture was a mess
   * and the check was asserting the page rather than a component. The rows
   * themselves are asserted one list at a time above.
   */
});

test('choosing a row reports the twenty-four hour string', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const readout = page.locator('.catalog-label').last();
  await expect(readout).toHaveText('Nothing chosen');

  await page.getByRole('button', { name: /Opens at/ }).click();
  /*
   * `exact`, because a name match is a SUBSTRING match by default and
   * "2:15 PM" is inside "12:15 PM" — which a list of times has one of for
   * every hour. The first version of this resolved to two rows and said so.
   */
  await page.getByRole('option', { name: '2:15 PM', exact: true }).click();

  /*
   * The row said "2:15 PM" and the value is `14:15`. That is the boundary
   * decision 0020 settles, and this is the check that reads both halves of it
   * in one place.
   */
  await expect(readout).toHaveText('Value: 14:15');
});

test('typing jumps by what a row says', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const trigger = page.getByRole('button', { name: /Opens at/ });
  await trigger.focus();
  await page.keyboard.press('Enter');

  const list = page.getByRole('listbox');
  await expect(list).toBeVisible();

  /*
   * `Select`'s typeahead, and the reason it is asserted HERE rather than left
   * to that component: the base derives what typing matches from a row's
   * CHILDREN, and this component's children are a formatted time. So the
   * typeahead follows the locale too — you type what you see, which in
   * Japanese would be `14` and in English is `2`.
   *
   * The package guide records what happens when children are not plain text:
   * the typeahead dies quietly, and a green suite says nothing about it.
   */
  await page.keyboard.type('11');

  const focused = await page.evaluate(
    () => document.activeElement?.textContent ?? ''
  );
  expect(focused.startsWith('11:')).toBe(true);
});

test('a required picker offers no way back to nothing', async ({ page }) => {
  await gotoStory(page, STATES);

  const required = page.getByRole('button', { name: /Required/ });
  await required.click();

  const rows = await page
    .getByRole('option')
    .evaluateAll(options => options.map(one => one.textContent));

  /*
   * DOC 07 §2.2 RULE 5 IS SATISFIED BY A ROW rather than exempted by §2.2a.
   * The rule sends a field that opens a layer to the chevron alone, on the
   * grounds that emptying has a route costing no width — "an option that
   * returns to no value". This component owns its options, so it provides
   * exactly that, and only where there is something to return to: a required
   * field has nothing.
   */
  expect(rows).not.toContain('No time');
  expect(rows[0]).toBe('12:00 AM');
});

test('and an optional one has it first, with no cross at the edge', async ({
  page
}) => {
  await gotoStory(page, OPENED);

  const rows = await page
    .getByRole('option')
    .evaluateAll(options => options.map(one => one.textContent));

  expect(rows[0]).toBe('No time');

  /*
   * AND NOTHING AT THE TRAILING EDGE BUT THE CHEVRON, which is the other half
   * of the same rule. The catalog expected this component to be §2.2a's third
   * case — two controls at one edge — and it is not: that exception exists
   * because a date field's segments cannot report being emptied, and choosing
   * a row here puts the placeholder back where the value was.
   */
  const edge = await page
    .locator('.bb-field-box')
    .first()
    .evaluate(box => ({
      clears: box.querySelectorAll('.bb-field-clear').length,
      chevrons: box.querySelectorAll('.bb-select-chevron').length
    }));

  expect(edge.clears).toBe(0);
  expect(edge.chevrons).toBe(1);
});

test('and the trigger holds no phantom tick', async ({ page }) => {
  await gotoStory(page, OPENED);

  const inside = await page
    .locator('.bb-select-value')
    .first()
    .evaluate(value => {
      const tick = value.querySelector('.bb-select-tick');
      return {
        present: tick !== null,
        display: tick === null ? null : getComputedStyle(tick).display,
        width: Math.round(value.getBoundingClientRect().width),
        text: Math.round(
          value.firstElementChild?.getBoundingClientRect().width ?? 0
        )
      };
    });

  /*
   * A `Select` DEFECT FOUND BY BUILDING ON IT. `SelectValue` renders the
   * selected row's own children — all of them — so the trigger contains a copy
   * of the row's tick. The tick is `visibility: hidden`, deliberately, so a
   * row does not move as the selection walks; the consequence in the TRIGGER
   * is 16px of invisible width inside an element that truncates, so a long
   * value shows its ellipsis early for no reason anybody could see.
   *
   * It is `display: none` there now. The markup is still copied — that is the
   * base's doing — and it takes no room.
   */
  expect(inside.present).toBe(true);
  expect(inside.display).toBe('none');
});

test('the list is capped and scrolls rather than growing past the window', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  await page.getByRole('button', { name: /Opens at/ }).click();

  const list = page.getByRole('listbox');
  const measured = await list.evaluate(node => ({
    rows: node.querySelectorAll('[role=option]').length,
    height: Math.round(node.getBoundingClientRect().height),
    scrollable: node.scrollHeight > node.clientHeight,
    window: window.innerHeight
  }));

  /*
   * The overview offers 08:00 to 20:00 at the default quarter-hour step, which
   * is 49 rows plus the no-time one. None of that is this component's problem:
   * the base writes a `max-height` into the panel from the room between the
   * trigger and the edge of the window, and `Select`'s list scrolls inside it.
   *
   * Asserted because it is what makes the whole design viable — a list of
   * ninety-six rows at the default step is only usable if it is bounded.
   */
  expect(measured.rows).toBe(50);
  expect(measured.scrollable).toBe(true);
  expect(measured.height).toBeLessThan(measured.window);
});

test('in Arabic the rows and the panel change hands', async ({ page }) => {
  await gotoStory(page, RTL);

  const geometry = await page.evaluate(() => {
    /*
     * `.bb-select-trigger` and NOT `button`: the catalog's own chrome puts
     * buttons in the page, and the first `button` in the document was one of
     * them at x = 0, which made this check compare the list against something
     * a thousand pixels away and call it a failure.
     */
    const trigger = document.querySelector('.bb-select-trigger')!;
    const list = document.querySelector('[role=listbox]')!;
    const option = list.querySelector('[role=option]')!;
    return {
      direction: getComputedStyle(option).direction,
      triggerEnd: Math.round(trigger.getBoundingClientRect().x),
      listEnd: Math.round(list.getBoundingClientRect().x)
    };
  });

  /* The list is aligned to the trigger, whichever edge that is. */
  expect(geometry.direction).toBe('rtl');
  expect(Math.abs(geometry.listEnd - geometry.triggerEnd)).toBeLessThan(20);
});

test('a disabled picker cannot be opened', async ({ page }) => {
  await gotoStory(page, STATES);

  const disabled = page.getByRole('button', { name: /Disabled/ });
  await expect(disabled).toBeDisabled();

  await disabled.click({ force: true });

  await expect(page.getByRole('listbox')).toHaveCount(0);
});
