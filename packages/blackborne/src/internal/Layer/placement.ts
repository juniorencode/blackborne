/**
 * Where a floating layer sits against the thing that opened it.
 *
 * **Twelve values: four sides, three alignments each** — doc 02 §3.3, which
 * carries the reasoning. Shared by every positioned layer so that "below,
 * aligned to the start" is spelled the same way in a tooltip, a popover, a
 * menu and a select's list.
 *
 * |            | centred  | aligned to start | aligned to end |
 * | ---------- | -------- | ---------------- | -------------- |
 * | **above**  | `top`    | `top start`      | `top end`      |
 * | **below**  | `bottom` | `bottom start`   | `bottom end`   |
 * | **before** | `start`  | `start top`      | `start bottom` |
 * | **after**  | `end`    | `end top`        | `end bottom`   |
 *
 * `start` and `end` are the inline axis and follow the writing direction, so a
 * tooltip placed at the `end` is on the right in English and on the left in
 * Arabic. `top` and `bottom` are literal, for the reason doc 05 §4 gives: this
 * library supports RTL, not vertical writing modes.
 */
export type Placement =
  | 'top'
  | 'top start'
  | 'top end'
  | 'bottom'
  | 'bottom start'
  | 'bottom end'
  | 'start'
  | 'start top'
  | 'start bottom'
  | 'end'
  | 'end top'
  | 'end bottom';

/*
 * WHY THIS TYPE EXISTS WHEN THE BASE ALREADY HAS ONE.
 *
 * The base's union has TWENTY-FOUR names: these twelve, and twelve physical
 * duplicates — `bottom left`, `right top`, `left`, and the rest. The physical
 * half is not extra capability. It says the same thing as the logical half in
 * an LTR interface and the WRONG thing in an RTL one.
 *
 * So this is not a subset chosen for tidiness. It is the complete set of
 * positions, with the spellings that break in Arabic removed. And unlike a
 * class, a prop VALUE cannot be caught by lint (`eslint.rules.js` matches
 * class strings and style properties), so the type is the only guard there is.
 *
 * It is assignable to the base's without a cast, which is the point: every one
 * of the twelve is one of its twenty-four, so a component can forward the prop
 * straight through.
 */

/**
 * Every value, for a story or a test that has to walk them.
 *
 * Exported as a runtime array because a type cannot be iterated, and a
 * hand-written list in a story drifts from the union the first time one is
 * added — silently, since a `Placement[]` annotation only checks that each
 * entry IS one, never that every one is an entry.
 */
export const PLACEMENTS = [
  'top',
  'top start',
  'top end',
  'bottom',
  'bottom start',
  'bottom end',
  'start',
  'start top',
  'start bottom',
  'end',
  'end top',
  'end bottom'
] as const satisfies readonly Placement[];

/*
 * And the other half of that guard: this fails to compile if a value is added
 * to the union and not to the array above.
 */
const MISSING: Exclude<Placement, (typeof PLACEMENTS)[number]>[] = [];
void MISSING;

/**
 * How far a positioned layer sits from the thing it points at, in pixels.
 *
 * One value for the whole library and never a prop — doc 02 §3.3: the point of
 * having a system is that every tooltip sits the same distance from the thing
 * it describes, and a consumer passing `offset={13}` is a literal.
 *
 * **The base's default for a tooltip is 0**, which is not usable: measured, the
 * bubble sat directly on the trigger with the arrow underneath it and
 * invisible. Only `Popover` gets a non-zero default from the base, so this has
 * to be supplied.
 *
 * 8 because `--bb-space-3` is 8px, which leaves the 5px arrow its room and a
 * hair of daylight. And a wart worth naming rather than hiding: this is a
 * NUMBER that has to agree with a token by hand. The base positions in
 * JavaScript and wants a number, and the alternative — reading the variable
 * with `getComputedStyle` during a render — is a measurement in the render
 * path, which is worse than a duplicated 8.
 *
 * The consequence is that this one distance does not follow the density axis,
 * where `--bb-space-3` drops to 6px. Two pixels on the gap between a tooltip
 * and its trigger, against a fixed-size arrow that does not shrink either, so
 * the two stay consistent with each other. Written down because "spacing comes
 * from a token" is otherwise true everywhere in this library and this is the
 * exception.
 */
export const LAYER_OFFSET = 8;
