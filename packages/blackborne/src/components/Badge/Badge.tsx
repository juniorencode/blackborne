import { forwardRef, useId } from 'react';
import { Button } from 'react-aria-components';
import { useMessage } from '../../config';
import { CrossGlyph } from '../../internal/CrossGlyph';
import { cx } from '../../internal/cx';

export type BadgeVariant = 'solid' | 'soft';

export type BadgeTone =
  'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

/*
 * Two axes, one map, and it is nested rather than two flat ones on purpose.
 *
 * Variant and tone are orthogonal to whoever uses this — six meanings, two
 * weights — but they are not independent in tokens: solid reads --bb-success,
 * soft reads --bb-success-subtle, and each background carries the text colour
 * that belongs to it. Two flat maps would let a background from one half meet
 * a text colour from the other, which is the one thing doc 03 §4.0 forbids. A
 * cell here IS the pair, so there is no way to write half of one.
 *
 * `satisfies` at both levels is what makes it exhaustive: a tone added to the
 * union and not to BOTH variants is a type error.
 *
 * This is the first component to read the success, warning and info families.
 * They have existed since the token layer was written and nothing had ever
 * resolved them, in either mode — and warning is why the rule of pairs exists
 * at all: amber's solid step is a LIGHT colour, so --bb-warning-on is dark
 * text where the other five pair with light. A component that wrote "white on
 * a state colour" for itself would be unreadable on exactly one of the six.
 */

/*
 * Neutral is composed rather than named, because it is not a state: doc 03 §4
 * lists danger, warning, success and info, and there is no fifth family.
 *
 * The surface/content pair fills that place honestly. --bb-surface-on is by
 * definition the colour that is legible on --bb-surface, and a contrast ratio
 * is symmetric, so the pair holds in both directions: solid neutral is that
 * pair inverted — a near-black chip in light, a near-white one in dark, with
 * no second mapping and no measurement of its own to keep.
 *
 * The "on" halves are read from the token rather than through a utility
 * because only the background halves are exposed as utilities today.
 * `bb:text-text` carries the same value as --bb-surface-sunken-on right now,
 * and that is the trap rather than the shortcut: the day a theme moves one and
 * not the other, the pair is broken and nothing says so.
 */
const FILL: Record<BadgeVariant, Record<BadgeTone, string>> = {
  solid: {
    neutral: 'bb:bg-(color:--bb-surface-on) bb:text-surface',
    accent: 'bb:bg-accent bb:text-accent-on',
    success: 'bb:bg-success bb:text-success-on',
    warning: 'bb:bg-warning bb:text-warning-on',
    danger: 'bb:bg-danger bb:text-danger-on',
    info: 'bb:bg-info bb:text-info-on'
  },
  soft: {
    neutral: 'bb:bg-surface-sunken bb:text-(color:--bb-surface-sunken-on)',
    accent: 'bb:bg-accent-subtle bb:text-accent-subtle-on',
    success: 'bb:bg-success-subtle bb:text-success-subtle-on',
    warning: 'bb:bg-warning-subtle bb:text-warning-subtle-on',
    danger: 'bb:bg-danger-subtle bb:text-danger-subtle-on',
    info: 'bb:bg-info-subtle bb:text-info-subtle-on'
  }
} satisfies Record<BadgeVariant, Record<BadgeTone, string>>;

const BASE = cx(
  // box-border on anything carrying a height, a width or a border: the package
  // ships no reset, so the browser default is content-box and a declared 28px
  // measures 30 (see the package's CLAUDE.md).
  'bb:box-border',
  'bb:inline-flex bb:max-w-full bb:items-center bb:gap-1 bb:align-middle',
  'bb:px-2 bb:py-0.5',
  /*
   * The height is the hit-area token, on EVERY badge and not only the
   * removable ones.
   *
   * The remove button has to clear the minimum target at every density,
   * compact included (doc 06 §3) — 28px normal, 24px compact. There were two
   * ways to give it one: grow the badge when `onRemove` arrives, or keep the
   * chip small and let a transparent target overhang it, which is the trick
   * doc 03 §4.3 allows in general. The second is wrong here specifically:
   * badges wrap in filter rows, so a target that overhangs its chip lands on
   * the chip in the line above.
   *
   * So a badge is as tall as the target it might contain, always. A row that
   * mixes removable and static badges keeps one height, and passing `onRemove`
   * resizes nothing.
   */
  'bb:min-h-hit',
  // radius-sm is the tag step (doc 03 §4.3). Not radius-full: a pill whose
  // label wraps to two lines has ends that stop matching its corners.
  'bb:rounded-sm',
  'bb:font-sans bb:text-xs bb:font-strong bb:leading-tight'
);

const CONTENT = cx(
  'bb:inline-flex bb:min-w-0 bb:items-center bb:gap-1',
  /*
   * The icon slot. An icon arrives as a child and the component decides its
   * size and its colour, so the consumer passes neither (doc 02 §11.2).
   *
   * The size is set on the SVG from CSS, which beats the width and height
   * attributes an icon set writes into its own markup — that is what makes a
   * set defaulting to 24px come out at ours with nobody configuring anything.
   * Colour needs no rule: currentColor is already the text half of the pair
   * above, so one icon is right in all twelve cells.
   *
   * The library's one standard size, not a badge-sized exception (doc 03
   * §4.6d). A second icon size is how five of them start.
   */
  'bb:[&>svg]:size-4 bb:[&>svg]:flex-none'
);

/*
 * The dot, and what it is not.
 *
 * Doc 06 §3 forbids colour as the only channel, and the honest answer is that
 * the dot does not discharge that: in greyscale a success dot and a danger dot
 * are the same grey circle. THE TEXT IS THE CHANNEL — `children` is required
 * for exactly this reason, and doc 02 §11.5 closes the other route by refusing
 * an icon as the only carrier of meaning too.
 *
 * What the dot is for is a column of statuses scanned at speed, where colour
 * is a second reading of a word that is already there. It is emphasis, never
 * the message. A per-tone icon would be a real second channel, and it is not
 * available to a library that distributes no icon set (catalog §7).
 *
 * Its fill is the text half of the pair, so it cannot drift out of the family
 * its badge is in.
 */
const DOT = 'bb:size-1.5 bb:flex-none bb:rounded-full bb:bg-current';

const REMOVE = cx(
  'bb:box-border bb:flex bb:flex-none bb:items-center bb:justify-center',
  /*
   * The target, which is the part of this component that is usually wrong.
   *
   * A 14px cross is a 14px target unless something says otherwise, and doc 06
   * §3 wants the minimum at every density. Both axes take the same token the
   * rest of the library uses, so compact trims the chip and never the target.
   *
   * The inline axis reads the token directly because --height-hit is exposed
   * as a utility and its width twin is not. Writing 28px here instead would be
   * a number that agrees with the token today and drifts from it in silence.
   */
  'bb:min-h-hit bb:min-w-hit',
  /*
   * Negative margins, so the target covers the badge's own padding instead of
   * sitting inside it. The button ends flush with the chip, and the cross then
   * sits 7px from that edge — within a pixel of the padding the label gets on
   * the other side, so nothing looks off centre while the target measures a
   * full 28px. Its end corners take the chip's own radius, because there is no
   * gap between them for the nested-radius rule to subtract (doc 03 §4.3).
   */
  'bb:-my-0.5 bb:-me-2',
  'bb:rounded-e-sm',
  'bb:bg-transparent bb:text-inherit',
  // The transparent border reserves the focus ring's edge at rest, so nothing
  // shifts when it appears. It is the library's single ring (doc 06 §3), and
  // data-focused rather than focus-visible for the reason Button records: one
  // control that confirms focus differently costs the credibility of the rest.
  'bb:border bb:border-solid bb:border-transparent',
  'bb:cursor-pointer bb:outline-hidden',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  /*
   * Hover and pressed are mixed from the text colour rather than taken from
   * surface-hover. A control sitting on a coloured chip that hovers back to
   * grey leaves its own colour family and reads as a different component —
   * the argument Checkbox has already had with itself. currentColor is the
   * pair's text half, so one rule is correct in all twelve cells and no tone
   * needs a token of its own.
   */
  'bb:data-hovered:bg-[color-mix(in_oklab,currentColor_15%,transparent)]',
  'bb:data-pressed:bg-[color-mix(in_oklab,currentColor_28%,transparent)]',
  'bb:data-focused:border-focus-ring bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]'
);

export interface BadgeProps {
  /**
   * The label.
   *
   * Required, and that is doc 06 §3 made structural: a badge whose only
   * difference from the next one is its colour says nothing in greyscale, to a
   * screen reader, or to anyone who cannot separate red from green.
   *
   * An icon may sit beside the label as a child — the slot sizes and colours
   * it, so it carries neither (doc 02 §11). Mark it `aria-hidden`: the label
   * beside it already says what this is, and a second announcement is noise.
   */
  children: React.ReactNode;
  /** How much weight it carries. A closed set, never a boolean per variant (doc 02 §3). */
  variant?: BadgeVariant;
  /** What the status means. Orthogonal to `variant`, and also a closed set. */
  tone?: BadgeTone;
  /** A filled circle before the label. Emphasis on the tone, never the message. */
  dot?: boolean;
  /**
   * Show a button that removes this badge, and call this when it is pressed.
   *
   * The badge removes nothing itself. What it belongs to is the consumer's
   * list, and taking it out of that list is theirs (P2) — which also means the
   * badge does not vanish on its own, so a removal that fails leaves nothing
   * to put back.
   */
  onRemove?: () => void;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A small label that carries a status.
 *
 * It is not a control: it has no press behaviour and no `onPress`. A badge
 * that acts when it is pressed is a button that looks like a badge, and that
 * is the component to reach for instead.
 *
 * There is one size. Density already moves it, and a second size has to name
 * the place that needs it today (P5).
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    children,
    variant = 'soft',
    tone = 'neutral',
    dot = false,
    onRemove,
    className,
    style
  },
  ref
) {
  const removeLabel = useMessage('remove');
  const id = useId();
  const labelId = `${id}-label`;
  const removeId = `${id}-remove`;

  return (
    <span
      ref={ref}
      className={cx(BASE, FILL[variant][tone], className)}
      style={style}
    >
      {dot ? <span className={DOT} aria-hidden="true" /> : null}
      <span id={labelId} className={CONTENT}>
        {children}
      </span>
      {onRemove === undefined ? null : (
        <Button
          id={removeId}
          className={REMOVE}
          /*
           * The name composes: "Remove" from the dictionary, then the badge's
           * own label. In a row of filters where every button announces itself
           * as "Remove" and nothing else, a screen reader user cannot tell
           * which one they are on — the same finding NumberField's steppers
           * recorded.
           *
           * The mechanism is the base's own: react-aria's Tag builds its
           * remove button this way, pointing aria-labelledby at ITSELF plus
           * the tag, so its aria-label supplies the first half. Copied
           * deliberately rather than invented, because a name assembled by
           * hand is a sentence built by concatenation, and doc 05 §2.2 keeps
           * word order in the dictionary rather than in code.
           */
          aria-label={removeLabel}
          aria-labelledby={`${removeId} ${labelId}`}
          onPress={onRemove}
        >
          {/*
           * The library's own cross, shared rather than copied: the marks
           * inside its controls have to be one shape, and this was four
           * copies before a fifth caller forced the extraction. The default
           * size is the mark token a checkbox uses, so the marks inside small
           * controls follow density together (doc 02 §11.4).
           */}
          <CrossGlyph />
        </Button>
      )}
    </span>
  );
});
