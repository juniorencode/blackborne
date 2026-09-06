/*
 * The visual catalog for Card.
 *
 * It carries more weight here than for most components, because the thing this
 * component exists to do CANNOT BE UNIT TESTED. jsdom implements neither
 * containment nor container queries, so no assertion in Card.test.tsx can say
 * whether the container is in effect — decision 0010 says so outright, and
 * doc 10 §3 is why the browser layer exists at all.
 *
 * So the proof is here, and it is a layout that moves: the content inside the
 * card is one column, then two, then three, and the only thing that changed is
 * how wide the CARD is. The window never moves. Put the same content outside a
 * Card and it stays in one column for ever, because nothing else in the
 * library declares a container.
 *
 * The classes that do it — `bb:@narrow:` and `bb:@medium:` — are Tailwind's
 * container-query variants over the scale in styles/index.css. They are NOT
 * viewport variants, and the viewport ones do not exist: `--breakpoint-*` is
 * cleared, so there is no `bb:md:` to write by mistake.
 *
 * Drag the dashed box to narrow the card by hand. That is the real test — the
 * window stays wide, which is the situation a consumer is in (doc 04 §10).
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

/*
 * The widths are chosen against the scale, not by eye, and the arithmetic is
 * worth writing down because it is the part that surprises people.
 *
 * A container query is answered by the container's CONTENT box, so the Card's
 * padding and border come off the width before the threshold is compared:
 * 16px each side plus 1px each side at normal density, 12px at compact. The
 * thresholds are --container-narrow (24rem = 384px) and --container-medium
 * (30rem = 480px).
 *
 *   280px  ->  246 content  ->  under narrow  ->  one column
 *   440px  ->  406 content  ->  over narrow   ->  two columns
 *   600px  ->  566 content  ->  over medium   ->  three columns
 *
 * At compact density the content boxes are 254, 414 and 574 — the same three
 * buckets, which is the point: density is not responsive (doc 04 §9).
 */
const NARROW = 280;
const MIDDLE = 440;
const WIDE = 600;

const FIELDS = [
  { label: 'Order', value: '#4821' },
  { label: 'Customer', value: 'Northwind Traders' },
  { label: 'Placed', value: '12 Mar 2026' },
  { label: 'Status', value: 'Awaiting payment' },
  { label: 'Items', value: '14' },
  { label: 'Total', value: '2,480.00' }
];

/*
 * The content that reflows, and the whole demonstration.
 *
 * Narrow-first, which doc 04 §4.1 requires and is not a stylistic preference:
 * the base is one column and the wider layouts are added on top. If a query
 * never matches — an old browser, or no container above it — this stays in one
 * column, which is usable at any width. Written the other way round, the same
 * failure would cram three columns into a 280px panel.
 *
 * `min-w-0` on each cell because a grid track will not shrink below its
 * content by default, and a long unbroken value would push the card wider than
 * the space it was given (doc 04 §3).
 */
function Summary({ fields = FIELDS }: { fields?: typeof FIELDS }) {
  return (
    <div className="bb:grid bb:gap-(--bb-space-4) bb:@narrow:grid-cols-2 bb:@medium:grid-cols-3">
      {fields.map(field => (
        <div key={field.label} className="bb:min-w-0">
          <div className="bb:text-xs bb:text-text-muted">{field.label}</div>
          <div className="bb:text-md bb:font-strong">{field.value}</div>
        </div>
      ))}
    </div>
  );
}

/** A fixed-width slot, so a story shows a threshold rather than a guess. */
function Bounded({
  label,
  width,
  children
}: {
  label: string;
  width: number;
  children: React.ReactNode;
}) {
  return (
    /*
     * flexShrink: 0, so the slot is genuinely fixed. Inside a wrapping flex
     * row a 600px item shrinks by default, which made the widest slot follow
     * the WINDOW — the exact thing this component exists to stop depending on,
     * and it silently turned the three-column layout into one at a narrow
     * viewport.
     */
    <div style={{ width, flexShrink: 0 }}>
      <div className="catalog-label">{label}</div>
      {children}
    </div>
  );
}

/** Two slots in view at once, wrapping rather than overflowing. */
function Side({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'start'
      }}
    >
      {children}
    </div>
  );
}

/**
 * A panel carrying one combination of the theme axes.
 *
 * There is no brand axis here, and that is not an oversight: a Card reads
 * `surface`, `text`, `border`, a radius and a spacing step, and not one of
 * them derives from the brand scale. Overriding the brand moves nothing on a
 * Card — it moves what is placed inside one.
 */
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
      <div className="catalog-label">{label}</div>
      {children}
    </div>
  );
}

const meta = {
  title: 'Components/Card',
  component: Card,
  args: { children: <Summary /> }
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The interactive one. Drag the bottom-right corner of the dashed box: the
 * card narrows with it and the content inside goes three columns, two, one.
 * Nothing about the window changed.
 */
export const Playground: Story = {};

/**
 * THE STORY THIS COMPONENT EXISTS FOR, and the one a browser check can prove.
 *
 * The same card, with the same children, in a narrow slot and a wide one. If
 * the two look identical, the container is not in effect and decision 0010 is
 * not implemented — which is precisely the failure a unit test cannot see.
 */
export const Containers: Story = {
  render: () => (
    <Side>
      <Bounded label={`${NARROW}px slot · one column`} width={NARROW}>
        <Card>
          <Summary />
        </Card>
      </Bounded>
      <Bounded label={`${WIDE}px slot · three columns`} width={WIDE}>
        <Card>
          <Summary />
        </Card>
      </Bounded>
    </Side>
  )
};

/**
 * All three steps of the container scale, stacked so the two thresholds are
 * unambiguous. The scale is short on purpose — every extra step multiplies the
 * test matrix (doc 04 §4).
 */
export const ContainerSteps: Story = {
  render: () => (
    <div className="catalog-stack">
      {[NARROW, MIDDLE, WIDE].map(width => (
        <Bounded key={width} label={`${width}px slot`} width={width}>
          <Card>
            <Summary />
          </Card>
        </Bounded>
      ))}
    </div>
  )
};

/**
 * A Card inside a Card, because the container that answers a query is the
 * NEAREST one. The inner card is narrower than the outer, so its content
 * reflows earlier — the outer card's width is not what its grandchildren see.
 *
 * Worth knowing before reaching for this: two nested cards share one radius
 * with 16px of padding between them, and doc 03 §4.3's nested radius rule
 * wants the inner one smaller. There is no prop for that today and nothing has
 * asked for one (P5).
 */
export const Nested: Story = {
  render: () => (
    <Bounded label={`${WIDE}px slot`} width={WIDE}>
      <Card>
        <div className="catalog-stack">
          <Summary fields={FIELDS.slice(0, 3)} />
          <Card>
            <Summary fields={FIELDS.slice(3)} />
          </Card>
        </div>
      </Card>
    </Bounded>
  )
};

/**
 * Light and dark SIDE BY SIDE, never by toggling (doc 03 §6).
 *
 * The thing to look at is the border. A Card takes `surface`, which on a page
 * painted with the same token is the same colour as its ground — so the border
 * is the whole separation, in both modes, and it has to hold in both. A shadow
 * would have been nearly invisible on the dark one (doc 03 §5, rule 5).
 */
export const Modes: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <Card>
          <Summary />
        </Card>
      </Scope>
      <Scope label="Dark" mode="dark">
        <Card>
          <Summary />
        </Card>
      </Scope>
    </div>
  )
};

/**
 * Density moves the padding and nothing else — no colour, no text size, and no
 * threshold (doc 03 §3, doc 04 §9). The slot width is the same in both, so
 * what moves is the air inside the edge.
 */
export const Densities: Story = {
  render: () => (
    <Side>
      <Scope label="Normal" density="normal">
        <Bounded label={`${MIDDLE}px slot`} width={MIDDLE}>
          <Card>
            <Summary />
          </Card>
        </Bounded>
      </Scope>
      <Scope label="Compact" density="compact">
        <Bounded label={`${MIDDLE}px slot`} width={MIDDLE}>
          <Card>
            <Summary />
          </Card>
        </Bounded>
      </Scope>
    </Side>
  )
};

/** LTR next to RTL. Padding is uniform, so what reverses is the grid order. */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <Card>
          <Summary />
        </Card>
      </Scope>
      <Scope label="RTL" dir="rtl">
        <Card>
          <Summary />
        </Card>
      </Scope>
    </div>
  )
};

/**
 * Dark, compact and RTL at once. Component by component everything looks fine;
 * combined is where the three greys you thought were one show up (doc 03 §9).
 */
export const AllAxes: Story = {
  render: () => (
    <Scope label="Dark · compact · RTL" mode="dark" density="compact" dir="rtl">
      <div className="catalog-stack">
        {[NARROW, WIDE].map(width => (
          <Bounded key={width} label={`${width}px slot`} width={width}>
            <Card>
              <Summary />
            </Card>
          </Bounded>
        ))}
      </div>
    </Scope>
  )
};

/*
 * Pseudo-localisation. Doc 05 §8 calls this the highest-return test on its
 * list: lengthen every string by roughly 40% and layout breaks that would
 * otherwise surface the day someone translates to German appear in minutes.
 *
 * A Card carries no string of its own, so what is under test is whether long
 * content wraps inside it or bursts it — and, in the narrow slot, whether one
 * column at 246px still reads.
 */
const LONG = [
  { label: 'Número de pedido', value: '#4821 · Reposición trimestral' },
  {
    label: 'Cliente facturado',
    value: 'Comercializadora Northwind, S. de R.L.'
  },
  { label: 'Fecha de emisión', value: '12 de marzo de 2026' },
  { label: 'Estado del pago', value: 'Pendiente de confirmación bancaria' },
  { label: 'Líneas incluidas', value: '14 artículos en 3 almacenes' },
  { label: 'Importe total', value: '2.480,00 EUR sin impuestos' }
];

export const LongLabels: Story = {
  render: () => (
    <Side>
      <Bounded label={`${NARROW}px slot`} width={NARROW}>
        <Card>
          <Summary fields={LONG} />
        </Card>
      </Bounded>
      <Bounded label={`${WIDE}px slot · RTL`} width={WIDE}>
        <div dir="rtl">
          <Card>
            <Summary fields={LONG} />
          </Card>
        </div>
      </Bounded>
    </Side>
  )
};
