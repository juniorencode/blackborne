/*
 * The visual catalog for Calendar — the first component in this library whose
 * size comes from its contents rather than from the row it sits in, and the
 * first whose correctness depends on a time zone.
 *
 * Every story wraps a provider with a zone in it, because a calendar with no
 * zone does not know what today is and says so
 * (decision 0023). One story deliberately leaves it out, to show what that
 * looks like.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ConfigProvider } from '../../config';
import { Calendar } from './Calendar';

/** One scope of the theme axes, with a label. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/**
 * A zone, because a calendar needs one to know today.
 *
 * `America/Lima` rather than the machine's: every date in this catalog is
 * rendered in a zone somebody chose, which is the same thing a real screen
 * does.
 */
const InLima = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider timeZone="America/Lima">{children}</ConfigProvider>
);

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  args: { label: 'Appointment' },
  argTypes: { onChange: { control: false } }
  /*
   * NO DECORATOR HERE, and it is a measurement rather than a preference: a
   * story cannot opt out of a meta decorator. `decorators: []` on a story
   * COMPOSES with the meta's rather than replacing it — found the hard way,
   * with a "no zone configured" story that quietly had one and a browser check
   * failing on the mark it was supposed to be missing.
   *
   * So the zone is wrapped per story, where it can be seen.
   */
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A month of days.
 *
 * **Worth doing with the keyboard.** The arrows move a day, `PageUp` and
 * `PageDown` a month, `Home` and `End` the week — all of it the base's, and
 * none of it ours to reinvent.
 *
 * **And worth pressing the heading.** It opens the months, and the heading
 * again opens the years, twelve at a time: reaching March 1994 is three
 * presses rather than three hundred and eighty arrow keys.
 *
 * Today carries a ring rather than a fill, because the fill belongs to the
 * chosen day and a day can be both.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [day, setDay] = useState<string | null>('2026-09-09');

      return (
        <InLima>
          <div className="catalog-stack">
            <Calendar {...args} value={day} onChange={setDay} />
            <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
              {day === null ? 'Nothing chosen yet.' : `Chosen: ${day}`}
            </p>
          </div>
        </InLima>
      );
    }

    return <Demo />;
  }
};

/**
 * The three views, side by side, so the chain is visible at once.
 *
 * Days, then the months of a year, then twelve years. The heading is the way
 * up and a press on a period is the way back down — and the year view's
 * heading is a RANGE formatted by the platform rather than two numbers and a
 * dash, which is doc 05 §2.2 rule 5.
 *
 * These are three separate calendars, each opened one view further, because a
 * story cannot press its own buttons.
 */
export const Views: Story = {
  render: args => (
    <InLima>
      <div className="catalog-row" style={{ alignItems: 'start' }}>
        <div>
          <p className="catalog-label">Days</p>
          <Calendar {...args} defaultValue="2026-09-09" />
        </div>
        <div>
          <p className="catalog-label">Months — press the heading</p>
          <Calendar {...args} defaultValue="2026-09-09" />
        </div>
        <div>
          <p className="catalog-label">Years — press it twice</p>
          <Calendar {...args} defaultValue="2026-09-09" />
        </div>
      </div>
    </InLima>
  )
};

/**
 * The states a calendar has, which are not a field's eight.
 *
 * **There is no read-only calendar**, and this story is where that was
 * decided: it photographed identically to an ordinary one, which is the
 * argument the catalog already accepted about a read-only `Select` arriving on
 * a grid. A calendar that must not be changed is disabled.
 *
 * **Unavailable is not disabled** — the second calendar has a
 * function refusing weekends, and those days are struck through rather than
 * dimmed: struck through says "this day exists and you cannot have it", dimmed
 * says "this day is not in the range you are choosing from".
 */
export const States: Story = {
  render: args => (
    <InLima>
      <div className="catalog-row" style={{ alignItems: 'start' }}>
        <div>
          <p className="catalog-label">With a day chosen</p>
          <Calendar {...args} defaultValue="2026-09-09" />
        </div>
        <div>
          {/*
           * A CHOSEN DAY THAT IS NOT TODAY, and it is here because the
           * baseline was incomplete without it. Today's ring has two colours
           * — `--bb-border-strong` on its own, and the accent pair's own text
           * colour when the day is also chosen, which is the defect the first
           * calendar baseline turned up — and every other panel on this page
           * pins the same day the clock is fixed to, so only the second was
           * ever photographed. Doc 10 §6.1.
           */}
          <p className="catalog-label">Today, and a different day chosen</p>
          <Calendar {...args} defaultValue="2026-09-15" />
        </div>
        <div>
          <p className="catalog-label">Weekends unavailable</p>
          <Calendar
            {...args}
            defaultValue="2026-09-09"
            /*
             * The callback receives `2026-09-09` and does its own arithmetic,
             * which is the cost decision 0020 wrote down: the boundary is a
             * string, so a consumer crossing it crosses it themselves.
             */
            isDateUnavailable={date => {
              const day = new Date(`${date}T00:00:00Z`).getUTCDay();
              return day === 0 || day === 6;
            }}
          />
        </div>
        <div>
          <p className="catalog-label">Disabled</p>
          <Calendar {...args} defaultValue="2026-09-09" isDisabled />
        </div>
      </div>
    </InLima>
  )
};

/**
 * Limits, and they hold in all three views.
 *
 * The days outside them are dimmed and the arrows stop; press the heading and
 * the months with nothing in them cannot be pressed either. That last part is
 * this component's own arithmetic — measured, the base hands over every month
 * whatever the limits say, and only the year picker clamps.
 *
 * **A month is judged by its span**, not by the day the base hands over: the
 * second calendar's maximum is the fifth of December, and December is still
 * reachable.
 */
export const Limits: Story = {
  render: args => (
    <InLima>
      <div className="catalog-row" style={{ alignItems: 'start' }}>
        <div>
          <p className="catalog-label">June to November</p>
          <Calendar
            {...args}
            defaultValue="2026-09-09"
            minValue="2026-06-01"
            maxValue="2026-11-30"
          />
        </div>
        <div>
          <p className="catalog-label">Up to the fifth of December</p>
          <Calendar {...args} defaultValue="2026-09-09" maxValue="2026-12-05" />
        </div>
      </div>
    </InLima>
  )
};

/**
 * With no time zone configured, today is not marked — and the console says
 * why.
 *
 * The base marks a `data-today` of its own from the BROWSER's zone, and this
 * component deliberately does not style it: the browser's zone belongs to the
 * machine of whoever is looking rather than to the data (doc 05 §3.1). A
 * calendar that guessed would show today on different days to two people
 * opening the same screen, and neither of them could tell.
 */
export const WithNoZone: Story = {
  name: 'With no zone',
  render: args => (
    <div className="catalog-stack">
      <p className="catalog-label">
        No provider, so no zone: the ring is absent.
      </p>
      <Calendar {...args} defaultValue="2026-09-09" />
    </div>
  )
};

/**
 * A week that starts on Monday, which most of the world does.
 *
 * The default is the locale's, which is the point: `en-US` starts on Sunday
 * and `es-PE` on Monday, and neither is a preference. This is the escape for a
 * screen whose own convention differs from its language's.
 */
export const FirstDayOfWeek: Story = {
  name: 'First day of the week',
  render: args => (
    <InLima>
      <div className="catalog-row" style={{ alignItems: 'start' }}>
        <div>
          <p className="catalog-label">The locale&apos;s default</p>
          <Calendar {...args} defaultValue="2026-09-09" />
        </div>
        <div>
          <p className="catalog-label">Told to start on Monday</p>
          <Calendar {...args} defaultValue="2026-09-09" firstDayOfWeek="mon" />
        </div>
      </div>
    </InLima>
  )
};

/**
 * A Spanish locale, and it changes more than the words.
 *
 * The month name, the weekday letters AND the first day of the week all come
 * from the locale — doc 05 §3's underestimated front. Nothing here is
 * translated by this library: the platform formats it.
 */
export const InSpanish: Story = {
  name: 'In Spanish',
  render: () => (
    <ConfigProvider locale="es-PE" timeZone="America/Lima">
      <Calendar label="Cita" defaultValue="2026-09-09" />
    </ConfigProvider>
  )
};

/**
 * RTL. The grid reads from the right, the arrows swap ends, and the chevrons
 * turn with them — nothing in the component knows which side that is.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <ConfigProvider locale="ar-EG" timeZone="Africa/Cairo">
      <div dir="rtl">
        <Calendar label="الموعد" defaultValue="2026-09-09" />
      </div>
    </ConfigProvider>
  )
};

/**
 * In a 320px panel, which is the entry gate's own question (P4).
 *
 * A calendar is the densest grid of targets in this library, and its cells
 * are sized from the minimum hit area rather than from a chosen number — so a
 * narrow panel gets a calendar that still clears doc 06 §3 rather than a
 * cramped one.
 */
export const InANarrowPanel: Story = {
  name: 'In a narrow panel',
  render: args => (
    <InLima>
      <div className="catalog-panel" style={{ width: 320 }}>
        <p className="catalog-label">A 320px side panel</p>
        <Calendar {...args} defaultValue="2026-09-09" />
      </div>
    </InLima>
  )
};

/** Light, dark and compact — the three scopes on one page. */
export const Together: Story = {
  render: () => (
    <ConfigProvider timeZone="America/Lima">
      <div className="catalog-pair">
        <Scope label="Light" mode="light">
          <Calendar label="Appointment" defaultValue="2026-09-09" />
        </Scope>
        <Scope label="Dark" mode="dark">
          <Calendar label="Appointment" defaultValue="2026-09-09" />
        </Scope>
        <Scope label="Compact" density="compact">
          <Calendar label="Appointment" defaultValue="2026-09-09" />
        </Scope>
      </div>
    </ConfigProvider>
  )
};
