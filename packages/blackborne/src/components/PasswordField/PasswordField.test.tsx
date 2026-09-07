/*
 * Doc 07 §11's checklist, as tests, plus the two things that are this field's
 * alone: a toggle whose NAME changes with its state, and a trailing control
 * that does not give way to the busy state when every other one does.
 *
 * One thing to know before reading any of these: an `input[type=password]` has
 * no accessible role at all, so `getByRole('textbox')` finds nothing here.
 * Every query goes through the label, which is the stronger assertion anyway —
 * it only passes if the label is really associated with the control.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { PasswordField } from './PasswordField';

/**
 * Every query for the control goes through its label. Two details, and both
 * are about this component rather than about testing:
 *
 * - the match is a SUBSTRING, because a required field's asterisk is part of
 *   the label's text content — decoration for the eye, hidden from the reader,
 *   and still text to a query (doc 07 §4)
 * - restricted to the `input`, because the reveal toggle's own accessible name
 *   contains the word "password" too, which is the point of it
 */
const field = (label: string): HTMLInputElement =>
  screen.getByLabelText<HTMLInputElement>(label, {
    exact: false,
    selector: 'input'
  });

const show = () => screen.getByRole('button', { name: 'Show password' });
const hide = () => screen.getByRole('button', { name: 'Hide password' });

test('it works on its own, and the value starts masked', () => {
  render(<PasswordField label="Password" />);

  const input = field('Password');
  expect(input.tagName).toBe('INPUT');
  expect(input.type).toBe('password');
});

test('a visually hidden label still names the control', () => {
  render(<PasswordField label="Password" isLabelHidden />);
  expect(field('Password')).toBeTruthy();
});

test('the description is referenced by the control', () => {
  render(
    <PasswordField label="Password" description="At least twelve characters." />
  );

  const input = field('Password');
  const describedBy = input.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();

  const described = describedBy
    ?.split(' ')
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');
  expect(described).toContain('At least twelve characters.');
});

test('the error is associated with the control and announced', () => {
  render(
    <PasswordField
      label="Password"
      isInvalid
      errorMessage="That is not the password we have on file."
    />
  );

  const input = field('Password');
  expect(input.getAttribute('aria-invalid')).toBe('true');

  const describedBy = input.getAttribute('aria-describedby');
  const described = describedBy
    ?.split(' ')
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');
  // Painted is not enough. A red message that exists only visually does not
  // exist for someone who cannot see it (doc 06 §3).
  expect(described).toContain('That is not the password we have on file.');
});

test('the description survives an error rather than being replaced', () => {
  render(
    <PasswordField
      label="Password"
      description="At least twelve characters."
      isInvalid
      errorMessage="Too short."
    />
  );
  // Doc 07 §4: help text is persistent; the error accompanies it.
  expect(screen.getByText('At least twelve characters.')).toBeTruthy();
  expect(screen.getByText('Too short.')).toBeTruthy();
});

test('no error appears while typing into an untouched field', async () => {
  const user = userEvent.setup();
  render(
    <PasswordField label="Password" isRequired errorMessage="Required." />
  );

  await user.click(field('Password'));
  await user.keyboard('a');

  // Blaming somebody for not having finished typing is hostile, and when an
  // error appears is the project's decision (doc 07 §5).
  expect(screen.queryByText('Required.')).toBeNull();
});

test('required is announced through the attribute, not just an asterisk', () => {
  render(<PasswordField label="Password" isRequired />);
  expect(field('Password').getAttribute('aria-required')).toBe('true');
});

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <PasswordField label="A" value="fixed" onChange={onChange} />
  );
  await user.type(field('A'), 'x');
  expect(onChange).toHaveBeenCalled();
  expect(field('A')).toHaveProperty('value', 'fixed');
  unmount();

  render(<PasswordField label="B" defaultValue="start" />);
  await user.type(field('B'), '!');
  expect(field('B')).toHaveProperty('value', 'start!');
});

test('a busy field announces itself instead of only drawing a spinner', () => {
  const { rerender } = render(<PasswordField label="Password" isLoading />);
  expect(screen.getByText('Loading')).toBeTruthy();

  rerender(<PasswordField label="Password" isSaving />);
  expect(screen.getByText('Saving')).toBeTruthy();

  rerender(<PasswordField label="Password" />);
  expect(screen.queryByText('Saving')).toBeNull();
});

test('the ref reaches the input, and the keyboard reaches both controls', async () => {
  const ref = createRef<HTMLInputElement>();
  const user = userEvent.setup();
  render(<PasswordField label="Password" ref={ref} />);

  const input = field('Password');
  expect(ref.current).toBe(input);

  await user.tab();
  expect(document.activeElement).toBe(input);
  // The toggle is after the control in the DOM and at the trailing edge
  // visually, so traversal order matches what is on screen (doc 06 §3).
  await user.tab();
  expect(document.activeElement).toBe(show());
});

/*
 * The reveal toggle. Everything below here is what makes this field different
 * from TextField.
 */

test('the toggle unmasks the value, and its NAME changes with the state', async () => {
  const user = userEvent.setup();
  render(<PasswordField label="Password" defaultValue="correct horse" />);

  const input = field('Password');

  /*
   * `getByRole(..., { name })` computes the accessible name the way a reader
   * would — through the accname algorithm, so it is the aria-label that is
   * being asserted and not merely an attribute that happens to be present.
   * The svg is aria-hidden, so it contributes nothing to the name.
   *
   * What no test in this environment can assert is how a reader SAYS it. That
   * is the screen-reader layer of doc 06 §5 and it needs NVDA.
   */
  expect(show().getAttribute('aria-pressed')).toBe('false');

  await user.click(show());

  expect(input.type).toBe('text');
  // Named for what pressing will do next, not for what it just did.
  expect(hide().getAttribute('aria-pressed')).toBe('true');
  expect(screen.queryByRole('button', { name: 'Show password' })).toBeNull();

  await user.click(hide());

  expect(input.type).toBe('password');
  expect(show().getAttribute('aria-pressed')).toBe('false');
  // The value is untouched throughout: revealing shows it, it does not edit it.
  expect(input.value).toBe('correct horse');
});

test('it is a toggle rather than an action, from the base', () => {
  render(<PasswordField label="Password" />);
  /*
   * `aria-pressed` is what says a control has an on and an off, and it comes
   * from the base's ToggleButton rather than from a hand-written attribute
   * (doc 06 §2: roles and ARIA are the first column and are not
   * reimplemented). This asserts the wiring, not React Aria.
   */
  expect(show().getAttribute('aria-pressed')).not.toBeNull();
});

test('the toggle works by keyboard', async () => {
  const user = userEvent.setup();
  render(<PasswordField label="Password" defaultValue="secret" />);

  await user.tab();
  await user.tab();
  await user.keyboard('{Enter}');

  expect(field('Password').type).toBe('text');
  /*
   * And focus stays on the toggle, which is the opposite of the clear button.
   * The cross hands focus back to the field because it has just made itself
   * unreachable; this control is still there and re-masking is the obvious
   * next press, so taking focus away would cost a tab to get back to it.
   */
  expect(document.activeElement).toBe(hide());
});

test('it reveals while the field is read-only', async () => {
  const user = userEvent.setup();
  const user2 = userEvent.setup();
  render(<PasswordField label="Password" defaultValue="secret" isReadOnly />);

  const input = field('Password');
  await user.click(show());

  /*
   * A read-only password is still a value somebody may need to check, and
   * revealing it changes nothing about it — doc 07 §6's own distinction:
   * read-only shows a value you can read, select and copy.
   */
  expect(input.type).toBe('text');
  expect(input.value).toBe('secret');

  await user2.type(input, 'more');
  expect(input.value).toBe('secret');
});

test('the toggle survives a busy field, where the cross would not', () => {
  /*
   * Doc 07 §2.2 rule 2, and the one place this field differs from every other:
   * busy takes the trailing edge from the clear button and the stepper, and
   * does NOT take it from here. Removing this control removes a capability
   * rather than an affordance — the value stops being readable at all.
   *
   * `queryByRole` is the assertion that matters, because "unreachable" in this
   * library means aria-hidden and inert rather than absent. A toggle that
   * merely looked present would still answer a class-name check.
   */
  const { rerender } = render(
    <PasswordField label="Password" defaultValue="secret" isLoading />
  );
  expect(show(), 'loading').toBeTruthy();
  expect(show().hasAttribute('disabled')).toBe(false);

  rerender(<PasswordField label="Password" defaultValue="secret" isSaving />);
  expect(show(), 'saving').toBeTruthy();
  expect(show().hasAttribute('disabled')).toBe(false);
});

test('it still reveals while the field is saving', async () => {
  const user = userEvent.setup();
  render(<PasswordField label="Password" defaultValue="secret" isSaving />);

  await user.click(show());
  expect(field('Password').type).toBe('text');
});

test('the toggle is disabled with the field, and read-only is not the same', async () => {
  const user = userEvent.setup();

  const { unmount } = render(
    <PasswordField label="A" defaultValue="secret" isDisabled />
  );
  const disabled = screen.getByRole('button', { name: 'Show password' });
  /*
   * Disabled and read-only are the two states doc 07 §6 says must not behave
   * the same, and the toggle is where this field expresses the difference:
   * read-only means "read it", so revealing is that state's own affordance;
   * disabled means "this does not apply right now", so nothing inside the box
   * acts.
   *
   * Disabled rather than removed, so it keeps its width and nothing shifts
   * when a field is enabled — and the reason it cannot be pressed is visible
   * in the field around it (doc 06 §4, point 7).
   */
  expect(disabled.hasAttribute('disabled')).toBe(true);
  await user.click(disabled);
  expect(field('A').type).toBe('password');
  unmount();

  render(<PasswordField label="B" defaultValue="secret" isReadOnly />);
  expect(
    screen
      .getByRole('button', { name: 'Show password' })
      .hasAttribute('disabled')
  ).toBe(false);
});

test('the toggle takes its name from the dictionary, in the active language', async () => {
  const user = userEvent.setup();
  render(
    <ConfigProvider
      locale="es-PE"
      dictionary={{
        showPassword: 'Mostrar la contraseña',
        hidePassword: 'Ocultar la contraseña'
      }}
    >
      <PasswordField label="Contraseña" defaultValue="secreto" />
    </ConfigProvider>
  );

  const button = screen.getByRole('button', { name: 'Mostrar la contraseña' });
  await user.click(button);
  // Both halves are translated, or the button changes language mid-press.
  expect(
    screen.getByRole('button', { name: 'Ocultar la contraseña' })
  ).toBeTruthy();
});

test('pasting into the field is not blocked', async () => {
  /*
   * A permanent "never", and the measurement is the reason: NIST SP 800-63B
   * says a verifier SHOULD permit paste, because blocking it breaks password
   * managers and people fall back to a short secret they can retype. This test
   * exists so that reaching for `onPaste` fails here first.
   */
  const user = userEvent.setup();
  render(<PasswordField label="Password" />);

  const input = field('Password');
  await user.click(input);
  await user.paste('a long generated secret');

  expect(input.value).toBe('a long generated secret');
});

test('the trailing edge holds one control and no more', () => {
  /*
   * Doc 07 §2.2 rule 4: at most one library-owned control at a time. There is
   * no clear button, no stepper and no affix to compete with the toggle, so
   * the field's hit areas do not depend on how it was configured — which is
   * the thing rule 4 exists to keep testable.
   */
  render(<PasswordField label="Password" defaultValue="secret" />);
  expect(screen.getAllByRole('button')).toHaveLength(1);
});
