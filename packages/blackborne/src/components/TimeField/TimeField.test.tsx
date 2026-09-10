/*
 * The half that holds without a browser: what the segments contain, what the
 * locale does to them, and what crosses the boundary. The row's box and the
 * focused segment's contrast are measured in
 * `apps/catalog/e2e/time-field.spec.ts`.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { TimeField } from './TimeField';

const Opens = (props: Partial<Parameters<typeof TimeField>[0]> = {}) => (
  <ConfigProvider timeZone="America/Lima">
    <TimeField label="Opens at" {...props} />
  </ConfigProvider>
);

const segments = () => [
  ...document.querySelectorAll('.bb-date-segment:not([data-type=literal])')
];

const types = () =>
  segments().map(segment => segment.getAttribute('data-type'));

const shown = () =>
  segments()
    .map(segment => segment.textContent)
    .join('|');

test('it asks for hours and minutes, and a marker where the locale has one', () => {
  render(<Opens defaultValue="14:30" />);

  /*
   * Three segments in `en-US`, and the third is the AM/PM. Measured rather
   * than assumed — the first version of this component's own documentation
   * claimed `es-PE` was a twenty-four hour locale and it is not.
   */
  expect(types()).toEqual(['hour', 'minute', 'dayPeriod']);
  expect(shown()).toContain('2');
  expect(shown()).toContain('30');
});

test('a twenty-four hour locale has two segments and no marker', () => {
  render(
    <ConfigProvider locale="ja-JP" timeZone="Asia/Tokyo">
      <TimeField label="開店時刻" defaultValue="14:30" />
    </ConfigProvider>
  );

  expect(types()).toEqual(['hour', 'minute']);
  expect(shown()).toBe('14|30');
});

test('the value is the twenty-four hour clock whatever is shown', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Opens onChange={onChange} />);

  await user.click(segments()[0]!);
  await user.keyboard('0230');
  /* An `en-US` field starts at AM, so the marker has to be moved. */
  await user.keyboard('p');

  expect(onChange).toHaveBeenLastCalledWith('14:30');
});

test('asked for seconds, it reports them', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Opens precision="second" onChange={onChange} />);

  expect(types()).toEqual(['hour', 'minute', 'second', 'dayPeriod']);

  await user.click(segments()[0]!);
  await user.keyboard('023015p');
  expect(onChange).toHaveBeenLastCalledWith('14:30:15');
});

test('asked for minutes, it reports no seconds at all', () => {
  const onChange = vi.fn();
  render(<Opens value="14:30" onChange={onChange} />);

  /*
   * The trimming `isoTime` does, seen from the outside: a field that never
   * offered seconds does not report `14:30:00`, so a consumer comparing what
   * they passed against what came back finds one string rather than two.
   */
  expect(types()).not.toContain('second');
});

test('an hour the clock does not have cannot be typed', async () => {
  const user = userEvent.setup();
  render(<Opens defaultValue="14:30" />);

  const hour = segments()[0]!;
  await user.click(hour);
  await user.keyboard('25');

  /* Twelve-hour clock, so the hours run to 12 and the base clamps. */
  expect(Number(hour.textContent)).toBeLessThanOrEqual(12);
});

test('the cross empties it and reports null', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Opens defaultValue="14:30" onChange={onChange} />);

  await user.click(document.querySelector('.bb-field-clear')!);

  /*
   * Doc 07 §2.2a again, and for a time the reason is the same as for a date:
   * clearing a segment reports nothing, so the button is the only route by
   * which the value becomes nothing.
   */
  expect(onChange).toHaveBeenCalledWith(null);
  expect(segments().every(s => s.hasAttribute('data-placeholder'))).toBe(true);
});

test('a malformed value renders empty and says so', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  render(<Opens value="half two" />);

  expect(segments().every(s => s.hasAttribute('data-placeholder'))).toBe(true);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('half two'));
  warn.mockRestore();
});

test('it is ONE labelled group, not two', () => {
  render(<Opens defaultValue="14:30" />);

  /* The frame is presentational, for `DateField`'s measured reason. */
  expect(screen.getAllByRole('group', { name: /Opens at/ })).toHaveLength(1);
});

test('the class name lands on the outermost element only', () => {
  render(<Opens defaultValue="14:30" className="placed" />);

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
});
