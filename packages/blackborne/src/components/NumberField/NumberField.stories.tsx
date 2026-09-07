import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { ConfigProvider } from '../../config';
import { NumberField, type NumberFieldSize } from './NumberField';
import { TextField } from '../TextField';

const SIZES: NumberFieldSize[] = ['sm', 'md', 'lg'];

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
  title: 'Components/NumberField',
  component: NumberField,
  args: { label: 'Quantity', defaultValue: 12 },
  argTypes: { size: { control: 'select', options: SIZES } }
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 360, gap: 'var(--bb-field-gap)' }}
    >
      <NumberField label="Empty" placeholder="0" />
      <NumberField label="With value" defaultValue={1234.5} />
      <NumberField
        label="With description"
        defaultValue={12}
        description="Stock is checked when the order is placed."
      />
      <NumberField
        label="Invalid"
        defaultValue={0}
        description="Stock is checked when the order is placed."
        isInvalid
        errorMessage="Order at least one unit."
      />
      <NumberField label="Required" isRequired placeholder="0" />
      <NumberField label="Disabled" defaultValue={12} isDisabled />
      <NumberField label="Read only" defaultValue={12} isReadOnly />
      <NumberField
        label="Clamped, 1 to 10"
        defaultValue={5}
        minValue={1}
        maxValue={10}
      />
      <NumberField label="With the stepper" defaultValue={3} isStepperVisible />
      <NumberField label="Saving" defaultValue={12} isSaving />
    </div>
  )
};

/**
 * **The story this component exists for.**
 *
 * Everything about how a number reads is locale-dependent, and typing is
 * parsed the same way — so a person can enter a number the way they write it.
 * Nothing here is detected: the locale comes from the config provider, and the
 * library formats nothing itself (doc 05 §3).
 *
 * The trap worth noticing: **es-PE and es-ES disagree.** Peru uses a comma for
 * thousands and a point for decimals, exactly like the United States, while
 * Spain inverts both. There is no such thing as a Spanish number format, which
 * is why a library that guessed from a language would be wrong half the time.
 */
const LOCALES = [
  { locale: 'en-US', label: 'en-US · United States' },
  { locale: 'es-PE', label: 'es-PE · Peru' },
  { locale: 'es-ES', label: 'es-ES · Spain' },
  { locale: 'de-DE', label: 'de-DE · Germany' },
  { locale: 'fr-FR', label: 'fr-FR · France' },
  { locale: 'ar-EG', label: 'ar-EG · Egypt, different digits entirely' }
];

export const Locales: Story = {
  render: () => (
    <div className="catalog-pair">
      {LOCALES.map(({ locale, label }) => (
        <ConfigProvider key={locale} locale={locale}>
          <Scope label={label} dir={locale === 'ar-EG' ? 'rtl' : 'ltr'}>
            <NumberField label="Amount" defaultValue={1234.5} />
          </Scope>
        </ConfigProvider>
      ))}
    </div>
  )
};

/**
 * Currency, which the library never invents: it comes from the provider or a
 * prop. A component cannot know what a business trades in (doc 05 §3.1).
 *
 * Note that USD in Peru prints as the code rather than a dollar sign, because
 * the symbol is ambiguous there. That is the platform's judgement, not ours.
 */
export const Currency: Story = {
  render: () => (
    <div className="catalog-pair">
      <ConfigProvider locale="es-PE" currency="PEN">
        <Scope label="es-PE with PEN, from the provider">
          <NumberField label="Monto" defaultValue={1234.5} />
        </Scope>
      </ConfigProvider>
      <ConfigProvider locale="es-PE" currency="PEN">
        <Scope label="The same provider, USD on the field">
          <NumberField label="Monto" defaultValue={1234.5} currency="USD" />
        </Scope>
      </ConfigProvider>
      <ConfigProvider locale="de-DE" currency="EUR">
        <Scope label="de-DE with EUR: the symbol goes after">
          <NumberField label="Betrag" defaultValue={1234.5} />
        </Scope>
      </ConfigProvider>
    </div>
  )
};

/**
 * The stepper labels come from the dictionary, and the base composes them with
 * the field label — so it announces "Increase Quantity" rather than a bare
 * "Increase". Better than anything this component could say alone: only the
 * consumer knows what is being increased.
 */
export const Translated: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default (English)">
        <NumberField label="Quantity" defaultValue={12} />
      </Scope>
      <ConfigProvider
        locale="es-PE"
        dictionary={{ increment: 'Aumentar', decrement: 'Disminuir' }}
      >
        <Scope label="Spanish, injected by the project">
          <NumberField label="Cantidad" defaultValue={12} />
        </Scope>
      </ConfigProvider>
    </div>
  )
};

/**
 * The alignment check, extended. A number field, a text field and a button of
 * the same size must line up exactly (doc 03 §9) — and the numbers use tabular
 * figures, so a column of them lines up too (doc 03 §4.2).
 */
export const AlignsWithOthers: Story = {
  render: () => (
    <div className="catalog-stack">
      {SIZES.map(size => (
        <div
          key={size}
          className="catalog-row"
          data-testid={`nf-align-${size}`}
          style={{ alignItems: 'flex-end' }}
        >
          <NumberField
            label={`Size ${size}`}
            size={size}
            defaultValue={1234.5}
          />
          <TextField label="Text" size={size} defaultValue="Value" />
          <Button size={size} variant="primary">
            Save
          </Button>
        </div>
      ))}
      <div className="catalog-panel" style={{ maxWidth: 240 }}>
        <p className="catalog-label">Tabular figures line up in a column</p>
        <div className="catalog-stack" data-testid="nf-column">
          <NumberField label="One" isLabelHidden defaultValue={1111.11} />
          <NumberField label="Two" isLabelHidden defaultValue={22.2} />
          <NumberField label="Three" isLabelHidden defaultValue={333333.3} />
        </div>
      </div>
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
            <NumberField label="Quantity" defaultValue={12} />
            <NumberField
              label="Invalid"
              defaultValue={0}
              isInvalid
              errorMessage="At least one."
            />
            <NumberField label="Disabled" defaultValue={12} isDisabled />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/** Density moves the height and the padding; the steppers follow. */
export const Densities: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['normal', 'compact'] as const).map(density => (
        <Scope
          key={density}
          label={density === 'normal' ? 'Normal' : 'Compact'}
          density={density}
        >
          <NumberField
            label="Quantity"
            defaultValue={12}
            description="Help text."
          />
        </Scope>
      ))}
    </div>
  )
};

/**
 * **RTL, which is where a stepper is most likely to be wrong.**
 *
 * Decrement has to sit at the START of the line and increment at the END — and
 * in Arabic that is the mirror image. There is no physical measurement in the
 * component, so the group flips with the writing direction on its own.
 *
 * The Arabic panel also shows something a Latin locale hides entirely: the
 * digits themselves change.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <NumberField label="Quantity" defaultValue={12} />
      </Scope>
      <ConfigProvider locale="ar-EG">
        <Scope label="RTL · ar-EG" dir="rtl">
          <NumberField label="Quantity, in Arabic digits" defaultValue={12} />
        </Scope>
      </ConfigProvider>
    </div>
  )
};

/** In 320px, with a long label and a currency. */
export const Narrow: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <ConfigProvider locale="es-PE" currency="PEN">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <NumberField
            label="Importe total del pedido, impuestos incluidos"
            defaultValue={12345.6}
            description="Se recalcula al confirmar la compra."
          />
          <NumberField
            label="Cantidad de unidades"
            defaultValue={3}
            minValue={1}
          />
        </div>
      </ConfigProvider>
    </div>
  )
};

/**
 * The stepper, on and off — and off is the default
 * ([decision 0011](../../../../docs/decisions/0011-the-stepper-is-opt-in.md)).
 *
 * This story exists because "the buttons are gone" reads as a regression until
 * you see it was chosen. Nothing is lost with them hidden: the arrow keys still
 * step, Page Up and Page Down still jump, and the control is still a
 * `spinbutton`. All of that is the base's, not the buttons'.
 *
 * What the buttons cost is the third panel: about 40px off the trailing edge of
 * every numeric field on a form trying to be dense. Compare the two widths of
 * usable box, not the two heights.
 *
 * The last pair is the rule from doc 07 §2.2 in the one place it is visible:
 * **busy takes the trailing edge outright**, so a stepper is not drawn while
 * the field is loading or saving whatever this prop says. Before that rule the
 * spinner was painted on top of the `+` button.
 */
export const TheStepper: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">Default — no stepper</p>
        <div className="catalog-stack">
          <NumberField label="Quantity" defaultValue={3} />
          <NumberField label="Amount" defaultValue={2400} />
        </div>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">isStepperVisible</p>
        <div className="catalog-stack">
          <NumberField label="Quantity" defaultValue={3} isStepperVisible />
          <NumberField label="Amount" defaultValue={2400} isStepperVisible />
        </div>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">Busy wins the edge</p>
        <div className="catalog-stack">
          <NumberField
            label="Loading"
            defaultValue={3}
            isStepperVisible
            isLoading
          />
          <NumberField
            label="Saving"
            defaultValue={3}
            isStepperVisible
            isSaving
          />
        </div>
      </div>
    </div>
  )
};

/**
 * Affixes and alignment on a numeric field.
 *
 * `align="end"` is the one worth knowing about: numbers in a column compare by
 * magnitude at a glance only when their last digits line up, which is the same
 * reason the value is set in tabular figures (doc 03 §4.2). Compare the two
 * columns below — the left one is the default.
 *
 * With the stepper on, the affix lands BETWEEN the value and the button, which
 * is doc 07 §2.2 rule 3: the affix moves ahead of the control, so the button
 * keeps a full target at the edge and the unit stays next to its number.
 */
export const AffixesAndAlignment: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">start — the default</p>
        <div className="catalog-stack">
          <NumberField label="Small" defaultValue={7} />
          <NumberField label="Medium" defaultValue={1240} />
          <NumberField label="Large" defaultValue={982400} />
        </div>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">align=&quot;end&quot;</p>
        <div className="catalog-stack">
          <NumberField label="Small" align="end" defaultValue={7} />
          <NumberField label="Medium" align="end" defaultValue={1240} />
          <NumberField label="Large" align="end" defaultValue={982400} />
        </div>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">Units, and one with a stepper</p>
        <div className="catalog-stack">
          <NumberField label="Weight" suffix="kg" defaultValue={72} />
          <NumberField
            label="Rate"
            suffix="%"
            align="end"
            defaultValue={12.5}
          />
          <NumberField
            label="Hours"
            suffix="h"
            defaultValue={8}
            isStepperVisible
          />
        </div>
      </div>
    </div>
  )
};

/**
 * Clearing a number, and why the edge only holds one thing.
 *
 * Emptying a numeric field means **`NaN`**, not zero: zero is a number somebody
 * chose, and the base reports `NaN` for the absence of one — the same thing
 * deleting the last digit reports.
 *
 * The third panel is doc 07 §2.2 rule 4. Ask for the cross and the stepper
 * together and the stepper wins, because two library-owned controls at one edge
 * means a hit area that depends on how the field was configured. Development
 * warns rather than guessing quietly.
 */
export const Clearing: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">With something to clear</p>
        <div className="catalog-stack">
          <NumberField label="Quantity" isClearable defaultValue={12} />
          <NumberField
            label="Amount"
            isClearable
            align="end"
            defaultValue={2400}
            description="Press the cross, and the cursor comes back here."
          />
        </div>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">Nothing to offer — the room stays</p>
        <div className="catalog-stack">
          <NumberField label="Empty" isClearable placeholder="0" />
          <NumberField
            label="Read only"
            isClearable
            defaultValue={12}
            isReadOnly
          />
          <NumberField label="Saving" isClearable defaultValue={12} isSaving />
        </div>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">Both asked for — the stepper wins</p>
        <div className="catalog-stack">
          <NumberField
            label="Quantity"
            isClearable
            isStepperVisible
            defaultValue={3}
          />
        </div>
      </div>
    </div>
  )
};
