/*
 * The catalog for Skeleton.
 *
 * Almost everything true about this component is invisible to a unit test: the
 * fill is a color-mix of two custom properties, the ragged last line is a CSS
 * selector, the reserved height is arithmetic in `lh` units, and the pulse is
 * an animation. jsdom resolves none of those. So these stories are not a demo
 * of the API — they are where the component is actually checked (doc 10).
 *
 * The one that matters most is `ReservesTheSpace`: two boxes that must come
 * out the same height. If they do not, the page jumps when the data lands,
 * which is the thing doc 09 §3 forbids by name.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

function Scope({
  label,
  mode = 'light',
  dir = 'ltr',
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  dir?: 'ltr' | 'rtl';
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-panel" data-bb-mode={mode} dir={dir}>
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * The three variants, at the size they take with nothing else said.
 *
 * All three are one line of text tall. `text` and `rect` fill the container;
 * `circle` cannot, because a disc as wide as a page-width column would be a
 * metre across — its width comes from its height instead, which is why
 * resizing it from `className` keeps it round.
 */
export const Variants: Story = {
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 420 }}>
      <div>
        <p className="catalog-label">text — the default</p>
        <Skeleton />
      </div>
      <div>
        <p className="catalog-label">circle — an avatar, a status dot</p>
        <Skeleton variant="circle" />
      </div>
      <div>
        <p className="catalog-label">rect — a thumbnail, a chart, a control</p>
        <Skeleton variant="rect" />
      </div>
      <div>
        <p className="catalog-label">
          circle and rect at a size of their own, from style
        </p>
        <div className="catalog-row">
          <Skeleton variant="circle" style={{ height: 40 }} />
          <Skeleton variant="rect" style={{ height: 40 }} />
        </div>
      </div>
    </div>
  )
};

/**
 * A block of lines, and the detail that decides whether it reads as text.
 *
 * The last line of a block of several is short. That is not a flourish — bars
 * of equal length read as a stack of rows, a table or a list, and the ragged
 * edge is the single thing that says the content coming is prose. A lone line
 * is left full, because one bar stands in for a label or a value and
 * shortening it would claim a shape the content does not have.
 */
export const TextLines: Story = {
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 420 }}>
      <div>
        <p className="catalog-label">1 — a label or a value, drawn full</p>
        <Skeleton />
      </div>
      <div>
        <p className="catalog-label">2</p>
        <Skeleton lines={2} />
      </div>
      <div>
        <p className="catalog-label">3</p>
        <Skeleton lines={3} />
      </div>
      <div>
        <p className="catalog-label">6 — a paragraph</p>
        <Skeleton lines={6} />
      </div>
    </div>
  )
};

/**
 * **The gate.** The two panels must be exactly the same height.
 *
 * A skeleton exists to reserve the space the content will take, so that
 * nothing shifts when it arrives — and least of all under the cursor
 * (doc 09 §3). The bars are the height of the text and the leftover leading is
 * split above and below them, so four skeleton lines occupy four line boxes.
 *
 * If these two boxes ever stop matching, the arithmetic in Skeleton.css is
 * wrong and every screen using it jumps on load.
 */
export const ReservesTheSpace: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">Holding the space</p>
        <Skeleton lines={4} />
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">The content that lands in it</p>
        <p style={{ margin: 0 }}>
          The order was placed on 14 March and shipped from the central
          warehouse two days later. Payment cleared on the same day it was
          placed. Nothing on this record has been edited since it closed, and
          the customer has not been in touch about it.
        </p>
      </div>
    </div>
  )
};

const ROWS = [
  {
    name: 'Marta Quinones',
    detail: 'Invoice 2024-0318 · Paid',
    figure: '1,240.00'
  },
  {
    name: 'Hiroshi Tanaka',
    detail: 'Invoice 2024-0319 · Pending',
    figure: '86.50'
  },
  {
    name: 'Amelia Okonkwo',
    detail: 'Invoice 2024-0320 · Overdue',
    figure: '3,915.75'
  }
];

const ROW = { display: 'flex', gap: 12, alignItems: 'center' } as const;

/**
 * A realistic first load, which is the only load a skeleton belongs in.
 *
 * A list of records in a management application: an avatar, a name, a line of
 * detail, and a figure. Loading on the left, the same list arrived on the
 * right — the row heights hold, which is the point.
 *
 * **This is the FIRST load.** On a refetch the rows that are already there
 * stay, dimmed or behind an indicator; replacing them with these bars is the
 * mistake doc 09 §6 names — loading must not erase what was already visible.
 * The component cannot tell the two apart, so the discipline is the caller's.
 */
export const RecordList: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">Loading, first time</p>
        <div className="catalog-stack">
          {ROWS.map(row => (
            <div key={row.name} style={ROW}>
              <Skeleton variant="circle" style={{ height: 40 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton lines={2} />
              </div>
              <div style={{ inlineSize: 72 }}>
                <Skeleton />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="catalog-panel">
        <p className="catalog-label">Arrived</p>
        <div className="catalog-stack">
          {ROWS.map(row => (
            <div key={row.name} style={ROW}>
              <div
                style={{
                  inlineSize: 40,
                  blockSize: 40,
                  borderRadius: '50%',
                  background: 'var(--bb-surface-selected)',
                  flex: 'none'
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div>{row.name}</div>
                <div style={{ color: 'var(--bb-text-muted)' }}>
                  {row.detail}
                </div>
              </div>
              <div className="bb-tabular" style={{ inlineSize: 72 }}>
                {row.figure}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};

/**
 * Light and dark, which is where the fill was decided.
 *
 * `--bb-surface-sunken` is the right role for a recess, and in light it is
 * enough on its own at 1.11:1 against the page. In dark the same token is only
 * 1.07:1 and the block all but disappears, so the fill mixes 6% of
 * `--bb-text` into it — a token that moves the opposite way per mode, so the
 * mix always moves away from the page. This story is the check: the bars must
 * be equally present in both panels, and equally quiet.
 */
export const Modes: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <div className="catalog-stack">
          <Skeleton lines={3} />
          <div className="catalog-row">
            <Skeleton variant="circle" style={{ height: 40 }} />
            <Skeleton variant="rect" style={{ height: 40 }} />
          </div>
        </div>
      </Scope>
      <Scope label="Dark" mode="dark">
        <div className="catalog-stack">
          <Skeleton lines={3} />
          <div className="catalog-row">
            <Skeleton variant="circle" style={{ height: 40 }} />
            <Skeleton variant="rect" style={{ height: 40 }} />
          </div>
        </div>
      </Scope>
    </div>
  )
};

/**
 * LTR and RTL. The short last line has no direction of its own: it is sized
 * with `inline-size` and left aligned to the inline start by the column, so
 * the ragged edge lands on the end side in both. If it ever appears on the
 * same side in both panels, a physical property has crept in.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <Skeleton lines={4} />
      </Scope>
      <Scope label="RTL" dir="rtl">
        <Skeleton lines={4} />
      </Scope>
    </div>
  )
};

/**
 * A 320px container, which is the width the entry gate names. Nothing here has
 * a width of its own, so there is nothing to break — which is exactly why it
 * is worth a picture rather than an assumption.
 */
export const Narrow: Story = {
  render: () => (
    <div className="catalog-panel" style={{ maxWidth: 320 }}>
      <div className="catalog-stack">
        <div style={ROW}>
          <Skeleton variant="circle" style={{ height: 40 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton lines={2} />
          </div>
        </div>
        <Skeleton lines={5} />
        <Skeleton variant="rect" style={{ height: 64 }} />
      </div>
    </div>
  )
};
