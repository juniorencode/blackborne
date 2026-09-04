import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';
import { TextField } from '../TextField';

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
  title: 'Components/TextArea',
  component: TextArea,
  args: { label: 'Notes', placeholder: 'Anything the team should know' }
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The same eight states the single-line field has. */
export const States: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 420, gap: 'var(--bb-field-gap)' }}
    >
      <TextArea label="Empty" placeholder="Nothing typed yet" />
      <TextArea
        label="With value"
        defaultValue="Delivered on Tuesday, signed for by reception."
      />
      <TextArea
        label="With description"
        defaultValue="Delivered on Tuesday."
        description="Visible to everyone on the account."
      />
      <TextArea
        label="Invalid"
        defaultValue="."
        description="Visible to everyone on the account."
        isInvalid
        errorMessage="Say what changed, so the next person understands."
      />
      <TextArea
        label="Required"
        isRequired
        placeholder="Cannot be left empty"
      />
      <TextArea
        label="Disabled"
        defaultValue="Does not apply here"
        isDisabled
      />
      <TextArea
        label="Read only"
        defaultValue="Read it, select it, copy it"
        isReadOnly
      />
      <TextArea label="Saving" defaultValue="Delivered on Tuesday." isSaving />
    </div>
  )
};

/**
 * **Why the height does not come from the control-height tokens.**
 *
 * Those exist so a field, a select and a button of the same size line up in a
 * row (doc 03 §9). A text area is not in that row — it is a block, and forcing
 * it to a control height would produce a one-line input built from the wrong
 * element. Its height comes from a row count instead.
 *
 * Note the two are still aligned on the axis that matters: the same border,
 * the same padding, the same type. They differ in height because they differ
 * in kind.
 */
export const AgainstTextField: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 420, gap: 'var(--bb-field-gap)' }}
    >
      <TextField label="Subject" defaultValue="Delivery delayed" />
      <TextArea
        label="Body"
        rows={3}
        defaultValue="Delivered on Tuesday, signed for by reception."
      />
      <TextArea label="Taller, by rows" rows={6} />
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
            <TextArea label="With value" defaultValue="Delivered on Tuesday." />
            <TextArea
              label="Invalid"
              isInvalid
              defaultValue="."
              errorMessage="Say what changed."
            />
            <TextArea label="Read only" defaultValue="Copyable" isReadOnly />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/** Density moves the padding and the gaps; the row count is not a density. */
export const Densities: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['normal', 'compact'] as const).map(density => (
        <Scope
          key={density}
          label={density === 'normal' ? 'Normal' : 'Compact'}
          density={density}
        >
          <TextArea
            label="Notes"
            description="Help text."
            defaultValue="Two lines\nof content."
          />
        </Scope>
      ))}
    </div>
  )
};

/** RTL. The text starts on the other side, and the resize handle follows. */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['ltr', 'rtl'] as const).map(dir => (
        <Scope key={dir} label={dir.toUpperCase()} dir={dir}>
          <TextArea
            label="Observaciones"
            isRequired
            description="Visible para todo el equipo."
            defaultValue="Entregado el martes, recibido en recepción."
          />
        </Scope>
      ))}
    </div>
  )
};

/** Long content in 320px: it wraps, and scrolls past its rows. */
export const LongContentNarrow: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <TextArea
        label="Observaciones sobre la entrega"
        rows={3}
        description="Se guardará junto al registro del pedido."
        defaultValue="El paquete llegó el martes por la mañana y fue recibido en recepción por la persona de turno, que firmó el albarán sin incidencias. El cliente pidió que las próximas entregas se hagan por la tarde."
      />
    </div>
  )
};
