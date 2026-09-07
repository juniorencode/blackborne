import { forwardRef } from 'react';
import {
  Button,
  Input,
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps
} from 'react-aria-components';
import {
  ALIGN,
  CONTROL_INSIDE,
  CONTROL_TEXT,
  ControlFrame,
  EDGE_CONTROL,
  Field,
  type ControlAlign
} from '../../internal/Field';
import { useConfig, useMessage } from '../../config';
import { cx } from '../../internal/cx';

export type NumberFieldSize = 'sm' | 'md' | 'lg';

/*
 * This is the first component that leans on the config provider rather than on
 * the field structure.
 *
 * Everything about how a number READS is locale-dependent: the decimal
 * separator, the thousands separator, the digits themselves in some scripts.
 * The base handles all of it through the locale the provider supplies, and it
 * handles the harder half too — parsing what someone TYPES in that locale.
 * Reimplementing either is non-goal 7.
 *
 * A note on what "Spanish" means here, because it caught me while building:
 * es-PE uses a comma for thousands and a point for decimals, exactly like
 * en-US, while es-ES and de-DE invert both. There is no such thing as a
 * Spanish number format — which is precisely why the library never guesses and
 * always takes the locale it is given.
 */

interface SizeClasses {
  /** The height, on the frame — it is the frame that draws the box. */
  frame: string;
  /** The type size, on the CONTROL: an input inherits no font. */
  text: string;
}

const SIZE: Record<NumberFieldSize, SizeClasses> = {
  sm: { frame: 'bb:h-control-sm', text: 'bb:text-xs' },
  md: { frame: 'bb:h-control-md', text: 'bb:text-md' },
  lg: { frame: 'bb:h-control-lg', text: 'bb:text-lg' }
} satisfies Record<NumberFieldSize, SizeClasses>;

const INPUT = cx(
  CONTROL_INSIDE,
  CONTROL_TEXT,
  // Tabular figures, because a number read in a column has to line up with
  // the ones above and below it (doc 03 §4.2).
  'bb-tabular'
);

const STEPPER = cx(
  EDGE_CONTROL,
  /*
   * A column rather than a floating target: it spans the frame's full height
   * flush against the inner edge, so it takes a fixed width and no radius
   * where the cross and the toggle take the hit-area token and round
   * themselves.
   *
   * Worth knowing that this makes it 28px at BOTH densities where the others
   * go to 24px at compact. It is deliberate here — the height already comes
   * from the frame, so the width is the whole target — but it is also the one
   * edge control that does not follow the density token, which is recorded
   * rather than settled.
   */
  'bb:w-7 bb:flex-none'
);

export interface NumberFieldProps extends Omit<
  AriaNumberFieldProps,
  'children' | 'className' | 'style'
> {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /** Persistent help text. An error accompanies it rather than replacing it. */
  description?: React.ReactNode;
  /** Shown when `isInvalid`. The project decides there is an error and writes it. */
  errorMessage?: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /** Waiting for data the field needs. */
  isLoading?: boolean;
  /** The value is being submitted. */
  isSaving?: boolean;
  /** Height and type size. Aligns with a Button or TextField of the same size. */
  size?: NumberFieldSize;
  /**
   * Show the `+` and `−` buttons. **Off by default**
   * ([decision 0011](../../../../docs/decisions/0011-the-stepper-is-opt-in.md)).
   *
   * Nothing is lost without them: the arrow keys still step by `step`, Page Up
   * and Page Down still make larger jumps, the value is still announced, and
   * the control is still a `spinbutton`. All of that comes from the base, not
   * from the buttons. What the buttons cost is about 40px from the trailing
   * edge of every numeric field on a form that is trying to be dense.
   *
   * Turn them on where pressing is genuinely how the value is entered — a
   * small bounded quantity, where two presses beat selecting and retyping.
   *
   * They are not drawn while the field is loading or saving, whatever this is
   * set to: doc 07 §2.2 gives the trailing edge to the busy indicator, and a
   * stepper that cannot act is worse than one that is absent.
   */
  isStepperVisible?: boolean;
  /**
   * Format the value as currency, e.g. `PEN`.
   *
   * If omitted, the currency from the config provider is used when it is set.
   * The library never guesses one: a component cannot know what a business
   * trades in (doc 05 §3.1).
   */
  currency?: string;
  placeholder?: string;
  /**
   * Before the value, inside the box: a currency symbol.
   *
   * Note this is presentation only — passing `currency` is what makes the
   * value FORMAT as money in the active locale, and only that reaches whoever
   * reads the field aloud. An affix that a person needs in order to answer
   * belongs in the label (doc 02 §11.3).
   */
  prefix?: React.ReactNode;
  /** After the value: a unit — `kg`, `%`, `h`. Same rules as `prefix`. */
  suffix?: React.ReactNode;
  /**
   * Where the value sits in its box.
   *
   * `end` is the one worth knowing about: numbers read in a column compare by
   * magnitude at a glance only when their last digits line up, which is the
   * same reason the value is set in tabular figures (doc 03 §4.2).
   */
  align?: ControlAlign;
  className?: string;
}

/**
 * A numeric field, formatted and parsed in the active locale.
 *
 * The formatting is not decoration: it is what makes the field usable by
 * someone whose keyboard and expectations differ from the author's. The
 * separators, and the digits themselves in some scripts, come from the locale
 * the config provider supplies — and typing is parsed the same way, so a
 * person can enter a number the way they write it.
 *
 * **What it restricts:** letters cannot be typed, and `minValue`/`maxValue`
 * clamp the result. **What it does not decide:** whether the number is
 * acceptable to the business. That is `isInvalid` and `errorMessage`, from
 * whatever validates in your project (doc 07 §1).
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      label,
      description,
      errorMessage,
      isLabelHidden = false,
      isLoading = false,
      isSaving = false,
      size = 'md',
      isStepperVisible = false,
      prefix,
      suffix,
      align = 'start',
      currency,
      placeholder,
      className,
      ...ariaProps
    },
    ref
  ) {
    /*
     * Doc 07 §2.2 rule 1: busy takes the edge, and the room the stepper
     * occupies STAYS. Rendering nothing there closed the gap, so a field
     * starting to save slid its value 28px across — the field's own busy state
     * breaking doc 09 §3. The frame makes the buttons unreachable instead.
     */
    const busy = isLoading || isSaving;

    const increaseLabel = useMessage('increment');
    const decreaseLabel = useMessage('decrement');
    const { currency: configCurrency } = useConfig();

    /*
     * A currency prop wins over the provider, and neither is invented. If
     * formatOptions is passed explicitly it wins over both — the escape hatch
     * for percentages, units and anything else Intl supports.
     */
    const resolvedCurrency = currency ?? configCurrency;
    const formatOptions: Intl.NumberFormatOptions | undefined =
      ariaProps.formatOptions ??
      (resolvedCurrency === undefined
        ? undefined
        : { style: 'currency', currency: resolvedCurrency });

    return (
      <AriaNumberField
        validationBehavior="aria"
        className={cx('bb:group bb:w-full', className)}
        {...ariaProps}
        {...(formatOptions === undefined ? {} : { formatOptions })}
      >
        <Field
          label={label}
          {...(description === undefined ? {} : { description })}
          {...(errorMessage === undefined ? {} : { errorMessage })}
          isRequired={ariaProps.isRequired ?? false}
          isLabelHidden={isLabelHidden}
          isLoading={isLoading}
          isSaving={isSaving}
        >
          <ControlFrame
            {...(prefix === undefined ? {} : { prefix })}
            {...(suffix === undefined ? {} : { suffix })}
            /*
             * The stepper buttons are `leading` and `trailing` rather than
             * children, so an affix lands between the value and the button
             * instead of outside it. Doc 07 §2.2 rule 3: the affix moves ahead
             * of the control, which keeps the button's target whole and puts
             * the unit next to the number it belongs to.
             */
            {...(isStepperVisible
              ? {
                  leading: (
                    <Button slot="decrement" className={STEPPER}>
                      {/*
                       * The dictionary word is the button's visually hidden
                       * TEXT rather than an aria-label, because the base sets
                       * aria-labelledby pointing at the button AND the field
                       * label — and labelledby wins over label.
                       *
                       * Verified while building: with an aria-label the
                       * announced name came out as "− Quantity", ignoring it
                       * entirely. Letting the base compose gives "Decrease
                       * Quantity", which is better than anything this
                       * component could say alone: only the consumer knows
                       * what is being decreased.
                       */}
                      <span className="bb:sr-only">{decreaseLabel}</span>
                      <span aria-hidden="true">−</span>
                    </Button>
                  ),
                  trailing: (
                    <Button slot="increment" className={STEPPER}>
                      <span className="bb:sr-only">{increaseLabel}</span>
                      <span aria-hidden="true">+</span>
                    </Button>
                  )
                }
              : {})}
            isLeadingHidden={busy}
            isTrailingHidden={busy}
            /*
             * Room for the busy indicator only when nothing else already
             * holds that edge. With a stepper the `+` is already 28px of
             * reserved width and the indicator sits over it; without one the
             * edge is empty and has to be cleared.
             */
            className={cx(
              SIZE[size].frame,
              busy && !isStepperVisible && 'bb:pe-9'
            )}
          >
            <Input
              ref={ref}
              className={cx(INPUT, SIZE[size].text, ALIGN[align])}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
          </ControlFrame>
        </Field>
      </AriaNumberField>
    );
  }
);
