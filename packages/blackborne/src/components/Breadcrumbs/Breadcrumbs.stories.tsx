/*
 * The visual catalog for Breadcrumbs.
 *
 * Two stories carry the weight. `RTL`, because the separator is the first icon
 * the library DRAWS that is directional (doc 02 §11.4) and a screenshot is
 * where turning it round is obvious. And `Structures`, because a trail now has
 * two of them: below the medium step the middle folds into a "…" that opens a
 * menu of addresses.
 *
 * The widths in `Structures` are chosen against the scale rather than by eye,
 * and `.catalog-panel` is content-box, so the number it is given is the number
 * the component gets:
 *
 *   320px → 20rem   → narrower than `narrow` (24rem) → folded
 *   440px → 27.5rem → `narrow`                       → folded
 *   560px → 35rem   → `medium`                       → the whole trail
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../Card';
import { Breadcrumb } from './Breadcrumb';
import { Breadcrumbs } from './Breadcrumbs';

/** One scope of the theme axes, with a label and a width. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  width,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      {...(width === undefined ? {} : { style: { width } })}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/*
 * The same five-step trail wherever the structure is the subject — written as
 * a VALUE and not as a component, which is the one constraint of a set that is
 * read rather than rendered: a component of your own that returns steps is not
 * a step. A fragment is walked into and an array is flattened, so both of
 * those work.
 */
const long = (
  <>
    <Breadcrumb href="#home">Home</Breadcrumb>
    <Breadcrumb href="#customers">Customers</Breadcrumb>
    <Breadcrumb href="#customer">Astilleros del Sur</Breadcrumb>
    <Breadcrumb href="#invoices">Invoices</Breadcrumb>
    <Breadcrumb>INV-4821</Breadcrumb>
  </>
);

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
 * the current page instead. The address is a prop rather than a `Link` you
 * write yourself, because the same step has to be able to appear inside the
 * menu the trail collapses into (decision 0019).
 *
 * Worth trying with the keyboard: `Tab` reaches each link and stops, and the
 * step you are on is not a stop at all.
 */
export const Overview: Story = {
  render: () => (
    <Breadcrumbs>
      <Breadcrumb href="#customers">Customers</Breadcrumb>
      <Breadcrumb href="#customer">Astilleros del Sur</Breadcrumb>
      <Breadcrumb>Invoices</Breadcrumb>
    </Breadcrumbs>
  )
};

/**
 * **The story the collapse exists to be looked at in.** One trail, three
 * widths, two structures.
 *
 * Below the medium step the two steps that matter stay — the way home and
 * where you are — and everything between them moves into a "…". The first
 * paint is always the folded one, because a `ResizeObserver` reports after
 * layout and doc 04 §4.1 makes that mechanical rather than a judgement.
 *
 * The panel the "…" opens is a menu of ADDRESSES, which is what earned
 * `MenuItem` an `href`: a row that navigated by calling a function could not
 * be middle-clicked, ctrl-clicked or copied, and none of that would fail
 * loudly. Its own appearance is in `Menu`'s baselines rather than here — a
 * menu this component opens cannot be held open for a screenshot, and a prop
 * to do it would exist for the catalog and nothing else.
 */
export const Structures: Story = {
  render: () => (
    <div className="catalog-stack">
      <Scope label="320px · folded" width={320}>
        <Breadcrumbs>{long}</Breadcrumbs>
      </Scope>
      <Scope label="440px · narrow, still folded" width={440}>
        <Breadcrumbs>{long}</Breadcrumbs>
      </Scope>
      <Scope label="560px · medium, the whole trail" width={560}>
        <Breadcrumbs>{long}</Breadcrumbs>
      </Scope>
    </div>
  )
};

/**
 * The shortest trail worth drawing, and the two the collapse deliberately
 * leaves alone.
 *
 * A trail of one is the page you are on and nothing else — correct, and the
 * moment to ask whether the trail is earning its space. And a trail of three
 * in a narrow container does **not** fold: folding one step replaces something
 * you can read with something you have to open, which is the same rule
 * `Pagination` reached from the other direction, where a gap never hides one
 * page.
 */
export const Lengths: Story = {
  render: () => (
    <div className="catalog-stack">
      <Scope label="one step · 320px" width={320}>
        <Breadcrumbs>
          <Breadcrumb>Customers</Breadcrumb>
        </Breadcrumbs>
      </Scope>
      <Scope label="three steps · 320px, nothing worth folding" width={320}>
        <Breadcrumbs>
          <Breadcrumb href="#customers">Customers</Breadcrumb>
          <Breadcrumb href="#customer">Astilleros del Sur</Breadcrumb>
          <Breadcrumb>Invoices</Breadcrumb>
        </Breadcrumbs>
      </Scope>
      <Scope label="four steps · 320px, two of them folded" width={320}>
        <Breadcrumbs>
          <Breadcrumb href="#customers">Customers</Breadcrumb>
          <Breadcrumb href="#customer">Astilleros del Sur</Breadcrumb>
          <Breadcrumb href="#invoices">Invoices</Breadcrumb>
          <Breadcrumb>INV-4821</Breadcrumb>
        </Breadcrumbs>
      </Scope>
    </div>
  )
};

/**
 * A step that is not a link, in the middle.
 *
 * "Archived" is a grouping with no page of its own: no `href`, so it is text.
 * It is not marked as the current page — only the last step is — and when a
 * narrow container folds it into the menu it arrives dimmed rather than as
 * somewhere to go, which is what it already was in the row.
 */
export const AStepWithNoPage: Story = {
  name: 'A step with no page',
  render: () => (
    <div className="catalog-stack">
      <Scope label="the whole trail" width={560}>
        <Breadcrumbs>
          <Breadcrumb href="#customers">Customers</Breadcrumb>
          <Breadcrumb>Archived</Breadcrumb>
          <Breadcrumb href="#customer">Astilleros del Sur</Breadcrumb>
          <Breadcrumb>Invoices</Breadcrumb>
        </Breadcrumbs>
      </Scope>
      <Scope label="folded · Archived is in the menu" width={320}>
        <Breadcrumbs>
          <Breadcrumb href="#customers">Customers</Breadcrumb>
          <Breadcrumb>Archived</Breadcrumb>
          <Breadcrumb href="#customer">Astilleros del Sur</Breadcrumb>
          <Breadcrumb>Invoices</Breadcrumb>
        </Breadcrumbs>
      </Scope>
    </div>
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
 *
 * The folded panel gets its own row, because the "…" has to end up on the
 * correct side of the trail and nothing in the component knows which side that
 * is.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    <div className="catalog-stack">
      <div className="catalog-pair">
        <Scope label="LTR">
          <Breadcrumbs>
            <Breadcrumb href="#customers">Customers</Breadcrumb>
            <Breadcrumb href="#customer">Astilleros del Sur</Breadcrumb>
            <Breadcrumb>Invoices</Breadcrumb>
          </Breadcrumbs>
        </Scope>
        <Scope label="RTL · العربية" dir="rtl">
          <Breadcrumbs>
            <Breadcrumb href="#customers">العملاء</Breadcrumb>
            <Breadcrumb href="#customer">أحواض السفن الجنوبية</Breadcrumb>
            <Breadcrumb>الفواتير</Breadcrumb>
          </Breadcrumbs>
        </Scope>
      </div>
      <Scope label="RTL · folded · 320px" dir="rtl" width={320}>
        <Breadcrumbs>
          <Breadcrumb href="#home">الرئيسية</Breadcrumb>
          <Breadcrumb href="#customers">العملاء</Breadcrumb>
          <Breadcrumb href="#customer">أحواض السفن الجنوبية</Breadcrumb>
          <Breadcrumb href="#invoices">الفواتير</Breadcrumb>
          <Breadcrumb>INV-4821</Breadcrumb>
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
          <Breadcrumb href="#customers">Customers</Breadcrumb>
          <Breadcrumb>Astilleros del Sur</Breadcrumb>
        </Breadcrumbs>
      </Scope>
      <Scope label="Dark" mode="dark">
        <Breadcrumbs>
          <Breadcrumb href="#customers">Customers</Breadcrumb>
          <Breadcrumb>Astilleros del Sur</Breadcrumb>
        </Breadcrumbs>
      </Scope>
      <Scope label="Compact" density="compact">
        <Breadcrumbs>
          <Breadcrumb href="#customers">Customers</Breadcrumb>
          <Breadcrumb>Astilleros del Sur</Breadcrumb>
        </Breadcrumbs>
      </Scope>
    </div>
  )
};

/**
 * Two long steps in a narrow container, where the collapse has nothing to
 * offer: there is no middle to fold, so the row **wraps**.
 *
 * That is the floor underneath the structural change rather than an
 * alternative to it. A container query counts pixels and cannot know whether
 * these particular words fit, so something has to hold at every width — and
 * doc 04 §7 is blunt about the alternative: content hidden by overflow is
 * content lost. `Tabs` needed exactly the same pair.
 */
export const Wrapping: Story = {
  render: () => (
    <Scope label="320px, two long steps" width={320}>
      <Breadcrumbs>
        <Breadcrumb href="#customers">Customers and their contracts</Breadcrumb>
        <Breadcrumb>Astilleros del Sur, southern region</Breadcrumb>
      </Breadcrumbs>
    </Scope>
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
        <Breadcrumb href="#customers">Customers</Breadcrumb>
        <Breadcrumb href="#customer">Astilleros del Sur</Breadcrumb>
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
