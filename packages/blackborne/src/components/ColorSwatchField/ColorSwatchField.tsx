import { forwardRef, useId, useMemo } from 'react';
import {
  ColorSwatch as AriaColorSwatch,
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
  type Color
} from 'react-aria-components';
import { FieldMessages, describedBy } from '../../internal/Field';
import { CHECKERBOARD } from '../../internal/checkerboard';
import { cx } from '../../internal/cx';
import { NO_COLOUR, parseSwatch, sameColour } from '../../internal/isoColor';
import { useDevWarning } from '../../internal/useDevWarning';

const ROOT = cx(
  'bb-color-swatch-field',
  'bb:box-border bb:flex bb:w-full bb:flex-col',
  'bb:gap-(--bb-field-gap-inner) bb:font-sans bb:text-md bb:text-text'
);

const LABEL = cx(
  'bb-color-swatch-field-label',
  'bb:w-fit bb:text-md bb:font-strong bb:text-text'
);

/*
 * A WRAPPING ROW RATHER THAN A GRID WITH A COLUMN COUNT.
 *
 * The base offers `layout="grid" | "stack"` and both are about the KEYBOARD —
 * whether the arrows move in two dimensions or one. What the swatches look
 * like is ours, and a palette has no natural number of columns: it is however
 * many fit, which is a wrapping flex row and no threshold anywhere (doc 04,
 * N0). A declared column count would be a number in a component that a
 * narrower container makes wrong.
 */
const PALETTE = cx(
  'bb-color-swatch-field-palette',
  'bb:box-border bb:flex bb:flex-wrap bb:gap-(--bb-space-2)',
  'bb:outline-hidden'
);

/*
 * A SWATCH IS ITS OWN TARGET, so it is the minimum hit area and not a
 * decoration somebody has to aim at: `h-hit` with `aspect-square` is 28px and
 * 24px at compact, square at both. `w-hit` does not exist — the theme has no
 * `--width-*` for it, which is the trap `Avatar` paid for and the theme's own
 * comment records for `min-w-hit`.
 *
 * NOTHING IS DRAWN INSIDE A SWATCH, EVER. A tick on top would sit on a colour
 * the library has never seen: measured on a calendar, a mark keyed to a fill it
 * does not control is white on pale at 1.12:1 half the time. So both marks a
 * swatch can carry are outside it.
 *
 * AND THE TWO MARKS ARE TWO MECHANISMS, which is doc 06 §3.1 read properly
 * rather than after the fact. That section gives a BOX a border in the ring
 * colour plus a halo, and reserves the offset outline for a run of text — so
 * focus here is the border and the halo, exactly as on a `Button`.
 *
 * That leaves the outline free for CHOSEN, and it has to be free: the first
 * version of this file drew both as an outline and took the focus colour from
 * `--bb-focus-ring`, which is the accent — the same colour — so a focused
 * swatch was indistinguishable from a chosen one. Measured, and the check says
 * so.
 *
 * `outline-text` for the chosen ring, which is the calendar's rule arriving on
 * a third component: a ring is the text colour of whatever it SITS on, and
 * this one sits on the field's surface rather than on the swatch. The two
 * compose — a swatch that is focused and chosen shows both, which is better
 * than either winning.
 */
const SWATCH = cx(
  'bb-color-swatch',
  /*
   * AND A CHECKERBOARD BEHIND IT, because a declared colour may carry an
   * alpha: `#3e63dd80` is a legitimate entry in a palette, and on the surface
   * alone it reads as a paler blue rather than as a transparent one. Found
   * while building the picker, where the same problem is unavoidable rather
   * than occasional — so the pattern lives in `internal/checkerboard` and both
   * read it.
   *
   * On this element rather than on the colour inside it: the base writes the
   * colour inline, and a background image on the same element paints over its
   * colour rather than behind it.
   */
  CHECKERBOARD,
  'bb:box-border bb:flex bb:h-hit bb:aspect-square bb:flex-none',
  'bb:cursor-pointer bb:overflow-hidden bb:rounded-md',
  'bb:border bb:border-solid bb:border-border',
  /*
   * NO `outline-hidden` HERE, and the first baseline is what found why. That
   * utility sets `outline-style: none`, so it wins over the `outline-2` below
   * and the chosen ring simply never drew — the picture showed three identical
   * swatches on the row labelled "Chosen".
   *
   * It is not needed either: the transparent outline declared below is a real
   * outline with a width, a style and a colour, and an author rule beats the
   * browser's own `:focus-visible` ring. So one declaration suppresses the
   * default AND carries the chosen state, instead of two that cancel.
   */
  'bb:transition-[border-color,box-shadow,outline-color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:outline-2 bb:outline-offset-2 bb:outline-transparent',
  'bb:data-selected:outline-text',
  'bb:data-focus-visible:border-focus-ring',
  'bb:data-focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:opacity-50'
);

/*
 * The colour itself, drawn by the base: `useColorSwatch` writes
 * `background-color` inline from the value, so there is no inline style of
 * ours here and `Progress` keeps its place as the only one in the library.
 *
 * NO BORDER AND NO RADIUS OF ITS OWN. The edge every swatch needs — because
 * white on the light surface has no edge at all, and neither has near-black on
 * the dark one — belongs to the box around it, which is also the element that
 * recolours its border on focus. This one fills that box and is clipped to its
 * shape, so there is one rounded rectangle rather than two nearly-agreeing
 * ones.
 */
const COLOUR = cx(
  'bb-color-swatch-colour',
  'bb:box-border bb:h-full bb:w-full'
);

export interface ColorSwatchFieldProps {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /**
   * The palette, in the order it is shown. Any string `parseColor` reads:
   * `#3e63dd`, `rgb(62, 99, 221)`, `hsl(226, 70%, 55%)`.
   *
   * A PROP RATHER THAN CHILDREN, because a palette is data (decision 0024).
   * It is also what makes the value exact: the answer is one of these strings,
   * so it is reported back as it was written rather than reformatted.
   */
  colors: readonly string[];
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`. The project decides there is an error. */
  errorMessage?: React.ReactNode;
  /** Marks it invalid, which is the project's judgement (doc 07 §1). */
  isInvalid?: boolean;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /** The chosen colour, as one of the strings in `colors`. */
  value?: string | null;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: string;
  /**
   * Called with the chosen colour, **verbatim from `colors`** — the same
   * string, in the same case and the same format.
   *
   * That is decision 0024's exception: a component whose answer is one of its
   * own inputs reports that input rather than a reformatting of it. A full
   * colour picker cannot, because a value dragged out of an area was never one
   * of its inputs, so that one takes a `format`.
   */
  onChange?: (value: string) => void;
  /** Switches the whole palette off. */
  isDisabled?: boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/**
 * A colour chosen from a closed palette.
 *
 * ```tsx
 * <ColorSwatchField
 *   label="Label colour"
 *   colors={['#3e63dd', '#e5484d', '#30a46c', '#f76b15']}
 *   value={colour}
 *   onChange={setColour}
 * />
 * ```
 *
 * ## The cheap half of the pair, and it is cheap for a reason
 *
 * A management application asking for a colour usually means "one of ours" —
 * a label on a task, a colour for a calendar, a status somebody made up. The
 * answer is a set the project already owns, and a set is a palette rather than
 * a two-dimensional area with a hue slider under it.
 *
 * Where a colour genuinely is arbitrary, that is `ColorPicker` and it is a
 * different component (the catalog's §3.3).
 *
 * ## The value is the string you wrote
 *
 * Decision 0024's exception. Because the answer can only be one of `colors`,
 * this component reports that exact string — `#3e63dd` in, `#3e63dd` out, not
 * `rgba(62, 99, 221, 1)` and not `#3E63DD`. It matches the chosen colour back
 * by the form two spellings of one colour agree on, which is also the base's
 * own key for a swatch.
 *
 * ## What the base names, and we do not
 *
 * Every swatch is announced by the platform's own name for the colour —
 * "dark blue", localised — plus a role description of "color swatch", both from
 * `@react-aria/color`'s strings rather than from this library's dictionary
 * (doc 05 §2.3). Naming ten thousand colours in every language is not a job
 * for a component library, and the base has already done it.
 */
export const ColorSwatchField = forwardRef<
  HTMLDivElement,
  ColorSwatchFieldProps
>(function ColorSwatchField(
  {
    label,
    colors,
    description,
    errorMessage,
    isInvalid = false,
    isLabelHidden = false,
    value,
    defaultValue,
    onChange,
    isDisabled = false,
    className
  },
  ref
) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  const hasDescription = description !== undefined && description !== null;
  const hasError =
    isInvalid && errorMessage !== undefined && errorMessage !== null;

  const describedByValue = describedBy({
    hasDescription,
    hasError,
    descriptionId,
    errorId
  });

  /*
   * THE DECLARED STRINGS, PARSED ONCE, and kept beside what they were written
   * as. That pairing is the whole mechanism: the base reports a `Color`, and
   * this is what turns it back into the consumer's own string.
   *
   * A colour the parser refuses is dropped rather than rendered as black —
   * `parseSwatch` warns, and a palette that silently gained a wrong swatch
   * would be worse than one missing the entry somebody mistyped.
   */
  const palette = useMemo(
    () =>
      colors
        .map(one => ({ declared: one, colour: parseSwatch(one) }))
        .filter(
          (one): one is { declared: string; colour: Color } =>
            one.colour !== undefined
        ),
    [colors]
  );

  const chosen = parseSwatch(value);
  const initial = parseSwatch(defaultValue);
  const held = chosen ?? initial;

  useDevWarning(
    held !== undefined && !palette.some(one => sameColour(one.colour, held)),
    'ColorSwatchField: the value is not one of the colours in `colors`, so ' +
      'no swatch is shown as chosen. A closed palette can only hold one of ' +
      'its own entries (decision 0024).'
  );

  return (
    <div ref={ref} className={cx(ROOT, className)}>
      {/*
       * OUR OWN LABEL, WITH AN ID, because the base's picker takes a name and
       * publishes no label context: `ColorSwatchPickerProps` extends
       * `AriaLabelingProps` and nothing else, so there is no `Label` to render
       * inside it and no id for one to claim. `Slider` is in the same position
       * and does the same thing — the third component to fill in an
       * association the base leaves to the caller.
       */}
      <span id={labelId} className={cx(LABEL, isLabelHidden && 'bb:sr-only')}>
        {label}
      </span>

      <AriaColorSwatchPicker
        className={PALETTE}
        aria-labelledby={labelId}
        /*
         * AND NO `aria-invalid`, WHICH WAS TRIED AND MEASURED.
         *
         * The base's picker has no notion of validity, so the intention was to
         * fill the attribute in by hand — the one thing
         * `internal/Field/FieldMessages` permits with a reason. It does not
         * arrive: the picker forwards its props through
         * `filterDOMProps(props, { labelable: true })`, read in its source,
         * and that filter passes exactly four attributes — `aria-label`,
         * `aria-labelledby`, `aria-describedby` and `aria-details`. Anything
         * else is dropped, silently and deliberately.
         *
         * So the error reaches a reader the way the description does, through
         * `aria-describedby`, which the filter does pass. That is the honest
         * arrangement rather than a defeat: doc 06 §3 asks that a state not
         * depend on colour alone, and the message is TEXT. Worth knowing
         * before building anything else on one of the base's collections.
         */
        {...(describedByValue === undefined
          ? {}
          : { 'aria-describedby': describedByValue })}
        /*
         * A CONTROLLED FIELD HOLDING NOTHING still has to pass a colour: the
         * base's `value` is `string | Color` with no null in it, and leaving
         * it out makes the picker uncontrolled. `NO_COLOUR` is transparent,
         * which is what the base uses for the same purpose — and matching no
         * swatch is exactly the intended result.
         */
        {...(value === undefined ? {} : { value: chosen ?? NO_COLOUR })}
        {...(initial === undefined ? {} : { defaultValue: initial })}
        {...(onChange === undefined
          ? {}
          : {
              onChange: (next: Color) => {
                /*
                 * BACK TO THE DECLARED STRING. The base hands over a `Color`,
                 * and reporting `toString()` on it would turn `#3e63dd` into
                 * `rgba(62, 99, 221, 1)` — measured, and decision 0024's whole
                 * table. The match cannot fail in practice, because the value
                 * came from a swatch this list rendered.
                 */
                const found = palette.find(one => sameColour(one.colour, next));
                onChange(found?.declared ?? next.toString('hexa'));
              }
            })}
      >
        {palette.map(one => (
          <AriaColorSwatchPickerItem
            key={one.declared}
            color={one.colour}
            className={SWATCH}
            isDisabled={isDisabled}
          >
            <AriaColorSwatch className={COLOUR} />
          </AriaColorSwatchPickerItem>
        ))}
      </AriaColorSwatchPicker>

      <FieldMessages
        {...(hasDescription ? { description } : {})}
        {...(errorMessage === undefined ? {} : { errorMessage })}
        isInvalid={isInvalid}
        descriptionId={descriptionId}
        errorId={errorId}
      />
    </div>
  );
});
