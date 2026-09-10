/*
 * What holds without a browser: the name, the number, the description's
 * association, and the absence of an invalid state.
 *
 * NOT HERE: the keyboard and the drag. A slider's control is a range input,
 * and jsdom implements neither the arrow keys a browser gives that element nor
 * a pointer with coordinates — so where the value goes when somebody presses
 * End, and whether the track can be pressed at all, are in
 * `apps/catalog/e2e/slider.spec.ts`.
 */
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ConfigProvider } from '../../config';
import { Slider } from './Slider';

const one = (props: Partial<React.ComponentProps<typeof Slider>> = {}) =>
  render(
    <ConfigProvider>
      <Slider label="Opacity" defaultValue={40} {...props} />
    </ConfigProvider>
  );

test('it is a named group holding one named slider', () => {
  one();

  /*
   * The base renders `role="group"` round the whole thing and `role="slider"`
   * on the input inside it, both named by the same label. That is the base's
   * arrangement rather than ours, and it is asserted because the label has to
   * reach BOTH: a group with a name and an unnamed slider in it is the state a
   * hidden label used to produce.
   */
  expect(screen.getByRole('group', { name: 'Opacity' })).toBeDefined();
  expect(screen.getByRole('slider', { name: 'Opacity' })).toBeDefined();
});

test('a hidden label still names it', () => {
  one({ isLabelHidden: true });

  /*
   * BY NAME, because `getByRole` alone passes either way — the failure this
   * catches is a control with no accessible name at all, which `Progress`
   * shipped in its first draft by rendering a plain span instead of the base's
   * `Label`.
   */
  expect(screen.getByRole('group', { name: 'Opacity' })).toBeDefined();
  expect(screen.getByRole('slider', { name: 'Opacity' })).toBeDefined();
});

test('the number is shown, formatted, and can be dropped', () => {
  const { unmount } = one({ maxValue: 100 });

  expect(screen.getByText('40')).toBeDefined();

  unmount();
  one({ maxValue: 100, isValueHidden: true });

  expect(screen.queryByText('40')).toBeNull();
  /*
   * And nothing is lost by dropping it: the FORMATTED value is on the control
   * itself, which is why this is removed rather than visually hidden.
   *
   * `aria-valuetext` and not `aria-valuenow` — measured, and the reason is the
   * element: the base's control is a native `<input type="range">`, which
   * carries the raw number in `value` and no `aria-valuenow` at all. The
   * formatted string is the one a reader says.
   */
  const control = screen.getByRole('slider');
  expect(control.getAttribute('aria-valuetext')).toBe('40');
  expect(control.getAttribute('value')).toBe('40');
});

test('the format comes from the options and the locale', () => {
  /*
   * `step` is not decoration here. The base SNAPS the initial value to the
   * step, and the default step is 1 — measured: 0.4 on a 0..1 range with no
   * step given reports 0, so a percentage slider that forgot the step would
   * show 0% and look broken rather than misconfigured.
   */
  one({
    defaultValue: 0.4,
    maxValue: 1,
    step: 0.01,
    formatOptions: { style: 'percent' }
  });

  expect(screen.getByText('40%')).toBeDefined();
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('40%');
});

test('the description is referenced by the control', () => {
  one({ description: 'Higher values cost more to render' });

  /*
   * The base wires a description for its own field containers and NOT for a
   * slider — measured: it publishes the state, the track, the output and the
   * label, and no text context at all. So the attribute is filled in here, and
   * a description nobody references does not exist for a screen reader.
   */
  const control = screen.getByRole('slider');
  const id = control.getAttribute('aria-describedby');

  expect(id).not.toBeNull();
  expect(document.getElementById(id ?? '')?.textContent).toBe(
    'Higher values cost more to render'
  );
});

test('and it references nothing when there is nothing to point at', () => {
  one();

  /*
   * EMPTY RATHER THAN ABSENT, and that is the base's doing rather than ours:
   * measured, it puts `aria-describedby=""` and `aria-details=""` on the
   * control unconditionally. So the attribute cannot be made to disappear from
   * here, and what matters is that it references nothing — which an empty
   * value does.
   */
  const described = screen.getByRole('slider').getAttribute('aria-describedby');

  expect(described === null || described === '').toBe(true);
});

test('it holds one value and refuses an array', () => {
  /*
   * A RANGE IS NOT A PROP, it is a second shape, and it is not built. Asserted
   * with the type checker rather than at run time, so adding an array to the
   * signature fails the build rather than passing quietly — the same way
   * `Progress` proves it has no indeterminate mode.
   *
   * When a range does arrive it arrives as a discriminated union, the way
   * `ComboBox` holds several values.
   */
  render(
    <ConfigProvider>
      {/* @ts-expect-error a slider holds one number, not two */}
      <Slider label="Price" defaultValue={[10, 20]} />
    </ConfigProvider>
  );

  expect(screen.getAllByRole('slider')).toHaveLength(1);
});

test('it has no invalid state to present', () => {
  render(
    <ConfigProvider>
      {/* @ts-expect-error a value clamped to its range cannot be wrong */}
      <Slider label="Opacity" errorMessage="Too high" />
    </ConfigProvider>
  );

  expect(screen.queryByText('Too high')).toBeNull();
});

test('the class name lands on the outermost element only', () => {
  one({ className: 'placed' });

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
  expect(document.querySelector('.placed')?.classList).toContain('bb-slider');
});

test('a disabled slider says so on the control', () => {
  one({ isDisabled: true });

  /*
   * On the control rather than on the group: `aria-disabled` on a wrapper is
   * not what a reader checks before offering the arrow keys.
   */
  expect(screen.getByRole('slider').hasAttribute('disabled')).toBe(true);
});
