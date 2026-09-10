/*
 * What holds without a browser: which rows exist, what they are called in a
 * given locale, and what crosses the boundary when one is chosen.
 *
 * NOT HERE: the keyboard, where the list lands, and its width against the
 * trigger. All three are `Select`'s and are already measured in
 * `apps/catalog/e2e/select.spec.ts` — which is the point of this component
 * being a `Select` with generated rows rather than columns of its own.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { TimePicker } from './TimePicker';

const picker = (props: Partial<React.ComponentProps<typeof TimePicker>> = {}) =>
  render(
    <ConfigProvider>
      <TimePicker label="Opens at" placeholder="Choose a time" {...props} />
    </ConfigProvider>
  );

const rows = () => screen.getAllByRole('option').map(one => one.textContent);

test('it is a named field with a placeholder and no segments', () => {
  picker();

  /*
   * NO SEGMENTS ON PURPOSE, and this is the assertion that says so: a field
   * somebody can type into cannot honour a step, so a picker with both would
   * accept `14:37` from the keyboard while offering quarter hours in its list.
   * An arbitrary time is a `TimeField`.
   */
  expect(screen.getByRole('button', { name: /Opens at/ })).toBeDefined();
  expect(screen.getByText('Choose a time')).toBeDefined();
  expect(document.querySelectorAll('[data-type]')).toHaveLength(0);
});

test('the rows are the step, and both bounds are on the list', () => {
  picker({ step: 30, minValue: '09:00', maxValue: '11:00', defaultOpen: true });

  expect(rows()).toEqual([
    'No time',
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM'
  ]);
});

test('ninety-six rows at the default step, plus the one that means nothing', () => {
  picker({ defaultOpen: true });

  expect(screen.getAllByRole('option')).toHaveLength(97);
});

test('a row is named by the locale, and the value is not', async () => {
  const onChange = vi.fn();

  render(
    <ConfigProvider locale="ja-JP">
      <TimePicker
        label="開店"
        placeholder="選択"
        step={60}
        minValue="13:00"
        maxValue="15:00"
        onChange={onChange}
        defaultOpen
      />
    </ConfigProvider>
  );

  /*
   * TWENTY-FOUR HOURS AND NO MARKER in Japanese, twelve hours with one in
   * English — which is decision 0020's argument made visible: what a person
   * reads comes from the locale and what crosses the boundary is `14:00`.
   * `es-PE` is the measurement behind it, being a twelve-hour locale that
   * writes `p. m.` where `en-US` writes `PM`.
   */
  expect(rows()).toEqual(['No time', '13:00', '14:00', '15:00']);

  await userEvent.click(screen.getByRole('option', { name: '14:00' }));

  expect(onChange).toHaveBeenCalledWith('14:00');
});

test('the value crosses as a string, both ways', async () => {
  const onChange = vi.fn();

  picker({
    value: '09:30',
    step: 30,
    minValue: '09:00',
    maxValue: '10:00',
    onChange,
    defaultOpen: true
  });

  /*
   * What it holds is shown rather than the placeholder — read from the value
   * element rather than by role, because the base names a select by its label
   * and, with the list open, there is more than one button in the tree. The
   * NAME is asserted in the first test of this file, where nothing is open.
   */
  expect(document.querySelector('.bb-select-value')?.textContent).toBe(
    '9:30 AM'
  );

  await userEvent.click(screen.getByRole('option', { name: '10:00 AM' }));

  expect(onChange).toHaveBeenCalledWith('10:00');
});

test('the row that means nothing reports null', async () => {
  const onChange = vi.fn();

  picker({ value: '09:30', step: 30, onChange, defaultOpen: true });

  /*
   * RULE 5'S ROUTE, provided by the component because the component owns the
   * list: a field that opens a layer keeps the chevron and has no clear
   * button, because emptying has an option that costs no width at the edge.
   */
  await userEvent.click(screen.getByRole('option', { name: 'No time' }));

  expect(onChange).toHaveBeenCalledWith(null);
});

test('and a required field does not offer it', () => {
  picker({
    isRequired: true,
    step: 60,
    minValue: '09:00',
    maxValue: '10:00',
    defaultOpen: true
  });

  expect(screen.queryByRole('option', { name: 'No time' })).toBeNull();
  expect(rows()).toEqual(['9:00 AM', '10:00 AM']);
});

test('a value the step cannot reach still gets a row, and warns', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  picker({
    value: '14:37',
    step: 15,
    minValue: '14:00',
    maxValue: '15:00',
    defaultOpen: true
  });

  /*
   * A FIELD HOLDING A VALUE MAY NOT SHOW NONE. A picker configured for
   * quarter hours and handed `14:37` from a server would otherwise have no row
   * to select and would show its placeholder, which is the one thing a field
   * cannot do. So the value joins the list, in order.
   */
  expect(rows()).toEqual([
    'No time',
    '2:00 PM',
    '2:15 PM',
    '2:30 PM',
    '2:37 PM',
    '2:45 PM',
    '3:00 PM'
  ]);
  expect(warn.mock.calls.join(' ')).toContain('not on a 15-minute step');

  warn.mockRestore();
});

test('a time it cannot read renders empty and says so', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  picker({ value: 'half past two' });

  expect(screen.getByText('Choose a time')).toBeDefined();
  expect(warn.mock.calls.join(' ')).toContain('is not a time this library');

  warn.mockRestore();
});

test('a step nobody can use says so in development', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  picker({ step: 1 });

  /*
   * 1440 rows is a document rather than a list. Said rather than refused: a
   * component that throws over a prop takes a screen down for a
   * misconfiguration somebody can see and fix.
   */
  expect(warn.mock.calls.join(' ')).toContain('rather than a list');

  warn.mockRestore();
});

test('the class name lands on the outermost element only', () => {
  picker({ className: 'placed' });

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
});
