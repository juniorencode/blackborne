import { Button } from 'react-aria-components';
import { CrossGlyph } from '../CrossGlyph';
import { cx } from '../cx';

/*
 * INTERNAL. One value, as a chip inside a field that holds several.
 *
 * ## Why this is shared at the second caller
 *
 * `TagsInput` wrote it first and left the note this file answers: "three
 * crosses now exist in the library — the third copy is where it earns a home
 * in `src/internal`, and that directory is not this component's." A combo box
 * holding several values is that third cross, and the same chip underneath it.
 *
 * The library's rule is to extract a STYLE at the fourth copy, and this is the
 * second of the chip — so the count is not the argument. The argument is the
 * one `readDeclarations` draws: that rule exists because two similar-looking
 * class lists usually encode two different intentions, and these encode the
 * same one. A value chip in a wrapping control box, with a target at its end
 * that removes it. Everything below was reasoned once, in a file where the
 * reasoning would have stayed while the copy travelled.
 *
 * ## What the two callers do NOT share, and why
 *
 * **The element the chip is.** `TagsInput` renders a `Tag`, which is where the
 * good keyboard comes from: `useTagGroup` builds an arrow-key delegate from
 * the locale and `useTag` registers `Delete` and `Backspace` on the focused
 * chip. A combo box cannot have any of that, and the reason is measured rather
 * than guessed — **a `TagGroup` inside a `ComboBox` does not work at all.**
 *
 * The combo box publishes its own `ListStateContext` for its options, and
 * `useTag` reads that context to find its collection, so a chip inside one
 * resolves the WRONG collection. With a dynamic `items` list it exhausts the
 * heap; with static children it throws from `useGridListItem`, unable to read
 * a row that does not exist. Two collection systems, one context.
 *
 * So this file shares the appearance and the removal target, and each caller
 * brings its own element: a `Tag` where one is possible, a `span` where it is
 * not.
 *
 * ## What is deliberately NOT here
 *
 * **Badge's chip**, which looks like a third copy and is not. A badge is a
 * STATUS label and this is a VALUE: 12px and `font-strong` because it labels
 * something, against a chip that takes the field's own type size at normal
 * weight because doc 03 §4.6a puts hierarchy in colour and weight rather than
 * in size. What the two share is a rounded box with a soft fill, which is not
 * enough to share code over.
 *
 * **The box the chips sit in.** A field that holds several values wraps, and
 * how it wraps differs: `TagsInput` has no edge control and lays the chips and
 * its draft input out as siblings in one flow; `ComboBox` has a toggle at the
 * trailing edge and keeps `ControlFrame` for it, with the wrapping flow inside
 * the frame rather than being it.
 */

/**
 * A chip.
 *
 * No hover state, and that is correct rather than missing: a chip is not a
 * control. The base disables its own hover tracking when a tag allows neither
 * selection nor an action, so `data-hovered` never appears — the target inside
 * it is the cross, and that is what answers the pointer.
 *
 * Focus reads `data-focus-visible` where Badge's cross reads `data-focused`,
 * and the divergence is deliberate. A chip is only ever reached with the arrow
 * keys, so keyboard-only loses nothing; and styling the row on `data-focused`
 * would ring the chip at the same moment the cross inside it rang itself,
 * which is the two nested rings doc 06 §3 has exactly one of.
 *
 * No trailing padding: the cross is flush with the chip's end, and its own
 * 28px target centres the mark 7px from that edge — within a pixel of the
 * padding the label gets on the other side. Badge needs a negative margin to
 * reach the same place because it also renders WITHOUT a cross; here the
 * trailing edge is always the cross or the room it would take.
 */
export const CHIP = cx(
  'bb-value-chip',
  'bb:box-border bb:inline-flex bb:max-w-full bb:items-center',
  /*
   * As tall as the target it contains, always — the reasoning Badge records.
   * A row of chips wraps, so a target that overhung its chip would land on the
   * chip in the line above; the chip is sized to the target instead.
   */
  'bb:min-h-hit',
  // radius-sm is the chip step (doc 03 §4.3). Not radius-full: a pill whose
  // label wraps has ends that stop matching its corners.
  'bb:rounded-sm',
  'bb:ps-(--bb-space-3)',
  /*
   * Soft neutral, the pair taken together (doc 03 §4.0). The "on" half is read
   * from the token rather than through `bb:text-text`, which carries the same
   * value today and is the trap rather than the shortcut: the day a theme
   * moves one and not the other, the pair is broken and nothing says so.
   */
  'bb:bg-surface-sunken bb:text-(color:--bb-surface-sunken-on)',
  'bb:font-sans bb:leading-tight',
  'bb:cursor-default bb:outline-hidden',
  // The transparent border reserves the ring's edge at rest, so nothing shifts
  // when it appears.
  'bb:border bb:border-solid bb:border-transparent',
  'bb:transition-[border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-focus-visible:border-focus-ring',
  'bb:data-focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-disabled:bg-surface-disabled bb:data-disabled:text-text-disabled'
);

/** The cross that removes it. */
export const CHIP_REMOVE = cx(
  'bb-value-chip-remove',
  'bb:box-border bb:flex bb:flex-none bb:items-center bb:justify-center',
  /*
   * The target, which is the part of a removable chip that is usually wrong. A
   * cross drawn at 14px is a 14px target unless something says otherwise, and
   * doc 06 §3 wants the minimum at EVERY density, compact included — 28px
   * normal, 24px compact, with the mark going 14px to 11px underneath it.
   *
   * The inline axis reads `--min-width-hit`, which exists precisely because
   * `min-w-*` resolves from its own namespace and does not fall back to
   * `--height-*` the way `min-h-*` does.
   */
  'bb:min-h-hit bb:min-w-hit',
  'bb:rounded-e-sm',
  'bb:cursor-pointer bb:bg-transparent bb:text-inherit',
  'bb:border bb:border-solid bb:border-transparent',
  'bb:outline-hidden',
  'bb:transition-[background-color,border-color,box-shadow]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  /*
   * Hover and pressed are mixed from the text colour rather than taken from
   * surface-hover, the argument Badge's cross already had with itself: a
   * control sitting on a chip that hovers back to grey leaves its own colour
   * family and reads as a different component.
   */
  'bb:data-hovered:bg-[color-mix(in_oklab,currentColor_15%,transparent)]',
  'bb:data-pressed:bg-[color-mix(in_oklab,currentColor_28%,transparent)]',
  'bb:data-focused:border-focus-ring',
  'bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

export interface ChipRemoveProps {
  /** Its own id, so a caller can point a name at it. */
  id?: string;
  /**
   * Whether removal can be acted on right now. False leaves the cross in
   * place and takes it out of reach — doc 07 §2.2 rule 1 applied inside the
   * chip, because a cross that disappears while a field is busy takes its
   * width with it and the chips behind it re-wrap.
   */
  canRemove: boolean;
  /**
   * Whether the cross can be REACHED at all right now, which is a different
   * question from whether it can act.
   *
   * `canRemove` false hides it and keeps its room: the field is busy, and the
   * room has to stay or the chips behind it re-wrap. This one leaves it
   * VISIBLE and takes it out of the tab order, which is the state a chip is in
   * while the field's list is open — the base hides everything outside that
   * list from a reader, chips included, and a control that is tabbable but not
   * announced is worse than one that is neither. Found by axe, which is the
   * layer that catches exactly this.
   */
  isReachable?: boolean;
  /** "Remove", from the dictionary. The caller reads it; this file has none. */
  removeLabel: string;
  /**
   * Which ambient button context this cross belongs to, and it is not a
   * detail — it is the second collision this chip had to be measured out of.
   *
   * `'remove'` inside a `Tag`, where the base wires the press itself through
   * that slot and names the button by pointing `aria-labelledby` at this
   * button plus the chip's row.
   *
   * **`null` inside a `ComboBox`**, which means "take no context at all" (read
   * in the base's `useSlottedContext`: an explicit `null` slot returns
   * nothing). A combo box publishes a `ButtonContext` for its own toggle, and
   * every `Button` in its subtree consumes it — measured, three buttons on one
   * field all wearing the toggle's id, the toggle's name and the toggle's ref,
   * with the toggle's own name ruined by the last chip's. `null` is what keeps
   * a chip's cross a cross.
   */
  slot?: 'remove' | null;
  /**
   * Outside one, where the caller says what removal does and supplies the
   * same composition itself: `aria-labelledby` pointing at this button and at
   * the element holding the value's text. Element references rather than a
   * glued string, because doc 05 §2.2 rule 5 is about exactly that — word
   * order changes between languages and a sentence built from fragments comes
   * out backwards in some of them.
   */
  onPress?: () => void;
  /** The element whose text names what is being removed. */
  labelledBy?: string;
}

/**
 * The cross that removes a chip, in the two shapes the two callers need.
 */
export function ChipRemove({
  id,
  canRemove,
  isReachable = true,
  removeLabel,
  slot,
  onPress,
  labelledBy
}: ChipRemoveProps): React.ReactNode {
  const isOutOfReach = !canRemove || !isReachable;

  return (
    /*
     * Unreachable in every sense that matters while busy, and still the same
     * width — `ControlFrame`'s mechanism, applied inside the chip. `inert`
     * takes it out of focus order and hit testing, `aria-hidden` out of the
     * accessibility tree, and the class out of sight; `visibility: hidden`
     * alone would be invisible to a test environment with no stylesheet.
     */
    <span
      className={cx(
        'bb:flex bb:flex-none bb:items-stretch',
        !canRemove && 'bb:invisible'
      )}
      {...(isOutOfReach ? { inert: true, 'aria-hidden': true } : {})}
    >
      <Button
        className={CHIP_REMOVE}
        {...(id === undefined ? {} : { id })}
        {...(slot === undefined ? {} : { slot })}
        {...(onPress === undefined ? {} : { onPress })}
        /*
         * The name is OURS, replacing the base's own localised "Remove". Two
         * dictionaries in one interface is one too many: a project that
         * translated `remove` would see its word on every badge and not on a
         * chip, which is the finding `ClearButton` recorded.
         */
        aria-label={removeLabel}
        {...(labelledBy === undefined ? {} : { 'aria-labelledby': labelledBy })}
      >
        {/*
         * The library's own cross, shared rather than copied — `TagsInput` held
         * one of the four copies that made the case for extracting it
         * (doc 02 §11.4).
         */}
        <CrossGlyph />
      </Button>
    </span>
  );
}
