import { forwardRef, useId } from 'react';
import { Popover as AriaPopover, PreviewTrigger } from 'react-aria-components';
import {
  ANCHORED,
  HOVER_CLOSE_DELAY,
  HOVER_OPEN_DELAY,
  LAYER_OFFSET,
  LayerArrow,
  PANEL,
  type Placement
} from '../../internal/Layer';
import { NoButtonSet } from '../../internal/buttonAppearance';
import { cx } from '../../internal/cx';

/*
 * TWO ELEMENTS, and the reason is the arrow.
 *
 * The base positions the outer one, publishes `data-placement` and
 * `data-entering` on it, and writes the height ceiling into its style. The
 * arrow is positioned against that same element and outside it, and the panel
 * clips its children — so the arrow and the painted card cannot be the same
 * box. `internal/Layer/layerBox.ts` has the measurements, including the two
 * ways of getting this wrong that were tried first.
 *
 * The outer one paints nothing. Everything visible is on the card.
 *
 * `max-w-narrow` and not `medium`. A preview is a summary of the thing under
 * the pointer, and `--container-medium` is the width of a filter panel; a
 * summary that wide is a page. The width below the maximum is the content's,
 * which is doc 04 §3 taken literally.
 *
 * NO `container-type` anywhere in here, and that is not even a choice — the
 * width is the content's, and inline-size containment resolves an element's
 * inline size as though it had no contents, which collapses exactly that. The
 * law is in `layerBox.ts`; `Popover` is where it was measured, at 2px.
 */
const PREVIEW_WRAPPER = cx(
  'bb-preview',
  ANCHORED,
  'bb:z-(--bb-layer-popover)',
  'bb:max-w-narrow'
);

/*
 * The card: the shared layer surface plus a preview's own edges — bordered and
 * rounded on all four sides, because it floats clear of everything.
 *
 * `min-h-0` so the ceiling on the wrapper actually bounds it. A percentage
 * cannot: `max-height: 100%` against an element that has only a maximum
 * computes to `none`, measured on `Dialog` with 1658px of content in a panel
 * capped at 876px.
 */
const PREVIEW_CARD = cx(PANEL, 'bb:min-h-0', 'bb:border bb:rounded-lg');

/*
 * The title, and it is NOT A HEADING ELEMENT.
 *
 * Everywhere else in this library a layer's title is a real heading: the base
 * puts `level: 2` on the title slot's context inside a dialog, and a dialog is
 * a boundary the document outline restarts inside (doc 06 §2). A preview
 * cannot use that machinery, because the machinery is the nested dialog this
 * component is not allowed to render — see the component's own note.
 *
 * So the choice is a heading whose level nobody can derive, or an element that
 * NAMES the panel without adding to the outline. The second is chosen: the
 * panel is already a `dialog`, `aria-labelledby` points here, and a screen
 * reader announces the name on entering it. An `<h2>` guessed inside an
 * ephemeral hover card would put a landmark in the outline for something that
 * exists while a pointer rests, and doc 06 §2 says the level is the project's
 * to decide, not ours.
 *
 * It still looks like a heading, which is doc 06 §2's other half: emphasis
 * comes from weight and colour.
 */
const PREVIEW_TITLE = cx(
  'bb:box-border',
  'bb:px-(--bb-space-4) bb:pt-(--bb-space-4)',
  'bb:text-md bb:font-strong bb:leading-tight',
  'bb:[overflow-wrap:break-word]'
);

/*
 * The body.
 *
 * It scrolls, and the panel does not. The base writes a `max-height` from the
 * room between the trigger and the edge of the window, and `PANEL` clips —
 * without a scroller inside, content taller than that room is silently cut,
 * which is the failure this repository has already paid for once in `Dialog`.
 *
 * `min-h-0` for the reason the shared sheet records: a flex item's automatic
 * minimum size is its content, so without it the body refuses to shrink and
 * overflows the panel however low the ceiling is.
 *
 * `overscroll-contain` so a wheel gesture reaching the bottom of a card does
 * not start scrolling the page behind it (doc 09 §7) — which matters more here
 * than in a modal layer, because the page behind a preview is not locked.
 */
const PREVIEW_BODY = cx(
  'bb:box-border bb:min-h-0 bb:overflow-y-auto bb:overscroll-contain',
  'bb:p-(--bb-space-4)',
  'bb:text-sm'
);

export interface PreviewProps {
  /**
   * The thing being previewed, and it **must be focusable** — a `Button`, and
   * `variant="link"` is the one that looks like the name of a record rather
   * than a control. Anything that participates in focus works. The base wires hover, focus
   * and long press to it through a focusable context, so a bare `<span>`
   * receives none of them and produces a preview that exists for a pointer and
   * for nobody else.
   */
  trigger: React.ReactNode;
  /**
   * The card: a summary of whatever the trigger names.
   *
   * **Interactive content is allowed here**, and that is the whole difference
   * from `Tooltip`. `Tab` on the trigger moves focus to the first thing in
   * here, tabbing past the last one leaves, and `Escape` closes it — all of it
   * the base's, and none of it available to a tooltip, which is not focusable
   * and closes when its trigger blurs.
   *
   * Two things it is still not for. Anything a person **needs** should not be
   * behind a hover: there is no hover on a touch device, where this opens on
   * long press instead and the base says so in the reader's own language. And
   * a card that has to scroll is a sign the content belongs on the page or in
   * a `Popover` — the scroll is here so that content is never silently cut,
   * not as a feature.
   */
  children?: React.ReactNode;
  /**
   * Its name, shown at the top of the card.
   *
   * **Required, and measured rather than assumed.** The base gives a preview's
   * panel `role="dialog"` — by the trigger's name, even though the panel is
   * non-modal — and names it with nothing: `aria-labelledby` absent,
   * `aria-label` absent, accessible name `null`. An unnamed dialog is
   * announced as "dialog", which says that something appeared and not what. So
   * this names the panel, and the usual value is the same words the trigger
   * carries.
   */
  title: React.ReactNode;
  /**
   * Where it sits, from the twelve logical positions (doc 02 §3.3). Defaults to
   * `bottom start` — under the thing it describes, aligned to it, which is what
   * a card hanging off a word in a sentence wants.
   *
   * The base repositions one that would not fit, so this is a preference; the
   * arrow follows where it actually went.
   */
  placement?: Placement;
  /**
   * Turn it off without unmounting the trigger, for a preview that only applies
   * some of the time — a row whose record has no detail to show yet.
   *
   * The trigger is untouched: it keeps its focus, its press behaviour and its
   * appearance. Nothing opens, and the trigger stops claiming that anything
   * can be — no `aria-haspopup`, no `aria-expanded`.
   */
  isDisabled?: boolean;
}

/**
 * A card about the thing under the pointer: a customer's terms behind their
 * name, a user's role behind their avatar, an invoice's status behind its
 * number.
 *
 * It is the third answer to "extra information about something", and the three
 * divide by what the information is for:
 *
 * - `Tooltip` — a short description of a **control**. Nothing in it can be
 *   reached, by pointer or keyboard.
 * - **`Preview`** — a summary of a **record**, on hover, focus or long press.
 *   Its content can be read at length, selected, and tabbed into.
 * - `Popover` — a panel opened **deliberately**, by a press. It blocks the
 *   page; these two do not.
 *
 * ## What it deliberately does not do
 *
 * **It does not contain focus**, and that is not configurable. Tabbing past the
 * last thing in the card leaves it and it closes. Doc 08 §4 has the mechanism
 * and the measurement: containment in a layer follows from whether the layer
 * blocks the page, and a preview blocks nothing — no underlay, no scroll lock,
 * the page behind still in the accessibility tree. A hover card with no close
 * button that held the keyboard would be doc 06 §4's point 10 exactly.
 *
 * **It renders no dialog of its own**, which is the same decision seen from the
 * DOM. The shared `ModalSheet` would give it a header, a title slot and a close
 * button for free, and it would also switch focus containment on from the
 * inside — the base excludes previews from containment by name, and a nested
 * `useDialog` defeats that exclusion. Measured before this component was
 * written, which is why its title and body are its own six lines.
 *
 * **No delay props.** 600ms to open and 150ms to close are one decision for the
 * whole library (doc 09 §3.1), and the closing number is not what lets the
 * pointer travel into the card — the base keeps a safe-area polygon over the
 * trigger, the panel and the space between them, so the journey has no deadline.
 *
 * **No arrow prop.** It always has one, like `Tooltip` and unlike `Popover`. A
 * card that appeared 8px from a word in a table of thirty links has to say
 * which word, and a press does not need saying because you just made it.
 *
 * ```tsx
 * <Preview
 *   title="Astilleros del Sur SAC"
 *   trigger={<Button variant="link">Astilleros del Sur</Button>}
 * >
 *   Callao · Terms 30 days · Balance 12,480.00
 * </Preview>
 * ```
 */
export const Preview = forwardRef<HTMLElement, PreviewProps>(function Preview(
  { trigger, children, title, placement = 'bottom start', isDisabled },
  ref
) {
  /*
   * The panel is named by pointing at the title, so the title needs an id and
   * the id has to be stable across a render. `useId` rather than anything
   * counted here: two previews in one row would otherwise name each other's
   * panels, and nothing in the DOM would look wrong.
   */
  const titleId = useId();

  /*
   * DISABLED MEANS NOT MOUNTED, and that is a workaround for a gap in the base
   * rather than a preference.
   *
   * `PreviewTrigger` takes `isDisabled` and passes it to `useHover` and
   * `useLongPress` — but its focus handler does not consult it. Measured: with
   * `isDisabled` passed through, a keyboard `Tab` onto the trigger still opened
   * the card after the warmup delay. That is the worse half to get wrong: a
   * preview switched off for the pointer and left on for the keyboard is a
   * layer only some people can produce, and nothing in the DOM says so.
   *
   * Declining to mount the trigger wrapper is what makes the prop mean one
   * thing. It also removes the claim from the trigger, which passing the prop
   * would not have: no `aria-haspopup`, no `aria-expanded`, no description
   * pointing at a card that never appears.
   */
  if (isDisabled === true) {
    return <>{trigger}</>;
  }

  return (
    /*
     * `PreviewTrigger` renders no DOM of its own: it wires hover, keyboard
     * focus and long press to the trigger through a focusable context, and
     * publishes the popover's configuration through another. Composed here
     * rather than by the consumer, for the reason `Tooltip` and `Popover`
     * record — it makes a preview with no trigger, two on one trigger, and the
     * two in the wrong order impossible.
     *
     * The delays are passed rather than defaulted. The base's own numbers are
     * 600 and 200, and 200 is not ours: doc 09 §3.1 fixes one closing delay for
     * every hover layer in the library, and a tooltip and a preview differing
     * by 50ms is the kind of thing nobody can name and everybody feels.
     */
    <PreviewTrigger delay={HOVER_OPEN_DELAY} closeDelay={HOVER_CLOSE_DELAY}>
      {trigger}
      <AriaPopover
        ref={ref}
        className={PREVIEW_WRAPPER}
        placement={placement}
        offset={LAYER_OFFSET}
        /*
         * Naming the base's own `role="dialog"`. It is passed here rather than
         * on the card because this element IS the dialog — the base puts the
         * role on the element it positions, and keeps it only as long as
         * nothing inside claims one.
         */
        aria-labelledby={titleId}
      >
        {/* Outside the card, because the card clips. */}
        <LayerArrow />
        <div className={PREVIEW_CARD}>
          <div className={PREVIEW_TITLE} id={titleId}>
            {title}
          </div>
          {/*
           * The set stops here too, and this component needs saying
           * separately: it is the one layer that cannot use the shared sheet,
           * because the sheet is what contains a layer's focus and a preview
           * must not (doc 08 §4).
           */}
          <div className={PREVIEW_BODY}>
            <NoButtonSet>{children}</NoButtonSet>
          </div>
        </div>
      </AriaPopover>
    </PreviewTrigger>
  );
});
