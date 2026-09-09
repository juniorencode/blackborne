/*
 * The half that holds without a browser: what the field announces, what the
 * list contains after each keystroke, and the two behaviours that came out of
 * measuring the base rather than trusting it.
 *
 * Not here: the box. Whether the list is as wide as the field, whether the
 * chevron turns, and whether the toggle is a target of the size doc 06 §3
 * requires are questions about a rendered box, so they are measured in
 * `apps/catalog/e2e/combobox.spec.ts`.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConfigProvider } from '../../config';
import { ComboBox, ComboBoxItem, type ComboBoxSeveralProps } from './ComboBox';

const Doctors = (props: Partial<Parameters<typeof ComboBox>[0]> = {}) => (
  <ComboBox label="Doctor" {...props}>
    <ComboBoxItem id="ruiz" keywords={['cardiology']}>
      José Ruiz
    </ComboBoxItem>
    <ComboBoxItem id="vega" keywords={['paediatrics', 'neonatology']}>
      Ana Vega
    </ComboBoxItem>
    <ComboBoxItem id="salas">Luis Salas</ComboBoxItem>
  </ComboBox>
);

/*
 * Every row the list is showing, INCLUDING the one that says there are none.
 *
 * Measured rather than expected: the base gives its empty state a row of its
 * own, so a list that matched nothing is a list with one option in it reading
 * "No results". That is the base being right — a listbox with no rows at all
 * announces nothing, and the person who typed is the one who needs to hear the
 * answer — so these assertions name that row rather than filtering it out.
 */
const rows = () => screen.queryAllByRole('option').map(row => row.textContent);

test('it is a labelled combo box with a toggle beside it', () => {
  render(<Doctors />);

  expect(screen.getByRole('combobox', { name: 'Doctor' })).toBeDefined();
  /*
   * The toggle's name is the BASE's, from its own localised strings — doc 05
   * §2.3's line: an instruction about how a widget works is not a string a
   * project would want to rewrite, so it is not in our dictionary.
   *
   * And it is COMPOSED, which is measured rather than expected: the base gives
   * the button `aria-label="Show suggestions"` and then an `aria-labelledby`
   * pointing at itself and at the field's label, so the name a reader hears is
   * "Show suggestions Doctor" — which field's suggestions, said once. Every
   * query below matches loosely for that reason.
   */
  expect(
    screen.getByRole('button', { name: 'Show suggestions Doctor' })
  ).toBeDefined();
});

test('the list is closed until it is asked for', () => {
  render(<Doctors />);

  expect(screen.queryByRole('listbox')).toBeNull();
});

test('the toggle opens the whole list', async () => {
  const user = userEvent.setup();
  render(<Doctors />);

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));

  expect(rows()).toEqual(['José Ruiz', 'Ana Vega', 'Luis Salas']);
});

test('typing narrows it', async () => {
  const user = userEvent.setup();
  render(<Doctors />);

  await user.type(screen.getByRole('combobox'), 'vega');

  expect(rows()).toEqual(['Ana Vega']);
});

/*
 * THE FEATURE THIS COMPONENT EXISTS FOR, and the reason its filtering is not
 * the base's: the base's filter callback receives the row's text and never the
 * row, so a word that is not in the label has nowhere to live.
 */
test('an option is found by a keyword it does not display', async () => {
  const user = userEvent.setup();
  render(<Doctors />);

  await user.type(screen.getByRole('combobox'), 'cardio');

  expect(rows()).toEqual(['José Ruiz']);
});

test('and the keyword is not announced as part of the row', async () => {
  const user = userEvent.setup();
  render(<Doctors />);

  await user.type(screen.getByRole('combobox'), 'cardio');

  // The row is named by what it says. A keyword is a way in, not a label.
  expect(screen.getByRole('option', { name: 'José Ruiz' })).toBeDefined();
});

test('accents and capitals make no difference to what is found', async () => {
  const user = userEvent.setup();
  render(<Doctors />);

  await user.type(screen.getByRole('combobox'), 'jose');

  expect(rows()).toEqual(['José Ruiz']);
});

test('a query that matches nothing says so instead of closing', async () => {
  const user = userEvent.setup();
  render(<Doctors />);

  await user.type(screen.getByRole('combobox'), 'zzz');

  /*
   * The base closes a list that filtered to nothing; this one is told not to.
   * A list that vanishes leaves the person who typed with no answer at all,
   * where a row saying so is the difference doc 09 draws between "there is no
   * data" and "your query found none".
   */
  expect(rows()).toEqual(['No results']);
  expect(screen.getByRole('listbox')).toBeDefined();
});

test('while the options are still arriving, the empty list says loading', async () => {
  const user = userEvent.setup();
  render(
    <ComboBox label="Doctor" isLoading>
      {[]}
    </ComboBox>
  );

  await user.type(screen.getByRole('combobox'), 'a');

  /*
   * The ROW, named specifically, because the word appears twice on the screen
   * and the two are different things: `Field` announces "Loading" through a
   * live region the moment the field becomes busy — doc 06 §3's "announced
   * once, by whoever caused the change" — and this is a row in a list somebody
   * opened, read when they arrive at it. A list that said "No results" while
   * its options were still on their way would be answering a question nobody
   * had asked yet.
   */
  expect(screen.getByRole('option', { name: 'Loading' })).toBeDefined();
});

test('choosing an option reports its id and shows its text', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(<Doctors onSelectionChange={onSelectionChange} />);

  await user.type(screen.getByRole('combobox'), 'cardio');
  await user.click(screen.getByRole('option', { name: 'José Ruiz' }));

  expect(onSelectionChange).toHaveBeenCalledWith('ruiz');
  /*
   * And the field reads the row's own text, not the keyword that found it.
   * Measured on the base while designing this: extra words in `textValue` DO
   * filter and are not announced, but the base writes `textValue` into the
   * input on selection — so "Ruiz cardiology" would have ended up in the box.
   * That measurement is why the keywords are kept out of the collection.
   */
  expect(screen.getByRole<HTMLInputElement>('combobox').value).toBe(
    'José Ruiz'
  );
});

/*
 * THE BEHAVIOUR THAT HAD TO BE REPRODUCED FROM OUTSIDE.
 *
 * The base shows every option again when the list is reopened after a
 * selection, using a private `showAllItems` flag. Measured on the base: three
 * declared, one chosen, reopened, three shown. With the filtering moved out of
 * the base, that flag is unreachable — so this asserts the behaviour rather
 * than the mechanism, and it fails if the rule that replaces it stops working.
 */
test('after choosing, the toggle shows every option again', async () => {
  const user = userEvent.setup();
  render(<Doctors />);

  await user.type(screen.getByRole('combobox'), 'cardio');
  await user.click(screen.getByRole('option', { name: 'José Ruiz' }));
  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));

  expect(rows()).toEqual(['José Ruiz', 'Ana Vega', 'Luis Salas']);
});

test('and editing the text filters again from there', async () => {
  const user = userEvent.setup();
  render(<Doctors />);

  await user.type(screen.getByRole('combobox'), 'cardio');
  await user.click(screen.getByRole('option', { name: 'José Ruiz' }));

  // One character removed: the text is no longer the chosen option's own.
  await user.type(screen.getByRole('combobox'), '{Backspace}');

  expect(rows()).toEqual(['José Ruiz']);
});

test('the chosen option is marked as selected in the list', async () => {
  const user = userEvent.setup();
  render(<Doctors defaultSelectedKey="vega" />);

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));

  expect(
    screen
      .getByRole('option', { name: 'Ana Vega' })
      .getAttribute('aria-selected')
  ).toBe('true');
});

/*
 * DECISION 0017 ASKED FOR THIS TO BE MEASURED RATHER THAN ASSUMED.
 *
 * `Select` composes a visually hidden word into its label, because the base
 * puts nothing about required on the button a person operates. The honest
 * expectation for a combo box was that it needs none of that, and the answer
 * turned out to depend on something the record did not mention: with the
 * base's default validation behaviour the input carries the NATIVE `required`
 * attribute and no `aria-required` at all. Every field in this library sets
 * `validationBehavior="aria"`, and with it the attribute arrives.
 *
 * So this asserts the attribute rather than the absence of a word: if a base
 * upgrade moves it back to the native one, the browser's own bubble returns
 * with it and this says so.
 */
test('required is announced by the input itself, with no word composed in', () => {
  render(<Doctors isRequired />);

  const input = screen.getByRole('combobox');
  expect(input.getAttribute('aria-required')).toBe('true');
  expect(input.getAttribute('required')).toBeNull();
  // And the name is the label alone — nothing is said twice.
  expect(screen.getByRole('combobox', { name: 'Doctor' })).toBeDefined();
});

test('invalid is announced, and the message is related to the field', () => {
  render(<Doctors isInvalid errorMessage="Choose a doctor" />);

  const input = screen.getByRole('combobox');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByText('Choose a doctor')).toBeDefined();
  expect(input.getAttribute('aria-describedby')).toBeTruthy();
});

test('disabled switches off the field and its toggle', () => {
  render(<Doctors isDisabled />);

  expect(screen.getByRole('combobox').getAttribute('disabled')).not.toBeNull();
  expect(
    screen
      .getByRole('button', { name: /Show suggestions/ })
      .getAttribute('disabled')
  ).not.toBeNull();
});

test('read-only keeps the value readable and does not open', async () => {
  const user = userEvent.setup();
  render(<Doctors defaultSelectedKey="vega" isReadOnly />);

  const input = screen.getByRole<HTMLInputElement>('combobox');
  expect(input.value).toBe('Ana Vega');
  expect(input.getAttribute('readonly')).not.toBeNull();

  await user.click(input);
  await user.keyboard('{ArrowDown}');

  expect(screen.queryByRole('listbox')).toBeNull();
});

test('the keyboard opens the list, moves through it and chooses', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(<Doctors onSelectionChange={onSelectionChange} />);

  await user.tab();
  await user.keyboard('{ArrowDown}');
  expect(screen.getByRole('listbox')).toBeDefined();

  /*
   * `ArrowDown` opens the list AND focuses the first option — measured on
   * `Menu`, where an extra key press asserted focus on the row it had just
   * left. So the second press moves to the second option.
   */
  await user.keyboard('{ArrowDown}{Enter}');

  expect(onSelectionChange).toHaveBeenCalledWith('vega');
});

test('Escape closes the list and leaves the value alone', async () => {
  const user = userEvent.setup();
  render(<Doctors defaultSelectedKey="salas" />);

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));
  await user.keyboard('{Escape}');

  expect(screen.queryByRole('listbox')).toBeNull();
  expect(screen.getByRole<HTMLInputElement>('combobox').value).toBe(
    'Luis Salas'
  );
});

test('a disabled option is present and cannot be chosen', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(
    <ComboBox label="Doctor" onSelectionChange={onSelectionChange}>
      <ComboBoxItem id="ruiz">José Ruiz</ComboBoxItem>
      <ComboBoxItem id="vega" isDisabled>
        Ana Vega
      </ComboBoxItem>
    </ComboBox>
  );

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));
  await user.click(screen.getByRole('option', { name: 'Ana Vega' }));

  expect(onSelectionChange).not.toHaveBeenCalled();
});

/*
 * The constraint every declaration carries, and the one that cost `Tabs` a
 * story that rendered nothing: a component of the consumer's own returning a
 * declaration is one element of their type, and nothing about it says option.
 */
test('a component of your own returning options is reported, not read', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const user = userEvent.setup();

  const Ours = () => (
    <>
      <ComboBoxItem id="ruiz">José Ruiz</ComboBoxItem>
      <ComboBoxItem id="vega">Ana Vega</ComboBoxItem>
    </>
  );

  render(
    <ComboBox label="Doctor">
      <Ours />
    </ComboBox>
  );

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));

  /*
   * Nothing was read, so the list holds nothing but its own empty row — and
   * that row says the list was given no options rather than blaming a query
   * nobody typed.
   */
  expect(rows()).toEqual(['Nothing here yet']);
  expect(warn).toHaveBeenCalled();
  expect(warn.mock.calls[0]?.[0]).toContain('ComboBoxItem');
  warn.mockRestore();
});

test('but a fragment of them is read, because that is how JSX is written', async () => {
  const user = userEvent.setup();
  render(
    <ComboBox label="Doctor">
      <>
        <ComboBoxItem id="ruiz">José Ruiz</ComboBoxItem>
        <ComboBoxItem id="vega">Ana Vega</ComboBoxItem>
      </>
    </ComboBox>
  );

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));

  expect(rows()).toEqual(['José Ruiz', 'Ana Vega']);
});

test('an option with no text to search is reported in development', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  render(
    <ComboBox label="Doctor">
      <ComboBoxItem id="ruiz">
        <strong>José Ruiz</strong>
      </ComboBoxItem>
    </ComboBox>
  );

  expect(warn).toHaveBeenCalled();
  expect(warn.mock.calls[0]?.[0]).toContain('no text to');
  warn.mockRestore();
});

test('and one with a textValue is not', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  render(
    <ComboBox label="Doctor">
      <ComboBoxItem id="ruiz" textValue="José Ruiz">
        <strong>José Ruiz</strong>
      </ComboBoxItem>
    </ComboBox>
  );

  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

test('the empty state text comes from the dictionary', async () => {
  const user = userEvent.setup();
  render(
    <ConfigProvider dictionary={{ emptyStateNoResults: 'Sin resultados' }}>
      <Doctors />
    </ConfigProvider>
  );

  await user.type(screen.getByRole('combobox'), 'zzz');

  expect(screen.getByText('Sin resultados')).toBeDefined();
});

test('it needs no provider', () => {
  render(<Doctors />);

  expect(screen.getByRole('combobox', { name: 'Doctor' })).toBeDefined();
});

/*
 * The third answer an empty list can give, and the reason there are three:
 * doc 09 asks for the distinction by name.
 */
test('a list that was given no options says so, not "no results"', async () => {
  const user = userEvent.setup();
  render(<ComboBox label="Doctor">{[]}</ComboBox>);

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));

  // "Nothing here yet", not "No results": nobody has typed anything, and
  // blaming a query for an empty prop is the wrong answer to the wrong person.
  expect(
    screen.getByRole('option', { name: 'Nothing here yet' })
  ).toBeDefined();
});

test('and one whose options found nothing blames the query', async () => {
  const user = userEvent.setup();
  render(<Doctors />);

  await user.type(screen.getByRole('combobox'), 'zzz');

  expect(screen.getByRole('option', { name: 'No results' })).toBeDefined();
});

/* ------------------------------------------------------------------ several
 *
 * The same component holding more than one value, which changes the shape of
 * the value rather than adding a flag — so the props are a union and the wrong
 * pairing does not compile.
 *
 * The chips are NOT the base's tags, and that is measured rather than chosen:
 * a `TagGroup` inside a `ComboBox` resolves the combo box's own list state and
 * either exhausts the heap or throws. So each chip is a span with a button,
 * and the announcement comes from `ComboBoxValue` — which the base points the
 * input's `aria-describedby` at.
 */

const Team = (props: Partial<ComboBoxSeveralProps> = {}) => (
  <ComboBox label="Doctors" selectionMode="multiple" {...props}>
    <ComboBoxItem id="ruiz" keywords={['cardiology']}>
      José Ruiz
    </ComboBoxItem>
    <ComboBoxItem id="vega" keywords={['paediatrics']}>
      Ana Vega
    </ComboBoxItem>
    <ComboBoxItem id="salas">Luis Salas</ComboBoxItem>
  </ComboBox>
);

const chips = () =>
  [...document.querySelectorAll('.bb-value-chip')].map(chip =>
    chip.textContent?.trim()
  );

const crosses = () => screen.queryAllByRole('button', { name: /Remove/ });

test('with nothing chosen there are no chips', () => {
  render(<Team />);

  expect(chips()).toEqual([]);
  expect(screen.getByRole('combobox', { name: 'Doctors' })).toBeDefined();
});

test('choosing two keeps both, and reports them in order', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(<Team onSelectionChange={onSelectionChange} />);

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));
  await user.click(screen.getByRole('option', { name: 'Ana Vega' }));
  await user.click(screen.getByRole('option', { name: 'Luis Salas' }));

  expect(onSelectionChange).toHaveBeenLastCalledWith(['vega', 'salas']);
  expect(chips()).toEqual(['Ana Vega', 'Luis Salas']);
});

/*
 * MEASURED ON THE BASE, and it is the behaviour that makes choosing several
 * bearable: the input empties itself and the list stays open, so the next one
 * is one press away rather than a reopen and a retype.
 */
test('the input empties after each choice and the list stays open', async () => {
  const user = userEvent.setup();
  render(<Team />);

  const input = screen.getByRole<HTMLInputElement>('combobox');
  await user.type(input, 'vega');
  await user.click(screen.getByRole('option', { name: 'Ana Vega' }));

  expect(input.value).toBe('');
  expect(screen.getByRole('listbox')).toBeDefined();
});

/*
 * WHAT A READER HEARS, and the reason the chips did not need to be a grid.
 *
 * `ComboBoxValue` renders the chosen values as text and the base points the
 * input's `aria-describedby` at it — measured. So the values are announced
 * when the field is reached, and the chips are the same value seen rather than
 * heard.
 */
test('the chosen values are announced through the field itself', async () => {
  const user = userEvent.setup();
  render(<Team defaultSelectedKeys={['vega']} />);

  const input = screen.getByRole('combobox');
  const describedBy = input.getAttribute('aria-describedby') ?? '';
  expect(describedBy).not.toBe('');

  const described = describedBy
    .split(' ')
    .map(id => document.getElementById(id)?.textContent ?? '')
    .join(' ');
  expect(described).toContain('Ana Vega');

  // And it keeps up: a second value joins the same text.
  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));
  await user.click(screen.getByRole('option', { name: 'Luis Salas' }));

  const after = (input.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map(id => document.getElementById(id)?.textContent ?? '')
    .join(' ');
  expect(after).toContain('Luis Salas');
});

test('and a description of its own is still announced with them', () => {
  render(<Team defaultSelectedKeys={['vega']} description="Pick a rota." />);

  const described = (
    screen.getByRole('combobox').getAttribute('aria-describedby') ?? ''
  )
    .split(' ')
    .map(id => document.getElementById(id)?.textContent ?? '')
    .join(' ');

  expect(described).toContain('Ana Vega');
  expect(described).toContain('Pick a rota.');
});

test('the list says which rows are already chosen', async () => {
  const user = userEvent.setup();
  render(<Team defaultSelectedKeys={['vega']} />);

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));

  const marked = screen
    .getAllByRole('option')
    .filter(row => row.getAttribute('aria-selected') === 'true')
    .map(row => row.textContent);

  expect(marked).toEqual(['Ana Vega']);
  // The base declares the list itself, which is what a reader needs to hear.
  expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe(
    'true'
  );
});

test('a chip is removed by its cross, and the rest are reported', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(
    <Team
      defaultSelectedKeys={['vega', 'salas']}
      onSelectionChange={onSelectionChange}
    />
  );

  await user.click(crosses()[0]!);

  expect(onSelectionChange).toHaveBeenCalledWith(['salas']);
  expect(chips()).toEqual(['Luis Salas']);
});

/*
 * The cross is named by REFERENCES rather than by a glued string: its own
 * "Remove" and the element holding the value, in document order. Doc 05 §2.2
 * rule 5 forbids building the sentence, and this is how the base composes the
 * same name inside a tag.
 */
test('each cross says which value it removes', () => {
  render(<Team defaultSelectedKeys={['vega', 'salas']} />);

  expect(screen.getByRole('button', { name: 'Remove Ana Vega' })).toBeDefined();
  expect(
    screen.getByRole('button', { name: 'Remove Luis Salas' })
  ).toBeDefined();
});

/*
 * The keyboard, and what it lost. A `TagGroup` would have given an arrow-key
 * walk along the chips and `Delete` on the focused one; it cannot be used
 * here. What is left is plainer and complete: every cross is in the tab order
 * and answers `Enter`.
 */
test('a chip is removed from the keyboard, through its cross', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(
    <Team
      defaultSelectedKeys={['vega', 'salas']}
      onSelectionChange={onSelectionChange}
    />
  );

  crosses()[1]!.focus();
  await user.keyboard('{Enter}');

  expect(onSelectionChange).toHaveBeenCalledWith(['vega']);
});

test('removing the last one reports an empty list rather than nothing', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(
    <Team
      defaultSelectedKeys={['vega']}
      onSelectionChange={onSelectionChange}
    />
  );

  await user.click(crosses()[0]!);

  /*
   * `[]` and not `undefined`: a consumer holding the value in their own state
   * has to be able to see the last one go, which is the same argument that
   * makes the single mode report `null`.
   */
  expect(onSelectionChange).toHaveBeenCalledWith([]);
  expect(chips()).toEqual([]);
});

test('a controlled field shows what it is given and nothing else', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(
    <Team selectedKeys={['vega']} onSelectionChange={onSelectionChange} />
  );

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));
  await user.click(screen.getByRole('option', { name: 'Luis Salas' }));

  // Reported, and not shown: a controlled value stays its owner's to decide.
  expect(onSelectionChange).toHaveBeenCalledWith(['vega', 'salas']);
  expect(chips()).toEqual(['Ana Vega']);
});

test('typing still narrows the list, keywords included', async () => {
  const user = userEvent.setup();
  render(<Team />);

  await user.type(screen.getByRole('combobox'), 'cardio');

  expect(rows()).toEqual(['José Ruiz']);
});

test('a chosen id with no option behind it keeps its own id as the chip', () => {
  /*
   * Which happens legitimately while the options are still arriving. A chip
   * that is not drawn is a value nobody can remove, so it is drawn with what
   * is known about it.
   */
  render(<Team defaultSelectedKeys={['unknown-id']} />);

  expect(chips()).toEqual(['unknown-id']);
});

test('read-only keeps the chips readable and takes their crosses away', () => {
  render(<Team defaultSelectedKeys={['vega']} isReadOnly />);

  expect(chips()).toEqual(['Ana Vega']);
  expect(crosses()).toEqual([]);
});

test('and disabled does the same, with the field switched off', () => {
  render(<Team defaultSelectedKeys={['vega']} isDisabled />);

  expect(chips()).toEqual(['Ana Vega']);
  expect(crosses()).toEqual([]);
  expect(screen.getByRole('combobox').getAttribute('disabled')).not.toBeNull();
});

test('while saving, a cross is present and out of reach', () => {
  render(<Team defaultSelectedKeys={['vega']} isSaving />);

  /*
   * Doc 07 §2.2 rule 1, inside the chip: hidden from the reader and
   * unfocusable, and still taking its width — a cross that disappeared would
   * re-wrap every chip behind it at the moment somebody is waiting.
   */
  expect(crosses()).toEqual([]);
  expect(document.querySelector('.bb-value-chip-remove')).not.toBeNull();
});

test('it needs no provider in this mode either', () => {
  render(<Team defaultSelectedKeys={['vega']} />);

  expect(screen.getByRole('combobox', { name: 'Doctors' })).toBeDefined();
});

/*
 * FOUND BY AXE, and it is a real one rather than a rule being pedantic.
 *
 * While the list is open the base hides everything outside it from a reader —
 * the chips included — and a cross that stayed in the tab order would be a
 * control somebody could reach and never be told about. So while the list is
 * open the crosses are inert, and they stay visible: nothing moves.
 */
test('while the list is open, a chip cross is out of the tab order', async () => {
  const user = userEvent.setup();
  render(<Team defaultSelectedKeys={['vega']} />);

  const cross = document.querySelector('.bb-value-chip-remove');
  expect(cross).not.toBeNull();
  expect(cross!.closest('[inert]')).toBeNull();

  await user.click(screen.getByRole('button', { name: /Show suggestions/ }));

  expect(cross!.closest('[inert]')).not.toBeNull();
  /*
   * And still visible, because taking its room away would re-wrap the chips.
   * Asserted through the class list rather than a selector: the class carries
   * the library's colon prefix, and escaping it in a selector is the kind of
   * thing that quietly matches nothing.
   */
  expect(cross!.parentElement?.className.includes('bb:invisible')).toBe(false);
});
