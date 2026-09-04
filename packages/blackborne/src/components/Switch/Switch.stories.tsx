import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../Checkbox';
import { Switch } from './Switch';

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
  title: 'Components/Switch',
  component: Switch,
  args: { children: 'Email notifications' }
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Every state.
 *
 * Note what is missing: there is no invalid row. A switch takes effect the
 * moment it is flipped, so there is no later point at which it can be found
 * invalid — see the next story.
 */
type Forced = 'data-hovered' | 'data-pressed' | 'data-focus-visible';
const forced = (attribute: Forced) =>
  ({ [attribute]: true }) as unknown as Record<string, boolean>;

export const States: Story = {
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 420 }}>
      <Switch>Off</Switch>
      <Switch defaultSelected>On</Switch>
      <Switch {...forced('data-hovered')}>Hovered</Switch>
      <Switch {...forced('data-focus-visible')}>Focused</Switch>
      <Switch defaultSelected {...forced('data-focus-visible')}>
        Focused and on
      </Switch>
      <Switch isDisabled>Disabled</Switch>
      <Switch isDisabled defaultSelected>
        Disabled and on
      </Switch>
      <Switch description="Takes effect immediately. You will stop receiving daily summaries.">
        With a description
      </Switch>
    </div>
  )
};

/**
 * **Switch or Checkbox?** They look interchangeable and are not, and picking
 * the wrong one is the most common mistake with this pair.
 *
 * | | Switch | Checkbox |
 * | --- | --- | --- |
 * | When it applies | The moment you flip it | When the form is submitted |
 * | Announced as | "on" / "off" | "checked" / "unchecked" |
 * | Can be invalid | No | Yes |
 * | Can be required | No | Yes |
 *
 * The test: if there is a Save button, it is a checkbox. A switch has already
 * saved by the time you look away — which is also why a switch carries no
 * error state. If flipping it can fail, the failure belongs where it happened
 * (doc 09 §4) and the switch returns to its previous position.
 */
export const AgainstCheckbox: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">Switch — applies immediately</p>
        <div className="catalog-stack">
          <Switch defaultSelected description="Saved as soon as you flip it.">
            Show archived records
          </Switch>
          <Switch>Compact row height</Switch>
        </div>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">Checkbox — submitted with the form</p>
        <div className="catalog-stack">
          <Checkbox isRequired>I agree to the terms</Checkbox>
          <Checkbox
            isInvalid
            errorMessage="You must accept to continue."
            description="Required before the order can be placed."
          >
            Accept the delivery conditions
          </Checkbox>
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
          <div className="catalog-stack">
            <Switch defaultSelected>On</Switch>
            <Switch>Off</Switch>
            <Switch isDisabled defaultSelected>
              Disabled and on
            </Switch>
            <Switch description="Takes effect immediately.">
              With a description
            </Switch>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/** Density moves spacing, not the control itself: one switch size, like one icon size. */
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
            <Switch defaultSelected>Email</Switch>
            <Switch>SMS</Switch>
            <Switch description="Rarely, and never at night.">Push</Switch>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * RTL, which is where a switch is most likely to be wrong.
 *
 * The thumb has to travel toward the END of the line, and "end" is the other
 * side in Arabic or Hebrew. It is positioned with logical properties, so it
 * follows the writing mode rather than the screen — turn one on in each panel
 * and watch which way it goes.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['ltr', 'rtl'] as const).map(dir => (
        <Scope key={dir} label={dir.toUpperCase()} dir={dir}>
          <div className="catalog-stack">
            <Switch defaultSelected>Notificaciones por correo</Switch>
            <Switch description="Se aplica de inmediato.">
              Mostrar registros archivados
            </Switch>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/** A settings panel, which is where switches actually live. In 320px. */
export const InSettingsNarrow: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
        <Switch
          defaultSelected
          description="Recibirás un resumen diario de la actividad de tu equipo."
        >
          Resumen diario por correo electrónico
        </Switch>
        <Switch description="Se aplica de inmediato a todas las tablas.">
          Mostrar registros archivados en los listados
        </Switch>
      </div>
    </div>
  )
};
