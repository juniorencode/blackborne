/*
 * The half that holds without a browser: what the grid contains, what the
 * three views do to each other, and the two things this component decides for
 * itself — which months can be pressed, and which day is today.
 *
 * Not here: the box. Whether a cell clears the minimum target at compact
 * density and whether today's ring takes any layout are questions about
 * rendered pixels, so they are measured in `apps/catalog/e2e/calendar.spec.ts`.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { Calendar } from './Calendar';

/** A calendar in a zone, which is what a calendar needs to know today. */
const Appointments = (props: Partial<Parameters<typeof Calendar>[0]> = {}) => (
  <ConfigProvider timeZone="America/Lima">
    <Calendar label="Appointment" defaultValue="2026-09-09" {...props} />
  </ConfigProvider>
);

const days = () =>
  screen
    .getAllByRole('button')
    .filter(button => button.className.includes('bb-calendar-day'));

const periods = () =>
  screen
    .getAllByRole('button')
    .filter(button => button.className.includes('bb-calendar-period'));

/*
 * The weekday row, read from the DOM rather than by role — and that is the
 * base being right rather than a gap. It renders the header row
 * `aria-hidden`, because every cell already announces "Sunday, August 30,
 * 2026": column headers on top of that would say the weekday twice for every
 * day of the month.
 */
const weekdays = () => [...document.querySelectorAll('.bb-calendar-weekday')];

const title = () =>
  screen
    .getAllByRole('button')
    .find(button => button.className.includes('bb-calendar-title'))!;

test('it is a named grid of days with a heading', () => {
  render(<Appointments />);

  expect(
    screen.getByRole('application', { name: /Appointment/ })
  ).toBeDefined();
  expect(title().textContent).toBe('September 2026');
  // Seven columns, whatever the locale calls them.
  expect(weekdays()).toHaveLength(7);
});

test('the chosen day is marked, and choosing another reports a string', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Appointments onChange={onChange} />);

  const chosen = days().filter(
    day => day.getAttribute('data-selected') !== null
  );
  expect(chosen.map(day => day.textContent)).toEqual(['9']);

  await user.click(days().find(day => day.textContent === '17')!);

  /*
   * An ISO string, which is the whole of decision 0020 in one assertion: the
   * base's calendar object never reaches the consumer.
   */
  expect(onChange).toHaveBeenCalledWith('2026-09-17');
});

test('a controlled value shows what it is given and nothing else', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Appointments value="2026-09-09" onChange={onChange} />);

  await user.click(days().find(day => day.textContent === '17')!);

  expect(onChange).toHaveBeenCalledWith('2026-09-17');
  const chosen = days().filter(
    day => day.getAttribute('data-selected') !== null
  );
  expect(chosen.map(day => day.textContent)).toEqual(['9']);
});

test('a value that is not a date warns and shows nothing chosen', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  render(<Appointments value="the ninth" />);

  expect(warn).toHaveBeenCalled();
  expect(warn.mock.calls[0]?.[0]).toContain('not a date');
  expect(
    days().filter(day => day.getAttribute('data-selected') !== null)
  ).toEqual([]);
  warn.mockRestore();
});

test('the limits disable the days outside them', () => {
  render(<Appointments minValue="2026-09-05" maxValue="2026-09-20" />);

  const enabled = days()
    .filter(day => day.getAttribute('data-disabled') === null)
    .map(day => day.textContent);

  expect(enabled).toContain('5');
  expect(enabled).toContain('20');
  expect(enabled).not.toContain('4');
  expect(enabled).not.toContain('21');
});

test('and a day inside the range can still be unavailable', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <Appointments
      /*
       * The callback receives a STRING, which is decision 0020's cost written
       * as a test: the boundary is a string, so a consumer's own arithmetic
       * happens on one.
       */
      isDateUnavailable={date => date === '2026-09-17'}
      onChange={onChange}
    />
  );

  const taken = days().find(day => day.textContent === '17')!;
  expect(taken.getAttribute('data-unavailable')).toBe('true');

  await user.click(taken);
  expect(onChange).not.toHaveBeenCalled();
});

/*
 * TODAY IS THE PROVIDER'S DAY. The base marks a `data-today` of its own
 * computed from the browser's zone — read in `useCalendarState` — and doc 05
 * §3.1 says the browser's zone belongs to the machine of whoever is looking.
 * So this component marks its own, from the configured zone.
 */
test('with a zone configured, today is marked from it', () => {
  render(<Appointments />);

  const marked = days().filter(day =>
    day.className.includes('bb-calendar-today')
  );

  // One day, and it is the one the base agrees is today in this environment.
  expect(marked).toHaveLength(1);
  expect(marked[0]?.getAttribute('data-today')).toBe('true');
});

test('with no zone configured, nothing is marked and it says why', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  render(<Calendar label="Appointment" defaultValue="2026-09-09" />);

  expect(
    days().filter(day => day.className.includes('bb-calendar-today'))
  ).toEqual([]);

  /*
   * And the base's own mark is still in the DOM, unstyled: that is the
   * distinction this test exists for. A component that read `data-today`
   * would be showing the machine's today with nobody having said so.
   */
  expect(document.querySelector('[data-today]')).not.toBeNull();
  expect(warn).toHaveBeenCalled();
  expect(warn.mock.calls[0]?.[0]).toContain('time zone');
  warn.mockRestore();
});

/* ------------------------------------------------------------- three views */

test('the heading opens the months, and a month comes back to its days', async () => {
  const user = userEvent.setup();
  render(<Appointments />);

  await user.click(title());

  expect(title().textContent).toBe('2026');
  expect(periods()).toHaveLength(12);
  expect(periods().map(month => month.textContent)).toContain('March');
  // No day grid while the months are showing.
  expect(days()).toEqual([]);

  await user.click(periods().find(month => month.textContent === 'March')!);

  expect(title().textContent).toBe('March 2026');
  expect(days().length).toBeGreaterThan(28);
});

test('and the heading again opens the years, twelve at a time', async () => {
  const user = userEvent.setup();
  render(<Appointments />);

  await user.click(title());
  await user.click(title());

  expect(periods()).toHaveLength(12);
  expect(periods().map(year => year.textContent)).toContain('2026');

  /*
   * The heading is a RANGE, formatted by the platform rather than glued out of
   * two numbers and a dash — doc 05 §2.2 rule 5 is about exactly that.
   */
  expect(title().textContent).toMatch(/2020.*2031/u);
  // And it is the top of the chain, so it goes nowhere.
  expect(title().getAttribute('disabled')).not.toBeNull();

  await user.click(periods().find(year => year.textContent === '2028')!);
  expect(title().textContent).toBe('2028');
  expect(periods()).toHaveLength(12);
});

/*
 * THE ASYMMETRY IN THE BASE, asserted where it shows. Its year picker clamps
 * to the calendar's limits and its month picker hands over every month — so
 * which months can be pressed is this component's arithmetic (`limits.ts`).
 */
test('a month with nothing in it cannot be pressed', async () => {
  const user = userEvent.setup();
  render(<Appointments minValue="2026-06-01" maxValue="2026-11-30" />);

  await user.click(title());

  const reachable = periods()
    .filter(month => month.getAttribute('disabled') === null)
    .map(month => month.textContent);

  expect(reachable).toEqual([
    'June',
    'July',
    'August',
    'September',
    'October',
    'November'
  ]);
});

test('and a month is judged by its span rather than by one day in it', async () => {
  const user = userEvent.setup();
  // The maximum is the fifth of December, so December is still reachable.
  render(<Appointments maxValue="2026-12-05" />);

  await user.click(title());

  const reachable = periods()
    .filter(month => month.getAttribute('disabled') === null)
    .map(month => month.textContent);

  expect(reachable).toContain('December');
});

test('the arrows step a year in the months, and twelve in the years', async () => {
  const user = userEvent.setup();
  render(<Appointments />);

  await user.click(title());
  expect(title().textContent).toBe('2026');

  /* Two arrows in this view, in document order: back, then forward. */
  const [back, forward] = screen
    .getAllByRole('button')
    .filter(button => button.className.includes('bb-calendar-step'));

  await user.click(forward!);
  expect(title().textContent).toBe('2027');
  await user.click(back!);
  expect(title().textContent).toBe('2026');

  await user.click(title());
  const range = title().textContent;
  const [yearsBack] = screen
    .getAllByRole('button')
    .filter(button => button.className.includes('bb-calendar-step'));
  await user.click(yearsBack!);
  expect(title().textContent).not.toBe(range);
});

test('and they stop where the limits do', async () => {
  const user = userEvent.setup();
  render(<Appointments minValue="2026-01-01" maxValue="2026-12-31" />);

  await user.click(title());

  const steps = screen
    .getAllByRole('button')
    .filter(button => button.className.includes('bb-calendar-step'));

  // One year of range, so neither arrow has a year to step to.
  expect(steps[0]?.getAttribute('disabled')).not.toBeNull();
  expect(steps[1]?.getAttribute('disabled')).not.toBeNull();
});

test('the keyboard moves by a day, which is the base doing it', async () => {
  const user = userEvent.setup();
  render(<Appointments />);

  const chosen = days().find(
    day => day.getAttribute('data-selected') !== null
  )!;
  chosen.focus();
  await user.keyboard('{ArrowRight}');

  expect(document.activeElement?.textContent).toBe('10');
});

/*
 * There is no read-only calendar. The base has one and it photographed
 * identically to an ordinary calendar, which is the read-only `Select`
 * argument arriving on a grid: two states nobody can tell apart are worse than
 * one. A calendar that must not be changed is disabled.
 */
test('a disabled one takes nothing at all', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Appointments isDisabled onChange={onChange} />);

  await user.click(days().find(day => day.textContent === '17')!);
  expect(onChange).not.toHaveBeenCalled();
});

test('a disabled calendar marks no chosen day at all', () => {
  render(<Appointments isDisabled />);

  /*
   * THE SENTENCE THIS COMPONENT SHIPPED WITH WAS WRONG, and this is the
   * measurement that says so. It read: a calendar that must not be changed is
   * disabled, "with its chosen day still legible". The base drops
   * `data-selected` from every cell when the calendar is disabled —
   * controlled and uncontrolled, and in the range calendar too — so what a
   * disabled calendar shows is a month with nothing chosen in it.
   *
   * Which matters because it was the whole fallback for having no read-only
   * state. There is still no read-only state, for the reason the catalog
   * gives; what there is no longer is the claim that disabled would do
   * instead. A value that must not be changed is a formatted date.
   *
   * Queried from the DOM rather than by role: a disabled calendar has no
   * buttons in the accessibility tree, which is the base being right about
   * doc 06 §4 rule 5.
   */
  const cells = [...document.querySelectorAll('.bb-calendar-day')];
  expect(cells.length).toBeGreaterThan(28);
  for (const day of cells) expect(day.hasAttribute('data-disabled')).toBe(true);
  expect(cells.filter(day => day.hasAttribute('data-selected'))).toHaveLength(
    0
  );
});

test("the first day of the week is the consumer's to set", () => {
  render(<Appointments firstDayOfWeek="mon" />);

  const columns = weekdays().map(cell => cell.textContent);
  // English defaults to Sunday first; told otherwise, Monday leads.
  expect(columns).toHaveLength(7);
  expect(columns[0]).toBe('M');
});

test('it needs no provider', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<Calendar label="Appointment" />);

  expect(
    screen.getByRole('application', { name: /Appointment/ })
  ).toBeDefined();
  expect(weekdays()).toHaveLength(7);
  warn.mockRestore();
});
