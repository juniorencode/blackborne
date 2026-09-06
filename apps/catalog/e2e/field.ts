import type { Locator } from '@playwright/test';

/**
 * The element that draws a field's box, given its control.
 *
 * Every single-line field now paints its border on a frame that wraps the
 * control, so that an affix can sit inside the border and in the flow beside
 * the value. The control is therefore two pixels shorter than the field and
 * transparent, and measuring it answers questions about the wrong box.
 *
 * That is not a hypothetical: it is how three checks in this directory failed
 * the day the frame landed, and none of them failed loudly. The height check
 * was out by exactly two pixels — the size of difference it exists to catch —
 * and the read-only colour check compared two transparents and found them
 * equal.
 *
 * A `TextArea` has no frame, because a block with an affix beside it makes no
 * sense and its trailing corner belongs to the browser's resize grip. So this
 * is for the single-line fields, and the multi-line one is measured directly.
 */
export const fieldBox = (control: Locator): Locator =>
  control.locator('xpath=..');
