/*
 * The catalog for CheckboxGroup.
 *
 * The story that matters most is AgainstRadioGroup. Doc 09 §10 says the page
 * with everything together is the check that finds the most, and this pair is
 * where a reader has to choose — the same reason the catalog already puts
 * Switch beside Checkbox.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../Checkbox';
import { CheckboxGroup } from './CheckboxGroup';
import { Radio, RadioGroup } from '../RadioGroup';
import { Force } from '../../catalog/forceState';

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
    <Checkbox value="email">Email</Checkbox>
    <Checkbox value="sms">Text message</Checkbox>
    <Checkbox value="push">Push notification</Checkbox>
  </>
);

const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  args: { label: 'Notify me by', children: OPTIONS }
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Every state.
 *
 * Two levels of label, one for the group and one per option, with the
 * description and the error hanging off the group. The base wires all of it,
 * and it wires it to a different place than RadioGroup does: `role="group"`
 * supports neither `aria-invalid` nor `aria-required`, so both land on every
 * option and the group carries only the data attributes. Nothing is supplied
 * by hand.
 *
 * The forced rows are on the options, because that is where the base puts the
 * state attributes and where `bb:group` sits — a checkbox is hovered, a set of
 * them is not.
 */
export const States: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 420, gap: 'var(--bb-field-gap)' }}
    >
      <CheckboxGroup label="Nothing selected">{OPTIONS}</CheckboxGroup>
      <CheckboxGroup label="With a selection" defaultValue={['email']}>
        {OPTIONS}
      </CheckboxGroup>
      <CheckboxGroup
        label="All of them"
        defaultValue={['email', 'sms', 'push']}
      >
        {OPTIONS}
      </CheckboxGroup>
      <CheckboxGroup
        label="With a description"
        defaultValue={['email']}
        description="You can change this at any time."
      >
        {OPTIONS}
      </CheckboxGroup>
      <CheckboxGroup
        label="Invalid"
        isInvalid
        description="You can change this at any time."
        errorMessage="Choose at least one way to reach you."
      >
        {OPTIONS}
      </CheckboxGroup>
      <CheckboxGroup label="Required" isRequired>
        {OPTIONS}
      </CheckboxGroup>
      <CheckboxGroup label="Disabled group" isDisabled defaultValue={['email']}>
        {OPTIONS}
      </CheckboxGroup>
      {/*
        Read-only and disabled are not the same thing and must not look the
        same (doc 07 §6). Read-only keeps the value readable and the options
        reachable; disabled says the whole group does not apply right now.
      */}
      <CheckboxGroup
        label="Read-only group"
        isReadOnly
        defaultValue={['email', 'push']}
        description="Set by your administrator."
      >
        {OPTIONS}
      </CheckboxGroup>
      <CheckboxGroup label="One option disabled" defaultValue={['email']}>
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms" isDisabled>
          Text message, not available in your country
        </Checkbox>
      </CheckboxGroup>
      <CheckboxGroup label="Interaction" defaultValue={['push']}>
        <Force state="data-hovered">
          <Checkbox value="email">Hovered</Checkbox>
        </Force>
        <Force state="data-pressed">
          <Checkbox value="sms">Pressed</Checkbox>
        </Force>
        <Force state="data-focused">
          <Checkbox value="none">Focused</Checkbox>
        </Force>
        <Force state="data-focused">
          <Checkbox value="push">Focused and selected</Checkbox>
        </Force>
      </CheckboxGroup>
      {/*
        Hovered and pressed while selected need their own groups, because a
        forced attribute on an option in the group above would sit next to a
        different selection. The pair is the point: an unselected box moves
        along the grey ramp and a selected one along the accent ramp, and which
        rule wins is a stacked variant rather than source order.
      */}
      <CheckboxGroup
        label="Interaction, already selected"
        defaultValue={['email']}
      >
        <Force state="data-hovered">
          <Checkbox value="email">Hovered and selected</Checkbox>
        </Force>
      </CheckboxGroup>
      <CheckboxGroup
        label="Interaction, pressed while selected"
        defaultValue={['email']}
      >
        <Force state="data-pressed">
          <Checkbox value="email">Pressed and selected</Checkbox>
        </Force>
      </CheckboxGroup>
    </div>
  )
};

/**
 * **CheckboxGroup or RadioGroup?** The same three options, and the choice
 * between them is the most common mistake with this pair.
 *
 * | | CheckboxGroup | RadioGroup |
 * | --- | --- | --- |
 * | How many answers | Any number, none included | Exactly one |
 * | The value | An array | A single string |
 * | Keyboard | One tab stop per option, `Space` toggles | One tab stop, arrows move inside |
 * | Undoing a choice | Click it again | Impossible once one is picked |
 *
 * The test: ask whether "none of them" and "all of them" are both sensible
 * answers. If they are, it is a checkbox group. A radio group cannot say
 * either once someone has answered, which is why a radio set with an escape
 * hatch option is usually a checkbox group wearing the wrong clothes.
 *
 * Look at them side by side for the sibling check as well: same label weight,
 * same gaps, same control size, same focus ring, same message type scale.
 */
export const AgainstRadioGroup: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">CheckboxGroup — any number of answers</p>
        <CheckboxGroup
          label="Notify me by"
          defaultValue={['email']}
          description="Pick as many as you like, or none."
        >
          {OPTIONS}
        </CheckboxGroup>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">RadioGroup — exactly one</p>
        <RadioGroup
          label="Notify me by"
          defaultValue="email"
          description="One of them, and there is no way back to none."
        >
          <Radio value="email">Email</Radio>
          <Radio value="sms">Text message</Radio>
          <Radio value="push">Push notification</Radio>
        </RadioGroup>
      </div>
    </div>
  )
};

/**
 * The same pair while invalid, which is where two groups drift apart without
 * anyone noticing: the message sits in the same place, at the same size, in
 * the same colour, and the options carry the same danger border.
 */
export const AgainstRadioGroupInvalid: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">CheckboxGroup</p>
        <CheckboxGroup
          label="Notify me by"
          isRequired
          isInvalid
          description="Pick as many as you like."
          errorMessage="Choose at least one way to reach you."
        >
          {OPTIONS}
        </CheckboxGroup>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">RadioGroup</p>
        <RadioGroup
          label="Notify me by"
          isRequired
          isInvalid
          description="One of them."
          errorMessage="Choose how you want to be reached."
        >
          <Radio value="email">Email</Radio>
          <Radio value="sms">Text message</Radio>
          <Radio value="push">Push notification</Radio>
        </RadioGroup>
      </div>
    </div>
  )
};

/**
 * Both orientations, and horizontal is layout only.
 *
 * This is the one place the component cannot copy RadioGroup line for line:
 * the base's RadioGroup owns `orientation` and puts `aria-orientation` on the
 * element, because a radio set is one composite tab stop whose arrow keys run
 * along an axis. A checkbox group has independent tab stops and no arrow
 * navigation, so nothing is announced and the prop moves flex rules only.
 *
 * It wraps rather than overflowing, which is what makes a narrow container
 * survivable without a query (doc 04 §3).
 */
export const Orientations: Story = {
  render: () => (
    <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
      <CheckboxGroup label="Vertical, the default" defaultValue={['email']}>
        {OPTIONS}
      </CheckboxGroup>
      <CheckboxGroup
        label="Horizontal, for two or three short options"
        orientation="horizontal"
        defaultValue={['weekdays']}
      >
        <Checkbox value="weekdays">Weekdays</Checkbox>
        <Checkbox value="weekends">Weekends</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup label="Horizontal, wrapping" orientation="horizontal">
        {OPTIONS}
      </CheckboxGroup>
    </div>
  )
};

/**
 * A horizontal group in 320px, which is the container the entry gate names.
 *
 * The sensible thing here is to wrap: the options fall onto as many rows as
 * they need and every hit area stays whole, instead of the row scrolling
 * sideways or the labels being clipped. Nothing has a fixed width, so this
 * needs no viewport query — the group only ever sees its container.
 */
export const HorizontalInNarrowContainer: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
        <CheckboxGroup
          label="Days"
          orientation="horizontal"
          defaultValue={['mon', 'wed']}
        >
          <Checkbox value="mon">Monday</Checkbox>
          <Checkbox value="tue">Tuesday</Checkbox>
          <Checkbox value="wed">Wednesday</Checkbox>
          <Checkbox value="thu">Thursday</Checkbox>
          <Checkbox value="fri">Friday</Checkbox>
        </CheckboxGroup>
        <CheckboxGroup
          label="Canales de notificación para este pedido"
          orientation="horizontal"
          isInvalid
          description="Se aplican las tarifas del operador."
          errorMessage="Elige al menos un canal para poder continuar."
        >
          <Checkbox value="email">Correo electrónico</Checkbox>
          <Checkbox value="sms">Mensaje de texto al móvil</Checkbox>
        </CheckboxGroup>
      </div>
    </div>
  )
};

/**
 * A brand override, which is level 1 of the customisation contract
 * (doc 03 §7): redefine the brand scale and the semantic tokens recompute on
 * their own. The mark, the fill and the focus ring all follow, without the
 * component knowing a theme changed.
 *
 * `data-bb-theme` on the same element is what makes it work — a CSS var()
 * resolves where it is declared, so without the attribute the override
 * silently does nothing (doc 03 §3.1).
 */
export const BrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <CheckboxGroup label="Notify me by" defaultValue={['email', 'push']}>
          {OPTIONS}
        </CheckboxGroup>
      </Scope>
      <div className="catalog-panel" data-bb-theme="catalog-alt">
        <p className="catalog-label">Overridden brand</p>
        <CheckboxGroup label="Notify me by" defaultValue={['email', 'push']}>
          {OPTIONS}
        </CheckboxGroup>
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
            <CheckboxGroup label="Notify me by" defaultValue={['email']}>
              {OPTIONS}
            </CheckboxGroup>
            <CheckboxGroup
              label="Invalid"
              isInvalid
              errorMessage="Choose at least one."
            >
              {OPTIONS}
            </CheckboxGroup>
            <CheckboxGroup label="Read-only" isReadOnly defaultValue={['push']}>
              {OPTIONS}
            </CheckboxGroup>
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
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <CheckboxGroup
              label="Notify me by"
              defaultValue={['email']}
              description="Help text."
            >
              {OPTIONS}
            </CheckboxGroup>
            <CheckboxGroup label="Days" orientation="horizontal">
              <Checkbox value="weekdays">Weekdays</Checkbox>
              <Checkbox value="weekends">Weekends</Checkbox>
            </CheckboxGroup>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * The boxes move to the other side on their own, and so does the horizontal
 * row: `flex-row` follows the writing direction, which is why there is nothing
 * physical to flip.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['ltr', 'rtl'] as const).map(dir => (
        <Scope key={dir} label={dir.toUpperCase()} dir={dir}>
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <CheckboxGroup
              label="Avísame por"
              isRequired
              defaultValue={['email']}
              description="Puedes cambiarlo cuando quieras."
            >
              <Checkbox value="email">Correo electrónico</Checkbox>
              <Checkbox value="sms">Mensaje de texto</Checkbox>
            </CheckboxGroup>
            <CheckboxGroup label="Días" orientation="horizontal">
              <Checkbox value="weekdays">Entre semana</Checkbox>
              <Checkbox value="weekends">Fines de semana</Checkbox>
            </CheckboxGroup>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * Long options wrap and stay aligned with their box, in 320px. Nothing is
 * sized to fit one particular label in one particular language.
 */
export const LongLabelsAndNarrow: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <CheckboxGroup
        label="Canales de notificación preferidos para este pedido"
        isRequired
        isInvalid
        description="Las notificaciones se envían en horario laboral."
        errorMessage="Elige al menos un canal de notificación para continuar."
      >
        <Checkbox value="email">
          Correo electrónico a la dirección registrada en la cuenta
        </Checkbox>
        <Checkbox value="sms">
          Mensaje de texto al número de móvil verificado
        </Checkbox>
      </CheckboxGroup>
    </div>
  )
};
