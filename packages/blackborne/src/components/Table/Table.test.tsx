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
  ...body
}: { named?: boolean } & React.ComponentProps<typeof TableBody>) => (
  <Table aria-label="Invoices">
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
  expect(screen.getByRole('gridcell', { name: '80.00' })).toBeTruthy();
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
