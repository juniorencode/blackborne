/*
 * What holds without a browser, which for a menu is less than it looks.
 *
 * Everything a menu is FOR is keyboard behaviour — the arrow keys, the
 * typeahead, the highlight that follows both a key and a pointer, focus
 * returning to the trigger — and jsdom implements no real tab order, so none
 * of that can be asserted here (doc 08 §9). It is measured in
 * `apps/catalog/e2e/menu.spec.ts`.
 *
 * What is here: that the collection sees what this library wraps, that a
 * command runs what it was given, and that the menu is named by the control
 * that opened it rather than by a prop.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Button } from '../Button';
import { Menu, MenuItem, MenuSeparator } from './Menu';

const Actions = ({
  onSend = () => {},
  onDelete = () => {}
}: {
  onSend?: () => void;
  onDelete?: () => void;
}) => (
  <Menu trigger={<Button>Actions</Button>}>
    <MenuItem onAction={onSend}>Send</MenuItem>
    <MenuItem onAction={() => {}} isDisabled>
      Duplicate
    </MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger" onAction={onDelete}>
      Delete
    </MenuItem>
  </Menu>
);

test('nothing is open until the trigger is pressed', () => {
  render(<Actions />);

  expect(screen.getByRole('button', { name: 'Actions' })).toBeDefined();
  expect(screen.queryByRole('menu')).toBeNull();
});

/*
 * The commands and the divider are elements this library wraps, and the base's
 * collection is what reads them. A wrapper the collection did not see would
 * leave the menu empty — which is the failure this asserts against, and the
 * reason `MenuSeparator` uses the base's separator rather than this library's
 * own `Separator` component.
 */
test('the collection sees the wrapped commands and the divider', async () => {
  const user = userEvent.setup();
  render(<Actions />);

  await user.click(screen.getByRole('button', { name: 'Actions' }));

  const menu = screen.getByRole('menu');
  expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  expect(menu.querySelector('.bb-menu-separator')).not.toBeNull();
});

/*
 * Measured rather than assumed, and the reason there is no `label` prop: the
 * base points the menu's `aria-labelledby` at the trigger, so the menu is
 * named by the button that opened it.
 */
test('the menu is named by the control that opened it', async () => {
  const user = userEvent.setup();
  render(<Actions />);

  await user.click(screen.getByRole('button', { name: 'Actions' }));

  expect(screen.getByRole('menu', { name: 'Actions' })).toBeDefined();
});

test('a command runs what it was given, and closes the menu', async () => {
  const user = userEvent.setup();
  const onSend = vi.fn();

  render(<Actions onSend={onSend} />);

  await user.click(screen.getByRole('button', { name: 'Actions' }));
  await user.click(screen.getByRole('menuitem', { name: 'Send' }));

  expect(onSend).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menu')).toBeNull();
});

test('a disabled command runs nothing', async () => {
  const user = userEvent.setup();
  const onAction = vi.fn();

  render(
    <Menu trigger={<Button>Actions</Button>}>
      <MenuItem onAction={onAction} isDisabled>
        Duplicate
      </MenuItem>
    </Menu>
  );

  await user.click(screen.getByRole('button', { name: 'Actions' }));
  await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }));

  expect(onAction).not.toHaveBeenCalled();
  // And it is announced as unavailable rather than merely looking it.
  expect(
    screen
      .getByRole('menuitem', { name: 'Duplicate' })
      .getAttribute('aria-disabled')
  ).toBe('true');
});

/*
 * A destructive command is red AND says "Delete", which is the pair doc 06 §3
 * asks for — colour is never the only channel. The word is what this can
 * assert; that the two tones differ visually is a baseline.
 */
test('a destructive command still says what it does', async () => {
  const user = userEvent.setup();
  render(<Actions />);

  await user.click(screen.getByRole('button', { name: 'Actions' }));

  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDefined();
});

test('Escape closes it and runs nothing', async () => {
  const user = userEvent.setup();
  const onSend = vi.fn();
  const onDelete = vi.fn();

  render(<Actions onSend={onSend} onDelete={onDelete} />);

  await user.click(screen.getByRole('button', { name: 'Actions' }));
  await user.keyboard('{Escape}');

  expect(screen.queryByRole('menu')).toBeNull();
  expect(onSend).not.toHaveBeenCalled();
  expect(onDelete).not.toHaveBeenCalled();
});

/*
 * Doc 02 §8: controlled, with the trigger as the ordinary route. Something
 * else deciding is the case a table's row menu needs when only one row's menu
 * may be open at a time.
 */
test('it can be opened from outside', async () => {
  const onOpenChange = vi.fn<(isOpen: boolean) => void>();

  render(
    <Menu isOpen trigger={<Button>Actions</Button>} onOpenChange={onOpenChange}>
      <MenuItem onAction={() => {}}>Send</MenuItem>
    </Menu>
  );

  expect(screen.getByRole('menu')).toBeDefined();

  const user = userEvent.setup();
  await user.keyboard('{Escape}');
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
