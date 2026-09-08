/*
 * The visual catalog for Drawer.
 *
 * Read the note at the top of `Dialog.stories.tsx` first: a layer renders in a
 * portal, so `data-bb-mode` on a catalog panel never reaches it, and the way
 * round is to pass a themed element as `portalContainer`. `Page` below is that
 * host, and it is duplicated from Dialog's file rather than shared — every
 * story file in this repository carries its own `Scope`, and a shared helper
 * would have to live in the package's own source, which ships.
 *
 * One story here is not decoration and not an axis: `OverADialog` is the exact
 * check doc 08 §6 has been holding open since it was written — dialog open,
 * drawer opened and closed, page still does not scroll. The mechanism was
 * verified with two dialogs when `Dialog` landed; this is the case the
 * document actually names.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayerPage as Page } from '../../catalog/layerPage';
import { Drawer, type DrawerSide, type DrawerSize } from './Drawer';
import { Dialog, useDialog } from '../Dialog';
import { Button } from '../Button';
import { TextField } from '../TextField';

const SIDES = [
  'start',
  'end',
  'top',
  'bottom'
] as const satisfies readonly DrawerSide[];

const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly DrawerSize[];

/*
 * Fail to compile if a side or a size is added to the component and not here.
 * A plain `DrawerSide[]` annotation only checks that every entry IS a side, not
 * that every side is an entry, so a fifth would drop silently out of every
 * story and out of the screenshots guarding them.
 */
const MISSING_SIDES: Exclude<DrawerSide, (typeof SIDES)[number]>[] = [];
const MISSING_SIZES: Exclude<DrawerSize, (typeof SIZES)[number]>[] = [];
void MISSING_SIDES;
void MISSING_SIZES;

/** A consumer's own button that closes the layer it is in (doc 02 §5). */
function CancelButton() {
  const { close } = useDialog();
  return (
    <Button variant="secondary" onPress={close}>
      Cancel
    </Button>
  );
}

const ACTIONS = (
  <>
    <CancelButton />
    <Button variant="primary">Save changes</Button>
  </>
);

function OpenDrawer({
  side = 'end',
  size = 'md',
  title = 'Customer 4821',
  children
}: {
  side?: DrawerSide;
  size?: DrawerSize;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <Drawer
      isOpen
      onOpenChange={() => {}}
      side={side}
      size={size}
      title={title}
      footer={ACTIONS}
    >
      {children ?? (
        <div style={{ display: 'grid', gap: 'var(--bb-space-4)' }}>
          <TextField label="Legal name" defaultValue="Astilleros del Sur" />
          <TextField label="Tax identifier" defaultValue="20123456789" />
        </div>
      )}
    </Drawer>
  );
}

/*
 * Enough content to overflow. Twenty paragraphs, for the reason written in
 * Dialog's stories: eight did not clear the panel's ceiling in a 900px window,
 * so a story called "Scrolling" was not scrolling.
 */
function LongBody() {
  return (
    <div style={{ display: 'grid', gap: 'var(--bb-space-4)' }}>
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i} style={{ margin: 0 }}>
          {i + 1}. The customer&apos;s address history is kept in full. An
          earlier address stays attached to the invoices issued while it was
          current, so a correction never rewrites what was already sent.
        </p>
      ))}
    </div>
  );
}

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  args: { title: 'Customer 4821' },
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Opened and closed for real. The only story where the whole cycle happens,
 * and the one the focus checks use.
 */
export const Overview: Story = {
  render: () => {
    function Demo() {
      const [isOpen, setOpen] = useState(false);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <p className="catalog-label">
            Escape closes it, and focus returns to the button — not to the page.
          </p>
          <div className="catalog-row">
            <Button data-testid="open" onPress={() => setOpen(true)}>
              Open customer 4821
            </Button>
            <Button variant="ghost" data-testid="decoy">
              A decoy, so focus return has somewhere wrong to land
            </Button>
          </div>
          <Drawer
            isOpen={isOpen}
            onOpenChange={setOpen}
            title="Customer 4821"
            footer={
              <>
                <CancelButton />
                <Button variant="primary" onPress={() => setOpen(false)}>
                  Save changes
                </Button>
              </>
            }
          >
            <TextField label="Legal name" defaultValue="Astilleros del Sur" />
          </Drawer>
        </div>
      );
    }
    return <Demo />;
  }
};

/** All four edges, one at a time — they are modal, so two cannot be shown at
 * once (see Dialog's stories for why side by side is not available). */
export const Sides: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState<DrawerSide | null>(null);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <p className="catalog-label">
            `start` and `end` flip with the writing direction. `top` and
            `bottom` do not — this library supports RTL, not vertical text.
          </p>
          <div className="catalog-row">
            {SIDES.map(side => (
              <Button
                key={side}
                data-testid={`open-${side}`}
                onPress={() => setOpen(side)}
              >
                {side}
              </Button>
            ))}
          </div>
          {open === null ? null : (
            <Drawer
              isOpen
              onOpenChange={() => setOpen(null)}
              side={open}
              title={`From the ${open}`}
              footer={<Button variant="primary">Done</Button>}
            >
              <p style={{ margin: 0 }}>
                The panel takes its thickness on the axis this side chose, and
                stretches on the other.
              </p>
            </Drawer>
          )}
        </div>
      );
    }
    return <Demo />;
  }
};

/** The three thicknesses, on the inline axis. */
export const Sizes: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState<DrawerSize | null>(null);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <p className="catalog-label">
            One meaning for `size`: how thick, on whichever axis the side chose.
            The window is always the real ceiling.
          </p>
          <div className="catalog-row">
            {SIZES.map(size => (
              <Button
                key={size}
                data-testid={`open-${size}`}
                onPress={() => setOpen(size)}
              >
                {size}
              </Button>
            ))}
          </div>
          {open === null ? null : (
            <Drawer
              isOpen
              onOpenChange={() => setOpen(null)}
              size={open}
              title={`A ${open} drawer`}
              footer={<Button variant="primary">Done</Button>}
            >
              <p style={{ margin: 0 }}>
                Thickness comes from the container scale, so a form inside
                resolves its own container queries against the same numbers.
              </p>
            </Drawer>
          )}
        </div>
      );
    }
    return <Demo />;
  }
};

/** Light. Only the inner edge carries a border, and there is no radius: the
 * other three edges are the window's. */
export const Light: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      mode="light"
    >
      <OpenDrawer />
    </Page>
  )
};

/** Dark, where the panel is a lighter surface because a shadow is not visible
 * on a dark ground (doc 03 §5 rule 5). */
export const Dark: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      mode="dark"
    >
      <OpenDrawer />
    </Page>
  )
};

/**
 * The story this component exists to get right.
 *
 * The same `side="start"` in Arabic. It has to be on the **right**, and its
 * border on the left — because `start` is the inline start, which the writing
 * direction decides. Nothing here says `left` or `right`; the slide is the one
 * value that cannot be logical, and it reads `dir` from the locale.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      dir="rtl"
      locale="ar-EG"
    >
      <OpenDrawer side="start" title="العميل ٤٨٢١" />
    </Page>
  )
};

/** Compact density. Every padding inside follows it. */
export const Compact: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      density="compact"
    >
      <OpenDrawer />
    </Page>
  )
};

/** A bottom sheet: the same component, thick on the block axis. */
export const BottomSheet: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      mode="light"
    >
      <OpenDrawer side="bottom" size="sm" title="Filter the listing">
        <div style={{ display: 'grid', gap: 'var(--bb-space-4)' }}>
          <TextField label="Reference" placeholder="F001-" />
          <TextField label="Issued after" placeholder="2026-01-01" />
        </div>
      </OpenDrawer>
    </Page>
  )
};

/** Content taller than the panel: the header and footer pin, the middle
 * scrolls, and it scrolls from the keyboard the moment it opens. */
export const Scrolling: Story = {
  render: () => (
    <Page
      label="The page behind, so the scrim has something to cover."
      mode="light"
    >
      <OpenDrawer size="sm" title="Address history">
        <LongBody />
      </OpenDrawer>
    </Page>
  )
};

/**
 * **Doc 08 §6's check, at last.** The document has held this open since it was
 * written: "open dialog, open drawer, close drawer, try to scroll the page. It
 * must not scroll."
 *
 * The prediction recorded there — the base reference-counts the lock — held
 * when it was tested with two dialogs. This is the case the document names,
 * and it is a real pattern rather than a contrivance: a dialog asking which
 * customer, and a drawer beside it to look one up.
 */
export const OverADialog: Story = {
  render: () => {
    function Demo() {
      const [dialog, setDialog] = useState(false);
      const [drawer, setDrawer] = useState(false);
      return (
        <div className="catalog-stack" style={{ padding: 24, minHeight: 1600 }}>
          <p className="catalog-label">
            The page is deliberately tall, so whether it scrolls is visible.
          </p>
          <Button data-testid="open-dialog" onPress={() => setDialog(true)}>
            Open the dialog
          </Button>
          <Dialog
            isOpen={dialog}
            onOpenChange={setDialog}
            title="Issue a credit note"
            footer={
              <Button data-testid="open-drawer" onPress={() => setDrawer(true)}>
                Look up a customer
              </Button>
            }
          >
            <p style={{ margin: 0 }}>
              Opening the drawer locks the page again. Closing it must not
              unlock, because this dialog is still open.
            </p>
          </Dialog>
          <Drawer
            isOpen={drawer}
            onOpenChange={setDrawer}
            size="sm"
            title="Find a customer"
            footer={<CancelButton />}
          >
            <TextField label="Search" placeholder="Name or tax identifier" />
          </Drawer>
        </div>
      );
    }
    return <Demo />;
  }
};

/**
 * A drawer holding nothing to lose, which doc 08 §5 says should be dismissable
 * — and it is worth seeing on a drawer, because the target is much larger than
 * a dialog's: the panel takes one edge and the rest of the window dismisses it.
 */
export const Dismissable: Story = {
  render: () => {
    function Demo() {
      const [isOpen, setOpen] = useState(false);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <Button data-testid="open" onPress={() => setOpen(true)}>
            Show the audit trail
          </Button>
          <Drawer
            isOpen={isOpen}
            onOpenChange={setOpen}
            isDismissable
            size="sm"
            title="Audit trail"
          >
            <p style={{ margin: 0 }}>
              Nothing here is editable, so a click anywhere outside closes it.
            </p>
          </Drawer>
        </div>
      );
    }
    return <Demo />;
  }
};
