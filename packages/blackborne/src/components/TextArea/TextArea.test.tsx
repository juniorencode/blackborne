/*
 * Most of what a text area guarantees is inherited from the single-line field
 * and tested there. What is worth asserting here is the difference: it is a
 * BLOCK, sized by rows rather than by the control-height tokens.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { TextArea } from './TextArea';

const control = () => screen.getByRole('textbox') as HTMLTextAreaElement;

test('it works on its own, with no form around it', () => {
  render(<TextArea label="Notes" />);
  expect(screen.getByRole('textbox', { name: 'Notes' })).toBeTruthy();
});

test('it renders a textarea, not an input', () => {
  render(<TextArea label="Notes" />);
  // The whole reason this component exists rather than a prop on TextField:
  // a different element, with different sizing and multi-line behaviour.
  expect(control().tagName).toBe('TEXTAREA');
});

test('rows set the starting height and default to three', () => {
  const { unmount } = render(<TextArea label="Notes" />);
  expect(control().rows).toBe(3);
  unmount();

  render(<TextArea label="Notes" rows={8} />);
  expect(control().rows).toBe(8);
});

test('newlines are kept, which is the point of a text area', async () => {
  const user = userEvent.setup();
  render(<TextArea label="Notes" />);

  await user.click(control());
  await user.keyboard('first{Enter}second');

  // Enter inserts a newline here rather than submitting. Doc 09 §8 fixes Enter
  // as "confirm the primary action of the current context", and inside a
  // multi-line field the current context is the line.
  expect(control().value).toBe('first\nsecond');
});

test('the label is associated with the control', () => {
  render(<TextArea label="Notes" />);
  expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
});

test('the description and error are referenced by the control', () => {
  render(
    <TextArea
      label="Notes"
      isInvalid
      description="Visible to your team."
      errorMessage="Say something about the change."
    />
  );

  const described = (control().getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map(id => document.getElementById(id)?.textContent)
    .join(' | ');

  expect(described).toContain('Visible to your team.');
  expect(described).toContain('Say something about the change.');
});

test('no error appears while typing into an untouched field', async () => {
  const user = userEvent.setup();
  render(<TextArea label="Notes" isRequired errorMessage="Required." />);

  await user.click(control());
  await user.keyboard('a');

  expect(screen.queryByText('Required.')).toBeNull();
});

test('disabled and read-only behave differently', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <TextArea label="A" isDisabled value="x" onChange={onChange} />
  );
  expect(control().disabled).toBe(true);
  unmount();

  render(<TextArea label="B" isReadOnly value="x" onChange={onChange} />);
  expect(control().disabled).toBe(false);
  expect(control().readOnly).toBe(true);

  await user.type(control(), 'more');
  expect(onChange).not.toHaveBeenCalled();
});

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <TextArea label="A" value="fixed" onChange={onChange} />
  );
  await user.type(control(), 'x');
  expect(onChange).toHaveBeenCalled();
  expect(control().value).toBe('fixed');
  unmount();

  render(<TextArea label="B" defaultValue="start" />);
  await user.type(control(), '!');
  expect(control().value).toBe('start!');
});

test('a busy field announces itself', () => {
  const { rerender } = render(<TextArea label="Notes" isSaving />);
  expect(screen.getByText('Saving')).toBeTruthy();

  rerender(<TextArea label="Notes" />);
  expect(screen.queryByText('Saving')).toBeNull();
});

test('it is reachable by keyboard, and the ref reaches the textarea', async () => {
  const ref = createRef<HTMLTextAreaElement>();
  const user = userEvent.setup();
  render(<TextArea label="Notes" ref={ref} />);

  await user.tab();
  expect(document.activeElement).toBe(control());
  expect(ref.current).toBe(control());
});
