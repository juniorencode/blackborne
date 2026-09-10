/*
 * One control, two fields, and a pair of calendars in a layer.
 *
 * What only a browser answers: whether the two halves take DIFFERENT props
 * from the base's slots, how many months the WINDOW gives the layer — the one
 * viewport question this library asks — and whether two controls still share
 * the trailing edge under doc 07 §2.2a.
 */
import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateRangePicker } from './DateRangePicker';
import { ConfigProvider } from '../../config';
import type { DateRange } from '../RangeCalendar';

const meta = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  args: { label: 'Stay' },
  argTypes: { onChange: { control: false } }
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const InLima = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider timeZone="America/Lima">{children}</ConfigProvider>
);

const STAY: DateRange = { start: '2026-09-05', end: '2026-09-12' };

/**
 * Opens the layer by pressing the chevron, rather than by a prop — the same
 * arrangement `ComboBox` and `DatePicker` use, and the same frame delay.
 */
function Opened({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current
        ?.querySelector<HTMLElement>('.bb-date-range-picker-toggle')
        ?.click();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

/**
 * Two fields and a layer.
 *
 * **Type both ends** — the segments of each half work exactly as a single
 * date's — **or press the chevron** and drag a range across the calendars.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [stay, setStay] = useState<DateRange | null>(STAY);

      return (
        <InLima>
          <div className="catalog-stack" style={{ maxWidth: 380 }}>
            <DateRangePicker {...args} value={stay} onChange={setStay} />
            <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
              {stay === null ? 'Empty.' : `Value: ${stay.start} to ${stay.end}`}
            </p>
          </div>
        </InLima>
      );
    }

    return <Demo />;
  }
};

/** The layer, open, with however many months the window has room for. */
export const Opened_: Story = {
  name: 'Opened',
  render: args => (
    <InLima>
      <Opened>
        <div
          className="catalog-stack"
          style={{ maxWidth: 380, minHeight: 440 }}
        >
          <DateRangePicker {...args} defaultValue={STAY} />
        </div>
      </Opened>
    </InLima>
  )
};

/** Every state doc 07 §6 asks for. */
export const States: Story = {
  render: args => (
    <InLima>
      <div className="catalog-row" style={{ alignItems: 'start' }}>
        <div className="catalog-panel" style={{ width: 340 }}>
          <p className="catalog-label">Empty, and required</p>
          <DateRangePicker {...args} isRequired />
        </div>
        <div className="catalog-panel" style={{ width: 340 }}>
          <p className="catalog-label">With a range</p>
          <DateRangePicker {...args} defaultValue={STAY} />
        </div>
        <div className="catalog-panel" style={{ width: 340 }}>
          <p className="catalog-label">Invalid</p>
          <DateRangePicker
            {...args}
            defaultValue={STAY}
            isInvalid
            errorMessage="The room is taken for part of that."
          />
        </div>
        <div className="catalog-panel" style={{ width: 340 }}>
          <p className="catalog-label">Read-only</p>
          <DateRangePicker {...args} defaultValue={STAY} isReadOnly />
        </div>
        <div className="catalog-panel" style={{ width: 340 }}>
          <p className="catalog-label">Disabled</p>
          <DateRangePicker {...args} defaultValue={STAY} isDisabled />
        </div>
        <div className="catalog-panel" style={{ width: 340 }}>
          <p className="catalog-label">Saving</p>
          <DateRangePicker {...args} defaultValue={STAY} isSaving />
        </div>
      </div>
    </InLima>
  )
};

/**
 * A MAXIMUM LENGTH, which is not a prop.
 *
 * "No more than seven nights" is the unavailable-day function the consumer
 * already has, and it can answer what no number could: the second argument is
 * the day the range was started from, so the limit moves with the anchor.
 */
export const AMaximumLength: Story = {
  name: 'A maximum length',
  render: args => (
    <InLima>
      <Opened>
        <div
          className="catalog-stack"
          style={{ maxWidth: 380, minHeight: 440 }}
        >
          <DateRangePicker
            {...args}
            defaultValue={{ start: '2026-09-07', end: '2026-09-10' }}
            description="At most seven nights from the day you pick first."
            isDateUnavailable={(date, from) => {
              if (from === null) return false;
              const days =
                (Date.parse(`${date}T00:00:00Z`) -
                  Date.parse(`${from}T00:00:00Z`)) /
                86_400_000;
              return Math.abs(days) > 7;
            }}
          />
        </div>
      </Opened>
    </InLima>
  )
};

/** In a 320px panel, where the layer gets one month and must stay on screen. */
export const InANarrowPanel: Story = {
  name: 'In a narrow panel',
  render: args => (
    <InLima>
      <Opened>
        <div className="catalog-panel" style={{ width: 320, minHeight: 440 }}>
          <p className="catalog-label">A 320px side panel</p>
          <DateRangePicker {...args} defaultValue={STAY} />
        </div>
      </Opened>
    </InLima>
  )
};

/** RTL, where the two halves swap ends and so do the calendars. */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <ConfigProvider locale="ar-EG" timeZone="Africa/Cairo">
      <div dir="rtl" className="catalog-panel" style={{ width: 380 }}>
        <p className="catalog-label">العربية</p>
        <DateRangePicker label="الإقامة" defaultValue={STAY} />
      </div>
    </ConfigProvider>
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
            style={{ width: 340 }}
          >
            <p className="catalog-label">{label}</p>
            <DateRangePicker label="Stay" defaultValue={STAY} />
          </div>
        ))}
      </div>
    </ConfigProvider>
  )
};
