/*
 * The visual catalog for Button.
 *
 * These stories are not decoration. Several checkboxes on the entry gate can
 * only be ticked here: every state visible at once, light and dark side by
 * side rather than toggled, both densities, LTR next to RTL, and the component
 * in a narrow container.
 *
 * Drag the dashed box to narrow the CONTAINER. That is the real test — the
 * window stays wide, which is the situation a consumer is in.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, type ButtonSize, type ButtonVariant } from './Button';

const VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'subtle',
  'danger',
  'ghost'
];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

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
      style={
        brand
          ? ({
              '--bb-x-brand-3': '#f3e8ff',
              '--bb-x-brand-4': '#e9d5ff',
              '--bb-x-brand-5': '#ddd0fe',
              '--bb-x-brand-9': '#7c3aed',
              '--bb-x-brand-10': '#6d28d9',
              '--bb-x-brand-11': '#5b21b6'
            } as React.CSSProperties)
          : undefined
      }
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

function AllVariants() {
  return (
    <div className="catalog-stack">
      <div className="catalog-row">
        {VARIANTS.map(variant => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Save changes', variant: 'secondary', size: 'md' },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES }
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The interactive one. Change variant and size from the controls panel. */
export const Playground: Story = {};

export const Variants: Story = {
  render: () => <AllVariants />
};

/**
 * The three sizes. Doc 03 §9 makes this a required check: a field, a select
 * and a button of the same size must align exactly in a row. Until there is a
 * field to align against, this at least shows the heights are a scale rather
 * than three arbitrary numbers.
 */
export const Sizes: Story = {
  render: () => (
    <div className="catalog-row">
      {SIZES.map(size => (
        <Button key={size} variant="primary" size={size}>
          {`size ${size}`}
        </Button>
      ))}
    </div>
  )
};

/*
 * Every state, visible at once and without interaction.
 *
 * Hover, focus and pressed are normally only reachable by pointing at the
 * thing. Here they are forced by setting the same DOM attributes React Aria
 * sets — this is not faking a state, it is the real attribute the CSS targets.
 *
 * It matters for two reasons: the entry gate wants every state in the catalog,
 * and visual regression cannot hover. A screenshot tool needs the states to be
 * statically representable or it can never cover them.
 *
 * The cast is needed because these attributes are internal to the base and are
 * deliberately not part of our public props (doc 02 §10).
 */
type ForcedState = 'data-hovered' | 'data-pressed' | 'data-focus-visible';

function forced(attribute: ForcedState) {
  return { [attribute]: true } as unknown as Record<string, boolean>;
}

export const States: Story = {
  render: () => (
    <div className="catalog-stack">
      {VARIANTS.map(variant => (
        <div key={variant} className="catalog-row">
          <span
            className="catalog-label"
            style={{ width: 80, marginBlockEnd: 0 }}
          >
            {variant}
          </span>
          <Button variant={variant}>default</Button>
          <Button variant={variant} {...forced('data-hovered')}>
            hover
          </Button>
          <Button variant={variant} {...forced('data-pressed')}>
            pressed
          </Button>
          <Button variant={variant} {...forced('data-focus-visible')}>
            focus
          </Button>
          <Button variant={variant} isDisabled>
            disabled
          </Button>
          <Button variant={variant} isPending>
            pending
          </Button>
        </div>
      ))}
    </div>
  )
};

/**
 * Light and dark SIDE BY SIDE, never by toggling (doc 03 §6). A dark theme
 * derived from the light one is recognisable at a glance, and the only way to
 * see that is to have both in view.
 */
export const Modes: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <AllVariants />
      </Scope>
      <Scope label="Dark" mode="dark">
        <AllVariants />
      </Scope>
    </div>
  )
};

/**
 * Density moves heights and spacing, and no colour (doc 03 §3). Compare the
 * two: the buttons get shorter, the colours do not move, and the text size
 * does not shrink — compact trims air, not legibility.
 */
export const Densities: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Normal" density="normal">
        <AllVariants />
      </Scope>
      <Scope label="Compact" density="compact">
        <AllVariants />
      </Scope>
    </div>
  )
};

/** LTR next to RTL. The order reverses and no measurement is physical. */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <AllVariants />
      </Scope>
      <Scope label="RTL" dir="rtl">
        <AllVariants />
      </Scope>
    </div>
  )
};

/**
 * A brand override, which is level 1 of the customisation contract: redefine
 * the scale, and the semantic tokens recompute on their own.
 */
export const BrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <AllVariants />
      </Scope>
      <Scope label="Overridden brand · light" brand>
        <AllVariants />
      </Scope>
      <Scope label="Overridden brand · dark" mode="dark" brand>
        <AllVariants />
      </Scope>
    </div>
  ),
  args: { children: 'Save changes' }
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
      <div className="catalog-stack">
        <AllVariants />
        <div className="catalog-row">
          {SIZES.map(size => (
            <Button key={size} variant="primary" size={size}>
              {`size ${size}`}
            </Button>
          ))}
        </div>
      </div>
    </Scope>
  )
};

/**
 * Pseudo-localisation. Doc 05 §8 calls this the highest-return test on its
 * list: lengthening every string by roughly 40% finds layout breaks in minutes
 * that otherwise surface the day someone translates to German.
 *
 * What to look for: nothing overlaps, nothing is sized to fit one particular
 * label, and long text either wraps or truncates on purpose rather than
 * bursting the box in silence.
 */
const LONG: Record<ButtonVariant, string> = {
  primary: 'Guardar todos los cambios pendientes',
  secondary: 'Cancelar y volver al listado',
  subtle: 'Ver detalles completos',
  danger: 'Eliminar definitivamente el registro',
  ghost: 'Más opciones'
};

export const LongLabels: Story = {
  render: () => (
    <div className="catalog-stack">
      <div className="catalog-row">
        {VARIANTS.map(variant => (
          <Button key={variant} variant={variant}>
            {LONG[variant]}
          </Button>
        ))}
      </div>
      <Scope label="The same, in RTL" dir="rtl">
        <div className="catalog-row">
          {VARIANTS.map(variant => (
            <Button key={variant} variant={variant}>
              {LONG[variant]}
            </Button>
          ))}
        </div>
      </Scope>
    </div>
  )
};

/**
 * The 320px container from the entry gate, pinned rather than dragged so it is
 * always checked. The window stays wide — that is the point.
 */
export const NarrowContainer: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack">
        <AllVariants />
        <Button variant="primary">Guardar todos los cambios pendientes</Button>
      </div>
    </div>
  )
};
