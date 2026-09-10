/*
 * The half that holds without a browser: what the field row contains, what
 * each of its two controls is, and what crosses the boundary.
 *
 * Not here: where the layer lands, whether the chevron turns, and whether two
 * controls at one edge clear the minimum target. Those are boxes and pixels,
 * and they are measured in `apps/catalog/e2e/date-picker.spec.ts` — including
 * doc 07 §2.2a's four conditions, which is where an exception to a foundation
 * has to be proved rather than asserted.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { DatePicker } from './DatePicker';

const Appointment = (props: Partial<Parameters<typeof DatePicker>[0]> = {}) => (
  <ConfigProvider timeZone="America/Lima">
    <DatePicker label="Appointment" {...props} />
  </ConfigProvider>
);

const segments = () => [
  ...document.querySelectorAll('.bb-date-segment:not([data-type=literal])')
];

const shown = () =>
  segments()
    .map(segment => segment.textContent)
    .join('|');

const toggle = () => document.querySelector('.bb-date-picker-toggle')!;
const cross = () => document.querySelector('.bb-field-clear')!;

test('the field row is segments plus two controls, and nothing else', () => {
  render(<Appointment defaultValue="2026-09-09" />);

  expect(shown()).toBe('9|9|2026');
  expect(toggle()).not.toBeNull();
  expect(cross()).not.toBeNull();

  /*
   * Two, and the count is the assertion: doc 07 §2.2a admits exactly these two
   * at one edge and the closing rule of §2.2 forbids a third. A field whose
   * hit areas depend on how many controls arrived is not something anyone can
   * test.
   */
  expect(document.querySelectorAll('.bb-field-box button')).toHaveLength(2);
});

test('the two controls have different names, and neither is empty', () => {
  render(<Appointment defaultValue="2026-09-09" />);

  const names = [toggle(), cross()].map(button =>
    button.getAttribute('aria-label')
  );

  /*
   * The toggle's is the base's own, localised by it — the arrangement
   * `ComboBox` established, where this library adds no key of its own. The
   * cross's comes from our dictionary. One name shared between them is what an
   * unslotted button context produces if nobody stops it.
   */
  for (const name of names) expect(name).toBeTruthy();
  expect(names[0]).not.toBe(names[1]);
});

test('the cross empties the value and reports it', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Appointment defaultValue="2026-09-09" onChange={onChange} />);

  await user.click(cross());

  /*
   * DOC 07 §2.2a'S FOURTH CONDITION, which is the justification for the whole
   * exception: emptying a date field is otherwise unobservable — measured, the
   * segments do not report it and the year does not clear at all — so this is
   * the one route by which the value becomes nothing.
   */
  expect(onChange).toHaveBeenCalledWith(null);
  expect(shown()).toBe('mm|dd|yyyy');
});

test('the cross does not wear the toggle press handler', async () => {
  const user = userEvent.setup();
  render(<Appointment defaultValue="2026-09-09" />);

  await user.click(cross());

  /*
   * THE COLLISION. A `DatePicker` publishes an UNSLOTTED `ButtonContext`
   * carrying the toggle's props, so without `slot={null}` on the cross it
   * wears the toggle's id, name and press handler — and pressing it opens the
   * calendar instead of emptying the field. Decision 0022 records the same
   * trap on a combo box.
   */
  expect(document.querySelector('.bb-calendar-body')).toBeNull();
  expect(toggle().getAttribute('aria-expanded')).not.toBe('true');
});

test('the chevron opens a calendar and the toggle says so', async () => {
  const user = userEvent.setup();
  render(<Appointment defaultValue="2026-09-09" />);

  await user.click(toggle());

  expect(toggle().getAttribute('aria-expanded')).toBe('true');
  expect(document.querySelector('.bb-calendar-body')).not.toBeNull();
});

test('the calendar in the layer does not repeat the field name', async () => {
  const user = userEvent.setup();
  render(<Appointment defaultValue="2026-09-09" />);
  await user.click(toggle());

  /*
   * The NAME belongs to the dialog around it: measured, the picker's
   * `calendarProps` carry no `aria-label` and the dialog gets an
   * `aria-labelledby` pointing at the toggle and the field's label. Which is
   * why the layer holds the shared internal rather than the public
   * `Calendar` — that one requires a label and would say "Appointment" twice.
   */
  const calendar = document.querySelector('.bb-calendar-body')!;
  const name = calendar.getAttribute('aria-label');

  /*
   * `bb-calendar-body` and not `bb-calendar`: the picker renders the calendar
   * BODY inside its own element, so the public component's root class is not
   * there — which keeps a check written for standalone calendars from quietly
   * picking up the one inside a field.
   *
   * And the name is NOT NOTHING, which is what this test first asserted.
   * Measured: given no label of its own the base names the grid by the month
   * it is showing, which is better than silence and better than a second copy
   * of the field's name. So the claim is that the two names DIFFER — the
   * dialog carries what the field is for, the grid carries what is on screen.
   */
  expect(name).toBe('September 2026');
  expect(name).not.toBe('Appointment');
  expect(
    document.querySelector('[role=dialog]')?.getAttribute('aria-labelledby')
  ).toBeTruthy();
});

test('choosing a day in the layer reports the string', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Appointment defaultValue="2026-09-09" onChange={onChange} />);

  await user.click(toggle());
  const seventeenth = [...document.querySelectorAll('.bb-calendar-day')].find(
    day => day.textContent === '17'
  )!;
  await user.click(seventeenth);

  expect(onChange).toHaveBeenCalledWith('2026-09-17');
});

test('a malformed value renders empty and says so', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  render(<Appointment value="tomorrow" />);

  expect(shown()).toBe('mm|dd|yyyy');
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('tomorrow'));
  warn.mockRestore();
});

test('the label, the description and the error all reach the field', () => {
  render(
    <Appointment
      defaultValue="2026-09-09"
      description="Between nine and six."
      errorMessage="That day is booked."
      isInvalid
    />
  );

  expect(screen.getByText('Appointment')).toBeDefined();
  expect(screen.getByText('Between nine and six.')).toBeDefined();
  expect(screen.getByText('That day is booked.')).toBeDefined();
  expect(document.querySelectorAll('[data-invalid]').length).toBeGreaterThan(0);
});

test('the class name lands on the outermost element only', () => {
  render(<Appointment defaultValue="2026-09-09" className="placed" />);

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
});
