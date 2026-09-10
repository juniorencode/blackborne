/*
 * A field for choosing files, and the one component in this library whose
 * central interaction a browser is the only instrument for.
 *
 * THE DROP is why. jsdom implements no data transfer at all, so the shape of a
 * drop is checked as a function in `internal/files.test.ts` and the drop
 * itself is checked here — with a real drag, for a reason that is measured
 * below and is worth reading before copying anything out of this file.
 *
 * The rest is what only a browser answers about it: the state that exists
 * WHILE something is over the zone and before anything is released, the
 * keyboard's route in, and a size formatted by the platform's own tables.
 */
import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page
} from '@playwright/test';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gotoStory } from './story';

const OVERVIEW = 'components-fileupload--overview';
const STATES = 'components-fileupload--states';
const ZONE = 'components-fileupload--zone';
const RTL = 'components-fileupload--direction';

/**
 * A drag carrying real files, from the browser's own point of view.
 *
 * ## Why this is not `new DataTransfer()`
 *
 * The recipe everybody copies is to build a data transfer in the page, add a
 * `File` to it and dispatch `drop` with it. Measured, in this catalog, against
 * this component: **it delivers no file.** The transfer looks perfect from
 * JavaScript — `types: ['Files']`, `files.length: 1`, `items[0].kind: 'file'`
 * — and `items[0].webkitGetAsEntry()` returns **null**, because Chromium
 * attaches a filesystem entry only to an item that came from a real drag.
 *
 * The base reads a drop with `readFromDataTransfer`, which calls
 * `webkitGetAsEntry()` wherever the method exists and skips the item when it
 * answers null. So a page-built drop fires every drag event, sets
 * `data-drop-target`, calls `onDrop` — and hands over an empty list. A check
 * written on it asserts that the events work and proves nothing about the
 * payload, which is doc 10 §11's failure mode arriving through a different
 * door: a check that passes for a reason other than the one it names.
 *
 * `Input.dispatchDragEvent` takes file PATHS and lets the browser build the
 * transfer itself, entries included. It is Chromium-only, this suite is
 * Chromium-only, and it is the only instrument that answers the question.
 */
const dragging = async (
  page: Page,
  context: BrowserContext,
  files: readonly string[]
) => {
  const cdp = await context.newCDPSession(page);
  /*
   * `1` is the copy operation. With no operation allowed the drop effect
   * computes to "none" and the base treats the drag as cancelled, which is a
   * different thing from a drop that carried nothing.
   */
  const data = { items: [], files: [...files], dragOperationsMask: 1 };

  const at = async (
    type: 'dragEnter' | 'dragOver' | 'drop',
    x: number,
    y: number
  ) => {
    await cdp.send('Input.dispatchDragEvent', { type, x, y, data });
  };

  return {
    /** Hold it over an element, and stay there. */
    async over(target: Locator) {
      const box = (await target.boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await at('dragEnter', x, y);
      await at('dragOver', x, y);
      return { x, y };
    },
    /** Let go where it was held. */
    async release(x: number, y: number) {
      await at('drop', x, y);
    }
  };
};

/**
 * Real entries on disk, because a real drag carries paths rather than bytes.
 *
 * A name ending in a slash is made as a directory, which is the one thing a
 * data transfer built in a page cannot express at all.
 */
const onDisk = (names: readonly string[]): string[] => {
  const dir = mkdtempSync(join(tmpdir(), 'bb-upload-'));
  return names.map(name => {
    const path = join(dir, name.endsWith('/') ? name.slice(0, -1) : name);
    if (name.endsWith('/')) mkdirSync(path);
    else writeFileSync(path, 'the contents of a file');
    return path;
  });
};

/**
 * Move focus to the first thing inside the story.
 *
 * The catalog's own decorator wraps every story in a resizable region with
 * `tabIndex={0}` — a scroll region only a mouse can reach is a WCAG 2.1.1
 * failure even in a catalog — so the first `Tab` of any story lands on the
 * fixture. Asserted rather than skipped past, the way `accordion.spec.ts` does
 * it, so a change to the decorator fails loudly here instead of quietly eating
 * a different stop.
 */
const tabIntoStory = async (page: Page) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('.catalog-resizable')).toBeFocused();
  await page.keyboard.press('Tab');
};

test('the file dialog route reports what was chosen', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const readout = page.locator('.catalog-label').last();
  await expect(readout).toHaveText('Nothing chosen');

  /*
   * The base's `FileTrigger` renders a hidden `<input type=file>` and presses
   * it for us. Setting its files is the only way to open a file dialog from a
   * test, and it is the route most people take.
   */
  await page.locator('input[type=file]').setInputFiles({
    name: 'contract.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('a contract')
  });

  await expect(readout).toHaveText('1 file(s) held by the story');
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.locator('.bb-file-upload-name')).toHaveText('contract.pdf');
});

test('a real drop lands, and the zone says so while it is over it', async ({
  page,
  context
}) => {
  await gotoStory(page, OVERVIEW);

  const zone = page.locator('.bb-file-upload-zone');
  const drag = await dragging(page, context, onDisk(['dropped.txt']));
  const { x, y } = await drag.over(zone);

  /*
   * `data-drop-target` IS THE ONE STATE NOBODY CAN DISCOVER BY POKING AT THE
   * COMPONENT. Doc 09 §3 asks for a visible response to every interaction, and
   * a file hovering over a target is an interaction that has not been
   * committed — the moment a person is deciding whether to let go.
   */
  await expect(zone).toHaveAttribute('data-drop-target', 'true');

  await drag.release(x, y);

  /*
   * AND THE FILE ARRIVES. A drop is not a `FileList`: the base hands over
   * items whose contents come through a promise, which is why the filtering
   * lives in `internal/files` — and why the arriving is checked here, where a
   * drag can be a real one.
   */
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.locator('.bb-file-upload-name')).toHaveText('dropped.txt');
  await expect(page.locator('.catalog-label').last()).toHaveText(
    '1 file(s) held by the story'
  );

  /* And the zone goes back to being a zone. */
  await expect(zone).not.toHaveAttribute('data-drop-target', 'true');
});

test('a folder dropped alongside a file is left on the floor', async ({
  page,
  context
}) => {
  await gotoStory(page, OVERVIEW);

  const zone = page.locator('.bb-file-upload-zone');
  const drag = await dragging(page, context, onDisk(['a-folder/', 'kept.txt']));
  const { x, y } = await drag.over(zone);
  await drag.release(x, y);

  /*
   * BOTH IN ONE DROP, on purpose. A folder on its own would give an empty
   * list, and an empty list is also what a drop that never arrived gives — so
   * that check would pass whether the library filtered the folder out or the
   * browser refused the drag. One of each says both halves: the drop
   * demonstrably arrived, and exactly the file survived it.
   *
   * This library does not walk a directory. `filesFromDrop` keeps what the
   * base's own `isFileDropItem` guard admits and drops the rest.
   */
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.locator('.bb-file-upload-name')).toHaveText('kept.txt');
});

test('the keyboard reaches the zone, through the button the base hides', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);
  await tabIntoStory(page);

  const buttons = page.locator('.bb-file-upload-zone button');

  /*
   * TWO BUTTONS IN THE ZONE, and only one of them was written here. The other
   * is the reason a drop target passes this library's entry gate at all:
   * dragging cannot be done from a keyboard and never will be, so the base
   * renders a visually hidden button inside the zone and wires the clipboard
   * to it — a person tabs in and pastes.
   */
  await expect(buttons).toHaveCount(2);

  /*
   * It is the FIRST stop in the field, ahead of the button that opens the file
   * dialog, and it is what the field's label names — with the base's own word
   * glued on the front. "DropZone Attachments", measured, and left alone for
   * the reason `ComboBox` left "Show suggestions Doctor" alone; on doc 06
   * §5's list for the screen-reader pass.
   */
  await expect(buttons.first()).toBeFocused();
  await expect(buttons.first()).toHaveAccessibleName(/Attachments/);
  await expect(buttons.nth(1)).toHaveText('Choose files');
});

test('the zone looks different while a file is over it', async ({ page }) => {
  await gotoStory(page, ZONE);

  const zones = await page.locator('.bb-file-upload-zone').evaluateAll(found =>
    found.map(one => {
      const styles = getComputedStyle(one);
      return {
        border: styles.borderTopColor,
        style: styles.borderTopStyle,
        background: styles.backgroundColor
      };
    })
  );

  const [rest, hovered, focused, over] = zones;

  /*
   * A DASHED BORDER IS THE ONE CONVENTION THIS LIBRARY BORROWS. Nothing else
   * in it has one, and here it carries meaning: an area rather than a control,
   * which is exactly the difference between the zone and the button inside it.
   */
  for (const zone of zones) expect(zone.style).toBe('dashed');

  /* And each state is a different edge, or the response is not visible. */
  expect(hovered?.border).not.toBe(rest?.border);
  expect(focused?.border).not.toBe(rest?.border);
  expect(over?.border).not.toBe(rest?.border);

  /*
   * The drop target moves the FILL as well, which is the strongest signal the
   * component has and the state that most needs one.
   */
  expect(over?.background).not.toBe(rest?.background);
});

test('a row shows a bar named after its own file', async ({ page }) => {
  await gotoStory(page, STATES);

  const named = await page
    .locator('.bb-file-upload-list')
    .first()
    .ariaSnapshot();

  /*
   * READ FROM THE TREE. `Progress` is named by the file rather than by a word,
   * so a reader hears which one is at 43% — the alternative is three bars all
   * called "Uploading". That component shipped before this one for this row.
   */
  expect(named).toContain('list');
  expect(named).toMatch(/progressbar "site-photo-01\.jpg"/);
});

test('the size is formatted by the platform, in the units it uses', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const sizes = await page
    .locator('.bb-file-upload-size')
    .evaluateAll(found => found.slice(0, 3).map(one => one.textContent));

  /*
   * `Intl` supplies both the number and the unit's name, in the locale
   * received (doc 05 §3) — and the scale is powers of a thousand, because that
   * is the one `Intl` knows and the one an operating system shows.
   */
  expect(sizes).toEqual(['184 kB', '2.4 MB', '3.2 GB']);
});

test('in Arabic a row reads from the right, and so does its size', async ({
  page
}) => {
  await gotoStory(page, RTL);

  const row = await page
    .locator('.bb-file-upload-item-row')
    .first()
    .evaluate(one => {
      const name = one.querySelector('.bb-file-upload-name')!;
      const remove = one.querySelector('button')!;
      return {
        name: Math.round(name.getBoundingClientRect().x),
        remove: Math.round(remove.getBoundingClientRect().x),
        size: one.querySelector('.bb-file-upload-size')?.textContent
      };
    });

  /* The name starts at the right, and the cross is at the other end. */
  expect(row.name).toBeGreaterThan(row.remove);

  /*
   * AND THE STORY DECLARES A LOCALE RATHER THAN A DIRECTION, which is doc 05
   * §4.1 read forward: a `dir` attribute mirrors the layout and tells `Intl`
   * nothing, so a row with Arabic labels and "184 kB" beside them would be two
   * mechanisms disagreeing about the same page. The unit's name is Arabic and
   * the digits are the ones `ar-EG` writes numbers with.
   */
  expect(row.size).not.toMatch(/kB/);
  expect(row.size).toMatch(/[٠-٩]/);
});

test('an invalid field says so on its edge, not only underneath it', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const edges = await page.locator('.bb-file-upload-zone').evaluateAll(found =>
    found.map(one => ({
      invalid: one.getAttribute('data-invalid') === 'true',
      border: getComputedStyle(one).borderTopColor,
      /*
       * THE TOKEN, RESOLVED THE WAY THE BORDER IS. Reading `--bb-danger`
       * straight off the element gives the hex as authored (`#ce2c31`) while
       * a computed border colour is `rgb(206, 44, 49)` — the same colour and
       * a failing comparison. A probe carrying the variable comes back
       * through the same serialisation.
       */
      danger: (() => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--bb-danger)';
        one.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      })()
    }))
  );

  const invalid = edges.filter(one => one.invalid);
  const ordinary = edges.filter(one => !one.invalid);

  /*
   * FOUND BY OPENING THE FIRST BASELINE: the invalid zone was pixel-identical
   * to an ordinary one, with a red line of text underneath it. Every boxed
   * field in this library draws a danger border when it is invalid —
   * `controlBox` has since the first field — and a frame that says nothing
   * while the message says "required" is the frame lying by omission.
   *
   * Asserted against the TOKEN rather than against a remembered colour, and in
   * both modes: the danger step is defined per mode rather than derived.
   */
  expect(invalid).toHaveLength(2);
  for (const one of invalid) {
    expect(one.danger).not.toBe('');
    expect(one.border).toBe(one.danger);
  }
  for (const one of ordinary) expect(one.border).not.toBe(one.danger);
});

test('a disabled field offers no route in at all', async ({
  page,
  context
}) => {
  await gotoStory(page, STATES);

  const field = page.locator('.bb-file-upload').nth(4);
  const zone = field.locator('.bb-file-upload-zone');

  await expect(zone).toHaveAttribute('data-disabled', 'true');
  await expect(
    field.getByRole('button', { name: 'Choose files' })
  ).toBeDisabled();

  const drag = await dragging(page, context, onDisk(['refused.txt']));
  const { x, y } = await drag.over(zone);
  await drag.release(x, y);

  /*
   * AND THE ZONE NEVER LIGHTS UP, which is doc 06 §4's rule about a control
   * switched off read forward: a target that highlighted and then refused the
   * drop would be worse than one that never responded. The base gives a
   * disabled drop zone no handlers at all — read in `useDrop`, which returns
   * empty drop props before it returns anything else — so neither the state
   * nor the file can arrive. The row it already had is the one it keeps.
   */
  await expect(zone).not.toHaveAttribute('data-drop-target', 'true');
  await expect(field.getByRole('listitem')).toHaveCount(1);
});

test('and a disabled zone is a different fill from a live one, in both modes', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const fills = await page.locator('.bb-file-upload-zone').evaluateAll(found =>
    found.map(one => ({
      disabled: one.getAttribute('data-disabled') === 'true',
      mode: one.closest('[data-bb-mode]')?.getAttribute('data-bb-mode'),
      fill: getComputedStyle(one).backgroundColor
    }))
  );

  /*
   * PER MODE, because that is where the first version was wrong. The zone was
   * dimmed with `opacity-50`, which axe failed on the hint inside it — and the
   * token that NAMES the state could not replace it: `surface-disabled` is
   * gray-2 in both modes and the zone's rest fill is `surface-sunken`, which
   * is gray-3 in light and the same gray-2 in dark. A disabled zone would have
   * been pixel-identical to a live one on the dark side, which is the defect
   * the slider shipped once (doc 03 §5, and it is invisible in one mode).
   */
  for (const mode of ['light', 'dark']) {
    const here = fills.filter(one => one.mode === mode);
    const off = here.filter(one => one.disabled);
    const live = here.filter(one => !one.disabled);

    expect(off).toHaveLength(1);
    expect(live.length).toBeGreaterThan(0);
    for (const one of live) expect(one.fill).not.toBe(off[0]?.fill);
  }
});
