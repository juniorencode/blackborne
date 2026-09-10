/*
 * A date typed or pointed at, and what only a browser answers.
 *
 * TWO CONTROLS SHARE ONE EDGE here, which doc 07 §2.2a admits for this field
 * alone and bounds with four conditions — every one of them is a check below.
 * THE CROSS MUST NOT WEAR THE TOGGLE'S PROPS, which is the collision decision
 * 0022 records and which a base publishing an unslotted button context makes
 * the default. THE LAYER lands against the whole field rather than the
 * segments. And the two routes to the value have to agree.
 */
import { expect, test } from '@playwright/test';
import { pinClock } from './clock';
import { gotoStory } from './story';

const OVERVIEW = 'components-datepicker--overview';
const OPENED = 'components-datepicker--opened';
const STATES = 'components-datepicker--states';
const NARROW = 'components-datepicker--in-a-narrow-panel';
const LIMITS = 'components-datepicker--limits';
const TOGETHER = 'components-datepicker--together';
const RTL = 'components-datepicker--direction';

test.beforeEach(async ({ page }) => {
  await pinClock(page);
});

test('the chevron and the cross both clear the minimum target', async ({
  page
}) => {
  await gotoStory(page, TOGETHER);

  const measured = await page
    .locator('.bb-date-picker-toggle, .bb-field-clear')
    .evaluateAll(nodes =>
      nodes.map(node => {
        const box = node.getBoundingClientRect();
        return {
          what: node.className.includes('clear') ? 'cross' : 'chevron',
          width: box.width,
          height: box.height,
          floor: Number.parseFloat(
            getComputedStyle(node).getPropertyValue('--bb-control-hit-area')
          )
        };
      })
    );

  /*
   * DOC 07 §2.2a'S FIRST CONDITION, and the one that had to be measured before
   * the exception was allowed: two controls at one edge is exactly where doc
   * 06 §3's minimum gets bent. Compact is in this story on purpose — that is
   * the density where a 24px floor stops having room to spare.
   */
  expect(measured.filter(one => one.what === 'cross').length).toBeGreaterThan(
    0
  );
  expect(measured.filter(one => one.what === 'chevron').length).toBeGreaterThan(
    0
  );
  for (const one of measured) {
    expect(one.floor).toBeGreaterThan(0);
    expect(
      one.width,
      `a ${one.what} measured ${one.width} against a floor of ${one.floor}`
    ).toBeGreaterThanOrEqual(one.floor - 0.5);
    expect(one.height).toBeGreaterThanOrEqual(one.floor - 0.5);
  }
});

test('the cross clears the value and does NOT open the layer', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const value = () => page.locator('.catalog-label').last().innerText();
  expect(await value()).toContain('2026-09-09');

  await page.locator('.bb-field-clear').click();

  /*
   * THE COLLISION, ASSERTED. A `DatePicker` publishes an UNSLOTTED
   * `ButtonContext` carrying the toggle's own props — its id, its name and its
   * press handler — so without `slot={null}` the cross wears them and pressing
   * it opens the calendar instead of emptying the field. Measured in the
   * base's source and then here, which is the same trap decision 0022 records
   * for a combo box arriving on a field with two controls.
   */
  expect(await value()).toContain('Empty');
  await expect(page.locator('.bb-date-picker-layer')).toHaveCount(0);
});

test('the two controls keep their own names', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  /*
   * The toggle's name is the BASE's, localised by it — the same arrangement
   * `ComboBox` has, where the library adds no key of its own. The cross's is
   * ours, from the dictionary. Two controls at one edge with one name between
   * them would be doc 06's noise, and it is what a shared context produces if
   * nobody stops it.
   */
  expect(
    await page.locator('.bb-date-picker-toggle').getAttribute('aria-label')
  ).toBeTruthy();
  expect(
    await page.locator('.bb-field-clear').getAttribute('aria-label')
  ).toBeTruthy();
  expect(
    await page.locator('.bb-date-picker-toggle').getAttribute('aria-label')
  ).not.toBe(await page.locator('.bb-field-clear').getAttribute('aria-label'));
});

test('the chevron turns over while the layer is open', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const rotation = () =>
    page
      .locator('.bb-date-picker-toggle svg')
      .evaluate(glyph => getComputedStyle(glyph).rotate);

  expect(await rotation()).toBe('none');
  await page.locator('.bb-date-picker-toggle').click();
  await expect(page.locator('.bb-date-picker-layer')).toBeVisible();

  /*
   * `bb:group` ON THE TOGGLE, not on the root. The open state belongs to the
   * popover, which is portalled somewhere else entirely, so what the trigger
   * carries is `aria-expanded` — and a variant keyed on a group whose root has
   * no such attribute matches nothing. The first screenshot of this component
   * showed a chevron that never turned; the package guide had already written
   * this down from `SplitButton`.
   */
  /*
   * POLLED RATHER THAN READ ONCE, and the first version of this check is why:
   * the chevron transitions its rotation, so a single read caught it at
   * 96.83deg. Doc 10 §11 — a value that depends on when it was read is a value
   * about the machine. Polling asserts the state the component SETTLES in,
   * which is the claim.
   */
  await expect.poll(rotation).toBe('180deg');
});

test('the layer lands under the whole field, not under the segments', async ({
  page
}) => {
  await gotoStory(page, OPENED);

  const geometry = await page.evaluate(() => {
    const segments = document.querySelector('.bb-date-segments')!;
    const layer = document.querySelector('.bb-date-picker-layer')!;
    const group = document.querySelector('.bb-date-picker-group')!;
    const round = (n: number) => Math.round(n);
    return {
      segments: round(segments.getBoundingClientRect().x),
      group: round(group.getBoundingClientRect().x),
      layer: round(layer.getBoundingClientRect().x),
      layerTop: round(layer.getBoundingClientRect().y),
      groupBottom: round(group.getBoundingClientRect().bottom),
      grids: layer.querySelectorAll('.bb-calendar-grid').length
    };
  });

  /*
   * The base anchors the popover to the GROUP it publishes, which is why the
   * picker renders one round the segments rather than letting the frame be it:
   * the layer opens against the field's own row, and a calendar hanging off
   * the day rather than off the box is the difference somebody notices without
   * being able to name.
   */
  expect(geometry.layer).toBeLessThanOrEqual(geometry.group + 2);
  expect(geometry.layerTop).toBeGreaterThan(geometry.groupBottom);
  expect(geometry.grids).toBe(1);
});

test('the layer is a named dialog holding one calendar', async ({ page }) => {
  await gotoStory(page, OPENED);

  const dialog = page.locator('.bb-date-picker-layer [role=dialog]');
  await expect(dialog).toHaveCount(1);

  /*
   * A DIALOG ROUND THE CALENDAR is the base's own shape, and the name lives
   * there rather than on the grid: measured, the picker's `calendarProps`
   * carry no `aria-label` at all and the dialog gets an `aria-labelledby`
   * pointing at the toggle and the field's label. Which is why the calendar
   * inside is the shared internal rather than the public `Calendar` — that one
   * requires a label and would say the field's name a second time.
   */
  expect(await dialog.getAttribute('aria-labelledby')).toBeTruthy();
  await expect(dialog.locator('.bb-calendar-day').first()).toBeVisible();
});

test('choosing a day in the layer writes the same value typing does', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);
  const value = () => page.locator('.catalog-label').last().innerText();

  await page.locator('.bb-date-picker-toggle').click();
  await expect(page.locator('.bb-date-picker-layer')).toBeVisible();
  await page
    .locator('.bb-date-picker-layer .bb-calendar-day')
    .filter({ hasText: /^17$/ })
    .first()
    .click();

  expect(await value()).toContain('2026-09-17');

  /* And the other route, to the same shape of answer. */
  await page.locator('.bb-date-segment').first().click();
  await page.keyboard.type('12');
  expect(await value()).toContain('2026-12-17');
});

test('the limits hold in the segments and in the calendar', async ({
  page
}) => {
  await gotoStory(page, LIMITS);

  const disabled = await page
    .locator('.bb-date-picker-layer .bb-calendar-day[data-disabled]')
    .count();

  /* September only, so the days either side of it are off in the grid. */
  expect(disabled).toBeGreaterThan(0);
});

test('a busy field offers neither control, and keeps their room', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const saving = page.locator('.catalog-panel').filter({ hasText: 'Saving' });

  /*
   * RULE 1, and the exception does not touch it: while the field is saving
   * neither control can act, so neither is reachable — and both keep their
   * width, because closing the gap widens the box and slides the value.
   */
  const seen = await saving.evaluate(panel => {
    const frame = panel.querySelector('.bb-field-box')!;
    const edges = [...frame.children].filter(
      child => child.querySelector('button') !== null
    );
    return edges.map(edge => ({
      width: Math.round(edge.getBoundingClientRect().width),
      inert: edge.hasAttribute('inert')
    }));
  });

  expect(seen.length).toBeGreaterThan(0);
  for (const edge of seen) {
    expect(edge.width).toBeGreaterThan(0);
    expect(edge.inert).toBe(true);
  }
});

test('in Arabic the controls swap ends and the calendar follows', async ({
  page
}) => {
  await gotoStory(page, RTL);

  const positions = await page.evaluate(() => {
    const segments = document.querySelector('.bb-date-segments')!;
    const toggle = document.querySelector('.bb-date-picker-toggle')!;
    return {
      segments: Math.round(segments.getBoundingClientRect().x),
      toggle: Math.round(toggle.getBoundingClientRect().x)
    };
  });

  /* The chevron sits at the reading end, which in Arabic is the left. */
  expect(positions.toggle).toBeLessThan(positions.segments);
});

test('the layer does not push a 320px panel sideways', async ({ page }) => {
  await gotoStory(page, NARROW);

  const seen = await page.evaluate(() => {
    const layer = document.querySelector('.bb-date-picker-layer')!;
    const box = layer.getBoundingClientRect();
    return {
      left: Math.round(box.left),
      right: Math.round(box.right),
      viewport: document.documentElement.clientWidth
    };
  });

  /*
   * THE LAYER AGAINST THE VIEWPORT, not the page against itself — and the
   * first version of this check asked the wrong one. It measured
   * `body.scrollWidth - clientWidth` and found 10px, which turned out to be
   * the CATALOG's own resizable fixture at 1290 in a 1280 window: a check
   * failing on the harness rather than on the component, which is the same
   * class of mistake as a probe that becomes a flex item (doc 08 §9).
   *
   * What the claim actually is: a layer is wider than the field it opens
   * under and it renders in a portal, so it must stay on screen. Doc 04 §7 on
   * what overflow costs, asked of the component with most reason to cause it.
   */
  expect(seen.left).toBeGreaterThanOrEqual(0);
  expect(seen.right).toBeLessThanOrEqual(seen.viewport);
});
