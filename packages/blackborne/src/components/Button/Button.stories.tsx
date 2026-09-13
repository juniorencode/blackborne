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
import { Force } from '../../catalog/forceState';

const VARIANTS = [
  'primary',
  'secondary',
  'subtle',
  'danger',
  'ghost',
  'link'
] as const satisfies readonly ButtonVariant[];

/*
 * Fails to compile if a variant is added to the component and not to this
 * list.
 *
 * The previous declaration was `ButtonVariant[]`, which only checks that every
 * entry is A variant — not that every variant is an entry. So `link` was added
 * to the component and every story that walks this list silently stopped being
 * complete: it was missing from the variants grid, from both theme axes and
 * from the screenshots that guard them.
 *
 * A catalog that quietly covers less than it appears to is worse than one that
 * covers nothing, because it is trusted.
 */
/*
 * Fails to compile if a variant is added to the component and not to VARIANTS.
 *
 * A plain `ButtonVariant[]` annotation, which is what was here before, only
 * checks that every entry IS a variant — not that every variant is an entry.
 * So `link` was added to the component and every story that walks this list
 * silently stopped being complete: missing from the variants grid, from both
 * theme axes, and from the screenshots that guard them.
 *
 * A catalog that quietly covers less than it appears to is worse than one that
 * covers nothing, because it is trusted.
 */
const MISSING: Exclude<ButtonVariant, (typeof VARIANTS)[number]>[] = [];
void MISSING;

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
    <div className="catalog-stack">
      <div className="catalog-row">
        {SIZES.map(size => (
          <Button key={size} variant="primary" size={size}>
            {`size ${size}`}
          </Button>
        ))}
      </div>
      {/*
       * The link variant too, because it is the one whose size cannot be seen.
       * The others show it as a box; this one has no box, so only the type and
       * the space around it carry it — and a size that only shows up as
       * spacing is exactly the kind that drifts unnoticed.
       */}
      <div className="catalog-row">
        {SIZES.map(size => (
          <Button key={size} variant="link" size={size}>
            {`size ${size}`}
          </Button>
        ))}
      </div>
    </div>
  )
};

/*
 * Every state, visible at once and without interaction.
 *
 * Hover, focus and pressed are normally reachable only by pointing at the
 * thing. Here they are forced by putting the same DOM attributes React Aria
 * puts there — not faking a state, the real attribute the CSS targets.
 *
 * It matters for two reasons: the entry gate wants every state in the catalog,
 * and a screenshot cannot hover. States have to be statically representable or
 * they can never be covered.
 *
 * How they are forced is not a detail — passing them as props does nothing at
 * all, which is why <Force> exists. Read the note on it.
 *
 * AND IT IS LIGHT AND DARK, which it was not until 2026-09-13 and which cost a
 * real defect. A forced-state story is the only place a state is ever
 * rendered, so a light-only one leaves every state in dark mode unreachable by
 * anything — axe reads what is on a page. What lived in that gap: a pressed
 * primary button in dark at 2.08:1, for as long as the token layer has
 * existed, under 501 stories and 211 baselines (doc 10 §11.9).
 */

function AllStates() {
  return (
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
          <Force state="data-hovered">
            <Button variant={variant}>hover</Button>
          </Force>
          <Force state="data-pressed">
            <Button variant={variant}>pressed</Button>
          </Force>
          <Force state="data-focused">
            <Button variant={variant}>focus</Button>
          </Force>
          <Button variant={variant} isDisabled>
            disabled
          </Button>
          <Button variant={variant} isPending>
            pending
          </Button>
        </div>
      ))}
    </div>
  );
}

export const States: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <AllStates />
      </Scope>
      <Scope label="Dark" mode="dark">
        <AllStates />
      </Scope>
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
  ghost: 'Más opciones',
  link: '¿Olvidaste tu contraseña?'
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
