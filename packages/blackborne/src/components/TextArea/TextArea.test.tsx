/*
 * Most of what a text area guarantees is inherited from the single-line field
 * and tested there. What is worth asserting here is the difference: it is a
 * BLOCK, sized by rows rather than by the control-height tokens.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { normalize, upperCase } from '../../normalize';
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

test('it normalizes what is typed, through the same hook a text field uses', async () => {
  /*
   * One test rather than the full set: the mechanism is shared and is covered
   * where it lives. What this asserts is that it is actually wired here, which
   * is the part that can silently not be.
   */
  const user = userEvent.setup();
  render(<TextArea label="Codes" normalize={normalize(upperCase)} />);

  const control = screen.getByRole<HTMLTextAreaElement>('textbox');
  await user.type(control, 'ab-12');

  expect(control.value).toBe('AB-12');
});

/*
 * ---------------------------------------------------------------------------
 * Height that follows the content (`isGrowable`).
 *
 * BE CLEAR ABOUT WHAT THIS ENVIRONMENT CAN SAY: nothing about height. jsdom
 * has no layout engine, so `scrollHeight`, `offsetHeight` and `clientHeight`
 * are all zero, every element is zero tall, and a box that grew and a box that
 * did not are indistinguishable. There is no assertion to write here that
 * would fail if growing stopped working — a green run below means the wiring
 * is right, never that the feature works.
 *
 * The feature itself is checked in a browser, against the `Growing` story,
 * where "type into it and watch it get taller" is one measurement and is worth
 * more than everything in this file.
 *
 * What IS worth asserting here is the part that has nothing to do with layout:
 * that the prop is off by default and changes nothing for a field that did not
 * ask for it, that growing does not disturb the value, and that the two ways
 * of wiring it wrong say so.
 */

test('growing is off by default, and writes no height when it is off', () => {
  render(
    <TextArea label="Notes" defaultValue={'one\ntwo\nthree\nfour\nfive'} />
  );

  /*
   * The component has shipped, so the bar is that a field not using the prop
   * is byte-for-byte what it was: the row count it was given, and no inline
   * height from anybody.
   *
   * Where the real assertion would go: that this box is exactly three rows
   * tall with five rows of content in it, scrolled. It needs a layout engine.
   */
  expect(control().rows).toBe(3);
  expect(control().getAttribute('style')).toBeNull();
});

test('an untracked field still holds its own value when growing is off', async () => {
  /*
   * The regression this exists to catch is invisible: growing turns the shared
   * value tracking on, and tracking makes the field internally controlled. If
   * that ever leaked to fields that did not ask for it, an uncontrolled text
   * area would stop accepting what is typed into it, everywhere in the
   * library, and no test about height would notice.
   */
  const user = userEvent.setup();
  render(<TextArea label="Notes" />);

  await user.type(control(), 'typed');
  expect(control().value).toBe('typed');
});

test('growing does not disturb the value, uncontrolled or controlled', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <TextArea label="A" isGrowable defaultValue="start" />
  );
  await user.type(control(), '!');
  expect(control().value).toBe('start!');
  unmount();

  render(<TextArea label="B" isGrowable value="fixed" onChange={onChange} />);
  await user.type(control(), 'x');
  expect(onChange).toHaveBeenCalledWith('fixedx');
  // Still the consumer's value on screen: tracking mirrors, it does not take
  // over.
  expect(control().value).toBe('fixed');
});

test('the height answers a value replaced from outside, not a keystroke', async () => {
  /*
   * The mechanism is keyed on the value in a layout effect, which is what
   * makes a reset, a paste and a controlled value replaced from outside the
   * same event as typing. Nothing here can see the height change — what it
   * asserts is that the replacement arrives at the control at all, which is
   * the input the effect runs on.
   */
  const { rerender } = render(
    <TextArea label="Notes" isGrowable value="one" />
  );
  expect(control().value).toBe('one');

  rerender(
    <TextArea label="Notes" isGrowable value={'one\ntwo\nthree\nfour'} />
  );
  expect(control().value).toBe('one\ntwo\nthree\nfour');

  // And the reset, which is the case a keystroke handler would miss entirely.
  rerender(<TextArea label="Notes" isGrowable value="" />);
  expect(control().value).toBe('');
});

test('nothing is measured or written when there is no layout', () => {
  /*
   * The one question this environment is the right instrument for. A field in
   * a collapsed panel or a hidden tab has an offset height of zero, and this
   * is exactly that: measuring it would write a zero height and the field
   * would come back invisible.
   *
   * The guard leaves the browser's own sizing alone, which is also why the row
   * count is still what React wrote — the limit is measured by borrowing the
   * `rows` attribute and putting it back, and a run that bailed never borrowed
   * it.
   */
  render(
    <TextArea
      label="Notes"
      isGrowable
      maxRows={9}
      defaultValue={'a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk'}
    />
  );

  expect(control().rows).toBe(3);
  expect(control().getAttribute('style')).toBeNull();
});

test('maxRows without isGrowable warns rather than doing nothing quietly', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<TextArea label="Notes" maxRows={8} />);

  // Filtered by prefix rather than counted: the spy also catches whatever
  // React and the base have to say.
  const ours = warn.mock.calls.filter(([first]) =>
    String(first).startsWith('blackborne:')
  );
  expect(ours).toHaveLength(1);
  warn.mockRestore();
});

test('a ceiling below the floor warns, and the floor wins', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<TextArea label="Notes" isGrowable rows={6} maxRows={2} />);

  const ours = warn.mock.calls.filter(([first]) =>
    String(first).startsWith('blackborne:')
  );
  expect(ours).toHaveLength(1);

  /*
   * The floor is still six rows, and it is the row count that says so —
   * `rows` is a height the field has whether or not it grows, so a smaller
   * ceiling is a contradiction rather than a limit.
   *
   * Where the real assertion would go: that the box never renders shorter than
   * six rows. It needs a layout engine.
   */
  expect(control().rows).toBe(6);
  warn.mockRestore();
});
