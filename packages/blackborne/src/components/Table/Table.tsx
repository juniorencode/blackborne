import {
  createContext,
  forwardRef,
  useContext,
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
  ColumnResizer as AriaColumnResizer,
  ResizableTableContainer,
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
import { useDevWarning } from '../../internal/useDevWarning';
import {
  CONTAINER_STEPS,
  useContainerStep
} from '../../internal/useContainerStep';
import { TableStep } from './RowActions';
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
 * That sentence was TRUE OF THE BASE AND FALSE OF THIS COMPONENT for four
 * waves, which is worth leaving in rather than quietly correcting. The
 * announcement exists and names a column, and this component was handing the
 * base a render function for every heading — so the name it announced was the
 * empty string. Inheriting a capability is not the same as keeping it; see
 * `Column`.
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

/* ──────────────────── where the pinned column's edge is ─────────────────── */

/**
 * Publishes the pinned column's width on the scroller, as `--bb-table-pin`.
 *
 * ## Why a number has to cross at all
 *
 * The scroller's overflow indication is four background layers and no
 * JavaScript — two covers that scroll WITH the content and two shadows that
 * stay against the box, so a shadow shows exactly while its edge has something
 * behind it. A pinned column is opaque and sits on the trailing edge, so it
 * covers that pair completely: measured, the pinned cell read identically with
 * the gradients on and off. The pair has to move inward by the column's width,
 * and CSS cannot ask an element how wide it is on behalf of an ancestor.
 *
 * What crosses is a WIDTH and never a scroll position, which is the line this
 * component has held since wave 0. A width cannot disagree with the paint,
 * because it does not know where the paint is — the covering and uncovering is
 * still done entirely by `background-attachment`, on a frame the browser
 * chooses. A scroll listener would be a second opinion about something the
 * compositor already knows.
 *
 * ## Why it is re-queried rather than remembered
 *
 * The pinned column is `:last-child` rather than a column somebody named, so
 * its identity changes on its own: hide the last column through the
 * arrangement hook and the one before it becomes the pinned one. Two observers
 * cover the two ways that can happen — sizes for when the same cell grows, and
 * mutations for when a different cell becomes last — and the size observer is
 * re-pointed at whatever the query answers rather than being set up once.
 *
 * Waiting on a MUTATION rather than on a timeout is the same choice the
 * row-header warning above makes, and for the same measured reason: the base
 * fills this table in a pass of its own that does not re-render us, so at the
 * time an effect runs there is no `thead` to measure yet.
 *
 * Where there is no `ResizeObserver` the width is never published and the
 * fallback `0px` leaves the pair where it already was. That is the floor doc 04
 * §4.1 asks for rather than a gap: in jsdom nothing is painted, and on a first
 * paint it is one frame of an indication that has not arrived.
 */
function usePinnedWidth(
  box: React.RefObject<HTMLElement | null>,
  table: React.RefObject<HTMLTableElement | null>,
  isPinned: boolean
): void {
  useEffect(() => {
    const scroller = box.current;
    const el = table.current;
    if (!scroller || !el || !isPinned) return undefined;
    if (typeof ResizeObserver === 'undefined') return undefined;

    const write = (cell: Element): void => {
      scroller.style.setProperty(
        '--bb-table-pin',
        `${String(cell.getBoundingClientRect().width)}px`
      );
    };

    let watched: Element | null = null;
    const sizes = new ResizeObserver(entries => {
      const target = entries[0]?.target;
      if (target) write(target);
    });

    const point = (): void => {
      const cell = el.querySelector('thead > tr > *:last-child');
      if (!cell) return;
      if (cell !== watched) {
        if (watched) sizes.unobserve(watched);
        sizes.observe(cell);
        watched = cell;
      }
      write(cell);
    };

    const structure = new MutationObserver(point);
    structure.observe(el, { childList: true, subtree: true });
    point();

    return () => {
      structure.disconnect();
      sizes.disconnect();
      scroller.style.removeProperty('--bb-table-pin');
    };
  }, [box, table, isPinned]);
}

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
    /*
     * A QUERY CONTAINER, and doc 04 §4.3's law is why `w-full` is beside it
     * rather than somewhere else: inline-size containment computes an
     * element's width as though it had no contents, so a container that is
     * sized BY its contents collapses — which is how every popover in this
     * catalog once came to be 2px wide. This one declares its width, so it may
     * declare the container too.
     *
     * The four step classes are the scale's own container variants, so no
     * threshold is written in JavaScript anywhere (doc 04 §6.2). The table
     * reads the resolved value and publishes it to every row.
     */
    'bb:@container',
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
  /*
   * THE OBSERVED ELEMENT, and it is a zero-height strip rather than the
   * scroller or the table, for two measured reasons.
   *
   * Not the scroller: a container query resolves against the nearest ANCESTOR
   * container, never against the element that declares one. With the four step
   * classes on the same element as `@container`, `--bb-step` read `base` at
   * every width — so a 760px table folded its actions into a menu with room to
   * spare, which is what the first browser probe found.
   *
   * Not the table either: doc 04 §11.3. An observed element has to CHANGE SIZE
   * with the container, and a table inside a scroller is as wide as its
   * content — 408px in a 640px box and 408px in a 320px one was what
   * `RangeCalendar` measured, and an observer that never fires reads the step
   * once and never again.
   *
   * So it is §11.3's own prescription: a full-width strip that is observed,
   * beside the content that is not. `h-0` and `aria-hidden`, because it exists
   * to be measured and there is nothing in it to read.
   */
  probe: cx('bb:h-0 bb:w-full', CONTAINER_STEPS),
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
    /*
     * `border-b` AND NOT `border-b border-solid`, which is the package guide's
     * accordion trap and which this component had shipped since wave 1. With
     * no preflight there is no `border-width: 0` anywhere, so the style utility
     * sets all four sides SOLID and the three with no declared width keep the
     * browser's initial `medium`. Measured in paint, sampling across a row
     * boundary and across two heading cells: `217,217,224` at -2, -1 and 0 —
     * a THREE pixel line, in a library whose every other border is one. The
     * heading's vertical separators were not designed either; they were the
     * same accident seen from the side.
     *
     * The per-side utility needs no help: Tailwind emits
     * `border-bottom-style: var(--tw-border-style)` with that variable
     * registered at `solid`.
     */
    'bb:border-b bb:border-border',
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
    /*
     * THE COLOUR IS A VARIABLE THE ROW PUBLISHES, not a class per state, and
     * `Table.css` carries the rules and the reason. Two things read it: the
     * row itself, and any cell that has to be opaque over the row it belongs
     * to — which is what a pinned column is. Written twice as utilities, the
     * two would have drifted the first time a state was added to one of them.
     */
    'bb-table-row',
    'bb:border-b bb:border-border',
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
    'bb:data-selected:text-surface-selected-on',
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
    'bb:border-b bb:border-border'
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
  /*
   * The grip. The base renders a real `input[type=range]`, so the keyboard,
   * the announcement in localized pixels and its own name all come free — what
   * is missing is that anybody can SEE it, which is this.
   *
   * `cursor-col-resize` and not `cursor-ew-resize`: the first says what the
   * thing does and the second says which way it moves, and a column is resized
   * along its own axis whatever the reading direction.
   *
   * The line is a `::before` rather than a border on the input, because the
   * input is the whole grab area — comfortably wider than the line a person
   * sees — and a border would draw the wrong thing at the wrong width.
   */
  /*
   * `inset-y-0` and `end-0`, and the first version of this line wrote
   * `inset-block-0` and `inset-inline-end-0` — which are CSS PROPERTY names
   * rather than Tailwind utilities, so all four compiled to nothing and the
   * grip came out 12 pixels wide and ZERO tall. Measured: the whole stylesheet
   * contains no `inset-*` utility at all.
   *
   * `inset-y` is the block axis, which does not mirror, so it is not what
   * hard rule 2 is about; `end` is the logical one and is why the grip lands
   * on the trailing edge in Arabic without a second rule.
   *
   * That is the FIFTH utility in this repository found to produce no rule
   * while looking right, after `w-control-md`, `size-box`, `min-w-hit` and
   * `font-medium` — and the only thing that ever answers is the compiled
   * stylesheet.
   */
  resizer: cx(
    'bb:absolute bb:inset-y-0 bb:end-0 bb:box-border bb:z-3',
    'bb:w-(--bb-space-4) bb:cursor-col-resize bb:touch-none',
    'bb:appearance-none bb:bg-transparent bb:p-0',
    'bb:before:absolute bb:before:inset-y-(--bb-space-2)',
    'bb:before:end-(--bb-space-2) bb:before:w-px',
    "bb:before:bg-border bb:before:content-['']",
    'bb:hover:before:inset-y-0 bb:hover:before:bg-border-strong',
    /* `w-(--bb-space-1)` and not `w-0.5`: this theme names its spacing steps and
       declares no numeric scale, so the fractional utility produced no rule.
       Sixth of its kind, and caught the same way as the other five. */
    'bb:data-resizing:before:inset-y-0',
    'bb:data-resizing:before:w-(--bb-space-1)',
    'bb:data-resizing:before:bg-accent',
    'bb:outline-2 bb:outline-offset-[-2px] bb:outline-transparent',
    'bb:data-focus-visible:outline-focus-ring'
  ),
  resizableColumn: 'bb:relative',
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
  /**
   * Columns can be dragged wider and narrower.
   *
   * Opt-in, and it has to be: inside the base's resizable container the table
   * gets `table-layout: fixed` and a pixel width per column, which is a
   * different layout from the one an ordinary table has.
   */
  isResizable?: boolean;
  /**
   * Called when a drag finishes, with every column's width in pixels.
   *
   * A plain object rather than the base's `Map`, because what a project does
   * with these is store them and hand them back as `defaultWidth`. P3 means
   * the storing is theirs.
   */
  onColumnResize?: (widths: Record<string, number>) => void;
  /**
   * The column at the trailing edge stays put while the rest scroll under it.
   *
   * NAMED BY THE EDGE, not by a column, and §7 settled that before any of this
   * was built. A table has two edges and they are the case that actually
   * occurs — the actions at the end, the thing that identifies a row at the
   * start — where "whichever column a person points at" is a different and
   * much larger feature. Naming the edge is also what keeps one fact in one
   * place: `:last-child` already knows where the trailing edge is, so a cell
   * never has to be told that its column is pinned, and hiding the last column
   * pins the one that becomes last with nothing to keep in step.
   *
   * A union of one member on purpose. `'start'` is not here because it is not
   * one column: a table with selection carries a checkbox column in front of
   * the column that names the row, and pinning the leading edge would pin the
   * checkboxes and leave the names to scroll away. That is a decision rather
   * than an omission, and §7 holds it with the case attached.
   *
   * What it costs is written down: the trailing overflow shadow moves inward
   * by the pinned column's width, so the indication becomes a shadow the
   * pinned column casts. `Table.css` has the measurement.
   */
  pinnedEdge?: 'end';
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
    isResizable,
    onColumnResize,
    pinnedEdge,
    ...tableProps
  },
  ref
) {
  const own = useRef<HTMLTableElement>(null);
  /*
   * THE SCROLLER IS THE OBSERVED ELEMENT, and doc 04 §11.1 and §11.3 both say
   * why it has to be. It outlives every structure a row chooses between — the
   * rows come and go, it does not — and it CHANGES SIZE with the container,
   * which is the half `RangeCalendar` paid for: a box that shrink-wraps is
   * 408px in a 640px container and 408px in a 320px one, so its observer never
   * fires and the step is read once and never again.
   *
   * One observation for the whole table, published downward. A row that
   * observed its own actions cell would be both wrong and expensive: the cell
   * is sized by its contents, and there would be one observer per row.
   */
  const frame = useRef<HTMLDivElement>(null);
  const step = useContainerStep(frame);
  const box = useRef<HTMLDivElement>(null);
  usePinnedWidth(box, own, pinnedEdge === 'end');
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

  /*
   * THE SCROLLER IS THE RESIZABLE CONTAINER, rather than a second element
   * inside it. The base's container walks up to the first scrollable ancestor
   * and measures its `clientWidth` on a `ResizeObserver`, so putting it
   * anywhere else would have it measure something that is not the box the
   * columns actually live in.
   *
   * Resizing is opt-in and could not be anything else. Measured: inside that
   * container the base merges `table-layout: fixed; width: min-content` into
   * the table's INLINE style and gives every `th` a pixel width — which is a
   * different layout from the one an ordinary table has, where columns take
   * the width of their content and the table scrolls. Turning that on for
   * every table would change how every existing one looks.
   *
   * `min-w-full` on the table is what keeps it filling its container anyway,
   * and it is wave 0's measurement rather than a guess: `width: min-content`
   * left a two-column table 842px short in a 1400px container, and no class
   * beats an inline `width`. A `min-width` wins because it is a property the
   * base does not set.
   */
  const Frame = isResizable ? ResizableTableContainer : 'div';

  /*
   * BOTH PROVIDERS SIT ABOVE THE TABLE, and that is measured rather than tidy.
   * A provider written INSIDE `AriaTable`, wrapping its children, reaches
   * neither a `Column` nor a `Cell` -- they read the default -- because the
   * base re-renders those children in a collection pass of its own, detached
   * from where they were written. Placed above the table it reaches both,
   * because the pass still runs under the ancestors.
   *
   * It is decision 0021's wall in a second shape. There, a filter written
   * inside the collection could not see the surrounding context and kept every
   * option; here, a step written inside it left every row folded at every
   * width. The rule that covers both: anything a collection's children need to
   * read is provided from OUTSIDE the collection.
   *
   * And this comment sits HERE rather than among the JSX below, which is the
   * other thing this wave found. A bare block comment among JSX children is a
   * TEXT NODE. It rendered as a paragraph of prose above every table in the
   * catalog, and types, lint, the unit tests and axe all passed -- the
   * baseline is what saw it.
   */
  return (
    <Resizable.Provider value={isResizable === true}>
      <TableStep.Provider value={step}>
        <Frame
          ref={box}
          className={cx(
            CLASSES.scroller,
            pinnedEdge === 'end' && 'bb-table-pinned',
            className
          )}
          {...(style ? { style } : {})}
          {...(isResizable && onColumnResize
            ? {
                /* Typed structurally rather than with the base's `ColumnSize`
               and `Key`, which the root does not export anyway — and which
               would be its types in our file for no gain, since all this
               reads out is the numbers. */
                onResizeEnd: (
                  widths: Map<string | number, number | string>
                ) => {
                  /*
                   * Pixels, and the base's `Map<Key, ColumnSize>` stops here. What
                   * a project does with these is store them and hand them back as
                   * `defaultWidth`, so what it needs is a plain object it can
                   * serialise — not a Map keyed by a type it never named.
                   */
                  const out: Record<string, number> = {};
                  for (const [key, size] of widths) {
                    if (typeof size === 'number') out[String(key)] = size;
                  }
                  onColumnResize(out);
                }
              }
            : {})}
        >
          <div aria-hidden="true" className={CLASSES.probe} ref={frame} />
          <AriaTable
            ref={mergeRefs(ref, own)}
            className={CLASSES.table}
            {...tableProps}
            {...(selectionMode ? { selectionMode } : {})}
            {...(chosen ? { selectedKeys: chosen } : {})}
            {...(chosenByDefault
              ? { defaultSelectedKeys: chosenByDefault }
              : {})}
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
        </Frame>
      </TableStep.Provider>
    </Resizable.Provider>
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

/**
 * A width a column can be given, without the base's own type in the signature.
 *
 * The same four shapes the base accepts, spelled so a consumer's code never
 * names `ColumnSize`: pixels as a number, or a string ending in `%` or `fr`.
 * A template literal type says exactly that and nothing more.
 */
export type ColumnWidth = number | `${number}%` | `${number}fr`;

export interface ColumnProps extends Pick<
  AriaColumnProps,
  'id' | 'allowsSorting' | 'isRowHeader' | 'textValue' | 'children'
> {
  /** How wide, until somebody drags it. */
  defaultWidth?: ColumnWidth;
  /** How wide, and it cannot be dragged off that. */
  width?: ColumnWidth;
  /**
   * THE FLOOR, and it is the best idea in the product this suite was read
   * against.
   *
   * That table gives every column a minimum by KIND — dates 100, tags 150, a
   * name 180 — so a narrow screen makes the table scroll instead of crushing
   * the columns into unreadable slivers. The floor is right and the kind is
   * not (§3.4), so it is declared here per column, by the only party that
   * knows what the column holds.
   */
  minWidth?: number;
  /** A ceiling, for a column whose content has no natural end. */
  maxWidth?: number;
}

/**
 * One column heading.
 *
 * The sort mark is rendered unconditionally on a sortable column and hidden
 * with a variant, never added and removed: a mark that appears changes the
 * heading's width, so the whole row of headings shifts the first time anybody
 * sorts. Same reason a select's tick is drawn on every row.
 */
/**
 * Whether this table's columns can be dragged, published by the table that
 * declared it.
 *
 * A context because it is a property of the SET (doc 02 §3.1.1) and a column
 * cannot be told twice — a prop on every `Column` would be the same fact in as
 * many places as there are columns, free to disagree. It carries one primitive,
 * which is the same section's constraint.
 *
 * The measured trap that section records does not reach here: a context crosses
 * a portal, and a `Column` cannot appear inside one. What CAN appear in a
 * portal from a table is a menu opened from a cell, and that is wave 4's to
 * close.
 */
const Resizable = createContext(false);

export const Column = forwardRef<HTMLTableCellElement, ColumnProps>(
  function Column(
    {
      children,
      defaultWidth,
      width,
      minWidth,
      maxWidth,
      textValue,
      ...columnProps
    },
    ref
  ) {
    const isResizable = useContext(Resizable);

    /*
     * THE COLUMN'S NAME, RESTORED — and until this line every sortable table in
     * this library announced its sort with no column in it.
     *
     * The base derives a node's `textValue` from string children and from
     * nothing else: `textValue || (typeof props.children === 'string' ?
     * props.children : '') || obj['aria-label'] || ''`. This component ALWAYS
     * hands `AriaColumn` a render function, because the sort mark is drawn
     * beside whatever the consumer wrote — so every column node in this library
     * carried the empty string, and the base's sort description is built from
     * exactly that field.
     *
     * Measured in a browser rather than reasoned from the source, and read from
     * the element `aria-describedby` points at rather than from the live region,
     * which the base clears after 500ms:
     *
     *     "sorted by column  in ascending order"
     *
     * Two spaces, where the column's name should be, on the description a
     * reader is given when it enters the table. So the derivation is done here
     * instead: the consumer's own string, untouched, and never a second string
     * for them to keep in step with the first.
     */
    const name =
      textValue ?? (typeof children === 'string' ? children : undefined);

    /*
     * AND A SORTABLE COLUMN THAT CANNOT BE NAMED SAYS SO, because the failure
     * above was silent for four waves and nothing in the project would have
     * caught the next one. A heading that is an element rather than a string —
     * an icon, a `VisuallyHidden`, a formatted unit beside a word — derives
     * nothing, and the library may not invent the text (hard rule 3). The
     * consumer's route already exists and is the one this reads.
     *
     * Only when the column SORTS. A heading that is never pressed names
     * nothing a reader is waiting for, and the actions column is deliberately
     * an empty one.
     */
    useDevWarning(
      columnProps.allowsSorting === true && name === undefined,
      `a sortable Column has a heading that is not plain text, so the base cannot name it and the table announces “sorted by column  …” with the name missing. The base derives this from string children only. Pass \`textValue\` with the column's name.`
    );
    const wants =
      defaultWidth !== undefined ||
      width !== undefined ||
      minWidth !== undefined ||
      maxWidth !== undefined;

    /*
     * A WIDTH OUTSIDE A RESIZABLE TABLE DOES NOTHING, SILENTLY, and this
     * warning is ours because the base's is dead code. Measured in wave 0: its
     * guard reads `for (let prop in ['width', …])`, which iterates the ARRAY
     * INDICES, so the membership test is never true and the warning never
     * fires — and would print "The 0 prop" if it did. The width is simply
     * dropped and nothing says so.
     */
    useDevWarning(
      wants && !isResizable,
      `a Column declares a width and its Table is not resizable, so the width does nothing. The base drops it without a word — its own warning for this is dead code. Pass \`isResizable\` to the Table, or take the width off.`
    );

    return (
      <AriaColumn
        ref={ref}
        className={cx(CLASSES.column, isResizable && CLASSES.resizableColumn)}
        {...columnProps}
        {...(name !== undefined ? { textValue: name } : {})}
        {...(isResizable && defaultWidth !== undefined ? { defaultWidth } : {})}
        {...(isResizable && width !== undefined ? { width } : {})}
        {...(isResizable && minWidth !== undefined ? { minWidth } : {})}
        {...(isResizable && maxWidth !== undefined ? { maxWidth } : {})}
      >
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
            {/*
             * The grip, and only where a width can actually move. A column
             * with a fixed `width` cannot be dragged off it, so offering a
             * handle there would be a control that does nothing — doc 06 §4
             * rule 7's shape, one level down.
             */}
            {isResizable && width === undefined ? (
              <AriaColumnResizer className={CLASSES.resizer} />
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
