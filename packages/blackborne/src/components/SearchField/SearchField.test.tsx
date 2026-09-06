/*
 * Doc 07 §11's checklist, as tests, plus the two things that make this a
 * component rather than a TextField with a cross on the end: the role and what
 * Escape does.
 *
 * What is NOT asserted here, and why: the clear button is hidden while the
 * field is empty, disabled or read-only by CSS keyed off the base's own state
 * attributes. jsdom loads no stylesheet, so the element is still in the DOM in
 * these tests and asserting its absence would prove the opposite of what it
 * looked like it proved. That one belongs to the catalog, in a browser.
 *
 * The busy case IS asserted, because busy removes the button from the tree
 * rather than hiding it — which is exactly what doc 07 §2.2 asks for.
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { SearchField } from './SearchField';

test('it works on its own, with no form and no library around it', () => {
  render(<SearchField label="Filter customers" />);
  // A searchbox, not a textbox. The role is the component (see the file).
  expect(
    screen.getByRole('searchbox', { name: 'Filter customers' })
  ).toBeTruthy();
});

test('the label is associated with the control', () => {
  render(<SearchField label="Filter customers" />);
  const input = screen.getByLabelText('Filter customers');
  expect(input.tagName).toBe('INPUT');
});

test('a visually hidden label still names the control', () => {
  render(<SearchField label="Filter customers" isLabelHidden />);
  expect(
    screen.getByRole('searchbox', { name: 'Filter customers' })
  ).toBeTruthy();
});

test('the description is referenced by the control', () => {
  render(
    <SearchField label="Filter" description="Matches name and reference." />
  );

  const input = screen.getByRole('searchbox');
  const describedBy = input.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();

  const described = describedBy
    ?.split(' ')
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');
  expect(described).toContain('Matches name and reference.');
});

test('the error is associated with the control and announced', () => {
  render(
    <SearchField
      label="Filter"
      isInvalid
      errorMessage="Use three or more characters."
    />
  );

  const input = screen.getByRole('searchbox');
  expect(input.getAttribute('aria-invalid')).toBe('true');

  const describedBy = input.getAttribute('aria-describedby');
  const described = describedBy
    ?.split(' ')
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');
  // Painted is not enough. A red message that exists only visually does not
  // exist for someone who cannot see it (doc 06 §3).
  expect(described).toContain('Use three or more characters.');
});

test('the description survives an error rather than being replaced', () => {
  render(
    <SearchField
      label="Filter"
      description="Matches name and reference."
      isInvalid
      errorMessage="Use three or more characters."
    />
  );
  expect(screen.getByText('Matches name and reference.')).toBeTruthy();
  expect(screen.getByText('Use three or more characters.')).toBeTruthy();
});

test('no error appears while typing into an untouched field', async () => {
  const user = userEvent.setup();
  render(<SearchField label="Filter" isRequired errorMessage="Required." />);

  await user.click(screen.getByRole('searchbox'));
  await user.keyboard('a');

  // When an error is shown is the project's decision, expressed through
  // isInvalid (doc 07 §5).
  expect(screen.queryByText('Required.')).toBeNull();
});

test('required is announced through the attribute, not just an asterisk', () => {
  render(<SearchField label="Filter" isRequired />);
  expect(screen.getByRole('searchbox').getAttribute('aria-required')).toBe(
    'true'
  );
});

test('disabled and read-only behave differently', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <SearchField label="A" isDisabled value="ada" onChange={onChange} />
  );
  expect(screen.getByRole('searchbox').hasAttribute('disabled')).toBe(true);
  unmount();

  render(<SearchField label="B" isReadOnly value="ada" onChange={onChange} />);
  const readOnly = screen.getByRole('searchbox');
  // Read-only shows a value you can read, select and copy; disabled says this
  // does not apply right now (doc 07 §6).
  expect(readOnly.hasAttribute('disabled')).toBe(false);
  expect(readOnly.getAttribute('readonly')).not.toBeNull();

  await user.type(readOnly, 'more');
  expect(onChange).not.toHaveBeenCalled();
});

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <SearchField label="A" value="fixed" onChange={onChange} />
  );
  await user.type(screen.getByRole('searchbox'), 'x');
  expect(onChange).toHaveBeenCalled();
  expect(screen.getByRole('searchbox')).toHaveProperty('value', 'fixed');
  unmount();

  render(<SearchField label="B" defaultValue="ada" />);
  await user.type(screen.getByRole('searchbox'), '!');
  expect(screen.getByRole('searchbox')).toHaveProperty('value', 'ada!');
});

test('a busy field announces itself instead of only drawing a spinner', () => {
  const { rerender } = render(<SearchField label="Filter" isLoading />);
  expect(screen.getByText('Loading')).toBeTruthy();

  rerender(<SearchField label="Filter" isSaving />);
  expect(screen.getByText('Saving')).toBeTruthy();

  rerender(<SearchField label="Filter" />);
  expect(screen.queryByText('Saving')).toBeNull();
});

test('it is reachable by keyboard, and the ref reaches the input', async () => {
  const ref = createRef<HTMLInputElement>();
  const user = userEvent.setup();
  render(<SearchField label="Filter" ref={ref} />);

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('searchbox'));
  expect(ref.current).toBe(screen.getByRole('searchbox'));
});

// --- The clear button -------------------------------------------------------

test('the clear button is named from the dictionary, and a project can translate it', () => {
  const { unmount } = render(<SearchField label="Filter" defaultValue="ada" />);
  expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy();
  unmount();

  render(
    <ConfigProvider locale="es-PE" dictionary={{ clear: 'Limpiar' }}>
      <SearchField label="Filtrar" defaultValue="ada" />
    </ConfigProvider>
  );
  // The base ships its own localised "Clear search"; ours replaces it, so a
  // project that translates one key sees its word here too (doc 05 §2.2).
  expect(screen.getByRole('button', { name: 'Limpiar' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
});

test('pressing clear empties the value and reports it', async () => {
  const onClear = vi.fn();
  const user = userEvent.setup();
  render(<SearchField label="Filter" defaultValue="ada" onClear={onClear} />);

  await user.click(screen.getByRole('button', { name: 'Clear' }));

  expect(screen.getByRole('searchbox')).toHaveProperty('value', '');
  // Not the same event as onChange: a listing dropping its filter is
  // something the screen around the field reacts to.
  expect(onClear).toHaveBeenCalledTimes(1);
});

test('the clear button is outside the tab order, because Escape is the route', async () => {
  const user = userEvent.setup();
  render(<SearchField label="Filter" defaultValue="ada" />);

  expect(
    screen.getByRole('button', { name: 'Clear' }).getAttribute('tabindex')
  ).toBe('-1');

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('searchbox'));
  await user.tab();
  // Tab leaves the field rather than landing on the cross. Doc 09 §8: Tab
  // moves to the next CONTROL, and the query is cancelled with Escape.
  expect(document.activeElement).not.toBe(
    screen.getByRole('button', { name: 'Clear' })
  );
});

test('the clear button is not rendered at all while the field is busy', () => {
  // Doc 07 §2.2, rule 1: busy wins outright. Offering to clear a value that is
  // mid-flight offers an action the field cannot honour, and doc 06 §4 point 7
  // says a control that cannot act is worse than one that is absent.
  const { rerender } = render(
    <SearchField label="Filter" defaultValue="ada" isLoading />
  );
  expect(screen.queryByRole('button')).toBeNull();

  rerender(<SearchField label="Filter" defaultValue="ada" isSaving />);
  expect(screen.queryByRole('button')).toBeNull();

  // And it comes back when the field is idle again, still named.
  rerender(<SearchField label="Filter" defaultValue="ada" />);
  expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy();
});

// --- Escape, which is the actual reason this is a component -----------------

test('Escape cancels the query and reports it, exactly like the button', async () => {
  const onClear = vi.fn();
  const user = userEvent.setup();
  render(<SearchField label="Filter" defaultValue="ada" onClear={onClear} />);

  await user.click(screen.getByRole('searchbox'));
  await user.keyboard('{Escape}');

  expect(screen.getByRole('searchbox')).toHaveProperty('value', '');
  expect(onClear).toHaveBeenCalledTimes(1);
});

test('Escape on an empty field is left to whatever is around it', async () => {
  const onParentKeyDown = vi.fn();
  const user = userEvent.setup();

  // Standing in for the dialog a search field very often sits inside. Doc 09
  // §8: Escape cancels ONE level at a time — the query if there is one, and
  // the dialog if there is not. A field that swallowed the key regardless
  // would be the exception that costs the other components their credibility.
  render(
    // A listener standing in for the level above, not a control: what is
    // being tested is which level the key reaches, not this element.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div onKeyDown={onParentKeyDown}>
      <SearchField label="Filter" defaultValue="ada" />
    </div>
  );

  const input = screen.getByRole('searchbox');
  await user.click(input);

  await user.keyboard('{Escape}');
  expect(input).toHaveProperty('value', '');
  expect(onParentKeyDown).not.toHaveBeenCalled();

  await user.keyboard('{Escape}');
  expect(onParentKeyDown).toHaveBeenCalled();
});

test('Enter confirms the query with no form present', async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<SearchField label="Filter" defaultValue="ada" onSubmit={onSubmit} />);

  await user.click(screen.getByRole('searchbox'));
  await user.keyboard('{Enter}');

  // Doc 09 §8: Enter confirms the primary action of the current context, and
  // here that is the search. The value is not cleared by confirming it.
  expect(onSubmit).toHaveBeenCalledWith('ada');
  expect(screen.getByRole('searchbox')).toHaveProperty('value', 'ada');
});
