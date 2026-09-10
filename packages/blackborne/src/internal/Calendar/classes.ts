import { cx } from '../cx';

/*
 * WHAT TWO CALENDARS LOOK LIKE, in one place.
 *
 * Extracted at the SECOND caller and not before, which is this repository's
 * own rule for a shared internal — `readDeclarations` and `ValueChip` say the
 * same thing in their own files. A month grid, the furniture above it and the
 * two views it chains into are identical for a single day and for a range;
 * what differs is the value, the paint on a selection and how many months are
 * on screen.
 *
 * Copied here verbatim from `Calendar`, which is what makes the move
 * reviewable: the three baselines it already had must come out
 * byte-identical, and they do.
 */

/** Which of the three chained views is showing. */
export type View = 'days' | 'months' | 'years';

/*
 * "TAKE NO BUTTON CONTEXT", and this is the third component to need it.
 *
 * A `Calendar` publishes a SLOTTED `ButtonContext` — `previous` and `next` —
 * so every `Button` inside one must name a slot or the base throws "a slot
 * prop is required". Which is the loud version of the collision a `ComboBox`
 * has: there the context carries no slots, so a button inside one silently
 * wears the toggle's id and name instead (decision 0022).
 *
 * Both are the same rule seen from two sides: when a base component publishes
 * a context for its own child, every descendant of that type consumes it. An
 * explicit `null` slot takes none, which is read in the base's
 * `useSlottedContext`.
 *
 * Named rather than written inline five times, because five `slot={null}`
 * attributes with no comment is a thing somebody deletes.
 */
export const NO_CONTEXT = null;

/** How many years a year view holds. Three rows of four, like the months. */
export const VISIBLE_YEARS = 12;

/*
 * A MONTH IS A BLOCK, not a control, so nothing here is sized from the control
 * heights — a calendar is the one thing in this library whose size comes from
 * its contents rather than from the row it sits in.
 *
 * The width is the seven columns plus the gaps, and it is deliberately not a
 * fixed number: a cell is as wide as the minimum target, and seven of those
 * plus the padding is what a month measures. Which means compact density makes
 * a smaller calendar rather than a cramped one.
 */
export const ROOT = cx(
  'bb-calendar',
  /*
   * `w-fit` AND `inline-flex`, and the second is not enough on its own.
   *
   * A FLEX ITEM'S DISPLAY IS BLOCKIFIED. Measured: dropped into a
   * `display: flex` column the root's computed display is `flex` rather than
   * the `inline-flex` it asks for, so it takes the cross size of the line —
   * 1248px in the catalog's own stack, with cells 178px wide and 28 tall. A
   * month rendered as five flat rows of pills, and none of the three baselines
   * could see it because all three sit in a `block` parent.
   *
   * This is decision 0010's consequence 1 and the popover's 2px arriving a
   * third time: an element sized BY its contents behaves differently the
   * moment something else decides its box. `fit-content` is a declared width,
   * so it holds whatever the display value is blockified to, and it still
   * shrinks below its ideal size in a container narrower than the grid.
   */
  'bb:box-border bb:w-fit bb:inline-flex bb:flex-col bb:gap-(--bb-space-2)',
  'bb:font-sans bb:text-md bb:leading-normal bb:text-text',
  'bb:data-disabled:text-text-disabled'
);

/*
 * A FRAME THAT TRACKS THE CONTAINER, for the calendar that changes structure.
 *
 * `ROOT` above is sized by its contents, which is right for a calendar and
 * fatal for an observer: measured, a two-month range calendar is 408px wide in
 * a 640px container AND in a 320px one, because `fit-content` cannot go below
 * its own min-content. The element never resizes, so the `ResizeObserver` in
 * `useContainerStep` never fires and the step is read once and never again —
 * the structure simply does not change.
 *
 * Doc 04 §11.1 hands the next component the rule that the observed element must
 * OUTLIVE both structures. This is its other half, and it cost an afternoon:
 * the observed element must also CHANGE SIZE with the container. A box sized by
 * its contents satisfies the first and fails the second silently.
 *
 * So a structural calendar is two elements. The frame is full width, carries
 * the container-step classes and is what gets observed; the body inside it is
 * sized by its contents exactly as `ROOT` is, and `items-start` is what stops
 * it being stretched by the frame. Nothing about the picture changes — the
 * frame paints nothing at all.
 */
export const FRAME = cx(
  'bb-calendar',
  'bb:box-border bb:flex bb:w-full bb:flex-col bb:items-start',
  'bb:font-sans bb:text-md bb:leading-normal bb:text-text',
  'bb:data-disabled:text-text-disabled'
);

export const BODY = cx(
  'bb-calendar-body',
  'bb:box-border bb:flex bb:w-fit bb:flex-col bb:gap-(--bb-space-2)'
);

/* The row above the grid: back, the heading that changes the view, forward. */
export const HEADER = cx(
  'bb-calendar-header',
  'bb:box-border bb:flex bb:items-center bb:justify-between',
  'bb:gap-(--bb-space-1)'
);

/*
 * The two arrows and the heading are all buttons, and they take the same shape
 * as an edge control rather than a `Button`: a calendar's own furniture is not
 * a call to action, and three primary buttons over a grid of numbers would
 * make the numbers the quiet part.
 */
export const STEP = cx(
  'bb-calendar-step',
  'bb:box-border bb:flex bb:min-h-hit bb:min-w-hit bb:flex-none',
  'bb:items-center bb:justify-center bb:rounded-md',
  'bb:cursor-pointer bb:border-0 bb:bg-transparent bb:text-text-muted',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover bb:data-hovered:text-text',
  'bb:data-pressed:bg-surface-active',
  'bb:outline-hidden',
  'bb:data-focus-visible:bg-surface-hover bb:data-focus-visible:text-text',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

/* The heading, which is also the way into the next view up. */
export const TITLE = cx(
  'bb-calendar-title',
  'bb:box-border bb:flex bb:min-h-hit bb:flex-1 bb:items-center',
  'bb:justify-center bb:gap-(--bb-space-1) bb:rounded-md',
  'bb:cursor-pointer bb:border-0 bb:bg-transparent',
  'bb:font-strong bb:text-text',
  'bb:transition-[background-color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover',
  'bb:data-pressed:bg-surface-active',
  'bb:outline-hidden',
  'bb:data-focus-visible:bg-surface-hover',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

export const GRID = cx('bb-calendar-grid', 'bb:box-border bb:border-collapse');

/*
 * A weekday name, and it is `text-xs` and muted for the reason doc 03 §4.6a
 * gives: hierarchy comes from colour and weight, and a header that competed
 * with the numbers would turn a month into a table of two equal things.
 */
export const WEEKDAY = cx(
  'bb-calendar-weekday',
  'bb:box-border bb:pb-(--bb-space-1)',
  'bb:text-xs bb:font-normal bb:text-text-muted'
);

/*
 * A DAY.
 *
 * `min-h-hit`/`min-w-hit` rather than a chosen size: doc 06 §3 asks for the
 * minimum target at every density, and a calendar is the densest grid of
 * targets this library has. Compact trims the number, never the cell.
 *
 * The selected day is the ACCENT PAIR taken together, and the ring is inside
 * the cell rather than around it — a 2px ring on a 28px cell in a grid with
 * 2px gaps would overlap its neighbours.
 */
export const DAY = cx(
  'bb-calendar-day',
  'bb:box-border bb:flex bb:min-h-hit bb:min-w-hit',
  'bb:items-center bb:justify-center bb:rounded-md',
  'bb:cursor-pointer bb:select-none bb:outline-hidden',
  'bb:tabular-nums',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover',
  'bb:data-pressed:bg-surface-active',
  'bb:data-selected:bg-accent bb:data-selected:text-(color:--bb-accent-on)',
  'bb:data-focus-visible:border bb:data-focus-visible:border-solid',
  'bb:data-focus-visible:border-focus-ring',
  'bb:data-focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  /*
   * Unavailable is NOT disabled, and they look different because they are:
   * disabled is outside the calendar's range and unavailable is inside it and
   * taken. A struck-through number says "this day exists and you cannot have
   * it"; a dimmed one says "this day is not in the range you are choosing
   * from".
   */
  'bb:data-unavailable:line-through',
  'bb:data-unavailable:text-text-muted bb:data-unavailable:cursor-not-allowed',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled',
  /*
   * A day from the month either side. Present rather than blank, because a
   * grid with holes in it is harder to read than one with quiet edges — and
   * the base makes them unselectable already.
   */
  'bb:data-outside-month:text-text-disabled',
  'bb:data-outside-month:pointer-events-none'
);

/*
 * TODAY, and it is a ring rather than a fill — the fill belongs to the
 * selected day, and a day can be both.
 *
 * ## Only the ring that sits on the page surface is here
 *
 * The rule is that the ring is drawn in the text colour of whatever is behind
 * it, and what is behind it is decided by whoever paints the fill — so the
 * other colours belong to the components rather than to this file.
 *
 * Measured, and it is why: a single calendar's chosen day carries `data-selected`
 * and nothing else, while a range calendar puts `data-selected` on every day of
 * the band and `data-selection-start`/`-end` on the two solid ones. The same
 * attribute means the accent fill in one component and a pale band in the
 * other, so a `data-selected` ring rule written here was white-on-white the
 * moment a range existed — 1.12:1, measured on the band.
 *
 * An inset shadow rather than a border, so it takes NO LAYOUT: a border would
 * make today's cell a pixel larger than the other thirty, and a grid with one
 * column a pixel out is a grid nobody can align.
 *
 * ## THE RING IS THE TEXT COLOUR OF WHATEVER IT SITS ON
 *
 * One rule with two answers, and both of them arrived from a baseline rather
 * than from an assertion.
 *
 * On the accent it is the pair's own text colour. A grey ring inside an accent
 * fill is a grey ring nobody can see, so the claim above — that a day can be
 * both — was true of the markup and false of the picture. Same technique as
 * the split button's divider, and it follows a brand override for free.
 *
 * On the surface it is `--bb-text-muted`, and NOT `--bb-border-strong`, which
 * is what it was until the picture showed the ordinary ring for the first
 * time. Measured against the resolved surface in both modes:
 *
 *     border-strong    1.86:1 light   3.01:1 dark
 *     text-muted       5.79:1 light   9.06:1 dark
 *
 * Doc 03 §5 rule 2 asks 3:1 of a graphical element, and today's ring is the
 * only thing marking today — so 1.86 is a hard rule broken in light mode and
 * scraped through in dark, which is the mode asymmetry that document warns
 * about in as many words. A border token is for a boundary you are not meant
 * to read; this ring carries the information.
 */
export const TODAY = cx(
  'bb-calendar-today',
  'bb:shadow-[inset_0_0_0_1px_var(--bb-text-muted)]',
  'bb:font-strong'
);

/* A month or a year in the two views above the days. */
export const PERIOD = cx(
  'bb-calendar-period',
  'bb:box-border bb:flex bb:min-h-hit bb:items-center bb:justify-center',
  'bb:rounded-md bb:px-(--bb-space-2) bb:py-(--bb-space-1)',
  'bb:cursor-pointer bb:border-0 bb:bg-transparent bb:text-text',
  'bb:transition-[background-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard',
  'bb:data-hovered:bg-surface-hover',
  'bb:data-pressed:bg-surface-active',
  'bb:outline-hidden',
  'bb:data-focus-visible:border bb:data-focus-visible:border-solid',
  'bb:data-focus-visible:border-focus-ring',
  'bb:data-focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bb-focus-ring)_var(--bb-focus-ring-halo-strength),transparent)]',
  'bb:data-disabled:cursor-not-allowed bb:data-disabled:text-text-disabled'
);

export const PERIOD_CURRENT = cx(
  'bb:bg-accent bb:text-(color:--bb-accent-on)',
  'bb:font-strong'
);

export const PERIODS = cx(
  'bb-calendar-periods',
  'bb:box-border bb:grid bb:grid-cols-4 bb:gap-(--bb-space-1)'
);

/** The chevron in an arrow, which flips with the direction on its own. */
export const ARROW_BACK = cx(
  'bb:h-mark bb:w-mark bb:rotate-90 bb:rtl:-rotate-90'
);
export const ARROW_ON = cx(
  'bb:h-mark bb:w-mark bb:-rotate-90 bb:rtl:rotate-90'
);
