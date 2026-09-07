import { forwardRef } from 'react';
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
  type ModalOverlayProps
} from 'react-aria-components';
/*
 * OUR Button, not the base's. The base exports one too and it is deliberately
 * not imported here: the close button needs this library's focus ring, hit
 * area and hover states, which is the whole reason the component exists.
 */
import { Button } from '../Button';
import { useMessage } from '../../config';
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
 * The scrim, and the box that centres the panel in the window.
 *
 * `fixed inset-0` rather than anything measured: the overlay is portalled to
 * the document (or to wherever the consumer said, doc 08 §8), so the window is
 * its container and this is the legitimate viewport case of doc 04 §5.
 *
 * The stacking value is the public token. There is no literal z-index in this
 * library and doc 08 §2 is why: a consumer has their own fixed header to
 * coordinate with, and if our numbers are closed their only route is to fight
 * our CSS from outside.
 */
const SCRIM = cx(
  'bb-dialog-scrim',
  'bb:fixed bb:inset-0 bb:z-(--bb-layer-overlay)',
  'bb:bg-surface-overlay',
  // grid + place-items-center is what centres the panel while still letting it
  // shrink; a flex row with margin auto cannot do the second part reliably
  // once the panel hits its max height.
  'bb:grid bb:place-items-center',
  'bb:p-(--bb-space-4)'
);

/*
 * The panel: the box that floats.
 *
 * `surface-raised` is the token named for exactly this — doc 03 §4 calls it
 * "menu, popover, dialog" — and this component is its first reader since the
 * token layer was written. It was measured on the way in, and it was wrong:
 * see the note in semantic.css.
 *
 * `overflow-hidden` here and `overflow-y-auto` on the sheet inside. Two
 * elements, and the split does real work: this one clips, so the sticky header
 * cannot paint over the rounded corners and the scrollbar stays inside the
 * radius. Putting the scroll here instead would break something worse — see
 * the note on SHEET.
 *
 * `container-type: inline-size`, following the Card
 * ([decision 0010](../../../../docs/decisions/0010-the-card-declares-the-container.md)).
 * A dialog is a region with a width of its own, which is the thing a container
 * is, so anything placed inside can ask how wide it is without the consumer
 * configuring anything. The side effect that decision records — no
 * shrink-wrapping — is what we want here anyway: the panel takes the width
 * `SIZE` gives it.
 */
const PANEL = cx(
  'bb-dialog-panel',
  // box-border because the package ships no reset. With a border and padding
  // on the same element, content-box makes a declared width measure wider
  // than it was asked for.
  'bb:box-border bb:w-full',
  /*
   * A column flex container, and this is what makes the scrolling work at all.
   *
   * The height limit lives here (see Dialog.css). The sheet inside has to be
   * bounded BY it, and a percentage cannot do that: `max-height: 100%`
   * resolves against the parent's height, this element has no definite height
   * — only a maximum — so the percentage computes to `none` and the sheet
   * grows without limit.
   *
   * Measured, with that mistake in place: content of 1658px inside a panel
   * capped at 876px, the sheet reporting `scrollHeight === clientHeight` so it
   * was not scrollable, and this element clipping the rest with
   * `overflow: hidden`. A dialog that silently hid two thirds of its content
   * and offered no way to reach it.
   *
   * Flex layout bounds the item instead of asking it to measure a percentage:
   * the sheet keeps its content-based size, shrinks when this element hits its
   * ceiling, and scrolls what does not fit.
   *
   * The check that caught it was the one that pressed a key. The screenshot
   * looked entirely plausible.
   */
  'bb:flex bb:flex-col',
  'bb:bg-surface-raised bb:text-surface-raised-on',
  'bb:border bb:border-border bb:rounded-lg bb:shadow-lg',
  'bb:overflow-hidden',
  'bb:font-sans bb:text-md bb:leading-normal',
  'bb:[container-type:inline-size]'
);

/*
 * The sheet: the element that carries `role="dialog"`, and the one that
 * SCROLLS. Those two being the same element is not incidental.
 *
 * The base moves focus to this element when the dialog opens (doc 08 §4), and
 * a browser scrolls the nearest scrollable ANCESTOR of whatever has focus. So
 * with the scroll here, the arrow keys and Page Down work from the moment the
 * dialog appears. Put the scroll on an inner body element instead — the
 * obvious three-row grid — and the scroll container becomes a DESCENDANT of
 * the focused element, which no key reaches: the arrows would look for a
 * scrollable ancestor, find the clipped panel, then the locked page, and move
 * nothing at all.
 *
 * That failure has already happened once in this repository, on the catalog's
 * own resizable panel, and it is invisible to every check that does not press
 * a key.
 */
const SHEET = cx(
  'bb:box-border bb:flex bb:flex-col',
  /*
   * `min-h-0` and not `max-h-full`. A flex item's automatic minimum size is
   * its content, so without this it refuses to shrink and overflows the panel
   * however low the panel's ceiling is — the same failure, arrived at from the
   * other direction. `overflow-y-auto` then has something to do.
   */
  'bb:min-h-0 bb:overflow-y-auto',
  // The scrim is not the page: a wheel gesture that reaches the bottom of the
  // dialog must not start scrolling whatever is behind it (doc 09 §7).
  'bb:overscroll-contain',
  // The focus ring belongs on interactive things. This element is focused
  // programmatically on open, as a container, and ringing the whole panel
  // says "you are here" about something nobody chose to focus.
  'bb:outline-none'
);

/*
 * Header, body and footer.
 *
 * The header and footer are `sticky` INSIDE the scroll container rather than
 * siblings outside it, which follows from the decision above: one scrolling
 * element means they have to travel with the content and pin themselves.
 *
 * They carry the panel's own background because sticky elements are painted
 * over by nothing — content scrolls behind them, and a transparent header
 * would show the body sliding underneath the title.
 */
const HEADER = cx(
  'bb:sticky bb:top-0 bb:z-1',
  'bb:box-border bb:flex bb:items-start bb:gap-(--bb-space-3)',
  'bb:bg-surface-raised',
  'bb:border-b bb:border-border',
  'bb:p-(--bb-space-5)'
);

const TITLE = cx(
  // A heading, and the level is the base's: it puts `level: 2` on the title
  // slot's context. Which is the right answer and worth saying why, because
  // Alert deliberately does the opposite — an Alert sits IN the page and
  // cannot know what level it landed at (doc 06 §2), while a dialog is a
  // boundary and the outline restarts inside it.
  'bb:m-0 bb:min-w-0 bb:flex-1',
  'bb:text-lg bb:font-strong bb:leading-tight',
  'bb:[overflow-wrap:break-word]'
);

const BODY = cx('bb:box-border bb:p-(--bb-space-5)');

const FOOTER = cx(
  'bb:sticky bb:bottom-0 bb:z-1',
  'bb:box-border bb:flex bb:flex-wrap bb:items-center bb:justify-end',
  'bb:gap-(--bb-space-3)',
  'bb:bg-surface-raised',
  'bb:border-t bb:border-border',
  'bb:p-(--bb-space-5)'
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
  const closeLabel = useMessage('close');

  return (
    /*
     * ModalOverlay and Modal, rather than Modal alone. Using `Modal` on its own
     * makes it render its own backdrop, which cannot then be styled — and the
     * base warns in development if overlay-level props are put on the inner
     * element, so the split has to be explicit either way.
     */
    <ModalOverlay className={SCRIM} {...overlayProps}>
      <Modal
        ref={ref}
        className={cx(PANEL, SIZE[size], className)}
        {...(style === undefined ? {} : { style })}
      >
        <AriaDialog className={SHEET}>
          <header className={HEADER}>
            {/*
             * `Heading slot="title"` and not a plain `<h2>`. This is the only
             * route that gives the dialog a name.
             *
             * The base generates the id its `aria-labelledby` points at and
             * hands it down through the title slot's context. Measured with a
             * hand-written heading instead: the id comes from `useSlotId`,
             * which returns undefined when nothing claims the slot, so
             * `aria-labelledby` is never set — and the accessible name comes
             * back empty. The dialog is announced as "dialog", which says that
             * something happened and not what.
             *
             * Development does catch it: the base checks the rendered element
             * in an effect and warns. What it cannot catch is production, where
             * that check is compiled out and the only symptom is a screen
             * reader saying nothing useful — which is why the name is asserted
             * in a test rather than left to a console message somebody has to
             * be looking at.
             *
             * The context also supplies `level: 2`, so the element is an
             * `<h2>` without this file choosing.
             */}
            <Heading slot="title" className={TITLE}>
              {title}
            </Heading>
            {/*
             * `slot="close"` is the base's own: the Dialog publishes a button
             * slot by that name whose `onPress` closes the dialog, so there is
             * no handler to write and no state to reach for. Our Button
             * forwards `slot` by spread (doc 02 §2).
             *
             * Always rendered, with no prop to remove it. Doc 09 §7 is about
             * accidental closing, not about deliberate exits: `Escape` is
             * invisible, and a dialog that is not dismissable by clicking
             * outside would otherwise have no visible way out at all unless
             * its footer happened to provide one. A dialog that must be
             * answered rather than dismissed is a different component, with a
             * different role.
             */}
            <Button
              slot="close"
              variant="ghost"
              size="sm"
              aria-label={closeLabel}
              // -my/-me pull the button's own padding back so the cross aligns
              // with the title's first line and the panel's inner edge, rather
              // than sitting a hair inside both.
              className="bb:-my-1 bb:-me-2 bb:flex-none"
            >
              {/*
               * Drawn, not received: doc 02 §11.4 separates the icons the
               * library draws for its own controls from the ones it receives.
               * The same cross and stroke as the fields' clear button, so the
               * marks inside the library's own controls are one shape.
               */}
              <svg
                viewBox="0 0 16 16"
                className="bb:h-4 bb:w-4"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          </header>

          <div className={BODY}>{children}</div>

          {footer === undefined || footer === null ? null : (
            <footer className={FOOTER}>{footer}</footer>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
});
