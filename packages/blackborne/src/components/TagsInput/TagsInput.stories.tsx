/*
 * The catalog for TagsInput.
 *
 * Doc 07 §6 lists eight states and requires all of them to be here. This
 * component adds three things to photograph that no other field has, and they
 * are the ones to actually look at:
 *
 *   1. **A box that grows.** Every other field is one line tall forever. Watch
 *      the height at 320px, where a row of tags has to wrap and the box that
 *      lined up with a Button on one line stops being able to.
 *   2. **A second focus ring.** A tag is focusable and so is the cross inside
 *      it. There must never be two rings at once.
 *   3. **Who says a duplicate was refused.** The field refuses it; the message
 *      is the project's. `Duplicates` below is the whole division of doc 07 §1
 *      in twenty lines.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfigProvider } from '../../config';
import { normalize, stripSpaces, upperCase } from '../../normalize';
import { TagsInput, type TagsInputSize } from './TagsInput';

const SIZES: TagsInputSize[] = ['sm', 'md', 'lg'];

const FEW = ['ada', 'grace'];
const MANY = [
  'accounting',
  'invoicing',
  'reconciliation',
  'payroll',
  'inventory',
  'purchasing',
  'reporting'
];

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
  title: 'Components/TagsInput',
  component: TagsInput,
  args: { label: 'Tags', placeholder: 'Add a tag' },
  argTypes: { size: { control: 'select', options: SIZES } }
} satisfies Meta<typeof TagsInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: { defaultValue: FEW } };

/**
 * All eight states from doc 07 §6, on one page.
 *
 * Read this one for **disabled against read-only** as much as for the states.
 * Read-only removes the box entirely — the page's own background and no
 * visible edge, so the tags read as text — and it keeps them reachable,
 * because a tag you cannot reach is a tag you cannot copy. Disabled keeps the
 * box and greys it, and takes the tags out of the tab order with it. Neither
 * offers a cross.
 *
 * **Loading** and **saving** are the ones to compare by eye: the crosses are
 * still exactly where they were, still the same width, and nothing can be
 * pressed. Doc 07 §2.2 rule 1 — unreachable, not absent.
 */
export const States: Story = {
  render: () => (
    <div
      className="catalog-stack"
      style={{ maxWidth: 420, gap: 'var(--bb-field-gap)' }}
    >
      <TagsInput label="Empty" placeholder="Nothing added yet" />
      <TagsInput label="With tags" defaultValue={FEW} />
      <TagsInput
        label="With description"
        defaultValue={FEW}
        description="Type a name and press Enter, or paste a list."
      />
      <TagsInput
        label="Invalid"
        defaultValue={['ada', 'grace']}
        description="Type a name and press Enter, or paste a list."
        isInvalid
        errorMessage="“grace” is already an owner of this record."
      />
      <TagsInput label="Required" isRequired placeholder="At least one" />
      <TagsInput label="Disabled" defaultValue={FEW} isDisabled />
      <TagsInput label="Read only" defaultValue={FEW} isReadOnly />
      <TagsInput label="Loading" defaultValue={FEW} isLoading />
      <TagsInput label="Saving" defaultValue={FEW} isSaving />
    </div>
  )
};

/*
 * The interactive stories are declared as components rather than written
 * inline, so the hook rules apply to them the way they apply to shipped code.
 */

function Separators() {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div className="catalog-stack" style={{ maxWidth: 420, gap: 12 }}>
      <TagsInput
        label="Keywords"
        placeholder="alpha, beta; gamma|delta"
        value={tags}
        onChange={setTags}
        description="Comma, semicolon, pipe or Enter — any of the four commits the value before it."
      />
      <pre className="catalog-label" style={{ margin: 0 }}>
        {JSON.stringify(tags)}
      </pre>
    </div>
  );
}

/**
 * **The four separators.** Type `alpha, beta; gamma|delta` straight through:
 * four tags, no reach for the mouse, and no separator left anywhere in the
 * box.
 *
 * Then press `Enter` on an empty box. Nothing happens here, and that is the
 * point — the key belongs to the level above, which in a real form is the
 * submit. Doc 09 §8: a key means the same thing everywhere, and a field that
 * swallowed the submit key of the form it sits in would be the one exception
 * that costs the other components their credibility. `Escape` is never taken
 * either, for the same reason.
 *
 * The array below is the value the consumer holds. The field never holds a
 * string with commas in it.
 */
export const FourSeparators: Story = { render: () => <Separators /> };

function Pasting() {
  const [tags, setTags] = useState<string[]>(['accounting']);

  return (
    <div className="catalog-stack" style={{ maxWidth: 420, gap: 12 }}>
      <TagsInput
        label="Cost centres"
        placeholder="Paste a column here"
        value={tags}
        onChange={setTags}
        description="Copy a column out of a spreadsheet and paste it in."
      />
      <pre
        className="catalog-label"
        style={{ margin: 0, whiteSpace: 'pre-wrap' }}
      >
        {JSON.stringify(tags)}
      </pre>
      <p className="catalog-label" style={{ margin: 0 }}>
        Try each of these, copied to the clipboard:
        {'  '}
        <code>invoicing, payroll, inventory</code> ·{' '}
        <code>purchasing;reporting</code> · a column of cells from a
        spreadsheet, which arrives newline-separated.
        {'  '}
        Then paste <code>lovelace</code> on its own: no separator in it, so it
        is just text and goes in at the caret.
      </p>
    </div>
  );
}

/**
 * **A pasted block being split**, which is the reason this is not a TextField.
 *
 * A paste containing a separator is a block of values: it is split, every
 * piece is committed **including the last**, and the box is left empty. A
 * paste with no separator in it is just text and goes in at the caret like any
 * other paste.
 *
 * The last piece is where the two differ on purpose. `a, b, c` typed leaves
 * `c` in the box, because it is still being typed and might become `carlos`.
 * The same string pasted commits `c`, because a pasted block is finished.
 *
 * Put the caret in the middle of a half-typed value and paste a block: what
 * was already typed joins the first pasted piece, so `al` plus `pha, beta` is
 * two tags and not three.
 */
export const PastingABlock: Story = { render: () => <Pasting /> };

function Backspacing() {
  const [tags, setTags] = useState(MANY.slice(0, 4));

  return (
    <div className="catalog-stack" style={{ maxWidth: 420, gap: 12 }}>
      <TagsInput
        label="Modules"
        placeholder="Empty — press Backspace"
        value={tags}
        onChange={setTags}
      />
      <pre className="catalog-label" style={{ margin: 0 }}>
        {JSON.stringify(tags)}
      </pre>
    </div>
  );
}

/**
 * **Backspace in an empty box removes the last tag** — expected, and the thing
 * everybody forgets.
 *
 * Put the cursor in the box and hold `Backspace`: the tags come off one at a
 * time from the end. Type something first and `Backspace` edits what you
 * typed instead, which is the half that makes the first half safe.
 *
 * The other keyboard route is the tags themselves. Arrow into them and press
 * `Delete` or `Backspace` on one — that is the base's own tag behaviour, and
 * the arrows follow the reading direction, so they run the other way in the
 * RTL panel further down. When the last tag goes, focus comes back to the box:
 * doc 06 §3 wants a predictable destination after a delete, and the box is
 * where you were going anyway.
 */
export const BackspaceRemovesTheLast: Story = {
  render: () => <Backspacing />
};

function Duplicates() {
  const [tags, setTags] = useState(['ada', 'grace']);
  const [refused, setRefused] = useState<string | null>(null);

  return (
    <div className="catalog-stack" style={{ maxWidth: 420, gap: 12 }}>
      <TagsInput
        label="Owners"
        placeholder="Try adding ada again"
        value={tags}
        onChange={next => {
          setRefused(null);
          setTags(next);
        }}
        onDuplicate={setRefused}
        isInvalid={refused !== null}
        {...(refused === null
          ? {}
          : {
              errorMessage: `“${refused}” is already an owner of this record.`
            })}
        description="Type a name and press Enter, or paste a list."
      />
      <pre className="catalog-label" style={{ margin: 0 }}>
        {JSON.stringify(tags)}
      </pre>
    </div>
  );
}

/**
 * **Duplicates, and who says so.** Doc 07 §1's whole division in twenty lines
 * of consumer code.
 *
 * Type `ada` again. The field **refuses** it — that is input restriction and
 * it belongs to the library. It does not tell you why, because the message is
 * text somebody reads, in their language, about their data: `onDuplicate`
 * names the value that did not get in and this story turns it into
 * `errorMessage`. A field that accepted the same value twice would be wrong,
 * and one that dropped it in silence would be wrong the other way.
 *
 * **The normalizer is the duplicate policy.** Two values are the same when
 * they are the same after normalizing, so `normalize={lowerCase}` is how a
 * project asks for case-insensitive tags — it makes the stored values
 * canonical rather than making the comparison lie about them. Nothing here is
 * case-insensitive, so `ADA` is a second, different owner.
 *
 * Also note what the error does NOT do: it names a value the project judged,
 * and the field only presented it. There is no per-value validation prop and
 * there is no maximum count — a maximum reads as input restriction and a
 * minimum is validation, and both are the project's judgement (doc 07 §1).
 */
export const DuplicatesAndTheError: Story = { render: () => <Duplicates /> };

function Normalized() {
  const [codes, setCodes] = useState(['AB-1']);

  return (
    <div className="catalog-stack" style={{ maxWidth: 420, gap: 12 }}>
      <TagsInput
        label="Part codes"
        placeholder="ab 1, cd 2"
        value={codes}
        onChange={setCodes}
        normalize={normalize(upperCase, stripSpaces)}
        description="Upper case, spaces stripped — in that order."
      />
      <pre className="catalog-label" style={{ margin: 0 }}>
        {JSON.stringify(codes)}
      </pre>
    </div>
  );
}

/**
 * **Normalization runs on a value, not on the draft**, which is the one place
 * this field differs from `TextField`.
 *
 * Type `ab 1,` and watch the box while you do it: nothing is rewritten under
 * the cursor. The value is only canonicalised at the moment it becomes a tag.
 *
 * That is not a shortcut, it is the only order that works. A pipeline that
 * drops the separator — `allowOnly(/[A-Z0-9]/)` drops a comma — would make the
 * field impossible to commit anything with if it ran while typing. The upside
 * is that doc 07 §2.1's caret problem does not arise here at all: there is no
 * cursor to put back.
 *
 * The order still matters and is still the consumer's: `upperCase` then
 * `stripSpaces` is not the same pipeline as the reverse, and five booleans
 * would have had no order at all.
 */
export const Normalization: Story = { render: () => <Normalized /> };

/**
 * **The hit area and the growing box, at both densities.** This is the check
 * to actually make.
 *
 * The cross is drawn at 14px and 11px, and if the button were the size of the
 * cross it would fail doc 06 §3 in both columns. It is not: both axes take
 * `--bb-control-hit-area`, so the target measures 28px normal and 24px
 * compact. Point at the far corner of a cross in the compact column — it
 * still hits.
 *
 * Then measure the empty fields against a Button of the same size. With one
 * row the box is exactly the control height, at every size and both
 * densities, because the vertical padding is small enough that
 * `hit + padding` never exceeds it. That is what keeps a tags field in a row
 * of fields and buttons (doc 03 §9), and it is only true while the tags fit on
 * one line — the last field in each column is what happens when they do not.
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
              <TagsInput
                key={size}
                label={`Size ${size}`}
                size={size}
                defaultValue={FEW}
              />
            ))}
            <TagsInput label="Busy" defaultValue={FEW} isLoading />
            <TagsInput label="Wrapped" defaultValue={MANY} />
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
            <TagsInput label="With tags" defaultValue={FEW} />
            <TagsInput label="Empty" placeholder="Add a tag" />
            <TagsInput
              label="Invalid"
              defaultValue={FEW}
              isInvalid
              errorMessage="“grace” is already an owner of this record."
            />
            <TagsInput label="Read only" defaultValue={FEW} isReadOnly />
            <TagsInput label="Disabled" defaultValue={FEW} isDisabled />
            <TagsInput label="Loading" defaultValue={FEW} isLoading />
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * RTL. Nothing in the component is measured physically, so the tags, the
 * crosses, the box padding, the busy indicator, the label and the asterisk all
 * move to the other side on their own (doc 03 §5, rule 4).
 *
 * The half that is not CSS: **the arrow keys follow the reading direction
 * too.** The base builds its keyboard delegate from the locale, so in the RTL
 * panel `ArrowLeft` moves to the NEXT tag rather than the previous one. Arrow
 * through both panels and compare — that is not something a class can do, and
 * it is a reason to have taken the base's tag group rather than written one.
 *
 * The cross itself is not directional and is not mirrored. Doc 05 §4: only
 * meaning decides, and a cross means the same thing in both directions.
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <TagsInput label="Owners" defaultValue={FEW} />
          <TagsInput label="Required" isRequired defaultValue={FEW} />
          <TagsInput label="Loading" defaultValue={FEW} isLoading />
        </div>
      </Scope>
      <ConfigProvider locale="ar-EG">
        <Scope label="RTL" dir="rtl">
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <TagsInput label="المالكون" defaultValue={['عدا', 'غريس']} />
            <TagsInput label="مطلوب" isRequired defaultValue={['عدا']} />
            <TagsInput label="جار التحميل" defaultValue={['عدا']} isLoading />
          </div>
        </Scope>
      </ConfigProvider>
    </div>
  )
};

/**
 * The library ships English only; a project injects the rest. Nothing here is
 * detected — the language is passed in.
 *
 * The cross is the thing to check. React Aria supplies its own localised name
 * for a tag's remove button, and this component replaces it with the
 * dictionary key `remove` — the same key Badge uses, so one translated word
 * covers every cross in the library rather than half of them.
 *
 * One string in this component is still React Aria's and is not reachable from
 * the dictionary: the hint each tag carries for screen reader users, "Press
 * Delete to remove tag". It is translated — the base ships thirty-odd locales
 * — just not by the project.
 */
export const Translated: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default (English)">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <TagsInput label="Owners" defaultValue={FEW} />
          <TagsInput label="Owners" defaultValue={FEW} isLoading />
        </div>
      </Scope>
      <ConfigProvider
        locale="es-PE"
        dictionary={{
          remove: 'Quitar',
          loading: 'Cargando',
          fieldLoading: 'Cargando'
        }}
      >
        <Scope label="Spanish, injected by the project">
          <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
            <TagsInput label="Responsables" defaultValue={FEW} />
            <TagsInput label="Responsables" defaultValue={FEW} isLoading />
          </div>
        </Scope>
      </ConfigProvider>
    </div>
  )
};

/**
 * A brand override. Level 1 of the customisation contract (doc 03 §7): the
 * brand scale is redefined and the semantic tokens recompute on their own, so
 * the focus ring on a tag and on the cross inside it follow without the
 * component knowing a theme changed.
 *
 * Arrow onto a tag, then `Tab` onto its cross. **There must never be two rings
 * at once** — the tag draws one when it is itself keyboard-focused, the cross
 * draws its own, and neither draws while the other does.
 */
export const BrandOverride: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Default brand">
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <TagsInput label="Owners" defaultValue={FEW} />
          <TagsInput label="Required" isRequired defaultValue={FEW} />
        </div>
      </Scope>
      <div className="catalog-panel" data-bb-theme="catalog-alt">
        <p className="catalog-label">Overridden brand</p>
        <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
          <TagsInput label="Owners" defaultValue={FEW} />
          <TagsInput label="Required" isRequired defaultValue={FEW} />
        </div>
      </div>
    </div>
  )
};

/**
 * **A 320px container, which is the story this component exists to pass.**
 *
 * Pseudo-localised labels and a narrow panel together — the two cheapest ways
 * to break a form, and the container that matters, since a tags field very
 * often lives in a side panel inside a wide screen (P4). Resize the panel and
 * not the window: a narrow container inside a wide one is the real situation,
 * and there is no viewport query anywhere in this component to respond to a
 * window anyway.
 *
 * What to look at, in order:
 *
 *   1. **The rows wrap and the box grows.** Nothing overflows sideways and no
 *      horizontal scrollbar appears.
 *   2. **The box you type in drops to a line of its own** when less than about
 *      eight characters of room is left beside the last tag, instead of being
 *      squeezed to nothing.
 *   3. **One very long value ends in an ellipsis** rather than forcing the box
 *      wider than the panel. The last field is that case on purpose.
 *   4. **The reserved room at the trailing end.** It is there in every state,
 *      not only while busy — 36px is enough to push a tag onto a new line, and
 *      a field that changed height the moment it started saving would move
 *      every field under it (doc 07 §2.2 rule 1, doc 09 §3).
 */
export const NarrowAndLongLabels: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack" style={{ gap: 'var(--bb-field-gap)' }}>
        <TagsInput
          label="Etiquetas de clasificación del comprobante"
          description="Escribe una y pulsa Enter, o pega una lista completa."
          defaultValue={MANY}
        />
        <TagsInput
          label="Centros de costo"
          defaultValue={MANY.slice(0, 4)}
          isSaving
        />
        <TagsInput
          label="Responsables"
          defaultValue={['ada']}
          isInvalid
          errorMessage="“ada” ya es responsable de este registro."
        />
        <TagsInput
          label="Un valor muy largo"
          defaultValue={[
            'Augusta Ada Byron King, Condesa de Lovelace',
            'reconciliación'
          ]}
        />
      </div>
    </div>
  )
};

function ModulesForm() {
  const [tags, setTags] = useState(['accounting', 'payroll']);

  return (
    <div
      className="catalog-stack"
      style={{ maxWidth: 420, gap: 'var(--bb-field-gap)' }}
    >
      <TagsInput
        label="Modules"
        placeholder="Add a module"
        value={tags}
        onChange={setTags}
        description="Comma, semicolon, pipe or Enter. Paste a list to add several."
      />
      <p className="catalog-label" style={{ margin: 0 }}>
        {tags.length === 0
          ? 'No modules selected.'
          : `${tags.length} selected: ${tags.join(' · ')}`}
      </p>
    </div>
  );
}

/**
 * **What the component is for**, and the shape of the value a consumer holds:
 * a `string[]`, in the order the person put them in, with no separator
 * anywhere.
 *
 * Traverse the whole thing without touching the mouse — two minutes, and it
 * finds nearly everything serious. Type two values with commas; `Backspace`
 * one off; arrow into the tags and `Delete` one from the middle, then notice
 * where focus went; `Tab` onto a cross and press `Enter`; empty the field
 * completely and notice that focus came back to the box rather than being
 * stranded on something that no longer exists.
 */
export const InAForm: Story = { render: () => <ModulesForm /> };
