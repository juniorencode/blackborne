/*
 * The visual catalog for Tabs.
 *
 * `Structures` is the story this component exists to be looked at in, and the
 * second in the library to show doc 04's level N3: the same tabs at three
 * widths, and two different components. The widths are chosen against the
 * scale rather than by eye — the root's own width is what the query asks
 * about, and `.catalog-panel` is content-box, so the number it is given is the
 * number the component gets:
 *
 *   320px → 20rem   → narrower than `narrow` (24rem) → a select
 *   440px → 27.5rem → `narrow`                       → a select
 *   560px → 35rem   → `medium`                       → a row of tabs
 *
 * Worth resizing the catalog's own frame once, on the `Overview` story: the
 * row becomes a select and back with no reload, and the tab you were on stays
 * the tab you were on.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../Badge';
import { Force } from '../../catalog/forceState';
import { Tab } from './Tab';
import { Tabs } from './Tabs';

/** One scope of the theme axes, with a label and a width. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  brand = false,
  width,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  brand?: boolean;
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
      {...(width === undefined ? {} : { style: { width } })}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/*
 * The same three tabs everywhere, so that what changes between stories is only
 * the structure — and written as a VALUE rather than as a component, which is
 * the one constraint this API has and it caught the first draft of this file.
 *
 * A `Tab` is read rather than rendered, so `Tabs` looks for `Tab` elements
 * among its children. A fragment is walked into and an array is flattened, so
 * both of these work:
 *
 *   const invoice = <>…</>            {invoice}
 *   {rows.map(row => <Tab key={row.id} …/>)}
 *
 * What cannot work is a component of your own that returns tabs — the element
 * in the tree is yours, its props are yours, and nothing about it says "tab".
 * Every collection API has this constraint; `Tabs` says so in development
 * instead of quietly rendering nothing, which is what the first draft here did.
 */
const invoice = (
  <>
    <Tab id="lines" title="Lines">
      Three line items, and what they cost.
    </Tab>
    <Tab id="tax" title="Tax">
      Eighteen per cent, and where it applies.
    </Tab>
    <Tab id="history" title="History">
      Who changed this, and when.
    </Tab>
  </>
);

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: { label: 'Invoice', children: null }
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working set of tabs.
 *
 * **Worth doing with the keyboard**: `Tab` reaches the row, the arrows move
 * along it and open each one as they arrive, and `Tab` again goes into the
 * panel — which is focusable because the content behind a tab has to be
 * reachable without a mouse.
 *
 * And worth doing with the frame: drag the catalog's own edge narrower and the
 * row becomes a select at the medium step, with the same tab still open.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [open, setOpen] = useState('lines');

      return (
        <div className="catalog-stack">
          <Tabs {...args} selectedKey={open} onSelectionChange={setOpen}>
            {invoice}
          </Tabs>
          <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
            Open: {open}
          </p>
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * **The story this component exists for.** The same tabs at three widths, and
 * two structures.
 *
 * Below the medium step there is no room for a row of labels side by side, so
 * the row becomes a `Select` — and it is a select, not a tab list in disguise:
 * nothing in the narrow structure announces itself as a tab, because a tabpanel
 * announced where no tablist is reachable is semantics nobody can act on
 * (doc 06 §2).
 *
 * The first paint is always the select. A `ResizeObserver` reports after
 * layout, so the wider structure cannot be known before painting, and doc 04
 * §4.1 makes the choice mechanical rather than a judgement: start narrow,
 * widen once measured.
 */
export const Structures: Story = {
  render: args => (
    <div className="catalog-stack">
      <Scope label="320px · the floor, a select" width={320}>
        <Tabs {...args} defaultSelectedKey="tax">
          {invoice}
        </Tabs>
      </Scope>
      <Scope label="440px · narrow, still a select" width={440}>
        <Tabs {...args} defaultSelectedKey="tax">
          {invoice}
        </Tabs>
      </Scope>
      <Scope label="560px · medium, a row of tabs" width={560}>
        <Tabs {...args} defaultSelectedKey="tax">
          {invoice}
        </Tabs>
      </Scope>
    </div>
  )
};

/**
 * The states of one tab, in the row.
 *
 * Four rows, and the third is the one that catches a mistake: **hover and
 * focus belong to the tab**, not to the component around it, so the forced
 * state names the tab it belongs to. A state written on the wrong element
 * lands in the DOM, matches no rule, and photographs identically to the
 * default — which is what the catalog's own helper exists to prevent and has
 * now caught three times.
 */
export const States: Story = {
  render: args => (
    <div className="catalog-stack">
      <Scope label="Default · the first tab is open" width={560}>
        <Tabs {...args}>{invoice}</Tabs>
      </Scope>
      <Scope label="Hover, on the tab that is not open" width={560}>
        <Force state="data-hovered" target=".bb-tabs-tab:nth-child(2)">
          <Tabs {...args}>{invoice}</Tabs>
        </Force>
      </Scope>
      <Scope label="Focus, on the tab that is not open" width={560}>
        <Force state="data-focused" target=".bb-tabs-tab:nth-child(2)">
          <Tabs {...args}>{invoice}</Tabs>
        </Force>
      </Scope>
      <Scope label="A tab that is present and not selectable" width={560}>
        <Tabs {...args}>
          <Tab id="lines" title="Lines">
            Three line items, and what they cost.
          </Tab>
          <Tab id="tax" title="Tax" isDisabled>
            Eighteen per cent, and where it applies.
          </Tab>
          <Tab id="history" title="History">
            Who changed this, and when.
          </Tab>
        </Tabs>
      </Scope>
    </div>
  )
};

/**
 * More tabs than fit, in a container wide enough to stay a row.
 *
 * The row **wraps**. A container query counts pixels and cannot know whether
 * these particular words fit, so the structural change alone would leave eight
 * long titles overflowing a wide container — and doc 04 §7 is blunt about what
 * that costs: content hidden by overflow is content lost. Wrapping is the
 * floor that holds at any width and needs no measurement, which is the answer
 * `Breadcrumbs` reached before its collapse existed.
 *
 * What wrapping costs is visible here and is the reason to look at this story
 * rather than trust it: the list's rule sits under the LAST row, so a selected
 * tab in the first row carries its mark in the middle of the block. It is the
 * shape of every wrapped tab row there has ever been, and it only happens when
 * there are more tabs than fit — which is a screen worth reconsidering anyway.
 */
export const Wrapping: Story = {
  render: args => (
    <Scope label="560px, six long titles" width={560}>
      <Tabs {...args}>
        <Tab id="a" title="Lines and amounts">
          What is being charged for.
        </Tab>
        <Tab id="b" title="Tax and exemptions">
          Eighteen per cent, and where it applies.
        </Tab>
        <Tab id="c" title="Payment history">
          Who paid what, and when.
        </Tab>
        <Tab id="d" title="Delivery addresses">
          Where it goes.
        </Tab>
        <Tab id="e" title="Attached documents">
          What came with it.
        </Tab>
        <Tab id="f" title="Internal notes">
          What nobody outside sees.
        </Tab>
      </Tabs>
    </Scope>
  )
};

/**
 * A title that is not only a word.
 *
 * A count beside the label is the case that rejected an `items` array in the
 * first place: a configuration object cannot hold a badge. What comes with it
 * is `textValue` — the base derives a collection item's searchable text from
 * its children, and anything that is not a string derives nothing, which is
 * how a typeahead stops working with a development warning nobody reads. It
 * was measured on `Select` and it is the same trap one level up.
 */
export const RichTitles: Story = {
  name: 'Titles with a count',
  render: args => (
    <Scope label="560px" width={560}>
      <Tabs {...args}>
        <Tab
          id="lines"
          textValue="Lines"
          title={
            <>
              Lines <Badge>3</Badge>
            </>
          }
        >
          Three line items, and what they cost.
        </Tab>
        <Tab
          id="problems"
          textValue="Problems"
          title={
            <>
              Problems <Badge tone="danger">2</Badge>
            </>
          }
        >
          Two things need attention.
        </Tab>
        <Tab id="history" title="History">
          Who changed this, and when.
        </Tab>
      </Tabs>
    </Scope>
  )
};

/** Dark, where the selected tab's rule carries the accent and nothing else
 * changes colour. */
export const Dark: Story = {
  render: args => (
    <Scope label="Dark" mode="dark" width={560}>
      <Tabs {...args}>{invoice}</Tabs>
    </Scope>
  )
};

/** Compact: the row loses air, not legibility (doc 03 §7). */
export const Compact: Story = {
  render: args => (
    <Scope label="Compact" density="compact" width={560}>
      <Tabs {...args}>{invoice}</Tabs>
    </Scope>
  )
};

/**
 * RTL. The row reads from the right, the rule under the open tab is the same
 * rule, and nothing in the component knows which side that is.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <Scope label="RTL · العربية" dir="rtl" width={560}>
      <Tabs label="الفاتورة">
        <Tab id="lines" title="السطور">
          ثلاثة أسطر، وما تكلفه.
        </Tab>
        <Tab id="tax" title="الضريبة">
          ثمانية عشر بالمئة.
        </Tab>
        <Tab id="history" title="السجل">
          من غيّر هذا، ومتى.
        </Tab>
      </Tabs>
    </Scope>
  )
};

/** An overridden brand, which has to reach the one thing that marks the open
 * tab: the rule under it. */
export const BrandOverride: Story = {
  name: 'Brand override',
  render: args => (
    <Scope label="An overridden brand" brand width={560}>
      <Tabs {...args}>{invoice}</Tabs>
    </Scope>
  )
};

/** Light, dark and compact side by side, never by toggling (doc 03 §6). */
export const Together: Story = {
  render: args => (
    <div className="catalog-stack">
      <Scope label="Light" width={560}>
        <Tabs {...args}>{invoice}</Tabs>
      </Scope>
      <Scope label="Dark" mode="dark" width={560}>
        <Tabs {...args}>{invoice}</Tabs>
      </Scope>
      <Scope label="Compact" density="compact" width={560}>
        <Tabs {...args}>{invoice}</Tabs>
      </Scope>
    </div>
  )
};
