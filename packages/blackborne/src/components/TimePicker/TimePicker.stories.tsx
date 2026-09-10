/*
 * The visual catalog for TimePicker.
 *
 * WHAT TO LOOK AT is the list. This component is a `Select` with its rows
 * generated, so everything about the trigger, the panel and the tick is
 * already `Select`'s and already photographed — what is new here is which rows
 * exist and what they are called, and both of those change with the locale.
 *
 * `In every locale` is the picture that carries the argument: `en-US` and
 * `es-PE` both show a twelve-hour clock and disagree about how to write the
 * marker, and `ja-JP` shows twenty-four hours with no marker at all. The value
 * behind every one of those rows is `14:00`.
 *
 * AND EVERY OPEN STORY IS A `LayerPage`, which is not decoration: a list is
 * portalled, and the visual suite photographs `body` — whose box does not
 * include an absolutely positioned child. The first baseline of this component
 * came out as a trigger and the top two rows of its list, clipped where the
 * body ended. `LayerPage` is also the portal container, so the layer lands
 * INSIDE the element being captured, which is why every other open-list story
 * in this catalog uses it.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ConfigProvider } from '../../config';
import { LayerPage } from '../../catalog/layerPage';
import { TimePicker } from './TimePicker';

/** One scope of the theme axes, with a label and a declared locale. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  locale = 'en-US',
  brand = false,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  locale?: string;
  brand?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider locale={locale}>
      <div
        className="catalog-panel"
        data-bb-mode={mode}
        data-bb-density={density}
        dir={dir}
        style={{ width: 260 }}
        {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
      >
        <p className="catalog-label">{label}</p>
        {children}
      </div>
    </ConfigProvider>
  );
}

const meta = {
  title: 'Components/TimePicker',
  component: TimePicker,
  args: { label: 'Opens at', placeholder: 'Choose a time' }
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working picker.
 *
 * **There is nothing to type into**, which is the decision rather than an
 * omission: a segmented field cannot honour a minute step — the restriction
 * has no expression between the first keystroke and the second — so a control
 * offering quarter hours in a list and accepting `14:37` from the keyboard
 * would hold the rule in one half and break it in the other. An arbitrary
 * time is a `TimeField`.
 *
 * **Worth doing with the keyboard.** It is a `Select`, so `Enter` opens the
 * list, the arrows walk it, typing jumps by what a row SAYS — "9" reaches
 * 9:00 AM — and `Escape` closes it. None of that is this component's.
 *
 * Note what crosses the boundary below: `14:00`, whatever the row said.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [time, setTime] = useState<string | null>(null);

      return (
        <ConfigProvider locale="en-US">
          <div className="catalog-stack" style={{ width: 260 }}>
            <TimePicker
              {...args}
              value={time}
              onChange={setTime}
              minValue="08:00"
              maxValue="20:00"
            />
            <p className="catalog-label">
              {time === null ? 'Nothing chosen' : `Value: ${time}`}
            </p>
          </div>
        </ConfigProvider>
      );
    }

    return <Demo />;
  }
};

/**
 * The list, open, in both modes.
 *
 * Bounded to a morning at half-hour steps so the rows fit in a picture. At the
 * default step there are ninety-six of them, which the base's popover caps and
 * scrolls on its own.
 *
 * **The first row means no time**, and it is there because doc 07 §2.2 rule 5
 * says a field that opens a layer keeps the chevron and has no clear button —
 * on the grounds that emptying has a route costing no width. Every other field
 * with a list has a consumer writing its options; this one generates them, so
 * it provides the route itself.
 */
export const Opened: Story = {
  render: () => (
    <LayerPage label="The page behind, so the list has something to sit on.">
      <div style={{ width: 260 }}>
        <TimePicker
          label="Opens at"
          placeholder="Choose a time"
          defaultValue="09:30"
          step={30}
          minValue="09:00"
          maxValue="12:00"
          defaultOpen
        />
      </div>
    </LayerPage>
  )
};

/** The same list on the dark surface. */
export const Dark: Story = {
  render: () => (
    <LayerPage mode="dark" label="The page behind.">
      <div style={{ width: 260 }}>
        <TimePicker
          label="Opens at"
          placeholder="Choose a time"
          defaultValue="09:30"
          step={30}
          minValue="09:00"
          maxValue="12:00"
          defaultOpen
        />
      </div>
    </LayerPage>
  )
};

/**
 * EVERY STATE, closed.
 *
 * A required picker offers no no-time row: there is nothing to return to.
 * Everything else here is `Select`'s own — the invalid edge, the disabled
 * surface, the busy state that takes the chevron's room without leaving a
 * control that will not open.
 */
export const States: Story = {
  render: () => (
    <Scope label="Light">
      <div className="catalog-stack">
        <TimePicker label="Empty" placeholder="Choose a time" />
        <TimePicker
          label="Chosen"
          placeholder="Choose a time"
          defaultValue="14:15"
        />
        <TimePicker
          label="With help"
          placeholder="Choose a time"
          description="Quarter hours only"
        />
        <TimePicker
          label="Required"
          placeholder="Choose a time"
          isRequired
          step={60}
        />
        <TimePicker
          label="Invalid"
          placeholder="Choose a time"
          isInvalid
          errorMessage="Choose an opening time"
        />
        <TimePicker
          label="Disabled"
          placeholder="Choose a time"
          defaultValue="09:00"
          isDisabled
        />
        <TimePicker label="Loading" placeholder="Choose a time" isLoading />
      </div>
    </Scope>
  )
};

/**
 * THE SAME TIME IN THREE LOCALES, with the list open.
 *
 * The rows are formatted by the platform against UTC — a time of day has no
 * zone, which is the same argument the calendar's month headings use — so what
 * changes here is the locale and nothing else.
 *
 * `en-US` and `es-PE` are the pair worth reading twice: both are twelve-hour
 * locales and they disagree about how to write the marker, `PM` against
 * `p. m.`, spacing and full stops included. That measurement is why a time
 * crosses this library's boundary as `14:00` rather than as whatever a
 * formatter produced.
 */
export const InEveryLocale: Story = {
  name: 'In every locale',
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['English', 'en-US'],
          ['Spanish (Peru)', 'es-PE'],
          ['Japanese', 'ja-JP']
        ] as const
      ).map(([label, locale]) => (
        <Scope key={locale} label={label} locale={locale}>
          <TimePicker
            label="Opens at"
            placeholder="Choose a time"
            defaultValue="14:00"
            step={60}
            minValue="12:00"
            maxValue="16:00"
          />
        </Scope>
      ))}
    </div>
  )
};

/** RTL, with the list open against the other edge of the trigger. */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <LayerPage dir="rtl" locale="ar-EG" label="الصفحة خلفه.">
      <div style={{ width: 260 }}>
        <TimePicker
          label="يفتح في"
          placeholder="اختر وقتًا"
          defaultValue="09:30"
          step={30}
          minValue="09:00"
          maxValue="11:00"
          defaultOpen
        />
      </div>
    </LayerPage>
  )
};

/** Compact density, where the rows lose air and keep their type size. */
export const Compact: Story = {
  render: () => (
    <LayerPage density="compact" label="The page behind.">
      <div style={{ width: 260 }}>
        <TimePicker
          label="Opens at"
          placeholder="Choose a time"
          defaultValue="09:30"
          step={30}
          minValue="09:00"
          maxValue="11:00"
          defaultOpen
        />
      </div>
    </LayerPage>
  )
};

/** An overridden brand, which the tick and the highlight both follow. */
export const BrandOverride: Story = {
  name: 'Brand override',
  render: () => (
    <LayerPage brand label="The page behind.">
      <div style={{ width: 260 }}>
        <TimePicker
          label="Opens at"
          placeholder="Choose a time"
          defaultValue="09:30"
          step={30}
          minValue="09:00"
          maxValue="11:00"
          defaultOpen
        />
      </div>
    </LayerPage>
  )
};
