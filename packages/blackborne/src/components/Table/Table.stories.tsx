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
import { useTableColumns } from './useTableColumns';
import { RowAction, RowActions } from './RowActions';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Badge } from '../Badge';
import { ConfigProvider } from '../../config';
import { EmptyState } from '../EmptyState';
import { VisuallyHidden } from '../VisuallyHidden';

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

/* A stand-in glyph. The library distributes no icons (hard rule 9); a project
   brings its own, and the slot sizes and colours whatever arrives. */
const Dot = () => (
  <svg aria-hidden="true" className="bb:h-mark bb:w-mark" viewBox="0 0 16 16">
    <circle cx="8" cy="8" fill="currentColor" r="5" />
  </svg>
);

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
 * CHOOSING ROWS, and the two modes are a union rather than a boolean.
 *
 * The base owns all of it — shift-click and shift-arrow ranges, `Mod+A`, long
 * press on touch, the indeterminate select-all and its name in 34 locales.
 * Three things here are ours.
 *
 * **The column itself**, because the base renders none: it reports the mode
 * through `useTableOptions()` and leaves both halves to the consumer, and a
 * consumer who writes one half crashes on the cell-count check while one who
 * writes neither ships a selectable table with no way to select anything.
 *
 * **The `'all'` sentinel never leaves.** `selectAll()` stores the literal
 * string, so the first press of the heading box would hand a consumer typed
 * against a list of ids a string instead.
 *
 * **And the count is announced**, which the base does not do — it says a row's
 * own state as focus moves and never the total. The region is visually hidden
 * and empty until something is chosen, because "0 selected" on every clear is
 * noise.
 *
 * The disabled row cannot be chosen and is not in "all" either, which is the
 * base's own rule rather than one added here.
 */
export const Selection: Story = {
  render: args => {
    /*
     * THE ARGS ARE NOT SPREAD HERE, and that is decision 0022's recorded cost
     * rather than an oversight: props typed as a union cannot be spread and
     * then added to, because `{...args} selectionMode="multiple"` has to
     * satisfy the singular branch as well — and it cannot, since that branch
     * declares the plural props `never`. The decision's own answer is to name
     * a branch; the label is the only arg these panels want, so taking it is
     * simpler than naming one.
     */
    /* `?? ` because `exactOptionalPropertyTypes` refuses an explicit
       `undefined` where the prop is a plain string. The meta always supplies
       it; the fallback is for the type system rather than for a reader. */
    const label = args['aria-label'] ?? 'Invoices';
    const Choosing = () => {
      const [several, setSeveral] = useState<string[]>(['2']);
      const [one, setOne] = useState<string | null>('1');
      return (
        <div className="catalog-stack">
          <Room
            label={`Several — ${String(several.length)} chosen`}
            width={640}
          >
            <Table
              aria-label={label}
              onSelectionChange={setSeveral}
              selectedKeys={several}
              selectionMode="multiple"
            >
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
          <Room label={`One — ${one ?? 'none'}`} width={640}>
            <Table
              aria-label={label}
              onSelectionChange={setOne}
              selectedKey={one}
              selectionMode="single"
            >
              <Head />
              <Body rows={INVOICES.slice(0, 3)} />
            </Table>
          </Room>
        </div>
      );
    };
    return <Choosing />;
  }
};

/**
 * WHICH COLUMNS, AND IN WHAT ORDER — and the control beside the table is built
 * from public pieces rather than shipped.
 *
 * `useTableColumns` is a hook because that is what P6 asks of logic: an order,
 * a restore, and two refusals, none of which needs a DOM. It is also the shape
 * P3 leaves available — the library remembers nothing, so the hook holds the
 * arrangement and hands the project two lists of ids to store wherever they
 * store things.
 *
 * The panel here is a `Checkbox` per column and a `Button`, which is the whole
 * point: non-goal 3 says the library does not solve screens, so the
 * manage-columns dialog belongs to the consumer — and P6's corollary says an
 * assembly may have no capability its pieces lack. If this panel needed
 * anything the hook does not expose, the hook would be wrong.
 *
 * Two things it refuses, both measured failures rather than taste. The locked
 * column cannot be hidden or moved, because it is the one carrying
 * `isRowHeader` and a table without it leaves every row named by nothing. And
 * the last visible column cannot go: a table with no columns is not a narrower
 * table, and the product this suite was read against had no route back at all,
 * because its restore was unreachable.
 */
export const Arranging: Story = {
  render: args => {
    const label = args['aria-label'] ?? 'Invoices';
    const Arranged = () => {
      const columns = useTableColumns([
        { id: 'number', name: 'Number', isLocked: true },
        { id: 'customer', name: 'Customer' },
        { id: 'status', name: 'Status' },
        { id: 'total', name: 'Total' },
        { id: 'issued', name: 'Issued', isHiddenByDefault: true }
      ]);

      const value = (invoice: Invoice, id: string) => {
        if (id === 'status') {
          return (
            <Badge tone={TONE[invoice.status]}>{LABEL[invoice.status]}</Badge>
          );
        }
        if (id === 'issued') return '2026-09-01';
        return invoice[id as 'number' | 'customer' | 'total'];
      };

      return (
        <div className="catalog-stack">
          <div className="catalog-panel" style={{ width: 640 }}>
            <p className="catalog-label">Which columns to show</p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                alignItems: 'center'
              }}
            >
              {columns.all.map(column => (
                <Checkbox
                  isDisabled={column.isLocked === true}
                  isSelected={column.isVisible}
                  key={column.id}
                  onChange={() => {
                    columns.toggle(column.id);
                  }}
                >
                  {column.name}
                </Checkbox>
              ))}
              <Button
                isDisabled={!columns.isArranged}
                onPress={columns.restore}
                size="sm"
                variant="secondary"
              >
                Restore
              </Button>
            </div>
          </div>
          <Room label={`${String(columns.columns.length)} columns`} width={640}>
            <Table aria-label={label}>
              <TableHeader columns={columns.columns}>
                {column => (
                  <Column id={column.id} isRowHeader={column.isLocked === true}>
                    {column.name}
                  </Column>
                )}
              </TableHeader>
              <TableBody items={INVOICES.slice(0, 3)}>
                {invoice => (
                  <Row columns={columns.columns} id={invoice.id}>
                    {column => <Cell>{value(invoice, column.id)}</Cell>}
                  </Row>
                )}
              </TableBody>
            </Table>
          </Room>
        </div>
      );
    };
    return <Arranged />;
  }
};

/**
 * COLUMNS A PERSON CAN DRAG, and the grip is a real `input[type=range]`.
 *
 * That is the base's, and it is why this costs so little: the keyboard works
 * (Enter to start, arrows to step, Escape to cancel), the width is announced in
 * localized pixels, and the handle has a name. What is ours is that anybody can
 * SEE it, and the two things wave 0 measured.
 *
 * **It is opt-in, and could not be anything else.** Inside the base's
 * resizable container the table gets `table-layout: fixed` and a pixel width
 * per column as INLINE styles — a different layout from an ordinary table,
 * where a column takes the width of its content and the table scrolls.
 *
 * **And the table still fills its container**, which took a measurement to get
 * right: `width: min-content` left a two-column table 842px short in a 1400px
 * one, and no class beats an inline `width`. `min-width: 100%` wins because it
 * is a property the base does not set.
 *
 * The first column declares a FLOOR rather than a width, which is the best idea
 * in the product this suite was read against: a minimum per column means a
 * narrow screen makes the table scroll instead of crushing columns into
 * unreadable slivers. The last declares a fixed `width` and therefore has no
 * grip — a handle that cannot move anything is a control that does nothing.
 */
export const Resizing: Story = {
  render: args => {
    const label = args['aria-label'] ?? 'Invoices';
    const Dragging = () => {
      const [widths, setWidths] = useState<Record<string, number>>({});
      const seen = Object.entries(widths)
        .map(([id, width]) => `${id} ${String(Math.round(width))}`)
        .join(' · ');
      return (
        <div className="catalog-stack">
          <Room label={seen || 'Drag a column edge'} width={680}>
            <Table aria-label={label} isResizable onColumnResize={setWidths}>
              <TableHeader>
                <Column id="number" isRowHeader minWidth={140}>
                  Number
                </Column>
                <Column id="customer" minWidth={160}>
                  Customer
                </Column>
                <Column id="status" minWidth={100}>
                  Status
                </Column>
                <Column id="total" width={120}>
                  Total
                </Column>
              </TableHeader>
              <TableBody>
                {INVOICES.slice(0, 3).map(invoice => (
                  <Row id={invoice.id} key={invoice.id}>
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
        </div>
      );
    };
    return <Dragging />;
  }
};

/**
 * WHAT CAN BE DONE TO A ROW, and the fold when there is no room for it.
 *
 * A button inside a cell is allowed here and is forbidden in a `ListBox`, and
 * the difference is measured rather than assumed: wave 0 found a row named
 * exactly `"Ana"` with a button in it, where a listbox row came back announced
 * as `option "A row with a button Retry"`. A grid offers a keyboard route and a
 * listbox does not.
 *
 * Each action is DECLARED — a label and a glyph — because it lands in one of
 * two places depending on the room: a button in the row, or a row in a menu.
 * A component that rendered itself could not be both, which is decision 0018's
 * shape arriving for the third time.
 *
 * The fold scales with the count, and ONE ACTION NEVER FOLDS: doc 04 §11.2,
 * because hiding a single thing replaces something you can read with something
 * you have to open. Narrow the middle panel and watch three become a menu
 * while the one above it stays put.
 */
export const Actions: Story = {
  render: args => {
    const label = args['aria-label'] ?? 'Invoices';
    const Doing = () => {
      const [last, setLast] = useState('nothing yet');
      const actions = (invoice: Invoice) => (
        <RowActions label={`Invoice ${invoice.number}`}>
          <RowAction
            icon={<Dot />}
            label="Edit"
            onAction={() => {
              setLast(`Edit ${invoice.number}`);
            }}
          />
          <RowAction
            icon={<Dot />}
            label="Duplicate"
            onAction={() => {
              setLast(`Duplicate ${invoice.number}`);
            }}
          />
          <RowAction
            icon={<Dot />}
            label="Delete"
            onAction={() => {
              setLast(`Delete ${invoice.number}`);
            }}
            tone="danger"
          />
        </RowActions>
      );

      const table = (width: number, only?: boolean) => (
        <Room
          label={
            only ? 'One action, at 380px — it never folds' : `Last: ${last}`
          }
          width={width}
        >
          <Table aria-label={label}>
            <TableHeader>
              <Column id="number" isRowHeader>
                Number
              </Column>
              <Column id="customer">Customer</Column>
              <Column id="actions">
                <VisuallyHidden>Actions</VisuallyHidden>
              </Column>
            </TableHeader>
            <TableBody>
              {INVOICES.slice(0, 2).map(invoice => (
                <Row id={invoice.id} key={invoice.id}>
                  <Cell>{invoice.number}</Cell>
                  <Cell>{invoice.customer}</Cell>
                  <Cell>
                    {only ? (
                      <RowActions label={`Invoice ${invoice.number}`}>
                        <RowAction
                          icon={<Dot />}
                          label="Edit"
                          onAction={() => {
                            setLast(`Edit ${invoice.number}`);
                          }}
                        />
                      </RowActions>
                    ) : (
                      actions(invoice)
                    )}
                  </Cell>
                </Row>
              ))}
            </TableBody>
          </Table>
        </Room>
      );

      return (
        <div className="catalog-stack">
          {table(760)}
          {table(380)}
          {table(380, true)}
        </div>
      );
    };
    return <Doing />;
  }
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
 * THE COLUMN THAT STAYS PUT. `pinnedEdge="end"` holds the trailing column
 * against the trailing edge while the rest scroll under it — the actions, in
 * the case that actually occurs, so what can be done to a row is still reachable
 * at the far end of a wide one.
 *
 * It is named by the EDGE and not by a column, so nothing has to be kept in
 * step: `:last-child` already knows where the trailing edge is, and hiding the
 * last column pins whichever one becomes last.
 *
 * Two things are worth watching for here rather than reading about. The pinned
 * cell is OPAQUE and still wears whatever its row is wearing — scroll the
 * second table sideways with a row chosen and the tint travels with the column.
 * And the overflow shadow has moved inward by exactly the pinned column, so it
 * is now a shadow that column casts: it is there while something is behind it
 * and gone at the end of the scroll, which is what it meant before it moved.
 */
export const Pinned: Story = {
  render: args => {
    const label = args['aria-label'] ?? 'Invoices';
    const acts = (invoice: Invoice) => (
      <RowActions label={`Invoice ${invoice.number}`}>
        <RowAction icon={<Dot />} label="Edit" onAction={() => undefined} />
        <RowAction
          icon={<Dot />}
          label="Delete"
          onAction={() => undefined}
          tone="danger"
        />
      </RowActions>
    );
    const body = INVOICES.map(invoice => (
      <Row id={invoice.id} key={invoice.id}>
        <Cell>{invoice.number}</Cell>
        <Cell>{invoice.customer}</Cell>
        <Cell>
          <Badge tone={TONE[invoice.status]}>{LABEL[invoice.status]}</Badge>
        </Cell>
        <Cell>2026-09-01</Cell>
        <Cell>{invoice.total}</Cell>
        <Cell>{acts(invoice)}</Cell>
      </Row>
    ));
    const head = (
      <TableHeader>
        <Column id="number" isRowHeader>
          Number
        </Column>
        <Column id="customer">Customer</Column>
        <Column id="status">Status</Column>
        <Column id="issued">Issued</Column>
        <Column id="total">Total</Column>
        <Column id="acts">
          <VisuallyHidden>Actions</VisuallyHidden>
        </Column>
      </TableHeader>
    );

    return (
      <div className="catalog-stack">
        <Room label="Pinned, in a 380px panel" width={380}>
          <Table aria-label={label} pinnedEdge="end">
            {head}
            <TableBody>{body}</TableBody>
          </Table>
        </Room>
        <Room
          label="A chosen row, and the tint reaches the pinned cell"
          width={380}
        >
          <Table
            aria-label={label}
            defaultSelectedKeys={INVOICES.slice(0, 1).map(
              invoice => invoice.id
            )}
            pinnedEdge="end"
            selectionMode="multiple"
          >
            {head}
            <TableBody>{body}</TableBody>
          </Table>
        </Room>
      </div>
    );
  }
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
        {/*
         * THE PINNED EDGE MIRRORS, and this panel is here so a picture says so.
         * `inset-inline-end` puts the column against the LEFT in Arabic, and
         * the overflow pair has to move inward from that side — which is the
         * one place in this component where a physical direction is written
         * down, because `background-position` has no logical form. Measured
         * before the rule was trusted: the pinned cell moves from 357..421 to
         * 43..107 and the pair from `calc(100% - 64px)` to `64px`, so the
         * shadow stays immediately inward of the column in both readings.
         */}
        <Room label="العربية، والعمود المثبَّت" width={320}>
          <Table aria-label="الفواتير" pinnedEdge="end">
            <Head />
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
