/*
 * The half that holds without a browser: two halves that take DIFFERENT props
 * from the base's slots, what crosses the boundary, and the two controls at one
 * edge.
 *
 * Not here: how many months the WINDOW gives the layer. jsdom has no
 * `matchMedia`, so `useWindowFits` answers with its floor — one month — which
 * is the same structure a first paint renders and exactly what doc 04 §4.1
 * asks for. The wide answer is measured in
 * `apps/catalog/e2e/date-range-picker.spec.ts`, where a window exists.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from '../RangeCalendar';

const STAY: DateRange = { start: '2026-09-05', end: '2026-09-12' };

const Stay = (props: Partial<Parameters<typeof DateRangePicker>[0]> = {}) => (
  <ConfigProvider timeZone="America/Lima">
    <DateRangePicker label="Stay" defaultValue={STAY} {...props} />
  </ConfigProvider>
);

const rows = () => [...document.querySelectorAll('.bb-date-segments')];

const textOf = (row: Element) =>
  [...row.querySelectorAll('.bb-date-segment')]
    .map(segment => segment.textContent)
    .join('');

const toggle = () => document.querySelector('.bb-date-range-picker-toggle')!;
const cross = () => document.querySelector('.bb-field-clear')!;

test('the two halves are named, and they hold different dates', () => {
  render(<Stay />);

  /*
   * THE SLOTS. A range picker publishes a SLOTTED field context — measured:
   * `{ slots: { start: startFieldProps, end: endFieldProps } }` — so a shared
   * segment row inside one has to say which of the two it is. Without that
   * both rows take the same props and a range is one date typed twice, which
   * is the same rule the package guide records for a shared button arriving on
   * a second kind of element.
   */
  expect(rows()).toHaveLength(2);
  expect(rows().map(row => row.getAttribute('slot'))).toEqual(['start', 'end']);
  expect(textOf(rows()[0]!)).not.toBe(textOf(rows()[1]!));
  expect(textOf(rows()[0]!)).toContain('5');
  expect(textOf(rows()[1]!)).toContain('12');
});

test('one month without a window, which is the hook floor', async () => {
  const user = userEvent.setup();
  render(<Stay />);
  await user.click(toggle());

  /*
   * jsdom has no `matchMedia`, so `useWindowFits` answers `false` and the
   * layer builds the narrow structure. Asserted rather than assumed, because a
   * component that built two months here would build two on a first paint in a
   * browser too — the jump doc 04 rule 3 forbids.
   */
  expect(document.querySelectorAll('.bb-calendar-grid')).toHaveLength(1);
});

test('the row holds two controls at one edge, and nothing more', () => {
  render(<Stay />);

  expect(toggle()).not.toBeNull();
  expect(cross()).not.toBeNull();
  /* Doc 07 §2.2a admits exactly two; the closing rule of §2.2 forbids a third. */
  expect(document.querySelectorAll('.bb-field-box button')).toHaveLength(2);
});

test('the cross empties the range and does not open the layer', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Stay onChange={onChange} />);

  await user.click(cross());

  expect(onChange).toHaveBeenCalledWith(null);
  expect(document.querySelector('.bb-calendar-grid')).toBeNull();
  expect(toggle().getAttribute('aria-expanded')).not.toBe('true');
});

test('choosing a range in the layer reports two strings', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Stay onChange={onChange} />);

  await user.click(toggle());
  const day = (text: string) =>
    [...document.querySelectorAll('.bb-calendar-day')].find(
      cell => cell.textContent === text
    )!;
  await user.click(day('16'));
  await user.click(day('20'));

  expect(onChange).toHaveBeenLastCalledWith({
    start: '2026-09-16',
    end: '2026-09-20'
  });
});

test('a maximum length is the unavailable function, with the anchor', async () => {
  const user = userEvent.setup();
  const isDateUnavailable = vi.fn<
    (date: string, from: string | null) => boolean
  >((date, from) => from !== null && date > from);
  render(<Stay isDateUnavailable={isDateUnavailable} />);

  await user.click(toggle());
  for (const [date] of isDateUnavailable.mock.calls)
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  isDateUnavailable.mockClear();
  const day = (text: string) =>
    [...document.querySelectorAll('.bb-calendar-day')].find(
      cell => cell.textContent === text
    )!;
  await user.click(day('16'));

  /*
   * The anchor is what makes a maximum length expressible without a prop: the
   * limit moves with the day somebody picked first, which no number could do.
   */
  expect(
    isDateUnavailable.mock.calls.some(call => call[1] === '2026-09-16')
  ).toBe(true);
});

test('a malformed range renders as none and says so', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  render(<Stay defaultValue={{ start: 'the fifth', end: '2026-09-12' }} />);

  /* Both ends or neither, which `RangeCalendar` settled. */
  expect(
    rows().every(row =>
      [...row.querySelectorAll('.bb-date-segment')].some(segment =>
        segment.hasAttribute('data-placeholder')
      )
    )
  ).toBe(true);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('the fifth'));
  warn.mockRestore();
});

test('the label, the description and the error all reach the control', () => {
  render(
    <Stay
      description="Check-in and check-out."
      errorMessage="The room is taken."
      isInvalid
    />
  );

  expect(screen.getByText('Stay')).toBeDefined();
  expect(screen.getByText('Check-in and check-out.')).toBeDefined();
  expect(screen.getByText('The room is taken.')).toBeDefined();
  expect(document.querySelectorAll('[data-invalid]').length).toBeGreaterThan(0);
});

test('the mark between the halves is not announced', () => {
  render(<Stay />);

  const dash = document.querySelector('.bb-date-range-picker-dash')!;
  expect(dash.getAttribute('aria-hidden')).toBe('true');
});

test('the class name lands on the outermost element only', () => {
  render(<Stay className="placed" />);

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
});
