import { forwardRef } from 'react';
import { ToneGlyph, type Tone } from '../../internal/ToneGlyph';
import { cx } from '../../internal/cx';

/*
 * The same four the rest of the library uses, re-exported under this
 * component's own name because it is public API and renaming a type is a
 * breaking change (doc 02 §10). The glyphs that carry them are shared —
 * see internal/ToneGlyph for why they are not copied per component.
 */
export type AlertTone = Tone;

/**
 * The soft background and the text colour that goes on it, always together.
 * There is no standalone "text on info" token — there is a pair, and the two
 * halves are never taken from different families (doc 03 §4.0).
 *
 * The glyph used to live here too, and moved to internal/ToneGlyph when a
 * second component needed three of the four. What is left is the only thing
 * that is an Alert's own: which surface it paints.
 */
type ToneSurface = string;

/*
 * Which surface each tone paints. The GLYPH that goes with it is shared —
 * internal/ToneGlyph, which carries the reasoning for why the library draws
 * one at all: doc 06 §3 forbids colour as the only channel, and these four
 * soft backgrounds are four near-identical greys once the hue is gone.
 *
 * Only the surface is an Alert's own, and the pairing rule is why it is one
 * entry rather than two: a background and the text colour that goes on it are
 * taken together, never from different families (doc 03 §4.0).
 */
const TONE: Record<AlertTone, ToneSurface> = {
  info: 'bb:bg-info-subtle bb:text-info-subtle-on',
  success: 'bb:bg-success-subtle bb:text-success-subtle-on',
  warning: 'bb:bg-warning-subtle bb:text-warning-subtle-on',
  danger: 'bb:bg-danger-subtle bb:text-danger-subtle-on'
} satisfies Record<AlertTone, ToneSurface>;

/*
 * Shared by every tone. Notes on the parts that are not obvious:
 *
 * - `p-(--bb-space-4)` and the gaps read density tokens, so compact trims the
 *   air around the message without this file knowing density exists.
 * - The radius matches a control rather than a card. An Alert usually sits
 *   directly above the form it is about, and two neighbouring corners at
 *   different radii is what doc 03 §4.3 is about.
 * - No border. The tint is the boundary, and the only border colour available
 *   inside these families is the solid step, which on a step-3 ground draws a
 *   frame heavy enough to compete with the message.
 * - Nothing sets a width: the Alert fills whatever it is put in, and doc 03
 *   §5 forbids sizing anything to fit one particular sentence.
 */
const BASE = cx(
  // box-border because the package ships no reset: without it the padding
  // would be added to any width a consumer sets through className.
  'bb:box-border',
  'bb:flex bb:items-start bb:gap-x-(--bb-space-3)',
  'bb:rounded-md bb:p-(--bb-space-4)',
  'bb:font-sans bb:text-md bb:leading-normal'
);

export interface AlertProps {
  /**
   * Which kind of message this is. A closed set resolved through one typed
   * map — never a boolean per tone, which would allow a success that is also
   * a danger (doc 02 §3).
   */
  tone?: AlertTone;
  /**
   * An optional short line above the message.
   *
   * Rendered as emphasised text and **not** as a heading: heading hierarchy
   * belongs to the page, not to a component that cannot know what level it
   * landed at (doc 06 §2).
   */
  title?: React.ReactNode;
  /** The message. What happened and what to do — no codes, no apologies (doc 09 §4). */
  children?: React.ReactNode;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A message shown in the place the thing happened.
 *
 * Doc 09 §4 is the reason this exists: errors are shown where the problem
 * occurred, and a global notice is a complement, never the only channel. A
 * field-level error covers one field; this covers the section or the page —
 * the save that failed, the import that finished with warnings, the record
 * somebody else is editing.
 *
 * It is deliberately the first of the two message channels to be built.
 * `Toast` is deferred on the base's API alone — its toast exports still carry
 * an `UNSTABLE_` prefix (doc 08 §7) — so until this existed the library had no
 * way to state anything above field level. This one needs neither a portal nor
 * any of the layer infrastructure that block `Toast`.
 *
 * ## `role="status"`, and why it is not `role="alert"`
 *
 * Decided, and written down because it is the kind of thing that gets reversed
 * by someone who reads "alert" and assumes assertive.
 *
 * This message sits in the reading order at the place the problem occurred, in
 * front of the person already. `role="alert"` interrupts whatever a screen
 * reader is saying to announce something the reader is about to reach anyway,
 * which is exactly the noise doc 09 §1 and §4 warn about — and noise is what
 * teaches people to stop listening. `role="status"` announces politely, at the
 * next pause, and is announced when the Alert is inserted after load.
 *
 * Assertive interruption is a toast's job: a toast is somewhere else on the
 * screen, so nothing else will bring it to your attention. That component does
 * not exist yet, and when it does, that is where the decision belongs.
 *
 * ## What it deliberately does not have
 *
 * **No `onDismiss`** and **no `icon` prop.** Neither has a place that needs it
 * today, which is the whole of the test in P5, and both are far easier to open
 * later than to remove once consumers depend on them. A dismissible Alert is
 * also a different thing than it looks: it needs a decision about where focus
 * goes when the message it was on disappears.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = 'info', title, children, className, style },
  ref
) {
  const surface = TONE[tone];

  return (
    <div
      ref={ref}
      /*
       * Not spread from a rest object, because unlike every other component
       * here there is no headless base underneath to forward to (doc 02 §2 is
       * about that forwarding). The surface is the five props above and
       * nothing else — opening one later is easy, closing one is not
       * (doc 02 §10). `role` in particular is not the consumer's to change:
       * see the note above.
       */
      role="status"
      className={cx(BASE, surface, className)}
      {...(style === undefined ? {} : { style })}
    >
      <ToneGlyph tone={tone} />

      <div
        className={cx(
          'bb:flex bb:min-w-0 bb:flex-col bb:gap-(--bb-space-2)',
          // min-w-0 above and this together are what keep a long unbroken
          // token — a URL, a reference code — inside a 320px container instead
          // of bursting the box in silence.
          'bb:[overflow-wrap:break-word]'
        )}
      >
        {title === undefined || title === null ? null : (
          /*
           * Weight, not a second colour. Doc 03 §4.7: the levels the three
           * text colours do not supply come from weight — and a muted grey
           * here would leave the tone's family, which is the one thing the
           * pairing rule exists to prevent.
           */
          <div className="bb:font-strong">{title}</div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
});
