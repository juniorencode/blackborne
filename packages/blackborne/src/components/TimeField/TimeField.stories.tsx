/*
 * A time in segments. What only a browser answers: how many segments a locale
 * asks for, and what the third one says when there is one — measured, `PM` in
 * `en-US` and `p. m.` in `es-PE`, while `ja-JP` has no third segment at all.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimeField } from './TimeField';
import { ConfigProvider } from '../../config';

const meta = {
  title: 'Components/TimeField',
  component: TimeField,
  args: { label: 'Opens at' },
  argTypes: { onChange: { control: false } }
} satisfies Meta<typeof TimeField>;

export default meta;
type Story = StoryObj<typeof meta>;

const InLima = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider timeZone="America/Lima">{children}</ConfigProvider>
);

/**
 * A time typed in pieces.
 *
 * **Worth doing with the keyboard.** Type `1430` and the segments fill and
 * advance. The arrows step the one that has focus; there is no 25th hour to
 * type.
 *
 * The value is `14:30` whatever the field shows — an `en-US` field shows
 * `2:30 PM` and reports the same string, which is the whole reason the
 * boundary is not a formatted time.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [time, setTime] = useState<string | null>('14:30');

      return (
        <InLima>
          <div className="catalog-stack" style={{ maxWidth: 280 }}>
            <TimeField {...args} value={time} onChange={setTime} />
            <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
              {time === null ? 'Empty.' : `Value: ${time}`}
            </p>
          </div>
        </InLima>
      );
    }

    return <Demo />;
  }
};

/** Every state doc 07 §6 asks for. */
export const States: Story = {
  render: args => (
    <InLima>
      <div className="catalog-row" style={{ alignItems: 'start' }}>
        <div className="catalog-panel" style={{ width: 240 }}>
          <p className="catalog-label">Empty, and required</p>
          <TimeField {...args} isRequired />
        </div>
        <div className="catalog-panel" style={{ width: 240 }}>
          <p className="catalog-label">With a value</p>
          <TimeField {...args} defaultValue="14:30" />
        </div>
        <div className="catalog-panel" style={{ width: 240 }}>
          <p className="catalog-label">To the second</p>
          <TimeField {...args} defaultValue="14:30:15" precision="second" />
        </div>
        <div className="catalog-panel" style={{ width: 240 }}>
          <p className="catalog-label">Invalid</p>
          <TimeField
            {...args}
            defaultValue="14:30"
            isInvalid
            errorMessage="We are closed then."
          />
        </div>
        <div className="catalog-panel" style={{ width: 240 }}>
          <p className="catalog-label">Read-only</p>
          <TimeField {...args} defaultValue="14:30" isReadOnly />
        </div>
        <div className="catalog-panel" style={{ width: 240 }}>
          <p className="catalog-label">Disabled</p>
          <TimeField {...args} defaultValue="14:30" isDisabled />
        </div>
      </div>
    </InLima>
  )
};

/**
 * THE CLOCK IS THE LOCALE'S, and so is how the marker is written.
 *
 * Measured: `en-US` and `es-PE` both show twelve hours and a third segment,
 * and that segment reads `PM` in one and `p. m.` in the other — spacing and
 * full stops included. `ja-JP` shows twenty-four hours and two segments. The
 * value is `14:30` in all three (decision 0020), which is the point: a
 * formatted time would carry one of these into the data.
 */
export const InEveryLocale: Story = {
  name: 'In every locale',
  render: () => (
    <div className="catalog-row" style={{ alignItems: 'start' }}>
      {(
        [
          ['en-US', 'Opens at'],
          ['es-PE', 'Abre a las'],
          ['ja-JP', '開店時刻']
        ] as const
      ).map(([locale, label]) => (
        <div key={locale} className="catalog-panel" style={{ width: 220 }}>
          <p className="catalog-label">{locale}</p>
          <ConfigProvider locale={locale} timeZone="America/Lima">
            <TimeField label={label} defaultValue="14:30" />
          </ConfigProvider>
        </div>
      ))}
    </div>
  )
};

/** Light, dark and compact. */
export const Together: Story = {
  render: () => (
    <ConfigProvider timeZone="America/Lima">
      <div className="catalog-pair">
        {(
          [
            ['Light', 'light', 'normal'],
            ['Dark', 'dark', 'normal'],
            ['Compact', 'light', 'compact']
          ] as const
        ).map(([label, mode, density]) => (
          <div
            key={label}
            className="catalog-panel"
            data-bb-mode={mode}
            data-bb-density={density}
            style={{ width: 240 }}
          >
            <p className="catalog-label">{label}</p>
            <TimeField label="Opens at" defaultValue="14:30" />
          </div>
        ))}
      </div>
    </ConfigProvider>
  )
};
