/*
 * The visual catalog for ColorSwatchField.
 *
 * WHAT TO LOOK AT is the two marks. A swatch holds a colour the library has
 * never seen, so nothing may be drawn INSIDE it — and both marks it can carry
 * are therefore outside, in two different mechanisms.
 *
 * Doc 06 §3.1 gives a BOX a border in the ring colour plus a halo, and reserves
 * the offset outline for a run of text. So focus is the border and the halo,
 * and the outline is free for CHOSEN — which it has to be, because the first
 * version of this component drew both as an outline and took the focus colour
 * from `--bb-focus-ring`, which is the accent. Two identical rings, and a
 * focused swatch that looked chosen.
 *
 * `Rings` is where the two now compose: chosen, focused, and one swatch that is
 * both.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ColorSwatchField } from './ColorSwatchField';
import { Force } from '../../catalog/forceState';

/** A project's own palette, which is what a closed one is. */
const PALETTE = [
  '#3e63dd',
  '#e5484d',
  '#30a46c',
  '#f76b15',
  '#8e4ec6',
  '#0c8599',
  '#ffffff',
  '#1a1a1a'
] as const;

const SMALL = ['#3e63dd', '#e5484d', '#30a46c'] as const;

/** One scope of the theme axes, with a label. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  width = 260,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      style={{ width }}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

const meta = {
  title: 'Components/ColorSwatchField',
  component: ColorSwatchField,
  args: { label: 'Label colour', colors: SMALL }
} satisfies Meta<typeof ColorSwatchField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working palette.
 *
 * **What crosses back is the string you wrote.** The palette below declares
 * `#3e63dd` and that is what the readout shows — not `rgba(62, 99, 221, 1)`,
 * which is what the base's own `toString()` would have given. Decision 0024's
 * exception: a component whose answer is one of its inputs reports that input.
 *
 * **Worth doing with the keyboard.** `Tab` reaches the palette, the arrows
 * move in two dimensions across the rows as they are drawn, and typing jumps
 * by the platform's name for the colour — "green" reaches the green one.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [colour, setColour] = useState<string | null>(null);

      return (
        <div className="catalog-stack" style={{ width: 260 }}>
          <ColorSwatchField
            {...args}
            colors={PALETTE}
            value={colour}
            onChange={setColour}
          />
          <p className="catalog-label">
            {colour === null ? 'Nothing chosen' : `Value: ${colour}`}
          </p>
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * EVERY STATE, in both modes.
 *
 * A palette wraps rather than scrolling and rather than declaring a column
 * count: however many fit is the answer, and a declared number is one a
 * narrower container makes wrong.
 */
export const States: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Light', 'light'],
          ['Dark', 'dark']
        ] as const
      ).map(([label, mode]) => (
        <Scope key={label} label={label} mode={mode}>
          <div className="catalog-stack">
            <ColorSwatchField label="Empty" colors={SMALL} />
            <ColorSwatchField
              label="Chosen"
              colors={PALETTE}
              defaultValue="#30a46c"
            />
            <ColorSwatchField
              label="With help"
              colors={SMALL}
              description="Used on the board and in exports"
            />
            <ColorSwatchField
              label="Invalid"
              colors={SMALL}
              isInvalid
              errorMessage="Choose a colour"
            />
            <ColorSwatchField
              label="Disabled"
              colors={SMALL}
              defaultValue="#3e63dd"
              isDisabled
            />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * THE TWO MARKS, forced so they can be photographed together.
 *
 * Nothing is drawn inside a swatch, ever: the colour is the consumer's and a
 * mark on top of it would be white on pale half the time — measured on a
 * calendar, at 1.12:1.
 *
 * So both marks are outside, in the two mechanisms doc 06 §3.1 names. Chosen
 * is an offset outline in the surface's own text colour; focus is the border
 * recoloured plus the halo, which is how every box in this library rings. They
 * compose rather than compete — the third row is one swatch carrying both.
 */
export const Rings: Story = {
  name: 'Rings',
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Light', 'light'],
          ['Dark', 'dark']
        ] as const
      ).map(([label, mode]) => (
        <Scope key={label} label={label} mode={mode}>
          <div className="catalog-stack">
            <ColorSwatchField
              label="Chosen"
              colors={SMALL}
              defaultValue="#e5484d"
            />
            <Force
              state="data-focus-visible"
              target=".bb-color-swatch:nth-child(2)"
            >
              <ColorSwatchField label="Focused" colors={SMALL} />
            </Force>
            <Force
              state="data-focus-visible"
              target=".bb-color-swatch:nth-child(2)"
            >
              <ColorSwatchField
                label="Both"
                colors={SMALL}
                defaultValue="#e5484d"
              />
            </Force>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/** A long palette in a narrow container, where it wraps. */
export const Wrapping: Story = {
  render: () => (
    <div className="catalog-pair">
      {([320, 180] as const).map(width => (
        <Scope key={width} label={`${width}px`} width={width}>
          <ColorSwatchField
            label="Label colour"
            colors={PALETTE}
            defaultValue="#f76b15"
          />
        </Scope>
      ))}
    </div>
  )
};

/** RTL, where the palette reads from the right. */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <div dir="rtl">
      <Scope label="العربية" dir="rtl">
        <ColorSwatchField
          label="لون التصنيف"
          colors={SMALL}
          defaultValue="#3e63dd"
          description="يُستخدم في اللوحة"
        />
      </Scope>
    </div>
  )
};

/** Compact density, where the target keeps its floor. */
export const Compact: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Normal', 'normal'],
          ['Compact', 'compact']
        ] as const
      ).map(([label, density]) => (
        <Scope key={label} label={label} density={density}>
          <ColorSwatchField
            label="Label colour"
            colors={SMALL}
            defaultValue="#3e63dd"
          />
        </Scope>
      ))}
    </div>
  )
};
