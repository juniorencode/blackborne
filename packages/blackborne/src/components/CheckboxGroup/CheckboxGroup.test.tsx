/*
 * The group is the unit here, and two things are worth asserting beyond the
 * shape RadioGroup already covers.
 *
 * First, that the existing Checkbox works inside it with no change: the base
 * hands the group state down by context, and everything the group knows has to
 * reach the option through that and nothing else.
 *
 * Second, the keyboard, because this is where the pair diverges. A radio set is
 * ONE tab stop with the arrows moving inside it; a checkbox set is one stop per
 * option and `Space` toggles. Doc 09 §8 fixes both, and the risk with two
 * components that look alike is that one quietly grows the other's behaviour.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Checkbox } from '../Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

const options = (
  <>
    <Checkbox value="email">Email</Checkbox>
    <Checkbox value="sms">SMS</Checkbox>
    <Checkbox value="push">Push</Checkbox>
  </>
);

const describedText = (el: HTMLElement) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map(id => document.getElementById(id)?.textContent)
    .join(' | ');

test('it works on its own, with no form around it', () => {
  render(<CheckboxGroup label="Notifications">{options}</CheckboxGroup>);
  expect(screen.getByRole('group', { name: 'Notifications' })).toBeTruthy();
  expect(screen.getAllByRole('checkbox')).toHaveLength(3);
});

test('the group has a label and each option has its own', () => {
  render(<CheckboxGroup label="Notifications">{options}</CheckboxGroup>);
  // Two levels of label, the same as RadioGroup.
  expect(screen.getByRole('group', { name: 'Notifications' })).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'SMS' })).toBeTruthy();
});

test('a hidden group label still names the group', () => {
  render(
    <CheckboxGroup label="Notifications" isLabelHidden>
      {options}
    </CheckboxGroup>
  );
  expect(screen.getByRole('group', { name: 'Notifications' })).toBeTruthy();
});

test('the description reaches the group and every option', () => {
  render(
    <CheckboxGroup label="Notifications" description="Sent at most weekly.">
      {options}
    </CheckboxGroup>
  );

  expect(describedText(screen.getByRole('group'))).toContain(
    'Sent at most weekly.'
  );
  // The base references it from every option too, which is the whole reason
  // the existing Checkbox needs no change to sit in here.
  for (const box of screen.getAllByRole('checkbox')) {
    expect(describedText(box)).toContain('Sent at most weekly.');
  }
});

test('the error reaches the group and every option, and only while invalid', () => {
  const { rerender } = render(
    <CheckboxGroup label="Notifications" errorMessage="Choose at least one.">
      {options}
    </CheckboxGroup>
  );
  expect(screen.queryByText('Choose at least one.')).toBeNull();

  rerender(
    <CheckboxGroup
      label="Notifications"
      isInvalid
      errorMessage="Choose at least one."
    >
      {options}
    </CheckboxGroup>
  );

  const group = screen.getByRole('group');
  expect(describedText(group)).toContain('Choose at least one.');
  /*
   * On the group, invalid is a data attribute and nothing more: aria-invalid
   * is not a property of role="group", so the base puts it on each option
   * instead. This is the half that would break silently if the wiring moved.
   */
  expect(group.getAttribute('data-invalid')).toBe('true');
  for (const box of screen.getAllByRole('checkbox')) {
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(describedText(box)).toContain('Choose at least one.');
  }
});

test('the description survives an error rather than being replaced', () => {
  render(
    <CheckboxGroup
      label="Notifications"
      isInvalid
      description="Sent at most weekly."
      errorMessage="Choose at least one."
    >
      {options}
    </CheckboxGroup>
  );
  const described = describedText(screen.getByRole('group'));
  expect(described).toContain('Sent at most weekly.');
  expect(described).toContain('Choose at least one.');
});

test('required marks the options, and the group only as data', () => {
  render(
    <CheckboxGroup label="Notifications" isRequired>
      {options}
    </CheckboxGroup>
  );
  const group = screen.getByRole('group');
  expect(group.getAttribute('data-required')).toBe('true');
  // Not on the group element, unlike a radiogroup — role="group" supports
  // neither aria-required nor aria-invalid.
  expect(group.getAttribute('aria-required')).toBeNull();
  for (const box of screen.getAllByRole('checkbox')) {
    expect(box).toHaveProperty('required', true);
  }
});

test('orientation is layout only and invents no ARIA', () => {
  render(
    <CheckboxGroup label="Notifications" orientation="horizontal">
      {options}
    </CheckboxGroup>
  );
  /*
   * The options are independent tab stops, so there is no directional
   * navigation to announce. The prop must not leak to the DOM as an attribute
   * either, which is what the rest spread would do if it were forwarded.
   */
  const group = screen.getByRole('group');
  expect(group.getAttribute('aria-orientation')).toBeNull();
  expect(group.getAttribute('orientation')).toBeNull();
});

test('every option is its own tab stop', async () => {
  const user = userEvent.setup();
  render(
    <>
      <CheckboxGroup label="Notifications">
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">SMS</Checkbox>
      </CheckboxGroup>
      <button type="button">After</button>
    </>
  );

  await user.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('checkbox', { name: 'Email' })
  );
  // The divergence from RadioGroup: one more Tab reaches option two rather
  // than leaving the group.
  await user.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('checkbox', { name: 'SMS' })
  );
  await user.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'After' })
  );
});

test('space toggles the focused option', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <CheckboxGroup label="Notifications" onChange={onChange}>
      {options}
    </CheckboxGroup>
  );

  await user.tab();
  // Doc 09 §8: Space toggles, everywhere in the library.
  await user.keyboard('[Space]');
  expect(onChange).toHaveBeenLastCalledWith(['email']);
});

test('several options are held at once, as an array', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <CheckboxGroup label="Notifications" onChange={onChange}>
      {options}
    </CheckboxGroup>
  );

  await user.click(screen.getByRole('checkbox', { name: 'Email' }));
  expect(onChange).toHaveBeenLastCalledWith(['email']);

  await user.click(screen.getByRole('checkbox', { name: 'Push' }));
  expect(onChange).toHaveBeenLastCalledWith(['email', 'push']);

  // Nothing is exclusive: the first one stays on.
  expect(screen.getByRole('checkbox', { name: 'Email' })).toHaveProperty(
    'checked',
    true
  );

  await user.click(screen.getByRole('checkbox', { name: 'Email' }));
  expect(onChange).toHaveBeenLastCalledWith(['push']);
});

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <CheckboxGroup label="Notifications" value={['email']} onChange={onChange}>
      {options}
    </CheckboxGroup>
  );
  await user.click(screen.getByRole('checkbox', { name: 'SMS' }));
  expect(onChange).toHaveBeenCalledWith(['email', 'sms']);
  // Held: the value came back unchanged, so nothing moved.
  expect(screen.getByRole('checkbox', { name: 'SMS' })).toHaveProperty(
    'checked',
    false
  );
  unmount();

  render(
    <CheckboxGroup label="Notifications" defaultValue={['sms', 'push']}>
      {options}
    </CheckboxGroup>
  );
  expect(screen.getByRole('checkbox', { name: 'SMS' })).toHaveProperty(
    'checked',
    true
  );
  expect(screen.getByRole('checkbox', { name: 'Push' })).toHaveProperty(
    'checked',
    true
  );
});

test('a disabled group does not respond', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <CheckboxGroup label="Notifications" isDisabled onChange={onChange}>
      {options}
    </CheckboxGroup>
  );

  await user.click(screen.getByRole('checkbox', { name: 'Email' }));
  expect(onChange).not.toHaveBeenCalled();
});

test('a read-only group shows its value and refuses to change it', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <CheckboxGroup
      label="Notifications"
      isReadOnly
      defaultValue={['email']}
      onChange={onChange}
    >
      {options}
    </CheckboxGroup>
  );

  // Read-only is not disabled (doc 07 §6): the value is there to be read, and
  // the option stays reachable.
  const email = screen.getByRole('checkbox', { name: 'Email' });
  expect(email).toHaveProperty('checked', true);
  expect(email.getAttribute('aria-readonly')).toBe('true');
  expect(email).toHaveProperty('disabled', false);

  await user.click(screen.getByRole('checkbox', { name: 'SMS' }));
  expect(onChange).not.toHaveBeenCalled();
});

test('one option can be disabled while the rest work', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <CheckboxGroup label="Notifications" onChange={onChange}>
      <Checkbox value="email">Email</Checkbox>
      <Checkbox value="sms" isDisabled>
        SMS
      </Checkbox>
    </CheckboxGroup>
  );

  await user.click(screen.getByRole('checkbox', { name: 'SMS' }));
  expect(onChange).not.toHaveBeenCalled();

  await user.click(screen.getByRole('checkbox', { name: 'Email' }));
  expect(onChange).toHaveBeenCalledWith(['email']);
});
