/*
 * The behaviour worth asserting is the promise, and that is all testable here:
 * it is state and callbacks, not focus order or pixels.
 *
 * What is NOT here, deliberately: which control has focus on open. Doc 09 §5.5
 * requires it to be Cancel, and jsdom cannot answer focus questions — doc 08 §9
 * — so that lives in the browser suite where it can be believed.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { ConfirmDialog } from './ConfirmDialog';

/** A promise a test controls the settling of. */
const deferred = () => {
  let resolve!: (value?: unknown) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res as typeof resolve;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const open = (
  props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}
) =>
  render(
    <ConfirmDialog
      isOpen
      onOpenChange={() => {}}
      title="Delete customer 4821?"
      confirmLabel="Delete"
      {...props}
    >
      Their invoices are kept. This cannot be undone.
    </ConfirmDialog>
  );

test('it is an alertdialog, not a dialog', () => {
  open();
  /*
   * The role is why this is a component and not three props on `Dialog`: a
   * screen reader announces it as requiring a response, and the base then
   * points `aria-describedby` at the content on its own.
   */
  expect(
    screen.getByRole('alertdialog', { name: 'Delete customer 4821?' })
  ).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('the consequence is part of what is announced', () => {
  open();

  const layer = screen.getByRole('alertdialog');
  const describedBy = layer.getAttribute('aria-describedby');
  expect(
    describedBy,
    'the content is not wired as the description'
  ).toBeTruthy();

  const description = document.getElementById(describedBy ?? '');
  expect(description?.textContent).toContain('cannot be undone');
});

test('the confirming button carries the words it was given', () => {
  open({ confirmLabel: 'Issue the credit note' });
  expect(
    screen.getByRole('button', { name: 'Issue the credit note' })
  ).toBeTruthy();
  // And nothing generic, which is the point of there being no default.
  expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'OK' })).toBeNull();
});

test('cancelling is named from the dictionary and cannot be removed', async () => {
  const onOpenChange = vi.fn();
  open({ onOpenChange });

  const cancel = screen.getByRole('button', { name: 'Cancel' });
  await userEvent.click(cancel);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('a translated dictionary renames cancelling, and not the action', () => {
  render(
    <ConfigProvider locale="es-PE" dictionary={{ cancel: 'Cancelar' }}>
      <ConfirmDialog
        isOpen
        onOpenChange={() => {}}
        title="¿Eliminar el cliente 4821?"
        confirmLabel="Eliminar"
      >
        Sus facturas se conservan.
      </ConfirmDialog>
    </ConfigProvider>
  );

  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  /*
   * The asymmetry, asserted: the way out comes from the dictionary and the
   * action's words come from the consumer, because doc 09 §5.4 wants the button
   * to name the action and a default would have made everyone ship "Confirm".
   */
  expect(screen.getByRole('button', { name: 'Eliminar' })).toBeTruthy();
});

test('there is no close cross', () => {
  open();
  /*
   * A third way to say no, beside a button that says it in words. `Dialog` has
   * one because its footer may hold anything; here the answers ARE the footer.
   */
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  expect(screen.getAllByRole('button')).toHaveLength(2);
});

test('a synchronous confirm closes the dialog', async () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();
  open({ onOpenChange, onConfirm });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('a promise keeps it open until the promise settles', async () => {
  const onOpenChange = vi.fn();
  const { promise, resolve } = deferred();
  open({ onOpenChange, onConfirm: () => promise });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

  // Still open, and nothing has been told to close.
  expect(onOpenChange).not.toHaveBeenCalled();
  expect(screen.getByRole('alertdialog')).toBeTruthy();

  resolve();
  await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
});

test('while it is in flight, cancelling is disabled', async () => {
  const { promise, resolve } = deferred();
  open({ onConfirm: () => promise });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

  /*
   * Both routes out are closed while the action is under way — you cannot
   * dismiss a dialog whose action is already happening (doc 09 §7). Cancelling
   * would leave the promise running with nothing listening.
   */
  const cancel = screen.getByRole<HTMLButtonElement>('button', {
    name: 'Cancel'
  });
  await vi.waitFor(() => expect(cancel.disabled).toBe(true));

  resolve();
});

test('and the confirming button says it is working', async () => {
  const { promise, resolve } = deferred();
  open({ onConfirm: () => promise });

  const confirm = screen.getByRole('button', { name: 'Delete' });
  await userEvent.click(confirm);

  /*
   * `aria-disabled` rather than `disabled`, which is the base's own choice for
   * a pending button: it stays focusable and announced, so somebody who just
   * pressed it is told what is happening instead of losing it from the
   * accessibility tree.
   */
  await vi.waitFor(() =>
    expect(confirm.getAttribute('aria-disabled')).toBe('true')
  );

  resolve();
});

test('A REJECTED PROMISE LEAVES THE DIALOG OPEN', async () => {
  const onOpenChange = vi.fn();
  const { promise, reject } = deferred();
  open({ onOpenChange, onConfirm: () => promise });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  reject(new Error('the server said no'));

  /*
   * The decision this component is most likely to be argued with about. The
   * error happened HERE, so it is shown here (doc 09 §4) — which means the
   * consumer renders an Alert in the content, and they cannot if the dialog
   * has gone.
   *
   * Waiting for the pending state to clear rather than sleeping, so the
   * assertion is about a settled dialog rather than a lucky moment.
   */
  const confirm = screen.getByRole('button', { name: 'Delete' });
  await vi.waitFor(() =>
    expect(confirm.getAttribute('aria-disabled')).not.toBe('true')
  );

  expect(onOpenChange).not.toHaveBeenCalled();
  expect(screen.getByRole('alertdialog')).toBeTruthy();
});

test('and it can be tried again', async () => {
  const onOpenChange = vi.fn();
  const first = deferred();
  const second = deferred();
  const onConfirm = vi
    .fn()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);

  open({ onOpenChange, onConfirm });

  const confirm = screen.getByRole('button', { name: 'Delete' });
  await userEvent.click(confirm);
  first.reject(new Error('the server said no'));
  await vi.waitFor(() =>
    expect(confirm.getAttribute('aria-disabled')).not.toBe('true')
  );

  // A failure that left the button permanently pending would be worse than
  // closing: the dialog would be a dead end.
  await userEvent.click(confirm);
  expect(onConfirm).toHaveBeenCalledTimes(2);

  second.resolve();
  await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
});

test('a consumer who catches their own error gets the close back', async () => {
  const onOpenChange = vi.fn();
  open({
    onOpenChange,
    /*
     * The escape hatch, asserted so it is not merely claimed in a doc comment:
     * catching makes the promise FULFIL, so the dialog closes. "Stay open on
     * failure" is therefore a default and not a policy.
     */
    onConfirm: () => Promise.reject(new Error('x')).catch(() => {})
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
});

test('Escape closes it when nothing is in flight', async () => {
  const onOpenChange = vi.fn();
  open({ onOpenChange });

  await userEvent.keyboard('{Escape}');
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('and Escape does nothing while the action is under way', async () => {
  const onOpenChange = vi.fn();
  const { promise, resolve } = deferred();
  open({ onOpenChange, onConfirm: () => promise });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.keyboard('{Escape}');

  /*
   * `Dialog` deliberately cannot do this — doc 09 §8, one component that
   * swallows Escape costs the other twenty-nine their credibility. It is
   * allowed here because this component owns the promise and knows exactly
   * when the key is unsafe.
   */
  expect(onOpenChange).not.toHaveBeenCalled();

  resolve();
  await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
});

test('a closed confirmation renders nothing', () => {
  render(
    <ConfirmDialog
      isOpen={false}
      onOpenChange={() => {}}
      title="Delete customer 4821?"
      confirmLabel="Delete"
    >
      Body
    </ConfirmDialog>
  );
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(screen.queryByText('Delete customer 4821?')).toBeNull();
});
