/*
 * The visual catalog for EmptyState.
 *
 * These stories are not decoration. Several boxes on the entry gate can only
 * be ticked here: the two variants seen at the same time rather than one after
 * the other, light next to dark, both densities, LTR next to RTL, the
 * component in a 320px container, and the same component in three languages
 * with the longest one visible instead of asserted in prose.
 *
 * The headline story is `TheTwoStates`. Everything else is a check; that one
 * is the argument for the component existing at all (doc 09 §6).
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { ConfigProvider } from '../../config';
import { EmptyState, type EmptyStateVariant } from './EmptyState';

const VARIANTS = [
  'no-data',
  'no-results'
] as const satisfies readonly EmptyStateVariant[];

/*
 * Fails to compile if a variant is added to the component and not to VARIANTS.
 * A plain `EmptyStateVariant[]` annotation would only check that every entry is
 * a variant, not that every variant is an entry — so a third state could be
 * added and quietly appear in none of the stories below.
 */
const MISSING: Exclude<EmptyStateVariant, (typeof VARIANTS)[number]>[] = [];
void MISSING;

/**
 * A panel carrying one combination of the three theme axes.
 *
 * `data-bb-theme` is what makes a brand override take effect: the semantic
 * tokens are recomputed inside that scope. Without it the override silently
 * does nothing (doc 03 §3.1).
 */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  dir = 'ltr',
  brand = false,
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  dir?: 'ltr' | 'rtl';
  brand?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
      dir={dir}
      {...(brand ? { 'data-bb-theme': 'catalog-alt' } : {})}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

/*
 * Two sample illustrations, drawn here rather than installed: the library
 * distributes no icons and depends on no icon set (doc 02 §11).
 *
 * Both carry `width` and `height` attributes on purpose, exactly as a real
 * icon set writes them. The slot sizes them anyway — a CSS declaration beats a
 * presentation attribute — which is the guarantee in doc 02 §11.2 made visible
 * rather than described. Both are drawn with `currentColor`, which is the one
 * condition the library cannot enforce.
 */
function InboxIcon() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 13h4l2 3h6l2-3h4" />
      <path d="M4.5 5.5 3 13v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5l-1.5-7.5a1 1 0 0 0-1-.5H5.5a1 1 0 0 0-1 .5Z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 5h17l-6.5 7.5V20l-4-2.5v-5L3.5 5Z" />
    </svg>
  );
}

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  args: {
    variant: 'no-data',
    size: 'md',
    title: 'No customers yet',
    description: 'Everyone you add will be listed here.'
  },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: ['md', 'sm'] }
  }
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The interactive one. Change variant and size from the controls panel. */
export const Playground: Story = {};

/**
 * **The reason this component exists.** Doc 09 §6 calls confusing these two one
 * of the most common experience bugs there is: showing "no customers" when
 * there are in fact a thousand and the filter missed.
 *
 * They are side by side because that is the only way to see the difference is
 * in the words and nowhere else. Nothing about the second says "error" — a
 * filter matching nothing is a perfectly ordinary result, and a red frame
 * around it would be the component editorialising.
 *
 * Read the two sentences, not the layout:
 *
 * | | Says | Offers |
 * | --- | --- | --- |
 * | `no-data` | What this list is for | How to put the first thing in it |
 * | `no-results` | What was searched for | A way back to everything |
 */
export const TheTwoStates: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">variant=&quot;no-data&quot;</p>
        <EmptyState
          icon={<InboxIcon />}
          title="No customers yet"
          description="Everyone you add will show up here, with their orders and their contact details."
        >
          <Button variant="primary">New customer</Button>
        </EmptyState>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">variant=&quot;no-results&quot;</p>
        <EmptyState
          variant="no-results"
          icon={<FilterIcon />}
          title="No customers match “paid, Lima, last 30 days”"
          description="Try a wider date range, or clear the filters to see all 1,284 customers."
        >
          <Button variant="secondary">Clear filters</Button>
        </EmptyState>
      </div>
    </div>
  )
};

/**
 * The same two with no `title` and no `description`, which is what a consumer
 * gets before they have written anything.
 *
 * The fallbacks come from the dictionary, one key per variant, so they are
 * translated with everything else (doc 05 §2). They are short on purpose and
 * they are not filler — doc 09 §9 asks an empty state to orient rather than
 * merely inform — but they are still the generic version. A consumer who knows
 * what the list holds writes a better one, and only they can.
 */
export const FallbackTitles: Story = {
  render: () => (
    <div className="catalog-pair">
      {VARIANTS.map(variant => (
        <div className="catalog-panel" key={variant}>
          <p className="catalog-label">{variant}</p>
          <EmptyState variant={variant} />
        </div>
      ))}
    </div>
  )
};

/**
 * `md` next to `sm`.
 *
 * Compact is not a smaller version for small screens — it is for an empty
 * state placed inside something else, which is where most of them live. The
 * title drops to the body size and leans on weight and colour instead, which
 * is doc 03 §4.6a: hierarchy is made with colour, not size.
 */
export const Sizes: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">size=&quot;md&quot;</p>
        <EmptyState
          icon={<InboxIcon />}
          title="No invoices yet"
          description="Issued invoices will be listed here."
        >
          <Button variant="primary">New invoice</Button>
        </EmptyState>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">size=&quot;sm&quot;</p>
        <EmptyState
          size="sm"
          icon={<InboxIcon />}
          title="No invoices yet"
          description="Issued invoices will be listed here."
        >
          <Button variant="primary" size="sm">
            New invoice
          </Button>
        </EmptyState>
      </div>
    </div>
  )
};

/**
 * Where a compact empty state actually appears: in the body of a table whose
 * header is still there, so the columns do not vanish and nothing shifts when
 * rows arrive (doc 09 §3).
 *
 * The table is hand-written here — the library's own is not built yet — but
 * the placement is the real one.
 */
export const InsideATable: Story = {
  render: () => (
    <table
      style={{
        width: '100%',
        maxWidth: 640,
        borderCollapse: 'collapse',
        border: '1px solid var(--bb-border)',
        borderRadius: 'var(--bb-radius-md)',
        fontSize: 'var(--bb-text-md)',
        color: 'var(--bb-text)'
      }}
    >
      <thead>
        <tr style={{ borderBlockEnd: '1px solid var(--bb-border)' }}>
          <th scope="col" style={{ textAlign: 'start', padding: 8 }}>
            Customer
          </th>
          <th scope="col" style={{ textAlign: 'start', padding: 8 }}>
            Status
          </th>
          <th scope="col" style={{ textAlign: 'start', padding: 8 }}>
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={3} style={{ padding: 0 }}>
            <EmptyState
              variant="no-results"
              size="sm"
              icon={<FilterIcon />}
              title="Nothing matches this filter"
              description="Searched for “overdue” in the last 7 days."
            >
              <Button variant="link" size="sm">
                Clear filters
              </Button>
            </EmptyState>
          </td>
        </tr>
      </tbody>
    </table>
  )
};

/**
 * The illustration slot.
 *
 * It is a **named slot**, and that is deliberate: doc 02 §11.1 asks whether the
 * consumer could have placed it themselves by ordering children, and above the
 * title, outside the flow of the text, they could not. That is the exception
 * the icon convention allows, and the document names this component while
 * stating it.
 *
 * The consumer passes no size and no colour. Both SVGs below are written with
 * `width="24" height="24"` exactly as an icon set writes them, and both come
 * out at the slot's size in the slot's colour (doc 02 §11.2). The slot is also
 * hidden from assistive technology, because the title beside it already says
 * the same thing.
 *
 * The last panel is the same component with no icon at all: it is optional, and
 * a compact one embedded in a dense table is usually better without.
 */
export const Illustration: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">An icon set&apos;s own size, overridden</p>
        <EmptyState icon={<InboxIcon />} title="No customers yet" />
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">Compact, so the slot is smaller</p>
        <EmptyState size="sm" icon={<InboxIcon />} title="No customers yet" />
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">No icon</p>
        <EmptyState title="No customers yet" />
      </div>
    </div>
  )
};

/**
 * The actions area is `children`, composed by the consumer — structure is
 * composition (doc 02 §3), so there is no `action` prop and no
 * `secondaryAction` beside it.
 *
 * Which buttons, in which order, and how many, is the consumer's call. Two is
 * usually the most that helps: a primary way forward and one way out.
 */
export const Actions: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">One way forward</p>
        <EmptyState
          icon={<InboxIcon />}
          title="No customers yet"
          description="Everyone you add will show up here."
        >
          <Button variant="primary">New customer</Button>
        </EmptyState>
      </div>
      <div className="catalog-panel">
        <p className="catalog-label">A primary action and a way out</p>
        <EmptyState
          variant="no-results"
          icon={<FilterIcon />}
          title="No customers match this filter"
          description="Searched for “overdue” among customers in Lima."
        >
          <Button variant="primary">Clear filters</Button>
          <Button variant="secondary">Edit the search</Button>
        </EmptyState>
      </div>
    </div>
  )
};

/** Light and dark are separate definitions, never an inversion (doc 03 §3). */
export const Modes: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Light" mode="light">
        <EmptyState
          icon={<InboxIcon />}
          title="No customers yet"
          description="Everyone you add will show up here."
        >
          <Button variant="primary">New customer</Button>
        </EmptyState>
      </Scope>
      <Scope label="Dark" mode="dark">
        <EmptyState
          icon={<InboxIcon />}
          title="No customers yet"
          description="Everyone you add will show up here."
        >
          <Button variant="primary">New customer</Button>
        </EmptyState>
      </Scope>
    </div>
  )
};

/**
 * Density is the application's axis, set on a container; `size` is this
 * component's, set per instance. Both are live at once and they compose,
 * because the spacing is read from the density tokens rather than written as
 * numbers.
 */
export const Density: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="Normal density · size=md" density="normal">
        <EmptyState icon={<InboxIcon />} title="No customers yet" />
      </Scope>
      <Scope label="Compact density · size=md" density="compact">
        <EmptyState icon={<InboxIcon />} title="No customers yet" />
      </Scope>
      <Scope label="Compact density · size=sm" density="compact">
        <EmptyState size="sm" icon={<InboxIcon />} title="No customers yet" />
      </Scope>
    </div>
  )
};

/**
 * LTR next to RTL. Nothing here is measured from the left or the right, so the
 * only thing that moves is the reading order of the text.
 *
 * The illustration is **not** flipped, and that is the rule rather than an
 * oversight: the library flips the icons it draws itself and never one it
 * received, because whether an icon is directional is a fact about its meaning
 * and the meaning is not visible from an arbitrary SVG (doc 02 §11.4).
 */
export const Direction: Story = {
  render: () => (
    <div className="catalog-pair">
      <Scope label="LTR" dir="ltr">
        <EmptyState
          variant="no-results"
          icon={<FilterIcon />}
          title="No customers match this filter"
          description="Try a wider date range, or clear the filters."
        >
          <Button variant="secondary">Clear filters</Button>
        </EmptyState>
      </Scope>
      <ConfigProvider
        locale="ar-EG"
        dictionary={{ emptyStateNoResults: 'لا توجد نتائج' }}
      >
        <Scope label="RTL · ar-EG" dir="rtl">
          <EmptyState
            variant="no-results"
            icon={<FilterIcon />}
            description="جرّب توسيع نطاق التاريخ، أو امسح عوامل التصفية."
          >
            <Button variant="secondary">مسح عوامل التصفية</Button>
          </EmptyState>
        </Scope>
      </ConfigProvider>
    </div>
  )
};

/**
 * All three axes at once, plus RTL. Doc 03 §9 asks for this combination
 * explicitly: component by component everything looks right, and combined is
 * where the three greys you thought were one show up.
 */
export const AllAxes: Story = {
  render: () => (
    <Scope
      label="Dark · compact · RTL · overridden brand"
      mode="dark"
      density="compact"
      dir="rtl"
      brand
    >
      <ConfigProvider
        locale="ar-EG"
        dictionary={{ emptyStateNoData: 'لا يوجد شيء هنا بعد' }}
      >
        <EmptyState icon={<InboxIcon />}>
          <Button variant="primary" size="sm">
            عميل جديد
          </Button>
        </EmptyState>
      </ConfigProvider>
    </Scope>
  )
};

/**
 * **It survives a language change.** The same component, the same props, three
 * languages — and no `title` anywhere, so the fallback is what changes.
 *
 * German is here because it is the practical worst case doc 05 §5 warns about:
 * every string roughly 30–40% longer than the English one, which is the test
 * that finds layout breaks in minutes rather than on the day somebody
 * translates. Watch the middle panel — nothing is sized to fit one particular
 * label, so the long title wraps and the buttons drop onto a second line
 * instead of bursting the panel.
 */
export const Languages: Story = {
  render: () => (
    <div className="catalog-pair">
      <div className="catalog-panel">
        <p className="catalog-label">English</p>
        <EmptyState
          variant="no-results"
          icon={<FilterIcon />}
          description="Try a wider date range, or clear the filters to see all customers."
        >
          <Button variant="primary">Clear filters</Button>
          <Button variant="secondary">Edit the search</Button>
        </EmptyState>
      </div>

      <ConfigProvider
        locale="de-DE"
        dictionary={{
          emptyStateNoResults: 'Keine Übereinstimmungen gefunden'
        }}
      >
        <div className="catalog-panel">
          <p className="catalog-label">German — every string ~35% longer</p>
          <EmptyState
            variant="no-results"
            icon={<FilterIcon />}
            description="Erweitern Sie den Zeitraum oder setzen Sie die Filter zurück, um alle Kundendatensätze anzuzeigen."
          >
            <Button variant="primary">Filter zurücksetzen</Button>
            <Button variant="secondary">Suche bearbeiten</Button>
          </EmptyState>
        </div>
      </ConfigProvider>

      <ConfigProvider
        locale="ar-EG"
        dictionary={{ emptyStateNoResults: 'لا توجد نتائج' }}
      >
        <div className="catalog-panel" dir="rtl">
          <p className="catalog-label">Arabic — RTL</p>
          <EmptyState
            variant="no-results"
            icon={<FilterIcon />}
            description="جرّب توسيع نطاق التاريخ، أو امسح عوامل التصفية لعرض جميع العملاء."
          >
            <Button variant="primary">مسح عوامل التصفية</Button>
            <Button variant="secondary">تعديل البحث</Button>
          </EmptyState>
        </div>
      </ConfigProvider>
    </div>
  )
};

/**
 * The 320px container from the entry gate, pinned rather than dragged so it is
 * always checked. The window stays wide — that is the point.
 *
 * Both sizes, both with an unbroken search term long enough to burst a box that
 * did not ask its text to wrap. Nothing here has a width; the max-width on the
 * text column simply stops applying below its own value, which is the whole
 * difference between max-width and width (doc 04 §3).
 */
export const NarrowContainer: Story = {
  render: () => (
    <div
      style={{ width: 320, border: '1px solid var(--bb-border)', padding: 12 }}
    >
      <div className="catalog-stack">
        <EmptyState
          icon={<InboxIcon />}
          title="No customers yet"
          description="Everyone you add will show up here, with their orders and their contact details."
        >
          <Button variant="primary">New customer</Button>
          <Button variant="secondary">Import from a file</Button>
        </EmptyState>

        <EmptyState
          variant="no-results"
          size="sm"
          icon={<FilterIcon />}
          title="Nothing matches this filter"
          description="Searched for “kundendatensatzverwaltungsfilter”."
        >
          <Button variant="link" size="sm">
            Clear filters
          </Button>
        </EmptyState>
      </div>
    </div>
  )
};

/**
 * The dashed box is resizable — drag its corner to narrow the **container**
 * while the window stays wide, which is the situation a consumer is actually
 * in (doc 04, and the entry gate's own instruction).
 */
export const Resizable: Story = {
  render: () => (
    <div className="catalog-resizable">
      <EmptyState
        variant="no-results"
        icon={<FilterIcon />}
        title="No customers match “paid, Lima, last 30 days”"
        description="Try a wider date range, or clear the filters to see all 1,284 customers."
      >
        <Button variant="primary">Clear filters</Button>
        <Button variant="secondary">Edit the search</Button>
      </EmptyState>
    </div>
  )
};
