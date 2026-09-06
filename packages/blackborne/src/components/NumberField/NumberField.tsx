import { forwardRef } from 'react';
import {
  Button,
  Group,
  Input,
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps
} from 'react-aria-components';
import { Field } from '../../internal/Field';
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

const SIZE: Record<NumberFieldSize, string> = {
  sm: 'bb:h-control-sm bb:text-xs',
  md: 'bb:h-control-md bb:text-md',
  lg: 'bb:h-control-lg bb:text-lg'
} satisfies Record<NumberFieldSize, string>;

const GROUP = cx(
  'bb:box-border bb:flex bb:w-full bb:min-w-0 bb:items-stretch',
  'bb:rounded-md bb:border bb:border-solid bb:border-border',
  'bb:bg-surface-control bb:text-surface-control-on',
  'bb:transition-[border-color,box-shadow,background-color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  // The ring lands on the GROUP, not the input, because the buttons are part
  // of the control as far as anyone looking at it is concerned.
  // The border moves on hover, as on the other fields. See TextField for why a
  // field moves its border where a checkbox moves its fill.
  'bb:data-hovered:border-border-strong',
  'bb:data-focus-within:border-border-focus',
  'bb:data-focus-within:border-focus-ring bb:data-focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-invalid:border-danger',
  'bb:data-invalid:[--bb-focus-ring:var(--bb-danger)]',
  'bb:data-disabled:bg-surface-disabled bb:data-disabled:text-text-disabled'
);

const INPUT = cx(
  'bb:box-border bb:w-full bb:min-w-0 bb:flex-1',
  'bb:px-(--bb-control-padding-x)',
  'bb:bg-transparent bb:text-inherit',
  'bb:font-sans bb:leading-normal',
  'bb:outline-hidden bb:border-0',
  'bb:placeholder:text-text-muted',
  'bb:data-disabled:cursor-not-allowed',
  // Tabular figures, because a number read in a column has to line up with the
  // ones above and below it (doc 03 §4.2).
  'bb-tabular'
);

const STEPPER = cx(
  'bb:box-border bb:flex bb:w-7 bb:flex-none bb:items-center bb:justify-center',
  'bb:bg-transparent bb:text-text-muted',
  'bb:border-0 bb:cursor-pointer',
  'bb:data-hovered:bg-surface-hover bb:data-hovered:text-text',
  'bb:data-pressed:bg-surface-active',
  // The buttons sit inside the group's focus ring, so they must not draw a
  // second one — the library has one ring, and two nested is noise.
  'bb:outline-hidden',
  'bb:data-focus-visible:bg-surface-hover bb:data-focus-visible:text-text',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
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
      currency,
      placeholder,
      className,
      ...ariaProps
    },
    ref
  ) {
    /*
     * Doc 07 §2.2, rule 1: busy wins the trailing edge outright. Before this,
     * the spinner Field draws there landed on top of the `+` button — two
     * things in one place, and the one you could press did nothing useful.
     */
    const busy = isLoading || isSaving;
    const hasStepper = isStepperVisible && !busy;

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
        className={cx('bb:w-full', className)}
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
          <Group className={cx(GROUP, SIZE[size])}>
            {/*
             * Decrement first in the DOM, so keyboard traversal follows the
             * visual order — and in RTL the group flips with the writing
             * direction, taking the buttons with it. There is no physical
             * measurement to correct (doc 03 §5, rule 4).
             *
             * Each button carries an accessible name from the dictionary,
             * because an icon-only button always needs one and the consumer
             * cannot supply a name for a component's internal control.
             */}
            {hasStepper ? (
              <Button slot="decrement" className={STEPPER}>
                {/*
                 * The dictionary word is the button's visually hidden TEXT
                 * rather than an aria-label, because the base sets
                 * aria-labelledby pointing at the button AND the field label
                 * — and labelledby wins over label.
                 *
                 * Verified while building: with an aria-label the announced
                 * name came out as "− Quantity", ignoring it entirely.
                 * Letting the base compose gives "Decrease Quantity", which
                 * is better than anything this component could say alone:
                 * only the consumer knows what is being decreased.
                 */}
                <span className="bb:sr-only">{decreaseLabel}</span>
                <span aria-hidden="true">−</span>
              </Button>
            ) : null}
            <Input
              ref={ref}
              /*
               * Room for the busy indicator, the same way TextField makes it.
               * Only while busy: unlike a search field, this edge is empty in
               * the ordinary case, so reserving it always would narrow every
               * numeric field for a state most of them never enter.
               */
              className={cx(INPUT, busy && 'bb:pe-9')}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
            {hasStepper ? (
              <Button slot="increment" className={STEPPER}>
                <span className="bb:sr-only">{increaseLabel}</span>
                <span aria-hidden="true">+</span>
              </Button>
            ) : null}
          </Group>
        </Field>
      </AriaNumberField>
    );
  }
);
