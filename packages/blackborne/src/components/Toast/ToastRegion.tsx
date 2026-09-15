import { forwardRef } from 'react';
import {
  Text,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastRegion as AriaToastRegion
} from 'react-aria-components';
import { Button } from '../Button';
import { CrossGlyph } from '../../internal/CrossGlyph';
import {
  TONE_SOLID,
  TONE_SURFACE,
  ToneGlyph,
  type Tone
} from '../../internal/ToneGlyph';
import { cx } from '../../internal/cx';
import { useMessage } from '../../config';
import { baseQueueOf, type ToastMessage, type ToastQueue } from './useToasts';

/*
 * The region: a landmark holding the stack, pinned to a corner of the window.
 *
 * `fixed` and a corner, which is doc 04 §5's legitimate viewport case — the
 * region is portalled, so the window IS its container.
 *
 * THE CORNER IS NOT A PROP, and that is rule 8 rather than an oversight. A
 * corner prop is the first thing to add when a real screen needs another one;
 * nothing needs it today, and four corners would arrive with four sets of
 * animation directions to keep agreeing with them.
 *
 * `bottom` and the inline END, so it flips in Arabic with no code. Bottom
 * because the top of a management screen is where the application's own
 * furniture lives — a header, a breadcrumb, a row of actions — and a stack that
 * covers it hides the thing somebody was about to press.
 *
 * `pointer-events-none` on the region and `auto` on each notice: the region is
 * a full-height column so the stack can grow upward, and a column of dead space
 * down the side of the window would swallow clicks on the page behind it.
 */
const REGION = cx(
  'bb-toast-region',
  'bb:box-border bb:fixed',
  'bb:z-(--bb-layer-toast)',
  'bb:flex bb:flex-col bb:gap-(--bb-space-3)',
  'bb:p-(--bb-space-4)',
  'bb:max-h-full bb:max-w-narrow',
  'bb:pointer-events-none',
  'bb:font-sans bb:text-md bb:leading-normal',
  'bb:outline-none'
);

/**
 * Where the stack sits on the screen.
 *
 * The same vocabulary `Popover` uses for its twelve — a block keyword, then an
 * optional inline one, with the centre named by leaving the second out. Two
 * spellings for one idea in one library is doc 01 §7, and somebody who has
 * placed a popover should not have to learn a second grammar to place a
 * notice.
 *
 * LOGICAL, never physical: `start` is the left in English and the right in
 * Arabic, which is hard rule 2 and is why there is no `'top left'` to write.
 *
 * There is no plain `'middle'`. The centre of the screen is where the work is,
 * and a notice is not an interruption to be answered — doc 09 §4 gives that
 * job to a dialog. The two middles that exist hug an edge.
 */
export type ToastPlacement =
  | 'top start'
  | 'top'
  | 'top end'
  | 'middle start'
  | 'middle end'
  | 'bottom start'
  | 'bottom'
  | 'bottom end';

/*
 * The box, per placement.
 *
 * `justify-end` on the bottom row is what keeps a growing stack pinned to the
 * edge it is anchored to rather than growing away from it.
 */
const PLACEMENT: Record<ToastPlacement, string> = {
  'top start': 'bb:top-0 bb:start-0 bb:justify-start',
  top: 'bb:top-0 bb:start-1/2 bb:-translate-x-1/2 bb:justify-start',
  'top end': 'bb:top-0 bb:end-0 bb:justify-start',
  'middle start': 'bb:top-1/2 bb:start-0 bb:-translate-y-1/2 bb:justify-center',
  'middle end': 'bb:top-1/2 bb:end-0 bb:-translate-y-1/2 bb:justify-center',
  'bottom start': 'bb:bottom-0 bb:start-0 bb:justify-end',
  bottom: 'bb:bottom-0 bb:start-1/2 bb:-translate-x-1/2 bb:justify-end',
  'bottom end': 'bb:bottom-0 bb:end-0 bb:justify-end'
} satisfies Record<ToastPlacement, string>;

/*
 * WHICH WAY A NOTICE ARRIVES FROM, which follows the placement rather than
 * being a second decision.
 *
 * A notice that slid in from the right while its stack sat at the top left
 * would be telling you it came from somewhere it did not. The class sets the
 * keyframes; `Toast.css` holds them and says why the entry exists at all.
 *
 * The two centred placements travel along the BLOCK axis — there is no inline
 * edge for them to come from — and the two middles come from the inline edge
 * they are pinned to, like the corners.
 */
const ARRIVAL: Record<ToastPlacement, string> = {
  'top start': 'bb-toast-from-start',
  top: 'bb-toast-from-top',
  'top end': 'bb-toast-from-end',
  'middle start': 'bb-toast-from-start',
  'middle end': 'bb-toast-from-end',
  'bottom start': 'bb-toast-from-start',
  bottom: 'bb-toast-from-bottom',
  'bottom end': 'bb-toast-from-end'
} satisfies Record<ToastPlacement, string>;

/**
 * How a notice is painted.
 *
 * `plain` is a neutral card with the tone on its leading edge and in its badge.
 * `tinted` fills the whole card with the tone's subtle surface, which is what
 * `Alert` does in the page.
 *
 * ON THE REGION AND NOT ON THE MESSAGE, deliberately. An application has one
 * way of showing a notice; choosing per notice is how a sequence of saves ends
 * up looking like four different products, which is §3.1's argument against
 * per-instance timings applied to the other axis.
 */
export type ToastVariant = 'plain' | 'tinted';

/*
 * One notice.
 *
 * The same raised surface as every floating thing in the library, at the panel
 * radius. It does NOT use the shared `PANEL`: that panel clips its children so
 * a sticky header cannot cross a rounded corner, and a notice has no header, no
 * scroll and one thing that must not be clipped — the countdown, which sits on
 * the bottom edge.
 *
 * `pointer-events-auto` restores what the region gave up.
 *
 * `overflow-hidden` here IS wanted, and the countdown lives inside it on
 * purpose: the bar is clipped to the notice's own corners rather than running
 * square across them.
 */
const TOAST = cx(
  'bb-toast',
  'bb:box-border bb:relative bb:overflow-hidden',
  'bb:pointer-events-auto',
  /*
   * THREE ZONES THAT MEET, with no gap and no padding on the card itself.
   *
   * The badge and the cross are full-height CELLS rather than icons floating
   * in a padded row: a cross with air round it reads as a control sitting on
   * the message, and one that owns a column to the end of the card reads as
   * the place you go to dismiss it. The message carries its own padding, so
   * the two cells can run edge to edge.
   *
   * `items-stretch` is what makes them full height, and it is the reason the
   * gap had to go rather than shrink: a gap between stretched cells is a strip
   * of card showing between two zones that are meant to be adjacent.
   */
  'bb:flex bb:items-stretch',
  /*
   * A PANEL WITH A TONE ON ITS LEADING EDGE, and it was a tinted card until
   * 2026-09-14. The history matters, because the argument that put the tint
   * there is still true and is now answered differently.
   *
   * It was built on `bg-surface-raised` first, and the first three-tone
   * screenshot settled it the other way: a failure looked exactly like a
   * success apart from a 16px outline glyph. Doc 09 §4 is about communicating
   * an outcome, and somebody scanning a corner of the screen has to see WHICH
   * outcome without reading — doc 06 §3 asks for the silhouette as well, not
   * instead.
   *
   * What changed is how much of the card the tone has to occupy to do that. A
   * STRIPE down the leading edge and a FILLED badge are two saturated things
   * against a neutral card, where the tint was one pale thing across all of
   * it — and the tint was also the reason a notice looked unlike every other
   * floating surface in the library. The silhouette argument is untouched: the
   * badge keeps its per-tone shape, so a caution is still a triangle in
   * greyscale.
   *
   * `overflow-hidden` above is what keeps the stripe inside the radius.
   */
  /*
   * NO SURFACE HERE. The two variants each declare their own, and the reason
   * is the trap this library has hit three times: two `background-color`
   * utilities at the same specificity are resolved by the order TAILWIND
   * EMITS them, not by the order they appear in the attribute.
   *
   * Measured by opening the first tinted baseline: a success card came out
   * white, a warning faintly amber and a danger white — `bg-surface-raised`
   * winning against `bg-<tone>-subtle` for some tones and losing for others,
   * which is what a coin toss between two rules looks like across four
   * families. Declaring the background in exactly one branch removes the
   * fight rather than trying to win it.
   */
  /*
   * NO SHADOW. It had `shadow-lg` like every other floating thing, and a
   * notice is the one that does not need it: it arrives in a corner over
   * whatever happens to be there, already carrying a saturated edge and a
   * badge, and the shadow made it the heaviest object on a page it is only
   * visiting. The border and the surface hold it off the page on their own —
   * the same conclusion `Popover` and the dropdowns reached before it.
   */
  'bb:border bb:border-border bb:rounded-lg',
  /*
   * The focus ring belongs on it: each notice is focusable, because landmark
   * navigation lands on the region and `Tab` walks the stack from there
   * (doc 08 §7).
   *
   * `data-focused` and the same halo every control in the library uses, from
   * `--bb-focus-ring`. Not `focus-visible`, for the reason `Button` records at
   * length: every other control here shows its ring on a click too, and doc 09
   * §8 is blunt that one component behaving differently costs the credibility
   * of the rest.
   *
   * There is a second consequence here that there is not on a button, and it
   * is the right one: focus inside the region pauses every timer in it, so a
   * notice somebody has clicked stops counting down. That is the base's
   * behaviour and exactly what a person who just reached for it wants.
   */
  'bb:outline-hidden',
  'bb:data-focused:border-focus-ring bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]'
);

/*
 * The remaining time, as a bar along the bottom edge.
 *
 * It is the requirement that makes a timed dismissal honest (doc 09 §4.1)
 * rather than decoration: a countdown somebody can see is a countdown they can
 * beat, and hovering the region stops it.
 *
 * The DURATION comes from the notice's own timeout, published as a custom
 * property, because a bar animating for six seconds beside a timer running for
 * ten is worse than no bar. The base's timer keeps its remaining time private,
 * so this cannot read the clock — it runs the same length from the same number,
 * and pauses on the same signals.
 */
/*
 * The stripe, as the leading border rather than as an element.
 *
 * A border takes the card's radius with it and costs no box; a child would
 * need positioning, a height and a corner of its own. `border-s-4` is on
 * `TOAST`, and this only says what colour it is — which keeps the four values
 * in one map instead of four class strings in a branch.
 */
const TONE_EDGE: Record<Tone, string> = {
  /* The ordinary border, for the tone that reports no state. */
  neutral: 'bb:border-s-border-strong',
  info: 'bb:border-s-info',
  success: 'bb:border-s-success',
  warning: 'bb:border-s-warning',
  danger: 'bb:border-s-danger'
} satisfies Record<Tone, string>;

const COUNTDOWN = cx(
  'bb-toast-countdown',
  /*
   * OVER THE CLOSE BUTTON, as a ring that completes, and it was a hairline bar
   * along the bottom edge until 2026-09-14.
   *
   * The bar was honest and easy to miss: one pixel at the far edge of the card
   * from the thing it is about. Wrapping the close button puts the time left
   * around the control that spends it — the same gesture answers "how long do
   * I have" and "make it go now" — and a ring reads as a quantity at a glance
   * where a 1px line reads as a border.
   *
   * `pointer-events-none`, because the button underneath is the target. A ring
   * that swallowed the press would be a countdown you could not beat, which is
   * the opposite of doc 09 §4.1's whole point.
   */
  'bb:pointer-events-none bb:absolute',
  'bb:-rotate-90'
);

/*
 * The badge: the tone's solid, with the mark drawn on it in the colour paired
 * with that solid (`TONE_SOLID`). A circle of colour rather than a card of it.
 */
/*
 * The badge's cell: a fixed column at the leading edge, the full height of the
 * card, with the glyph centred in it.
 *
 * A WIDTH AND NOT A PADDING, so the message starts at the same place whatever
 * the tone's glyph happens to be — and so the two cells at the two ends are
 * the same size as each other.
 */
const BADGE = cx(
  'bb:flex bb:flex-none bb:items-center bb:justify-center',
  'bb:w-10 bb:self-stretch'
);

/*
 * The message's own padding, since the card has none. Block padding sets the
 * card's height, which is what the two cells then stretch to.
 */
const MESSAGE = cx(
  'bb:min-w-0 bb:flex-1',
  'bb:py-(--bb-space-3) bb:pe-(--bb-space-2)'
);

/*
 * And the leading padding it needs when there is no badge cell in front of it.
 * The cell's own centring supplies that space for every other tone.
 */
const MESSAGE_ALONE = cx(MESSAGE, 'bb:ps-(--bb-space-3)');

/*
 * The cross's cell: the mirror of the badge at the other end, with a tint of
 * its own so it reads as somewhere to press rather than as a glyph in the
 * corner of the message.
 */
const CLOSE_CELL = cx(
  'bb:relative bb:flex bb:flex-none bb:items-center bb:justify-center',
  'bb:w-10 bb:self-stretch'
);

export interface ToastRegionProps {
  /**
   * The queue to show, from `useToasts`.
   *
   * One region per queue: two regions rendering the same queue would announce
   * every notice twice and leave a screen reader with two landmarks of the same
   * name.
   */
  queue: ToastQueue;
  /**
   * Where the stack sits. Defaults to `bottom end`.
   *
   * It also decides which edge a notice arrives from, so there is no second
   * prop for that and no way for the two to disagree.
   */
  placement?: ToastPlacement;
  /**
   * How a notice is painted. Defaults to `plain`.
   *
   * `plain` is a neutral card carrying the tone on its leading edge and in its
   * badge; `tinted` fills the card with the tone's own subtle surface.
   */
  variant?: ToastVariant;
}

/**
 * Where notices appear: a landmark pinned to the bottom inline-end corner of
 * the window, holding up to three at a time.
 *
 * Render exactly one, near the root of the application, and add to its queue
 * from anywhere:
 *
 * ```tsx
 * const toasts = useToasts();
 *
 * return (
 *   <>
 *     <ToastRegion queue={toasts} />
 *     <Button onPress={() => toasts.add({ title: 'Invoice sent' })}>
 *       Send
 *     </Button>
 *   </>
 * );
 * ```
 *
 * ## What it does that is worth knowing
 *
 * **The timers pause while the pointer is in the region or focus is inside
 * it.** That is the base's, it applies to every notice at once, and it is half
 * of what makes an automatic dismissal acceptable — the other half is the
 * countdown being visible (doc 09 §4.1).
 *
 * **Three at a time, newest first, and nothing is discarded.** A fourth notice
 * pushes the oldest off the screen rather than out of the queue, and — measured
 * — a waiting one does not spend its time while it is hidden: the base starts a
 * notice's timer when it becomes visible. So a burst of five shows the newest
 * three, and the other two appear with their full time as those expire. A
 * notice dropped because two others arrived first would be a message somebody
 * was sent and never saw.
 *
 * **Each notice is announced assertively, and there is no polite mode.** The
 * base gives the content `role="alert"`, which interrupts. A notice that waited
 * for a pause in the reading would arrive after the thing it describes had
 * scrolled away, and a library-wide switch between the two is a decision no
 * consumer has enough context to make per notice.
 *
 * **The keyboard route in is landmark navigation**, not `Tab`. The region is a
 * landmark, so a screen reader user reaches it by moving between landmarks;
 * from there `Tab` walks the stack and each notice is focusable. Doc 08 §7
 * records that this is the base's design and that it is the reason the region
 * carries a role rather than being an unlabelled box.
 *
 * ## What it does not take
 *
 * No corner, no `maxVisibleToasts`, no timeout, no polite mode, and no way to
 * read the queue. The corner and the count are one decision each for the
 * library, the timings are doc 09 §4.1, and a consumer who needs to know what
 * is on screen is building a second notification system beside this one.
 */
export const ToastRegion = forwardRef<HTMLDivElement, ToastRegionProps>(
  function ToastRegion(
    { queue, placement = 'bottom end', variant = 'plain' },
    ref
  ) {
    const closeLabel = useMessage('close');
    const base = baseQueueOf(queue);

    /*
     * A queue this component did not make. `baseQueueOf` returns nothing for
     * anything but a `useToasts` result, so a plain object shaped like one — or
     * a value that survived a hot reload the hook did not — renders nothing
     * rather than throwing inside the base.
     */
    if (base === undefined) {
      return null;
    }

    return (
      <AriaToastRegion
        ref={ref}
        queue={base}
        className={cx(REGION, PLACEMENT[placement])}
      >
        {({ toast }) => {
          const message: ToastMessage = toast.content;
          /*
           * `neutral` when nothing was said, and it was `info` until
           * 2026-09-14. A notice that declares no tone has no outcome to
           * report, and painting it blue asserted one — the badge said
           * "information" about a line that had not claimed to be any kind of
           * thing. The tone that means "no state" is the honest default for a
           * message with no state.
           */
          const tone = message.tone ?? 'neutral';

          return (
            <AriaToast
              toast={toast}
              className={cx(
                TOAST,
                ARRIVAL[placement],
                /*
                 * A tinted card takes the tone's whole surface AND drops the
                 * stripe: an edge in the same family as the fill is a darker
                 * line round a coloured card, which reads as a border that
                 * failed rather than as a signal. `plain` is the other way
                 * round — the tone lives on the edge because the card is
                 * neutral.
                 */
                variant === 'tinted'
                  ? cx('bb:border-s', TONE_SURFACE[tone])
                  : cx(
                      'bb:bg-surface-raised bb:text-surface-raised-on',
                      'bb:border-s-4',
                      TONE_EDGE[tone]
                    )
              )}
            >
              {/*
               * The glyph, drawn rather than received, for the reason doc 06 §3
               * gives and `Alert` records: in greyscale the four tones are four
               * near-identical surfaces, so the silhouette is what carries the
               * tone.
               */}
              {/*
               * NO BADGE FOR `neutral`, and the message takes the space
               * instead. A notice with no state has no outcome to signal, and
               * a 40px column of nothing at the leading edge would be a badge
               * that failed to load rather than a deliberate absence.
               */}
              {tone === 'neutral' ? null : (
                <span className={cx(BADGE, TONE_SOLID[tone])}>
                  <ToneGlyph tone={tone} isFilled className="bb:w-5 bb:h-5" />
                </span>
              )}

              {/*
               * `ToastContent` is the element the base makes `role="alert"`, so
               * everything announced has to be inside it — and the action must
               * NOT be, or the announcement would read the button's label as
               * part of the message.
               */}
              <AriaToastContent
                className={tone === 'neutral' ? MESSAGE_ALONE : MESSAGE}
              >
                <Text slot="title" className="bb:[overflow-wrap:break-word]">
                  {message.title}
                </Text>
              </AriaToastContent>

              {message.action === undefined ? null : (
                <Button
                  variant="link"
                  size="sm"
                  onPress={() => {
                    /*
                     * Close first, then act. A notice whose action has been
                     * taken is describing something that is no longer true, and
                     * leaving it up invites a second press on an undo that has
                     * already happened.
                     */
                    queue.close(toast.key);
                    message.action?.onPress();
                  }}
                >
                  {message.action.label}
                </Button>
              )}

              {/*
               * The close cross, named from OUR dictionary rather than the
               * base's.
               *
               * The base supplies a localised "Close" of its own and this
               * passes over it deliberately: the word is already in this
               * library's dictionary, a dialog's cross uses it, and a consumer
               * who translates or reworded it there must not find a toast still
               * saying something else.
               */}
              {/*
               * The cross and its ring are ONE stacking context, so the ring
               * is positioned against the button rather than against the card.
               * A ring drawn on the card would have to know where the button
               * ended up, which is a number that changes with the density and
               * with the size of the text beside it.
               */}
              <span className={cx(CLOSE_CELL, TONE_SOLID[tone])}>
                <Button
                  slot="close"
                  variant="ghost"
                  size="sm"
                  aria-label={closeLabel}
                  /*
                   * SQUARE, because the ring around it is a CIRCLE. A `sm`
                   * button is sized by its contents plus its inline padding,
                   * so its box is wider than it is tall — and a round viewBox
                   * stretched into it comes out an ellipse, clipped where it
                   * runs past the short axis. Measured on the first
                   * photograph: an arc in the top corner rather than a ring.
                   *
                   * `aspect-square` against the height it already has, with
                   * the inline padding dropped so the glyph centres. The same
                   * rule a field's edge button follows, for the same reason.
                   */
                  /*
                   * SMALLER, and square because the ring around it is a
                   * circle. It was the `sm` control height — 36px of button
                   * for a 16px cross, which in a cell of its own read as a
                   * target twice the size of the thing in it. The cross keeps
                   * the hit area the cell gives it: the whole column is
                   * pressable, so shrinking the button shrinks what is drawn
                   * and not what can be hit.
                   */
                  className="bb:h-7 bb:w-7 bb:rounded-full bb:px-0"
                >
                  {/*
                   * A size of its own rather than the mark token every field's
                   * clear button uses. That token shrinks with the density,
                   * which is right for a cross INSIDE a control whose height
                   * shrinks with it — and wrong here, where the cross sits in a
                   * cell the message's own padding sizes. Measured at compact:
                   * a 12px cross in a 28px button, which read as a speck with
                   * room around it.
                   */}
                  <CrossGlyph className="bb:h-4 bb:w-4" />
                </Button>

                {/*
                 * The countdown, and absent entirely when there is nothing to
                 * count — a `danger` notice has no timeout, and a ring that
                 * never moved would say it was about to leave.
                 */}
                {toast.timeout === undefined ? null : (
                  <svg
                    className={cx(COUNTDOWN, 'bb:h-7 bb:w-7')}
                    viewBox="0 0 36 36"
                    fill="none"
                    aria-hidden="true"
                    /*
                     * A CUSTOM PROPERTY IN A STYLE OBJECT NEEDS A CAST, and it
                     * is worth one here rather than the alternative.
                     *
                     * React's `CSSProperties` has no index signature, so
                     * `--bb-toast-timeout` is not assignable. The other way
                     * round is a Tailwind arbitrary-property class per value —
                     * which is what `Drawer` does for its thickness — and it
                     * would put 6000 and 10000 in class strings beside the
                     * same numbers in `timing.ts`. Two copies of a number that
                     * must agree is worse than one cast: the duration a person
                     * SEES and the timer that fires have to come from the same
                     * place.
                     */
                    style={
                      {
                        '--bb-toast-timeout': `${toast.timeout}ms`
                      } as React.CSSProperties
                    }
                  >
                    {/*
                     * THE TRACK, and it is not decoration.
                     *
                     * A ring drawn only where time has passed is invisible at
                     * the moment it matters most — the first second, when
                     * somebody is deciding whether to reach for the cross. It
                     * is also invisible in every BASELINE, because a
                     * screenshot disables animations and freezes them at the
                     * start: the picture would show an empty box and go on
                     * showing one after the countdown broke.
                     *
                     * `currentColor` at low opacity rather than a token of its
                     * own: it is the same tone, quieter, and a fifth map of
                     * four pale values would be four more chances to pair a
                     * ring with a stripe from a different family.
                     */}
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="bb:opacity-20"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
            </AriaToast>
          );
        }}
      </AriaToastRegion>
    );
  }
);
