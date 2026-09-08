import { forwardRef } from 'react';
import {
  DialogTrigger,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps
} from 'react-aria-components';
import {
  LAYER_OFFSET,
  LayerArrow,
  ModalSheet,
  PANEL,
  type Placement
} from '../../internal/Layer';
import { cx } from '../../internal/cx';

/*
 * The panel.
 *
 * `PANEL` is the shared layer surface, and what is added here is what a
 * popover's own edges are: bordered and rounded on all four sides, because it
 * floats clear of everything — the same as a dialog and the opposite of a
 * drawer.
 *
 * A MAXIMUM WIDTH AND NO WIDTH. The panel is as wide as its content up to
 * `--container-medium`, which is doc 04 §3 taken literally. There is no `size`
 * prop: a popover is anchored to a control and sized by what is in it, and a
 * scale of widths would be inventing a decision nobody has to make. The one
 * width that will be asked for eventually — matching the trigger, which a
 * select needs — is not here either, because nothing needs it today (rule 8).
 *
 * The HEIGHT is the base's. It measures the room between the trigger and the
 * edge of the window and writes a `max-height` into the popover's own style,
 * so a long list scrolls rather than running off the screen, with no viewport
 * query of ours.
 *
 * AND NO `container-type`, which the other two layers declare. A popover is
 * absolutely positioned with `width: auto`, so its width is shrink-to-fit —
 * and inline-axis size containment resolves an element's inline size as though
 * it had no contents, which collapses exactly that. Measured: 2px wide, one
 * character per line. The law is in `internal/Layer/layerBox.ts` and the two
 * halves cannot be had together — containment is what would make even
 * `width: max-content` zero.
 *
 * So content inside a popover cannot ask how wide the popover is. That is the
 * right way round: the content is what decided the width.
 */
const POPOVER_PANEL = cx(
  'bb-popover',
  PANEL,
  'bb:z-(--bb-layer-popover)',
  'bb:max-w-medium bb:border bb:rounded-lg'
);

export interface PopoverProps extends Pick<
  AriaPopoverProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange'
> {
  /**
   * The control that opens it, and it **must be focusable** — a `Button`, a
   * `Link`, anything that participates in focus. The base wires the open
   * behaviour to it through a focusable context, so a bare `<span>` receives
   * none of it.
   */
  trigger: React.ReactNode;
  /**
   * What is inside: a filter form, a set of details, a short list.
   *
   * This is `children` and the trigger is a prop, which is the other way round
   * from `Tooltip`. The principle is the same in both — **`children` is the
   * substantial part** — and it lands differently because the components do: a
   * tooltip is a short string about a control, and a popover is a panel opened
   * by a button.
   */
  children?: React.ReactNode;
  /**
   * Its name, shown as a heading and announced when focus enters.
   *
   * Required, because the panel is a `dialog` — the shared sheet inside carries
   * that role — and a dialog with no accessible name is announced as "dialog",
   * which says that something happened and not what.
   */
  title: React.ReactNode;
  /**
   * The actions, in a footer that stays visible while the content scrolls.
   * A filter panel's Apply button lives here.
   */
  footer?: React.ReactNode;
  /**
   * Where it sits, from the twelve logical positions (doc 02 §3.3). Defaults
   * to `bottom start` — under the control, aligned to it, which is what a
   * panel opened by a button wants and what a menu will want too.
   *
   * The base repositions one that would not fit, so this is a preference; the
   * arrow follows where it actually went.
   */
  placement?: Placement;
  /**
   * Whether clicking outside closes it. **Defaults to `true`.**
   *
   * This is the decision doc 08 §5.1 held open until this component was built,
   * and the reasoning is there rather than here. In short, and measured: the
   * underlay **swallows** the click, so clicking outside dismisses the panel
   * and does not press the button under it. A stray click therefore costs a
   * filter nobody had applied, and a deliberate one costs a second press.
   *
   * Turn it off for a popover holding something that must not be lost. `Escape`
   * and the close button work either way; nothing in this library lets a layer
   * swallow `Escape`.
   */
  isDismissable?: boolean;
  /**
   * Draw the little triangle pointing at the trigger. **Defaults to `false`**,
   * which is the opposite of `Tooltip`.
   *
   * On a tooltip the arrow is doing work: a small bubble near five icon buttons
   * needs to say which one it belongs to. A popover is a panel opened by a
   * press, so where it came from is not in doubt, and an arrow on a wide panel
   * is one more piece of geometry to keep agreeing with a border. Turn it on
   * where the trigger is small or crowded.
   */
  hasArrow?: boolean;
  /**
   * Applied to the panel, for anything beyond the maximum width. Nothing
   * reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A panel anchored to the control that opened it: a filter form, a set of
 * details, a short list of related actions.
 *
 * ## It blocks the page, which is not what a popover sounds like
 *
 * While it is open the page behind it is covered by a full-window underlay,
 * cannot be scrolled, and is hidden from the accessibility tree — three
 * behaviours of the base, all keyed on the panel being modal, and none of them
 * affected by `isDismissable`. A popover is a modal layer without a visible
 * scrim.
 *
 * **Focus is contained to match**, and that is not configurable: `Tab` cycles
 * inside the panel and `Escape` closes it. Focus that could leave would land
 * on a control that is `aria-hidden` and under an underlay that will not let it
 * be clicked, which is worse than containment rather than better.
 *
 * Doc 08 §4 said the opposite of all of this and is corrected there, with the
 * two mechanisms that produce it — worth reading before building another
 * layer, because containment here comes from the shared sheet rather than from
 * anything this file asks for.
 *
 * ## It is opened by its trigger, and may also be controlled
 *
 * Unlike `Dialog`, the trigger is right here — a popover is anchored to it, so
 * there is nothing to open from far away. Passing `trigger` is enough. `isOpen`
 * and `onOpenChange` are forwarded for the case where something else has to
 * decide (doc 02 §8).
 *
 * ## What it deliberately does not take
 *
 * No `offset`, `containerPadding` or `shouldFlip` — the distance from a trigger
 * is spacing, from a token, one value for the library (doc 02 §3.3). No `size`:
 * a popover is sized by its content up to a maximum, and its height comes from
 * the room the base measured.
 *
 * ```tsx
 * <Popover
 *   title="Filter invoices"
 *   trigger={<Button>Filters</Button>}
 *   footer={<Button variant="primary">Apply</Button>}
 * >
 *   <TextField label="Reference" />
 * </Popover>
 * ```
 */
export const Popover = forwardRef<HTMLElement, PopoverProps>(function Popover(
  {
    trigger,
    children,
    title,
    footer,
    placement = 'bottom start',
    isDismissable = true,
    hasArrow = false,
    className,
    style,
    ...triggerProps
  },
  ref
) {
  return (
    /*
     * `DialogTrigger` renders no DOM: it wires the trigger's press to the
     * popover's state through context, which is why the trigger has to be
     * something focusable. Composed here rather than by the consumer, for the
     * reasons `Tooltip` records — it makes a popover with no trigger, two
     * popovers on one trigger, and the two in the wrong order impossible.
     */
    <DialogTrigger {...triggerProps}>
      {trigger}
      <AriaPopover
        ref={ref}
        className={cx(POPOVER_PANEL, className)}
        placement={placement}
        offset={LAYER_OFFSET}
        /*
         * The base takes a FILTER rather than a boolean here — it is asked, per
         * interaction, whether that particular element should dismiss. Always
         * refusing is how "not dismissable" is expressed, and `undefined`
         * leaves the base's own default, which is to close.
         */
        {...(isDismissable
          ? {}
          : { shouldCloseOnInteractOutside: () => false })}
        {...(style === undefined ? {} : { style })}
      >
        {hasArrow ? <LayerArrow /> : null}
        {/*
         * The same sheet a dialog and a drawer use: a pinned header with the
         * title and a close button, the content, a pinned footer. Its third
         * caller, which is when doc 01's own instinct says an abstraction has
         * earned its place — and this one was extracted at the second, with a
         * reason written down at the time.
         *
         * Nesting a `role="dialog"` in here also stops the base adding its own:
         * measured, it looks for one and skips its role when it finds it, so
         * there is exactly one dialog rather than two.
         */}
        <ModalSheet title={title} {...(footer === undefined ? {} : { footer })}>
          {children}
        </ModalSheet>
      </AriaPopover>
    </DialogTrigger>
  );
});
