/*
 * The layer half of the first composed field, and the one measurement that
 * decides whether it looks like a field at all: THE LIST IS AS WIDE AS THE
 * FIELD.
 *
 * The base publishes the trigger's width on the popover as `--trigger-width`,
 * which jsdom resolves to nothing — so the check has to be here, and it has to
 * compare the two boxes against each other rather than against a number. A
 * remembered number would pass on a list that stopped following the field.
 *
 * The rest is what a select is for and jsdom cannot see: the arrows, the
 * typeahead, the highlight that is not the tick, and focus coming back.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-select--overview';
const OPEN = 'components-select--open';
const ALIGNS = 'components-select--aligns-with-others';
const LONG = 'components-select--long-options';
const DIRECTION = 'components-select--direction';

test('the list is as wide as the field it belongs to', async ({ page }) => {
  await gotoStory(page, OPEN);

  const field = await page.locator('.bb-select-trigger').boundingBox();
  const list = await page.locator('.bb-select-list').boundingBox();
  expect(field).not.toBeNull();
  expect(list).not.toBeNull();

  /*
   * `min-width`, so equal here and free to grow — which is the next check.
   * Measured against each other: the number is whatever the field happens to
   * be, and a list that stopped following it would pass any assertion about a
   * remembered width.
   */
  expect(list!.width).toBeGreaterThanOrEqual(field!.width - 1);
  expect(list!.width).toBeCloseTo(field!.width, 0);

  // And the variable it comes from is resolved rather than merely written.
  const resolved = await page
    .locator('.bb-select-list')
    .evaluate(element =>
      getComputedStyle(element).getPropertyValue('--trigger-width').trim()
    );
  expect(resolved).not.toBe('');
});

test('and it may grow past the field, up to the narrow container', async ({
  page
}) => {
  await gotoStory(page, LONG);

  const field = await page.locator('.bb-select-trigger').boundingBox();
  const list = await page.locator('.bb-select-list').boundingBox();
  expect(field).not.toBeNull();
  expect(list).not.toBeNull();

  /*
   * A 200px field with an option that does not fit: the list is wider. The
   * alternative — truncating every row to the field's width — would hide the
   * ends of the options somebody opened the list to read.
   */
  expect(list!.width).toBeGreaterThan(field!.width);

  const ceiling = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.width = 'var(--bb-container-narrow)';
    document.body.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  });
  expect(ceiling).toBeGreaterThan(0);
  expect(list!.width).toBeLessThanOrEqual(ceiling + 1);
});

test('the chosen option is marked by more than the highlight', async ({
  page
}) => {
  await gotoStory(page, OPEN);

  const chosen = page.getByRole('option', { name: 'US dollar' });
  await expect(chosen).toHaveAttribute('aria-selected', 'true');

  /*
   * A tick as well as weight, and neither of them is the highlight. When a
   * list opens, the highlight and the selection are on the same row — and the
   * moment an arrow key moves, they are not. A selection shown only by the
   * highlight would disappear at that point.
   *
   * EVERY option has a tick and only one of them shows it, which is asserted
   * as visibility rather than as presence: the glyph is always in the DOM so
   * the rows do not shift as the selection moves, and a check on the count
   * would pass on a component that had stopped hiding them.
   */
  const visibility = (name: string) =>
    page
      .getByRole('option', { name })
      .locator('svg')
      .evaluate(element => getComputedStyle(element).visibility);

  expect(await visibility('US dollar')).toBe('visible');
  expect(await visibility('Euro')).toBe('hidden');

  const weight = await chosen.evaluate(
    element => getComputedStyle(element).fontWeight
  );
  const other = await page
    .getByRole('option', { name: 'Euro' })
    .evaluate(element => getComputedStyle(element).fontWeight);
  expect(weight).not.toBe(other);
});

/*
 * The defect the tick's first version caused, guarded where it would show.
 *
 * Drawing the tick from a render function made the item's children a function
 * rather than a string, so the base could derive no `textValue` and the
 * typeahead silently stopped working. The base said so in a development
 * warning, and nothing in this repository was reading the console — so this is
 * the one check that does, and it looks for exactly that.
 */
test('the base has no complaint about the options', async ({ page }) => {
  const complaints: string[] = [];
  page.on('console', message => {
    const text = message.text();
    if (text.includes('textValue') || text.includes('react-aria')) {
      complaints.push(`${message.type()}: ${text}`);
    }
  });

  await gotoStory(page, OPEN);
  await expect(page.getByRole('listbox')).toBeVisible();

  expect(complaints, complaints.join(' | ')).toEqual([]);
});

test('the highlight leaves the chosen row as soon as an arrow moves', async ({
  page
}) => {
  await gotoStory(page, OPEN);

  const chosen = page.getByRole('option', { name: 'US dollar' });
  await expect(chosen).toHaveAttribute('data-focused', 'true');

  await page.keyboard.press('ArrowDown');

  // The tick stays where the selection is; the highlight has moved on.
  await expect(chosen).not.toHaveAttribute('data-focused', /.*/);
  await expect(chosen.locator('svg')).toHaveCount(1);
  await expect(page.getByRole('option', { name: 'Euro' })).toHaveAttribute(
    'data-focused',
    'true'
  );
});

test('the keyboard opens it, chooses, and gives focus back', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const trigger = page.locator('.bb-select-trigger');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText('US dollar');
  // And the consumer's own state saw it, which is the half a field exists for.
  await expect(page.getByText('Chosen: USD')).toBeVisible();
});

test('typing jumps to an option without any text box', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  await page.locator('.bb-select-trigger').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('e');

  /*
   * The presence of the attribute rather than its value: the base writes
   * `data-focused` with no value on a list's option and `"true"` on a menu's
   * command, and a check that pinned the string would be asserting which of
   * the two spellings the base happened to use.
   */
  await expect
    .poll(() =>
      page
        .getByRole('option', { name: 'Euro' })
        .evaluate(element => element.hasAttribute('data-focused'))
    )
    .toBe(true);
});

test('Escape closes it and changes nothing', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const trigger = page.locator('.bb-select-trigger');
  await trigger.focus();
  await page.keyboard.press('Enter');

  /*
   * ONE OF EACH (doc 10 §11.1): every assertion at the END of this test is
   * also true of a select that never opened — no list because it was never
   * mounted, focus still on the trigger because it never left, nothing chosen
   * because nothing happened — and that is precisely the state this story
   * starts in. So the two keys before Escape have to be SEEN to do something,
   * or the test's end state is indistinguishable from its start state.
   *
   * The highlight is the right witness because it is the state Escape is being
   * asked to discard.
   */
  await expect(page.getByRole('listbox')).toBeVisible();

  const highlighted = () =>
    page.evaluate(
      () =>
        document.querySelector('[role=option][data-focused]')?.textContent ??
        'none'
    );
  const first = await highlighted();
  await page.keyboard.press('ArrowDown');
  await expect.poll(highlighted).not.toBe(first);

  await page.keyboard.press('Escape');

  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByText('Nothing chosen yet.')).toBeVisible();
});

/*
 * Doc 03 §9 asks for this by name, and it is the check that a set of
 * components is one system: a field, a select and a button of the same size
 * are the same height, from the same tokens.
 */
test('a select, a field and a button of the same size are the same height', async ({
  page
}) => {
  await gotoStory(page, ALIGNS);

  /*
   * THE FRAME IS THE BOX, not the control inside it. The first version of this
   * measured the select's own button and found 34px against a button's 36 —
   * which is the frame's two borders, and a real difference between the two
   * elements rather than between the two components. Both fields expose the
   * frame as `bb-field-box`, which is the element a person sees the edge of.
   */
  const heights = await page.evaluate(() =>
    [...document.querySelectorAll('.catalog-row')].map(row => {
      const boxes = [...row.querySelectorAll('.bb-field-box')].map(element =>
        Math.round(element.getBoundingClientRect().height)
      );
      const button = row.querySelector('button:not(.bb-select-trigger)');
      return {
        field: boxes[0] ?? -1,
        select: boxes[1] ?? -1,
        button: Math.round(button?.getBoundingClientRect().height ?? -1)
      };
    })
  );

  expect(heights).toHaveLength(3);
  for (const row of heights) {
    const label = JSON.stringify(row);
    expect(row.field, label).toBeGreaterThan(0);
    expect(row.select, label).toBe(row.field);
    expect(row.select, label).toBe(row.button);
  }
});

/*
 * The states a field shows, on the element that shows them.
 *
 * Written because the states story was WRONG and only a screenshot found it:
 * hover and focus were forced onto the trigger, which is a button with no
 * border and no ring, so two rows photographed identically to the default. The
 * appearance belongs to the frame — a text field's box and a select's are the
 * same class — and this is that fact in a form that can fail.
 */
test('the frame shows hover and focus, and the button inside it shows neither', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const box = page.locator('.bb-field-box');
  const trigger = page.locator('.bb-select-trigger');
  const border = () =>
    box.evaluate(element => getComputedStyle(element).borderTopColor);
  const halo = () =>
    box.evaluate(element => getComputedStyle(element).boxShadow);

  const atRest = await border();
  expect(await halo()).toBe('none');

  /*
   * Polled: the border moves on a transition bounded by the fast duration
   * token, so reading it the instant the pointer arrives catches it in flight.
   */
  await trigger.hover();
  await expect.poll(border).not.toBe(atRest);

  // Away, so the focus measurement is not also measuring the hover.
  await page.mouse.move(0, 0);
  await expect.poll(border).toBe(atRest);

  await trigger.focus();
  await expect.poll(halo).not.toBe('none');

  /*
   * And the button paints none of it, which is the half that makes the other
   * half worth asserting: `data-focused` on this element matches no rule, so
   * forcing it there in a story is a state nobody can see.
   */
  const own = await trigger.evaluate(element => {
    const style = getComputedStyle(element);
    return { border: style.borderTopWidth, halo: style.boxShadow };
  });
  expect(own).toEqual({ border: '0px', halo: 'none' });
});

test('in RTL the chevron crosses to the other edge', async ({ page }) => {
  await gotoStory(page, DIRECTION);

  const trigger = await page.locator('.bb-select-trigger').boundingBox();
  const chevron = await page.locator('.bb-select-chevron').boundingBox();
  expect(trigger).not.toBeNull();
  expect(chevron).not.toBeNull();

  // The value starts at the right, so the mark is at the left end of the box.
  const middle = trigger!.x + trigger!.width / 2;
  expect(chevron!.x).toBeLessThan(middle);
});

test('the chevron turns over while the list is open', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const chevron = page.locator('.bb-select-chevron');
  const rotation = () =>
    chevron.evaluate(element => getComputedStyle(element).rotate);

  expect(await rotation()).toBe('none');

  await page.locator('.bb-select-trigger').click();
  await expect(page.getByRole('listbox')).toBeVisible();

  /*
   * Polled, not read once. The mark turns over on a transition bounded by the
   * fast duration token, and reading the computed value the instant the list
   * appears catches it in flight — measured at 37.1947deg, which is a check
   * measuring a moment instead of a state. The same mistake the accordion's
   * height checks made, in a different property.
   */
  await expect.poll(rotation).toBe('180deg');
});
