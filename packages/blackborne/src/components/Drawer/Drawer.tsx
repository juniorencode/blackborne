import { forwardRef } from 'react';
import {
  Modal,
  ModalOverlay,
  useLocale,
  type ModalOverlayProps
} from 'react-aria-components';
import { ModalSheet, PANEL, SCRIM } from '../../internal/Layer';
import { cx } from '../../internal/cx';

/**
 * Which edge the drawer comes from.
 *
 * `start` and `end` are the inline axis and **flip with the writing
 * direction**: a `start` drawer is on the left in English and on the right in
 * Arabic. Never `left` or `right`, which is half of the RTL support (doc 03 §5
 * rule 4).
 *
 * `top` and `bottom` are literal, and that is deliberate rather than an
 * inconsistency: doc 05 §4 is about direction, not about writing mode, and this
 * library supports RTL rather than vertical text. In every locale it claims to
 * support, the block start is the top.
 */
export type DrawerSide = 'start' | 'end' | 'top' | 'bottom';

export type DrawerSize = 'sm' | 'md' | 'lg';

/*
 * How the scrim places the panel, per side.
 *
 * All four are logical grid keywords and none of them needs to know about
 * direction: `justify-items: start` means the inline start, which flips on its
 * own. The one thing that cannot be expressed logically is the direction of
 * the slide, and that lives in Drawer.css with the reason beside it.
 *
 * The cross axis stretches, so a side drawer is the full height of the window
 * and a top or bottom one is the full width.
 */
const PLACEMENT: Record<DrawerSide, string> = {
  start: 'bb:justify-items-start bb:items-stretch',
  end: 'bb:justify-items-end bb:items-stretch',
  top: 'bb:justify-items-stretch bb:items-start',
  bottom: 'bb:justify-items-stretch bb:items-end'
} satisfies Record<DrawerSide, string>;

/*
 * Which edge of the panel is the free one, and therefore the only one that
 * carries a border.
 *
 * A drawer is flush against three window edges. A border on those three sits
 * exactly at the edge of the screen and reads as a rendering artefact rather
 * than as a boundary, so only the inner edge is drawn — and that is also the
 * whole visual difference between a drawer and a dialog, which floats clear of
 * everything and is bordered all round.
 *
 * `border-s` and `border-e` are the inline start and end, so these flip with
 * direction like everything else.
 *
 * For the same reason there is **no radius**: a rounded corner against the
 * window's own corner is the corner of the screen, which is not ours to round
 * (doc 03 §4.3), and rounding only the two corners on the free edge reads as a
 * mistake on a panel that spans the whole side.
 */
const EDGE: Record<DrawerSide, string> = {
  start: 'bb:border-e',
  end: 'bb:border-s',
  top: 'bb:border-b',
  bottom: 'bb:border-t'
} satisfies Record<DrawerSide, string>;

/*
 * How thick the panel is, on whichever axis the side chose.
 *
 * One meaning for `size` — "how thick" — rather than one per axis, which is
 * what keeps it from becoming a prop whose sense depends on another prop
 * (non-goal 4).
 *
 * The numbers are the CONTAINER scale, the same three a dialog's widths come
 * from, so a form inside a drawer resolves its own container queries against
 * exactly the value the drawer was sized by.
 *
 * The block axis reads the variable directly because `--container-*` feeds
 * `max-w-*` and not `max-h-*` — measured, `max-h-narrow` compiles to nothing.
 * Reading the token is what lets both axes share one source instead of a
 * parallel scale holding the same values, and it is the reason that scale is
 * declared outside `@theme inline` (see styles/index.css).
 *
 * `w-full` / `h-full` and not just the maximum: the panel declares
 * `container-type: inline-size`, so its intrinsic inline size is zero and an
 * unstretched grid item would collapse. It fills its area up to the ceiling.
 */
const INLINE_THICKNESS: Record<DrawerSize, string> = {
  sm: 'bb:w-full bb:max-w-narrow',
  md: 'bb:w-full bb:max-w-medium',
  lg: 'bb:w-full bb:max-w-wide'
} satisfies Record<DrawerSize, string>;

/*
 * The block axis sets a VARIABLE rather than a `max-h-*` utility, and it has
 * to.
 *
 * The layer-3 rule in Drawer.css declares this panel's `max-block-size` so the
 * window can be the last word, and a layer-3 rule is unlayered — it outranks
 * every utility (doc 03 §7), which is the whole reason those files exist. So a
 * `max-h-*` here would not combine with it, it would lose. Measured: a
 * `bottom` drawer asked for 30rem and rendered the window's full 900px.
 *
 * Feeding the variable lets the CSS compose the two with `min()`, which is
 * what "as thick as you asked, and never thicker than the window" actually
 * means.
 */
const BLOCK_THICKNESS: Record<DrawerSize, string> = {
  sm: 'bb:h-full bb:[--bb-drawer-block-thickness:var(--bb-container-narrow)]',
  md: 'bb:h-full bb:[--bb-drawer-block-thickness:var(--bb-container-medium)]',
  lg: 'bb:h-full bb:[--bb-drawer-block-thickness:var(--bb-container-wide)]'
} satisfies Record<DrawerSize, string>;

/** Which axis a side is thick on. Drives the thickness map and the keyframe. */
const AXIS: Record<DrawerSide, 'inline' | 'block'> = {
  start: 'inline',
  end: 'inline',
  top: 'block',
  bottom: 'block'
} satisfies Record<DrawerSide, 'inline' | 'block'>;

/*
 * The scrim holds the panel against an edge, with no inset — a drawer is flush
 * by definition, and a strip of scrim between it and the window edge would be
 * the one thing that makes it look like a misplaced dialog.
 */
const DRAWER_SCRIM = cx('bb-drawer-scrim', SCRIM);

/*
 * `container-type: inline-size` is declared here rather than in the shared
 * panel, for the reason `layerBox.ts` sets out: it is only safe on a layer
 * whose width is declared, and a drawer's is — which is exactly why the size
 * maps above are `w-full` plus a maximum rather than a maximum alone.
 */
const DRAWER_PANEL = cx(
  'bb-drawer-panel',
  PANEL,
  'bb:[container-type:inline-size]'
);

/*
 * The same two omissions as `Dialog`, for the same reasons: `Escape` means one
 * thing across the library (doc 09 §8) so it cannot be switched off, and the
 * mount container comes from `ConfigProvider` rather than from a deprecated
 * per-component prop (doc 08 §8, decision 0013).
 */
export interface DrawerProps extends Omit<
  ModalOverlayProps,
  | 'children'
  | 'className'
  | 'style'
  | 'isKeyboardDismissDisabled'
  | 'UNSTABLE_portalContainer'
> {
  /**
   * The drawer's name, shown as its heading and announced when focus enters.
   *
   * Required. The base warns in development without one, and a layer with no
   * accessible name is announced as "dialog" — which says that something
   * happened and not what.
   */
  title: React.ReactNode;
  /** The content. It scrolls when it is taller than the panel. */
  children?: React.ReactNode;
  /**
   * The actions, in a footer that stays visible while the content scrolls.
   *
   * A `ReactNode`, so the buttons are the consumer's, in their order, with
   * their words (doc 09 §4). A button of theirs that needs to close the drawer
   * calls `useDialog()` — the drawer IS a dialog, in the sense that matters:
   * same role, same state, same hook.
   */
  footer?: React.ReactNode;
  /**
   * Which edge it comes from. **Defaults to `end`**, the detail panel beside a
   * listing, which is what a management application asks for most.
   */
  side?: DrawerSide;
  /**
   * How thick the panel is, on whichever axis `side` chose — its width for
   * `start` and `end`, its height for `top` and `bottom`.
   *
   * Values come from the container scale, so a component inside resolves its
   * own container queries against the same numbers. They are lengths and not
   * proportions: `lg` is a large panel, not three quarters of the window.
   *
   * The window is always the real ceiling. A drawer thicker than the window it
   * is in fills it instead, so `size` needs no narrow-window exception the way
   * a dialog does.
   */
  size?: DrawerSize;
  /**
   * Whether clicking outside the panel closes it. **Defaults to `false`**.
   *
   * Doc 08 §5 makes this a decision rather than a default, and it is worth
   * knowing that a drawer's scrim is a larger target than a dialog's: the
   * panel takes one edge and the rest of the window dismisses it. That makes
   * an accidental click more likely, not less, so a drawer holding a form
   * leaves this alone.
   */
  isDismissable?: boolean;
  /**
   * Applied to the **panel**, for anything beyond what `side` and `size` set.
   * Nothing reaches an internal node (doc 02 §6), and doc 02 §6's limit
   * applies: this sets what the component does not set. The thickness is
   * already set here, so override it with `size` or with `style`.
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A modal panel anchored to an edge of the window: a detail view beside a
 * listing, a filter panel, a bottom sheet.
 *
 * **The same layer as `Dialog` in every respect that matters** — focus moves
 * in and returns, focus is contained, `Escape` closes one level at a time, the
 * page behind does not scroll, and the sheet inside is identical. What differs
 * is where the panel lands and which of its edges is free.
 *
 * It is a separate component rather than a `variant` on `Dialog`, and the
 * reason is the one the catalog already used to reject a multiple-value
 * `NumberField`: a `side` means nothing on a centred dialog, and `size` would
 * measure a different axis depending on `side` — one component whose props
 * change meaning according to another prop is non-goal 4.
 *
 * **Controlled, and there is no trigger component.** Pass `isOpen` and
 * `onOpenChange`; focus still returns to whatever opened it.
 *
 * **It needs no narrow-window exception.** A dialog has to become full-screen
 * below a threshold; a drawer already fills the window when the window is
 * thinner than its `size`, because the thickness is a maximum rather than a
 * width. One less rule, and one less number to choose.
 *
 * ```tsx
 * <Drawer
 *   isOpen={isOpen}
 *   onOpenChange={setOpen}
 *   title="Customer 4821"
 *   footer={<Button variant="primary">Save</Button>}
 * >
 *   <TextField label="Legal name" />
 * </Drawer>
 * ```
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  {
    title,
    children,
    footer,
    side = 'end',
    size = 'md',
    className,
    style,
    ...overlayProps
  },
  ref
) {
  /*
   * The base's own locale context, which `ConfigProvider` feeds. This is the
   * only thing in the component that needs to know about direction, and it
   * needs to for one reason: there is no logical `translate`, so the slide's
   * sign cannot be expressed in CSS alone (see Drawer.css).
   *
   * Read from the locale rather than from the DOM, which is what doc 05 §4
   * asks — direction is derived from the language — and it also works for a
   * consumer who set the locale without setting `dir` on their own document.
   */
  const { direction } = useLocale();
  const axis = AXIS[side];

  return (
    <ModalOverlay
      className={cx(DRAWER_SCRIM, PLACEMENT[side])}
      {...overlayProps}
    >
      <Modal
        ref={ref}
        /*
         * `dir` on the panel, so the four rules in Drawer.css can select on it.
         * It is the same value the surrounding document already has in a
         * correctly set up application — restating it here is what makes the
         * component work when it is not.
         */
        dir={direction}
        data-side={side}
        data-axis={axis}
        className={cx(
          DRAWER_PANEL,
          EDGE[side],
          axis === 'inline' ? INLINE_THICKNESS[size] : BLOCK_THICKNESS[size],
          className
        )}
        {...(style === undefined ? {} : { style })}
      >
        <ModalSheet title={title} {...(footer === undefined ? {} : { footer })}>
          {children}
        </ModalSheet>
      </Modal>
    </ModalOverlay>
  );
});
