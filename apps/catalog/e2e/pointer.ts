/*
 * MOVING A POINTER SO THE BASE BELIEVES IT.
 *
 * This existed in SEVEN copies — four named `travelTo` and three inline — with
 * three different signatures and one explanation, and the explanation was
 * wrong. It is here once now, which is doc 01 §7's rule about two ways to do
 * one thing, applied at the seventh.
 *
 * ## What actually rejects a teleport, measured in the pinned base
 *
 * The copies all said the base's `useHover` filters pointer events that did
 * not arrive as movement. It does not. In `react-aria@3.52.0`,
 * `private/interactions/useHover.mjs`, `triggerHoverStart` returns early for
 * exactly four things — `isDisabled`, a `touch` pointer type, an
 * already-hovered state, and a target the element does not contain. There is
 * no modality check and nothing about movement, so a teleporting
 * `locator.hover()` DOES set `data-hovered`.
 *
 * What rejects a teleport is the GLOBAL INTERACTION MODALITY, and it is read
 * by the consumers of `useHover` rather than by `useHover`:
 *
 *   - `private/tooltip/useTooltipTrigger.mjs:62` — `if (getInteractionModality()
 *     === 'pointer') isHovered.current = true; else isHovered.current = false;`
 *     and line 30 opens only `if (isHovered.current || isFocused.current)`.
 *   - `useMenuItem` moves its highlight only `if (!isFocusVisible() && ...)`,
 *     and `isFocusVisible()` is `currentModality !== 'pointer'`.
 *   - `private/interactions/useFocusVisible.mjs:32` — `currentModality` starts
 *     as `null`, and becomes `'pointer'` in a handler registered at lines
 *     144-146 for `pointerdown`, `pointermove` and `pointerup`. Not
 *     `pointerenter`.
 *
 * And that last line is the whole mechanism: **the boundary events precede the
 * move that caused them.** One `mouse.move` onto a target fires
 * `pointerover`/`pointerenter` first, so `useHover` starts its hover while the
 * modality is still `null` — and the tooltip's own gate reads `null`, decides
 * this was not a pointer, and does not open. A single move cannot vouch for
 * itself. The neutral move at (4, 4) is what vouches for it.
 *
 * Two things follow that no copy stated:
 *
 * **A key press undoes it.** `useFocusVisible.mjs:56` sets the modality back to
 * `'keyboard'` on any `keydown`. `menu.spec.ts` opens its menu with `Enter`
 * and then hovers a row, so the neutral move there is not belt and braces —
 * it is the only reason the highlight moves at all.
 *
 * **The eight steps are not the part that works.** The neutral move sets the
 * modality; the steps add nothing to it. They stay because they are what was
 * measured, they cost nothing, and one journey genuinely needs intermediate
 * positions: `preview.spec.ts` crosses a safe area between a trigger and its
 * card, and a straight jump would leave it.
 *
 * ## Where a bare hover() is still right
 *
 * When the assertion rides on `data-hovered` itself rather than on something
 * a consumer gates. `select.spec.ts` reads the field frame's border against
 * `bb:data-hovered:border-border-strong` and is correct as written; converting
 * it would buy two round trips and change no outcome. Uniformity is not the
 * goal — the goal is that the one case which needs movement has a name.
 */
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Move the pointer ONTO an element, as movement rather than as a teleport.
 *
 * The neutral move first, because the modality has to be `'pointer'` before
 * the boundary events fire on the target. The failure names the element when
 * it has no box, which is the one diagnostic six of the seven copies lacked.
 */
export const travelTo = async (page: Page, target: Locator): Promise<void> => {
  const box = await target.boundingBox();
  expect(box, `${target} has no box to travel to`).not.toBeNull();

  await page.mouse.move(4, 4);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2, {
    steps: 8
  });
};

/**
 * Move the pointer AWAY from everything.
 *
 * The corner rather than an arbitrary point: a coordinate chosen for being far
 * from a particular layer stops being far when the layer moves or the viewport
 * changes, and every spec that needs this needs the same thing.
 */
export const travelAway = async (page: Page): Promise<void> => {
  await page.mouse.move(4, 4);
};
