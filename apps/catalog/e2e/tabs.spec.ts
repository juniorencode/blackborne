/*
 * The half of `Tabs` that only a browser can see, and it is most of the
 * component.
 *
 * The structure comes from `useContainerStep`, which reads a value a container
 * query publishes — so jsdom, which implements neither container queries nor
 * `ResizeObserver`, sees the floor and nothing else. Every unit test of this
 * component is therefore about the select; the row of tabs, the switch between
 * the two, and the state that has to survive it are all here.
 *
 * Doc 04 §6 rule 4 is the one to read before touching this file: "state
 * survives the structural change. This is tested explicitly: it is what breaks
 * most often."
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-tabs--overview';
const STRUCTURES = 'components-tabs--structures';
const STATES = 'components-tabs--states';
const WRAPPING = 'components-tabs--wrapping';
const RICH = 'components-tabs--rich-titles';
const DIRECTION = 'components-tabs--direction';

test('the structure follows the container, not the window', async ({
  page
}) => {
  await gotoStory(page, STRUCTURES);

  /*
   * P4's own question, asked of the component that answers it: three of these
   * side by side in ONE 1280px window, and two of them are a different
   * component from the third. A viewport breakpoint could not produce this
   * page at all.
   */
  const panels = page.locator('.catalog-panel');
  await expect(panels).toHaveCount(3);

  /*
   * The COMPONENT's width and not the panel's: `.catalog-panel` is
   * content-box, so a panel asked for 320px measures 346 with its padding, and
   * a check pinned to the outer number would be measuring the fixture. The
   * root is what the container query asks about, and the step is read back
   * from the element that carries the four classes, so the structure is
   * asserted beside the reason it took.
   */
  const structures = await panels.evaluateAll(nodes =>
    nodes.map(node => ({
      root: Math.round(
        node.querySelector('.bb-tabs')?.getBoundingClientRect().width ?? -1
      ),
      step: getComputedStyle(node.querySelector('.bb-tabs-header') as Element)
        .getPropertyValue('--bb-step')
        .trim(),
      tablist: node.querySelectorAll('[role="tablist"]').length,
      select: node.querySelectorAll('.bb-select-trigger').length
    }))
  );

  expect(structures).toEqual([
    { root: 320, step: 'base', tablist: 0, select: 1 },
    { root: 440, step: 'narrow', tablist: 0, select: 1 },
    { root: 560, step: 'medium', tablist: 1, select: 0 }
  ]);
});

test('the open tab survives the structure changing under it', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  // Wide: a row of tabs. Open the second one.
  await page.getByRole('tab', { name: 'Tax' }).click();
  await expect(
    page.getByText('Eighteen per cent, and where it applies.')
  ).toBeVisible();
  await expect(page.getByText('Open: tax')).toBeVisible();

  await page.setViewportSize({ width: 420, height: 900 });

  /*
   * Narrow: a select, and it is still Tax. The state lives above the choice of
   * structure, which is what makes this hold by construction rather than by
   * being remembered — and it is checked anyway, because doc 04 §6 rule 4 says
   * this is the thing that breaks.
   */
  await expect(page.locator('.bb-select-trigger')).toContainText('Tax');
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await expect(
    page.getByText('Eighteen per cent, and where it applies.')
  ).toBeVisible();
  await expect(page.getByText('Open: tax')).toBeVisible();

  // And back, with the same tab open.
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole('tab', { name: 'Tax' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(page.getByText('Open: tax')).toBeVisible();
});

/*
 * The failure the header element was designed against, in the form it would
 * take.
 *
 * The step is read from an element that outlives both structures. Read it from
 * the control instead and the observer is left watching a detached node, a
 * detached node reports zero, the step falls back to `base`, that swaps the
 * structure back, and the next control detaches in turn — a component
 * flickering between two structures at one width, forever. So: settle at a
 * width and stay there.
 */
test('and it settles rather than flickering between the two', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);
  await page.setViewportSize({ width: 420, height: 900 });
  await expect(page.locator('.bb-select-trigger')).toBeVisible();

  const seen = new Set<string>();
  for (let i = 0; i < 8; i++) {
    seen.add(
      await page.evaluate(
        () =>
          `${document.querySelectorAll('[role="tablist"]').length}/${
            document.querySelectorAll('.bb-select-trigger').length
          }`
      )
    );
    await page.waitForTimeout(100);
  }

  expect([...seen]).toEqual(['0/1']);
});

test('the arrows move along the row and open what they reach', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const first = page.getByRole('tab', { name: 'Lines' });
  await first.focus();
  await expect(first).toBeFocused();

  await page.keyboard.press('ArrowRight');

  /*
   * The base's tabs select as they move, which is the pattern's own default
   * for a row this size: the panel follows the arrow rather than waiting for
   * a press. Asserted because it is a real decision about behaviour, not a
   * detail — and it is the base's, which is why nothing here implements it.
   */
  await expect(page.getByRole('tab', { name: 'Tax' })).toBeFocused();
  await expect(page.getByText('Open: tax')).toBeVisible();

  await page.keyboard.press('ArrowLeft');
  await expect(page.getByText('Open: lines')).toBeVisible();
});

test('the panel is labelled by a tab that exists', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  /*
   * MEASURED ON THE BASE, and the reason a tab and its panel are one
   * declaration here: with the base's own two-element shape, a panel whose
   * tab list stops being rendered keeps `aria-labelledby="undefined-tab-b"` —
   * a name pointing at nothing, which is the defect the axe suite's own
   * comment names and axe cannot see, because the attribute is well formed.
   */
  const resolved = await page.locator('[role="tabpanel"]').evaluate(element => {
    const id = element.getAttribute('aria-labelledby') ?? '';
    return {
      id,
      text: document.getElementById(id)?.textContent ?? null
    };
  });

  expect(resolved.id).not.toBe('');
  expect(resolved.text).toBe('Lines');
});

test('and the panel is reachable from the keyboard', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  await page.getByRole('tab', { name: 'Lines' }).focus();
  await page.keyboard.press('Tab');

  // The content behind a tab has to be reachable without a mouse, so the base
  // puts the panel in the tab sequence. This asserts we have not styled or
  // wrapped that away.
  await expect(page.locator('[role="tabpanel"]')).toBeFocused();
});

test('the open tab is marked by a rule, and the others are not', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const rule = (name: string) =>
    page
      .getByRole('tab', { name })
      .evaluate(element => getComputedStyle(element).borderBottomColor);

  const open = await rule('Lines');
  const shut = await rule('Tax');

  expect(open).not.toBe(shut);
  // Transparent, and not absent: the tab reserves the rule's width either way,
  // so nothing moves when the selection does.
  expect(shut).toContain('rgba(0, 0, 0, 0)');

  const weights = await page
    .getByRole('tab')
    .evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fontWeight));
  /*
   * One weight for every tab, open or not. A bold selected tab is wider than
   * the same word unbolded, so the row would shift sideways as somebody moved
   * along it — doc 09 §7, in the one component whose controls sit in a line.
   */
  expect(new Set(weights).size).toBe(1);
});

/*
 * The guard the select wave earned: a forced state that lands on the wrong
 * element photographs identically to the default, and only a baseline finds
 * it. This is that failure in a form that fails.
 */
test('the forced states in the catalog actually paint', async ({ page }) => {
  await gotoStory(page, STATES);

  const shadows = await page.locator('.catalog-panel').evaluateAll(nodes =>
    nodes.map(node => {
      const tab = node.querySelectorAll('.bb-tabs-tab')[1];
      const style = tab === undefined ? null : getComputedStyle(tab);
      return {
        colour: style?.color ?? '',
        halo: style?.boxShadow ?? ''
      };
    })
  );

  const [plain, hovered, focused] = shadows;
  expect(plain).toBeDefined();
  // Hover moves the colour of the tab that is not open.
  expect(hovered?.colour).not.toBe(plain?.colour);
  // Focus draws the halo, and only there.
  expect(plain?.halo).toBe('none');
  expect(focused?.halo).not.toBe('none');
});

test('a row too long for its container wraps rather than overflowing', async ({
  page
}) => {
  await gotoStory(page, WRAPPING);

  const measured = await page.locator('.bb-tabs').evaluate(element => {
    const list = element.querySelector('.bb-tabs-list');
    const tabs = [...element.querySelectorAll('.bb-tabs-tab')];
    const tops = new Set(
      tabs.map(tab => Math.round(tab.getBoundingClientRect().top))
    );
    return {
      rows: tops.size,
      list: list === null ? -1 : list.scrollWidth - Math.ceil(list.clientWidth),
      root: element.scrollWidth - Math.ceil(element.clientWidth)
    };
  });

  /*
   * More than one row, and nothing hidden by overflow — doc 04 §7.
   *
   * Measured on the COMPONENT and not on the document, which the first version
   * of this did: the catalog's own resizable wrapper is 1290px in a 1280px
   * frame, so every story in this repository overflows the page by ten pixels
   * and an assertion about the document would have been reporting the fixture.
   */
  expect(measured.rows).toBeGreaterThan(1);
  expect(measured.list).toBeLessThanOrEqual(0);
  expect(measured.root).toBeLessThanOrEqual(0);
});

test('a title that is not plain text draws no complaint', async ({ page }) => {
  const complaints: string[] = [];
  page.on('console', message => {
    const text = message.text();
    if (text.includes('textValue') || text.includes('react-aria')) {
      complaints.push(`${message.type()}: ${text}`);
    }
  });

  await gotoStory(page, RICH);
  await expect(page.getByRole('tablist')).toBeVisible();

  /*
   * The same check the select carries, one level up: a collection item whose
   * children are not a string derives no searchable text, and the base says so
   * in a development warning that nothing reads. `textValue` is the answer and
   * this is what proves it arrived.
   */
  expect(complaints, complaints.join(' | ')).toEqual([]);
});

test('in RTL the row starts at the other edge', async ({ page }) => {
  await gotoStory(page, DIRECTION);

  const boxes = await page
    .locator('.bb-tabs-tab')
    .evaluateAll(nodes =>
      nodes.map(node => Math.round(node.getBoundingClientRect().x))
    );

  expect(boxes.length).toBeGreaterThan(1);
  // The first tab written is the furthest to the right.
  expect(boxes[0]).toBeGreaterThan(boxes[1] ?? 0);
});
