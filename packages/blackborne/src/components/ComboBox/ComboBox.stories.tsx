/*
 * The visual catalog for ComboBox — a field with a layer hanging off it, so
 * its stories come in two kinds, the same split `Select`'s have.
 *
 * The closed ones are field stories: every state doc 07 §6 asks for, and this
 * field has all eight of them, which the select does not — you can type in it,
 * so read-only means something here.
 *
 * The open ones use the shared `LayerPage`, because the list is portalled: a
 * theme axis reaches it only because it is mounted inside the element that
 * declares one.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LayerPage } from '../../catalog/layerPage';
import { Button } from '../Button';
import { Force } from '../../catalog/forceState';
import { TextField } from '../TextField';
import { ComboBox, ComboBoxItem, type ComboBoxSize } from './ComboBox';

const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly ComboBoxSize[];

/** One scope of the theme axes, with a label. */
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
 * The input, focused for real.
 *
 * `Force` cannot do this one, for the reason `Select`'s copy of it records: the
 * ring is keyed off `data-focus-within` on the GROUP that draws the box, and
 * the state has to be reported by the base rather than written onto the
 * control. Only one element in a document can hold focus, so exactly one row
 * in this catalog may ask for it.
 */
function Focused({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // preventScroll, or opening the docs page jumps to this row.
    ref.current
      ?.querySelector<HTMLElement>('.bb-combobox-input')
      ?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

/**
 * The list, open — which for a combo box means pressing its toggle.
 *
 * **There is no `defaultOpen` here, and that is the base's shape rather than
 * an omission.** A select can be told to start open; a combo box cannot — its
 * state carries a menu trigger and an open callback and no way in from
 * outside. Which is consistent rather than awkward: a list that narrows to
 * what you type belongs to the person typing, and one that is open before
 * anybody has arrived has answered a question nobody asked.
 *
 * So these stories press the toggle, which is what a person with a pointer
 * does. **Opening it on focus was tried first and produced a dishonest
 * picture**: the list opened before the base had put the chosen option's text
 * into the input, and the base does not overwrite that text while the list is
 * open — reasonably, since somebody may be typing into it. The baseline was a
 * field showing its placeholder with an option ticked in the list below, which
 * is a state nobody can reach by using the component. Measured rather than
 * noticed: both rows looked plausible enough.
 *
 * One open story per page all the same, because a list is a layer and two open
 * at once photograph each other.
 */
function Opened({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /*
     * AFTER THE NEXT PAINT, and the delay is not superstition. The base builds
     * its collection in a render pass of its own and puts the chosen option's
     * text into the input a commit later — so a click in this effect, parent
     * or not, still lands before the text does, and the base will not
     * overwrite the input while the list is open. Measured twice: a layout
     * effect and then a passive one both produced a field showing its
     * placeholder with an option ticked below it.
     */
    const frame = requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLElement>('.bb-combobox-toggle')?.click();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

/*
 * The fixture, and it is a fixture with a POINT: every doctor carries words
 * that are not on the row. Typing "cardio" finds one of them, and nothing on
 * screen says the word "cardiology" — which is the feature, and also the
 * reason a matched row is not highlighted.
 *
 * Shared as a VALUE and not as a component. `<Doctors />` returning these
 * would be one element whose type is `Doctors`, and an option is a declaration
 * the field reads — the constraint that cost `Tabs` a story that rendered
 * nothing.
 */
const doctors = (
  <>
    <ComboBoxItem id="ruiz" keywords={['cardiology', 'heart']}>
      José Ruiz
    </ComboBoxItem>
    <ComboBoxItem id="vega" keywords={['paediatrics', 'neonatology']}>
      Ana Vega
    </ComboBoxItem>
    <ComboBoxItem id="salas" keywords={['dermatology', 'skin']}>
      Luis Salas
    </ComboBoxItem>
    <ComboBoxItem id="prado" keywords={['radiology']}>
      Marta Prado
    </ComboBoxItem>
    <ComboBoxItem id="ortiz" keywords={['cardiology', 'surgery']}>
      Elena Ortiz
    </ComboBoxItem>
  </>
);

const meta = {
  title: 'Components/ComboBox',
  component: ComboBox,
  args: {
    label: 'Doctor',
    children: null,
    placeholder: 'Search by name or speciality'
  },
  argTypes: {
    size: { control: 'select', options: SIZES },
    onSelectionChange: { control: false }
  }
} satisfies Meta<typeof ComboBox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working combo box.
 *
 * **Worth doing with the keyboard, and worth typing into.** The down arrow
 * opens the whole list, typing narrows it, `Escape` closes it and puts the
 * chosen option's text back, and `Enter` takes the highlighted row.
 *
 * **Then type `cardio`.** Two doctors appear and neither row contains that
 * word: an option can be found by words it does not show, which is the reason
 * this component exists rather than being a `Select` with a text box. Type
 * `jose` without the accent, too — the collator is the platform's, so "jose"
 * finds "José".
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [doctor, setDoctor] = useState<string | null>(null);

      return (
        <div className="catalog-stack" style={{ maxWidth: 320 }}>
          <ComboBox
            {...args}
            selectedKey={doctor}
            onSelectionChange={setDoctor}
            description="Searchable by name and by speciality."
          >
            {doctors}
          </ComboBox>
          <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
            {doctor === null ? 'Nothing chosen yet.' : `Chosen: ${doctor}`}
          </p>
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * All eight states of doc 07 §6, and this field has all eight.
 *
 * **Read-only is the one a `Select` cannot have.** A select is either offered
 * or it is not; a combo box holds text you can read, select and copy, so "you
 * may not change this" is a state with something to show. Its toggle goes
 * unreachable with the value still readable — the room it takes stays, because
 * closing the gap would slide the text across (doc 07 §2.2 rule 1).
 *
 * **And there is no clear button in any of them.** Rule 5 of the same section:
 * the trailing edge belongs to the toggle, because a pointer has no other way
 * to ask for the whole list.
 */
export const States: Story = {
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 320 }}>
      <ComboBox {...args} label="Default">
        {doctors}
      </ComboBox>
      {/*
       * THE FRAME, not the input, and it is the lesson the helper has now
       * taught four times: a field's hover and focus appearance is on the box,
       * so an attribute written onto the control inside it matches no selector
       * and photographs identically to the default.
       */}
      <Force state="data-hovered" target=".bb-field-box">
        <ComboBox {...args} label="Hover">
          {doctors}
        </ComboBox>
      </Force>
      <Focused>
        <ComboBox {...args} label="Focus">
          {doctors}
        </ComboBox>
      </Focused>
      <ComboBox {...args} label="Chosen" defaultSelectedKey="vega">
        {doctors}
      </ComboBox>
      <ComboBox {...args} label="Required" isRequired>
        {doctors}
      </ComboBox>
      <ComboBox
        {...args}
        label="Invalid"
        isInvalid
        errorMessage="Choose a doctor."
      >
        {doctors}
      </ComboBox>
      <ComboBox
        {...args}
        label="Read-only"
        isReadOnly
        defaultSelectedKey="vega"
      >
        {doctors}
      </ComboBox>
      <ComboBox {...args} label="Disabled" isDisabled defaultSelectedKey="vega">
        {doctors}
      </ComboBox>
      <ComboBox {...args} label="Loading its options" isLoading>
        {doctors}
      </ComboBox>
      <ComboBox {...args} label="Saving" isSaving defaultSelectedKey="vega">
        {doctors}
      </ComboBox>
    </div>
  )
};

/** The three sizes, which are the same three every field and button has. */
export const Sizes: Story = {
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 320 }}>
      {SIZES.map(size => (
        <ComboBox {...args} key={size} size={size} label={size}>
          {doctors}
        </ComboBox>
      ))}
    </div>
  )
};

/**
 * The row that proves the system is one, with the control this field adds.
 *
 * A combo box carries a button inside its frame and a text field does not, so
 * this is the check that the button does not change the height: three controls
 * of the same size, one row, one baseline (doc 03 §9).
 */
export const AlignsWithOthers: Story = {
  name: 'Aligns with others',
  render: args => (
    <div className="catalog-stack">
      {SIZES.map(size => (
        <div key={size} className="catalog-row" style={{ alignItems: 'end' }}>
          {/*
           * The two fields are given a width, because they take the one they
           * are given: a field is `w-full`, so three in a flex row each ask
           * for the whole row and it wraps into a column.
           */}
          <div style={{ width: 180 }}>
            <TextField label="Reference" size={size} placeholder="INV-" />
          </div>
          <div style={{ width: 180 }}>
            <ComboBox {...args} size={size} label="Doctor">
              {doctors}
            </ComboBox>
          </div>
          <Button size={size}>Apply</Button>
        </div>
      ))}
    </div>
  )
};

/**
 * Open, with something chosen.
 *
 * **The list is as wide as the field**, which is the one anchored layer
 * behaviour this component shares with `Select` and no other layer has. And
 * the chosen option carries a **tick as well as weight**: the highlight says
 * where you are, the tick says what is chosen, and in a list you have just
 * opened those are two different rows.
 */
export const Open: Story = {
  render: args => (
    <LayerPage label="The page behind, so the list has something to sit on.">
      <Opened>
        <div style={{ width: 280 }}>
          <ComboBox {...args} defaultSelectedKey="vega">
            {doctors}
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/**
 * An empty list, and it says WHICH kind of empty.
 *
 * The base closes a list that has nothing in it; this one is told not to,
 * because a list that disappears leaves the person who opened it with no
 * answer at all. What the row says is doc 09's distinction, which this field
 * can make three ways: the options are still arriving, there are none to
 * arrive, or there are plenty and the query found none of them. Telling
 * somebody "no results" about a list that was never given any options blames
 * their query for somebody else's empty prop.
 *
 * This is the middle one — no options at all. The third needs somebody to
 * type, so it is asserted in the browser checks rather than photographed here.
 *
 * The row is a real option in the list, which is the base being right rather
 * than a quirk: a listbox with no rows announces nothing, and the person who
 * asked is the one who needs to hear the answer.
 */
export const NoOptions: Story = {
  name: 'No options',
  render: () => (
    <LayerPage label="The page behind.">
      <Opened>
        <div style={{ width: 280 }}>
          <ComboBox label="Doctor" placeholder="Search">
            {[]}
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/** Dark, where the raised surface is lighter than the page rather than
 * shadowed (doc 03 §5 rule 5). */
export const Dark: Story = {
  render: args => (
    <LayerPage mode="dark" label="The page behind.">
      <Opened>
        <div style={{ width: 280 }}>
          <ComboBox {...args} defaultSelectedKey="vega">
            {doctors}
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/** Compact: the density axis reaches the list because it is mounted inside the
 * page that declares it. */
export const Compact: Story = {
  render: args => (
    <LayerPage density="compact" label="The page behind.">
      <Opened>
        <div style={{ width: 280 }}>
          <ComboBox {...args} defaultSelectedKey="vega">
            {doctors}
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/**
 * RTL. The label, the typed text and the options read from the right, the
 * toggle moves to the left edge of the field, and the tick follows the options
 * — nothing in the component knows which side that is.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    /*
     * The fixture's own line is in English, as it is in every other layer
     * story — and it does NOT get this story's contrast checked, which is
     * worth saying because it looks as though it should. Measured on `Select`:
     * while the list is open the base marks everything outside it `inert`, and
     * axe's contrast rule does not look inside an inert subtree, so the only
     * text it reaches here is Arabic, which the same rule declines as an icon
     * ligature (doc 06 §5.1). The colours are checked by the Latin stories.
     */
    <LayerPage dir="rtl" locale="ar-EG" label="The page behind.">
      <Opened>
        <div style={{ width: 280 }}>
          <ComboBox label="الطبيب" placeholder="ابحث بالاسم">
            <ComboBoxItem id="ruiz">خوسيه رويز</ComboBoxItem>
            <ComboBoxItem id="vega">أنا فيغا</ComboBoxItem>
            <ComboBoxItem id="salas">لويس سالاس</ComboBoxItem>
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/**
 * An overridden brand, which has to reach the tick and the ring.
 *
 * The accent is the one colour this field uses for meaning rather than for
 * surface — the tick on the chosen option — and it is inside a portalled
 * layer, so this is the story that says whether a theme declared on the page
 * reaches it.
 */
export const BrandOverride: Story = {
  name: 'Brand override',
  render: args => (
    <LayerPage brand label="The page behind.">
      <Opened>
        <div style={{ width: 280 }}>
          <ComboBox {...args} defaultSelectedKey="vega">
            {doctors}
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/**
 * A long option, and a field narrower than it.
 *
 * The list may grow past the field — that is what `min-width` rather than
 * `width` buys — up to the narrow container, where it wraps. A list that
 * truncated every row to the field's width would hide the ends of the very
 * options somebody opened it to read.
 */
export const LongOptions: Story = {
  name: 'Long options',
  render: () => (
    <LayerPage label="The page behind.">
      <Opened>
        <div style={{ width: 200 }}>
          <ComboBox label="Cost centre" placeholder="Search">
            <ComboBoxItem id="a">Operations</ComboBoxItem>
            <ComboBoxItem id="b">
              Administration and general services, southern region
            </ComboBoxItem>
            <ComboBoxItem id="c">Maintenance</ComboBoxItem>
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/**
 * In a 320px panel, which is the entry gate's own question (P4).
 *
 * Nothing about this field is sized for a screen: the frame takes the width it
 * is given, the toggle keeps its minimum target, and the list matches the
 * field rather than the window.
 */
export const InANarrowPanel: Story = {
  name: 'In a narrow panel',
  render: args => (
    <div className="catalog-panel" style={{ width: 320 }}>
      <p className="catalog-label">A 320px side panel</p>
      <ComboBox {...args} defaultSelectedKey="prado">
        {doctors}
      </ComboBox>
    </div>
  )
};

/** Light, dark and compact, closed — the three scopes on one page. */
export const Together: Story = {
  render: args => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <ComboBox {...args} defaultSelectedKey="vega">
          {doctors}
        </ComboBox>
      </Scope>
      <Scope label="Dark" mode="dark">
        <ComboBox {...args} defaultSelectedKey="vega">
          {doctors}
        </ComboBox>
      </Scope>
      <Scope label="Compact" density="compact">
        <ComboBox {...args} defaultSelectedKey="vega">
          {doctors}
        </ComboBox>
      </Scope>
    </div>
  )
};
