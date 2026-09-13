/*
 * One value on a range, and what only a browser answers.
 *
 * THE KEYBOARD, because jsdom implements none of what a range input gives —
 * the arrows, the pages and the two ends. THE TRACK AS A TARGET, which needs a
 * pointer with coordinates and a hit area measured at both densities. WHICH
 * WAY THE FILL GROWS, which is the half of RTL support that a logical property
 * gets right for free and a physical one gets wrong silently. And THE THUMB
 * SITTING ON THE RAIL, which is a vertical position the base does not set and
 * this component does.
 */
import { expect, test } from '@playwright/test';
import { contrast } from './colour';
import { gotoStory } from './story';

const OVERVIEW = 'components-slider--overview';
const STATES = 'components-slider--states';
const RTL = 'components-slider--direction';
const COMPACT = 'components-slider--compact';

/**
 * The value the control reports, formatted the way a reader hears it.
 *
 * Only usable where the story declares an English locale. In Arabic the same
 * attribute reads `٣٠` — measured — because the base formats through the
 * locale it was given, so a check that parsed the announced number would be
 * measuring the locale. The RTL checks below read the raw value and the
 * geometry instead.
 */
const said = (page: import('@playwright/test').Page) =>
  page
    .getByRole('slider')
    .first()
    .evaluate(control => control.getAttribute('aria-valuetext'));

/** The raw number, which is the same in every locale. */
const held = (page: import('@playwright/test').Page) =>
  page
    .getByRole('slider')
    .first()
    .evaluate(control => Number((control as HTMLInputElement).value));

/** Where the handle is, which is what a person actually sees. */
const handle = (page: import('@playwright/test').Page) =>
  page
    .locator('.bb-slider-thumb')
    .first()
    .evaluate(thumb => Math.round(thumb.getBoundingClientRect().x));

test('the arrows, the pages and the two ends all move it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const control = page.getByRole('slider');
  await control.focus();

  /*
   * NONE OF THIS IS OURS, and that is the point of asserting it: the base
   * renders a real `<input type="range">`, so the whole keyboard comes from
   * the platform. A slider built as a div with a drag handler has to
   * reimplement every one of these, which is the last resort doc 06 §2 asks
   * for a written justification for.
   */
  await page.keyboard.press('ArrowRight');
  expect(await said(page)).toBe('41');

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  expect(await said(page)).toBe('39');

  await page.keyboard.press('End');
  expect(await said(page)).toBe('100');

  await page.keyboard.press('Home');
  expect(await said(page)).toBe('0');

  await page.keyboard.press('PageUp');
  const paged = Number(await said(page));
  expect(paged).toBeGreaterThan(1);
});

test('the reported value settles once, and moves many times', async ({
  page
}) => {
  await gotoStory(page, OVERVIEW);

  const readout = page.locator('.catalog-label').last();
  const control = page.getByRole('slider');
  await control.focus();

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');

  /*
   * TWO CALLBACKS AND THEY ARE NOT THE SAME. `onChange` reports every step and
   * `onChangeEnd` reports where the value came to rest — which is what a
   * slider filtering a listing has to use, because a request per step of a
   * drag is doc 09 §7's problem arriving through a control. The story prints
   * both, so the difference is visible rather than described.
   */
  await expect(readout).toHaveText('onChange: 43 · onChangeEnd: 43');
});

test('the track can be pressed anywhere along it', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const track = page.locator('.bb-slider-track');
  const box = (await track.boundingBox())!;

  /*
   * THE TARGET IS THE TRACK, not the thumb — the base moves the nearest thumb
   * to wherever the track was pressed. Pressed at three quarters of the way
   * along, and not on the thumb, which is sitting at 40.
   */
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2);

  const landed = Number(await said(page));
  expect(landed).toBeGreaterThan(70);
  expect(landed).toBeLessThan(80);
});

test('and dragging it reports every step on the way', async ({ page }) => {
  await gotoStory(page, OVERVIEW);

  const track = page.locator('.bb-slider-track');
  const box = (await track.boundingBox())!;
  const thumb = page.locator('.bb-slider-thumb');
  const start = (await thumb.boundingBox())!;

  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();

  /* Mid-drag, and the state is on the thumb rather than on the track. */
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, {
    steps: 8
  });
  await expect(thumb).toHaveAttribute('data-dragging', 'true');

  await page.mouse.up();
  await expect(thumb).not.toHaveAttribute('data-dragging', 'true');

  const landed = Number(await said(page));
  expect(landed).toBeGreaterThan(55);
  expect(landed).toBeLessThan(65);
});

test('the thumb sits on the rail rather than above it', async ({ page }) => {
  await gotoStory(page, STATES);

  const measured = await page
    .locator('.bb-slider')
    .first()
    .evaluate(root => {
      const rail = root
        .querySelector('.bb-slider-rail')!
        .getBoundingClientRect();
      const thumb = root
        .querySelector('.bb-slider-thumb')!
        .getBoundingClientRect();
      const knob = root
        .querySelector('.bb-slider-knob')!
        .getBoundingClientRect();
      return {
        railMiddle: Math.round(rail.y + rail.height / 2),
        thumbMiddle: Math.round(thumb.y + thumb.height / 2),
        knobMiddle: Math.round(knob.y + knob.height / 2),
        knobHeight: Math.round(knob.height),
        railHeight: Math.round(rail.height)
      };
    });

  /*
   * THE BASE SETS `left` AND A TRANSFORM AND NO VERTICAL POSITION AT ALL —
   * read in its source and confirmed here. `transform: translate(-50%, -50%)`
   * against a static position at the top of the track would pull the thumb
   * half its height above the rail, so `top-1/2` is ours and it is load
   * bearing. Nothing in the DOM says it is missing; the thumb simply floats.
   */
  expect(Math.abs(measured.thumbMiddle - measured.railMiddle)).toBeLessThan(2);
  expect(Math.abs(measured.knobMiddle - measured.railMiddle)).toBeLessThan(2);

  /* And the knob is bigger than the rail is thick, or it is not a handle. */
  expect(measured.knobHeight).toBeGreaterThan(measured.railHeight);
});

test('the target clears the minimum at both densities', async ({ page }) => {
  const measure = async (story: string) => {
    await gotoStory(page, story);
    return page
      .locator('.bb-slider')
      .first()
      .evaluate(root => {
        const track = root
          .querySelector('.bb-slider-track')!
          .getBoundingClientRect();
        const knob = root
          .querySelector('.bb-slider-knob')!
          .getBoundingClientRect();
        return {
          track: Math.round(track.height),
          knob: Math.round(knob.height),
          type: getComputedStyle(root.querySelector('.bb-slider-label')!)
            .fontSize
        };
      });
  };

  const normal = await measure(STATES);
  const compact = await measure(COMPACT);

  /*
   * 28px and 24px, and 24 is the floor at EVERY density (doc 06 §3). Doc 03
   * allows the control to look smaller than its active zone measures, with
   * transparent padding — which is exactly what the thumb is: a box of the hit
   * area with a smaller circle drawn inside it.
   */
  expect(normal.track).toBeGreaterThanOrEqual(28);
  expect(compact.track).toBeGreaterThanOrEqual(24);

  /* The thumb shrinks with every other box, and the type does not move. */
  expect(compact.knob).toBeLessThan(normal.knob);
  expect(compact.type).toBe(normal.type);
});

test('and in Arabic the handle follows the key, not the number', async ({
  page
}) => {
  await gotoStory(page, RTL);

  await page.getByRole('slider').first().focus();

  const before = { value: await held(page), x: await handle(page) };
  await page.keyboard.press('ArrowRight');
  const after = { value: await held(page), x: await handle(page) };

  /*
   * THE VALUE GOES DOWN AND THE HANDLE GOES RIGHT, which is the same fact
   * twice: in a right-to-left row the maximum is at the left, so the arrow
   * pointing right moves towards the minimum. Both halves are asserted
   * because either one alone would pass while the control was broken — the
   * defect below is exactly a value and a position that disagreed.
   */
  expect(after.value).toBeLessThan(before.value);
  expect(after.x).toBeGreaterThan(before.x);

  /* And the block axis is not mirrored: up is more, in every language. */
  await page.keyboard.press('ArrowUp');
  expect(await held(page)).toBe(before.value);
});

test('the handle is at the leading edge of the fill, in both directions', async ({
  page
}) => {
  const agreement = async (story: string) => {
    await gotoStory(page, story);
    return page
      .locator('.bb-slider')
      .first()
      .evaluate(root => {
        const rail = root
          .querySelector('.bb-slider-rail')!
          .getBoundingClientRect();
        const fill = root
          .querySelector('.bb-slider-fill')!
          .getBoundingClientRect();
        const thumb = root
          .querySelector('.bb-slider-thumb')!
          .getBoundingClientRect();
        const percent = (x: number) =>
          Math.round(((x - rail.x) / rail.width) * 1000) / 10;
        return {
          thumb: percent(thumb.x + thumb.width / 2),
          fillStart: percent(fill.x),
          fillEnd: percent(fill.x + fill.width)
        };
      });
  };

  /*
   * THE INVARIANT THIS COMPONENT'S ONE REAL DEFECT BROKE, and it is worth
   * stating rather than checking the two ends separately.
   *
   * The fill's offset is `insetInlineStart`, a logical CSS property that the
   * stylesheet mirrors on its own. The handle's is a computed `left`
   * percentage that the base mirrors only when the LOCALE it was given is
   * right-to-left. So a story with `dir="rtl"` and no locale draws the fill
   * along the right of the rail and the handle at 30% from the LEFT —
   * measured, a handle at the wrong end of its own fill, with nothing wrong in
   * the DOM and no assertion in this file catching it.
   *
   * Two mechanisms answering one question have to agree, and this is the
   * assertion that says so whatever the cause.
   */
  const ltr = await agreement(STATES);
  /* Which is also "the fill grows from the other end", so there is one check
     for it rather than two. */
  expect(ltr.fillStart).toBe(0);
  expect(Math.abs(ltr.thumb - ltr.fillEnd)).toBeLessThanOrEqual(1);

  const rtl = await agreement(RTL);
  expect(rtl.fillEnd).toBe(100);
  expect(Math.abs(rtl.thumb - rtl.fillStart)).toBeLessThanOrEqual(1);
});

test('a disabled slider still shows what it holds', async ({ page }) => {
  await gotoStory(page, STATES);

  const slider = page.locator('.bb-slider').nth(4);
  const colours = await slider.evaluate(root => ({
    disabled: root.querySelector('input')!.disabled,
    rail: getComputedStyle(root.querySelector('.bb-slider-rail')!)
      .backgroundColor,
    fill: getComputedStyle(root.querySelector('.bb-slider-fill')!)
      .backgroundColor
  }));

  /*
   * The ratio is taken OUTSIDE the page now, through `e2e/colour`. The reading
   * used to be a regex over the computed value with a fallback to black, which
   * is worse than throwing: since the palette is published in `oklch`, that
   * regex matches nothing and the helper would have reported a confident ratio
   * against a colour nobody painted.
   */
  const seen = {
    disabled: colours.disabled,
    ratio: await contrast(page, colours.rail, colours.fill)
  };

  /*
   * THE FIRST BASELINE IS WHAT FOUND THIS. The disabled fill was
   * `surface-disabled`, which against the rail measures **1.08:1 in light and
   * 1.00:1 in dark** — the same colour exactly — so a disabled slider showed
   * no value at all. A control that must not be changed still has to say what
   * it holds, which is the claim `Calendar` shipped and had to correct.
   *
   * `text-disabled` reads 2.90:1 here. Not the 3:1 doc 03 §5 rule 2 asks of a
   * graphical element carrying information — WCAG exempts an inactive control
   * from that floor — and the token was chosen for what it NAMES rather than
   * for a number: the one that clears the floor comfortably would draw a
   * disabled fill with more contrast than the live accent has.
   */
  expect(seen.disabled).toBe(true);
  expect(seen.ratio).toBeGreaterThan(2.5);
});

test('the handle overhangs the box by half the target, at both ends', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const ends = await page.locator('.bb-slider').evaluateAll(roots => {
    const measure = (root: Element) => {
      const box = root.getBoundingClientRect();
      const thumb = root
        .querySelector('.bb-slider-thumb')!
        .getBoundingClientRect();
      return {
        value: Number((root.querySelector('input') as HTMLInputElement).value),
        past: Math.round(thumb.x + thumb.width - (box.x + box.width))
      };
    };
    return roots.map(measure);
  });

  /*
   * PINNED RATHER THAN FIXED, and the number is the decision.
   *
   * The handle's CENTRE marks the value, which is what a slider means — so at
   * the maximum, half of it is outside the component's own box: 14px, exactly
   * half the 28px target. Standard for the control and left alone, because the
   * alternative is insetting the rail by 14px at each end, which costs 9% of a
   * 320px panel and stops the rail lining up with a `Progress` bar above it.
   *
   * What it means for a consumer: a `Slider` inside a box with
   * `overflow: hidden` and no padding loses half its handle at the extremes.
   * Asserted here so the number is known and a change to it is a failure
   * rather than a surprise.
   */
  const atMax = ends.find(one => one.value === 100);
  expect(atMax?.past).toBe(14);

  /* And nothing overhangs while the value is anywhere else. */
  for (const one of ends) if (one.value < 100) expect(one.past).toBeLessThan(0);
});

test('a disabled slider refuses the keyboard and the pointer', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const disabled = page.locator('.bb-slider').nth(4);
  const control = disabled.getByRole('slider');

  await expect(control).toBeDisabled();

  const before = await control.evaluate(
    node => (node as HTMLInputElement).value
  );

  const track = disabled.locator('.bb-slider-track');
  const box = (await track.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);

  expect(await control.evaluate(node => (node as HTMLInputElement).value)).toBe(
    before
  );
});

test('the description is announced and the number is not said twice', async ({
  page
}) => {
  await gotoStory(page, STATES);

  const withDescription = page.locator('.bb-slider').nth(1);

  const wiring = await withDescription.evaluate(root => {
    const control = root.querySelector('input[type=range]')!;
    const id = (control.getAttribute('aria-describedby') ?? '').trim();
    return {
      id,
      described: id === '' ? null : document.getElementById(id)?.textContent,
      output: root.querySelector('output')?.textContent,
      valueText: control.getAttribute('aria-valuetext')
    };
  });

  /*
   * The description is wired by hand, because the base publishes no text
   * context for a slider at all — measured in its source, and this is the
   * consequence being asserted rather than the source.
   */
  expect(wiring.described).toBe('Higher values cost more to render');

  /*
   * AND THE OUTPUT IS NOT REFERENCED BY THE CONTROL, which is deliberate: the
   * formatted value is already on it as `aria-valuetext`, so pointing
   * `aria-describedby` at the same number would have a reader say it twice.
   * The `<output>` is for eyes.
   */
  expect(wiring.output).toBe(wiring.valueText);
  expect(wiring.id).not.toContain('output');
});
