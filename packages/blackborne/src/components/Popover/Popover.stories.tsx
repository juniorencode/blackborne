/*
 * The visual catalog for Popover.
 *
 * A popover CAN be photographed at rest, unlike a tooltip: it opens on a press
 * and `defaultOpen` is a real prop rather than one invented for the catalog, so
 * most of these stories render one already open. The two that are about the
 * press itself leave it closed.
 *
 * The twelve placements are checked by MEASUREMENT rather than by picture, in
 * `popover.spec.ts`, for the reason Tooltip records: a photograph of twelve
 * panels says less about "below, aligned to the start" than twelve assertions
 * against their triggers' boxes do. And unlike a tooltip, twelve popovers
 * cannot be open at once anyway — each one blocks the page while it is up.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CentredLayerPage as Page } from '../../catalog/layerPage';
import { Popover } from './Popover';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { TextField } from '../TextField';
import { useDialog } from '../Dialog';
import { PLACEMENTS } from '../../internal/Layer';

/** A consumer's own button that closes the layer it is in (doc 02 §5). */
function ApplyButton() {
  const { close } = useDialog();
  return (
    <Button variant="primary" onPress={close}>
      Apply
    </Button>
  );
}

/** The filter form used by most of these, so the stories differ in the one
 * thing each is about. */
function Filters() {
  return (
    <div className="catalog-stack">
      <TextField label="Reference" placeholder="INV-" />
      <TextField label="Issued after" />
      <Checkbox>Overdue only</Checkbox>
    </div>
  );
}

const meta = {
  title: 'Components/Popover',
  component: Popover,
  /*
   * `title` and `trigger` are both required, so they are supplied here rather
   * than in every story — the shape Dialog and Tooltip use. Every story
   * renders its own popover, so these args only satisfy the type.
   */
  args: {
    title: 'Filter invoices',
    trigger: <Button>Filters</Button>
  },
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A filter panel on a toolbar, which is what a popover is mostly for.
 *
 * **Worth trying by hand, because it is the surprising part:** while this is
 * open, the page behind is not merely visually behind it. It cannot be
 * scrolled, it cannot be clicked, and a screen reader does not see it — the
 * base blocks all three, and this component contains the keyboard to match
 * (doc 08 §4). A popover is a modal layer without a visible scrim.
 *
 * Clicking outside closes it, which is doc 08 §5.1's decision, and the click
 * does not also press whatever was under it — the underlay swallows it.
 */
export const Overview: Story = {
  render: () => (
    <div className="catalog-stack" style={{ padding: 24 }}>
      <p className="catalog-label">
        Press Filters. Then try the page behind it.
      </p>
      <div className="catalog-row">
        <Popover
          title="Filter invoices"
          trigger={<Button data-testid="trigger">Filters</Button>}
          footer={<ApplyButton />}
        >
          <Filters />
        </Popover>
        <Button variant="secondary" data-testid="behind">
          Export
        </Button>
      </div>
    </div>
  )
};

/**
 * All twelve placements, one at a time — because each one blocks the page while
 * it is open, so they cannot be shown together.
 *
 * The four sides are the block and inline axes; the three alignments are how it
 * lines up on the other one. `start` and `end` follow the writing direction, so
 * this grid reads mirrored in Arabic and the words do not change.
 *
 * The base repositions anything that would not fit, so a placement is a
 * preference. `popover.spec.ts` measures each panel against its trigger.
 */
export const Placements: Story = {
  render: () => (
    /*
     * ROOM ON ALL FOUR SIDES OF EVERY TRIGGER, which is not decoration.
     *
     * The base repositions a panel that would not fit, correctly, and a
     * geometry check then measures the flip instead of the placement. A
     * popover's panel is far bigger than a tooltip's bubble — a header with a
     * title and a close button is ~170px of intrinsic width on its own — so
     * the padding that was enough for Tooltip is not enough here. Measured:
     * with 32px above the first row, every `top` panel flipped to below.
     *
     * Hence `1fr` columns with the triggers centred in them rather than a
     * tight `max-content` grid: it is the cell that holds the room, so no
     * trigger is ever near an edge or near its neighbour.
     */
    <div className="catalog-stack" style={{ padding: '200px 120px' }}>
      <p className="catalog-label">
        Twelve logical values (doc 02 §3.3). Open one at a time.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          placeItems: 'center',
          rowGap: 100,
          columnGap: 'var(--bb-space-6)'
        }}
      >
        {PLACEMENTS.map(placement => (
          <Popover
            key={placement}
            placement={placement}
            title={placement}
            hasArrow
            trigger={
              <Button
                variant="secondary"
                size="sm"
                data-testid={`trigger-${placement.replace(' ', '-')}`}
              >
                {placement}
              </Button>
            }
          >
            <p className="catalog-label">{placement}</p>
          </Popover>
        ))}
      </div>
    </div>
  )
};

/** Light, open. The same raised surface as every other floating thing in the
 * library, with a pinned header and the actions in a footer. */
export const Light: Story = {
  render: () => (
    <Page mode="light">
      <Popover
        defaultOpen
        title="Filter invoices"
        trigger={<Button data-testid="trigger">Filters</Button>}
        footer={<ApplyButton />}
      >
        <Filters />
      </Popover>
    </Page>
  )
};

/** Dark, where the raised surface is lighter than the page rather than
 * shadowed (doc 03 §5 rule 5). */
export const Dark: Story = {
  render: () => (
    <Page mode="dark">
      <Popover
        defaultOpen
        title="Filter invoices"
        trigger={<Button data-testid="trigger">Filters</Button>}
        footer={<ApplyButton />}
      >
        <Filters />
      </Popover>
    </Page>
  )
};

/** Compact: the density axis reaches a portalled layer because it is mounted
 * inside the page that declares it, not at the end of `body`. */
export const Compact: Story = {
  render: () => (
    <Page density="compact">
      <Popover
        defaultOpen
        title="Filter invoices"
        trigger={<Button data-testid="trigger">Filters</Button>}
        footer={<ApplyButton />}
      >
        <Filters />
      </Popover>
    </Page>
  )
};

/**
 * RTL. The panel is aligned to the inline start, which is the RIGHT here, and
 * the close button is on the left — nothing in the component knows that.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <Page dir="rtl" locale="ar-EG">
      <Popover
        defaultOpen
        title="تصفية الفواتير"
        trigger={<Button data-testid="trigger">تصفية</Button>}
        footer={<ApplyButton />}
      >
        <TextField label="المرجع" />
      </Popover>
    </Page>
  )
};

/**
 * With an arrow, which is **off by default** — the opposite of `Tooltip`.
 *
 * On a tooltip the arrow is doing work: a small bubble near five icon buttons
 * has to say which one it belongs to. A panel opened by a press does not, so
 * the arrow is for the case where the trigger is small or crowded.
 */
export const Arrow: Story = {
  render: () => (
    <Page mode="light">
      <Popover
        defaultOpen
        hasArrow
        title="Filter invoices"
        trigger={<Button data-testid="trigger">Filters</Button>}
      >
        <TextField label="Reference" />
      </Popover>
    </Page>
  )
};

/**
 * Not dismissable by a click outside, for a panel holding something that must
 * not be lost. `Escape` and the close button still work — nothing in this
 * library lets a layer swallow `Escape`.
 *
 * This is the prop doc 08 §5.1 chose over a rule, and the reason it costs less
 * than it looks is measured: the page behind is already blocked, so a popover
 * that stays open is not sitting over an interface somebody is trying to use.
 */
export const NotDismissable: Story = {
  name: 'Not dismissable',
  render: () => (
    <Page mode="light">
      <Popover
        defaultOpen
        isDismissable={false}
        title="Filter invoices"
        trigger={<Button data-testid="trigger">Filters</Button>}
        footer={<ApplyButton />}
      >
        <Filters />
      </Popover>
    </Page>
  )
};

/**
 * More than fits, so the content scrolls and the header and footer stay put.
 *
 * The ceiling is the base's: it measures the room between the trigger and the
 * edge of the window and writes a `max-height` into the panel's own style. That
 * is the one dimension a popover is not told, and it is why there is no
 * viewport query in a component that has to fit a viewport.
 */
export const Scrolling: Story = {
  render: () => (
    <Page mode="light">
      <Popover
        defaultOpen
        title="Filter invoices"
        trigger={<Button data-testid="trigger">Filters</Button>}
        footer={<ApplyButton />}
      >
        <div className="catalog-stack">
          {Array.from({ length: 12 }, (_, i) => (
            <TextField key={i} label={`Field ${i + 1}`} />
          ))}
        </div>
      </Popover>
    </Page>
  )
};

/**
 * No footer, which is the other ordinary shape: a panel that shows something
 * rather than asking for something.
 */
export const NoFooter: Story = {
  name: 'No footer',
  render: () => (
    <Page mode="light">
      <Popover
        defaultOpen
        title="Customer 4821"
        trigger={<Button data-testid="trigger">Details</Button>}
      >
        <p className="catalog-label">
          Astilleros del Sur SAC · Callao · Terms 30 days
        </p>
      </Popover>
    </Page>
  )
};

/**
 * A long title and a long label, which doc 05 §5 asks of everything. The panel
 * stops at `--container-medium` and wraps; the header's title wraps with it and
 * the close button stays where it is.
 */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <Page mode="light">
      <Popover
        defaultOpen
        title="Filtrar los comprobantes emitidos y anulados del período"
        trigger={<Button data-testid="trigger">Filtros</Button>}
        footer={<ApplyButton />}
      >
        <TextField
          label="Número de referencia del comprobante o de la nota de crédito"
          description="Se acepta el número completo o los últimos cuatro dígitos."
        />
      </Popover>
    </Page>
  )
};
