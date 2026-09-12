/*
 * The table pieces. What only a browser answers: whether the heading row stays
 * put while the body scrolls, whether the overflow shadows appear on the edge
 * that has content beyond it, where focus goes as the grid is walked, and what
 * the three absences look like inside a table's own frame.
 *
 * Wave 1 of the suite the catalog's §3.4 lays out. There is no selection here,
 * no column management and no row actions — those are waves 2 to 4, and a
 * story that pretended otherwise would photograph something that does not
 * exist.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SortDescriptor } from 'react-aria-components';
import { Cell, Column, Row, Table, TableBody, TableHeader } from './Table';
import { Badge } from '../Badge';
import { ConfigProvider } from '../../config';
import { EmptyState } from '../EmptyState';

const meta = {
  title: 'Components/Table',
  component: Table,
  args: { 'aria-label': 'Invoices' }
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A panel of a declared width, so what the container does is visible. */
const Room = ({
  width,
  label,
  mode = 'light',
  density = 'normal',
  children
}: {
  width: number | string;
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  children: React.ReactNode;
}) => (
  <div
    className="catalog-panel"
    data-bb-density={density}
    data-bb-mode={mode}
    style={{ width }}
  >
    <p className="catalog-label">{label}</p>
    {children}
  </div>
);

type Invoice = {
  id: string;
  number: string;
  customer: string;
  status: 'paid' | 'due' | 'void';
  total: string;
};

const INVOICES: Invoice[] = [
  {
    id: '1',
    number: 'F001-000412',
    customer: 'Astilleros del Sur',
    status: 'paid',
    total: '1,240.00'
  },
  {
    id: '2',
    number: 'F001-000413',
    customer: 'Marina Quispe',
    status: 'due',
    total: '318.50'
  },
  {
    id: '3',
    number: 'F001-000414',
    customer: 'Constructora Miraflores',
    status: 'due',
    total: '9,800.00'
  },
  {
    id: '4',
    number: 'F001-000415',
    customer: 'Jorge Paredes',
    status: 'void',
    total: '75.00'
  }
];

const TONE = {
  paid: 'success',
  due: 'warning',
  void: 'neutral'
} as const;

const LABEL = { paid: 'Paid', due: 'Due', void: 'Void' } as const;

const Body = ({ rows = INVOICES }: { rows?: Invoice[] }) => (
  <TableBody>
    {rows.map(invoice => (
      <Row key={invoice.id} id={invoice.id}>
        <Cell>{invoice.number}</Cell>
        <Cell>{invoice.customer}</Cell>
        <Cell>
          <Badge tone={TONE[invoice.status]}>{LABEL[invoice.status]}</Badge>
        </Cell>
        <Cell>{invoice.total}</Cell>
      </Row>
    ))}
  </TableBody>
);

const Head = ({ sortable = false }: { sortable?: boolean }) => (
  <TableHeader>
    <Column id="number" allowsSorting={sortable} isRowHeader>
      Number
    </Column>
    <Column id="customer" allowsSorting={sortable}>
      Customer
    </Column>
    <Column id="status">Status</Column>
    <Column id="total" allowsSorting={sortable}>
      Total
    </Column>
  </TableHeader>
);

/**
 * Rows of records, with the column that identifies a row marked as such.
 *
 * `isRowHeader` is not decoration. Measured in wave 0: without it the base
 * neither throws nor warns, every row loses its accessible name, and it
 * renders an EMPTY `aria-labelledby` rather than none — so nothing else would
 * have told you. The component says so in one development warning.
 */
export const Overview: Story = {
  render: args => (
    <Room label="A 720px panel" width={720}>
      <Table {...args}>
        <Head />
        <Body />
      </Table>
    </Room>
  )
};

/**
 * Sorting is the base's: the heading becomes pressable, `aria-sort` is set, and
 * the new order is announced in the locale it received. What is ours is the
 * mark, and it is drawn on every sortable heading whether or not that column
 * is the sorted one — hidden with opacity rather than added and removed,
 * because a mark that appears changes the heading's width and the whole row
 * shifts the first time anybody sorts.
 *
 * The reorder itself is the project's. `onSortChange` is a request, not a
 * reshuffle: a listing of any size sorts on a server, and P2 says this library
 * makes no requests.
 */
export const Sortable: Story = {
  render: args => {
    const Sorted = () => {
      const [sort, setSort] = useState<SortDescriptor>({
        column: 'number',
        direction: 'ascending'
      });
      const rows = [...INVOICES].sort((left, right) => {
        const key = sort.column as keyof Invoice;
        const order = String(left[key]).localeCompare(String(right[key]));
        return sort.direction === 'ascending' ? order : -order;
      });
      return (
        <Room label="Press a heading, then press it again" width={720}>
          <Table {...args} onSortChange={setSort} sortDescriptor={sort}>
            <Head sortable />
            <Body rows={rows} />
          </Table>
        </Room>
      );
    };
    return <Sorted />;
  }
};

/**
 * THE THREE ABSENCES, which are the component's and not the consumer's.
 *
 * A failed load and an empty result are different things, and the product this
 * suite was read against showed the same screen for both, with no way to try
 * again — the most expensive gap in it. An error outranks loading here, because
 * a request that failed is not still in flight.
 */
export const Absences: Story = {
  render: args => (
    <div className="catalog-stack">
      <Room label="Nothing yet — the fallback" width={520}>
        <Table {...args}>
          <Head />
          <TableBody>{[]}</TableBody>
        </Table>
      </Room>
      <Room label="Nothing matched — a different state, doc 09 §6" width={520}>
        <Table {...args}>
          <Head />
          <TableBody
            emptyState={
              <EmptyState
                description="Try a shorter number, or clear the filters."
                title="No invoices match"
                variant="no-results"
              />
            }
          >
            {[]}
          </TableBody>
        </Table>
      </Room>
      <Room label="Loading, before anything has arrived" width={520}>
        <Table {...args}>
          <Head />
          <TableBody isLoading>{[]}</TableBody>
        </Table>
      </Room>
      <Room label="It failed, and there is something to try" width={520}>
        <Table {...args}>
          <Head />
          <TableBody
            error="The request timed out before the invoices arrived."
            onRetry={() => undefined}
          >
            {[]}
          </TableBody>
        </Table>
      </Room>
      <Room label="It failed, and there is not" width={520}>
        <Table {...args}>
          <Head />
          <TableBody error="You do not have access to this customer's invoices.">
            {[]}
          </TableBody>
        </Table>
      </Room>
    </div>
  )
};

/**
 * TOO WIDE FOR ITS CONTAINER, which is the state doc 04 §7 is about: the
 * component encloses its own horizontal scrolling and the page never scrolls
 * sideways because of us — and content hidden by overflow is INDICATED, because
 * invisible scrolling is lost content.
 *
 * The indication is four background layers and no JavaScript: two painted in
 * the surface colour that scroll WITH the content and cover the shadow on
 * whichever edge you are looking at, and two shadows fixed to the box. Scrolled
 * to the start, only the trailing shadow shows.
 */
export const TooWide: Story = {
  render: args => (
    <Room label="A 360px panel holding a six-column table" width={360}>
      <Table {...args}>
        <TableHeader>
          <Column id="number" isRowHeader>
            Number
          </Column>
          <Column id="customer">Customer</Column>
          <Column id="status">Status</Column>
          <Column id="issued">Issued</Column>
          <Column id="due">Due</Column>
          <Column id="total">Total</Column>
        </TableHeader>
        <TableBody>
          {INVOICES.map(invoice => (
            <Row key={invoice.id} id={invoice.id}>
              <Cell>{invoice.number}</Cell>
              <Cell>{invoice.customer}</Cell>
              <Cell>
                <Badge tone={TONE[invoice.status]}>
                  {LABEL[invoice.status]}
                </Badge>
              </Cell>
              <Cell>2026-09-01</Cell>
              <Cell>2026-09-30</Cell>
              <Cell>{invoice.total}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
    </Room>
  )
};

/**
 * THE HEADING ROW STAYS PUT. A `th` is sticky against the scroller, which is
 * why the scroller is a separate element from the table — `overflow` on a
 * `table` does not make it the nearest scrolling ancestor.
 */
export const ScrollsDown: Story = {
  render: args => (
    <Room label="A short scroller, scrolled down" width={520}>
      {/*
       * The height goes on the TABLE, not on a wrapper. `overflow-x: auto`
       * makes the component's own scroller a scroll container in both axes,
       * so a wrapper with its own `overflow-y` scrolls the wrapper and leaves
       * the heading stuck to a scroller that never moved. Found by a browser
       * check, which read it as sticky being broken.
       */}
      <div>
        <Table {...args} style={{ maxBlockSize: 180 }}>
          <Head />
          <TableBody>
            {[...INVOICES, ...INVOICES, ...INVOICES].map((invoice, index) => (
              <Row id={String(index)} key={index}>
                <Cell>{invoice.number}</Cell>
                <Cell>{invoice.customer}</Cell>
                <Cell>
                  <Badge tone={TONE[invoice.status]}>
                    {LABEL[invoice.status]}
                  </Badge>
                </Cell>
                <Cell>{invoice.total}</Cell>
              </Row>
            ))}
          </TableBody>
        </Table>
      </div>
    </Room>
  )
};

/** A row that cannot be acted on, and the narrow container P4 asks about. */
export const States: Story = {
  render: args => (
    <div className="catalog-stack">
      <Room label="A disabled row" width={620}>
        <Table {...args}>
          <Head />
          <TableBody>
            {INVOICES.map(invoice => (
              <Row
                id={invoice.id}
                isDisabled={invoice.status === 'void'}
                key={invoice.id}
              >
                <Cell>{invoice.number}</Cell>
                <Cell>{invoice.customer}</Cell>
                <Cell>
                  <Badge tone={TONE[invoice.status]}>
                    {LABEL[invoice.status]}
                  </Badge>
                </Cell>
                <Cell>{invoice.total}</Cell>
              </Row>
            ))}
          </TableBody>
        </Table>
      </Room>
      <Room label="320px, which P4 asks of everything" width={320}>
        <Table {...args}>
          <Head />
          <Body rows={INVOICES.slice(0, 2)} />
        </Table>
      </Room>
    </div>
  )
};

/*
 * ONE STORY PER AXIS, which is this catalog's convention and not a stylistic
 * choice: the visual registry names each capture `axis-<component>-<axis>`, so
 * a failure says WHICH axis moved instead of handing over one picture with
 * four panels in it and leaving the reader to find the difference.
 */

/** Gate box 8, the first half. */
export const Dark: Story = {
  render: args => (
    <Room label="Dark" mode="dark" width={560}>
      <Table {...args}>
        <Head sortable />
        <Body rows={INVOICES.slice(0, 3)} />
      </Table>
    </Room>
  )
};

/** Density is a theme axis, not a prop: it redefines the spacing variables. */
export const Compact: Story = {
  render: args => (
    <Room density="compact" label="Compact density" width={560}>
      <Table {...args}>
        <Head sortable />
        <Body rows={INVOICES.slice(0, 3)} />
      </Table>
    </Room>
  )
};

/**
 * Gate box 9, declared with BOTH mechanisms, which is what doc 05 §4.1
 * actually asks for.
 *
 * The first version of this story set the locale alone and rendered left to
 * right, because `I18nProvider` gives the locale to JAVASCRIPT and puts no
 * `dir` in the DOM — the stylesheet never heard. The rule that `Slider`
 * measured is not "prefer the locale", it is that the two mechanisms must
 * AGREE, and a story asserting direction has to set both.
 *
 * One column is sorted here on purpose: the sort mark is invisible at rest, so
 * a picture of an unsorted table cannot show it. It is a chevron on the block
 * axis, so it does NOT mirror — what this panel checks is the layout around
 * it: the column order, the alignment from `text-start`, and the inline
 * padding.
 */
export const Direction: Story = {
  name: 'RTL',
  render: args => (
    <div dir="rtl">
      <ConfigProvider locale="ar-EG">
        <Room label="العربية" width={560}>
          <Table
            {...args}
            sortDescriptor={{ column: 'customer', direction: 'ascending' }}
          >
            <Head sortable />
            <Body rows={INVOICES.slice(0, 3)} />
          </Table>
        </Room>
      </ConfigProvider>
    </div>
  )
};

/** Gate box 8's other half: nothing here may be the accent by accident. */
export const BrandOverride: Story = {
  render: args => (
    <div
      className="catalog-panel"
      style={{ ['--bb-accent' as string]: 'var(--bb-x-amber-9)', width: 560 }}
    >
      <p className="catalog-label">An overridden brand accent</p>
      <Table {...args}>
        <Head sortable />
        <Body rows={INVOICES.slice(0, 3)} />
      </Table>
    </div>
  )
};
