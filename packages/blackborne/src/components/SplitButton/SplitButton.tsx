import { forwardRef } from 'react';
import { Button, type ButtonSize } from '../Button';
import { Menu, MenuItem, type MenuItemProps } from '../Menu';
import { useMessage } from '../../config';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { cx } from '../../internal/cx';
import { readDeclarations } from '../../internal/readDeclarations';
import { useDevWarning } from '../../internal/useDevWarning';

/**
 * Which of `Button`'s variants a split button offers.
 *
 * Two, and the rest are refused rather than forgotten: see the file's note.
 */
export type SplitButtonVariant = 'primary' | 'secondary';

/*
 * ONE CONTROL, TWO BUTTONS, and the seam between them is the whole of the
 * styling problem.
 *
 * The root is a flex row that stretches, so the two halves are exactly the
 * same height whatever either of them contains — a pending spinner on one side
 * must not make it taller than the other.
 */
const ROOT = cx('bb-split-button', 'bb:inline-flex bb:items-stretch');

/*
 * The action, with its trailing corners squared off.
 *
 * `Button`'s own `className` lands last in its class list, but that is not why
 * this works: with Tailwind, which rule wins is the order in the COMPILED
 * stylesheet and not the order in the attribute. `rounded-e-none` follows the
 * shorthand `rounded-md` in Tailwind's own canonical property order, so it
 * wins. Measured in a browser rather than assumed, because the failure mode is
 * a control with four round corners in the middle of a row and nothing in the
 * console.
 */
const ACTION = cx('bb-split-button-action', 'bb:rounded-e-none');

/*
 * The arrow, with its leading corners squared and pulled back over the
 * action's border.
 *
 * `-ms-px` is what makes one seam instead of two: both halves carry a border,
 * so without it a secondary split button has a 2px line down the middle where
 * every other border in the library is 1px.
 *
 * The horizontal padding is narrower than a button's own, because this half
 * holds a 14px mark and not a word — `--bb-control-padding-x` on each side
 * would make the arrow wider than it is tall at every size.
 */
const ARROW = cx(
  'bb-split-button-arrow',
  /*
   * `group`, so the mark inside can read the state of the button around it —
   * and the state it reads is `aria-expanded`, which is MEASURED and not the
   * obvious choice. A menu's trigger receives `aria-expanded` and
   * `data-pressed` from the base, and no `data-open` at all: the open state
   * belongs to the popover, which is portalled somewhere else entirely. A
   * `group-data-open` variant here matched nothing and the mark simply never
   * turned, which is the kind of thing that looks finished in a screenshot.
   */
  'bb:group',
  'bb:rounded-s-none bb:-ms-px',
  'bb:px-(--bb-space-2)'
);

/*
 * The divider, and it exists for ONE variant.
 *
 * A secondary split button has a visible seam already: both halves are
 * bordered, and the negative margin above turns the two borders into one. A
 * primary one does not — its border is the same colour as its fill, so the two
 * halves read as a single blob and nothing says where the action ends and the
 * menu begins.
 *
 * So the primary variant draws its own line, mixed from the pair's OWN text
 * colour rather than from a new token: `--bb-accent-on` at a quarter strength
 * is legible on the accent and follows a brand override for free. The same
 * technique the focus halo uses, and for the same reason — a literal would be
 * one more colour nobody can name.
 */
const VARIANT: Record<SplitButtonVariant, string> = {
  primary:
    'bb:border-s-[color-mix(in_oklab,var(--bb-accent-on)_25%,transparent)]',
  secondary: ''
};

/** The mark. Down, and it turns over while the menu is open. */
const CHEVRON = cx(
  'bb-split-button-chevron',
  'bb:h-mark bb:w-mark bb:flex-none',
  'bb:transition-[rotate] bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-aria-expanded:rotate-180'
);

export interface SplitButtonProps {
  /**
   * The action's words. Named by what it does — "Save", "Publish" — because
   * the alternatives in the menu are named the same way and the pair has to
   * read as one set.
   */
  label: React.ReactNode;
  /** The action. The menu's rows carry their own. */
  onPress: () => void;
  /** The alternatives: `MenuItem` and `MenuSeparator` elements. */
  children: React.ReactNode;
  /**
   * Two, and the rest are deliberately absent.
   *
   * A split button is a control with a seam down the middle, and a variant
   * with no border or no fill has nothing to draw that seam with: a ghost or
   * link split button is two invisible halves that only exist on hover. And a
   * `danger` one is the shape doc 09 §5 argues against — a destructive action
   * with a menu of further destructive actions behind it, one keystroke from
   * the row a menu focuses when it opens.
   */
  variant?: SplitButtonVariant;
  /** Height and type size, and both halves take it. */
  size?: ButtonSize;
  /** Switches the whole control off, including the arrow. */
  isDisabled?: boolean;
  /**
   * The action is under way: a spinner in place of the label, the same width,
   * **and the arrow switched off**.
   *
   * The arrow goes with it deliberately. The menu holds alternatives to the
   * action that is already running, and starting a second one while the first
   * is in flight is the state doc 09 §7 is about — `ConfirmDialog` disables
   * its cancelling button through the same argument.
   */
  isPending?: boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * One action, with the near alternatives behind an arrow.
 *
 * ```tsx
 * <SplitButton label="Save" onPress={save}>
 *   <MenuItem onAction={saveAndNew}>Save and add another</MenuItem>
 *   <MenuItem onAction={saveAsDraft}>Save as a draft</MenuItem>
 * </SplitButton>
 * ```
 *
 * The last component waiting on `Menu`, and the one that finishes the layer
 * batch. It is two buttons and not one: the action is a press, the arrow opens
 * a menu, and a screen reader hears exactly that — "Save" and "More actions",
 * both named, neither pretending to be the other.
 *
 * ## What it is for, and what it is not
 *
 * **For a set with an obvious default.** "Save" beside "Save and add another"
 * is the case: the same verb, one of them the one people want. A control whose
 * arrow holds unrelated commands is a `Button` and a `Menu` standing next to
 * each other, and they should look like two things because they are.
 *
 * **The destructive command does not go first.** Opening the menu with a key
 * focuses its first row — measured on `Menu` — so a destructive first row is
 * one press from running, which is doc 09 §5 rule 5's argument arriving
 * somewhere it was not written for. This component says so in development
 * rather than trusting it to be remembered.
 *
 * **No group role and no name for the pair.** Two buttons in a row are two
 * buttons, both already named; a `role="group"` would add a thing to announce
 * and nothing to do with it (doc 06 §2, and the landmark `Pagination` does not
 * have).
 */
export const SplitButton = forwardRef<HTMLDivElement, SplitButtonProps>(
  function SplitButton(
    {
      label,
      onPress,
      children,
      variant = 'primary',
      size = 'md',
      isDisabled = false,
      isPending = false,
      className,
      style
    },
    ref
  ) {
    const moreActions = useMessage('moreActions');

    /*
     * The first row is READ, and only to warn about one thing. The menu's
     * children are passed through untouched — this component adds no row, no
     * separator and no ordering of its own.
     */
    const { found } = readDeclarations<MenuItemProps>(children, MenuItem);
    useDevWarning(
      found[0]?.tone === 'danger',
      'SplitButton: the first row of the menu is a destructive command, and ' +
        'opening the menu with a key focuses the first row — so it is one ' +
        'press away. Put it last, behind a MenuSeparator (doc 09 §5).'
    );

    return (
      <div
        ref={ref}
        className={cx(ROOT, className)}
        {...(style === undefined ? {} : { style })}
      >
        <Button
          variant={variant}
          size={size}
          isDisabled={isDisabled}
          isPending={isPending}
          onPress={onPress}
          className={ACTION}
        >
          {label}
        </Button>
        <Menu
          trigger={
            <Button
              variant={variant}
              size={size}
              isDisabled={isDisabled || isPending}
              aria-label={moreActions}
              className={cx(ARROW, VARIANT[variant])}
            >
              <ChevronGlyph className={CHEVRON} />
            </Button>
          }
          placement="bottom end"
        >
          {children}
        </Menu>
      </div>
    );
  }
);
