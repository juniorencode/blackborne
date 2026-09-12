/*
 * Behaviour, from the perspective of someone using the table.
 *
 * Deliberately absent: anything that tests React Aria. The grid roles, the
 * keyboard, the sort descriptor and the announcement are the base's and are
 * tested by the people who maintain it. What is asserted here is the four
 * things this component adds — the three states a listing with no rows can be
 * in, and the invariant the base declines to enforce.
 *
 * Also absent: class assertions. That a header carries `bb:text-start` proves
 * nothing about how it looks (doc 10 §4); the sticky heading, the overflow
 * shadows and the sort mark are the visual catalog's job and the browser
 * checks'.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { Cell, Column, Row, Table, TableBody, TableHeader } from './Table';

afterEach(() => {
  vi.restoreAllMocks();
});

const rows = [
  { id: 'a', number: 'A-001', total: '120.00' },
  { id: 'b', number: 'A-002', total: '80.00' }
];

const Invoices = ({
  named = true,
  pinnedEdge,
  ...body
}: {
  named?: boolean;
  pinnedEdge?: 'end';
} & React.ComponentProps<typeof TableBody>) => (
  <Table aria-label="Invoices" {...(pinnedEdge ? { pinnedEdge } : {})}>
    <TableHeader>
      <Column id="number" isRowHeader={named}>
        Number
      </Column>
      <Column id="total">Total</Column>
    </TableHeader>
    <TableBody {...body}>
      {rows.map(row => (
        <Row key={row.id} id={row.id}>
          <Cell>{row.number}</Cell>
          <Cell>{row.total}</Cell>
        </Row>
      ))}
    </TableBody>
  </Table>
);

test('it renders the rows it was given', () => {
  render(<Invoices />);

  expect(screen.getByRole('grid', { name: 'Invoices' })).toBeTruthy();
  expect(screen.getByRole('rowheader', { name: 'A-001' })).toBeTruthy();
  /*
   * "Total 80.00" RATHER THAN "80.00", and the extra word is the point rather
   * than noise. jsdom applies no stylesheet, so the component is always in the
   * structure its class list declares by DEFAULT — which is the card one,
   * narrow-first per doc 04 §4.1 — and a card's field is named by its column.
   * With room, the label is `display: none` and the heading row does the
   * naming: measured as a tree in a browser, `gridcell "Astilleros del Sur"`
   * wide and `gridcell "Customer Astilleros del Sur"` narrow.
   *
   * The row header above is the other half of the same design and needs no
   * such allowance: a card's title carries no label, because the ROW takes its
   * name from that cell.
   *
   * MATCHED LOOSELY, and that is a rule rather than convenience: the two
   * implementations disagree about the separator in a name built from content.
   * jsdom joins it as `"Total120.00"` and Chrome as `"Customer Astilleros del
   * Sur"`. Spelling either one out would assert the accessible-name
   * implementation rather than this component (doc 10 §11), and it would pass
   * on one engine and fail on the other.
   */
  expect(screen.getByRole('gridcell', { name: /80\.00/ })).toBeTruthy();
});

/*
 * THE INVARIANT THE BASE DOES NOT ENFORCE. Measured in wave 0: with no column
 * marked `isRowHeader` nothing throws and nothing warns, and every row loses
 * its accessible name. Asserted in both directions, because a warning that
 * cannot stay silent is not a warning.
 */
test('a table with no row header says so, once, in development', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  render(<Invoices named={false} />);

  await vi.waitFor(() => {
    expect(warn).toHaveBeenCalledTimes(1);
  });
  expect(warn.mock.calls[0]?.[0]).toContain('isRowHeader');
});

/*
 * AND THE SILENT CASES WAIT FOR THE SAME MOMENT. The check answers when the
 * rows reach the DOM, which is after this component renders — so asserting
 * "not called" straight after `render` passes because nothing has looked yet,
 * not because there was nothing to say. Doc 10 §11.1.1 is about exactly this.
 * Each of these waits for the state the check reads, and only then asserts
 * silence.
 */
test('and a table with one says nothing', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  render(<Invoices />);
  await screen.findByRole('rowheader', { name: 'A-001' });

  expect(warn).not.toHaveBeenCalled();
});

test('and an empty table says nothing either, because it has no rows to name', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  render(
    <Table aria-label="Invoices">
      <TableHeader>
        <Column id="number">Number</Column>
      </TableHeader>
      <TableBody>{[]}</TableBody>
    </Table>
  );
  await screen.findByText('Nothing here yet');

  expect(warn).not.toHaveBeenCalled();
});

/* ─────────────────────────────── the states ─────────────────────────────── */

test('with nothing to show, the fallback empty state appears', () => {
  render(
    <Table aria-label="Invoices">
      <TableHeader>
        <Column id="number" isRowHeader>
          Number
        </Column>
      </TableHeader>
      <TableBody>{[]}</TableBody>
    </Table>
  );

  expect(screen.getByText('Nothing here yet')).toBeTruthy();
});

test('and the project can say it better', () => {
  render(
    <Table aria-label="Invoices">
      <TableHeader>
        <Column id="number" isRowHeader>
          Number
        </Column>
      </TableHeader>
      <TableBody emptyState={<p>No invoices for this customer</p>}>
        {[]}
      </TableBody>
    </Table>
  );

  expect(screen.getByText('No invoices for this customer')).toBeTruthy();
});

test('loading replaces the rows rather than sitting beside them', () => {
  render(<Invoices isLoading />);

  expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
  expect(screen.queryByRole('rowheader', { name: 'A-001' })).toBeNull();
});

test('an error shows what the project wrote, and offers the retry', async () => {
  const onRetry = vi.fn();
  render(<Invoices error="The request timed out" onRetry={onRetry} />);

  expect(screen.getByText('The request timed out')).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('an error with nothing to try again offers no button', () => {
  render(<Invoices error="Not allowed" />);

  expect(screen.getByText('Not allowed')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

/*
 * THE STATES ARE EXCLUSIVE AND THE ORDER IS DECIDED. A failed request is not
 * still in flight, so an error outranks loading — asserted rather than left to
 * whichever branch happens to come first.
 */
test('an error outranks loading', () => {
  render(<Invoices error="It broke" isLoading />);

  expect(screen.getByText('It broke')).toBeTruthy();
  expect(screen.queryByRole('status')).toBeNull();
});

test('and either of them outranks the rows', () => {
  render(<Invoices error="It broke" />);

  expect(screen.queryByRole('rowheader', { name: 'A-001' })).toBeNull();
});

/* ───────────────────────────── the selection ────────────────────────────── */

const Pickable = (props: React.ComponentProps<typeof Table>) => (
  <Table aria-label="Invoices" {...props}>
    <TableHeader>
      <Column id="number" isRowHeader>
        Number
      </Column>
      <Column id="total">Total</Column>
    </TableHeader>
    <TableBody>
      {rows.map(row => (
        <Row key={row.id} id={row.id}>
          <Cell>{row.number}</Cell>
          <Cell>{row.total}</Cell>
        </Row>
      ))}
    </TableBody>
  </Table>
);

test('a table nobody can choose from has no selection column', () => {
  render(<Pickable />);

  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.getAllByRole('columnheader')).toHaveLength(2);
});

test('several rows get a box each, and one in the heading', () => {
  render(<Pickable selectionMode="multiple" />);

  expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  expect(screen.getByRole('checkbox', { name: 'Select All' })).toBeTruthy();
});

/*
 * ONE ROW GETS NO SELECT-ALL, which is not a detail: a box above rows that can
 * only be chosen one at a time offers something the mode cannot do. The column
 * still exists, so the two halves still agree about the cell count.
 */
test('one row at a time gets boxes and no select-all', () => {
  render(<Pickable selectionMode="single" />);

  expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  expect(screen.queryByRole('checkbox', { name: 'Select All' })).toBeNull();
});

/*
 * THE DYNAMIC FORM, which is the whole reason the selection column is
 * prepended to the COLLECTION rather than to the children.
 *
 * Measured twice before this was written: a static JSX sibling before a render
 * function makes the base ignore the function entirely and throw
 * `Cell count must match column count. Found 3 cells and 1 columns.` A data
 * table's columns come from data, so this is the form that matters.
 */
test('and columns that come from data work the same way', () => {
  const columns = [
    { id: 'number', name: 'Number' },
    { id: 'total', name: 'Total' }
  ];

  render(
    <Table aria-label="Invoices" selectionMode="multiple">
      <TableHeader columns={columns}>
        {column => (
          <Column id={column.id} isRowHeader={column.id === 'number'}>
            {column.name}
          </Column>
        )}
      </TableHeader>
      <TableBody items={rows}>
        {row => (
          <Row columns={columns} id={row.id}>
            {column => <Cell>{row[column.id as 'number' | 'total']}</Cell>}
          </Row>
        )}
      </TableBody>
    </Table>
  );

  expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  expect(screen.getByRole('rowheader', { name: 'A-001' })).toBeTruthy();
});

test('several are reported as a list of ids', async () => {
  const onSelectionChange = vi.fn();
  render(
    <Pickable onSelectionChange={onSelectionChange} selectionMode="multiple" />
  );

  await userEvent.click(screen.getAllByRole('checkbox')[1] as HTMLElement);

  expect(onSelectionChange).toHaveBeenCalledWith(['a']);
});

test('and one is reported as an id or null', async () => {
  const onSelectionChange = vi.fn();
  render(
    <Pickable onSelectionChange={onSelectionChange} selectionMode="single" />
  );

  await userEvent.click(screen.getAllByRole('checkbox')[0] as HTMLElement);

  expect(onSelectionChange).toHaveBeenCalledWith('a');
});

/*
 * THE SENTINEL NEVER LEAVES. `selectAll()` stores the literal string `'all'`,
 * so a consumer typed against a list of ids would get a string the first time
 * anybody pressed the heading box — and every `.length` and `.map` on it is a
 * different answer than they expected.
 */
test('select-all reports the rows, not the string "all"', async () => {
  const onSelectionChange = vi.fn();
  render(
    <Pickable onSelectionChange={onSelectionChange} selectionMode="multiple" />
  );

  await userEvent.click(screen.getByRole('checkbox', { name: 'Select All' }));

  expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b']);
});

/*
 * HOW MANY ARE CHOSEN, SAID OUT LOUD. The base announces a ROW's own state as
 * focus moves through it and never the total, so in the product this suite was
 * read against the count changed in silence. Asserted in both directions: the
 * region is empty when nothing is chosen, because "0 selected" announced on
 * every clear is noise rather than information.
 */
test('the count is announced, and says nothing when there is none', async () => {
  render(<Pickable selectionMode="multiple" />);

  const region = screen.getByRole('status');
  expect(region.textContent).toBe('');

  await userEvent.click(screen.getAllByRole('checkbox')[1] as HTMLElement);
  expect(region.textContent).toBe('1 selected');

  await userEvent.click(screen.getAllByRole('checkbox')[2] as HTMLElement);
  expect(region.textContent).toBe('2 selected');
});

/* ────────────────────────────── the widths ──────────────────────────────── */

const Wide = (props: React.ComponentProps<typeof Table>) => (
  <Table aria-label="Invoices" {...props}>
    <TableHeader>
      <Column id="number" isRowHeader minWidth={140}>
        Number
      </Column>
      <Column defaultWidth={200} id="total">
        Total
      </Column>
    </TableHeader>
    <TableBody>
      {rows.map(row => (
        <Row key={row.id} id={row.id}>
          <Cell>{row.number}</Cell>
          <Cell>{row.total}</Cell>
        </Row>
      ))}
    </TableBody>
  </Table>
);

/*
 * THE WARNING THE BASE OWES AND DOES NOT PAY. Measured in wave 0: its own
 * guard for this reads `for (let prop in ['width', …])`, which iterates the
 * array INDICES, so the test is never true and nothing is ever printed — the
 * width is dropped in silence.
 */
test('a width outside a resizable table says so, in development', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  render(<Wide />);

  await vi.waitFor(() => {
    expect(warn).toHaveBeenCalled();
  });
  expect(warn.mock.calls[0]?.[0]).toContain('isResizable');
});

test('and inside one it says nothing', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  render(<Wide isResizable />);
  await screen.findByRole('rowheader', { name: 'A-001' });

  expect(warn).not.toHaveBeenCalled();
});

test('a resizable table gives every draggable column a grip', () => {
  render(<Wide isResizable />);

  /* Two columns, and both can move: one declares a minimum and the other a
     starting width, and neither is fixed. */
  expect(screen.getAllByRole('slider')).toHaveLength(2);
});

/*
 * AND A FIXED COLUMN GETS NONE. A `width` cannot be dragged off, so a handle
 * there would be a control that does nothing — doc 06 §4 rule 7's shape one
 * level down.
 */
test('but a column with a fixed width gets none', () => {
  render(
    <Table aria-label="Invoices" isResizable>
      <TableHeader>
        <Column id="number" isRowHeader width={160}>
          Number
        </Column>
        <Column id="total">Total</Column>
      </TableHeader>
      <TableBody>
        <Row id="a">
          <Cell>A-001</Cell>
          <Cell>120.00</Cell>
        </Row>
      </TableBody>
    </Table>
  );

  expect(screen.getAllByRole('slider')).toHaveLength(1);
});

test('a table that is not resizable has no grips at all', () => {
  render(<Pickable />);

  expect(screen.queryByRole('slider')).toBeNull();
});

/*
 * THE PINNED EDGE IS ALMOST ENTIRELY A BROWSER QUESTION, and the interesting
 * half of this comment is the assertion that is NOT here.
 *
 * Whether a cell is held while its neighbours pass beneath it, whether it is
 * opaque to them, where the corner of two sticky axes lands and whether the
 * overflow indication survives being covered are all layout, and jsdom has
 * none of it. They are in `table.spec.ts` and in the baseline.
 *
 * A second test was written and then deleted, because it could not fail.
 * `Table` consumes `pinnedEdge` and spreads the rest of its props onto the
 * base, so the obvious guard is "the prop we consume must not also reach the
 * DOM". Both shapes of that mistake were measured:
 *
 *   - Leaving it out of the destructuring is a `ReferenceError` — the value is
 *     USED two lines later — and it failed all twenty-six tests in this file,
 *     not one.
 *   - Spreading it onto the base anyway leaks NOTHING. Measured with a control
 *     beside it, so the reading is not a guess about whether the spread
 *     happened at all: `data-leak=yes  pinnededge=null`. The base runs its
 *     props through `filterDOMProps`, which passes `data-*` and drops an
 *     unknown name — the same function `ColorSwatchField` met from the other
 *     side, where it dropped an `aria-invalid` that was wanted.
 *
 * So the assertion had no failing case to guard, which doc 10 §11.7 says is an
 * answer rather than a gap. What is left below is the one contract jsdom can
 * hold this prop to: pinning is a presentational change, so a pinned table
 * contains exactly what an unpinned one contains.
 */
test('a pinned table renders exactly what an unpinned one does', () => {
  const { unmount } = render(<Invoices />);
  const plain = screen.getAllByRole('row').length;
  unmount();

  render(<Invoices pinnedEdge="end" />);

  expect(screen.getAllByRole('row').length).toBe(plain);
  expect(screen.getByRole('rowheader', { name: 'A-001' })).toBeTruthy();
});

/*
 * THE COLUMN'S NAME, WHICH WAS EMPTY IN EVERY SORTABLE TABLE FOR FOUR WAVES.
 *
 * The base builds its sort description from a column node's `textValue`, and
 * derives that from STRING children only — so a component like this one, which
 * always hands the base a render function because it draws the sort mark beside
 * whatever the consumer wrote, emptied it for every column it ever rendered.
 *
 * Asserted here rather than in a browser because the description is DOM rather
 * than layout: `useDescription` puts the string in an element and points
 * `aria-describedby` at it. The live region is the other channel and is the
 * wrong one to read — the base clears it after 500ms, which is a race, and a
 * check that waits on it would be measuring the machine (doc 10 §11.2).
 */
const Sorted = ({ heading }: { heading?: React.ReactNode }) => (
  <Table
    aria-label="Invoices"
    sortDescriptor={{ column: 'number', direction: 'ascending' }}
    onSortChange={() => undefined}
  >
    <TableHeader>
      <Column id="number" allowsSorting isRowHeader>
        {heading ?? 'Number'}
      </Column>
      <Column id="total">Total</Column>
    </TableHeader>
    <TableBody>
      {rows.map(row => (
        <Row key={row.id} id={row.id}>
          <Cell>{row.number}</Cell>
          <Cell>{row.total}</Cell>
        </Row>
      ))}
    </TableBody>
  </Table>
);

const describedText = (): string => {
  const grid = screen.getByRole('grid');
  const id =
    (grid.getAttribute('aria-describedby') ?? '').split(/\s+/)[0] ?? '';
  return document.getElementById(id)?.textContent ?? '';
};

test('a sorted table names the column it is sorted by', () => {
  render(<Sorted />);

  /* Both halves, because "contains Number" is also true of a string with the
     name glued on twice, and "is not empty" is true of the broken case's
     surrounding words. */
  expect(describedText()).toContain('Number');
  expect(describedText()).not.toContain('column  ');
});

test('and a heading it cannot read is said once, rather than announced empty', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  render(<Sorted heading={<span>Number</span>} />);

  expect(describedText()).toContain('column  ');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toContain('not plain text');
});

test('and the consumer’s own route silences it', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  render(
    <Table
      aria-label="Invoices"
      sortDescriptor={{ column: 'number', direction: 'ascending' }}
      onSortChange={() => undefined}
    >
      <TableHeader>
        <Column id="number" allowsSorting isRowHeader textValue="Number">
          <span>Number</span>
        </Column>
      </TableHeader>
      <TableBody>
        {rows.map(row => (
          <Row key={row.id} id={row.id}>
            <Cell>{row.number}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );

  expect(describedText()).toContain('Number');
  expect(warn).not.toHaveBeenCalled();
});

/*
 * THE NAME A FIELD CARRIES IN A CARD, which is the half of wave 5 that is not
 * layout. Whether the cards lay out at all is a container query and jsdom has
 * none — that is `table.spec.ts` and the baseline. What is assertable here is
 * where the name comes FROM: the column's own collection node, so the string is
 * never written a second time.
 */
const Labelled = ({ heading }: { heading?: React.ReactNode }) => (
  <Table aria-label="Invoices">
    <TableHeader>
      <Column id="number" isRowHeader>
        Number
      </Column>
      <Column id="total">{heading ?? 'Total'}</Column>
    </TableHeader>
    <TableBody>
      {rows.map(row => (
        <Row key={row.id} id={row.id}>
          <Cell>{row.number}</Cell>
          <Cell>{row.total}</Cell>
        </Row>
      ))}
    </TableBody>
  </Table>
);

const labelIn = (cell: HTMLElement): string | null =>
  cell.querySelector('.bb-table-field-label')?.textContent ?? null;

test('a field carries its own column’s name, read rather than repeated', () => {
  render(<Labelled />);

  const cells = screen.getAllByRole('gridcell');
  expect(labelIn(cells[0] as HTMLElement)).toBe('Total');
});

test('and the cell that names the row carries none', () => {
  render(<Labelled />);

  /*
   * Measured with an aria snapshot in a browser: a label here renamed the row
   * from "F001-000412" to "NumberF001-000412", and its checkbox with it. A
   * card's title is not a labelled field.
   */
  const title = screen.getByRole('rowheader', { name: 'A-001' });
  expect(labelIn(title)).toBeNull();
});

test('a heading that is not plain text names nothing, rather than something invented', () => {
  render(<Labelled heading={<em>Total</em>} />);

  /*
   * Hard rule 3: the library writes no user-facing text. The element is still
   * rendered — unconditionally, like the sort mark — so the card's grid keeps
   * both of its slots and the value does not slide into the label's column.
   */
  const cells = screen.getAllByRole('gridcell');
  expect(labelIn(cells[0] as HTMLElement)).toBe('');
});

test('and the consumer’s own route fills it', () => {
  render(
    <Table aria-label="Invoices">
      <TableHeader>
        <Column id="number" isRowHeader>
          Number
        </Column>
        <Column id="total" textValue="Total">
          <em>Total</em>
        </Column>
      </TableHeader>
      <TableBody>
        {rows.map(row => (
          <Row key={row.id} id={row.id}>
            <Cell>{row.number}</Cell>
            <Cell>{row.total}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );

  const cells = screen.getAllByRole('gridcell');
  expect(labelIn(cells[0] as HTMLElement)).toBe('Total');
});
