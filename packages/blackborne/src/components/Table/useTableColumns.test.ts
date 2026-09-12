/*
 * The columns a person arranges, tested without mounting a table.
 *
 * P6: logic lives in hooks, with tests that render nothing. There is no DOM in
 * this file and no component — which is the point, because none of what is
 * asserted here needs one. The table that consumes it is tested separately.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useTableColumns, type TableColumnSpec } from './useTableColumns';

afterEach(() => {
  vi.restoreAllMocks();
});

type Column = TableColumnSpec & { name: string };

const COLUMNS: Column[] = [
  { id: 'number', name: 'Number', isLocked: true },
  { id: 'customer', name: 'Customer' },
  { id: 'status', name: 'Status' },
  { id: 'issued', name: 'Issued', isHiddenByDefault: true }
];

const ids = (columns: readonly Column[]) => columns.map(column => column.id);

test('it starts as declared, with what asked to be hidden hidden', () => {
  const { result } = renderHook(() => useTableColumns(COLUMNS));

  expect(ids(result.current.columns)).toEqual(['number', 'customer', 'status']);
  expect(result.current.all).toHaveLength(4);
  expect(result.current.isArranged).toBe(false);
});

test('a hidden column can be shown, and shown again does nothing', () => {
  const { result } = renderHook(() => useTableColumns(COLUMNS));

  act(() => {
    result.current.show('issued');
  });
  expect(ids(result.current.columns)).toContain('issued');
  expect(result.current.isArranged).toBe(true);

  const before = result.current.arrangement;
  act(() => {
    result.current.show('issued');
  });
  expect(result.current.arrangement).toEqual(before);
});

test('and a shown one can be hidden', () => {
  const { result } = renderHook(() => useTableColumns(COLUMNS));

  act(() => {
    result.current.hide('status');
  });

  expect(ids(result.current.columns)).toEqual(['number', 'customer']);
});

test('toggle goes both ways', () => {
  const { result } = renderHook(() => useTableColumns(COLUMNS));

  act(() => {
    result.current.toggle('status');
  });
  expect(ids(result.current.columns)).not.toContain('status');

  act(() => {
    result.current.toggle('status');
  });
  expect(ids(result.current.columns)).toContain('status');
});

/*
 * THE TWO REFUSALS, and both are measured failures rather than taste.
 *
 * A locked column is the one that identifies a row, which is also the one that
 * carries `isRowHeader` — hidden, every row is named by nothing, which is the
 * silent failure wave 0 measured. And a table with no columns at all is not a
 * narrower table: the product this suite was read against prevented it in a
 * dialog and had no route back, because its restore was unreachable.
 */
test('a locked column cannot be hidden, and says so once', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { result } = renderHook(() => useTableColumns(COLUMNS));

  act(() => {
    result.current.hide('number');
  });

  expect(ids(result.current.columns)).toContain('number');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toContain('locked');
});

test('nor can it be moved', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { result } = renderHook(() => useTableColumns(COLUMNS));

  act(() => {
    result.current.move('number', 2);
  });

  expect(ids(result.current.columns)[0]).toBe('number');
  expect(warn).toHaveBeenCalledTimes(1);
});

test('the last visible column cannot go either', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const plain: Column[] = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' }
  ];
  const { result } = renderHook(() => useTableColumns(plain));

  act(() => {
    result.current.hide('a');
  });
  expect(ids(result.current.columns)).toEqual(['b']);

  act(() => {
    result.current.hide('b');
  });
  expect(ids(result.current.columns)).toEqual(['b']);
  expect(warn.mock.calls.at(-1)?.[0]).toContain('only column still showing');
});

test('a column moves, and the others close up behind it', () => {
  const { result } = renderHook(() => useTableColumns(COLUMNS));

  act(() => {
    result.current.move('status', 1);
  });

  expect(result.current.arrangement.order).toEqual([
    'number',
    'status',
    'customer',
    'issued'
  ]);
});

test('restore puts everything back, hidden columns included', () => {
  const { result } = renderHook(() => useTableColumns(COLUMNS));

  act(() => {
    result.current.hide('status');
  });
  act(() => {
    result.current.show('issued');
  });
  act(() => {
    result.current.move('customer', 2);
  });
  expect(result.current.isArranged).toBe(true);

  act(() => {
    result.current.restore();
  });

  expect(ids(result.current.columns)).toEqual(['number', 'customer', 'status']);
  expect(result.current.isArranged).toBe(false);
});

/* ────────────────────────── the project's to keep ───────────────────────── */

test('controlled, the hook holds nothing and only reports', () => {
  const onArrangementChange = vi.fn();
  const arrangement = {
    order: ['number', 'customer', 'status', 'issued'],
    hidden: []
  };
  const { result } = renderHook(() =>
    useTableColumns(COLUMNS, { arrangement, onArrangementChange })
  );

  act(() => {
    result.current.hide('status');
  });

  /* Reported, and NOT applied: the project holds it, so nothing moves until
     they hand a new arrangement back. */
  expect(onArrangementChange).toHaveBeenCalledWith({
    order: ['number', 'customer', 'status', 'issued'],
    hidden: ['status']
  });
  expect(ids(result.current.columns)).toContain('status');
});

test('and uncontrolled it reports as well, so a project can store either way', () => {
  const onArrangementChange = vi.fn();
  const { result } = renderHook(() =>
    useTableColumns(COLUMNS, { onArrangementChange })
  );

  act(() => {
    result.current.hide('status');
  });

  expect(onArrangementChange).toHaveBeenCalledTimes(1);
  expect(ids(result.current.columns)).not.toContain('status');
});

/*
 * A STORED ARRANGEMENT OUTLIVES THE CODE THAT MADE IT, and both directions are
 * the normal case rather than an error. The product this was read from invented
 * an order from array position with no note on what happens when the two
 * disagree.
 */
test('a column added since the arrangement was stored keeps its declared place', () => {
  const { result } = renderHook(() =>
    useTableColumns(COLUMNS, {
      arrangement: { order: ['number', 'status', 'issued'], hidden: [] }
    })
  );

  expect(result.current.arrangement.order).toEqual([
    'number',
    'customer',
    'status',
    'issued'
  ]);
});

test('and an id for a column that no longer exists is dropped', () => {
  const { result } = renderHook(() =>
    useTableColumns(COLUMNS, {
      arrangement: {
        order: ['number', 'gone', 'customer', 'status', 'issued'],
        hidden: ['gone']
      }
    })
  );

  expect(result.current.arrangement.order).not.toContain('gone');
  expect(result.current.all).toHaveLength(4);
});

/*
 * THE EXPORT SHAPE, which is doc 01 §4.1 in one assertion: the library hands
 * over the arrangement and the project performs the act. Whatever the project
 * put on its own column type travels with it, so the accessor an export needs
 * is already there.
 */
test('the visible columns carry whatever the project declared on them', () => {
  type Rich = TableColumnSpec & {
    name: string;
    text: (row: { total: number }) => string;
  };
  const rich: Rich[] = [
    { id: 'number', name: 'Number', text: () => 'n' },
    { id: 'total', name: 'Total', text: row => row.total.toFixed(2) }
  ];

  const { result } = renderHook(() => useTableColumns(rich));

  expect(result.current.columns[1]?.text({ total: 12 })).toBe('12.00');
});
