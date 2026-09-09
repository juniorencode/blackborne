import { forwardRef } from 'react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger as AriaMenuTrigger,
  Popover as AriaPopover,
  Separator as AriaSeparator,
  type MenuItemProps as AriaMenuItemProps,
  type MenuTriggerProps as AriaMenuTriggerProps
} from 'react-aria-components';
import {
  ANCHORED,
  LAYER_OFFSET,
  PANEL,
  type Placement
} from '../../internal/Layer';
import { cx } from '../../internal/cx';

/*
 * The wrapper the base positions, and the panel inside it.
 *
 * Two elements for the reason `Popover` records: the base positions the outer
 * one and the inner one clips its children, so a panel that paints and a panel
 * that is positioned cannot be the same box. A menu draws no arrow, so the
 * wrapper has nothing else to hold — but the pair stays, because `PANEL`'s
 * `overflow-hidden` is what keeps a long list's first and last rows inside the
 * rounded corners.
 *
 * NO `container-type` here either, and for the same measured reason: an
 * anchored layer is absolutely positioned with `width: auto`, so its width is
 * shrink-to-fit, and inline-size containment resolves that to its borders.
 * `internal/Layer/layerBox.ts` carries the law and the 2px measurement.
 */
const MENU_WRAPPER = cx(
  'bb-menu',
  ANCHORED,
  'bb:z-(--bb-layer-popover)',
  'bb:max-w-narrow'
);

/*
 * A menu is narrower than a popover on purpose: `--container-narrow` rather
 * than medium. A row of one-line commands that reaches 480px has stopped being
 * a menu and started being a panel, and the width is the only thing stopping
 * a long label from making it one.
 *
 * `min-h-0` so the maximum height the base writes on the wrapper actually
 * bounds this one. A percentage cannot — measured on `Dialog`.
 */
const MENU_PANEL = cx(
  PANEL,
  'bb:min-h-0',
  'bb:border bb:rounded-lg',
  'bb:p-(--bb-space-1)'
);

/*
 * The list itself. It scrolls rather than the panel, because the element that
 * scrolls has to be the element the keyboard reaches — the lesson `Dialog`
 * paid for and the package guide's first layer bullet.
 */
const MENU_LIST = cx(
  'bb-menu-list',
  'bb:box-border bb:flex bb:min-h-0 bb:flex-col',
  'bb:overflow-y-auto bb:outline-hidden',
  'bb:font-sans bb:text-md bb:leading-normal'
);

/*
 * A command.
 *
 * `data-focused` and not `data-hovered`: a menu is one composite control whose
 * arrow keys move a single highlight, and the base moves that highlight on
 * hover as well as on a key. Styling hover separately would give a menu two
 * highlights at once — the pointer's and the keyboard's — and the person using
 * it can only be in one place.
 *
 * The minimum height is the hit area token, so a row of commands is reachable
 * by a thumb at every density (doc 04 §8, doc 06 §3).
 */
const ITEM_BASE = cx(
  'bb-menu-item',
  'bb:box-border bb:flex bb:min-h-hit bb:items-center',
  'bb:gap-x-(--bb-space-3) bb:px-(--bb-space-3) bb:py-(--bb-space-2)',
  'bb:rounded-md bb:cursor-pointer bb:select-none',
  'bb:outline-hidden',
  /*
   * `no-underline`, for the rows that are anchors.
   *
   * The package ships no reset, so an `<a href>` arrives carrying the
   * browser's own underline — and a row that navigates renders one. Every
   * other row is a div and never had a decoration to remove, which is why this
   * looks unnecessary and is not: it is the same class of trap as a control
   * not inheriting `font-size`. The colour is already the tone's.
   */
  'bb:no-underline',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

/*
 * The two tones, resolved through one typed map (doc 02 §3, doc 03 §4.4).
 *
 * A destructive command is red, and colour is not the only channel carrying
 * that: the word is. "Delete" says what it does, the same pairing
 * `Button variant="danger"` relies on — doc 06 §3 forbids colour as the ONLY
 * channel, not colour.
 *
 * The fill on the focused row is the danger family's own subtle surface, so a
 * highlighted destructive command does not borrow the accent that means
 * "selected" everywhere else.
 */
const ITEM_TONE = {
  neutral: cx(
    'bb:text-text',
    'bb:data-focused:bg-surface-hover',
    'bb:data-pressed:bg-surface-active'
  ),
  danger: cx(
    /*
     * `text-danger-text` and not `text-danger`, which is the mistake the token
     * itself was created to prevent — its comment says "every state colour
     * gets a -text pair so nobody reaches for the solid step again", and this
     * component reached for it.
     *
     * It passed in light mode by coincidence: there the solid and the text
     * step are both step 11. In dark the solid drops to step 9, and axe
     * reported a serious contrast failure on the destructive command — found
     * by the automated pass on a story, which is the third time that check has
     * caught a token pairing nobody could see.
     */
    'bb:text-danger-text',
    'bb:data-focused:bg-danger-subtle bb:data-focused:text-danger-subtle-on',
    'bb:data-pressed:bg-danger-subtle'
  )
} satisfies Record<MenuItemTone, string>;

/** A line between groups of commands. */
const SEPARATOR = cx(
  'bb-menu-separator',
  'bb:my-(--bb-space-1) bb:border-t bb:border-border'
);

export type MenuItemTone = 'neutral' | 'danger';

export interface MenuProps extends Pick<
  AriaMenuTriggerProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange'
> {
  /**
   * The control that opens it, and it **must be focusable** — a `Button`, or
   * anything that takes part in focus. The base wires the open behaviour to it
   * through a focusable context, so a bare `<span>` receives none of it.
   */
  trigger: React.ReactNode;
  /** The commands: `MenuItem` and `MenuSeparator`. */
  children: React.ReactNode;
  /**
   * Where it sits, from the twelve logical positions (doc 02 §3.3). Defaults
   * to `bottom start` — under the control and aligned to it.
   *
   * The base repositions one that would not fit, so this is a preference.
   */
  placement?: Placement;
  /**
   * Applied to the panel, for anything beyond the maximum width. Nothing
   * reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A short list of commands, opened by a control.
 *
 * ```tsx
 * <Menu trigger={<Button variant="secondary">Actions</Button>}>
 *   <MenuItem onAction={send}>Send</MenuItem>
 *   <MenuItem onAction={duplicate}>Duplicate</MenuItem>
 *   <MenuSeparator />
 *   <MenuItem tone="danger" onAction={remove}>Delete</MenuItem>
 * </Menu>
 * ```
 *
 * ## It is named by the control that opened it
 *
 * No `label` prop, and that is measured rather than assumed: the base's
 * `useMenuTrigger` points the menu's `aria-labelledby` at the trigger, so a
 * menu opened by a button called "Actions" is announced as the Actions menu.
 * A label prop would be a second name for the same thing, and the two would
 * disagree the first time somebody changed one.
 *
 * ## What the keyboard does, and none of it is written here
 *
 * The arrow keys move between commands, `Home` and `End` jump to the ends,
 * typing letters skips to a command, `Enter` and `Space` run one, `Escape`
 * closes without running anything, and focus returns to the trigger. All of it
 * is the base's (non-goal 6), and all of it is checked in a browser because
 * jsdom implements no real tab order.
 *
 * ## What it deliberately does not have
 *
 * **No sections and no submenus**, both of which the base supports. Neither has
 * a place that needs it today (P5), and a submenu in particular is a decision
 * about hover timing and about what happens on a touch screen — worth making
 * when a screen asks rather than in advance.
 *
 * **No selection.** A menu of commands and a menu of choices are different
 * things: the second is a `Select`, or a set of checkboxes in a popover.
 *
 * **No arrow.** A menu is attached to the control that opened it, so where it
 * came from is not in doubt — the argument `Popover` records for defaulting
 * its own arrow off, one step further.
 */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  {
    trigger,
    children,
    placement = 'bottom start',
    className,
    style,
    ...triggerProps
  },
  ref
) {
  return (
    /*
     * `MenuTrigger` renders no DOM: it wires the trigger's press to the menu's
     * state through context, which is why the trigger has to be focusable.
     * Composed here rather than by the consumer, for the reason `Tooltip` and
     * `Popover` both record — it makes a menu with no trigger, two menus on
     * one trigger, and the two in the wrong order impossible.
     */
    <AriaMenuTrigger {...triggerProps}>
      {trigger}
      <AriaPopover
        className={MENU_WRAPPER}
        placement={placement}
        offset={LAYER_OFFSET}
      >
        <div className={cx(MENU_PANEL, className)}>
          <AriaMenu
            ref={ref}
            className={MENU_LIST}
            {...(style === undefined ? {} : { style })}
          >
            {children}
          </AriaMenu>
        </div>
      </AriaPopover>
    </AriaMenuTrigger>
  );
});

interface MenuItemBase extends Pick<AriaMenuItemProps, 'isDisabled' | 'id'> {
  /** What it says. A command names the action: "Send", "Duplicate", "Delete". */
  children: React.ReactNode;
  /**
   * `danger` for a command that destroys something.
   *
   * The word carries it as well as the colour — doc 06 §3 forbids colour as
   * the only channel, and "Delete" is the other one. Doc 09 §5 asks for undo
   * rather than a confirmation wherever it is possible, so a destructive
   * command that can be undone should be, and one that cannot belongs in a
   * `ConfirmDialog`.
   */
  tone?: MenuItemTone;
  /** Applied to the row. Nothing reaches an internal node (doc 02 §6). */
  className?: string;
}

/*
 * A ROW EITHER DOES SOMETHING OR GOES SOMEWHERE, and the types say so rather
 * than trusting anybody to remember.
 *
 * Doc 02 §7.1's rule — `Link` navigates, `Button` acts — arriving inside a
 * menu, where it is easier to get wrong: a row that navigates by calling a
 * function is a button wearing a link's clothes, and nothing a browser does
 * with an address survives it. No middle-click, no ctrl-click, no "copy link
 * address", and none of it fails loudly.
 *
 * A union rather than two optional props, so a row with both is a type error
 * at the place it is written instead of a decision made at runtime by whichever
 * branch happens to be first.
 */
export interface MenuCommandProps extends MenuItemBase {
  /** What it does. */
  onAction: () => void;
  href?: never;
}

export interface MenuLinkProps extends MenuItemBase {
  /**
   * Where it goes. A row with an address renders an anchor, and everything a
   * browser does with one comes free — including the client-side navigation
   * `ConfigProvider` supplies (decision 0016).
   *
   * The case that earned it is a collapsed breadcrumb trail, which the catalog
   * had been recording as pending one: the middle of a trail is a menu of
   * ADDRESSES rather than commands.
   */
  href: string;
  onAction?: never;
}

export type MenuItemProps = MenuCommandProps | MenuLinkProps;

/** One row of a `Menu`: a command, or an address. Only useful inside one. */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(
  function MenuItem(
    { children, tone = 'neutral', className, ...itemProps },
    ref
  ) {
    return (
      <AriaMenuItem
        ref={ref}
        className={cx(ITEM_BASE, ITEM_TONE[tone], className)}
        {...itemProps}
      >
        {children}
      </AriaMenuItem>
    );
  }
);

export interface MenuSeparatorProps {
  /** Applied to the line. Nothing reaches an internal node (doc 02 §6). */
  className?: string;
}

/**
 * A line between groups of commands — most usefully above a destructive one,
 * where the gap is what stops a press meant for the command above it.
 *
 * The base's separator rather than this library's `Separator`, and that is not
 * a preference: a menu is a collection, and its children are read by the
 * base's collection builder. A separator it does not recognise is not a
 * separator in the menu's own structure.
 */
export const MenuSeparator = forwardRef<HTMLElement, MenuSeparatorProps>(
  function MenuSeparator({ className }, ref) {
    return <AriaSeparator ref={ref} className={cx(SEPARATOR, className)} />;
  }
);
