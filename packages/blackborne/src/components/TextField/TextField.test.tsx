/*
 * Doc 07 §10's checklist, as tests. The ones that matter most are about
 * RELATIONSHIPS: a label that is not associated, or an error that is only
 * painted, does not exist for someone who cannot see the layout.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { normalize, stripSpaces, upperCase } from '../../normalize';
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

/*
 * Normalization. What jsdom CAN answer is which value comes out; where the
 * caret ends up needs a browser and lives in the catalog's checks, because
 * jsdom implements no selection (doc 07 §2.1).
 */
const code = normalize(stripSpaces, upperCase);

test('a normalized field reports the rewritten value, not what was typed', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TextField label="Plate" normalize={code} onChange={onChange} />);

  await user.type(screen.getByRole('textbox'), 'ab 12');

  expect(onChange).toHaveBeenLastCalledWith('AB12');
});

test('a rewrite that produces no change leaves the next keystroke alone', async () => {
  /*
   * The regression that named itself. Typing a space into `AB` normalizes back
   * to `AB` — the state React already holds — so React declines to re-render,
   * the caret correction never runs, and the position recorded for the SPACE
   * survives into the next keystroke and is applied there.
   *
   * Measured with that hole open, typing "ab 12" produced "AB21".
   */
  const user = userEvent.setup();
  render(<TextField label="Plate" normalize={code} />);

  const input = screen.getByRole<HTMLInputElement>('textbox');
  await user.type(input, 'ab  12');

  expect(input.value).toBe('AB12');
});

test('an uncontrolled field SHOWS the rewritten value', async () => {
  /*
   * The case that silently does nothing if normalization is only passed up
   * through onChange: with no value prop the base keeps its own state, so the
   * input would go on displaying what was typed while onChange reported
   * something else. Two different answers to "what is in this field".
   */
  const user = userEvent.setup();
  render(<TextField label="Plate" normalize={code} />);

  const input = screen.getByRole<HTMLInputElement>('textbox');
  await user.type(input, 'ab 12');

  expect(input.value).toBe('AB12');
});

test('a controlled field still lets its owner decide the value', async () => {
  const user = userEvent.setup();
  const seen: string[] = [];
  render(
    <TextField
      label="Plate"
      normalize={code}
      value="XY"
      onChange={value => seen.push(value)}
    />
  );

  const input = screen.getByRole<HTMLInputElement>('textbox');
  await user.type(input, 'z');

  // The prop still wins: the field reports what it would become and paints
  // what it was given, which is what controlled means (doc 02 §8).
  expect(seen).toEqual(['XYZ']);
  expect(input.value).toBe('XY');
});

test('without normalize, a field behaves exactly as it did before', async () => {
  /*
   * A new prop may not change what happens to anyone not using it, and this
   * field has shipped. The hook returns nothing at all in that case; this is
   * what says so.
   */
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TextField label="Plate" onChange={onChange} />);

  const input = screen.getByRole<HTMLInputElement>('textbox');
  await user.type(input, 'ab 12');

  expect(input.value).toBe('ab 12');
  expect(onChange).toHaveBeenLastCalledWith('ab 12');
});

test('an affix is drawn but not announced', () => {
  /*
   * Doc 02 §11.3: a slot the library owns is hidden by the library, and the
   * condition that makes it safe is that the label is always there. The rule
   * this implies is the one worth protecting — a unit somebody NEEDS in order
   * to answer belongs in the label, not only in the affix.
   */
  render(<TextField label="Weight" prefix="~" suffix="kg" defaultValue="72" />);

  // The accessible name is the label alone; neither affix joins it.
  expect(screen.getByRole('textbox').getAttribute('aria-label')).toBeNull();
  expect(screen.getByRole('textbox', { name: 'Weight' })).toBeTruthy();

  const affixes = document.querySelectorAll('[aria-hidden="true"]');
  const texts = [...affixes].map(node => node.textContent);
  expect(texts).toContain('~');
  expect(texts).toContain('kg');
});

test('the affix slots are empty when nothing is passed', () => {
  // A field that never asked for an affix renders no extra element for one,
  // so nothing changes for anyone not using the prop.
  const { container } = render(<TextField label="Name" />);
  expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
});

test('the counter counts, and is not announced while it does', async () => {
  const user = userEvent.setup();
  render(<TextField label="Note" maxLength={10} isCounterVisible />);

  const counter = () =>
    document.querySelector('[aria-hidden="true"]')?.textContent;

  expect(counter()).toBe('0/10');
  await user.type(screen.getByRole('textbox'), 'abc');
  expect(counter()).toBe('3/10');

  /*
   * Silent while counting. A live region here would read a new number on every
   * keystroke, and the number is derived from a value the reader already has.
   */
  expect(screen.queryByText('Character limit reached')).toBeNull();
});

test('reaching the limit is announced once', async () => {
  const user = userEvent.setup();
  render(<TextField label="Code" maxLength={3} isCounterVisible />);

  await user.type(screen.getByRole('textbox'), 'ab');
  expect(screen.queryByText('Character limit reached')).toBeNull();

  /*
   * At the limit the next keystroke is dropped and nothing else reports it, so
   * without this the field simply stops responding for anyone who cannot see
   * the counter (doc 06 §3).
   */
  await user.type(screen.getByRole('textbox'), 'c');
  const announcement = screen.getByText('Character limit reached');
  // In a live region, not merely painted — Field has one of its own for the
  // busy state, so this asserts the text and its container together.
  expect(announcement.getAttribute('aria-live')).toBe('polite');
});

test('the counter formats its numbers in the active language', () => {
  render(
    <ConfigProvider
      locale="de-DE"
      dictionary={{ characterLimitReached: 'Grenze erreicht' }}
    >
      <TextField
        label="Notiz"
        maxLength={2000}
        isCounterVisible
        defaultValue="x"
      />
    </ConfigProvider>
  );
  // 2.000 in German, not 2,000 — the one place a field writes a number of its
  // own, so it goes through the locale like every other number (doc 05 §3).
  expect(document.querySelector('[aria-hidden="true"]')?.textContent).toBe(
    '1/2.000'
  );
});

test('a counter without a maximum warns instead of drawing a slash', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<TextField label="Note" isCounterVisible />);

  /*
   * Ours, and once — from an effect. In the render body it fires again on
   * every render, so a field would warn per keystroke and bury the message.
   *
   * Filtered by prefix rather than counted, because the spy also catches
   * whatever React and the base have to say, and asserting a total makes this
   * test fail for reasons that have nothing to do with it.
   */
  const ours = warn.mock.calls.filter(([first]) =>
    String(first).startsWith('blackborne:')
  );
  expect(ours).toHaveLength(1);
  expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
  warn.mockRestore();
});
