/*
 * The group is the unit here. What is worth asserting is the two-level label
 * structure and the keyboard convention — a set of radios is ONE tab stop and
 * the arrows move within it, which is what doc 09 §8 fixes across the library.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Radio, RadioGroup } from './RadioGroup';

const options = (
  <>
    <Radio value="standard">Standard</Radio>
    <Radio value="express">Express</Radio>
    <Radio value="pickup">Pickup</Radio>
  </>
);

const describedText = (el: HTMLElement) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map(id => document.getElementById(id)?.textContent)
    .join(' | ');

test('it works on its own, with no form around it', () => {
  render(<RadioGroup label="Delivery">{options}</RadioGroup>);
  expect(screen.getByRole('radiogroup', { name: 'Delivery' })).toBeTruthy();
  expect(screen.getAllByRole('radio')).toHaveLength(3);
});

test('the group has a label and each option has its own', () => {
  render(<RadioGroup label="Delivery">{options}</RadioGroup>);
  // Two levels of label is what this component adds to the field model.
  expect(screen.getByRole('radiogroup', { name: 'Delivery' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Express' })).toBeTruthy();
});

test('a hidden group label still names the group', () => {
  render(
    <RadioGroup label="Delivery" isLabelHidden>
      {options}
    </RadioGroup>
  );
  expect(screen.getByRole('radiogroup', { name: 'Delivery' })).toBeTruthy();
});

test('the description reaches the group and every option', () => {
  render(
    <RadioGroup label="Delivery" description="Express costs more.">
      {options}
    </RadioGroup>
  );

  expect(describedText(screen.getByRole('radiogroup'))).toContain(
    'Express costs more.'
  );
  // The base references it from each radio too, which is why nothing is
  // supplied by hand here — unlike a lone checkbox.
  for (const radio of screen.getAllByRole('radio')) {
    expect(describedText(radio)).toContain('Express costs more.');
  }
});

test('the error reaches the group, and only while invalid', () => {
  const { rerender } = render(
    <RadioGroup label="Delivery" errorMessage="Choose a delivery method.">
      {options}
    </RadioGroup>
  );
  expect(screen.queryByText('Choose a delivery method.')).toBeNull();

  rerender(
    <RadioGroup
      label="Delivery"
      isInvalid
      errorMessage="Choose a delivery method."
    >
      {options}
    </RadioGroup>
  );

  const group = screen.getByRole('radiogroup');
  expect(group.getAttribute('aria-invalid')).toBe('true');
  expect(describedText(group)).toContain('Choose a delivery method.');
});

test('the description survives an error rather than being replaced', () => {
  render(
    <RadioGroup
      label="Delivery"
      isInvalid
      description="Express costs more."
      errorMessage="Choose a delivery method."
    >
      {options}
    </RadioGroup>
  );
  const described = describedText(screen.getByRole('radiogroup'));
  expect(described).toContain('Express costs more.');
  expect(described).toContain('Choose a delivery method.');
});

test('required is announced on the group, not on each option', () => {
  render(
    <RadioGroup label="Delivery" isRequired>
      {options}
    </RadioGroup>
  );
  expect(screen.getByRole('radiogroup').getAttribute('aria-required')).toBe(
    'true'
  );
});

test('the whole group is one tab stop', async () => {
  const user = userEvent.setup();
  render(
    <>
      <RadioGroup label="Delivery">{options}</RadioGroup>
      <button type="button">After</button>
    </>
  );

  await user.tab();
  expect(screen.getAllByRole('radio')[0]).toHaveProperty('tabIndex', 0);

  // One more Tab leaves the group entirely rather than moving to option two.
  await user.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'After' })
  );
});

test('arrows move within the group and select as they go', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <RadioGroup label="Delivery" onChange={onChange}>
      {options}
    </RadioGroup>
  );

  await user.tab();
  await user.keyboard('{ArrowDown}');
  // Doc 09 §8: arrows move inside a control that has several options.
  expect(onChange).toHaveBeenLastCalledWith('express');

  await user.keyboard('{ArrowDown}');
  expect(onChange).toHaveBeenLastCalledWith('pickup');
});

test('selection is exclusive', async () => {
  const user = userEvent.setup();
  render(<RadioGroup label="Delivery">{options}</RadioGroup>);

  await user.click(screen.getByRole('radio', { name: 'Express' }));
  expect(screen.getByRole('radio', { name: 'Express' })).toHaveProperty(
    'checked',
    true
  );

  await user.click(screen.getByRole('radio', { name: 'Pickup' }));
  expect(screen.getByRole('radio', { name: 'Express' })).toHaveProperty(
    'checked',
    false
  );
  expect(screen.getByRole('radio', { name: 'Pickup' })).toHaveProperty(
    'checked',
    true
  );
});

test('a disabled group does not respond', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <RadioGroup label="Delivery" isDisabled onChange={onChange}>
      {options}
    </RadioGroup>
  );

  await user.click(screen.getByRole('radio', { name: 'Express' }));
  expect(onChange).not.toHaveBeenCalled();
});

test('one option can be disabled while the rest work', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <RadioGroup label="Delivery" onChange={onChange}>
      <Radio value="standard">Standard</Radio>
      <Radio value="express" isDisabled>
        Express
      </Radio>
    </RadioGroup>
  );

  await user.click(screen.getByRole('radio', { name: 'Express' }));
  expect(onChange).not.toHaveBeenCalled();

  await user.click(screen.getByRole('radio', { name: 'Standard' }));
  expect(onChange).toHaveBeenCalledWith('standard');
});

test('it is controlled, and uncontrolled with a default', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const { unmount } = render(
    <RadioGroup label="Delivery" value="standard" onChange={onChange}>
      {options}
    </RadioGroup>
  );
  await user.click(screen.getByRole('radio', { name: 'Express' }));
  expect(onChange).toHaveBeenCalledWith('express');
  expect(screen.getByRole('radio', { name: 'Standard' })).toHaveProperty(
    'checked',
    true
  );
  unmount();

  render(
    <RadioGroup label="Delivery" defaultValue="pickup">
      {options}
    </RadioGroup>
  );
  expect(screen.getByRole('radio', { name: 'Pickup' })).toHaveProperty(
    'checked',
    true
  );
});

/*
 * The card variant.
 *
 * What is worth asserting is everything the variant must NOT change. A card is
 * an appearance, so the accessibility tree, the keyboard and the wiring have to
 * come out identical — and the one thing that is structural rather than
 * cosmetic: the card IS the label, so the whole surface is the target.
 *
 * Appearance itself is not asserted here. A class name proves nothing about
 * what an element looks like and turns every refactor into a wall of false
 * failures; the catalog covers it.
 */

const cardOptions = (
  <>
    <Radio value="basic">Basic</Radio>
    <Radio value="team">Team</Radio>
    <Radio value="scale">Scale</Radio>
  </>
);

/** The element the state attributes and the press both land on. */
const cardOf = (name: string) =>
  screen.getByRole('radio', { name }).closest('label') as HTMLElement;

test('the appearance is the group’s, and nothing about it reaches the DOM', () => {
  render(
    <RadioGroup label="Plan" variant="card">
      {cardOptions}
    </RadioGroup>
  );

  // A closed prop on the group, not a value repeated on every option — so a
  // group of two cards and one bare circle cannot be expressed. And it is
  // ours, so it must not be spread onto an element as an unknown attribute.
  const group = screen.getByRole('radiogroup', { name: 'Plan' });
  expect(group.hasAttribute('variant')).toBe(false);
  for (const name of ['Basic', 'Team', 'Scale']) {
    expect(cardOf(name).hasAttribute('variant')).toBe(false);
  }
});

test('a card group reads to assistive technology exactly like a plain one', () => {
  const { unmount } = render(
    <RadioGroup label="Plan" description="Billed monthly.">
      {cardOptions}
    </RadioGroup>
  );
  const plain = {
    described: describedText(screen.getByRole('radiogroup')),
    names: screen.getAllByRole('radio').map(r => r.getAttribute('value'))
  };
  unmount();

  render(
    <RadioGroup label="Plan" variant="card" description="Billed monthly.">
      {cardOptions}
    </RadioGroup>
  );

  expect(describedText(screen.getByRole('radiogroup'))).toBe(plain.described);
  expect(
    screen.getAllByRole('radio').map(r => r.getAttribute('value'))
  ).toEqual(plain.names);
  expect(screen.getByRole('radio', { name: 'Team' })).toBeTruthy();
});

test('the whole card is the target, not the circle inside it', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <RadioGroup label="Plan" variant="card" onChange={onChange}>
      {cardOptions}
    </RadioGroup>
  );

  /*
   * The card element itself, pressed — not the text, and not the circle. It
   * selects because the card IS the base's label element rather than a div
   * decorated to look like one, which is the whole point of the variant: a
   * card whose only target were a 20px circle would be worse than no card.
   */
  await user.click(cardOf('Team'));
  expect(onChange).toHaveBeenCalledWith('team');
  expect(screen.getByRole('radio', { name: 'Team' })).toHaveProperty(
    'checked',
    true
  );
});

test('the card carries the state attributes its appearance is keyed off', async () => {
  const user = userEvent.setup();
  render(
    <RadioGroup label="Plan" variant="card" isInvalid errorMessage="Pick one.">
      {cardOptions}
    </RadioGroup>
  );

  /*
   * Asserted for the reason CheckboxGroup's group attributes are: every state
   * of a card is styled from one of these (doc 02 §4), and an upgrade that
   * moved one would remove an appearance silently — the failure a screenshot
   * cannot catch, because a baseline only proves a picture has not changed.
   */
  expect(cardOf('Basic').hasAttribute('data-invalid')).toBe(true);

  await user.click(cardOf('Scale'));
  expect(cardOf('Scale').hasAttribute('data-selected')).toBe(true);
  expect(cardOf('Basic').hasAttribute('data-selected')).toBe(false);
});

test('cards are one tab stop and the arrows still move within them', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <>
      <RadioGroup label="Plan" variant="card" onChange={onChange}>
        {cardOptions}
      </RadioGroup>
      <button type="button">After</button>
    </>
  );

  await user.tab();
  expect(screen.getAllByRole('radio')[0]).toHaveProperty('tabIndex', 0);

  await user.keyboard('{ArrowDown}');
  expect(onChange).toHaveBeenLastCalledWith('team');

  // Keyboard behaviour comes from the base and the variant does not touch it:
  // one more Tab leaves the group rather than moving to the next card.
  await user.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'After' })
  );
});

test('a disabled card group does not respond', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <RadioGroup label="Plan" variant="card" isDisabled onChange={onChange}>
      {cardOptions}
    </RadioGroup>
  );

  await user.click(cardOf('Team'));
  expect(onChange).not.toHaveBeenCalled();
  expect(cardOf('Team').hasAttribute('data-disabled')).toBe(true);
});

test('a read-only card group shows the choice and refuses to change it', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <RadioGroup
      label="Plan"
      variant="card"
      isReadOnly
      value="team"
      onChange={onChange}
    >
      {cardOptions}
    </RadioGroup>
  );

  await user.click(cardOf('Scale'));
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole('radio', { name: 'Team' })).toHaveProperty(
    'checked',
    true
  );

  /*
   * Read-only and disabled are not the same thing (doc 07 §6), and the two
   * attributes are what keeps them looking different: a read-only card loses
   * its border, a disabled one changes its fill. Read-only also stays
   * reachable, which is why the appearance may not simply reuse disabled's.
   */
  expect(cardOf('Team').hasAttribute('data-readonly')).toBe(true);
  expect(cardOf('Team').hasAttribute('data-disabled')).toBe(false);
  await user.tab();
  expect(screen.getAllByRole('radio')[1]).toHaveProperty('tabIndex', 0);
});

test('cards work in both orientations, controlled and uncontrolled', () => {
  const orientations = ['vertical', 'horizontal'] as const;

  for (const orientation of orientations) {
    const { unmount } = render(
      <RadioGroup
        label="Plan"
        variant="card"
        orientation={orientation}
        defaultValue="scale"
      >
        {cardOptions}
      </RadioGroup>
    );
    expect(
      screen.getByRole('radiogroup').getAttribute('aria-orientation')
    ).toBe(orientation);
    expect(screen.getByRole('radio', { name: 'Scale' })).toHaveProperty(
      'checked',
      true
    );
    unmount();
  }
});
