/*
 * The visual catalog for Separator.
 *
 * These stories are not decoration. Several checkboxes on the entry gate can
 * only be ticked here: every state visible at once, light and dark side by
 * side rather than toggled, both densities, LTR next to RTL, and the component
 * in a narrow container.
 *
 * One of them carries more weight than the rest. A vertical separator has no
 * height of its own, so the way it fails is by rendering as nothing — a
 * regression that no unit test can see, because jsdom resolves no layout.
 * `VerticalInFlexRow` is the guard: if the fix in the component ever comes
 * undone, that story goes blank and the screenshot says so.
 *
 * Drag the dashed box to narrow the CONTAINER. That is the real test — the
 * window stays wide, which is the situation a consumer is in.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator, type SeparatorOrientation } from './Separator';

const ORIENTATIONS = [
  'horizontal',
  'vertical'
] as const satisfies readonly SeparatorOrientation[];

/*
 * Fails to compile if an orientation is added to the component and not to
 * ORIENTATIONS.
 *
 * A plain `SeparatorOrientation[]` annotation only checks that every entry IS
 * an orientation — not that every orientation is an entry, which is how a
 * catalog quietly stops covering what it appears to cover. Taken from Button,
 * where exactly that happened.
 */
const MISSING: Exclude<SeparatorOrientation, (typeof ORIENTATIONS)[number]>[] =
  [];
void MISSING;

/**
 * A panel carrying one combination of the three theme axes.
 *
 * `data-bb-theme` is what makes a brand override take effect: the semantic
 * tokens are recomputed inside that scope. Without it the override silently
 * does nothing (doc 03 §3.1).
 */
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

/** A caption for one case inside a story, so a screenshot explains itself. */
function Case({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/**
 * Both orientations doing their actual job: a horizontal one between stacked
 * sections, a vertical one between items in a row.
 */
function Both() {
  return (
    <div className="catalog-stack">
      <div>
        <p>Billing</p>
        <Separator />
        <p>Shipping</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>Draft</span>
        <Separator orientation="vertical" />
        <span>Last saved 14:02</span>
        <Separator orientation="vertical" />
        <span>3 items</span>
      </div>
    </div>
  );
}

const meta = {
  title: 'Components/Separator',
  component: Separator,
  args: { orientation: 'horizontal', isDecorative: false },
  argTypes: {
    orientation: { control: 'inline-radio', options: ORIENTATIONS },
    isDecorative: { control: 'boolean' }
  }
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The interactive one. Change the orientation and the decorative flag from the
 * controls panel.
 *
 * The vertical option is the interesting one: nothing here sets a height, and
 * the row is only as tall as its text.
 */
export const Playground: Story = {
  render: args => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span>before</span>
      <Separator {...args} />
      <span>after</span>
    </div>
  )
};

/** Both orientations, in the shapes they are actually used in. */
export const Orientations: Story = {
  render: () => <Both />
};

/**
 * THE case this component exists to get right, and the one a regression would
 * show up in first.
 *
 * A vertical separator is 1px wide and, left to itself, zero tall — so in a
 * flex row it renders as nothing at all, and the usual answer ("set a height")
 * asks the consumer for a number they do not have. Every row below sets no
 * height anywhere, and the line has to be visible in all of them.
 *
 * `items-center` is the one that catches the naive fix: a separator that
 * relies on inheriting `align-items: stretch` collapses the moment anything
 * above it centres its children, which is most rows in a real interface.
 *
 * The last two rows are not flex at all. They check the floor: a separator
 * with no row to stretch against still has to draw something.
 */
export const VerticalInFlexRow: Story = {
  render: () => (
    <div className="catalog-stack">
      <Case label="flex, align-items: center — the one that collapses">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Overview</span>
          <Separator orientation="vertical" />
          <span>Activity</span>
          <Separator orientation="vertical" />
          <span>Settings</span>
        </div>
      </Case>

      <Case label="flex, default alignment">
        <div style={{ display: 'flex', gap: 12 }}>
          <span>Overview</span>
          <Separator orientation="vertical" />
          <span>Activity</span>
        </div>
      </Case>

      <Case label="flex, align-items: flex-start">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span>Overview</span>
          <Separator orientation="vertical" />
          <span>Activity</span>
        </div>
      </Case>

      <Case label="flex, align-items: baseline">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span>Overview</span>
          <Separator orientation="vertical" />
          <span>Activity</span>
        </div>
      </Case>

      <Case label="mixed heights — the line spans the tallest item">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Short</span>
          <Separator orientation="vertical" />
          <span style={{ display: 'block', maxInlineSize: 160 }}>
            A block of text tall enough that the row is clearly taller than one
            line of it.
          </span>
          <Separator orientation="vertical" />
          <span>Short</span>
        </div>
      </Case>

      <Case label="grid, align-items: center">
        <div
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            justifyContent: 'start',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span>Overview</span>
          <Separator orientation="vertical" />
          <span>Activity</span>
        </div>
      </Case>

      <Case label="alone in a flex row — nothing to stretch against">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Separator orientation="vertical" />
        </div>
      </Case>

      <Case label="in a plain block container — no flex line at all">
        <div>
          <Separator orientation="vertical" />
        </div>
      </Case>
    </div>
  )
};

/**
 * Decorative and semantic, which look identical on purpose.
 *
 * There is nothing to see here and that is the point: the difference is
 * entirely in the accessibility tree, and a screenshot that ever shows a
 * difference between these two is reporting a bug.
 *
 * Semantic is the default, because the base is semantic and diverging from it
 * quietly is what doc 02 §1 forbids. Decorative is for when the division is
 * already carried by something a reader can perceive — the heading below says
 * "Shipping" whether or not a line is drawn above it — and the announcement
 * would only be repetition.
 */
export const Semantics: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Semantic · announced as a separator">
        <div className="catalog-stack">
          <p>Billing</p>
          <Separator />
          <p>Shipping</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Draft</span>
            <Separator orientation="vertical" />
            <span>3 items</span>
          </div>
        </div>
      </Scope>
      <Scope label="Decorative · not announced at all">
        <div className="catalog-stack">
          <p>Billing</p>
          <Separator isDecorative />
          <p>Shipping</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Draft</span>
            <Separator isDecorative orientation="vertical" />
            <span>3 items</span>
          </div>
        </div>
      </Scope>
    </div>
  )
};

/**
 * Light and dark SIDE BY SIDE, never by toggling (doc 03 §6). A dark theme
 * derived from the light one is recognisable at a glance, and the only way to
 * see that is to have both in view.
 *
 * A separator is the component this matters most for and is hardest to judge:
 * one border grey too light in dark mode and the line is simply gone, while
 * one too dark reads as a hard rule cutting the panel in half.
 */
export const Modes: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <Both />
      </Scope>
      <Scope label="Dark" mode="dark">
        <Both />
      </Scope>
    </div>
  )
};

/**
 * Density moves spacing and heights, and no colour (doc 03 §3).
 *
 * The line itself does not change — it is 1px in both — but the vertical one
 * tracks the height of whatever row it is in, so compare the two and check it
 * is still spanning the row rather than sitting proud of it.
 */
export const Densities: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Normal" density="normal">
        <Both />
      </Scope>
      <Scope label="Compact" density="compact">
        <Both />
      </Scope>
    </div>
  )
};

/**
 * LTR next to RTL. The order of the row reverses; nothing about the line is
 * measured from a physical side, so nothing else moves.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <Both />
      </Scope>
      <Scope label="RTL" dir="rtl">
        <Both />
      </Scope>
    </div>
  )
};

/**
 * A brand override, which is level 1 of the customisation contract: redefine
 * the scale, and the semantic tokens recompute on their own.
 *
 * The border is a grey and does not follow the brand, which is what should
 * happen — a divider that changed colour with the brand would be one more
 * thing competing for attention. This story is here to prove it does not move.
 */
export const BrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <Both />
      </Scope>
      <Scope label="Overridden brand · light" brand>
        <Both />
      </Scope>
      <Scope label="Overridden brand · dark" mode="dark" brand>
        <Both />
      </Scope>
    </div>
  )
};

/**
 * All three axes at once, plus RTL. Doc 03 §9 requires this combination
 * explicitly: dark, an alternate brand and compact together. Component by
 * component everything looks fine; combined is where the three greys you
 * thought were one show up.
 */
export const AllAxes: Story = {
  render: () => (
    <Scope
      label="Dark · compact · RTL · overridden brand"
      mode="dark"
      density="compact"
      dir="rtl"
      brand
    >
      <Both />
    </Scope>
  )
};

/**
 * The 320px container from the entry gate, pinned rather than dragged so it is
 * always checked. The window stays wide — that is the point.
 *
 * What to look for: the horizontal line stops at the container, not at the
 * window, and the row of vertical ones wraps without any of them collapsing.
 */
export const NarrowContainer: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack">
        <Both />
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span>Pedidos pendientes de revisión</span>
          <Separator orientation="vertical" />
          <span>Facturación y envío</span>
          <Separator orientation="vertical" />
          <span>Historial</span>
        </div>
      </div>
    </div>
  )
};
