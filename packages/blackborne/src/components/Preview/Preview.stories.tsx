/*
 * The visual catalog for Preview.
 *
 * **Nothing here can be photographed at rest**, the same as `Tooltip` and
 * unlike `Popover`. A preview's whole behaviour is hover, focus and long press;
 * the base does accept a `defaultOpen`, and this component does not forward it,
 * because a prop that exists for this file and for nobody else is P5. So the
 * visual suite hovers a trigger and waits before it captures, and the
 * interaction is part of what the picture is of.
 *
 * **And only one can be open at once.** The base keeps the same global warmup
 * timer tooltips use — correct, since two cards competing is two answers to one
 * question — so the twelve placements cannot be shown side by side. They are
 * checked by MEASUREMENT instead, in `preview.spec.ts`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CentredLayerPage as Page } from '../../catalog/layerPage';
import { Preview } from './Preview';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Separator } from '../Separator';
import { PLACEMENTS } from '../../internal/Layer';

/** The card used by most of these, so the stories differ in the one thing each
 * is about. A summary of a record: a few facts, a status, one way onward. */
function CustomerCard() {
  return (
    <div className="catalog-stack">
      <div className="catalog-row">
        <Badge tone="success">Current</Badge>
        <Badge>Terms 30 days</Badge>
      </div>
      <p className="catalog-label">Callao · Since 2019 · 42 invoices</p>
      <Separator />
      <Button variant="link">Open statement</Button>
    </div>
  );
}

const meta = {
  title: 'Components/Preview',
  component: Preview,
  /*
   * `title` and `trigger` are both required, so they are supplied here rather
   * than in every story — the shape Dialog, Tooltip and Popover use. Every
   * story renders its own preview, so these args only satisfy the type.
   */
  args: {
    title: 'Astilleros del Sur SAC',
    trigger: <Button variant="link">Astilleros del Sur</Button>
  },
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof Preview>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A table of customer names, which is what a preview is mostly for.
 *
 * **Worth trying by hand**, because three things are only visible in the doing:
 *
 * - The card appears after ~600ms, and its neighbours then appear at once —
 *   the warmup delay is paid per approach to the group, not per name.
 * - The pointer can travel into the card, diagonally, at any speed. That is a
 *   safe-area polygon in the base rather than the 150ms close delay, and it is
 *   what makes the link inside reachable.
 * - `Tab` from the name moves focus INTO the card, and tabbing past the last
 *   thing in it leaves and closes it. Nothing is trapped — a hover card that
 *   held the keyboard would be a trap with no way out (doc 08 §4).
 */
export const Overview: Story = {
  render: () => (
    <div className="catalog-stack" style={{ padding: 24 }}>
      <p className="catalog-label">
        Hover a name. Then travel into the card, or press Tab.
      </p>
      <div className="catalog-stack">
        <Preview
          title="Astilleros del Sur SAC"
          trigger={
            <Button variant="link" data-testid="trigger">
              Astilleros del Sur
            </Button>
          }
        >
          <CustomerCard />
        </Preview>
        <Preview
          title="Pesquera Nor-Oriente SA"
          trigger={<Button variant="link">Pesquera Nor-Oriente</Button>}
        >
          <CustomerCard />
        </Preview>
        <Preview
          title="Maderera del Huallaga EIRL"
          trigger={<Button variant="link">Maderera del Huallaga</Button>}
        >
          <CustomerCard />
        </Preview>
      </div>
      <Button variant="secondary" data-testid="behind">
        Export
      </Button>
    </div>
  )
};

/**
 * All twelve placements, one at a time — because only one preview can be open
 * at once, by design.
 *
 * The four sides are the block and inline axes; the three alignments are how it
 * lines up on the other one. `start` and `end` follow the writing direction, so
 * this grid reads mirrored in Arabic and the words do not change.
 *
 * The base repositions anything that would not fit, so a placement is a
 * preference. `preview.spec.ts` measures each card against its trigger.
 */
export const Placements: Story = {
  render: () => (
    /*
     * Room on all four sides of every trigger, for the reason `Popover`'s
     * equivalent story records: a card is far bigger than a tooltip's bubble,
     * and the base correctly repositions one that will not fit, which turns a
     * geometry check into a measurement of the flip.
     */
    <div className="catalog-stack" style={{ padding: '200px 120px' }}>
      <p className="catalog-label">
        Twelve logical values (doc 02 §3.3). Hover one at a time.
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
          <Preview
            key={placement}
            placement={placement}
            title={placement}
            trigger={
              <Button
                variant="link"
                data-testid={`trigger-${placement.replace(' ', '-')}`}
              >
                {placement}
              </Button>
            }
          >
            {placement}
          </Preview>
        ))}
      </div>
    </div>
  )
};

/** Light. The same raised surface as every other floating thing in the library,
 * with an arrow that says which name it belongs to. */
export const Light: Story = {
  render: () => (
    <Page mode="light">
      <Preview
        title="Astilleros del Sur SAC"
        trigger={
          <Button variant="link" data-testid="trigger">
            Astilleros del Sur
          </Button>
        }
      >
        <CustomerCard />
      </Preview>
    </Page>
  )
};

/** Dark, where the raised surface is lighter than the page rather than
 * shadowed (doc 03 §5 rule 5). */
export const Dark: Story = {
  render: () => (
    <Page mode="dark">
      <Preview
        title="Astilleros del Sur SAC"
        trigger={
          <Button variant="link" data-testid="trigger">
            Astilleros del Sur
          </Button>
        }
      >
        <CustomerCard />
      </Preview>
    </Page>
  )
};

/** Compact: the density axis reaches a portalled layer because it is mounted
 * inside the page that declares it, not at the end of `body`. */
export const Compact: Story = {
  render: () => (
    <Page density="compact">
      <Preview
        title="Astilleros del Sur SAC"
        trigger={
          <Button variant="link" data-testid="trigger">
            Astilleros del Sur
          </Button>
        }
      >
        <CustomerCard />
      </Preview>
    </Page>
  )
};

/**
 * RTL. The card is aligned to the inline start, which is the RIGHT here, and
 * the arrow turns with it — nothing in the component knows that.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <Page dir="rtl" locale="ar-EG">
      <Preview
        title="شركة أستيريوس ديل سور"
        trigger={
          <Button variant="link" data-testid="trigger">
            أستيريوس ديل سور
          </Button>
        }
      >
        كالاو · شروط ٣٠ يوماً
      </Preview>
    </Page>
  )
};

/**
 * The legitimate case for content nobody can reach in a `Tooltip`: something
 * to press.
 *
 * A tooltip cannot hold this. The pointer could reach it — WCAG 1.4.13 requires
 * that and the base honours it — but the keyboard could not, so a link in one
 * exists for a mouse and for nobody else. Here `Tab` moves focus in.
 */
export const Interactive: Story = {
  render: () => (
    <Page mode="light">
      <Preview
        title="Astilleros del Sur SAC"
        trigger={
          <Button variant="link" data-testid="trigger">
            Astilleros del Sur
          </Button>
        }
      >
        <div className="catalog-stack">
          <p className="catalog-label">Balance 12,480.00 · 3 overdue</p>
          <div className="catalog-row">
            <Button variant="link">Open statement</Button>
            <Button variant="link">New invoice</Button>
          </div>
        </div>
      </Preview>
    </Page>
  )
};

/** Text only, which is the other ordinary shape: a summary with nothing to
 * press. The card is as wide as its content up to `--container-narrow`. */
export const TextOnly: Story = {
  name: 'Text only',
  render: () => (
    <Page mode="light">
      <Preview
        title="Astilleros del Sur SAC"
        trigger={
          <Button variant="link" data-testid="trigger">
            Astilleros del Sur
          </Button>
        }
      >
        Callao · Terms 30 days · 42 invoices
      </Preview>
    </Page>
  )
};

/**
 * A long value, which doc 05 §5 asks of everything. The card stops at
 * `--container-narrow` and wraps; a summary that spanned the window would be a
 * page, and a page is where it would belong.
 */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <Page mode="light">
      <Preview
        title="Astilleros del Sur, Sociedad Anónima Cerrada"
        trigger={
          <Button variant="link" data-testid="trigger">
            Astilleros del Sur
          </Button>
        }
      >
        Registered in Callao since 2019. Terms are 30 days from issue, with a
        credit limit of 40,000.00 and three invoices currently past due. The
        account is managed from the Lima office.
      </Preview>
    </Page>
  )
};

/**
 * Turned off without unmounting the trigger, for a preview that only applies
 * some of the time.
 *
 * Nothing opens, and the trigger stops claiming that anything can be — the
 * component declines to mount the wrapper rather than passing the prop down,
 * because the base's own `isDisabled` reaches hover and long press and not
 * keyboard focus. Measured; the component's note has it.
 */
export const Disabled: Story = {
  render: () => (
    <div className="catalog-stack" style={{ padding: 24 }}>
      <p className="catalog-label">
        Neither hover nor focus opens anything. The trigger is untouched.
      </p>
      <Preview
        isDisabled
        title="You will not see this"
        trigger={
          <Button variant="link" data-testid="trigger">
            Astilleros del Sur
          </Button>
        }
      >
        <CustomerCard />
      </Preview>
    </div>
  )
};
