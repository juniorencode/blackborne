/*
 * The visual catalog for Breadcrumbs.
 *
 * The story that matters most is `RTL`, and not for the usual reason. The
 * separator is the first icon the library draws that is DIRECTIONAL — doc 02
 * §11.4 — so it is the first one that has to turn round in Arabic, and a
 * screenshot is where that is obvious.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../Card';
import { Link } from '../Link';
import { Breadcrumb, Breadcrumbs } from './Breadcrumbs';

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
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  args: { children: null }
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A trail of three, which is what most screens have.
 *
 * **The last step is text and the ones before it are links.** A link goes
 * somewhere, and the page you are on is not somewhere to go — it is marked as
 * the current page instead.
 *
 * Worth trying with the keyboard: `Tab` reaches each link and stops, and the
 * step you are on is not a stop at all.
 */
export const Overview: Story = {
  render: () => (
    <Breadcrumbs>
      <Breadcrumb>
        <Link href="#customers">Customers</Link>
      </Breadcrumb>
      <Breadcrumb>
        <Link href="#customer">Astilleros del Sur</Link>
      </Breadcrumb>
      <Breadcrumb>Invoices</Breadcrumb>
    </Breadcrumbs>
  )
};

/**
 * The shortest trail worth drawing, and the longest one that still fits.
 *
 * A trail of one is the page you are on and nothing else — correct, and the
 * moment to ask whether the trail is earning its space.
 */
export const Lengths: Story = {
  render: () => (
    <div className="catalog-stack">
      <div>
        <p className="catalog-label">one step</p>
        <Breadcrumbs>
          <Breadcrumb>Customers</Breadcrumb>
        </Breadcrumbs>
      </div>
      <div>
        <p className="catalog-label">two steps</p>
        <Breadcrumbs>
          <Breadcrumb>
            <Link href="#customers">Customers</Link>
          </Breadcrumb>
          <Breadcrumb>Astilleros del Sur</Breadcrumb>
        </Breadcrumbs>
      </div>
      <div>
        <p className="catalog-label">five steps</p>
        <Breadcrumbs>
          <Breadcrumb>
            <Link href="#home">Home</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href="#customers">Customers</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href="#customer">Astilleros del Sur</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href="#invoices">Invoices</Link>
          </Breadcrumb>
          <Breadcrumb>INV-4821</Breadcrumb>
        </Breadcrumbs>
      </div>
    </div>
  )
};

/**
 * A step that is not a link, in the middle.
 *
 * "Archived" is a grouping with no page of its own. It is text, and it is not
 * marked as the current page — only the last step is. Nothing about the
 * component had to be told: a step is whatever it is given.
 */
export const AStepWithNoPage: Story = {
  name: 'A step with no page',
  render: () => (
    <Breadcrumbs>
      <Breadcrumb>
        <Link href="#customers">Customers</Link>
      </Breadcrumb>
      <Breadcrumb>Archived</Breadcrumb>
      <Breadcrumb>
        <Link href="#customer">Astilleros del Sur</Link>
      </Breadcrumb>
      <Breadcrumb>Invoices</Breadcrumb>
    </Breadcrumbs>
  )
};

/**
 * RTL, which is what the separator exists to be checked against.
 *
 * The glyph is drawn pointing down and turned a quarter turn to point along
 * the reading direction — anti-clockwise in English, clockwise in Arabic. This
 * is the first directional icon in the library, and doc 02 §11.4 is why a
 * consumer cannot supply their own: only the meaning decides which icons flip,
 * and one arriving from outside would point the wrong way here with nothing to
 * say so.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR">
        <Breadcrumbs>
          <Breadcrumb>
            <Link href="#customers">Customers</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href="#customer">Astilleros del Sur</Link>
          </Breadcrumb>
          <Breadcrumb>Invoices</Breadcrumb>
        </Breadcrumbs>
      </Scope>
      <Scope label="RTL · العربية" dir="rtl">
        <Breadcrumbs>
          <Breadcrumb>
            <Link href="#customers">العملاء</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href="#customer">أحواض السفن الجنوبية</Link>
          </Breadcrumb>
          <Breadcrumb>الفواتير</Breadcrumb>
        </Breadcrumbs>
      </Scope>
    </div>
  )
};

/** Light and dark, and the two densities the gaps follow. */
export const Together: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <Breadcrumbs>
          <Breadcrumb>
            <Link href="#customers">Customers</Link>
          </Breadcrumb>
          <Breadcrumb>Astilleros del Sur</Breadcrumb>
        </Breadcrumbs>
      </Scope>
      <Scope label="Dark" mode="dark">
        <Breadcrumbs>
          <Breadcrumb>
            <Link href="#customers">Customers</Link>
          </Breadcrumb>
          <Breadcrumb>Astilleros del Sur</Breadcrumb>
        </Breadcrumbs>
      </Scope>
      <Scope label="Compact" density="compact">
        <Breadcrumbs>
          <Breadcrumb>
            <Link href="#customers">Customers</Link>
          </Breadcrumb>
          <Breadcrumb>Astilleros del Sur</Breadcrumb>
        </Breadcrumbs>
      </Scope>
    </div>
  )
};

/**
 * A long trail in a 320px slot. It wraps to a second line, which is legible at
 * any width and needs no query (doc 04 §3).
 *
 * Folding the middle into a "…" that opens a menu is the proper answer and it
 * waits for `Menu`: a "…" that opens nothing is doc 04 §7's lost content, and
 * doc 04 §11 carries the row.
 */
export const NarrowContainer: Story = {
  name: 'Narrow container',
  render: () => (
    <div className="catalog-panel" style={{ width: 320 }}>
      <p className="catalog-label">320px</p>
      <Breadcrumbs>
        <Breadcrumb>
          <Link href="#home">Home</Link>
        </Breadcrumb>
        <Breadcrumb>
          <Link href="#customers">Customers</Link>
        </Breadcrumb>
        <Breadcrumb>
          <Link href="#customer">Astilleros del Sur</Link>
        </Breadcrumb>
        <Breadcrumb>
          <Link href="#invoices">Invoices</Link>
        </Breadcrumb>
        <Breadcrumb>INV-4821</Breadcrumb>
      </Breadcrumbs>
    </div>
  )
};

/**
 * Where one actually goes: above the thing it describes.
 *
 * The composite doc 09 §10 asks for. The trail is secondary text, so it sits
 * quieter than the heading under it — and the current step is the only part of
 * it with any weight, which is what stops the two competing.
 */
export const AbovePageContent: Story = {
  name: 'Above the page content',
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 560 }}>
      <Breadcrumbs>
        <Breadcrumb>
          <Link href="#customers">Customers</Link>
        </Breadcrumb>
        <Breadcrumb>
          <Link href="#customer">Astilleros del Sur</Link>
        </Breadcrumb>
        <Breadcrumb>Invoices</Breadcrumb>
      </Breadcrumbs>
      <h1
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--bb-text)'
        }}
      >
        Invoices
      </h1>
      <Card>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--bb-text-muted)' }}>
          Eleven invoices, two of them unpaid.
        </p>
      </Card>
    </div>
  )
};
