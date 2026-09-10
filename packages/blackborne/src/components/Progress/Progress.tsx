import { forwardRef } from 'react';
import {
  Label as AriaLabel,
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps
} from 'react-aria-components';
import { cx } from '../../internal/cx';

export type ProgressSize = 'sm' | 'md';

/*
 * TWO THICKNESSES AND NOT THREE. A bar is either a line under something that
 * is happening or the thing itself; there is no third role, and a scale with
 * an unused middle is doc 03's three near-identical greys arriving as sizes.
 */
const TRACK_SIZE: Record<ProgressSize, string> = {
  sm: 'bb:h-1',
  md: 'bb:h-2'
} satisfies Record<ProgressSize, string>;

const ROOT = cx(
  'bb-progress',
  'bb:box-border bb:flex bb:w-full bb:flex-col bb:gap-(--bb-space-1)',
  'bb:font-sans bb:text-md bb:leading-normal bb:text-text'
);

/*
 * THE GAP GOES WHEN THERE IS NOTHING ABOVE THE TRACK, and it has to be done
 * here rather than by hiding the row.
 *
 * A bar with both the label and the number hidden still HOLDS the label —
 * `sr-only`, because the name is the one thing doc 06 §2 does not forgive
 * losing. So the header is never `:empty` and `empty:hidden` matches nothing;
 * an `sr-only` child takes no layout but the flex gap above the track is
 * charged all the same, and a bar meant to be a plain line would sit a few
 * pixels lower than the thing it belongs to.
 *
 * Written down because the first version used `empty:hidden` and would have
 * shipped a stray gap that no assertion looks for.
 */
const NO_HEADER = cx('bb:gap-0');

/* The label and the number, on one line, at the two ends of it. */
const HEADER = cx(
  'bb-progress-header',
  'bb:box-border bb:flex bb:items-baseline bb:justify-between',
  'bb:gap-(--bb-space-2) bb:text-xs'
);

const LABEL = cx('bb-progress-label', 'bb:min-w-0 bb:truncate');

/*
 * The number is `tabular-nums` and muted, which is doc 03 §4.6a's hierarchy:
 * the label says what is happening and the number is the detail. Tabular so
 * that 9% and 10% do not shift the text beside them on every tick — the same
 * reason a calendar's days are tabular.
 */
const VALUE = cx(
  'bb-progress-value',
  'bb:flex-none bb:tabular-nums bb:text-text-muted'
);

/*
 * THE TRACK, and the token is `--bb-surface-sunken` rather than a border
 * colour: a track is a well the fill sits in, which is what that token is for,
 * and it is the only fill in this library that means "nothing has happened
 * here yet".
 *
 * `rounded-full` on both track and fill, so a bar at 2% is a dot rather than a
 * sliver with square corners — and `overflow-hidden` so the fill's own corners
 * are clipped to the track's at every value.
 */
const TRACK = cx(
  'bb-progress-track',
  'bb:box-border bb:w-full bb:overflow-hidden bb:rounded-full',
  'bb:bg-surface-sunken'
);

/*
 * The fill, and its width is the only thing that moves.
 *
 * Transitioned with the normal duration token, which is what makes reduced
 * motion free: doc 09 §2 removes motion rather than softening it, and the
 * tokens already collapse every duration to zero under the preference. A bar
 * that jumped between values would read as a series of separate facts rather
 * than as one thing progressing.
 */
const FILL = cx(
  'bb-progress-fill',
  'bb:box-border bb:h-full bb:rounded-full bb:bg-accent',
  'bb:transition-[width] bb:duration-(--bb-duration-normal)',
  'bb:ease-standard'
);

export interface ProgressProps extends Pick<
  AriaProgressBarProps,
  'formatOptions'
> {
  /**
   * What is happening. Always required, and visible unless hidden — a bar with
   * no name is a bar nobody can act on (doc 06 §2).
   */
  label: React.ReactNode;
  /** Hide the label visually while keeping it for assistive technology. */
  isLabelHidden?: boolean;
  /** How far along, against `maxValue`. */
  value: number;
  /** What "done" is. 100 by default, so a bare `value` is a percentage. */
  maxValue?: number;
  /**
   * The text at the end of the row, instead of the percentage.
   *
   * "3 of 7 files" says more than "43%" when the unit is what somebody cares
   * about, and only the consumer knows that. The base's prop name, kept
   * (decision 0007).
   */
  valueLabel?: React.ReactNode;
  /** Hide the number, for a bar that is a line under something rather than a
   * statement of its own. */
  isValueHidden?: boolean;
  /** How thick the bar is. */
  size?: ProgressSize;
  /** Applied to the outermost element only (doc 02 §6). */
  className?: string;
}

/**
 * How much of something is done.
 *
 * ```tsx
 * <Progress label="Uploading" value={43} />
 * ```
 *
 * ## Determinate, and only determinate
 *
 * The base has an indeterminate mode and this does not, because `Spinner` is
 * the indeterminate indicator and two components for one job is doc 01 §7. A
 * bar that pulses says exactly what a spinner says, with more furniture and a
 * shape that implies a measurement nobody has.
 *
 * ## It does not decide when to appear
 *
 * Doc 09 §3: nothing under about 300ms, a discreet indicator to a second, and
 * past a second show how much is left **if possible**. This is the "if
 * possible" — and whoever owns the timing owns the call about showing it, the
 * same division `Spinner` has.
 *
 * ## The number is the point
 *
 * A bar on its own answers "is it moving". The number answers "how long", which
 * is the question somebody watching a seven-file upload is actually asking. It
 * is `tabular-nums` so the text does not shift on every tick, and `valueLabel`
 * is there for when the unit matters more than the percentage.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  function Progress(
    {
      label,
      isLabelHidden = false,
      value,
      maxValue = 100,
      valueLabel,
      isValueHidden = false,
      size = 'md',
      className,
      ...ariaProps
    },
    ref
  ) {
    return (
      <AriaProgressBar
        ref={ref}
        className={cx(
          ROOT,
          isLabelHidden && isValueHidden && NO_HEADER,
          className
        )}
        value={value}
        maxValue={maxValue}
        {...ariaProps}
        {...(valueLabel === undefined ? {} : { valueLabel })}
      >
        {({ percentage, valueText }) => (
          <>
            <div className={HEADER}>
              {/*
               * THE BASE'S `Label`, ALWAYS RENDERED, and hidden with a class
               * rather than left out.
               *
               * The first version of this used a plain span and claimed the
               * name reached the bar anyway. It does not: the base publishes a
               * label context that its own `Label` consumes to take an id, and
               * the bar carries `aria-labelledby` pointing at THAT. A span is
               * wired to nothing, so a hidden label would have left the bar
               * nameless — which is the one thing doc 06 §2 does not forgive,
               * and it is asserted by name in the tests rather than trusted.
               *
               * `sr-only` and not `VisuallyHidden`: this is the same class
               * `Field` uses for the same job, and one answer for "a label
               * that is there but not seen" is enough.
               */}
              <AriaLabel className={cx(LABEL, isLabelHidden && 'bb:sr-only')}>
                {label}
              </AriaLabel>
              {isValueHidden ? null : (
                <span className={VALUE}>{valueLabel ?? valueText}</span>
              )}
            </div>

            <div className={cx(TRACK, TRACK_SIZE[size])}>
              <div
                className={FILL}
                /*
                 * THE ONE INLINE STYLE IN THIS LIBRARY THAT IS NOT A CHOICE.
                 * A width of 43% cannot be a class: Tailwind generates the
                 * classes it can see, and a value that arrives at runtime is
                 * not one of them. Doc 03's rule is about COLOUR and spacing
                 * coming from tokens, and a percentage of a measurement is
                 * neither.
                 */
                style={{ width: `${percentage ?? 0}%` }}
              />
            </div>
          </>
        )}
      </AriaProgressBar>
    );
  }
);
