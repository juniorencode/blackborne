export { ModalSheet } from './ModalSheet';
export type { ModalSheetProps } from './ModalSheet';
/*
 * The class constants are exported as well as the assembled sheet, because
 * `ConfirmDialog` uses the same panel and the same pinned rows with a
 * DIFFERENT inside: a tone glyph beside the title, no close cross, and
 * `role="alertdialog"`.
 *
 * Three props on `ModalSheet` to serve one caller would be the monolith of
 * non-goal 4 arriving a prop at a time, and the third case being different is
 * exactly the argument for not generalising it.
 */
export {
  ANCHORED,
  BODY,
  FOOTER,
  HEADER,
  PANEL,
  SCRIM,
  SHEET,
  TITLE
} from './layerBox';

export { LAYER_OFFSET, PLACEMENTS } from './placement';
export type { Placement } from './placement';
export { HOVER_CLOSE_DELAY, HOVER_OPEN_DELAY } from './timing';
export { LayerArrow } from './LayerArrow';
export type { LayerArrowProps } from './LayerArrow';
