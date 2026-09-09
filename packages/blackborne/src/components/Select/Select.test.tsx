/*
 * The field half, which is what holds without a browser.
 *
 * A select is the first component in the library that is both a field and a
 * layer, and the two halves land in different places: the label, the
 * description, the error and their relationships are assertable here, and the
 * list's width, its placement and the keyboard are in
 * `apps/catalog/e2e/select.spec.ts` — jsdom implements no real tab order and
 * resolves no CSS variable.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Select, SelectItem } from './Select';

const Currency = (props: Partial<Parameters<typeof Select>[0]> = {}) => (
  <Select label="Currency" {...props}>
    <SelectItem id="PEN">Peruvian sol</SelectItem>
    <SelectItem id="USD">US dollar</SelectItem>
    <SelectItem id="EUR" isDisabled>
      Euro
    </SelectItem>
  </Select>
);

test('the label names the control', () => {
  render(<Currency />);

  // The base's own wiring, and the whole reason a field is built on it: the
  // label is associated with the control rather than merely near it.
  expect(screen.getByRole('button', { name: /Currency/ })).toBeDefined();
});

test('nothing is chosen until something is', async () => {
  const user = userEvent.setup();
  render(<Currency placeholder="Choose one" />);

  expect(screen.getByText('Choose one')).toBeDefined();

  await user.click(screen.getByRole('button'));
  await user.click(screen.getByRole('option', { name: 'US dollar' }));

  expect(screen.getByRole('button').textContent).toContain('US dollar');
});

test('a chosen option comes back as a string', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn<(key: string | null) => void>();

  render(<Currency onSelectionChange={onSelectionChange} />);

  await user.click(screen.getByRole('button'));
  await user.click(screen.getByRole('option', { name: 'Peruvian sol' }));

  expect(onSelectionChange).toHaveBeenCalledWith('PEN');
  expect(typeof onSelectionChange.mock.calls[0]?.[0]).toBe('string');
});

test('the uncontrolled shortcut chooses one to start with', () => {
  render(<Currency defaultSelectedKey="USD" />);

  expect(screen.getByRole('button').textContent).toContain('US dollar');
});

test('a disabled option cannot be chosen', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();

  render(<Currency onSelectionChange={onSelectionChange} />);

  await user.click(screen.getByRole('button'));
  await user.click(screen.getByRole('option', { name: 'Euro' }));

  expect(onSelectionChange).not.toHaveBeenCalled();
  expect(
    screen.getByRole('option', { name: 'Euro' }).getAttribute('aria-disabled')
  ).toBe('true');
});

/*
 * Doc 07 §4: the description and the error are RELATED to the control rather
 * than merely printed near it, and the relationship is what makes an error
 * perceivable to somebody who cannot see the red.
 */
test('the description and the error are related to the control', () => {
  render(
    <Currency
      description="The currency every invoice is issued in."
      errorMessage="Choose a currency."
      isInvalid
    />
  );

  const control = screen.getByRole('button');
  const describedBy = control.getAttribute('aria-describedby') ?? '';
  const ids = describedBy.split(' ').filter(Boolean);

  const text = ids
    .map(id => document.getElementById(id)?.textContent ?? '')
    .join(' ');

  expect(text).toContain('The currency every invoice is issued in.');
  expect(text).toContain('Choose a currency.');
});

/*
 * And the error does not replace the description — doc 07 §4 again. A field
 * that swapped one for the other would take away the instruction at the moment
 * somebody needed it most.
 */
test('an error accompanies the description rather than replacing it', () => {
  render(
    <Currency
      description="The currency every invoice is issued in."
      errorMessage="Choose a currency."
      isInvalid
    />
  );

  expect(
    screen.getByText('The currency every invoice is issued in.')
  ).toBeDefined();
  expect(screen.getByText('Choose a currency.')).toBeDefined();
});

/*
 * MEASURED, and the reason `ControlFrame` grew two props: the base's
 * `TextField` publishes a group context that a frame reads its invalid and
 * disabled state from, and its `Select` does not. Without them passed
 * explicitly the box would look ordinary while the field was invalid — the
 * class of defect that looks right and is not.
 */
test('the box knows it is invalid, and knows it is switched off', () => {
  const { container, rerender } = render(<Currency isInvalid />);

  const frame = () =>
    container.querySelector('.bb-select-trigger')?.parentElement;
  expect(frame()?.getAttribute('data-invalid')).toBe('true');

  rerender(<Currency isDisabled />);
  expect(frame()?.getAttribute('data-disabled')).toBe('true');
});

/*
 * MEASURED, and it does not go where a text field's does.
 *
 * `Field`'s own comment says the announcement comes from the base's
 * `aria-required` — true for an input, and the base's select does not put it on
 * the trigger. What it does instead is render a hidden native `<select>` with
 * the `required` attribute, for the form; the button carries none of it.
 *
 * So the mark on the label is not decoration here: it is the ONLY channel a
 * sighted person and a screen reader user share, and this asserts both halves
 * of what actually exists rather than the half the field structure assumed.
 * The gap itself is recorded in the catalog.
 */
test('a required field says so, in the one channel it has', () => {
  render(<Currency isRequired />);

  /*
   * NOT on the trigger, which is where a text field's would be. Measured, and
   * the whole reason this component composes the word into its label.
   */
  expect(screen.getByRole('button').getAttribute('aria-required')).toBeNull();

  /*
   * And the label is not a `<label>`, which is a second thing this measurement
   * turned up: the base gives a select's label context `elementType: 'span'`,
   * because a `<label>` cannot label a button. So the name arrives through
   * `aria-labelledby` and a test looking for a label element finds the hidden
   * one the base renders for the form instead.
   */
  const labelled = screen.getByRole('button').getAttribute('aria-labelledby');
  expect(labelled).not.toBeNull();

  const name = (labelled ?? '')
    .split(' ')
    .map(id => document.getElementById(id)?.textContent ?? '')
    .join(' ');

  /*
   * The visible channel and the announced one, in the same element: the
   * asterisk `Field` draws, and the word this component adds. The asterisk is
   * `aria-hidden`, so it is in the text and not in the name — and the word is
   * in both because `VisuallyHidden` keeps it in the tree.
   */
  expect(name).toContain('*');
  expect(name).toContain('required');
});

test('it needs no provider to be a field', () => {
  render(<Currency />);

  expect(screen.getByRole('button', { name: /Currency/ })).toBeDefined();
});
