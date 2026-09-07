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

/**
 * The character counter, on the field that needs it most.
 *
 * A note is where a limit actually bites: somebody writes three paragraphs,
 * the box silently stops accepting characters, and nothing says why. The count
 * turns from muted to ordinary text at the limit — not to the danger colour,
 * because being full is not being wrong.
 */
export const CharacterCount: Story = {
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 460 }}>
      <TextArea label="Empty" maxLength={280} isCounterVisible rows={3} />
      <TextArea
        label="With a description"
        maxLength={280}
        isCounterVisible
        rows={3}
        defaultValue="Delivered to the loading bay, signed for by the warehouse supervisor."
        description="Anything the driver should know."
      />
      <TextArea
        label="At the limit"
        maxLength={24}
        isCounterVisible
        rows={2}
        defaultValue="Twenty four characters!!"
      />
    </div>
  )
};

/**
 * **The height follows the content, up to a limit.**
 *
 * This story is the instrument, not an illustration. jsdom has no layout
 * engine, so `scrollHeight` is zero there and the unit tests cannot assert one
 * thing about height — everything below is only checkable here.
 *
 * What to do with it, in order:
 *
 * 1. Type into **Grows as you type**. It gets taller with every line, under
 *    your own caret. Delete back and it comes down again, and stops at three
 *    rows however empty it gets — `rows` is the floor.
 * 2. Keep going past six rows. It stops and scrolls, exactly as the field
 *    without the prop does from the first row. `maxRows` defaults to twice
 *    `rows`, and unbounded is not on offer: a note in a box with no ceiling
 *    becomes a page-length field that pushes the rest of the form out of view.
 * 3. Compare the first two. Same content, same rows, one scrolling and one
 *    grown to fit — and the grown one arrived that way on mount, not after a
 *    keystroke, which is the part a handler hung off typing gets wrong.
 * 4. Look for the resize grip on a growing field. There is none, and that is
 *    deliberate: a drag writes a height that the next keystroke would
 *    overwrite, so it would appear to work and then undo itself.
 *
 * **On doc 09 §3, which forbids layout shifts.** The growth is one, and it is
 * the exception the rule does not spell out: §3 is about content ARRIVING and
 * moving what somebody is aiming at. Here the person typing caused it, at a
 * caret the growth follows — the box opening up to hold their own sentence is
 * feedback. The ceiling is what keeps it feedback rather than a surprise.
 */
export const Growing: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 460, gap: 'var(--bb-field-gap)' }}
    >
      <TextArea
        label="Scrolls at its rows (no isGrowable)"
        data-testid="fixed"
        rows={3}
        defaultValue={
          'Delivered on Tuesday morning.\n' +
          'Signed for at reception.\n' +
          'The driver asked for afternoon slots next time.\n' +
          'Pallet two was short by a box.'
        }
      />
      <TextArea
        label="Grown to fit, from the first render"
        data-testid="grown"
        isGrowable
        rows={3}
        defaultValue={
          'Delivered on Tuesday morning.\n' +
          'Signed for at reception.\n' +
          'The driver asked for afternoon slots next time.\n' +
          'Pallet two was short by a box.'
        }
      />
      <TextArea
        label="Grows as you type"
        data-testid="growing"
        isGrowable
        rows={3}
        description="Three rows to start, six at most, then it scrolls."
        placeholder="Add a line, then another"
      />
      <TextArea
        label="At its ceiling"
        data-testid="capped"
        isGrowable
        rows={2}
        maxRows={4}
        defaultValue={
          'One.\nTwo.\nThree.\nFour.\nFive.\nSix.\nSeven.\nEight.\nNine.'
        }
      />
      <TextArea
        label="Never below its floor"
        data-testid="floor"
        isGrowable
        rows={5}
        defaultValue="One short line."
      />
    </div>
  )
};

/**
 * Growing inside a 320px container, which is where wrapping does the work: the
 * same sentence needs four rows here and two at 460px, and the box arrives at
 * the height it needs either way.
 *
 * **A known limitation is visible here if you go looking**, and it is written
 * down rather than left to be discovered: the height answers the value, not
 * the width. Drag the container narrower with the value untouched and the text
 * re-wraps onto more rows while the box keeps the height it had, until the
 * next keystroke corrects it. Answering that means observing the element's own
 * size, which nothing in the library does yet.
 */
export const GrowingNarrow: Story = {
  render: () => (
    <div
      data-testid="narrow"
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <TextArea
        label="Observaciones sobre la entrega"
        isGrowable
        rows={2}
        maxRows={8}
        description="Se guardará junto al registro del pedido."
        defaultValue="El paquete llegó el martes por la mañana y fue recibido en recepción por la persona de turno, que firmó el albarán sin incidencias."
      />
    </div>
  )
};
