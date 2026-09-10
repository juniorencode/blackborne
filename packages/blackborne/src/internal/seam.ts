/*
 * INTERNAL.
 *
 * THE LINE BETWEEN TWO BUTTONS THAT TOUCH, as one variable rather than as a
 * colour written twice.
 *
 * ## The problem it solves
 *
 * Two adjacent buttons both carry a border, so joining them means pulling the
 * second back by a pixel and letting one border do the work of two. That is
 * enough for `secondary`, whose border is a different colour from its fill.
 *
 * It is not enough for a variant whose border is the SAME colour as its fill.
 * A row of primary buttons pulled together is one accent-coloured blob with
 * nothing saying where one ends and the next begins — measured on
 * `SplitButton` first, which is why that component has drawn a divider of its
 * own since it shipped.
 *
 * ## Why a variable and not a class
 *
 * `SplitButton` puts the line on ONE element, its arrow. `ButtonGroup` puts it
 * on every child but the first, from a stylesheet, because the number of
 * children is not known. Those are two different declarations of one colour,
 * and a colour recipe in two places is how the cross reached four copies with
 * four geometries.
 *
 * So the recipe is published as a custom property on whichever root declares
 * the set, and both callers read `--bb-seam`. Tailwind cannot see a class name
 * built at run time, so these have to be literal strings — which is also why
 * this is a map of classes rather than a function.
 *
 * The same mechanism `Button` uses for `--bb-focus-ring`: one variable set at
 * the point of use, so a variant with a colour of its own recolours the thing
 * derived from it and the two cannot drift apart.
 */

import type { ButtonVariant } from './buttonAppearance';

/**
 * The variants that can be joined, which is not all of them.
 *
 * `Extract` rather than a union written out again, so the three names are the
 * SAME three: renaming a variant breaks this file instead of leaving a map
 * keyed on something that no longer exists.
 *
 * `ghost` and `link` carry no border and no fill, so there is nothing for a
 * seam to be drawn with: a row of them pulled together is a row of words with
 * negative margins, and the component would be doing nothing at all. `danger`
 * is left out for the reason `SplitButton` leaves it out — a set of adjacent
 * destructive actions that look identical is one misclick from the wrong one,
 * and doc 09 §5 asks for the opposite.
 */
export type JoinedVariant = Extract<
  ButtonVariant,
  'primary' | 'secondary' | 'subtle'
>;

/**
 * `--bb-seam`, per variant, for the root of a control made of joined buttons.
 *
 * `secondary` publishes the ordinary border colour rather than nothing, so
 * every caller reads the variable unconditionally and no call site carries a
 * special case. An undefined variable would be worse than a wrong colour here:
 * an invalid `var()` in `border-inline-start-color` computes to `currentColor`,
 * so the seam would silently become the text colour.
 *
 * A quarter strength for the two that mix: the pair's own text colour at 25%
 * is legible on the pair's own fill, and it follows a brand override for free
 * because it is derived from the token rather than chosen beside it.
 */
export const SEAM: Record<JoinedVariant, string> = {
  primary:
    'bb:[--bb-seam:color-mix(in_oklab,var(--bb-accent-on)_25%,transparent)]',
  secondary: 'bb:[--bb-seam:var(--bb-border)]',
  subtle:
    'bb:[--bb-seam:color-mix(in_oklab,var(--bb-accent-subtle-on)_25%,transparent)]'
} satisfies Record<JoinedVariant, string>;
