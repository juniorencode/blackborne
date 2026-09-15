import { createContext, forwardRef, useContext, useId, useRef } from 'react';
import { useMessage } from '../../config';
import { ToneGlyph } from '../../internal/ToneGlyph';
import { VisuallyHidden } from '../VisuallyHidden';
import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/mergeRefs';
import {
  CONTAINER_STEPS,
  useContainerStep
} from '../../internal/useContainerStep';

/**
 * Where a step is in a process something else is driving.
 *
 * Four, and no `disabled`: a step nobody may reach yet is `pending`, and
 * "switched off with no way to know why" is doc 06 §4 rule 7. Whether step 3
 * may be opened is validation, and validation is the project's
 * ([decision 0015](../../../../docs/decisions/0015-a-stepper-is-two-components.md)).
 */
export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

/** Where a step's title sits relative to its marker. */
export type StepTitlePlacement = 'below' | 'beside';

/*
 * IT TRAVELS BY CONTEXT, carrying one primitive, which is doc 02 §3.1.1's
 * shape for a property that belongs to the SET rather than to a member.
 *
 * A row of steps where one title is under its marker and the next is beside it
 * is not an arrangement anybody wants, so it is not one a consumer can write.
 * The same reasoning `Accordion` uses for its heading level, and the same
 * constraint: one primitive per context, never an object, so there is no
 * identity in the tree for somebody to reason about.
 */
const TitlePlacementContext = createContext<StepTitlePlacement>('below');

const ROOT = cx(
  'bb-steps',
  CONTAINER_STEPS,
  'bb:box-border bb:flex bb:w-full bb:flex-col bb:gap-(--bb-space-2)',
  'bb:font-sans bb:text-md bb:leading-normal bb:text-text'
);

const LABEL = cx('bb-steps-label', 'bb:text-xs bb:text-text-muted');

const LIST = cx(
  'bb-steps-list',
  'bb:box-border bb:m-0 bb:flex bb:w-full bb:list-none bb:p-0'
);

/*
 * TWO LAYOUTS, and the default changed on 2026-09-15.
 *
 * `below` puts the marker over its title, which is what a row of steps across
 * a page wants: the titles are centred under evenly spaced circles, the chain
 * between them is unbroken, and a long title grows downward instead of pushing
 * the next step sideways.
 *
 * `beside` is what this component shipped as, and it earns its place rather
 * than being kept for compatibility — a step list down the side of a form is a
 * column, and a marker with its title to the right is the shape that reads in
 * one.
 */
const STEP_BELOW = cx(
  'bb-step',
  'bb:box-border bb:flex bb:min-w-0 bb:flex-1 bb:flex-col bb:items-center',
  'bb:gap-(--bb-space-2)'
);

const STEP_BESIDE = cx(
  'bb-step',
  'bb:box-border bb:flex bb:min-w-0 bb:flex-1 bb:items-start',
  'bb:gap-(--bb-space-2)'
);

/*
 * The row the marker sits in, for the `below` layout: a connector on each side
 * of it, both growing, so the circle lands in the middle of the step's own
 * width and the halves either side of a gap meet.
 */
const MARKER_ROW = cx('bb:flex bb:w-full bb:items-center');

/*
 * The line leading in from the step before. It is the step's own — see the CSS
 * — and it takes the room it needs whether or not it is drawn, so the row does
 * not reflow when the first step appears.
 *
 * `mt` is half the indicator, so the line meets the circle's middle rather
 * than its top — 12px against a 24px circle, from the scale rather than
 * measured by eye.
 *
 * **A FIXED LENGTH IN THE `beside` LAYOUT, and the first baseline is what
 * settled it.** It was `flex-1`, sharing each step's leftover with the title —
 * and since the steps are equal width and the titles are not, the lines came
 * out 110px, 28px and 85px in one row. Nothing was wrong with any of them
 * individually and the row read as an accident. One length makes it a chain.
 *
 * **AND IT GROWS IN `below`**, where that objection does not apply: the
 * connector shares the row with the MARKER rather than with the title, every
 * marker is the same width, so every half-line comes out the same length by
 * construction. Fixing the length there instead leaves a short dash floating
 * in the middle of a wide gap, which is the picture that started this.
 */
const CONNECTOR = cx('bb-step-connector', 'bb:box-border bb:h-px bb:bg-border');

const CONNECTOR_BESIDE = cx(
  'bb:mt-(--bb-space-4) bb:w-(--bb-space-6) bb:flex-none'
);

const CONNECTOR_BELOW = cx('bb:flex-1');

const CONNECTOR_DONE = cx('bb:bg-accent');

/*
 * THE INDICATOR, and it is `aria-hidden`.
 *
 * Everything it says is said in words elsewhere: the title, the hidden status
 * word, and `aria-current` on the step somebody is on. What it carries is the
 * SHAPE, which is doc 06 §3's requirement that a state never depend on colour
 * alone — a completed step is a tick, an error is the danger glyph, and a
 * pending step is an outline where the active one is a fill. In greyscale all
 * four still differ.
 */
const INDICATOR = cx(
  'bb-step-indicator',
  /*
   * BIGGER AND RINGED, and it was a 24px circle with a hairline until
   * 2026-09-15. A marker is the thing an eye lands on in a row of four, and at
   * 24px with a 1px edge it read as a bullet beside its own label rather than
   * as a station on a line. 32px with a 2px ring is the weight the reference
   * has, and the number inside stops being cramped.
   */
  'bb:box-border bb:flex bb:size-8 bb:flex-none bb:items-center',
  'bb:justify-center bb:rounded-full bb:border-2 bb:border-solid',
  'bb:text-xs bb:font-strong bb:tabular-nums',
  'bb:transition-[background-color,border-color,color]',
  'bb:duration-(--bb-duration-fast) bb:ease-standard'
);

/*
 * FOUR STATES, AND THE TONE SURFACES ARE THE SHARED ONES.
 *
 * Decision 0015 asks for exactly this: "its states reuse what exists — the
 * tone glyphs and the tone surfaces that `Alert` and `Toast` already share, so
 * a step in error looks like every other error in the library rather than like
 * a new one."
 *
 * Each entry is a PAIR taken together (doc 03 §4.0), which is what
 * `TONE_SURFACE` exists to keep true. And the four differ in GREYSCALE before
 * they differ in hue, which doc 06 §3 requires: an outline with a number, a
 * solid fill with a number, a soft fill with a tick, a soft fill with the
 * danger silhouette. The glyphs are chosen to differ before their interiors do,
 * which is `ToneGlyph`'s own argument.
 *
 * EVERY ONE DRAWS AN EDGE, and the two tone states took `border-transparent`
 * until 2026-09-15. The box is `border-box`, so the circle is the same 24px
 * either way — what changed is that the tone surfaces now carry a border
 * colour of their own, and a 24px disc needs it far more than the card the
 * pairing was added for: at this size a subtle fill on a pale page is almost
 * nothing, and the ring is what makes the marker a marker.
 *
 * It also removes a fight rather than winning one. `border-transparent` beside
 * `border-success-border` is two `border-color` utilities at one specificity,
 * resolved by the order Tailwind EMITS them — the coin toss a notice's tinted
 * variant lost a day earlier, arriving here the moment the pairing gained an
 * edge.
 *
 * Pending fills too, rather than showing the page through: an outline on the
 * page is a circle that looks unfinished beside three that are filled, and the
 * sunken surface is the quietest fill the library has.
 */
const INDICATOR_BY_STATUS: Record<StepStatus, string> = {
  pending: cx('bb:border-border bb:bg-surface-sunken bb:text-text-muted'),
  active: cx('bb:border-accent bb:bg-accent bb:text-(color:--bb-accent-on)'),
  /*
   * THE RING AND THE GLYPH ARE THE TONE'S SOLID, over the subtle fill — and
   * this is where `TONE_SURFACE` stopped being the right thing to reuse.
   *
   * That map pairs a subtle background with `-subtle-on`, which is step 12:
   * correct for a paragraph on a tinted card, and on a 32px disc it drew a
   * tick so close to black that the tone was carried by the fill alone.
   * Measured on the marker's own fill: the subtle text step is 15.59:1 in
   * light — a contrast a glyph does not want — where the SOLID is 5.64:1 in
   * light and 5.30 in dark, with danger's 3.65 the worst of the four.
   *
   * A glyph here is a graphical element rather than text: it is `aria-hidden`,
   * and the state is announced in words below. So doc 03 §5 rule 2 asks 3:1 of
   * it, which all four clear, and what it buys is a tick that is visibly
   * GREEN.
   *
   * The ring takes that same value rather than a softer step of the same
   * family, and both softer candidates were built and photographed before it
   * came back here. `--bb-<tone>-border` (step 6) was added for a card, where
   * it separates a large tinted area from the page; at this size it measured
   * 1.33:1 against its own fill and read as a second, softer edge outside the
   * real one. One step above the fill (step 3) measured 1.08:1 in light and
   * 1.11 in dark, which is a change of tint at the rim rather than a ring.
   */
  completed: cx('bb:bg-success-subtle bb:border-success bb:text-success'),
  error: cx('bb:bg-danger-subtle bb:border-danger bb:text-danger')
} satisfies Record<StepStatus, string>;

const BODY = cx(
  'bb-step-body',
  'bb:box-border bb:flex bb:min-w-0 bb:flex-col bb:gap-(--bb-space-1)'
);

const BODY_BESIDE = cx('bb:pt-(--bb-space-2)');

const BODY_BELOW = cx('bb:items-center bb:text-center');

/*
 * THE TITLE FOLLOWS THE STATE, and two of the four changed on 2026-09-15.
 *
 * A step's marker already carries its state, so the colour here is a second
 * channel rather than the only one — which is what doc 06 §3 asks and is why
 * it is safe to add. What it buys is a row that can be read at a glance
 * without matching each word to the circle above it: the eye follows the
 * colour along the row and stops where it changes.
 *
 * THE COLOURS ARE THE TEXT ONES, NOT THE SOLIDS, and the active step is where
 * that was nearly got wrong. These are words on the PAGE rather than on a
 * tinted surface, so what they need is a value measured against the page.
 *
 * Measured, against the page, in both modes:
 *
 *     --bb-success       5.93 light   4.83 dark   ✓
 *     --bb-accent        5.14 light   3.08 dark   ✗
 *     --bb-danger-text   5.88 light   7.48 dark   ✓
 *
 * The accent's solid fails the 4.5:1 a run of text needs in dark — the same
 * trap the danger family carries, which the package guide records as "the
 * solid step is for a fill whose pair carries the text, and reaching for it as
 * text passes in light mode by coincidence and fails in dark". It is
 * `--bb-link` here instead, which is the brand's TEXT value and is restated
 * per mode for exactly this reason.
 */
const TITLE_BY_STATUS: Record<StepStatus, string> = {
  pending: cx('bb:text-text-muted'),
  active: cx('bb:font-strong bb:text-link'),
  completed: cx('bb:text-success'),
  error: cx('bb:font-strong bb:text-danger-text')
} satisfies Record<StepStatus, string>;

const TITLE = cx('bb-step-title', 'bb:min-w-0 bb:text-md');

const DESCRIPTION = cx(
  'bb-step-description',
  'bb:min-w-0 bb:text-xs bb:text-text-muted'
);

export interface StepProps {
  /** What the step is. */
  children: React.ReactNode;
  /** A second line, for what the step involves. */
  description?: React.ReactNode;
  /** Where it is in the process. Pending by default. */
  status?: StepStatus;
  /** Applied to the step itself. Nothing reaches an internal node (doc 02 §6). */
  className?: string;
}

/**
 * One step. Only useful inside `Steps`.
 *
 * It is an `<li>` and nothing else: no button, no link, no tab. `Steps`
 * reports; the half that navigates is `Tabs` with disabled tabs, and that is
 * decision 0015 rather than an omission.
 */
export const Step = forwardRef<HTMLLIElement, StepProps>(function Step(
  { children, description, status = 'pending', className },
  ref
) {
  const completed = useMessage('stepCompleted');
  const failed = useMessage('stepFailed');

  const placement = useContext(TitlePlacementContext);
  const below = placement === 'below';

  const marker = (
    <span
      aria-hidden="true"
      className={cx(INDICATOR, INDICATOR_BY_STATUS[status])}
    >
      {status === 'completed' ? <ToneGlyph tone="success" /> : null}
      {status === 'error' ? <ToneGlyph tone="danger" /> : null}
    </span>
  );

  return (
    <li
      ref={ref}
      className={cx(below ? STEP_BELOW : STEP_BESIDE, className)}
      data-status={status}
      data-title-placement={placement}
      /*
       * `aria-current="step"` and not `aria-selected`: nothing here is
       * selected, because nothing here can be pressed. The pattern says where
       * somebody IS.
       */
      {...(status === 'active' ? { 'aria-current': 'step' } : {})}
    >
      {below ? (
        /*
         * A HALF-LINE ON EACH SIDE, so the marker sits in the middle of the
         * step's own width and the two halves either side of a gap meet.
         *
         * The lead keeps the rule the `beside` layout established — it belongs
         * to the step that FOLLOWS it, and the first step's is hidden by a
         * `:first-child` rule in the CSS rather than counted in JavaScript. The
         * tail is the mirror of that and the last step's goes the same way.
         *
         * `visibility: hidden` rather than absent, so the box stays: without
         * it the first marker stops being centred in its own step and the
         * title below goes on centring against the whole step, which reads as
         * a label nudged to one side. The CSS has the measurement.
         */
        <span className={MARKER_ROW}>
          <span
            className={cx(
              CONNECTOR,
              CONNECTOR_BELOW,
              'bb-step-connector-lead',
              status === 'pending' ? '' : CONNECTOR_DONE
            )}
          />
          {marker}
          <span
            className={cx(
              CONNECTOR,
              CONNECTOR_BELOW,
              'bb-step-connector-tail',
              status === 'completed' ? CONNECTOR_DONE : ''
            )}
          />
        </span>
      ) : (
        <>
          <span
            className={cx(
              CONNECTOR,
              CONNECTOR_BESIDE,
              'bb-step-connector-lead',
              status === 'pending' ? '' : CONNECTOR_DONE
            )}
          />
          {marker}
        </>
      )}

      <span className={cx(BODY, below ? BODY_BELOW : BODY_BESIDE)}>
        <span className={cx(TITLE, TITLE_BY_STATUS[status])}>
          {children}
          {/*
           * THE STATUS IN WORDS, because the indicator is `aria-hidden` and a
           * shape announces nothing. `Select` set the precedent with its
           * required state: the visible channel is the mark, the announced one
           * is a word from the dictionary, and nothing is said twice.
           *
           * Pending says nothing on purpose — it is the absence of the other
           * three, and a reader hearing "pending" on every step of a
           * seven-step process would hear the word five times and the useful
           * part twice.
           */}
          {status === 'completed' ? (
            <VisuallyHidden>{` ${completed}`}</VisuallyHidden>
          ) : null}
          {status === 'error' ? (
            <VisuallyHidden>{` ${failed}`}</VisuallyHidden>
          ) : null}
        </span>
        {description === undefined ? null : (
          <span className={DESCRIPTION}>{description}</span>
        )}
      </span>
    </li>
  );
});

export interface StepsProps {
  /**
   * What the process is. Always required, and visible unless hidden — the
   * same shape `Progress` has, because the two answer one question with
   * different amounts of detail (decision 0015).
   */
  label: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /** The steps, in order. */
  children: React.ReactNode;
  /**
   * Where each step's title sits. `below` by default.
   *
   * It belongs to the SET rather than to a step — a row where one title is
   * under its marker and the next beside it is not an arrangement anybody
   * wants — so it travels by context and cannot be set per step.
   */
  titlePlacement?: StepTitlePlacement;
  /** Applied to the outermost element only (doc 02 §6). */
  className?: string;
}

/**
 * How far along a process is, step by step.
 *
 * ```tsx
 * <Steps label="Onboarding">
 *   <Step status="completed">Details</Step>
 *   <Step status="active" description="Two documents">Documents</Step>
 *   <Step>Review</Step>
 * </Steps>
 * ```
 *
 * ## It reports and navigates nothing
 *
 * Decision 0015: a stepper is two components and only one of them is here. The
 * half that navigates is `Tabs` with disabled tabs, which exists and needs
 * nothing added to it — and permission to skip a step is validation, which is
 * the project's.
 *
 * So there are no buttons in here. A list with the current step marked says
 * the true thing and promises nothing it cannot do; a row of tabs would
 * announce "tab 3 of 5" and imply the arrow keys move between them.
 *
 * ## Beside `Progress`, on purpose
 *
 * The two answer one question — how far along — with different amounts of
 * detail, so this takes `Progress`'s vocabulary rather than inventing a second
 * one: the same `label` and `isLabelHidden`, and the same rule that neither
 * decides when to appear.
 *
 * ## The narrow form is the indicators alone
 *
 * Doc 04 §6's one hook, at the library's one boundary: below the `medium` step
 * the titles go and the indicators stay. A row of seven titles at 320px is
 * either seven words of two letters or a scroll nobody asked for, and the
 * indicators carry the shape that says where somebody is.
 */
export const Steps = forwardRef<HTMLDivElement, StepsProps>(function Steps(
  {
    label,
    isLabelHidden = false,
    titlePlacement = 'below',
    children,
    className
  },
  ref
) {
  /*
   * OBSERVED ON THE ROOT, and it is `w-full`, which is the half of doc 04
   * §11.1's rule that `RangeCalendar` had to add: the observed element must
   * outlive both structures AND change size with the container. A row of steps
   * sized by its own contents would satisfy the first and never fire the
   * observer.
   */
  const root = useRef<HTMLDivElement>(null);
  const step = useContainerStep(root);
  const titlesFit = step === 'medium' || step === 'wide';
  const named = useId();

  return (
    <div
      ref={mergeRefs(ref, root)}
      className={cx(ROOT, className)}
      data-titles={titlesFit ? 'shown' : 'hidden'}
    >
      {/*
       * The label names the LIST, through an id rather than an `aria-label`:
       * the label is a node, so it can hold markup, and a node cannot be an
       * attribute. `Progress` reaches the same place through the base's own
       * label context; this has no base component to lean on, so it says it
       * itself.
       */}
      <span id={named} className={cx(LABEL, isLabelHidden && 'bb:sr-only')}>
        {label}
      </span>
      <ol className={LIST} aria-labelledby={named}>
        {/* The layout belongs to the set, so it is provided rather than
            passed down as a prop on every step. */}
        <TitlePlacementContext.Provider value={titlePlacement}>
          {children}
        </TitlePlacementContext.Provider>
      </ol>
    </div>
  );
});
