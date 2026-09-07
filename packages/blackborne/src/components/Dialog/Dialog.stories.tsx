/*
 * The visual catalog for Dialog.
 *
 * One thing here is unlike every other component's stories, and it is worth
 * reading before changing anything: **a dialog renders in a portal**, so the
 * `data-bb-mode` attribute a `.catalog-panel` carries does not reach it. Its
 * ancestor is the document body. Every flat component gets light-beside-dark
 * for free from that attribute; a layer gets nothing, and would be
 * photographed in whichever mode the page happened to be in.
 *
 * `Page` below solves it with the library's own mechanism rather than a trick:
 * it passes its own element as `portalContainer`, which is what that prop is
 * for (doc 08 §8), so the layer becomes a DOM descendant of it and inherits
 * the theme attributes it carries. Tokens cascade by DOM ancestry, and that is
 * all that is needed. These stories are therefore also the first real exercise
 * of that prop — if it did not work, every picture here would be in the wrong
 * mode.
 *
 * **There is deliberately no story with two dialogs side by side**, which is
 * how every other component covers an axis in one image. Two measured reasons,
 * both written out in `catalog.css` beside `.catalog-layer-page`: a fixed scrim
 * fills the window so two of them overlap, and several modal layers open at
 * once make each other `inert`, which is exactly the state axe skips — so a
 * side-by-side story would also be the one story where contrast goes
 * unchecked. One layer per story, at the size it really is.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog, type DialogSize } from './Dialog';
import { useDialog } from './useDialog';
import { Button } from '../Button';
import { ConfigProvider } from '../../config';
import { TextField } from '../TextField';
import { Alert } from '../Alert';

const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly DialogSize[];

/*
 * Fails to compile if a size is added to the component and not here — a plain
 * `DialogSize[]` annotation only checks that every entry IS a size, not that
 * every size is an entry, so a fourth would drop silently out of every story
 * and out of the screenshots guarding them.
 */
const MISSING: Exclude<DialogSize, (typeof SIZES)[number]>[] = [];
void MISSING;

/**
 * A full page carrying one combination of the theme axes, which a portalled
 * layer is mounted into so that it inherits them.
 */
function Page({
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  brand = false,
  children
}: {
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  brand?: boolean;
  children: React.ReactNode;
}) {
  /*
   * State and not a ref, because the element has to exist before it can be a
   * portal target: on the first render a ref is still null, and the layer would
   * mount at the document for that frame — which is exactly the frame a
   * screenshot catches.
   */
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  return (
    <div
      className="catalog-layer-page"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      ref={setHost}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
    >
      <p className="catalog-label">
        The page behind, so the scrim has something to cover.
      </p>
      {host === null ? null : (
        <ConfigProvider portalContainer={host}>{children}</ConfigProvider>
      )}
    </div>
  );
}

/**
 * A consumer's own button that closes the dialog it is in — the need doc 02 §5
 * says must be paid for once render props are hidden.
 *
 * It is a component of its own because a hook can only be called from one, and
 * that is the reason `footer` takes a node rather than a list of labels.
 */
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

/** A dialog that is simply open, for the pictures. */
function OpenDialog({
  size = 'md',
  title = 'Edit customer',
  children,
  footer = true
}: {
  size?: DialogSize;
  title?: string;
  children?: React.ReactNode;
  footer?: boolean;
}) {
  return (
    <Dialog
      isOpen
      onOpenChange={() => {}}
      size={size}
      title={title}
      {...(footer ? { footer: ACTIONS } : {})}
    >
      {children ?? (
        <p style={{ margin: 0 }}>
          Changing the tax identifier affects invoices already issued to this
          customer. Nothing is sent again.
        </p>
      )}
    </Dialog>
  );
}

/*
 * Enough prose to make the panel scroll, so the header and footer pin.
 *
 * Twenty paragraphs and not eight. Measured: eight came to roughly 740px
 * including the header and footer, against a ceiling of 876px in a 900px-tall
 * window — so the panel did not overflow, `scrollTop` stayed at zero, and a
 * story called "Scrolling" was not scrolling. The content has to clear the
 * ceiling by a margin rather than by a few pixels, or the story stops
 * demonstrating anything the first time a window is a little taller.
 */
function LongBody() {
  return (
    <div style={{ display: 'grid', gap: 'var(--bb-space-4)' }}>
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i} style={{ margin: 0 }}>
          {i + 1}. Invoices issued before the change keep the identifier they
          were issued with. The register keeps both values and the audit trail
          records who changed it, so a later correction does not lose the
          original.
        </p>
      ))}
    </div>
  );
}

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  /*
   * `title` is required on the component, so it is supplied here rather than in
   * every story — the same shape TextField uses for its required `label`.
   * Every story below renders its own dialog, so these args are only what
   * satisfies the type.
   */
  args: { title: 'Edit customer' },
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Opened and closed for real. The only story where the whole cycle happens, and
 * the only way to check that focus returns to the button that opened it.
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
              Edit customer
            </Button>
            <Button variant="ghost" data-testid="decoy">
              A decoy, so focus return has somewhere wrong to land
            </Button>
          </div>
          <Dialog
            isOpen={isOpen}
            onOpenChange={setOpen}
            title="Edit customer"
            footer={
              <>
                <CancelButton />
                <Button variant="primary" onPress={() => setOpen(false)}>
                  Save changes
                </Button>
              </>
            }
          >
            <p style={{ margin: 0 }}>
              Changing the tax identifier affects invoices already issued.
            </p>
          </Dialog>
        </div>
      );
    }
    return <Demo />;
  }
};

/** The three sizes, one at a time, at the widths they really are. */
export const Sizes: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState<DialogSize | null>(null);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <p className="catalog-label">
            Widths come from the container scale, so a form inside resolves its
            own container queries against the same numbers.
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
            <Dialog
              isOpen
              onOpenChange={() => setOpen(null)}
              size={open}
              title={`A ${open} dialog`}
              footer={<Button variant="primary">Done</Button>}
            >
              <p style={{ margin: 0 }}>
                The panel stops at its maximum width and shrinks below it.
              </p>
            </Dialog>
          )}
        </div>
      );
    }
    return <Demo />;
  }
};

/**
 * Light. Paired with `Dark` below rather than shown beside it, for the two
 * reasons at the top of this file.
 */
export const Light: Story = {
  render: () => (
    <Page mode="light">
      <OpenDialog />
    </Page>
  )
};

/** Dark. The panel is a lighter surface here, because a shadow is not visible
 * on a dark ground (doc 03 §5 rule 5) — which is the one token in the library
 * that genuinely differs between modes rather than being restated for tidiness. */
export const Dark: Story = {
  render: () => (
    <Page mode="dark">
      <OpenDialog />
    </Page>
  )
};

/** Compact density. The scrim's inset and every padding inside follow it. */
export const Compact: Story = {
  render: () => (
    <Page density="compact">
      <OpenDialog />
    </Page>
  )
};

/**
 * RTL. The close button moves to the other end, the footer's actions reverse,
 * and nothing is positioned with `left` or `right`.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <Page dir="rtl">
      <OpenDialog />
    </Page>
  )
};

/** An overridden brand, which has to reach the primary action and the ring. */
export const BrandOverride: Story = {
  render: () => (
    <Page brand>
      <OpenDialog />
    </Page>
  )
};

/**
 * Content taller than the panel. The header and footer stay put, the middle
 * scrolls, and it scrolls from the keyboard the moment the dialog opens —
 * which is the reason the scrolling element is the one the base focuses.
 */
export const Scrolling: Story = {
  render: () => (
    <Page mode="light">
      <OpenDialog size="sm" title="Change the tax identifier">
        <LongBody />
      </OpenDialog>
    </Page>
  )
};

/**
 * A dialog holding a form: not dismissable by a click outside, because doc 08
 * §5 does not allow it to be. What was typed may not be discarded by a stray
 * click (doc 09 §7), so the exits are deliberate — the footer, the cross, or
 * Escape.
 *
 * The Alert is here on purpose: doc 09 §4 says an error is shown where the
 * problem happened, and for a save that failed inside a dialog, that is inside
 * the dialog.
 */
export const WithAForm: Story = {
  name: 'Holding unsaved input',
  render: () => (
    <Page mode="light">
      <Dialog
        isOpen
        onOpenChange={() => {}}
        size="sm"
        title="New customer"
        footer={
          <>
            <CancelButton />
            <Button variant="primary">Create</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 'var(--bb-space-4)' }}>
          <Alert tone="danger" title="The customer was not created">
            The tax identifier is already registered to another customer.
          </Alert>
          <TextField label="Legal name" defaultValue="Astilleros del Sur" />
          <TextField
            label="Tax identifier"
            defaultValue="20123456789"
            isInvalid
            errorMessage="Already in use."
          />
        </div>
      </Dialog>
    </Page>
  )
};

/**
 * Without a footer. There is no actions row at all rather than an empty one, so
 * nothing reserves padding it is not using.
 */
export const WithoutAFooter: Story = {
  render: () => (
    <Page mode="dark">
      <OpenDialog size="sm" footer={false} />
    </Page>
  )
};

/**
 * A title long enough to wrap, which is what doc 05 §5 asks of everything: no
 * width is sized so one particular label fits, and a short string is the
 * dangerous one — a one-word title in English is twelve characters in German.
 *
 * The narrow-window project measures this one, where the wrapping has to keep
 * the close button inside the panel rather than pushing it off the edge.
 */
export const LongTitle: Story = {
  render: () => (
    <Page mode="light">
      <OpenDialog
        size="sm"
        title="Change the tax identifier on invoices already issued"
      />
    </Page>
  )
};

/**
 * Two levels, which is the only way to exercise what doc 08 §3 promises:
 * Escape closes the innermost layer and leaves the one underneath open.
 *
 * It also exercises the scroll lock's reference counting ahead of `Drawer`,
 * which is where doc 08 §6 says that check lands. Two dialogs use the same
 * mechanism, so the prediction written in §6 can be tested here.
 */
export const Nested: Story = {
  render: () => {
    function Demo() {
      const [outer, setOuter] = useState(false);
      const [inner, setInner] = useState(false);
      return (
        <div className="catalog-stack" style={{ padding: 24, minHeight: 1600 }}>
          <p className="catalog-label">
            The page is deliberately tall, so whether it scrolls is visible.
          </p>
          <Button data-testid="open-outer" onPress={() => setOuter(true)}>
            Open the first
          </Button>
          <Dialog
            isOpen={outer}
            onOpenChange={setOuter}
            title="The first dialog"
            footer={
              <Button data-testid="open-inner" onPress={() => setInner(true)}>
                Open a second
              </Button>
            }
          >
            <p style={{ margin: 0 }}>
              Opening a second locks the page again. Closing it must not unlock.
            </p>
          </Dialog>
          <Dialog
            isOpen={inner}
            onOpenChange={setInner}
            size="sm"
            title="The second dialog"
            footer={<CancelButton />}
          >
            <p style={{ margin: 0 }}>
              Escape closes this one and leaves the first open.
            </p>
          </Dialog>
        </div>
      );
    }
    return <Demo />;
  }
};

/**
 * A dialog holding nothing to lose, which doc 08 §5 says SHOULD be dismissable
 * — being made to aim at a close button to dismiss a read-only panel is the
 * opposite failure to losing work.
 */
export const Dismissable: Story = {
  render: () => {
    function Demo() {
      const [isOpen, setOpen] = useState(false);
      return (
        <div className="catalog-stack" style={{ padding: 24 }}>
          <Button data-testid="open" onPress={() => setOpen(true)}>
            Show the invoice
          </Button>
          <Dialog
            isOpen={isOpen}
            onOpenChange={setOpen}
            isDismissable
            size="sm"
            title="Invoice F001-00012"
          >
            <p style={{ margin: 0 }}>
              Issued 12 March, 4,280.00. Nothing here is editable, so a click
              outside closes it.
            </p>
          </Dialog>
        </div>
      );
    }
    return <Demo />;
  }
};
