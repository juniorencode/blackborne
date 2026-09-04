/*
 * The relationships matter more than anything visual here, because this is the
 * component where the base does NOT wire them: `CheckboxField` renders a
 * description and an error without referencing either from the input. These
 * tests are what stop that gap from reopening silently.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Checkbox } from './Checkbox';

const describedText = (input: HTMLElement) =>
  (input.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map(id => document.getElementById(id)?.textContent)
    .join(' | ');

test('it works on its own, with no form around it', () => {
  render(<Checkbox>I agree to the terms</Checkbox>);
  expect(
    screen.getByRole('checkbox', { name: 'I agree to the terms' })
  ).toBeTruthy();
});

test('the label names the control, because the label IS the control', () => {
  render(<Checkbox>I agree</Checkbox>);
  // The base's Checkbox renders a <label> wrapping a hidden input, so clicking
  // the text toggles it. That is the behaviour, not an implementation detail.
  expect(screen.getByLabelText('I agree').tagName).toBe('INPUT');
});

test('the description is referenced by the input', () => {
  render(
    <Checkbox description="You can withdraw consent later.">I agree</Checkbox>
  );
  const input = screen.getByRole('checkbox');
  expect(describedText(input)).toContain('You can withdraw consent later.');
});

test('the error is referenced by the input, and only while invalid', () => {
  const { rerender } = render(
    <Checkbox errorMessage="You must accept to continue.">I agree</Checkbox>
  );

  // Not invalid yet: the message exists as a prop and must not be shown or
  // referenced. The library never blames someone before there is a reason.
  expect(screen.queryByText('You must accept to continue.')).toBeNull();
  expect(describedText(screen.getByRole('checkbox'))).toBe('');

  rerender(
    <Checkbox isInvalid errorMessage="You must accept to continue.">
      I agree
    </Checkbox>
  );

  const input = screen.getByRole('checkbox');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(describedText(input)).toContain('You must accept to continue.');
});

test('the description survives an error rather than being replaced', () => {
  render(
    <Checkbox
      isInvalid
      description="You can withdraw consent later."
      errorMessage="You must accept to continue."
    >
      I agree
    </Checkbox>
  );

  const described = describedText(screen.getByRole('checkbox'));
  expect(described).toContain('You can withdraw consent later.');
  expect(described).toContain('You must accept to continue.');
});

test('aria-describedby is omitted when there is nothing to point at', () => {
  render(<Checkbox>I agree</Checkbox>);
  // Pointing at nothing is worse than not pointing: a screen reader announces
  // an empty description.
  expect(screen.getByRole('checkbox').hasAttribute('aria-describedby')).toBe(
    false
  );
});

test('it toggles by click and by Space', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<Checkbox onChange={onChange}>I agree</Checkbox>);

  const input = screen.getByRole('checkbox');
  await user.click(input);
  expect(onChange).toHaveBeenLastCalledWith(true);

  input.focus();
  await user.keyboard(' ');
  // Doc 09 §8 fixes what the keys mean across the library: Space toggles.
  expect(onChange).toHaveBeenLastCalledWith(false);
});

test('it is reachable by keyboard', async () => {
  const user = userEvent.setup();
  render(<Checkbox>I agree</Checkbox>);
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('checkbox'));
});

test('disabled does not toggle', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <Checkbox isDisabled onChange={onChange}>
      I agree
    </Checkbox>
  );

  await user.click(screen.getByRole('checkbox'));
  expect(onChange).not.toHaveBeenCalled();
});

test('indeterminate is announced as mixed, not as unchecked', () => {
  render(<Checkbox isIndeterminate>Some selected</Checkbox>);
  const input = screen.getByRole('checkbox');
  // A third state announced as "unchecked" is a lie about what is selected.
  expect(
    input.getAttribute('aria-checked') ??
      String((input as HTMLInputElement).indeterminate)
  ).toBeTruthy();
  expect((input as HTMLInputElement).indeterminate).toBe(true);
});

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <Checkbox isSelected={false} onChange={onChange}>
      Fixed
    </Checkbox>
  );
  await user.click(screen.getByRole('checkbox'));
  expect(onChange).toHaveBeenCalledWith(true);
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(
    false
  );
  unmount();

  render(<Checkbox defaultSelected>Starts on</Checkbox>);
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
});

test('the ref reaches the label element', () => {
  const ref = createRef<HTMLLabelElement>();
  render(<Checkbox ref={ref}>I agree</Checkbox>);
  expect(ref.current?.tagName).toBe('LABEL');
  expect(ref.current?.contains(screen.getByRole('checkbox'))).toBe(true);
});
