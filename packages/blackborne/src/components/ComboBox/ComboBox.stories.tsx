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
import {
  ComboBox,
  ComboBoxItem,
  type ComboBoxOneProps,
  type ComboBoxSize
} from './ComboBox';
import { useAsyncOptions, type OptionsRequest } from './useAsyncOptions';

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
  /*
   * Typed to the ONE-VALUE branch rather than to the component, and it is not
   * a workaround so much as the union's one real cost: `args` typed as the
   * whole union cannot be spread and then added to, because
   * `{...args} defaultSelectedKey="x"` has to satisfy the plural branch as
   * well and cannot. A consumer writing a wrapper around this component meets
   * the same wall and takes the same way out — name the branch.
   *
   * The stories that hold several values write their props out instead.
   */
} satisfies Meta<ComboBoxOneProps>;

export default meta;
/*
 * `StoryObj<ComboBoxOneProps>` rather than `StoryObj<typeof meta>`, which is
 * the divergence from every other stories file here and has one cause: the
 * component's props are a UNION, and Storybook derives its args from the
 * component. `{...args}` then carries "maybe several values" into every story,
 * and adding `defaultSelectedKey` to it has to satisfy the plural branch as
 * well — which it cannot. Naming the branch is the same way out a consumer
 * writing a wrapper takes.
 */
type Story = StoryObj<ComboBoxOneProps>;

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
 * The rows, so the story below can render them once per mode.
 *
 * `focus` is a parameter rather than a row because only one of the two
 * panels may ask for it, for the reason `Focused` gives above: one element
 * in a document holds focus.
 */
function AllStates({
  args,
  focus
}: {
  args: ComboBoxOneProps;
  focus: boolean;
}) {
  return (
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
      {/*
       * Real focus, so it is in the panel that can hold it and not in both:
       * a second `Focused` would take the ring off the first and leave a row
       * labelled "Focus" with nothing to show.
       */}
      {focus ? (
        <Focused>
          <ComboBox {...args} label="Focus">
            {doctors}
          </ComboBox>
        </Focused>
      ) : null}
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
  );
}

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
 *
 * **And it is light AND dark**, which it was not until 2026-09-13. A
 * forced-state story is the only place a forced state is ever rendered, so a
 * light-only one leaves the hovered frame in dark mode measured by nothing at
 * all: axe reads what is on a page and the visual suite photographs one. What
 * lived in that gap on `Button` was a pressed primary at 2.08:1, under 501
 * stories, 480 axe runs and 211 baselines (doc 10 §11.9).
 */
export const States: Story = {
  render: args => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <AllStates args={args} focus />
      </Scope>
      <Scope label="Dark" mode="dark">
        <AllStates args={args} focus={false} />
      </Scope>
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

/* ------------------------------------------------------------------ several
 *
 * The same component holding more than one value. These stories write their
 * props out rather than spreading `args`, because the props are a union and a
 * spread carries "maybe several" into a story that means one — the reason the
 * `Story` type above names a branch.
 */

/**
 * Several values, each shown as a chip inside the field.
 *
 * **Worth doing with the keyboard and worth doing twice.** Choosing one leaves
 * the list open and empties the box, so the next one is one press away — the
 * base's behaviour, and the thing that makes picking a rota bearable. Each
 * chip's cross is a tab stop that says what it removes: "Remove Ana Vega".
 *
 * **The box grows and the toggle does not move.** The chips and the draft
 * input share one wrapping flow INSIDE the frame, so a fourth chip adds a line
 * to the field rather than pushing the toggle onto one of its own.
 *
 * **The chips are not the base's tags**, which is measured rather than chosen:
 * a `TagGroup` inside a `ComboBox` resolves the combo box's own list state and
 * either exhausts the heap or throws. What that costs is the arrow-key walk
 * along the chips; what it does not cost is the announcement, which the base
 * still supplies through the field's own description.
 */
export const Several: Story = {
  render: () => {
    function Demo() {
      const [team, setTeam] = useState<readonly string[]>(['vega']);

      return (
        <div className="catalog-stack" style={{ maxWidth: 320 }}>
          <ComboBox
            label="Doctors"
            selectionMode="multiple"
            placeholder="Search by name or speciality"
            description="Everyone on this rota."
            selectedKeys={team}
            onSelectionChange={setTeam}
          >
            {doctors}
          </ComboBox>
          <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
            {team.length === 0 ? 'Nobody yet.' : `Chosen: ${team.join(', ')}`}
          </p>
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * The states that change when a field holds several values.
 *
 * **Read-only and disabled both keep the chips and take the crosses away**,
 * for the reason doc 07 §6 separates them: a read-only value can be read,
 * selected and copied, and a value you cannot see is not read-only, it is
 * gone. What differs between the two rows is the fill and the text, as it is
 * on every other field.
 *
 * **Saving keeps the cross and puts it out of reach** — doc 07 §2.2 rule 1
 * inside the chip. A cross that disappeared would re-wrap every chip behind it
 * at the moment somebody is waiting for the save.
 *
 * And the last row is the one to look at: **four values, and the field is two
 * lines tall with its toggle still at the top right of the box.**
 */
export const SeveralStates: Story = {
  name: 'Several · states',
  render: () => (
    <div className="catalog-stack" style={{ maxWidth: 320 }}>
      <ComboBox label="Empty" selectionMode="multiple" placeholder="Search">
        {doctors}
      </ComboBox>
      <ComboBox
        label="With two"
        selectionMode="multiple"
        defaultSelectedKeys={['vega', 'salas']}
      >
        {doctors}
      </ComboBox>
      <ComboBox
        label="Invalid"
        selectionMode="multiple"
        defaultSelectedKeys={['vega']}
        isInvalid
        errorMessage="Choose at least two."
      >
        {doctors}
      </ComboBox>
      <ComboBox
        label="Read-only"
        selectionMode="multiple"
        defaultSelectedKeys={['vega', 'salas']}
        isReadOnly
      >
        {doctors}
      </ComboBox>
      <ComboBox
        label="Disabled"
        selectionMode="multiple"
        defaultSelectedKeys={['vega', 'salas']}
        isDisabled
      >
        {doctors}
      </ComboBox>
      <ComboBox
        label="Saving"
        selectionMode="multiple"
        defaultSelectedKeys={['vega', 'salas']}
        isSaving
      >
        {doctors}
      </ComboBox>
      <ComboBox
        label="Four, so the box grows"
        selectionMode="multiple"
        defaultSelectedKeys={['ruiz', 'vega', 'salas', 'prado']}
      >
        {doctors}
      </ComboBox>
    </div>
  )
};

/**
 * Several values in a 320px panel, which is the entry gate's own question.
 *
 * The chips wrap inside the box; one long enough to fill a line truncates
 * rather than forcing the panel wider (P4: 320px is a real width, and a field
 * that overflows its panel takes the layout with it).
 */
export const SeveralInANarrowPanel: Story = {
  name: 'Several · in a narrow panel',
  render: () => (
    <div className="catalog-panel" style={{ width: 320 }}>
      <p className="catalog-label">A 320px side panel</p>
      <ComboBox
        label="Doctors"
        selectionMode="multiple"
        defaultSelectedKeys={['ruiz', 'vega', 'salas', 'prado', 'ortiz']}
      >
        {doctors}
      </ComboBox>
    </div>
  )
};

/**
 * Open, with two already chosen.
 *
 * Both are ticked, and the list stays open as they are picked — so the ticks
 * and the chips are the same value in two places, which is what the tick is
 * for in a list you did not just open.
 */
export const SeveralOpen: Story = {
  name: 'Several · open',
  render: () => (
    <LayerPage label="The page behind.">
      <Opened>
        <div style={{ width: 300 }}>
          <ComboBox
            label="Doctors"
            selectionMode="multiple"
            defaultSelectedKeys={['vega', 'salas']}
          >
            {doctors}
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/* -------------------------------------------------------- from a source
 *
 * Options that arrive from somewhere. The loader here is a function over a
 * local array with a delay in front of it — no network, which is P2 and also
 * what makes these stories deterministic enough to photograph.
 */

/*
 * A roster long enough for the paging to be the point.
 *
 * Sixty rather than twelve, and the number is a measurement rather than a
 * flourish: the base's sentinel triggers when it comes within ONE list-height
 * of the fold — `scrollOffset` defaults to 100% — so a first page that only
 * just fills the box loads the second one immediately, with nobody scrolling.
 * Twenty rows of sixty is past that, so the second page waits to be asked for.
 */
const FIRST_NAMES = [
  'Ana',
  'Elena',
  'José',
  'Luis',
  'Marta',
  'Nadia',
  'Óscar',
  'Pablo',
  'Rosa',
  'Sofía'
];

const SURNAMES = ['Vega', 'Ortiz', 'Salas', 'Prado', 'Cruz', 'Medina'];

const ROSTER = SURNAMES.flatMap((surname, block) =>
  FIRST_NAMES.map((first, index) => ({
    id: String(block * FIRST_NAMES.length + index + 1),
    name: `${first} ${surname}`
  }))
);

const PAGE_SIZE = 20;

/**
 * A loader over the roster, with a delay.
 *
 * The page size is closed over rather than passed in, which is the whole
 * argument for it living here: how many rows to fetch is the request's
 * business, not the field's.
 */
const rosterLoader =
  (delay = 400) =>
  async ({ query, cursor }: OptionsRequest) => {
    await new Promise(resolve => {
      setTimeout(resolve, delay);
    });

    const matching = ROSTER.filter(doctor =>
      doctor.name.toLowerCase().includes(query.toLowerCase())
    );
    const from = cursor === undefined ? 0 : Number(cursor);
    const items = matching.slice(from, from + PAGE_SIZE);
    const next = from + PAGE_SIZE;

    return {
      items,
      ...(next < matching.length ? { cursor: String(next) } : {})
    };
  };

/**
 * Options loaded from somewhere, paged and debounced.
 *
 * **Worth typing into slowly and then quickly.** A run of keystrokes makes ONE
 * request, after the wait; the box shows what you typed the whole time, and
 * the list says it is thinking rather than showing the previous query's
 * answers as though they were current.
 *
 * **Then scroll the list.** It holds twenty at a time and asks for twenty
 * more when the end comes within a screen of the fold — and asking past the
 * last page asks for nothing at all, because a page with no cursor is how the
 * loader says there is an end.
 *
 * The loader is a function over an array with a delay in front of it. Nothing
 * in the library makes a request (P2); `load` is handed in, and a test hands
 * it an array.
 */
export const FromASource: Story = {
  name: 'From a source',
  render: () => {
    function Demo() {
      const [doctor, setDoctor] = useState<string | null>(null);
      /*
       * The requests are counted and shown, which is the interesting number in
       * this story: a run of keystrokes should cost ONE, and sixty rows arrive
       * in three. A ref does the counting, so counting cannot cause the render
       * that would count again; a piece of state carries it to the screen.
       */
      const requests = useRef(0);
      const [shown, setShown] = useState(0);
      const load = rosterLoader();
      const doctors = useAsyncOptions<{ id: string; name: string }>({
        load: async request => {
          requests.current += 1;
          setShown(requests.current);
          return load(request);
        }
      });

      return (
        <div className="catalog-stack" style={{ maxWidth: 320 }}>
          <ComboBox
            label="Doctor"
            placeholder="Search the roster"
            description="Twenty at a time, and more as you scroll."
            source={doctors}
            selectedKey={doctor}
            onSelectionChange={setDoctor}
          >
            {doctors.items.map(item => (
              <ComboBoxItem key={item.id} id={item.id}>
                {item.name}
              </ComboBoxItem>
            ))}
          </ComboBox>
          <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
            {doctor === null ? 'Nothing chosen yet.' : `Chosen: ${doctor}`}
          </p>
          <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
            {`Loaded ${doctors.items.length} · requests: ${shown}`}
          </p>
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * A list that is loading a further page, under the options already shown.
 *
 * The row at the end is the base's own sentinel: it watches for itself coming
 * into view and asks for one more page, which is how a list loads while
 * somebody scrolls rather than when they press something. It is a ROW of the
 * list rather than a bar under it, so a reader arrives at it like anything
 * else.
 */
export const LoadingMore: Story = {
  name: 'From a source · loading more',
  render: () => (
    <LayerPage label="The page behind.">
      <Opened>
        <div style={{ width: 280 }}>
          <ComboBox
            label="Doctor"
            source={{
              isLoading: false,
              isLoadingMore: true,
              error: undefined,
              isWaitingForQuery: false,
              query: '',
              onQueryChange: () => {},
              loadMore: () => {}
            }}
          >
            {ROSTER.slice(0, 3).map(item => (
              <ComboBoxItem key={item.id} id={item.id}>
                {item.name}
              </ComboBoxItem>
            ))}
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/**
 * The five things an empty list can say once its options come from somewhere,
 * and they are not interchangeable.
 *
 * Nothing has been asked for yet; the asking failed; the answer is on its way;
 * a query came back empty; or there was never anything to come back. Doc 09
 * asks for the last two to be told apart by name, and the first three are what
 * a loaded list adds to that.
 *
 * A list can only be open one at a time on a page, so this one is the state
 * hardest to reach by hand: a load that failed. **"Could not load" and not "no
 * results"** — blaming the query for a server's silence is the wrong answer to
 * the wrong person. What to do about it is the application's: typing again
 * asks again, and the hook hands over a `retry` for a control of your own.
 */
export const LoadFailed: Story = {
  name: 'From a source · load failed',
  render: () => (
    <LayerPage label="The page behind.">
      <Opened>
        <div style={{ width: 280 }}>
          <ComboBox
            label="Doctor"
            source={{
              isLoading: false,
              isLoadingMore: false,
              error: new Error('the server said no'),
              isWaitingForQuery: false,
              query: 'vega',
              onQueryChange: () => {},
              loadMore: () => {}
            }}
          >
            {[]}
          </ComboBox>
        </div>
      </Opened>
    </LayerPage>
  )
};

/**
 * A query too short to ask with.
 *
 * A catalogue of two hundred thousand rows is not a first page, so a field can
 * ask for two or three characters before it goes anywhere — and until then the
 * list says so rather than showing a page of nothing in particular.
 *
 * **The message carries no number**, which is deliberate: "type at least 3
 * characters" needs a placeholder inside a sentence, and how far doc 05 §2.2
 * rule 5's simple substitution stretches is a question the catalog has open
 * rather than one to settle in passing.
 */
export const WaitingForAQuery: Story = {
  name: 'From a source · waiting for a query',
  render: () => {
    function Demo() {
      /*
       * Counted here too, and this is the field where the number is legible:
       * with a minimum of three characters nothing is asked until the third
       * one lands, so typing four characters is ONE request and the paging
       * that muddies the count elsewhere never starts.
       */
      const requests = useRef(0);
      const [shown, setShown] = useState(0);
      const load = rosterLoader(200);
      const doctors = useAsyncOptions<{ id: string; name: string }>({
        minQueryLength: 3,
        load: async request => {
          requests.current += 1;
          setShown(requests.current);
          return load(request);
        }
      });

      return (
        <LayerPage label="The page behind.">
          <Opened>
            <div style={{ width: 280 }}>
              <ComboBox
                label="Doctor"
                placeholder="At least three characters"
                description={`Requests: ${shown}`}
                source={doctors}
              >
                {doctors.items.map(item => (
                  <ComboBoxItem key={item.id} id={item.id}>
                    {item.name}
                  </ComboBoxItem>
                ))}
              </ComboBox>
            </div>
          </Opened>
        </LayerPage>
      );
    }

    return <Demo />;
  }
};
