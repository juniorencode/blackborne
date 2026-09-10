import { forwardRef, useId } from 'react';
import {
  Label as AriaLabel,
  Slider as AriaSlider,
  type SliderProps as AriaSliderProps,
  SliderFill,
  SliderOutput,
  SliderThumb,
  SliderTrack
} from 'react-aria-components';
import { FieldMessages, describedBy } from '../../internal/Field';
import { cx } from '../../internal/cx';

/*
 * THE ROW ABOVE THE RAIL, AND IT IS `Progress`'S ROW.
 *
 * A slider is a track with a value on it and a bar is a track with a value on
 * it, so the two are laid out the same way and the vocabulary is the same:
 * `label` at the start, the number at the trailing end, `isLabelHidden` and
 * `isValueHidden` to drop either. Doc 09 §8's argument, applied to layout
 * rather than to behaviour — one arrangement is easier to recognise than two
 * near-identical ones.
 */
const HEADER = cx(
  'bb-slider-header',
  'bb:box-border bb:flex bb:items-baseline bb:justify-between',
  'bb:gap-(--bb-space-3)'
);

/*
 * THE GAP GOES WHEN THERE IS NOTHING ABOVE THE RAIL, and `Progress` found out
 * why it has to be done this way: `empty:hidden` cannot hide a row whose child
 * is still there, and the label is ALWAYS there — see below.
 */
const NO_HEADER = cx('bb:gap-0');

/*
 * AND IT DOES NOT DIM WHEN THE SLIDER IS OFF, which is two arguments landing
 * on the same answer.
 *
 * `Field`'s label does not dim either — no field in the library does — so a
 * slider that did would be the one control whose name fades, which is doc 09
 * §8's cost for nothing. And axe fails it: a `<label>` is not a disabled
 * element, so the contrast rule applies to it in full and `text-disabled` on
 * the surface is a serious violation. It was written that way first and the
 * accessibility suite is what caught it.
 *
 * The state is said by the rail, the handle and `disabled` on the control.
 */
const LABEL = cx('bb-slider-label', 'bb:text-md bb:font-strong bb:text-text');

/*
 * `ms-auto` AND NOT ONLY `justify-between`, which the first baseline also
 * found. A hidden label is `sr-only`, so it is out of flow — which leaves the
 * row with one item, and `justify-between` puts a single item at the START.
 * Measured: the number sat at x = 0 on the label-hidden slider and at x = 305
 * on every other one, so where it lived depended on a prop that says nothing
 * about it.
 *
 * `Progress` has the same row and the same hole, and no story of its own hides
 * a label while showing a number — so it was fixed there too rather than left
 * for whoever writes that story.
 */
const VALUE = cx(
  'bb-slider-value',
  'bb:ms-auto bb:flex-none bb:tabular-nums bb:text-text-muted'
);

/*
 * THE TARGET, WHICH IS THE WHOLE TRACK.
 *
 * The base moves the nearest thumb when the track is pressed anywhere along
 * it, so this element — not the thumb — is what a pointer aims at, and it is
 * what has to clear the minimum hit area at every density (doc 06 §3, and
 * doc 03: "with transparent padding if necessary, a control may look shorter
 * than its active zone measures"). `min-h-hit` is 28px and 24px at compact,
 * around a rail of 8px.
 *
 * `relative`, because the thumb is positioned against it: the base gives the
 * thumb `position: absolute` and a percentage, and its containing block is
 * this.
 */
const TRACK = cx(
  'bb-slider-track',
  'bb:box-border bb:relative bb:flex bb:min-h-hit bb:w-full bb:items-center',
  'bb:cursor-pointer bb:data-disabled:cursor-not-allowed'
);

/*
 * THE RAIL, WHICH IS `Progress`'S TRACK DOWN TO THE TOKEN.
 *
 * `surface-sunken` is a well the fill sits in, `rounded-full` on both so a
 * value near the minimum is a dot rather than a sliver with square corners,
 * and `overflow-hidden` so the fill's corners are clipped to the rail's.
 *
 * It is a separate element from the target above it because the base's fill
 * takes `height: 100%` of its containing block — measured in the base's own
 * source — so a fill placed directly in a 28px target would be 28px tall.
 */
const RAIL = cx(
  'bb-slider-rail',
  'bb:box-border bb:relative bb:h-2 bb:w-full bb:overflow-hidden',
  'bb:rounded-full bb:bg-surface-sunken'
);

/*
 * The fill. Its offset and width come from the base as percentages, so there
 * is no inline style of ours here — which is worth saying because `Progress`
 * has the only one in the library and this looked like the second.
 *
 * NO TRANSITION, and that is the difference from a progress bar: a bar is told
 * about a value that changed somewhere else, and this one is being dragged.
 * Easing it would put the fill behind the pointer.
 */
const FILL = cx(
  'bb-slider-fill',
  'bb:box-border bb:h-full bb:rounded-full bb:bg-accent',
  /*
   * AND `text-disabled` WHEN IT IS OFF, which the first baseline is what
   * found. It was `surface-disabled`, and measured against the rail that is
   * **1.08:1 in light and 1.00:1 in dark** — the same colour, exactly — so a
   * disabled slider showed no value at all. A control that must not be changed
   * still has to say what it holds; the calendar shipped the opposite claim
   * and had to correct it.
   *
   * `--bb-text-disabled` reads 2.90:1 and 3.43:1 against the rail, which is
   * the most muted token that still shows the value. It is chosen for its NAME
   * rather than for a number: doc 03 §5 rule 2's 3:1 floor is for a graphical
   * element that carries information and WCAG exempts an inactive control from
   * it, so the alternative that clears the floor comfortably — `text-muted` at
   * 5.22:1 — would draw a disabled fill with MORE contrast than the accent has
   * when it is live.
   */
  'bb:data-disabled:bg-text-disabled'
);

/*
 * THE THUMB, in two parts: a box that clears the hit area and a circle that is
 * smaller than it.
 *
 * `bb:group` on the outer one because the base puts every state attribute
 * there — `data-dragging`, `data-focused`, `data-hovered`, `data-disabled` —
 * and the thing that has to paint them is the circle inside. The same
 * arrangement `SplitButton`'s chevron uses, for the same reason.
 *
 * `top-1/2` is ours and it is required: the base's own style sets `left` and
 * `transform: translate(-50%, -50%)` and no vertical position at all, so
 * without this the transform pulls the thumb half its height ABOVE the rail.
 * The base's documented CSS does the same thing, which is how it was found.
 */
const THUMB = cx(
  'bb-slider-thumb',
  'bb:group bb:box-border bb:top-1/2 bb:flex bb:min-h-hit bb:min-w-hit',
  'bb:items-center bb:justify-center bb:outline-hidden',
  'bb:cursor-grab bb:data-dragging:cursor-grabbing',
  'bb:data-disabled:cursor-not-allowed'
);

const KNOB = cx(
  'bb-slider-knob',
  /*
   * `h-box w-box` and NOT `size-box`, which compiles to nothing. Tailwind
   * resolves `size-*` from its own `--size-*` namespace and this theme
   * declares `--height-box` and `--width-box`, so the shorthand produced no
   * rule at all and the circle collapsed to its border. The same trap
   * `--min-width-hit` is in the theme for, checked the same way: by grepping
   * the compiled stylesheet rather than by reading the class.
   */
  'bb:box-border bb:h-box bb:w-box bb:rounded-full bb:border bb:border-solid',
  'bb:border-accent bb:bg-surface',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  /*
   * The library's one ring, from the token, and on `data-focused` rather than
   * `data-focus-visible` — every other control in the library shows its ring
   * on click too, and doc 09 §8 is blunt about what one exception costs.
   */
  'bb:group-data-focused:border-focus-ring',
  'bb:group-data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:group-data-hovered:bg-surface-hover',
  /*
   * Dragging is its own state, and it is the one interaction feedback a slider
   * must have: doc 09 §3 asks for a visible response, and the fill moving is
   * the value's response rather than the handle's.
   */
  'bb:group-data-dragging:bg-surface-active',
  'bb:group-data-disabled:border-border bb:group-data-disabled:bg-surface-disabled'
);

export interface SliderProps extends Pick<
  AriaSliderProps<number>,
  'minValue' | 'maxValue' | 'step' | 'isDisabled' | 'formatOptions'
> {
  /**
   * What the value is. Always present, and visible unless hidden — the same
   * shape `Progress` has, because the two are the same object read two ways.
   */
  label: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /**
   * Persistent help text, under the rail.
   *
   * Wired by hand, which is the exception `internal/Field/FieldMessages`
   * documents: a base field container renders the description AND references
   * it from the control, and the base's slider publishes no such context at
   * all — measured, it publishes the state, the track, the output and the
   * label and nothing else. So one attribute is filled in here.
   */
  description?: React.ReactNode;
  /** The value. Controlled. */
  value?: number;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: number;
  /** Called as the value moves, which is on every step of a drag. */
  onChange?: (value: number) => void;
  /**
   * Called once, when the drag or the key press ENDS.
   *
   * This is the one to use for anything that costs something. A slider filtering
   * a listing fires `onChange` on every step of a drag, and a request per step
   * is doc 09 §7's problem arriving through a control rather than through a
   * button.
   */
  onChangeEnd?: (value: number) => void;
  /** Hide the number at the trailing end of the label's row. */
  isValueHidden?: boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/**
 * One value on a range, chosen by dragging or with the arrow keys.
 *
 * ```tsx
 * <Slider
 *   label="Opacity"
 *   value={opacity}
 *   onChangeEnd={setOpacity}
 *   formatOptions={{ style: 'percent' }}
 *   maxValue={1}
 *   step={0.01}
 * />
 * ```
 *
 * ## When this and when a `NumberField`
 *
 * **A slider is for a value where the approximate is the point** — a
 * threshold, a weight, an opacity, how many results to show per row. It shows
 * the whole range at once, which is what makes it worth the width: somebody
 * can see that they are near the top of it without reading a number.
 *
 * Where an exact figure matters, it is a `NumberField`. A slider cannot be
 * typed into, its precision is a step chosen by whoever configured it, and on
 * a narrow container every pixel is worth more of the range. A quantity, a
 * price and a count are number fields.
 *
 * ## One value, and a range would be a union
 *
 * This holds one number. The base's slider takes an array and draws a thumb
 * per value, so a two-ended range is reachable — and it is not here, because
 * nothing needs it today and a shape added on speculation is what doc 01 P8 is
 * about. When something does, it arrives the way `ComboBox` holds several
 * values: a discriminated union rather than a flag, so `value: [number,
 * number]` and `value: number` cannot be confused for each other. The catalog
 * has that written down as a row rather than left to memory.
 *
 * ## It has no invalid state
 *
 * Every other field in the library takes `errorMessage`, and this one does not.
 * The base's slider has no validation and cannot: a value is clamped to the
 * range and snapped to the step, so there is no way to hold one that is
 * wrong. A rule about which values are acceptable is a rule about the RANGE,
 * and `minValue` and `maxValue` are where it goes.
 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(
  {
    label,
    isLabelHidden = false,
    description,
    isValueHidden = false,
    onChangeEnd,
    className,
    ...ariaProps
  },
  ref
) {
  /*
   * One id, one derived from it. The error half is unused here — see the note
   * on the absent invalid state — and `describedBy` still takes it, because
   * one shared helper that omits the attribute when there is nothing to point
   * at is better than a second way of spelling the same thing.
   */
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  const hasDescription = description !== undefined && description !== null;
  const describedByValue = describedBy({
    hasDescription,
    hasError: false,
    descriptionId,
    errorId
  });

  return (
    <AriaSlider
      ref={ref}
      className={cx(
        'bb-slider',
        'bb:group bb:box-border bb:flex bb:w-full bb:flex-col',
        'bb:gap-(--bb-field-gap-inner) bb:font-sans bb:text-md bb:text-text',
        className
      )}
      {...ariaProps}
      {...(onChangeEnd === undefined ? {} : { onChangeEnd })}
    >
      <div className={cx(HEADER, isLabelHidden && isValueHidden && NO_HEADER)}>
        {/*
         * THE BASE'S `Label`, ALWAYS RENDERED, and hidden with a class rather
         * than left out. `Progress` shipped the other way round in its first
         * draft: the base publishes a label context that its own `Label`
         * consumes to take an id, and the slider's group carries
         * `aria-labelledby` pointing at THAT id. A plain span is wired to
         * nothing, so a hidden label leaves the control nameless — which only
         * a query BY NAME catches, since `getByRole` passes either way.
         */}
        <AriaLabel className={cx(LABEL, isLabelHidden && 'bb:sr-only')}>
          {label}
        </AriaLabel>
        {isValueHidden ? null : <SliderOutput className={VALUE} />}
      </div>

      <SliderTrack className={TRACK}>
        <div className={RAIL}>
          <SliderFill className={FILL} />
        </div>
        <SliderThumb
          className={THUMB}
          {...(describedByValue === undefined
            ? {}
            : { 'aria-describedby': describedByValue })}
        >
          <span className={KNOB} />
        </SliderThumb>
      </SliderTrack>

      <FieldMessages
        {...(hasDescription ? { description } : {})}
        descriptionId={descriptionId}
        errorId={errorId}
      />
    </AriaSlider>
  );
});
