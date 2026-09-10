/*
 * A time in segments, and what only a browser answers: how many segments a
 * locale asks for and what the marker says when there is one, whether the row
 * holds still while somebody types, and whether the cross clears the hit area
 * at compact density.
 */
import { expect, test } from '@playwright/test';
import { pinClock } from './clock';
import { gotoStory } from './story';

const OVERVIEW = 'components-timefield--overview';
const STATES = 'components-timefield--states';
const LOCALES = 'components-timefield--in-every-locale';
const TOGETHER = 'components-timefield--together';

test.beforeEach(async ({ page }) => {
  await pinClock(page);
});

test('the row does not move while a time is typed', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const row = page.locator('.bb-date-segments');
  const width = () =>
    row.evaluate(node => Math.round(node.getBoundingClientRect().width));

  const filled = await width();
  /*
   * NOT `.bb-date-segment` first, which is a zero-width literal in a
   * twelve-hour locale: the base wraps the clock in bidi ISOLATE marks
   * (U+2066 and U+2069) and renders them as literal segments, so the first
   * child of the row cannot be clicked at all. Measured — the first version
   * of this check timed out on it, and the read-only check below read that
   * same invisible element's colour and found it identical to the disabled
   * one's.
   */
  await page
    .locator('.bb-date-segment:not([data-type=literal])')
    .first()
    .click();
  await page.keyboard.press('Backspace');
  expect(await width()).toBe(filled);
  await page.keyboard.type('1');
  expect(await width()).toBe(filled);
});

test('the locale decides the segments AND what the marker says', async ({
  page
}) => {
  await gotoStory(page, LOCALES);

  const seen = await page.locator('.bb-date-segments').evaluateAll(rows =>
    rows.map(row => ({
      types: [...row.querySelectorAll('.bb-date-segment')]
        .map(segment => segment.getAttribute('data-type'))
        .filter(type => type !== 'literal'),
      marker:
        row
          .querySelector('.bb-date-segment[data-type=dayPeriod]')
          ?.textContent?.trim() ?? null
    }))
  );

  /*
   * THE MEASUREMENT THAT CORRECTED THIS COMPONENT'S OWN DOCUMENTATION. It
   * claimed `es-PE` was a twenty-four hour locale. It is not: both `en-US` and
   * `es-PE` show twelve hours and a third segment, and they disagree about how
   * to write it — `PM` against `p. m.`, spacing and full stops included. Only
   * `ja-JP` has two segments.
   *
   * Which is a better argument for the boundary being `14:30` than the guess
   * it replaced: two locales that agree on the CLOCK still disagree on the
   * writing, so a formatted time would carry one of them into the data.
   */
  expect(seen[0]!.types).toEqual(['hour', 'minute', 'dayPeriod']);
  expect(seen[1]!.types).toEqual(['hour', 'minute', 'dayPeriod']);
  expect(seen[2]!.types).toEqual(['hour', 'minute']);
  expect(seen[0]!.marker).not.toBe(seen[1]!.marker);
  expect(seen[2]!.marker).toBeNull();
});

test('the value is the twenty-four hour clock whatever is shown', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const shown = await page
    .locator('.bb-date-segments')
    .evaluate(row => (row as HTMLElement).innerText.replace(/\s/g, ''));
  const value = await page.locator('.catalog-label').last().innerText();

  /* `2:30 PM` on screen and `14:30` in the value, at the same moment. */
  expect(shown).toContain('2:30');
  expect(value).toContain('14:30');
});

test('the cross clears the field and reports it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const value = () => page.locator('.catalog-label').last().innerText();
  expect(await value()).toContain('14:30');

  await page.locator('.bb-field-clear').click();
  expect(await value()).toContain('Empty');
});

test('the cross clears the minimum target at both densities', async ({
  page
}) => {
  await gotoStory(page, TOGETHER);

  const measured = await page.locator('.bb-field-clear').evaluateAll(nodes =>
    nodes.map(node => {
      const box = node.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        floor: Number.parseFloat(
          getComputedStyle(node).getPropertyValue('--bb-control-hit-area')
        )
      };
    })
  );

  expect(measured.length).toBeGreaterThan(2);
  for (const target of measured) {
    expect(target.floor).toBeGreaterThan(0);
    expect(target.width).toBeGreaterThanOrEqual(target.floor - 0.5);
    expect(target.height).toBeGreaterThanOrEqual(target.floor - 0.5);
  }
});

test('a read-only field is not a disabled one', async ({ page }) => {
  await gotoStory(page, STATES);

  const panels = page.locator('.catalog-panel');
  const colourOf = (text: string) =>
    panels
      .filter({ hasText: text })
      .locator('.bb-date-segment:not([data-type=literal])')
      .first()
      .evaluate(node => getComputedStyle(node).color);

  expect(await colourOf('Read-only')).not.toBe(await colourOf('Disabled'));
});

test('nothing overflows sideways in its panel', async ({ page }) => {
  await gotoStory(page, STATES);

  const overflow = await page
    .locator('.catalog-panel')
    .first()
    .evaluate(panel => {
      const bounds = panel.getBoundingClientRect();
      return [...panel.querySelectorAll('*')]
        .map(child => child.getBoundingClientRect())
        .filter(box => box.width > 0)
        .map(box => Math.round((box.right - bounds.right) * 100) / 100)
        .filter(over => over > 0.5);
    });

  expect(overflow).toEqual([]);
});
