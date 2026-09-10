import { forwardRef, useId } from 'react';
import {
  Button as AriaButton,
  ColorArea as AriaColorArea,
  ColorField as AriaColorField,
  ColorPicker as AriaColorPicker,
  ColorSlider as AriaColorSlider,
  ColorSwatch as AriaColorSwatch,
  ColorThumb as AriaColorThumb,
  Dialog as AriaDialog,
  DialogTrigger,
  Input as AriaInput,
  Popover as AriaPopover,
  SliderTrack as AriaSliderTrack,
  type Color
} from 'react-aria-components';
import { useMessage } from '../../config';
import { ControlFrame, FieldMessages, describedBy } from '../../internal/Field';
import { ChevronGlyph } from '../../internal/ChevronGlyph';
import { ANCHORED, LAYER_OFFSET, PANEL } from '../../internal/Layer';
import { CHECKERBOARD } from '../../internal/checkerboard';
import { cx } from '../../internal/cx';
import {
  formatColour,
  losesAlpha,
  parseSwatch,
  type ColorFormat
} from '../../internal/isoColor';
import { useDevWarning } from '../../internal/useDevWarning';

export type ColorPickerSize = 'sm' | 'md' | 'lg';

const SIZE: Record<ColorPickerSize, string> = {
  sm: 'bb:h-control-sm',
  md: 'bb:h-control-md',
  lg: 'bb:h-control-lg'
} satisfies Record<ColorPickerSize, string>;

const ROOT = cx(
  'bb-color-picker',
  'bb:box-border bb:flex bb:w-full bb:flex-col',
  'bb:gap-(--bb-field-gap-inner) bb:font-sans bb:text-md bb:text-text'
);

const LABEL = cx(
  'bb-color-picker-label',
  'bb:w-fit bb:text-md bb:font-strong bb:text-text'
);

/*
 * THE TRIGGER FILLS THE FRAME, the way a select's does: the whole box opens
 * the layer, rather than a small button beside a value nobody can press.
 *
 * `bb:group` here and not on the root — the package guide has this one written
 * down twice already. The open state belongs to the POPOVER, which is
 * portalled somewhere else, and what the trigger carries is `aria-expanded`.
 */
const TRIGGER = cx(
  'bb-color-picker-trigger',
  'bb:group bb:box-border bb:flex bb:w-full bb:min-w-0 bb:flex-1',
  'bb:items-center bb:gap-x-(--bb-space-2)',
  'bb:cursor-pointer bb:border-0 bb:bg-transparent bb:text-start',
  'bb:px-(--bb-control-padding-x) bb:font-sans bb:leading-normal',
  'bb:text-inherit bb:outline-hidden',
  'bb:data-disabled:cursor-not-allowed'
);

/*
 * The current colour, shown in the trigger. `ColorSwatch` with no `color` prop
 * reads the picker's state through the context the base publishes, so the
 * swatch and the layer cannot disagree.
 *
 * The border is the same argument the palette makes: a swatch holds a colour
 * the library has never seen, and white on the light surface has no edge.
 */
const SWATCH_BEHIND = cx(
  'bb-color-picker-swatch-behind',
  CHECKERBOARD,
  'bb:box-border bb:h-mark bb:w-mark bb:flex-none bb:overflow-hidden',
  'bb:rounded-sm bb:border bb:border-solid bb:border-border'
);

const SWATCH = cx('bb-color-picker-swatch', 'bb:h-full bb:w-full');

const VALUE = cx(
  'bb-color-picker-value',
  'bb:min-w-0 bb:flex-1 bb:truncate bb:tabular-nums'
);

const TOGGLE_MARK = cx(
  /*
   * A CLASS OF ITS OWN, because a check went looking for this inside the
   * trigger and found nothing: the mark lives in the FRAME's trailing slot,
   * which is a sibling of the button rather than a child of it. Naming it
   * saves the next reader the same wrong guess.
   */
  'bb-color-picker-chevron',
  'bb:h-mark bb:w-mark bb:flex-none bb:text-text-muted',
  'bb:transition-[rotate] bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-aria-expanded:rotate-180'
);

const LAYER = cx(
  'bb-color-picker-layer',
  ANCHORED,
  'bb:z-(--bb-layer-popover)'
);

/*
 * A DECLARED WIDTH, which doc 04 §4.3 requires of a layer that declares
 * anything about its own size — and here it is what the area is a fraction of.
 * A colour area has no content to be sized by: it is a gradient, so it is
 * whatever it is given, and "whatever it is given" has to come from somewhere.
 */
const LAYER_PANEL = cx(
  /*
   * A CLASS OF ITS OWN, for the same reason the chevron got one: a check went
   * looking for the panel as the layer's first child and found the base's
   * visually-hidden focus sentinel instead — `border: 0; clip: rect(0,0,0,0)`,
   * with no class at all.
   */
  'bb-color-picker-panel',
  PANEL,
  'bb:min-h-0 bb:w-(--bb-color-picker-width)',
  'bb:border bb:rounded-lg bb:p-(--bb-space-3)',
  'bb:flex bb:flex-col bb:gap-(--bb-space-3)',
  'bb:[--bb-color-picker-width:15rem]'
);

/*
 * The two-dimensional half: saturation across, brightness down.
 *
 * `aspect-square` rather than a height, so the area is a fraction of the
 * panel's declared width and nothing here is a second number to keep in step.
 * The same trick `Avatar` uses, for the same reason: there is no
 * `--width-*` token for a box like this and there should not be.
 */
const AREA = cx(
  'bb-color-picker-area',
  'bb:box-border bb:w-full bb:aspect-square bb:rounded-md',
  'bb:border bb:border-solid bb:border-border',
  'bb:data-disabled:opacity-50'
);

/* The hue and alpha rails, which are `Slider`'s rail with the base's gradient. */
const RAIL = cx(
  'bb-color-picker-rail',
  'bb:box-border bb:flex bb:min-h-hit bb:w-full bb:items-center'
);

const RAIL_TRACK = cx(
  'bb-color-picker-rail-track',
  'bb:box-border bb:relative bb:h-2 bb:w-full bb:rounded-full',
  'bb:border bb:border-solid bb:border-border'
);

/*
 * WHAT GOES BEHIND THE TRANSPARENCY RAIL. The base writes the gradient as the
 * track's own background — from transparent to the colour — so without
 * something behind it the left end is the surface and reads as "white" rather
 * than "nothing". Measured on the first baseline of the transparency story.
 *
 * `overflow-hidden` and the same radius, so the pattern is clipped to the
 * rail's shape rather than showing at the corners.
 */
const RAIL_BEHIND = cx(
  'bb-color-picker-rail-behind',
  CHECKERBOARD,
  'bb:box-border bb:relative bb:h-2 bb:w-full bb:overflow-hidden',
  'bb:rounded-full'
);

/*
 * THE THUMB, AND IT NEEDS TWO RINGS.
 *
 * Every other handle in this library sits on a surface the library chose. This
 * one sits on the colour itself — anywhere in a gradient — so a single ring in
 * any one token is invisible against half of it. The calendar's rule ("a ring
 * is the text colour of what it sits on") cannot be applied, because what it
 * sits on is unknown by construction.
 *
 * So: a light ring and a dark one, from the surface pair, which stay a light
 * one and a dark one in either mode. The focus halo is added to the same
 * shadow rather than replacing it, so nothing disappears when focus lands.
 */
const THUMB = cx(
  'bb-color-picker-thumb',
  'bb:box-border bb:h-4 bb:w-4 bb:rounded-full',
  'bb:border-2 bb:border-solid bb:border-surface',
  'bb:shadow-[0_0_0_1px_var(--bb-text)]',
  'bb:outline-hidden',
  'bb:data-focus-visible:shadow-[0_0_0_1px_var(--bb-text),0_0_0_5px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-disabled:opacity-50'
);

/* The hex field inside the layer, which is the route for somebody who knows it. */
const HEX = cx(
  'bb-color-picker-hex',
  'bb:box-border bb:h-control-sm bb:w-full bb:rounded-md',
  'bb:border bb:border-solid bb:border-border bb:bg-surface-control',
  'bb:px-(--bb-space-2) bb:font-sans bb:text-md bb:tabular-nums',
  'bb:text-surface-control-on bb:outline-hidden',
  'bb:data-focused:border-focus-ring',
  'bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]'
);

export interface ColorPickerProps {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`. The project decides there is an error. */
  errorMessage?: React.ReactNode;
  /** Marks it invalid, which is the project's judgement (doc 07 §1). */
  isInvalid?: boolean;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /**
   * The colour, as any string `parseColor` reads.
   *
   * **Not nullable**, and that is the base's shape rather than an omission: a
   * colour picker always holds a colour, because a two-dimensional area always
   * points somewhere. Measured — `useColorPickerState` falls back to `#000000`
   * and its setter refuses null. Where "no colour" is a real state, it belongs
   * to something beside this field: a checkbox, or the palette field, which
   * can hold nothing because a set can be empty.
   */
  value?: string;
  /** The uncontrolled shortcut (doc 02 §8). */
  defaultValue?: string;
  /**
   * Called with the colour in the declared `format`.
   *
   * Never with the base's `Color` object, and never with `toString()`'s
   * default: after a drag in the area the colour's space is `hsb`, so the
   * default would report `hsb(226, 72%, 87%)` to a project that wanted hex
   * (decision 0024).
   */
  onChange?: (value: string) => void;
  /**
   * How the value is written when it crosses back. **Defaults to `hex`.**
   *
   * Decision 0024: a colour has more than one correct spelling, and the value
   * does not know how it was written — `getColorSpace()` answers `rgb` for
   * both a hex string and an `rgb()` one. So the format is declared rather
   * than guessed.
   */
  format?: ColorFormat;
  /**
   * Offer transparency, as a second slider under the hue.
   *
   * Pair it with a `format` that can carry it — `hexa`, `rgba` or `hsla`.
   * `hex` drops the alpha silently, measured, so this combination says so in
   * development rather than losing a value quietly.
   */
  hasAlpha?: boolean;
  /** Height and type size of the field. Aligns with a control of the same size. */
  size?: ColorPickerSize;
  /** Switches the field and the layer off. */
  isDisabled?: boolean;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
}

/**
 * A colour, chosen from a gradient.
 *
 * ```tsx
 * <ColorPicker label="Brand colour" value={colour} onChange={setColour} />
 * ```
 *
 * ## When this and when the palette
 *
 * **This one is for a colour nobody has decided yet** — a brand, a theme, a
 * chart series somebody is tuning. `ColorSwatchField` is for a colour chosen
 * from a set the project already owns, which is the more common case in a
 * management application by some distance.
 *
 * ## It always holds a colour
 *
 * There is no empty state and no clear button, and that is the base's shape
 * rather than an omission: a two-dimensional area always points somewhere, so
 * `useColorPickerState` falls back to black and its setter refuses null —
 * measured. Where "no colour" is a real state it belongs to something beside
 * this field.
 *
 * ## Four ways in, and the base wires all of them
 *
 * The area for saturation and brightness, a slider for hue, another for
 * transparency when it is offered, and a field for typing a hex somebody
 * already knows. Every one of them is keyboard-operable — which is the thing
 * that usually makes a colour picker fail this library's entry gate — and they
 * stay in step through the contexts `ColorPicker` publishes rather than
 * through anything wired here.
 *
 * ## The value's format is declared
 *
 * Decision 0024, and this is the component that decision's `format` prop
 * exists for: a value dragged out of an area was never one of the inputs, so
 * there is no string to report verbatim. After a drag the colour's space is
 * `hsb`, so reporting `toString()` would hand a project `hsb(...)`.
 */
export const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(
  function ColorPicker(
    {
      label,
      description,
      errorMessage,
      isInvalid = false,
      isLabelHidden = false,
      value,
      defaultValue,
      onChange,
      format = 'hex',
      hasAlpha = false,
      size = 'md',
      isDisabled = false,
      className
    },
    ref
  ) {
    const id = useId();
    const labelId = `${id}-label`;
    const valueId = `${id}-value`;
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

    const hexLabel = useMessage('colorValue');

    const chosen = parseSwatch(value);
    const initial = parseSwatch(defaultValue);
    const held = chosen ?? initial;

    /*
     * TWO WARNINGS, BECAUSE THERE ARE TWO WAYS TO LOSE THE ALPHA and they
     * happen at different times.
     *
     * The first is a MISCONFIGURATION: offering a transparency slider with a
     * format that cannot carry what it produces. Nothing has been lost yet,
     * and it will be, on the first drag.
     *
     * The second is a VALUE that already has transparency in it, arriving into
     * a format that will report it opaque. That one is losing something now.
     *
     * Both are said rather than forbidden — a project may legitimately want
     * the opaque value — and both are render-time rather than inside
     * `onChange`, which would warn on every step of a drag.
     */
    useDevWarning(
      hasAlpha && (format === 'hex' || format === 'rgb' || format === 'hsl'),
      `ColorPicker: transparency is offered and the format is "${format}", ` +
        'which cannot carry it — the alpha is dropped without an error ' +
        'anywhere. Use `hexa`, `rgba` or `hsla` (decision 0024).'
    );

    useDevWarning(
      held !== undefined && losesAlpha(held, format),
      /*
       * NO EXAMPLE IN THE MESSAGE, for the reason `isoColor`'s own warning
       * records: the project's rule against literal colours matches a hex
       * string, so spelling out the before and after would trip it twice. The
       * measurement lives in decision 0024, which the message points at.
       */
      `ColorPicker: the value has transparency and the format is "${format}", ` +
        'so what crosses back is the opaque colour — eight digits of hex ' +
        'become six, with no error anywhere. Decision 0024 has the ' +
        'measurement.'
    );

    return (
      <AriaColorPicker
        {...(chosen === undefined ? {} : { value: chosen })}
        {...(initial === undefined ? {} : { defaultValue: initial })}
        {...(onChange === undefined
          ? {}
          : {
              onChange: (next: Color) => {
                onChange(formatColour(next, format));
              }
            })}
      >
        {({ color }) => (
          <div ref={ref} className={cx(ROOT, className)}>
            <span
              id={labelId}
              className={cx(LABEL, isLabelHidden && 'bb:sr-only')}
            >
              {label}
            </span>

            <DialogTrigger>
              <ControlFrame
                /*
                 * TOLD, RATHER THAN READING A CONTEXT. The package guide's
                 * warning: a frame reads `isInvalid` and `isDisabled` from the
                 * base's group context, and a `ColorPicker` publishes no group
                 * at all — it is a state container that renders no DOM. Passed
                 * implicitly it would silently do nothing.
                 */
                isInvalid={isInvalid}
                isDisabled={isDisabled}
                role="presentation"
                className={SIZE[size]}
              >
                <AriaButton
                  className={TRIGGER}
                  isDisabled={isDisabled}
                  /*
                   * THE LABEL AND THE VALUE, which is what `Select`'s trigger
                   * does — measured on that component: the base points its
                   * `aria-labelledby` at both the value and the label, so a
                   * reader hears "Brand colour #3E63DD" rather than the label
                   * alone.
                   *
                   * It matters more here than it looks. `button` is marked
                   * "children presentational" in ARIA, so the swatch and the
                   * text inside are pruned from the tree — name the trigger by
                   * the label only and the VALUE is announced nowhere at all.
                   */
                  aria-labelledby={`${labelId} ${valueId}`}
                  {...(describedByValue === undefined
                    ? {}
                    : { 'aria-describedby': describedByValue })}
                >
                  <span className={SWATCH_BEHIND}>
                    <AriaColorSwatch className={SWATCH} />
                  </span>
                  <span id={valueId} className={VALUE}>
                    {formatColour(color, format)}
                  </span>
                  {/*
                   * THE MARK GOES INSIDE THE TRIGGER, and the first version put
                   * it in the frame's trailing slot — where it never turned.
                   *
                   * `bb:group` is on the trigger, because `aria-expanded` is,
                   * and a `group-*` variant only matches a DESCENDANT. The
                   * trailing slot is a SIBLING of the button, so the variant
                   * matched nothing and the chevron sat still: measured,
                   * `rotate` was `none` before and after opening.
                   *
                   * This is the third shape of the same trap in this
                   * repository — `SplitButton` had it with the group on the
                   * root, `DatePicker` with it on the wrong element — and
                   * inside the trigger is also where `Select` keeps its own,
                   * so the whole box opens the layer rather than a mark beside
                   * it.
                   */}
                  <ChevronGlyph className={TOGGLE_MARK} />
                </AriaButton>
              </ControlFrame>

              <AriaPopover className={LAYER} offset={LAYER_OFFSET}>
                <div className={LAYER_PANEL}>
                  {/*
                   * A DIALOG ROUND THE CONTROLS, which is the base's own shape
                   * for an anchored layer with things to operate in it — the
                   * same arrangement `DatePicker` has, and for the same
                   * reason: the trigger's props name it, and without something
                   * to consume them the layer opens unnamed.
                   */}
                  <AriaDialog
                    className="bb:flex bb:flex-col bb:gap-(--bb-space-3) bb:outline-hidden"
                    aria-labelledby={labelId}
                  >
                    <AriaColorArea
                      className={AREA}
                      colorSpace="hsb"
                      xChannel="saturation"
                      yChannel="brightness"
                      isDisabled={isDisabled}
                    >
                      <AriaColorThumb className={THUMB} />
                    </AriaColorArea>

                    <AriaColorSlider
                      className={RAIL}
                      colorSpace="hsb"
                      channel="hue"
                      isDisabled={isDisabled}
                    >
                      <AriaSliderTrack className={RAIL_TRACK}>
                        <AriaColorThumb className={THUMB} />
                      </AriaSliderTrack>
                    </AriaColorSlider>

                    {hasAlpha ? (
                      <AriaColorSlider
                        className={RAIL}
                        channel="alpha"
                        isDisabled={isDisabled}
                      >
                        <div className={RAIL_BEHIND}>
                          <AriaSliderTrack className={RAIL_TRACK}>
                            <AriaColorThumb className={THUMB} />
                          </AriaSliderTrack>
                        </div>
                      </AriaColorSlider>
                    ) : null}

                    {/*
                     * THE TYPED ROUTE, AND ONLY WHERE IT CAN CARRY THE VALUE.
                     *
                     * The base's hex field speaks six digits and nothing else
                     * — read in `useColorFieldState`: it formats with
                     * `toString('hex')` and parses by building `#RRGGBB` from a
                     * clamped integer. So with transparency offered it would
                     * SHOW an opaque colour and, worse, typing in it would
                     * report one: the alpha is not preserved, it is replaced.
                     *
                     * A control that cannot express the value is not offered.
                     * The area, the hue and the transparency slider are all
                     * still there, and all three are keyboard-operable.
                     *
                     * Its label comes from the dictionary rather than from the
                     * base: the area and the sliders are named by the base,
                     * which knows the channel names in every locale, and a
                     * plain field has nothing to derive a name from.
                     */}
                    {hasAlpha ? null : (
                      <AriaColorField
                        className="bb:box-border bb:w-full"
                        aria-label={hexLabel}
                        isDisabled={isDisabled}
                      >
                        <AriaInput className={HEX} />
                      </AriaColorField>
                    )}
                  </AriaDialog>
                </div>
              </AriaPopover>
            </DialogTrigger>

            <FieldMessages
              {...(hasDescription ? { description } : {})}
              {...(errorMessage === undefined ? {} : { errorMessage })}
              isInvalid={isInvalid}
              descriptionId={descriptionId}
              errorId={errorId}
            />
          </div>
        )}
      </AriaColorPicker>
    );
  }
);
