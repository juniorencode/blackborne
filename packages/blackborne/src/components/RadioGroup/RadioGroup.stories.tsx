import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from './RadioGroup';

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

const OPTIONS = (
  <>
    <Radio value="standard">Standard, 3 to 5 days</Radio>
    <Radio value="express">Express, next day</Radio>
    <Radio value="pickup">Collect in store</Radio>
  </>
);

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  args: { label: 'Delivery method', children: OPTIONS }
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Every state.
 *
 * The two-level label structure is what this component adds: one label for the
 * group and one per option, with the description and error hanging off the
 * group rather than off any single radio. The base wires all of it — verified,
 * which is why nothing is supplied by hand here, unlike a lone checkbox.
 */
export const States: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 420, gap: 'var(--bb-field-gap)' }}
    >
      <RadioGroup label="Nothing selected">{OPTIONS}</RadioGroup>
      <RadioGroup label="With a selection" defaultValue="express">
        {OPTIONS}
      </RadioGroup>
      <RadioGroup
        label="With a description"
        defaultValue="standard"
        description="Express is charged at checkout."
      >
        {OPTIONS}
      </RadioGroup>
      <RadioGroup
        label="Invalid"
        isInvalid
        description="Express is charged at checkout."
        errorMessage="Choose how you want it delivered."
      >
        {OPTIONS}
      </RadioGroup>
      <RadioGroup label="Required" isRequired>
        {OPTIONS}
      </RadioGroup>
      <RadioGroup label="Disabled group" isDisabled defaultValue="standard">
        {OPTIONS}
      </RadioGroup>
      <RadioGroup label="One option disabled" defaultValue="standard">
        <Radio value="standard">Standard, 3 to 5 days</Radio>
        <Radio value="express" isDisabled>
          Express, unavailable to your area
        </Radio>
      </RadioGroup>
    </div>
  )
};

/**
 * Horizontal, for two or three short options.
 *
 * `orientation` also tells assistive technology which arrow keys apply, so it
 * is not only a layout switch. It wraps rather than overflowing, which is what
 * makes a narrow container survivable without a query (doc 04 §3) — drag the
 * container to see it.
 */
export const Horizontal: Story = {
  render: () => (
    <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
      <RadioGroup
        label="Billing period"
        orientation="horizontal"
        defaultValue="month"
      >
        <Radio value="month">Monthly</Radio>
        <Radio value="year">Yearly</Radio>
      </RadioGroup>
      <RadioGroup label="Wraps when it has to" orientation="horizontal">
        {OPTIONS}
      </RadioGroup>
    </div>
  )
};

/** Light and dark side by side, never by toggling (doc 03 §6). */
export const Modes: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['light', 'dark'] as const).map(mode => (
        <Scope
          key={mode}
          label={mode === 'light' ? 'Light' : 'Dark'}
          mode={mode}
        >
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <RadioGroup label="Delivery" defaultValue="express">
              {OPTIONS}
            </RadioGroup>
            <RadioGroup label="Invalid" isInvalid errorMessage="Choose one.">
              {OPTIONS}
            </RadioGroup>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/** Density moves spacing and no colour; the hit area survives compact. */
export const Densities: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['normal', 'compact'] as const).map(density => (
        <Scope
          key={density}
          label={density === 'normal' ? 'Normal' : 'Compact'}
          density={density}
        >
          <RadioGroup
            label="Delivery"
            defaultValue="standard"
            description="Help text."
          >
            {OPTIONS}
          </RadioGroup>
        </Scope>
      ))}
    </div>
  )
};

/** The dot moves to the other side on its own. */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['ltr', 'rtl'] as const).map(dir => (
        <Scope key={dir} label={dir.toUpperCase()} dir={dir}>
          <RadioGroup
            label="Método de envío"
            isRequired
            defaultValue="express"
            description="El envío urgente se cobra al confirmar."
          >
            <Radio value="standard">Estándar, de 3 a 5 días</Radio>
            <Radio value="express">Urgente, al día siguiente</Radio>
          </RadioGroup>
        </Scope>
      ))}
    </div>
  )
};

/** Long options wrap and stay aligned with their dot, in 320px. */
export const LongLabelsAndNarrow: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <RadioGroup
        label="Método de envío preferido para este pedido"
        isInvalid
        description="Las tarifas se calculan al confirmar la compra."
        errorMessage="Elige un método de envío para poder continuar."
      >
        <Radio value="standard">
          Envío estándar a domicilio, entre tres y cinco días laborables
        </Radio>
        <Radio value="pickup">
          Recogida en tienda, disponible desde el día siguiente
        </Radio>
      </RadioGroup>
    </div>
  )
};
