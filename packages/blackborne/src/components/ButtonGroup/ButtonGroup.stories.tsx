/*
 * The visual catalog for ButtonGroup.
 *
 * WHAT TO LOOK AT IS THE SEAM, and there are three of them. A secondary group
 * has two borders pulled into one 1px line. A primary one has no visible
 * border at all — its border is its fill — so the line is mixed from the
 * pair's own text colour, and without it the row is one accent blob. A subtle
 * one is the same problem one step softer.
 *
 * And `The focus ring` is the picture no assertion replaces: the ring is a
 * border plus a 4px halo drawn as a box-shadow, the buttons overlap by a
 * pixel, and nothing in the DOM says whose shadow is on top.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button';
import { ButtonGroup, type ButtonGroupVariant } from './ButtonGroup';
import { Popover } from '../Popover';
import { Force } from '../../catalog/forceState';

const VARIANTS = ['primary', 'secondary', 'subtle'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

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

const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  args: { children: null }
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working group.
 *
 * **Worth doing with the keyboard.** Every button is its own stop, in order,
 * and the ring belongs to whichever one has focus rather than to the row —
 * because this is three buttons that look like one control, not one control
 * with three parts. A control with three parts and one value is a segmented
 * field, which is a different thing and is not built.
 *
 * Note that nothing here reports which one you last pressed. The group joins
 * actions; it holds no state and has nothing to select.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [density, setDensity] = useState<string | null>(null);

      return (
        <div className="catalog-stack">
          <ButtonGroup {...args}>
            <Button onPress={() => setDensity('comfortable')}>
              Comfortable
            </Button>
            <Button onPress={() => setDensity('cosy')}>Cosy</Button>
            <Button onPress={() => setDensity('compact')}>Compact</Button>
          </ButtonGroup>
          <p className="catalog-label">
            {density === null ? 'Nothing pressed yet' : `Pressed: ${density}`}
          </p>
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * The three appearances, in both modes.
 *
 * `ghost` and `link` are absent on purpose: neither draws a border or a fill,
 * so there is nothing for a seam to be made of and joining them would do
 * nothing at all. `danger` is absent for `SplitButton`'s reason — a row of
 * adjacent destructive actions that look identical is one misclick from the
 * wrong one.
 */
export const Variants: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Light', 'light'],
          ['Dark', 'dark']
        ] as const
      ).map(([label, mode]) => (
        <Scope key={label} label={label} mode={mode}>
          <div className="catalog-stack">
            {VARIANTS.map(variant => (
              <ButtonGroup key={variant} variant={variant}>
                <Button>Day</Button>
                <Button>Week</Button>
                <Button>Month</Button>
              </ButtonGroup>
            ))}
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * Every size, declared once for the row.
 *
 * The point of the group carrying it: a row where the third button is a
 * different height is a row that has to be read twice, and a size repeated on
 * every child is one value in three places.
 */
export const Sizes: Story = {
  render: () => (
    <div className="catalog-row">
      {SIZES.map(size => (
        <ButtonGroup key={size} size={size} variant="primary">
          <Button>Previous</Button>
          <Button>Next</Button>
        </ButtonGroup>
      ))}
    </div>
  )
};

/**
 * What a group does with a member that is not like the others.
 *
 * **A group of one keeps all four corners**, which is why the corners are
 * cleared and then restored on the two ends rather than squared per position:
 * the same element is both ends.
 *
 * **A member's own variant wins.** The group's appearance is a default for its
 * members, not a rule about them, so the primary in the middle row is written
 * the obvious way and the seams either side of it still line up.
 *
 * **A disabled member keeps its place in the row**, and a pending one keeps
 * its width — `Button` hides its label rather than removing it, so nothing
 * beside it moves under the cursor of somebody who just pressed it.
 */
export const States: Story = {
  render: () => (
    <div className="catalog-stack">
      <div className="catalog-row">
        <ButtonGroup>
          <Button>Only one</Button>
        </ButtonGroup>
        <ButtonGroup variant="primary">
          <Button>Only one</Button>
        </ButtonGroup>
      </div>
      <div className="catalog-row">
        <ButtonGroup>
          <Button>Draft</Button>
          <Button variant="primary">Publish</Button>
          <Button>Archive</Button>
        </ButtonGroup>
      </div>
      <div className="catalog-row">
        <ButtonGroup>
          <Button>Export</Button>
          <Button isDisabled>Import</Button>
          <Button>Print</Button>
        </ButtonGroup>
        <ButtonGroup variant="primary">
          <Button isPending>Saving</Button>
          <Button>Discard</Button>
        </ButtonGroup>
      </div>
      <div className="catalog-row">
        <ButtonGroup variant="primary">
          <Button>Day</Button>
          <Button isDisabled>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
        <ButtonGroup variant="subtle">
          <Button>Day</Button>
          <Button isDisabled>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      </div>
    </div>
  )
};

/** The three variants, each with the middle button's focus forced on. */
function FocusedRows() {
  return (
    <div className="catalog-stack">
      {VARIANTS.map(variant => (
        <Force
          key={variant}
          state="data-focused"
          target=".bb-button-group > *:nth-child(2)"
        >
          <ButtonGroup variant={variant as ButtonGroupVariant}>
            <Button>First</Button>
            <Button>Focused</Button>
            <Button>Third</Button>
          </ButtonGroup>
        </Force>
      ))}
    </div>
  );
}

/**
 * THE FOCUS RING, on the middle button of each variant.
 *
 * The ring is a 1px border and a 4px halo drawn as a box-shadow, and the
 * buttons overlap by a pixel so that one border does the work of two. Every
 * button is `position: relative` already — the pending spinner needs somewhere
 * to centre — so with no z-index the later sibling paints over the halo and
 * the ring of anything but the last button is cut in half down its trailing
 * edge.
 *
 * Nothing in the DOM is wrong when that happens, and no assertion can read a
 * box-shadow. This is the picture instead.
 *
 * AND IT IS IN BOTH MODES, because a forced state is rendered nowhere else.
 * `data-focused` is reachable only by pointing at the thing, so this is the
 * only page in this file that carries it at all — and a light-only one leaves
 * the ring in dark unmeasured by every automated layer here, since axe reads
 * what is rendered and the visual suite photographs it. `Button`'s states
 * story was light-only, and a pressed primary button in dark sat at 2.08:1
 * under 501 stories, 480 axe runs and 211 baselines, all green (doc 10 §11.9).
 */
export const TheFocusRing: Story = {
  name: 'The focus ring',
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <FocusedRows />
      </Scope>
      <Scope label="Dark" mode="dark">
        <FocusedRows />
      </Scope>
    </div>
  )
};

/**
 * A LAYER OPENED FROM INSIDE THE GROUP, which is where the context stops.
 *
 * The appearance of the set travels by context (doc 02 §3.1.1), and a React
 * context crosses a portal — so this popover is inside the group as far as
 * React is concerned. Its footer button is an ordinary `md` secondary rather
 * than the `sm` primary the row is made of, because every layer that can hold
 * a button closes the set around its content.
 *
 * A popover is the honest example rather than a dialog: it takes its trigger
 * as a prop, so its JSX naturally lands exactly where the trigger does —
 * inside the group. A `Dialog` is controlled and has no trigger, so it ends up
 * a sibling of the group and never meets the problem.
 *
 * Open it and look at the footer. That is the whole story.
 */
export const InALayer: Story = {
  name: 'In a layer',
  render: () => (
    <ButtonGroup size="sm" variant="primary">
      <Button>Rename</Button>
      <Popover
        title="Filters"
        trigger={<Button>Filter</Button>}
        footer={<Button>Apply</Button>}
      >
        <p>
          The footer below is the point: an ordinary button at the ordinary
          size, inside a layer opened from a row of small ones.
        </p>
      </Popover>
      <Button>Duplicate</Button>
    </ButtonGroup>
  )
};

/** RTL, where the round corners change ends and so does the seam. */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <div dir="rtl">
      <Scope label="العربية" dir="rtl">
        <div className="catalog-stack">
          <ButtonGroup variant="primary">
            <Button>يوم</Button>
            <Button>أسبوع</Button>
            <Button>شهر</Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button>السابق</Button>
            <Button>التالي</Button>
          </ButtonGroup>
        </div>
      </Scope>
    </div>
  )
};

/** Compact density, where the row loses air and keeps its type size. */
export const Compact: Story = {
  render: () => (
    <Scope label="Compact" density="compact">
      <div className="catalog-row">
        <ButtonGroup variant="primary">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      </div>
    </Scope>
  )
};

/** An overridden brand, which the primary seam follows without being told. */
export const BrandOverride: Story = {
  name: 'Brand override',
  render: () => (
    <Scope label="Overridden brand" brand>
      <div className="catalog-stack">
        <ButtonGroup variant="primary">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
        <ButtonGroup variant="subtle">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      </div>
    </Scope>
  )
};
