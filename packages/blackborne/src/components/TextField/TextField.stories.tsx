/*
 * The catalog for TextField.
 *
 * Doc 07 §6 lists eight states and requires all of them to be here. Two of
 * them — loading and saving — only became possible once Spinner and the
 * dictionary existed, which is why those level-0 pieces came first.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { ConfigProvider } from '../../config';
import { TextField, type TextFieldSize } from './TextField';

const SIZES: TextFieldSize[] = ['sm', 'md', 'lg'];

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
  title: 'Components/TextField',
  component: TextField,
  args: { label: 'Full name', placeholder: 'Ada Lovelace' },
  argTypes: { size: { control: 'select', options: SIZES } }
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * All eight states from doc 07 §6, on one page.
 *
 * Two that are almost always forgotten sit next to each other on purpose:
 * **disabled** and **read-only** are not the same thing. Read-only shows a
 * value you can read, select and copy; disabled says this does not apply right
 * now. They look different because they behave differently.
 */
export const States: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 360, gap: 'var(--bb-field-gap)' }}
    >
      <TextField label="Empty" placeholder="Nothing typed yet" />
      <TextField label="With value" defaultValue="Ada Lovelace" />
      <TextField
        label="With description"
        defaultValue="ada@example.com"
        description="We only use it to send receipts."
      />
      <TextField
        label="Invalid"
        defaultValue="ada@"
        description="We only use it to send receipts."
        isInvalid
        errorMessage="Add the part after the @ so we can reach you."
      />
      <TextField
        label="Required"
        isRequired
        placeholder="Cannot be left empty"
      />
      <TextField
        label="Disabled"
        defaultValue="Does not apply here"
        isDisabled
      />
      <TextField
        label="Read only"
        defaultValue="Read it, select it, copy it"
        isReadOnly
      />
      <TextField label="Loading" placeholder="Waiting for data" isLoading />
      <TextField label="Saving" defaultValue="Ada Lovelace" isSaving />
    </div>
  )
};

/**
 * **The alignment check from doc 03 §9**, which was impossible to make until
 * there were two controls to compare.
 *
 * A field and a button of the same size must line up exactly in a row. When
 * they do not, nothing on a form quite lines up and nobody can say why. This
 * story is asserted in the browser as well, because eyeballing a two-pixel
 * difference is not a check.
 */
export const AlignsWithButton: Story = {
  render: () => (
    <div className="catalog-stack">
      {SIZES.map(size => (
        <div
          key={size}
          className="catalog-row"
          data-testid={`align-${size}`}
          style={{ alignItems: 'flex-end' }}
        >
          <TextField label={`Size ${size}`} size={size} defaultValue="Value" />
          <Button size={size} variant="primary">
            Save
          </Button>
          <Button size={size}>Cancel</Button>
        </div>
      ))}
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
            <TextField label="With value" defaultValue="Ada Lovelace" />
            <TextField
              label="Invalid"
              defaultValue="ada@"
              isInvalid
              errorMessage="Add the part after the @."
            />
            <TextField label="Read only" defaultValue="Copyable" isReadOnly />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * Density moves heights and spacing, and no colour.
 *
 * Look at the vertical rhythm: doc 03 §4.6c allows exactly two gaps in a form
 * — a small one inside the field, between label, control and message, and a
 * larger one between fields. Both shrink together in compact.
 */
export const Densities: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['normal', 'compact'] as const).map(density => (
        <Scope
          key={density}
          label={density === 'normal' ? 'Normal' : 'Compact'}
          density={density}
        >
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <TextField
              label="First"
              defaultValue="Ada"
              description="Help text."
            />
            <TextField label="Second" defaultValue="Lovelace" />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * RTL. The label, the asterisk and the busy indicator all move to the other
 * side on their own — there is no physical measurement anywhere in the
 * component to flip.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['ltr', 'rtl'] as const).map(dir => (
        <Scope key={dir} label={dir.toUpperCase()} dir={dir}>
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <TextField label="Required" isRequired defaultValue="Value" />
            <TextField label="Loading" isLoading placeholder="Waiting" />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * The library ships English only; a project injects the rest. Nothing here is
 * detected — the language is passed in, and direction follows from it.
 */
export const Translated: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default (English)">
        <TextField label="City" isLoading placeholder="Waiting for data" />
      </Scope>
      <ConfigProvider
        locale="es-PE"
        dictionary={{ loading: 'Cargando', fieldLoading: 'Cargando' }}
      >
        <Scope label="Spanish, injected by the project">
          <TextField label="Ciudad" isLoading placeholder="Esperando datos" />
        </Scope>
      </ConfigProvider>
    </div>
  )
};

/**
 * A brand override, which closes the one entry-gate box this component was
 * missing.
 *
 * Level 1 of the customisation contract (doc 03 §7): redefine the brand scale
 * and the semantic tokens recompute on their own. The field's focus ring and
 * its required marker follow, without the component knowing a theme changed.
 *
 * `data-bb-theme` on the same element is what makes it work — a CSS var()
 * resolves where it is declared, so without the attribute the override
 * silently does nothing (doc 03 §3.1).
 */
export const BrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <TextField label="Required" isRequired defaultValue="Ada Lovelace" />
          <TextField label="With value" defaultValue="ada@example.com" />
        </div>
      </Scope>
      <div
        className="catalog-panel"
        data-bb-theme="catalog-alt"
        style={
          {
            '--bb-x-brand-3': '#f3e8ff',
            '--bb-x-brand-8': '#a78bfa',
            '--bb-x-brand-9': '#7c3aed',
            '--bb-x-brand-10': '#6d28d9',
            '--bb-x-brand-11': '#5b21b6'
          } as React.CSSProperties
        }
      >
        <p className="catalog-label">Overridden brand</p>
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <TextField label="Required" isRequired defaultValue="Ada Lovelace" />
          <TextField label="With value" defaultValue="ada@example.com" />
        </div>
      </div>
    </div>
  )
};

/**
 * Pseudo-localisation and a narrow container together — the two cheapest ways
 * to break a form. Nothing may be sized to fit one particular label.
 */
export const LongLabelsAndNarrow: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
        <TextField
          label="Nombre completo del titular de la cuenta"
          description="Tal y como aparece en el documento de identidad oficial."
          defaultValue="Augusta Ada Byron King, Condesa de Lovelace"
        />
        <TextField
          label="Correo electrónico de contacto"
          isInvalid
          defaultValue="ada@"
          errorMessage="Añade la parte posterior a la arroba para que podamos escribirte."
        />
      </div>
    </div>
  )
};
