import { useContext } from 'react';
import { OverlayTriggerStateContext } from 'react-aria-components';

export interface DialogState {
  /**
   * Close the dialog this is called from.
   *
   * Safe to call when there is no dialog above — it does nothing rather than
   * throwing, so a component that may or may not be inside one does not need
   * to branch.
   */
  close: () => void;
  /** Whether a dialog is open above this point. `false` when there is none. */
  isOpen: boolean;
}

/*
 * WHY THIS HOOK EXISTS, AND WHY IT IS THE ONLY ROUTE.
 *
 * The base hands `close` to a render prop:
 *
 *   <Dialog>{({ close }) => …}</Dialog>
 *
 * Doc 02 §5 keeps render props out of the public API, and it is explicit that
 * hiding them has a cost which must be PAID rather than ignored: a consumer
 * will want their own button inside a dialog that closes it, and if render
 * props are hidden and nothing replaces them, that need has no route.
 *
 * This is that replacement, and §5 names it — `useDialog()` returning
 * `{ close }` — so this file is a promise being kept, not a new idea.
 *
 * It reads the base's own state context rather than one of ours. That is
 * deliberate: a second channel carrying state the base already carries is the
 * "two different ways to do the same thing" of doc 01 §7, and it would go
 * stale the moment the base closed a dialog by a route we did not know about
 * — Escape, a click outside, a parent unmounting.
 *
 * The context is NOT re-exported (doc 02 §10). A consumer gets this hook,
 * which is a function returning two values, rather than a state object with a
 * surface we did not choose.
 */

/**
 * The dialog this component is inside: whether it is open, and how to close it.
 *
 * For a consumer's own button in a dialog's footer — a Cancel that closes, a
 * Save that closes after its work is done. The dialog's own dismissal routes
 * (`Escape`, the close button, a click outside where allowed) need nothing
 * from this.
 *
 * ```tsx
 * function CancelButton() {
 *   const { close } = useDialog();
 *   return <Button variant="secondary" onPress={close}>Cancel</Button>;
 * }
 * ```
 *
 * The button has to be **a component of its own**, because a hook can only be
 * called from one. That is not a limitation of this hook; it is how React
 * works, and it is why the footer is a `ReactNode` a consumer composes rather
 * than a list of button descriptions.
 *
 * **Works with no dialog above it**: `close` does nothing and `isOpen` is
 * `false`. A footer shared between a dialog and a page does not need to know
 * which one it landed in.
 */
export function useDialog(): DialogState {
  const state = useContext(OverlayTriggerStateContext);

  return {
    close: () => state?.close(),
    isOpen: state?.isOpen ?? false
  };
}
