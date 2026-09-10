import { createContext, useContext } from 'react';

/*
 * INTERNAL.
 *
 * A BUTTON'S APPEARANCE, AND THE SET THAT CAN DECLARE IT FOR SEVERAL.
 *
 * ## Why the two unions live here rather than in `Button`
 *
 * They were declared in `Button.tsx`, which is where they read most naturally,
 * and the project's own lint rule is what moved them. The context was written
 * inside the Button folder first; `no-restricted-imports` refused three
 * importers at once and said what to do instead — "move the shared piece to
 * `src/internal`" (doc 01). Putting only the context here and importing the
 * types back out of `../components/Button` was refused too, and rightly: a
 * type-only import is erased at run time, but `internal` sitting below the
 * components and reaching up into them is a layering inversion whether or not
 * anything survives compilation.
 *
 * Three files need this vocabulary now — `Button` for its variant map,
 * `ButtonGroup` for the set, and `internal/seam` for the subset that can be
 * joined — so it is shared vocabulary, which is exactly what this directory is
 * for. `Button` re-exports both, so the public API is unchanged and a consumer
 * still imports `ButtonVariant` from the library root.
 */

/**
 * A button's appearance. A closed set — never a boolean per variant (doc 02
 * §3).
 *
 * The classes that draw each one are a typed map in `Button.tsx`, which is
 * where they belong: one place per component, exhaustive by `satisfies`, so
 * adding a name here without adding the classes there is a type error.
 */
export type ButtonVariant =
  'primary' | 'secondary' | 'subtle' | 'danger' | 'ghost' | 'link';

/** Height and type size. Aligns with fields and selects of the same size. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/*
 * WHAT A SET OF BUTTONS DECIDES FOR ITS MEMBERS.
 *
 * Doc 02 §3.1.1: a variant that belongs to the SET travels by context and the
 * context is never exported. `RadioGroup` did this first, and its shape is
 * copied down to the detail that matters — **two contexts each carrying a
 * primitive**, rather than one carrying an object. That is the section's last
 * constraint, and its reason survives the extra provider: there is no identity
 * to memoise, so no re-render anybody has to reason about.
 *
 * The default of each is the library's own default, so a button outside a
 * group reads a context that answers exactly what its destructuring used to.
 * There is no null and no third state.
 */
const DEFAULT_VARIANT: ButtonVariant = 'secondary';
const DEFAULT_SIZE: ButtonSize = 'md';

export const VariantContext = createContext<ButtonVariant>(DEFAULT_VARIANT);
export const SizeContext = createContext<ButtonSize>(DEFAULT_SIZE);

/**
 * The appearance a button takes when it says nothing itself.
 *
 * A button's own prop wins over this, which is what makes a group's appearance
 * a default rather than a rule: a row of secondary buttons with one primary in
 * it is a thing somebody will write, and the group has no business refusing it.
 */
export const useButtonSet = (): {
  variant: ButtonVariant;
  size: ButtonSize;
} => ({
  variant: useContext(VariantContext),
  size: useContext(SizeContext)
});

/**
 * CLOSES THE SET, for a subtree that is somewhere else on the screen.
 *
 * A React context crosses a portal, so a layer opened from inside a
 * `ButtonGroup` is inside the group as far as React is concerned — measured
 * with a probe in a popover's footer, which read `primary/sm` inside a row of
 * small primary buttons. Every layer that can hold a button therefore closes
 * the set around its content.
 *
 * `Button` is the only member type this can happen to, which is why the
 * problem arrives with `ButtonGroup` and not with `RadioGroup`: a radio inside
 * a dialog inside a radio group is not a thing, and a button inside a dialog
 * inside a row of buttons is ordinary.
 */
export const NoButtonSet = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactNode => (
  <VariantContext.Provider value={DEFAULT_VARIANT}>
    <SizeContext.Provider value={DEFAULT_SIZE}>{children}</SizeContext.Provider>
  </VariantContext.Provider>
);
