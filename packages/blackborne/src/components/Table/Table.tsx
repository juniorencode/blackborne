import {
  forwardRef,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode
} from 'react';
import {
  Cell as AriaCell,
  Column as AriaColumn,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  type CellProps as AriaCellProps,
  type ColumnProps as AriaColumnProps,
  type RowProps as AriaRowProps,
  type TableBodyProps as AriaTableBodyProps,
  type TableHeaderProps as AriaTableHeaderProps,
  type TableProps as AriaTableProps
} from 'react-aria-components';
import { useMessage } from '../../config';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { cx } from '../../internal/cx';
import { isDev } from '../../internal/isDev';
import { mergeRefs } from '../../internal/mergeRefs';
import { Button } from '../Button';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../Skeleton';

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
  loadingBox: 'bb:flex bb:flex-col bb:gap-(--bb-space-4)'
} as const;

/* ───────────────────────────────── the root ─────────────────────────────── */

export interface TableProps extends Pick<
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
  { children, className, style, ...tableProps },
  ref
) {
  const own = useRef<HTMLTableElement>(null);

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

  return (
    <div
      className={cx(CLASSES.scroller, className)}
      {...(style ? { style } : {})}
    >
      <AriaTable
        ref={mergeRefs(ref, own)}
        className={CLASSES.table}
        {...tableProps}
      >
        {children}
      </AriaTable>
    </div>
  );
});

/* ──────────────────────────────── the header ────────────────────────────── */

export type TableHeaderProps<T extends object> = Pick<
  AriaTableHeaderProps<T>,
  'columns' | 'children' | 'dependencies'
>;

/** The row of column headings. Sticky against the scroller. */
export function TableHeader<T extends object>({
  children,
  ...rest
}: TableHeaderProps<T>): React.JSX.Element {
  return (
    <AriaTableHeader className={CLASSES.header} {...rest}>
      {children}
    </AriaTableHeader>
  );
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
  ...rest
}: RowProps<T>): React.JSX.Element {
  return (
    <AriaRow className={CLASSES.row} {...rest}>
      {children}
    </AriaRow>
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
