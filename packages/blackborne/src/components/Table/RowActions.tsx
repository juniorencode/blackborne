import { createContext, useContext } from 'react';
import { readDeclarations } from '../../internal/readDeclarations';
import { useDevWarning } from '../../internal/useDevWarning';
import type { ContainerStep } from '../../internal/useContainerStep';
import { Button } from '../Button';
import { Menu, MenuItem } from '../Menu';

/*
 * THE THINGS A ROW CAN HAVE DONE TO IT.
 *
 * ## Why a button in a row is allowed here at all
 *
 * This library has a measured rule against it — a button inside a `ListBox`
 * row is announced as part of the row's own name, `Tab` from the field closes
 * the list, and the arrows move `aria-activedescendant` without focus ever
 * leaving the input, so it is a control only a pointer can reach (doc 06 §4
 * rule 5).
 *
 * A table is not that. Measured in wave 0, in the same shape: a `Button`
 * inside a `Cell` leaves the row named **exactly** `"Ana"` — a query for
 * `"AnaEdit"` matches nothing — and the button keeps its own name, its own id
 * and no slot. The base's grid navigation reaches it, and
 * `keyboardNavigationBehavior` decides how. So §7's row about a retry button
 * keeps its answer and gains its boundary: the test is whether the collection
 * offers a keyboard route, and a grid does where a listbox does not.
 *
 * ## Why an action is DECLARED rather than rendered
 *
 * Decision 0018's shape, third caller. A row action lands in one of two
 * places — a button in the row, or a row in a menu — and which one depends on
 * how much room there is. A component that rendered itself could not be both,
 * and a parent cannot read a label out of an arbitrary `<Button>` child to
 * build a menu row from it.
 *
 * That decision's constraint travels with it: a component of your own that
 * returns a `RowAction` is not one, because the element in the tree is yours
 * and nothing about it says row action. The shareable form is a value or an
 * array from `.map()`, and what could not be used is counted and said once,
 * exactly as `Tabs` does.
 *
 * ## Why the fold is not a number in here
 *
 * Doc 04 §6: one hook for the whole library, and the thresholds live in CSS
 * where they are declared once. `Table` observes its own scroller, reads
 * `--bb-step`, and publishes the answer; this only decides how many actions
 * are too many for a given step. One observation for the whole table rather
 * than one per row, which also means one `ResizeObserver` instead of as many
 * as there are rows.
 */

/** Published by the table, read by every row. */
export const TableStep = createContext<ContainerStep>('base');

export type RowActionTone = 'neutral' | 'danger';

export interface RowActionProps {
  /**
   * What it does, in the project's words.
   *
   * It is the button's accessible name where the actions fit, and the menu
   * row's visible text where they do not — one string, because they are one
   * thing said in two places.
   */
  label: string;
  /**
   * The glyph. Received as a node and sized from the slot, never named by a
   * string (doc 02 §11).
   */
  icon: React.ReactNode;
  /** Called when it is chosen, wherever it was chosen from. */
  onAction: () => void;
  /**
   * Switched off.
   *
   * Doc 06 §4 rule 7 asks that a person be able to tell WHY, and only the
   * project knows — a row usually says so itself, in a cell.
   */
  isDisabled?: boolean;
  /**
   * `danger` for something destructive.
   *
   * IT COLOURS THE MENU ROW AND NOT THE BUTTON, and that asymmetry is recorded
   * rather than hidden. `Button`'s destructive variant is a FILLED one, which
   * in a row of small ghost buttons would be the loudest thing on the screen
   * and would read as the row's primary action rather than its dangerous one.
   * A ghost button that is destructive is a variant this library does not
   * have, and hard rule 8 says a new variant needs a real place that needs it
   * today — this is that place, so it is a §7 row with the case attached
   * rather than a variant added in passing.
   *
   * Nothing is lost meanwhile: the action carries an icon and a name, so its
   * danger is not communicated by colour in the first place, which is what
   * doc 06 §3 asks.
   */
  tone?: RowActionTone;
  /** Distinguishes two actions with the same label. */
  id?: string;
}

/**
 * One thing that can be done to a row.
 *
 * Declared and read by `RowActions`; it renders nothing where it is written.
 */
export const RowAction: (props: RowActionProps) => React.ReactNode = () => null;

/* ─────────────────────────────── the fold ───────────────────────────────── */

const RANK: Record<ContainerStep, number> = {
  base: 0,
  narrow: 1,
  medium: 2,
  wide: 3
};

/**
 * How many actions are too many for the room there is.
 *
 * ONE ACTION NEVER FOLDS, and that is doc 04 §11.2 rather than a preference:
 * "the '…' never hides one step", because folding a single thing replaces
 * something you can read with something you have to open. `Pagination` reached
 * the same rule from the other direction — a gap never hides one page — and
 * the collapsed breadcrumb trail from a third. This is the fourth time it
 * applies, and it needed no new argument.
 *
 * The rest scales with the count, which is the idea worth taking from the
 * product this suite was read against: three small buttons fit where six do
 * not, so one threshold for every row would be wrong at both ends. What is
 * NOT taken from it is where the numbers live — there they are pixel widths in
 * a table that CSS and JavaScript both had to agree about, and a comment
 * records what a mismatch cost. Here CSS owns the thresholds and this owns
 * only the count.
 */
const foldsBelow = (count: number): ContainerStep | null => {
  if (count <= 1) return null;
  if (count <= 3) return 'medium';
  return 'wide';
};

/* ────────────────────────────── the component ───────────────────────────── */

const CLASSES = {
  row: 'bb:flex bb:items-center bb:justify-end bb:gap-(--bb-space-1)',
  menuRow: 'bb:flex bb:items-center bb:gap-(--bb-space-3)'
} as const;

export interface RowActionsProps {
  /**
   * What this set of actions belongs to, for a reader.
   *
   * It names the overflow menu's trigger, which otherwise is a button with
   * three dots and nothing else — and in a table of forty rows, forty buttons
   * all called "More" is a list of forty identical things. The project writes
   * it because only the project knows what the row is.
   */
  label: string;
  children: React.ReactNode;
}

/**
 * The actions a row carries, shown as buttons or folded into a menu.
 *
 * @example
 * <Cell>
 *   <RowActions label="Invoice A-001">
 *     <RowAction icon={<Pencil />} label="Edit" onAction={edit} />
 *     <RowAction icon={<Trash />} label="Delete" onAction={remove} tone="danger" />
 *   </RowActions>
 * </Cell>
 */
export function RowActions({
  label,
  children
}: RowActionsProps): React.JSX.Element {
  const step = useContext(TableStep);
  const { found, strays } = readDeclarations<RowActionProps>(
    children,
    RowAction
  );

  /*
   * WHAT COULD NOT BE READ, SAID ONCE. Decision 0018's cost: a component of
   * your own that returns a `RowAction` is not one, and the failure is silent
   * — the action simply is not there. `Tabs` counts and says so; so does this.
   */
  useDevWarning(
    strays > 0,
    `RowActions was given ${String(strays)} child${strays === 1 ? '' : 'ren'} it could not read. A RowAction has to be written directly, or come from an array — a component of your own that RETURNS one is not one, because the element in the tree is yours and nothing about it says row action.`
  );

  const folds = foldsBelow(found.length);
  const folded = folds !== null && RANK[step] < RANK[folds];

  if (found.length === 0) return <span />;

  if (!folded) {
    return (
      <div className={CLASSES.row}>
        {found.map((action, index) => (
          <Button
            aria-label={action.label}
            key={action.id ?? `${action.label}-${String(index)}`}
            size="sm"
            variant="ghost"
            {...(action.isDisabled === true ? { isDisabled: true } : {})}
            onPress={action.onAction}
          >
            {action.icon}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={CLASSES.row}>
      <Menu
        trigger={
          <Button aria-label={label} size="sm" variant="ghost">
            <MoreGlyph />
          </Button>
        }
      >
        {found.map((action, index) => (
          <MenuItem
            key={action.id ?? `${action.label}-${String(index)}`}
            onAction={action.onAction}
            {...(action.tone === 'danger' ? { tone: 'danger' as const } : {})}
            {...(action.isDisabled === true ? { isDisabled: true } : {})}
          >
            <span className={CLASSES.menuRow}>
              {action.icon}
              {action.label}
            </span>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

/**
 * Three dots, drawn here because nothing else in the library needs them yet.
 *
 * It moves to `internal/` at its second caller, which is §8's rule — the cross
 * reached four copies at four geometries before anybody noticed, and that is
 * what the rule exists to prevent.
 */
function MoreGlyph(): React.ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="bb:h-mark bb:w-mark"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <circle cx="8" cy="3" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="8" cy="13" r="1.5" />
    </svg>
  );
}
