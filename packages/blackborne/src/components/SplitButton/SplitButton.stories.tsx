/*
 * The visual catalog for SplitButton.
 *
 * What to look at is the SEAM. Two buttons have to read as one control, and
 * the two variants get there differently: a secondary one has two borders
 * turned into one 1px line, and a primary one has no visible border at all, so
 * it draws its own divider out of the pair's text colour. `Variants` is where
 * both are side by side, and `RTL` is where the whole thing changes hands.
 *
 * The menu is not photographed anywhere: this component opens it, so it cannot
 * be held open for a screenshot, and a prop to do that would exist for the
 * catalog and nothing else. Its appearance is `Menu`'s own baselines, and
 * where it lands is asserted in a browser.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button';
import { Force } from '../../catalog/forceState';
import { MenuItem, MenuSeparator } from '../Menu';
import { SplitButton } from './SplitButton';

const SIZES = ['sm', 'md', 'lg'] as const;

/** One scope of the theme axes, with a label. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  brand = false,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  brand?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/** The alternatives, as a value rather than a component. */
const alternatives = (
  <>
    <MenuItem onAction={() => {}}>Save and add another</MenuItem>
    <MenuItem onAction={() => {}}>Save as a draft</MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger" onAction={() => {}}>
      Discard the changes
    </MenuItem>
  </>
);

const meta = {
  title: 'Components/SplitButton',
  component: SplitButton,
  args: { label: 'Save', children: null, onPress: () => {} },
  argTypes: { onPress: { control: false } }
} satisfies Meta<typeof SplitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working split button.
 *
 * **Worth doing with the keyboard**, because the two halves are two stops:
 * `Tab` reaches "Save" and `Enter` runs it, `Tab` again reaches the arrow and
 * `Enter` opens the menu with its first row focused, the arrows move, `Escape`
 * closes it and focus comes back to the arrow.
 *
 * The destructive command is **last**, behind a separator. Opening the menu
 * with a key focuses the first row, so a destructive one there would be a
 * press away — doc 09 §5 rule 5's argument, arriving somewhere it was not
 * written for. The component says so in development if you put it first.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [done, setDone] = useState<string | null>(null);

      return (
        <div className="catalog-stack">
          <div className="catalog-row">
            <SplitButton {...args} onPress={() => setDone('Saved')}>
              <MenuItem onAction={() => setDone('Saved, and another started')}>
                Save and add another
              </MenuItem>
              <MenuItem onAction={() => setDone('Saved as a draft')}>
                Save as a draft
              </MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger" onAction={() => setDone('Discarded')}>
                Discard the changes
              </MenuItem>
            </SplitButton>
          </div>
          <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
            {done ?? 'Nothing done yet.'}
          </p>
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * The two variants, and the seam is the reason there are only two.
 *
 * A **secondary** split button is two bordered halves, and a negative margin
 * turns the two borders into one 1px line — without it the middle of the
 * control would be 2px where every other border in the library is 1.
 *
 * A **primary** one has a border the same colour as its fill, so there is
 * nothing to see: it draws a divider from the pair's own text colour at a
 * quarter strength, which follows a brand override for free and adds no token
 * nobody can name.
 *
 * A ghost or link variant would be two invisible halves with a seam that only
 * exists on hover, and a `danger` one is a destructive action with more
 * destructive actions behind it — the shape doc 09 §5 argues against. Neither
 * exists.
 */
export const Variants: Story = {
  render: args => (
    <div className="catalog-row">
      <SplitButton {...args} variant="primary">
        {alternatives}
      </SplitButton>
      <SplitButton {...args} variant="secondary">
        {alternatives}
      </SplitButton>
    </div>
  )
};

/** The three sizes every button and field has, and both halves take it. */
export const Sizes: Story = {
  render: args => (
    <div className="catalog-stack">
      {SIZES.map(size => (
        <div key={size} className="catalog-row">
          <SplitButton {...args} size={size}>
            {alternatives}
          </SplitButton>
          <SplitButton {...args} size={size} variant="secondary">
            {alternatives}
          </SplitButton>
        </div>
      ))}
    </div>
  )
};

/** The body of the story below, so it can be rendered once per mode. */
function AllStates({
  args,
  mode
}: {
  args: React.ComponentProps<typeof SplitButton>;
  mode: 'light' | 'dark';
}) {
  return (
    <div className="catalog-stack">
      <Scope label="Default" mode={mode}>
        <div className="catalog-row">
          <SplitButton {...args}>{alternatives}</SplitButton>
          <SplitButton {...args} variant="secondary">
            {alternatives}
          </SplitButton>
        </div>
      </Scope>
      <Scope label="Hover, on the action" mode={mode}>
        <Force state="data-hovered" target=".bb-split-button-action">
          <SplitButton {...args}>{alternatives}</SplitButton>
        </Force>
      </Scope>
      <Scope label="Hover, on the arrow" mode={mode}>
        <Force state="data-hovered" target=".bb-split-button-arrow">
          <SplitButton {...args}>{alternatives}</SplitButton>
        </Force>
      </Scope>
      <Scope label="Focus, on the arrow" mode={mode}>
        <Force state="data-focused" target=".bb-split-button-arrow">
          <SplitButton {...args}>{alternatives}</SplitButton>
        </Force>
      </Scope>
      <Scope label="Disabled" mode={mode}>
        <div className="catalog-row">
          <SplitButton {...args} isDisabled>
            {alternatives}
          </SplitButton>
          <SplitButton {...args} variant="secondary" isDisabled>
            {alternatives}
          </SplitButton>
        </div>
      </Scope>
      <Scope label="Pending · the arrow goes with it" mode={mode}>
        <SplitButton {...args} isPending>
          {alternatives}
        </SplitButton>
      </Scope>
    </div>
  );
}

/*
 * The panels carry the mode rather than a wrapper around them, which is not
 * the shape `Button` uses and is the shape this component's own browser check
 * reads: it walks `.catalog-panel` in document order and compares the first
 * three, so the light column has to be six panels in the order they were in.
 * A single panel per mode holding all six states would leave that check
 * comparing two panels and an undefined one.
 */
/**
 * Every state, and two of them are the ones a split button adds.
 *
 * **Hover and focus land on one half at a time**, which is what makes it two
 * controls rather than one: pointing at the arrow must not light up the
 * action, because pressing it does something else.
 *
 * **Pending switches the arrow off too.** The menu holds alternatives to the
 * action that is already running, and starting a second one mid-flight is the
 * state doc 09 §7 is about — `ConfirmDialog` disables its cancelling button
 * from the same argument. The label keeps its width, so nothing beside it
 * moves.
 *
 * **And every one of them is here twice, once per mode.** Hover and focus are
 * reachable only by pointing at the thing, so they are forced (`Force`) and
 * this story is the only place they are ever rendered — a light-only one
 * therefore leaves them unmeasured in dark by every automated layer this
 * repository has, since axe reads a page that was rendered and the visual
 * suite photographs one. What lived in that gap on `Button` was a pressed
 * primary in dark at 2.08:1, under 501 stories and 211 baselines
 * (doc 10 §11.9).
 */
export const States: Story = {
  render: args => (
    <div className="catalog-pair">
      <AllStates args={args} mode="light" />
      <AllStates args={args} mode="dark" />
    </div>
  )
};

/**
 * Where one actually goes: the primary action of a form's footer, with the
 * ordinary way out beside it.
 *
 * The order of the buttons and where they sit belong to the project (doc 07
 * §7) — what this shows is that a split button lines up with a plain one of
 * the same size, which is doc 03 §9's check reaching one more control.
 */
export const InAFooter: Story = {
  name: 'In a footer',
  render: args => (
    <div
      className="catalog-row"
      style={{ justifyContent: 'flex-end', gap: 'var(--bb-space-3)' }}
    >
      <Button variant="ghost">Cancel</Button>
      <SplitButton {...args}>{alternatives}</SplitButton>
    </div>
  )
};

/** Dark, where the divider is mixed from the same pair and needs no second
 * definition. */
export const Dark: Story = {
  render: args => (
    <Scope label="Dark" mode="dark">
      <div className="catalog-row">
        <SplitButton {...args}>{alternatives}</SplitButton>
        <SplitButton {...args} variant="secondary">
          {alternatives}
        </SplitButton>
      </div>
    </Scope>
  )
};

/** Compact: the halves lose air together, so the seam stays one line. */
export const Compact: Story = {
  render: args => (
    <Scope label="Compact" density="compact">
      <div className="catalog-row">
        <SplitButton {...args}>{alternatives}</SplitButton>
        <SplitButton {...args} variant="secondary">
          {alternatives}
        </SplitButton>
      </div>
    </Scope>
  )
};

/**
 * RTL, where the whole control changes hands.
 *
 * The arrow moves to the left, the squared corners swap sides, and the divider
 * with them — all of it because the radii are logical (`rounded-e-none`,
 * `rounded-s-none`) and the pull-back is `-ms-px`. Nothing in the component
 * knows which side that is, and there is no `left` or `right` anywhere in it.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <Scope label="RTL · العربية" dir="rtl">
      <div className="catalog-row">
        <SplitButton label="احفظ" onPress={() => {}}>
          <MenuItem onAction={() => {}}>احفظ وأضف آخر</MenuItem>
          <MenuItem onAction={() => {}}>احفظ كمسودة</MenuItem>
        </SplitButton>
        <SplitButton label="احفظ" variant="secondary" onPress={() => {}}>
          <MenuItem onAction={() => {}}>احفظ وأضف آخر</MenuItem>
          <MenuItem onAction={() => {}}>احفظ كمسودة</MenuItem>
        </SplitButton>
      </div>
    </Scope>
  )
};

/** An overridden brand, which the divider follows because it is mixed from the
 * pair's own text colour rather than declared. */
export const BrandOverride: Story = {
  name: 'Brand override',
  render: args => (
    <Scope label="An overridden brand" brand>
      <div className="catalog-row">
        <SplitButton {...args}>{alternatives}</SplitButton>
        <SplitButton {...args} variant="secondary">
          {alternatives}
        </SplitButton>
      </div>
    </Scope>
  )
};
