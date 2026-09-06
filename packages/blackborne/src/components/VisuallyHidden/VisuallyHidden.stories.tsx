/*
 * The visual catalog for VisuallyHidden, which is a contradiction worth being
 * deliberate about: the component paints nothing, so a story that renders it
 * on its own is a blank page and proves nothing.
 *
 * What the catalog can prove is what SURROUNDS it. Two things, and they are
 * the two the unit tests cannot reach because jsdom does no layout:
 *
 *   1. It occupies no space. The clip technique takes the node out of flow, so
 *      neighbours must sit exactly as they would with nothing between them.
 *   2. It stays hidden everywhere. Nothing here reads a token, so no mode,
 *      density, direction or brand should be able to make it appear — and a
 *      regression that made it appear would be visible only here.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisuallyHidden } from './VisuallyHidden';
import { Button } from '../Button';

const meta = {
  title: 'Components/VisuallyHidden',
  component: VisuallyHidden,
  args: { children: 'Announced, never painted' }
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A panel carrying one combination of the three theme axes, matching the rest
 * of the catalog.
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

/**
 * Two solid blocks with whatever is passed between them. Nothing else — the
 * whole measurement is whether the blocks touch.
 */
function Ruler({ children }: { children?: React.ReactNode }) {
  const block = {
    inlineSize: 48,
    blockSize: 24,
    background: 'var(--bb-accent)'
  };
  return (
    <span style={{ display: 'inline-flex' }}>
      <span style={block} />
      {children}
      <span style={block} />
    </span>
  );
}

/** Change the text from the controls panel. The dashed box stays empty. */
export const Playground: Story = {
  render: args => (
    <div className="catalog-stack">
      <p className="catalog-label">
        The dashed box contains the text from the controls panel. A screen
        reader announces it; nothing is drawn and the box does not grow.
      </p>
      <div
        style={{
          border: '1px dashed var(--bb-border)',
          borderRadius: 'var(--bb-radius-md)',
          padding: 12
        }}
      >
        <VisuallyHidden {...args} />
      </div>
    </div>
  )
};

/**
 * The layout gate, and the one check jsdom cannot do at all.
 *
 * The first two rulers must be pixel-identical: the clip technique takes the
 * node out of flow, so a hidden node between the blocks changes nothing. The
 * third is the control — ordinary text in the same place — and it is here to
 * show what a regression looks like. If row two ever starts resembling row
 * three, the hiding stopped working.
 *
 * Worth knowing why absolute positioning is load-bearing and not incidental:
 * an out-of-flow node is not a flex item, so it also contributes no `gap`.
 * A technique that merely clipped an in-flow node would pass a naive look and
 * still push a toolbar apart by one gap per hidden label.
 */
export const TakesNoSpace: Story = {
  render: () => (
    <div className="catalog-stack">
      <div className="catalog-row">
        <span className="catalog-label" style={{ marginBlockEnd: 0 }}>
          nothing between
        </span>
        <Ruler />
      </div>
      <div className="catalog-row">
        <span className="catalog-label" style={{ marginBlockEnd: 0 }}>
          VisuallyHidden between
        </span>
        <Ruler>
          <VisuallyHidden>
            This text is read aloud and takes no room
          </VisuallyHidden>
        </Ruler>
      </div>
      <div className="catalog-row">
        <span className="catalog-label" style={{ marginBlockEnd: 0 }}>
          plain text between, for contrast
        </span>
        <Ruler>
          <span>This text is read aloud and takes no room</span>
        </Ruler>
      </div>
    </div>
  )
};

/**
 * The everyday use: a control whose visible label is short because the column
 * around it supplies the context, and whose announced name has to stand alone.
 * "Edit" repeated down a table is nine identical buttons to anyone listening.
 *
 * Note this is NOT how an icon-only button gets its name. Doc 02 §11.3 puts
 * that on the control, as `aria-label`. Hidden text is for the case here —
 * extending a name that already exists — and for the narrower one in
 * `NumberField`, where the base composes `aria-labelledby` and an `aria-label`
 * would be ignored.
 */
export const ExtendsAName: Story = {
  render: () => (
    <div className="catalog-stack">
      <p className="catalog-label">
        Both buttons read as “Edit”. Their accessible names are “Edit invoice
        1041” and “Edit invoice 1042”.
      </p>
      <div className="catalog-row">
        <Button variant="secondary" size="sm">
          Edit
          <VisuallyHidden>{' invoice 1041'}</VisuallyHidden>
        </Button>
        <Button variant="secondary" size="sm">
          Edit
          <VisuallyHidden>{' invoice 1042'}</VisuallyHidden>
        </Button>
      </div>
    </div>
  )
};

/**
 * Every axis at once, including a 320px container.
 *
 * Nothing in this component reads a token, so all of these should be
 * identical and empty. That is exactly why the story is worth having: it is
 * cheap, and the day something starts painting, this is the panel that shows
 * it.
 */
export const AllAxes: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light">
        <Ruler>
          <VisuallyHidden>Still nothing</VisuallyHidden>
        </Ruler>
      </Scope>
      <Scope
        label="Dark · compact · RTL · overridden brand"
        mode="dark"
        density="compact"
        dir="rtl"
        brand
      >
        <Ruler>
          <VisuallyHidden>Still nothing</VisuallyHidden>
        </Ruler>
      </Scope>
      <Scope label="320px container">
        <div style={{ width: 320 }}>
          <Ruler>
            <VisuallyHidden>Still nothing</VisuallyHidden>
          </Ruler>
        </div>
      </Scope>
    </div>
  )
};
