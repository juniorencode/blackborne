/*
 * What is worth asserting without a browser.
 *
 * Most of what a drawer promises is layer behaviour, and doc 08 §9 is explicit
 * that jsdom cannot answer those questions — it does not implement real tab
 * order and resolves no CSS. Focus, the scroll lock, and which edge the panel
 * actually lands on are all in the e2e suite.
 *
 * Two things here earn their place:
 *
 * 1. **The direction reaches the panel.** It is the one piece of this component
 *    that is not expressible in logical CSS — there is no logical `translate`,
 *    so the slide's sign comes from `dir`, read from the locale. That is plain
 *    DOM and jsdom can check it, and it is the assertion that would catch a
 *    drawer sliding in from the wrong side in Arabic.
 * 2. **`useDialog()` works inside a Drawer.** The hook is named for the dialog
 *    and a drawer is one in the sense that matters, so a consumer's footer
 *    button has to close it. If the shared sheet ever stopped providing the
 *    base's state, this is what fails.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { Button } from '../Button';
import { useDialog } from '../Dialog';
import { Drawer, type DrawerSide } from './Drawer';

const SIDES = [
  'start',
  'end',
  'top',
  'bottom'
] as const satisfies readonly DrawerSide[];

const panel = () => document.querySelector('.bb-drawer-panel');

test('a closed drawer renders nothing at all', () => {
  render(
    <Drawer isOpen={false} onOpenChange={() => {}} title="Customer 4821">
      Body
    </Drawer>
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByText('Customer 4821')).toBeNull();
});

test('the title becomes the accessible name', () => {
  render(
    <Drawer isOpen onOpenChange={() => {}} title="Customer 4821">
      Body
    </Drawer>
  );
  /*
   * By role AND name. The heading is wired through the base's title slot, and
   * getting that wrong leaves a layer with no name at all while still
   * rendering a plausible heading — the failure Dialog's tests describe.
   */
  expect(screen.getByRole('dialog', { name: 'Customer 4821' })).toBeTruthy();
});

test('it is a dialog, and says so', () => {
  render(
    <Drawer isOpen onOpenChange={() => {}} title="Customer 4821">
      Body
    </Drawer>
  );
  /*
   * Not a landmark, not a region: `role="dialog"`. That is what makes the
   * modality, the focus containment and `useDialog()` all apply, and it is why
   * this is a sibling of Dialog rather than a different kind of thing.
   */
  expect(screen.getByRole('dialog').tagName.toLowerCase()).toBe('section');
});

for (const side of SIDES) {
  test(`side="${side}" reaches the panel as data`, () => {
    render(
      <Drawer isOpen onOpenChange={() => {}} side={side} title="Customer 4821">
        Body
      </Drawer>
    );
    /*
     * Structural rather than stylistic: the CSS that positions and animates the
     * panel selects on this attribute, so a side that never reached the DOM
     * would leave the panel unplaced with nothing to say so. The appearance
     * itself is checked in the browser, not here — asserting class names proves
     * nothing about it.
     */
    expect(panel()?.getAttribute('data-side')).toBe(side);
  });
}

test('the axis is derived, not asked for', () => {
  render(
    <Drawer isOpen onOpenChange={() => {}} side="bottom" title="Filters">
      Body
    </Drawer>
  );
  // Two props that could disagree would be one prop too many (doc 01 §7).
  expect(panel()?.getAttribute('data-axis')).toBe('block');
});

test('the direction comes from the language', () => {
  render(
    <ConfigProvider locale="ar-EG">
      <Drawer isOpen onOpenChange={() => {}} side="start" title="العميل">
        Body
      </Drawer>
    </ConfigProvider>
  );

  /*
   * The assertion this file exists for. A drawer at the inline start enters
   * from the left in English and from the right in Arabic, and no logical CSS
   * property expresses that — so `dir` on the panel is the whole mechanism.
   *
   * Derived from the locale and never passed separately (doc 05 §4), which is
   * also why this test sets a language rather than a direction.
   */
  expect(panel()?.getAttribute('dir')).toBe('rtl');
});

test('and is ltr for an ltr language', () => {
  render(
    <ConfigProvider locale="es-PE">
      <Drawer isOpen onOpenChange={() => {}} side="start" title="Cliente">
        Body
      </Drawer>
    </ConfigProvider>
  );
  expect(panel()?.getAttribute('dir')).toBe('ltr');
});

test('Escape closes it', async () => {
  const onOpenChange = vi.fn();
  render(
    <Drawer isOpen onOpenChange={onOpenChange} title="Customer 4821">
      Body
    </Drawer>
  );

  await userEvent.keyboard('{Escape}');
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('the close button closes it, and is named from the dictionary', async () => {
  const onOpenChange = vi.fn();
  render(
    <Drawer isOpen onOpenChange={onOpenChange} title="Customer 4821">
      Body
    </Drawer>
  );

  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('a click outside does not close it by default', async () => {
  const onOpenChange = vi.fn();
  render(
    <Drawer isOpen onOpenChange={onOpenChange} title="New customer">
      Body
    </Drawer>
  );

  /*
   * Doc 08 §5, and a drawer has more of this to lose than a dialog: the panel
   * takes one edge and the whole rest of the window dismisses it, so a stray
   * click is likelier rather than less likely.
   */
  await userEvent.click(document.body);
  expect(onOpenChange).not.toHaveBeenCalled();
});

test('a click outside closes it when asked', async () => {
  const onOpenChange = vi.fn();
  render(
    <Drawer isOpen isDismissable onOpenChange={onOpenChange} title="Invoice">
      Body
    </Drawer>
  );

  await userEvent.click(document.body);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('a footer button closes the drawer through useDialog', async () => {
  const onOpenChange = vi.fn();

  function Cancel() {
    const { close } = useDialog();
    return <Button onPress={close}>Cancel</Button>;
  }

  render(
    <Drawer
      isOpen
      onOpenChange={onOpenChange}
      title="Customer 4821"
      footer={<Cancel />}
    >
      Body
    </Drawer>
  );

  /*
   * The hook is named for a dialog and this is a drawer, which is exactly why
   * it is asserted: the name would be a lie if it did not work here, and one
   * more hook that did the same thing would be doc 01 §7.
   */
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('no footer element exists when none was given', () => {
  render(
    <Drawer isOpen onOpenChange={() => {}} title="Customer 4821">
      Body
    </Drawer>
  );
  expect(document.querySelector('footer')).toBeNull();
});
