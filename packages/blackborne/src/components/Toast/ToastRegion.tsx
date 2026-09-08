import { forwardRef } from 'react';
import {
  Text,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastRegion as AriaToastRegion
} from 'react-aria-components';
import { Button } from '../Button';
import { CrossGlyph } from '../../internal/CrossGlyph';
import { TONE_SURFACE, ToneGlyph } from '../../internal/ToneGlyph';
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
  'bb:box-border bb:fixed bb:bottom-0 bb:end-0',
  'bb:z-(--bb-layer-toast)',
  'bb:flex bb:flex-col bb:justify-end bb:gap-(--bb-space-3)',
  'bb:p-(--bb-space-4)',
  'bb:max-h-full bb:max-w-narrow',
  'bb:pointer-events-none',
  'bb:font-sans bb:text-md bb:leading-normal',
  'bb:outline-none'
);

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
  'bb:flex bb:items-start bb:gap-(--bb-space-3)',
  /*
   * THE TONE'S SURFACE, not the raised one every other layer uses, and that is
   * the one place this component deliberately looks like `Alert` rather than
   * like a panel.
   *
   * It was built on `bg-surface-raised` first, and the first three-tone
   * screenshot settled it: a failure looked exactly like a success apart from a
   * 16px glyph. Doc 09 §4 is about communicating an outcome, and somebody
   * scanning a corner of the screen has to see WHICH outcome without reading —
   * doc 06 §3 asks for the silhouette as well, not instead.
   *
   * A notice is an alert that floats, so it takes the same four surfaces from
   * the same shared map. What it adds is the elevation: a border and a shadow,
   * because unlike an alert it is not in the page.
   */
  'bb:border bb:border-border bb:rounded-lg bb:shadow-lg',
  'bb:p-(--bb-space-4)',
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
const COUNTDOWN = cx(
  'bb-toast-countdown',
  'bb:box-border bb:absolute bb:bottom-0 bb:start-0',
  'bb:h-px bb:bg-accent'
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
  function ToastRegion({ queue }, ref) {
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
      <AriaToastRegion ref={ref} queue={base} className={REGION}>
        {({ toast }) => {
          const message: ToastMessage = toast.content;
          const tone = message.tone ?? 'info';

          return (
            <AriaToast toast={toast} className={cx(TOAST, TONE_SURFACE[tone])}>
              {/*
               * The glyph, drawn rather than received, for the reason doc 06 §3
               * gives and `Alert` records: in greyscale the four tones are four
               * near-identical surfaces, so the silhouette is what carries the
               * tone.
               */}
              <ToneGlyph tone={tone} />

              {/*
               * `ToastContent` is the element the base makes `role="alert"`, so
               * everything announced has to be inside it — and the action must
               * NOT be, or the announcement would read the button's label as
               * part of the message.
               */}
              <AriaToastContent className="bb:min-w-0 bb:flex-1">
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
              <Button
                slot="close"
                variant="ghost"
                size="sm"
                aria-label={closeLabel}
              >
                <CrossGlyph />
              </Button>

              {/*
               * The countdown, last so it paints over the padding, and absent
               * entirely when there is nothing to count — a `danger` notice has
               * no timeout, and a bar that never moved would say it was about
               * to leave.
               */}
              {toast.timeout === undefined ? null : (
                <div
                  className={COUNTDOWN}
                  /*
                   * A CUSTOM PROPERTY IN A STYLE OBJECT NEEDS A CAST, and it
                   * is worth one here rather than the alternative.
                   *
                   * React's `CSSProperties` has no index signature, so
                   * `--bb-toast-timeout` is not assignable. The other way
                   * round is a Tailwind arbitrary-property class per value —
                   * which is what `Drawer` does for its thickness — and it
                   * would put 6000 and 10000 in class strings beside the same
                   * numbers in `timing.ts`. Two copies of a number that must
                   * agree is worse than one cast: the duration a person SEES
                   * and the timer that fires have to come from the same place.
                   */
                  style={
                    {
                      '--bb-toast-timeout': `${toast.timeout}ms`
                    } as React.CSSProperties
                  }
                />
              )}
            </AriaToast>
          );
        }}
      </AriaToastRegion>
    );
  }
);
