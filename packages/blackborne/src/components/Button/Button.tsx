import { forwardRef } from 'react';
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from 'react-aria-components';
import { Spinner, type SpinnerSize } from '../Spinner';
import { cx } from '../../internal/cx';

export type ButtonVariant =
  'primary' | 'secondary' | 'subtle' | 'danger' | 'ghost' | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

/*
 * The variant map. ONE place, typed, per component (doc 03 §4.4).
 *
 * `satisfies Record<...>` is what makes it exhaustive: adding a variant to the
 * union without adding it here is a type error, so the two cannot drift.
 *
 * Every class is a semantic token. There is no `bb:bg-indigo-600` to write,
 * because the scale was cleared and no such utility exists.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary: cx(
    'bb:bg-accent bb:text-accent-on bb:border-accent',
    'bb:data-disabled:bg-surface-disabled bb:data-disabled:border-border',
    'bb:data-hovered:bg-accent-hover',
    'bb:data-pressed:bg-accent-active'
  ),
  secondary: cx(
    'bb:bg-surface-control bb:text-surface-control-on bb:border-border',
    'bb:data-disabled:bg-surface-disabled bb:data-disabled:border-border',
    'bb:data-hovered:bg-surface-hover',
    'bb:data-pressed:bg-surface-active'
  ),
  subtle: cx(
    'bb:bg-accent-subtle bb:text-accent-subtle-on bb:border-transparent',
    'bb:data-disabled:bg-surface-disabled bb:data-disabled:border-border',
    'bb:data-hovered:bg-accent-subtle-hover',
    'bb:data-pressed:bg-accent-subtle-active'
  ),
  danger: cx(
    'bb:bg-danger bb:text-danger-on bb:border-danger',
    'bb:data-disabled:bg-surface-disabled bb:data-disabled:border-border',
    /*
     * A variant with a colour of its own rings in that colour.
     *
     * One variable does it: the halo is mixed from --bb-focus-ring at the
     * point of use, so setting the ring recolours both and they cannot drift
     * apart. The same mechanism an invalid field uses.
     *
     * Only danger needs this. Primary already rings in the accent because
     * that IS the default, and secondary, subtle and ghost carry no colour of
     * their own — so they ring in the brand, which is what a neutral control
     * should do.
     */
    'bb:[--bb-focus-ring:var(--bb-danger)]',
    'bb:data-hovered:brightness-95',
    'bb:data-pressed:brightness-90'
  ),
  ghost: cx(
    'bb:bg-transparent bb:text-text bb:border-transparent',
    'bb:data-hovered:bg-surface-hover',
    'bb:data-pressed:bg-surface-active',
    // Stays flat when disabled: dimmed text and nothing else.
    'bb:data-disabled:bg-transparent'
  ),
  /*
   * An action that has to weigh almost nothing: "forgot your password", "add
   * another", a secondary action in a table row.
   *
   * No background and no border, but the SAME horizontal padding as every
   * other variant: in an actions row it has to line up with the buttons beside
   * it, and a variant that sits flush while its neighbours are inset reads as
   * a mistake rather than as a lighter action.
   *
   * At rest it takes the ordinary text colour — deliberately NOT the accent,
   * so it does not compete with a real link, which is what accent-coloured
   * text means everywhere else.
   *
   * Worth knowing what this trades: at rest it is visually indistinguishable
   * from static text, so nothing but position says it can be pressed. Fine
   * beside other buttons or in an actions row; not fine dropped into a
   * paragraph, where a reader has no reason to try it. Keyboard and screen
   * reader users are unaffected: it is a real button element with a button
   * role, and focus is shown by the underline described below.
   */
  link: cx(
    'bb:bg-transparent bb:text-text bb:border-transparent',
    'bb:underline-offset-4',
    'bb:data-hovered:text-link bb:data-hovered:underline',
    'bb:data-pressed:text-link-active',
    /*
     * Focus draws no box on this variant. The ring is switched off through
     * the same variable danger uses to recolour it: --bb-focus-ring set to
     * transparent empties the border AND the halo in one move, so there is no
     * second rule to keep in sync and no same-specificity fight with BASE.
     *
     * The underline replaces it, which is what doc 06 requires — a focus
     * indicator may be changed, never simply removed. It is a real indicator
     * and not decoration: it is the one thing that moves when focus lands.
     *
     * Focus paints the SAME thing hover does: underline plus accent. The two
     * states are therefore indistinguishable from each other, which is a
     * deliberate trade. Focus and hover are never both worth telling apart —
     * whoever is hovering already knows where their pointer is — and one
     * "this is live" appearance is easier to recognise than two near-identical
     * ones. Pressed still reads separately, one step further along the scale —
     * which is darker in light and lighter in dark.
     */
    'bb:[--bb-focus-ring:transparent]',
    'bb:data-focused:underline bb:data-focused:text-link',
    // Dimmed text and no underline. A disabled link that still underlines on
    // hover would be inviting a press it will not answer.
    'bb:data-disabled:bg-transparent bb:data-disabled:no-underline'
  )
} satisfies Record<ButtonVariant, string>;

const SIZE: Record<ButtonSize, string> = {
  sm: 'bb:h-control-sm bb:text-xs',
  md: 'bb:h-control-md bb:text-md',
  lg: 'bb:h-control-lg bb:text-lg'
} satisfies Record<ButtonSize, string>;

/** The spinner that fits inside each button size. See the note at the call. */
const SPINNER: Record<ButtonSize, SpinnerSize> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md'
} satisfies Record<ButtonSize, SpinnerSize>;

/*
 * Shared by every variant. Notes on the parts that are not obvious:
 *
 * - `bb:px-(--bb-control-padding-x)` reads the density token, so compact
 *   density narrows the button without the component knowing density exists.
 * - Logical properties only. There is no `pl-`/`pr-` here and there cannot be:
 *   RTL support is half made of this (doc 03 §5, rule 4).
 * - The focus ring is the library's single ring, from a token. Removing or
 *   restyling it per component is the rule broken most often (doc 06 §3).
 * - The transition is bounded by a duration token that reduced motion sets to
 *   0ms, so nothing animates when the system asks for that (doc 09 §2).
 */
const BASE = cx(
  // box-border on every sizeable element, because the package ships no
  // global reset (doc 03: a library may not overwrite a consumer's styles).
  // Without it the browser default is content-box, a declared height of
  // 40px measures 42, and controls of the same nominal size stop lining up.
  'bb:box-border',
  'bb:inline-flex bb:items-center bb:justify-center',
  'bb:px-(--bb-control-padding-x)',
  'bb:rounded-md bb:border bb:border-solid',
  'bb:font-sans bb:font-strong bb:leading-tight',
  'bb:cursor-pointer bb:select-none bb:whitespace-nowrap',
  'bb:transition-[background-color,color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:outline-hidden',
  /*
   * data-focused, not data-focus-visible: the ring shows on click as well as
   * on keyboard.
   *
   * The convention is focus-visible, and its reasoning is sound in isolation —
   * somebody who just clicked knows where the focus is, so the ring tells them
   * nothing. What decided it here is consistency: every other control in the
   * library shows its ring on click, and doc 09 §8 is blunt that one component
   * behaving differently costs the credibility of the rest. A button that
   * stayed the exception would be the one thing on a form that does not
   * confirm where you are.
   */
  'bb:data-focused:border-focus-ring bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  /*
   * Only what is true of every variant. The disabled BACKGROUND and BORDER
   * belong to the variants, because two of them have neither: a disabled ghost
   * or link was growing a filled box out of nowhere, which said "this is a
   * button that is off" where the point of those variants is to look like
   * almost nothing.
   */
  'bb:data-disabled:text-text-disabled bb:data-disabled:cursor-not-allowed',
  /*
   * PENDING: a spinner in place of the content, and the button does not
   * change size.
   *
   * This used to be `opacity-70` and a cursor, with a note saying a spinner
   * would be better and the Spinner piece did not exist yet. It does, and
   * `ConfirmDialog` is the first thing to hold a button pending on a promise
   * the library itself owns — so doc 09 §3's "past a second, indicate it is
   * still going" now has a case, and 30% less opacity is not that.
   *
   * The content is HIDDEN rather than removed — `visibility: hidden` keeps its
   * box — so the button holds exactly the width it had and nothing beside it
   * moves. That matters more here than usual: a row of actions would otherwise
   * shuffle under the cursor of somebody who has just pressed one of them.
   *
   * It is hidden on a WRAPPER, and the first attempt is worth recording
   * because it defeated itself twice over. Hiding the content with
   * `text-transparent` and `*:invisible` on the button needs no wrapper, and
   * it also hits the spinner: `*:invisible` matches the spinner's own layer,
   * and the spinner draws in `currentColor`, which `text-transparent` had just
   * emptied. The screenshot showed six coloured boxes with nothing in them.
   *
   * `relative` is on every button so the spinner has something to centre in,
   * and costs nothing else.
   */
  'bb:relative',
  'bb:data-pending:cursor-progress'
);

/*
 * The content, wrapped so that one element can be hidden while the spinner
 * stays visible.
 *
 * It carries the gap rather than BASE, so there is one place that spaces an
 * icon from its label instead of two that have to agree. With every child
 * inside this, BASE's own gap would never apply anyway — a wrapper is one flex
 * item, and the spinner's layer is out of flow.
 */
const CONTENT = cx('bb:inline-flex bb:items-center bb:gap-2');

export interface ButtonProps extends Omit<
  AriaButtonProps,
  'children' | 'className' | 'style'
> {
  children?: React.ReactNode;
  /** Appearance. A closed set — never a boolean per variant (doc 02 §3). */
  variant?: ButtonVariant;
  /** Height and type size. Aligns with fields and selects of the same size. */
  size?: ButtonSize;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A button.
 *
 * Note the prop names follow the headless base, not HTML: `isDisabled` rather
 * than `disabled`, `onPress` rather than `onClick`. That is decision 0007, and
 * `onPress` is the better handler anyway — it covers mouse, touch, pen and
 * keyboard uniformly, which doc 04 §8 requires.
 *
 * A button whose only content is an icon still needs an accessible name: pass
 * `aria-label` (doc 06 §3).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'secondary', size = 'md', className, children, ...ariaProps },
    ref
  ) {
    /*
     * `...ariaProps` rather than naming each prop: with
     * exactOptionalPropertyTypes, forwarding an optional prop by name is a
     * type error, because ours is `boolean | undefined` and the base's is
     * `boolean?`. The rest object preserves optionality (doc 02 §2).
     */
    const isPending = ariaProps.isPending === true;

    return (
      <AriaButton
        ref={ref}
        className={cx(BASE, VARIANT[variant], SIZE[size], className)}
        {...ariaProps}
      >
        <span className={cx(CONTENT, isPending && 'bb:invisible')}>
          {children}
        </span>
        {!isPending ? null : (
          /*
           * Absolutely centred over the hidden content, so the button keeps
           * its width. `pointer-events-none` because the base already stops
           * every interaction while pending, and a stray target here would be
           * a second mechanism for one thing.
           */
          <span className="bb:pointer-events-none bb:absolute bb:inset-0 bb:grid bb:place-items-center">
            {/*
             * Decorative, and that is measured rather than assumed: the base
             * announces the pending state itself, assertively, when the button
             * has focus — which is the case that matters, since you have just
             * pressed it. A spinner with a name of its own would be the second
             * announcement doc 06 §3 warns about.
             *
             * Sized against the button, because the Spinner's own scale is
             * measured against the TYPE scale (doc 03 §4.6d) and a button's
             * three sizes each carry a different type size. One spinner size
             * for all three would read small on `lg` and crowd `sm`.
             */}
            <Spinner size={SPINNER[size]} isDecorative />
          </span>
        )}
      </AriaButton>
    );
  }
);
