/*
 * The catalog for PasswordField.
 *
 * Doc 07 §6 lists eight field states and requires all of them to be here. This
 * component doubles that list, because every one of them has a masked and a
 * revealed form — and the revealed form is not decoration: it is the state
 * where a field for secrets is showing one.
 *
 * The reveal state is internal and starts off, so it cannot be set by a prop.
 * `Revealed` below presses the toggle after render, the same way
 * `catalog/forceState.tsx` sets a DOM attribute after render, and for the same
 * reason: a state only reachable by pointing at the thing is a state no
 * screenshot ever covers.
 */
import { useLayoutEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfigProvider } from '../../config';
import { PasswordField, type PasswordFieldSize } from './PasswordField';

const SIZES: PasswordFieldSize[] = ['sm', 'md', 'lg'];

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

/**
 * Everything inside, revealed.
 *
 * A real press rather than a simulated one — a programmatic `click()` is the
 * path the base already supports for assistive technology, so this exercises
 * the same handler a person does and cannot drift from it.
 *
 * `display: contents` on the wrapper so it takes part in no layout: the panel
 * around it must measure exactly as it would without this.
 *
 * Note what it does NOT do: reveal a disabled field. The toggle is disabled
 * with the field, so the click has nothing to act on — which is the rule, not
 * a gap in this helper.
 */
function Revealed({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    ref.current
      ?.querySelectorAll('button')
      .forEach(button => void button.click());
  }, []);

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

/**
 * The field inside, focused for real.
 *
 * `Force` cannot do this one, and the reason is worth writing down: it puts the
 * attribute on the outermost `[data-rac]` node, which for a field is the
 * container — while the ring is keyed off `data-focus-within` on the GROUP
 * that draws the box. The attribute would land in the DOM and match no
 * selector, which is precisely the failure `forceState.tsx` was written about.
 *
 * So the input is focused, and the base reports the state the way it does for
 * a person. Only one element in a document can hold focus, so exactly one
 * panel per STORY may ask for it — the states pair asks in its light half, and
 * `Modes` asks in its dark one.
 */
function Focused({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // preventScroll, or opening the docs page jumps to this row.
    ref.current?.querySelector('input')?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

const meta = {
  title: 'Components/PasswordField',
  component: PasswordField,
  args: { label: 'Password', placeholder: 'Your password' },
  argTypes: { size: { control: 'select', options: SIZES } }
} satisfies Meta<typeof PasswordField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/*
 * The rows, so the story below can render them once per mode.
 *
 * `focus` is a parameter rather than one more row because only one of the two
 * panels may ask for it: one element in a document holds focus, so a second
 * `Focused` would take the ring off the first and leave a row labelled
 * "Focused" with nothing to show. The dark one is in `Modes`.
 */
function AllStates({ focus }: { focus: boolean }) {
  return (
    <div
      className="catalog-stack"
      style={{ maxWidth: 360, gap: 'var(--bb-field-gap)' }}
    >
      <PasswordField label="Empty" placeholder="Nothing typed yet" />
      <PasswordField label="With value" defaultValue="correct-horse-battery" />
      {focus ? (
        <Focused>
          <PasswordField label="Focused" defaultValue="correct-horse-battery" />
        </Focused>
      ) : null}
      <PasswordField
        label="With description"
        defaultValue="correct-horse-battery"
        description="Twelve characters or more."
      />
      <PasswordField
        label="Invalid"
        defaultValue="1234"
        description="Twelve characters or more."
        isInvalid
        errorMessage="This one is on a list of the most common passwords there are."
      />
      <PasswordField
        label="Required"
        isRequired
        placeholder="Cannot be empty"
      />
      <PasswordField
        label="Disabled"
        defaultValue="Does not apply here"
        isDisabled
      />
      <PasswordField
        label="Read only"
        defaultValue="visible-if-you-ask"
        isReadOnly
      />
      <PasswordField label="Loading" placeholder="Waiting for data" isLoading />
      <PasswordField label="Saving" defaultValue="correct-horse" isSaving />
    </div>
  );
}

/**
 * All eight states from doc 07 §6, masked.
 *
 * Two that are almost always forgotten sit next to each other on purpose:
 * **disabled** and **read-only** are not the same thing. Read-only shows a
 * value you can read, select and copy — and on this field that is not an
 * abstraction, because the reveal toggle keeps working there and nowhere else
 * does the difference between the two states have a control to demonstrate it.
 *
 * The focused row is focused for real rather than faked; the note on `Focused`
 * says why it has to be.
 *
 * **And it is light AND dark**, which it was not until 2026-09-13. A state
 * reached only by pointing at a thing is rendered nowhere except the story
 * that forces it, so a light-only one leaves the dark half of every state here
 * measured by nothing at all: axe reads what is on a page and the visual suite
 * photographs one (doc 10 §11.9). Focus is the one that cannot be in both
 * panels — one element in a document holds it — so its dark half is in
 * `Modes`.
 */
export const States: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <AllStates focus />
      </Scope>
      <Scope label="Dark" mode="dark">
        <AllStates focus={false} />
      </Scope>
    </div>
  )
};

/**
 * **The same states, revealed.** This is the pair to look at.
 *
 * The toggle's glyph and its accessible name both name the ACTION rather than
 * the state, so they agree with each other: masked shows an eye and offers to
 * show, revealed shows a struck eye and offers to hide. A button called
 * "Toggle visibility" would say what it is and never what it will do.
 *
 * Three rows are the interesting ones:
 *
 * - **read-only reveals.** A read-only password is still a value somebody may
 *   need to check, and showing it changes nothing about it. This is doc 07 §6's
 *   distinction with a control attached to it.
 * - **disabled does not.** The right-hand column pressed every toggle on the
 *   page and this one did not move: the field does not apply right now, so
 *   nothing inside it acts. The button keeps its width, so nothing shifts when
 *   the field is enabled.
 * - **saving reveals.** Doc 07 §2.2 rule 2, and the story below it.
 */
export const Revealing: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Masked">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <PasswordField label="With value" defaultValue="correct-horse" />
          <PasswordField
            label="Invalid"
            defaultValue="1234"
            isInvalid
            errorMessage="Too common to accept."
          />
          <PasswordField label="Read only" defaultValue="copy-me" isReadOnly />
          <PasswordField label="Disabled" defaultValue="not-here" isDisabled />
          <PasswordField label="Saving" defaultValue="correct-horse" isSaving />
        </div>
      </Scope>
      <Scope label="Revealed">
        <Revealed>
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <PasswordField label="With value" defaultValue="correct-horse" />
            <PasswordField
              label="Invalid"
              defaultValue="1234"
              isInvalid
              errorMessage="Too common to accept."
            />
            <PasswordField
              label="Read only"
              defaultValue="copy-me"
              isReadOnly
            />
            <PasswordField
              label="Disabled"
              defaultValue="not-here"
              isDisabled
            />
            <PasswordField
              label="Saving"
              defaultValue="correct-horse"
              isSaving
            />
          </div>
        </Revealed>
      </Scope>
    </div>
  )
};

/**
 * **The trailing edge, and the one place this field breaks the pattern.**
 *
 * Six things want the end of a control and doc 07 §2.2 orders them once. Busy
 * wins outright over the clear button and the numeric stepper: mid-flight they
 * are unreachable — hidden from the reader, unfocusable, unclickable — and
 * still occupy their width, because closing the gap would slide the value
 * across.
 *
 * **Rule 2 exempts this one control.** Taking the toggle away while a form
 * saves would not remove an affordance, it would remove a capability: the
 * value stops being readable at all, and by somebody who is watching a save
 * they may need to check. So it stays, focusable and pressable, and the second
 * column proves it by pressing it.
 *
 * What that costs is visible if you compare the two rows in each column: while
 * busy, the field clears the indicator's lane — the same 36px TextField and
 * NumberField clear when nothing else holds that edge — and the toggle moves
 * inside it. Without that the spinner would be painted on top of the glyph.
 * The value does not move, which is the half of doc 09 §3 that matters.
 */
export const TheTrailingEdge: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Masked">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <PasswordField label="Idle" defaultValue="correct-horse" />
          <PasswordField
            label="Loading"
            defaultValue="correct-horse"
            isLoading
          />
          <PasswordField label="Saving" defaultValue="correct-horse" isSaving />
        </div>
      </Scope>
      <Scope label="Revealed — the toggle still answers">
        <Revealed>
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <PasswordField label="Idle" defaultValue="correct-horse" />
            <PasswordField
              label="Loading"
              defaultValue="correct-horse"
              isLoading
            />
            <PasswordField
              label="Saving"
              defaultValue="correct-horse"
              isSaving
            />
          </div>
        </Revealed>
      </Scope>
    </div>
  )
};

/**
 * **The hit area, at both densities.** This is the check to actually make.
 *
 * The dashed outline is the catalog drawing the target, not the component: it
 * is there so the thing being measured is visible. The eye is drawn at 14px and
 * 11px, and if the button were the size of the eye it would fail doc 06 §3 in
 * both columns. It is not — both axes take `--bb-control-hit-area`, so the
 * target measures 28px normal and 24px compact. Compact trims the mark and
 * never the target.
 *
 * Point at the far corner of the outline in the compact column: it still hits.
 * And note what density does not touch: no colour moves, and the label and the
 * value stay at the same size (doc 03 §4.6a — compact trims air, not
 * legibility).
 */
export const Densities: Story = {
  render: () => (
    <div className="catalog-pair">
      <style>{`
        .password-hit-area button {
          outline: 1px dashed var(--bb-border-strong);
          outline-offset: -1px;
        }
      `}</style>
      {(['normal', 'compact'] as const).map(density => (
        <Scope
          key={density}
          label={density === 'normal' ? 'Normal' : 'Compact'}
          density={density}
        >
          <div
            className="catalog-stack password-hit-area"
            style={{ gap: 'var(--bb-field-gap)' }}
          >
            {SIZES.map(size => (
              <PasswordField
                key={size}
                label={`Size ${size}`}
                size={size}
                defaultValue="correct-horse"
              />
            ))}
            <PasswordField label="Busy" defaultValue="correct-horse" isSaving />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * Light and dark side by side, never by toggling (doc 03 §6).
 *
 * Dark mode is not an inversion: each semantic token is defined per mode, and
 * the toggle reads `--bb-text-muted` and `--bb-surface-hover` like every other
 * small control, so it follows without knowing a mode exists.
 *
 * The dark panel carries one row the light one does not: a field focused for
 * real. Only one element in a document can hold focus, so the states pair
 * renders that ring in light and this is the only place the dark one is
 * rendered at all (doc 10 §11.9).
 */
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
            <PasswordField label="With value" defaultValue="correct-horse" />
            <Revealed>
              <PasswordField label="Revealed" defaultValue="correct-horse" />
            </Revealed>
            <PasswordField
              label="Invalid"
              defaultValue="1234"
              isInvalid
              errorMessage="Too common to accept."
            />
            <PasswordField
              label="Read only"
              defaultValue="copy-me"
              isReadOnly
            />
            <PasswordField
              label="Disabled"
              defaultValue="not-here"
              isDisabled
            />
            {/* Dark only, and the note on this story says why. */}
            {mode === 'dark' ? (
              <Focused>
                <PasswordField label="Focused" defaultValue="correct-horse" />
              </Focused>
            ) : null}
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * RTL. The label, the asterisk, the toggle and the busy indicator all move to
 * the other side on their own — there is no physical measurement anywhere in
 * the component to flip.
 *
 * The eye is not flipped and must not be: doc 02 §11.4 flips the icons the
 * library draws only when they are DIRECTIONAL, and an eye is a real-world
 * object. A mirrored eye would be the same eye and a mirrored arrow would be
 * the wrong arrow.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <PasswordField label="Password" isRequired defaultValue="secret-1" />
          <Revealed>
            <PasswordField label="Revealed" defaultValue="secret-1" />
          </Revealed>
          <PasswordField label="Saving" defaultValue="secret-1" isSaving />
        </div>
      </Scope>
      <Scope label="RTL" dir="rtl">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <PasswordField
            label="كلمة المرور"
            isRequired
            defaultValue="secret-1"
          />
          <Revealed>
            <PasswordField label="مكشوفة" defaultValue="secret-1" />
          </Revealed>
          <PasswordField label="جارٍ الحفظ" defaultValue="secret-1" isSaving />
        </div>
      </Scope>
    </div>
  )
};

/**
 * The library ships English only; a project injects the rest. Nothing here is
 * detected — the language is passed in, and direction follows from it.
 *
 * Both halves of the toggle's name are separate dictionary keys, and a project
 * that translates one and not the other gets a button that changes language
 * mid-press. That is why they are two keys and not one string with a
 * substitution.
 */
export const Translated: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default (English)">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <PasswordField label="Password" defaultValue="correct-horse" />
          <Revealed>
            <PasswordField label="Revealed" defaultValue="correct-horse" />
          </Revealed>
        </div>
      </Scope>
      <ConfigProvider
        locale="es-PE"
        dictionary={{
          showPassword: 'Mostrar la contraseña',
          hidePassword: 'Ocultar la contraseña',
          fieldSaving: 'Guardando'
        }}
      >
        <Scope label="Spanish, injected by the project">
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <PasswordField label="Contraseña" defaultValue="caballo-correcto" />
            <Revealed>
              <PasswordField label="Revelada" defaultValue="caballo-correcto" />
            </Revealed>
          </div>
        </Scope>
      </ConfigProvider>
    </div>
  )
};

/**
 * A brand override, which closes the one entry-gate box a component like this
 * is usually missing.
 *
 * Level 1 of the customisation contract (doc 03 §7): redefine the brand scale
 * and the semantic tokens recompute on their own. The focus ring and the
 * required marker follow, without the component knowing a theme changed.
 *
 * `data-bb-theme` on the same element is what makes it work — a CSS `var()`
 * resolves where it is declared, so without the attribute the override
 * silently does nothing (doc 03 §3.1).
 */
export const BrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <PasswordField label="Password" isRequired defaultValue="secret-1" />
          <PasswordField
            label="Invalid"
            defaultValue="1234"
            isInvalid
            errorMessage="Too common to accept."
          />
        </div>
      </Scope>
      <div className="catalog-panel" data-bb-theme="catalog-alt">
        <p className="catalog-label">Overridden brand</p>
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <PasswordField label="Password" isRequired defaultValue="secret-1" />
          <PasswordField
            label="Invalid"
            defaultValue="1234"
            isInvalid
            errorMessage="Too common to accept."
          />
        </div>
      </div>
    </div>
  )
};

/**
 * A 320px container and pseudo-localisation together — the two cheapest ways
 * to break a form, and the entry-gate box most components fail.
 *
 * Narrow the container, not the window: a component in a 320px side panel
 * inside a 1920px screen is the real situation (doc 04 §10). The toggle keeps
 * its full target at this width, so what gives way is the value's room and
 * never the control's — and the label wraps rather than the row scrolling.
 *
 * The Spanish labels are about 40% longer than the English ones, which is the
 * check that finds in minutes what otherwise surfaces the day somebody
 * translates to German.
 */
export const LongLabelsAndNarrow: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
        <PasswordField
          label="Contraseña de acceso al panel de administración"
          description="Doce caracteres o más, y distinta de la anterior."
          defaultValue="caballo-correcto-bateria-grapa"
        />
        <Revealed>
          <PasswordField
            label="Repetición de la contraseña de acceso"
            defaultValue="caballo-correcto-bateria-grapa"
          />
        </Revealed>
        <PasswordField
          label="Contraseña actual del titular de la cuenta"
          isInvalid
          defaultValue="1234"
          errorMessage="Esta contraseña aparece en una lista de las más utilizadas."
        />
        <PasswordField
          label="Guardando la contraseña nueva"
          defaultValue="caballo-correcto"
          isSaving
        />
      </div>
    </div>
  )
};

/**
 * **`autoComplete` is the consumer's, and this is the one field where its
 * value carries real meaning.**
 *
 * The library never sets it and never turns it off: turning autocomplete off
 * breaks password managers, it is a developer preference paid for by whoever
 * uses the screen, and P3 says the library does not make that call. But
 * `current-password` and `new-password` behave differently in every password
 * manager there is — the first offers the stored secret, the second offers to
 * generate and store one — and nothing here can know which screen it landed
 * on.
 *
 * So it is passed, and there is deliberately no default and no development
 * warning. It reaches the input through the rest spread like every other
 * `<input>` attribute (doc 02 §2); this story exists because the attribute is
 * invisible and the decision behind it is not obvious.
 *
 * **Paste works, here and everywhere.** Try it. NIST SP 800-63B says a
 * verifier SHOULD permit paste: blocking it breaks password managers, so
 * people fall back to a short secret they can retype, which makes security
 * worse. There is also no strength meter, and there will not be one — scoring
 * a password is a policy, so the project decides and passes `errorMessage`
 * like it would for any other field.
 */
export const AutoCompleteAndPaste: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 360, gap: 'var(--bb-field-gap)' }}
    >
      <PasswordField
        label="Signing in"
        autoComplete="current-password"
        placeholder="Your password"
        description='autoComplete="current-password" — offer the stored one.'
      />
      <PasswordField
        label="Choosing a new one"
        autoComplete="new-password"
        placeholder="Twelve characters or more"
        description='autoComplete="new-password" — offer to generate and store one.'
      />
      <PasswordField
        label="Scored by the project, not by the field"
        defaultValue="1234"
        isInvalid
        errorMessage="This appears in a list of the ten thousand most common passwords."
        description="The library presents the verdict; your project reaches it."
      />
    </div>
  )
};
