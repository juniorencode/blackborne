import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react';
import {
  Cell as AriaCell,
  Checkbox as AriaCheckbox,
  Column as AriaColumn,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  useTableOptions,
  type Selection as AriaSelection,
  type CellProps as AriaCellProps,
  type ColumnProps as AriaColumnProps,
  type RowProps as AriaRowProps,
  type TableBodyProps as AriaTableBodyProps,
  type TableHeaderProps as AriaTableHeaderProps,
  type TableProps as AriaTableProps
} from 'react-aria-components';
import { useConfig, useMessage } from '../../config';
import { CheckGlyph, DashGlyph } from '../../internal/CheckGlyph';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { cx } from '../../internal/cx';
import { isDev } from '../../internal/isDev';
import { mergeRefs } from '../../internal/mergeRefs';
import { Button } from '../Button';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../Skeleton';
import { VisuallyHidden } from '../VisuallyHidden';

/*
 * THE TABLE PIECES. Not a closed table — doc 01 non-goal 4, and the catalog's
 * §3.4 is the piece list this is wave 1 of.
 *
 * Almost everything a table does is the base's: the grid roles, the whole
 * keyboard including typeahead, sorting with `aria-sort` and an announcement
 * in 34 locales, and the semantics of a row header. What is here is the skin
 * and the three things the base leaves undone — its own horizontal scrolling
 * (doc 04 §7), the states a listing is in when it has no rows, and one
 * invariant the base declines to enforce.
 *
 * ## The invariant, and why it is ours
 *
 * Measured in wave 0, in three configurations: a table with no column marked
 * `isRowHeader` does **not** throw and does not warn. What happens instead is
 * that every row loses its accessible name: the base renders
 * `aria-labelledby=""` — the attribute PRESENT and empty, which is worth
 * knowing because a check written with `hasAttribute` passes on exactly the
 * table it exists to catch — and once selection arrives in wave 2, each row's
 * checkbox points
 * `aria-labelledby` at an id that resolves to no element. So the table
 * compiles, renders, types, and hands a screen reader a column of nameless
 * rows. Nothing in the type system can say "at least one of these children
 * carries this prop", so the check is a development warning that reads the
 * outcome rather than the declaration.
 *
 * ## Why the scroller is a separate element
 *
 * Doc 04 §7: the component that produces wide content encloses its own
 * horizontal scrolling, and the consumer's page never scrolls sideways because
 * of us. It is a separate element because the scroll container cannot be the
 * table — `overflow` on a `table` is not a scroll container in the way a block
 * is, and the sticky header needs the scroller to be its nearest scrolling
 * ancestor.
 *
 * That has a consequence worth stating, because it was found by a browser
 * check failing: `overflow-x: auto` makes this element a scroll container in
 * BOTH axes, so a table constrained in height is constrained ON THIS ELEMENT —
 * `className` or `style` on the component, which is the root. A wrapper around
 * it with its own `overflow-y` scrolls the wrapper while the heading row stays
 * stuck to a scroller that never moved, which looks exactly like sticky being
 * broken and is not.
 *
 * The width is `min-w-full` rather than `w-full`, and that is measured rather
 * than stylistic. Wave 0: inside a `ResizableTableContainer` the base merges
 * `width: min-content` into the table's INLINE style, which no class of ours
 * can beat — a two-column table left 842px empty in a 1400px container. A
 * `min-width` wins because it is a property the base does not set, so this
 * declaration is already correct for the wave that adds the resizer.
 */

/* ───────────────────────────────── classes ──────────────────────────────── */

/**
 * One map, per doc 03 §4.4, and every value a semantic token.
 *
 * `box-border` on everything with a border or a declared size: the package
 * ships no reset, so the default is `content-box` and a row declared 40px tall
 * measures 42 (the package guide has the measurement).
 */
const CLASSES = {
  scroller: cx(
    'bb-table-scroller',
    'bb:relative bb:w-full bb:overflow-x-auto bb:box-border',
    'bb:rounded-md bb:border bb:border-solid bb:border-border'
  ),
  /*
   * NO BACKGROUND ON THE TABLE, and the first baseline is what found why.
   * The overflow shadows are background IMAGES on the scroller, and a child
   * with an opaque `background-color` paints over them — so the table covered
   * the indication completely and the picture showed a clipped column with no
   * edge at all. The surface colour is declared on the scroller instead,
   * beside the gradients that need to sit on top of it.
   *
   * It is the `ColorPicker` lesson inverted: there, a `background-image` on
   * the coloured element painted over its own `background-color`, so the
   * pattern had to move one element OUT. Here the shadow was already out and
   * the opaque child had to stop covering it.
   */
  table: cx('bb:min-w-full bb:border-collapse bb:text-sm bb:text-text'),
  header: 'bb:bg-surface-sunken',
  column: cx(
    'bb-table-column',
    'bb:box-border bb:px-(--bb-space-4) bb:py-(--bb-space-3)',
    /* `font-strong`, and `font-medium` is the FOURTH utility in this
       repository found to compile to nothing while looking right — after
       `w-control-md`, `size-box` and `min-w-hit`. The theme names weights by
       ROLE, so it declares `normal` and `strong` and no numeric scale.
       Measured by grepping the compiled stylesheet, which is the only place
       that answers. */
    'bb:text-start bb:align-middle bb:font-strong bb:text-text-muted',
    'bb:whitespace-nowrap',
    'bb:border-b bb:border-solid bb:border-border',
    /* NO `outline-hidden`. That utility sets `outline-style: none` and beats
       an `outline-2` beside it, so the ring never draws — measured on
       `ColorSwatchField`, whose first baseline showed three identical swatches
       on a row labelled "Chosen", and measured again here in a browser before
       this comment existed. A declared TRANSPARENT outline is a real outline
       with a width, a style and a colour, and an author rule beats the
       browser's own `:focus-visible`: one declaration suppresses the default
       and carries the state, where two cancel. The offset is negative because
       the scroller clips, so an outward ring on an edge cell would be cut. */
    'bb:outline-2 bb:outline-offset-[-2px] bb:outline-transparent',
    'bb:data-focus-visible:outline-focus-ring',
    'bb:data-allows-sorting:cursor-pointer',
    'bb:data-allows-sorting:hover:text-text'
  ),
  sortMark: cx(
    'bb-table-sort',
    'bb:ms-(--bb-space-2) bb:inline-flex bb:size-3 bb:shrink-0',
    'bb:align-middle'
  ),
  row: cx(
    'bb:border-b bb:border-solid bb:border-border',
    'bb:last:border-b-0',
    /*
     * A CHOSEN ROW IS TINTED, and the first baseline is what asked for it: the
     * picture showed a checked box beside a row indistinguishable from its
     * neighbours, which makes a selection something you count rather than see.
     * The box is the non-colour channel doc 06 §3 requires, so the tint is the
     * second one rather than the only one.
     *
     * The pair is used together, which the package guide insists on: there is
     * no standalone "text on a chosen row", there is a surface and the colour
     * that goes on it. It is what keeps this readable when a project's brand
     * is amber or lime.
     */
    'bb:data-selected:bg-surface-selected',
    'bb:data-selected:text-surface-selected-on',
    'bb:data-hovered:bg-surface-hover',
    /*
     * A DISABLED ROW SAYS SO, which is gate box 12 and doc 06 §4 rule 7's
     * other half — the WHY belongs to the project, and in a listing it is
     * usually a cell of its own saying "void" or "archived". What the row owes
     * is that it reads as inactive: the text is muted and the hover
     * highlight stops, so pointing at it no longer suggests it can be used.
     *
     * `text-disabled` rather than an opacity, for the reason `Slider` measured:
     * a disabled fill drawn at `surface-disabled` came out at 1.08:1 against
     * its rail in light and 1.00:1 in dark — the same colour exactly — so the
     * value disappeared instead of looking inactive.
     */
    'bb:data-disabled:text-text-disabled',
    'bb:data-disabled:data-hovered:bg-transparent',
    'bb:outline-2 bb:outline-offset-[-2px] bb:outline-transparent',
    'bb:data-focus-visible:outline-focus-ring'
  ),
  cell: cx(
    'bb:box-border bb:px-(--bb-space-4) bb:py-(--bb-space-3)',
    'bb:align-middle',
    /*
     * NO WRAPPING, which the first baseline also found. Without it the browser
     * shrinks the columns toward their min-content width and breaks the text:
     * "Astilleros del Sur" came out on two lines and an invoice number on
     * two more, in a table that was ALSO scrolling. That is the "crushed
     * columns" failure doc 04 §7's enclosure exists to avoid — the table
     * scrolls sideways and stays legible rather than staying narrow and
     * becoming unreadable. Per-column legibility floors are wave 3; this is
     * the floor every cell has.
     */
    'bb:whitespace-nowrap',
    'bb:outline-2 bb:outline-offset-[-2px] bb:outline-transparent',
    'bb:data-focus-visible:outline-focus-ring'
  ),
  absence: 'bb:p-(--bb-space-6)',
  errorBox: cx(
    'bb:flex bb:flex-col bb:items-center bb:gap-(--bb-space-4)',
    'bb:text-center bb:text-danger-text'
  ),
  loadingBox: 'bb:flex bb:flex-col bb:gap-(--bb-space-4)',
  /*
   * The checkbox column is as narrow as the control it holds. `w-0` with
   * `whitespace-nowrap` is the table idiom for "take only what you need": a
   * zero width is a REQUEST in a table, not a command, and the padding plus
   * the box is what it settles at.
   */
  pickColumn: cx(
    'bb-table-column',
    'bb:box-border bb:w-0 bb:whitespace-nowrap',
    'bb:px-(--bb-space-4) bb:py-(--bb-space-3)',
    'bb:border-b bb:border-solid bb:border-border'
  ),
  pickCell: cx(
    'bb:box-border bb:w-0 bb:whitespace-nowrap',
    'bb:px-(--bb-space-4) bb:py-(--bb-space-3) bb:align-middle'
  ),
  /*
   * The base draws the box itself through `slot="selection"`; what is left is
   * the mark's own frame, and it reads the same tokens `Checkbox` does so the
   * two are one control in two places.
   */
  pick: cx(
    'bb:flex bb:size-4 bb:shrink-0 bb:items-center bb:justify-center',
    'bb:box-border bb:rounded-sm bb:border bb:border-solid',
    'bb:border-border-strong bb:bg-surface-control bb:cursor-pointer',
    'bb:data-selected:border-accent bb:data-selected:bg-accent',
    'bb:data-selected:text-accent-on',
    'bb:data-indeterminate:border-accent bb:data-indeterminate:bg-accent',
    'bb:data-indeterminate:text-accent-on',
    'bb:outline-2 bb:outline-offset-2 bb:outline-transparent',
    'bb:data-focus-visible:outline-focus-ring',
    'bb:data-disabled:cursor-not-allowed bb:data-disabled:opacity-50'
  )
} as const;

/* ───────────────────────────────── the root ─────────────────────────────── */

interface TableSharedProps extends Pick<
  AriaTableProps,
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'sortDescriptor'
  | 'onSortChange'
  | 'children'
> {
  /** Only on the root, and never on an internal node (doc 02 §6). */
  className?: string;
  style?: CSSProperties;
}

/** Rows that are read rather than chosen, which is the default. */
export interface TablePlainProps extends TableSharedProps {
  selectionMode?: 'none';
  /* Declared impossible rather than merely absent — see the note below. */
  selectedKey?: never;
  defaultSelectedKey?: never;
  onSelectionChange?: never;
  selectedKeys?: never;
  defaultSelectedKeys?: never;
}

/** One row at a time. */
export interface TableOneProps extends TableSharedProps {
  selectionMode: 'single';
  /**
   * Which row is chosen, by its `id`.
   *
   * A string rather than the base's `string | number`, and never the base's
   * `Selection`: its own types stay out of a consumer's signatures, the same
   * narrowing `ComboBox` and the date family do.
   */
  selectedKey?: string | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultSelectedKey?: string;
  /** Called with the chosen row's `id`, or `null`. */
  onSelectionChange?: (key: string | null) => void;
  selectedKeys?: never;
  defaultSelectedKeys?: never;
}

/** Several rows, with a checkbox on each and one in the heading. */
export interface TableSeveralProps extends TableSharedProps {
  selectionMode: 'multiple';
  /** Which rows are chosen, by their `id`. */
  selectedKeys?: readonly string[];
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultSelectedKeys?: readonly string[];
  /**
   * Called with every chosen `id`, and never with the base's `'all'`.
   *
   * That sentinel is real: `selectAll()` stores the literal string, so a
   * consumer typed against `Set<Key>` gets a string the first time anybody
   * presses the heading checkbox or `Mod+A`. It is expanded here into the rows
   * that are actually there.
   */
  onSelectionChange?: (keys: string[]) => void;
  selectedKey?: never;
  defaultSelectedKey?: never;
}

/**
 * ONE ROW OR SEVERAL, AND THE TWO ARE A UNION rather than a boolean or a mode
 * prop that changes what its neighbours mean.
 *
 * Decision 0022's test, applied: these branches share every prop but one and
 * agree about everything except how many answers are allowed, which is a
 * union. Decision 0014's pagers share no prop and disagree about what a page
 * is, which is two components. A table is the first kind.
 *
 * The absent halves are declared `?: never` rather than left out, and that is
 * what makes the union discriminate for a caller who SPREADS. With the props
 * simply missing from a branch, `{...props}` plus one singular prop matches no
 * member and the error names the wrong thing. Found by `ComboBox`'s own
 * stories, which spread their args — and this component's do too.
 */
export type TableProps = TablePlainProps | TableOneProps | TableSeveralProps;

/**
 * A table, enclosing its own horizontal scrolling.
 *
 * @example
 * <Table aria-label="Invoices" sortDescriptor={sort} onSortChange={setSort}>
 *   <TableHeader>
 *     <Column id="number" isRowHeader allowsSorting>Number</Column>
 *     <Column id="total">Total</Column>
 *   </TableHeader>
 *   <TableBody>
 *     <Row>
 *       <Cell>A-001</Cell>
 *       <Cell>S/ 120.00</Cell>
 *     </Row>
 *   </TableBody>
 * </Table>
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    children,
    className,
    style,
    selectionMode,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    ...tableProps
  },
  ref
) {
  const own = useRef<HTMLTableElement>(null);
  const { locale } = useConfig();
  const selectedLabel = useMessage('rowsSelected');
  const [announced, setAnnounced] = useState(0);

  /*
   * THE ROW HEADER, read as an OUTCOME, and it has to be observed rather than
   * inspected once. Three things were measured to arrive at this shape.
   *
   * The base renders the `<table>` element in our render and fills it in a
   * later pass of its own, which does not re-render this component — so at the
   * time a plain `useEffect` runs, `table.innerHTML` is the empty string.
   * A one-shot check therefore reads zero rows and stays silent on exactly the
   * table it exists to catch. Measured: `tbody=0 tr=0 html=`.
   *
   * A timeout would "fix" that by measuring the machine, which doc 10 §11.2
   * forbids by name. What is waited on here is a STATE — rows exist — so the
   * observer answers whenever that becomes true and never before.
   *
   * And the attribute to read is a NON-EMPTY `aria-labelledby`. The base
   * renders `aria-labelledby=""` on an unnamed row rather than omitting it, so
   * a check written with `hasAttribute` is satisfied by the broken case.
   *
   * Dev only, and it disconnects as soon as it has an answer. A table that is
   * legitimately empty keeps the observer, which is correct: rows arriving
   * later are still checked.
   */
  useEffect(() => {
    if (!isDev()) return undefined;
    const table = own.current;
    if (!table) return undefined;

    const look = (): boolean => {
      const rows = table.querySelectorAll('tbody > tr[data-key]');
      if (rows.length === 0) return false;
      const named = [...rows].some(
        row => (row.getAttribute('aria-labelledby') ?? '') !== ''
      );
      if (!named) {
        console.warn(
          'blackborne: this Table has rows and no column marked ' +
            '`isRowHeader`, so every row is unnamed to a screen reader. The ' +
            'base neither throws nor warns for this — measured — and it ' +
            'renders an EMPTY `aria-labelledby` rather than none, so nothing ' +
            'else will tell you. Once selection is on, each row’s checkbox is ' +
            'named by an id that resolves to nothing. Mark the column that ' +
            'identifies a row.'
        );
      }
      return true;
    };

    if (look()) return undefined;

    const observer = new MutationObserver(() => {
      if (look()) observer.disconnect();
    });
    observer.observe(table, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  });

  /*
   * THE BASE'S SELECTION TYPE STOPS HERE, in both directions.
   *
   * In: one key or a list of them becomes the `Set` the base wants. Out: a
   * `Set` becomes a string or a list of strings — and `'all'` becomes the rows
   * that are actually there.
   *
   * That sentinel is not a curiosity. `selectAll()` stores the literal string
   * `'all'`, so the first press of the heading checkbox or `Mod+A` hands a
   * consumer typed against a set of keys a STRING, and every `.size` and
   * `.has` on it throws. Narrowing it here is the same rule decision 0020
   * applies to dates and decision 0022 to a combo box's keys: the base's own
   * types stay out of a consumer's signatures.
   *
   * It is expanded from the DOM rather than from the collection, and that is
   * deliberate: "all" is the rows a person can see and count, which is what
   * the rendered body holds. Disabled rows are left out, because the base does
   * not select them either. A listing whose "all" means every row on the
   * SERVER is a different feature, it belongs to the project, and §7's row for
   * it says so.
   */
  const asSet = (): Set<string> | undefined => {
    if (selectedKey !== undefined) {
      return selectedKey === null ? new Set() : new Set([selectedKey]);
    }
    if (selectedKeys !== undefined) return new Set(selectedKeys);
    return undefined;
  };

  const asDefaultSet = (): Set<string> | undefined => {
    if (defaultSelectedKey !== undefined) return new Set([defaultSelectedKey]);
    if (defaultSelectedKeys !== undefined) return new Set(defaultSelectedKeys);
    return undefined;
  };

  const everyRow = (): string[] =>
    [...(own.current?.querySelectorAll('tbody > tr[data-key]') ?? [])]
      .filter(row => !row.hasAttribute('data-disabled'))
      .map(row => row.getAttribute('data-key') ?? '')
      .filter(Boolean);

  const report = (selection: AriaSelection): void => {
    const keys =
      selection === 'all' ? everyRow() : [...selection].map(key => String(key));
    setAnnounced(keys.length);
    if (selectionMode === 'multiple') {
      (onSelectionChange as ((keys: string[]) => void) | undefined)?.(keys);
      return;
    }
    (onSelectionChange as ((key: string | null) => void) | undefined)?.(
      keys[0] ?? null
    );
  };

  const chosen = asSet();
  const chosenByDefault = asDefaultSet();

  return (
    <div
      className={cx(CLASSES.scroller, className)}
      {...(style ? { style } : {})}
    >
      <AriaTable
        ref={mergeRefs(ref, own)}
        className={CLASSES.table}
        {...tableProps}
        {...(selectionMode ? { selectionMode } : {})}
        {...(chosen ? { selectedKeys: chosen } : {})}
        {...(chosenByDefault ? { defaultSelectedKeys: chosenByDefault } : {})}
        {...(selectionMode && selectionMode !== 'none'
          ? { onSelectionChange: report }
          : {})}
      >
        {children}
      </AriaTable>
      {/*
       * HOW MANY ARE CHOSEN, SAID OUT LOUD. The base announces a row's own
       * state as focus moves through it and says nothing about the total, so
       * in the product this suite was read against the count changed in
       * silence — a person who had just pressed the heading checkbox had no
       * way to know whether it took four rows or four hundred.
       *
       * `role="status"` rather than `aria-live="assertive"`: choosing a row is
       * not an interruption. The number goes through `Intl` for the reason
       * doc 05 §3 gives — Arabic-Indic digits are the default for `ar-EG`, and
       * a row of Latin digits in an otherwise Arabic interface is the tell
       * that something was concatenated rather than formatted.
       */}
      {selectionMode && selectionMode !== 'none' ? (
        <VisuallyHidden>
          <div role="status">
            {announced === 0
              ? ''
              : selectedLabel.replace(
                  '{count}',
                  new Intl.NumberFormat(locale).format(announced)
                )}
          </div>
        </VisuallyHidden>
      ) : null}
    </div>
  );
});

/* ──────────────────────────────── the header ────────────────────────────── */

export type TableHeaderProps<T extends object> = Pick<
  AriaTableHeaderProps<T>,
  'columns' | 'children' | 'dependencies'
>;

/**
 * The mark inside a selection box, drawn once for both places it appears.
 *
 * The BOX is the base's — `slot="selection"` wires the state, the keyboard and
 * the name, and for a row it points `aria-labelledby` at the row, which is why
 * a table with no `isRowHeader` ends up with a column of checkboxes named by
 * an id that resolves to nothing. What is here is the frame and the glyph.
 */
const Pick = ({ label }: { label?: string }): React.JSX.Element => (
  <AriaCheckbox
    className={CLASSES.pick}
    slot="selection"
    {...(label === undefined ? {} : { 'aria-label': label })}
  >
    {({ isIndeterminate, isSelected }) =>
      isIndeterminate ? <DashGlyph /> : isSelected ? <CheckGlyph /> : null
    }
  </AriaCheckbox>
);

/**
 * The row of column headings. Sticky against the scroller.
 *
 * IT ADDS THE SELECTION COLUMN ITSELF, and so does `Row` — which is the
 * invariant §3.4 said to make true by construction rather than hope for. The
 * base THROWS on a cell count that does not match the column count, with
 * `Cell count must match column count`, so the two have to agree about the
 * extra one every time. The base's own idiom leaves that to the consumer,
 * through `useTableOptions()` in a header they write; a consumer who forgets
 * one half crashes the tree, and one who forgets both silently ships a
 * selectable table with no way to select anything.
 *
 * `useTableOptions()` is how each half learns the mode, and it is read HERE
 * rather than passed down: a prop would be a second source of the same fact,
 * and the two could disagree.
 */
/*
 * THE SENTINEL, and it exists because of a measured limit in the base.
 *
 * A selection column has to be added by US — the base renders none, and
 * leaving it to the consumer means a table that either crashes on the
 * cell-count check or silently ships with no way to select anything.
 *
 * The obvious way is a JSX sibling before `{children}`. It works for a static
 * header and BREAKS the dynamic one: measured twice, with a hand-built array
 * and with real JSX children, `<TableHeader columns={…}><Column/>{fn}</…>`
 * renders the static column and IGNORES the render function entirely —
 * `Cell count must match column count. Found 3 cells and 1 columns.` A data
 * table's columns come from data, so that form is the one that matters.
 *
 * So the column is prepended to the COLLECTION instead of to the children, and
 * the render function is wrapped to recognise it. One object identity, no
 * magic id that a consumer's own data could collide with.
 */
const PICK = { id: '__bb-selection__' };

const withPick = <T extends object>(
  columns: Iterable<T> | undefined,
  children: TableHeaderProps<T>['children'],
  pick: React.ReactElement
): { columns?: Iterable<T>; children: TableHeaderProps<T>['children'] } => {
  if (typeof children !== 'function' || columns === undefined) {
    return {
      ...(columns === undefined ? {} : { columns }),
      children: (
        <>
          {pick}
          {children as React.ReactNode}
        </>
      )
    };
  }
  return {
    columns: [PICK as T, ...columns],
    children: (item: T) =>
      item === (PICK as unknown as T) ? pick : children(item)
  };
};

/**
 * The row of column headings. Sticky against the scroller.
 *
 * IT ADDS THE SELECTION COLUMN ITSELF, and so does `Row` — which is the
 * invariant §3.4 said to make true by construction rather than hope for. The
 * base THROWS on a cell count that does not match the column count, so the two
 * halves have to agree about the extra one every time; the base's own idiom
 * leaves both to the consumer.
 *
 * `useTableOptions()` is how each half learns the mode, and it is read HERE
 * rather than passed down: a prop would be a second source of the same fact,
 * and the two could disagree.
 */
export function TableHeader<T extends object>({
  children,
  columns,
  ...rest
}: TableHeaderProps<T>): React.JSX.Element {
  const { selectionBehavior, selectionMode } = useTableOptions();
  const columnLabel = useMessage('selectionColumn');

  const pick = (
    <AriaColumn className={CLASSES.pickColumn} id={PICK.id} key={PICK.id}>
      {/*
       * The select-all box only when SEVERAL can be chosen: above rows chosen
       * one at a time it would offer something the mode cannot do, and the
       * base leaves the heading empty there for the same reason.
       *
       * But an EMPTY heading is a violation of its own — `empty-table-header`,
       * found by axe on this component's own story — so where there is no box
       * the column says what it is instead. The two are never both there: the
       * box carries the base's own "Select All" in 34 locales, which is a name
       * already.
       */}
      {selectionMode === 'multiple' ? (
        <Pick />
      ) : (
        <VisuallyHidden>{columnLabel}</VisuallyHidden>
      )}
    </AriaColumn>
  );

  const composed =
    selectionBehavior === 'toggle'
      ? withPick(columns, children, pick)
      : { ...(columns === undefined ? {} : { columns }), children };

  return <AriaTableHeader className={CLASSES.header} {...rest} {...composed} />;
}

export type ColumnProps = Pick<
  AriaColumnProps,
  'id' | 'allowsSorting' | 'isRowHeader' | 'textValue' | 'children'
>;

/**
 * One column heading.
 *
 * The sort mark is rendered unconditionally on a sortable column and hidden
 * with a variant, never added and removed: a mark that appears changes the
 * heading's width, so the whole row of headings shifts the first time anybody
 * sorts. Same reason a select's tick is drawn on every row.
 */
export const Column = forwardRef<HTMLTableCellElement, ColumnProps>(
  function Column({ children, ...columnProps }, ref) {
    return (
      <AriaColumn ref={ref} className={CLASSES.column} {...columnProps}>
        {values => (
          <>
            {typeof children === 'function' ? children(values) : children}
            {values.allowsSorting ? (
              <span
                aria-hidden="true"
                className={cx(
                  CLASSES.sortMark,
                  values.sortDirection === undefined
                    ? 'bb:opacity-0'
                    : 'bb:opacity-100',
                  values.sortDirection === 'ascending'
                    ? 'bb:rotate-180'
                    : undefined
                )}
              >
                <ChevronGlyph />
              </span>
            ) : null}
          </>
        )}
      </AriaColumn>
    );
  }
);

/* ───────────────────────────────── the body ─────────────────────────────── */

export interface TableBodyProps<T extends object> extends Pick<
  AriaTableBodyProps<T>,
  'items' | 'children' | 'dependencies'
> {
  /**
   * Nothing has arrived yet.
   *
   * The rows are not rendered while this is on, so the absence below is what
   * shows — this is the state of a listing with no rows, not of a listing
   * fetching more. Loading more rows onto a list that already has some is
   * incremental loading, which is a §7 row pending a case.
   */
  isLoading?: boolean;
  /**
   * What went wrong, in the project's own words.
   *
   * The library presents an error and never writes one (non-goal 5). An error
   * outranks loading: a failed request is not still in flight.
   */
  error?: ReactNode;
  /** Offered beside the error, when there is something to try again. */
  onRetry?: () => void;
  /**
   * What to show when there are no rows and nothing is wrong.
   *
   * Doc 09 §6 keeps two states apart and only the project can tell them
   * apart: "there is nothing yet" tells somebody how to start, "the filter
   * matched nothing" tells them what was searched. Left out, the fallback is
   * the first one.
   */
  emptyState?: ReactNode;
}

export function TableBody<T extends object>({
  isLoading,
  error,
  onRetry,
  emptyState,
  children,
  ...rest
}: TableBodyProps<T>): React.JSX.Element {
  const loadingLabel = useMessage('loading');
  const retryLabel = useMessage('retry');

  const absence = (): ReactNode => {
    if (error !== undefined) {
      return (
        <div className={cx(CLASSES.absence, CLASSES.errorBox)}>
          <div>{error}</div>
          {onRetry ? (
            <Button variant="secondary" size="sm" onPress={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
        </div>
      );
    }
    if (isLoading) {
      return (
        <div
          aria-label={loadingLabel}
          className={cx(CLASSES.absence, CLASSES.loadingBox)}
          role="status"
        >
          <Skeleton lines={3} variant="text" />
        </div>
      );
    }
    return (
      <div className={CLASSES.absence}>{emptyState ?? <EmptyState />}</div>
    );
  };

  const quiet = error !== undefined || isLoading === true;

  return (
    <AriaTableBody
      renderEmptyState={absence}
      {...(quiet ? {} : rest)}
      {...(quiet ? { children: [] } : { children })}
    />
  );
}

/* ────────────────────────────── rows and cells ──────────────────────────── */

export type RowProps<T extends object> = Pick<
  AriaRowProps<T>,
  'id' | 'columns' | 'children' | 'dependencies' | 'textValue' | 'isDisabled'
>;

export function Row<T extends object>({
  children,
  columns,
  ...rest
}: RowProps<T>): React.JSX.Element {
  const { selectionBehavior } = useTableOptions();

  const pick = (
    <AriaCell className={CLASSES.pickCell} key={PICK.id}>
      <Pick />
    </AriaCell>
  );

  const composed =
    selectionBehavior === 'toggle'
      ? withPick(columns, children as TableHeaderProps<T>['children'], pick)
      : { ...(columns === undefined ? {} : { columns }), children };

  return (
    <AriaRow
      className={CLASSES.row}
      {...rest}
      {...(composed as {
        columns?: Iterable<T>;
        children: RowProps<T>['children'];
      })}
    />
  );
}

export type CellProps = Pick<
  AriaCellProps,
  'id' | 'textValue' | 'colSpan' | 'children'
>;

export const Cell = forwardRef<HTMLTableCellElement, CellProps>(function Cell(
  { children, ...cellProps },
  ref
) {
  return (
    <AriaCell ref={ref} className={CLASSES.cell} {...cellProps}>
      {children}
    </AriaCell>
  );
});
