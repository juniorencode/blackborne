/*
 * The half that holds without a browser: what the segments contain, what the
 * locale does to their order, and what crosses the boundary.
 *
 * Not here: whether the row moves while a month is typed, and whether the
 * focused segment is unmistakable. Those are pixels, and they are measured in
 * `apps/catalog/e2e/date-field.spec.ts`.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { DateField } from './DateField';

const Invoice = (props: Partial<Parameters<typeof DateField>[0]> = {}) => (
  <ConfigProvider timeZone="America/Lima">
    <DateField label="Invoice date" {...props} />
  </ConfigProvider>
);

const segments = () => [
  ...document.querySelectorAll('.bb-date-segment:not([data-type=literal])')
];

const shown = () =>
  segments()
    .map(segment => segment.textContent)
    .join('|');

const types = () =>
  segments().map(segment => segment.getAttribute('data-type'));

test('it is ONE labelled group of segments, not two', () => {
  render(<Invoice defaultValue="2026-09-09" />);

  /*
   * ONE, and the count is the assertion. The frame every field in this
   * library draws is the base's `Group`, and a date field's control is a
   * group of its own — the base's `DateInput` renders one so the row of spin
   * buttons has a name to belong to. Both carried the field's name until the
   * frame was told to be presentational: measured in a browser, a reader
   * heard "Invoice date group, Invoice date group".
   */
  expect(screen.getAllByRole('group', { name: /Invoice date/ })).toHaveLength(
    1
  );
  /* Three editable pieces, and the separators are not among them. */
  expect(types()).toEqual(['month', 'day', 'year']);
  expect(shown()).toBe('9|9|2026');
});

test('an empty field shows the placeholder of each segment', () => {
  render(<Invoice />);

  /*
   * `mm`, `dd`, `yyyy` — the base's, in the locale's own words, and marked so
   * the muted colour every other field's placeholder uses can find them.
   */
  expect(segments().every(s => s.hasAttribute('data-placeholder'))).toBe(true);
  expect(shown()).toBe('mm|dd|yyyy');
});

test('the order of the segments is the locale own', () => {
  const { unmount } = render(
    <ConfigProvider locale="ja-JP" timeZone="Asia/Tokyo">
      <DateField label="請求日" defaultValue="2026-09-09" />
    </ConfigProvider>
  );
  expect(types()).toEqual(['year', 'month', 'day']);
  unmount();

  render(
    <ConfigProvider locale="es-PE" timeZone="America/Lima">
      <DateField label="Fecha" defaultValue="2026-09-09" />
    </ConfigProvider>
  );
  expect(types()).toEqual(['day', 'month', 'year']);
});

test('typing a date reports one string, once it is a date', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Invoice onChange={onChange} />);

  await user.click(segments()[0]!);
  await user.keyboard('09');
  /* A month on its own is not a date, so nothing is reported yet. */
  expect(onChange).not.toHaveBeenCalled();

  await user.keyboard('09');
  expect(onChange).not.toHaveBeenCalled();

  await user.keyboard('2026');
  expect(onChange).toHaveBeenCalledWith('2026-09-09');
});

test('clearing a segment reports nothing at all', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Invoice defaultValue="2026-09-09" onChange={onChange} />);

  await user.click(segments()[0]!);
  await user.keyboard('{Backspace}');

  /*
   * THE OPPOSITE OF WHAT THIS TEST FIRST CLAIMED, and the correction is the
   * point. It asserted `onChange` with `null`, on the reasoning that a date
   * can be deleted a piece at a time. Measured, in jsdom and then in a
   * browser: the month segment does clear — it shows its placeholder again —
   * and the reported value stays at the last complete date. The year segment
   * does not clear at all.
   *
   * So emptying a date field is not observable through this callback, which
   * is written on the prop and matters to anybody building a "clear" of their
   * own. Asserted as silence rather than left unasked, because the sentence it
   * disproves is the one somebody would build on.
   */
  expect(segments()[0]!.hasAttribute('data-placeholder')).toBe(true);
  expect(onChange).not.toHaveBeenCalled();
});

test('a day the month does not have is shown and not reported', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Invoice defaultValue="2026-02-01" onChange={onChange} />);

  const day = segments().find(s => s.getAttribute('data-type') === 'day')!;
  await user.click(day);
  await user.keyboard('31');

  /*
   * ALSO THE OPPOSITE OF THE FIRST CLAIM HERE, which was that the base clamps
   * the day to the month. It does not: February has 28 days in 2026 and the
   * segment shows 31. What it will not do is report it — the last value it
   * called back with is the 3rd, from the keystroke before, and the 31st is
   * never reported at all.
   *
   * Which puts the line in doc 07 §2 somewhere more interesting than expected:
   * the segments restrict what can be TYPED into one piece (there is no month
   * 13) and leave the combination to the value, so an impossible date is a
   * state the field can be in and a value it never emits.
   */
  expect(day.textContent).toBe('31');
  expect(onChange.mock.calls.at(-1)).toEqual(['2026-02-03']);
});

test('the arrows step the segment that has focus', async () => {
  const user = userEvent.setup();
  render(<Invoice defaultValue="2026-09-09" />);

  const year = segments().find(s => s.getAttribute('data-type') === 'year')!;
  await user.click(year);
  await user.keyboard('{ArrowUp}');
  expect(year.textContent).toBe('2027');
  await user.keyboard('{ArrowDown}{ArrowDown}');
  expect(year.textContent).toBe('2025');
});

test('a malformed value renders empty and says so', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  render(<Invoice value="the ninth" />);

  expect(shown()).toBe('mm|dd|yyyy');
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('the ninth'));
  warn.mockRestore();
});

test('a day outside the limits marks the field invalid', () => {
  render(
    <Invoice
      defaultValue="2026-10-05"
      minValue="2026-09-01"
      maxValue="2026-09-30"
    />
  );

  /*
   * Marked rather than refused: the segments cannot know the date is finished
   * until the last piece is typed, so a limit is a judgement on the value and
   * belongs on the field (doc 07 §2).
   */
  /*
   * Read from the field's own root rather than from an ancestor of the group:
   * measured, `data-invalid` is published on the root and on the segments, and
   * the frame reads it from the base's context to paint the box.
   */
  expect(document.querySelectorAll('[data-invalid]').length).toBeGreaterThan(0);
});

test('an unavailable day is asked about as a string', () => {
  const isDateUnavailable = vi.fn((date: string) => date === '2026-09-09');
  render(
    <Invoice defaultValue="2026-09-09" isDateUnavailable={isDateUnavailable} />
  );

  for (const [date] of isDateUnavailable.mock.calls)
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(isDateUnavailable).toHaveBeenCalled();
});

test('the description and the error are both related to the field', () => {
  render(
    <Invoice
      defaultValue="2026-09-09"
      description="The date on the document."
      errorMessage="This period is closed."
      isInvalid
    />
  );

  const group = screen.getAllByRole('group', { name: /Invoice date/ })[0]!;
  const described = group.getAttribute('aria-describedby') ?? '';
  const ids = described.split(' ').filter(Boolean);

  /* Both, not one: an error accompanies the description rather than replacing
     it (doc 07 §4). */
  const texts = ids.map(id => document.getElementById(id)?.textContent);
  expect(texts).toContain('The date on the document.');
  expect(texts).toContain('This period is closed.');
});

test('a read-only field keeps its value readable and refuses a keystroke', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Invoice defaultValue="2026-09-09" isReadOnly onChange={onChange} />);

  expect(shown()).toBe('9|9|2026');
  await user.click(segments()[0]!);
  await user.keyboard('12');
  expect(onChange).not.toHaveBeenCalled();
});

test('the class name lands on the outermost element only', () => {
  render(<Invoice defaultValue="2026-09-09" className="placed" />);

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
});
