/*
 * What holds without a browser: the field, the format that crosses back, and
 * what is inside the layer.
 *
 * NOT HERE: dragging in the area, the gradients, and the thumb's two rings.
 * The first needs a pointer with coordinates, and the other two are paint —
 * `apps/catalog/e2e/color-picker.spec.ts` and the baselines have them.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ColorPicker } from './ColorPicker';
import { ConfigProvider } from '../../config';

const picker = (
  props: Partial<React.ComponentProps<typeof ColorPicker>> = {}
) =>
  render(
    <ConfigProvider>
      <ColorPicker label="Brand colour" defaultValue="#3e63dd" {...props} />
    </ConfigProvider>
  );

/** Opens the layer the way a person does, rather than through a prop. */
const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Brand colour/ }));
  return screen.getByRole('dialog');
};

test('it is a named field showing the colour it holds', () => {
  picker();

  const trigger = screen.getByRole('button', { name: /Brand colour/ });

  expect(trigger).toBeDefined();
  expect(trigger.textContent).toContain('#3E63DD');
});

test('the format decides what is shown and what crosses back', async () => {
  const onChange = vi.fn();

  picker({ format: 'rgb', onChange });

  /*
   * DECISION 0024'S `format` PROP, and this is the component it exists for: a
   * value dragged out of an area was never one of the inputs, so there is no
   * string to report verbatim the way the palette does.
   */
  expect(
    screen.getByRole('button', { name: /Brand colour/ }).textContent
  ).toContain('rgb(62, 99, 221)');

  await open();
  /*
   * BY ROLE AND NAME, and the first version of this used
   * `layer.querySelector('input')` — which picked one of the colour AREA's two
   * hidden range inputs and failed with "clear() is only supported on editable
   * elements". The area is two sliders in one element, and they come first in
   * the layer.
   */
  const hex = screen.getByRole('textbox', { name: 'Colour value' });

  await userEvent.clear(hex);
  await userEvent.type(hex, '#e5484d');
  await userEvent.tab();

  expect(onChange).toHaveBeenCalledWith('rgb(229, 72, 77)');
});

test('a format that cannot carry transparency says so', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  picker({ hasAlpha: true, format: 'hex' });

  /*
   * Measured, and decision 0024's fourth finding: `#3e63dd80` reported as
   * `hex` comes back `#3E63DD`, with no error anywhere. Said rather than
   * forbidden — a project may legitimately want the opaque value.
   */
  expect(warn.mock.calls.join(' ')).toContain('cannot carry it');

  warn.mockRestore();
});

test('and the alpha slider is there only when it is offered', async () => {
  const { unmount } = picker();
  await open();

  /*
   * COUNTED IN THE DOM, and the two ways of counting disagree — which is worth
   * writing down rather than working around.
   *
   * The base's controls are native `<input type="range">` elements: they have
   * the slider role IMPLICITLY and carry no `role` attribute, so a
   * `[role=slider]` query finds nothing at all (the same lesson `Slider`'s
   * tests record about `aria-valuenow`). And `getAllByRole('slider')` reports
   * TWO where the DOM has three, because the colour area exposes one of its
   * two axes to the accessibility tree and hides the other.
   *
   * THREE AND FOUR, not one and two: the area is two inputs, one per axis,
   * which is what makes it operable from a keyboard at all. So the DOM count
   * is 2 + hue, then 2 + hue + alpha. What a READER gets is the browser
   * check's question, with an aria snapshot.
   */
  expect(document.querySelectorAll('input[type=range]')).toHaveLength(3);

  unmount();
  picker({ hasAlpha: true, format: 'hexa' });
  await open();

  expect(document.querySelectorAll('input[type=range]')).toHaveLength(4);
});

test('the layer holds a typed route as well as the gradients', async () => {
  picker();
  const layer = await open();

  /*
   * Four ways in, and the field is the one somebody who knows the hex uses.
   * Its name comes from the dictionary: the area and the sliders are named by
   * the base, which knows the channel names in every locale, and a plain
   * field has nothing to derive a name from.
   */
  expect(screen.getByRole('textbox', { name: 'Colour value' })).toBeDefined();
  expect(layer.querySelector('.bb-color-picker-area')).not.toBeNull();
});

test('and the typed route is dropped where it cannot carry the value', async () => {
  picker({ hasAlpha: true, format: 'hexa' });
  await open();

  /*
   * THE BASE'S HEX FIELD SPEAKS SIX DIGITS AND NOTHING ELSE — read in
   * `useColorFieldState`: it formats with `toString('hex')` and parses by
   * building `#RRGGBB` from a clamped integer. So with transparency offered it
   * would show an opaque colour and, worse, typing in it would REPORT one: the
   * alpha is replaced rather than preserved.
   *
   * A control that cannot express the value is not offered. The area, the hue
   * and the transparency slider are all still there, and all three work from
   * a keyboard.
   */
  expect(screen.queryByRole('textbox', { name: 'Colour value' })).toBeNull();
  expect(document.querySelectorAll('input[type=range]')).toHaveLength(4);
});

test('a colour it cannot read warns and falls back', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  picker({ defaultValue: 'not-a-colour' });

  expect(warn.mock.calls.join(' ')).toContain('is not a colour');
  /* The base's own fallback is black, which is a colour: there is no empty. */
  expect(
    screen.getByRole('button', { name: /Brand colour/ }).textContent
  ).toContain('#000000');

  warn.mockRestore();
});

test('it always holds a colour, so nothing can clear it', () => {
  render(
    <ConfigProvider>
      {/* @ts-expect-error a colour picker has no empty state (see the docs) */}
      <ColorPicker label="Brand colour" value={null} />
    </ConfigProvider>
  );

  /*
   * ASSERTED WITH THE TYPE CHECKER, because the base's shape is what decides
   * it: a two-dimensional area always points somewhere, so
   * `useColorPickerState` falls back to `#000000` and its setter refuses null
   * — measured. Where "no colour" is a real state it belongs to something
   * beside this field.
   */
  expect(screen.getByRole('button', { name: /Brand colour/ })).toBeDefined();
});

test('the description is referenced by the control', () => {
  picker({ description: 'Used across the whole workspace' });

  const trigger = screen.getByRole('button', { name: /Brand colour/ });
  const id = trigger.getAttribute('aria-describedby');

  expect(id).not.toBeNull();
  expect(document.getElementById(id ?? '')?.textContent).toBe(
    'Used across the whole workspace'
  );
});

test('a hidden label still names it', () => {
  picker({ isLabelHidden: true });

  expect(screen.getByRole('button', { name: /Brand colour/ })).toBeDefined();
});

test('the class name lands on the outermost element only', () => {
  picker({ className: 'placed' });

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
  expect(document.querySelector('.placed')?.classList).toContain(
    'bb-color-picker'
  );
});
