/*
 * ONE PICTURE FOR THE SLOT, RATHER THAN SIX FOR THE SIX FIELDS.
 *
 * `icon` arrived on `TextField`, `NumberField`, `SearchField`,
 * `PasswordField`, `Select` and `ComboBox` at once (decision 0031), and each
 * of them has a `WithIcon` story of its own for somebody reading that
 * component. None of those is photographed: six pictures of one mark in six
 * near-identical frames is what this catalog deleted a baseline for once
 * already — a picture that is a strict subset of another earns nothing.
 *
 * What is worth photographing is the thing that cannot be seen one component
 * at a time: that the slot behaves the SAME in all six, that the mark clears
 * whatever else lives at that edge, and that it survives both modes. The
 * defect it already had is exactly of that kind — an svg carrying only a
 * `viewBox` has no intrinsic size and rendered at 0 by 0 until the slot was
 * taught to size what arrives in it.
 *
 * The three shapes are all here on purpose: a field with nothing else at
 * either edge, a field whose leading edge already holds a text affix, and
 * three whose trailing edge is permanently occupied by a control.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DemoIcon } from '../../catalog/demoIcon';
import { ComboBox, ComboBoxItem } from '../../components/ComboBox';
import { NumberField } from '../../components/NumberField';
import { PasswordField } from '../../components/PasswordField';
import { SearchField } from '../../components/SearchField';
import { Select, SelectItem } from '../../components/Select';
import { TextField } from '../../components/TextField';

function Scope({
  label,
  mode,
  children
}: {
  label: string;
  mode: 'light' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-panel" data-bb-mode={mode}>
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

const meta = {
  title: 'Foundations/A field icon'
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The six fields that take an `icon`, in both modes.
 *
 * The library ships no icons and this one is deliberately something nobody
 * would want in theirs — a pin, from `catalog/demoIcon`. An icon arrives as a
 * node the consumer wrote and takes its size and its colour from the slot
 * (hard rule 9, doc 02 §11).
 */
export const EverySlot: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['light', 'dark'] as const).map(mode => (
        <Scope
          key={mode}
          label={mode === 'light' ? 'Light' : 'Dark'}
          mode={mode}
        >
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <TextField
              label="Nothing else at either edge"
              icon={DemoIcon}
              defaultValue="Ada Lovelace"
            />
            <TextField
              label="Beside a prefix, not instead of one"
              icon={DemoIcon}
              prefix="S/"
              defaultValue="1,240.50"
            />
            {/*
             * The stepper is opt-in (decision 0011), and this row is the only
             * place §2.2b's order can be SEEN: the `−` is the one control that
             * shares the leading edge, so the row reads control, icon, value.
             * Without the prop the label would have named a stepper that was
             * not in the picture.
             */}
            <NumberField
              label="With the stepper, which shares the leading edge"
              icon={DemoIcon}
              isStepperVisible
              defaultValue={12}
            />
            <SearchField
              label="With a clear button opposite"
              icon={DemoIcon}
              defaultValue="Lima"
            />
            <PasswordField
              label="With the reveal toggle opposite"
              icon={DemoIcon}
              defaultValue="correct horse"
            />
            <Select
              label="With a chevron opposite"
              icon={DemoIcon}
              defaultSelectedKey="pen"
            >
              <SelectItem id="pen">Pending</SelectItem>
              <SelectItem id="don">Done</SelectItem>
            </Select>
            <ComboBox
              label="With a toggle opposite"
              icon={DemoIcon}
              defaultSelectedKey="ruiz"
            >
              <ComboBoxItem id="ruiz">José Ruiz</ComboBoxItem>
              <ComboBoxItem id="vega">Ana Vega</ComboBoxItem>
            </ComboBox>
          </div>
        </Scope>
      ))}
    </div>
  )
};
