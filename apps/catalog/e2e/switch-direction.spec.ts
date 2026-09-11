/*
 * Which way the thumb travels, in both writing directions.
 *
 * This is the assertion a switch most needs and the one a unit test cannot
 * make: the thumb has to move toward the END of the line, and "end" is the
 * opposite side of the screen in Arabic or Hebrew. Getting it wrong produces a
 * switch that looks on when it is off — the failure is silent, and it is
 * exactly what doc 03's ban on physical measurements exists to prevent.
 *
 * Positions come from getBoundingClientRect, so what is asserted is where the
 * browser actually painted the thumb, not which CSS property was set.
 */
import { expect, test } from '@playwright/test';
import { gotoStory } from './story';

const panel = (label: string) =>
  `.catalog-panel:has(.catalog-label:text-is("${label}"))`;

/**
 * Where the thumb sits inside its track, as a 0-to-1 fraction from the left.
 *
 * `NaN` when either element is missing, and that is the whole point of the
 * shape. This is read inside an `expect.poll`, and doc 10 §11.4's measurement
 * is that a polled callback which THROWS is propagated on the first call and
 * never retried — so the two `querySelector` casts below used to give a poll
 * one attempt wearing a five-second budget, and `getBoundingClientRect` on
 * `null` is a throw.
 *
 * `NaN` rather than `0`, which matters more than it looks: `0` is exactly
 * where an off thumb sits, so a zero sentinel would satisfy the
 * `toBeLessThan(0.4)` assertion below without having measured anything. `NaN`
 * satisfies no numeric comparison, so the poll keeps ticking and the failure
 * says the elements were never there.
 */
const thumbPosition = (locator: import('@playwright/test').Locator) =>
  locator.evaluate(label => {
    const track = label.querySelector('[aria-hidden="true"]');
    const thumb = label.querySelector('.bb-switch-thumb');
    if (!(track instanceof HTMLElement) || !(thumb instanceof HTMLElement)) {
      return Number.NaN;
    }
    const trackBox = track.getBoundingClientRect();
    const thumbBox = thumb.getBoundingClientRect();
    const travel = trackBox.width - thumbBox.width;
    return travel <= 0 ? 0 : (thumbBox.left - trackBox.left) / travel;
  });

test.describe('LTR', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStory(page, 'components-switch--direction');
  });

  test('off sits at the left, on sits at the right', async ({ page }) => {
    const ltr = page.locator(panel('LTR'));

    const on = await thumbPosition(
      ltr.locator('label').filter({ hasText: 'Notificaciones' }).first()
    );
    const off = await thumbPosition(
      ltr.locator('label').filter({ hasText: 'Mostrar registros' }).first()
    );

    expect(on).toBeGreaterThan(0.6);
    expect(off).toBeLessThan(0.4);
  });
});

test.describe('RTL', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStory(page, 'components-switch--direction');
  });

  test('the travel is mirrored: on sits at the LEFT', async ({ page }) => {
    const rtl = page.locator(panel('RTL'));

    const on = await thumbPosition(
      rtl.locator('label').filter({ hasText: 'Notificaciones' }).first()
    );
    const off = await thumbPosition(
      rtl.locator('label').filter({ hasText: 'Mostrar registros' }).first()
    );

    // Mirrored, because "end" is the left in RTL. A switch that looks the same
    // in both directions is one that used a physical measurement.
    expect(on).toBeLessThan(0.4);
    expect(off).toBeGreaterThan(0.6);
  });
});

test('flipping one moves the thumb across', async ({ page }) => {
  await gotoStory(page, 'components-switch--states');

  const off = page.locator('label').filter({ hasText: 'Off' }).first();
  const before = await thumbPosition(off);
  expect(before).toBeLessThan(0.4);

  await off.click();
  await expect.poll(() => thumbPosition(off)).toBeGreaterThan(0.6);
});
