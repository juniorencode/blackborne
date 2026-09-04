/*
 * The interesting assertions here are about what a switch IS, not what it
 * looks like: it is announced as a switch rather than a checkbox, and it
 * deliberately has no error state.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Switch } from './Switch';

test('it works on its own, with no form around it', () => {
  render(<Switch>Email notifications</Switch>);
  expect(
    screen.getByRole('switch', { name: 'Email notifications' })
  ).toBeTruthy();
});

test('it is announced as a switch, not as a checkbox', () => {
  render(<Switch>Email notifications</Switch>);
  // The role is the whole point: assistive technology says "on" and "off"
  // rather than "checked", which is what the control actually means.
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.getByRole('switch')).toBeTruthy();
});

test('the description is referenced by the control', () => {
  render(
    <Switch description="Takes effect immediately.">Email notifications</Switch>
  );

  const control = screen.getByRole('switch');
  const described = (control.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');

  // The base renders no description for a switch, so this association is
  // supplied by the component — same gap as a lone checkbox.
  expect(described).toContain('Takes effect immediately.');
});

test('aria-describedby is omitted when there is no description', () => {
  render(<Switch>Email notifications</Switch>);
  expect(screen.getByRole('switch').hasAttribute('aria-describedby')).toBe(
    false
  );
});

test('it has no error state, by design', () => {
  /*
   * This test exists to make the decision visible rather than implicit. The
   * base ACCEPTS isInvalid on a Switch — verified — so leaving it out is a
   * choice, and one someone will reasonably want to reverse.
   *
   * The reasoning: a switch takes effect the moment it is flipped, so there is
   * no later moment at which it can be found invalid. If flipping it can fail,
   * the failure belongs where it happened (doc 09 §4) and the switch returns
   * to its previous position. A value that needs validating before submission
   * is a Checkbox.
   *
   * If this test starts failing, read that argument again before deleting it.
   */
  const props = { isInvalid: true } as Record<string, unknown>;
  render(<Switch {...props}>Email notifications</Switch>);

  expect(screen.getByRole('switch').getAttribute('aria-invalid')).toBeNull();
});

test('it toggles by click and by Space', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<Switch onChange={onChange}>Email notifications</Switch>);

  const control = screen.getByRole('switch');
  await user.click(control);
  expect(onChange).toHaveBeenLastCalledWith(true);

  control.focus();
  await user.keyboard(' ');
  // Doc 09 §8: Space toggles, everywhere in the library.
  expect(onChange).toHaveBeenLastCalledWith(false);
});

test('it is reachable by keyboard', async () => {
  const user = userEvent.setup();
  render(<Switch>Email notifications</Switch>);
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('switch'));
});

test('disabled does not toggle', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <Switch isDisabled onChange={onChange}>
      Email notifications
    </Switch>
  );

  await user.click(screen.getByRole('switch'));
  expect(onChange).not.toHaveBeenCalled();
});

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <Switch isSelected={false} onChange={onChange}>
      Fixed off
    </Switch>
  );
  await user.click(screen.getByRole('switch'));
  expect(onChange).toHaveBeenCalledWith(true);
  expect(screen.getByRole('switch')).toHaveProperty('checked', false);
  unmount();

  render(<Switch defaultSelected>Starts on</Switch>);
  expect(screen.getByRole('switch')).toHaveProperty('checked', true);
});

test('the ref reaches the label element', () => {
  const ref = createRef<HTMLLabelElement>();
  render(<Switch ref={ref}>Email notifications</Switch>);
  expect(ref.current?.tagName).toBe('LABEL');
  expect(ref.current?.contains(screen.getByRole('switch'))).toBe(true);
});
