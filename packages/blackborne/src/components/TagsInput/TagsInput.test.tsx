/*
 * Doc 07 §11's checklist as tests, plus the four things that make this a
 * component rather than a TextField holding a comma-separated string: the
 * separators, the pasted block, Backspace on an empty box, and what happens to
 * a duplicate.
 *
 * The logic tests come first and render nothing at all. `splitTags` and
 * `acceptTags` are where the component's decisions actually live, and the
 * entry gate asks for exactly that — logic in pure functions, testable without
 * a renderer.
 *
 * What is NOT asserted here, and why:
 *
 *   - **Tab order.** jsdom does not implement it. Where focus goes when you
 *     Tab into a box that holds a grid and an input belongs to the catalog, in
 *     a browser.
 *   - **The wrapping box.** No stylesheet is loaded, so `display: contents`,
 *     the reserved trailing room and a tag row wrapping at 320px resolve to
 *     nothing here. Also the catalog's.
 *   - **The caret.** jsdom implements no selection rendering. It matters less
 *     for this field than for the others, because nothing is rewritten under
 *     the cursor (see the `normalize` prop).
 */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { normalize, upperCase, lowerCase, allowOnly } from '../../normalize';
import { TagsInput, acceptTags, splitTags } from './TagsInput';

// --- The logic, with nothing rendered ---------------------------------------

test('splitTags splits on all four separators', () => {
  expect(splitTags('a,b;c|d', undefined)).toEqual(['a', 'b', 'c', 'd']);
  // The newline is Enter arriving through the clipboard — a column copied out
  // of a spreadsheet.
  expect(splitTags('a\nb\r\nc', undefined)).toEqual(['a', 'b', 'c']);
});

test('splitTags trims each value and drops the empties', () => {
  expect(splitTags('  a , b ,, c ,', undefined)).toEqual(['a', 'b', 'c']);
  expect(splitTags('   ', undefined)).toEqual([]);
  expect(splitTags('', undefined)).toEqual([]);
});

test('splitTags normalizes after splitting, and drops what normalizes away', () => {
  expect(splitTags('ada, grace', upperCase)).toEqual(['ADA', 'GRACE']);
  // The order is the point (doc 07 §2.1): the separator has to survive the
  // split, so it is gone before a pipeline that would have eaten it runs.
  expect(splitTags('ab-1, ..., cd-2', allowOnly(/[a-z0-9]/u))).toEqual([
    'ab1',
    'cd2'
  ]);
});

test('acceptTags refuses duplicates and reports which', () => {
  expect(acceptTags(['a'], ['b', 'a', 'c'])).toEqual({
    accepted: ['b', 'c'],
    refused: ['a']
  });
  // Inside one block the first occurrence wins, so a pasted `a, b, a` does not
  // land twice.
  expect(acceptTags([], ['a', 'b', 'a'])).toEqual({
    accepted: ['a', 'b'],
    refused: ['a']
  });
});

// --- The field as a unit (doc 07 §4) ----------------------------------------

test('it works on its own, with no form and no library around it', () => {
  render(<TagsInput label="Tags" defaultValue={['alpha']} />);
  expect(screen.getByRole('textbox', { name: 'Tags' })).toBeTruthy();
  // The tag list carries the field's label too. A grid announced with no name
  // is a grid of unknown things.
  expect(screen.getByRole('grid', { name: 'Tags' })).toBeTruthy();
});

test('a visually hidden label still names the box', () => {
  render(<TagsInput label="Tags" isLabelHidden />);
  expect(screen.getByRole('textbox', { name: 'Tags' })).toBeTruthy();
});

test('the description is referenced by the box', () => {
  render(<TagsInput label="Tags" description="Press Enter after each one." />);

  const input = screen.getByRole('textbox');
  const described = input
    .getAttribute('aria-describedby')
    ?.split(' ')
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');
  expect(described).toContain('Press Enter after each one.');
});

test('the error is associated with the box and announced', () => {
  render(
    <TagsInput
      label="Tags"
      defaultValue={['alpha']}
      description="Press Enter after each one."
      isInvalid
      errorMessage="alpha is already on this record."
    />
  );

  const input = screen.getByRole('textbox');
  expect(input.getAttribute('aria-invalid')).toBe('true');

  const described = input
    .getAttribute('aria-describedby')
    ?.split(' ')
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');
  // Painted is not enough (doc 06 §3). And the description accompanies the
  // error rather than being replaced by it (doc 07 §4).
  expect(described).toContain('alpha is already on this record.');
  expect(screen.getByText('Press Enter after each one.')).toBeTruthy();
});

test('no error appears while typing into an untouched field', async () => {
  const user = userEvent.setup();
  render(
    <TagsInput label="Tags" isRequired errorMessage="Add at least one." />
  );

  await user.click(screen.getByRole('textbox'));
  await user.keyboard('a');

  // When an error is shown is the project's decision, expressed through
  // isInvalid (doc 07 §5).
  expect(screen.queryByText('Add at least one.')).toBeNull();
});

test('required is announced through the attribute, not just an asterisk', () => {
  render(<TagsInput label="Tags" isRequired />);
  expect(screen.getByRole('textbox').getAttribute('aria-required')).toBe(
    'true'
  );
});

test('a busy field announces itself instead of only drawing a spinner', () => {
  const { rerender } = render(<TagsInput label="Tags" isLoading />);
  expect(screen.getByText('Loading')).toBeTruthy();

  rerender(<TagsInput label="Tags" isSaving />);
  expect(screen.getByText('Saving')).toBeTruthy();

  rerender(<TagsInput label="Tags" />);
  expect(screen.queryByText('Saving')).toBeNull();
});

test('the ref reaches the box, which is what a consumer can focus', () => {
  const ref = createRef<HTMLInputElement>();
  render(<TagsInput label="Tags" ref={ref} />);
  expect(ref.current).toBe(screen.getByRole('textbox'));
});

// --- Committing a value -----------------------------------------------------

test('each separator commits what is before it', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagsInput label="Tags" onChange={onChange} />);

  const input = screen.getByRole('textbox');
  await user.type(input, 'alpha,beta;gamma|');

  expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta', 'gamma']);
  // Nothing is left over: every piece had a separator after it.
  expect(input).toHaveProperty('value', '');
});

test('Enter commits the draft, and an empty box leaves the key alone', async () => {
  const claimed: boolean[] = [];
  const user = userEvent.setup();

  render(
    /*
     * The level above, standing in for the form a tags field very often sits
     * inside. Doc 09 §8: Enter confirms the primary action of the CURRENT
     * level, which is the tag being typed — and when nothing is being typed,
     * the level above.
     *
     * Recorded as `defaultPrevented` rather than as "the parent heard it",
     * because a keydown bubbles either way. What matters is which level
     * CLAIMED the key: a submit that still happens after the field ate the
     * keystroke is the bug this guards.
     */
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      onKeyDown={event => {
        if (event.key === 'Enter') claimed.push(event.defaultPrevented);
      }}
    >
      <TagsInput label="Tags" />
    </div>
  );

  const input = screen.getByRole('textbox');
  await user.click(input);

  await user.keyboard('alpha{Enter}');
  expect(screen.getByRole('row', { name: /alpha/u })).toBeTruthy();
  expect(input).toHaveProperty('value', '');

  await user.keyboard('{Enter}');
  expect(claimed).toEqual([true, false]);
});

test('a value that is only whitespace commits nothing', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagsInput label="Tags" onChange={onChange} />);

  await user.type(screen.getByRole('textbox'), '   ,');
  expect(onChange).not.toHaveBeenCalled();
});

test('the normalizer runs on each value, not on the draft', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagsInput label="Tags" onChange={onChange} normalize={upperCase} />);

  const input = screen.getByRole('textbox');
  await user.type(input, 'ada');
  // Untouched while it is still being typed, which is what makes a pipeline
  // that would eat the separator safe to use here.
  expect(input).toHaveProperty('value', 'ada');

  await user.type(input, ',');
  expect(onChange).toHaveBeenLastCalledWith(['ADA']);
});

// --- Pasting a block --------------------------------------------------------

test('pasting a block splits it, including the last piece', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagsInput label="Tags" onChange={onChange} />);

  const input = screen.getByRole('textbox');
  await user.click(input);
  await user.paste('alpha, beta; gamma|delta');

  // The last piece is committed too, which is where a paste differs from
  // typing: a pasted block is finished, a typed one is still being typed.
  expect(onChange).toHaveBeenLastCalledWith([
    'alpha',
    'beta',
    'gamma',
    'delta'
  ]);
  expect(input).toHaveProperty('value', '');
});

test('a pasted block joins what was already half typed', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagsInput label="Tags" onChange={onChange} />);

  const input = screen.getByRole('textbox');
  await user.type(input, 'al');
  await user.paste('pha, beta');

  expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta']);
});

test('a paste with no separator in it is just text', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagsInput label="Tags" onChange={onChange} />);

  const input = screen.getByRole('textbox');
  await user.click(input);
  await user.paste('ada lovelace');

  expect(onChange).not.toHaveBeenCalled();
  expect(input).toHaveProperty('value', 'ada lovelace');
});

test('every pasted value goes through the normalizer', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput
      label="Tags"
      onChange={onChange}
      normalize={normalize(lowerCase)}
    />
  );

  await user.click(screen.getByRole('textbox'));
  await user.paste('ALPHA, Beta');

  expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta']);
});

// --- Removing ---------------------------------------------------------------

test('Backspace in an empty box removes the last tag', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput
      label="Tags"
      defaultValue={['alpha', 'beta']}
      onChange={onChange}
    />
  );

  const input = screen.getByRole('textbox');
  await user.click(input);
  await user.keyboard('{Backspace}');

  expect(onChange).toHaveBeenLastCalledWith(['alpha']);
  expect(screen.queryByRole('row', { name: /beta/u })).toBeNull();
});

test('Backspace with something typed edits the draft instead', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput label="Tags" defaultValue={['alpha']} onChange={onChange} />
  );

  const input = screen.getByRole('textbox');
  await user.type(input, 'xy{Backspace}');

  expect(input).toHaveProperty('value', 'x');
  expect(onChange).not.toHaveBeenCalled();
});

test('the cross is named from our dictionary and says which tag it removes', () => {
  const { unmount } = render(
    <TagsInput label="Tags" defaultValue={['alpha']} />
  );
  // "Remove" from the dictionary plus the tag beside it: in a row of tags
  // where every button announced itself as "Remove" and nothing else, a
  // screen reader user cannot tell which one they are on.
  expect(
    screen
      .getByRole('button', { name: /Remove/u })
      .getAttribute('aria-labelledby')
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Remove alpha' })).toBeTruthy();
  unmount();

  render(
    <ConfigProvider locale="es-PE" dictionary={{ remove: 'Quitar' }}>
      <TagsInput label="Etiquetas" defaultValue={['alpha']} />
    </ConfigProvider>
  );
  // Ours replaces the base's own localised name, so a project that translates
  // one key sees its word on every cross in the library rather than half.
  expect(screen.getByRole('button', { name: 'Quitar alpha' })).toBeTruthy();
});

test('pressing the cross removes that tag', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput
      label="Tags"
      defaultValue={['alpha', 'beta']}
      onChange={onChange}
    />
  );

  await user.click(screen.getByRole('button', { name: 'Remove alpha' }));
  expect(onChange).toHaveBeenLastCalledWith(['beta']);
});

test('Delete on a focused tag removes it, which is the base doing the work', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput
      label="Tags"
      defaultValue={['alpha', 'beta']}
      onChange={onChange}
    />
  );

  screen.getByRole('row', { name: /alpha/u }).focus();
  await user.keyboard('{Delete}');

  expect(onChange).toHaveBeenLastCalledWith(['beta']);
});

// --- Duplicates -------------------------------------------------------------

test('a duplicate is refused and reported rather than dropped in silence', async () => {
  const onChange = vi.fn();
  const onDuplicate = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput
      label="Tags"
      defaultValue={['alpha']}
      onChange={onChange}
      onDuplicate={onDuplicate}
    />
  );

  const input = screen.getByRole('textbox');
  await user.type(input, 'alpha,');

  expect(onChange).not.toHaveBeenCalled();
  expect(onDuplicate).toHaveBeenCalledWith('alpha');
  // The box is cleared exactly as an accepted value clears it, so committing
  // never leaves half a value behind. Saying what happened is the project's,
  // through the callback above.
  expect(input).toHaveProperty('value', '');
  expect(screen.getAllByRole('row')).toHaveLength(1);
});

test('the normalizer is the duplicate policy', async () => {
  const onDuplicate = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput
      label="Tags"
      defaultValue={['ada']}
      normalize={lowerCase}
      onDuplicate={onDuplicate}
    />
  );

  // Case-insensitivity is not built in — "the same word" is a locale question.
  // A project asks for it by making the stored values canonical.
  await user.type(screen.getByRole('textbox'), 'ADA,');
  expect(onDuplicate).toHaveBeenCalledWith('ada');
});

test('a pasted block reports each duplicate and keeps the rest', async () => {
  const onChange = vi.fn();
  const onDuplicate = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput
      label="Tags"
      defaultValue={['alpha']}
      onChange={onChange}
      onDuplicate={onDuplicate}
    />
  );

  await user.click(screen.getByRole('textbox'));
  await user.paste('alpha, beta, beta, gamma');

  expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta', 'gamma']);
  expect(onDuplicate).toHaveBeenCalledTimes(2);
  expect(onDuplicate).toHaveBeenNthCalledWith(1, 'alpha');
  expect(onDuplicate).toHaveBeenNthCalledWith(2, 'beta');
});

// --- Controlled and uncontrolled (doc 02 §8) --------------------------------

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <TagsInput label="A" value={['fixed']} onChange={onChange} />
  );
  await user.type(screen.getByRole('textbox'), 'more,');
  expect(onChange).toHaveBeenLastCalledWith(['fixed', 'more']);
  // Controlled means controlled: nothing changed until the consumer applied it.
  expect(screen.getAllByRole('row')).toHaveLength(1);
  unmount();

  render(<TagsInput label="B" defaultValue={['alpha']} />);
  await user.type(screen.getByRole('textbox'), 'beta,');
  expect(screen.getAllByRole('row')).toHaveLength(2);
});

// --- The states that are almost always confused (doc 07 §6) -----------------

test('disabled and read-only behave differently', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <TagsInput label="A" value={['alpha']} onChange={onChange} isDisabled />
  );
  expect(screen.getByRole('textbox').hasAttribute('disabled')).toBe(true);
  unmount();

  render(
    <TagsInput label="B" value={['alpha']} onChange={onChange} isReadOnly />
  );
  const readOnly = screen.getByRole('textbox');
  // Read-only shows a value you can read, select and copy; disabled says this
  // does not apply right now.
  expect(readOnly.hasAttribute('disabled')).toBe(false);
  expect(readOnly.getAttribute('readonly')).not.toBeNull();
  // And a read-only tag is still reachable, because a tag you cannot reach is
  // a tag you cannot copy.
  expect(screen.getByRole('row', { name: /alpha/u })).toBeTruthy();

  await user.type(readOnly, 'beta,');
  expect(onChange).not.toHaveBeenCalled();
});

test('neither disabled nor read-only offers a cross', () => {
  const { rerender } = render(
    <TagsInput label="Tags" defaultValue={['alpha']} isDisabled />
  );
  expect(screen.queryByRole('button')).toBeNull();

  rerender(<TagsInput label="Tags" defaultValue={['alpha']} isReadOnly />);
  expect(screen.queryByRole('button')).toBeNull();

  rerender(<TagsInput label="Tags" defaultValue={['alpha']} />);
  expect(screen.getByRole('button', { name: 'Remove alpha' })).toBeTruthy();
});

test('Backspace does not remove a tag from a read-only field', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput label="Tags" value={['alpha']} onChange={onChange} isReadOnly />
  );

  await user.click(screen.getByRole('textbox'));
  await user.keyboard('{Backspace}');
  expect(onChange).not.toHaveBeenCalled();
});

test('busy makes the cross unreachable without closing the space behind it', () => {
  // Doc 07 §2.2 rule 1: unreachable, not absent. `aria-hidden` is the half a
  // test with no stylesheet can see; the width it keeps is the catalog's.
  const { rerender } = render(
    <TagsInput label="Tags" defaultValue={['alpha']} isLoading />
  );
  expect(screen.queryByRole('button')).toBeNull();
  expect(document.querySelector('[inert]')).not.toBeNull();

  rerender(<TagsInput label="Tags" defaultValue={['alpha']} isSaving />);
  expect(screen.queryByRole('button')).toBeNull();

  // And it comes back when the field is idle again, still named.
  rerender(<TagsInput label="Tags" defaultValue={['alpha']} />);
  expect(screen.getByRole('button', { name: 'Remove alpha' })).toBeTruthy();
  expect(document.querySelector('[inert]')).toBeNull();
});

test('busy refuses Backspace too, because the field cannot honour it', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <TagsInput label="Tags" value={['alpha']} onChange={onChange} isSaving />
  );

  await user.click(screen.getByRole('textbox'));
  await user.keyboard('{Backspace}');
  expect(onChange).not.toHaveBeenCalled();
});

// --- Escape belongs to the level above (doc 09 §8) --------------------------

test('Escape is not swallowed', async () => {
  const onParentKeyDown = vi.fn();
  const user = userEvent.setup();

  render(
    // A tags field inside a dialog must let Escape reach the dialog. The tag
    // list has no selection to clear, so the base passes the key on.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div onKeyDown={onParentKeyDown}>
      <TagsInput label="Tags" defaultValue={['alpha']} />
    </div>
  );

  await user.click(screen.getByRole('textbox'));
  await user.keyboard('{Escape}');
  expect(onParentKeyDown).toHaveBeenCalled();
});
