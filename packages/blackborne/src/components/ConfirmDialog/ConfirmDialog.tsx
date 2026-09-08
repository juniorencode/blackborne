import { forwardRef, useCallback, useState } from 'react';
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
  Text,
  type ModalOverlayProps
} from 'react-aria-components';
import { Button, type ButtonVariant } from '../Button';
import { useMessage } from '../../config';
import {
  BODY,
  FOOTER,
  HEADER,
  PANEL,
  SCRIM,
  SHEET,
  TITLE
} from '../../internal/Layer';
import { ToneGlyph, type Tone } from '../../internal/ToneGlyph';
import { cx } from '../../internal/cx';

/**
 * What kind of question this is.
 *
 * **Three, and `success` is deliberately not one of them.** Doc 09 §5.3 says
 * you confirm only when there is no way back, and there is no such thing as
 * confirming a success — nothing has happened yet, so there is nothing to be
 * pleased about. A fourth tone would also need a fourth button appearance, and
 * the catalog already recorded why only two exist: colour on a button says what
 * pressing it costs, and the only two costs worth colouring are the primary
 * action and the destructive one.
 */
export type ConfirmTone = Extract<Tone, 'info' | 'warning' | 'danger'>;

/*
 * What each tone paints, and what pressing the confirming button costs.
 *
 * TWO APPEARANCES FOR THREE TONES, and that is the interesting part. The
 * catalog rejected semantic colours on `Button` — success and info — with the
 * argument that a green Save beside a blue Details leaves a screen with no
 * primary action. So there is no "warning-coloured" button to reach for, and
 * the mapping has to say which of the two real costs a tone carries.
 *
 * `warning` maps to danger rather than to primary, and that is not a
 * compromise: discarding what somebody typed is destructive even when nothing
 * is deleted. A tone that warns and then offers a reassuring blue button is
 * telling two different stories about the same press.
 */
interface ToneStyle {
  /** The glyph's colour. The text stays the ordinary text colour: the glyph is
   *  the channel that survives greyscale, and tinting the words as well would
   *  make the message compete with the question. */
  glyph: string;
  /** What the confirming button looks like. */
  confirm: Extract<ButtonVariant, 'primary' | 'danger'>;
}

const TONE: Record<ConfirmTone, ToneStyle> = {
  info: { glyph: 'bb:text-info', confirm: 'primary' },
  warning: { glyph: 'bb:text-warning-text', confirm: 'danger' },
  danger: { glyph: 'bb:text-danger-text', confirm: 'danger' }
} satisfies Record<ConfirmTone, ToneStyle>;

/*
 * A confirmation is always small. There is no `size`, and there should not be:
 * doc 09 §5 is a question and two answers, and anything that needs more room
 * than that is not a confirmation — it is a dialog with a form in it, which is
 * `Dialog`.
 */
const CONFIRM_SCRIM = cx(
  'bb-confirm-scrim',
  SCRIM,
  'bb:place-items-center',
  'bb:p-(--bb-space-4)'
);

const CONFIRM_PANEL = cx(
  'bb-confirm-panel',
  PANEL,
  'bb:w-full bb:max-w-narrow bb:border bb:rounded-lg'
);

export interface ConfirmDialogProps extends Omit<
  ModalOverlayProps,
  | 'children'
  | 'className'
  | 'style'
  | 'isDismissable'
  | 'isKeyboardDismissDisabled'
  | 'UNSTABLE_portalContainer'
> {
  /** The question, as a heading. "Delete this customer?" */
  title: React.ReactNode;
  /**
   * What pressing the confirming button will do, and what it costs. This is
   * where the consequence goes — the title asks, this explains.
   */
  children?: React.ReactNode;
  /** Which kind of question. Drives the glyph and the confirming button. */
  tone?: ConfirmTone;
  /**
   * The confirming button's words, and **required**.
   *
   * Doc 09 §5.4: the button names the action — "Delete", "Discard", "Issue the
   * credit note" — never "OK". A default here would be shipped as "Confirm" by
   * everyone and that rule would be dead the first day, so there is none. The
   * cancelling button's word comes from the dictionary, because it is the one
   * nobody customises.
   */
  confirmLabel: string;
  /**
   * What to do. **May return a promise**, and then the dialog waits for it.
   *
   * While it is in flight the confirming button is pending, cancelling is
   * disabled, and neither `Escape` nor a click outside closes anything — you
   * cannot dismiss a dialog whose action is under way (doc 09 §7).
   *
   * On **fulfilment** the dialog closes. On **rejection it stays open**, and
   * that is the decision worth knowing: the error happened here, so it is shown
   * here (doc 09 §4), which usually means an `Alert` in the content. A consumer
   * who would rather it closed anyway is one `.catch()` away — catching makes
   * the promise fulfil, and the dialog closes.
   */
  onConfirm?: () => void | Promise<unknown>;
  /**
   * Applied to the panel, for placement. Nothing reaches an internal node
   * (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A question with two answers, above the page.
 *
 * Doc 09 §5 governs almost all of it, and the parts that are not configurable
 * are not oversights:
 *
 * **Confirm or undo, never both — and prefer undo.** A confirmation repeated a
 * hundred times is answered automatically and stops protecting anything, so
 * this is for what has no way back. The library makes that structural rather
 * than advisory: there is no undo affordance here, and undo lives in a toast.
 *
 * **Cancel cannot be removed.** A confirmation you can only say yes to is not
 * one, and `Escape` is invisible. The case that wants a single button — "your
 * session has expired" — is not a confirmation but an announcement, which is a
 * `Dialog`.
 *
 * **The destructive action is not focused.** Focus lands on Cancel (doc 09
 * §5.5). This is the first component in the library to focus a control on open,
 * and doc 08 §4 allows that only with a written reason: this is it.
 *
 * **There is no close cross and no `isDismissable`.** Both would be a third and
 * fourth way to say no, next to a button that already says it in words.
 *
 * ```tsx
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onOpenChange={setOpen}
 *   tone="danger"
 *   title="Delete customer 4821?"
 *   confirmLabel="Delete"
 *   onConfirm={() => api.deleteCustomer(4821)}
 * >
 *   Their invoices are kept. This cannot be undone.
 * </ConfirmDialog>
 * ```
 */
export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  function ConfirmDialog(
    {
      title,
      children,
      tone = 'danger',
      confirmLabel,
      onConfirm,
      className,
      style,
      ...overlayProps
    },
    ref
  ) {
    const cancelLabel = useMessage('cancel');
    const { glyph, confirm } = TONE[tone];

    /*
     * Whether the confirming action is in flight. State and not a prop: the
     * component owns the promise, which is the whole reason it can do what
     * `Dialog` deliberately cannot — block `Escape` while something is
     * happening. A `Dialog` never knows what its footer is doing.
     */
    const [isPending, setPending] = useState(false);

    const press = useCallback((): void => {
      const result = onConfirm?.();

      /*
       * Not a promise: nothing to wait for, so close now. Checked by shape
       * rather than by `instanceof Promise`, because a consumer's async
       * function may return a thenable from a different realm or a library's
       * own promise type, and refusing those would make the prop quietly
       * conditional on which promise they use.
       */
      if (
        result === undefined ||
        result === null ||
        typeof (result as PromiseLike<unknown>).then !== 'function'
      ) {
        overlayProps.onOpenChange?.(false);
        return;
      }

      setPending(true);
      void Promise.resolve(result).then(
        () => {
          setPending(false);
          overlayProps.onOpenChange?.(false);
        },
        () => {
          /*
           * Rejected: stop waiting and STAY OPEN. The error happened here, so
           * it is shown here (doc 09 §4) — which is the consumer's to render,
           * because only they know what went wrong. Swallowing the rejection
           * is deliberate: re-throwing from a handler would surface as an
           * unhandled rejection in their console for a case this component has
           * already dealt with.
           */
          setPending(false);
        }
      );
    }, [onConfirm, overlayProps]);

    return (
      <ModalOverlay
        className={CONFIRM_SCRIM}
        /*
         * Neither route out is available while the action is in flight. Doc 09
         * §7: you cannot close by accident something that is already happening,
         * and half-closing it would leave the promise running with nothing
         * listening.
         *
         * `Dialog` omits `isKeyboardDismissDisabled` on purpose — doc 09 §8,
         * one component that swallows `Escape` costs the other twenty-nine
         * their credibility. It is used here because this component OWNS the
         * action and can tell exactly when the key is unsafe, which is the
         * distinction that decision rests on rather than an exception to it.
         */
        isKeyboardDismissDisabled={isPending}
        {...overlayProps}
      >
        <Modal
          ref={ref}
          className={cx(CONFIRM_PANEL, className)}
          {...(style === undefined ? {} : { style })}
        >
          {/*
           * `role="alertdialog"`, which is what makes this a different
           * component rather than a `Dialog` with three props. A screen reader
           * announces it as requiring a response, and the base then points
           * `aria-describedby` at the content automatically — so the
           * consequence is read out with the question instead of waiting to be
           * found. Neither of those is something a prop could switch on.
           */}
          <AriaDialog role="alertdialog" className={SHEET}>
            <header className={HEADER}>
              <ToneGlyph tone={tone} className={glyph} />
              {/*
               * The same title slot as every other layer: the base generates
               * the id its `aria-labelledby` points at, and a hand-written
               * heading never receives it — leaving the layer with no
               * accessible name at all. There is no close cross beside it.
               */}
              <Heading slot="title" className={TITLE}>
                {title}
              </Heading>
            </header>

            {children === undefined || children === null ? null : (
              /*
               * `Text slot="description"` and not a plain div: for an
               * `alertdialog` the base wires the description slot to
               * `aria-describedby`, so this is what makes the consequence part
               * of what is announced rather than something to go looking for.
               */
              <Text slot="description" className={BODY}>
                {children}
              </Text>
            )}

            <footer className={FOOTER}>
              {/*
               * Cancel first in the DOM, and focused.
               *
               * Doc 09 §5.5: in a confirmation the destructive action is not
               * the option focused by default. Doc 08 §4 allows focusing a
               * control on open only with a written reason, and this is the
               * library's first — an `Escape`-equivalent that somebody can hit
               * by reflex without deleting anything.
               *
               * It is also first in the reading order, so the way out is heard
               * before the way through.
               */}
              <Button
                variant="secondary"
                /*
                 * The one `autoFocus` in the library, and the lint rule that
                 * forbids it is right in general — doc 06 §4 point 8 lists
                 * "focusing something automatically without the person having
                 * asked" among the patterns with no exceptions.
                 *
                 * This is not that case, and the difference is what the rule
                 * cannot see. Point 8 is about focus moving on LOAD, to
                 * something nobody summoned. Here the person opened a
                 * confirmation and the question is which of two answers their
                 * next keystroke reaches — doc 09 §5.5 requires that it not be
                 * the destructive one, and doc 08 §4 permits focusing a
                 * control on open when there is a written reason. This is the
                 * reason, and it is the only component that has one.
                 *
                 * The alternative — focusing it from an effect — would be the
                 * same behaviour with more code and a silenced rule, which is
                 * worse than a disable that says why.
                 */
                // eslint-disable-next-line jsx-a11y/no-autofocus -- doc 09 §5.5: the destructive answer is not the focused one
                autoFocus
                isDisabled={isPending}
                onPress={() => overlayProps.onOpenChange?.(false)}
              >
                {cancelLabel}
              </Button>
              <Button variant={confirm} isPending={isPending} onPress={press}>
                {confirmLabel}
              </Button>
            </footer>
          </AriaDialog>
        </Modal>
      </ModalOverlay>
    );
  }
);
