/*
 * This is the first component whose interesting behaviour is locale, not
 * layout. What is asserted: that the number READS correctly in the active
 * locale, that typing is PARSED in it, and that the internal buttons carry a
 * name from the dictionary.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { NumberField } from './NumberField';

/*
 * The steppers are found by SLOT rather than by accessible name.
 *
 * Their name is composed by the base from the button plus the field label, so
 * it reads 'Decrease − Quantity' — useful for a person and awkward to match,
 * because the minus is a Unicode MINUS SIGN rather than a hyphen. The slot is
 * what identifies each button without depending on a glyph.
 */
const stepper = (direction: 'increment' | 'decrement') =>
  document.querySelector(`button[slot='${direction}']`) as HTMLButtonElement;

const value = () => (screen.getByRole('textbox') as HTMLInputElement).value;

test('it works on its own, with no provider around it', () => {
  render(<NumberField label="Quantity" defaultValue={12} />);
  expect(screen.getByRole('textbox', { name: 'Quantity' })).toBeTruthy();
  expect(value()).toBe('12');
});

test('the label is associated with the control', () => {
  render(<NumberField label="Quantity" />);
  // Not getByLabelText: the base points the stepper buttons at this label too,
  // so three elements legitimately carry it. The role is what distinguishes
  // the field from its buttons.
  expect(screen.getByRole('textbox', { name: 'Quantity' }).tagName).toBe(
    'INPUT'
  );
});

test('the separators follow the locale', () => {
  const { unmount } = render(
    <NumberField label="Amount" defaultValue={1234.5} />
  );
  // en-US by default: comma for thousands, point for decimals.
  expect(value()).toBe('1,234.5');
  unmount();

  render(
    <ConfigProvider locale="de-DE">
      <NumberField label="Betrag" defaultValue={1234.5} />
    </ConfigProvider>
  );
  // German inverts both, which is the whole reason the library never guesses.
  expect(value()).toBe('1.234,5');
});

test('"Spanish" is not a number format', () => {
  /*
   * Worth asserting because it is a real trap, and it caught me while
   * building: es-PE formats like en-US, while es-ES inverts the separators. A
   * library that mapped "Spanish" to one format would be wrong for the other,
   * which is why it takes the locale it is given and formats nothing itself.
   */
  const { unmount } = render(
    <ConfigProvider locale="es-PE">
      <NumberField label="Monto" defaultValue={1234.5} />
    </ConfigProvider>
  );
  expect(value()).toBe('1,234.5');
  unmount();

  render(
    <ConfigProvider locale="es-ES">
      <NumberField label="Importe" defaultValue={1234.5} />
    </ConfigProvider>
  );
  expect(value()).toBe('1234,5');
});

test('typing is parsed in the active locale', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <ConfigProvider locale="de-DE">
      <NumberField label="Betrag" onChange={onChange} />
    </ConfigProvider>
  );

  await user.click(screen.getByRole('textbox'));
  // A comma is the DECIMAL separator in German, so this is twelve and a half.
  await user.keyboard('12,5');
  await user.tab();

  expect(onChange).toHaveBeenLastCalledWith(12.5);
});

test('currency comes from the provider, and the prop wins over it', () => {
  const { unmount } = render(
    <ConfigProvider locale="es-PE" currency="PEN">
      <NumberField label="Monto" defaultValue={1234.5} />
    </ConfigProvider>
  );
  expect(value()).toContain('S/');
  unmount();

  render(
    <ConfigProvider locale="es-PE" currency="PEN">
      <NumberField label="Monto" defaultValue={1234.5} currency="USD" />
    </ConfigProvider>
  );
  // The CODE rather than a symbol: in es-PE the dollar sign is ambiguous, so
  // Intl prints "USD". Asserting that is asserting the platform choice
  // rather than the one this author assumed.
  expect(value()).toContain('USD');
});

test('no currency is invented when nobody supplies one', () => {
  render(<NumberField label="Quantity" defaultValue={1234.5} />);
  // A component cannot know what a business trades in (doc 05 §3.1).
  expect(value()).toBe('1,234.5');
});

test('the stepper buttons carry names from the dictionary', () => {
  render(<NumberField label="Quantity" defaultValue={1} isStepperVisible />);
  // The word itself is what comes from the dictionary; the base wraps it with
  // the field label to produce the announced name.
  // An icon-only button always needs an accessible name (doc 06 §3), and the
  // consumer cannot supply one for a component's internal control.
  expect(stepper('increment').textContent).toContain('Increase');
  expect(stepper('decrement').textContent).toContain('Decrease');
});

test('those names follow the active language', () => {
  render(
    <ConfigProvider
      locale="es-PE"
      dictionary={{ increment: 'Aumentar', decrement: 'Disminuir' }}
    >
      <NumberField label="Cantidad" defaultValue={1} isStepperVisible />
    </ConfigProvider>
  );
  expect(stepper('increment').textContent).toContain('Aumentar');
  expect(stepper('decrement').textContent).toContain('Disminuir');
});

test('the steppers step, and respect min and max', async () => {
  const user = userEvent.setup();
  render(
    <NumberField
      label="Quantity"
      defaultValue={1}
      minValue={0}
      maxValue={2}
      isStepperVisible
    />
  );

  await user.click(stepper('increment'));
  expect(value()).toBe('2');

  // Clamped rather than allowed and then rejected: the library RESTRICTS input
  // (doc 07 §2), which is a different thing from validating it.
  await user.click(stepper('increment'));
  expect(value()).toBe('2');

  const decrease = stepper('decrement');
  await user.click(decrease);
  await user.click(decrease);
  await user.click(decrease);
  expect(value()).toBe('0');
});

test('letters cannot be typed', async () => {
  const user = userEvent.setup();
  render(<NumberField label="Quantity" />);

  await user.click(screen.getByRole('textbox'));
  await user.keyboard('abc');
  await user.tab();

  expect(value()).toBe('');
});

test('arrow keys step the value', async () => {
  const user = userEvent.setup();
  render(<NumberField label="Quantity" defaultValue={5} />);

  screen.getByRole('textbox').focus();
  await user.keyboard('{ArrowUp}');
  expect(value()).toBe('6');

  await user.keyboard('{ArrowDown}{ArrowDown}');
  expect(value()).toBe('4');
});

test('a field with no stepper still steps from the keyboard', async () => {
  const user = userEvent.setup();
  render(<NumberField label="Quantity" defaultValue={5} />);

  expect(screen.queryByRole('button')).toBeNull();

  // The capability lives in the base, not in the buttons, so removing them
  // removes a pointer affordance and nothing else.
  screen.getByRole('textbox').focus();
  await user.keyboard('{ArrowUp}');
  expect(value()).toBe('6');
});

test('the error is associated with the control', () => {
  render(
    <NumberField
      label="Quantity"
      isInvalid
      errorMessage="Order at least one unit."
      defaultValue={0}
    />
  );

  const input = screen.getByRole('textbox');
  expect(input.getAttribute('aria-invalid')).toBe('true');

  const described = (input.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');
  expect(described).toContain('Order at least one unit.');
});

test('disabled and read-only behave differently', () => {
  const { unmount } = render(
    <NumberField label="A" isDisabled defaultValue={3} />
  );
  expect(screen.getByRole('textbox').hasAttribute('disabled')).toBe(true);
  unmount();

  render(<NumberField label="B" isReadOnly defaultValue={3} />);
  const readOnly = screen.getByRole('textbox');
  expect(readOnly.hasAttribute('disabled')).toBe(false);
  expect(readOnly.getAttribute('readonly')).not.toBeNull();
});

test('the stepper is opt-in, and off by default', () => {
  /*
   * Decision 0011, as the check that catches it going back. The default is
   * the thing being asserted here: a numeric field that grew buttons again
   * would take 40px from the trailing edge of every one of them.
   */
  const { rerender } = render(<NumberField label="Quantity" />);
  expect(screen.queryAllByRole('button')).toHaveLength(0);

  rerender(<NumberField label="Quantity" isStepperVisible />);
  expect(screen.queryAllByRole('button')).toHaveLength(2);
});

test('a busy field has no stepper, whatever it was asked for', () => {
  /*
   * Doc 07 §2.2 rule 1: busy wins the trailing edge outright. Before this the
   * spinner was drawn on top of the `+` button — two things in one place, and
   * the one you could press did nothing useful.
   */
  const { rerender } = render(
    <NumberField label="Quantity" isStepperVisible isLoading />
  );
  expect(screen.queryAllByRole('button')).toHaveLength(0);

  rerender(<NumberField label="Quantity" isStepperVisible isSaving />);
  expect(screen.queryAllByRole('button')).toHaveLength(0);

  rerender(<NumberField label="Quantity" isStepperVisible />);
  expect(screen.queryAllByRole('button')).toHaveLength(2);
});

test('the cross empties the field to NaN, not to zero', async () => {
  const seen: number[] = [];
  const user = userEvent.setup();
  render(
    <NumberField
      label="Quantity"
      isClearable
      defaultValue={12}
      onChange={next => seen.push(next)}
    />
  );

  await user.click(screen.getByRole('button', { name: 'Clear' }));

  /*
   * NaN and not 0. Zero is a number somebody chose; empty is the absence of
   * one, and the base reports NaN for it — the same thing deleting the last
   * digit reports.
   */
  expect(seen).toHaveLength(1);
  expect(Number.isNaN(seen[0])).toBe(true);
  expect(value()).toBe('');
});

test('the stepper wins the edge, and development says so', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(
    <NumberField
      label="Quantity"
      defaultValue={3}
      isClearable
      isStepperVisible
    />
  );

  /*
   * Doc 07 §2.2 rule 4: at most one library-owned control at that edge,
   * because two means a hit area that depends on how the field was
   * configured. Two stepper buttons and no cross.
   */
  expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  expect(screen.queryAllByRole('button')).toHaveLength(2);

  const ours = warn.mock.calls.filter(([first]) =>
    String(first).startsWith('blackborne:')
  );
  expect(ours).toHaveLength(1);
  warn.mockRestore();
});

test('the cross is unreachable when it has nothing to offer', () => {
  const cross = () => screen.queryByRole('button', { name: 'Clear' });

  const { rerender } = render(
    <NumberField label="Q" isClearable defaultValue={12} />
  );
  expect(cross(), 'with a value').not.toBeNull();

  rerender(<NumberField label="Q" isClearable defaultValue={12} isSaving />);
  expect(cross(), 'saving').toBeNull();

  rerender(<NumberField label="Q" isClearable defaultValue={12} isReadOnly />);
  expect(cross(), 'read-only').toBeNull();
});

test('an empty clearable numeric field has nothing to clear', () => {
  render(<NumberField label="Q" isClearable />);
  expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
});
