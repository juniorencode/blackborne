import { forwardRef } from 'react';
import {
  Modal,
  ModalOverlay,
  type ModalOverlayProps
} from 'react-aria-components';
import { ModalSheet, PANEL, SCRIM } from '../../internal/Layer';
import { cx } from '../../internal/cx';

export type DialogSize = 'sm' | 'md' | 'lg';

/*
 * The size map. One place, typed, per component (doc 03 §4.4).
 *
 * The widths come from the CONTAINER scale — `--container-narrow`, `-medium`,
 * `-wide` — and not from a scale of their own, which is the more interesting
 * half of this decision.
 *
 * A dialog is, literally, a container: it is a region with a width of its own
 * holding somebody else's content. So reusing that scale is not a shortcut, it
 * is the two things agreeing. A form placed in a `sm` dialog then sits in a
 * container the width of `--container-narrow`, and its own container queries
 * resolve against exactly the value the dialog was sized by. Give dialogs
 * their own scale and those two numbers drift, and a component would report
 * "narrow" at a width the dialog considers medium.
 */
const SIZE: Record<DialogSize, string> = {
  sm: 'bb:max-w-narrow',
  md: 'bb:max-w-medium',
  lg: 'bb:max-w-wide'
} satisfies Record<DialogSize, string>;

/*
 * A dialog centres its panel in the window and holds it off the edges.
 *
 * `place-items-center` is what centres it while still letting it shrink; a
 * flex row with an auto margin cannot do the second part reliably once the
 * panel has hit its maximum height.
 */
const DIALOG_SCRIM = cx(
  'bb-dialog-scrim',
  SCRIM,
  'bb:place-items-center',
  'bb:p-(--bb-space-4)'
);

/*
 * A dialog is bordered and rounded on all four sides: it floats clear of every
 * window edge, so every edge of it is a free edge. That is exactly what a
 * drawer is not, and it is the whole of the difference between the two.
 */
/*
 * `container-type: inline-size` is declared HERE and not in the shared panel,
 * because it is only safe on a layer whose width is declared — which a dialog's
 * is, from the size map above. The law and the measurement behind it are in
 * `internal/Layer/layerBox.ts`; the short version is that size containment
 * makes an element's inline size resolve as if it had no contents, so a panel
 * sized BY its contents collapses to its borders.
 *
 * What it gives is decision 0010's point: a form inside a dialog resolves its
 * own container queries against the width the dialog was sized to, with no
 * configuration. What it does NOT give was corrected in that decision — it
 * makes this no kind of containing block, so a consumer's `position: fixed`
 * child still positions against the window.
 */
const DIALOG_PANEL = cx(
  'bb-dialog-panel',
  PANEL,
  'bb:[container-type:inline-size]',
  'bb:w-full bb:border bb:rounded-lg'
);

/*
 * `isKeyboardDismissDisabled` and `UNSTABLE_portalContainer` are omitted along
 * with the render-prop trio, and both omissions are decisions.
 *
 * **Escape is not negotiable.** Doc 09 §8 fixes what the keys mean across the
 * whole library and adds that one exception in one component destroys trust in
 * the other twenty-nine. A dialog that could be configured to swallow Escape
 * is that exception. The case that wants it — an action in flight that must
 * not be interrupted — is real, and it belongs to a component that OWNS the
 * action and can tell when it is in flight. That is `ConfirmDialog`, which
 * takes the promise; this component never knows what its footer is doing.
 *
 * **The mount container comes from `ConfigProvider`** (doc 08 §8, decision
 * 0013), and the base's per-component prop is deprecated in favour of the same
 * provider. Accepting it here would be a second route to one setting, and the
 * one that cannot reach the toast region.
 */
export interface DialogProps extends Omit<
  ModalOverlayProps,
  | 'children'
  | 'className'
  | 'style'
  | 'isKeyboardDismissDisabled'
  | 'UNSTABLE_portalContainer'
> {
  /**
   * The dialog's name, shown as its heading and announced when focus enters.
   *
   * Required, and it is the one prop here that could not be optional. The base
   * warns in development when a dialog has no title, and a dialog with no
   * accessible name is one a screen reader announces as "dialog" — which says
   * that something happened and not what.
   */
  title: React.ReactNode;
  /** The dialog's content. It scrolls when it is taller than the window. */
  children?: React.ReactNode;
  /**
   * The actions, in a footer that stays visible while the content scrolls.
   *
   * A `ReactNode` and not a list of button descriptions, deliberately: the
   * buttons are the consumer's, in their order, with their words (doc 09 §4
   * — a button names the action). A button of theirs that needs to close the
   * dialog calls `useDialog()`.
   */
  footer?: React.ReactNode;
  /**
   * How wide the panel may get. Values come from the container scale, so a
   * component inside resolves its own container queries against the same
   * numbers.
   */
  size?: DialogSize;
  /**
   * Whether clicking outside the panel closes it. **Defaults to `false`**,
   * which is both the base's default and the safe one.
   *
   * Doc 08 §5 makes this a decision rather than a default: a dialog holding
   * unsaved input is not dismissable by clicking outside, because closing by
   * accident may not discard work without warning (doc 09 §7). Turn it on for
   * a dialog that holds nothing — a detail view, a preview — where being made
   * to aim at a close button is the opposite failure.
   *
   * `Escape` and the close button work either way.
   */
  isDismissable?: boolean;
  /**
   * Applied to the **panel**, for width and placement beyond what `size`
   * covers. Nothing reaches an internal node (doc 02 §6).
   *
   * Note doc 02 §6's limit: this sets what the component does not set. The
   * panel already sets its own max-width through `size`, so overriding that
   * one property from here is the case §6 warns is not reliable — utilities of
   * equal specificity are decided by the generator's emit order, which is not
   * something either of us chose. Use `size`, or `style`.
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A modal dialog: a titled panel above the page, with the page behind it out
 * of reach.
 *
 * Everything about being a layer comes from doc 08 and is not configurable
 * here: focus moves in on open and returns to whatever opened it on close,
 * focus is contained while it is open, `Escape` closes one level at a time,
 * and the page behind does not scroll.
 *
 * **Controlled, and there is no trigger component.** Pass `isOpen` and
 * `onOpenChange`. That is the shape a management application needs: the dialog
 * is opened from a row action, a menu item or a route far from where it
 * renders, not from a wrapper around a button. Focus still returns correctly —
 * the base restores it to whatever was focused when the layer opened, which is
 * the button that was pressed, and it does that unconditionally rather than by
 * knowing about a trigger.
 *
 * **It becomes full-screen in a narrow window**, automatically and not by a
 * prop. A dialog that does not fit has one correct rendering, and a prop would
 * let a screen ship broken at 360px. The threshold is in `rem`, so a page at
 * 200% zoom crosses it too — see `Dialog.css`.
 *
 * ```tsx
 * <Dialog
 *   isOpen={isOpen}
 *   onOpenChange={setOpen}
 *   title="Edit customer"
 *   footer={<><CancelButton /><Button variant="primary">Save</Button></>}
 * >
 *   <TextField label="Name" />
 * </Dialog>
 * ```
 */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { title, children, footer, size = 'md', className, style, ...overlayProps },
  ref
) {
  return (
    /*
     * ModalOverlay and Modal, rather than Modal alone. Using `Modal` on its own
     * makes it render its own backdrop, which cannot then be styled — and the
     * base warns in development if overlay-level props are put on the inner
     * element, so the split has to be explicit either way.
     */
    <ModalOverlay className={DIALOG_SCRIM} {...overlayProps}>
      <Modal
        ref={ref}
        className={cx(DIALOG_PANEL, SIZE[size], className)}
        {...(style === undefined ? {} : { style })}
      >
        <ModalSheet title={title} {...(footer === undefined ? {} : { footer })}>
          {children}
        </ModalSheet>
      </Modal>
    </ModalOverlay>
  );
});
