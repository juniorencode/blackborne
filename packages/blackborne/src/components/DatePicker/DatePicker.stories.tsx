/*
 * A date typed or pointed at. What only a browser answers here: whether the
 * layer lands under the whole field rather than under the segments, whether
 * the chevron is the only thing at the trailing edge, and whether the two
 * routes to the value agree.
 */
import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from './DatePicker';
import { ConfigProvider } from '../../config';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  args: { label: 'Appointment' },
  argTypes: { onChange: { control: false } }
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const InLima = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider timeZone="America/Lima">{children}</ConfigProvider>
);

/**
 * OPENS THE LAYER BY PRESSING THE CHEVRON, rather than by a prop.
 *
 * A story needs the layer open to be photographed, and the base has a
 * `defaultOpen` — but a prop this library exposes has to be earned by a place
 * that needs it today, and a screenshot is not one (rule 8). So the story does
 * what a person does.
 *
 * `ComboBox` established both the pattern and the frame delay: the press waits
 * for the next paint, because the base commits the field's own text a render
 * later and a click before that lands on a field still showing its
 * placeholder.
 */
function Opened({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current
        ?.querySelector<HTMLElement>('.bb-date-picker-toggle')
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
 * Two routes to one value.
 *
 * **Type it** — `09092026` fills the segments and never opens the layer. **Or
 * press the chevron** and choose, which is for a date somebody is deciding
 * rather than recalling. Both write the same string.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [day, setDay] = useState<string | null>('2026-09-09');

      return (
        <InLima>
          <div className="catalog-stack" style={{ maxWidth: 320 }}>
            <DatePicker {...args} value={day} onChange={setDay} />
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

/** The layer, open, with the calendar it holds. */
export const Opened_: Story = {
  name: 'Opened',
  render: args => (
    <InLima>
      <Opened>
        <div
          className="catalog-stack"
          style={{ maxWidth: 320, minHeight: 420 }}
        >
          <DatePicker {...args} defaultValue="2026-09-09" />
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
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Empty, and required</p>
          <DatePicker {...args} isRequired />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">With a value</p>
          <DatePicker {...args} defaultValue="2026-09-09" />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Invalid</p>
          <DatePicker
            {...args}
            defaultValue="2026-09-09"
            isInvalid
            errorMessage="That day is already booked."
          />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Read-only</p>
          <DatePicker {...args} defaultValue="2026-09-09" isReadOnly />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Disabled</p>
          <DatePicker {...args} defaultValue="2026-09-09" isDisabled />
        </div>
        <div className="catalog-panel" style={{ width: 260 }}>
          <p className="catalog-label">Saving</p>
          <DatePicker {...args} defaultValue="2026-09-09" isSaving />
        </div>
      </div>
    </InLima>
  )
};

/**
 * In a 320px panel, which is the entry gate's own question (P4).
 *
 * The layer is wider than the field, and it may not push the page sideways.
 */
export const InANarrowPanel: Story = {
  name: 'In a narrow panel',
  render: args => (
    <InLima>
      <Opened>
        <div className="catalog-panel" style={{ width: 320, minHeight: 420 }}>
          <p className="catalog-label">A 320px side panel</p>
          <DatePicker {...args} defaultValue="2026-09-09" />
        </div>
      </Opened>
    </InLima>
  )
};

/** Limits, which hold in the segments and in the calendar. */
export const Limits: Story = {
  render: args => (
    <InLima>
      <Opened>
        <div
          className="catalog-stack"
          style={{ maxWidth: 320, minHeight: 420 }}
        >
          <DatePicker
            {...args}
            defaultValue="2026-09-09"
            minValue="2026-09-01"
            maxValue="2026-09-30"
            description="September 2026 only."
          />
        </div>
      </Opened>
    </InLima>
  )
};

/** RTL, where the field reads from the right and so does the calendar. */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <ConfigProvider locale="ar-EG" timeZone="Africa/Cairo">
      <div dir="rtl" className="catalog-panel" style={{ width: 320 }}>
        <p className="catalog-label">العربية</p>
        <DatePicker label="الموعد" defaultValue="2026-09-09" />
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
            style={{ width: 260 }}
          >
            <p className="catalog-label">{label}</p>
            <DatePicker label="Appointment" defaultValue="2026-09-09" />
          </div>
        ))}
      </div>
    </ConfigProvider>
  )
};
