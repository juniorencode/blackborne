/*
 * The half that holds without a browser: what the two ends and the band
 * contain, what a malformed range does, and the fact that jsdom always gets
 * ONE month.
 *
 * That last one is not a gap to be patched with a fake. `useContainerStep`
 * answers `base` where there is no `ResizeObserver` and no container query,
 * which is the narrowest structure and the one a first paint renders anyway —
 * so these tests see the component's floor, and the two-month structure is
 * measured in `apps/catalog/e2e/range-calendar.spec.ts`, where it exists.
 *
 * Not here either: the band. Whether a week of selected days paints one
 * continuous shape is a question about pixels.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { RangeCalendar, type DateRange } from './RangeCalendar';

const STAY: DateRange = { start: '2026-09-05', end: '2026-09-12' };

const Stay = (props: Partial<Parameters<typeof RangeCalendar>[0]> = {}) => (
  <ConfigProvider timeZone="America/Lima">
    <RangeCalendar label="Stay" defaultValue={STAY} {...props} />
  </ConfigProvider>
);

const days = () =>
  screen
    .getAllByRole('button')
    .filter(button => button.className.includes('bb-calendar-day'));

const chosen = () => days().filter(day => day.hasAttribute('data-selected'));

const title = () =>
  screen
    .getAllByRole('button')
    .find(button => button.className.includes('bb-calendar-title'))!;

const grids = () => [...document.querySelectorAll('.bb-calendar-grid')];

test('it is a named grid with the range marked from end to end', () => {
  render(<Stay />);

  expect(screen.getByRole('application', { name: /Stay/ })).toBeDefined();

  /* Eight days, the fifth to the twelfth inclusive. */
  expect(chosen().map(day => day.textContent)).toEqual([
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12'
  ]);
});

test('the two ends are marked as ends, and the days between are not', () => {
  render(<Stay />);

  const ends = chosen().filter(
    day =>
      day.hasAttribute('data-selection-start') ||
      day.hasAttribute('data-selection-end')
  );

  expect(ends.map(day => day.textContent)).toEqual(['5', '12']);
});

test('a single-day range is both ends at once', () => {
  render(<Stay defaultValue={{ start: '2026-09-09', end: '2026-09-09' }} />);

  const only = chosen();
  expect(only).toHaveLength(1);
  expect(only[0]!.hasAttribute('data-selection-start')).toBe(true);
  expect(only[0]!.hasAttribute('data-selection-end')).toBe(true);
});

test('one month without a container query, which is the hook floor', () => {
  render(<Stay />);

  /*
   * jsdom implements neither `ResizeObserver` nor container queries, so the
   * step stays at `base` and the structure is the narrow one. Asserted rather
   * than assumed, because a component that painted two months here would be
   * painting them on a first paint in a browser too — the jump doc 04 rule 3
   * forbids.
   */
  expect(grids()).toHaveLength(1);
  expect(title().textContent).toBe('September 2026');
});

test('choosing a range reports two strings', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Stay value={STAY} onChange={onChange} />);

  const fifteenth = days().find(day => day.textContent === '15')!;
  const twentieth = days().find(day => day.textContent === '20')!;

  await user.click(fifteenth);
  await user.click(twentieth);

  expect(onChange).toHaveBeenCalledWith({
    start: '2026-09-15',
    end: '2026-09-20'
  });
});

test('an unavailable day is asked about as a string, with the anchor', async () => {
  const user = userEvent.setup();
  /*
   * Typed by ANNOTATION rather than by naming the parameters, which is what
   * the async options hook already had to do: the second parameter is the
   * point of this check and an unused one written into the signature is a
   * lint error.
   */
  const isDateUnavailable = vi.fn<
    (date: string, from: string | null) => boolean
  >(date => date === '2026-09-20');
  render(<Stay isDateUnavailable={isDateUnavailable} />);

  /* Every day of the visible range, as `2026-09-09`. */
  for (const [date] of isDateUnavailable.mock.calls)
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  /* Before a range is being drawn there is no anchor. */
  expect(isDateUnavailable.mock.calls.every(call => call[1] === null)).toBe(
    true
  );

  const twentieth = days().find(day => day.textContent === '20')!;
  expect(twentieth.hasAttribute('data-unavailable')).toBe(true);

  /* And once one end is set, the anchor is that end. */
  isDateUnavailable.mockClear();
  await user.click(days().find(day => day.textContent === '15')!);
  expect(
    isDateUnavailable.mock.calls.some(call => call[1] === '2026-09-15')
  ).toBe(true);
});

test('a day outside the limits cannot be chosen', () => {
  render(<Stay minValue="2026-09-05" maxValue="2026-09-20" />);

  const fourth = days().find(day => day.textContent === '4')!;
  const twentyFirst = days().find(day => day.textContent === '21')!;

  expect(fourth.hasAttribute('data-disabled')).toBe(true);
  expect(twentyFirst.hasAttribute('data-disabled')).toBe(true);
  expect(
    days()
      .find(day => day.textContent === '10')!
      .hasAttribute('data-disabled')
  ).toBe(false);
});

test('a malformed range renders as none, and says so once', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  render(<Stay defaultValue={{ start: 'the fifth', end: '2026-09-12' }} />);

  /*
   * BOTH ENDS OR NEITHER. A half-parsed range would put the calendar in a
   * state nobody can see the shape of, so the whole value is dropped — and
   * `parseDay` has already said which string it could not read.
   */
  expect(chosen()).toHaveLength(0);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('the fifth'));
  warn.mockRestore();
});

test('with no zone configured, nothing is marked as today', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  render(<RangeCalendar label="Stay" defaultValue={STAY} />);

  expect(document.querySelectorAll('.bb-calendar-today')).toHaveLength(0);
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('RangeCalendar: no time zone')
  );
  warn.mockRestore();
});

test('the heading opens the months, and then the years', async () => {
  const user = userEvent.setup();
  render(<Stay />);

  await user.click(title());
  const months = screen
    .getAllByRole('button')
    .filter(button => button.className.includes('bb-calendar-period'));
  expect(months).toHaveLength(12);
  expect(title().textContent).toBe('2026');

  await user.click(title());
  expect(
    screen
      .getAllByRole('button')
      .filter(button => button.className.includes('bb-calendar-period'))
  ).toHaveLength(12);

  /* And the year view is the top of the chain, so its heading does nothing. */
  expect(title()).toHaveProperty('disabled', true);
});

test('choosing a month comes back to its days', async () => {
  const user = userEvent.setup();
  render(<Stay />);

  await user.click(title());
  const december = screen
    .getAllByRole('button')
    .filter(button => button.className.includes('bb-calendar-period'))
    .at(-1)!;
  await user.click(december);

  expect(title().textContent).toBe('December 2026');
  expect(grids()).toHaveLength(1);
});

test('a disabled range calendar keeps its days legible and unpressable', () => {
  render(<Stay isDisabled />);

  /*
   * TWO MEASUREMENTS, and the second corrected a claim already merged.
   *
   * Queried from the DOM rather than by role, because a disabled calendar has
   * no buttons in the accessibility tree at all — the base being right, since
   * an unpressable cell announced as a button is doc 06 §4 rule 5, and the
   * same shape of finding as a button inside a closed disclosure panel being
   * absent rather than disabled.
   *
   * And **a disabled calendar marks no selection whatsoever.** `Calendar`
   * shipped saying that a calendar which must not be changed is disabled
   * "with its chosen day still legible", and that is false: the base drops
   * `data-selected` from every cell, controlled and uncontrolled, single and
   * range — 0 of 35 against the 1 or 8 an ordinary one marks. Asserted as 0
   * rather than quietly not asked, because the sentence it disproves is what
   * somebody would otherwise build on.
   */
  const cells = [...document.querySelectorAll('.bb-calendar-day')];
  expect(cells.length).toBeGreaterThan(28);
  for (const day of cells) expect(day.hasAttribute('data-disabled')).toBe(true);
  expect(cells.filter(day => day.hasAttribute('data-selected'))).toHaveLength(
    0
  );
});

test('the class name lands on the outermost element only', () => {
  render(<Stay className="placed" />);

  const root = screen.getByRole('application', { name: /Stay/ });
  expect(root.className).toContain('placed');
  expect(document.querySelectorAll('.placed')).toHaveLength(1);
});
