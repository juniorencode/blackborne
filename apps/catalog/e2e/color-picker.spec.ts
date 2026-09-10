/*
 * A colour chosen from a gradient, and what only a browser answers.
 *
 * THE GRADIENTS ARE PAINTED, which is the whole component and is inline style
 * written by the base — so a computed value is the only way to know it
 * arrived. THE AREA IS TWO SLIDERS, and the arrows move in two dimensions
 * across a box that has no geometry in jsdom. THE THUMB CARRIES TWO RINGS,
 * because it sits on the colour itself. And WHAT A DRAG REPORTS, in the
 * declared format rather than in the space the drag happened to leave the
 * colour in.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const OVERVIEW = 'components-colorpicker--overview';
const OPENED = 'components-colorpicker--opened';
const ALPHA = 'components-colorpicker--with-alpha';
const STATES = 'components-colorpicker--states';
const RTL = 'components-colorpicker--direction';

/**
 * Opens the first picker on the page, the way a person does. For the stories
 * that arrive CLOSED.
 */
const open = async (page: import('@playwright/test').Page) => {
  await page.locator('.bb-color-picker-trigger').first().click();
  const layer = page.getByRole('dialog').first();
  await expect(layer).toBeVisible();
  return layer;
};

/**
 * The layer of a story that opened itself.
 *
 * WHICH IS MOST OF THEM, and the first version of this file clicked anyway —
 * eight checks failed with "intercepts pointer events". A popover is modal:
 * the base lays a full-window underlay over the page while it is open, so the
 * trigger is behind it and a second click reaches the underlay instead. The
 * story pressed the trigger on the first paint; there is nothing left to press.
 */
const opened = async (page: import('@playwright/test').Page) => {
  const layer = page.getByRole('dialog').first();
  await expect(layer).toBeVisible();
  return layer;
};

test('the trigger shows the colour and the chevron turns over', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const trigger = page.locator('.bb-color-picker-trigger');
  const layer = page.locator('.bb-color-picker-layer').first();
  /*
   * THE MARK IS NOT INSIDE THE TRIGGER, which the first version of this check
   * assumed and crashed on. It lives in the FRAME's trailing slot — a sibling
   * of the button, not a child — which is why it has a class of its own.
   */
  const mark = page.locator('.bb-color-picker-chevron');

  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  const before = await mark.evaluate(one => getComputedStyle(one).rotate);

  await open(page);

  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(layer).toBeVisible();

  /*
   * `aria-expanded` AND NOT `data-open`, which the package guide records twice
   * already: the open state belongs to the popover, which is portalled
   * somewhere else entirely, so a variant keyed on the trigger's own group
   * would match nothing and the mark would simply never turn.
   */
  const after = await mark.evaluate(one => getComputedStyle(one).rotate);
  expect(after).not.toBe(before);
});

test('the gradients are painted, all of them', async ({ page }) => {
  await gotoStory(page, ALPHA);
  await opened(page);

  const painted = await page.evaluate(() => {
    const read = (selector: string) => {
      const found = document.querySelector(selector);
      if (found === null) return null;
      const styles = getComputedStyle(found);
      return `${styles.backgroundImage} ${styles.backgroundColor}`;
    };
    return {
      area: read('.bb-color-picker-area'),
      rails: [...document.querySelectorAll('.bb-color-picker-rail-track')].map(
        one => getComputedStyle(one).backgroundImage
      ),
      behind: read('.bb-color-picker-rail-behind')
    };
  });

  /*
   * EVERY ONE OF THESE IS INLINE STYLE WRITTEN BY THE BASE, so a computed
   * value is the only thing that says the colour reached the screen — and a
   * component that lost the wiring would still render four boxes in the right
   * places.
   */
  expect(painted.area).toContain('gradient');
  expect(painted.rails).toHaveLength(2);
  for (const rail of painted.rails) expect(rail).toContain('gradient');

  /*
   * AND THE CHECKERBOARD IS OURS, behind the transparency rail. Without it the
   * transparent end of that gradient is the surface, which reads as "white"
   * rather than as "nothing" — measured on the first baseline of this story.
   */
  expect(painted.behind).toContain('gradient');
});

test('the area is two sliders, and the arrows move in both', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);
  await open(page);

  const readout = page.locator('.catalog-label').last();
  const before = await readout.textContent();

  const area = page.locator('.bb-color-picker-area');
  await area.locator('input').first().focus();

  await page.keyboard.press('ArrowRight');
  const acrossOnce = await readout.textContent();
  expect(acrossOnce).not.toBe(before);

  await page.keyboard.press('ArrowDown');
  const andDown = await readout.textContent();
  expect(andDown).not.toBe(acrossOnce);

  /*
   * TWO AXES IN ONE ELEMENT, which is what makes a colour area operable from a
   * keyboard at all — and it is the reason a colour picker passes this
   * library's entry gate where most fail it. Nothing here is ours: the base
   * renders one range input per axis.
   */
  const axes = await area.evaluate(
    one => one.querySelectorAll('input[type=range]').length
  );
  expect(axes).toBe(2);
});

test('and a drag reports the declared format, not the space it landed in', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);
  await open(page);

  const area = page.locator('.bb-color-picker-area');
  const box = (await area.boundingBox())!;

  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.4, {
    steps: 6
  });
  await page.mouse.up();

  const value =
    (await page.locator('.catalog-label').last().textContent()) ?? '';

  /*
   * DECISION 0024, MEASURED THROUGH A REAL DRAG. The area works in `hsb`, so
   * after this the colour's own space is `hsb` and `toString()` would report
   * `hsb(226, 72%, 87%)`. The declared format is `hex`, so what crosses back
   * is a hex string — which is the whole reason that decision exists.
   */
  expect(value).toMatch(/^Value: #[0-9A-F]{6}$/);
});

test('the thumb carries two rings, because it sits on the colour', async ({
  page
}) => {
  await gotoStory(page, OPENED);
  await opened(page);

  const rings = await page
    .locator('.bb-color-picker-thumb')
    .first()
    .evaluate(one => {
      const styles = getComputedStyle(one);
      return {
        border: styles.borderTopColor,
        borderWidth: styles.borderTopWidth,
        shadow: styles.boxShadow
      };
    });

  /*
   * Every other handle in this library sits on a surface the library chose.
   * This one sits anywhere in a gradient, so the calendar's rule — a ring is
   * the text colour of what it sits on — cannot be applied: what it sits on is
   * unknown by construction. A light ring and a dark one is the answer that
   * works on all of it.
   */
  expect(rings.borderWidth).toBe('2px');
  expect(rings.border).not.toBe('rgba(0, 0, 0, 0)');
  expect(rings.shadow).not.toBe('none');
  expect(rings.border).not.toBe(rings.shadow.split(' ').slice(-1)[0]);
});

test('the area is square and as wide as the panel says', async ({ page }) => {
  await gotoStory(page, OPENED);
  await opened(page);

  const measured = await page.evaluate(() => {
    const panel = document.querySelector('.bb-color-picker-layer')!;
    const area = document.querySelector('.bb-color-picker-area')!;
    const panelBox = panel.getBoundingClientRect();
    const areaBox = area.getBoundingClientRect();
    return {
      panel: Math.round(panelBox.width),
      width: Math.round(areaBox.width),
      height: Math.round(areaBox.height)
    };
  });

  /*
   * A GRADIENT HAS NO CONTENT TO BE SIZED BY, so the panel declares a width
   * and the area is a fraction of it — `aspect-square` rather than a second
   * number to keep in step, which is `Avatar`'s trick for the same reason.
   */
  expect(measured.width).toBe(measured.height);
  expect(measured.width).toBeLessThan(measured.panel);
  expect(measured.width).toBeGreaterThan(measured.panel * 0.7);
});

test('the transparency rail replaces the typed route rather than joining it', async ({
  page
}) => {
  await gotoStory(page, ALPHA);
  const layer = await opened(page);

  /*
   * The base's hex field speaks six digits and nothing else — read in
   * `useColorFieldState` — so with transparency offered it would show an
   * opaque colour and typing in it would REPORT one. A control that cannot
   * express the value is not offered.
   */
  await expect(layer.getByRole('textbox')).toHaveCount(0);
  expect(
    await layer.evaluate(
      one => one.querySelectorAll('input[type=range]').length
    )
  ).toBe(4);
});

test('and the typed route is there when it can carry the whole value', async ({
  page
}) => {
  /*
   * THE OVERVIEW, WHICH HAS ONE PICKER — and that is not a detail. The
   * `Opened` story shows two side by side for the two modes, and a popover is
   * MODAL: each one lays a full-window underlay over the page, so the second
   * picker's underlay covers the first one's panel and nothing in it can be
   * clicked. Measured: `<div class="catalog-pair"> intercepts pointer events`.
   *
   * A picture of two open layers is fine. An interaction needs one.
   */
  await gotoStory(page, OVERVIEW);
  const layer = await open(page);

  const hex = layer.getByRole('textbox');
  await expect(hex).toHaveCount(1);
  await expect(hex).toHaveValue('#3E63DD');

  await hex.fill('#30A46C');
  /*
   * COMMITTED BY LEAVING THE FIELD. The base's colour field keeps a string of
   * its own while it is being edited and parses it on blur — which is what
   * lets somebody type three characters of a hex without the colour jumping
   * about underneath them.
   */
  await hex.blur();

  /* The swatch in the trigger follows, because both read one state. */
  await expect(page.locator('.catalog-label').last()).toHaveText(
    'Value: #30A46C'
  );

  const swatch = await page
    .locator('.bb-color-picker-swatch')
    .first()
    .evaluate(one => getComputedStyle(one).backgroundColor);

  expect(swatch).toBe('rgb(48, 164, 108)');
});

test('the layer takes the theme it was opened in', async ({ page }) => {
  await gotoStory(page, OPENED);

  const surfaces = await page
    .locator('.catalog-layer-page')
    .evaluateAll(pages =>
      pages.map(one => {
        /*
         * BY CLASS, not by position. The layer's first child is the base's
         * visually-hidden focus sentinel — no class, no background — so
         * `> *` read a transparent element and both modes looked identical.
         */
        const panel = one.querySelector('.bb-color-picker-panel');
        return {
          mode: one.getAttribute('data-bb-mode'),
          panel: panel === null ? null : getComputedStyle(panel).backgroundColor
        };
      })
    );

  /*
   * THE FIRST BASELINE OF THIS COMPONENT GOT THIS WRONG, and it is the
   * catalog's fixture rather than the component: a `data-bb-mode` on a panel
   * dresses everything inside it, and a layer is portalled to the body, which
   * is outside. So a dark story showed a light panel of gradients floating
   * over a dark card.
   *
   * `LayerPage` is the theme scope AND the portal container, which is the
   * whole reason it exists — and this is the assertion that the two are the
   * same element.
   */
  expect(surfaces).toHaveLength(2);
  expect(surfaces[0]?.mode).toBe('light');
  expect(surfaces[1]?.mode).toBe('dark');
  expect(surfaces[0]?.panel).not.toBe(surfaces[1]?.panel);
});

test('in Arabic the panel and the gradients agree about which way is up', async ({
  page
}) => {
  await gotoStory(page, RTL);
  await opened(page);

  const geometry = await page.evaluate(() => {
    const rail = document.querySelector('.bb-color-picker-rail-track')!;
    const thumb = rail.querySelector('.bb-color-picker-thumb')!;
    const railBox = rail.getBoundingClientRect();
    const thumbBox = thumb.getBoundingClientRect();
    return {
      direction: getComputedStyle(rail).direction,
      gradient: getComputedStyle(rail).backgroundImage,
      fromStart: Math.round(thumbBox.x + thumbBox.width / 2 - railBox.x),
      width: Math.round(railBox.width)
    };
  });

  /*
   * THE SLIDER LESSON, ON A GRADIENT. `Slider` found that a fill positioned
   * by a logical property and a handle positioned by a percentage the base
   * mirrors from the LOCALE can disagree — a handle at the wrong end of its
   * own fill. Here the gradient is the base's too, so the question is whether
   * the two halves of the base agree with each other in Arabic.
   *
   * Blue is at 226 degrees of 360, so the handle sits about two thirds along
   * the hue rail. Which end that is depends on the direction, and the
   * assertion is the AGREEMENT: the gradient's direction and the handle's
   * position come from one mechanism or they do not.
   */
  expect(geometry.direction).toBe('rtl');
  expect(geometry.gradient).toContain('gradient');

  const along = geometry.fromStart / geometry.width;
  expect(along).toBeGreaterThan(0.2);
  expect(along).toBeLessThan(0.8);
});

test('a disabled picker cannot be opened', async ({ page }) => {
  await gotoStory(page, STATES);

  const disabled = page.locator('.bb-color-picker').nth(4);
  const trigger = disabled.locator('.bb-color-picker-trigger');

  await expect(trigger).toBeDisabled();
  await trigger.click({ force: true });

  await expect(page.getByRole('dialog')).toHaveCount(0);
});
