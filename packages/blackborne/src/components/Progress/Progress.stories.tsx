/*
 * A determinate bar. What only a browser answers: whether the fill is really
 * the width the value says, whether the fill can be told apart from the track
 * it sits in, and whether a bar with nothing above it sits flush against the
 * thing it belongs to.
 */
import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';
import { Card } from '../Card';
import { ConfigProvider } from '../../config';

const meta = {
  title: 'Components/Progress',
  component: Progress,
  args: { label: 'Uploading', value: 43 }
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * How much of something is done.
 *
 * The number is the point: a bar alone answers "is it moving", and the number
 * answers "how long", which is what somebody watching an upload is asking.
 */
export const Overview: Story = {
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 360 }}>
      <Progress {...args} />
    </div>
  )
};

/**
 * Running, so the transition can be watched.
 *
 * The fill moves with the normal duration token, which is what makes reduced
 * motion free — the tokens collapse every duration to zero under the
 * preference, and doc 09 §2 removes motion rather than softening it.
 */
export const Running: Story = {
  render: args => {
    function Demo() {
      const [value, setValue] = useState(8);

      useEffect(() => {
        const tick = setInterval(() => {
          setValue(current => (current >= 100 ? 8 : current + 11));
        }, 900);
        return () => clearInterval(tick);
      }, []);

      return (
        <div className="catalog-stack" style={{ maxWidth: 360 }}>
          <Progress {...args} value={value} />
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * The values worth looking at, and the two ends are the interesting ones.
 *
 * At 0 the fill has no width at all and the track has to still read as a
 * track; at 2 it is a dot rather than a sliver with square corners; at 100 the
 * fill's corners are the track's.
 */
export const States: Story = {
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 360 }}>
      {[0, 2, 43, 99, 100].map(value => (
        <Progress key={value} {...args} value={value} />
      ))}
    </div>
  )
};

/**
 * A unit instead of a percentage.
 *
 * "3 of 7 files" says more than "43%" when the unit is what somebody cares
 * about, and the announced text follows the visible one rather than staying a
 * percentage nobody wrote.
 */
export const AUnitOfItsOwn: Story = {
  name: 'A unit of its own',
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 360 }}>
      <Progress {...args} value={3} maxValue={7} valueLabel="3 of 7 files" />
      <Progress
        {...args}
        label="Importing"
        value={1840}
        maxValue={5000}
        valueLabel="1,840 of 5,000 rows"
      />
    </div>
  )
};

/**
 * A LINE UNDER SOMETHING, with both the label and the number hidden.
 *
 * The bar still has its name — `sr-only`, because a bar nobody can name is a
 * bar nobody can act on — and the row above it collapses so the line sits
 * against the thing it belongs to rather than a few pixels below it.
 */
export const ALineUnderSomething: Story = {
  name: 'A line under something',
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 360 }}>
      <Card>
        <p style={{ margin: 0 }}>Quarterly report.xlsx</p>
        <Progress
          label="Uploading Quarterly report.xlsx"
          value={68}
          size="sm"
          isLabelHidden
          isValueHidden
        />
      </Card>
    </div>
  )
};

/** The two thicknesses, beside each other. */
export const Sizes: Story = {
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 360 }}>
      <Progress {...args} label="Thin" size="sm" />
      <Progress {...args} label="Ordinary" size="md" />
    </div>
  )
};

/**
 * A locale decides how the number is written, and the library formats none of
 * it by hand: the base's own formatter does, against the language received.
 */
export const InEveryLocale: Story = {
  name: 'In every locale',
  render: () => (
    <div className="catalog-row" style={{ alignItems: 'start' }}>
      {(
        [
          ['en-US', 'Uploading'],
          ['es-PE', 'Subiendo'],
          ['ar-EG', 'جارٍ التحميل']
        ] as const
      ).map(([locale, label]) => (
        <div key={locale} className="catalog-panel" style={{ width: 220 }}>
          <p className="catalog-label">{locale}</p>
          <ConfigProvider locale={locale}>
            <Progress label={label} value={0.43} maxValue={1} />
          </ConfigProvider>
        </div>
      ))}
    </div>
  )
};

/** Light, dark and compact. */
export const Together: Story = {
  render: () => (
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
          <Progress label="Uploading" value={43} />
        </div>
      ))}
    </div>
  )
};
