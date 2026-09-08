import { forwardRef, useEffect, useRef, useState } from 'react';
import {
  Button,
  Group,
  Input,
  Label,
  Tag,
  TagGroup,
  TagList,
  TextField as AriaTextField,
  type Key,
  type TextFieldProps as AriaTextFieldProps
} from 'react-aria-components';
import { CONTROL_BOX, CONTROL_INSIDE, Field } from '../../internal/Field';
import { useMessage } from '../../config';
import { CrossGlyph } from '../../internal/CrossGlyph';
import { cx } from '../../internal/cx';
import { useDevWarning } from '../../internal/useDevWarning';
import { mergeRefs } from '../../internal/mergeRefs';
import type { Normalizer } from '../../normalize';

export type TagsInputSize = 'sm' | 'md' | 'lg';

/*
 * WHAT THIS IS BUILT ON, AND WHY IT IS NOT `TokenField`.
 *
 * The plan said TokenField. The installed source says otherwise, on three
 * counts, and the first is fatal on its own:
 *
 * 1. **The value.** `TokenField`'s value is a `TokenFieldValue` — a class
 *    holding a list of `{type:'text'}` and `{type:'token'}` segments plus a
 *    `SelectedRange` caret model, an undo history and `Intl.Segmenter`
 *    boundary finding. This field's value is `string[]`, so bridging the two
 *    means marshalling segments to an array and back on every keystroke and
 *    reconciling a caret we do not own.
 * 2. **The control.** `TokenInput` renders `contentEditable: !isDisabled &&
 *    !isReadOnly`, interleaving raw text nodes with token spans padded by
 *    zero-width spaces. That is a rich-text surface for a composer or a prompt
 *    field, where free text and tokens genuinely mix. A tag field has no free
 *    text: everything in it is a value or is being typed into one box.
 * 3. **The field contract.** `AriaTokenFieldProps` has no `isInvalid`, no
 *    `isRequired` and no `validationBehavior`, and the wrapper publishes
 *    `LabelContext` and a `description` slot only — no error slot and no
 *    `FieldErrorContext`. Doc 07 §4's unit could not be assembled on it
 *    without hand-wiring the association and the announcement, which is
 *    non-goal 6 and the part that most often looks right and is not.
 *
 * So: `TagGroup` + `TagList` + `Tag` for the tags, inside a `TextField` for
 * the box you type into. What that buys, none of it ours to write:
 *
 *   - `useTagGroup` builds a `ListKeyboardDelegate` from `useLocale`, so arrow
 *     navigation among the tags follows RTL with nothing configured, and
 *     `useTag` registers `Delete` and `Backspace` on a focused tag — the hard
 *     half of the accessibility.
 *   - the list is `role="grid"` while it has tags and `role="group"` when it
 *     does not, `aria-live="polite"` with `aria-relevant="additions"` while
 *     focus is inside it, so a tag added there announces itself.
 *   - `TextField` owns the field wiring: label associated with the input,
 *     description and error referenced by it, error announced when it appears.
 *
 * What the base does NOT give is the `string[]`. Splitting, ordering,
 * normalizing and refusing duplicates are this file's, and they are pure
 * functions (`splitTags`, `acceptTags`) tested without rendering.
 */

/*
 * `Badge` is this library's removable chip and it is not used here.
 *
 * The blocking reason is mechanical: a `Tag` publishes `ButtonContext` with
 * `slots: { remove }`, and `useSlottedContext` THROWS on a `Button` carrying
 * no `slot` prop — "A slot prop is required." Badge builds its cross as a
 * plain `Button` and has no way to pass a slot, so a Badge inside a Tag is a
 * runtime error. `ClearButton` is blocked the same way, and its name is
 * `clear` where this one is `remove`.
 *
 * The reason that would stand anyway: a badge is a STATUS label and a tag is a
 * VALUE. Badge is 12px and `font-strong` because it labels something; a tag
 * takes the field's own type size at normal weight, because doc 03 §4.6a puts
 * hierarchy in colour and weight rather than in size. What the two share is
 * the chip's shape and fill, and that is what is copied below.
 *
 * Three crosses now exist in the library. The third copy is where it earns a
 * home in `src/internal`, and that directory is not this component's.
 */

/*
 * Five characters for four separators. Comma, semicolon and pipe are typed;
 * `Enter` is the fourth and is handled at the keyboard, because a key is not a
 * character in a value. The newline is that same `Enter` arriving through the
 * clipboard — a column copied out of a spreadsheet.
 */
const SEPARATOR = /[,;|\r\n]/u;
const SEPARATOR_RUN = /[,;|\r\n]+/u;

/**
 * Split a block of text into values.
 *
 * NOT public — it is exported so the tests can exercise it without rendering
 * anything, which is a box on the entry gate that otherwise gets ticked on
 * faith. `index.ts` does not re-export it.
 *
 * The order is the whole thing (doc 07 §2.1):
 *
 * 1. split on runs of separators, so `a,,b` and `a, b` both yield two values
 * 2. trim each piece's edges. This is part of SPLITTING and not
 *    normalization: `, ` is one boundary written two characters long, and
 *    whitespace beside a boundary was never part of the value
 * 3. drop the empties, so a trailing separator adds nothing
 * 4. THEN the consumer's normalizer, per value
 * 5. drop the empties again, because a normalizer can produce one —
 *    `allowOnly(/[A-Z0-9]/)` turns `...` into nothing at all
 */
export function splitTags(
  text: string,
  normalize: Normalizer | undefined
): string[] {
  return text
    .split(SEPARATOR_RUN)
    .map(piece => piece.trim())
    .filter(piece => piece !== '')
    .map(piece => (normalize === undefined ? piece : normalize(piece)))
    .filter(piece => piece !== '');
}

/**
 * Which of `incoming` join `existing`, and which are refused as duplicates.
 *
 * NOT public, for the same reason as `splitTags`.
 *
 * **Duplicates are refused, and the refusal is reported rather than silent.**
 * A field holding the same value twice is a defect — the second cannot be told
 * from the first, so removing "it" removes an ambiguous one. Dropping it in
 * silence is the other half of the mistake, so `onDuplicate` names the value
 * that did not get in and the project writes the message (doc 07 §1).
 *
 * Comparison is exact, code point for code point. Case-insensitivity is NOT
 * built in, because "the same word" is a locale question — in Turkish `i` and
 * `I` are different letters — and a component cannot know which field it is
 * in. A consumer who wants it composes `normalize(lowerCase)`, which makes the
 * stored values canonical rather than making the comparison lie about them:
 * **the normalizer IS the duplicate policy.**
 *
 * Within one pasted block the first occurrence wins, so `a, b, a` reports one
 * duplicate rather than accepting two `a`s.
 */
export function acceptTags(
  existing: readonly string[],
  incoming: readonly string[]
): { accepted: string[]; refused: string[] } {
  const seen = new Set(existing);
  const accepted: string[] = [];
  const refused: string[] = [];

  for (const piece of incoming) {
    if (seen.has(piece)) {
      refused.push(piece);
      continue;
    }
    seen.add(piece);
    accepted.push(piece);
  }

  return { accepted, refused };
}

/*
 * Heights come from the same tokens as Button and the other fields, so a tags
 * field, a text field and a button of the same size line up in a row
 * (doc 03 §9).
 *
 * `min-h` rather than `h`, which is the difference from every other field:
 * this box GROWS. With one row the minimum decides, so the box measures
 * exactly the control height and still lines up; with three rows the content
 * decides. The vertical padding is `--bb-space-1` for that reason — at every
 * size and both densities `hit + 2 + 2` stays under the control height.
 */
interface SizeClasses {
  /** The minimum height, on the frame — it is the frame that draws the box. */
  frame: string;
  /**
   * The type size, and it goes in TWO places for one reason: a tag is a `div`
   * and inherits `font-size`, while the draft `<input>` does not — browsers
   * set a font on form controls and this package ships no reset to undo it. So
   * it sits on the frame, where the tags inherit it, AND on the input, which
   * inherits nothing. Both read this one entry so they cannot drift.
   */
  text: string;
}

const SIZE: Record<TagsInputSize, SizeClasses> = {
  sm: { frame: 'bb:min-h-control-sm', text: 'bb:text-xs' },
  md: { frame: 'bb:min-h-control-md', text: 'bb:text-md' },
  lg: { frame: 'bb:min-h-control-lg', text: 'bb:text-lg' }
} satisfies Record<TagsInputSize, SizeClasses>;

/*
 * The box, and the one place this field does not use `ControlFrame`.
 *
 * `ControlFrame` lays a control out as one item in a NON-wrapping row with an
 * affix or a button at each edge. This field has neither edge and needs the
 * opposite: the tags and the draft input are siblings in one WRAPPING flow, so
 * the input follows the last tag on its line and drops to a line of its own
 * when there is no room. Getting there through `className` would mean
 * overruling `flex` and `items-stretch` with utilities of the same
 * specificity, where the generator's emission order picks the winner — doc 02
 * §6 measured exactly that. So the box is `CONTROL_BOX` on a `Group`, which is
 * what `controlBox.ts` says that constant is for.
 */
const BOX = cx(
  CONTROL_BOX,
  'bb:flex bb:flex-wrap bb:items-center',
  'bb:gap-x-(--bb-space-2) bb:gap-y-(--bb-space-1)',
  'bb:py-(--bb-space-1)',
  'bb:ps-(--bb-control-padding-x)',
  /*
   * The busy indicator's room, reserved in EVERY state rather than while busy.
   *
   * Doc 07 §2.2 rule 1 in as many words: the space stays. `TextField` adds
   * this only while busy and gets away with it, because squeezing one line of
   * text moves nothing anyone can see. Squeezing a WRAPPING box is different:
   * 36px is enough to push the last tag onto a new line, changing the height
   * of the field at the exact moment the person is waiting for it (doc 09 §3).
   */
  'bb:pe-9'
);

/*
 * The draft input. `CONTROL_TEXT` is deliberately not used: it carries the
 * control's own inline padding, and here the BOX owns that padding because the
 * tags sit inside it too — `px-0` beside it would be the same specificity race
 * as above. What is left is the typography, repeated rather than shared.
 * `controlBox.ts` could usefully split the padding out of `CONTROL_TEXT`, and
 * that file is not this component's to change.
 */
const INPUT = cx(
  CONTROL_INSIDE,
  // Fills its line, so the click target is the whole row rather than the
  // 21px the text happens to occupy.
  'bb:self-stretch',
  'bb:font-sans bb:leading-normal',
  /*
   * The SECONDARY text colour, not a fourth lighter grey. Doc 03 §4.7: raise
   * the value, do not lower the placeholder — a very faint placeholder drops
   * below minimum contrast and stops being readable, which is the opposite of
   * what it is for.
   */
  'bb:placeholder:text-text-muted'
);

/*
 * A tag.
 *
 * No hover state, and that is correct rather than missing: a tag is not a
 * control. The base disables its own hover tracking when a tag allows neither
 * selection nor an action, so `data-hovered` never appears — the target inside
 * it is the cross, and that is what answers the pointer.
 *
 * Focus reads `data-focus-visible` where Badge's cross reads `data-focused`,
 * and the divergence is deliberate. A tag is only ever reached with the arrow
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
const CHIP = cx(
  'bb:box-border bb:inline-flex bb:max-w-full bb:items-center',
  /*
   * As tall as the target it contains, always — the reasoning Badge records.
   * A row of tags wraps, so a target that overhung its chip would land on the
   * chip in the line above; the chip is sized to the target instead.
   */
  'bb:min-h-hit',
  // radius-sm is the tag step (doc 03 §4.3). Not radius-full: a pill whose
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

const REMOVE = cx(
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

/*
 * `value`, `defaultValue` and `onChange` are replaced rather than forwarded,
 * because this field's value is a `string[]` and the base's is a `string` —
 * the base holds the DRAFT, which is what is being typed and is not a value
 * yet.
 *
 * The rest of the `Omit` is the attributes that would each do something
 * quietly wrong to the draft:
 *
 *   - `type`, for SearchField's reason: a tags box is always text.
 *   - `name`, because this component submits nothing (doc 07 §9.2) and a name
 *     on the draft would post the half-typed value and none of the tags.
 *   - `maxLength`, `minLength` and `pattern`, because they restrict the DRAFT
 *     rather than a value. `maxLength={3}` truncates a pasted block to three
 *     characters and drops the rest with no error — the browser does it,
 *     silently, before this component sees the paste. Per-value restriction
 *     has a home already and it is `normalize`.
 *   - `autoComplete`, because a browser filling a tags box from a saved name
 *     is filling it with one value and no separator.
 *
 * Everything else the base takes is forwarded by the spread and needs nothing
 * here (doc 02 §2) — `isDisabled`, `isReadOnly`, `isRequired`, `isInvalid`,
 * `autoFocus`, `inputMode`, `enterKeyHint`, `onFocus`, `onBlur`, `onKeyDown`
 * and the `aria-*` set are already props of this component.
 */
export interface TagsInputProps extends Omit<
  AriaTextFieldProps,
  | 'children'
  | 'className'
  | 'style'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'type'
  | 'name'
  | 'maxLength'
  | 'minLength'
  | 'pattern'
  | 'autoComplete'
> {
  /** Always required. It may be visually hidden, but it always exists. */
  label: React.ReactNode;
  /**
   * The tags, in order. Controlled.
   *
   * Values must be unique and non-empty: a tag is identified by its own text,
   * because that is the only identity a `string[]` has. A duplicate in here
   * collapses to one focusable tag and warns in development.
   */
  value?: string[];
  /** The uncontrolled starting point. A convenience, not the primary mode (doc 02 §8). */
  defaultValue?: string[];
  /** Called with the whole new list whenever a tag is added or removed. */
  onChange?: (values: string[]) => void;
  /**
   * A value was refused because it is already in the list.
   *
   * The field refuses the duplicate — that is input restriction and it is the
   * library's. Saying so is not: the message is text somebody reads, in their
   * language, about their data, so the project writes it and presents it
   * through `isInvalid` and `errorMessage` (doc 07 §1). Without this callback
   * the refusal is silent, which is the other way to get duplicates wrong.
   *
   * Called once per refused value, in the order they arrived, including for
   * each duplicate inside a pasted block.
   */
  onDuplicate?: (value: string) => void;
  /**
   * Rewrite each value as it is committed: upper case, folded accents, an
   * allow list. Compose it from `normalize` and the transformations beside it.
   *
   * ```tsx
   * <TagsInput label="Codes" normalize={normalize(upperCase, stripSpaces)} />
   * ```
   *
   * **It runs on a value, not on the draft**, which is the one place this
   * differs from `TextField`, and the first reason is not a preference: a
   * pipeline that drops the separator — `allowOnly(/[A-Z0-9]/)` drops a comma
   * — would make the field impossible to commit anything with if it ran while
   * typing. The second is that a draft is not a value yet. The upside is that
   * doc 07 §2.1's caret problem does not arise at all: nothing is rewritten
   * under the cursor.
   *
   * It is also the duplicate policy — two values are the same when they are
   * the same after normalizing, so `normalize(lowerCase)` is how a project
   * asks for case-insensitive tags.
   */
  normalize?: Normalizer;
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
  /** Minimum height and type size. Aligns with a Button of the same size. */
  size?: TagsInputSize;
  placeholder?: string;
  className?: string;
}

/**
 * A field holding several values: typed one at a time, or pasted as a block
 * and split.
 *
 * **The keyboard, which is most of what this component is.**
 *
 * | Key                            | What happens              |
 * | ------------------------------ | ------------------------- |
 * | Comma, semicolon, pipe         | Commits what is before it |
 * | `Enter`                        | Commits the draft         |
 * | `Backspace` in an empty box    | Removes the last tag      |
 * | Arrows, on a tag               | Move between the tags     |
 * | `Delete`/`Backspace`, on a tag | Removes it                |
 *
 * `Enter` on an EMPTY box is left to whatever is around the field, exactly as
 * `SearchField` leaves `Escape`: a field that swallowed the submit key of the
 * form it sits in would be the one exception that costs the other components
 * their credibility (doc 09 §8). `Escape` is never taken, for the same reason.
 *
 * **Pasting.** A paste containing a separator is a block of values: it is
 * split, every piece is committed INCLUDING the last, and the box is left
 * empty. A paste with no separator is just text and goes in at the caret. The
 * last piece differs between the two on purpose — a pasted block is finished,
 * while a typed one is still being typed.
 *
 * **Duplicates are refused**, compared exactly after normalizing, and reported
 * through `onDuplicate` so the project can present a message naming the value.
 *
 * **What it does not do.** No reordering by drag: that rests on a drag library,
 * which is real weight for every consumer (non-goal 7). No minimum or maximum
 * count, and no per-value validation — deciding a value is unacceptable is the
 * project's (doc 07 §1). What the library owes is that an error naming the
 * offending value can be PRESENTED, and `errorMessage` already does that.
 */
export const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(
  function TagsInput(
    {
      label,
      value,
      defaultValue,
      onChange,
      onDuplicate,
      normalize,
      description,
      errorMessage,
      isLabelHidden = false,
      isLoading = false,
      isSaving = false,
      size = 'md',
      placeholder,
      className,
      ...ariaProps
    },
    ref
  ) {
    const removeLabel = useMessage('remove');
    const control = useRef<HTMLInputElement | null>(null);

    /*
     * The draft: what is in the box and is not a tag yet. Held here rather
     * than by the base, because every separator has to be seen before it
     * reaches the input's value — `useFieldValue` is the wrong tool for it and
     * deliberately not used, since it exists to rewrite a value while somebody
     * types and this field rewrites nothing until a value is committed.
     */
    const [draft, setDraft] = useState('');
    const [uncontrolled, setUncontrolled] = useState<string[]>(
      defaultValue ?? []
    );
    const values = value ?? uncontrolled;

    /*
     * A tag is identified by its own text, because that is the only identity a
     * `string[]` carries. Duplicates are refused on the way in, so the only
     * route to two is a consumer passing them — and then the collection
     * collapses them into one focusable tag, silently. Loud in development.
     */
    useDevWarning(
      new Set(values).size !== values.length,
      'TagsInput received duplicate values. A tag is identified by its own text, so duplicates collapse into one and cannot be removed separately.'
    );

    const busy = isLoading || isSaving;
    /*
     * Two levels, because disabled, read-only and busy are not the same kind
     * of state.
     *
     * `isRemovable` decides whether the cross is RENDERED. Disabled and
     * read-only are lasting states that doc 07 §6 says must look different
     * from each other and from an editable field, so a chip with no cross and
     * even padding is part of that difference rather than a layout accident.
     *
     * `canRemove` decides whether it WORKS. Busy is the transient one, and doc
     * 07 §2.2 rule 1 is explicit: unreachable, not absent, and the space
     * stays. Offering to remove a tag mid-flight offers an action the field
     * cannot honour (doc 06 §4 point 7), and closing the gap behind the cross
     * would reflow the row while the person waits.
     */
    const isRemovable =
      !(ariaProps.isDisabled ?? false) && !(ariaProps.isReadOnly ?? false);
    const canRemove = isRemovable && !busy;

    /*
     * When a removal empties the list, focus goes to the box.
     *
     * The base focuses the tag LIST instead, which is right for a standalone
     * TagGroup and wrong here: an empty list is a `display: contents` element
     * with nothing to draw a ring on, so focus would land somewhere invisible.
     * Doc 06 §3 wants a predictable destination after a delete, and here that
     * is the box you were going to type in anyway.
     *
     * It runs after the base's because the base's is in a child, and child
     * effects flush first. The flag is what keeps it from stealing focus every
     * time the list happens to be empty — doc 06 §4 point 8 forbids focusing
     * anything nobody asked for.
     */
    const shouldRefocus = useRef(false);
    useEffect(() => {
      if (!shouldRefocus.current) return;
      shouldRefocus.current = false;
      if (values.length === 0) control.current?.focus();
    }, [values]);

    function replaceValues(next: string[]): void {
      if (value === undefined) setUncontrolled(next);
      onChange?.(next);
    }

    function commit(pieces: string[]): void {
      if (pieces.length === 0) return;
      const { accepted, refused } = acceptTags(values, pieces);
      if (accepted.length > 0) replaceValues([...values, ...accepted]);
      for (const duplicate of refused) onDuplicate?.(duplicate);
    }

    function handleDraftChange(typed: string): void {
      if (!SEPARATOR.test(typed)) {
        setDraft(typed);
        return;
      }

      /*
       * Everything before the last separator is finished; what comes after it
       * is still being typed and stays in the box. Its leading whitespace goes
       * with the boundary that produced it, which is the same trim `splitTags`
       * applies to every other piece — `a, b` should not leave a space sitting
       * in front of the caret.
       */
      const pieces = typed.split(SEPARATOR_RUN);
      const tail = pieces.at(-1) ?? '';
      commit(splitTags(typed.slice(0, typed.length - tail.length), normalize));
      setDraft(tail.replace(/^\s+/u, ''));
    }

    function handleRemove(keys: Set<Key>): void {
      const next = values.filter(item => !keys.has(item));
      if (next.length === values.length) return;
      if (next.length === 0) shouldRefocus.current = true;
      replaceValues(next);
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
      if (event.key === 'Enter') {
        const pieces = splitTags(draft, normalize);
        // An empty box has nothing to confirm, so the key belongs to the level
        // above — the form this field is very often inside.
        if (pieces.length === 0) return;
        event.preventDefault();
        commit(pieces);
        setDraft('');
        return;
      }

      if (
        event.key === 'Backspace' &&
        draft === '' &&
        canRemove &&
        values.length > 0
      ) {
        // The one everybody forgets. Focus is already in the box, so nothing
        // needs to be sent anywhere afterwards.
        event.preventDefault();
        replaceValues(values.slice(0, -1));
      }
    }

    function handlePaste(event: React.ClipboardEvent<HTMLInputElement>): void {
      const text = event.clipboardData.getData('text');
      // No separator in it, so it is text rather than a block: let the browser
      // put it in at the caret like any other paste.
      if (!SEPARATOR.test(text)) return;

      event.preventDefault();
      /*
       * Pasted INTO the draft rather than instead of it, so half a value
       * already typed joins the first pasted piece: `al` + `pha, beta` is two
       * tags and not three.
       */
      const element = event.currentTarget;
      const start = element.selectionStart ?? draft.length;
      const end = element.selectionEnd ?? start;
      commit(
        splitTags(draft.slice(0, start) + text + draft.slice(end), normalize)
      );
      setDraft('');
    }

    return (
      <AriaTextField
        /*
         * `aria` rather than the base's default `native`: native validation
         * pops the browser's own bubble, which the library cannot style, cannot
         * translate and cannot time. Presenting the error is our job, and the
         * project owns when it happens.
         */
        validationBehavior="aria"
        className={cx('bb:group bb:w-full', className)}
        {...ariaProps}
        /*
         * After the spread, so nothing a consumer passes can displace the
         * draft. The field's own value is the array above, and this is the box.
         */
        value={draft}
        onChange={handleDraftChange}
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
          <Group className={cx(BOX, SIZE[size].frame, SIZE[size].text)}>
            {/*
             * `contents` on both wrappers, so the tags and the draft input are
             * siblings in the box's one wrapping flow. Without it the tags
             * would be a block beside the input and the input could not follow
             * the last tag onto its line.
             *
             * `display: contents` under a `role="grid"` is the part to verify
             * in a browser rather than reason about. The precedent is the
             * base's own: a `Tag` renders its gridcell with
             * `style={{display:'contents'}}`, so the base already relies on a
             * grid whose boxes are generated by an ancestor.
             */}
            <TagGroup
              className="bb:contents"
              {...(canRemove ? { onRemove: handleRemove } : {})}
              /*
               * Disabled takes the tags out of the tab order with it. Read-only
               * deliberately does NOT: a read-only value can be read, selected
               * and copied, and a tag you cannot reach cannot be copied
               * (doc 07 §6).
               */
              {...((ariaProps.isDisabled ?? false)
                ? { disabledKeys: values }
                : {})}
            >
              {/*
               * The tag list's own name, and it is the field's label rather
               * than a string of ours. A `role="grid"` announced with no name
               * is a grid of unknown things; the field's label is exactly what
               * these are. Hidden because the visible copy already names the
               * box — two elements each needing a name, not one name said
               * twice.
               */}
              <Label className="bb:sr-only">{label}</Label>
              <TagList
                className="bb:contents"
                items={values.map(item => ({ id: item }))}
                dependencies={[isRemovable, canRemove, removeLabel]}
              >
                {item => (
                  <Tag id={item.id} textValue={item.id} className={CHIP}>
                    {/* `truncate` and `min-w-0`, so one very long tag ends in
                        an ellipsis instead of forcing the box wider than its
                        container (P4: 320px is a real width). */}
                    <span className="bb:min-w-0 bb:truncate">{item.id}</span>
                    {isRemovable ? (
                      /*
                       * Unreachable in every sense that matters while busy,
                       * and still the same width — `ControlFrame`'s mechanism,
                       * applied inside the chip. `inert` takes it out of focus
                       * order and hit testing, `aria-hidden` out of the
                       * accessibility tree, and the class out of sight;
                       * `visibility: hidden` alone would be invisible to a
                       * test environment with no stylesheet.
                       */
                      <span
                        className={cx(
                          'bb:flex bb:flex-none bb:items-stretch',
                          !canRemove && 'bb:invisible'
                        )}
                        {...(canRemove
                          ? {}
                          : { inert: true, 'aria-hidden': true })}
                      >
                        <Button
                          slot="remove"
                          className={REMOVE}
                          /*
                           * The name is OURS, replacing the base's own
                           * localised "Remove". Two dictionaries in one
                           * interface is one too many: a project that
                           * translated `remove` would see its word on every
                           * badge and not on a tag, which is the finding
                           * `ClearButton` already recorded.
                           *
                           * It composes with the tag beside it, because the
                           * base points `aria-labelledby` at this button plus
                           * the tag's row — so the name comes out "Remove
                           * alpha" rather than a row of buttons all announcing
                           * themselves as "Remove".
                           */
                          aria-label={removeLabel}
                        >
                          {/*
                           * The library's own cross, shared rather than
                           * copied — this file held one of the four copies
                           * that made the case for extracting it (doc 02
                           * §11.4).
                           */}
                          <CrossGlyph />
                        </Button>
                      </span>
                    ) : null}
                  </Tag>
                )}
              </TagList>
            </TagGroup>

            <Input
              ref={mergeRefs(ref, control)}
              className={cx(INPUT, SIZE[size].text)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              /*
               * The one declaration that has to beat `CONTROL_INSIDE`'s
               * `flex-1`, so it goes where there is no specificity race to
               * lose (doc 02 §6). It is a flex BASIS rather than a minimum:
               * the box wraps the input onto its own line when less than this
               * is left, and the input can still shrink below it when that
               * line is itself narrow. In `ch` so it follows the type size
               * instead of needing a value per size.
               */
              style={{ flexBasis: '8ch' }}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
          </Group>
        </Field>
      </AriaTextField>
    );
  }
);
