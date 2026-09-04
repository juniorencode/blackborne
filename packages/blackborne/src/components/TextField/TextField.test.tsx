/*
 * Doc 07 §10's checklist, as tests. The ones that matter most are about
 * RELATIONSHIPS: a label that is not associated, or an error that is only
 * painted, does not exist for someone who cannot see the layout.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { TextField } from './TextField';

test('it works on its own, with no form and no library around it', () => {
  render(<TextField label="Full name" />);
  expect(screen.getByRole('textbox', { name: 'Full name' })).toBeTruthy();
});

test('the label is associated with the control', () => {
  render(<TextField label="Full name" />);
  const input = screen.getByLabelText('Full name');
  expect(input.tagName).toBe('INPUT');
});

test('a visually hidden label still names the control', () => {
  render(<TextField label="Search" isLabelHidden />);
  // Hidden visually, present for assistive technology. A control without a
  // name has no name for anyone who cannot see the layout (doc 07 §4).
  expect(screen.getByRole('textbox', { name: 'Search' })).toBeTruthy();
});

test('the description is referenced by the control', () => {
  render(<TextField label="Email" description="We never share it." />);

  const input = screen.getByRole('textbox');
  const describedBy = input.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();

  const described = describedBy
    ?.split(' ')
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');
  expect(described).toContain('We never share it.');
});

test('the error is associated with the control and announced', () => {
  render(
    <TextField
      label="Email"
      isInvalid
      errorMessage="Enter an address we can reach."
    />
  );

  const input = screen.getByRole('textbox');
  expect(input.getAttribute('aria-invalid')).toBe('true');

  const describedBy = input.getAttribute('aria-describedby');
  const described = describedBy
    ?.split(' ')
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');
  // Painted is not enough. A red message that exists only visually does not
  // exist for someone who cannot see it (doc 06 §3).
  expect(described).toContain('Enter an address we can reach.');
});

test('the description survives an error rather than being replaced', () => {
  render(
    <TextField
      label="Email"
      description="We never share it."
      isInvalid
      errorMessage="Enter an address we can reach."
    />
  );
  // Doc 07 §4: help text is persistent; the error accompanies it.
  expect(screen.getByText('We never share it.')).toBeTruthy();
  expect(screen.getByText('Enter an address we can reach.')).toBeTruthy();
});

test('no error appears while typing into an untouched field', async () => {
  const user = userEvent.setup();
  render(<TextField label="Email" isRequired errorMessage="Required." />);

  await user.click(screen.getByRole('textbox'));
  await user.keyboard('a');

  // The library never blames someone for not having finished typing. When an
  // error is shown is the project's decision, expressed through isInvalid
  // (doc 07 §5).
  expect(screen.queryByText('Required.')).toBeNull();
});

test('required is announced through the attribute, not just an asterisk', () => {
  render(<TextField label="Full name" isRequired />);
  const input = screen.getByRole('textbox');
  expect(input.getAttribute('aria-required')).toBe('true');
});

test('disabled and read-only behave differently', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <TextField label="A" isDisabled value="x" onChange={onChange} />
  );
  expect(screen.getByRole('textbox').hasAttribute('disabled')).toBe(true);
  unmount();

  render(<TextField label="B" isReadOnly value="x" onChange={onChange} />);
  const readOnly = screen.getByRole('textbox');
  // Read-only shows a value you can read, select and copy; disabled says this
  // does not apply right now (doc 07 §6).
  expect(readOnly.hasAttribute('disabled')).toBe(false);
  expect(readOnly.getAttribute('readonly')).not.toBeNull();

  await user.type(readOnly, 'more');
  expect(onChange).not.toHaveBeenCalled();
});

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <TextField label="A" value="fixed" onChange={onChange} />
  );
  await user.type(screen.getByRole('textbox'), 'x');
  expect(onChange).toHaveBeenCalled();
  expect(screen.getByRole('textbox')).toHaveProperty('value', 'fixed');
  unmount();

  render(<TextField label="B" defaultValue="start" />);
  await user.type(screen.getByRole('textbox'), '!');
  expect(screen.getByRole('textbox')).toHaveProperty('value', 'start!');
});

test('a busy field announces itself instead of only drawing a spinner', () => {
  const { rerender } = render(<TextField label="City" isLoading />);
  expect(screen.getByText('Loading')).toBeTruthy();

  rerender(<TextField label="City" isSaving />);
  expect(screen.getByText('Saving')).toBeTruthy();

  rerender(<TextField label="City" />);
  expect(screen.queryByText('Saving')).toBeNull();
});

test('it is reachable by keyboard, and the ref reaches the input', async () => {
  const ref = createRef<HTMLInputElement>();
  const user = userEvent.setup();
  render(<TextField label="Full name" ref={ref} />);

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('textbox'));
  expect(ref.current).toBe(screen.getByRole('textbox'));
});
