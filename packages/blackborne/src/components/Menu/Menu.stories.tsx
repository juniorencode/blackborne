/*
 * The visual catalog for Menu.
 *
 * Every photographed story uses `defaultOpen`, which is what makes these
 * baselines deterministic: a menu opened by a press is a menu whose picture
 * depends on the press having landed, and `Tooltip` and `Popover` both had to
 * grow a helper for that. A menu has an `isOpen` of its own, so it does not.
 *
 * And they use the shared `CentredLayerPage`, which is the fixture the layer
 * batch had seven copies of. The trigger sits in the middle so a menu has room
 * on every side of it, and the page lays nothing out itself — a layer
 * portalled into it arrives as a zero-height item (doc 08 §9).
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CentredLayerPage as Page } from '../../catalog/layerPage';
import { Button } from '../Button';
import { Menu, MenuItem, MenuSeparator } from './Menu';

const meta = {
  title: 'Components/Menu',
  component: Menu,
  args: { trigger: null, children: null },
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The invoice actions every row of a listing has. */
const Actions = ({ defaultOpen = false }: { defaultOpen?: boolean }) => (
  <Menu defaultOpen={defaultOpen} trigger={<Button>Actions</Button>}>
    <MenuItem onAction={() => {}}>Send to the customer</MenuItem>
    <MenuItem onAction={() => {}}>Duplicate</MenuItem>
    <MenuItem onAction={() => {}} isDisabled>
      Issue a credit note
    </MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger" onAction={() => {}}>
      Delete
    </MenuItem>
  </Menu>
);

/**
 * A menu of commands.
 *
 * **Worth doing with the keyboard**, because that is most of what a menu is
 * and none of it is written in this library: `Enter` or the down arrow opens
 * it with the first command highlighted, the arrows move, typing `d` skips to
 * Duplicate, `Escape` closes it without running anything, and focus goes back
 * to the button either way.
 *
 * Note that the disabled command is skipped by the arrows but still read by a
 * screen reader — it is announced as unavailable rather than hidden, which is
 * doc 06 §4 rule 7's better half.
 */
export const Overview: Story = {
  render: () => (
    <Page>
      <Actions />
    </Page>
  )
};

/**
 * Open, which is the state worth photographing.
 *
 * The destructive command is red **and** says "Delete": doc 06 §3 forbids
 * colour as the only channel, and the word is the other one. It sits below a
 * divider for the same reason — the gap is what stops a press meant for the
 * command above it.
 */
export const Open: Story = {
  render: () => (
    <Page>
      <Actions defaultOpen />
    </Page>
  )
};

/**
 * The highlight, on a command and on a destructive one.
 *
 * A menu has ONE highlight and the base moves it on hover as well as on a key,
 * so there is no separate hover state to show: the pointer and the keyboard
 * put the same mark in the same place. Two highlights at once would be two
 * answers to "where am I".
 */
export const Highlight: Story = {
  render: () => (
    <Page>
      <Menu defaultOpen trigger={<Button>Actions</Button>}>
        <MenuItem onAction={() => {}}>Send to the customer</MenuItem>
        <MenuItem onAction={() => {}}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" onAction={() => {}}>
          Delete
        </MenuItem>
      </Menu>
    </Page>
  )
};

/** Dark, where the raised surface is lighter than the page rather than
 * shadowed (doc 03 §5 rule 5). */
export const Dark: Story = {
  render: () => (
    <Page mode="dark">
      <Actions defaultOpen />
    </Page>
  )
};

/** Compact: the density axis reaches a portalled layer because it is mounted
 * inside the page that declares it. */
export const Compact: Story = {
  render: () => (
    <Page density="compact">
      <Actions defaultOpen />
    </Page>
  )
};

/**
 * RTL. The menu aligns to the other edge of its trigger, the commands read
 * from the right, and nothing in the component knows which side that is.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <Page dir="rtl" locale="ar-EG">
      <Menu defaultOpen trigger={<Button>إجراءات</Button>}>
        <MenuItem onAction={() => {}}>إرسال إلى العميل</MenuItem>
        <MenuItem onAction={() => {}}>تكرار</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" onAction={() => {}}>
          حذف
        </MenuItem>
      </Menu>
    </Page>
  )
};

/**
 * More commands than fit. The list scrolls, and the height is the base's: it
 * measures the room between the trigger and the edge of the window, so no
 * viewport query of ours decides it.
 *
 * The element that scrolls is the menu itself rather than the panel around it,
 * which is the lesson `Dialog` paid for — a browser scrolls the nearest
 * scrollable ancestor of what has focus, and in a menu that is the list.
 */
export const LongList: Story = {
  name: 'Long list',
  render: () => (
    <Page>
      <Menu defaultOpen trigger={<Button>Columns</Button>}>
        {[
          'Reference',
          'Customer',
          'Issued on',
          'Due on',
          'Net',
          'Tax',
          'Total',
          'Paid on',
          'Currency',
          'Exchange rate',
          'Cost centre',
          'Purchase order',
          'Notes',
          'Created by',
          'Updated by'
        ].map(column => (
          <MenuItem key={column} onAction={() => {}}>
            {column}
          </MenuItem>
        ))}
      </Menu>
    </Page>
  )
};

/**
 * A command longer than the menu is wide, which doc 05 §5 asks of everything.
 * The panel stops at `--container-narrow` and the label wraps; a menu that
 * grew to fit one sentence would have stopped being a menu.
 */
export const LongLabel: Story = {
  name: 'Long label',
  render: () => (
    <Page>
      <Menu defaultOpen trigger={<Button>Actions</Button>}>
        <MenuItem onAction={() => {}}>Send to the customer</MenuItem>
        <MenuItem onAction={() => {}}>
          Issue a credit note against this invoice and notify the accounts
          department
        </MenuItem>
      </Menu>
    </Page>
  )
};

/**
 * Where a menu actually goes: at the end of a row, behind a button with no
 * text.
 *
 * The button carries an accessible name and no label — doc 02 §11.3, and it is
 * the case that rule exists for. The menu is named by that button, so both
 * come from one string.
 */
export const InARow: Story = {
  name: 'In a row',
  render: () => (
    <Page>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          width: 420,
          padding: 12,
          borderRadius: 'var(--bb-radius-md)',
          border: '1px solid var(--bb-border)',
          background: 'var(--bb-surface-raised)',
          color: 'var(--bb-text)',
          fontSize: 14
        }}
      >
        <span>INV-4821 · Astilleros del Sur</span>
        <Menu
          defaultOpen
          trigger={
            <Button variant="ghost" size="sm" aria-label="Invoice actions">
              <span aria-hidden="true">⋯</span>
            </Button>
          }
        >
          <MenuItem onAction={() => {}}>Send to the customer</MenuItem>
          <MenuItem onAction={() => {}}>Duplicate</MenuItem>
          <MenuSeparator />
          <MenuItem tone="danger" onAction={() => {}}>
            Delete
          </MenuItem>
        </Menu>
      </div>
    </Page>
  )
};
