/*
 * A picture of somebody, and what only a browser answers.
 *
 * THE BOX IS SQUARE AND MATCHES A CONTROL, which is the whole reason it is
 * sized off the control heights — and it is the check that catches a width
 * utility compiling to nothing, which happened here on the first attempt.
 * THE IMAGE ACTUALLY PAINTS AND IS CLIPPED to the circle, because a computed
 * style is not paint. A REAL 404 falls back, which jsdom cannot produce at all.
 * And THE ACCESSIBILITY TREE, read for once rather than asserted through a
 * mechanism — which is where this component's own claim got corrected: the
 * name on the box is verified, and whether a reader also says the letters
 * inside it is not something this tool answers.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const STATES = 'components-avatar--states';
const IN_A_ROW = 'components-avatar--in-a-row';
const BESIDE = 'components-avatar--beside-a-name';
const COMPACT = 'components-avatar--compact';

test('it is square, at every size', async ({ page }) => {
  await gotoStory(page, STATES);

  const boxes = await page
    .locator('.catalog-panel')
    .first()
    .evaluate(panel =>
      [...panel.querySelectorAll('.bb-avatar')].map(one => {
        const box = one.getBoundingClientRect();
        return {
          width: Math.round(box.width),
          height: Math.round(box.height)
        };
      })
    );

  /*
   * THE CHECK THAT FOUND A CLASS COMPILING TO NOTHING. The first version sized
   * this with `w-control-md`, and the theme has `--height-control-*` and no
   * `--width-control-*` — rightly, because a control's width is its contents.
   * So the utility produced no rule, the circle had a height and no width, and
   * nothing in the source looked wrong. It takes its width from
   * `aspect-square` now.
   */
  expect(boxes.length).toBeGreaterThan(5);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(20);
    expect(box.width).toBe(box.height);
  }

  /* And the three sizes are three sizes, in order. */
  const three = boxes.slice(0, 3).map(box => box.height);
  expect(three[0]!).toBeLessThan(three[1]!);
  expect(three[1]!).toBeLessThan(three[2]!);
});

test('and it is exactly as tall as a control of the same size', async ({
  page
}) => {
  await gotoStory(page, IN_A_ROW);

  const rows = await page.locator('.catalog-row').evaluateAll(found =>
    found.map(row => ({
      avatar: Math.round(
        row.querySelector('.bb-avatar')!.getBoundingClientRect().height
      ),
      button: Math.round(
        row.querySelector('button')!.getBoundingClientRect().height
      ),
      field: Math.round(
        row.querySelector('.bb-field-box')!.getBoundingClientRect().height
      )
    }))
  );

  /*
   * THE WHOLE ARGUMENT FOR THE SCALE. An avatar sits in a row with a button, a
   * field, a table cell — so it borrows `--bb-control-height-*` rather than
   * inventing three numbers, and this is the row either lining up or not.
   */
  expect(rows).toHaveLength(3);
  for (const row of rows) {
    expect(row.avatar).toBe(row.button);
    expect(row.avatar).toBe(row.field);
  }
});

test('compact moves it with the row and keeps it square', async ({ page }) => {
  await gotoStory(page, COMPACT);

  const perDensity = await page.locator('.catalog-panel').evaluateAll(panels =>
    panels.map(panel => {
      const first = panel.querySelector('.bb-avatar')!.getBoundingClientRect();
      return {
        density: panel.getAttribute('data-bb-density'),
        height: Math.round(first.height),
        width: Math.round(first.width)
      };
    })
  );

  const [normal, compact] = perDensity;

  /*
   * Doc 03 §3: density moves control heights, and an avatar is sized off them
   * on purpose — so a dense table's faces shrink with the rows rather than
   * being the one thing that did not get the message.
   */
  expect(normal?.density).toBe('normal');
  expect(compact?.density).toBe('compact');
  expect(compact!.height).toBeLessThan(normal!.height);
  expect(compact!.width).toBe(compact!.height);
});

test('the picture is painted, and clipped to the circle', async ({ page }) => {
  await gotoStory(page, STATES);

  const avatar = page.locator('.bb-avatar').nth(2);
  const box = (await avatar.boundingBox())!;

  const hit = await page.evaluate(
    ([x, y, cornerX, cornerY]) => {
      const middle = document.elementFromPoint(x!, y!);
      const corner = document.elementFromPoint(cornerX!, cornerY!);
      return {
        middle: middle?.tagName.toLowerCase() ?? null,
        cornerIsAvatar: corner?.closest('.bb-avatar') !== null
      };
    },
    [
      box.x + box.width / 2,
      box.y + box.height / 2,
      box.x + 1,
      box.y + 1
    ] as const
  );

  /*
   * A COMPUTED STYLE IS NOT PAINT, which this repository has paid for once
   * already: an arrow with the right box, the right rotation and
   * `visibility: visible` drew nothing at all, because clipped content is not
   * hit-tested. So the middle of the circle has to BE the image.
   */
  expect(hit.middle).toBe('img');

  /*
   * And the top-left of the bounding box is outside a circle inscribed in it,
   * so nothing of the avatar may be hit-tested there. That is `rounded-full`
   * plus `overflow-hidden` measured rather than assumed — a square photograph
   * in a round box is only round if the box clips.
   */
  expect(hit.cornerIsAvatar).toBe(false);
});

test('a picture that does not arrive falls back to the letters', async ({
  page
}) => {
  await gotoStory(page, STATES);

  /*
   * `.first()`, because the story photographs the same set in light and dark
   * and every avatar in it therefore exists twice. The panel is not the scope
   * that matters here — the failure is the same in both — so one of them is
   * the honest read.
   */
  const broken = page.locator('.bb-avatar').filter({ hasText: 'BP' }).first();

  /*
   * A REAL FAILURE IN A BROWSER, which is the half jsdom cannot produce: it
   * loads nothing, so a broken src there fires no error event at all and the
   * unit test has to dispatch one by hand. Here the browser does it — and the
   * story's `BROKEN` is a data uri that cannot DECODE rather than a url that
   * 404s, so the fallback is reached without a request and at the same moment
   * on every machine (`Avatar.stories.tsx`).
   *
   * The fallback's presence is asserted as well as the image's absence, which
   * is the positive half: `imagesSettled` cannot prove the swap happened —
   * `complete` is already true when `onError` runs — so this is the only place
   * that does (doc 10 §11.1).
   */
  await expect(broken).toHaveCount(1);
  await expect(broken.locator('.bb-avatar-fallback')).toHaveCount(1);
  await expect(broken.locator('img')).toHaveCount(0);
  await expect(broken).toHaveAttribute('role', 'img');
  await expect(broken).toHaveAttribute('aria-label', 'Broken picture');
});

test('the letters stay inside the circle, however many there are', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const long = await page
    .locator('.bb-avatar')
    .filter({ hasText: 'ÁÉÍ' })
    .first()
    .evaluate(one => {
      const box = one.getBoundingClientRect();
      const text = one
        .querySelector('.bb-avatar-fallback')!
        .getBoundingClientRect();
      return {
        overflow: Math.round(text.width - box.width),
        scroll: one.scrollWidth - one.clientWidth
      };
    });

  /*
   * Three accented capitals at the default size, which is the case `truncate`
   * is there for: a fallback wider than its circle would paint over whatever
   * is beside it, and an avatar in a row is always beside something.
   */
  expect(long.overflow).toBeLessThanOrEqual(0);
  expect(long.scroll).toBe(0);
});

test('the accessibility tree holds the name and not the letters', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const named = await page
    .locator('.bb-avatar')
    .filter({ hasText: 'AV' })
    .first()
    .ariaSnapshot();

  /*
   * READ FROM THE TREE, which is unusual in this suite — and it CORRECTED the
   * claim this component was written with.
   *
   * The intent was that `role="img"` is a leaf, so the letters inside it are
   * not announced. The ARIA specification agrees: `img` is marked "children
   * presentational". What the snapshot actually reads is:
   *
   *     - img "Ana Vega": AV
   *
   * — the name is right AND the text is still in the node. So this tool does
   * not settle whether a reader says the letters, and the component's comment
   * no longer claims it does. The question is on doc 06 §5's list, where a
   * person with a screen reader is what answers it.
   *
   * What IS settled, and is the half worth guarding: the accessible name is the
   * person's name rather than the two letters on the screen. A component that
   * put the name on an `<img alt>` instead would read "AV" here the moment the
   * image failed.
   */
  expect(named).toContain('img "Ana Vega"');
  expect(named).not.toContain('img "AV"');
});

test('and a decorative one is not in the tree at all', async ({ page }) => {
  await gotoStory(page, BESIDE);

  const row = page.locator('.catalog-row').first();
  const snapshot = await row.ariaSnapshot();

  /*
   * BESIDE THE NAME IT BELONGS TO. The text says "Carlos Ramos", so an avatar
   * that also said it would have a reader hear it twice in one breath — the
   * arrangement `Spinner` has, and this is the assertion that it holds: the
   * tree has the words once and no image at all.
   */
  expect(snapshot).not.toContain('img');
  expect(snapshot).toContain('Carlos Ramos');
  expect(await row.locator('[role=img]').count()).toBe(0);
});
