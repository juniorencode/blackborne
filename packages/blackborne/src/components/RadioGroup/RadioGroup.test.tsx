/*
 * The group is the unit here. What is worth asserting is the two-level label
 * structure and the keyboard convention — a set of radios is ONE tab stop and
 * the arrows move within it, which is what doc 09 §8 fixes across the library.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Radio, RadioGroup } from './RadioGroup';

const options = (
  <>
    <Radio value="standard">Standard</Radio>
    <Radio value="express">Express</Radio>
    <Radio value="pickup">Pickup</Radio>
  </>
);

const describedText = (el: HTMLElement) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map(id => document.getElementById(id)?.textContent)
    .join(' | ');

test('it works on its own, with no form around it', () => {
  render(<RadioGroup label="Delivery">{options}</RadioGroup>);
  expect(screen.getByRole('radiogroup', { name: 'Delivery' })).toBeTruthy();
  expect(screen.getAllByRole('radio')).toHaveLength(3);
});

test('the group has a label and each option has its own', () => {
  render(<RadioGroup label="Delivery">{options}</RadioGroup>);
  // Two levels of label is what this component adds to the field model.
  expect(screen.getByRole('radiogroup', { name: 'Delivery' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Express' })).toBeTruthy();
});

test('a hidden group label still names the group', () => {
  render(
    <RadioGroup label="Delivery" isLabelHidden>
      {options}
    </RadioGroup>
  );
  expect(screen.getByRole('radiogroup', { name: 'Delivery' })).toBeTruthy();
});

test('the description reaches the group and every option', () => {
  render(
    <RadioGroup label="Delivery" description="Express costs more.">
      {options}
    </RadioGroup>
  );

  expect(describedText(screen.getByRole('radiogroup'))).toContain(
    'Express costs more.'
  );
  // The base references it from each radio too, which is why nothing is
  // supplied by hand here — unlike a lone checkbox.
  for (const radio of screen.getAllByRole('radio')) {
    expect(describedText(radio)).toContain('Express costs more.');
  }
});

test('the error reaches the group, and only while invalid', () => {
  const { rerender } = render(
    <RadioGroup label="Delivery" errorMessage="Choose a delivery method.">
      {options}
    </RadioGroup>
  );
  expect(screen.queryByText('Choose a delivery method.')).toBeNull();

  rerender(
    <RadioGroup
      label="Delivery"
      isInvalid
      errorMessage="Choose a delivery method."
    >
      {options}
    </RadioGroup>
  );

  const group = screen.getByRole('radiogroup');
  expect(group.getAttribute('aria-invalid')).toBe('true');
  expect(describedText(group)).toContain('Choose a delivery method.');
});

test('the description survives an error rather than being replaced', () => {
  render(
    <RadioGroup
      label="Delivery"
      isInvalid
      description="Express costs more."
      errorMessage="Choose a delivery method."
    >
      {options}
    </RadioGroup>
  );
  const described = describedText(screen.getByRole('radiogroup'));
  expect(described).toContain('Express costs more.');
  expect(described).toContain('Choose a delivery method.');
});

test('required is announced on the group, not on each option', () => {
  render(
    <RadioGroup label="Delivery" isRequired>
      {options}
    </RadioGroup>
  );
  expect(screen.getByRole('radiogroup').getAttribute('aria-required')).toBe(
    'true'
  );
});

test('the whole group is one tab stop', async () => {
  const user = userEvent.setup();
  render(
    <>
      <RadioGroup label="Delivery">{options}</RadioGroup>
      <button type="button">After</button>
    </>
  );

  await user.tab();
  expect(screen.getAllByRole('radio')[0]).toHaveProperty('tabIndex', 0);

  // One more Tab leaves the group entirely rather than moving to option two.
  await user.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'After' })
  );
});

test('arrows move within the group and select as they go', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <RadioGroup label="Delivery" onChange={onChange}>
      {options}
    </RadioGroup>
  );

  await user.tab();
  await user.keyboard('{ArrowDown}');
  // Doc 09 §8: arrows move inside a control that has several options.
  expect(onChange).toHaveBeenLastCalledWith('express');

  await user.keyboard('{ArrowDown}');
  expect(onChange).toHaveBeenLastCalledWith('pickup');
});

test('selection is exclusive', async () => {
  const user = userEvent.setup();
  render(<RadioGroup label="Delivery">{options}</RadioGroup>);

  await user.click(screen.getByRole('radio', { name: 'Express' }));
  expect(screen.getByRole('radio', { name: 'Express' })).toHaveProperty(
    'checked',
    true
  );

  await user.click(screen.getByRole('radio', { name: 'Pickup' }));
  expect(screen.getByRole('radio', { name: 'Express' })).toHaveProperty(
    'checked',
    false
  );
  expect(screen.getByRole('radio', { name: 'Pickup' })).toHaveProperty(
    'checked',
    true
  );
});

test('a disabled group does not respond', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <RadioGroup label="Delivery" isDisabled onChange={onChange}>
      {options}
    </RadioGroup>
  );

  await user.click(screen.getByRole('radio', { name: 'Express' }));
  expect(onChange).not.toHaveBeenCalled();
});

test('one option can be disabled while the rest work', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <RadioGroup label="Delivery" onChange={onChange}>
      <Radio value="standard">Standard</Radio>
      <Radio value="express" isDisabled>
        Express
      </Radio>
    </RadioGroup>
  );

  await user.click(screen.getByRole('radio', { name: 'Express' }));
  expect(onChange).not.toHaveBeenCalled();

  await user.click(screen.getByRole('radio', { name: 'Standard' }));
  expect(onChange).toHaveBeenCalledWith('standard');
});

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <RadioGroup label="Delivery" value="standard" onChange={onChange}>
      {options}
    </RadioGroup>
  );
  await user.click(screen.getByRole('radio', { name: 'Express' }));
  expect(onChange).toHaveBeenCalledWith('express');
  expect(screen.getByRole('radio', { name: 'Standard' })).toHaveProperty(
    'checked',
    true
  );
  unmount();

  render(
    <RadioGroup label="Delivery" defaultValue="pickup">
      {options}
    </RadioGroup>
  );
  expect(screen.getByRole('radio', { name: 'Pickup' })).toHaveProperty(
    'checked',
    true
  );
});
