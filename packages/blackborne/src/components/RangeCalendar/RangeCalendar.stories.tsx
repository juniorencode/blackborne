/*
 * A range calendar, and the three things about it that only a browser answers:
 * how many months the container asks for, whether the band across a week is
 * one shape or seven, and whether the selection survives the structure
 * changing under it.
 *
 * Every story wraps its own provider. A story cannot opt out of a meta
 * decorator — `decorators: []` COMPOSES with the meta's rather than replacing
 * it — which `Calendar` found the hard way with a "no zone" story that quietly
 * had one.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RangeCalendar, type DateRange } from './RangeCalendar';
import { ConfigProvider } from '../../config';

const meta = {
  title: 'Components/RangeCalendar',
  component: RangeCalendar,
  args: { label: 'Stay' },
  argTypes: { onChange: { control: false } }
} satisfies Meta<typeof RangeCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A zone, because a calendar needs one to know today. */
const InLima = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider timeZone="America/Lima">{children}</ConfigProvider>
);

/**
 * A CONTAINER, DECLARED, because a range calendar may not declare its own.
 *
 * Inline-size containment computes an element's width as though it had no
 * contents, so a component sized BY its contents collapses (doc 04 §4.3) — a
 * calendar is exactly that, so it reads an ancestor's container rather than
 * declaring one. This is the ancestor, and it is what the stories showing two
 * months rest on.
 *
 * With nothing declaring a container anywhere, the step stays at `base` and
 * the calendar shows one month, which is doc 04 §4.1's narrow-first rule
 * rather than a failure.
 */
const Room = ({
  width,
  label,
  mode = 'light',
  density = 'normal',
  children
}: {
  width: number;
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  children: React.ReactNode;
}) => (
  <div
    className="catalog-panel"
    data-bb-mode={mode}
    data-bb-density={density}
    style={{ width, containerType: 'inline-size' }}
  >
    <p className="catalog-label">{label}</p>
    {children}
  </div>
);

/*
 * TODAY FALLS INSIDE THIS RANGE, on purpose.
 *
 * Today is the ninth, so a range of the fifth to the twelfth puts the ring on
 * a middle day — which is the third of its three backgrounds and the only one
 * no other story shows. `One day` has it on both ends at once and `States`
 * has a range that does not contain it at all, so between the three every
 * background the ring is drawn on is both photographed and measured.
 */
const STAY: DateRange = { start: '2026-09-05', end: '2026-09-12' };

/**
 * A range, across two months.
 *
 * **Worth doing with the keyboard.** The arrows walk a day, `Enter` sets an
 * end, and the range grows as focus moves — all of it the base's.
 *
 * **And worth pressing the heading**, which opens the months and then the
 * years, exactly as a single calendar does: the furniture is shared, and it
 * reads whichever of the two states is above it.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [stay, setStay] = useState<DateRange | null>(STAY);

      return (
        <InLima>
          <Room width={640} label="A 640px container — two months">
            <RangeCalendar {...args} value={stay} onChange={setStay} />
            <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
              {stay === null
                ? 'Nothing chosen yet.'
                : `Chosen: ${stay.start} to ${stay.end}`}
            </p>
          </Room>
        </InLima>
      );
    }

    return <Demo />;
  }
};

/**
 * The two structures, side by side, which is P4's own question asked of the
 * thing that decides.
 *
 * Two containers in one window: below the medium step one month, from it up
 * two. The boundary is the scale's, not a number of this component's own.
 */
export const Structures: Story = {
  render: args => (
    <InLima>
      <div className="catalog-row" style={{ alignItems: 'start' }}>
        <Room width={320} label="320px — one month">
          <RangeCalendar {...args} defaultValue={STAY} />
        </Room>
        <Room width={640} label="640px — two months">
          <RangeCalendar {...args} defaultValue={STAY} />
        </Room>
      </div>
    </InLima>
  )
};

/**
 * The states, and the range that crosses a month boundary.
 *
 * The band is one continuous shape rather than seven blocks, which is what the
 * cells being edge to edge buys — and the two ends carry the solid accent
 * pair, the same fill a single chosen day gets.
 */
export const States: Story = {
  render: args => (
    <InLima>
      <div className="catalog-row" style={{ alignItems: 'start' }}>
        <Room width={640} label="Across two months">
          <RangeCalendar
            {...args}
            defaultValue={{ start: '2026-09-27', end: '2026-10-06' }}
          />
        </Room>
        <Room width={640} label="Weekends unavailable, and disabled">
          <RangeCalendar
            {...args}
            defaultValue={STAY}
            isDateUnavailable={date => {
              const day = new Date(`${date}T00:00:00Z`).getUTCDay();
              return day === 0 || day === 6;
            }}
          />
          <RangeCalendar {...args} defaultValue={STAY} isDisabled />
        </Room>
      </div>
    </InLima>
  )
};

/**
 * A single day, chosen as both ends.
 *
 * Worth a story of its own because it is the one case where the two logical
 * corners land on the same cell, and a band with no middle has to read as one
 * pill rather than as two halves.
 */
export const OneDay: Story = {
  name: 'One day',
  render: args => (
    <InLima>
      <Room width={640} label="Start and end on the same day">
        <RangeCalendar
          {...args}
          defaultValue={{ start: '2026-09-09', end: '2026-09-09' }}
        />
      </Room>
    </InLima>
  )
};

/** Limits, which hold in all three views. */
export const Limits: Story = {
  render: args => (
    <InLima>
      <Room width={640} label="September and October 2026 only">
        <RangeCalendar
          {...args}
          defaultValue={STAY}
          minValue="2026-09-01"
          maxValue="2026-10-31"
        />
      </Room>
    </InLima>
  )
};

/**
 * RTL. The months read from the right, the arrows swap ends, and the range's
 * own corners follow — `rounded-s` is the side a reader arrives at first, and
 * nothing in the component knows which side that is.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <ConfigProvider locale="ar-EG" timeZone="Africa/Cairo">
      <div dir="rtl">
        <Room width={640} label="العربية">
          <RangeCalendar label="الإقامة" defaultValue={STAY} />
        </Room>
      </div>
    </ConfigProvider>
  )
};

/** Light, dark and compact — the three scopes on one page. */
export const Together: Story = {
  render: () => (
    <ConfigProvider timeZone="America/Lima">
      <div className="catalog-stack">
        <Room width={640} label="Light">
          <RangeCalendar label="Stay" defaultValue={STAY} />
        </Room>
        <Room width={640} label="Dark" mode="dark">
          <RangeCalendar label="Stay" defaultValue={STAY} />
        </Room>
        <Room width={640} label="Compact" density="compact">
          <RangeCalendar label="Stay" defaultValue={STAY} />
        </Room>
      </div>
    </ConfigProvider>
  )
};
