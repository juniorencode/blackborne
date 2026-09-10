/*
 * The half of a stepper that only informs. What only a browser answers: what
 * the four states look like beside each other in greyscale, and what the row
 * becomes when the container runs out of room for the titles.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Step, Steps } from './Steps';
import { Progress } from '../Progress';

const meta = {
  title: 'Components/Steps',
  component: Steps,
  args: { label: 'Onboarding', children: null }
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A CONTAINER, DECLARED, because `Steps` reads one and declares none of its
 * own: a component declares a query container only if it declares a width
 * (doc 04 §4.3), and a row of steps is as wide as it is given.
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

/**
 * Where somebody is in a process something else is driving.
 *
 * **Nothing here is pressable**, which is the whole decision: the half that
 * navigates is `Tabs` with disabled tabs, and permission to skip a step is
 * validation, which belongs to the project (decision 0015).
 */
export const Overview: Story = {
  render: args => (
    <Room width={640} label="A 640px container">
      <Steps {...args}>
        <Step status="completed">Details</Step>
        <Step status="active" description="Two documents">
          Documents
        </Step>
        <Step>Review</Step>
        <Step>Signature</Step>
      </Steps>
    </Room>
  )
};

/**
 * The four states, and they have to be tellable apart in greyscale.
 *
 * Doc 06 §3 forbids colour as the only channel, so the shapes carry it: an
 * outline with a number, a solid fill with a number, a soft fill with a tick,
 * and a soft fill with the danger silhouette. The two glyphs are the shared
 * ones `Alert` and `Toast` use, which is what decision 0015 asked for — a step
 * in error looks like every other error in the library.
 */
export const States: Story = {
  render: args => (
    <Room width={640} label="Pending, active, completed, error">
      <Steps {...args}>
        <Step status="completed">Completed</Step>
        <Step status="active">Active</Step>
        <Step status="error" description="Two pages missing">
          Error
        </Step>
        <Step>Pending</Step>
      </Steps>
    </Room>
  )
};

/**
 * THE TWO STRUCTURES, side by side in one window — P4's own question asked of
 * the thing that decides.
 *
 * Below the `medium` step the titles go out of sight and the indicators stay.
 * A row of seven titles at 320px is either seven words of two letters or a
 * scroll nobody asked for. The titles are still in the tree: nothing here is
 * focusable, so hiding them from the eye costs a reader nothing.
 */
export const Structures: Story = {
  render: args => (
    <div className="catalog-row" style={{ alignItems: 'start' }}>
      <Room width={320} label="320px — indicators only">
        <Steps {...args}>
          <Step status="completed">Details</Step>
          <Step status="completed">Documents</Step>
          <Step status="active">Review</Step>
          <Step>Signature</Step>
        </Steps>
      </Room>
      <Room width={640} label="640px — with the titles">
        <Steps {...args}>
          <Step status="completed">Details</Step>
          <Step status="completed">Documents</Step>
          <Step status="active">Review</Step>
          <Step>Signature</Step>
        </Steps>
      </Room>
    </div>
  )
};

/**
 * Beside `Progress`, which is the same question asked with a single number.
 *
 * Decision 0015 asked that whichever was built second read the first, or the
 * library would end up with two vocabularies for one idea. So they share the
 * label and the rule that neither decides when to appear.
 */
export const BesideProgress: Story = {
  name: 'Beside Progress',
  render: () => (
    <Room width={640} label="The same question, two amounts of detail">
      <div className="catalog-stack">
        <Steps label="Onboarding">
          <Step status="completed">Details</Step>
          <Step status="active">Documents</Step>
          <Step>Review</Step>
        </Steps>
        <Progress
          label="Onboarding"
          value={1}
          maxValue={3}
          valueLabel="1 of 3"
        />
      </div>
    </Room>
  )
};

/**
 * A step rendered conditionally, which is what the CSS counter is for.
 *
 * The numbers are 1, 2, 3 whether or not the optional step is there — CSS
 * counts and re-evaluates on its own, where an index computed in JavaScript
 * would go stale. `Breadcrumbs` chose CSS over counting for the same reason.
 */
export const AnOptionalStep: Story = {
  name: 'An optional step',
  render: args => (
    <div className="catalog-row" style={{ alignItems: 'start' }}>
      <Room width={560} label="Without the optional step">
        <Steps {...args}>
          <Step status="completed">Details</Step>
          <Step status="active">Review</Step>
        </Steps>
      </Room>
      <Room width={560} label="With it">
        <Steps {...args}>
          <Step status="completed">Details</Step>
          <Step status="completed">Documents</Step>
          <Step status="active">Review</Step>
        </Steps>
      </Room>
    </div>
  )
};

/** RTL, where the row reads from the right and so do the connectors. */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <div dir="rtl">
      <Room width={640} label="العربية">
        <Steps label="التسجيل">
          <Step status="completed">البيانات</Step>
          <Step status="active">المستندات</Step>
          <Step>المراجعة</Step>
        </Steps>
      </Room>
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
        <Room
          key={label}
          width={560}
          label={label}
          mode={mode}
          density={density}
        >
          <Steps label="Onboarding">
            <Step status="completed">Details</Step>
            <Step status="active">Documents</Step>
            <Step status="error">Review</Step>
            <Step>Signature</Step>
          </Steps>
        </Room>
      ))}
    </div>
  )
};
