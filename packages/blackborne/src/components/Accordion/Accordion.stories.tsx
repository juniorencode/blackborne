/*
 * The visual catalog for Accordion.
 *
 * The states worth photographing are not the ones a control usually has. A
 * section has an OPEN state as well as a hovered one, and the open state is
 * the interesting picture: the divider, the air inside the panel, and the
 * chevron turned over. `defaultExpandedKeys` puts it there at rest, so no
 * story here needs to be pressed before it can be captured.
 *
 * The one thing no screenshot can show is the height animation, and that is
 * not a shortfall: the visual project finishes every animation before it
 * captures — which is what makes the baselines reproducible at a zero pixel
 * threshold — and a finished animation is the open state, which is already
 * here. It is measured in `apps/catalog/e2e/accordion.spec.ts` instead.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card } from '../Card';
import { Force } from '../../catalog/forceState';
import { Accordion, Collapsible } from './Accordion';

/** One scope of the theme axes, with a label. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  brand = false,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  brand?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/** The header of the trigger is the whole row, so the count goes in the title. */
function Sections() {
  return (
    <>
      <Collapsible
        id="billing"
        title={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Billing details <Badge tone="warning">2 missing</Badge>
          </span>
        }
      >
        Invoice address, tax number and the currency everything is issued in.
      </Collapsible>
      <Collapsible id="tax" title="Tax codes">
        Each line of an invoice carries one. A line without one is excluded from
        the totals.
      </Collapsible>
      <Collapsible id="access" title="Who can see this customer">
        Nothing here is inherited: a team with no explicit access sees no rows
        at all.
      </Collapsible>
    </>
  );
}

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  args: { headingLevel: 3, children: null },
  argTypes: {
    headingLevel: { control: 'select', options: [2, 3, 4, 5, 6] }
  }
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Three sections, one open at a time.
 *
 * **Worth trying with the keyboard**, because two things only show in the
 * doing: `Tab` reaches each header and nothing else while they are closed, and
 * `Enter` and `Space` both open one — which is doc 09 §8's table, where
 * `Enter` confirms the action of the current context and `Space` toggles.
 *
 * And worth trying with ctrl-F: search for a word inside a closed section and
 * the browser opens it to show you. That is `hidden="until-found"`, and it is
 * the reason a closed panel stays in the page.
 */
export const Overview: Story = {
  render: args => (
    <div style={{ maxWidth: 560 }}>
      <Accordion {...args}>
        <Sections />
      </Accordion>
    </div>
  )
};

/**
 * Every state of a header, plus the two a section has that a control does
 * not: open, and open while disabled.
 *
 * The forced states are put on the BUTTON rather than on the section — see
 * the note in `forceState`, which this component is the reason for.
 */
export const States: Story = {
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 460 }}>
      <div>
        <p className="catalog-label">closed</p>
        <Accordion {...args}>
          <Collapsible title="Default">Content</Collapsible>
          <Force state="data-hovered" target=".bb-collapsible-trigger">
            <Collapsible title="Hover">Content</Collapsible>
          </Force>
          <Force state="data-pressed" target=".bb-collapsible-trigger">
            <Collapsible title="Pressed">Content</Collapsible>
          </Force>
          <Force state="data-focused" target=".bb-collapsible-trigger">
            <Collapsible title="Focus">Content</Collapsible>
          </Force>
          <Collapsible title="Disabled" isDisabled>
            Content
          </Collapsible>
        </Accordion>
      </div>
      <div>
        <p className="catalog-label">open</p>
        {/*
          `allowsMultipleExpanded`, or the second key is ignored and the
          disabled-and-open state never appears — which is exactly what the
          first baseline showed: two sections asked to be open and one of them
          shut.
        */}
        <Accordion
          {...args}
          allowsMultipleExpanded
          defaultExpandedKeys={['open', 'off']}
        >
          <Collapsible id="open" title="Default">
            The divider, the air and the chevron turned over.
          </Collapsible>
          <Collapsible id="off" title="Disabled" isDisabled>
            A section can be open and switched off: the content stays readable
            and the header does not respond.
          </Collapsible>
        </Accordion>
      </div>
    </div>
  )
};

/** Several open at once, which is the other half of the group's reason to exist. */
export const Multiple: Story = {
  render: args => (
    <div style={{ maxWidth: 560 }}>
      <Accordion
        {...args}
        allowsMultipleExpanded
        defaultExpandedKeys={['billing', 'tax']}
      >
        <Sections />
      </Accordion>
    </div>
  )
};

/** Light and dark. The raised surface is lighter than the page in dark mode,
 * not shadowed (doc 03 §5 rule 5). */
export const Modes: Story = {
  render: args => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <Accordion {...args} defaultExpandedKeys={['tax']}>
          <Sections />
        </Accordion>
      </Scope>
      <Scope label="Dark" mode="dark">
        <Accordion {...args} defaultExpandedKeys={['tax']}>
          <Sections />
        </Accordion>
      </Scope>
    </div>
  )
};

/**
 * Density trims the air in the header and in the panel, and the gap between
 * sections with it. No colour moves, and the type size does not either
 * (doc 03 §3).
 */
export const Densities: Story = {
  render: args => (
    <div className="catalog-pair">
      <Scope label="Normal" density="normal">
        <Accordion {...args} defaultExpandedKeys={['tax']}>
          <Sections />
        </Accordion>
      </Scope>
      <Scope label="Compact" density="compact">
        <Accordion {...args} defaultExpandedKeys={['tax']}>
          <Sections />
        </Accordion>
      </Scope>
    </div>
  )
};

/**
 * RTL. The title starts on the right and the chevron moves to the left, from
 * `justify-between` and no physical direction anywhere in the component.
 *
 * The chevron itself does **not** turn round, and that is correct: it points
 * down, and down is down in Arabic. Doc 05 §4 flips what is directional along
 * the inline axis.
 */
export const Direction: Story = {
  name: 'RTL',
  render: args => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <Accordion {...args} defaultExpandedKeys={['one']}>
          <Collapsible id="one" title="Billing details">
            Invoice address and tax number.
          </Collapsible>
          <Collapsible id="two" title="Tax codes">
            One per line.
          </Collapsible>
        </Accordion>
      </Scope>
      <Scope label="RTL · العربية" dir="rtl">
        <Accordion {...args} defaultExpandedKeys={['one']}>
          <Collapsible id="one" title="تفاصيل الفاتورة">
            عنوان الفاتورة والرقم الضريبي.
          </Collapsible>
          <Collapsible id="two" title="الرموز الضريبية">
            واحد لكل سطر.
          </Collapsible>
        </Accordion>
      </Scope>
    </div>
  )
};

/**
 * An overridden brand, with a header focused. The only brand-coloured thing a
 * section has is its focus ring, and that is exactly what has to follow the
 * theme (doc 03 §7).
 */
export const BrandOverride: Story = {
  name: 'Overridden brand',
  render: args => (
    <div className="catalog-pair">
      <Scope label="Library brand">
        <Accordion {...args}>
          <Force state="data-focused" target=".bb-collapsible-trigger">
            <Collapsible title="Billing details">Content</Collapsible>
          </Force>
        </Accordion>
      </Scope>
      <Scope label="Overridden" brand>
        <Accordion {...args}>
          <Force state="data-focused" target=".bb-collapsible-trigger">
            <Collapsible title="Billing details">Content</Collapsible>
          </Force>
        </Accordion>
      </Scope>
    </div>
  )
};

/**
 * A long title and a long body, which doc 05 §5 asks of everything: the
 * header wraps and grows, the chevron holds its size and stays on the first
 * line's centre, and nothing overflows sideways.
 */
export const LongText: Story = {
  name: 'Long text',
  render: args => (
    <div style={{ maxWidth: 420 }}>
      <Accordion {...args} defaultExpandedKeys={['long']}>
        <Collapsible
          id="long"
          title="Who is allowed to see this customer, and what happens to the rows nobody has been given access to"
        >
          Nothing here is inherited from a parent team, which is the part that
          surprises people: a team with no explicit access sees no rows at all
          rather than the rows of the team above it.
        </Collapsible>
        <Collapsible id="short" title="Tax codes">
          One per line.
        </Collapsible>
      </Accordion>
    </div>
  )
};

/**
 * In a 320px slot, which is P4's test. Nothing here is a query — the header
 * is a flex row that wraps and the panel is text — so it holds at any width
 * without a single container query (doc 04 §3).
 */
export const NarrowContainer: Story = {
  name: 'Narrow container',
  render: args => (
    <div className="catalog-pair">
      <div className="catalog-panel" style={{ width: 320 }}>
        <p className="catalog-label">320px</p>
        <Accordion {...args} defaultExpandedKeys={['billing']}>
          <Sections />
        </Accordion>
      </div>
    </div>
  )
};

/**
 * Inside a `Card`, which is where one of these usually lives — and the
 * composite shot doc 09 §10 asks for, where three greys you thought were one
 * show up. The card's surface, the section's surface and the page's are three
 * different tokens.
 */
export const InsideACard: Story = {
  name: 'Inside a Card',
  render: args => (
    <div style={{ maxWidth: 560 }}>
      <Card>
        <div className="catalog-stack">
          <Accordion {...args} defaultExpandedKeys={['tax']}>
            <Sections />
          </Accordion>
          <div className="catalog-row">
            <Button variant="primary">Save</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  )
};
