/*
 * The visual catalog for Select — the first component that is both a field and
 * a layer, so its stories come in two kinds.
 *
 * The closed ones are field stories: every state doc 07 §6 asks for, and the
 * row that proves a select, a text field and a button of the same size line up
 * (doc 03 §9).
 *
 * The open ones are layer stories, and they use the shared `LayerPage` because
 * the list is portalled: a theme axis reaches it only because it is mounted
 * inside the element that declares one.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useLayoutEffect, useRef, useState } from 'react';
import { LayerPage } from '../../catalog/layerPage';
import { Button } from '../Button';
import { Force } from '../../catalog/forceState';
import { TextField } from '../TextField';
import { Select, SelectItem, type SelectSize } from './Select';

const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly SelectSize[];

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
 * The trigger, focused for real.
 *
 * `Force` cannot do this one, for the reason `PasswordField`'s copy of it
 * records: the ring is keyed off `data-focus-within` on the GROUP that draws
 * the box, and the state has to be reported by the base rather than written
 * onto the button — which reports `data-focused` on itself and paints nothing,
 * because a field's appearance belongs to its frame.
 *
 * Only one element in a document can hold focus, so exactly one row in this
 * catalog may ask for it.
 */
function Focused({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // preventScroll, or opening the docs page jumps to this row.
    ref.current
      ?.querySelector<HTMLElement>('.bb-select-trigger')
      ?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

const CURRENCIES = [
  ['PEN', 'Peruvian sol'],
  ['USD', 'US dollar'],
  ['EUR', 'Euro'],
  ['CLP', 'Chilean peso'],
  ['BRL', 'Brazilian real']
] as const;

const Options = () => (
  <>
    {CURRENCIES.map(([id, name]) => (
      <SelectItem key={id} id={id}>
        {name}
      </SelectItem>
    ))}
  </>
);

const meta = {
  title: 'Components/Select',
  component: Select,
  args: { label: 'Currency', children: null, placeholder: 'Choose one' },
  argTypes: {
    size: { control: 'select', options: SIZES },
    onSelectionChange: { control: false }
  }
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A working select.
 *
 * **Worth doing with the keyboard**, because a select gives you a list without
 * a text box and the difference is the point: `Enter` or the down arrow opens
 * it with the chosen option highlighted, the arrows move, typing `u` jumps to
 * US dollar, `Escape` closes it without changing anything, and `Enter` takes
 * the highlighted one. There is no typing INTO it — for a list long enough to
 * need that, the component is a `ComboBox`.
 */
export const Overview: Story = {
  render: args => {
    function Demo() {
      const [currency, setCurrency] = useState<string | null>(null);

      return (
        <div className="catalog-stack" style={{ maxWidth: 320 }}>
          <Select
            {...args}
            selectedKey={currency}
            onSelectionChange={setCurrency}
            description="Every invoice is issued in this currency."
          >
            <Options />
          </Select>
          <p className="catalog-label" style={{ marginBlockEnd: 0 }}>
            {currency === null ? 'Nothing chosen yet.' : `Chosen: ${currency}`}
          </p>
        </div>
      );
    }

    return <Demo />;
  }
};

/**
 * Every state doc 07 §6 asks for, minus one that does not exist here.
 *
 * **There is no read-only select**, because the base has none and the reason is
 * sound: a select is either offered or it is not. Read-only belongs to the
 * fields you can type in, where "you may not change this" and "this is
 * switched off" look different in the value.
 */
export const States: Story = {
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 320 }}>
      <Select {...args} label="Default">
        <Options />
      </Select>
      {/*
       * THE FRAME, not the trigger, and it is the whole lesson of the helper
       * arriving a third time: a field's hover and focus appearance is on the
       * box, so an attribute written onto the button inside it matches no
       * selector and photographs identically to the default. Found by looking
       * at the first baseline — nothing else could have found it.
       */}
      <Force state="data-hovered" target=".bb-field-box">
        <Select {...args} label="Hover">
          <Options />
        </Select>
      </Force>
      <Focused>
        <Select {...args} label="Focus">
          <Options />
        </Select>
      </Focused>
      <Select {...args} label="Chosen" defaultSelectedKey="USD">
        <Options />
      </Select>
      <Select {...args} label="Disabled" isDisabled defaultSelectedKey="USD">
        <Options />
      </Select>
      <Select
        {...args}
        label="Invalid"
        isInvalid
        errorMessage="Choose a currency."
      >
        <Options />
      </Select>
      <Select {...args} label="Required" isRequired>
        <Options />
      </Select>
      <Select {...args} label="Loading its options" isLoading>
        <Options />
      </Select>
      <Select {...args} label="Saving" isSaving defaultSelectedKey="USD">
        <Options />
      </Select>
    </div>
  )
};

/** The three sizes, which are the same three every field and button has. */
export const Sizes: Story = {
  render: args => (
    <div className="catalog-stack" style={{ maxWidth: 320 }}>
      {SIZES.map(size => (
        <Select {...args} key={size} size={size} label={size}>
          <Options />
        </Select>
      ))}
    </div>
  )
};

/**
 * The row that proves the system is one.
 *
 * A select, a text field and a button of the same size have the same height,
 * from the same tokens — doc 03 §9 asks for this check by name, and it is one
 * of the details that most gives away a set of components that were built
 * separately.
 */
export const AlignsWithOthers: Story = {
  name: 'Aligns with others',
  render: args => (
    <div className="catalog-stack">
      {SIZES.map(size => (
        <div key={size} className="catalog-row" style={{ alignItems: 'end' }}>
          {/*
           * The two fields are given a width, because they take the one they
           * are given: a field is `w-full`, so three of them in a flex row
           * each ask for the whole row and the row wraps into a column — which
           * is a picture of three controls that proves nothing about a row.
           */}
          <div style={{ width: 180 }}>
            <TextField label="Reference" size={size} placeholder="INV-" />
          </div>
          <div style={{ width: 180 }}>
            <Select {...args} size={size} label="Currency">
              <Options />
            </Select>
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
 * Two things to look at. **The list is as wide as the field** — the only
 * anchored layer in this library that is, because a list narrower than the
 * field it belongs to reads as a different control. And the chosen option
 * carries a **tick as well as weight**: the highlight says where you are and
 * the tick says what is chosen, which in a list you have just opened are two
 * different rows.
 */
export const Open: Story = {
  render: args => (
    <LayerPage label="The page behind, so the list has something to sit on.">
      <div style={{ width: 280 }}>
        <Select {...args} defaultOpen defaultSelectedKey="USD">
          <Options />
        </Select>
      </div>
    </LayerPage>
  )
};

/** Dark, where the raised surface is lighter than the page rather than
 * shadowed (doc 03 §5 rule 5). */
export const Dark: Story = {
  render: args => (
    <LayerPage mode="dark" label="The page behind.">
      <div style={{ width: 280 }}>
        <Select {...args} defaultOpen defaultSelectedKey="USD">
          <Options />
        </Select>
      </div>
    </LayerPage>
  )
};

/** Compact: the density axis reaches the list because it is mounted inside the
 * page that declares it. */
export const Compact: Story = {
  render: args => (
    <LayerPage density="compact" label="The page behind.">
      <div style={{ width: 280 }}>
        <Select {...args} defaultOpen defaultSelectedKey="USD">
          <Options />
        </Select>
      </div>
    </LayerPage>
  )
};

/**
 * RTL. The label, the value and the options read from the right, the chevron
 * moves to the left edge of the field, and the tick follows the options —
 * nothing in the component knows which side that is.
 */
export const Direction: Story = {
  name: 'RTL',
  render: () => (
    /*
     * The fixture's own line is in English, as it is in every other layer
     * story — and it does NOT get this story's contrast checked, which is
     * worth saying because it looks as though it should.
     *
     * Measured: while the list is open the base marks everything outside it
     * `inert`, this line included, and axe's contrast rule does not look
     * inside an inert subtree. So the only text axe reaches here is the list's
     * own, all of it Arabic, all of it declined as an icon ligature — doc 06
     * §5.1's hole, arriving for the second time. The colours in it are checked
     * by the Latin stories above, which is what makes the hole survivable.
     */
    <LayerPage dir="rtl" locale="ar-EG" label="The page behind.">
      <div style={{ width: 280 }}>
        <Select label="العملة" placeholder="اختر واحدة" defaultOpen>
          <SelectItem id="PEN">السول البيروفي</SelectItem>
          <SelectItem id="USD">الدولار الأمريكي</SelectItem>
          <SelectItem id="EUR">اليورو</SelectItem>
        </Select>
      </div>
    </LayerPage>
  )
};

/**
 * An overridden brand, which has to reach the tick and the ring.
 *
 * The accent is the one colour a select uses for meaning rather than for
 * surface — the tick on the chosen option — and it is inside a portalled
 * layer, so this is the story that says whether a theme declared on the page
 * reaches it. Not a prediction: the tick and the field's focus ring both come
 * from `--bb-accent`, and this is what proves the variable arrived.
 */
export const BrandOverride: Story = {
  name: 'Brand override',
  render: args => (
    <LayerPage brand label="The page behind.">
      <div style={{ width: 280 }}>
        <Select {...args} defaultOpen defaultSelectedKey="USD">
          <Options />
        </Select>
      </div>
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
      <div style={{ width: 200 }}>
        <Select label="Cost centre" placeholder="Choose one" defaultOpen>
          <SelectItem id="a">Operations</SelectItem>
          <SelectItem id="b">
            Administration and general services, southern region
          </SelectItem>
          <SelectItem id="c">Maintenance</SelectItem>
        </Select>
      </div>
    </LayerPage>
  )
};

/** Light, dark and compact, closed — the three scopes on one page. */
export const Together: Story = {
  render: args => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <Select {...args} defaultSelectedKey="USD">
          <Options />
        </Select>
      </Scope>
      <Scope label="Dark" mode="dark">
        <Select {...args} defaultSelectedKey="USD">
          <Options />
        </Select>
      </Scope>
      <Scope label="Compact" density="compact">
        <Select {...args} defaultSelectedKey="USD">
          <Options />
        </Select>
      </Scope>
    </div>
  )
};
