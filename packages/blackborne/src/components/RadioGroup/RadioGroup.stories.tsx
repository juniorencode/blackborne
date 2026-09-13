import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from './RadioGroup';
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

function AllStates() {
  return (
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
      {/*
        Focus, forced so a screenshot can hold it. It goes on the individual
        Radio rather than on the group, because that is where the base puts it
        and where bb:group sits — a radio is focused, a set of them is not.

        Radio was the last of the three small controls with no focus row at
        all. Checkbox and Switch drew no ring for a while and nobody saw it,
        precisely because the state was in no baseline.

        Hovered and pressed appear twice each, unselected and selected, and
        that pairing is the point rather than thoroughness. An unselected radio
        moves along the grey ramp and a selected one along the accent ramp, and
        the rule that picks between them is a stacked variant whose specificity
        beats either single one. A screenshot is what proves the pair did not
        collapse into whichever rule happens to be written last.
      */}
      <RadioGroup label="Interaction" defaultValue="pickup">
        <Force state="data-hovered">
          <Radio value="standard">Hovered</Radio>
        </Force>
        <Force state="data-pressed">
          <Radio value="express">Pressed</Radio>
        </Force>
        <Force state="data-focused">
          <Radio value="unselected">Focused</Radio>
        </Force>
        <Force state="data-focused">
          <Radio value="pickup">Focused and selected</Radio>
        </Force>
      </RadioGroup>
      <RadioGroup label="Interaction, already selected" defaultValue="standard">
        <Force state="data-hovered">
          <Radio value="standard">Hovered and selected</Radio>
        </Force>
      </RadioGroup>
      <RadioGroup
        label="Interaction, pressed while selected"
        defaultValue="standard"
      >
        <Force state="data-pressed">
          <Radio value="standard">Pressed and selected</Radio>
        </Force>
      </RadioGroup>
    </div>
  );
}

/**
 * Every state.
 *
 * The two-level label structure is what this component adds: one label for the
 * group and one per option, with the description and error hanging off the
 * group rather than off any single radio. The base wires all of it — verified,
 * which is why nothing is supplied by hand here, unlike a lone checkbox.
 *
 * AND IT IS LIGHT AND DARK, which it was not until 2026-09-13. A forced-state
 * story is the only place hover, press and focus are ever rendered, so a
 * light-only one leaves all three unreachable in dark by every automated layer
 * here — axe measures a rendered page and the visual suite photographs one.
 * What lived in that gap on `Button`: a pressed primary in dark at 2.08:1,
 * under 501 stories and 211 baselines (doc 10 §11.9).
 */
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
        <RadioGroup label="Delivery" defaultValue="express">
          {OPTIONS}
        </RadioGroup>
      </Scope>
      <div className="catalog-panel" data-bb-theme="catalog-alt">
        <p className="catalog-label">Overridden brand</p>
        <RadioGroup label="Delivery" defaultValue="express">
          {OPTIONS}
        </RadioGroup>
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

/*
 * ===================================================================
 * variant="card"
 *
 * The options stop being circles with labels beside them and become
 * surfaces you press anywhere on: choosing a plan, a payment method, a
 * shipping option.
 * ===================================================================
 */

const PLANS = (
  <>
    <Radio value="basic">Basic — one project</Radio>
    <Radio value="team">Team — ten projects</Radio>
    <Radio value="scale">Scale — unlimited projects</Radio>
  </>
);

/**
 * The two variants side by side, which is the only way to see that they are
 * one component and not two.
 *
 * Everything structural is shared: the group label, the two levels of label,
 * the description and error beneath, the circle. What changes is where the
 * frame is and where the focus ring goes.
 *
 * The circle is not decoration in the card. It is the non-colour channel doc
 * 06 §3 requires — look at this in greyscale and the tint disappears while the
 * filled circle does not — and it is what says single-select rather than
 * multi. A card marked only by its border could be a checkbox.
 */
export const Cards: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Plain">
        <RadioGroup
          label="Plan"
          defaultValue="team"
          description="You can change this later."
        >
          {PLANS}
        </RadioGroup>
      </Scope>
      <Scope label="Card">
        <RadioGroup
          label="Plan"
          variant="card"
          defaultValue="team"
          description="You can change this later."
        >
          {PLANS}
        </RadioGroup>
      </Scope>
    </div>
  )
};

/**
 * THE WHOLE CARD IS THE TARGET, which is the entire reason the variant exists.
 *
 * The live group at the top is the half only a pointer can prove: press the
 * far bottom corner of a card, nowhere near the circle, and the option is
 * selected. A card whose only target were a 20px circle would be worse than no
 * card at all — it would look pressable across 200px and answer across 20.
 *
 * The forced rows below are the half a screenshot can hold. Feedback covers
 * the WHOLE surface: the border moves along the card's full perimeter and the
 * circle answers a pointer that is nowhere near it. Beside them is the same
 * state on a plain radio, where the target is the label row and the feedback
 * is twenty pixels wide — the two together are what makes the difference
 * legible.
 */
export const TheWholeCardIsTheTarget: Story = {
  render: () => (
    <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
      <div className="catalog-panel">
        <p className="catalog-label">
          Live — press the far corner of a card, not the circle
        </p>
        <RadioGroup label="Plan" variant="card">
          {PLANS}
        </RadioGroup>
      </div>

      <div className="catalog-pair">
        <Scope label="Card — the frame and the circle both answer">
          <div className="catalog-stack" style={{ gap: 'var(--bb-space-3)' }}>
            <RadioGroup label="Hovered" variant="card">
              <Force state="data-hovered">
                <Radio value="basic">Basic — one project</Radio>
              </Force>
            </RadioGroup>
            <RadioGroup label="Pressed" variant="card">
              <Force state="data-pressed">
                <Radio value="basic">Basic — one project</Radio>
              </Force>
            </RadioGroup>
          </div>
        </Scope>
        <Scope label="Plain — the same states, twenty pixels wide">
          <div className="catalog-stack" style={{ gap: 'var(--bb-space-3)' }}>
            <RadioGroup label="Hovered">
              <Force state="data-hovered">
                <Radio value="basic">Basic — one project</Radio>
              </Force>
            </RadioGroup>
            <RadioGroup label="Pressed">
              <Force state="data-pressed">
                <Radio value="basic">Basic — one project</Radio>
              </Force>
            </RadioGroup>
          </div>
        </Scope>
      </div>
    </div>
  )
};

function AllCardStates() {
  return (
    <div
      className="catalog-stack"
      style={{ maxWidth: 420, gap: 'var(--bb-field-gap)' }}
    >
      <RadioGroup label="Nothing selected" variant="card">
        {PLANS}
      </RadioGroup>
      <RadioGroup label="With a selection" variant="card" defaultValue="team">
        {PLANS}
      </RadioGroup>
      <RadioGroup
        label="Invalid, with the error on the group"
        variant="card"
        isInvalid
        description="Every plan can be cancelled monthly."
        errorMessage="Choose a plan to continue."
      >
        {PLANS}
      </RadioGroup>
      <RadioGroup label="Required" variant="card" isRequired>
        {PLANS}
      </RadioGroup>
      <RadioGroup
        label="Disabled group"
        variant="card"
        isDisabled
        defaultValue="team"
      >
        {PLANS}
      </RadioGroup>
      <RadioGroup
        label="Read-only group"
        variant="card"
        isReadOnly
        defaultValue="team"
      >
        {PLANS}
      </RadioGroup>
      <RadioGroup label="One option disabled" variant="card">
        <Radio value="basic">Basic — one project</Radio>
        <Radio value="team" isDisabled>
          Team — not available on this account
        </Radio>
      </RadioGroup>
      <RadioGroup label="Interaction" variant="card" defaultValue="scale">
        <Force state="data-hovered">
          <Radio value="basic">Hovered</Radio>
        </Force>
        <Force state="data-pressed">
          <Radio value="team">Pressed</Radio>
        </Force>
        <Force state="data-focused">
          <Radio value="unselected">Focused</Radio>
        </Force>
        <Force state="data-focused">
          <Radio value="scale">Focused and selected</Radio>
        </Force>
      </RadioGroup>
      <RadioGroup
        label="Interaction, already selected"
        variant="card"
        defaultValue="basic"
      >
        <Force state="data-hovered">
          <Radio value="basic">Hovered and selected</Radio>
        </Force>
      </RadioGroup>
      <RadioGroup
        label="Interaction, pressed while selected"
        variant="card"
        defaultValue="basic"
      >
        <Force state="data-pressed">
          <Radio value="basic">Pressed and selected</Radio>
        </Force>
      </RadioGroup>
      <RadioGroup
        label="Invalid and focused — the ring recolours with the state"
        variant="card"
        isInvalid
        errorMessage="Choose a plan to continue."
      >
        <Force state="data-focused">
          <Radio value="basic">Basic — one project</Radio>
        </Force>
      </RadioGroup>
    </div>
  );
}

/**
 * Every state a card has, including the two the circle cannot express.
 *
 * WHICH CHANNEL MOVES is the thing to check here, because a card answers
 * differently from a circle on purpose:
 *
 * - the BORDER answers the pointer arriving, which is the field's rule — a
 *   large surface repainted every time a pointer crosses it makes a list of
 *   them shimmer
 * - the FILL answers a press, which is Button's rule, and a press is
 *   deliberate and momentary so it cannot shimmer
 * - the FILL also carries SELECTION, in `surface-selected`, and once a card is
 *   tinted the border takes over hover and press along the accent ramp so the
 *   tint never flickers back to grey
 *
 * Disabled and read-only are opposites on purpose (doc 07 §6): disabled keeps
 * its border and changes its fill, read-only loses its border and keeps the
 * selected tint — a read-only group exists to show what was chosen.
 *
 * Hovered and pressed appear twice each, unselected and selected, and the
 * pairing is the point rather than thoroughness: the rule that picks between
 * the grey ramp and the accent ramp is a stacked variant whose specificity
 * beats either single one, and a screenshot is what proves the pair did not
 * collapse into whichever rule happens to be written last.
 *
 * AND IT IS LIGHT AND DARK, for the reason the plain states story is: a
 * forced-state story is the only place hover, press and focus are ever
 * rendered, so a light-only one leaves all three unmeasured in the other mode,
 * since axe reads a rendered page (doc 10 §11.9). The tint and the ramps the
 * border and the fill walk are declared per mode, and `CardModes` shows every
 * card at rest — so dark held no interacted card at all.
 */
export const CardStates: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <AllCardStates />
      </Scope>
      <Scope label="Dark" mode="dark">
        <AllCardStates />
      </Scope>
    </div>
  )
};

/**
 * Both orientations, and cards lay out in the one the group already has.
 *
 * A row of cards is a GRID rather than a wrapping flex row, for two reasons
 * worth checking here: every card in a row is the same height, which flex-wrap
 * only manages per line, and the row rewraps against its own container with no
 * query and no breakpoint (P4). Drag the dashed panel to watch it happen —
 * three across, then two, then one, with no width at which the cards overflow.
 */
export const CardsHorizontal: Story = {
  render: () => (
    <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
      <RadioGroup label="Vertical" variant="card" defaultValue="team">
        {PLANS}
      </RadioGroup>
      <RadioGroup
        label="Horizontal"
        variant="card"
        orientation="horizontal"
        defaultValue="team"
      >
        {PLANS}
      </RadioGroup>
      <div className="catalog-resizable">
        <RadioGroup
          label="Drag this panel from its trailing edge"
          variant="card"
          orientation="horizontal"
          defaultValue="team"
        >
          {PLANS}
        </RadioGroup>
      </div>
    </div>
  )
};

/**
 * A row of cards in 320px, which is P4's own test.
 *
 * The row does not overflow and it does not squash: `auto-fit` with a floor of
 * `min(12rem, 100%)` puts one card per line as soon as two will not fit, and
 * the floor cannot exceed the container, so even narrower than 12rem there is
 * nothing to scroll sideways.
 *
 * Long labels wrap inside the card and stay aligned with their circle, which
 * is what `items-start` plus a `1lh`-based offset buys — the circle sits
 * against the FIRST line rather than floating in the middle of a paragraph.
 */
export const CardsInANarrowContainer: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <RadioGroup
        label="Método de envío preferido para este pedido"
        variant="card"
        orientation="horizontal"
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

/** Light and dark side by side, never by toggling (doc 03 §6). */
export const CardModes: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['light', 'dark'] as const).map(mode => (
        <Scope
          key={mode}
          label={mode === 'light' ? 'Light' : 'Dark'}
          mode={mode}
        >
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <RadioGroup label="Plan" variant="card" defaultValue="team">
              {PLANS}
            </RadioGroup>
            <RadioGroup
              label="Invalid"
              variant="card"
              isInvalid
              errorMessage="Choose a plan."
            >
              {PLANS}
            </RadioGroup>
            <RadioGroup
              label="Read-only"
              variant="card"
              isReadOnly
              defaultValue="team"
            >
              {PLANS}
            </RadioGroup>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * Density moves the card's padding and the gap between cards, and no colour.
 *
 * The padding reads `--bb-space-4`, which holds the same value as
 * `--bb-control-padding-x` at both densities — so a card's inner edge lines up
 * with the value inside a field beside it, in a compact application as well as
 * a normal one.
 */
export const CardDensities: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['normal', 'compact'] as const).map(density => (
        <Scope
          key={density}
          label={density === 'normal' ? 'Normal' : 'Compact'}
          density={density}
        >
          <RadioGroup
            label="Plan"
            variant="card"
            defaultValue="team"
            description="Help text."
          >
            {PLANS}
          </RadioGroup>
        </Scope>
      ))}
    </div>
  )
};

/** The circle moves to the other side on its own; the card is symmetrical. */
export const CardDirection: Story = {
  render: () => (
    <div className="catalog-pair">
      {(['ltr', 'rtl'] as const).map(dir => (
        <Scope key={dir} label={dir.toUpperCase()} dir={dir}>
          <RadioGroup
            label="Método de envío"
            variant="card"
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

/**
 * A brand override, which is level 1 of the customisation contract
 * (doc 03 §7). The selected card's tint, its border, the circle's fill and the
 * focus ring all follow, because every one of them is a semantic token
 * recomputed from the brand scale.
 *
 * This is the story to check when a brand is a light colour: the selected
 * card's label is `surface-selected-on`, the pair of the tint it sits on
 * (doc 03 §4.0), so it cannot end up as light text on a light tint.
 */
export const CardBrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <RadioGroup label="Plan" variant="card" defaultValue="team">
          {PLANS}
        </RadioGroup>
      </Scope>
      <div className="catalog-panel" data-bb-theme="catalog-alt">
        <p className="catalog-label">Overridden brand</p>
        <RadioGroup label="Plan" variant="card" defaultValue="team">
          {PLANS}
        </RadioGroup>
      </div>
    </div>
  )
};
