import { forwardRef } from 'react';
import {
  SizeContext,
  VariantContext,
  type ButtonSize
} from '../../internal/buttonAppearance';
import { SEAM, type JoinedVariant } from '../../internal/seam';
import { cx } from '../../internal/cx';

/**
 * The appearances a joined row can be drawn in, which is not all of `Button`'s.
 *
 * The three that draw a box. `ghost` and `link` carry no border and no fill,
 * so there is nothing for the seam to be made of, and `danger` is left out for
 * the reason `SplitButton` leaves it out. `internal/seam` has both arguments
 * in full.
 *
 * A member may still be any variant it likes — the group's is a default, not a
 * rule — so a row of secondary buttons with one primary in it is written the
 * obvious way.
 */
export type ButtonGroupVariant = JoinedVariant;

/*
 * `items-stretch`, so the buttons are exactly the same height whatever any of
 * them contains: one holding a pending spinner must not make itself taller
 * than the rest of the row. `SplitButton` learned this with two halves.
 *
 * `inline-flex`, so the group is as wide as its buttons. It does NOT shrink to
 * fit a narrow container and it has no structure to change into: a joined row
 * cannot wrap, because a wrapped one shows squared corners in mid-air where
 * the joint used to be. What survives a container too narrow for its actions
 * is a toolbar that collapses into a menu — a different row of doc 04 §11, and
 * a different component.
 */
const ROOT = cx(
  'bb-button-group',
  'bb:box-border bb:inline-flex bb:items-stretch'
);

export interface ButtonGroupProps {
  /**
   * The buttons, in order. Anything else is joined too, and looks it — this
   * component styles its children by POSITION rather than by what they are.
   */
  children: React.ReactNode;
  /** The appearance every button in the row takes unless it says otherwise. */
  variant?: ButtonGroupVariant;
  /** The height and type size every button in the row takes. */
  size?: ButtonSize;
  /**
   * Applied to the outermost element only, for placement in the consumer's
   * layout. Nothing reaches an internal node (doc 02 §6).
   */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A row of buttons joined into one control.
 *
 * ```tsx
 * <ButtonGroup>
 *   <Button onPress={previous}>Previous</Button>
 *   <Button onPress={next}>Next</Button>
 * </ButtonGroup>
 * ```
 *
 * ## What it is for
 *
 * **Actions of one kind, where the adjacency is the point.** Previous beside
 * Next, the same list offered in three densities, an export offered in three
 * formats. A row of unrelated actions is a row of buttons with a gap, which is
 * layout and belongs to the consumer: joining them says they are alternatives,
 * and saying that when it is false is worse than saying nothing.
 *
 * **It is not a segmented control.** A joined row that expresses a CHOICE —
 * one of the three is on, and pressing another moves it — is a field with a
 * value, and it has to announce itself as one. That is a different component,
 * it is not built, and a row of buttons pressed into service as one would be a
 * control that looks selectable and reports nothing.
 *
 * ## The appearance travels by context
 *
 * `size` and `variant` are properties of the SET, so they reach the buttons
 * through a context rather than by cloning them — doc 02 §3.1.1, which
 * `RadioGroup` implemented first. Two things come with that choice.
 *
 * A consumer's own component that renders a `Button` takes the group's
 * appearance too, which cloning could never have managed: the element in the
 * tree would be theirs, and nothing about it says button. That is the
 * constraint decision 0018 records for the sets that DO read their children,
 * and the reason this one does not have to.
 *
 * And a context crosses a portal, so a layer opened from inside the group is
 * inside the group as far as React is concerned. Measured: a dialog opened
 * from a row of small buttons rendered its own footer small. Every layer that
 * can hold a button closes the set around its content, which is one call site
 * for four of them.
 *
 * ## No role and no name
 *
 * Two or five buttons in a row are two or five buttons, every one of them
 * already named. A `role="group"` would add something to announce and nothing
 * to do with it, and a name for the pair would be a second name over the top
 * of names that are already right — doc 06 §2, and the argument `SplitButton`
 * and `Pagination` both settled. Whether a row that LOOKS like one control and
 * announces as several reads as a mismatch is a question for a person with a
 * screen reader, and it is on doc 06 §5's list.
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup(
    { children, variant = 'secondary', size = 'md', className, style },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cx(ROOT, SEAM[variant], className)}
        /*
         * The variant is on the element as well as in the context, for the
         * browser checks and for anybody reading the DOM. Nothing in the
         * stylesheet keys on it: the seam is a variable, so there is one rule
         * instead of one per variant.
         */
        data-variant={variant}
        {...(style === undefined ? {} : { style })}
      >
        {/*
         * Two providers, each carrying a primitive, which is doc 02 §3.1.1's
         * last constraint and not an accident: one object would need memoising
         * and would put an identity in the tree for somebody to reason about.
         */}
        <VariantContext.Provider value={variant}>
          <SizeContext.Provider value={size}>{children}</SizeContext.Provider>
        </VariantContext.Provider>
      </div>
    );
  }
);
