import { forwardRef, useId, useRef } from 'react';
import { useMessage } from '../../config';
import { TONE_SURFACE, ToneGlyph } from '../../internal/ToneGlyph';
import { VisuallyHidden } from '../VisuallyHidden';
import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/mergeRefs';
import {
  CONTAINER_STEPS,
  useContainerStep
} from '../../internal/useContainerStep';
import './Steps.css';

/**
 * Where a step is in a process something else is driving.
 *
 * Four, and no `disabled`: a step nobody may reach yet is `pending`, and
 * "switched off with no way to know why" is doc 06 §4 rule 7. Whether step 3
 * may be opened is validation, and validation is the project's
 * ([decision 0015](../../../../docs/decisions/0015-a-stepper-is-two-components.md)).
 */
export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

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

const STEP = cx(
  'bb-step',
  'bb:box-border bb:flex bb:min-w-0 bb:flex-1 bb:items-start',
  'bb:gap-(--bb-space-2)'
);

/*
 * The line leading in from the step before. It is the step's own — see the CSS
 * — and it takes the room it needs whether or not it is drawn, so the row does
 * not reflow when the first step appears.
 *
 * `mt` is half the indicator, so the line meets the circle's middle rather
 * than its top — 12px against a 24px circle, from the scale rather than
 * measured by eye.
 *
 * **A FIXED LENGTH, and the first baseline is what settled it.** It was
 * `flex-1`, sharing each step's leftover with the title — and since the steps
 * are equal width and the titles are not, the lines came out 110px, 28px and
 * 85px in one row. Nothing was wrong with any of them individually and the row
 * read as an accident. One length makes it a chain, and the leftover goes to
 * the titles, which is where a wider container should spend it.
 */
const CONNECTOR = cx(
  'bb-step-connector',
  'bb:box-border bb:mt-(--bb-space-4) bb:h-px bb:w-(--bb-space-6)',
  'bb:flex-none bb:bg-border'
);

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
  'bb:box-border bb:flex bb:size-6 bb:flex-none bb:items-center',
  'bb:justify-center bb:rounded-full bb:border bb:border-solid',
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
 * `border-transparent` on the two tone states rather than no border: the box is
 * `border-box`, so every indicator is the same 24px circle whether it draws an
 * edge or not.
 */
const INDICATOR_BY_STATUS: Record<StepStatus, string> = {
  pending: cx('bb:border-border bb:bg-surface bb:text-text-muted'),
  active: cx('bb:border-accent bb:bg-accent bb:text-(color:--bb-accent-on)'),
  completed: cx('bb:border-transparent', TONE_SURFACE.success),
  error: cx('bb:border-transparent', TONE_SURFACE.danger)
} satisfies Record<StepStatus, string>;

const BODY = cx(
  'bb-step-body',
  'bb:box-border bb:flex bb:min-w-0 bb:flex-col bb:gap-(--bb-space-1)',
  'bb:pt-(--bb-space-1)'
);

const TITLE_BY_STATUS: Record<StepStatus, string> = {
  pending: cx('bb:text-text-muted'),
  active: cx('bb:font-strong bb:text-text'),
  completed: cx('bb:text-text'),
  /*
   * `--bb-danger-text` and not `--bb-danger`, which the package guide already
   * records as a trap: the solid step is for a fill whose pair carries the
   * text, and reaching for it as text passes in light mode by coincidence and
   * fails in dark.
   */
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

  return (
    <li
      ref={ref}
      className={cx(STEP, className)}
      data-status={status}
      /*
       * `aria-current="step"` and not `aria-selected`: nothing here is
       * selected, because nothing here can be pressed. The pattern says where
       * somebody IS.
       */
      {...(status === 'active' ? { 'aria-current': 'step' } : {})}
    >
      <span
        className={cx(CONNECTOR, status === 'pending' ? '' : CONNECTOR_DONE)}
      />

      <span
        aria-hidden="true"
        className={cx(INDICATOR, INDICATOR_BY_STATUS[status])}
      >
        {status === 'completed' ? <ToneGlyph tone="success" /> : null}
        {status === 'error' ? <ToneGlyph tone="danger" /> : null}
      </span>

      <span className={BODY}>
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
  { label, isLabelHidden = false, children, className },
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
        {children}
      </ol>
    </div>
  );
});
