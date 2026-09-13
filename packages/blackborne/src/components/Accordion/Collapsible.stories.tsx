/*
 * The visual catalog for Collapsible, the section on its own.
 *
 * It has its own page rather than a story inside Accordion's, because it is a
 * component a consumer reaches for on its own and the difference between the
 * two is a decision rather than a detail: alone there is **no heading**, and
 * no level to pass. Doc 06 §2.1 case 2 — the disclosure pattern asks for
 * none, so the library invents none.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { SearchField } from '../SearchField';
import { Force } from '../../catalog/forceState';
import { Collapsible } from './Accordion';

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

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  args: { title: 'Advanced', children: 'Content' },
  argTypes: { title: { control: 'text' } }
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One block that is not always needed. The classic case in a management
 * screen: the filters above a table, folded away until somebody wants them.
 *
 * **The content is always in the page**, even closed — hidden with
 * `hidden="until-found"`, which is what lets a browser's find-in-page open the
 * section to show a match. Worth knowing before putting something expensive in
 * one: mount that yourself from `onExpandedChange`.
 */
export const Overview: Story = {
  render: args => (
    <div style={{ maxWidth: 520 }}>
      <Collapsible {...args} title="Filters">
        <div className="catalog-stack">
          <SearchField label="Customer" />
          <div className="catalog-row">
            <Button variant="primary" size="sm">
              Apply
            </Button>
            <Button variant="ghost" size="sm">
              Clear
            </Button>
          </div>
        </div>
      </Collapsible>
    </div>
  )
};

/** Open from the start, which is the uncontrolled shortcut (doc 02 §8). */
export const Open: Story = {
  render: args => (
    <div style={{ maxWidth: 520 }}>
      <Collapsible {...args} title="Notes" defaultExpanded>
        Everything that did not fit anywhere else on the form.
      </Collapsible>
    </div>
  )
};

/**
 * A count in the header, composed rather than passed.
 *
 * There is no `count` prop and no `icon` prop: the title is a node, so a
 * `Badge` or an icon goes in it (doc 02 §11.1, and P5 for the count). What
 * must NOT go in it is anything interactive — the whole row is the button that
 * opens the section, and a button inside a button behaves differently in every
 * browser.
 */
export const WithACount: Story = {
  name: 'With a count',
  render: args => (
    <div style={{ maxWidth: 520 }}>
      <Collapsible
        {...args}
        title={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Attachments <Badge tone="neutral">7</Badge>
          </span>
        }
      >
        Seven files, none of which anybody has opened since March.
      </Collapsible>
    </div>
  )
};

function AllStates({
  args
}: {
  args: React.ComponentProps<typeof Collapsible>;
}) {
  return (
    <div className="catalog-stack" style={{ maxWidth: 420 }}>
      <Collapsible {...args} title="Default">
        Content
      </Collapsible>
      <Force state="data-hovered" target=".bb-collapsible-trigger">
        <Collapsible {...args} title="Hover">
          Content
        </Collapsible>
      </Force>
      <Force state="data-pressed" target=".bb-collapsible-trigger">
        <Collapsible {...args} title="Pressed">
          Content
        </Collapsible>
      </Force>
      <Force state="data-focused" target=".bb-collapsible-trigger">
        <Collapsible {...args} title="Focus">
          Content
        </Collapsible>
      </Force>
      <Collapsible {...args} title="Disabled" isDisabled>
        Content
      </Collapsible>
      <Collapsible {...args} title="Open" defaultExpanded>
        The divider, the air and the chevron turned over.
      </Collapsible>
    </div>
  );
}

/**
 * Every state of the header, closed and open — and in BOTH modes.
 *
 * Hover, press and focus are reachable only by pointing at the thing, so they
 * are forced here, which makes this story the only place they are ever
 * rendered. A light-only one therefore leaves them unmeasured in dark by every
 * automated layer this repository has: axe reads a page that was rendered and
 * the visual suite photographs one. What lived in that gap on `Button` was a
 * pressed primary in dark at 2.08:1, under 501 stories and 211 baselines
 * (doc 10 §11.9).
 */
export const States: Story = {
  render: args => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <AllStates args={args} />
      </Scope>
      <Scope label="Dark" mode="dark">
        <AllStates args={args} />
      </Scope>
    </div>
  )
};

/** Light, dark and compact, on one page. */
export const Together: Story = {
  render: args => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <Collapsible {...args} title="Filters" defaultExpanded>
          Two of them, and a button to apply.
        </Collapsible>
      </Scope>
      <Scope label="Dark" mode="dark">
        <Collapsible {...args} title="Filters" defaultExpanded>
          Two of them, and a button to apply.
        </Collapsible>
      </Scope>
      <Scope label="Compact" density="compact">
        <Collapsible {...args} title="Filters" defaultExpanded>
          Two of them, and a button to apply.
        </Collapsible>
      </Scope>
      <Scope label="RTL · العربية" dir="rtl">
        <Collapsible {...args} title="عوامل التصفية" defaultExpanded>
          اثنان منها، وزر للتطبيق.
        </Collapsible>
      </Scope>
    </div>
  )
};

/**
 * A long title, in a narrow slot. The header wraps and the section grows; the
 * chevron keeps its size and its place (doc 05 §5).
 */
export const LongText: Story = {
  name: 'Long text',
  render: args => (
    <div className="catalog-panel" style={{ width: 320 }}>
      <p className="catalog-label">320px</p>
      <Collapsible
        {...args}
        title="Everything about this customer that nobody needs on the first pass"
        defaultExpanded
      >
        Including the fields that only exist because one country asks for them.
      </Collapsible>
    </div>
  )
};
