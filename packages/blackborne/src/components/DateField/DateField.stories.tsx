/*
 * A date in segments, and the things about it that only a browser answers:
 * whether the row moves while a month is typed, whether the focused segment is
 * unmistakable, and what the locale does to the order of the pieces.
 *
 * The provider is wrapped per story. A story cannot opt out of a meta
 * decorator — `decorators: []` composes with the meta's rather than replacing
 * it — which `Calendar` found the hard way.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateField } from './DateField';
import { Button } from '../Button';
import { ConfigProvider } from '../../config';

const meta = {
  title: 'Components/DateField',
  component: DateField,
  args: { label: 'Invoice date' },
  argTypes: { onChange: { control: false } }
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

const InLima = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider timeZone="America/Lima">{children}</ConfigProvider>
);

/**
 * A date typed rather than pointed at.
 *
 * **Worth doing with the keyboard, which is the whole point.** Type `09092026`
 * and the segments fill and advance on their own. The arrows step the segment
 * that has focus, `Tab` moves between them, `Backspace` empties one. The 31st
 * of February cannot be written at all.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [day, setDay] = useState<string | null>('2026-09-09');

      return (
        <InLima>
          <div className="catalog-stack" style={{ maxWidth: 320 }}>
            <DateField {...args} value={day} onChange={setDay} />
            <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
              {day === null ? 'Empty.' : `Value: ${day}`}
            </p>
          </div>
        </InLima>
      );
    }

    return <Demo />;
  }
};

/** Every state doc 07 §6 asks for, on one page. */
export const States: Story = {
  render: args => (
    <InLima>
      <div className="catalog-row" style={{ alignItems: 'start' }}>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Empty, and required</p>
          <DateField {...args} isRequired />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">With a value</p>
          <DateField {...args} defaultValue="2026-09-09" />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Described</p>
          <DateField
            {...args}
            defaultValue="2026-09-09"
            description="The date on the document, not today."
          />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Invalid</p>
          <DateField
            {...args}
            defaultValue="2026-09-09"
            isInvalid
            errorMessage="This period is already closed."
          />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Read-only</p>
          <DateField {...args} defaultValue="2026-09-09" isReadOnly />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Disabled</p>
          <DateField {...args} defaultValue="2026-09-09" isDisabled />
        </div>
      </div>
    </InLima>
  )
};

/**
 * The three sizes, beside a `Button` of each.
 *
 * The alignment is the claim: a date field and a button of the same size are
 * the same height and sit on the same line (doc 03 §9).
 */
export const AlignsWithButton: Story = {
  name: 'Aligns with a button',
  render: args => (
    <InLima>
      <div className="catalog-stack">
        {(['sm', 'md', 'lg'] as const).map(size => (
          <div
            key={size}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
          >
            <DateField
              {...args}
              size={size}
              defaultValue="2026-09-09"
              isLabelHidden
            />
            <Button size={size}>Save</Button>
          </div>
        ))}
      </div>
    </InLima>
  )
};

/**
 * THE ORDER OF THE SEGMENTS IS THE LOCALE'S, and so is what goes between them.
 *
 * Month first in `en-US`, day first in `es-PE`, year first in `ja-JP` with a
 * different mark. Nothing in this library formats a date by hand (doc 05 §3).
 */
export const InEveryLocale: Story = {
  name: 'In every locale',
  render: () => (
    <div className="catalog-row" style={{ alignItems: 'start' }}>
      {(
        [
          ['en-US', 'Invoice date'],
          ['es-PE', 'Fecha de factura'],
          ['ja-JP', '請求日']
        ] as const
      ).map(([locale, label]) => (
        <div key={locale} className="catalog-panel" style={{ width: 240 }}>
          <p className="catalog-label">{locale}</p>
          <ConfigProvider locale={locale} timeZone="America/Lima">
            <DateField label={label} defaultValue="2026-09-09" />
          </ConfigProvider>
        </div>
      ))}
    </div>
  )
};

/** RTL, where the segments read from the right. */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <ConfigProvider locale="ar-EG" timeZone="Africa/Cairo">
      <div dir="rtl" className="catalog-panel" style={{ width: 280 }}>
        <p className="catalog-label">العربية</p>
        <DateField label="تاريخ الفاتورة" defaultValue="2026-09-09" />
      </div>
    </ConfigProvider>
  )
};

/** Limits, which the segments refuse rather than complain about. */
export const Limits: Story = {
  render: args => (
    <InLima>
      <div className="catalog-panel" style={{ width: 320 }}>
        <p className="catalog-label">September 2026 only</p>
        <DateField
          {...args}
          defaultValue="2026-09-09"
          minValue="2026-09-01"
          maxValue="2026-09-30"
          description="Outside the month it is marked invalid."
        />
      </div>
    </InLima>
  )
};

/** Light, dark and compact — the three scopes on one page. */
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
            style={{ width: 260 }}
          >
            <p className="catalog-label">{label}</p>
            <DateField label="Invoice date" defaultValue="2026-09-09" />
          </div>
        ))}
      </div>
    </ConfigProvider>
  )
};
