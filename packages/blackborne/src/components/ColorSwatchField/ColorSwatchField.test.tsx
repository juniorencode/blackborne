/*
 * What holds without a browser: the list, the name, and the string that
 * crosses back.
 *
 * NOT HERE: the arrows moving in two dimensions, the ring that marks the
 * chosen swatch, and whether a swatch clears the minimum target. All three are
 * in `apps/catalog/e2e/color-swatch-field.spec.ts` — the first because jsdom
 * has no layout to move around in, the other two because they are CSS.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ColorSwatchField } from './ColorSwatchField';

const PALETTE = ['#3e63dd', '#e5484d', '#30a46c'] as const;

const field = (
  props: Partial<React.ComponentProps<typeof ColorSwatchField>> = {}
) =>
  render(<ColorSwatchField label="Label colour" colors={PALETTE} {...props} />);

test('it is a named list with one swatch per colour', () => {
  field();

  expect(screen.getByRole('listbox', { name: 'Label colour' })).toBeDefined();
  expect(screen.getAllByRole('option')).toHaveLength(3);
});

test('a hidden label still names it', () => {
  field({ isLabelHidden: true });

  expect(screen.getByRole('listbox', { name: 'Label colour' })).toBeDefined();
});

test('every swatch is named by the platform rather than by us', () => {
  field();

  /*
   * The base names each swatch with `color.getColorName(locale)`, which is
   * localised and is not something this library's dictionary can reach
   * (doc 05 §2.3). Measured, `#3e63dd` is announced as "dark vibrant blue".
   *
   * Asserted by ROLE AND NAME rather than by reading an attribute, and the
   * first version of this test did the latter and failed: the option itself
   * carries no `aria-label` at all — its name is computed from the swatch
   * inside it, which is the `role="img"` the base renders. A crude
   * `getAttribute('aria-label') ?? textContent` saw nothing and concluded the
   * swatches were nameless.
   *
   * The words themselves are not pinned: they are the platform's colour
   * vocabulary, and a test that spelled them out would be asserting a
   * browser's.
   */
  expect(screen.getAllByRole('option', { name: /.+/ })).toHaveLength(3);

  /*
   * And a role description, also the base's own string: a reader hears "color
   * swatch" rather than "option", which is the difference between a list of
   * choices and a list of colours.
   */
  for (const option of screen.getAllByRole('option'))
    expect(
      option
        .querySelector('[aria-roledescription]')
        ?.getAttribute('aria-roledescription')
    ).toBe('color swatch');
});

test('the chosen colour is the one marked, in any spelling', () => {
  field({ value: 'rgb(62, 99, 221)' });

  /*
   * `#3e63dd` is what the palette declares and `rgb(62, 99, 221)` is what the
   * consumer holds — one colour written two ways. The comparison is the form
   * both agree on, so the right swatch lights up rather than none.
   */
  const chosen = screen
    .getAllByRole('option')
    .filter(one => one.getAttribute('aria-selected') === 'true');

  expect(chosen).toHaveLength(1);
  expect(chosen[0]?.getAttribute('data-selected')).toBe('true');
});

test('and choosing one reports the string the palette declared', async () => {
  const onChange = vi.fn();

  field({ colors: ['#3e63dd', '#E5484D'], onChange });

  await userEvent.click(screen.getAllByRole('option')[1]!);

  /*
   * DECISION 0024'S EXCEPTION, and the whole reason this component has no
   * `format` prop. The base reports a `Color`, and `toString()` on it would
   * have given `rgba(229, 72, 77, 1)` — measured. What crosses back is the
   * consumer's own string, in the consumer's own case.
   */
  expect(onChange).toHaveBeenCalledWith('#E5484D');
  expect(onChange).not.toHaveBeenCalledWith('#e5484d');
});

test('a colour it cannot read is dropped, and it says so', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  field({ colors: ['#3e63dd', 'not-a-colour', '#30a46c'] });

  /*
   * Dropped rather than rendered as black: a palette that silently gained a
   * wrong swatch is worse than one missing the entry somebody mistyped, and
   * the warning names the string.
   */
  expect(screen.getAllByRole('option')).toHaveLength(2);
  expect(warn.mock.calls.join(' ')).toContain('is not a colour');

  warn.mockRestore();
});

test('a value outside the palette marks nothing, and says so', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  field({ value: '#ffffff' });

  const chosen = screen
    .getAllByRole('option')
    .filter(one => one.getAttribute('aria-selected') === 'true');

  expect(chosen).toHaveLength(0);
  expect(warn.mock.calls.join(' ')).toContain('not one of the colours');

  warn.mockRestore();
});

test('the description is referenced by the list', () => {
  field({ description: 'Used on the board and in exports' });

  const list = screen.getByRole('listbox');
  const id = list.getAttribute('aria-describedby');

  expect(id).not.toBeNull();
  expect(document.getElementById(id ?? '')?.textContent).toBe(
    'Used on the board and in exports'
  );
});

test('an error is shown only while it is invalid', () => {
  const { unmount } = field({ errorMessage: 'Choose a colour' });
  expect(screen.queryByText('Choose a colour')).toBeNull();

  unmount();
  field({ errorMessage: 'Choose a colour', isInvalid: true });
  expect(screen.getByText('Choose a colour')).toBeDefined();
});

test('and the error reaches a reader through the description', () => {
  field({ errorMessage: 'Choose a colour', isInvalid: true });

  const list = screen.getByRole('listbox');

  /*
   * NOT `aria-invalid`, WHICH WAS TRIED AND MEASURED. The base forwards a
   * picker's props through `filterDOMProps(props, { labelable: true })`, and
   * that filter passes exactly four attributes: `aria-label`,
   * `aria-labelledby`, `aria-describedby` and `aria-details`. `aria-invalid`
   * is dropped, silently.
   *
   * So this is the channel that works, and it is asserted rather than assumed
   * — a red message nobody is pointed at is doc 06 §3's colour-alone failure
   * arriving through an omission.
   */
  expect(list.hasAttribute('aria-invalid')).toBe(false);

  const referenced = (list.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map(one => document.getElementById(one)?.textContent)
    .filter(Boolean);

  expect(referenced).toContain('Choose a colour');
});

test('the class name lands on the outermost element only', () => {
  field({ className: 'placed' });

  expect(document.querySelectorAll('.placed')).toHaveLength(1);
  expect(document.querySelector('.placed')?.classList).toContain(
    'bb-color-swatch-field'
  );
});
