/*
 * The half that holds without a browser: two buttons, both named, and the one
 * warning this component adds.
 *
 * Not here: the seam. Whether the two halves read as one control is a question
 * about a compiled stylesheet and a rendered box, so the radius, the divider
 * and the single 1px line are measured in
 * `apps/catalog/e2e/split-button.spec.ts`.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { MenuItem, MenuSeparator } from '../Menu';
import { SplitButton } from './SplitButton';

const Save = (props: Partial<Parameters<typeof SplitButton>[0]> = {}) => (
  <SplitButton label="Save" onPress={() => {}} {...props}>
    <MenuItem onAction={() => {}}>Save and add another</MenuItem>
    <MenuItem onAction={() => {}}>Save as a draft</MenuItem>
  </SplitButton>
);

test('it is two buttons, and both of them are named', () => {
  render(<Save />);

  /*
   * Two, and that is the component's whole shape: a press and a menu are
   * different things, and a screen reader hears them as different things. The
   * arrow's name comes from the dictionary, because a chevron says nothing.
   */
  expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'More actions' })).toBeDefined();
  expect(screen.getAllByRole('button')).toHaveLength(2);
});

test('the action is pressed, and the menu is not opened by it', async () => {
  const user = userEvent.setup();
  const onPress = vi.fn();

  render(<Save onPress={onPress} />);

  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menu')).toBeNull();
});

test('the arrow opens the alternatives, and they run their own actions', async () => {
  const user = userEvent.setup();
  const onAction = vi.fn();
  const onPress = vi.fn();

  render(
    <SplitButton label="Save" onPress={onPress}>
      <MenuItem onAction={onAction}>Save and add another</MenuItem>
    </SplitButton>
  );

  await user.click(screen.getByRole('button', { name: 'More actions' }));
  await user.click(
    screen.getByRole('menuitem', { name: 'Save and add another' })
  );

  expect(onAction).toHaveBeenCalledTimes(1);
  // The action of the left-hand half is not run by choosing an alternative.
  expect(onPress).not.toHaveBeenCalled();
});

test('disabled switches off both halves', () => {
  render(<Save isDisabled />);

  for (const button of screen.getAllByRole('button')) {
    expect(button.getAttribute('disabled')).not.toBeNull();
  }
});

/*
 * MEASURED DECISION, and the reason it is a test rather than a comment: the
 * menu holds alternatives to an action that is already running, so starting a
 * second one mid-flight is the state doc 09 §7 is about. `ConfirmDialog`
 * disables its cancelling button from the same argument.
 */
test('pending switches off the arrow as well as the action', () => {
  render(<Save isPending />);

  expect(
    screen
      .getByRole('button', { name: 'More actions' })
      .getAttribute('disabled')
  ).not.toBeNull();
});

test('and the label keeps its width while it is pending', () => {
  render(<Save isPending />);

  /*
   * `Button`'s own behaviour, asserted here because this is the component that
   * puts a button in a row with another one: the label is hidden with opacity
   * rather than removed, so the control holds its width and the arrow beside
   * it does not slide sideways. It is also why the name survives — hiding with
   * `visibility` would take it out of the accessibility tree.
   */
  expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
});

/*
 * The one thing this component adds to what `Button` and `Menu` already do.
 *
 * Opening the menu with a key focuses its first row — measured while `Menu`
 * was built — so a destructive first row is one press away. Doc 09 §5 rule 5
 * says the destructive option is not the one focused by default, and it was
 * written about a confirmation dialog; this is the same argument arriving
 * somewhere else.
 */
test('a destructive first row is reported in development', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  render(
    <SplitButton label="Save" onPress={() => {}}>
      <MenuItem tone="danger" onAction={() => {}}>
        Discard the changes
      </MenuItem>
      <MenuItem onAction={() => {}}>Save as a draft</MenuItem>
    </SplitButton>
  );

  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toContain('destructive');

  warn.mockRestore();
});

test('and the same command last is not reported', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  render(
    <SplitButton label="Save" onPress={() => {}}>
      <MenuItem onAction={() => {}}>Save as a draft</MenuItem>
      <MenuSeparator />
      <MenuItem tone="danger" onAction={() => {}}>
        Discard the changes
      </MenuItem>
    </SplitButton>
  );

  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

test('the rows reach the menu untouched, separator and all', async () => {
  const user = userEvent.setup();
  render(
    <SplitButton label="Save" onPress={() => {}}>
      <MenuItem onAction={() => {}}>Save as a draft</MenuItem>
      <MenuSeparator />
      <MenuItem onAction={() => {}}>Save and close</MenuItem>
    </SplitButton>
  );

  await user.click(screen.getByRole('button', { name: 'More actions' }));

  expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  expect(screen.getByRole('separator')).toBeDefined();
});

test('it needs no provider', () => {
  render(<Save />);

  expect(screen.getByRole('button', { name: 'More actions' })).toBeDefined();
});
