/*
 * The catalog for Checkbox.
 *
 * The interesting story is the last one. With three control types built, the
 * form story becomes possible — and it is where doc 09 §10's check starts to
 * pay off: "the page with every component together reads as one system".
 * Component by component everything looks right; together is where the three
 * greys you thought were one show up.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Checkbox } from './Checkbox';
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
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { children: 'I agree to the terms' }
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Every state at once.
 *
 * Hover, pressed and focus are forced by setting the same DOM attributes the
 * base sets, so they are visible without interaction and reachable by a
 * screenshot tool. That is not faking a state — those are the attributes the
 * CSS targets.
 */
type Forced = 'data-hovered' | 'data-pressed' | 'data-focus-visible';
const forced = (attribute: Forced) =>
  ({ [attribute]: true }) as unknown as Record<string, boolean>;

export const States: Story = {
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 420 }}>
      <Checkbox>Unchecked</Checkbox>
      <Checkbox defaultSelected>Checked</Checkbox>
      <Checkbox isIndeterminate>Indeterminate</Checkbox>
      <Checkbox isIndeterminate defaultSelected>
        Indeterminate and selected at once
      </Checkbox>
      <Checkbox {...forced('data-hovered')}>Hovered</Checkbox>
      <Checkbox {...forced('data-pressed')}>Pressed</Checkbox>
      <Checkbox {...forced('data-focus-visible')}>Focused</Checkbox>
      <Checkbox isDisabled>Disabled</Checkbox>
      <Checkbox isDisabled defaultSelected>
        Disabled and checked
      </Checkbox>
      <Checkbox description="You can withdraw consent at any time.">
        With a description
      </Checkbox>
      <Checkbox
        isInvalid
        description="You can withdraw consent at any time."
        errorMessage="You must accept to continue."
      >
        Invalid, with both messages
      </Checkbox>
    </div>
  )
};

/**
 * The four combinations of the two marks, which is where a real bug hid.
 *
 * A checkbox that is both indeterminate and selected drew the tick on top of
 * the dash, because two utilities of equal specificity were decided by the
 * order a generator happened to emit them in. **Exactly one mark is visible in
 * every row**, and a browser test asserts it — this is not something to check
 * by squinting.
 */
export const Marks: Story = {
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 420 }}>
      <div data-testid="mark-none">
        <Checkbox>Neither</Checkbox>
      </div>
      <div data-testid="mark-selected">
        <Checkbox defaultSelected>Selected</Checkbox>
      </div>
      <div data-testid="mark-indeterminate">
        <Checkbox isIndeterminate>Indeterminate</Checkbox>
      </div>
      <div data-testid="mark-both">
        <Checkbox isIndeterminate defaultSelected>
          Indeterminate and selected
        </Checkbox>
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
          <div className="catalog-stack">
            <Checkbox defaultSelected>Checked</Checkbox>
            <Checkbox isIndeterminate>Indeterminate</Checkbox>
            <Checkbox>Unchecked</Checkbox>
            <Checkbox isInvalid errorMessage="You must accept.">
              Invalid
            </Checkbox>
            <Checkbox isDisabled defaultSelected>
              Disabled
            </Checkbox>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * Density moves spacing, and no colour. Watch the hit area: it stays above the
 * minimum in compact too, which doc 06 §3 requires — compacting until that
 * breaks is not an option.
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
          <div className="catalog-stack">
            <Checkbox defaultSelected>Email</Checkbox>
            <Checkbox>SMS</Checkbox>
            <Checkbox description="Rarely, and never at night.">Push</Checkbox>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/** The box moves to the other side on its own; there is nothing physical to flip. */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['ltr', 'rtl'] as const).map(dir => (
        <Scope key={dir} label={dir.toUpperCase()} dir={dir}>
          <div className="catalog-stack">
            <Checkbox defaultSelected>Acepto los términos</Checkbox>
            <Checkbox description="Puedes retirar el consentimiento cuando quieras.">
              Recibir novedades
            </Checkbox>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * A long label wraps and stays aligned with the box, which sits on the first
 * line rather than centring itself against a paragraph. Nothing is sized to
 * fit one particular label.
 */
export const LongLabelAndNarrow: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack">
        <Checkbox
          description="Se aplican las condiciones del servicio y la política de privacidad vigentes en el momento de la contratación."
          defaultSelected
        >
          Acepto los términos y condiciones del servicio, incluida la política
          de tratamiento de datos personales
        </Checkbox>
      </div>
    </div>
  )
};

/**
 * **Three control types in one form**, which is the check doc 09 §10 calls the
 * one that finds the most: component by component everything looks correct;
 * together is where the mismatches appear.
 *
 * Two specific things to look at:
 *
 * - **The vertical rhythm.** Doc 03 §4.6c allows exactly two gaps: a small one
 *   inside a field, between label, control and message, and a larger one
 *   between fields. Two values, decided once. Six is how a form starts looking
 *   untidy without anyone being able to say why.
 * - **Whether it reads as one system.** Same border colour, same focus ring,
 *   same type scale, controls that line up.
 */
export const InAForm: Story = {
  render: () => (
    <form
      data-testid="form"
      className="catalog-panel"
      style={{
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--bb-field-gap)'
      }}
      onSubmit={event => event.preventDefault()}
    >
      <TextField
        label="Full name"
        description="As it appears on your identity document."
        defaultValue="Ada Lovelace"
        data-testid="field-name"
      />
      <TextField
        label="Email"
        isRequired
        isInvalid
        defaultValue="ada@"
        errorMessage="Add the part after the @ so we can reach you."
      />
      <Checkbox description="You can withdraw consent at any time.">
        Send me occasional product news
      </Checkbox>
      <Checkbox isRequired>I agree to the terms and conditions</Checkbox>
      <div style={{ display: 'flex', gap: 'var(--bb-space-3)' }}>
        <Button variant="primary" type="submit">
          Save changes
        </Button>
        <Button>Cancel</Button>
      </div>
    </form>
  )
};

/** The same form in dark and compact, which is where mismatches hide. */
export const InAFormDarkCompact: Story = {
  render: () => (
    <div data-bb-mode="dark" data-bb-density="compact">
      <form
        className="catalog-panel"
        style={{
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--bb-field-gap)'
        }}
        onSubmit={event => event.preventDefault()}
      >
        <TextField label="Full name" defaultValue="Ada Lovelace" />
        <TextField
          label="Email"
          isInvalid
          defaultValue="ada@"
          errorMessage="Add the part after the @."
        />
        <Checkbox defaultSelected description="Rarely, and never at night.">
          Send me product news
        </Checkbox>
        <div style={{ display: 'flex', gap: 'var(--bb-space-3)' }}>
          <Button variant="primary">Save</Button>
          <Button>Cancel</Button>
        </div>
      </form>
    </div>
  )
};
