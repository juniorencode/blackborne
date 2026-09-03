import { forwardRef } from 'react';
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from 'react-aria-components';
import { cx } from '../../internal/cx';

export type ButtonVariant =
  'primary' | 'secondary' | 'subtle' | 'danger' | 'ghost';

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
    'bb:data-hovered:bg-accent-hover',
    'bb:data-pressed:bg-accent-active'
  ),
  secondary: cx(
    'bb:bg-surface-control bb:text-surface-control-on bb:border-border',
    'bb:data-hovered:bg-surface-hover',
    'bb:data-pressed:bg-surface-active'
  ),
  subtle: cx(
    'bb:bg-accent-subtle bb:text-accent-subtle-on bb:border-transparent',
    'bb:data-hovered:bg-accent-subtle-hover',
    'bb:data-pressed:bg-accent-subtle-active'
  ),
  danger: cx(
    'bb:bg-danger bb:text-danger-on bb:border-danger',
    'bb:data-hovered:brightness-95',
    'bb:data-pressed:brightness-90'
  ),
  ghost: cx(
    'bb:bg-transparent bb:text-text bb:border-transparent',
    'bb:data-hovered:bg-surface-hover',
    'bb:data-pressed:bg-surface-active'
  )
} satisfies Record<ButtonVariant, string>;

const SIZE: Record<ButtonSize, string> = {
  sm: 'bb:h-control-sm bb:text-xs',
  md: 'bb:h-control-md bb:text-md',
  lg: 'bb:h-control-lg bb:text-lg'
} satisfies Record<ButtonSize, string>;

/*
 * Shared by every variant. Notes on the parts that are not obvious:
 *
 * - `bb:px-(--bb-control-padding-x)` reads the density token, so compact
 *   density narrows the button without the component knowing density exists.
 * - Logical properties only. There is no `pl-`/`pr-` here and there cannot be:
 *   RTL support is half made of this (doc 03 §5, rule 4).
 * - The focus ring is the library's single ring, from a token. Removing or
 *   restyling it per component is the rule broken most often (doc 06 §3).
 * - `data-focus-visible`, not `data-focused`: a ring on mouse click is noise,
 *   a ring on keyboard focus is essential.
 * - The transition is bounded by a duration token that reduced motion sets to
 *   0ms, so nothing animates when the system asks for that (doc 09 §2).
 */
const BASE = cx(
  'bb:inline-flex bb:items-center bb:justify-center bb:gap-2',
  'bb:px-(--bb-control-padding-x)',
  'bb:rounded-md bb:border bb:border-solid',
  'bb:font-sans bb:font-strong bb:leading-tight',
  'bb:cursor-pointer bb:select-none bb:whitespace-nowrap',
  'bb:transition-[background-color,color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:outline-hidden',
  'bb:data-focus-visible:shadow-[0_0_0_2px_var(--bb-focus-ring-offset),0_0_0_4px_var(--bb-focus-ring)]',
  'bb:data-disabled:bg-surface-disabled bb:data-disabled:text-text-disabled',
  'bb:data-disabled:border-border bb:data-disabled:cursor-not-allowed',
  // Pending had only a cursor change, which is invisible until you hover:
  // the state was in the API and not on the screen. Doc 09 §3 requires a
  // visible response to every interaction. A spinner would be better and
  // needs the Spinner piece, which is not built yet.
  'bb:data-pending:cursor-progress bb:data-pending:opacity-70'
);

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
    return (
      <AriaButton
        ref={ref}
        className={cx(BASE, VARIANT[variant], SIZE[size], className)}
        {...ariaProps}
      >
        {children}
      </AriaButton>
    );
  }
);
