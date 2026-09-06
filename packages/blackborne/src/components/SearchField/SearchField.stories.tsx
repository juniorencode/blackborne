/*
 * The catalog for SearchField.
 *
 * Doc 07 §6 lists eight states and requires all of them to be here. This
 * component adds a ninth thing to photograph that is not a state at all: who
 * owns the trailing edge. Doc 07 §2.2 decides that once — busy wins outright —
 * and the only way to check it is to see the two side by side.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfigProvider } from '../../config';
import { SearchField, type SearchFieldSize } from './SearchField';

const SIZES: SearchFieldSize[] = ['sm', 'md', 'lg'];

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
  title: 'Components/SearchField',
  component: SearchField,
  args: { label: 'Filter customers', placeholder: 'Name or reference' },
  argTypes: { size: { control: 'select', options: SIZES } }
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: { defaultValue: 'Lovelace' } };

/**
 * All eight states from doc 07 §6, on one page.
 *
 * Read this one for the trailing edge as much as for the states. The clear
 * button appears with the value and goes again when the field empties;
 * **disabled** and **read-only** keep the value and lose the button, because
 * the value is not the person's to change; **loading** and **saving** replace
 * it with the busy indicator, which is doc 07 §2.2 rule 1 — the trailing edge
 * belongs to one thing at a time and busy wins outright.
 */
export const States: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 360, gap: 'var(--bb-field-gap)' }}
    >
      <SearchField label="Empty" placeholder="Nothing typed yet" />
      <SearchField label="With value" defaultValue="Lovelace" />
      <SearchField
        label="With description"
        defaultValue="Lovelace"
        description="Matches name and reference."
      />
      <SearchField
        label="Invalid"
        defaultValue="a"
        description="Matches name and reference."
        isInvalid
        errorMessage="Use three characters or more."
      />
      <SearchField label="Required" isRequired placeholder="Cannot be empty" />
      <SearchField label="Disabled" defaultValue="Lovelace" isDisabled />
      <SearchField label="Read only" defaultValue="Lovelace" isReadOnly />
      <SearchField label="Loading" defaultValue="Lovelace" isLoading />
      <SearchField label="Saving" defaultValue="Lovelace" isSaving />
    </div>
  )
};

/**
 * **The contested edge, which is the whole reason this component was not
 * trivial** (doc 07 §2.2).
 *
 * Six things want the trailing edge of a field and they cannot all have it.
 * The precedence is decided in the document, not per component, and these four
 * fields are it: a value shows the button, an empty field has nothing to
 * clear, and a busy field does not render the button at all — offering to
 * clear a value that is mid-flight offers an action the field cannot honour
 * (doc 06 §4, point 7).
 *
 * Compare the last two by eye: the busy field shows an indicator where the
 * button was, in the same place, at the same size. Nothing moves between them.
 */
export const TheTrailingEdge: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 360, gap: 'var(--bb-field-gap)' }}
    >
      <SearchField
        label="With a value — the button is there"
        defaultValue="Lovelace"
      />
      <SearchField
        label="Empty — nothing to clear"
        placeholder="Type to search"
      />
      <SearchField
        label="Loading — the button is gone"
        defaultValue="Lovelace"
        isLoading
      />
      <SearchField
        label="Saving — the button is gone"
        defaultValue="Lovelace"
        isSaving
      />
    </div>
  )
};

/**
 * **The hit area, at both densities.** This is the check to actually make.
 *
 * The cross is drawn at 14px and 11px, and if the button were the size of the
 * cross it would fail doc 06 §3 in both columns. It is not: both axes take
 * `--bb-control-hit-area`, so the target measures 28px normal and 24px
 * compact — the WCAG minimum, which holds at every density. Compact trims the
 * mark and never the target.
 *
 * Point at the far corner of the cross in the compact column: it still hits.
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
            {SIZES.map(size => (
              <SearchField
                key={size}
                label={`Size ${size}`}
                size={size}
                defaultValue="Lovelace"
              />
            ))}
            <SearchField label="Busy" defaultValue="Lovelace" isLoading />
          </div>
        </Scope>
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
            <SearchField label="With value" defaultValue="Lovelace" />
            <SearchField label="Empty" placeholder="Name or reference" />
            <SearchField
              label="Invalid"
              defaultValue="a"
              isInvalid
              errorMessage="Use three characters or more."
            />
            <SearchField label="Read only" defaultValue="Lovelace" isReadOnly />
            <SearchField label="Loading" defaultValue="Lovelace" isLoading />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * RTL. The clear button, the busy indicator, the label and the asterisk all
 * move to the other side on their own — there is no physical measurement
 * anywhere in the component to flip, and the button's inset is written against
 * `inset-inline-end` like everything else (doc 03 §5, rule 4).
 *
 * The cross itself is not directional and is not mirrored. Doc 05 §4: only
 * meaning decides, and a cross means the same thing in both directions.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['ltr', 'rtl'] as const).map(dir => (
        <Scope key={dir} label={dir.toUpperCase()} dir={dir}>
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <SearchField label="With value" defaultValue="Lovelace" />
            <SearchField label="Required" isRequired defaultValue="Lovelace" />
            <SearchField label="Loading" defaultValue="Lovelace" isLoading />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * The library ships English only; a project injects the rest. Nothing here is
 * detected — the language is passed in.
 *
 * The clear button is the thing to check. React Aria supplies its own
 * localised name for it, and this component replaces that with the dictionary
 * key `clear`, so one translated key covers every cross in the library rather
 * than half of them.
 */
export const Translated: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default (English)">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <SearchField label="Filter customers" defaultValue="Lovelace" />
          <SearchField
            label="Filter customers"
            isLoading
            defaultValue="Lovelace"
          />
        </div>
      </Scope>
      <ConfigProvider
        locale="es-PE"
        dictionary={{
          clear: 'Limpiar',
          loading: 'Cargando',
          fieldLoading: 'Cargando'
        }}
      >
        <Scope label="Spanish, injected by the project">
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <SearchField label="Filtrar clientes" defaultValue="Lovelace" />
            <SearchField
              label="Filtrar clientes"
              isLoading
              defaultValue="Lovelace"
            />
          </div>
        </Scope>
      </ConfigProvider>
    </div>
  )
};

/**
 * A brand override. Level 1 of the customisation contract (doc 03 §7): the
 * brand scale is redefined and the semantic tokens recompute on their own, so
 * the focus ring and the required marker follow without the component knowing
 * a theme changed.
 */
export const BrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <SearchField label="Filter customers" defaultValue="Lovelace" />
          <SearchField label="Required" isRequired defaultValue="Lovelace" />
        </div>
      </Scope>
      <div className="catalog-panel" data-bb-theme="catalog-alt">
        <p className="catalog-label">Overridden brand</p>
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <SearchField label="Filter customers" defaultValue="Lovelace" />
          <SearchField label="Required" isRequired defaultValue="Lovelace" />
        </div>
      </div>
    </div>
  )
};

/**
 * Pseudo-localisation and a 320px container together — the two cheapest ways
 * to break a form, and the container that matters, since a filter field very
 * often lives in a narrow side panel inside a wide screen (P4).
 *
 * The value must never run under the clear button, at any width. The trailing
 * padding is reserved in every state rather than following the state, so the
 * text box does not resize on the first keystroke.
 */
export const LongLabelsAndNarrow: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
        <SearchField
          label="Buscar clientes por nombre o número de documento"
          description="Se buscan también las cuentas archivadas."
          defaultValue="Augusta Ada Byron King, Condesa de Lovelace"
        />
        <SearchField
          label="Buscar comprobantes"
          defaultValue="F001-00000042 · Servicios profesionales"
          isLoading
        />
        <SearchField
          label="Buscar comprobantes"
          defaultValue="a"
          isInvalid
          errorMessage="Escribe al menos tres caracteres para poder buscar."
        />
      </div>
    </div>
  )
};

/*
 * A real listing, because the whole component only makes sense against one.
 * Declared as a component rather than inline so the hook rules apply to it the
 * way they apply to shipped code.
 */
const ROWS = [
  'Ada Lovelace',
  'Grace Hopper',
  'Katherine Johnson',
  'Radia Perlman',
  'Barbara Liskov',
  'Margaret Hamilton'
];

function Listing() {
  const [query, setQuery] = useState('Ha');
  const matches = ROWS.filter(row =>
    row.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="catalog-stack" style={{ maxWidth: 360, gap: 12 }}>
      <SearchField
        label="Filter people"
        placeholder="Name"
        value={query}
        onChange={setQuery}
      />
      <div
        style={{ fontSize: 'var(--bb-text-sm)', color: 'var(--bb-text-muted)' }}
      >
        {matches.length} of {ROWS.length}
      </div>
      <ul style={{ margin: 0, paddingInlineStart: 20 }}>
        {matches.map(row => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * **What the component is for, and the thing that makes it a component.**
 *
 * Put the cursor in the field and press `Escape`: the query is cancelled and
 * the listing comes back, with no reach for the mouse. That is doc 09 §8 — a
 * key means the same thing everywhere, and here the "current level" being
 * cancelled is the filter.
 *
 * A TextField cannot take Escape, because inside a dialog that key belongs to
 * the dialog. This one does the right thing in both places: it clears when
 * there is something to clear, and lets the key through to whatever is around
 * it when there is not. That difference, and the `searchbox` role, are why
 * this is not a TextField with a cross on the end.
 */
export const InAListing: Story = { render: () => <Listing /> };
