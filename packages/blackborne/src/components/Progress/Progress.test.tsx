/*
 * What holds without a browser: the name, the number, and the arithmetic
 * between `value` and `maxValue`.
 *
 * Not here: the fill's width and whether a bar with nothing above it sits
 * where it should. Those are boxes, in `apps/catalog/e2e/progress.spec.ts`.
 */
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ConfigProvider } from '../../config';
import { Progress } from './Progress';

const Uploading = (props: Partial<Parameters<typeof Progress>[0]> = {}) => (
  <ConfigProvider>
    <Progress label="Uploading" value={43} {...props} />
  </ConfigProvider>
);

const bar = () => screen.getByRole('progressbar');

test('it is a named progress bar carrying its value', () => {
  render(<Uploading />);

  expect(screen.getByRole('progressbar', { name: 'Uploading' })).toBeDefined();
  expect(bar().getAttribute('aria-valuenow')).toBe('43');
  expect(bar().getAttribute('aria-valuemax')).toBe('100');
});

test('THE NAME SURVIVES THE LABEL BEING HIDDEN', () => {
  render(<Uploading isLabelHidden />);

  /*
   * The assertion this component nearly shipped without. The first version
   * rendered a plain span and left it out when hidden, on the reasoning that
   * the name reached the bar anyway — it does not: the base publishes a label
   * context that its own `Label` consumes to take an id, and the bar points
   * `aria-labelledby` at that. A span is wired to nothing and a missing label
   * is a bar with no name at all.
   *
   * Queried BY NAME rather than by role, which is the only way this fails when
   * it is wrong: `getByRole('progressbar')` passes either way.
   */
  expect(screen.getByRole('progressbar', { name: 'Uploading' })).toBeDefined();
  expect(screen.getByText('Uploading')).toBeDefined();
});

test('the percentage is the value against the maximum', () => {
  render(<Uploading value={3} maxValue={7} />);

  /* Three of seven, announced as a percentage by the base's own formatter. */
  expect(bar().getAttribute('aria-valuenow')).toBe('3');
  expect(bar().getAttribute('aria-valuemax')).toBe('7');
  expect(bar().getAttribute('aria-valuetext')).toBe('43%');
  expect(screen.getByText('43%')).toBeDefined();
});

test('a value label replaces the number without touching the value', () => {
  render(<Uploading value={3} maxValue={7} valueLabel="3 of 7 files" />);

  expect(screen.getByText('3 of 7 files')).toBeDefined();
  expect(screen.queryByText('43%')).toBeNull();

  /*
   * And the announced text follows it, which is the base doing the right
   * thing: a reader hears what the screen says rather than a percentage
   * nobody wrote.
   */
  expect(bar().getAttribute('aria-valuetext')).toBe('3 of 7 files');
  expect(bar().getAttribute('aria-valuenow')).toBe('3');
});

test('the number can be hidden and the value stays', () => {
  render(<Uploading isValueHidden />);

  expect(screen.queryByText('43%')).toBeNull();
  expect(bar().getAttribute('aria-valuenow')).toBe('43');
});

test('with both hidden it is a bar and still has a name', () => {
  render(<Uploading isLabelHidden isValueHidden />);

  expect(screen.getByRole('progressbar', { name: 'Uploading' })).toBeDefined();
  expect(screen.queryByText('43%')).toBeNull();
  /* The label is in the tree, out of sight, and the row above collapses. */
  expect(document.querySelector('.bb-progress-label')).not.toBeNull();
  expect(document.querySelector('.bb-progress')?.className).toContain('gap-0');
});

test('there is no indeterminate mode', () => {
  render(<Uploading />);

  /*
   * The base has one and this does not, because `Spinner` is the
   * indeterminate indicator (doc 01 §7). A bar with no `aria-valuenow` is how
   * the base says "indeterminate", so its presence is the assertion.
   */
  expect(bar().hasAttribute('aria-valuenow')).toBe(true);
});

test('and the prop for it is not on the surface', () => {
  /*
   * A TYPE ASSERTION, because the runtime one I wrote first proved nothing:
   * `'isIndeterminate' in ({} as Props)` is false for an empty object
   * whatever the type says, so it was green while checking nothing — doc 10
   * §6's own warning, arriving in a test written the same afternoon.
   *
   * `@ts-expect-error` fails the BUILD if the prop is ever added, which is the
   * only place this claim can be made: the surface is a type, so the check has
   * to be one.
   */
  render(
    <ConfigProvider>
      {/* @ts-expect-error there is no indeterminate mode; `Spinner` is it */}
      <Progress label="Uploading" value={43} isIndeterminate />
    </ConfigProvider>
  );

  expect(screen.getByRole('progressbar')).toBeDefined();
});

test('the format is the consumer to choose', () => {
  render(
    <Uploading
      value={0.43}
      maxValue={1}
      formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
    />
  );

  expect(screen.getByText('43%')).toBeDefined();
});

test('the class name lands on the outermost element only', () => {
  render(<Uploading className="placed" />);

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
});
