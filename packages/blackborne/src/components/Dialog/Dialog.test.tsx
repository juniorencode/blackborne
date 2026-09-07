/*
 * What can honestly be tested without a browser, and what cannot.
 *
 * Doc 08 §9 is explicit, and it was learned the hard way: jsdom is a fine
 * instrument for "does Escape close the right thing" and a useless one for
 * "where does Tab go" — it does not implement real tab order, and a
 * reproduction of a focus bug passed every case here while failing in a
 * browser. So focus containment, focus return, scroll locking and anything
 * about the viewport live in the e2e suite, and this file does not pretend to
 * cover them.
 *
 * What it does cover is the accessible NAME, which is the thing about this
 * component most worth a test. The base generates the id its `aria-labelledby`
 * points at and hands it down through the title slot's context; a hand-written
 * `<h2>` never receives it, and the dialog ends up with no name at all.
 *
 * Development warns — the base checks the rendered element in an effect — so
 * this is not silent while you work. It is silent in PRODUCTION, where that
 * check is compiled out and the only symptom is a screen reader announcing
 * "dialog" and nothing else. A console message nobody is looking at is not a
 * gate, so the name is asserted by querying for role AND name: that is what
 * makes the assertion follow the attribute rather than trust it.
 *
 * Verified with teeth, not assumed: replacing the heading with a plain `<h2>`
 * fails this file's name test and its structure test, and passes the other
 * eleven.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { Button } from '../Button';
import { Dialog } from './Dialog';
import { useDialog } from './useDialog';

test('a closed dialog renders nothing at all', () => {
  render(
    <Dialog isOpen={false} onOpenChange={() => {}} title="Edit customer">
      Body
    </Dialog>
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  // Not merely hidden: the title must not be in the document either, or a
  // screen reader would find the words of every closed dialog on the page.
  expect(screen.queryByText('Edit customer')).toBeNull();
});

test('the title becomes the accessible name', () => {
  render(
    <Dialog isOpen onOpenChange={() => {}} title="Edit customer">
      Body
    </Dialog>
  );
  /*
   * By role AND name. `getByRole('dialog')` alone passes a dialog with no
   * name whatsoever, which is exactly the failure this asserts against —
   * measured, by rendering the title as a plain heading instead.
   */
  expect(screen.getByRole('dialog', { name: 'Edit customer' })).toBeTruthy();
});

test('the title is a level 2 heading, which the base decides', () => {
  render(
    <Dialog isOpen onOpenChange={() => {}} title="Edit customer">
      Body
    </Dialog>
  );
  // A dialog is a boundary: the document outline restarts inside it, so unlike
  // an Alert it CAN know its level. The base supplies 2 through the slot.
  expect(
    screen.getByRole('heading', { level: 2, name: 'Edit customer' })
  ).toBeTruthy();
});

test('Escape closes it', async () => {
  const onOpenChange = vi.fn();
  render(
    <Dialog isOpen onOpenChange={onOpenChange} title="Edit customer">
      Body
    </Dialog>
  );

  await userEvent.keyboard('{Escape}');
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('the close button closes it, and is named from the dictionary', async () => {
  const onOpenChange = vi.fn();
  render(
    <Dialog isOpen onOpenChange={onOpenChange} title="Edit customer">
      Body
    </Dialog>
  );

  const close = screen.getByRole('button', { name: 'Close' });
  await userEvent.click(close);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('a translated dictionary renames the close button', () => {
  render(
    <ConfigProvider locale="es-PE" dictionary={{ close: 'Cerrar' }}>
      <Dialog isOpen onOpenChange={() => {}} title="Editar cliente">
        Cuerpo
      </Dialog>
    </ConfigProvider>
  );

  expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy();
  // And the English is gone rather than sitting beside it.
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
});

test('a click outside does not close it by default', async () => {
  const onOpenChange = vi.fn();
  render(
    <Dialog isOpen onOpenChange={onOpenChange} title="New customer">
      Body
    </Dialog>
  );

  /*
   * Doc 08 §5: a layer that holds unsaved input is not dismissable by clicking
   * outside, and since this component cannot inspect what its children are,
   * the safe case is the default. The base agrees — `isDismissable` defaults
   * to false — and this asserts we did not turn it on for convenience.
   */
  await userEvent.click(document.body);
  expect(onOpenChange).not.toHaveBeenCalled();
});

test('a click outside closes it when asked', async () => {
  const onOpenChange = vi.fn();
  render(
    <Dialog
      isOpen
      isDismissable
      onOpenChange={onOpenChange}
      title="Invoice F001-00012"
    >
      Body
    </Dialog>
  );

  await userEvent.click(document.body);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('a footer button closes the dialog through useDialog', async () => {
  const onOpenChange = vi.fn();

  function Cancel() {
    const { close } = useDialog();
    return <Button onPress={close}>Cancel</Button>;
  }

  render(
    <Dialog
      isOpen
      onOpenChange={onOpenChange}
      title="Edit customer"
      footer={<Cancel />}
    >
      Body
    </Dialog>
  );

  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('useDialog reports the dialog it is inside as open', () => {
  function Probe() {
    const { isOpen } = useDialog();
    return <span data-testid="probe">{String(isOpen)}</span>;
  }

  render(
    <Dialog isOpen onOpenChange={() => {}} title="Edit customer">
      <Probe />
    </Dialog>
  );

  expect(screen.getByTestId('probe').textContent).toBe('true');
});

test('useDialog is harmless with no dialog above it', async () => {
  function Probe() {
    const { close, isOpen } = useDialog();
    return (
      <button type="button" data-testid="probe" onClick={close}>
        {String(isOpen)}
      </button>
    );
  }

  render(<Probe />);

  /*
   * A footer shared between a page and a dialog should not have to know which
   * one it landed in, so `close` does nothing rather than throwing.
   */
  expect(screen.getByTestId('probe').textContent).toBe('false');
  await userEvent.click(screen.getByTestId('probe'));
  expect(screen.getByTestId('probe').textContent).toBe('false');
});

test('no footer element exists when none was given', () => {
  const { container } = render(
    <Dialog isOpen onOpenChange={() => {}} title="Edit customer">
      Body
    </Dialog>
  );
  // An empty actions row would reserve padding for nothing.
  expect(container.ownerDocument.querySelector('footer')).toBeNull();
});

test('the body and the footer are both inside the dialog', () => {
  render(
    <Dialog
      isOpen
      onOpenChange={() => {}}
      title="Edit customer"
      footer={<Button>Save</Button>}
    >
      <p>The body</p>
    </Dialog>
  );

  /*
   * Structural, not stylistic: the footer has to be a descendant of the
   * element carrying `role="dialog"`, because that element is the scroll
   * container and the footer pins itself inside it. A footer outside would
   * scroll away, and nothing about its appearance would say so.
   */
  const dialog = screen.getByRole('dialog', { name: 'Edit customer' });
  expect(dialog.contains(screen.getByText('The body'))).toBe(true);
  expect(dialog.contains(screen.getByRole('button', { name: 'Save' }))).toBe(
    true
  );
});
