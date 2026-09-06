import { cx } from '../cx';

/*
 * INTERNAL. The box a field's value sits in, in one place.
 *
 * It was in four: TextField, SearchField and TextArea each carried the same
 * fifteen declarations on their control, and NumberField carried them on the
 * group that wraps its input and buttons. Measured before this file existed,
 * TextField's and SearchField's lists were IDENTICAL apart from comments —
 * and the comments were the difference that mattered, because the reasoning
 * lived in one copy and the other three were the same rules with no argument
 * attached.
 *
 * Four copies of a rule is not four times the risk; it is a rule that changes
 * in three places and stays put in the fourth, and nobody notices until two
 * fields look subtly different in one state. Doc 01 §7 names it directly:
 * there are two ways to do the same thing in the library.
 *
 * Extracted at the fourth, not the second. An abstraction drawn from two cases
 * fits two cases; this one had to hold a plain input, an input with a button
 * beside it, an input inside a group, and a block that grows.
 */

/**
 * The frame: border, background, radius, and every state that moves them.
 *
 * Goes on whatever element actually draws the box — the control itself for a
 * text field, the wrapping group for a numeric one.
 */
export const CONTROL_BOX = cx(
  'bb:box-border bb:w-full bb:min-w-0',
  'bb:rounded-md bb:border bb:border-solid bb:border-border',
  'bb:bg-surface-control bb:text-surface-control-on',
  'bb:outline-hidden',
  'bb:transition-[border-color,box-shadow,background-color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  /*
   * A field moves its BORDER on hover, where the small controls move their
   * fill. The exception is deliberate and it is about size: a field is a large
   * surface the pointer crosses constantly in a dense form, and repainting its
   * interior every time would make the form shimmer. The border says "this is
   * a target" without touching the area you are about to read.
   *
   * Same reasoning already accepted for --bb-border-control: the size of a
   * thing changes what reads correctly on it.
   */
  'bb:data-hovered:border-border-strong',
  /*
   * Focus is reported differently depending on what draws the box, and both
   * are listed rather than parameterised. An input reports `data-focused` on
   * itself; a group wrapping an input and its buttons reports
   * `data-focus-within`, because the thing that took focus is inside it.
   *
   * Neither attribute appears on the wrong kind of element, so carrying both
   * costs two rules nothing ever matches and buys one list instead of two —
   * and one list is the entire point of this file.
   *
   * The ORDER of the next two lines is load-bearing: both set border-color at
   * the same specificity, so the ring colour wins by coming second. Swapping
   * them silently returns the focus border to the plain focus colour.
   */
  'bb:data-focused:border-border-focus bb:data-focus-within:border-border-focus',
  'bb:data-focused:border-focus-ring bb:data-focus-within:border-focus-ring',
  'bb:data-focused:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-invalid:border-danger',
  // One variable recolours the edge AND the halo, so they cannot drift apart.
  'bb:data-invalid:[--bb-focus-ring:var(--bb-danger)]',
  /*
   * Read-only and disabled deliberately look different. Read-only shows a
   * value you can read, select and copy; disabled says this does not apply
   * right now (doc 07 §6). They are the two states most often painted the same
   * and they are not the same thing.
   */
  /*
   * The read-only appearance lives in controlBox.css, not here.
   *
   * What was here was `data-readonly:bg-surface-sunken` on the control, and it
   * never matched anything: measured, a read-only input gets the native
   * `readonly` attribute and no data attribute at all, while the field's ROOT
   * gets `data-readonly`. The rule was written, the class was written, and
   * nothing connected them — so read-only and disabled looked identical, which
   * doc 07 §6 says in as many words they must not.
   *
   * It survived every layer of checking, which is the instructive part: the
   * unit test asserts the two BEHAVE differently and they do; the catalog has a
   * read-only row and it looked like a field with a value, which is what it
   * was; and a screenshot only says a picture changed, never that it was right
   * to begin with.
   *
   * This class is the hook that file selects on.
   */
  'bb-field-box',
  'bb:data-disabled:bg-surface-disabled bb:data-disabled:text-text-disabled',
  'bb:data-disabled:cursor-not-allowed'
);

/**
 * The value's own typography and inline padding.
 *
 * Separate from the frame because a numeric field draws the frame on its group
 * and the type on the input inside it, and they are not the same element.
 */
/*
 * NOTE ON WHAT MUST NOT MOVE TO THE FRAME: the type size.
 *
 * An `<input>` does not inherit `font-size` — browsers set a font on form
 * controls, and the package ships no reset to undo it (a library may not
 * overwrite a consumer's styles). So a size class that sits on the wrapper
 * reaches the box and not the value, and the value quietly renders at the
 * browser's 13.33px instead of the token.
 *
 * It was found by a screenshot moving by about a pixel with every measurement
 * saying the layout was unchanged: the text was the right distance from the
 * edge, in a box of the right height, in the wrong size.
 *
 * So a field's size map has two halves — the height goes on the frame, the
 * type goes on the control.
 */
export const CONTROL_TEXT = cx(
  'bb:px-(--bb-control-padding-x)',
  'bb:font-sans bb:leading-normal',
  /*
   * The placeholder takes the SECONDARY text colour, not a fourth lighter
   * grey. Doc 03 §4.7: raise the value, do not lower the placeholder — a very
   * faint placeholder drops below minimum contrast and stops being readable,
   * which is the opposite of what it is for.
   */
  'bb:placeholder:text-text-muted'
);

/**
 * For a control that sits INSIDE a box drawn by an ancestor: it contributes no
 * frame of its own and no second focus ring, because the library has one ring
 * and two nested is noise.
 */
export const CONTROL_INSIDE = cx(
  'bb:box-border bb:w-full bb:min-w-0 bb:flex-1',
  'bb:bg-transparent bb:text-inherit',
  'bb:outline-hidden bb:border-0',
  'bb:data-disabled:cursor-not-allowed'
);

/**
 * Where the value sits inside its box.
 *
 * `start | center | end`, never `left`/`right` — doc 02 §3.2. The lint rule
 * catches a physical class and cannot catch a physical prop VALUE, so the
 * vocabulary has to be right at the point it is named.
 *
 * It aligns the value inside the control and nothing else: not the label
 * against the field, and not the field inside the form.
 */
export type ControlAlign = 'start' | 'center' | 'end';

export const ALIGN: Record<ControlAlign, string> = {
  start: 'bb:text-start',
  center: 'bb:text-center',
  end: 'bb:text-end'
} satisfies Record<ControlAlign, string>;
