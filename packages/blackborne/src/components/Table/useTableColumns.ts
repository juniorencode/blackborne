import { useCallback, useMemo, useState } from 'react';
import { isDev } from '../../internal/isDev';

/*
 * WHICH COLUMNS ARE THERE, IN WHAT ORDER, AND THE ONE THING THIS HOOK REFUSES
 * TO DO.
 *
 * ## Why it is a hook
 *
 * P6: logic lives in hooks or pure functions, testable without rendering. Which
 * columns a person has hidden and what order they dragged them into is logic —
 * it has an order, a restore, and a rule about the last visible column — and
 * none of it needs a DOM. Everything here is tested without mounting anything.
 *
 * ## Why it does not remember anything
 *
 * P3 is not negotiable and is enforced by lint: the library writes to no
 * `localStorage`, no `document` and no singleton. So "remember my columns"
 * belongs to the PROJECT, and what this gives them is the shape to store: an
 * `arrangement` that is two arrays of ids, and an `onArrangementChange` to hear
 * about. Uncontrolled it keeps its own; controlled, the project does — the
 * shape `useToasts` set, where the queue belongs to the consumer.
 *
 * It also repairs a defect measured in the product this suite was read
 * against, where preferences fell back to a per-path local key whenever a
 * provider was not mounted — so in tests and in half the screens they never
 * reached the server at all. State that has one home cannot do that.
 *
 * ## There is no column KIND, and that is a decision
 *
 * The product this was read from declares `type: 'currency' | 'date' | 'tags' |
 * …` — thirteen of them — and gets a cell renderer, a skeleton and a minimum
 * width from it. It is the prop that grows forever, which §7 names as a warning
 * sign, and it was already broken: four of its own declared types had no
 * renderer and rendered nothing at all, silently.
 *
 * So a column here declares what only a column can know, and its own type
 * parameter carries whatever else the project wants — a formatter, a text
 * accessor for an export, an alignment. The hook passes those through
 * untouched. What is painted is composition, out of components this library
 * already ships.
 *
 * ## What the export shape is
 *
 * `columns` IS it. Doc 01 §4.1 says the library hands over the shape and the
 * project performs the act, and for an export the shape is exactly "the
 * visible columns, in the order the person arranged them". Because the type
 * parameter is the project's, the accessor they need travels with it.
 */

/** The least a column has to say about itself. */
export interface TableColumnSpec {
  /** Matches the `id` of the `Column` and of every `Cell` under it. */
  id: string;
  /**
   * Hidden until somebody asks for it.
   *
   * A listing usually has more columns than fit, and the ones that matter to
   * everybody go first. This is about the FIRST view; what a person does after
   * that is the arrangement.
   */
  isHiddenByDefault?: boolean;
  /**
   * Cannot be hidden or moved.
   *
   * For the column that identifies a row, which is also the one that has to
   * carry `isRowHeader`: a table whose identifying column has been hidden
   * leaves every row named by nothing, and that is the measured failure the
   * component already warns about.
   */
  isLocked?: boolean;
}

/** What the project stores, and hands back. Two lists of ids and nothing else. */
export interface TableArrangement {
  /** Every column the person has put in an order, first to last. */
  order: readonly string[];
  /** The ones they have hidden. */
  hidden: readonly string[];
}

export interface UseTableColumnsOptions {
  /** The arrangement to show. Controlled — the project holds it. */
  arrangement?: TableArrangement;
  /** The uncontrolled starting point (doc 02 §8). */
  defaultArrangement?: TableArrangement;
  /** Called whenever the arrangement changes, controlled or not. */
  onArrangementChange?: (arrangement: TableArrangement) => void;
}

export interface TableColumns<T extends TableColumnSpec> {
  /** The visible columns, in the person's order. This is what a table renders — and what an export follows. */
  columns: T[];
  /** Every column, in the person's order, each saying whether it is showing. */
  all: Array<T & { isVisible: boolean }>;
  /** Show one. Does nothing to a column that is already showing. */
  show: (id: string) => void;
  /** Hide one. Refuses the last visible column and anything locked — see below. */
  hide: (id: string) => void;
  /** Show it if it is hidden, hide it if it is not. */
  toggle: (id: string) => void;
  /** Put a column at a position among the others, counting from zero. */
  move: (id: string, to: number) => void;
  /** Put everything back the way it was declared. */
  restore: () => void;
  /** Whether anything has been hidden or moved, so a control can offer `restore`. */
  isArranged: boolean;
  /** The two lists, for the project to store wherever it stores things. */
  arrangement: TableArrangement;
}

/** The declared order, with nothing hidden but what asked to be. */
const asDeclared = <T extends TableColumnSpec>(
  specs: readonly T[]
): TableArrangement => ({
  order: specs.map(spec => spec.id),
  hidden: specs.filter(spec => spec.isHiddenByDefault).map(spec => spec.id)
});

/**
 * The arrangement, reconciled against what the columns actually are.
 *
 * A stored arrangement outlives the code that made it: a column is added in a
 * release and is in no stored order, another is removed and is still in one.
 * Both are the normal case rather than an error, so a declared column missing
 * from the order keeps its declared position and a stored id matching nothing
 * is dropped. The product this was read from invented an order from array
 * position with no note on what happens when the two disagree.
 */
const reconcile = <T extends TableColumnSpec>(
  specs: readonly T[],
  arrangement: TableArrangement
): Array<T & { isVisible: boolean }> => {
  const byId = new Map(specs.map(spec => [spec.id, spec]));
  const placed = arrangement.order.filter(id => byId.has(id));
  const missing = specs
    .map(spec => spec.id)
    .filter(id => !placed.includes(id))
    .map(id => ({ id, at: specs.findIndex(spec => spec.id === id) }));

  const order = [...placed];
  for (const { id, at } of missing) order.splice(at, 0, id);

  const hidden = new Set(arrangement.hidden);
  return order.map(id => {
    const spec = byId.get(id) as T;
    return { ...spec, isVisible: spec.isLocked === true || !hidden.has(id) };
  });
};

/**
 * The columns of a table, as a person has arranged them.
 *
 * @example
 * const columns = useTableColumns([
 *   { id: 'number', name: 'Number', isLocked: true },
 *   { id: 'customer', name: 'Customer' },
 *   { id: 'issued', name: 'Issued', isHiddenByDefault: true }
 * ]);
 *
 * <TableHeader columns={columns.columns}>
 *   {column => <Column id={column.id}>{column.name}</Column>}
 * </TableHeader>
 */
export function useTableColumns<T extends TableColumnSpec>(
  specs: readonly T[],
  options: UseTableColumnsOptions = {}
): TableColumns<T> {
  const { arrangement, defaultArrangement, onArrangementChange } = options;

  const declared = useMemo(() => asDeclared(specs), [specs]);
  const [own, setOwn] = useState<TableArrangement>(
    defaultArrangement ?? declared
  );

  const current = arrangement ?? own;

  const settle = useCallback(
    (next: TableArrangement) => {
      if (arrangement === undefined) setOwn(next);
      onArrangementChange?.(next);
    },
    [arrangement, onArrangementChange]
  );

  const all = useMemo(() => reconcile(specs, current), [specs, current]);

  const hide = useCallback(
    (id: string) => {
      const spec = all.find(column => column.id === id);
      if (!spec || !spec.isVisible) return;

      if (spec.isLocked === true) {
        if (isDev()) {
          console.warn(
            `blackborne: the column "${id}" is locked and cannot be hidden. A locked column is the one that identifies a row, and a table without it leaves every row named by nothing.`
          );
        }
        return;
      }

      /*
       * THE LAST ONE CANNOT GO. A table with no columns is not a narrower
       * table, it is a broken one — and the product this was read from had no
       * route back at all, because its restore was unreachable. Refused here
       * rather than prevented in a dialog, so every caller inherits it.
       */
      if (all.filter(column => column.isVisible).length <= 1) {
        if (isDev()) {
          console.warn(
            `blackborne: "${id}" is the only column still showing, so hiding it would leave the table with none. Show another first.`
          );
        }
        return;
      }

      settle({
        order: current.order.length > 0 ? current.order : all.map(c => c.id),
        hidden: [...new Set([...current.hidden, id])]
      });
    },
    [all, current, settle]
  );

  const show = useCallback(
    (id: string) => {
      if (!current.hidden.includes(id)) return;
      settle({
        order: current.order.length > 0 ? current.order : all.map(c => c.id),
        hidden: current.hidden.filter(hiddenId => hiddenId !== id)
      });
    },
    [all, current, settle]
  );

  const toggle = useCallback(
    (id: string) => {
      const spec = all.find(column => column.id === id);
      if (spec?.isVisible === true) hide(id);
      else show(id);
    },
    [all, hide, show]
  );

  const move = useCallback(
    (id: string, to: number) => {
      const order = all.map(column => column.id);
      const from = order.indexOf(id);
      if (from === -1) return;

      const spec = all[from];
      if (spec?.isLocked === true) {
        if (isDev()) {
          console.warn(
            `blackborne: the column "${id}" is locked and cannot be moved.`
          );
        }
        return;
      }

      const at = Math.max(0, Math.min(to, order.length - 1));
      if (at === from) return;

      order.splice(from, 1);
      order.splice(at, 0, id);
      settle({ order, hidden: current.hidden });
    },
    [all, current, settle]
  );

  const restore = useCallback(() => {
    settle(declared);
  }, [declared, settle]);

  const isArranged = useMemo(() => {
    const order = all.map(column => column.id);
    return (
      order.join() !== declared.order.join() ||
      [...current.hidden].sort().join() !== [...declared.hidden].sort().join()
    );
  }, [all, current, declared]);

  return {
    columns: all
      .filter(column => column.isVisible)
      .map(({ isVisible, ...spec }) => {
        void isVisible;
        return spec as unknown as T;
      }),
    all,
    show,
    hide,
    toggle,
    move,
    restore,
    isArranged,
    arrangement: {
      order: all.map(column => column.id),
      hidden: current.hidden
    }
  };
}
