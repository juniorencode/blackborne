import { createContext, forwardRef, useContext } from 'react';
import {
  FieldError,
  Label,
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  Text,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps
} from 'react-aria-components';
import { cx } from '../../internal/cx';

/*
 * Two levels of label, which is what this component adds to the field model.
 *
 * A text field has one label. A checkbox has one label, beside the control. A
 * radio group has a label for the GROUP and a label for each option, and the
 * description and error hang off the group rather than off any single radio.
 *
 * The base handles all of that wiring, verified: the description and error are
 * referenced from the group AND from every radio, with aria-invalid and
 * aria-required on the group. Nothing needs supplying here — unlike a lone
 * checkbox, where the base leaves the association to the caller.
 */

/**
 * How each option is drawn.
 *
 * `plain` is a circle with its label beside it. `card` makes every option a
 * surface you press anywhere on — choosing a plan, a payment method, a
 * shipping option, where each choice carries more than three words.
 *
 * Both are named. Neither is "the default", which is the naming mistake
 * EmptyState made and had to undo (doc 02 §3.1): a value called `default`
 * tells you nothing about what it looks like, and it cannot be renamed once
 * something else becomes the ordinary case.
 */
export type RadioGroupVariant = 'plain' | 'card';

type Orientation = 'vertical' | 'horizontal';

/*
 * THE VARIANT BELONGS TO THE GROUP, AND IT REACHES THE OPTIONS THROUGH
 * CONTEXT. This is the library's first component to propagate appearance that
 * way, so it is the precedent, and the reasoning is written here rather than
 * left to be reverse-engineered.
 *
 * The problem: a group with two cards and one bare circle is not a thing
 * anybody wants, so the choice has to be made once, for the set. But the
 * options are `<Radio>` elements the consumer writes as children, and the
 * group cannot reach into them.
 *
 * Three routes, two rejected:
 *
 * 1. A RENDER PROP — `{state => …}`, which is how the base hands state to
 *    children. Doc 02 §5 keeps those out of the public API outright, and §5's
 *    replacement is a hook, which is for state a CONSUMER needs to read. This
 *    is the opposite direction: appearance travelling inward, from our
 *    component to our own children, with nothing for a consumer to read.
 * 2. `variant` REPEATED ON EVERY `Radio`. It types the mixed group as legal,
 *    which is the "impossible combination" doc 02 §3 rejects booleans for. It
 *    also puts the same value in five places, so the group's appearance is
 *    whatever the fifth one says.
 * 3. CONTEXT, which is what this does.
 *
 * P3 forbids GLOBAL state, and this is not global: nothing is written to the
 * document, to storage or to a singleton, the value is scoped to one group's
 * subtree, and the default is `plain` — so a `Radio` with no group above it
 * still renders, which is P3's actual test.
 *
 * The rules that come with the precedent, for whoever propagates appearance
 * this way next:
 *
 * - The context is NOT exported, from this file or from the package. Doc 02
 *   §10 puts every context the base exposes on the "not public" list and this
 *   one earns no exception: exporting it would be an escape hatch into an
 *   internal node by another route (non-goal 10).
 * - The value is a plain string, so there is no object identity to churn and
 *   no memo to forget (doc 10 §5).
 * - It carries APPEARANCE ONLY. Behaviour, state and accessibility wiring
 *   already come down the base's own context, and a second channel carrying
 *   the same kind of thing is doc 01 §7's "two different ways to do the same
 *   thing".
 */
const VariantContext = createContext<RadioGroupVariant>('plain');

const DOT = cx(
  'bb-inline-control-box',
  'bb:box-border bb:flex bb:h-box bb:w-box bb:flex-none bb:items-center bb:justify-center',
  'bb:rounded-full bb:border bb:border-solid bb:border-border-control',
  'bb:bg-surface-control',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:group-data-selected:border-accent bb:group-data-selected:bg-accent',
  /*
   * Pointer feedback. Doc 09 §3 asks for a visible response to every
   * interaction, and this control had none: measured, hover and pressed were
   * pixel-identical to rest.
   *
   * The FILL moves and the border does not, because Button already answered
   * this question — secondary hovers by moving bg-surface-hover and leaves
   * its border alone — and doc 09 §8 is blunt that one component behaving
   * differently costs the credibility of all of them.
   *
   * TWO rules, not one. A filled control hovering back to grey would read as
   * a different component, so once it is filled it moves along the ACCENT
   * ramp instead. The stacked variant carries higher specificity than either
   * single one, so which wins is not decided by source order — this file has
   * already lost that argument once.
   *
   * The whole label triggers it, not just the box: the label IS the hit area,
   * and feedback that fired only over twenty pixels would teach people the
   * text is not pressable when it is.
   *
   * All of it survives inside a card, and deliberately: the circle answering
   * a pointer that is nowhere near it is the clearest possible statement that
   * the whole card is the target.
   */
  'bb:group-data-hovered:bg-surface-hover',
  'bb:group-data-pressed:bg-surface-active',
  'bb:group-data-selected:group-data-hovered:border-accent-hover bb:group-data-selected:group-data-hovered:bg-accent-hover',
  'bb:group-data-selected:group-data-pressed:border-accent-active bb:group-data-selected:group-data-pressed:bg-accent-active',
  'bb:group-data-invalid:border-danger',
  'bb:group-data-disabled:border-border-control bb:group-data-disabled:bg-surface-disabled'
);

/*
 * What both variants share. Everything that differs is in the map below, and
 * nothing appears in both places — two utilities for one property, one here
 * and one there, would be resolved by the generator's output order rather
 * than by either of them.
 */
const OPTION = cx(
  'bb:group bb:box-border bb:flex bb:items-start bb:gap-x-2',
  // The hit area is the whole option, above the minimum at every density
  // including compact (doc 06 §3).
  'bb:min-h-hit',
  'bb:font-sans bb:text-md bb:text-text bb:leading-normal',
  'bb:cursor-pointer bb:select-none',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

/*
 * THE FOCUS RING IS THE ONE THING THAT MOVES BETWEEN THE VARIANTS.
 *
 * The plain variant rings the circle, because the real input is visually
 * hidden and the circle is what stands for it. A card rings the CARD: a ring
 * around a 20px circle inside a 200px surface would point at the wrong thing
 * and would say the circle is the target, which is the whole misunderstanding
 * this variant exists to prevent.
 *
 * It is the library's single ring either way — same token, same halo, same
 * width — and `--bb-focus-ring` travels with it, because one variable
 * recolours the edge and the halo together and an invalid group must not end
 * up with a red edge and a brand-coloured halo.
 *
 * The halo string is therefore written out twice below, and it may not be
 * lifted into a constant and interpolated. Tailwind finds classes by scanning
 * the source as TEXT (`@source` in styles/index.css), so a class assembled
 * from a template literal is a class that never gets generated — no error, no
 * rule, no ring.
 */

interface VariantClasses {
  /** The element that lays the options out, per orientation. */
  track: Record<Orientation, string>;
  /** The pressable option — the base's own label element. */
  option: string;
  /** The circle. It survives in both variants; only the ring moves. */
  dot: string;
}

/*
 * The variant map. ONE place, typed, per component (doc 03 §4.4), and
 * `satisfies Record<...>` is what makes it exhaustive: adding a variant to the
 * union without adding it here is a type error, so the two cannot drift.
 */
const VARIANT: Record<RadioGroupVariant, VariantClasses> = {
  plain: {
    track: {
      vertical: 'bb:flex bb:flex-col bb:gap-1',
      horizontal: 'bb:flex bb:flex-row bb:flex-wrap bb:gap-x-5 bb:gap-y-1'
    },
    option: 'bb:w-fit bb:py-0.5',
    dot: cx(
      'bb:group-data-focused:border-focus-ring bb:group-data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
      'bb:group-data-invalid:[--bb-focus-ring:var(--bb-danger)]'
    )
  },
  card: {
    /*
     * Grid, not flex, and for one reason: `auto-fit` with a minimum column
     * width is a row that rewraps against ITS OWN container with no query and
     * no breakpoint (P4, doc 04 §3), and it makes every card in a row the same
     * height — which flex-wrap only manages per line. A row of three cards
     * where one is two lines tall and the others are not reads as broken.
     *
     * `min(12rem, 100%)` rather than a bare `12rem`, so the floor cannot
     * exceed the container: at 320px the row becomes one card per line, and
     * narrower than 192px it still does not overflow. 12rem is a loose value
     * inside one component, which doc 03 §4.4 allows for a genuine one-off —
     * it is a wrapping threshold, not a size anything else has to line up
     * with, and there is no token for it because nothing else needs one.
     */
    track: {
      vertical: 'bb:grid bb:grid-cols-1 bb:gap-(--bb-space-3)',
      horizontal:
        'bb:grid bb:grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),1fr))] bb:gap-(--bb-space-3)'
    },
    /*
     * SURFACE, BORDER AND RADIUS COME FROM `Card`, which already decided what
     * a card is in this library: `bg-surface` with `text-text` as its pair
     * (doc 03 §4.0), a border rather than a shadow, and `radius-lg`. A second
     * kind of card, differing by a step of grey and two pixels of corner,
     * would be doc 01 §7's two ways to do one thing — and `Card`'s file
     * carries the argument for each of the three, so repeating it here would
     * be repeating it in the place it can go stale.
     *
     * One of them is load-bearing beyond consistency: `surface` and not
     * `surface-control`. The circle inside is filled `surface-control`, so a
     * card on that fill would swallow it and the option would lose the
     * non-colour channel doc 06 §3 requires.
     *
     * Padding is NOT Card's. It reads `--bb-space-4`, which holds the same
     * value as `--bb-control-padding-x` at both densities, so a card's inner
     * edge lines up with the value inside a field beside it. A selectable
     * card is a control that happens to look like a card, and Card's own
     * `--bb-space-5` is panel air, sized against the gap between fields.
     */
    option: cx(
      'bb-radio-card',
      'bb:rounded-lg bb:border bb:border-solid bb:border-border bb:bg-surface',
      'bb:p-(--bb-space-4)',
      'bb:transition-[background-color,border-color,box-shadow]',
      'bb:duration-(--bb-duration-fast) bb:ease-standard',
      /*
       * WHICH CHANNEL MOVES, and the answer is different from the circle's
       * because the size of a thing changes what reads correctly on it.
       *
       * THE BORDER answers the pointer merely arriving. That is the field's
       * rule, taken verbatim from controlBox.ts: a large surface repainted
       * every time a pointer crosses it makes a list shimmer, and the border
       * says "this is a target" without touching the area you are reading. A
       * card is the largest surface in the library that answers a pointer at
       * all, so if the exception was earned at field size it is earned twice
       * here.
       *
       * THE FILL answers a press, which is where the field offers no
       * precedent because a field cannot be pressed. Button's does: it moves
       * `bg-surface-active`. The shimmer argument does not reach a press —
       * pressing is deliberate and lasts as long as a finger is down, so it
       * cannot flicker across a list you are only reading.
       *
       * THE FILL ALSO CARRIES SELECTION, and it is the one state that is not
       * about the pointer at all. `surface-selected` is the token named for
       * exactly this and, until now, used by no component — leaving the
       * token literally named for a role unused by the role is how a
       * vocabulary stops meaning anything (Card's file makes the same
       * argument about `surface`). Its `-on` half comes with it: the pair
       * rule (doc 03 §4.0) is not optional on a tinted surface, and a brand
       * overridden to a light colour is exactly where an unpaired text colour
       * fails.
       *
       * TWO RULES FOR SELECTED, not one — the circle's structure, for the
       * circle's reason. There is no `surface-selected-hover`, so once a card
       * is tinted the BORDER takes over hover and press along the accent ramp
       * and the tint holds. `data-selected:data-pressed:bg-surface-selected`
       * is what makes it hold: it carries higher specificity than the plain
       * `data-pressed`, so a pressed card cannot flash back to grey and read
       * as a different component for a fifth of a second.
       */
      'bb:data-selected:border-accent bb:data-selected:bg-surface-selected bb:data-selected:text-surface-selected-on',
      'bb:data-hovered:border-border-strong',
      'bb:data-pressed:bg-surface-active',
      'bb:data-selected:data-hovered:border-accent-hover',
      'bb:data-selected:data-pressed:border-accent-active bb:data-selected:data-pressed:bg-surface-selected',
      /*
       * Focus is stated after the pointer states on purpose: it sets
       * border-color at the same specificity as hover, so the ring wins the
       * tie by coming second — the ordering controlBox.ts already depends on
       * and says so about.
       *
       * The case it does NOT win is selected + hovered + focused, where the
       * stacked rule above is one selector heavier. The halo still draws, so
       * the ring is still there; its inner edge is accent-hover instead of
       * the ring colour. The circle behaves identically in the plain variant,
       * which is the argument for leaving it: the two variants of one
       * component may not differ in when focus is visible.
       */
      'bb:data-focused:border-focus-ring bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
      'bb:data-invalid:border-danger',
      'bb:data-invalid:[--bb-focus-ring:var(--bb-danger)]'
      /*
       * Disabled and read-only are in RadioGroup.css, not here. Both have to
       * beat `data-selected`, and two utilities of equal specificity are
       * resolved by the generator's output order — see that file.
       */
    ),
    // No ring on the circle: the card draws it, one ring and not two nested.
    dot: ''
  }
} satisfies Record<RadioGroupVariant, VariantClasses>;

export interface RadioProps extends Omit<
  AriaRadioProps,
  'children' | 'className' | 'style'
> {
  /** The option's own label. */
  children: React.ReactNode;
  className?: string;
}

/**
 * One option inside a `RadioGroup`.
 *
 * It only works inside one: a radio outside a group has nothing to be
 * exclusive with, and the base owns the arrow-key navigation that makes a set
 * of them behave as a single tab stop.
 *
 * It carries no appearance prop of its own. How an option is drawn is the
 * group's decision — see `RadioGroup`'s `variant`.
 */
export const Radio = forwardRef<HTMLLabelElement, RadioProps>(function Radio(
  { children, className, ...ariaProps },
  ref
) {
  const variant = VARIANT[useContext(VariantContext)];

  return (
    <AriaRadio
      ref={ref}
      className={cx(OPTION, variant.option, className)}
      {...ariaProps}
    >
      {/*
       * The inner dot is drawn by CSS from the state attribute rather than
       * conditionally rendered, so there is no class string computed in JS
       * (doc 02 §4).
       */}
      <span className={cx(DOT, variant.dot)} aria-hidden="true">
        <span className="bb-radio-dot" />
      </span>
      <span>{children}</span>
    </AriaRadio>
  );
});

export interface RadioGroupProps extends Omit<
  AriaRadioGroupProps,
  'children' | 'className' | 'style'
> {
  /** The group's label. Always present, even when visually hidden. */
  label: React.ReactNode;
  /** The options. Use `Radio`. */
  children: React.ReactNode;
  /** Persistent help text for the group. An error accompanies it. */
  description?: React.ReactNode;
  /** Shown while `isInvalid`. The project decides there is an error. */
  errorMessage?: React.ReactNode;
  /**
   * How every option in the group is drawn: a circle with a label beside it,
   * or a card pressable anywhere on its surface.
   *
   * It belongs to the group and not to each `Radio`, because a group of two
   * cards and one bare circle is not a thing anyone wants.
   */
  variant?: RadioGroupVariant;
  /** Hide the group label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  className?: string;
}

/**
 * A set of mutually exclusive options.
 *
 * The whole group is one tab stop and the arrow keys move within it, which is
 * the keyboard convention the base implements and doc 09 §8 fixes across the
 * library: arrows move *inside* a control that has several options. That does
 * not change with `variant` — a card is a different appearance, never a
 * different interaction.
 *
 * `orientation="horizontal"` lays the options out in a row and also tells
 * assistive technology which arrow keys apply. It wraps rather than
 * overflowing, so a narrow container survives without a query (doc 04 §3).
 *
 * **The library presents the error; it does not decide there is one.**
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(
    {
      label,
      children,
      description,
      errorMessage,
      variant = 'plain',
      isLabelHidden = false,
      className,
      ...ariaProps
    },
    ref
  ) {
    const orientation: Orientation =
      ariaProps.orientation === 'horizontal' ? 'horizontal' : 'vertical';

    return (
      <AriaRadioGroup
        ref={ref}
        className={cx(
          'bb:flex bb:flex-col bb:gap-(--bb-field-gap-inner)',
          'bb:font-sans bb:text-md',
          className
        )}
        {...ariaProps}
      >
        <Label
          className={cx(
            isLabelHidden
              ? 'bb:sr-only'
              : 'bb:text-md bb:font-strong bb:text-text',
            'bb:w-fit'
          )}
        >
          {label}
          {ariaProps.isRequired ? (
            /*
             * Decoration only — the announcement comes from the base's
             * aria-required on the group, so reading the asterisk aloud would
             * say it twice.
             */
            <span aria-hidden="true" className="bb:text-danger-text bb:ms-1">
              *
            </span>
          ) : null}
        </Label>

        <VariantContext.Provider value={variant}>
          <div className={VARIANT[variant].track[orientation]}>{children}</div>
        </VariantContext.Provider>

        {description ? (
          <Text slot="description" className="bb:text-xs bb:text-text-muted">
            {description}
          </Text>
        ) : null}

        <FieldError className="bb:text-xs bb:text-danger-text">
          {errorMessage}
        </FieldError>
      </AriaRadioGroup>
    );
  }
);
